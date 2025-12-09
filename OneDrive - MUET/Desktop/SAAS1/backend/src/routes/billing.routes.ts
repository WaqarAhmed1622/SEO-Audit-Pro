import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/error.middleware.js';
import { authenticate, AuthRequest, requireOrg } from '../middleware/auth.middleware.js';
import * as stripeService from '../services/stripe.service.js';
import Stripe from 'stripe';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' });

const validate = (req: any, res: any, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// GET /api/billing/plans - Get available plans
router.get('/plans', (req, res) => {
    res.json(stripeService.getPlans());
});

// GET /api/billing - Get current subscription
router.get(
    '/',
    authenticate,
    requireOrg,
    asyncHandler(async (req: AuthRequest, res: any) => {
        const subscription = await stripeService.getSubscription(req.user!.orgId!);
        res.json(subscription);
    })
);

// POST /api/billing/checkout - Create checkout session
router.post(
    '/checkout',
    authenticate,
    requireOrg,
    [body('planId').isIn(['PRO', 'AGENCY'])],
    validate,
    asyncHandler(async (req: AuthRequest, res: any) => {
        const { planId } = req.body;
        const result = await stripeService.createCheckoutSession(req.user!.orgId!, planId);
        res.json(result);
    })
);

// POST /api/billing/portal - Create customer portal session
router.post(
    '/portal',
    authenticate,
    requireOrg,
    asyncHandler(async (req: AuthRequest, res: any) => {
        const result = await stripeService.createPortalSession(req.user!.orgId!);
        res.json(result);
    })
);

// POST /api/billing/webhook - Stripe webhook
router.post(
    '/webhook',
    asyncHandler(async (req: any, res: any) => {
        const sig = req.headers['stripe-signature'];
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!webhookSecret) {
            return res.status(500).json({ error: 'Webhook secret not configured' });
        }

        let event: Stripe.Event;

        try {
            // Note: In production, use raw body
            event = stripe.webhooks.constructEvent(
                JSON.stringify(req.body),
                sig,
                webhookSecret
            );
        } catch (err: any) {
            return res.status(400).json({ error: `Webhook Error: ${err.message}` });
        }

        await stripeService.handleWebhook(event);

        res.json({ received: true });
    })
);

export default router;
