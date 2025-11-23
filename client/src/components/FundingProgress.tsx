import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/dateUtils';

interface FundingProgressProps {
  current: string | number;
  goal: string | number;
  variant?: 'linear' | 'circular';
}

export function FundingProgress({ current, goal, variant = 'linear' }: FundingProgressProps) {
  const currentNum = typeof current === 'string' ? parseFloat(current) : current;
  const goalNum = typeof goal === 'string' ? parseFloat(goal) : goal;
  const percentage = Math.min((currentNum / goalNum) * 100, 100);

  if (variant === 'circular') {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="flex flex-col items-center gap-2">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke="hsl(var(--border))"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke="hsl(var(--primary))"
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold" data-testid="progress-percentage">
              {percentage.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <span className="text-2xl font-bold text-foreground" data-testid="progress-current">
          {formatCurrency(currentNum)} ETH
        </span>
        <span className="text-sm text-muted-foreground" data-testid="progress-goal">
          of {formatCurrency(goalNum)} ETH
        </span>
      </div>
      <Progress value={percentage} className="h-3" data-testid="progress-bar" />
      <div className="text-sm text-muted-foreground">
        {percentage.toFixed(1)}% funded
      </div>
    </div>
  );
}
