import { Badge } from '@/components/ui/badge';
import { Wallet, Beaker } from 'lucide-react';

interface TransactionTypeBadgeProps {
  type: 'real' | 'demo';
  size?: 'sm' | 'default';
}

export function TransactionTypeBadge({ type, size = 'default' }: TransactionTypeBadgeProps) {
  if (type === 'real') {
    return (
      <Badge
        variant="default"
        className="bg-chart-2 hover:bg-chart-2 border-chart-2 text-white gap-1"
        data-testid="badge-real-transaction"
      >
        <Wallet className="w-3 h-3" />
        {size === 'default' && 'Real'}
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="border-chart-1 text-chart-1 gap-1 border-dashed"
      data-testid="badge-demo-transaction"
    >
      <Beaker className="w-3 h-3" />
      {size === 'default' && 'Demo'}
    </Badge>
  );
}
