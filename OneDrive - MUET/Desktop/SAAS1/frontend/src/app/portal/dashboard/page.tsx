'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    FileSearch,
    Download,
    Calendar,
    TrendingUp,
    LogOut,
    Loader2
} from 'lucide-react';

interface Audit {
    id: string;
    url: string;
    score: number;
    status: string;
    pdfUrl: string | null;
    createdAt: string;
}

export default function ClientPortalDashboard() {
    const [client, setClient] = useState<any>(null);
    const [audits, setAudits] = useState<Audit[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedClient = localStorage.getItem('client');
        if (storedClient) {
            setClient(JSON.parse(storedClient));
        }
        fetchAudits();
    }, []);

    const fetchAudits = async () => {
        try {
            const token = localStorage.getItem('clientToken');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/portal/audits`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setAudits(data);
            }
        } catch (error) {
            // Mock data
            setAudits([
                { id: '1', url: 'https://example.com', score: 85, status: 'COMPLETE', pdfUrl: '/pdfs/1.pdf', createdAt: new Date().toISOString() },
                { id: '2', url: 'https://example.com/about', score: 72, status: 'COMPLETE', pdfUrl: '/pdfs/2.pdf', createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
                { id: '3', url: 'https://example.com/services', score: 91, status: 'COMPLETE', pdfUrl: '/pdfs/3.pdf', createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('clientToken');
        localStorage.removeItem('client');
        window.location.href = '/portal';
    };

    const averageScore = audits.length > 0
        ? Math.round(audits.reduce((sum, a) => sum + a.score, 0) / audits.length)
        : 0;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold">Your SEO Reports</h1>
                        <p className="text-sm text-gray-500">Welcome, {client?.name}</p>
                    </div>
                    <button onClick={handleLogout} className="btn btn-secondary">
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8">
                {/* Stats */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="card">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center">
                                <FileSearch className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Audits</p>
                                <p className="text-2xl font-bold">{audits.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="card">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-success-50 text-success-500 rounded-xl flex items-center justify-center">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Average Score</p>
                                <p className="text-2xl font-bold">{averageScore}/100</p>
                            </div>
                        </div>
                    </div>
                    <div className="card">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Latest Audit</p>
                                <p className="text-2xl font-bold">
                                    {audits[0] ? new Date(audits[0].createdAt).toLocaleDateString() : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Audits List */}
                <div className="card">
                    <h2 className="font-semibold text-lg mb-4">Your Audits</h2>
                    {audits.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No audits available yet.</p>
                    ) : (
                        <div className="space-y-4">
                            {audits.map((audit) => (
                                <div
                                    key={audit.id}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg ${audit.score >= 80 ? 'bg-success-50 text-success-600' :
                                                audit.score >= 50 ? 'bg-warning-50 text-warning-600' : 'bg-danger-50 text-danger-600'
                                            }`}>
                                            {audit.score}
                                        </div>
                                        <div>
                                            <p className="font-medium">{audit.url.replace(/^https?:\/\//, '')}</p>
                                            <p className="text-sm text-gray-500">
                                                {new Date(audit.createdAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <Link
                                            href={`/portal/audits/${audit.id}`}
                                            className="btn btn-secondary"
                                        >
                                            View Details
                                        </Link>
                                        {audit.pdfUrl && (
                                            <a
                                                href={audit.pdfUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-primary"
                                            >
                                                <Download className="w-4 h-4 mr-2" />
                                                PDF
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
