import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/database.js';
import { logger } from '../utils/logger.js';
import {
    sendWelcomeEmail,
    sendVerificationEmail,
    sendPasswordResetEmail,
} from './email.service.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

interface SignupData {
    email: string;
    password: string;
    name: string;
}

interface LoginData {
    email: string;
    password: string;
}

export const signup = async (data: SignupData) => {
    const { email, password, name } = data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new Error('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name,
        },
    });

    // Create default organization
    const org = await prisma.organization.create({
        data: {
            name: `${name}'s Organization`,
            slug: `org-${user.id.slice(0, 8)}`,
            ownerId: user.id,
            members: {
                create: {
                    userId: user.id,
                    role: 'OWNER',
                },
            },
        },
    });

    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    await prisma.emailVerification.create({
        data: {
            email,
            token: verificationToken,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
    });

    // Send verification email
    await sendVerificationEmail(email, name, verificationToken);

    // Generate JWT
    const token = generateToken(user.id, email, user.role, org.id);

    logger.info(`New user registered: ${email}`);

    return {
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            emailVerified: user.emailVerified,
        },
        organization: {
            id: org.id,
            name: org.name,
            slug: org.slug,
        },
        token,
    };
};

export const login = async (data: LoginData, ip?: string) => {
    const { email, password } = data;

    // Find user
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            orgMemberships: {
                include: { org: true },
                take: 1,
            },
        },
    });

    if (!user || !user.password) {
        // Record failed attempt
        await recordLoginAttempt(ip || '', email, false);
        throw new Error('Invalid email or password');
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
        await recordLoginAttempt(ip || '', email, false);
        throw new Error('Invalid email or password');
    }

    // Record successful login
    await recordLoginAttempt(ip || '', email, true);

    // Get default org
    const defaultOrg = user.orgMemberships[0]?.org;

    // Generate JWT
    const token = generateToken(user.id, email, user.role, defaultOrg?.id);

    logger.info(`User logged in: ${email}`);

    return {
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            emailVerified: user.emailVerified,
        },
        organization: defaultOrg ? {
            id: defaultOrg.id,
            name: defaultOrg.name,
            slug: defaultOrg.slug,
        } : null,
        token,
    };
};

export const verifyEmail = async (token: string) => {
    const verification = await prisma.emailVerification.findUnique({
        where: { token },
    });

    if (!verification) {
        throw new Error('Invalid verification token');
    }

    if (verification.expiresAt < new Date()) {
        throw new Error('Verification token expired');
    }

    // Update user
    await prisma.user.update({
        where: { email: verification.email },
        data: { emailVerified: true },
    });

    // Delete verification token
    await prisma.emailVerification.delete({ where: { id: verification.id } });

    // Send welcome email
    const user = await prisma.user.findUnique({ where: { email: verification.email } });
    if (user) {
        await sendWelcomeEmail(user.email, user.name);
    }

    logger.info(`Email verified: ${verification.email}`);

    return { message: 'Email verified successfully' };
};

export const forgotPassword = async (email: string) => {
    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
        logger.info(`Password reset requested for non-existent email: ${email}`);
        return { message: 'If an account exists, a reset email has been sent' };
    }

    // Create reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    await prisma.passwordReset.create({
        data: {
            email,
            token: resetToken,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
    });

    // Send reset email
    await sendPasswordResetEmail(email, user.name, resetToken);

    logger.info(`Password reset requested: ${email}`);

    return { message: 'If an account exists, a reset email has been sent' };
};

export const resetPassword = async (token: string, newPassword: string) => {
    const reset = await prisma.passwordReset.findUnique({
        where: { token },
    });

    if (!reset || reset.used) {
        throw new Error('Invalid reset token');
    }

    if (reset.expiresAt < new Date()) {
        throw new Error('Reset token expired');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password
    await prisma.user.update({
        where: { email: reset.email },
        data: { password: hashedPassword },
    });

    // Mark token as used
    await prisma.passwordReset.update({
        where: { id: reset.id },
        data: { used: true },
    });

    logger.info(`Password reset completed: ${reset.email}`);

    return { message: 'Password reset successfully' };
};

export const googleAuth = async (profile: {
    id: string;
    email: string;
    name: string;
    picture?: string;
}) => {
    let user = await prisma.user.findUnique({
        where: { googleId: profile.id },
        include: {
            orgMemberships: {
                include: { org: true },
                take: 1,
            },
        },
    });

    if (!user) {
        // Check if email exists
        const existingUser = await prisma.user.findUnique({
            where: { email: profile.email },
        });

        if (existingUser) {
            // Link Google account
            user = await prisma.user.update({
                where: { email: profile.email },
                data: {
                    googleId: profile.id,
                    emailVerified: true,
                    avatar: profile.picture,
                },
                include: {
                    orgMemberships: {
                        include: { org: true },
                        take: 1,
                    },
                },
            });
        } else {
            // Create new user
            user = await prisma.user.create({
                data: {
                    email: profile.email,
                    name: profile.name,
                    googleId: profile.id,
                    avatar: profile.picture,
                    emailVerified: true,
                },
                include: {
                    orgMemberships: {
                        include: { org: true },
                        take: 1,
                    },
                },
            });

            // Create default org
            const org = await prisma.organization.create({
                data: {
                    name: `${profile.name}'s Organization`,
                    slug: `org-${user.id.slice(0, 8)}`,
                    ownerId: user.id,
                    members: {
                        create: {
                            userId: user.id,
                            role: 'OWNER',
                        },
                    },
                },
            });

            // Send welcome email
            await sendWelcomeEmail(user.email, user.name);
        }
    }

    const defaultOrg = user.orgMemberships[0]?.org;
    const token = generateToken(user.id, user.email, user.role, defaultOrg?.id);

    return {
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            emailVerified: user.emailVerified,
        },
        organization: defaultOrg ? {
            id: defaultOrg.id,
            name: defaultOrg.name,
            slug: defaultOrg.slug,
        } : null,
        token,
    };
};

// Helper functions
const generateToken = (userId: string, email: string, role: string, orgId?: string) => {
    return jwt.sign(
        { userId, email, role, orgId },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

const recordLoginAttempt = async (ip: string, email: string, success: boolean) => {
    await prisma.loginAttempt.create({
        data: { ip, email, success },
    });

    // Check for too many failed attempts
    if (!success) {
        const recentAttempts = await prisma.loginAttempt.count({
            where: {
                ip,
                success: false,
                createdAt: {
                    gte: new Date(Date.now() - 15 * 60 * 1000), // Last 15 minutes
                },
            },
        });

        if (recentAttempts >= 5) {
            // Ban IP temporarily
            await prisma.bannedIP.upsert({
                where: { ip },
                update: {
                    reason: 'Too many failed login attempts',
                    expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
                },
                create: {
                    ip,
                    reason: 'Too many failed login attempts',
                    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
                },
            });
            logger.warn(`IP banned for failed logins: ${ip}`);
        }
    }
};
