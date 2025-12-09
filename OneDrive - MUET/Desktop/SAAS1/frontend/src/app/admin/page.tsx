'use client';

import { useEffect, useState } from 'react';
import {
    Users,
    FileSearch,
    DollarSign,
    Globe,
    TrendingUp,
    AlertCircle,
    Shield,
    Loader2
} from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface DashboardStats {
    totalUsers: number;
    totalAudits: number;
    totalRevenue: number;
    activeOrgs: number;
    auditsToday: number;
    signupsToday: number;
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/dashboard`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            // Mock data
            setStats({
                totalUsers: 1247,
                totalAudits: 8459,
                totalRevenue: 45890,
                activeOrgs: 312,
                auditsToday: 127,
                signupsToday: 14,
            });
            setRecentActivity([
                { type: 'signup', message: 'New user registered: john@example.com', time: '2 mins ago' },
                { type: 'audit', message: 'Audit completed for example.com (Score: 85)', time: '5 mins ago' },
                { type: 'payment', message: 'Pro subscription: $79 from Acme Corp', time: '12 mins ago' },
                { type: 'audit', message: 'Audit completed for test.org (Score: 72)', time: '15 mins ago' },
                { type: 'signup', message: 'New user registered: jane@company.co', time: '23 mins ago' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const chartData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                label: 'Audits',
                data: [120, 145, 132, 168, 155, 89, 127],
                backgroundColor: '#3B82F6',
            },
            {
                label: 'Signups',
                data: [12, 18, 15, 22, 19, 8, 14],
                backgroundColor: '#10B981',
            },
        ],
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                        <p className="text-gray-600">Platform overview and management</p>
                    </div>
                    <div className="flex items-center gap-2 bg-warning-50 text-warning-700 px-4 py-2 rounded-lg">
                        <Shield className="w-5 h-5" />
                        <span className="font-medium">Admin Mode</span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Users"
                        value={stats?.totalUsers || 0}
                        icon={<Users className="w-6 h-6" />}
                        color="blue"
                        subtext={`+${stats?.signupsToday} today`}
                    />
                    <StatCard
                        title="Total Audits"
                        value={stats?.totalAudits || 0}
                        icon={<FileSearch className="w-6 h-6" />}
                        color="green"
                        subtext={`+${stats?.auditsToday} today`}
                    />
                    <StatCard
                        title="MRR"
                        value={`$${stats?.totalRevenue?.toLocaleString() || 0}`}
                        icon={<DollarSign className="w-6 h-6" />}
                        color="purple"
                        prefix=""
                    />
                    <StatCard
                        title="Active Orgs"
                        value={stats?.activeOrgs || 0}
                        icon={<Globe className="w-6 h-6" />}
                        color="orange"
                    />
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Chart */}
                    <div className="lg:col-span-2 card">
                        <h3 className="font-semibold mb-4">Weekly Activity</h3>
                        <div className="h-64">
                            <Bar
                                data={chartData}
                                options={{
                                    maintainAspectRatio: false,
                                    scales: { y: { beginAtZero: true } }
                                }}
                            />
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="card">
                        <h3 className="font-semibold mb-4">Recent Activity</h3>
                        <div className="space-y-4">
                            {recentActivity.map((activity, index) => (
                                <div key={index} className="flex gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${activity.type === 'signup' ? 'bg-success-50 text-success-600' :
                                            activity.type === 'payment' ? 'bg-purple-100 text-purple-600' :
                                                'bg-primary-100 text-primary-600'
                                        }`}>
                                        {activity.type === 'signup' ? <Users className="w-4 h-4" /> :
                                            activity.type === 'payment' ? <DollarSign className="w-4 h-4" /> :
                                                <FileSearch className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <p className="text-sm">{activity.message}</p>
                                        <p className="text-xs text-gray-500">{activity.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-4 gap-4">
                    <QuickAction href="/admin/users" icon={<Users />} label="Manage Users" />
                    <QuickAction href="/admin/analytics" icon={<TrendingUp />} label="View Analytics" />
                    <QuickAction href="/admin/billing" icon={<DollarSign />} label="Billing Overview" />
                    <QuickAction href="/admin/logs" icon={<AlertCircle />} label="System Logs" />
                </div>
            </div>
        </div>
    );
}

function StatCard({
    title,
    value,
    icon,
    color,
    subtext,
    prefix
}: {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: 'blue' | 'green' | 'purple' | 'orange';
    subtext?: string;
    prefix?: string;
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
                    <p className="text-3xl font-bold mt-1">{value}</p>
                    {subtext && <p className="text-sm text-success-500 mt-1">{subtext}</p>}
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

function QuickAction({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <a
            href={href}
            className="card hover:bg-gray-50 transition flex items-center gap-3"
        >
            <div className="text-gray-400">{icon}</div>
            <span className="font-medium">{label}</span>
        </a>
    );
}
