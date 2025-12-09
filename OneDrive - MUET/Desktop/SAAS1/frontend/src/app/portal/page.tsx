'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface LoginForm {
    email: string;
    password: string;
}

export default function ClientPortalLoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

    const onSubmit = async (data: LoginForm) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/client-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Login failed');
            }

            localStorage.setItem('clientToken', result.token);
            localStorage.setItem('client', JSON.stringify(result.client));

            toast.success('Welcome!');
            window.location.href = '/portal/dashboard';
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
            <div className="w-full max-w-md">
                <div className="card">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lock className="w-8 h-8 text-primary-600" />
                        </div>
                        <h1 className="text-2xl font-bold">Client Portal</h1>
                        <p className="text-gray-600">Enter your credentials to access your SEO reports</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                                placeholder="your@email.com"
                            />
                            {errors.email && (
                                <p className="text-danger-500 text-sm mt-1">{errors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    {...register('password', { required: 'Password is required' })}
                                    className="input pr-10"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-danger-500 text-sm mt-1">{errors.password.message}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn btn-primary w-full py-3"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Signing in...
                                </span>
                            ) : 'Sign In'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-gray-500 mt-6">
                        Forgot your password?{' '}
                        <a href="#" className="text-primary-600 hover:underline">
                            Contact your account manager
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
