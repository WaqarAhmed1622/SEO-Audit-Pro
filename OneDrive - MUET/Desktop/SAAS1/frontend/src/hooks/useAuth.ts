'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (!token || !storedUser) {
            setLoading(false);
            return;
        }

        try {
            setUser(JSON.parse(storedUser));
        } catch (e) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }

        setLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        router.push('/dashboard');
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        router.push('/login');
    };

    const isAuthenticated = !!user;
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

    return {
        user,
        loading,
        isAuthenticated,
        isAdmin,
        login,
        logout,
    };
}

export function useRequireAuth(redirectTo = '/login') {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push(redirectTo);
        }
    }, [user, loading, router, redirectTo]);

    return { user, loading };
}
