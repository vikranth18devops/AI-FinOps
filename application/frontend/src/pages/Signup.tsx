import React, { useState } from 'react';
import { ShieldAlert, Mail, Lock, ArrowRight, Loader2, AlertCircle, Sparkles, KeyRound, UserPlus } from 'lucide-react';
import { User } from '../types';

interface SignupProps {
  onSignupSuccess: (user: User, token: string) => void;
  onNavigateToLogin: () => void;
}

export const Signup: React.FC<SignupProps> = ({ onSignupSuccess, onNavigateToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password security token must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('http://localhost:8080/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to create engineer account.');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onSignupSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[88vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10 relative z-10">
      <div className="w-full max-w-md space-y-8 cyber-card p-8 sm:p-10 rounded-3xl border border-purple-500/30 shadow-2xl glow-purple relative overflow-hidden">
        
        {/* Glow Ambient Highlights */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />

        {/* AI Brand Header */}
        <div className="text-center">
          <div className="inline-flex relative h-16 w-16 rounded-2xl bg-gradient-to-tr from-purple-500 via-pink-500 to-indigo-500 p-0.5 shadow-xl shadow-purple-500/30 mb-4 group">
            <div className="absolute inset-0 rounded-2xl border border-purple-400/50 animate-spin-slow pointer-events-none" />
            <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center relative overflow-hidden">
              <UserPlus className="h-8 w-8 text-purple-400 group-hover:text-pink-300 transition-colors" />
            </div>
          </div>
          
          <div className="flex items-center justify-center space-x-1.5 mb-1">
            <h2 className="font-cyber text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-100 to-pink-300">
              Register Engineer Access
            </h2>
            <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
          </div>

          <p className="text-xs text-slate-400 font-mono">
            Provision new credentials for AI FinOps Cloud Cost Intelligence
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/40 rounded-2xl p-4 flex items-center space-x-3 text-rose-300 text-xs glow-rose">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Signup Form */}
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-[11px] font-semibold text-purple-300 uppercase tracking-wider mb-1.5 font-mono flex items-center justify-between">
              <span>Engineer Email Address</span>
              <Mail className="h-3.5 w-3.5 text-purple-400" />
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="engineer@company.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-purple-300 uppercase tracking-wider mb-1.5 font-mono flex items-center justify-between">
              <span>Password Token</span>
              <Lock className="h-3.5 w-3.5 text-purple-400" />
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <KeyRound className="h-4 w-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 security characters"
                className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-purple-300 uppercase tracking-wider mb-1.5 font-mono flex items-center justify-between">
              <span>Confirm Password Token</span>
              <Lock className="h-3.5 w-3.5 text-purple-400" />
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <KeyRound className="h-4 w-4" />
              </div>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter security token"
                className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer glow-purple mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-pink-300" />
                <span>Registering Security Profile...</span>
              </>
            ) : (
              <>
                <span>Register & Launch Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center pt-2">
          <p className="text-xs text-slate-400">
            Already registered?{' '}
            <button
              onClick={onNavigateToLogin}
              className="text-pink-400 hover:text-pink-300 font-semibold underline underline-offset-4 cursor-pointer"
            >
              Sign into Security Gateway
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};
