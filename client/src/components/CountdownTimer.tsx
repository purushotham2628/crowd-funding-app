import { useEffect, useState } from 'react';
import { getTimeRemaining } from '@/lib/dateUtils';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  deadline: Date | string;
  variant?: 'card' | 'detail';
}

export function CountdownTimer({ deadline, variant = 'card' }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(deadline));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(deadline));
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  if (timeRemaining.isExpired) {
    return (
      <div className={variant === 'card' ? 'text-sm text-destructive' : 'text-destructive font-medium'}>
        <Clock className="inline-block w-4 h-4 mr-1" />
        Deadline Expired
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className="text-sm text-muted-foreground flex items-center gap-1">
        <Clock className="w-4 h-4" />
        <span>
          {timeRemaining.days}d {timeRemaining.hours}h {timeRemaining.minutes}m
        </span>
      </div>
    );
  }

  return (
    <div className="flex gap-2" data-testid="countdown-timer">
      <div className="flex flex-col items-center bg-card border border-card-border rounded-md p-3 min-w-[60px]">
        <span className="text-2xl font-bold text-foreground" data-testid="countdown-days">
          {timeRemaining.days}
        </span>
        <span className="text-xs text-muted-foreground">Days</span>
      </div>
      <div className="flex flex-col items-center bg-card border border-card-border rounded-md p-3 min-w-[60px]">
        <span className="text-2xl font-bold text-foreground" data-testid="countdown-hours">
          {timeRemaining.hours}
        </span>
        <span className="text-xs text-muted-foreground">Hours</span>
      </div>
      <div className="flex flex-col items-center bg-card border border-card-border rounded-md p-3 min-w-[60px]">
        <span className="text-2xl font-bold text-foreground" data-testid="countdown-minutes">
          {timeRemaining.minutes}
        </span>
        <span className="text-xs text-muted-foreground">Minutes</span>
      </div>
      <div className="flex flex-col items-center bg-card border border-card-border rounded-md p-3 min-w-[60px]">
        <span className="text-2xl font-bold text-foreground" data-testid="countdown-seconds">
          {timeRemaining.seconds}
        </span>
        <span className="text-xs text-muted-foreground">Seconds</span>
      </div>
    </div>
  );
}
