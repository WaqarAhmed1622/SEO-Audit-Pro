'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
    Code,
    Copy,
    Check,
    Plus,
    Trash2,
    Settings,
    Eye,
    Loader2,
    X
} from 'lucide-react';
import { toast } from 'sonner';

interface Widget {
    id: string;
    name: string;
    primaryColor: string;
    buttonText: string;
    successMessage: string;
    requireEmail: boolean;
    requireName: boolean;
    isActive: boolean;
    leads: any[];
    createdAt: string;
}

export default function WidgetPage() {
    const [widgets, setWidgets] = useState<Widget[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
    const [copied, setCopied] = useState(false);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<{
        name: string;
        primaryColor: string;
        buttonText: string;
        successMessage: string;
        requireEmail: boolean;
        requireName: boolean;
    }>();

    useEffect(() => {
        fetchWidgets();
    }, []);

    const fetchWidgets = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/widget`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setWidgets(data);
            }
        } catch (error) {
            // Mock data
            setWidgets([
                {
                    id: '1',
                    name: 'Homepage Widget',
                    primaryColor: '#3B82F6',
                    buttonText: 'Get Free SEO Audit',
                    successMessage: 'Your audit is being generated!',
                    requireEmail: true,
                    requireName: false,
                    isActive: true,
                    leads: [{ email: 'lead@example.com' }],
                    createdAt: new Date().toISOString()
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: any) => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/widget`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('Failed to create widget');

            toast.success('Widget created successfully');
            setShowModal(false);
            reset();
            fetchWidgets();
        } catch (error) {
            toast.error('Failed to create widget');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this widget?')) return;

        try {
            const token = localStorage.getItem('token');
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/widget/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Widget deleted');
            fetchWidgets();
        } catch (error) {
            toast.error('Failed to delete widget');
        }
    };

    const copyEmbedCode = (widgetId: string) => {
        const embedCode = `<script src="${process.env.NEXT_PUBLIC_API_URL || 'https://app.seoaudit.com'}/widget.js" data-widget-id="${widgetId}"></script>`;
        navigator.clipboard.writeText(embedCode);
        setCopied(true);
        toast.success('Embed code copied!');
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Embeddable Widget</h1>
                    <p className="text-gray-600">Capture leads with an SEO audit widget on your website</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn btn-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Widget
                </button>
            </div>

            {/* Widgets List */}
            {widgets.length === 0 ? (
                <div className="card text-center py-12">
                    <Code className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No widgets created yet</p>
                    <button onClick={() => setShowModal(true)} className="btn btn-primary">
                        Create Your First Widget
                    </button>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-6">
                    {widgets.map((widget) => (
                        <div key={widget.id} className="card">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="font-semibold text-lg">{widget.name}</h3>
                                    <p className="text-sm text-gray-500">
                                        {widget.leads?.length || 0} leads captured
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    {widget.isActive ? (
                                        <span className="text-xs bg-success-50 text-success-600 px-2 py-1 rounded-full">
                                            Active
                                        </span>
                                    ) : (
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                            Inactive
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Widget Preview */}
                            <div
                                className="rounded-lg border p-4 mb-4"
                                style={{ backgroundColor: '#f9fafb' }}
                            >
                                <div className="text-center">
                                    <p className="text-sm font-medium mb-2">Free SEO Audit</p>
                                    <div className="h-8 bg-gray-200 rounded mb-2"></div>
                                    <button
                                        className="w-full py-2 rounded text-white text-sm font-medium"
                                        style={{ backgroundColor: widget.primaryColor }}
                                    >
                                        {widget.buttonText}
                                    </button>
                                </div>
                            </div>

                            {/* Embed Code */}
                            <div className="bg-gray-900 rounded-lg p-3 mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-gray-400">Embed Code</span>
                                    <button
                                        onClick={() => copyEmbedCode(widget.id)}
                                        className="text-gray-400 hover:text-white transition"
                                    >
                                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                                <code className="text-xs text-green-400 break-all">
                                    {`<script src="https://app.seoaudit.com/widget.js" data-widget-id="${widget.id}"></script>`}
                                </code>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setSelectedWidget(widget)}
                                    className="btn btn-secondary flex-1"
                                >
                                    <Settings className="w-4 h-4 mr-2" />
                                    Configure
                                </button>
                                <button
                                    onClick={() => handleDelete(widget.id)}
                                    className="btn btn-secondary text-danger-500"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Widget Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Create Widget</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Widget Name *</label>
                                <input
                                    type="text"
                                    {...register('name', { required: 'Name is required' })}
                                    className="input"
                                    placeholder="Homepage Widget"
                                />
                                {errors.name && (
                                    <p className="text-danger-500 text-sm mt-1">{errors.name.message}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Button Color</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        {...register('primaryColor')}
                                        defaultValue="#3B82F6"
                                        className="w-12 h-10 rounded cursor-pointer border-0"
                                    />
                                    <input
                                        type="text"
                                        {...register('primaryColor')}
                                        defaultValue="#3B82F6"
                                        className="input flex-1"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Button Text</label>
                                <input
                                    type="text"
                                    {...register('buttonText')}
                                    defaultValue="Get Free SEO Audit"
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Success Message</label>
                                <input
                                    type="text"
                                    {...register('successMessage')}
                                    defaultValue="Your audit is being generated!"
                                    className="input"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" {...register('requireEmail')} defaultChecked className="rounded" />
                                    <span className="text-sm">Require email address</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" {...register('requireName')} className="rounded" />
                                    <span className="text-sm">Require name</span>
                                </label>
                            </div>
                            <div className="flex gap-3 justify-end pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className="btn btn-primary">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Create Widget
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
