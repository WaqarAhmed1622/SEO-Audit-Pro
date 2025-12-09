import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/error.middleware.js';
import { authenticate, AuthRequest, requireOrg } from '../middleware/auth.middleware.js';
import { createAuditLimiter } from '../middleware/rateLimit.middleware.js';
import { verifyRecaptcha } from '../middleware/recaptcha.middleware.js';
import * as auditService from '../services/audit.service.js';

const router = Router();

const validate = (req: any, res: any, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// POST /api/audits - Create new audit
router.post(
    '/',
    authenticate,
    requireOrg,
    createAuditLimiter(),
    verifyRecaptcha,
    [
        body('url').isURL().withMessage('Valid URL is required'),
        body('clientId').optional().isUUID(),
    ],
    validate,
    asyncHandler(async (req: AuthRequest, res: any) => {
        const { url, clientId } = req.body;
        const result = await auditService.createAudit({
            url,
            userId: req.user!.id,
            orgId: req.user!.orgId!,
            clientId,
        });
        res.status(201).json(result);
    })
);

// GET /api/audits - List audits
router.get(
    '/',
    authenticate,
    requireOrg,
    asyncHandler(async (req: AuthRequest, res: any) => {
        const { page = '1', limit = '20', status, search } = req.query;
        const result = await auditService.listAudits({
            orgId: req.user!.orgId!,
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            status: status as string,
            search: search as string,
        });
        res.json(result);
    })
);

// GET /api/audits/:id - Get audit details
router.get(
    '/:id',
    authenticate,
    [param('id').isUUID()],
    validate,
    asyncHandler(async (req: AuthRequest, res: any) => {
        const { id } = req.params;
        const result = await auditService.getAudit(id, req.user!.id);
        res.json(result);
    })
);

// DELETE /api/audits/:id - Delete audit
router.delete(
    '/:id',
    authenticate,
    [param('id').isUUID()],
    validate,
    asyncHandler(async (req: AuthRequest, res: any) => {
        const { id } = req.params;
        await auditService.deleteAudit(id, req.user!.id);
        res.json({ message: 'Audit deleted successfully' });
    })
);

// POST /api/audits/:id/regenerate - Regenerate PDF
router.post(
    '/:id/regenerate',
    authenticate,
    [param('id').isUUID()],
    validate,
    asyncHandler(async (req: AuthRequest, res: any) => {
        const { id } = req.params;
        const result = await auditService.regeneratePdf(id, req.user!.id);
        res.json(result);
    })
);

export default router;
