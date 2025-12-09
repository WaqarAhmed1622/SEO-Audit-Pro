import { cn } from '@/lib/utils';

interface ScoreCircleProps {
    score: number;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function ScoreCircle({ score, size = 'md', className }: ScoreCircleProps) {
    const getColor = (score: number): string => {
        if (score >= 80) return '#10B981';
        if (score >= 50) return '#F59E0B';
        return '#EF4444';
    };

    const sizes = {
        sm: { container: 'w-16 h-16', text: 'text-lg', stroke: 4 },
        md: { container: 'w-24 h-24', text: 'text-2xl', stroke: 6 },
        lg: { container: 'w-32 h-32', text: 'text-4xl', stroke: 8 },
    };

    const sizeConfig = sizes[size];
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const color = getColor(score);

    return (
        <div className={cn('score-circle', sizeConfig.container, className)}>
            <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Background circle */}
                <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth={sizeConfig.stroke}
                />
                {/* Progress circle */}
                <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={sizeConfig.stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                />
            </svg>
            <span
                className={cn('score-value', sizeConfig.text)}
                style={{ color }}
            >
                {score}
            </span>
        </div>
    );
}
