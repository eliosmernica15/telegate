import React from 'react';
import { TransmissionLog } from '../types/telecommand';
import { Terminal, Radio, Clock, ShieldCheck, Activity } from 'lucide-react';

interface RFTelemetryConsoleProps {
  logs: TransmissionLog[];
  onClearLogs: () => void;
}

export const RFTelemetryConsole: React.FC<RFTelemetryConsoleProps> = ({ logs, onClearLogs }) => {
  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Live RF Transmission & Security Audit Log</h3>
            <span className="text-[11px] text-slate-500 font-mono">
              Real-time packet dispatches, frequency telemetry, and cryptographic nonces
            </span>
          </div>
        </div>

        {logs.length > 0 && (
          <button
            onClick={onClearLogs}
            className="text-[11px] font-mono text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 border border-slate-700"
          >
            Clear Log
          </button>
        )}
      </div>

      {/* Terminal Grid */}
      <div className="overflow-hidden rounded-xl bg-slate-950 border border-slate-800/90 font-mono text-[11px]">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Terminal className="w-6 h-6 mx-auto mb-2 opacity-40" />
            <p>No transmission packets dispatched yet.</p>
            <p className="text-[10px] text-slate-600 mt-1">
              Press any button on the virtual telecommand to broadcast an RF packet.
            </p>
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-900">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-2.5 px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-900/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 tabular-nums text-[10px]">{log.timestamp}</span>
                  <span
                    className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                      log.action === 'OPEN'
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                        : log.action === 'CLOSE'
                        ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                        : log.action === 'STOP'
                        ? 'bg-red-950/80 text-red-400 border border-red-800/60'
                        : 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/60'
                    }`}
                  >
                    {log.action}
                  </span>
                  <span className="text-white font-medium truncate max-w-[140px]">
                    {log.doorName}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-slate-400 text-[10px] sm:justify-end">
                  <span className="text-cyan-400 font-bold">{log.frequency}</span>
                  <span aria-hidden="true" className="text-slate-700">·</span>
                  <span className="text-slate-300 font-semibold">{log.channel}</span>
                  <span aria-hidden="true" className="text-slate-700">·</span>
                  <span className="text-slate-500 tabular-nums">{log.latencyMs}ms</span>
                  <span aria-hidden="true" className="text-slate-700">·</span>
                  <span className="text-emerald-400 tabular-nums">{log.rssi} dBm</span>
                  <span aria-hidden="true" className="text-slate-700">·</span>
                  <span className="text-slate-500 truncate max-w-[90px]">{log.user}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
