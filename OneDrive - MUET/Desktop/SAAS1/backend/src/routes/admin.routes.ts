import { Router } from 'express';
import { param, query, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/error.middleware.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.middleware.js';
import prisma from '../config/database.js';
import { AppError } from '../middleware/error.middleware.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

const validate = (req: any, res: any, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// GET /api/admin/dashboard - Admin dashboard stats
router.get(
    '/dashboard',
    asyncHandler(async (req: AuthRequest, res: any) => {
        const [
            totalUsers,
            totalOrgs,
            totalAudits,
            auditsToday,
            revenue,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.organization.count(),
            prisma.audit.count(),
            prisma.audit.count({
                where: {
                    createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
                },
            }),
            prisma.payment.aggregate({
                _sum: { amount: true },
                where: {
                    status: 'paid',
                    createdAt: { gte: new Date(new Date().setDate(1)) }, // This month
                },
            }),
        ]);

        // Plan distribution
        const planDistribution = await prisma.organization.groupBy({
            by: ['plan'],
            _count: true,
        });

        // Recent audits
        const recentAudits = await prisma.audit.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                url: true,
                score: true,
                status: true,
                createdAt: true,
                org: { select: { name: true } },
            },
        });

        res.json({
            stats: {
                totalUsers,
                totalOrgs,
                totalAudits,
                auditsToday,
                monthlyRevenue: (revenue._sum.amount || 0) / 100,
            },
            planDistribution,
            recentAudits,
        });
    })
);

// GET /api/admin/users - List all users
router.get(
    '/users',
    asyncHandler(async (req: AuthRequest, res: any) => {
        const { page = '1', limit = '20', search } = req.query;
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        const where: any = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: parseInt(limit as string),
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    emailVerified: true,
                    createdAt: true,
                    _count: { select: { audits: true } },
                },
            }),
            prisma.user.count({ where }),
        ]);

        res.json({
            users,
            pagination: {
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                total,
                pages: Math.ceil(total / parseInt(limit as string)),
            },
        });
    })
);

// PUT /api/admin/users/:id/role - Update user role
router.put(
    '/users/:id/role',
    [param('id').isUUID()],
    validate,
    asyncHandler(async (req: AuthRequest, res: any) => {
        const { role } = req.body;

        if (!['ADMIN', 'AGENCY', 'USER'].includes(role)) {
            throw new AppError('Invalid role', 400);
        }

        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: { role },
        });

        res.json(user);
    })
);

// GET /api/admin/analytics - Usage analytics
router.get(
    '/analytics',
    asyncHandler(async (req: AuthRequest, res: any) => {
        const { days = '30' } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days as string));

        // Audits per day
        const auditsPerDay = await prisma.$queryRaw`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM "Audit"
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date
    `;

        // Signups per day
        const signupsPerDay = await prisma.$queryRaw`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM "User"
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date
    `;

        // Top domains
        const topDomains = await prisma.audit.groupBy({
            by: ['url'],
            _count: true,
            orderBy: { _count: { url: 'desc' } },
            take: 10,
        });

        // Average score
        const avgScore = await prisma.audit.aggregate({
            _avg: { score: true },
            where: { status: 'COMPLETE' },
        });

        res.json({
            auditsPerDay,
            signupsPerDay,
            topDomains,
            averageScore: avgScore._avg.score || 0,
        });
    })
);

// GET /api/admin/logs - System logs
router.get(
    '/logs',
    asyncHandler(async (req: AuthRequest, res: any) => {
        const { page = '1', limit = '50', action, userId } = req.query;
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        const where: any = {};
        if (action) where.action = action;
        if (userId) where.userId = userId;

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                skip,
                take: parseInt(limit as string),
                orderBy: { createdAt: 'desc' },
            }),
            prisma.auditLog.count({ where }),
        ]);

        res.json({
            logs,
            pagination: {
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                total,
                pages: Math.ceil(total / parseInt(limit as string)),
            },
        });
    })
);

// GET /api/admin/billing - Billing overview
router.get(
    '/billing',
    asyncHandler(async (req: AuthRequest, res: any) => {
        const [
            activeSubscriptions,
            monthlyRevenue,
            recentPayments,
        ] = await Promise.all([
            prisma.subscription.count({ where: { status: 'active' } }),
            prisma.payment.aggregate({
                _sum: { amount: true },
                where: {
                    status: 'paid',
                    createdAt: { gte: new Date(new Date().setDate(1)) },
                },
            }),
            prisma.payment.findMany({
                take: 20,
                orderBy: { createdAt: 'desc' },
                include: {
                    // We don't have org relation directly, so just show the data
                },
            }),
        ]);

        // Revenue by plan
        const subscriptionsByPlan = await prisma.organization.groupBy({
            by: ['plan'],
            _count: true,
            where: {
                subscription: { status: 'active' },
            },
        });

        res.json({
            activeSubscriptions,
            monthlyRevenue: (monthlyRevenue._sum.amount || 0) / 100,
            recentPayments,
            subscriptionsByPlan,
        });
    })
);

// GET /api/admin/banned-ips - List banned IPs
router.get(
    '/banned-ips',
    asyncHandler(async (req: AuthRequest, res: any) => {
        const bannedIPs = await prisma.bannedIP.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(bannedIPs);
    })
);

// POST /api/admin/banned-ips - Ban an IP
router.post(
    '/banned-ips',
    asyncHandler(async (req: AuthRequest, res: any) => {
        const { ip, reason, expiresAt } = req.body;

        const bannedIP = await prisma.bannedIP.upsert({
            where: { ip },
            update: { reason, expiresAt },
            create: { ip, reason, expiresAt },
        });

        res.json(bannedIP);
    })
);

// DELETE /api/admin/banned-ips/:id - Unban an IP
router.delete(
    '/banned-ips/:id',
    [param('id').isUUID()],
    validate,
    asyncHandler(async (req: AuthRequest, res: any) => {
        await prisma.bannedIP.delete({ where: { id: req.params.id } });
        res.json({ message: 'IP unbanned' });
    })
);

export default router;
