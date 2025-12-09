import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/error.middleware.js';
import { authenticate, AuthRequest, requireOrg } from '../middleware/auth.middleware.js';
import prisma from '../config/database.js';
import { AppError } from '../middleware/error.middleware.js';

const router = Router();

const validate = (req: any, res: any, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// GET /api/branding
router.get(
    '/',
    authenticate,
    requireOrg,
    asyncHandler(async (req: AuthRequest, res: any) => {
        const branding = await prisma.branding.findUnique({
            where: { orgId: req.user!.orgId! },
        });
        res.json(branding || null);
    })
);

// POST /api/branding - Create or update branding
router.post(
    '/',
    authenticate,
    requireOrg,
    [
        body('primaryColor').optional().isHexColor(),
        body('secondaryColor').optional().isHexColor(),
        body('accentColor').optional().isHexColor(),
        body('companyName').optional().trim(),
        body('tagline').optional().trim(),
    ],
    validate,
    asyncHandler(async (req: AuthRequest, res: any) => {
        const orgId = req.user!.orgId!;
        const {
            logoUrl,
            faviconUrl,
            primaryColor,
            secondaryColor,
            accentColor,
            companyName,
            tagline,
            templateId,
            showSections,
            customCss,
            footerText,
        } = req.body;

        const branding = await prisma.branding.upsert({
            where: { orgId },
            update: {
                logoUrl,
                faviconUrl,
                primaryColor,
                secondaryColor,
                accentColor,
                companyName,
                tagline,
                templateId,
                showSections,
                customCss,
                footerText,
            },
            create: {
                orgId,
                logoUrl,
                faviconUrl,
                primaryColor: primaryColor || '#3B82F6',
                secondaryColor: secondaryColor || '#1E40AF',
                accentColor: accentColor || '#10B981',
                companyName,
                tagline,
                templateId: templateId || 'default',
                showSections: showSections || {},
                customCss,
                footerText,
            },
        });

        res.json(branding);
    })
);

// PUT /api/branding
router.put(
    '/',
    authenticate,
    requireOrg,
    asyncHandler(async (req: AuthRequest, res: any) => {
        const orgId = req.user!.orgId!;

        const existing = await prisma.branding.findUnique({ where: { orgId } });
        if (!existing) {
            throw new AppError('Branding not found', 404);
        }

        const branding = await prisma.branding.update({
            where: { orgId },
            data: req.body,
        });

        res.json(branding);
    })
);

// POST /api/branding/logo - Upload logo
router.post(
    '/logo',
    authenticate,
    requireOrg,
    asyncHandler(async (req: AuthRequest, res: any) => {
        // In production, handle file upload to S3
        const { logoUrl } = req.body;

        const branding = await prisma.branding.upsert({
            where: { orgId: req.user!.orgId! },
            update: { logoUrl },
            create: { orgId: req.user!.orgId!, logoUrl },
        });

        res.json({ logoUrl: branding.logoUrl });
    })
);

export default router;
