import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { isUnauthorizedError } from '@/lib/authUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';
import { Plus, LogOut, User } from 'lucide-react';
import type { Project } from '@shared/schema';
import { FundingProgress } from '@/components/FundingProgress';
import { CountdownTimer } from '@/components/CountdownTimer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function Home() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

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

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    enabled: isAuthenticated,
  });

  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link href="/">
              <h1
                className="text-2xl font-bold text-foreground cursor-pointer hover-elevate px-3 py-1 rounded-md"
                style={{ fontFamily: 'var(--font-serif)' }}
                data-testid="heading-logo"
              >
                BlockFund
              </h1>
            </Link>
            <nav className="flex items-center gap-2 flex-wrap">
              <Link href="/create">
                <Button data-testid="button-create-project" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Project
                </Button>
              </Link>
              <Link href="/my-projects">
                <Button variant="outline" data-testid="button-my-projects">
                  My Projects
                </Button>
              </Link>
              <div className="flex items-center gap-2 border-l border-border pl-2 ml-2">
                <Avatar className="w-8 h-8" data-testid="avatar-user">
                  <AvatarImage src={user?.profileImageUrl || undefined} />
                  <AvatarFallback>
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-foreground hidden sm:inline" data-testid="text-username">
                  {user?.firstName || user?.email || 'User'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => (window.location.href = '/api/logout')}
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <h2
            className="text-4xl font-bold text-foreground mb-2"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Explore Projects
          </h2>
          <p className="text-muted-foreground">
            Discover innovative projects and support them with crypto or demo funding
          </p>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-48 w-full rounded-md" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !projects || projects.length === 0 ? (
          <Card className="p-12">
            <div className="text-center space-y-4">
              <p className="text-xl text-muted-foreground">No projects yet</p>
              <p className="text-sm text-muted-foreground">Be the first to create a project!</p>
              <Link href="/create">
                <Button data-testid="button-create-first">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Project
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link key={project.id} href={`/project/${project.id}`}>
                <Card
                  className="hover-elevate cursor-pointer h-full flex flex-col"
                  data-testid={`card-project-${project.id}`}
                >
                  <CardHeader className="p-0">
                    {project.imageUrl ? (
                      <img
                        src={project.imageUrl}
                        alt={project.title}
                        className="w-full h-48 object-cover rounded-t-md"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-chart-1/20 rounded-t-md flex items-center justify-center">
                        <span className="text-4xl" style={{ fontFamily: 'var(--font-serif)' }}>
                          {project.title.charAt(0)}
                        </span>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="p-6 flex-1 space-y-4">
                    <div>
                      <h3 className="font-semibold text-xl text-foreground mb-2 line-clamp-2">
                        {project.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {project.description}
                      </p>
                    </div>
                    <div className="space-y-3">
                      <FundingProgress
                        current={project.currentAmount}
                        goal={project.goalAmount}
                        variant="linear"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="p-6 pt-0">
                    <CountdownTimer deadline={project.deadline} variant="card" />
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
