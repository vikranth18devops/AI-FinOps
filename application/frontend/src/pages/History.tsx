import React, { useEffect, useState } from 'react';
import { History as HistoryIcon, Calendar, ArrowRight, RefreshCw, AlertTriangle, FileText, Search, Filter, Eye, CheckCircle2, Clock, DollarSign, Terminal, ShieldCheck, TrendingUp, UserCheck, ChevronDown, Sparkles } from 'lucide-react';
import { AnalysisRecord } from '../types';
import { API_BASE_URL } from '../config';

interface RemediationRecord {
  id: string;
  user_id: number;
  user_email: string;
  resource_group: string;
  command: string;
  status: string;
  estimated_savings: string;
  output: string;
  created_at: string;
}

interface HistoryProps {
  token: string | null;
  onSelectRecord: (record: AnalysisRecord) => void;
}

export const HistoryPage: React.FC<HistoryProps> = ({ token, onSelectRecord }) => {
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Remediation Audit Log State
  const [remediations, setRemediations] = useState<RemediationRecord[]>([]);
  const [totalSavedMonthly, setTotalSavedMonthly] = useState<string>('$0.00/month');
  const [projectedAnnualSavings, setProjectedAnnualSavings] = useState<string>('$0.00/year');
  const [openLogId, setOpenLogId] = useState<string | null>(null);

  // Pagination state (15 per page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  // Filters state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Fetch Past AI Audits
      const res = await fetch(`${API_BASE_URL}/api/history`, { headers });
      const data = await res.json();
      if (res.ok) {
        setHistory(data.history || []);
      }

      // Fetch Executed Remediation Audit Log
      const remRes = await fetch(`${API_BASE_URL}/api/remediations`, { headers });
      const remData = await remRes.json();
      if (remRes.ok) {
        setRemediations(remData.remediations || []);
        setTotalSavedMonthly(remData.total_dollars_saved_monthly || '$0.00/month');
        setProjectedAnnualSavings(remData.projected_annual_savings || '$0.00/year');
      }
    } catch (err: any) {
      console.error('History fetch error:', err);
      setError(err.message || 'Error fetching analysis history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  // Filter & Sort Logic
  const filteredHistory = history.filter((rec) => {
    const matchesSearch = !searchQuery || rec.resource_group.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesDate = true;
    if (rec.created_at) {
      const recDate = new Date(rec.created_at).getTime();
      if (startDate) {
        const startMs = new Date(startDate).setHours(0, 0, 0, 0);
        if (recDate < startMs) matchesDate = false;
      }
      if (endDate) {
        const endMs = new Date(endDate).setHours(23, 59, 59, 999);
        if (recDate > endMs) matchesDate = false;
      }
    }
    return matchesSearch && matchesDate;
  }).sort((a, b) => {
    const timeA = new Date(a.created_at || 0).getTime();
    const timeB = new Date(b.created_at || 0).getTime();
    return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
  });

  const totalPages = Math.ceil(filteredHistory.length / pageSize) || 1;
  const paginatedHistory = filteredHistory.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const clearFilters = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
      
      {/* Header Banner */}
      <div className="cyber-card rounded-3xl p-8 sm:p-10 border border-indigo-500/20 shadow-2xl relative overflow-hidden glow-indigo">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-emerald-500/20 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 px-3.5 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider glow-emerald">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>FinOps Audit Log & Historical Savings Tracker</span>
            </div>

            <h1 className="font-cyber text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-cyan-300">
              Remediation Log & Historical Savings
            </h1>

            <p className="text-slate-300 text-sm leading-relaxed">
              Records every executed CLI fix command, timestamp, engineer ID, and cumulative dollars saved over time ($ Saved to Date).
            </p>
          </div>

          <button
            onClick={fetchHistory}
            disabled={loading}
            className="py-3 px-5 rounded-xl bg-slate-950 border border-indigo-500/30 hover:border-cyan-400 text-white font-mono font-semibold text-xs transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50 w-fit glow-indigo"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Sync Audit Trail</span>
          </button>
        </div>
      </div>

      {/* CUMULATIVE SAVINGS KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 font-mono">
        
        <div className="cyber-card rounded-3xl p-6 border border-emerald-500/40 bg-slate-950/80 space-y-2 relative overflow-hidden glow-emerald">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cumulative Dollars Saved</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">{projectedAnnualSavings}</div>
          <p className="text-[11px] text-slate-400">Projected annual savings rate ($ / year)</p>
        </div>

        <div className="cyber-card rounded-3xl p-6 border border-indigo-500/40 bg-slate-950/80 space-y-2 relative overflow-hidden glow-indigo">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monthly Cost Reduction</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-cyan-300">{totalSavedMonthly}</div>
          <p className="text-[11px] text-slate-400">Monthly recurring cloud savings rate</p>
        </div>

        <div className="cyber-card rounded-3xl p-6 border border-purple-500/40 bg-slate-950/80 space-y-2 relative overflow-hidden glow-purple">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Executed Fix Commands</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-purple-300">{remediations.length} Fixes</div>
          <p className="text-[11px] text-slate-400">Automated CLI remediations run in Azure</p>
        </div>

      </div>

      {/* SECTION 1: EXECUTED FIXES AUDIT LOG TABLE */}
      <div className="cyber-card rounded-3xl border border-indigo-500/20 shadow-2xl overflow-hidden space-y-4 p-6 sm:p-8">
        <div className="flex items-center justify-between border-b border-indigo-500/20 pb-4">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <Terminal className="h-5 w-5 text-emerald-400" />
            <span>Executed Fixes Audit Log ({remediations.length})</span>
          </h3>

          <span className="text-xs font-bold text-slate-400 font-mono">
            {remediations.length} records logged
          </span>
        </div>

        {remediations.length === 0 ? (
          <div className="py-10 text-center space-y-2 bg-slate-950/40 rounded-2xl border border-slate-800/60 font-mono">
            <CheckCircle2 className="h-8 w-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-white">No executed fix commands recorded yet.</p>
            <p className="text-xs text-slate-500">Run CLI fix commands on the Dashboard or Cost Report page to record remediation logs here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-950/80">
            <table className="w-full text-left border-collapse font-mono">
              <thead>
                <tr className="bg-slate-900/90 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">Executed Timestamp</th>
                  <th className="py-3.5 px-4">Engineer / User</th>
                  <th className="py-3.5 px-4">Resource Group</th>
                  <th className="py-3.5 px-4">Azure CLI Command</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Est. Savings</th>
                  <th className="py-3.5 px-4 text-right">Logs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                {remediations.map((rem) => {
                  const isOpen = openLogId === rem.id;
                  return (
                    <React.Fragment key={rem.id}>
                      <tr className="hover:bg-slate-900/80 transition-colors">
                        <td className="py-3.5 px-4 font-sans text-slate-400 text-[11px]">
                          {formatDate(rem.created_at)}
                        </td>
                        <td className="py-3.5 px-4 font-sans font-semibold text-white">
                          <div className="flex items-center space-x-1.5">
                            <UserCheck className="h-3.5 w-3.5 text-indigo-400" />
                            <span>{rem.user_email}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-cyan-300">
                          {rem.resource_group}
                        </td>
                        <td className="py-3.5 px-4 text-[11px] text-slate-300 max-w-xs truncate" title={rem.command}>
                          <code>{rem.command}</code>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                            {rem.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-emerald-400">
                          {rem.estimated_savings}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setOpenLogId(isOpen ? null : rem.id)}
                            className="p-1.5 bg-slate-900 text-slate-300 hover:text-white border border-slate-800 rounded-xl cursor-pointer inline-flex items-center space-x-1 text-[10px]"
                            title="Toggle Terminal Output Log"
                          >
                            <span>Logs</span>
                            <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                          </button>
                        </td>
                      </tr>

                      {/* Dropdown Terminal Output Log */}
                      {isOpen && (
                        <tr>
                          <td colSpan={7} className="p-4 bg-slate-950 border-b border-slate-800">
                            <div className="space-y-2 font-mono text-xs text-slate-300">
                              <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800 pb-1">
                                <span>Remediation Execution Output ({rem.id})</span>
                                <span className="text-emerald-400">200 OK</span>
                              </div>
                              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-[11px] overflow-x-auto text-emerald-400">
                                <code>{rem.output || 'Execution completed cleanly on Azure.'}</code>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 2: PAST COST AUDIT INVESTIGATION SCANS */}
      <div className="cyber-card rounded-3xl border border-indigo-500/20 shadow-2xl overflow-hidden space-y-6 p-6 sm:p-8">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-500/20 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <FileText className="h-5 w-5 text-indigo-400" />
              <span>Past AI Cost Audit Investigations ({filteredHistory.length})</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Historical cost scan reports saved in Azure PostgreSQL database
            </p>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 font-mono">
          
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase">Search Group</label>
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer"
            />
          </div>

          <div className="space-y-1 flex flex-col justify-end">
            <button
              onClick={clearFilters}
              className="py-2 px-4 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer w-full border border-slate-800"
            >
              Clear Filters
            </button>
          </div>

        </div>

        {/* Audits History Table */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 font-mono">
            Loading investigation history...
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="py-10 text-center space-y-2 bg-slate-950/40 rounded-2xl border border-slate-800/60 font-mono">
            <FileText className="h-8 w-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-white">No historical cost scans found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-950/80">
              <table className="w-full text-left border-collapse font-mono">
                <thead>
                  <tr className="bg-slate-900/90 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3.5 px-4">Scan Date</th>
                    <th className="py-3.5 px-4">Resource Group</th>
                    <th className="py-3.5 px-4">Scanned</th>
                    <th className="py-3.5 px-4">Issues</th>
                    <th className="py-3.5 px-4">Est. Savings</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                  {paginatedHistory.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-900/80 transition-colors">
                      <td className="py-3.5 px-4 text-slate-400 font-sans text-[11px]">
                        {formatDate(rec.created_at)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">
                        {rec.resource_group}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {rec.resources_scanned} resources
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-rose-400 font-bold bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded text-[11px]">
                          {rec.issues_found} issues
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-emerald-400 font-bold">
                        {rec.estimated_savings}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onSelectRecord(rec)}
                          className="py-1.5 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-cyan-300 hover:text-white border border-indigo-500/40 font-semibold text-xs transition-all flex items-center space-x-1.5 cursor-pointer ml-auto glow-indigo"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Open Report</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Bar */}
            {filteredHistory.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-indigo-500/20 text-xs font-mono">
                <div className="text-slate-400 font-medium">
                  Showing <span className="font-bold text-white">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                  <span className="font-bold text-white">{Math.min(currentPage * pageSize, filteredHistory.length)}</span> of{' '}
                  <span className="font-bold text-cyan-300">{filteredHistory.length}</span> investigation reports
                </div>

                <div className="flex items-center space-x-1.5 flex-wrap">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                    <button
                      key={pg}
                      onClick={() => setCurrentPage(pg)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                        currentPage === pg
                          ? 'bg-indigo-600 text-white border border-indigo-500 shadow-md glow-indigo'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {pg}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
};
