import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/error.middleware.js';
import { verifyRecaptcha } from '../middleware/recaptcha.middleware.js';
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js';
import * as authService from '../services/auth.service.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Validation middleware
const validate = (req: any, res: any, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// POST /api/auth/signup
router.post(
    '/signup',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
        body('name').trim().notEmpty().withMessage('Name is required'),
    ],
    validate,
    verifyRecaptcha,
    asyncHandler(async (req: any, res: any) => {
        const { email, password, name } = req.body;
        const result = await authService.signup({ email, password, name });
        res.status(201).json(result);
    })
);

// POST /api/auth/login
router.post(
    '/login',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').notEmpty(),
    ],
    validate,
    verifyRecaptcha,
    asyncHandler(async (req: any, res: any) => {
        const { email, password } = req.body;
        const result = await authService.login({ email, password }, req.ip);
        res.json(result);
    })
);

// POST /api/auth/verify-email
router.post(
    '/verify-email',
    [body('token').notEmpty()],
    validate,
    asyncHandler(async (req: any, res: any) => {
        const { token } = req.body;
        const result = await authService.verifyEmail(token);
        res.json(result);
    })
);

// POST /api/auth/forgot-password
router.post(
    '/forgot-password',
    [body('email').isEmail().normalizeEmail()],
    validate,
    verifyRecaptcha,
    asyncHandler(async (req: any, res: any) => {
        const { email } = req.body;
        const result = await authService.forgotPassword(email);
        res.json(result);
    })
);

// POST /api/auth/reset-password
router.post(
    '/reset-password',
    [
        body('token').notEmpty(),
        body('password').isLength({ min: 8 }),
    ],
    validate,
    asyncHandler(async (req: any, res: any) => {
        const { token, password } = req.body;
        const result = await authService.resetPassword(token, password);
        res.json(result);
    })
);

// GET /api/auth/me
router.get(
    '/me',
    authenticate,
    asyncHandler(async (req: AuthRequest, res: any) => {
        res.json({ user: req.user });
    })
);

// POST /api/auth/google
router.post(
    '/google',
    [body('credential').notEmpty()],
    validate,
    asyncHandler(async (req: any, res: any) => {
        // In production, verify the Google credential token
        // For now, we'll expect profile data from frontend
        const { profile } = req.body;
        const result = await authService.googleAuth(profile);
        res.json(result);
    })
);

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    // JWT is stateless, so logout is handled on client
    res.json({ message: 'Logged out successfully' });
});

export default router;
