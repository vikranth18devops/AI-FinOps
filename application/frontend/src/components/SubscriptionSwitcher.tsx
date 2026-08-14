import React, { useEffect, useState } from 'react';
import { Globe, RefreshCw, Layers, DollarSign, CheckCircle2, ChevronDown, Sparkles, BarChart2, Server, ShieldCheck, ExternalLink } from 'lucide-react';

interface Subscription {
  id: string;
  name: string;
  isDefault: boolean;
  state: string;
  tenantId?: string;
}

interface SubscriptionSwitcherProps {
  token: string | null;
  onSubscriptionChange?: () => void;
}

export const SubscriptionSwitcher: React.FC<SubscriptionSwitcherProps> = ({
  token,
  onSubscriptionChange
}) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [activeSubId, setActiveSubId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [switching, setSwitching] = useState<boolean>(false);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState<boolean>(false);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('http://localhost:8080/api/subscriptions', { headers });
      const data = await res.json();

      if (res.ok && data.subscriptions) {
        const subs: Subscription[] = data.subscriptions;
        setSubscriptions(subs);

        const defaultSub = subs.find((s) => s.isDefault) || subs[0];
        if (defaultSub) {
          setActiveSubId(defaultSub.id);
        }
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleSwitchSubscription = async (subId: string) => {
    if (!subId || subId === activeSubId) return;

    setSwitching(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('http://localhost:8080/api/subscriptions/set-active', {
        method: 'POST',
        headers,
        body: JSON.stringify({ subscription_id: subId })
      });

      if (res.ok) {
        setActiveSubId(subId);
        setSubscriptions((prev) =>
          prev.map((s) => ({ ...s, isDefault: s.id === subId }))
        );
        if (onSubscriptionChange) {
          onSubscriptionChange();
        }
      }
    } catch (err) {
      console.error('Error switching subscription:', err);
    } finally {
      setSwitching(false);
    }
  };

  const activeSub = subscriptions.find((s) => s.id === activeSubId) || subscriptions[0];

  return (
    <div className="flex items-center space-x-3">
      
      {/* Subscription Selector Bar Dropdown */}
      <div className="relative">
        <div className="flex items-center space-x-2 bg-slate-900/90 border border-indigo-500/30 px-3.5 py-1.5 rounded-xl text-xs shadow-sm">
          <Globe className={`h-4 w-4 text-indigo-400 ${switching ? 'animate-spin' : ''}`} />
          
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400 font-medium">Sub:</span>
            <select
              value={activeSubId}
              onChange={(e) => handleSwitchSubscription(e.target.value)}
              disabled={switching || loading}
              className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer max-w-[180px] sm:max-w-[220px] truncate"
              title={activeSub ? `${activeSub.name} (${activeSub.id})` : 'Select Subscription'}
            >
              {subscriptions.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                  {s.name} {s.isDefault ? '(Active)' : ''}
                </option>
              ))}
            </select>
          </div>

          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
        </div>
      </div>

      {/* Subscription Comparison Workspace Launcher Button */}
      <button
        onClick={() => setShowWorkspaceModal(true)}
        className="hidden sm:inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
        title="Open Multi-Subscription Comparison Workspace"
      >
        <BarChart2 className="h-3.5 w-3.5" />
        <span>Compare Subs</span>
      </button>

      {/* MULTI-SUBSCRIPTION COMPARISON WORKSPACE MODAL */}
      {showWorkspaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-card max-w-4xl w-full rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto bg-slate-900/95">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                  <BarChart2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
                    <span>Multi-Subscription FinOps Comparison Workspace</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cross-subscription cloud spend and governance health metrics
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowWorkspaceModal(false)}
                className="text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Comparison Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subscriptions.map((sub) => {
                const isActive = sub.id === activeSubId;
                return (
                  <div
                    key={sub.id}
                    className={`p-5 rounded-2xl border transition-all space-y-4 ${
                      isActive
                        ? 'bg-indigo-600/10 border-indigo-500 shadow-xl shadow-indigo-500/10'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-bold text-white truncate" title={sub.name}>
                            {sub.name}
                          </h4>
                          {isActive && (
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-mono text-slate-400 truncate" title={sub.id}>
                          ID: {sub.id}
                        </p>
                      </div>

                      <button
                        onClick={() => handleSwitchSubscription(sub.id)}
                        disabled={isActive || switching}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
                          isActive
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 cursor-default'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow'
                        }`}
                      >
                        {isActive ? 'Current' : 'Switch'}
                      </button>
                    </div>

                    {/* Subscription Health Summary */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 font-mono text-xs">
                      <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-center space-y-0.5">
                        <span className="text-[10px] text-slate-400 uppercase font-sans">Status</span>
                        <div className="text-xs font-bold text-emerald-400">{sub.state}</div>
                      </div>

                      <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-center space-y-0.5">
                        <span className="text-[10px] text-slate-400 uppercase font-sans">FinOps Score</span>
                        <div className="text-xs font-bold text-indigo-300">94 / 100</div>
                      </div>

                      <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-center space-y-0.5">
                        <span className="text-[10px] text-slate-400 uppercase font-sans">Waste Est.</span>
                        <div className="text-xs font-bold text-emerald-400">$340 / mo</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowWorkspaceModal(false)}
                className="py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
              >
                Close Workspace
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
