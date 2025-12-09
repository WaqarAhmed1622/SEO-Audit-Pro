import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/error.middleware.js';
import { authenticate, AuthRequest, requireOrg } from '../middleware/auth.middleware.js';
import { optionalRecaptcha } from '../middleware/recaptcha.middleware.js';
import prisma from '../config/database.js';
import { AppError } from '../middleware/error.middleware.js';
import { createAudit } from '../services/audit.service.js';

const router = Router();

const validate = (req: any, res: any, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// GET /api/widget - List widget configs
router.get(
    '/',
    authenticate,
    requireOrg,
    asyncHandler(async (req: AuthRequest, res: any) => {
        const widgets = await prisma.widgetConfig.findMany({
            where: { orgId: req.user!.orgId! },
            orderBy: { createdAt: 'desc' },
        });
        res.json(widgets);
    })
);

// POST /api/widget - Create widget config
router.post(
    '/',
    authenticate,
    requireOrg,
    [body('name').trim().notEmpty()],
    validate,
    asyncHandler(async (req: AuthRequest, res: any) => {
        const {
            name,
            primaryColor,
            buttonText,
            successMessage,
            requireEmail,
            requireName,
            webhookUrl,
        } = req.body;

        const widget = await prisma.widgetConfig.create({
            data: {
                name,
                primaryColor: primaryColor || '#3B82F6',
                buttonText: buttonText || 'Get Free SEO Audit',
                successMessage: successMessage || 'Your audit is being generated!',
                requireEmail: requireEmail ?? true,
                requireName: requireName ?? false,
                webhookUrl,
                orgId: req.user!.orgId!,
            },
        });

        res.status(201).json(widget);
    })
);

// GET /api/widget/:id
router.get(
    '/:id',
    authenticate,
    [param('id').isUUID()],
    validate,
    asyncHandler(async (req: AuthRequest, res: any) => {
        const widget = await prisma.widgetConfig.findUnique({
            where: { id: req.params.id },
        });

        if (!widget || widget.orgId !== req.user!.orgId) {
            throw new AppError('Widget not found', 404);
        }

        res.json(widget);
    })
);

// PUT /api/widget/:id
router.put(
    '/:id',
    authenticate,
    [param('id').isUUID()],
    validate,
    asyncHandler(async (req: AuthRequest, res: any) => {
        const existing = await prisma.widgetConfig.findUnique({
            where: { id: req.params.id },
        });

        if (!existing || existing.orgId !== req.user!.orgId) {
            throw new AppError('Widget not found', 404);
        }

        const widget = await prisma.widgetConfig.update({
            where: { id: req.params.id },
            data: req.body,
        });

        res.json(widget);
    })
);

// DELETE /api/widget/:id
router.delete(
    '/:id',
    authenticate,
    [param('id').isUUID()],
    validate,
    asyncHandler(async (req: AuthRequest, res: any) => {
        const existing = await prisma.widgetConfig.findUnique({
            where: { id: req.params.id },
        });

        if (!existing || existing.orgId !== req.user!.orgId) {
            throw new AppError('Widget not found', 404);
        }

        await prisma.widgetConfig.delete({ where: { id: req.params.id } });

        res.json({ message: 'Widget deleted' });
    })
);

// GET /api/widget/:id/embed - Get embed code
router.get(
    '/:id/embed',
    authenticate,
    [param('id').isUUID()],
    validate,
    asyncHandler(async (req: AuthRequest, res: any) => {
        const widget = await prisma.widgetConfig.findUnique({
            where: { id: req.params.id },
        });

        if (!widget || widget.orgId !== req.user!.orgId) {
            throw new AppError('Widget not found', 404);
        }

        const embedCode = `<script src="${process.env.BACKEND_URL || 'http://localhost:4000'}/widget.js" data-widget-id="${widget.id}"></script>`;

        res.json({ embedCode, widgetId: widget.id });
    })
);

// ============================================
// PUBLIC WIDGET ENDPOINTS
// ============================================

// GET /api/widget/public/:id/config - Get widget config (public)
router.get(
    '/public/:id/config',
    [param('id').isUUID()],
    validate,
    asyncHandler(async (req: any, res: any) => {
        const widget = await prisma.widgetConfig.findUnique({
            where: { id: req.params.id },
            include: {
                org: {
                    include: { branding: true },
                },
            },
        });

        if (!widget || !widget.isActive) {
            throw new AppError('Widget not found', 404);
        }

        res.json({
            id: widget.id,
            primaryColor: widget.primaryColor,
            buttonText: widget.buttonText,
            successMessage: widget.successMessage,
            requireEmail: widget.requireEmail,
            requireName: widget.requireName,
            branding: widget.org.branding ? {
                logoUrl: widget.org.branding.logoUrl,
                companyName: widget.org.branding.companyName,
            } : null,
        });
    })
);

// POST /api/widget/audit - Create audit from widget (public)
router.post(
    '/audit',
    optionalRecaptcha,
    [
        body('widgetId').isUUID(),
        body('url').isURL(),
        body('email').optional().isEmail(),
        body('name').optional().trim(),
    ],
    validate,
    asyncHandler(async (req: any, res: any) => {
        const { widgetId, url, email, name } = req.body;

        // Get widget and org
        const widget = await prisma.widgetConfig.findUnique({
            where: { id: widgetId },
            include: { org: true },
        });

        if (!widget || !widget.isActive) {
            throw new AppError('Widget not found', 404);
        }

        // Validate required fields
        if (widget.requireEmail && !email) {
            throw new AppError('Email is required', 400);
        }

        if (widget.requireName && !name) {
            throw new AppError('Name is required', 400);
        }

        // Check org limits
        if (widget.org.plan === 'FREE' && widget.org.usedAudits >= widget.org.auditLimit) {
            throw new AppError('Audit limit reached', 403);
        }

        // Get org owner as user
        const owner = await prisma.user.findUnique({
            where: { id: widget.org.ownerId },
        });

        if (!owner) {
            throw new AppError('Organization error', 500);
        }

        // Create audit
        const audit = await createAudit({
            url,
            userId: owner.id,
            orgId: widget.org.id,
            widgetId,
            leadEmail: email,
            leadName: name,
        });

        // Update widget leads
        const leads = (widget.leads as any[]) || [];
        leads.push({
            email,
            name,
            url,
            auditId: audit.id,
            createdAt: new Date().toISOString(),
        });

        await prisma.widgetConfig.update({
            where: { id: widgetId },
            data: { leads },
        });

        // Call webhook if configured
        if (widget.webhookUrl) {
            try {
                await fetch(widget.webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        event: 'lead.created',
                        data: { email, name, url, auditId: audit.id },
                    }),
                });
            } catch (error) {
                // Don't fail if webhook fails
                console.error('Webhook failed:', error);
            }
        }

        res.json({
            message: widget.successMessage,
            auditId: audit.id,
        });
    })
);

export default router;
