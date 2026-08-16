import React, { useEffect, useState } from 'react';
import { Server, Play, RefreshCw, AlertTriangle, Sparkles, Layers, FileText, ArrowRight, DollarSign, AlertCircle, Cpu, HardDrive, Network, Database, Tag, LayoutList, LayoutGrid, FolderTree, Globe, Lock, ShieldCheck, PieChart, Users, Building2, Search, CheckCircle2, Copy, Check, ChevronDown, Activity, Zap } from 'lucide-react';
import { ResourceGroup, ResourceItem } from '../types';
import { API_BASE_URL } from '../config';
import { ProgressTracker } from '../components/ProgressTracker';
import { FinOpsAnalytics } from '../components/FinOpsAnalytics';
import { DriftMonitor } from '../components/DriftMonitor';

interface DashboardProps {
  token: string | null;
  onAnalysisStart: (analysisId: string, resourceGroup: string) => void;
  onAnalysisComplete: (resultData: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  token,
  onAnalysisStart,
  onAnalysisComplete
}) => {
  const [resourceGroups, setResourceGroups] = useState<ResourceGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [loadingGroups, setLoadingGroups] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Discovered Resources List State
  const [groupResources, setGroupResources] = useState<ResourceItem[]>([]);
  const [loadingResources, setLoadingResources] = useState<boolean>(false);

  // View Switcher Mode: 'table' | 'cards' | 'grouped'
  const [resourceViewMode, setResourceViewMode] = useState<'table' | 'cards' | 'grouped'>('table');

  // Tag Allocation Filter State
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');
  const [expandedTagCard, setExpandedTagCard] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Analysis execution state
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [activeAnalysisId, setActiveAnalysisId] = useState<string | null>(null);
  const [activeResourceGroup, setActiveResourceGroup] = useState<string>('');
  const [pendingResult, setPendingResult] = useState<any>(null);

  // Store completed analysis on dashboard
  const [completedReport, setCompletedReport] = useState<any>(null);

  const fetchResourceGroups = async () => {
    setLoadingGroups(true);
    setError(null);
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/api/resource-groups`, { headers });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to fetch resource groups from Azure CLI.');
      }

      const groups: ResourceGroup[] = data.resource_groups || [];
      setResourceGroups(groups);
      if (groups.length > 0) {
        setSelectedGroup(groups[0].name);
      }
    } catch (err: any) {
      console.error('Error fetching resource groups:', err);
      setError(err.message || 'Failed to connect to Azure CLI backend server.');
    } finally {
      setLoadingGroups(false);
    }
  };

  const fetchResourcesForGroup = async (rgName: string) => {
    if (!rgName) return;
    setLoadingResources(true);
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/api/resource-groups/${encodeURIComponent(rgName)}/resources`, { headers });
      const data = await res.json();

      if (res.ok) {
        setGroupResources(data.resources || []);
      } else {
        setGroupResources([]);
      }
    } catch (err) {
      console.error('Error loading resources for group:', err);
      setGroupResources([]);
    } finally {
      setLoadingResources(false);
    }
  };

  useEffect(() => {
    fetchResourceGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      fetchResourcesForGroup(selectedGroup);
    }
  }, [selectedGroup]);

  const handleStartAnalysis = async () => {
    if (!selectedGroup) return;

    setError(null);
    const newAnalysisId = `analysis-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setActiveAnalysisId(newAnalysisId);
    setActiveResourceGroup(selectedGroup);
    setAnalyzing(true);
    setPendingResult(null);

    onAnalysisStart(newAnalysisId, selectedGroup);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          resource_group: selectedGroup,
          analysis_id: newAnalysisId
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to execute cost analysis.');
      }

      setPendingResult(data);
      setCompletedReport(data);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'Error occurred during Azure resource investigation.');
    }
  };

  const handleProgressComplete = () => {
    setAnalyzing(false);
    if (pendingResult) {
      onAnalysisComplete(pendingResult);
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Colorful Azure Resource Icons & Styling Map
  const getResourceStyle = (typeStr: string) => {
    const t = typeStr.toLowerCase();

    if (t.includes('virtualmachines')) {
      return {
        Icon: Cpu,
        bg: 'bg-sky-500/20',
        border: 'border-sky-500/40',
        text: 'text-sky-400',
        badgeBg: 'bg-sky-950/80 text-sky-300 border-sky-800/60',
        accentBar: 'from-sky-500 to-indigo-500',
        label: 'Virtual Machine'
      };
    }
    if (t.includes('storageaccounts')) {
      return {
        Icon: HardDrive,
        bg: 'bg-emerald-500/20',
        border: 'border-emerald-500/40',
        text: 'text-emerald-400',
        badgeBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60',
        accentBar: 'from-emerald-500 to-teal-500',
        label: 'Storage Account'
      };
    }
    if (t.includes('disks')) {
      return {
        Icon: HardDrive,
        bg: 'bg-amber-500/20',
        border: 'border-amber-500/40',
        text: 'text-amber-400',
        badgeBg: 'bg-amber-950/80 text-amber-300 border-amber-800/60',
        accentBar: 'from-amber-500 to-orange-500',
        label: 'Managed Disk'
      };
    }
    if (t.includes('web/sites') || t.includes('appservice')) {
      return {
        Icon: Globe,
        bg: 'bg-purple-500/20',
        border: 'border-purple-500/40',
        text: 'text-purple-400',
        badgeBg: 'bg-purple-950/80 text-purple-300 border-purple-800/60',
        accentBar: 'from-purple-500 to-pink-500',
        label: 'App Service'
      };
    }
    if (t.includes('network') || t.includes('publicip') || t.includes('networkinterfaces')) {
      return {
        Icon: Network,
        bg: 'bg-indigo-500/20',
        border: 'border-indigo-500/40',
        text: 'text-indigo-400',
        badgeBg: 'bg-indigo-950/80 text-indigo-300 border-indigo-800/60',
        accentBar: 'from-indigo-500 to-blue-500',
        label: 'Networking'
      };
    }
    if (t.includes('database') || t.includes('postgresql') || t.includes('sql')) {
      return {
        Icon: Database,
        bg: 'bg-blue-500/20',
        border: 'border-blue-500/40',
        text: 'text-blue-400',
        badgeBg: 'bg-blue-950/80 text-blue-300 border-blue-800/60',
        accentBar: 'from-blue-500 to-cyan-500',
        label: 'Database'
      };
    }
    if (t.includes('keyvault')) {
      return {
        Icon: Lock,
        bg: 'bg-rose-500/20',
        border: 'border-rose-500/40',
        text: 'text-rose-400',
        badgeBg: 'bg-rose-950/80 text-rose-300 border-rose-800/60',
        accentBar: 'from-rose-500 to-pink-500',
        label: 'Key Vault'
      };
    }

    return {
      Icon: Server,
      bg: 'bg-indigo-500/20',
      border: 'border-indigo-500/40',
      text: 'text-indigo-400',
      badgeBg: 'bg-indigo-950/80 text-indigo-300 border-indigo-800/60',
      accentBar: 'from-indigo-500 to-slate-500',
      label: 'Resource'
    };
  };

  const getResourceCategory = (typeStr: string) => {
    const t = typeStr.toLowerCase();
    if (t.includes('virtualmachines')) return 'Compute (Virtual Machines)';
    if (t.includes('storageaccounts') || t.includes('disks')) return 'Storage & Disks';
    if (t.includes('network') || t.includes('publicip')) return 'Networking & IP Addresses';
    if (t.includes('web/sites')) return 'App Services & Web Apps';
    if (t.includes('database') || t.includes('postgresql')) return 'Databases';
    return 'Other Azure Resources';
  };

  // Tag extraction and allocation calculations
  const tagAllocationMap = groupResources.reduce((acc, res) => {
    const resTags = res.tags || {};
    const hasTags = Object.keys(resTags).length > 0;
    const tagKeys = hasTags
      ? Object.entries(resTags).map(([k, v]) => `${k}:${v}`)
      : ['Untagged'];

    tagKeys.forEach((tagStr) => {
      if (!acc[tagStr]) acc[tagStr] = [];
      acc[tagStr].push(res);
    });

    return acc;
  }, {} as Record<string, ResourceItem[]>);

  const availableTags = Object.keys(tagAllocationMap);

  // Filter resources by selected tag and search query
  const filteredResources = groupResources.filter((res) => {
    // Tag filter
    if (selectedTagFilter !== 'all') {
      if (selectedTagFilter === 'Untagged') {
        if (res.tags && Object.keys(res.tags).length > 0) return false;
      } else {
        if (!res.tags) return false;
        const matchesTag = Object.entries(res.tags).some(([k, v]) => `${k}:${v}` === selectedTagFilter);
        if (!matchesTag) return false;
      }
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = res.name.toLowerCase().includes(q);
      const typeMatch = res.type.toLowerCase().includes(q);
      const locMatch = res.location.toLowerCase().includes(q);
      const skuMatch = (res.sku?.name || res.sku?.tier || '').toLowerCase().includes(q);
      return nameMatch || typeMatch || locMatch || skuMatch;
    }

    return true;
  });

  // Group resources by category for 'grouped' view
  const groupedResourcesMap = filteredResources.reduce((acc, res) => {
    const category = getResourceCategory(res.type);
    if (!acc[category]) acc[category] = [];
    acc[category].push(res);
    return acc;
  }, {} as Record<string, ResourceItem[]>);

  const untaggedCount = tagAllocationMap['Untagged']?.length || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">

      {/* AI Command Center Hero Banner */}
      <div className="relative cyber-card rounded-3xl p-8 sm:p-10 border border-indigo-500/30 shadow-2xl overflow-hidden glow-indigo">
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-gradient-to-br from-indigo-500/30 via-purple-500/20 to-cyan-400/20 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />

        <div className="max-w-3xl relative z-10 space-y-4">
          <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/40 text-indigo-300 px-3.5 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider glow-indigo">
            <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
            <span>AI FinOps Intelligence Command Center</span>
          </div>

          <h1 className="font-cyber text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-cyan-300">
            Autonomous Cloud Cost & Governance Scanner
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Select an Azure Resource Group to initiate real-time CLI scanning, tag-based cost allocation, infrastructure drift analysis, and 1-click remediation commands.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 font-mono text-xs text-slate-400">
            <div className="flex items-center space-x-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-indigo-500/30">
              <Zap className="h-3.5 w-3.5 text-emerald-400" />
              <span>Real-Time Telemetry</span>
            </div>
            <div className="flex items-center space-x-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-indigo-500/30">
              <Activity className="h-3.5 w-3.5 text-cyan-400" />
              <span>WebSocket Stream</span>
            </div>
            <div className="flex items-center space-x-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-indigo-500/30">
              <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
              <span>1-Click Remediation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="cyber-card bg-rose-500/10 border border-rose-500/40 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glow-rose">
          <div className="flex items-start space-x-4">
            <AlertTriangle className="h-6 w-6 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1 font-mono">
              <h4 className="text-sm font-bold text-rose-300">Azure Investigation Alert</h4>
              <p className="text-xs text-rose-200/90">{error}</p>
            </div>
          </div>
          {(error.toLowerCase().includes('azure cli') || error.toLowerCase().includes('logged in') || error.toLowerCase().includes('auth')) && (
            <a
              href="/studio"
              target="_blank"
              rel="noreferrer"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/30 shrink-0 flex items-center space-x-2 border border-indigo-400/40"
            >
              <Globe className="h-4 w-4" />
              <span>Authenticate Azure CLI on Studio (/studio)</span>
            </a>
          )}
        </div>
      )}

      {/* Latest Completed Analysis Report Banner (If Analysis Done) */}
      {completedReport && !analyzing && (
        <div className="space-y-6">
          <div className="cyber-card rounded-3xl p-6 sm:p-8 border border-emerald-500/50 bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-emerald-950/40 shadow-2xl space-y-4 relative overflow-hidden glow-emerald">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-bold text-white tracking-tight">
                        AI Cost Scan Analysis Complete
                      </h3>
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold font-mono px-2.5 py-0.5 rounded-full max-w-[200px] sm:max-w-xs truncate inline-block align-bottom" title={completedReport.resource_group}>
                        {completedReport.resource_group}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono">
                      Scanned {completedReport.total_resources} resources with {completedReport.analysis?.issues?.length || 0} cost optimization opportunities detected
                    </p>
                  </div>
                </div>

                {/* Summary Metrics */}
                <div className="flex flex-wrap items-center gap-3 pt-2 font-mono">
                  <div className="bg-slate-950/90 border border-emerald-500/40 px-3.5 py-1.5 rounded-xl flex items-center space-x-2 glow-emerald">
                    <DollarSign className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-300">Projected Savings:</span>
                    <span className="text-sm font-extrabold text-emerald-400">
                      {completedReport.analysis?.total_estimated_monthly_savings || '$0.00/month'}
                    </span>
                  </div>

                  <div className="bg-slate-950/90 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center space-x-2 text-xs">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-slate-400 font-medium">Issues Detected:</span>
                    <span className="font-bold text-rose-400">
                      {completedReport.analysis?.issues?.length || 0} Inefficiencies
                    </span>
                  </div>
                </div>
              </div>

              {/* View Full Report Button */}
              <div>
                <button
                  onClick={() => onAnalysisComplete(completedReport)}
                  className="py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-500 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 flex items-center justify-center space-x-2.5 cursor-pointer w-full md:w-auto glow-emerald"
                >
                  <FileText className="h-4.5 w-4.5" />
                  <span>Inspect Full Report & Fix Commands</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Interactive FinOps Analytics & Visual Charts */}
          <FinOpsAnalytics
            totalSavingsStr={completedReport.analysis?.total_estimated_monthly_savings || '$0.00/month'}
            issues={completedReport.analysis?.issues || []}
            resourceGroup={completedReport.resource_group}
          />
        </div>
      )}

      {/* Progress Tracker (If Analyzing) */}
      {analyzing && activeAnalysisId && (
        <ProgressTracker
          analysisId={activeAnalysisId}
          resourceGroup={activeResourceGroup}
          onComplete={handleProgressComplete}
          onError={(msg) => {
            setError(msg);
            setAnalyzing(false);
          }}
        />
      )}

      {/* Resource Group Selector & Discovered Resources */}
      {!analyzing && (
        <div className="space-y-8">

          {/* Group Selector Card */}
          <div className="cyber-card rounded-3xl p-6 sm:p-8 border border-indigo-500/20 shadow-2xl space-y-6 glow-indigo">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-500/20 pb-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Layers className="h-5 w-5 text-cyan-400" />
                  <span>Target Azure Resource Group Selection</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  Live subscription resources fetched via Azure CLI (`az group list`)
                </p>
              </div>

              <button
                onClick={fetchResourceGroups}
                disabled={loadingGroups}
                className="inline-flex items-center space-x-2 text-xs font-semibold font-mono text-slate-300 hover:text-white bg-slate-950/80 border border-indigo-500/30 hover:border-indigo-400 px-3.5 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50 w-fit glow-indigo"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingGroups ? 'animate-spin text-cyan-400' : ''}`} />
                <span>Sync Azure Groups</span>
              </button>
            </div>

            {loadingGroups ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-400">
                <RefreshCw className="h-8 w-8 animate-spin text-cyan-400" />
                <p className="text-sm font-mono text-cyan-300">Connecting to Azure CLI Subprocess Daemon...</p>
              </div>
            ) : resourceGroups.length === 0 ? (
              <div className="py-10 text-center space-y-3">
                <Server className="h-10 w-10 text-slate-600 mx-auto" />
                <p className="text-sm text-slate-400">No Azure resource groups detected or session expired.</p>
                <p className="text-xs text-slate-500 font-mono">Make sure you are logged into Azure CLI (`az login`).</p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2">
                <div className="space-y-2 flex-1 min-w-0 max-w-full">
                  <label className="block text-[11px] font-semibold font-mono uppercase tracking-wider text-indigo-300">
                    Active Resource Group ({resourceGroups.length} available)
                  </label>
                  <div className="relative w-full max-w-full overflow-hidden">
                    <select
                      value={selectedGroup}
                      onChange={(e) => setSelectedGroup(e.target.value)}
                      className="w-full max-w-full bg-slate-950/90 border border-indigo-500/40 rounded-2xl px-4 py-3.5 pr-10 text-sm text-white font-mono font-medium focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all cursor-pointer appearance-none truncate shadow-inner"
                      title={selectedGroup}
                    >
                      {resourceGroups.map((rg) => {
                        const shortName = rg.name.includes('/') ? rg.name.split('/').pop() || rg.name : rg.name;
                        return (
                          <option key={rg.name} value={rg.name} title={rg.name}>
                            {shortName} ({rg.location})
                          </option>
                        );
                      })}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-cyan-400">
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                {/* Run Cost Analysis Action Button */}
                <button
                  onClick={handleStartAnalysis}
                  disabled={!selectedGroup || analyzing || loadingResources}
                  className="py-3.5 px-8 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-300 flex items-center justify-center space-x-2.5 cursor-pointer disabled:opacity-50 w-full sm:w-auto shrink-0 glow-indigo"
                >
                  <Play className="h-4.5 w-4.5 fill-white" />
                  <span>Execute AI Cost Scan</span>
                </button>
              </div>
            )}
          </div>

          {/* Tag-Based Cost Allocation & Department Breakdown Cards */}
          {selectedGroup && groupResources.length > 0 && (
            <div className="cyber-card rounded-3xl p-6 sm:p-8 border border-indigo-500/20 shadow-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-500/20 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                    <Tag className="h-5 w-5 text-indigo-400" />
                    <span>Tag-Based Cost Allocation & Department Breakdown</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    Resource distribution allocated by project tag, environment, and department
                  </p>
                </div>

                {untaggedCount > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/40 text-amber-400 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold flex items-center space-x-2 glow-amber">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{untaggedCount} Un-tagged violations</span>
                  </div>
                )}
              </div>

              {/* Tag Allocation Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                {Object.entries(tagAllocationMap).map(([tagStr, items]) => {
                  const isUntagged = tagStr === 'Untagged';
                  let displayTag = tagStr;
                  if (tagStr.length > 30) {
                    const parts = tagStr.split(':');
                    if (parts.length > 1) {
                      const key = parts[0];
                      const val = parts.slice(1).join(':').split('/').pop() || parts[1];
                      displayTag = `${key}:${val}`;
                    }
                  }

                  return (
                    <div
                      key={tagStr}
                      onClick={() => setSelectedTagFilter(selectedTagFilter === tagStr ? 'all' : tagStr)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 min-w-0 max-w-full overflow-hidden ${selectedTagFilter === tagStr
                        ? 'bg-indigo-600/20 border-cyan-400 shadow-lg glow-cyan'
                        : isUntagged
                          ? 'bg-amber-950/30 border-amber-800/60 hover:border-amber-500'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-indigo-500/40'
                        }`}
                      title={tagStr}
                    >
                      <div className="flex items-center justify-between gap-2 min-w-0 font-mono">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md truncate max-w-[170px] sm:max-w-[130px] inline-block align-bottom ${isUntagged ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                          }`} title={tagStr}>
                          {displayTag}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedTagCard(expandedTagCard === tagStr ? null : tagStr);
                          }}
                          className="text-[11px] font-bold text-white bg-slate-900 hover:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-800 shrink-0 flex items-center space-x-1 cursor-pointer transition-all"
                          title="Click to view allocated resources"
                        >
                          <span>{items.length} items</span>
                          <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${expandedTagCard === tagStr ? 'rotate-180 text-cyan-400' : 'text-slate-400'}`} />
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-400 truncate font-mono">
                        {isUntagged ? 'Missing governance tags' : 'Allocated Azure resources'}
                      </p>

                      {/* Inline Allocated Resources Dropdown */}
                      {expandedTagCard === tagStr && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="mt-3 pt-3 border-t border-slate-800 space-y-2 max-h-48 overflow-y-auto font-mono text-[11px] bg-slate-950/90 p-2.5 rounded-xl border border-indigo-500/30 animate-fadeIn select-text"
                        >
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans border-b border-slate-800 pb-1 flex items-center justify-between">
                            <span>Allocated Resources</span>
                            <span className="text-cyan-400 font-mono font-bold">{items.length}</span>
                          </div>
                          {items.map((item, iIdx) => {
                            const style = getResourceStyle(item.type);
                            const IconComponent = style.Icon;
                            return (
                              <div key={item.id || iIdx} className="flex items-center justify-between text-slate-300 py-1.5 border-b border-slate-900/60 last:border-0 hover:bg-slate-900/40 px-1 rounded">
                                <div className="flex items-center space-x-2 min-w-0">
                                  <IconComponent className={`h-3.5 w-3.5 ${style.text} shrink-0`} />
                                  <span className="font-bold text-white truncate max-w-[130px]" title={item.name}>{item.name}</span>
                                </div>
                                <span className="text-[10px] text-slate-400 shrink-0 font-sans">{item.location}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Azure Infrastructure Drift & Compliance Policy Monitor */}
          {selectedGroup && groupResources.length > 0 && (
            <DriftMonitor
              token={token}
              currentResources={groupResources}
              resourceGroup={selectedGroup}
              onRefreshResources={() => fetchResourcesForGroup(selectedGroup)}
            />
          )}

          {/* DISCOVERED RESOURCES SECTION */}
          {selectedGroup && (
            <div className="cyber-card rounded-3xl border border-indigo-500/20 shadow-2xl overflow-hidden space-y-6 p-6 sm:p-8">

              {/* Header Bar */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-indigo-500/20 pb-6">
                <div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 shadow-lg">
                      <Server className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center space-x-2">
                        <span>Discovered Resources</span>
                        <span className="text-xs font-bold font-mono bg-indigo-500/20 text-cyan-300 border border-indigo-500/40 px-2.5 py-0.5 rounded-full">
                          {filteredResources.length}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono">
                        Live telemetry scanned in <code className="text-cyan-300 font-mono max-w-[200px] sm:max-w-xs truncate inline-block align-bottom" title={selectedGroup}>{selectedGroup.includes('/') ? selectedGroup.split('/').pop() || selectedGroup : selectedGroup}</code>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Controls Bar: Tag Filter + View Switcher */}
                <div className="flex items-center space-x-2.5 flex-wrap gap-y-2 font-mono">

                  {/* Tag Filter Selector */}
                  {availableTags.length > 0 && (
                    <select
                      value={selectedTagFilter}
                      onChange={(e) => setSelectedTagFilter(e.target.value)}
                      className="bg-slate-950/90 border border-slate-800 text-[11px] font-semibold text-cyan-300 font-mono rounded-xl px-3 py-1.5 focus:outline-none focus:border-cyan-400 cursor-pointer max-w-[170px] truncate shadow-inner"
                      title="Filter by tag"
                    >
                      <option value="all">All Tags ({groupResources.length})</option>
                      {availableTags.map((t) => (
                        <option key={t} value={t}>
                          {t} ({tagAllocationMap[t]?.length || 0})
                        </option>
                      ))}
                    </select>
                  )}

                  {/* View Switcher */}
                  <div className="flex items-center space-x-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800/80 shadow-inner">
                    <button
                      onClick={() => setResourceViewMode('table')}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${resourceViewMode === 'table'
                        ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-md glow-indigo'
                        : 'text-slate-400 hover:text-white'
                        }`}
                      title="Table View"
                    >
                      <LayoutList className="h-3.5 w-3.5" />
                      <span>Table</span>
                    </button>

                    <button
                      onClick={() => setResourceViewMode('cards')}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${resourceViewMode === 'cards'
                        ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-md glow-indigo'
                        : 'text-slate-400 hover:text-white'
                        }`}
                      title="Grid Cards View"
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                      <span>Grid</span>
                    </button>

                    <button
                      onClick={() => setResourceViewMode('grouped')}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${resourceViewMode === 'grouped'
                        ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-md glow-indigo'
                        : 'text-slate-400 hover:text-white'
                        }`}
                      title="Category Trees View"
                    >
                      <FolderTree className="h-3.5 w-3.5" />
                      <span>Category</span>
                    </button>
                  </div>

                </div>
              </div>

              {loadingResources ? (
                <div className="py-16 flex flex-col items-center justify-center space-y-3 text-slate-400">
                  <RefreshCw className="h-7 w-7 animate-spin text-cyan-400" />
                  <p className="text-xs font-mono text-cyan-300">Scanning live Azure resources in {selectedGroup}...</p>
                </div>
              ) : filteredResources.length === 0 ? (
                <div className="py-12 text-center space-y-3 bg-slate-950/40 rounded-2xl border border-slate-800/60 font-mono">
                  <Server className="h-10 w-10 text-slate-600 mx-auto" />
                  <p className="text-sm font-semibold text-white">No Azure resources found matching criteria.</p>
                </div>
              ) : (
                <>
                  {/* VIEW 1: MODERN GLASS TABLE VIEW */}
                  {resourceViewMode === 'table' && (
                    <div className="overflow-x-auto rounded-2xl border border-slate-800/80 shadow-2xl bg-slate-950/80">
                      <table className="w-full text-left border-collapse font-mono">
                        <thead>
                          <tr className="bg-slate-900/90 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            <th className="py-4 px-5">Resource Name & Type</th>
                            <th className="py-4 px-5">Location</th>
                            <th className="py-4 px-5">Governance Tags</th>
                            <th className="py-4 px-5">SKU / Capacity Tier</th>
                            <th className="py-4 px-5">Est. Monthly Cost</th>
                            <th className="py-4 px-5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                          {filteredResources.map((res, idx) => {
                            const style = getResourceStyle(res.type);
                            const IconComponent = style.Icon;
                            const skuName = res.sku?.name || res.sku?.tier || 'Standard';

                            return (
                              <tr key={res.id || idx} className="hover:bg-slate-900/80 transition-all group">

                                <td className="py-4 px-5 font-bold text-white">
                                  <div className="flex items-center space-x-3">
                                    <div className={`w-9 h-9 rounded-xl ${style.bg} border ${style.border} flex items-center justify-center ${style.text} shrink-0 shadow-md group-hover:scale-105 transition-transform`}>
                                      <IconComponent className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                      <span className="truncate block font-bold text-white text-xs max-w-[220px]" title={res.name}>
                                        {res.name}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-normal truncate block max-w-[220px]" title={res.type}>
                                        {res.type}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                <td className="py-4 px-5 text-slate-300 font-sans text-xs">
                                  <div className="flex items-center space-x-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    <span>{res.location}</span>
                                  </div>
                                </td>

                                <td className="py-4 px-5">
                                  {res.tags && Object.keys(res.tags).length > 0 ? (
                                    <div className="flex flex-wrap gap-1 max-w-[260px]">
                                      {Object.entries(res.tags).map(([k, v]) => (
                                        <span key={k} className="bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 px-2 py-0.5 rounded text-[10px]">
                                          {k}:{String(v)}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-amber-400 bg-amber-950/50 border border-amber-800/60 px-2.5 py-1 rounded-lg font-sans text-[10px] font-semibold inline-flex items-center space-x-1">
                                      <AlertCircle className="h-3 w-3" />
                                      <span>Untagged</span>
                                    </span>
                                  )}
                                </td>

                                <td className="py-4 px-5">
                                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${style.badgeBg}`}>
                                    {skuName}
                                  </span>
                                </td>

                                <td className="py-4 px-5 font-mono text-cyan-300 font-bold">
                                  {res.estimated_monthly_cost_formatted || `$${(res.estimated_monthly_cost || 0).toFixed(2)}/mo`}
                                </td>

                                <td className="py-4 px-5 text-right">
                                  <button
                                    onClick={() => handleCopyId(res.id || res.name)}
                                    className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
                                    title="Copy Resource ID"
                                  >
                                    {copiedId === (res.id || res.name) ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                                  </button>
                                </td>

                              </tr>
                            );
                          })}
                        </tbody>

                      </table>
                    </div>
                  )}

                  {/* VIEW 2: ULTRA-PREMIUM 3D GRID CARDS VIEW */}
                  {resourceViewMode === 'cards' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {filteredResources.map((res, idx) => {
                        const style = getResourceStyle(res.type);
                        const IconComponent = style.Icon;
                        const skuName = res.sku?.name || res.sku?.tier || 'Standard';

                        return (
                          <div
                            key={res.id || idx}
                            className="cyber-card bg-slate-950/80 border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl p-5 space-y-4 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between group"
                          >
                            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${style.accentBar}`} />

                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div className={`w-11 h-11 rounded-2xl ${style.bg} border ${style.border} flex items-center justify-center ${style.text} shrink-0 shadow-md group-hover:scale-105 transition-transform`}>
                                  <IconComponent className="h-5 w-5" />
                                </div>

                                <span className={`text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${style.badgeBg}`}>
                                  {skuName}
                                </span>
                              </div>

                              <div className="space-y-1">
                                <h4 className="text-sm font-bold text-white truncate" title={res.name}>
                                  {res.name}
                                </h4>
                                <p className="text-[11px] font-mono text-slate-400 truncate" title={res.type}>
                                  {res.type}
                                </p>
                              </div>

                              {/* Tags List */}
                              <div className="pt-1">
                                {res.tags && Object.keys(res.tags).length > 0 ? (
                                  <div className="flex flex-wrap gap-1 font-mono">
                                    {Object.entries(res.tags).map(([k, v]) => (
                                      <span key={k} className="bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 px-2 py-0.5 rounded text-[10px]">
                                        {k}:{String(v)}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-amber-400 bg-amber-950/40 border border-amber-800/50 px-2.5 py-0.5 rounded text-[10px] font-sans">
                                    Untagged
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] pt-3 border-t border-slate-800/60 text-slate-400 font-mono">
                              <span className="font-medium flex items-center space-x-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                <span>{res.location}</span>
                              </span>

                              <button
                                onClick={() => handleCopyId(res.id || res.name)}
                                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                              >
                                {copiedId === (res.id || res.name) ? 'Copied' : 'Copy ID'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* VIEW 3: CATEGORY GROUPED TREES VIEW */}
                  {resourceViewMode === 'grouped' && (
                    <div className="space-y-6">
                      {Object.entries(groupedResourcesMap).map(([category, items]) => (
                        <div key={category} className="cyber-card bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 space-y-4 shadow-xl">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <div className="flex items-center space-x-3">
                              <span className="text-sm font-bold text-white tracking-tight">
                                {category}
                              </span>
                              <span className="bg-indigo-500/20 text-cyan-300 border border-indigo-500/40 text-xs font-bold font-mono px-2.5 py-0.5 rounded-full">
                                {items.length} resources
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono">
                            {items.map((res, idx) => {
                              const style = getResourceStyle(res.type);
                              const IconComponent = style.Icon;
                              const skuName = res.sku?.name || res.sku?.tier || 'Standard';

                              return (
                                <div
                                  key={res.id || idx}
                                  className="bg-slate-950/90 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between space-x-3 text-xs hover:border-indigo-500/40 transition-all"
                                >
                                  <div className="flex items-center space-x-3 min-w-0">
                                    <div className={`w-9 h-9 rounded-xl ${style.bg} border ${style.border} flex items-center justify-center ${style.text} shrink-0`}>
                                      <IconComponent className="h-4.5 w-4.5" />
                                    </div>
                                    <div className="min-w-0">
                                      <span className="font-bold text-white truncate block text-xs" title={res.name}>
                                        {res.name}
                                      </span>
                                      <span className="text-[10px] text-slate-400 block truncate">
                                        {res.location}
                                      </span>
                                    </div>
                                  </div>

                                  <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${style.badgeBg} shrink-0`}>
                                    {skuName}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

            </div>
          )}

        </div>
      )}

    </div>
  );
};
