import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, icon, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium mb-2">{label}</label>
                )}
                <div className="relative">
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            {icon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={cn(
                            'w-full px-4 py-2.5 border border-gray-300 rounded-lg',
                            'focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                            'outline-none transition-all',
                            'dark:bg-gray-800 dark:border-gray-700',
                            'disabled:bg-gray-100 disabled:cursor-not-allowed',
                            icon && 'pl-10',
                            error && 'border-danger-500 focus:ring-danger-500',
                            className
                        )}
                        {...props}
                    />
                </div>
                {error && (
                    <p className="text-danger-500 text-sm mt-1">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
