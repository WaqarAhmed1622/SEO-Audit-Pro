'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    FileSearch,
    History,
    Palette,
    Users,
    Building2,
    CreditCard,
    Settings,
    Code,
    LogOut,
    Menu,
    X,
    Zap,
    ChevronDown
} from 'lucide-react';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'New Audit', href: '/dashboard/new-audit', icon: FileSearch },
    { name: 'Audit History', href: '/dashboard/audits', icon: History },
    { name: 'Branding', href: '/dashboard/branding', icon: Palette },
    { name: 'Team', href: '/dashboard/team', icon: Users },
    { name: 'Clients', href: '/dashboard/clients', icon: Building2 },
    { name: 'Widget', href: '/dashboard/widget', icon: Code },
    { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const pathname = usePathname();

    useEffect(() => {
        // Get user from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-50
        transform transition-transform duration-300 lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center gap-2 px-6 py-5 border-b">
                        <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-purple-500 rounded-lg flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-lg">SEO Audit Pro</span>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-4 overflow-y-auto">
                        <ul className="space-y-1">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                                return (
                                    <li key={item.name}>
                                        <Link
                                            href={item.href}
                                            className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                        ${isActive
                                                    ? 'bg-primary-50 text-primary-600'
                                                    : 'text-gray-600 hover:bg-gray-100'
                                                }
                      `}
                                        >
                                            <item.icon className="w-5 h-5" />
                                            <span className="font-medium">{item.name}</span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

                    {/* User menu */}
                    <div className="border-t p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{user?.name || 'User'}</div>
                                <div className="text-sm text-gray-500 truncate">{user?.email}</div>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 w-full px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Top bar */}
                <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
                    <div className="flex items-center justify-between px-4 py-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        <div className="flex items-center gap-4 ml-auto">
                            <Link
                                href="/dashboard/new-audit"
                                className="btn btn-primary"
                            >
                                <FileSearch className="w-4 h-4 mr-2" />
                                New Audit
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
