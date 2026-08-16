import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { Report } from './pages/Report';
import { HistoryPage } from './pages/History';
import { SchedulesPage } from './pages/Schedules';
import { User, AnalysisRecord } from './types';
import { Cpu, Activity, ShieldCheck, Zap, Cloud, Server, Globe } from 'lucide-react';
import { SpaceGalaxyBackground } from './components/SpaceGalaxyBackground';

export function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'report' | 'schedules'>('dashboard');
  const [currentReport, setCurrentReport] = useState<any>(null);

  const handleAuthSuccess = (userData: User, jwtToken: string) => {
    setUser(userData);
    setToken(jwtToken);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    setAuthView('login');
  };

  const handleSelectHistoryRecord = (record: AnalysisRecord) => {
    const reportPayload = {
      resource_group: record.resource_group,
      total_resources: record.resources_scanned,
      resources: record.analysis_result?.resources || [],
      analysis: record.analysis_result?.analysis || {
        summary: 'Historical analysis report',
        total_estimated_monthly_savings: record.estimated_savings,
        issues: [],
        recommendations: []
      }
    };
    setCurrentReport(reportPayload);
    setActiveTab('report');
  };

  const handleAnalysisComplete = (resultData: any) => {
    setCurrentReport({
      resource_group: resultData.resource_group,
      total_resources: resultData.total_resources,
      resources: resultData.resources,
      analysis: resultData.analysis
    });
    setActiveTab('report');
  };

  // If not authenticated, render Login or Signup page
  if (!token || !user) {
    return (
      <div className="min-h-screen cyber-grid-bg text-slate-100 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
        {/* Deep Space Galaxy & Astronaut Animated Background */}
        <SpaceGalaxyBackground />

        <div className="relative z-10">
          {authView === 'login' ? (
            <Login
              onLoginSuccess={handleAuthSuccess}
              onNavigateToSignup={() => setAuthView('signup')}
            />
          ) : (
            <Signup
              onSignupSuccess={handleAuthSuccess}
              onNavigateToLogin={() => setAuthView('login')}
            />
          )}
        </div>
      </div>
    );
  }

  const handleUpdateReport = (updatedReport: any) => {
    setCurrentReport(updatedReport);
  };

  return (
    <div className="min-h-screen cyber-grid-bg text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative">
      {/* Deep Space Galaxy & Astronaut Animated Background */}
      <SpaceGalaxyBackground />

      <Navbar
        user={user}
        activeTab={activeTab}
        hasReport={!!currentReport}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />

      <main className="flex-1 relative z-10">
        {activeTab === 'dashboard' && (
          <Dashboard
            token={token}
            onAnalysisStart={(id, rg) => console.log('Started analysis', id, rg)}
            onAnalysisComplete={handleAnalysisComplete}
          />
        )}

        {activeTab === 'schedules' && (
          <SchedulesPage
            token={token}
            onRunAnalysisForGroup={() => {
              setActiveTab('dashboard');
            }}
          />
        )}

        {activeTab === 'history' && (
          <HistoryPage
            token={token}
            onSelectRecord={handleSelectHistoryRecord}
          />
        )}

        {activeTab === 'report' && currentReport && (
          <Report
            token={token}
            analysisData={currentReport}
            onBackToDashboard={() => setActiveTab('dashboard')}
            onUpdateReport={handleUpdateReport}
          />
        )}
      </main>

      {/* Futuristic Cyber Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-xl py-5 text-xs text-slate-400 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>AI Cloud Cost Detective &copy; 2026. Microservices AI FinOps Intelligence Platform.</span>
            <span className="text-slate-500 hidden sm:inline">•</span>
            <span>Implemented by <a href="https://www.linkedin.com/in/vikranth-sunkarpally/" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300 underline underline-offset-2 transition-colors font-medium">Vikranth Sunkarpally</a></span>
          </div>

          <div className="flex items-center space-x-2.5 text-slate-400 font-mono">
            <span className="text-[11px] font-semibold text-slate-400 font-sans tracking-wide">Powered by:</span>

            {/* Azure Real Brand SVG Logo Badge with Neon Glow */}
            <div className="flex items-center space-x-1.5 bg-sky-500/20 border border-sky-400/60 px-3 py-1 rounded-full glow-cyan shadow-[0_0_15px_rgba(56,189,248,0.35)] hover:shadow-[0_0_20px_rgba(56,189,248,0.6)] transition-all">
              <svg className="h-3.5 w-3.5 drop-shadow-[0_0_6px_rgba(56,189,248,0.8)]" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M58.3 8.3L34.1 48.6L12.4 82.5H35.8L79.1 8.3H58.3Z" fill="#38BDF8"/>
                <path d="M12.4 82.5L34.1 48.6L58.3 8.3H37.5L3.6 62.4C1.3 66.1 1.6 70.8 4.3 74.2L12.4 82.5Z" fill="#0284C7"/>
                <path d="M35.8 82.5H86.2C91.4 82.5 94.7 76.9 92.1 72.4L79.1 49.7L58.3 8.3H79.1L92.1 31C94.7 35.5 94.7 41.1 92.1 45.6L71.3 82.5H35.8Z" fill="#0ea5e9"/>
              </svg>
              <span className="text-[11px] font-bold text-sky-200 tracking-wide">Azure</span>
            </div>

            {/* AWS Real Brand SVG Logo Badge with Neon Glow */}
            <div className="flex items-center space-x-1.5 bg-amber-500/20 border border-amber-400/60 px-3 py-1 rounded-full glow-amber shadow-[0_0_15px_rgba(245,158,11,0.35)] hover:shadow-[0_0_20px_rgba(245,158,11,0.6)] transition-all">
              <svg className="h-3.5 w-3.5 drop-shadow-[0_0_6px_rgba(245,158,11,0.8)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.75 14.5C18.25 16.25 15.5 17.5 12 17.5C8.5 17.5 5.75 16.25 4.25 14.5C4 14.25 3.5 14.5 3.75 14.75C5.5 17.25 8.5 19 12 19C15.5 19 18.5 17.25 20.25 14.75C20.5 14.5 20 14.25 19.75 14.5Z" fill="#F59E0B"/>
                <path d="M12 3L3 8L12 13L21 8L12 3Z" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 13L12 18L21 13" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-[11px] font-bold text-amber-200 tracking-wide">AWS</span>
            </div>

            {/* GCP Real Brand SVG Logo Badge with Neon Glow */}
            <div className="flex items-center space-x-1.5 bg-emerald-500/20 border border-emerald-400/60 px-3 py-1 rounded-full glow-emerald shadow-[0_0_15px_rgba(16,185,129,0.35)] hover:shadow-[0_0_20px_rgba(16,185,129,0.6)] transition-all">
              <svg className="h-3.5 w-3.5 drop-shadow-[0_0_6px_rgba(52,211,153,0.8)]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" fill="#4285F4"/>
                <path d="M6 20c-3.31 0-6-2.69-6-6 0-3.09 2.34-5.64 5.35-5.96.22-.02.43-.04.65-.04 1.25 0 2.42.38 3.4 1.04C8.42 10.04 8 11.47 8 13c0 2.76 2.24 5 5 5h6c.35 0 .69-.04 1.02-.1C19.12 19.17 17.68 20 16 20H6z" fill="#34A853"/>
                <path d="M19 15c0 1.66-1.34 3-3 3h-3c-2.76 0-5-2.24-5-5 0-1.53.69-2.9 1.77-3.83.67-.57 1.48-.96 2.37-1.11.28-.05.57-.06.86-.06 2.76 0 5 2.24 5 5z" fill="#EA4335"/>
                <path d="M12 4c3.64 0 6.67 2.59 7.35 6.04C19.04 10.03 18.69 10 18.33 10 16.49 10 14.85 10.87 13.8 12.22 13.28 11.47 13 10.55 13 9.5c0-1.85.87-3.49 2.22-4.54C14.33 4.34 13.19 4 12 4z" fill="#FBBC05"/>
              </svg>
              <span className="text-[11px] font-bold text-emerald-200 tracking-wide">GCP</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
