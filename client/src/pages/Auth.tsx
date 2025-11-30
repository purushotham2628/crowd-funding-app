import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';

export default function AuthPage() {
  const [mode, setMode] = useState<'signup'|'login'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (mode === 'signup') {
        const res = await apiRequest('POST', '/api/signup', { email, password, first_name: firstName, last_name: lastName });
        if (res.ok) setLocation('/');
      } else {
        const res = await apiRequest('POST', '/api/local-login', { email, password });
        if (res.ok) setLocation('/');
      }
    } catch (err: any) {
      setError(err.message || 'Request failed');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 bg-card border border-border rounded-md">
        <h2 className="text-2xl font-bold mb-4">{mode === 'signup' ? 'Create an account' : 'Sign in'}</h2>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-sm">Email</label>
            <input className="w-full input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm">Password</label>
            <input type="password" className="w-full input" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {mode === 'signup' && (
            <>
              <div>
                <label className="text-sm">First name</label>
                <input className="w-full input" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm">Last name</label>
                <input className="w-full input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </>
          )}

          <div className="flex items-center justify-between">
            <button className="btn" type="submit">{mode === 'signup' ? 'Create account' : 'Sign in'}</button>
            <button type="button" className="link" onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}>{mode === 'signup' ? 'Have an account? Sign in' : "Don't have an account? Create"}</button>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </form>
      </div>
    </main>
  );
}
