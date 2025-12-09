'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
    Users,
    Mail,
    UserPlus,
    Trash2,
    Clock,
    Shield,
    Loader2,
    X
} from 'lucide-react';
import { toast } from 'sonner';

interface TeamMember {
    id: string;
    role: string;
    user: {
        id: string;
        name: string;
        email: string;
        avatar?: string;
    };
}

interface Invite {
    id: string;
    email: string;
    role: string;
    createdAt: string;
    expiresAt: string;
}

export default function TeamPage() {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [invites, setInvites] = useState<Invite[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviting, setInviting] = useState(false);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<{ email: string; role: string }>();

    useEffect(() => {
        fetchTeam();
    }, []);

    const fetchTeam = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/team`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setMembers(data.members || []);
                setInvites(data.invites || []);
            }
        } catch (error) {
            // Mock data
            setMembers([
                { id: '1', role: 'OWNER', user: { id: '1', name: 'John Doe', email: 'john@example.com' } },
                { id: '2', role: 'ADMIN', user: { id: '2', name: 'Jane Smith', email: 'jane@example.com' } },
                { id: '3', role: 'MEMBER', user: { id: '3', name: 'Bob Wilson', email: 'bob@example.com' } },
            ]);
            setInvites([
                { id: '1', email: 'new@example.com', role: 'MEMBER', createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const onInvite = async (data: { email: string; role: string }) => {
        setInviting(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/team/invite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'Failed to send invite');
            }

            toast.success('Invitation sent!');
            setShowInviteModal(false);
            reset();
            fetchTeam();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setInviting(false);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!confirm('Are you sure you want to remove this team member?')) return;

        try {
            const token = localStorage.getItem('token');
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/team/${userId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Member removed');
            fetchTeam();
        } catch (error) {
            toast.error('Failed to remove member');
        }
    };

    const handleCancelInvite = async (inviteId: string) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/team/invite/${inviteId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Invite canceled');
            fetchTeam();
        } catch (error) {
            toast.error('Failed to cancel invite');
        }
    };

    const getRoleBadge = (role: string) => {
        const styles: Record<string, string> = {
            OWNER: 'bg-purple-100 text-purple-700',
            ADMIN: 'bg-primary-100 text-primary-700',
            MEMBER: 'bg-gray-100 text-gray-700',
        };
        return styles[role] || styles.MEMBER;
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
                    <p className="text-gray-600">Invite and manage your team members</p>
                </div>
                <button onClick={() => setShowInviteModal(true)} className="btn btn-primary">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite Member
                </button>
            </div>

            {/* Team Members */}
            <div className="card">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Team Members ({members.length})
                </h3>
                <div className="divide-y">
                    {members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between py-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold">
                                    {member.user.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-medium">{member.user.name}</p>
                                    <p className="text-sm text-gray-500">{member.user.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(member.role)}`}>
                                    {member.role.charAt(0) + member.role.slice(1).toLowerCase()}
                                </span>
                                {member.role !== 'OWNER' && (
                                    <button
                                        onClick={() => handleRemoveMember(member.user.id)}
                                        className="p-2 text-gray-400 hover:text-danger-500 transition"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pending Invites */}
            {invites.length > 0 && (
                <div className="card">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Pending Invitations ({invites.length})
                    </h3>
                    <div className="divide-y">
                        {invites.map((invite) => (
                            <div key={invite.id} className="flex items-center justify-between py-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{invite.email}</p>
                                        <p className="text-sm text-gray-500">
                                            Expires {new Date(invite.expiresAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(invite.role)}`}>
                                        {invite.role.charAt(0) + invite.role.slice(1).toLowerCase()}
                                    </span>
                                    <button
                                        onClick={() => handleCancelInvite(invite.id)}
                                        className="p-2 text-gray-400 hover:text-danger-500 transition"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Role Permissions */}
            <div className="card">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Role Permissions
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-3 px-4">Permission</th>
                                <th className="text-center py-3 px-4">Owner</th>
                                <th className="text-center py-3 px-4">Admin</th>
                                <th className="text-center py-3 px-4">Member</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { name: 'Create Audits', owner: true, admin: true, member: true },
                                { name: 'View All Audits', owner: true, admin: true, member: true },
                                { name: 'Manage Clients', owner: true, admin: true, member: false },
                                { name: 'Manage Branding', owner: true, admin: true, member: false },
                                { name: 'Invite Team Members', owner: true, admin: true, member: false },
                                { name: 'Remove Team Members', owner: true, admin: false, member: false },
                                { name: 'Manage Billing', owner: true, admin: false, member: false },
                            ].map((perm) => (
                                <tr key={perm.name} className="border-b">
                                    <td className="py-3 px-4">{perm.name}</td>
                                    <td className="text-center py-3 px-4">{perm.owner ? '✓' : '—'}</td>
                                    <td className="text-center py-3 px-4">{perm.admin ? '✓' : '—'}</td>
                                    <td className="text-center py-3 px-4">{perm.member ? '✓' : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold mb-4">Invite Team Member</h3>
                        <form onSubmit={handleSubmit(onInvite)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Email Address</label>
                                <input
                                    type="email"
                                    {...register('email', { required: 'Email is required' })}
                                    className="input"
                                    placeholder="colleague@example.com"
                                />
                                {errors.email && (
                                    <p className="text-danger-500 text-sm mt-1">{errors.email.message}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Role</label>
                                <select {...register('role')} className="input">
                                    <option value="MEMBER">Member</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>
                            <div className="flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowInviteModal(false)}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button type="submit" disabled={inviting} className="btn btn-primary">
                                    {inviting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Send Invite
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
