import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/error.middleware.js';
import { authenticate, AuthRequest, requireOrg } from '../middleware/auth.middleware.js';
import prisma from '../config/database.js';
import { AppError } from '../middleware/error.middleware.js';
import { sendTeamInviteEmail } from '../services/email.service.js';
import crypto from 'crypto';

const router = Router();

const validate = (req: any, res: any, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// GET /api/team - List team members
router.get(
    '/',
    authenticate,
    requireOrg,
    asyncHandler(async (req: AuthRequest, res: any) => {
        const members = await prisma.organizationMember.findMany({
            where: { orgId: req.user!.orgId! },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        // Get pending invites
        const invites = await prisma.teamInvite.findMany({
            where: {
                orgId: req.user!.orgId!,
                status: 'PENDING',
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({ members, invites });
    })
);

// POST /api/team/invite - Invite team member
router.post(
    '/invite',
    authenticate,
    requireOrg,
    [
        body('email').isEmail().normalizeEmail(),
        body('role').optional().isIn(['ADMIN', 'MEMBER']),
    ],
    validate,
    asyncHandler(async (req: AuthRequest, res: any) => {
        const { email, role = 'MEMBER' } = req.body;
        const orgId = req.user!.orgId!;

        // Check if already a member
        const existingMember = await prisma.organizationMember.findFirst({
            where: {
                orgId,
                user: { email },
            },
        });

        if (existingMember) {
            throw new AppError('User is already a team member', 400);
        }

        // Check for pending invite
        const existingInvite = await prisma.teamInvite.findFirst({
            where: {
                orgId,
                email,
                status: 'PENDING',
                expiresAt: { gt: new Date() },
            },
        });

        if (existingInvite) {
            throw new AppError('Invite already sent to this email', 400);
        }

        // Create invite
        const token = crypto.randomBytes(32).toString('hex');
        await prisma.teamInvite.create({
            data: {
                email,
                role,
                token,
                orgId,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
        });

        // Get inviter and org info
        const [inviter, org] = await Promise.all([
            prisma.user.findUnique({ where: { id: req.user!.id } }),
            prisma.organization.findUnique({ where: { id: orgId } }),
        ]);

        // Send invite email
        await sendTeamInviteEmail(
            email,
            inviter?.name || 'A team member',
            org?.name || 'the organization',
            token
        );

        res.json({ message: 'Invitation sent successfully' });
    })
);

// POST /api/team/accept-invite - Accept team invite
router.post(
    '/accept-invite',
    authenticate,
    [body('token').notEmpty()],
    validate,
    asyncHandler(async (req: AuthRequest, res: any) => {
        const { token } = req.body;

        const invite = await prisma.teamInvite.findUnique({
            where: { token },
        });

        if (!invite) {
            throw new AppError('Invalid invitation', 400);
        }

        if (invite.status !== 'PENDING') {
            throw new AppError('Invitation already used', 400);
        }

        if (invite.expiresAt < new Date()) {
            throw new AppError('Invitation expired', 400);
        }

        // Add user to organization
        await prisma.$transaction([
            prisma.organizationMember.create({
                data: {
                    orgId: invite.orgId,
                    userId: req.user!.id,
                    role: invite.role,
                },
            }),
            prisma.teamInvite.update({
                where: { id: invite.id },
                data: { status: 'ACCEPTED' },
            }),
        ]);

        res.json({ message: 'Invitation accepted' });
    })
);

// DELETE /api/team/:userId - Remove team member
router.delete(
    '/:userId',
    authenticate,
    requireOrg,
    [param('userId').isUUID()],
    validate,
    asyncHandler(async (req: AuthRequest, res: any) => {
        const { userId } = req.params;
        const orgId = req.user!.orgId!;

        // Check permissions (only owner/admin can remove)
        const currentMember = await prisma.organizationMember.findUnique({
            where: { orgId_userId: { orgId, userId: req.user!.id } },
        });

        if (!currentMember || !['OWNER', 'ADMIN'].includes(currentMember.role)) {
            throw new AppError('Insufficient permissions', 403);
        }

        // Cannot remove owner
        const targetMember = await prisma.organizationMember.findUnique({
            where: { orgId_userId: { orgId, userId } },
        });

        if (!targetMember) {
            throw new AppError('Member not found', 404);
        }

        if (targetMember.role === 'OWNER') {
            throw new AppError('Cannot remove organization owner', 400);
        }

        await prisma.organizationMember.delete({
            where: { orgId_userId: { orgId, userId } },
        });

        res.json({ message: 'Member removed successfully' });
    })
);

// PUT /api/team/:userId/role - Update member role
router.put(
    '/:userId/role',
    authenticate,
    requireOrg,
    [
        param('userId').isUUID(),
        body('role').isIn(['ADMIN', 'MEMBER']),
    ],
    validate,
    asyncHandler(async (req: AuthRequest, res: any) => {
        const { userId } = req.params;
        const { role } = req.body;
        const orgId = req.user!.orgId!;

        // Check permissions
        const currentMember = await prisma.organizationMember.findUnique({
            where: { orgId_userId: { orgId, userId: req.user!.id } },
        });

        if (!currentMember || currentMember.role !== 'OWNER') {
            throw new AppError('Only owner can change roles', 403);
        }

        await prisma.organizationMember.update({
            where: { orgId_userId: { orgId, userId } },
            data: { role },
        });

        res.json({ message: 'Role updated successfully' });
    })
);

// DELETE /api/team/invite/:id - Cancel invite
router.delete(
    '/invite/:id',
    authenticate,
    requireOrg,
    [param('id').isUUID()],
    validate,
    asyncHandler(async (req: AuthRequest, res: any) => {
        const invite = await prisma.teamInvite.findUnique({
            where: { id: req.params.id },
        });

        if (!invite || invite.orgId !== req.user!.orgId) {
            throw new AppError('Invite not found', 404);
        }

        await prisma.teamInvite.delete({ where: { id: req.params.id } });

        res.json({ message: 'Invite canceled' });
    })
);

export default router;
