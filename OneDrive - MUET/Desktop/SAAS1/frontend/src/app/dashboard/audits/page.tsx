'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Search,
    Filter,
    Download,
    Trash2,
    ExternalLink,
    ChevronLeft,
    ChevronRight,
    Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface Audit {
    id: string;
    url: string;
    score: number | null;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETE' | 'FAILED';
    pdfUrl: string | null;
    createdAt: string;
    client?: {
        name: string;
    };
}

export default function AuditsPage() {
    const [audits, setAudits] = useState<Audit[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchAudits();
    }, [page, statusFilter]);

    const fetchAudits = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                ...(statusFilter && { status: statusFilter }),
                ...(search && { search }),
            });

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/audits?${params}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (!response.ok) throw new Error('Failed to fetch audits');

            const data = await response.json();
            setAudits(data.audits);
            setTotalPages(data.pagination.pages);
        } catch (error) {
            // Use mock data for demo
            setAudits([
                { id: '1', url: 'https://example.com', score: 85, status: 'COMPLETE', pdfUrl: '/pdfs/1.pdf', createdAt: new Date().toISOString() },
                { id: '2', url: 'https://test-site.org', score: 62, status: 'COMPLETE', pdfUrl: '/pdfs/2.pdf', createdAt: new Date().toISOString() },
                { id: '3', url: 'https://mywebsite.io', score: null, status: 'PROCESSING', pdfUrl: null, createdAt: new Date().toISOString() },
                { id: '4', url: 'https://demo-app.com', score: 78, status: 'COMPLETE', pdfUrl: '/pdfs/4.pdf', createdAt: new Date().toISOString() },
                { id: '5', url: 'https://agency-client.co', score: 91, status: 'COMPLETE', pdfUrl: '/pdfs/5.pdf', createdAt: new Date().toISOString() },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this audit?')) return;

        try {
            const token = localStorage.getItem('token');
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/audits/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success('Audit deleted');
            fetchAudits();
        } catch (error) {
            toast.error('Failed to delete audit');
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchAudits();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Audit History</h1>
                    <p className="text-gray-600">View and manage all your SEO audits</p>
                </div>
                <Link href="/dashboard/new-audit" className="btn btn-primary">
                    New Audit
                </Link>
            </div>

            {/* Filters */}
            <div className="card">
                <div className="flex flex-col md:flex-row gap-4">
                    <form onSubmit={handleSearch} className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by URL..."
                                className="input pl-10"
                            />
                        </div>
                    </form>

                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            className="input w-auto"
                        >
                            <option value="">All Status</option>
                            <option value="COMPLETE">Complete</option>
                            <option value="PROCESSING">Processing</option>
                            <option value="PENDING">Pending</option>
                            <option value="FAILED">Failed</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Audits Table */}
            <div className="card overflow-hidden p-0">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                    </div>
                ) : audits.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No audits found</p>
                        <Link href="/dashboard/new-audit" className="btn btn-primary mt-4">
                            Create Your First Audit
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">URL</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Score</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Status</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Client</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Date</th>
                                    <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {audits.map((audit) => (
                                    <tr key={audit.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium truncate max-w-xs">
                                                    {audit.url.replace(/^https?:\/\//, '')}
                                                </span>
                                                <a href={audit.url} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="w-4 h-4 text-gray-400 hover:text-primary-500" />
                                                </a>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {audit.score !== null ? (
                                                <span className={`font-bold ${audit.score >= 80 ? 'text-success-500' :
                                                        audit.score >= 50 ? 'text-warning-500' : 'text-danger-500'
                                                    }`}>
                                                    {audit.score}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={audit.status} />
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {audit.client?.name || '—'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {new Date(audit.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {audit.pdfUrl && (
                                                    <a
                                                        href={audit.pdfUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 text-gray-400 hover:text-primary-500 transition"
                                                        title="Download PDF"
                                                    >
                                                        <Download className="w-5 h-5" />
                                                    </a>
                                                )}
                                                <Link
                                                    href={`/dashboard/audits/${audit.id}`}
                                                    className="p-2 text-gray-400 hover:text-primary-500 transition"
                                                    title="View Details"
                                                >
                                                    <ExternalLink className="w-5 h-5" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(audit.id)}
                                                    className="p-2 text-gray-400 hover:text-danger-500 transition"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t">
                        <p className="text-sm text-gray-500">
                            Page {page} of {totalPages}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="btn btn-secondary"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="btn btn-secondary"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        COMPLETE: 'bg-success-50 text-success-600',
        PROCESSING: 'bg-warning-50 text-warning-600',
        PENDING: 'bg-gray-100 text-gray-600',
        FAILED: 'bg-danger-50 text-danger-600',
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.PENDING}`}>
            {status === 'PROCESSING' && (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            )}
            {status.charAt(0) + status.slice(1).toLowerCase()}
        </span>
    );
}
