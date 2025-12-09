'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Zap, Mail, Lock, User } from 'lucide-react';
import { toast } from 'sonner';

interface SignupForm {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export default function SignupPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, watch, formState: { errors } } = useForm<SignupForm>();
    const password = watch('password');

    const onSubmit = async (data: SignupForm) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: data.name,
                    email: data.email,
                    password: data.password,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Signup failed');
            }

            // Store token
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));

            toast.success('Account created! Please check your email to verify.');

            // Redirect to dashboard
            window.location.href = '/dashboard';
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Decorative */}
            <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-500 to-purple-600 items-center justify-center p-12">
                <div className="text-white max-w-md">
                    <h2 className="text-4xl font-bold mb-6">
                        Start Winning More Clients Today
                    </h2>
                    <p className="text-lg opacity-90 mb-8">
                        Join thousands of agencies and freelancers using SEO Audit Pro to grow their business.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/10 rounded-lg p-4 text-center">
                            <div className="text-3xl font-bold">60s</div>
                            <div className="text-sm opacity-80">Audit Generation</div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-4 text-center">
                            <div className="text-3xl font-bold">100+</div>
                            <div className="text-sm opacity-80">SEO Checks</div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-4 text-center">
                            <div className="text-3xl font-bold">5K+</div>
                            <div className="text-sm opacity-80">Happy Users</div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-4 text-center">
                            <div className="text-3xl font-bold">99%</div>
                            <div className="text-sm opacity-80">Uptime</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    <Link href="/" className="flex items-center gap-2 mb-8">
                        <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-purple-500 rounded-xl flex items-center justify-center">
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-bold text-2xl">SEO Audit Pro</span>
                    </Link>

                    <h1 className="text-3xl font-bold mb-2">Create your account</h1>
                    <p className="text-gray-600 mb-8">
                        Start your free trial. No credit card required.
                    </p>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium mb-2">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    {...register('name', { required: 'Name is required' })}
                                    className="input pl-10"
                                    placeholder="John Doe"
                                />
                            </div>
                            {errors.name && (
                                <p className="text-danger-500 text-sm mt-1">{errors.name.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    {...register('email', {
                                        required: 'Email is required',
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: 'Invalid email address'
                                        }
                                    })}
                                    className="input pl-10"
                                    placeholder="you@example.com"
                                />
                            </div>
                            {errors.email && (
                                <p className="text-danger-500 text-sm mt-1">{errors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    {...register('password', {
                                        required: 'Password is required',
                                        minLength: {
                                            value: 8,
                                            message: 'Password must be at least 8 characters'
                                        }
                                    })}
                                    className="input pl-10 pr-10"
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

                        <div>
                            <label className="block text-sm font-medium mb-2">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    {...register('confirmPassword', {
                                        required: 'Please confirm your password',
                                        validate: value => value === password || 'Passwords do not match'
                                    })}
                                    className="input pl-10"
                                    placeholder="••••••••"
                                />
                            </div>
                            {errors.confirmPassword && (
                                <p className="text-danger-500 text-sm mt-1">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        <div className="flex items-start gap-2">
                            <input type="checkbox" required className="rounded border-gray-300 mt-1" />
                            <span className="text-sm text-gray-600">
                                I agree to the{' '}
                                <Link href="/terms" className="text-primary-600 hover:underline">Terms of Service</Link>
                                {' '}and{' '}
                                <Link href="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link>
                            </span>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn btn-primary w-full py-3 text-lg"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Creating account...
                                </span>
                            ) : 'Create Account'}
                        </button>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-gray-500">Or continue with</span>
                            </div>
                        </div>

                        <button className="mt-4 w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Sign up with Google
                        </button>
                    </div>

                    <p className="text-center text-gray-600 mt-8">
                        Already have an account?{' '}
                        <Link href="/login" className="text-primary-600 font-semibold hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
