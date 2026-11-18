import React from 'react';
import { DoorDevice } from '../types/telecommand';
import { ShieldCheck, AlertCircle, Radio, Clock } from 'lucide-react';

interface GateVisualizerProps {
  door: DoorDevice;
  onQuickToggle: () => void;
  isTransmitting?: boolean;
}

export const GateVisualizer: React.FC<GateVisualizerProps> = ({
  door,
  onQuickToggle,
  isTransmitting = false,
}) => {
  const isMoving = door.state === 'opening' || door.state === 'closing';

  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl">
      {/* Header Info */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-white">{door.name}</h2>
            {door.favorite && (
              <span className="text-amber-400 text-xs font-semibold">★ Main</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-mono">
            <span>{door.location}</span>
            <span aria-hidden="true">·</span>
            <span className="text-cyan-400">{door.frequency}</span>
            <span aria-hidden="true">·</span>
            <span>{door.modulation}</span>
          </div>
        </div>

        {/* Status Pill with motion indicator */}
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2">
            {isMoving && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
            )}
            <span
              className={`text-xs font-semibold uppercase px-2.5 py-1 rounded-md tracking-wide ${
                door.state === 'open'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : door.state === 'closed'
                  ? 'bg-slate-800 text-slate-300 border border-slate-700'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
              }`}
            >
              {door.state === 'opening' ? 'Opening...' : door.state === 'closing' ? 'Closing...' : door.state}
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 mt-1 tabular-nums">
            {door.currentProgress}% position
          </span>
        </div>
      </div>

      {/* Visual Canvas Simulation Area */}
      <div className="relative h-48 w-full rounded-xl bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800/80 overflow-hidden flex items-end justify-center p-3 select-none">
        {/* Background driveway / ambient ground lines */}
        <div className="absolute inset-x-0 bottom-0 h-10 bg-slate-950/80 border-t border-slate-800 flex items-center justify-around">
          <div className="h-0.5 w-12 bg-amber-500/30 rounded"></div>
          <div className="h-0.5 w-12 bg-amber-500/30 rounded"></div>
          <div className="h-0.5 w-12 bg-amber-500/30 rounded"></div>
        </div>

        {/* Warning Strobe beacon on pillar */}
        <div className="absolute top-3 left-4 flex items-center gap-2">
          <div
            className={`h-4 w-4 rounded-full border border-amber-400/40 transition-colors ${
              isMoving ? 'bg-amber-400 shadow-[0_0_12px_#f59e0b] animate-ping' : 'bg-slate-800'
            }`}
          />
          {door.courtesyLightOn && (
            <span className="text-[11px] text-amber-300 font-mono bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/60">
              Courtesy Light ON
            </span>
          )}
        </div>

        {/* Active RF Transmission overlay */}
        {isTransmitting && (
          <div className="absolute inset-0 bg-cyan-950/30 backdrop-blur-[1px] flex flex-col items-center justify-center z-20 pointer-events-none transition-opacity">
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs animate-bounce bg-slate-900/90 px-3 py-1.5 rounded-lg border border-cyan-500/40 shadow-lg">
              <Radio className="w-4 h-4 animate-spin" />
              <span>RF BURST DISPATCHED · {door.frequency}</span>
            </div>
          </div>
        )}

        {/* --- Gate Type Simulations --- */}

        {/* 1. Sliding Gate */}
        {door.gateType === 'sliding_gate' && (
          <div className="relative w-full max-w-sm h-36 flex items-end">
            {/* Gate Pillars */}
            <div className="absolute left-2 bottom-0 w-6 h-34 bg-slate-700 border border-slate-600 rounded-t z-10"></div>
            <div className="absolute right-2 bottom-0 w-6 h-34 bg-slate-700 border border-slate-600 rounded-t z-10"></div>

            {/* Sliding Panel */}
            <div
              className="absolute bottom-1 h-30 bg-slate-800/95 border-2 border-slate-400/60 rounded-md shadow-2xl transition-all duration-300 ease-linear flex flex-col justify-between p-1.5"
              style={{
                width: '68%',
                left: `${15 + (door.currentProgress / 100) * 45}%`,
                opacity: door.currentProgress > 85 ? 0.7 : 1,
              }}
            >
              {/* Metal vertical slats */}
              <div className="flex justify-between h-full px-1 items-center">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="w-1.5 h-full bg-slate-600 rounded-sm"></div>
                ))}
              </div>
              <div className="w-full h-1 bg-amber-500/60 rounded"></div>
            </div>
          </div>
        )}

        {/* 2. Overhead Garage Door */}
        {door.gateType === 'overhead_garage' && (
          <div className="relative w-72 h-38 bg-slate-950/60 border border-slate-800 rounded-t-lg overflow-hidden flex flex-col justify-end">
            <div
              className="w-full transition-all duration-300 ease-linear flex flex-col gap-1 overflow-hidden"
              style={{
                height: `${Math.max(4, (100 - door.currentProgress) * 0.95)}%`,
              }}
            >
              {[1, 2, 3, 4].map((panel) => (
                <div
                  key={panel}
                  className="w-full flex-1 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 border-y border-slate-500/80 rounded-sm flex items-center justify-between px-3"
                >
                  <div className="w-8 h-2 bg-slate-800/60 rounded-sm"></div>
                  <div className="text-[10px] text-slate-400 font-mono">PANEL {panel}</div>
                  <div className="w-8 h-2 bg-slate-800/60 rounded-sm"></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Swing Gate */}
        {door.gateType === 'swing_gate' && (
          <div className="relative w-full max-w-sm h-36 flex items-end justify-center perspective-[800px]">
            {/* Left Wing */}
            <div
              className="w-32 h-28 bg-slate-800 border-2 border-slate-400 origin-left transition-transform duration-300 ease-linear rounded-l flex items-center justify-around px-1"
              style={{
                transform: `rotateY(-${(door.currentProgress / 100) * 85}deg)`,
              }}
            >
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-1.5 h-full bg-slate-600"></div>
              ))}
            </div>
            {/* Right Wing */}
            <div
              className="w-32 h-28 bg-slate-800 border-2 border-slate-400 origin-right transition-transform duration-300 ease-linear rounded-r flex items-center justify-around px-1"
              style={{
                transform: `rotateY(${(door.currentProgress / 100) * 85}deg)`,
              }}
            >
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-1.5 h-full bg-slate-600"></div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Rolling Shutter */}
        {door.gateType === 'rolling_shutter' && (
          <div className="relative w-64 h-38 bg-slate-950 border border-slate-800 rounded-t-lg overflow-hidden flex flex-col justify-start">
            <div className="h-6 w-full bg-slate-700 border-b border-slate-600 flex items-center justify-center text-[10px] text-slate-300 font-mono">
              MOTOR CANISTER 433MHz
            </div>
            <div
              className="w-full transition-all duration-300 ease-linear flex flex-col bg-slate-800"
              style={{
                height: `${Math.max(6, (100 - door.currentProgress) * 0.9)}%`,
              }}
            >
              {[...Array(12)].map((_, idx) => (
                <div key={idx} className="h-2 w-full border-b border-slate-700 bg-slate-600/40"></div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Barrier Boom */}
        {(door.gateType === 'barrier_boom' || door.gateType === 'pedestrian_latch') && (
          <div className="relative w-full max-w-xs h-36 flex items-end">
            <div className="w-10 h-28 bg-slate-700 border border-slate-600 rounded-t flex flex-col items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse"></div>
            </div>
            <div
              className="h-3 w-56 origin-bottom-left transition-transform duration-300 ease-linear rounded-r flex overflow-hidden border border-slate-300"
              style={{
                transform: `rotate(-${(door.currentProgress / 100) * 85}deg)`,
                background: 'repeating-linear-gradient(45deg, #ef4444, #ef4444 14px, #ffffff 14px, #ffffff 28px)',
              }}
            ></div>
          </div>
        )}
      </div>

      {/* Footer Details: E2EE verification & Fast Action */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="font-mono text-[11px]">
            AES-256 GCM · Key {door.encryptedSignal.keyFingerprint.substring(0, 8)}
          </span>
          <span className="hidden sm:inline" aria-hidden="true">·</span>
          <span className="hidden sm:inline text-slate-500 font-mono text-[11px]">
            Counter #{door.encryptedSignal.rollingCounter}
          </span>
        </div>

        <button
          onClick={onQuickToggle}
          disabled={isMoving}
          className="text-xs font-semibold px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {door.state === 'closed' ? 'Open Gate' : 'Close Gate'}
        </button>
      </div>
    </div>
  );
};
