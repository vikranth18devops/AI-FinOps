import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Server, Search, Cpu, Database, Sparkles, AlertCircle, Radar } from 'lucide-react';
import { ProgressMessage } from '../types';
import { WS_BASE_URL } from '../config';

interface ProgressTrackerProps {
  analysisId: string;
  resourceGroup: string;
  onComplete: () => void;
  onError: (errorMsg: string) => void;
}

const STEPS = [
  { step: 1, label: 'Fetching Resource Groups', icon: Server },
  { step: 2, label: 'Azure Subprocess CLI Scan', icon: Search },
  { step: 3, label: 'AI FinOps Cost Engine', icon: Cpu },
  { step: 4, label: 'In-Cluster Database Persistence', icon: Database },
  { step: 5, label: 'Holographic Report Ready', icon: Sparkles }
];

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  analysisId,
  resourceGroup,
  onComplete,
  onError
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [message, setMessage] = useState<string>('Initializing live telemetry stream...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const wsUrl = `${WS_BASE_URL}/ws/progress/${analysisId}`;

    let socket: WebSocket | null = null;
    try {
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log(`WebSocket connected for analysis: ${analysisId}`);
        socket?.send(JSON.stringify({ event: 'ping' }));
      };

      socket.onmessage = (event) => {
        try {
          const data: ProgressMessage = JSON.parse(event.data);
          if (data.step) {
            setCurrentStep(data.step);
          }
          if (data.message) {
            setMessage(data.message);
            if (data.message.startsWith('Error:')) {
              setError(data.message.replace('Error:', '').trim());
              onError(data.message);
            }
          }

          if (data.step === 5 && !data.message?.startsWith('Error:')) {
            setTimeout(() => {
              onComplete();
            }, 600);
          }
        } catch (e) {
          console.error('Error parsing WebSocket message', e);
        }
      };

      socket.onerror = (err) => {
        console.error('WebSocket connection error:', err);
      };

      socket.onclose = () => {
        console.log('WebSocket connection closed.');
      };
    } catch (e: any) {
      console.error('Failed to initialize WebSocket', e);
    }

    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [analysisId]);

  const percentage = Math.min(100, Math.round((currentStep / 5) * 100));

  return (
    <div className="w-full cyber-card rounded-3xl p-6 sm:p-8 border border-indigo-500/30 shadow-2xl glow-indigo relative overflow-hidden">
      {/* Holographic Laser Scan Line Animation */}
      <div className="animate-ai-scan" />

      {/* Glow Orbs */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-indigo-500/20 relative z-10">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
              <span>Autonomous AI Infrastructure Scan</span>
              <Radar className="h-4 w-4 text-cyan-400 animate-spin" />
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Target Resource Group: <code className="text-cyan-300 bg-slate-900 px-2.5 py-0.5 rounded-md border border-cyan-500/30">{resourceGroup}</code>
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-slate-900/90 px-4 py-2 rounded-xl border border-indigo-500/30 font-mono shadow-md">
          <span className="text-xs text-slate-400">TELEMETRY SCAN:</span>
          <span className="text-sm font-extrabold text-cyan-300">{percentage}%</span>
        </div>
      </div>

      {/* Animated Glowing Progress Bar */}
      <div className="my-6 relative z-10">
        <div className="w-full bg-slate-950 rounded-full h-3.5 p-0.5 border border-indigo-500/30 overflow-hidden shadow-inner">
          <div
            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 h-full rounded-full transition-all duration-500 ease-out shadow-lg shadow-cyan-500/50"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Active Message Status Box */}
      <div className="bg-slate-950/80 border border-indigo-500/30 rounded-2xl p-4 mb-6 flex items-center justify-between shadow-lg relative z-10">
        <div className="flex items-center space-x-3">
          {error ? (
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
          ) : currentStep === 5 ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          ) : (
            <Loader2 className="h-5 w-5 text-cyan-400 animate-spin shrink-0" />
          )}
          <span className={`text-sm font-mono font-medium ${error ? 'text-rose-300' : 'text-slate-200'}`}>
            {message}
          </span>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2 relative z-10">
        {STEPS.map((s) => {
          const Icon = s.icon;
          const isDone = currentStep > s.step;
          const isCurrent = currentStep === s.step;

          return (
            <div
              key={s.step}
              className={`p-3.5 rounded-2xl border transition-all flex sm:flex-col items-center sm:text-center space-x-3 sm:space-x-0 sm:space-y-2 ${
                isDone
                  ? 'bg-slate-900/90 border-emerald-500/40 text-emerald-300 glow-emerald'
                  : isCurrent
                  ? 'bg-indigo-600/20 border-cyan-400/60 text-cyan-300 glow-cyan animate-pulse'
                  : 'bg-slate-950/40 border-slate-800/80 text-slate-500'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isDone
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : isCurrent
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'bg-slate-900 text-slate-600'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : isCurrent ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <span className="text-xs font-mono font-semibold leading-tight">
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
