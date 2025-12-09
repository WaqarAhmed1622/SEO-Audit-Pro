import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible';
import redis from '../config/redis.js';
import { logger } from '../utils/logger.js';

// General API rate limiter
const apiLimiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'rl:api',
    points: 100, // Number of requests
    duration: 60, // Per 60 seconds
    blockDuration: 60, // Block for 60 seconds if exceeded
});

// Auth endpoints rate limiter (stricter)
const authLimiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'rl:auth',
    points: 10,
    duration: 60,
    blockDuration: 300, // Block for 5 minutes
});

// Audit creation rate limiter
const auditLimiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'rl:audit',
    points: 20,
    duration: 3600, // Per hour
    blockDuration: 1800, // Block for 30 minutes
});

// Widget API rate limiter
const widgetLimiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'rl:widget',
    points: 50,
    duration: 60,
    blockDuration: 120,
});

export const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    try {
        // Choose limiter based on route
        let limiter = apiLimiter;

        if (req.path.startsWith('/api/auth')) {
            limiter = authLimiter;
        } else if (req.path.startsWith('/api/audits') && req.method === 'POST') {
            limiter = auditLimiter;
        } else if (req.path.startsWith('/api/widget')) {
            limiter = widgetLimiter;
        }

        await limiter.consume(ip);
        next();
    } catch (error) {
        if (error instanceof RateLimiterRes) {
            logger.warn(`Rate limit exceeded for IP: ${ip}`);
            res.set('Retry-After', String(Math.ceil(error.msBeforeNext / 1000)));
            res.status(429).json({
                error: 'Too many requests',
                retryAfter: Math.ceil(error.msBeforeNext / 1000),
            });
        } else {
            // If Redis is down, allow the request
            logger.error('Rate limiter error:', error);
            next();
        }
    }
};

// Specific limiters for route-level use
export const createAuthLimiter = () => async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || 'unknown';
    try {
        await authLimiter.consume(ip);
        next();
    } catch (error) {
        if (error instanceof RateLimiterRes) {
            res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
        } else {
            next();
        }
    }
};

export const createAuditLimiter = () => async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user?.id || req.ip || 'unknown';
    try {
        await auditLimiter.consume(userId);
        next();
    } catch (error) {
        if (error instanceof RateLimiterRes) {
            res.status(429).json({ error: 'Audit limit reached. Please upgrade your plan or try again later.' });
        } else {
            next();
        }
    }
};
