'use client';

import { useEffect, useState } from 'react';
import {
    CreditCard,
    Check,
    Zap,
    ExternalLink,
    Loader2,
    AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface Subscription {
    status: string;
    plan: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
}

const plans = [
    {
        id: 'FREE',
        name: 'Free',
        price: 0,
        features: ['1 SEO Audit', 'Basic PDF Report', 'Email Delivery'],
    },
    {
        id: 'PRO',
        name: 'Pro',
        price: 79,
        features: ['Unlimited Audits', 'White-Label Branding', '3 Team Members', 'Priority Support'],
        popular: true,
    },
    {
        id: 'AGENCY',
        name: 'Agency',
        price: 149,
        features: ['Everything in Pro', '10 Team Members', 'Client Portal', 'Widget Embed', 'API Access'],
    },
];

export default function BillingPage() {
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);
    const [upgrading, setUpgrading] = useState<string | null>(null);

    useEffect(() => {
        fetchSubscription();
    }, []);

    const fetchSubscription = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/billing`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setSubscription(data);
            }
        } catch (error) {
            // Mock data
            setSubscription({
                status: 'active',
                plan: 'PRO',
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                cancelAtPeriodEnd: false
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async (planId: string) => {
        setUpgrading(planId);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/billing/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ planId })
            });

            if (!response.ok) throw new Error('Failed to create checkout session');

            const { url } = await response.json();
            window.location.href = url;
        } catch (error) {
            toast.error('Failed to start checkout');
        } finally {
            setUpgrading(null);
        }
    };

    const handleManageBilling = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/billing/portal`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to open billing portal');

            const { url } = await response.json();
            window.location.href = url;
        } catch (error) {
            toast.error('Failed to open billing portal');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    const currentPlan = subscription?.plan || 'FREE';

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
                <p className="text-gray-600">Manage your subscription and payment methods</p>
            </div>

            {/* Current Plan */}
            <div className="card">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="font-semibold text-lg">Current Plan</h3>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-3xl font-bold text-primary-600">{currentPlan}</span>
                            {subscription?.status === 'active' && (
                                <span className="bg-success-50 text-success-600 text-xs px-2 py-1 rounded-full">
                                    Active
                                </span>
                            )}
                        </div>
                        {subscription?.currentPeriodEnd && (
                            <p className="text-sm text-gray-500 mt-2">
                                {subscription.cancelAtPeriodEnd ? 'Cancels' : 'Renews'} on{' '}
                                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                            </p>
                        )}
                    </div>
                    {currentPlan !== 'FREE' && (
                        <button onClick={handleManageBilling} className="btn btn-secondary">
                            <CreditCard className="w-4 h-4 mr-2" />
                            Manage Billing
                        </button>
                    )}
                </div>

                {subscription?.cancelAtPeriodEnd && (
                    <div className="mt-4 flex items-center gap-2 bg-warning-50 text-warning-700 px-4 py-3 rounded-lg">
                        <AlertCircle className="w-5 h-5" />
                        <span>Your subscription will be canceled at the end of the billing period.</span>
                    </div>
                )}
            </div>

            {/* Plans */}
            <div className="grid md:grid-cols-3 gap-6">
                {plans.map((plan) => {
                    const isCurrent = currentPlan === plan.id;
                    const isDowngrade = plans.findIndex(p => p.id === plan.id) < plans.findIndex(p => p.id === currentPlan);

                    return (
                        <div
                            key={plan.id}
                            className={`card relative ${plan.popular ? 'border-2 border-primary-500 shadow-lg' : ''}`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary-500 to-purple-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                                    Most Popular
                                </div>
                            )}

                            <div className="text-center mb-6">
                                <h3 className="text-xl font-semibold">{plan.name}</h3>
                                <div className="mt-2">
                                    <span className="text-4xl font-bold">${plan.price}</span>
                                    <span className="text-gray-500">/month</span>
                                </div>
                            </div>

                            <ul className="space-y-3 mb-6">
                                {plan.features.map((feature, index) => (
                                    <li key={index} className="flex items-center gap-2">
                                        <Check className="w-5 h-5 text-success-500" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {isCurrent ? (
                                <button disabled className="btn btn-secondary w-full">
                                    Current Plan
                                </button>
                            ) : plan.id === 'FREE' ? (
                                <button disabled className="btn btn-secondary w-full">
                                    {isDowngrade ? 'Downgrade via Portal' : 'Free Tier'}
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleUpgrade(plan.id)}
                                    disabled={upgrading === plan.id}
                                    className={`btn w-full ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}
                                >
                                    {upgrading === plan.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                        <Zap className="w-4 h-4 mr-2" />
                                    )}
                                    {isDowngrade ? 'Downgrade' : 'Upgrade'}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Usage */}
            <div className="card">
                <h3 className="font-semibold text-lg mb-4">Usage This Month</h3>
                <div className="grid md:grid-cols-3 gap-6">
                    <div>
                        <p className="text-sm text-gray-500">Audits Used</p>
                        <p className="text-2xl font-bold">12 / {currentPlan === 'FREE' ? '1' : '∞'}</p>
                        {currentPlan === 'FREE' && (
                            <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-danger-500 w-full" />
                            </div>
                        )}
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Team Members</p>
                        <p className="text-2xl font-bold">
                            3 / {currentPlan === 'FREE' ? '1' : currentPlan === 'PRO' ? '3' : '10'}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">API Calls</p>
                        <p className="text-2xl font-bold">
                            {currentPlan === 'AGENCY' ? '847' : 'N/A'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Payment History */}
            <div className="card">
                <h3 className="font-semibold text-lg mb-4">Payment History</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-sm text-gray-500 border-b">
                                <th className="pb-3">Date</th>
                                <th className="pb-3">Description</th>
                                <th className="pb-3">Amount</th>
                                <th className="pb-3">Status</th>
                                <th className="pb-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { date: '2024-01-01', desc: 'Pro Plan - Monthly', amount: 79, status: 'paid' },
                                { date: '2023-12-01', desc: 'Pro Plan - Monthly', amount: 79, status: 'paid' },
                                { date: '2023-11-01', desc: 'Pro Plan - Monthly', amount: 79, status: 'paid' },
                            ].map((payment, index) => (
                                <tr key={index} className="border-b">
                                    <td className="py-3">{payment.date}</td>
                                    <td className="py-3">{payment.desc}</td>
                                    <td className="py-3">${payment.amount}</td>
                                    <td className="py-3">
                                        <span className="bg-success-50 text-success-600 text-xs px-2 py-1 rounded-full">
                                            {payment.status}
                                        </span>
                                    </td>
                                    <td className="py-3">
                                        <button className="text-primary-600 hover:underline text-sm">
                                            Download
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
