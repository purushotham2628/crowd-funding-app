import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { isUnauthorizedError } from '@/lib/authUtils';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { connectMetaMask, sendEthTransaction, truncateAddress } from '@/lib/web3Utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link, useParams } from 'wouter';
import { ArrowLeft, Wallet, Beaker, User } from 'lucide-react';
import type { Project, Transaction, User as UserType } from '@shared/schema';
import { FundingProgress } from '@/components/FundingProgress';
import { CountdownTimer } from '@/components/CountdownTimer';
import { TransactionTypeBadge } from '@/components/TransactionTypeBadge';
import { formatDeadline } from '@/lib/dateUtils';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: 'Unauthorized',
        description: 'You are logged out. Logging in again...',
        variant: 'destructive',
      });
      setTimeout(() => {
        window.location.href = '/api/login';
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: project, isLoading } = useQuery<Project & { creator: UserType }>({
    queryKey: ['/api/projects', id],
    enabled: isAuthenticated && !!id,
  });

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ['/api/projects', id, 'transactions'],
    enabled: isAuthenticated && !!id,
  });

  const { data: refunds } = useQuery<any[]>({
    queryKey: ['/api/refund-requests'],
    enabled: isAuthenticated && !!id,
  });

  const fundMutation = useMutation({
    mutationFn: async ({ transactionType, txHash }: { transactionType: 'real' | 'demo'; txHash?: string }) => {
      return await apiRequest('POST', `/api/projects/${id}/fund`, {
        amount,
        transactionType,
        transactionHash: txHash,
        donorWalletAddress: walletAddress,
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Funding transaction recorded successfully!',
      });
      setAmount('');
      queryClient.invalidateQueries({ queryKey: ['/api/projects', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', id, 'transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: 'Unauthorized',
          description: 'You are logged out. Logging in again...',
          variant: 'destructive',
        });
        setTimeout(() => {
          window.location.href = '/api/login';
        }, 500);
        return;
      }
      toast({
        title: 'Error',
        description: error.message || 'Failed to process funding',
        variant: 'destructive',
      });
    },
  });

  const refundMutation = useMutation({
    mutationFn: async ({ transactionId, amount }: { transactionId: number; amount: string }) => {
      return await apiRequest('POST', '/api/refund-requests', {
        projectId: parseInt(id || '0'),
        transactionId,
        amount,
      });
    },
    onSuccess: () => {
      toast({
        title: 'Refund Requested',
        description: 'Your refund request has been submitted.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/refund-requests'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to request refund',
        variant: 'destructive',
      });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', `/api/projects/${id}/withdraw`, {});
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Funds withdrawn successfully!',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/my-projects'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to withdraw funds',
        variant: 'destructive',
      });
    },
  });

  const processRefundMutation = useMutation({
    mutationFn: async ({ refundId, approved }: { refundId: number; approved: boolean }) => {
      return await apiRequest('POST', `/api/refund-requests/${refundId}/process`, { approved });
    },
    onSuccess: () => {
      toast({
        title: 'Refund Updated',
        description: 'Refund request has been processed.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/refund-requests'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to process refund',
        variant: 'destructive',
      });
    },
  });

  const handleConnectWallet = async () => {
    try {
      const address = await connectMetaMask();
      setWalletAddress(address);
      toast({
        title: 'Wallet Connected',
        description: `Connected to ${truncateAddress(address || '')}`,
      });
    } catch (error: any) {
      toast({
        title: 'Connection Failed',
        description: error.message || 'Failed to connect MetaMask',
        variant: 'destructive',
      });
    }
  };

  const handleRealTransaction = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    if (!walletAddress) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your MetaMask wallet first',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Send real ETH transaction through MetaMask
      const projectWallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8'; // Demo wallet address
      const txHash = await sendEthTransaction(projectWallet, amount);
      
      // Record transaction in database
      fundMutation.mutate({ transactionType: 'real', txHash });
    } catch (error: any) {
      toast({
        title: 'Transaction Failed',
        description: error.message || 'Failed to send transaction',
        variant: 'destructive',
      });
    }
  };

  const handleDemoTransaction = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    // Record demo transaction
    fundMutation.mutate({ transactionType: 'demo' });
  };

  if (authLoading || !isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <Skeleton className="h-8 w-32" />
          </div>
        </header>
        <main className="container mx-auto px-6 py-12">
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50">
          <div className="container mx-auto px-6 py-4">
            <Link href="/">
              <h1
                className="text-2xl font-bold text-foreground cursor-pointer"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                BlockFund
              </h1>
            </Link>
          </div>
        </header>
        <main className="container mx-auto px-6 py-12">
          <Card className="p-12 text-center">
            <p className="text-xl text-muted-foreground">Project not found</p>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <Link href="/">
            <h1
              className="text-2xl font-bold text-foreground cursor-pointer hover-elevate px-3 py-1 rounded-md inline-block"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              BlockFund
            </h1>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <Link href="/">
          <Button variant="ghost" className="mb-6 gap-2" data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </Button>
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Image */}
            {project.imageUrl ? (
              <img
                src={project.imageUrl}
                alt={project.title}
                className="w-full h-96 object-cover rounded-md"
                data-testid="img-project-hero"
              />
            ) : (
              <div className="w-full h-96 bg-gradient-to-br from-primary/20 to-chart-1/20 rounded-md flex items-center justify-center">
                <span className="text-8xl" style={{ fontFamily: 'var(--font-serif)' }}>
                  {project.title.charAt(0)}
                </span>
              </div>
            )}

            {/* Project Info */}
            <Card>
              <CardHeader>
                <CardTitle
                  className="text-4xl"
                  style={{ fontFamily: 'var(--font-serif)' }}
                  data-testid="heading-project-title"
                >
                  {project.title}
                </CardTitle>
                <div className="flex items-center gap-3 pt-2">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={project.creator.profileImageUrl || undefined} />
                    <AvatarFallback>
                      <User className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm text-muted-foreground">Created by</p>
                    <p className="font-medium text-foreground" data-testid="text-creator-name">
                      {project.creator.firstName || project.creator.email}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-foreground leading-relaxed" data-testid="text-description">
                  {project.description}
                </p>
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Deadline</p>
                    <p className="font-medium text-foreground" data-testid="text-deadline">
                      {formatDeadline(project.deadline)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p
                      className={`font-medium ${project.isActive ? 'text-chart-2' : 'text-muted-foreground'}`}
                      data-testid="text-status"
                    >
                      {project.isActive ? 'Active' : 'Ended'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transactions */}
            <Card>
              <CardHeader>
                <CardTitle>Backers & Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {!transactions || transactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No transactions yet. Be the first to fund this project!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-3 rounded-md bg-muted/50 border border-border"
                        data-testid={`transaction-${tx.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <TransactionTypeBadge type={tx.transactionType as 'real' | 'demo'} />
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {tx.amount} ETH
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {tx.donorWalletAddress
                                ? truncateAddress(tx.donorWalletAddress)
                                : 'Anonymous'}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <p className="text-xs text-muted-foreground">
                            {formatDeadline(tx.createdAt!)}
                          </p>
                          {user?.id === tx.donorId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-6"
                              onClick={() => {
                                const amount = tx.amount;
                                if (confirm(`Request refund for ${amount} ETH?`)) {
                                  refundMutation.mutate({ transactionId: tx.id!, amount });
                                }
                              }}
                            >
                              Refund
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Withdraw Button (for creator) */}
            {user?.id === project?.creatorId && project && parseFloat(project.currentAmount) >= parseFloat(project.goalAmount) && !project.withdrawn && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-900">Withdraw Funds</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-green-800 mb-4">
                    Your project has reached its funding goal. You can now withdraw the funds.
                  </p>
                  <Button
                    onClick={() => {
                      if (confirm('Withdraw all funds to your wallet?')) {
                        withdrawMutation.mutate();
                      }
                    }}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Withdraw Funds
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Refund Requests (for creator) */}
            {user?.id === project?.creatorId && refunds && refunds.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Refund Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {refunds.filter((r: any) => r.projectId === parseInt(id || '0')).map((req: any) => (
                      <div
                        key={req.id}
                        className="flex items-center justify-between p-2 rounded-md bg-muted/50 border border-border"
                      >
                        <div>
                          <p className="text-sm font-medium">{req.amount} ETH refund</p>
                          <p className="text-xs text-muted-foreground">
                            {req.approved ? 'Approved' : 'Pending'}
                          </p>
                        </div>
                        {!req.approved && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Approve refund of ${req.amount} ETH?`)) {
                                processRefundMutation.mutate({ refundId: req.id, approved: true });
                              }
                            }}
                          >
                            Approve
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Funding Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Fund This Project</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Progress */}
                <FundingProgress
                  current={project.currentAmount}
                  goal={project.goalAmount}
                  variant="linear"
                />

                {/* Countdown */}
                <div>
                  <p className="text-sm text-muted-foreground mb-3">Time Remaining</p>
                  <CountdownTimer deadline={project.deadline} variant="detail" />
                </div>

                <Separator />

                {/* Amount Input */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Amount (ETH)
                  </label>
                  <Input
                    type="number"
                    step="0.0001"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    data-testid="input-amount"
                  />
                </div>

                {/* MetaMask Connection */}
                {!walletAddress ? (
                  <Button
                    onClick={handleConnectWallet}
                    variant="outline"
                    className="w-full gap-2"
                    data-testid="button-connect-wallet"
                  >
                    <Wallet className="w-4 h-4" />
                    Connect MetaMask
                  </Button>
                ) : (
                  <div className="p-3 bg-chart-2/10 rounded-md border border-chart-2/30">
                    <p className="text-xs text-muted-foreground">Connected Wallet</p>
                    <p className="text-sm font-medium text-foreground" data-testid="text-wallet-address">
                      {truncateAddress(walletAddress)}
                    </p>
                  </div>
                )}

                <Separator />

                {/* Transaction Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handleRealTransaction}
                    disabled={fundMutation.isPending || !walletAddress}
                    className="w-full gap-2 bg-chart-2 hover:bg-chart-2 border-chart-2"
                    data-testid="button-fund-real"
                  >
                    <Wallet className="w-4 h-4" />
                    {fundMutation.isPending ? 'Processing...' : 'Fund with Crypto'}
                  </Button>

                  <Button
                    onClick={handleDemoTransaction}
                    disabled={fundMutation.isPending}
                    variant="outline"
                    className="w-full gap-2 border-chart-1 text-chart-1 border-dashed hover:bg-chart-1/10"
                    data-testid="button-fund-demo"
                  >
                    <Beaker className="w-4 h-4" />
                    {fundMutation.isPending ? 'Processing...' : 'Demo Fund (Test Mode)'}
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Real transactions require MetaMask. Demo mode allows unlimited test funding.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
