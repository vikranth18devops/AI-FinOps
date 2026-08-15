import React, { useState } from 'react';
import { ShieldAlert, DollarSign, Copy, Check, ArrowLeft, Terminal, AlertTriangle, Layers, Lightbulb, ChevronDown, Play, Sparkles, Download, FileSpreadsheet, FileText as PdfIcon, Zap, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { CostIssue, CostAnalysisDetail, ResourceItem } from '../types';
import { API_BASE_URL } from '../config';
import { FinOpsAnalytics } from '../components/FinOpsAnalytics';

interface ReportProps {
  token: string | null;
  analysisData: {
    resource_group: string;
    total_resources: number;
    resources: ResourceItem[];
    analysis: CostAnalysisDetail;
  };
  onBackToDashboard: () => void;
  onUpdateReport?: (updatedReport: any) => void;
}

export const Report: React.FC<ReportProps> = ({ token, analysisData, onBackToDashboard, onUpdateReport }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [exportingPDF, setExportingPDF] = useState<boolean>(false);

  // Terminal dropdown states
  const [openTerminalId, setOpenTerminalId] = useState<string | null>(null);
  const [runningTerminalId, setRunningTerminalId] = useState<string | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<{ [issueId: string]: string[] }>({});
  const [remediatedIssueIds, setRemediatedIssueIds] = useState<Set<string>>(new Set());

  // Batch Remediation states
  const [batchOpen, setBatchOpen] = useState<boolean>(false);
  const [batchRunning, setBatchRunning] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [batchLogs, setBatchLogs] = useState<string[]>([]);

  const { resource_group, total_resources, resources, analysis } = analysisData;
  const issues = analysis?.issues || [];

  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [liveResources, setLiveResources] = useState<ResourceItem[]>(resources || []);

  const parseCostStr = (str?: string): number => {
    if (!str) return 0;
    const match = str.match(/[\d,]+\.?\d*/);
    if (!match) return 0;
    return parseFloat(match[0].replace(/,/g, ''));
  };

  // Base metrics from initial analysisData
  const initialTotalCost = parseCostStr(analysis?.total_current_monthly_cost) || liveResources.reduce((acc, r) => acc + (r.estimated_monthly_cost || 10), 0);
  const initialSavings = parseCostStr(analysis?.total_estimated_monthly_savings) || issues.reduce((acc, i) => acc + parseCostStr(i.estimated_savings), 0);
  const initialTargetCost = parseCostStr(analysis?.projected_monthly_cost_after_remediation) || Math.max(0, initialTotalCost - initialSavings);

  // Compute achieved savings from remediated issues
  const achievedSavings = issues.reduce((acc, issue, idx) => {
    const issueId = issue.id || `issue-${idx}`;
    const isFixed = remediatedIssueIds.has(issueId) || remediatedIssueIds.has(issue.affected_resource.toLowerCase());
    return acc + (isFixed ? parseCostStr(issue.estimated_savings) : 0);
  }, 0);

  // Live metrics reflecting real-time fixes!
  const currentLiveCost = Math.max(initialTargetCost, initialTotalCost - achievedSavings);
  const currentPotentialSavings = Math.max(0, initialSavings - achievedSavings);
  const remainingIssuesCount = issues.reduce((acc, issue, idx) => {
    const issueId = issue.id || `issue-${idx}`;
    const isFixed = remediatedIssueIds.has(issueId) || remediatedIssueIds.has(issue.affected_resource.toLowerCase());
    return acc + (isFixed ? 0 : 1);
  }, 0);

  const liveSavingsPercentage = initialTotalCost > 0 ? ((achievedSavings / initialTotalCost) * 100).toFixed(1) : '0.0';

  const notifyParentReportUpdate = (updatedSet: Set<string>, updatedResourcesList?: ResourceItem[]) => {
    if (!onUpdateReport) return;
    const resList = updatedResourcesList || liveResources;

    const newAchieved = issues.reduce((acc, issue, idx) => {
      const iId = issue.id || `issue-${idx}`;
      const isFixed = updatedSet.has(iId) || updatedSet.has(issue.affected_resource.toLowerCase());
      return acc + (isFixed ? parseCostStr(issue.estimated_savings) : 0);
    }, 0);

    const newCurrentCost = Math.max(initialTargetCost, initialTotalCost - newAchieved);
    const newPotentialSavings = Math.max(0, initialSavings - newAchieved);

    const updatedBreakdown = (analysis?.resource_cost_breakdown || []).map((item) => {
      const isRemediated = updatedSet.has(item.name.toLowerCase()) || Array.from(updatedSet).some(id => id.toLowerCase().includes(item.name.toLowerCase()));
      if (isRemediated) {
        return {
          ...item,
          current_cost: item.post_remediation_cost,
          potential_savings: '$0.00/mo',
          status: 'Optimal'
        };
      }
      return item;
    });

    onUpdateReport({
      ...analysisData,
      resources: resList,
      analysis: {
        ...analysis,
        total_current_monthly_cost: `$${newCurrentCost.toFixed(2)}/month`,
        total_estimated_monthly_savings: `$${newPotentialSavings.toFixed(2)}/month`,
        projected_monthly_cost_after_remediation: `$${initialTargetCost.toFixed(2)}/month`,
        resource_cost_breakdown: updatedBreakdown
      }
    });
  };

  const handleRefreshData = async () => {
    setRefreshing(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/api/resource-groups/${encodeURIComponent(resource_group)}/resources`, { headers });
      const data = await res.json();
      if (res.ok && data.resources) {
        setLiveResources(data.resources);
        notifyParentReportUpdate(remediatedIssueIds, data.resources);
      }
    } catch (err) {
      console.error('Failed to refresh report telemetry:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCopyCommand = (command: string, issueId: string) => {
    navigator.clipboard.writeText(command);
    setCopiedId(issueId);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const exportToCSV = () => {
    const headers = ['Issue ID', 'Severity', 'Category', 'Title', 'Affected Resource', 'Estimated Savings', 'Description', 'Azure CLI Fix Command'];
    
    const rows = issues.map((issue, idx) => [
      `"${issue.id || `issue-${idx + 1}`}"`,
      `"${issue.severity || 'medium'}"`,
      `"${issue.category || 'FinOps'}"`,
      `"${(issue.title || '').replace(/"/g, '""')}"`,
      `"${(issue.affected_resource || '').replace(/"/g, '""')}"`,
      `"${issue.estimated_savings || '$0.00'}"`,
      `"${(issue.description || '').replace(/"/g, '""')}"`,
      `"${(issue.fix_command || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [
      `# Azure FinOps Cost Audit Report for Resource Group: ${resource_group}`,
      `# Current Monthly Cost: $${currentLiveCost.toFixed(2)}/month`,
      `# Achieved Remediation Savings: $${achievedSavings.toFixed(2)}/month`,
      `# Remaining Potential Savings: $${currentPotentialSavings.toFixed(2)}/month`,
      `# Target Cost After Fix: $${initialTargetCost.toFixed(2)}/month`,
      `# Date Generated: ${new Date().toLocaleString()}`,
      '',
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Azure_FinOps_Report_${resource_group}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = async () => {
    setExportingPDF(true);
    try {
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 595.28, 841.89, 'F');

      // Title Header
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('AI Cloud Cost Detective', 40, 50);

      doc.setTextColor(129, 140, 248);
      doc.setFontSize(11);
      doc.text(`FinOps Executive Audit Report - ${resource_group}`, 40, 70);

      // Summary Box
      doc.setFillColor(30, 41, 59);
      doc.roundedRect(40, 90, 515, 60, 8, 8, 'F');

      doc.setTextColor(148, 163, 184);
      doc.setFontSize(9);
      doc.text('Current Monthly Cost:', 55, 112);
      doc.text('Achieved Savings:', 220, 112);
      doc.text('Remaining Issues:', 385, 112);

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(52, 211, 153);
      doc.text(`$${currentLiveCost.toFixed(2)}/mo`, 55, 133);

      doc.setTextColor(129, 140, 248);
      doc.text(`$${achievedSavings.toFixed(2)}/mo`, 220, 133);

      doc.setTextColor(244, 63, 94);
      doc.text(String(remainingIssuesCount), 385, 133);

      // Executive Summary
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Executive FinOps Summary', 40, 175);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(203, 213, 225);
      const summaryLines = doc.splitTextToSize(analysis?.summary || 'No summary available.', 515);
      doc.text(summaryLines, 40, 192);

      // Issues List
      let yPos = 240 + (summaryLines.length * 10);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('Actionable Cost Inefficiencies & CLI Fixes', 40, yPos);
      yPos += 20;

      issues.forEach((issue, idx) => {
        if (yPos > 740) {
          doc.addPage();
          doc.setFillColor(15, 23, 42);
          doc.rect(0, 0, 595.28, 841.89, 'F');
          yPos = 40;
        }

        doc.setFillColor(30, 41, 59);
        doc.roundedRect(40, yPos, 515, 70, 6, 6, 'F');

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(`${idx + 1}. ${issue.title}`, 50, yPos + 20);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(251, 191, 36);
        doc.text(`Severity: ${issue.severity?.toUpperCase()} | Category: ${issue.category} | Est. Savings: ${issue.estimated_savings}`, 50, yPos + 34);

        doc.setFont('courier', 'normal');
        doc.setTextColor(148, 163, 184);
        const cmdText = doc.splitTextToSize(`Fix Command: ${issue.fix_command}`, 490);
        doc.text(cmdText, 50, yPos + 50);

        yPos += 80;
      });

      doc.save(`Azure_FinOps_Report_${resource_group}_${Date.now()}.pdf`);
    } catch (err) {
      console.error('PDF Export error:', err);
    } finally {
      setExportingPDF(false);
    }
  };

  const toggleTerminal = (issueId: string, command: string) => {
    if (openTerminalId === issueId) {
      setOpenTerminalId(null);
    } else {
      setOpenTerminalId(issueId);
      if (!terminalLogs[issueId]) {
        setTerminalLogs((prev) => ({
          ...prev,
          [issueId]: [
            `[$] Initialized Azure CLI terminal session for '${resource_group}'.`,
            `[$] Ready to execute: ${command}`,
            `[$] Click 'Run Fix Command' to execute live remediation script in Azure.`
          ]
        }));
      }
    }
  };

  const runTerminalFix = async (issueId: string, command: string, affectedRes?: string) => {
    setRunningTerminalId(issueId);
    setTerminalLogs((prev) => ({
      ...prev,
      [issueId]: [
        `[$] Initializing live Azure CLI session...`,
        `[$] Command: ${command}`,
        `[+] Sending execution request to backend...`
      ]
    }));

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/api/execute-fix`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ command })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to execute Azure CLI fix command.');
      }

      const outputStr = typeof data.output === 'string'
        ? data.output
        : JSON.stringify(data.output, null, 2);

      // Auto-remove fixed issue card & update live metrics
      let updatedSet: Set<string> = new Set();
      setRemediatedIssueIds((prev) => {
        const next = new Set(prev);
        next.add(issueId);
        if (affectedRes) next.add(affectedRes.toLowerCase());
        updatedSet = next;
        return next;
      });
      notifyParentReportUpdate(updatedSet);

      setTimeout(() => {
        setOpenTerminalId(null);
      }, 1200);

      setTerminalLogs((prev) => ({
        ...prev,
        [issueId]: [
          ...(prev[issueId] || []),
          `[+] Azure CLI Output Response:`,
          outputStr.length > 350 ? outputStr.substring(0, 350) + '... (truncated)' : outputStr,
          `[✓] Status 200 OK: Azure CLI remediation command executed successfully in Azure!`,
          `[✓] Remediation done! Metrics & costs updated live.`
        ]
      }));
    } catch (err: any) {
      console.error('Execute fix error:', err);
      setTerminalLogs((prev) => ({
        ...prev,
        [issueId]: [
          ...(prev[issueId] || []),
          `[✗] ERROR: ${err.message || 'Execution failed.'}`,
          `[!] Make sure your Azure CLI session is logged in and active.`
        ]
      }));
    } finally {
      setRunningTerminalId(null);
    }
  };

  // Batch Remediation Run
  const runBatchRemediation = async () => {
    if (issues.length === 0) return;
    setBatchOpen(true);
    setBatchRunning(true);
    setBatchProgress({ current: 0, total: issues.length });
    setBatchLogs([
      `[$] Initializing Automated Batch Remediation Engine for Resource Group '${resource_group}'...`,
      `[$] Total Inefficiencies to Remediate: ${issues.length}`,
      `--------------------------------------------------------------------------------`
    ]);

    let successCount = 0;
    let failCount = 0;

    for (let idx = 0; idx < issues.length; idx++) {
      const issue = issues[idx];
      const issueId = issue.id || `issue-${idx}`;
      const cmd = issue.fix_command;
      setBatchProgress({ current: idx + 1, total: issues.length });

      if (!cmd) continue;

      setBatchLogs((prev) => [
        ...prev,
        `[+] Step (${idx + 1}/${issues.length}): Remediating '${issue.affected_resource}' (${issue.title})...`,
        `[+] Executing: ${cmd}`
      ]);

      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${API_BASE_URL}/api/execute-fix`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ command: cmd })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Execution failed');

        successCount++;
        let batchSet: Set<string> = new Set();
        setRemediatedIssueIds((prev) => {
          const next = new Set(prev);
          next.add(issueId);
          if (issue.affected_resource) next.add(issue.affected_resource.toLowerCase());
          batchSet = next;
          return next;
        });
        notifyParentReportUpdate(batchSet);

        setBatchLogs((prev) => [
          ...prev,
          `[✓] Step (${idx + 1}/${issues.length}) SUCCESS: ${issue.affected_resource} updated cleanly in Azure!`,
          `--------------------------------------------------------------------------------`
        ]);
      } catch (err: any) {
        failCount++;
        setBatchLogs((prev) => [
          ...prev,
          `[✗] Step (${idx + 1}/${issues.length}) FAILED: ${err.message || 'Execution error'}`,
          `--------------------------------------------------------------------------------`
        ]);
      }
    }

    setBatchLogs((prev) => [
      ...prev,
      `[✓] BATCH REMEDIATION RUN COMPLETE!`,
      `[✓] Summary: ${successCount} succeeded, ${failCount} failed out of ${issues.length} total.`,
      `[✓] All cost metrics, savings, and post-fix totals updated in real-time!`
    ]);

    setBatchRunning(false);
  };

  const filteredIssues = issues.filter((issue, idx) => {
    const issueId = issue.id || `issue-${idx}`;
    if (remediatedIssueIds.has(issueId) || remediatedIssueIds.has(issue.affected_resource.toLowerCase())) return false;
    if (filterSeverity === 'all') return true;
    return issue.severity?.toLowerCase() === filterSeverity.toLowerCase();
  });

  const getSeverityBadgeClass = (severity: string) => {
    const sev = severity?.toLowerCase();
    if (sev === 'high') {
      return 'bg-rose-500/20 text-rose-300 border-rose-500/40 glow-rose';
    }
    if (sev === 'medium') {
      return 'bg-amber-500/20 text-amber-300 border-amber-500/40 glow-amber';
    }
    return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 glow-cyan';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
      
      {/* Top Header Bar & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center space-x-2 text-xs font-mono font-semibold text-slate-300 hover:text-white bg-slate-950/80 border border-indigo-500/30 hover:border-cyan-400 px-4 py-2.5 rounded-xl transition-all cursor-pointer w-fit glow-indigo"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Command Dashboard</span>
        </button>

        {/* Export & Refresh Buttons Bar */}
        <div className="flex items-center space-x-3 flex-wrap gap-y-2 font-mono">
          <div className="flex items-center space-x-2 text-xs text-slate-400 mr-2">
            <span>Target Group:</span>
            <span className="font-semibold text-cyan-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-cyan-500/30">
              {resource_group}
            </span>
          </div>

          {/* One-Click Batch Remediate All Button */}
          {remainingIssuesCount > 0 && (
            <button
              onClick={runBatchRemediation}
              disabled={batchRunning}
              className="inline-flex items-center space-x-2 text-xs font-extrabold text-white bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-4 py-2.5 rounded-xl transition-all shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 cursor-pointer disabled:opacity-50 glow-purple"
            >
              <Zap className="h-4 w-4 fill-white" />
              <span>{batchRunning ? `Batch Fixing (${batchProgress.current}/${batchProgress.total})...` : `Remediate All (${remainingIssuesCount})`}</span>
            </button>
          )}

          <button
            onClick={exportToCSV}
            className="inline-flex items-center space-x-2 text-xs font-bold text-emerald-300 hover:text-white bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer glow-emerald"
            title="Export CSV Spreadsheet"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={exportToPDF}
            disabled={exportingPDF}
            className="inline-flex items-center space-x-2 text-xs font-bold text-cyan-300 hover:text-white bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-50 glow-indigo"
            title="Export Executive PDF Report"
          >
            <PdfIcon className="h-4 w-4 text-cyan-400" />
            <span>{exportingPDF ? 'Generating PDF...' : 'Export PDF'}</span>
          </button>

          {/* Refresh Data Icon Button Beside Export PDF */}
          <button
            onClick={handleRefreshData}
            disabled={refreshing}
            className="inline-flex items-center space-x-2 text-xs font-bold text-cyan-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-50 glow-cyan"
            title="Re-scan live Azure resources & update cost telemetry"
          >
            <RefreshCw className={`h-4 w-4 text-cyan-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>
        </div>
      </div>

      {/* Automated Batch Remediation Terminal Console Drawer */}
      {batchOpen && (
        <div className="cyber-card rounded-3xl border border-purple-500/50 bg-[#070b14] shadow-2xl overflow-hidden space-y-4 animate-fadeIn glow-purple">
          <div className="bg-slate-900/90 px-6 py-4 border-b border-purple-500/20 flex items-center justify-between flex-wrap gap-3 font-mono">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
                <Zap className="h-5 w-5 fill-purple-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                  <span>Autonomous Batch Remediation Engine</span>
                  {batchRunning && <RefreshCw className="h-4 w-4 animate-spin text-purple-400 ml-1" />}
                </h3>
                <p className="text-xs text-slate-400">
                  Executing {issues.length} Azure CLI commands sequentially in Azure
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {batchRunning && (
                <span className="text-xs text-purple-300 bg-purple-950 border border-purple-800 px-3 py-1 rounded-full font-bold">
                  Progress: {batchProgress.current} / {batchProgress.total}
                </span>
              )}
              <button
                onClick={() => setBatchOpen(false)}
                disabled={batchRunning}
                className="text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                Close Console
              </button>
            </div>
          </div>

          <div className="p-6 font-mono text-xs space-y-2 text-slate-300 min-h-[220px] max-h-[360px] overflow-y-auto bg-slate-950/95">
            {batchLogs.map((line, idx) => (
              <div key={idx} className="leading-relaxed">
                {line.startsWith('[✓]') ? (
                  <span className="text-emerald-400 font-bold">{line}</span>
                ) : line.startsWith('[✗]') ? (
                  <span className="text-rose-400 font-bold">{line}</span>
                ) : line.startsWith('[+]') ? (
                  <span className="text-cyan-400 font-semibold">{line}</span>
                ) : line.startsWith('[$]') ? (
                  <span className="text-purple-300 font-bold">{line}</span>
                ) : (
                  <span className="text-slate-400">{line}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary KPI Cards: Live Updated Current Cost, Savings Achieved, Post-Fix Target */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 font-mono">
        
        {/* Live Current Monthly Cost */}
        <div className="cyber-card rounded-3xl p-5 border border-cyan-500/30 bg-slate-950/80 space-y-2 relative overflow-hidden glow-cyan">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Current Monthly Cost
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-white tracking-tight">
              ${currentLiveCost.toFixed(2)}/mo
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Live active spend for {total_resources} resources
          </p>
        </div>

        {/* Remediation Savings Achieved */}
        <div className="cyber-card rounded-3xl p-5 border border-emerald-500/40 bg-slate-950/80 space-y-2 relative overflow-hidden glow-emerald">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Savings Achieved
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Zap className="h-4 w-4 fill-emerald-400" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-emerald-400 tracking-tight">
              ${achievedSavings.toFixed(2)}/mo
            </span>
            <span className="text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded-full">
              {liveSavingsPercentage}% Reduced
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Cost saved via executed fix commands
          </p>
        </div>

        {/* Remaining Potential Savings */}
        <div className="cyber-card rounded-3xl p-5 border border-purple-500/30 bg-slate-950/80 space-y-2 relative overflow-hidden glow-purple">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Potential Savings
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Lightbulb className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-purple-300 tracking-tight">
              ${currentPotentialSavings.toFixed(2)}/mo
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Remaining savings from unfixed issues
          </p>
        </div>

        {/* Target Cost After Fix */}
        <div className="cyber-card rounded-3xl p-5 border border-indigo-500/40 bg-slate-950/80 space-y-2 relative overflow-hidden glow-indigo">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Cost After Fix
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-indigo-300 tracking-tight">
              ${initialTargetCost.toFixed(2)}/mo
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Target optimized monthly spend
          </p>
        </div>

        {/* Remaining Cost Issues Found */}
        <div className="cyber-card rounded-3xl p-5 border border-rose-500/30 bg-slate-950/80 space-y-2 relative overflow-hidden glow-rose">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Cost Issues Found
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-rose-400">
              {remainingIssuesCount}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Unfixed inefficiencies remaining
          </p>
        </div>

      </div>

      {/* Resource Cost & Remediation Impact Breakdown Table */}
      <div className="cyber-card rounded-3xl p-6 sm:p-8 border border-indigo-500/20 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-500/20 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-emerald-400" />
              <span>Resource Cost & Remediation Impact Breakdown</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Individual cost of each resource and live projected savings after applying remediation fixes
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800/80 shadow-2xl bg-slate-950/80 font-mono text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-5">Resource Name & Type</th>
                <th className="py-3.5 px-5">Current Cost</th>
                <th className="py-3.5 px-5">Remediation Savings</th>
                <th className="py-3.5 px-5">Post-Fix Cost</th>
                <th className="py-3.5 px-5 text-right">FinOps Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {(analysis?.resource_cost_breakdown && analysis.resource_cost_breakdown.length > 0
                ? analysis.resource_cost_breakdown
                : liveResources.map((r) => ({
                    name: r.name,
                    type: r.type,
                    current_cost: r.estimated_monthly_cost_formatted || `$${(r.estimated_monthly_cost || 10).toFixed(2)}/mo`,
                    potential_savings: '$0.00/mo',
                    post_remediation_cost: r.estimated_monthly_cost_formatted || `$${(r.estimated_monthly_cost || 10).toFixed(2)}/mo`,
                    status: 'Optimal'
                  }))
              ).map((item, idx) => {
                const isRemediated = remediatedIssueIds.has(item.name.toLowerCase()) || Array.from(remediatedIssueIds).some(id => id.toLowerCase().includes(item.name.toLowerCase()));
                const isNeedsRemediation = item.status === 'Needs Remediation' && !isRemediated;

                const curCostVal = parseCostStr(item.current_cost);
                const savCostVal = parseCostStr(item.potential_savings);
                const postCostVal = isRemediated ? parseCostStr(item.post_remediation_cost) : (isNeedsRemediation ? parseCostStr(item.post_remediation_cost) : curCostVal);

                return (
                  <tr key={idx} className="hover:bg-slate-900/80 transition-all">
                    <td className="py-3.5 px-5 font-bold text-white">
                      <span className="block text-xs">{item.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{item.type}</span>
                    </td>
                    <td className="py-3.5 px-5 text-cyan-300 font-bold">
                      {isRemediated ? `$${postCostVal.toFixed(2)}/mo` : `$${curCostVal.toFixed(2)}/mo`}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-emerald-400">
                      {isNeedsRemediation ? `$${savCostVal.toFixed(2)}/mo` : '$0.00/mo'}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-indigo-300">
                      ${postCostVal.toFixed(2)}/mo
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      {isRemediated ? (
                        <span className="bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center space-x-1">
                          <Check className="h-3 w-3" />
                          <span>Remediated (Optimal)</span>
                        </span>
                      ) : isNeedsRemediation ? (
                        <span className="bg-amber-950 text-amber-300 border border-amber-800/60 px-2.5 py-1 rounded-full text-[10px] font-bold">
                          Needs Remediation
                        </span>
                      ) : (
                        <span className="bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center space-x-1">
                          <Check className="h-3 w-3" />
                          <span>Optimal</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>


      {/* Executive Summary Card */}
      <div className="cyber-card rounded-3xl p-6 sm:p-8 border border-indigo-500/20 shadow-2xl space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <ShieldAlert className="h-5 w-5 text-cyan-400" />
          <span>Executive FinOps AI Summary</span>
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/80 p-4 rounded-2xl border border-slate-800 font-mono">
          {analysis?.summary || 'No summary available.'}
        </p>
      </div>

      {/* Interactive FinOps Analytics & Visual Charts */}
      <FinOpsAnalytics
        totalSavingsStr={analysis?.total_estimated_monthly_savings || '$0.00/month'}
        issues={issues}
        resourceGroup={resource_group}
      />


      {/* Cost Inefficiencies & Fix Commands Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-500/20 pb-4">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Detected Inefficiencies & Remediation Commands
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Review issues, open the CMD terminal dropdown below each command to execute live remediation
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 font-mono">
            {['all', 'high', 'medium', 'low'].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  filterSeverity === sev
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-md glow-indigo'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {filteredIssues.length === 0 ? (
          <div className="cyber-card rounded-3xl p-12 text-center text-slate-400 space-y-2 border border-slate-800 font-mono">
            <Check className="h-10 w-10 text-emerald-400 mx-auto" />
            <h4 className="text-base font-bold text-white">No Issues Match Selected Filter</h4>
            <p className="text-xs">Your resource group cost health appears clean for this filter category.</p>
          </div>
        ) : (
          <div className="space-y-6 font-mono">
            {filteredIssues.map((issue, idx) => {
              const issueId = issue.id || `issue-${idx}`;

              return (
                <div
                  key={issueId}
                  className="cyber-card bg-slate-950/80 rounded-3xl p-6 sm:p-7 border border-slate-800 hover:border-indigo-500/40 shadow-2xl space-y-4 transition-all duration-300"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getSeverityBadgeClass(issue.severity)}`}>
                        {issue.severity} Severity
                      </span>
                      <span className="text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full">
                        {issue.category}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 px-3.5 py-1.5 rounded-xl w-fit glow-emerald">
                      Est. Savings: {issue.estimated_savings}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-white tracking-tight font-sans">
                      {issue.title}
                    </h4>
                    <p className="text-xs font-medium text-cyan-300 mt-1">
                      Affected Resource: <code className="bg-slate-900 border border-cyan-500/30 px-2.5 py-0.5 rounded text-cyan-200">{issue.affected_resource}</code>
                    </p>
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed font-sans">
                    {issue.description}
                  </p>

                  {/* Azure CLI Fix Command & Terminal Dropdown */}
                  {issue.fix_command && (
                    <div className="space-y-2 pt-2">
                      
                      <div className="flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
                        <span className="flex items-center space-x-1.5 font-medium">
                          <Terminal className="h-3.5 w-3.5 text-cyan-400" />
                          <span>Actionable Azure CLI Fix Command</span>
                        </span>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleCopyCommand(issue.fix_command, issueId)}
                            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-cyan-300 hover:text-white bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                          >
                            {copiedId === issueId ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                <span>Copy Command</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => toggleTerminal(issueId, issue.fix_command)}
                            className={`inline-flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all border cursor-pointer ${
                              openTerminalId === issueId
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 glow-emerald'
                                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                            <span>CMD Terminal Console</span>
                            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${openTerminalId === issueId ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      </div>

                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto selection:bg-indigo-600 selection:text-white">
                        <code>{issue.fix_command}</code>
                      </div>

                      {/* Dropdown CMD Terminal Window */}
                      {openTerminalId === issueId && (
                        <div className="mt-3 rounded-2xl border border-indigo-500/40 bg-[#070b14] shadow-2xl overflow-hidden transition-all glow-indigo">
                          
                          <div className="bg-slate-900/90 px-4 py-2.5 border-b border-indigo-500/20 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                              <span className="text-[11px] font-mono text-slate-400 ml-2 font-medium">
                                bash - azure-cli@cloud-detective:~
                              </span>
                            </div>

                            <button
                              onClick={() => runTerminalFix(issueId, issue.fix_command, issue.affected_resource)}
                              disabled={runningTerminalId === issueId}
                              className="inline-flex items-center space-x-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 px-3.5 py-1.5 rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 glow-emerald"
                            >
                              <Play className="h-3.5 w-3.5 fill-white" />
                              <span>{runningTerminalId === issueId ? 'Executing in Azure...' : 'Run Fix Command'}</span>
                            </button>
                          </div>

                          <div className="p-4 font-mono text-xs space-y-2 text-slate-300 min-h-[140px] max-h-[260px] overflow-y-auto bg-slate-950/90">
                            <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                              <span>aarvik@azure-cloud:~$</span>
                              <span className="text-white font-mono">{issue.fix_command}</span>
                            </div>

                            {(terminalLogs[issueId] || []).map((line, lIdx) => (
                              <div key={lIdx} className="leading-relaxed">
                                {line.startsWith('[✓]') ? (
                                  <span className="text-emerald-400 font-bold">{line}</span>
                                ) : line.startsWith('[✗]') ? (
                                  <span className="text-rose-400 font-bold">{line}</span>
                                ) : line.startsWith('[+]') ? (
                                  <span className="text-cyan-400">{line}</span>
                                ) : line.startsWith('[$]') ? (
                                  <span className="text-slate-400">{line}</span>
                                ) : (
                                  <span>{line}</span>
                                )}
                              </div>
                            ))}
                          </div>

                        </div>
                      )}

                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Strategic Recommendations */}
      {analysis?.recommendations && analysis.recommendations.length > 0 && (
        <div className="cyber-card rounded-3xl p-6 sm:p-8 border border-indigo-500/20 shadow-2xl space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-amber-400" />
            <span>Strategic Recommendations</span>
          </h3>

          <ul className="space-y-3 font-mono">
            {analysis.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start space-x-3 text-sm text-slate-300 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                <span className="inline-flex h-5 w-5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold items-center justify-center shrink-0 mt-0.5 border border-amber-500/40">
                  {i + 1}
                </span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
};
