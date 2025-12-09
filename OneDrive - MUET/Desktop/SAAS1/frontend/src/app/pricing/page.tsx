import Link from 'next/link';
import { Check, Zap, X } from 'lucide-react';

const plans = [
    {
        name: 'Free',
        price: '$0',
        period: 'forever',
        description: 'Try it out with 1 free audit',
        features: [
            { name: '1 SEO Audit', included: true },
            { name: 'Basic PDF Report', included: true },
            { name: 'Email Delivery', included: true },
            { name: 'White-Label Branding', included: false },
            { name: 'Team Members', included: false },
            { name: 'Client Portal', included: false },
            { name: 'Widget Embed', included: false },
            { name: 'API Access', included: false },
        ],
        cta: 'Start Free',
        href: '/signup',
        popular: false,
    },
    {
        name: 'Pro',
        price: '$79',
        period: '/month',
        description: 'Perfect for freelancers and small agencies',
        features: [
            { name: 'Unlimited SEO Audits', included: true },
            { name: 'Professional PDF Reports', included: true },
            { name: 'Email Delivery', included: true },
            { name: 'White-Label Branding', included: true },
            { name: '3 Team Members', included: true },
            { name: 'Client Portal', included: false },
            { name: 'Widget Embed', included: false },
            { name: 'API Access', included: false },
        ],
        cta: 'Start Free Trial',
        href: '/signup?plan=pro',
        popular: true,
    },
    {
        name: 'Agency',
        price: '$149',
        period: '/month',
        description: 'For growing agencies with multiple clients',
        features: [
            { name: 'Unlimited SEO Audits', included: true },
            { name: 'Professional PDF Reports', included: true },
            { name: 'Email Delivery', included: true },
            { name: 'White-Label Branding', included: true },
            { name: '10 Team Members', included: true },
            { name: 'Client Portal', included: true },
            { name: 'Widget Embed', included: true },
            { name: 'API Access', included: true },
        ],
        cta: 'Start Free Trial',
        href: '/signup?plan=agency',
        popular: false,
    },
    {
        name: 'Enterprise',
        price: 'Custom',
        period: '',
        description: 'For large organizations with custom needs',
        features: [
            { name: 'Everything in Agency', included: true },
            { name: 'Unlimited Team Members', included: true },
            { name: 'SSO (SAML/OAuth)', included: true },
            { name: 'Custom Integrations', included: true },
            { name: 'Dedicated Support', included: true },
            { name: 'SLA Guarantee', included: true },
            { name: 'Custom Domain', included: true },
            { name: 'Priority Queue', included: true },
        ],
        cta: 'Contact Sales',
        href: '/contact',
        popular: false,
    },
];

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 glass">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-purple-500 rounded-lg flex items-center justify-center">
                                <Zap className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-xl">SEO Audit Pro</span>
                        </Link>

                        <div className="hidden md:flex items-center gap-8">
                            <Link href="/pricing" className="text-primary-600 font-medium">Pricing</Link>
                            <Link href="/blog" className="text-gray-600 hover:text-gray-900 transition">Blog</Link>
                            <Link href="/login" className="text-gray-600 hover:text-gray-900 transition">Login</Link>
                            <Link href="/signup" className="btn btn-primary">
                                Start Free Trial
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Header */}
            <section className="pt-32 pb-16 px-4 text-center">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                    Simple, Transparent Pricing
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    Choose the plan that's right for your business. All plans include a 14-day free trial.
                </p>
            </section>

            {/* Pricing Cards */}
            <section className="pb-20 px-4">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={`card relative ${plan.popular
                                    ? 'border-2 border-primary-500 shadow-xl scale-105'
                                    : ''
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary-500 to-purple-500 text-white text-sm font-medium px-4 py-1 rounded-full">
                                    Most Popular
                                </div>
                            )}

                            <div className="text-center mb-6">
                                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-4xl font-bold">{plan.price}</span>
                                    <span className="text-gray-500">{plan.period}</span>
                                </div>
                                <p className="text-gray-600 text-sm mt-2">{plan.description}</p>
                            </div>

                            <ul className="space-y-3 mb-8">
                                {plan.features.map((feature, index) => (
                                    <li key={index} className="flex items-center gap-3">
                                        {feature.included ? (
                                            <Check className="w-5 h-5 text-success-500 flex-shrink-0" />
                                        ) : (
                                            <X className="w-5 h-5 text-gray-300 flex-shrink-0" />
                                        )}
                                        <span className={feature.included ? '' : 'text-gray-400'}>
                                            {feature.name}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href={plan.href}
                                className={`btn w-full justify-center ${plan.popular ? 'btn-primary' : 'btn-secondary'
                                    }`}
                            >
                                {plan.cta}
                            </Link>
                        </div>
                    ))}
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-20 px-4 bg-white">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12">
                        Frequently Asked Questions
                    </h2>

                    <div className="space-y-6">
                        <FaqItem
                            question="How does the free trial work?"
                            answer="All paid plans include a 14-day free trial. No credit card required. You can upgrade, downgrade, or cancel at any time during the trial."
                        />
                        <FaqItem
                            question="What payment methods do you accept?"
                            answer="We accept all major credit cards (Visa, MasterCard, American Express) through Stripe. Enterprise customers can also pay via invoice."
                        />
                        <FaqItem
                            question="Can I change my plan later?"
                            answer="Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate the difference."
                        />
                        <FaqItem
                            question="What's included in white-label branding?"
                            answer="White-label branding includes your custom logo, brand colors, company name on reports, and optional custom domain for client portals."
                        />
                        <FaqItem
                            question="Do you offer refunds?"
                            answer="Yes, we offer a 30-day money-back guarantee. If you're not satisfied, contact us within 30 days for a full refund."
                        />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-300 py-12 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <p>© {new Date().getFullYear()} SEO Audit Pro. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
    return (
        <div className="border-b border-gray-100 pb-6">
            <h3 className="text-lg font-semibold mb-2">{question}</h3>
            <p className="text-gray-600">{answer}</p>
        </div>
    );
}
