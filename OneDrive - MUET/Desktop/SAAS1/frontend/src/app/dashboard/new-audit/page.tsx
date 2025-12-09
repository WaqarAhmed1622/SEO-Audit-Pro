'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Globe, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface AuditForm {
    url: string;
    clientId?: string;
}

export default function NewAuditPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [auditStatus, setAuditStatus] = useState<'idle' | 'processing' | 'complete' | 'error'>('idle');
    const [auditId, setAuditId] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors } } = useForm<AuditForm>();

    const onSubmit = async (data: AuditForm) => {
        setIsLoading(true);
        setAuditStatus('processing');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/audits`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create audit');
            }

            setAuditId(result.id);
            setAuditStatus('complete');
            toast.success('Audit started! You\'ll receive an email when it\'s ready.');
        } catch (error: any) {
            setAuditStatus('error');
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">New SEO Audit</h1>
                <p className="text-gray-600">Enter a URL to generate a comprehensive SEO audit report.</p>
            </div>

            <div className="card">
                {auditStatus === 'complete' ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-success-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-success-500" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">Audit Started!</h2>
                        <p className="text-gray-600 mb-6">
                            Your SEO audit is being processed. This usually takes 60-90 seconds.
                            You'll receive an email when it's ready.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <a
                                href={`/dashboard/audits/${auditId}`}
                                className="btn btn-primary"
                            >
                                View Audit Status
                            </a>
                            <button
                                onClick={() => {
                                    setAuditStatus('idle');
                                    setAuditId(null);
                                }}
                                className="btn btn-secondary"
                            >
                                Run Another Audit
                            </button>
                        </div>
                    </div>
                ) : (
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

                        {auditStatus === 'error' && (
                            <div className="flex items-center gap-3 bg-danger-50 text-danger-600 px-4 py-3 rounded-lg">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span>Something went wrong. Please try again.</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn btn-primary w-full py-3 text-lg"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Analyzing...
                                </span>
                            ) : (
                                'Start SEO Audit'
                            )}
                        </button>

                        <p className="text-center text-sm text-gray-500">
                            Audit typically takes 60-90 seconds to complete
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
}
