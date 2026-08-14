import React from 'react';
import { ShieldAlert, LayoutDashboard, History, LogOut, User as UserIcon, Sparkles, FileText, Clock, Cpu, Zap } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  activeTab: 'dashboard' | 'history' | 'report' | 'schedules';
  hasReport?: boolean;
  setActiveTab: (tab: 'dashboard' | 'history' | 'report' | 'schedules') => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  hasReport,
  setActiveTab,
  onLogout
}) => {
  return (
    <nav className="border-b border-indigo-500/20 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50 shadow-2xl shadow-indigo-950/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Futuristic Brand Logo */}
          <div 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center space-x-3 cursor-pointer group shrink-0"
          >
            <div className="relative h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-all duration-300">
              {/* Spinning Holographic Outer Ring */}
              <div className="absolute inset-0 rounded-xl border border-cyan-400/50 animate-spin-slow pointer-events-none" />
              
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center relative overflow-hidden">
                <ShieldAlert className="h-5 w-5 text-indigo-400 group-hover:text-cyan-300 transition-colors z-10" />
                <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            <div className="hidden sm:block">
              <div className="flex items-center space-x-1.5">
                <span className="font-cyber font-extrabold text-base sm:text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-cyan-300">
                  AI Cloud Cost Detective
                </span>
                <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
              </div>
              <div className="flex items-center space-x-2 -mt-0.5">
                <span className="text-[10px] font-tech font-semibold tracking-wider uppercase text-indigo-400 block">
                  FinOps Intelligence
                </span>
                <span className="w-1 h-1 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                  v2.0 AI Core
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          {user && (
            <div className="flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/40 glow-indigo'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                }`}
              >
                <LayoutDashboard className={`h-4 w-4 ${activeTab === 'dashboard' ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span className="hidden md:inline">Dashboard</span>
              </button>

              {(hasReport || activeTab === 'report') && (
                <button
                  onClick={() => setActiveTab('report')}
                  className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'report'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 glow-emerald'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                  }`}
                >
                  <FileText className="h-4 w-4 text-emerald-400" />
                  <span className="hidden md:inline">Cost Report</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </button>
              )}

              <button
                onClick={() => setActiveTab('schedules')}
                className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'schedules'
                    ? 'bg-purple-600/15 text-purple-300 border border-purple-500/40 glow-purple'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                }`}
              >
                <Clock className={`h-4 w-4 ${activeTab === 'schedules' ? 'text-purple-400' : 'text-slate-400'}`} />
                <span className="hidden md:inline">Schedules</span>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-cyan-600/15 text-cyan-300 border border-cyan-500/40 glow-cyan'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                }`}
              >
                <History className={`h-4 w-4 ${activeTab === 'history' ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span className="hidden md:inline">History</span>
              </button>
            </div>
          )}

          {/* User Profile & Logout */}
          {user && (
            <div className="flex items-center space-x-3 shrink-0">
              <div className="hidden lg:flex items-center space-x-2 text-xs font-mono bg-slate-900/80 border border-indigo-500/30 px-3.5 py-1.5 rounded-xl text-slate-300 glow-indigo">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <UserIcon className="h-3.5 w-3.5 text-indigo-400" />
                <span className="truncate max-w-[140px] text-indigo-200">{user.email}</span>
              </div>

              <button
                onClick={onLogout}
                className="flex items-center space-x-1.5 text-xs font-medium text-slate-400 hover:text-rose-400 bg-slate-900/80 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/40 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer hover:shadow-lg hover:shadow-rose-500/10"
                title="Logout"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Logout</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </nav>
  );
};
