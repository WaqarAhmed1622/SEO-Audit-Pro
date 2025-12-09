import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY;
const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

export const verifyRecaptcha = async (req: Request, res: Response, next: NextFunction) => {
    // Skip in development if no key configured
    if (!RECAPTCHA_SECRET) {
        logger.warn('reCAPTCHA secret not configured, skipping verification');
        return next();
    }

    const token = req.body.recaptchaToken || req.headers['x-recaptcha-token'];

    if (!token) {
        return res.status(400).json({ error: 'reCAPTCHA token required' });
    }

    try {
        const response = await fetch(RECAPTCHA_VERIFY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                secret: RECAPTCHA_SECRET,
                response: token,
                remoteip: req.ip || '',
            }),
        });

        const data = await response.json() as { success: boolean; score?: number; action?: string };

        if (!data.success) {
            logger.warn('reCAPTCHA verification failed', { ip: req.ip });
            return res.status(400).json({ error: 'reCAPTCHA verification failed' });
        }

        // Check score for v3 (0.0 - 1.0, higher is more likely human)
        if (data.score !== undefined && data.score < 0.5) {
            logger.warn('reCAPTCHA score too low', { ip: req.ip, score: data.score });
            return res.status(400).json({ error: 'Suspicious activity detected' });
        }

        next();
    } catch (error) {
        logger.error('reCAPTCHA verification error:', error);
        // Allow request on verification error (fail open for availability)
        next();
    }
};

// Optional reCAPTCHA - doesn't fail if token not provided
export const optionalRecaptcha = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.body.recaptchaToken || req.headers['x-recaptcha-token'];

    if (!token || !RECAPTCHA_SECRET) {
        return next();
    }

    return verifyRecaptcha(req, res, next);
};
