'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Globe, Loader2, Zap, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface AuditForm {
    url: string;
    email: string;
}

export default function FreeAuditPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [auditComplete, setAuditComplete] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<AuditForm>();

    const onSubmit = async (data: AuditForm) => {
        setIsLoading(true);

        try {
            // For demo, simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));

            toast.success('Audit started! Check your email in a few minutes.');
            setAuditComplete(true);
        } catch (error) {
            toast.error('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

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
                            <Link href="/pricing" className="text-gray-600 hover:text-gray-900 transition">Pricing</Link>
                            <Link href="/login" className="text-gray-600 hover:text-gray-900 transition">Login</Link>
                            <Link href="/signup" className="btn btn-primary">
                                Start Free Trial
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <section className="pt-32 pb-20 px-4">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-10">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            Free SEO Audit
                        </h1>
                        <p className="text-xl text-gray-600">
                            Get a comprehensive analysis of your website's SEO health in under 60 seconds.
                        </p>
                    </div>

                    {auditComplete ? (
                        <div className="card text-center py-12">
                            <div className="w-20 h-20 bg-success-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-10 h-10 text-success-500" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Audit Started!</h2>
                            <p className="text-gray-600 mb-6">
                                We're analyzing your website. You'll receive a detailed PDF report in your email within a few minutes.
                            </p>
                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={() => setAuditComplete(false)}
                                    className="btn btn-secondary"
                                >
                                    Run Another Audit
                                </button>
                                <Link href="/signup" className="btn btn-primary">
                                    Sign Up for More
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="card">
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Website URL</label>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="url"
                                            {...register('url', {
                                                required: 'URL is required',
                                                pattern: {
                                                    value: /^https?:\/\/.+/,
                                                    message: 'Please enter a valid URL (including http:// or https://)'
                                                }
                                            })}
                                            className="input pl-10"
                                            placeholder="https://example.com"
                                            disabled={isLoading}
                                        />
                                    </div>
                                    {errors.url && (
                                        <p className="text-danger-500 text-sm mt-1">{errors.url.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        {...register('email', {
                                            required: 'Email is required',
                                            pattern: {
                                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                message: 'Invalid email address'
                                            }
                                        })}
                                        className="input"
                                        placeholder="you@example.com"
                                        disabled={isLoading}
                                    />
                                    {errors.email && (
                                        <p className="text-danger-500 text-sm mt-1">{errors.email.message}</p>
                                    )}
                                    <p className="text-sm text-gray-500 mt-1">
                                        We'll send the audit report to this email
                                    </p>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h3 className="font-medium mb-3">What we'll analyze:</h3>
                                    <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-success-500" />
                                            <span>Technical SEO</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-success-500" />
                                            <span>On-Page SEO</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-success-500" />
                                            <span>Performance</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-success-500" />
                                            <span>Mobile Usability</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-success-500" />
                                            <span>Security</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-success-500" />
                                            <span>Core Web Vitals</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="btn btn-primary w-full py-4 text-lg"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Analyzing...
                                        </span>
                                    ) : (
                                        'Get Free Audit Report'
                                    )}
                                </button>

                                <p className="text-center text-sm text-gray-500">
                                    No credit card required • Results in ~60 seconds
                                </p>
                            </form>
                        </div>
                    )}

                    {/* Features */}
                    <div className="mt-16 grid md:grid-cols-3 gap-6 text-center">
                        <div>
                            <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                                ⚡
                            </div>
                            <h3 className="font-semibold mb-2">Fast Analysis</h3>
                            <p className="text-gray-600 text-sm">Get results in under 60 seconds</p>
                        </div>
                        <div>
                            <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                                📊
                            </div>
                            <h3 className="font-semibold mb-2">Detailed Report</h3>
                            <p className="text-gray-600 text-sm">100+ SEO checks and recommendations</p>
                        </div>
                        <div>
                            <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                                📧
                            </div>
                            <h3 className="font-semibold mb-2">PDF Delivered</h3>
                            <p className="text-gray-600 text-sm">Beautiful report sent to your email</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
