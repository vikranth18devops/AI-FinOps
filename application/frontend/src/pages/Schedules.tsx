import React, { useEffect, useState } from 'react';
import { Clock, Bell, Plus, Play, Trash2, Pause, CheckCircle2, AlertTriangle, Layers, Mail, ShieldAlert, Sparkles, RefreshCw, Sliders } from 'lucide-react';
import { ResourceGroup } from '../types';
import { API_BASE_URL } from '../config';

interface ScheduleItem {
  id: string;
  resource_group: string;
  frequency: string;
  alert_email: string;
  status: 'active' | 'paused';
  last_run: string;
  next_run: string;
  created_at: string;
}

interface SchedulesProps {
  token: string | null;
  onRunAnalysisForGroup: (rgName: string) => void;
}

export const SchedulesPage: React.FC<SchedulesProps> = ({ token, onRunAnalysisForGroup }) => {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [resourceGroups, setResourceGroups] = useState<ResourceGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  
  // Custom Frequency State
  const [freqMode, setFreqMode] = useState<'preset' | 'custom'>('preset');
  const [presetFreq, setPresetFreq] = useState<string>('Every 24 Hours (Daily)');
  const [customNumber, setCustomNumber] = useState<number>(3);
  const [customUnit, setCustomUnit] = useState<string>('Days');

  const [alertEmail, setAlertEmail] = useState<string>('finops-alerts@cloud-detective.com');
  const [creating, setCreating] = useState<boolean>(false);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSendTestEmail = async (id: string, email: string, resourceGroup: string) => {
    setSendingEmailId(id);
    setError(null);
    setSuccessMsg(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/api/schedules/send-test-alert`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          recipient_email: email,
          resource_group: resourceGroup
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Email dispatch failed.');

      setSuccessMsg(`Test alert email successfully dispatched to '${email}'!`);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      console.error('Send test email error:', err);
      setError(err.message || 'Error sending test email.');
    } finally {
      setSendingEmailId(null);
    }
  };

  const fetchResourceGroups = async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/api/resource-groups`, { headers });
      const data = await res.json();

      if (res.ok) {
        const groups: ResourceGroup[] = data.resource_groups || [];
        setResourceGroups(groups);
        if (groups.length > 0) setSelectedGroup(groups[0].name);
      }
    } catch (err) {
      console.error('Error fetching resource groups:', err);
    }
  };

  const fetchSchedules = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/api/schedules`, { headers });
      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || 'Failed to fetch schedules.');
      setSchedules(data.schedules || []);
    } catch (err: any) {
      console.error('Error fetching schedules:', err);
      setError(err.message || 'Could not load schedules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResourceGroups();
    fetchSchedules();
  }, []);

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !alertEmail) return;

    const finalFrequency = freqMode === 'custom'
      ? `Every ${customNumber} ${customUnit}`
      : presetFreq;

    setCreating(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/api/schedules`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          resource_group: selectedGroup,
          frequency: finalFrequency,
          alert_email: alertEmail
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to create schedule.');

      setSuccessMsg(`Automated audit schedule (${finalFrequency}) created for '${selectedGroup}'!`);
      fetchSchedules();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Create schedule error:', err);
      setError(err.message || 'Error creating schedule.');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleSchedule = async (id: string) => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/api/schedules/${id}/toggle`, {
        method: 'POST',
        headers
      });

      if (res.ok) {
        fetchSchedules();
      }
    } catch (err) {
      console.error('Toggle schedule error:', err);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/api/schedules/${id}`, {
        method: 'DELETE',
        headers
      });

      if (res.ok) {
        fetchSchedules();
      }
    } catch (err) {
      console.error('Delete schedule error:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Hero Banner */}
      <div className="glass-card rounded-3xl p-8 sm:p-10 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-gradient-to-br from-purple-500/20 via-indigo-500/20 to-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center space-x-2 bg-purple-500/10 border border-purple-500/30 text-purple-300 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">
            <Clock className="h-3.5 w-3.5" />
            <span>Automated FinOps Governance</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Scheduled Cost Audits & Alert Notifications
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Configure automated custom background FinOps cost scans on target Azure Resource Groups. Receive instant email alerts when unattached disks, over-provisioned VMs, or unoptimized tiers are detected.
          </p>
        </div>
      </div>

      {/* Notifications / Alerts Banner */}
      {successMsg && (
        <div className="glass-card bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center space-x-3 text-emerald-300 text-sm font-semibold">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="glass-card bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-center space-x-3 text-rose-300 text-sm font-semibold">
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Create New Schedule Form with Custom Frequency */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-4">
          <Plus className="h-5 w-5 text-indigo-400" />
          <span>Configure New Automated Audit Schedule</span>
        </h3>

        <form onSubmit={handleCreateSchedule} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Target Group Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Target Resource Group
              </label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {resourceGroups.map((rg) => (
                  <option key={rg.name} value={rg.name}>
                    {rg.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Audit Frequency Selection Mode */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Audit Frequency Mode
                </label>
                <div className="flex items-center space-x-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setFreqMode('preset')}
                    className={`px-2 py-0.5 rounded cursor-pointer ${
                      freqMode === 'preset' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Preset
                  </button>
                  <button
                    type="button"
                    onClick={() => setFreqMode('custom')}
                    className={`px-2 py-0.5 rounded cursor-pointer ${
                      freqMode === 'custom' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Custom
                  </button>
                </div>
              </div>

              {freqMode === 'preset' ? (
                <select
                  value={presetFreq}
                  onChange={(e) => setPresetFreq(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="Every 5 Minutes">Every 5 Minutes</option>
                  <option value="Every 15 Minutes">Every 15 Minutes</option>
                  <option value="Every 30 Minutes">Every 30 Minutes</option>
                  <option value="Every 1 Hour">Every 1 Hour</option>
                  <option value="Every 6 Hours">Every 6 Hours</option>
                  <option value="Every 12 Hours">Every 12 Hours</option>
                  <option value="Every 24 Hours (Daily)">Every 24 Hours (Daily)</option>
                  <option value="Every 7 Days (Weekly)">Every 7 Days (Weekly)</option>
                  <option value="Every 30 Days (Monthly)">Every 30 Days (Monthly)</option>
                </select>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400 font-medium">Every</span>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={customNumber}
                    onChange={(e) => setCustomNumber(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-bold text-center focus:outline-none focus:border-indigo-500"
                  />
                  <select
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Minutes">Minutes</option>
                    <option value="Hours">Hours</option>
                    <option value="Days">Days</option>
                    <option value="Weeks">Weeks</option>
                  </select>
                </div>
              )}
            </div>

            {/* Alert Notification Email */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Alert Recipient Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={alertEmail}
                  onChange={(e) => setAlertEmail(e.target.value)}
                  placeholder="devops@company.com"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white font-medium focus:outline-none focus:border-indigo-500 pl-9"
                />
                <Mail className="h-4 w-4 text-slate-500 absolute left-3 top-3.5" />
              </div>
            </div>

          </div>

          {/* Submit Action */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={creating || !selectedGroup}
              className="py-3.5 px-7 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-xs shadow-xl shadow-indigo-500/25 transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <Clock className="h-4 w-4" />
              <span>{creating ? 'Creating Schedule...' : 'Schedule Audit Run'}</span>
            </button>
          </div>

        </form>
      </div>

      {/* Active Schedules Table */}
      <div className="glass-card rounded-2xl border border-slate-800 shadow-xl overflow-hidden space-y-4 p-6 sm:p-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <Bell className="h-5 w-5 text-indigo-400" />
            <span>Active Automated Audit Schedules ({schedules.length})</span>
          </h3>

          <button
            onClick={fetchSchedules}
            className="text-xs font-semibold text-slate-400 hover:text-white flex items-center space-x-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 font-mono">
            Loading schedules...
          </div>
        ) : schedules.length === 0 ? (
          <div className="py-10 text-center space-y-2 bg-slate-950/40 rounded-xl border border-slate-800/60">
            <Clock className="h-8 w-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-white">No recurring audit schedules configured yet.</p>
            <p className="text-xs text-slate-500">Use the form above to schedule custom automated FinOps audits.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Target Resource Group</th>
                  <th className="py-3 px-4">Custom Frequency</th>
                  <th className="py-3 px-4">Alert Recipient</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs text-slate-300 bg-slate-950/50 font-mono">
                {schedules.map((sched) => (
                  <tr key={sched.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">
                      {sched.resource_group}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-indigo-950 text-indigo-300 border border-indigo-800 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase">
                        {sched.frequency}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {sched.alert_email}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        sched.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}>
                        {sched.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2">
                        {/* Send Test Alert Email Button */}
                        <button
                          onClick={() => handleSendTestEmail(sched.id, sched.alert_email, sched.resource_group)}
                          disabled={sendingEmailId === sched.id}
                          className="p-1.5 bg-emerald-500/20 text-emerald-300 hover:text-white border border-emerald-500/40 rounded-lg cursor-pointer disabled:opacity-50"
                          title="Trigger Test Alert Email Now"
                        >
                          <Mail className={`h-3.5 w-3.5 ${sendingEmailId === sched.id ? 'animate-pulse' : ''}`} />
                        </button>

                        {/* Run Audit Now */}
                        <button
                          onClick={() => onRunAnalysisForGroup(sched.resource_group)}
                          className="p-1.5 bg-indigo-600/20 text-indigo-300 hover:text-white border border-indigo-500/40 rounded-lg cursor-pointer"
                          title="Run Audit Now on Dashboard"
                        >
                          <Play className="h-3.5 w-3.5" />
                        </button>

                        {/* Toggle Pause / Resume */}
                        <button
                          onClick={() => handleToggleSchedule(sched.id)}
                          className="p-1.5 bg-slate-900 text-slate-400 hover:text-white border border-slate-800 rounded-lg cursor-pointer"
                          title={sched.status === 'active' ? 'Pause Schedule' : 'Resume Schedule'}
                        >
                          <Pause className="h-3.5 w-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteSchedule(sched.id)}
                          className="p-1.5 bg-rose-500/10 text-rose-400 hover:text-rose-300 border border-rose-500/30 rounded-lg cursor-pointer"
                          title="Delete Schedule"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Automated Alert Log History Card */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <ShieldAlert className="h-5 w-5 text-amber-400" />
          <span>Automated Resource Change Alert History</span>
        </h3>

        <div className="space-y-3 font-mono text-xs">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 flex items-start space-x-3">
            <Bell className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white">[AUTOMATED SCAN ALERT]</span>
                <span className="text-slate-500">2026-08-13 23:30:00</span>
              </div>
              <p className="text-slate-300">
                Resource group <code className="text-indigo-300">vikranth-RG</code> evaluated. Detected storage account accessTier shifted to Cool. Estimated monthly savings: +$50.00/month.
              </p>
            </div>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 flex items-start space-x-3">
            <Bell className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white">[AUTOMATED SCAN ALERT]</span>
                <span className="text-slate-500">2026-08-12 14:00:00</span>
              </div>
              <p className="text-slate-300">
                Resource group <code className="text-indigo-300">vikranth-RG</code> evaluated. Detected over-provisioned Virtual Machine <code className="text-amber-300">vm1</code> running Standard_B2s (Optimal).
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
