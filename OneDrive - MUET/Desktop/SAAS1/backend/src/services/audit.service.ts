import prisma from '../config/database.js';
import { queueAudit } from '../queues/audit.worker.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../middleware/error.middleware.js';

interface CreateAuditParams {
    url: string;
    userId: string;
    orgId: string;
    clientId?: string;
    widgetId?: string;
    leadEmail?: string;
    leadName?: string;
}

interface ListAuditsParams {
    orgId: string;
    page: number;
    limit: number;
    status?: string;
    search?: string;
}

export const createAudit = async (params: CreateAuditParams) => {
    const { url, userId, orgId, clientId, widgetId, leadEmail, leadName } = params;

    // Check org limits
    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { plan: true, auditLimit: true, usedAudits: true },
    });

    if (!org) {
        throw new AppError('Organization not found', 404);
    }

    // Check if limit reached (except enterprise)
    if (org.plan !== 'ENTERPRISE' && org.usedAudits >= org.auditLimit) {
        throw new AppError('Audit limit reached. Please upgrade your plan.', 403);
    }

    // Validate URL
    try {
        new URL(url);
    } catch {
        throw new AppError('Invalid URL format', 400);
    }

    // Create audit record
    const audit = await prisma.audit.create({
        data: {
            url,
            userId,
            orgId,
            clientId,
            widgetId,
            leadEmail,
            leadName,
            status: 'PENDING',
        },
    });

    // Queue for processing
    await queueAudit({
        auditId: audit.id,
        url,
        userId,
        orgId,
    });

    logger.info(`Audit created: ${audit.id} for URL: ${url}`);

    return audit;
};

export const listAudits = async (params: ListAuditsParams) => {
    const { orgId, page, limit, status, search } = params;
    const skip = (page - 1) * limit;

    const where: any = { orgId };

    if (status) {
        where.status = status;
    }

    if (search) {
        where.url = { contains: search, mode: 'insensitive' };
    }

    const [audits, total] = await Promise.all([
        prisma.audit.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            select: {
                id: true,
                url: true,
                score: true,
                status: true,
                pdfUrl: true,
                createdAt: true,
                completedAt: true,
                client: {
                    select: { id: true, name: true, email: true },
                },
            },
        }),
        prisma.audit.count({ where }),
    ]);

    return {
        audits,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    };
};

export const getAudit = async (auditId: string, userId: string) => {
    const audit = await prisma.audit.findUnique({
        where: { id: auditId },
        include: {
            client: {
                select: { id: true, name: true, email: true, company: true },
            },
            org: {
                select: { id: true, name: true },
            },
        },
    });

    if (!audit) {
        throw new AppError('Audit not found', 404);
    }

    // Verify access (user belongs to org)
    const membership = await prisma.organizationMember.findUnique({
        where: {
            orgId_userId: {
                orgId: audit.orgId,
                userId,
            },
        },
    });

    if (!membership) {
        throw new AppError('Access denied', 403);
    }

    // Transform response to match frontend expectations
    const defaultCategory = { score: 0, issues: [], checks: {}, data: {} };
    const jsonReport = audit.jsonReport as any || {};

    return {
        id: audit.id,
        url: audit.url,
        score: audit.score || 0,
        status: audit.status,
        pdfUrl: audit.pdfUrl,
        createdAt: audit.createdAt,
        completedAt: audit.completedAt,
        client: audit.client,
        org: audit.org,
        aiSummary: audit.aiSummary || 'No AI summary available.',
        topFixes: audit.topFixes || [],
        analysisResult: {
            technical: jsonReport.technical || defaultCategory,
            onPage: jsonReport.onPage || defaultCategory,
            performance: jsonReport.performance || defaultCategory,
            security: jsonReport.security || defaultCategory,
            mobile: jsonReport.mobile || defaultCategory,
        },
    };
};

export const deleteAudit = async (auditId: string, userId: string) => {
    const audit = await prisma.audit.findUnique({
        where: { id: auditId },
        select: { id: true, orgId: true },
    });

    if (!audit) {
        throw new AppError('Audit not found', 404);
    }

    // Verify access
    const membership = await prisma.organizationMember.findUnique({
        where: {
            orgId_userId: {
                orgId: audit.orgId,
                userId,
            },
        },
    });

    if (!membership) {
        throw new AppError('Access denied', 403);
    }

    await prisma.audit.delete({ where: { id: auditId } });

    logger.info(`Audit deleted: ${auditId}`);
};

export const regeneratePdf = async (auditId: string, userId: string) => {
    const audit = await getAudit(auditId, userId);

    if (audit.status !== 'COMPLETE') {
        throw new AppError('Cannot regenerate PDF for incomplete audit', 400);
    }

    // Get branding
    const branding = await prisma.branding.findUnique({
        where: { orgId: audit.orgId },
    });

    // Call PDF engine to regenerate
    const pdfEngineUrl = process.env.PDF_ENGINE_URL || 'http://localhost:5000';
    const response = await fetch(`${pdfEngineUrl}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            auditId: audit.id,
            url: audit.url,
            score: audit.score,
            analysisResult: audit.jsonReport,
            aiSummary: audit.aiSummary,
            topFixes: audit.topFixes,
            branding,
        }),
    });

    if (!response.ok) {
        throw new AppError('PDF regeneration failed', 500);
    }

    const { pdfUrl } = await response.json();

    // Update audit with new PDF URL
    await prisma.audit.update({
        where: { id: auditId },
        data: { pdfUrl },
    });

    logger.info(`PDF regenerated for audit: ${auditId}`);

    return { pdfUrl };
};
