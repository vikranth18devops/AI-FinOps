import React, { useState } from 'react';
import { ShieldAlert, Mail, Lock, ArrowRight, Loader2, AlertCircle, Cpu, Sparkles, KeyRound } from 'lucide-react';
import { User } from '../types';
import { API_BASE_URL } from '../config';

interface LoginProps {
  onLoginSuccess: (user: User, token: string) => void;
  onNavigateToSignup: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, onNavigateToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please fill in all security credentials.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to login. Please check your security credentials.');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[88vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10 relative z-10">
      <div className="w-full max-w-md space-y-8 cyber-card p-8 sm:p-10 rounded-3xl border border-indigo-500/30 shadow-2xl glow-indigo relative overflow-hidden">
        
        {/* Glow Ambient Highlights */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />

        {/* AI Brand Header */}
        <div className="text-center">
          <div className="inline-flex relative h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 p-0.5 shadow-xl shadow-indigo-500/30 mb-4 group">
            <div className="absolute inset-0 rounded-2xl border border-cyan-400/50 animate-spin-slow pointer-events-none" />
            <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center relative overflow-hidden">
              <ShieldAlert className="h-8 w-8 text-indigo-400 group-hover:text-cyan-300 transition-colors" />
            </div>
          </div>
          
          <div className="flex items-center justify-center space-x-1.5 mb-1">
            <h2 className="font-cyber text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-cyan-300">
              AI FinOps Vault
            </h2>
            <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
          </div>

          <p className="text-xs text-slate-400 font-mono">
            Authenticate to access Azure FinOps Intelligence & Cost Scanner
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/40 rounded-2xl p-4 flex items-center space-x-3 text-rose-300 text-xs glow-rose">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-[11px] font-semibold text-indigo-300 uppercase tracking-wider mb-2 font-mono flex items-center justify-between">
              <span>Engineer Email Address</span>
              <Mail className="h-3.5 w-3.5 text-indigo-400" />
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
                placeholder="developer@company.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-indigo-300 uppercase tracking-wider mb-2 font-mono flex items-center justify-between">
              <span>Security Password Token</span>
              <Lock className="h-3.5 w-3.5 text-indigo-400" />
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
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-sm shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer glow-indigo"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
                <span>Authenticating JWT Token...</span>
              </>
            ) : (
              <>
                <span>Access FinOps Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center pt-2">
          <p className="text-xs text-slate-400">
            Need a new account?{' '}
            <button
              onClick={onNavigateToSignup}
              className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-4 cursor-pointer"
            >
              Register Engineer Access
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};
