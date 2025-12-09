'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
    Users,
    Search,
    Plus,
    Mail,
    Phone,
    Building2,
    Trash2,
    ExternalLink,
    Key,
    Loader2,
    X
} from 'lucide-react';
import { toast } from 'sonner';

interface Client {
    id: string;
    name: string;
    email: string;
    company?: string;
    phone?: string;
    portalEnabled: boolean;
    _count: {
        audits: number;
    };
    createdAt: string;
}

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<{
        name: string;
        email: string;
        company?: string;
        phone?: string;
    }>();

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/clients?search=${search}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.ok) {
                const data = await response.json();
                setClients(data.clients || []);
            }
        } catch (error) {
            // Mock data
            setClients([
                { id: '1', name: 'Acme Corp', email: 'contact@acme.com', company: 'Acme Corporation', portalEnabled: true, _count: { audits: 5 }, createdAt: new Date().toISOString() },
                { id: '2', name: 'Tech Startup', email: 'hello@techstartup.io', company: 'Tech Startup Inc', portalEnabled: false, _count: { audits: 3 }, createdAt: new Date().toISOString() },
                { id: '3', name: 'Local Business', email: 'owner@localbiz.com', company: 'Local Business LLC', portalEnabled: true, _count: { audits: 8 }, createdAt: new Date().toISOString() },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: any) => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'Failed to create client');
            }

            toast.success('Client created successfully');
            setShowModal(false);
            reset();
            fetchClients();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this client?')) return;

        try {
            const token = localStorage.getItem('token');
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Client deleted');
            fetchClients();
        } catch (error) {
            toast.error('Failed to delete client');
        }
    };

    const handleEnablePortal = async (client: Client) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/${client.id}/portal`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Portal access enabled and invite sent');
            fetchClients();
        } catch (error) {
            toast.error('Failed to enable portal');
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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
                    <p className="text-gray-600">Manage your client relationships</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn btn-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Client
                </button>
            </div>

            {/* Search */}
            <div className="card">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchClients()}
                        placeholder="Search clients by name, email, or company..."
                        className="input pl-10"
                    />
                </div>
            </div>

            {/* Clients Grid */}
            {clients.length === 0 ? (
                <div className="card text-center py-12">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No clients yet</p>
                    <button onClick={() => setShowModal(true)} className="btn btn-primary">
                        Add Your First Client
                    </button>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {clients.map((client) => (
                        <div key={client.id} className="card card-hover">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold text-lg">
                                    {client.name.charAt(0)}
                                </div>
                                <div className="flex gap-2">
                                    {client.portalEnabled ? (
                                        <span className="text-xs bg-success-50 text-success-600 px-2 py-1 rounded-full">
                                            Portal Active
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => handleEnablePortal(client)}
                                            className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full hover:bg-primary-50 hover:text-primary-600 transition"
                                        >
                                            Enable Portal
                                        </button>
                                    )}
                                </div>
                            </div>

                            <h3 className="font-semibold text-lg">{client.name}</h3>
                            {client.company && (
                                <p className="text-gray-500 text-sm flex items-center gap-1">
                                    <Building2 className="w-4 h-4" />
                                    {client.company}
                                </p>
                            )}

                            <div className="mt-4 space-y-2 text-sm">
                                <p className="flex items-center gap-2 text-gray-600">
                                    <Mail className="w-4 h-4" />
                                    {client.email}
                                </p>
                                {client.phone && (
                                    <p className="flex items-center gap-2 text-gray-600">
                                        <Phone className="w-4 h-4" />
                                        {client.phone}
                                    </p>
                                )}
                            </div>

                            <div className="mt-4 pt-4 border-t flex items-center justify-between">
                                <span className="text-sm text-gray-500">
                                    {client._count.audits} audit{client._count.audits !== 1 ? 's' : ''}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setSelectedClient(client)}
                                        className="p-2 text-gray-400 hover:text-primary-500 transition"
                                        title="View Details"
                                    >
                                        <ExternalLink className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(client.id)}
                                        className="p-2 text-gray-400 hover:text-danger-500 transition"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Client Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Add New Client</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Client Name *</label>
                                <input
                                    type="text"
                                    {...register('name', { required: 'Name is required' })}
                                    className="input"
                                    placeholder="John Smith"
                                />
                                {errors.name && (
                                    <p className="text-danger-500 text-sm mt-1">{errors.name.message}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Email Address *</label>
                                <input
                                    type="email"
                                    {...register('email', { required: 'Email is required' })}
                                    className="input"
                                    placeholder="john@company.com"
                                />
                                {errors.email && (
                                    <p className="text-danger-500 text-sm mt-1">{errors.email.message}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Company</label>
                                <input
                                    type="text"
                                    {...register('company')}
                                    className="input"
                                    placeholder="ABC Company"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Phone</label>
                                <input
                                    type="tel"
                                    {...register('phone')}
                                    className="input"
                                    placeholder="+1 (555) 123-4567"
                                />
                            </div>
                            <div className="flex gap-3 justify-end pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className="btn btn-primary">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Add Client
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
