import { useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { isUnauthorizedError } from '@/lib/authUtils';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { ArrowLeft, Plus, DollarSign, Users, TrendingUp, ArrowDownToLine, RotateCcw } from 'lucide-react';
import type { Project, Transaction, RefundRequest } from '@shared/schema';
import { FundingProgress } from '@/components/FundingProgress';
import { CountdownTimer } from '@/components/CountdownTimer';
import { TransactionTypeBadge } from '@/components/TransactionTypeBadge';
import { getTimeRemaining } from '@/lib/dateUtils';
import { truncateAddress } from '@/lib/web3Utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ProjectWithStats extends Project {
  backersCount: number;
  transactions: Transaction[];
}

export default function MyProjects() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

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

  const { data: projects, isLoading } = useQuery<ProjectWithStats[]>({
    queryKey: ['/api/my-projects'],
    enabled: isAuthenticated,
  });

  const { data: refundRequests } = useQuery<RefundRequest[]>({
    queryKey: ['/api/refund-requests'],
    enabled: isAuthenticated,
  });

  const withdrawMutation = useMutation({
    mutationFn: async (projectId: number) => {
      return await apiRequest('POST', `/api/projects/${projectId}/withdraw`, {});
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Funds withdrawn successfully!',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/my-projects'] });
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
        description: error.message || 'Failed to withdraw funds',
        variant: 'destructive',
      });
    },
  });

  const refundMutation = useMutation({
    mutationFn: async (refundId: number) => {
      return await apiRequest('POST', `/api/refund-requests/${refundId}/process`, { approved: true });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Refund processed successfully!',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/refund-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/my-projects'] });
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
        description: error.message || 'Failed to process refund',
        variant: 'destructive',
      });
    },
  });

  if (authLoading || !isAuthenticated) {
    return null;
  }

  const canWithdraw = (project: ProjectWithStats) => {
    const currentAmount = parseFloat(project.currentAmount);
    const goalAmount = parseFloat(project.goalAmount);
    const timeRemaining = getTimeRemaining(project.deadline);
    return (
      !project.withdrawn &&
      currentAmount >= goalAmount &&
      !timeRemaining.isExpired &&
      project.isActive
    );
  };

  const needsRefund = (project: ProjectWithStats) => {
    const currentAmount = parseFloat(project.currentAmount);
    const goalAmount = parseFloat(project.goalAmount);
    const timeRemaining = getTimeRemaining(project.deadline);
    return timeRemaining.isExpired && currentAmount < goalAmount && currentAmount > 0;
  };

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
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <Link href="/">
              <Button variant="ghost" className="mb-2 gap-2" data-testid="button-back">
                <ArrowLeft className="w-4 h-4" />
                Back to Browse
              </Button>
            </Link>
            <h2
              className="text-4xl font-bold text-foreground"
              style={{ fontFamily: 'var(--font-serif)' }}
              data-testid="heading-my-projects"
            >
              My Projects
            </h2>
          </div>
          <Link href="/create">
            <Button className="gap-2" data-testid="button-create-new">
              <Plus className="w-4 h-4" />
              Create New Project
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !projects || projects.length === 0 ? (
          <Card className="p-12">
            <div className="text-center space-y-4">
              <p className="text-xl text-muted-foreground">You haven't created any projects yet</p>
              <Link href="/create">
                <Button data-testid="button-create-first">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Project
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {projects.map((project) => (
              <Card key={project.id} data-testid={`project-card-${project.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">{project.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {project.description}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {canWithdraw(project) && (
                        <Button
                          onClick={() => withdrawMutation.mutate(project.id)}
                          disabled={withdrawMutation.isPending}
                          className="gap-2 bg-chart-2 hover:bg-chart-2"
                          data-testid={`button-withdraw-${project.id}`}
                        >
                          <ArrowDownToLine className="w-4 h-4" />
                          Withdraw Funds
                        </Button>
                      )}
                      {needsRefund(project) && (
                        <Badge variant="destructive" className="gap-1">
                          <RotateCcw className="w-3 h-3" />
                          Refunds Available
                        </Badge>
                      )}
                      {project.withdrawn && (
                        <Badge className="bg-chart-2 hover:bg-chart-2">
                          Funds Withdrawn
                        </Badge>
                      )}
                      <Link href={`/project/${project.id}`}>
                        <Button variant="outline" data-testid={`button-view-${project.id}`}>
                          View Project
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="stats">
                    <TabsList>
                      <TabsTrigger value="stats" data-testid={`tab-stats-${project.id}`}>
                        Stats
                      </TabsTrigger>
                      <TabsTrigger value="transactions" data-testid={`tab-transactions-${project.id}`}>
                        Transactions ({project.transactions.length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="stats" className="space-y-6 mt-6">
                      <div className="grid md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <DollarSign className="w-4 h-4" />
                            <span className="text-sm">Total Raised</span>
                          </div>
                          <p className="text-2xl font-bold text-foreground">
                            {project.currentAmount} ETH
                          </p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span className="text-sm">Backers</span>
                          </div>
                          <p className="text-2xl font-bold text-foreground">
                            {project.backersCount}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-sm">Progress</span>
                          </div>
                          <p className="text-2xl font-bold text-foreground">
                            {((parseFloat(project.currentAmount) / parseFloat(project.goalAmount)) * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>

                      <FundingProgress
                        current={project.currentAmount}
                        goal={project.goalAmount}
                        variant="linear"
                      />

                      <div>
                        <p className="text-sm text-muted-foreground mb-3">Time Remaining</p>
                        <CountdownTimer deadline={project.deadline} variant="detail" />
                      </div>
                    </TabsContent>

                    <TabsContent value="transactions" className="mt-6">
                      {project.transactions.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          No transactions yet
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {project.transactions.map((tx) => (
                            <div
                              key={tx.id}
                              className="flex items-center justify-between p-4 rounded-md bg-muted/50 border border-border"
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
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">
                                  {new Date(tx.createdAt!).toLocaleDateString()}
                                </p>
                                {tx.transactionHash && (
                                  <p className="text-xs text-muted-foreground">
                                    {truncateAddress(tx.transactionHash)}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Refund Requests Section */}
        {refundRequests && refundRequests.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5" />
                Pending Refund Requests
              </CardTitle>
              <CardDescription>
                Process refund requests from backers whose projects didn't meet funding goals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {refundRequests
                  .filter((req) => req.status === 'pending')
                  .map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between p-4 rounded-md bg-muted/50 border border-border"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Refund Request: {req.amount} ETH
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Requested on {new Date(req.createdAt!).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        onClick={() => refundMutation.mutate(req.id)}
                        disabled={refundMutation.isPending}
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        data-testid={`button-approve-refund-${req.id}`}
                      >
                        <RotateCcw className="w-3 h-3" />
                        Approve Refund
                      </Button>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
