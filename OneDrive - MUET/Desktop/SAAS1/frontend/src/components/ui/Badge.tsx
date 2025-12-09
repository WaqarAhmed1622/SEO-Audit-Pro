import { cn } from '@/lib/utils';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
    className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
    const variants = {
        default: 'bg-gray-100 text-gray-700',
        success: 'bg-success-50 text-success-600',
        warning: 'bg-warning-50 text-warning-600',
        danger: 'bg-danger-50 text-danger-600',
        info: 'bg-primary-100 text-primary-700',
    };

    return (
        <span
            className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                variants[variant],
                className
            )}
        >
            {children}
        </span>
    );
}

interface StatusBadgeProps {
    status: 'PENDING' | 'PROCESSING' | 'COMPLETE' | 'FAILED' | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
    const statusMap: Record<string, { variant: BadgeProps['variant']; label: string }> = {
        PENDING: { variant: 'default', label: 'Pending' },
        PROCESSING: { variant: 'warning', label: 'Processing' },
        COMPLETE: { variant: 'success', label: 'Complete' },
        FAILED: { variant: 'danger', label: 'Failed' },
    };

    const config = statusMap[status] || { variant: 'default', label: status };

    return <Badge variant={config.variant}>{config.label}</Badge>;
}
