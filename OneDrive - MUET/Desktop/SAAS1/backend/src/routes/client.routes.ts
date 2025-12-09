import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/error.middleware.js';
import { authenticate, AuthRequest, requireOrg } from '../middleware/auth.middleware.js';
import prisma from '../config/database.js';
import { AppError } from '../middleware/error.middleware.js';
import { sendClientPortalInvite } from '../services/email.service.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const router = Router();

const validate = (req: any, res: any, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// GET /api/clients
router.get(
    '/',
    authenticate,
    requireOrg,
    asyncHandler(async (req: AuthRequest, res: any) => {
        const { page = '1', limit = '20', search } = req.query;
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        const where: any = { orgId: req.user!.orgId! };
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { company: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [clients, total] = await Promise.all([
            prisma.client.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit as string),
                include: {
                    _count: { select: { audits: true } },
                },
            }),
            prisma.client.count({ where }),
        ]);

        res.json({
            clients,
            pagination: {
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                total,
                pages: Math.ceil(total / parseInt(limit as string)),
            },
        });
    })
);

// POST /api/clients
router.post(
    '/',
    authenticate,
    requireOrg,
    [
        body('name').trim().notEmpty(),
        body('email').isEmail().normalizeEmail(),
        body('company').optional().trim(),
        body('phone').optional().trim(),
    ],
    validate,
    asyncHandler(async (req: AuthRequest, res: any) => {
        const { name, email, company, phone } = req.body;
        const orgId = req.user!.orgId!;

        // Check if client exists
        const existing = await prisma.client.findUnique({
            where: { email_orgId: { email, orgId } },
        });

        if (existing) {
            throw new AppError('Client with this email already exists', 400);
        }

        const client = await prisma.client.create({
            data: { name, email, company, phone, orgId },
        });

        res.status(201).json(client);
    })
);

// GET /api/clients/:id
router.get(
    '/:id',
    authenticate,
    [param('id').isUUID()],
    validate,
    asyncHandler(async (req: AuthRequest, res: any) => {
        const client = await prisma.client.findUnique({
            where: { id: req.params.id },
            include: {
                audits: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    select: {
                        id: true,
                        url: true,
                        score: true,
                        status: true,
                        createdAt: true,
                    },
                },
            },
        });

        if (!client || client.orgId !== req.user!.orgId) {
            throw new AppError('Client not found', 404);
        }

        res.json(client);
    })
);

// PUT /api/clients/:id
router.put(
    '/:id',
    authenticate,
    [param('id').isUUID()],
    validate,
    asyncHandler(async (req: AuthRequest, res: any) => {
        const { name, email, company, phone } = req.body;

        const existing = await prisma.client.findUnique({
            where: { id: req.params.id },
        });

        if (!existing || existing.orgId !== req.user!.orgId) {
            throw new AppError('Client not found', 404);
        }

        const client = await prisma.client.update({
            where: { id: req.params.id },
            data: { name, email, company, phone },
        });

        res.json(client);
    })
);

// DELETE /api/clients/:id
router.delete(
    '/:id',
    authenticate,
    [param('id').isUUID()],
    validate,
    asyncHandler(async (req: AuthRequest, res: any) => {
        const existing = await prisma.client.findUnique({
            where: { id: req.params.id },
        });

        if (!existing || existing.orgId !== req.user!.orgId) {
            throw new AppError('Client not found', 404);
        }

        await prisma.client.delete({ where: { id: req.params.id } });

        res.json({ message: 'Client deleted successfully' });
    })
);

// POST /api/clients/:id/portal - Enable portal access
router.post(
    '/:id/portal',
    authenticate,
    [param('id').isUUID()],
    validate,
    asyncHandler(async (req: AuthRequest, res: any) => {
        const client = await prisma.client.findUnique({
            where: { id: req.params.id },
        });

        if (!client || client.orgId !== req.user!.orgId) {
            throw new AppError('Client not found', 404);
        }

        // Generate temporary password
        const tempPassword = crypto.randomBytes(8).toString('hex');
        const hashedPassword = await bcrypt.hash(tempPassword, 12);

        // Update client
        await prisma.client.update({
            where: { id: req.params.id },
            data: {
                portalEnabled: true,
                portalPassword: hashedPassword,
            },
        });

        // Get org for branding
        const org = await prisma.organization.findUnique({
            where: { id: req.user!.orgId! },
            include: { branding: true },
        });

        // Send portal invite email
        const portalUrl = org?.customDomain
            ? `https://${org.customDomain}/portal/login`
            : `${process.env.FRONTEND_URL}/portal/login?org=${org?.slug}`;

        await sendClientPortalInvite(
            client.email,
            client.name,
            org?.branding?.companyName || org?.name || 'Your Agency',
            portalUrl,
            tempPassword
        );

        res.json({ message: 'Portal access enabled and invite sent' });
    })
);

export default router;
