import Stripe from 'stripe';
import prisma from '../config/database.js';
import { logger } from '../utils/logger.js';
import { sendPaymentReceiptEmail, sendPaymentFailedEmail } from './email.service.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16',
});

// Plan configuration
const PLANS = {
    FREE: {
        name: 'Free',
        auditLimit: 1,
        features: ['1 SEO Audit', 'Basic Report'],
    },
    PRO: {
        name: 'Pro',
        priceId: process.env.STRIPE_PRICE_PRO,
        price: 7900, // $79
        auditLimit: 999999,
        features: ['Unlimited Audits', 'PDF Reports', 'Email Delivery'],
    },
    AGENCY: {
        name: 'Agency',
        priceId: process.env.STRIPE_PRICE_AGENCY,
        price: 14900, // $149
        auditLimit: 999999,
        features: ['Everything in Pro', 'White-Label', 'Team Members', 'Client Portal', 'Widget'],
    },
    ENTERPRISE: {
        name: 'Enterprise',
        price: null, // Custom
        auditLimit: 999999,
        features: ['Everything in Agency', 'SSO', 'Priority Support', 'Custom Limits', 'SLA'],
    },
};

export const getPlans = () => {
    return Object.entries(PLANS).map(([key, plan]) => ({
        id: key,
        ...plan,
    }));
};

export const createCheckoutSession = async (orgId: string, planId: string) => {
    const plan = PLANS[planId as keyof typeof PLANS];
    if (!plan || !plan.priceId) {
        throw new Error('Invalid plan');
    }

    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        include: { subscription: true, owner: true },
    });

    if (!org) {
        throw new Error('Organization not found');
    }

    // Get or create Stripe customer
    let customerId = org.subscription?.stripeCustomerId;

    if (!customerId) {
        const customer = await stripe.customers.create({
            email: org.owner.email,
            name: org.name,
            metadata: { orgId },
        });
        customerId = customer.id;

        await prisma.subscription.upsert({
            where: { orgId },
            update: { stripeCustomerId: customerId },
            create: {
                orgId,
                stripeCustomerId: customerId,
            },
        });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
            {
                price: plan.priceId,
                quantity: 1,
            },
        ],
        success_url: `${process.env.FRONTEND_URL}/dashboard/billing?success=true`,
        cancel_url: `${process.env.FRONTEND_URL}/dashboard/billing?canceled=true`,
        metadata: { orgId, planId },
    });

    logger.info(`Checkout session created for org: ${orgId}, plan: ${planId}`);

    return { url: session.url };
};

export const createPortalSession = async (orgId: string) => {
    const subscription = await prisma.subscription.findUnique({
        where: { orgId },
    });

    if (!subscription?.stripeCustomerId) {
        throw new Error('No subscription found');
    }

    const session = await stripe.billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
        return_url: `${process.env.FRONTEND_URL}/dashboard/billing`,
    });

    return { url: session.url };
};

export const handleWebhook = async (event: Stripe.Event) => {
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            await handleCheckoutComplete(session);
            break;
        }
        case 'customer.subscription.updated': {
            const subscription = event.data.object as Stripe.Subscription;
            await handleSubscriptionUpdate(subscription);
            break;
        }
        case 'customer.subscription.deleted': {
            const subscription = event.data.object as Stripe.Subscription;
            await handleSubscriptionDeleted(subscription);
            break;
        }
        case 'invoice.payment_succeeded': {
            const invoice = event.data.object as Stripe.Invoice;
            await handlePaymentSuccess(invoice);
            break;
        }
        case 'invoice.payment_failed': {
            const invoice = event.data.object as Stripe.Invoice;
            await handlePaymentFailed(invoice);
            break;
        }
    }
};

const handleCheckoutComplete = async (session: Stripe.Checkout.Session) => {
    const { orgId, planId } = session.metadata || {};

    if (!orgId || !planId) return;

    const plan = PLANS[planId as keyof typeof PLANS];

    await prisma.$transaction([
        prisma.organization.update({
            where: { id: orgId },
            data: {
                plan: planId as any,
                auditLimit: plan.auditLimit,
            },
        }),
        prisma.subscription.update({
            where: { orgId },
            data: {
                stripeSubscriptionId: session.subscription as string,
                status: 'active',
            },
        }),
    ]);

    logger.info(`Subscription activated for org: ${orgId}, plan: ${planId}`);
};

const handleSubscriptionUpdate = async (subscription: Stripe.Subscription) => {
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    if (customer.deleted) return;

    const orgId = (customer as Stripe.Customer).metadata?.orgId;
    if (!orgId) return;

    await prisma.subscription.update({
        where: { orgId },
        data: {
            status: subscription.status,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
        },
    });
};

const handleSubscriptionDeleted = async (subscription: Stripe.Subscription) => {
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    if (customer.deleted) return;

    const orgId = (customer as Stripe.Customer).metadata?.orgId;
    if (!orgId) return;

    await prisma.$transaction([
        prisma.organization.update({
            where: { id: orgId },
            data: {
                plan: 'FREE',
                auditLimit: 1,
            },
        }),
        prisma.subscription.update({
            where: { orgId },
            data: { status: 'canceled' },
        }),
    ]);

    logger.info(`Subscription canceled for org: ${orgId}`);
};

const handlePaymentSuccess = async (invoice: Stripe.Invoice) => {
    const customer = await stripe.customers.retrieve(invoice.customer as string);
    if (customer.deleted) return;

    const orgId = (customer as Stripe.Customer).metadata?.orgId;
    if (!orgId) return;

    // Record payment
    await prisma.payment.create({
        data: {
            stripePaymentId: invoice.payment_intent as string,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            status: 'paid',
            orgId,
        },
    });

    // Send receipt email
    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        include: { owner: true },
    });

    if (org) {
        const planName = PLANS[org.plan as keyof typeof PLANS]?.name || org.plan;
        await sendPaymentReceiptEmail(
            org.owner.email,
            org.owner.name,
            invoice.amount_paid,
            planName,
            invoice.hosted_invoice_url || undefined
        );
    }
};

const handlePaymentFailed = async (invoice: Stripe.Invoice) => {
    const customer = await stripe.customers.retrieve(invoice.customer as string);
    if (customer.deleted) return;

    const orgId = (customer as Stripe.Customer).metadata?.orgId;
    if (!orgId) return;

    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        include: { owner: true },
    });

    if (org) {
        const planName = PLANS[org.plan as keyof typeof PLANS]?.name || org.plan;
        await sendPaymentFailedEmail(org.owner.email, org.owner.name, planName);
    }

    logger.warn(`Payment failed for org: ${orgId}`);
};

export const getSubscription = async (orgId: string) => {
    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        include: { subscription: true },
    });

    if (!org) {
        throw new Error('Organization not found');
    }

    const plan = PLANS[org.plan as keyof typeof PLANS];

    return {
        plan: {
            id: org.plan,
            name: plan?.name,
            features: plan?.features,
        },
        usage: {
            audits: org.usedAudits,
            limit: org.auditLimit,
        },
        subscription: org.subscription ? {
            status: org.subscription.status,
            currentPeriodEnd: org.subscription.currentPeriodEnd,
            cancelAtPeriodEnd: org.subscription.cancelAtPeriodEnd,
        } : null,
    };
};
