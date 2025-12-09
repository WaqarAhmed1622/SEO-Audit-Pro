import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear token and redirect to login
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authApi = {
    login: (data: { email: string; password: string }) =>
        api.post('/api/auth/login', data),
    signup: (data: { name: string; email: string; password: string }) =>
        api.post('/api/auth/signup', data),
    verifyEmail: (token: string) =>
        api.post('/api/auth/verify-email', { token }),
    forgotPassword: (email: string) =>
        api.post('/api/auth/forgot-password', { email }),
    resetPassword: (token: string, password: string) =>
        api.post('/api/auth/reset-password', { token, password }),
    getMe: () =>
        api.get('/api/auth/me'),
};

// Audits API
export const auditsApi = {
    create: (data: { url: string; clientId?: string }) =>
        api.post('/api/audits', data),
    list: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
        api.get('/api/audits', { params }),
    get: (id: string) =>
        api.get(`/api/audits/${id}`),
    delete: (id: string) =>
        api.delete(`/api/audits/${id}`),
    regeneratePdf: (id: string) =>
        api.post(`/api/audits/${id}/regenerate`),
};

// Branding API
export const brandingApi = {
    get: () =>
        api.get('/api/branding'),
    update: (data: any) =>
        api.post('/api/branding', data),
    uploadLogo: (file: File) => {
        const formData = new FormData();
        formData.append('logo', file);
        return api.post('/api/branding/logo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
};

// Clients API
export const clientsApi = {
    list: (params?: { page?: number; limit?: number; search?: string }) =>
        api.get('/api/clients', { params }),
    create: (data: { name: string; email: string; company?: string; phone?: string }) =>
        api.post('/api/clients', data),
    get: (id: string) =>
        api.get(`/api/clients/${id}`),
    update: (id: string, data: any) =>
        api.put(`/api/clients/${id}`, data),
    delete: (id: string) =>
        api.delete(`/api/clients/${id}`),
    enablePortal: (id: string) =>
        api.post(`/api/clients/${id}/portal`),
};

// Team API
export const teamApi = {
    list: () =>
        api.get('/api/team'),
    invite: (data: { email: string; role?: string }) =>
        api.post('/api/team/invite', data),
    acceptInvite: (token: string) =>
        api.post('/api/team/accept-invite', { token }),
    removeMember: (userId: string) =>
        api.delete(`/api/team/${userId}`),
    updateRole: (userId: string, role: string) =>
        api.put(`/api/team/${userId}/role`, { role }),
    cancelInvite: (id: string) =>
        api.delete(`/api/team/invite/${id}`),
};

// Billing API
export const billingApi = {
    getPlans: () =>
        api.get('/api/billing/plans'),
    getSubscription: () =>
        api.get('/api/billing'),
    createCheckout: (planId: string) =>
        api.post('/api/billing/checkout', { planId }),
    createPortal: () =>
        api.post('/api/billing/portal'),
};

// Widget API
export const widgetApi = {
    list: () =>
        api.get('/api/widget'),
    create: (data: any) =>
        api.post('/api/widget', data),
    get: (id: string) =>
        api.get(`/api/widget/${id}`),
    update: (id: string, data: any) =>
        api.put(`/api/widget/${id}`, data),
    delete: (id: string) =>
        api.delete(`/api/widget/${id}`),
    getEmbed: (id: string) =>
        api.get(`/api/widget/${id}/embed`),
};

export default api;
