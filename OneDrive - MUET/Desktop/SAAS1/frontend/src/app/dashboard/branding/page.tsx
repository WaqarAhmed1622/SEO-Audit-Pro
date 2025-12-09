'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Palette, Upload, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BrandingForm {
    companyName: string;
    tagline: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    footerText: string;
}

export default function BrandingPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);

    const { register, handleSubmit, reset, watch } = useForm<BrandingForm>();
    const watchedColors = watch(['primaryColor', 'secondaryColor', 'accentColor']);

    useEffect(() => {
        fetchBranding();
    }, []);

    const fetchBranding = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/branding`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data) {
                    reset({
                        companyName: data.companyName || '',
                        tagline: data.tagline || '',
                        primaryColor: data.primaryColor || '#3B82F6',
                        secondaryColor: data.secondaryColor || '#1E40AF',
                        accentColor: data.accentColor || '#10B981',
                        footerText: data.footerText || '',
                    });
                    setLogoUrl(data.logoUrl);
                }
            }
        } catch (error) {
            console.error('Failed to fetch branding');
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: BrandingForm) => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/branding`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('Failed to save branding');
            toast.success('Branding updated successfully');
        } catch (error) {
            toast.error('Failed to update branding');
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!['image/png', 'image/jpeg', 'image/svg+xml'].includes(file.type)) {
            toast.error('Please upload a PNG, JPG, or SVG file');
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error('File size must be less than 2MB');
            return;
        }

        setUploadingLogo(true);
        try {
            // For demo, create object URL
            const objectUrl = URL.createObjectURL(file);
            setLogoUrl(objectUrl);

            // In production, upload to server
            // const formData = new FormData();
            // formData.append('logo', file);
            // await fetch('/api/branding/logo', { method: 'POST', body: formData });

            toast.success('Logo uploaded successfully');
        } catch (error) {
            toast.error('Failed to upload logo');
        } finally {
            setUploadingLogo(false);
        }
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
            <div>
                <h1 className="text-2xl font-bold text-gray-900">White-Label Branding</h1>
                <p className="text-gray-600">Customize your reports and client portal with your brand</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Settings Form */}
                <div className="lg:col-span-2 space-y-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Logo Upload */}
                        <div className="card">
                            <h3 className="font-semibold mb-4">Company Logo</h3>
                            <div className="flex items-start gap-6">
                                <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                                    {logoUrl ? (
                                        <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                                    ) : (
                                        <Palette className="w-8 h-8 text-gray-400" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <label className="btn btn-secondary cursor-pointer">
                                        {uploadingLogo ? (
                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        ) : (
                                            <Upload className="w-4 h-4 mr-2" />
                                        )}
                                        Upload Logo
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/svg+xml"
                                            onChange={handleLogoUpload}
                                            className="hidden"
                                        />
                                    </label>
                                    <p className="text-sm text-gray-500 mt-2">
                                        PNG, JPG, or SVG. Max 2MB. Recommended: 200×50px
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Company Info */}
                        <div className="card">
                            <h3 className="font-semibold mb-4">Company Information</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Company Name</label>
                                    <input
                                        type="text"
                                        {...register('companyName')}
                                        className="input"
                                        placeholder="Your Agency Name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Tagline</label>
                                    <input
                                        type="text"
                                        {...register('tagline')}
                                        className="input"
                                        placeholder="SEO Excellence Delivered"
                                    />
                                </div>
                            </div>
                            <div className="mt-4">
                                <label className="block text-sm font-medium mb-2">Footer Text</label>
                                <input
                                    type="text"
                                    {...register('footerText')}
                                    className="input"
                                    placeholder="© 2024 Your Agency. All rights reserved."
                                />
                            </div>
                        </div>

                        {/* Colors */}
                        <div className="card">
                            <h3 className="font-semibold mb-4">Brand Colors</h3>
                            <div className="grid md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Primary Color</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            {...register('primaryColor')}
                                            className="w-12 h-10 rounded cursor-pointer border-0"
                                        />
                                        <input
                                            type="text"
                                            {...register('primaryColor')}
                                            className="input flex-1"
                                            placeholder="#3B82F6"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Secondary Color</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            {...register('secondaryColor')}
                                            className="w-12 h-10 rounded cursor-pointer border-0"
                                        />
                                        <input
                                            type="text"
                                            {...register('secondaryColor')}
                                            className="input flex-1"
                                            placeholder="#1E40AF"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Accent Color</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            {...register('accentColor')}
                                            className="w-12 h-10 rounded cursor-pointer border-0"
                                        />
                                        <input
                                            type="text"
                                            {...register('accentColor')}
                                            className="input flex-1"
                                            placeholder="#10B981"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button type="submit" disabled={saving} className="btn btn-primary">
                            {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <Save className="w-4 h-4 mr-2" />
                            )}
                            Save Changes
                        </button>
                    </form>
                </div>

                {/* Preview */}
                <div className="lg:col-span-1">
                    <div className="card sticky top-24">
                        <h3 className="font-semibold mb-4">Preview</h3>
                        <div
                            className="rounded-lg overflow-hidden border"
                            style={{ backgroundColor: watchedColors[0] || '#3B82F6' }}
                        >
                            <div className="p-6 text-white text-center">
                                {logoUrl ? (
                                    <img src={logoUrl} alt="Logo" className="h-8 mx-auto mb-3" />
                                ) : (
                                    <div className="h-8 w-24 bg-white/20 rounded mx-auto mb-3" />
                                )}
                                <h4 className="text-lg font-semibold">SEO Audit Report</h4>
                                <p className="text-sm opacity-80">example.com</p>
                                <div
                                    className="w-20 h-20 rounded-full mx-auto mt-4 flex items-center justify-center text-2xl font-bold"
                                    style={{ backgroundColor: 'white', color: watchedColors[0] || '#3B82F6' }}
                                >
                                    85
                                </div>
                            </div>
                            <div className="bg-white p-4 text-center text-xs text-gray-500">
                                Powered by Your Agency
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
