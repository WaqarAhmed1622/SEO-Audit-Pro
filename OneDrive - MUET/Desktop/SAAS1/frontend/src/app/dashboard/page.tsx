'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    FileSearch,
    TrendingUp,
    Clock,
    CheckCircle2,
    AlertCircle,
    ArrowUpRight,
    BarChart3
} from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

export default function DashboardPage() {
    const [stats, setStats] = useState({
        totalAudits: 0,
        completedAudits: 0,
        averageScore: 0,
        auditsThisMonth: 0,
    });
    const [recentAudits, setRecentAudits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulated data - in production, fetch from API
        setStats({
            totalAudits: 47,
            completedAudits: 45,
            averageScore: 68,
            auditsThisMonth: 12,
        });

        setRecentAudits([
            { id: '1', url: 'example.com', score: 85, status: 'COMPLETE', createdAt: new Date() },
            { id: '2', url: 'test-site.org', score: 62, status: 'COMPLETE', createdAt: new Date() },
            { id: '3', url: 'mywebsite.io', score: null, status: 'PROCESSING', createdAt: new Date() },
            { id: '4', url: 'demo-app.com', score: 78, status: 'COMPLETE', createdAt: new Date() },
        ]);

        setLoading(false);
    }, []);

    // Chart data
    const lineChartData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Audits',
                data: [5, 8, 12, 9, 15, 12],
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
            },
        ],
    };

    const doughnutData = {
        labels: ['Technical', 'On-Page', 'Performance', 'Security', 'Mobile'],
        datasets: [
            {
                data: [75, 68, 82, 90, 72],
                backgroundColor: [
                    '#3B82F6',
                    '#8B5CF6',
                    '#10B981',
                    '#F59E0B',
                    '#EC4899',
                ],
            },
        ],
    };

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-600">Welcome back! Here's your SEO overview.</p>
                </div>
                <Link href="/dashboard/new-audit" className="btn btn-primary mt-4 md:mt-0">
                    <FileSearch className="w-4 h-4 mr-2" />
                    Run New Audit
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Audits"
                    value={stats.totalAudits}
                    icon={<FileSearch className="w-6 h-6" />}
                    color="blue"
                />
                <StatCard
                    title="Completed"
                    value={stats.completedAudits}
                    icon={<CheckCircle2 className="w-6 h-6" />}
                    color="green"
                />
                <StatCard
                    title="Average Score"
                    value={stats.averageScore}
                    suffix="/100"
                    icon={<TrendingUp className="w-6 h-6" />}
                    color="purple"
                />
                <StatCard
                    title="This Month"
                    value={stats.auditsThisMonth}
                    icon={<Clock className="w-6 h-6" />}
                    color="orange"
                />
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
                <div className="card">
                    <h3 className="text-lg font-semibold mb-4">Audits Over Time</h3>
                    <div className="h-64">
                        <Line
                            data={lineChartData}
                            options={{
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                    y: { beginAtZero: true }
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="card">
                    <h3 className="text-lg font-semibold mb-4">Average Scores by Category</h3>
                    <div className="h-64 flex items-center justify-center">
                        <Doughnut
                            data={doughnutData}
                            options={{
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                    }
                                }
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Recent Audits */}
            <div className="card">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Recent Audits</h3>
                    <Link href="/dashboard/audits" className="text-primary-600 hover:underline text-sm font-medium">
                        View all
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-sm text-gray-500 border-b">
                                <th className="pb-3 font-medium">URL</th>
                                <th className="pb-3 font-medium">Score</th>
                                <th className="pb-3 font-medium">Status</th>
                                <th className="pb-3 font-medium">Date</th>
                                <th className="pb-3 font-medium"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentAudits.map((audit) => (
                                <tr key={audit.id} className="border-b last:border-0">
                                    <td className="py-4">
                                        <span className="font-medium">{audit.url}</span>
                                    </td>
                                    <td className="py-4">
                                        {audit.score !== null ? (
                                            <span className={`font-semibold ${audit.score >= 80 ? 'text-success-500' :
                                                    audit.score >= 50 ? 'text-warning-500' : 'text-danger-500'
                                                }`}>
                                                {audit.score}/100
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">—</span>
                                        )}
                                    </td>
                                    <td className="py-4">
                                        <StatusBadge status={audit.status} />
                                    </td>
                                    <td className="py-4 text-gray-500">
                                        {new Date(audit.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="py-4">
                                        <Link
                                            href={`/dashboard/audits/${audit.id}`}
                                            className="text-primary-600 hover:underline"
                                        >
                                            <ArrowUpRight className="w-4 h-4" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatCard({
    title,
    value,
    suffix = '',
    icon,
    color
}: {
    title: string;
    value: number;
    suffix?: string;
    icon: React.ReactNode;
    color: 'blue' | 'green' | 'purple' | 'orange';
}) {
    const colors = {
        blue: 'bg-primary-100 text-primary-600',
        green: 'bg-success-50 text-success-500',
        purple: 'bg-purple-100 text-purple-600',
        orange: 'bg-warning-50 text-warning-500',
    };

    return (
        <div className="card">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-gray-500 text-sm">{title}</p>
                    <p className="text-3xl font-bold mt-1">
                        {value}{suffix}
                    </p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
                    {icon}
                </div>
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
            {status.charAt(0) + status.slice(1).toLowerCase()}
        </span>
    );
}
