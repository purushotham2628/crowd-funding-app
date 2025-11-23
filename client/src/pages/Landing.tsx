import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Wallet, Shield, Clock, TrendingUp } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary/10 via-background to-chart-1/10 border-b border-border">
        <div className="container mx-auto px-6 py-24">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h1
              className="text-5xl md:text-6xl font-bold text-foreground"
              style={{ fontFamily: 'var(--font-serif)' }}
              data-testid="heading-hero"
            >
              Fund the Future with Blockchain
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A transparent, decentralized crowdfunding platform powered by blockchain technology.
              Support innovative projects with cryptocurrency or try demo mode.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button
                size="lg"
                onClick={() => (window.location.href = '/api/login')}
                className="min-h-10 gap-2"
                data-testid="button-get-started"
              >
                Get Started
                <TrendingUp className="w-4 h-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => (window.location.href = '/api/login')}
                data-testid="button-login"
              >
                Log In
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-3xl font-bold text-center mb-12 text-foreground"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Why Choose BlockFund?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover-elevate" data-testid="card-feature-blockchain">
              <CardContent className="p-6 space-y-3">
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg text-foreground">MetaMask Integration</h3>
                <p className="text-sm text-muted-foreground">
                  Connect your wallet and fund projects directly with cryptocurrency using MetaMask.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-feature-demo">
              <CardContent className="p-6 space-y-3">
                <div className="w-12 h-12 rounded-md bg-chart-1/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-chart-1" />
                </div>
                <h3 className="font-semibold text-lg text-foreground">Demo Mode</h3>
                <p className="text-sm text-muted-foreground">
                  Try the platform risk-free with unlimited demo funding before committing real crypto.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-feature-transparent">
              <CardContent className="p-6 space-y-3">
                <div className="w-12 h-12 rounded-md bg-chart-2/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-chart-2" />
                </div>
                <h3 className="font-semibold text-lg text-foreground">Deadline Tracking</h3>
                <p className="text-sm text-muted-foreground">
                  Real-time countdown timers and automatic refunds if funding goals aren't met.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-feature-secure">
              <CardContent className="p-6 space-y-3">
                <div className="w-12 h-12 rounded-md bg-chart-3/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-chart-3" />
                </div>
                <h3 className="font-semibold text-lg text-foreground">Transparent Funding</h3>
                <p className="text-sm text-muted-foreground">
                  Every transaction is recorded on the blockchain with complete transparency.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="border-t border-border bg-card/50">
        <div className="container mx-auto px-6 py-16">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2
              className="text-3xl font-bold text-foreground"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Ready to Start Funding?
            </h2>
            <p className="text-muted-foreground">
              Join our community of innovators and backers building the future together.
            </p>
            <Button
              size="lg"
              onClick={() => (window.location.href = '/api/login')}
              data-testid="button-cta-start"
            >
              Create an Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
