import { Queue, Worker, Job } from 'bullmq';
import redis from '../config/redis.js';
import prisma from '../config/database.js';
import { logger } from '../utils/logger.js';
import { sendAuditCompleteEmail } from '../services/email.service.js';

const QUEUE_NAME = 'audit-queue';

// Create queue
export const auditQueue = new Queue(QUEUE_NAME, {
    connection: redis,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
    },
});

// Job data interface
interface AuditJobData {
    auditId: string;
    url: string;
    userId: string;
    orgId: string;
}

// Add job to queue
export const queueAudit = async (data: AuditJobData) => {
    const job = await auditQueue.add('process-audit', data, {
        priority: 1,
    });
    logger.info(`Audit queued: ${job.id} for URL: ${data.url}`);
    return job;
};

// Worker to process audits
export const startAuditWorker = () => {
    const worker = new Worker<AuditJobData>(
        QUEUE_NAME,
        async (job: Job<AuditJobData>) => {
            const { auditId, url, userId, orgId } = job.data;

            logger.info(`Processing audit ${auditId} for URL: ${url}`);

            try {
                // Update status to processing
                await prisma.audit.update({
                    where: { id: auditId },
                    data: { status: 'PROCESSING' },
                });

                // Call Python SEO engine
                const seoEngineUrl = process.env.SEO_ENGINE_URL || 'http://localhost:8000';
                const analysisResponse = await fetch(`${seoEngineUrl}/analyze`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url }),
                });

                if (!analysisResponse.ok) {
                    throw new Error('SEO Engine analysis failed');
                }

                const analysisResult = await analysisResponse.json();

                // Calculate overall score
                const score = calculateScore(analysisResult);

                // Generate AI summary (if OpenAI configured)
                let aiSummary = null;
                let topFixes = null;
                if (process.env.OPENAI_API_KEY) {
                    const aiResult = await generateAISummary(analysisResult);
                    aiSummary = aiResult.summary;
                    topFixes = aiResult.fixes;
                }

                // Get org branding
                const branding = await prisma.branding.findUnique({
                    where: { orgId },
                });

                // Generate PDF
                const pdfEngineUrl = process.env.PDF_ENGINE_URL || 'http://localhost:5000';
                const pdfResponse = await fetch(`${pdfEngineUrl}/generate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        auditId,
                        url,
                        score,
                        analysisResult,
                        aiSummary,
                        topFixes,
                        branding,
                    }),
                });

                if (!pdfResponse.ok) {
                    throw new Error('PDF generation failed');
                }

                const { pdfUrl } = await pdfResponse.json();

                // Update audit with results
                await prisma.audit.update({
                    where: { id: auditId },
                    data: {
                        status: 'COMPLETE',
                        score,
                        jsonReport: analysisResult,
                        aiSummary,
                        topFixes,
                        pdfUrl,
                        completedAt: new Date(),
                    },
                });

                // Increment org usage
                await prisma.organization.update({
                    where: { id: orgId },
                    data: { usedAudits: { increment: 1 } },
                });

                // Send completion email
                const user = await prisma.user.findUnique({ where: { id: userId } });
                if (user) {
                    await sendAuditCompleteEmail(user.email, user.name, url, score, pdfUrl);
                }

                logger.info(`Audit completed: ${auditId}, Score: ${score}`);

                return { auditId, score, pdfUrl };
            } catch (error) {
                logger.error(`Audit failed: ${auditId}`, error);

                // Update status to failed
                await prisma.audit.update({
                    where: { id: auditId },
                    data: { status: 'FAILED' },
                });

                throw error;
            }
        },
        {
            connection: redis,
            concurrency: 5,
        }
    );

    worker.on('completed', (job) => {
        logger.info(`Job ${job.id} completed`);
    });

    worker.on('failed', (job, err) => {
        logger.error(`Job ${job?.id} failed:`, err);
    });

    logger.info('Audit worker started');

    return worker;
};

// Calculate overall SEO score
const calculateScore = (analysis: any): number => {
    const weights = {
        technical: 0.25,
        onPage: 0.25,
        performance: 0.25,
        mobile: 0.15,
        security: 0.10,
    };

    let score = 0;

    if (analysis.technical?.score) score += analysis.technical.score * weights.technical;
    if (analysis.onPage?.score) score += analysis.onPage.score * weights.onPage;
    if (analysis.performance?.score) score += analysis.performance.score * weights.performance;
    if (analysis.mobile?.score) score += analysis.mobile.score * weights.mobile;
    if (analysis.security?.score) score += analysis.security.score * weights.security;

    return Math.round(score);
};

// Generate AI summary using OpenAI
const generateAISummary = async (analysis: any): Promise<{ summary: string; fixes: any[] }> => {
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'gpt-4-turbo-preview',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an SEO expert. Analyze the following SEO audit data and provide: 1) A concise executive summary (2-3 paragraphs) 2) Top 10 prioritized fixes with impact level (high/medium/low) and estimated effort.',
                    },
                    {
                        role: 'user',
                        content: JSON.stringify(analysis),
                    },
                ],
                temperature: 0.7,
                max_tokens: 2000,
            }),
        });

        const data = await response.json();
        const content = data.choices[0]?.message?.content || '';

        // Parse response (simplified - in production use structured output)
        return {
            summary: content,
            fixes: [],
        };
    } catch (error) {
        logger.error('AI summary generation failed:', error);
        return { summary: '', fixes: [] };
    }
};
