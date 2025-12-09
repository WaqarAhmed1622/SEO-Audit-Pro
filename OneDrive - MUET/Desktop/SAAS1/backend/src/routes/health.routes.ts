import { Router } from 'express';
import prisma from '../config/database.js';
import redis from '../config/redis.js';

const router = Router();

// GET /health - Basic health check
router.get('/', async (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// GET /health/detailed - Detailed health check
router.get('/detailed', async (req, res) => {
    const health: Record<string, any> = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {},
    };

    // Check database
    try {
        await prisma.$queryRaw`SELECT 1`;
        health.services.database = { status: 'ok' };
    } catch (error) {
        health.services.database = { status: 'error', message: 'Database connection failed' };
        health.status = 'degraded';
    }

    // Check Redis
    try {
        await redis.ping();
        health.services.redis = { status: 'ok' };
    } catch (error) {
        health.services.redis = { status: 'error', message: 'Redis connection failed' };
        health.status = 'degraded';
    }

    // Check Python SEO engine
    try {
        const seoEngineUrl = process.env.SEO_ENGINE_URL || 'http://localhost:8000';
        const response = await fetch(`${seoEngineUrl}/health`, {
            signal: AbortSignal.timeout(5000)
        });
        if (response.ok) {
            health.services.seoEngine = { status: 'ok' };
        } else {
            health.services.seoEngine = { status: 'error', message: 'SEO engine unhealthy' };
            health.status = 'degraded';
        }
    } catch (error) {
        health.services.seoEngine = { status: 'error', message: 'SEO engine unreachable' };
        health.status = 'degraded';
    }

    const statusCode = health.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(health);
});

export default router;
