'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
    User,
    Lock,
    Bell,
    Key,
    Save,
    Eye,
    EyeOff,
    Loader2,
    CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface ProfileForm {
    name: string;
    email: string;
}

interface PasswordForm {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export default function SettingsPage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');

    const { register: registerProfile, handleSubmit: handleProfileSubmit, reset: resetProfile } = useForm<ProfileForm>();
    const { register: registerPassword, handleSubmit: handlePasswordSubmit, reset: resetPassword, watch, formState: { errors: passwordErrors } } = useForm<PasswordForm>();

    const newPassword = watch('newPassword');

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            resetProfile({ name: userData.name, email: userData.email });
        }
        setLoading(false);
    }, [resetProfile]);

    const onProfileSubmit = async (data: ProfileForm) => {
        setSavingProfile(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('Failed to update profile');

            const updatedUser = { ...user, ...data };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            toast.success('Profile updated successfully');
        } catch (error) {
            toast.error('Failed to update profile');
        } finally {
            setSavingProfile(false);
        }
    };

    const onPasswordSubmit = async (data: PasswordForm) => {
        setSavingPassword(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: data.currentPassword,
                    newPassword: data.newPassword
                })
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'Failed to change password');
            }

            toast.success('Password changed successfully');
            resetPassword();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSavingPassword(false);
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
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600">Manage your account settings and preferences</p>
            </div>

            {/* Tabs */}
            <div className="border-b">
                <div className="flex gap-4">
                    {[
                        { id: 'profile', label: 'Profile', icon: User },
                        { id: 'security', label: 'Security', icon: Lock },
                        { id: 'notifications', label: 'Notifications', icon: Bell },
                        { id: 'api', label: 'API Keys', icon: Key },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition ${activeTab === tab.id
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <div className="card max-w-2xl">
                    <h3 className="font-semibold text-lg mb-6">Profile Information</h3>
                    <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
                        <div className="flex items-center gap-6 mb-6">
                            <div className="w-20 h-20 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-2xl font-bold">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <button type="button" className="btn btn-secondary">Change Avatar</button>
                                <p className="text-sm text-gray-500 mt-1">JPG or PNG. Max 2MB.</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Full Name</label>
                            <input
                                type="text"
                                {...registerProfile('name', { required: true })}
                                className="input"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Email Address</label>
                            <input
                                type="email"
                                {...registerProfile('email', { required: true })}
                                className="input"
                                disabled
                            />
                            <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
                        </div>

                        <button type="submit" disabled={savingProfile} className="btn btn-primary">
                            {savingProfile ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Save Changes
                        </button>
                    </form>
                </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
                <div className="space-y-6 max-w-2xl">
                    <div className="card">
                        <h3 className="font-semibold text-lg mb-6">Change Password</h3>
                        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Current Password</label>
                                <div className="relative">
                                    <input
                                        type={showCurrentPassword ? 'text' : 'password'}
                                        {...registerPassword('currentPassword', { required: 'Current password is required' })}
                                        className="input pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    >
                                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showNewPassword ? 'text' : 'password'}
                                        {...registerPassword('newPassword', {
                                            required: 'New password is required',
                                            minLength: { value: 8, message: 'Password must be at least 8 characters' }
                                        })}
                                        className="input pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    >
                                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {passwordErrors.newPassword && (
                                    <p className="text-danger-500 text-sm mt-1">{passwordErrors.newPassword.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                                <input
                                    type="password"
                                    {...registerPassword('confirmPassword', {
                                        required: 'Please confirm your password',
                                        validate: value => value === newPassword || 'Passwords do not match'
                                    })}
                                    className="input"
                                />
                                {passwordErrors.confirmPassword && (
                                    <p className="text-danger-500 text-sm mt-1">{passwordErrors.confirmPassword.message}</p>
                                )}
                            </div>

                            <button type="submit" disabled={savingPassword} className="btn btn-primary">
                                {savingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                                Change Password
                            </button>
                        </form>
                    </div>

                    <div className="card">
                        <h3 className="font-semibold text-lg mb-4">Two-Factor Authentication</h3>
                        <p className="text-gray-600 mb-4">Add an extra layer of security to your account.</p>
                        <button className="btn btn-secondary">Enable 2FA</button>
                    </div>

                    <div className="card">
                        <h3 className="font-semibold text-lg mb-4">Active Sessions</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-success-500" />
                                    <div>
                                        <p className="font-medium">Current Session</p>
                                        <p className="text-sm text-gray-500">Chrome on Windows • Last active now</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
                <div className="card max-w-2xl">
                    <h3 className="font-semibold text-lg mb-6">Email Notifications</h3>
                    <div className="space-y-4">
                        {[
                            { id: 'audit_complete', label: 'Audit Complete', desc: 'Get notified when your SEO audit is ready' },
                            { id: 'weekly_summary', label: 'Weekly Summary', desc: 'Receive a weekly summary of your audits' },
                            { id: 'team_activity', label: 'Team Activity', desc: 'Get notified about team member actions' },
                            { id: 'product_updates', label: 'Product Updates', desc: 'Learn about new features and improvements' },
                            { id: 'billing_alerts', label: 'Billing Alerts', desc: 'Important updates about your subscription' },
                        ].map((item) => (
                            <div key={item.id} className="flex items-center justify-between py-3 border-b last:border-0">
                                <div>
                                    <p className="font-medium">{item.label}</p>
                                    <p className="text-sm text-gray-500">{item.desc}</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" defaultChecked className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* API Keys Tab */}
            {activeTab === 'api' && (
                <div className="card max-w-2xl">
                    <h3 className="font-semibold text-lg mb-6">API Keys</h3>
                    <p className="text-gray-600 mb-6">
                        Use API keys to integrate SEO Audit Pro with your applications.
                    </p>

                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Your API Key</span>
                            <button className="text-primary-600 text-sm hover:underline">Regenerate</button>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="password"
                                value="sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                readOnly
                                className="input flex-1 font-mono text-sm"
                            />
                            <button className="btn btn-secondary">Copy</button>
                        </div>
                    </div>

                    <div className="bg-warning-50 text-warning-900 rounded-lg p-4">
                        <h4 className="font-medium mb-1">Keep Your API Key Secure</h4>
                        <p className="text-sm">
                            Never share your API key publicly or commit it to version control.
                            If your key is compromised, regenerate it immediately.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
