import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { TrendingUp, DollarSign, ShieldAlert, PieChart as PieIcon, BarChart3, Sparkles } from 'lucide-react';
import { CostIssue } from '../types';

interface FinOpsAnalyticsProps {
  totalSavingsStr: string;
  issues: CostIssue[];
  resourceGroup: string;
}

export const FinOpsAnalytics: React.FC<FinOpsAnalyticsProps> = ({
  totalSavingsStr,
  issues,
  resourceGroup
}) => {
  // Parse total monthly savings string into numeric dollar float
  const parseSavings = (str: string): number => {
    if (!str) return 0;
    const match = str.replace(/,/g, '').match(/\d+(\.\d+)?/);
    return match ? parseFloat(match[0]) : 0;
  };

  const monthlySavingsNum = parseSavings(totalSavingsStr);
  const annualSavingsNum = monthlySavingsNum * 12;

  // Category breakdown data for Pie Chart
  const categoryMap: Record<string, number> = {};
  issues.forEach((issue) => {
    const cat = issue.category || 'Other';
    const val = parseSavings(issue.estimated_savings);
    categoryMap[cat] = (categoryMap[cat] || 0) + (val > 0 ? val : 25);
  });

  const categoryData = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value
  }));

  const CATEGORY_COLORS: Record<string, string> = {
    'Over-provisioning': '#38bdf8', // Sky Blue
    'Storage & Logging': '#34d399', // Emerald Green
    'Unused Resource': '#f43f5e',    // Rose Red
    'Misconfiguration': '#fbbf24',  // Amber Yellow
    'Pricing Tier': '#c084fc',       // Purple
    'Other': '#818cf8'               // Indigo
  };

  const DEFAULT_COLORS = ['#38bdf8', '#34d399', '#f43f5e', '#fbbf24', '#c084fc', '#818cf8'];

  // Severity breakdown data for Bar Chart
  const severityCount: Record<string, number> = { High: 0, Medium: 0, Low: 0 };
  issues.forEach((issue) => {
    const sev = (issue.severity || 'low').toLowerCase();
    if (sev === 'high') severityCount.High += 1;
    else if (sev === 'medium') severityCount.Medium += 1;
    else severityCount.Low += 1;
  });

  const severityData = [
    { severity: 'High', count: severityCount.High, color: '#f43f5e' },
    { severity: 'Medium', count: severityCount.Medium, color: '#fbbf24' },
    { severity: 'Low', count: severityCount.Low, color: '#38bdf8' }
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      return (
        <div className="bg-slate-950/95 border border-slate-800 p-3 rounded-xl shadow-2xl text-xs font-mono">
          <p className="font-bold text-white mb-1">{item.name || item.payload?.severity}</p>
          <p className="text-emerald-400 font-extrabold">
            {typeof item.value === 'number' && item.value > 10 ? `$${item.value.toFixed(2)}/mo` : `${item.value} issue(s)`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      
      {/* Annual Savings Projection Header Banner */}
      <div className="glass-card rounded-2xl p-6 sm:p-7 border border-indigo-500/30 bg-gradient-to-r from-slate-900/90 via-indigo-950/40 to-slate-900/90 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            <span>FinOps Projection Engine</span>
          </div>

          <h3 className="text-xl font-extrabold text-white tracking-tight">
            12-Month Cumulative Cloud Savings Projection
          </h3>

          <p className="text-xs text-slate-300 leading-relaxed">
            By applying all recommended Azure CLI remediation commands for <code className="text-indigo-300 font-mono">{resourceGroup}</code>, your organization projects significant annual budget recovery.
          </p>
        </div>

        <div className="bg-slate-950/90 border border-indigo-500/40 p-5 rounded-2xl text-right flex flex-col justify-center shrink-0 shadow-xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Projected Annual Recovery
          </span>
          <span className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-300 tracking-tight">
            ${annualSavingsNum.toFixed(2)} <span className="text-xs font-semibold text-slate-400">/ yr</span>
          </span>
          <span className="text-[10px] font-semibold text-emerald-400 mt-1 block">
            Based on ${monthlySavingsNum.toFixed(2)}/mo savings rate
          </span>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Chart 1: Savings Breakdown Donut Chart */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <PieIcon className="h-4 w-4" />
              </div>
              <h4 className="text-sm font-bold text-white">Savings Breakdown by Category</h4>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Monthly ($)</span>
          </div>

          {categoryData.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 font-mono">
              No cost issues detected for category breakdown.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CATEGORY_COLORS[entry.name] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span className="text-xs text-slate-300 font-medium">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart 2: Severity Risk Distribution Bar Chart */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <BarChart3 className="h-4 w-4" />
              </div>
              <h4 className="text-sm font-bold text-white">Inefficiency Severity Risk Distribution</h4>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Issues Count</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <XAxis dataKey="severity" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {severityData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
