import { cn } from '@/lib/utils';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
}

export function Card({ children, className, hover = false }: CardProps) {
    return (
        <div
            className={cn(
                'bg-white rounded-xl shadow-sm border border-gray-100 p-6',
                'dark:bg-gray-800 dark:border-gray-700',
                hover && 'transition-all duration-200 hover:shadow-lg hover:-translate-y-1',
                className
            )}
        >
            {children}
        </div>
    );
}

interface CardHeaderProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export function CardHeader({ title, description, action }: CardHeaderProps) {
    return (
        <div className="flex items-start justify-between mb-4">
            <div>
                <h3 className="text-lg font-semibold">{title}</h3>
                {description && (
                    <p className="text-sm text-gray-500">{description}</p>
                )}
            </div>
            {action && <div>{action}</div>}
        </div>
    );
}
