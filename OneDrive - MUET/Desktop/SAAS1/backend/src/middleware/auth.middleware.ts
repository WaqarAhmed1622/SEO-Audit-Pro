import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import { logger } from '../utils/logger.js';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
        orgId?: string;
    };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
            userId: string;
            email: string;
            role: string;
            orgId?: string;
        };

        // Verify user still exists
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, role: true },
        });

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            orgId: decoded.orgId,
        };

        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ error: 'Token expired' });
        }
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        logger.error('Auth middleware error:', error);
        return res.status(500).json({ error: 'Authentication error' });
    }
};

export const requireRole = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
};

export const requireAdmin = requireRole('ADMIN');

export const requireOrg = async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.orgId) {
        return res.status(400).json({ error: 'Organization context required' });
    }

    // Verify user belongs to org
    const membership = await prisma.organizationMember.findUnique({
        where: {
            orgId_userId: {
                orgId: req.user.orgId,
                userId: req.user.id,
            },
        },
    });

    if (!membership) {
        return res.status(403).json({ error: 'Not a member of this organization' });
    }

    next();
};
