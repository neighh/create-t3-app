'use client';

import { useState } from 'react';
import { useAuth } from '../../../context/SupabaseAuthProvider';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const { signIn, user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      // Supabase sign up
      const { error: signupError } = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }).then(res => res.json());
      if (signupError) throw new Error(signupError.message || 'Signup failed');
      // Auto-login after signup
      await signIn(email, password);
      setSubmitting(false);
      router.push('/lead-requests');
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (user) {
    return (
      <div style={{ margin: '2rem auto', maxWidth: 400, textAlign: 'center' }}>
        <h2>Welcome, {user.email}!</h2>
        <a href="/lead-requests">Go to Lead Requests</a>
      </div>
    );
  }

  return (
    <div style={{ margin: '2rem auto', maxWidth: 400 }}>
      <h1>Sign Up</h1>
      <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading || submitting}>
          {submitting ? 'Signing up...' : 'Sign Up'}
        </button>
        {error && <div style={{ color: 'red' }}>{error}</div>}
      </form>
      <div style={{ marginTop: 16 }}>
        Already have an account? <a href="/auth/login">Login</a>
      </div>
    </div>
  );
} 