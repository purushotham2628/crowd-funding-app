import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function AuthPage() {
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'signup') {
        const res = await apiRequest('POST', '/api/signup', { email, password, first_name: firstName, last_name: lastName });
        if (res.ok) setLocation('/');
      } else {
        const res = await apiRequest('POST', '/api/local-login', { email, password });
        if (res.ok) setLocation('/');
      }
    } catch (err: any) {
      setError(err?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      <section className="hidden md:flex items-center justify-center p-10 bg-gradient-to-br from-primary/20 via-chart-1/10 to-accent/10">
        <div className="max-w-md text-center space-y-6">
          <h1 className="text-4xl font-extrabold text-foreground" style={{ fontFamily: 'var(--font-serif)' }}>
            Welcome to BlockFund
          </h1>
          <p className="text-lg text-muted-foreground">
            A modern, transparent crowdfunding platform. Create an account to launch or back projects using crypto or demo mode.
          </p>
          <div className="mx-auto w-64 h-40 bg-gradient-to-tr from-primary to-chart-2 rounded-2xl shadow-lg opacity-90" />
        </div>
      </section>

      <section className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{mode === 'signup' ? 'Create your account' : 'Sign in to BlockFund'}</CardTitle>
            <CardDescription>
              {mode === 'signup' ? 'Join and start funding or launching projects.' : 'Welcome back — enter your details to continue.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="text-sm block mb-1">Email</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div>
                <label className="text-sm block mb-1">Password</label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>

              {mode === 'signup' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm block mb-1">First name</label>
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm block mb-1">Last name</label>
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                </div>
              )}

              {error && <div className="text-sm text-destructive">{error}</div>}

              <div className="flex items-center justify-between gap-3">
                <Button type="submit" className="flex-1" size="lg" disabled={loading}>
                  {loading ? (mode === 'signup' ? 'Creating...' : 'Signing in...') : (mode === 'signup' ? 'Create account' : 'Sign in')}
                </Button>
                <Button variant="outline" onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}>
                  {mode === 'signup' ? 'Have an account? Sign in' : "Don't have an account? Create"}
                </Button>
              </div>

              <div className="pt-4 border-t border-border text-center">
                <p className="text-xs text-muted-foreground">Or continue with</p>
                <div className="mt-3 flex gap-2 justify-center">
                  <Button variant="ghost" size="sm">Google</Button>
                  <Button variant="ghost" size="sm">GitHub</Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
