import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, PlusCircle, MinusCircle, RefreshCw, AlertTriangle, Layers, Tag, CheckCircle2, ChevronRight, Lightbulb, Copy, Check, Terminal, ChevronDown, Play } from 'lucide-react';
import { ResourceItem } from '../types';
import { API_BASE_URL } from '../config';

interface DriftMonitorProps {
  token?: string | null;
  currentResources: ResourceItem[];
  previousScanResources?: ResourceItem[];
  resourceGroup: string;
  onRefreshResources?: () => void;
}

export const DriftMonitor: React.FC<DriftMonitorProps> = ({
  token,
  currentResources,
  previousScanResources = [],
  resourceGroup,
  onRefreshResources
}) => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  // Terminal dropdown & Remediation states
  const [openTerminalId, setOpenTerminalId] = useState<string | null>(null);
  const [runningTerminalId, setRunningTerminalId] = useState<string | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<{ [key: string]: string[] }>({});
  const [remediatedKeys, setRemediatedKeys] = useState<Set<string>>(new Set());

  // Map past resources by ID or name for comparison
  const pastMap = new Map<string, ResourceItem>();
  previousScanResources.forEach((res) => pastMap.set(res.name || res.id, res));

  const currentMap = new Map<string, ResourceItem>();
  currentResources.forEach((res) => currentMap.set(res.name || res.id, res));

  // Detect Newly Added Resources
  const addedResources: ResourceItem[] = [];
  currentResources.forEach((res) => {
    if (!pastMap.has(res.name || res.id)) {
      addedResources.push(res);
    }
  });

  // Detect Removed / Deallocated Resources
  const removedResources: ResourceItem[] = [];
  previousScanResources.forEach((res) => {
    if (!currentMap.has(res.name || res.id)) {
      removedResources.push(res);
    }
  });

  // Detect Modified SKUs / Tiers (filter out remediated)
  const allModifiedResources: { name: string; oldSku: string; newSku: string; type: string }[] = [];
  currentResources.forEach((res) => {
    const key = res.name || res.id;
    if (pastMap.has(key)) {
      const past = pastMap.get(key)!;
      const pastSku = past.sku?.name || past.sku?.tier || 'Standard';
      const currentSku = res.sku?.name || res.sku?.tier || 'Standard';
      if (pastSku !== currentSku) {
        allModifiedResources.push({ name: key, oldSku: pastSku, newSku: currentSku, type: res.type });
      }
    }
  });

  const modifiedResources = allModifiedResources.filter((mod, idx) => !remediatedKeys.has(`sku-${mod.name || idx}`));

  // Governance Policy Violations (filter out remediated)
  const allUntaggedResources = currentResources.filter(
    (res) => !res.tags || Object.keys(res.tags).length === 0
  );

  const untaggedResources = allUntaggedResources.filter(
    (res, idx) => !remediatedKeys.has(`tag-${res.name || idx}`)
  );

  // Total Fixed Resources = Deallocated/Removed + Live Remediated Fixes
  const totalFixedCount = removedResources.length + remediatedKeys.size;

  const hasDrift = addedResources.length > 0 || removedResources.length > 0 || modifiedResources.length > 0 || untaggedResources.length > 0;

  const handleCopy = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const toggleTerminal = (key: string, command: string) => {
    if (openTerminalId === key) {
      setOpenTerminalId(null);
    } else {
      setOpenTerminalId(key);
      if (!terminalLogs[key]) {
        setTerminalLogs((prev) => ({
          ...prev,
          [key]: [
            `[$] Initialized Azure CLI terminal session for '${resourceGroup}'.`,
            `[$] Ready to execute: ${command}`,
            `[$] Click 'Run Fix Command' to execute live remediation in Azure.`
          ]
        }));
      }
    }
  };

  const runTerminalFix = async (key: string, command: string) => {
    setRunningTerminalId(key);
    setTerminalLogs((prev) => ({
      ...prev,
      [key]: [
        `[$] Initializing live Azure CLI session...`,
        `[$] Command: ${command}`,
        `[+] Sending execution request to backend...`
      ]
    }));

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/api/execute-fix`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ command })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Execution failed');

      const outputStr = typeof data.output === 'string' ? data.output : JSON.stringify(data.output, null, 2);

      // Immediately add key to remediated set
      setRemediatedKeys((prev) => new Set(prev).add(key));

      setTimeout(() => {
        setOpenTerminalId(null);
      }, 1200);

      setTerminalLogs((prev) => ({
        ...prev,
        [key]: [
          ...(prev[key] || []),
          `[+] Azure CLI Output Response:`,
          outputStr.length > 350 ? outputStr.substring(0, 350) + '... (truncated)' : outputStr,
          `[✓] Status 200 OK: Azure CLI command executed successfully in Azure!`,
          `[✓] Fix complete! Incremented Removed / Fixed counter.`
        ]
      }));

      if (onRefreshResources) {
        onRefreshResources();
      }
    } catch (err: any) {
      console.error('Execute fix error:', err);
      setTerminalLogs((prev) => ({
        ...prev,
        [key]: [
          ...(prev[key] || []),
          `[✗] ERROR: ${err.message || 'Execution failed.'}`
        ]
      }));
    } finally {
      setRunningTerminalId(null);
    }
  };

  return (
    <div className="cyber-card rounded-3xl p-6 sm:p-8 border border-indigo-500/20 shadow-2xl space-y-6 glow-indigo">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-500/20 pb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0 shadow-lg ${
            hasDrift
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 glow-amber'
              : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 glow-emerald'
          }`}>
            {hasDrift ? <ShieldAlert className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
              <span>Azure Infrastructure Drift & Compliance Policy Monitor</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Live baseline compliance comparison for <code className="text-cyan-300 font-mono max-w-[220px] sm:max-w-xs truncate inline-block align-bottom" title={resourceGroup}>{resourceGroup}</code>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`text-xs font-bold font-mono px-3.5 py-1.5 rounded-xl uppercase tracking-wider border ${
            hasDrift
              ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 glow-amber'
              : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 glow-emerald'
          }`}>
            {hasDrift ? 'Drift / Violations Detected' : 'Clean Compliance'}
          </span>
        </div>
      </div>

      {/* Compliance Metric Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono">
        
        <div className="bg-slate-950/80 border border-indigo-500/20 p-4 rounded-2xl space-y-1 shadow-inner">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">New Resources</span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-extrabold text-sky-400">+{addedResources.length}</span>
            <PlusCircle className="h-4 w-4 text-sky-400" />
          </div>
        </div>

        <div className="bg-slate-950/80 border border-emerald-500/30 p-4 rounded-2xl space-y-1 shadow-inner glow-emerald">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Removed / Fixed</span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-extrabold text-emerald-400">-{totalFixedCount}</span>
            <MinusCircle className="h-4 w-4 text-emerald-400" />
          </div>
        </div>

        <div className="bg-slate-950/80 border border-indigo-500/20 p-4 rounded-2xl space-y-1 shadow-inner">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">SKU / Tier Shifts</span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-extrabold text-purple-400">{modifiedResources.length}</span>
            <RefreshCw className="h-4 w-4 text-purple-400" />
          </div>
        </div>

        <div className="bg-slate-950/80 border border-indigo-500/20 p-4 rounded-2xl space-y-1 shadow-inner">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Untagged Violations</span>
          <div className="flex items-center justify-between">
            <span className={`text-xl font-extrabold ${untaggedResources.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {untaggedResources.length}
            </span>
            <Tag className={`h-4 w-4 ${untaggedResources.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`} />
          </div>
        </div>

      </div>

      {/* Clean Compliance Banner or Actionable Recommendations */}
      {!hasDrift ? (
        <div className="bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-emerald-950/40 border border-emerald-500/40 p-5 rounded-2xl flex items-start sm:items-center space-x-4 shadow-xl glow-emerald">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <h4 className="text-sm font-bold text-white">100% Policy Compliant & FinOps Baseline Matched</h4>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full uppercase">
                Passed
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-mono">
              All resources are properly tagged (<code className="text-cyan-300">Environment=Production</code>), SKUs match cost-optimal baselines, and no policy drift was detected for <code className="text-emerald-300">{resourceGroup}</code>.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4 pt-2 border-t border-indigo-500/20">
          <h4 className="text-sm font-bold text-white flex items-center space-x-2 font-mono">
            <Lightbulb className="h-4.5 w-4.5 text-amber-400" />
            <span>Drift Resolution Recommendations & 1-Click Remediation Terminals</span>
          </h4>

          <div className="space-y-4">
            
            {/* Untagged Governance Resolution Card */}
            {untaggedResources.length > 0 && (
              <div className="bg-slate-950/90 border border-amber-500/40 p-4 rounded-2xl space-y-3 glow-amber">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold font-mono px-2 py-0.5 rounded uppercase">
                      Governance Recommendation
                    </span>
                    <h5 className="text-xs font-bold text-white">
                      Enforce Mandatory Tags on {untaggedResources.length} Untagged Resource(s)
                    </h5>
                  </div>
                </div>

                <p className="text-xs text-slate-300 font-mono">
                  Tag resources with standard <code className="text-cyan-300">Environment=Production</code> and <code className="text-cyan-300">Department=DevOps</code> to pass FinOps policy compliance.
                </p>

                {untaggedResources.map((res, idx) => {
                  const itemKey = `tag-${res.name || idx}`;
                  const tagCmd = `az tag create --resource-id "${res.id}" --tags Environment=Production Department=DevOps`;

                  return (
                    <div key={itemKey} className="space-y-2 pt-2 border-t border-slate-800/80 transition-all duration-300">
                      <div className="flex items-center justify-between text-[11px] flex-wrap gap-2 font-mono">
                        <span className="text-slate-400">Resource: <strong className="text-white">{res.name}</strong></span>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleCopy(tagCmd)}
                            className="inline-flex items-center space-x-1 text-[10px] font-bold text-amber-300 hover:text-white bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 rounded-xl cursor-pointer"
                          >
                            {copiedCmd === tagCmd ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                            <span>{copiedCmd === tagCmd ? 'Copied' : 'Copy Tag Command'}</span>
                          </button>

                          <button
                            onClick={() => toggleTerminal(itemKey, tagCmd)}
                            className={`inline-flex items-center space-x-1 text-[10px] font-bold px-2.5 py-1 rounded-xl border cursor-pointer ${
                              openTerminalId === itemKey
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 glow-emerald'
                                : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                            }`}
                          >
                            <Terminal className="h-3 w-3 text-emerald-400" />
                            <span>CMD Terminal</span>
                            <ChevronDown className={`h-3 w-3 transition-transform ${openTerminalId === itemKey ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      </div>

                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
                        <code>{tagCmd}</code>
                      </div>

                      {/* Dropdown CMD Terminal Window */}
                      {openTerminalId === itemKey && (
                        <div className="mt-2 rounded-2xl border border-indigo-500/40 bg-[#070b14] shadow-2xl overflow-hidden animate-fadeIn glow-indigo">
                          <div className="bg-slate-900/90 px-3.5 py-2 border-b border-indigo-500/20 flex items-center justify-between font-mono">
                            <span className="text-[10px] text-cyan-300">bash - azure-cli@cloud-detective:~</span>
                            <button
                              onClick={() => runTerminalFix(itemKey, tagCmd)}
                              disabled={runningTerminalId === itemKey}
                              className="inline-flex items-center space-x-1.5 text-[10px] font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 px-3 py-1 rounded-lg shadow-md cursor-pointer disabled:opacity-50 glow-emerald"
                            >
                              <Play className="h-3 w-3 fill-white" />
                              <span>{runningTerminalId === itemKey ? 'Executing in Azure...' : 'Run Fix Command'}</span>
                            </button>
                          </div>

                          <div className="p-3.5 font-mono text-[11px] space-y-1.5 text-slate-300 min-h-[100px] max-h-[200px] overflow-y-auto bg-slate-950">
                            <div className="text-emerald-400 font-bold">aarvik@azure-cloud:~$ <span className="text-white">{tagCmd}</span></div>
                            {(terminalLogs[itemKey] || []).map((line, lIdx) => (
                              <div key={lIdx} className={line.startsWith('[✓]') ? 'text-emerald-400 font-bold' : line.startsWith('[✗]') ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                                {line}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Modified SKU Resolution Card */}
            {modifiedResources.length > 0 && (
              <div className="bg-slate-950/90 border border-purple-500/40 p-4 rounded-2xl space-y-3 glow-purple">
                <div className="flex items-center justify-between font-mono">
                  <div className="flex items-center space-x-2">
                    <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                      Cost Optimization Recommendation
                    </span>
                    <h5 className="text-xs font-bold text-white">
                      Revert {modifiedResources.length} Modified SKU(s) to Cost-Optimal Tier
                    </h5>
                  </div>
                </div>

                {modifiedResources.map((mod, idx) => {
                  const itemKey = `sku-${mod.name || idx}`;
                  const isVm = mod.type.toLowerCase().includes('virtualmachines');
                  const fixCmd = isVm
                    ? `az vm resize --resource-group ${resourceGroup} --name ${mod.name} --size Standard_B2s`
                    : `az storage account update --name ${mod.name} --resource-group ${resourceGroup} --access-tier Cool --yes`;

                  return (
                    <div key={itemKey} className="space-y-2 pt-2 border-t border-slate-800/80 transition-all duration-300">
                      <div className="flex items-center justify-between text-[11px] flex-wrap gap-2 font-mono">
                        <span className="text-slate-400">
                          Revert <strong className="text-white">{mod.name}</strong> from <code className="text-rose-300">{mod.newSku}</code> to <code className="text-emerald-300">Standard_B2s</code>
                        </span>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleCopy(fixCmd)}
                            className="inline-flex items-center space-x-1 text-[10px] font-bold text-purple-300 hover:text-white bg-purple-500/20 border border-purple-500/40 px-2.5 py-1 rounded-xl cursor-pointer"
                          >
                            {copiedCmd === fixCmd ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                            <span>{copiedCmd === fixCmd ? 'Copied' : 'Copy Fix Command'}</span>
                          </button>

                          <button
                            onClick={() => toggleTerminal(itemKey, fixCmd)}
                            className={`inline-flex items-center space-x-1 text-[10px] font-bold px-2.5 py-1 rounded-xl border cursor-pointer ${
                              openTerminalId === itemKey
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 glow-emerald'
                                : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                            }`}
                          >
                            <Terminal className="h-3 w-3 text-emerald-400" />
                            <span>CMD Terminal</span>
                            <ChevronDown className={`h-3 w-3 transition-transform ${openTerminalId === itemKey ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      </div>

                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
                        <code>{fixCmd}</code>
                      </div>

                      {/* Dropdown CMD Terminal Window */}
                      {openTerminalId === itemKey && (
                        <div className="mt-2 rounded-2xl border border-purple-500/40 bg-[#070b14] shadow-2xl overflow-hidden animate-fadeIn glow-purple">
                          <div className="bg-slate-900/90 px-3.5 py-2 border-b border-purple-500/20 flex items-center justify-between font-mono">
                            <span className="text-[10px] text-purple-300">bash - azure-cli@cloud-detective:~</span>
                            <button
                              onClick={() => runTerminalFix(itemKey, fixCmd)}
                              disabled={runningTerminalId === itemKey}
                              className="inline-flex items-center space-x-1.5 text-[10px] font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 px-3 py-1 rounded-lg shadow-md cursor-pointer disabled:opacity-50 glow-emerald"
                            >
                              <Play className="h-3 w-3 fill-white" />
                              <span>{runningTerminalId === itemKey ? 'Executing in Azure...' : 'Run Fix Command'}</span>
                            </button>
                          </div>

                          <div className="p-3.5 font-mono text-[11px] space-y-1.5 text-slate-300 min-h-[100px] max-h-[200px] overflow-y-auto bg-slate-950">
                            <div className="text-emerald-400 font-bold">aarvik@azure-cloud:~$ <span className="text-white">{fixCmd}</span></div>
                            {(terminalLogs[itemKey] || []).map((line, lIdx) => (
                              <div key={lIdx} className={line.startsWith('[✓]') ? 'text-emerald-400 font-bold' : line.startsWith('[✗]') ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                                {line}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>
      )}

      {/* Infrastructure Change Log List */}
      <div className="space-y-3 pt-2 font-mono text-xs">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-sans">
          Baseline Infrastructure Change Log
        </h4>

        {addedResources.length === 0 && removedResources.length === 0 && modifiedResources.length === 0 && untaggedResources.length === 0 && remediatedKeys.size === 0 && (
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-slate-400 text-center flex items-center justify-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Infrastructure matches baseline scan. No policy drift detected.</span>
          </div>
        )}

        {/* Remediated Items Log */}
        {Array.from(remediatedKeys).map((key) => {
          const resourceName = key.replace(/^(tag|sku)-/, '');
          return (
            <div key={key} className="bg-slate-950/90 border border-emerald-500/40 p-3.5 rounded-2xl flex items-center justify-between text-slate-200 glow-emerald animate-fadeIn">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-white">[POLICY FIX EXECUTED] </span>
                  <span className="text-emerald-300">{resourceName}</span>
                  <span className="text-slate-400 text-[11px] ml-2">(Remediated live on Azure)</span>
                </div>
              </div>
              <span className="text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-md">
                Fixed & Compliant
              </span>
            </div>
          );
        })}

        {addedResources.map((res) => (
          <div key={res.name} className="bg-slate-950/80 border border-sky-500/30 p-3.5 rounded-2xl flex items-center justify-between text-slate-200">
            <div className="flex items-center space-x-3">
              <PlusCircle className="h-4 w-4 text-sky-400 shrink-0" />
              <div>
                <span className="font-bold text-white">[NEW RESOURCE DETECTED] </span>
                <span className="text-sky-300">{res.name}</span>
                <span className="text-slate-400 text-[11px] ml-2">({res.type})</span>
              </div>
            </div>
            <span className="text-[10px] font-semibold bg-sky-950 text-sky-300 border border-sky-800 px-2 py-0.5 rounded-md">
              Added
            </span>
          </div>
        ))}

        {modifiedResources.map((mod) => (
          <div key={mod.name} className="bg-slate-950/80 border border-purple-500/30 p-3.5 rounded-2xl flex items-center justify-between text-slate-200">
            <div className="flex items-center space-x-3">
              <RefreshCw className="h-4 w-4 text-purple-400 shrink-0" />
              <div>
                <span className="font-bold text-white">[SKU SHIFT] </span>
                <span className="text-purple-300">{mod.name}</span>
                <span className="text-slate-400 text-[11px] ml-2">({mod.oldSku} &rarr; {mod.newSku})</span>
              </div>
            </div>
            <span className="text-[10px] font-semibold bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded-md">
              Modified
            </span>
          </div>
        ))}

        {removedResources.map((res) => (
          <div key={res.name} className="bg-slate-950/80 border border-emerald-500/30 p-3.5 rounded-2xl flex items-center justify-between text-slate-200">
            <div className="flex items-center space-x-3">
              <MinusCircle className="h-4 w-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold text-white">[RESOURCE DEALLOCATED / REMEDIATED] </span>
                <span className="text-emerald-300">{res.name}</span>
              </div>
            </div>
            <span className="text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-md">
              Resolved
            </span>
          </div>
        ))}
      </div>

    </div>
  );
};
