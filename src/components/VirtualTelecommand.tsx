import React, { useState } from 'react';
import { DoorDevice } from '../types/telecommand';
import { playTelecommandSound } from '../utils/rfProtocols';
import {
  Radio,
  Wifi,
  Square,
  ArrowUp,
  ArrowDown,
  Lightbulb,
  Footprints,
  Zap,
  Volume2,
  Copy,
  Plus,
  Sparkles,
} from 'lucide-react';

interface VirtualTelecommandProps {
  currentDoor: DoorDevice;
  allDoors: DoorDevice[];
  onSelectDoor: (doorId: string) => void;
  onDispatchAction: (action: 'OPEN' | 'CLOSE' | 'STOP' | 'PEDESTRIAN' | 'LIGHT_TOGGLE') => void;
  isTransmitting: boolean;
  connectionMode: 'cloud' | 'local_rf';
  onToggleConnectionMode: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onPlayAndCloneFrequency?: (sourceDoor: DoorDevice) => void;
  onAddNewDoor?: () => void;
}

export const VirtualTelecommand: React.FC<VirtualTelecommandProps> = ({
  currentDoor,
  allDoors,
  onSelectDoor,
  onDispatchAction,
  isTransmitting,
  connectionMode,
  onToggleConnectionMode,
  soundEnabled,
  onToggleSound,
  onPlayAndCloneFrequency,
  onAddNewDoor,
}) => {
  const [activeButton, setActiveButton] = useState<string | null>(null);

  const handlePress = (action: 'OPEN' | 'CLOSE' | 'STOP' | 'PEDESTRIAN' | 'LIGHT_TOGGLE') => {
    setActiveButton(action);
    if (soundEnabled) {
      playTelecommandSound(action === 'STOP' ? 'alert' : 'click');
    }
    // Haptic feedback if supported on mobile devices
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(action === 'STOP' ? [40, 30, 40] : 35);
    }
    onDispatchAction(action);
    setTimeout(() => setActiveButton(null), 250);
  };

  const isDoorMoving = currentDoor.state === 'opening' || currentDoor.state === 'closing';

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center select-none">
      {/* Phone Remote Shell / Physical Casing */}
      <div className="relative w-full rounded-[36px] bg-gradient-to-b from-slate-900 via-slate-920 to-slate-950 border-4 border-slate-700/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.15)] p-6 pt-5 pb-7 flex flex-col items-center">
        {/* Metal Trim Bevel Accent */}
        <div className="absolute top-2 inset-x-12 h-1 bg-gradient-to-r from-transparent via-slate-500/30 to-transparent rounded-full"></div>

        {/* Top Status & TX LED Bar */}
        <div className="w-full flex items-center justify-between mb-3 px-1">
          {/* Channel selector badge */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 px-3 py-1 rounded-full">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">CH 1:</span>
            <span className="text-xs font-semibold text-white truncate max-w-[120px]">
              {currentDoor.name}
            </span>
          </div>

          {/* Glowing Transmit LED (Simulates physical RF remote LED) */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase">TX LED</span>
              <div
                className={`h-3 w-3 rounded-full border transition-all duration-150 ${
                  isTransmitting
                    ? 'bg-red-500 border-red-300 shadow-[0_0_14px_4px_#ef4444] scale-125 animate-pulse'
                    : 'bg-red-950 border-red-900/60'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Frequency & Quick-Play Frequency Bar */}
        <div className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 mb-4 shadow-inner flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-cyan-400 flex items-center gap-1">
              <Radio className="w-3.5 h-3.5" />
              {currentDoor.frequency}
            </span>
            <span className="text-slate-400">{currentDoor.protocol.replace(/_/g, ' ')}</span>
          </div>

          {/* Direct "Play Frequency & Connect Control Center" Button right from this remote */}
          {onPlayAndCloneFrequency && (
            <button
              type="button"
              onClick={() => onPlayAndCloneFrequency(currentDoor)}
              className="w-full py-1.5 px-2.5 rounded-lg bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 hover:text-cyan-200 text-[11px] font-medium flex items-center justify-between transition-colors group"
              title="Play this connected frequency to pair with another control center or clone remote"
            >
              <span className="flex items-center gap-1.5 font-sans">
                <Volume2 className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span>Play Frequency & Connect</span>
              </span>
              <span className="text-[10px] font-mono bg-cyan-900/80 px-1.5 py-0.5 rounded text-cyan-200">
                1-CLICK
              </span>
            </button>
          )}

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-900">
            <span>KEY: {currentDoor.encryptedSignal.keyFingerprint.substring(0, 10)}...</span>
            <span className="text-slate-400 tabular-nums">SEQ #{currentDoor.encryptedSignal.rollingCounter}</span>
          </div>
        </div>

        {/* Big Master Toggle Button (Central Tactile Remote Pad) */}
        <div className="my-2 flex flex-col items-center">
          <button
            onClick={() => handlePress(currentDoor.state === 'closed' ? 'OPEN' : 'CLOSE')}
            disabled={isDoorMoving}
            className={`telecommand-button relative w-36 h-36 rounded-full flex flex-col items-center justify-center p-4 transition-all duration-150 ${
              isDoorMoving
                ? 'bg-amber-600/30 border-2 border-amber-500/50 cursor-wait'
                : currentDoor.state === 'open'
                ? 'bg-gradient-to-b from-amber-600 to-amber-700 border-2 border-amber-400 text-white hover:brightness-110'
                : 'bg-gradient-to-b from-cyan-500 to-cyan-600 border-2 border-cyan-300 text-white hover:brightness-110'
            }`}
            title="Press to trigger automated gate"
          >
            {/* Concentric tactile ring texture */}
            <div className="absolute inset-2 rounded-full border border-white/20 pointer-events-none"></div>
            <div className="absolute inset-4 rounded-full border border-black/20 pointer-events-none"></div>

            {isDoorMoving ? (
              <div className="flex flex-col items-center">
                <Radio className="w-8 h-8 animate-spin text-amber-300 mb-1" />
                <span className="text-xs font-bold tracking-wider uppercase text-amber-200">
                  {currentDoor.state}
                </span>
                <span className="text-[10px] font-mono tabular-nums text-amber-300">
                  {currentDoor.currentProgress}%
                </span>
              </div>
            ) : currentDoor.state === 'open' ? (
              <div className="flex flex-col items-center">
                <ArrowDown className="w-9 h-9 drop-shadow mb-1" />
                <span className="text-sm font-black tracking-wider uppercase drop-shadow">CLOSE</span>
                <span className="text-[10px] opacity-80 font-mono">PUSH TO SHUT</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <ArrowUp className="w-9 h-9 drop-shadow mb-1" />
                <span className="text-sm font-black tracking-wider uppercase drop-shadow">OPEN</span>
                <span className="text-[10px] opacity-80 font-mono">PUSH TO TRIGGER</span>
              </div>
            )}
          </button>
        </div>

        {/* Secondary Telecommand Buttons (Tactile Rubber Grid) */}
        <div className="w-full grid grid-cols-3 gap-2 mt-4">
          {/* Stop / Safety Brake Button */}
          <button
            onClick={() => handlePress('STOP')}
            disabled={!isDoorMoving}
            className={`telecommand-button flex flex-col items-center justify-center h-16 rounded-xl border font-bold text-xs transition-all ${
              isDoorMoving
                ? 'bg-red-600 text-white border-red-400 hover:bg-red-500 active:scale-95 shadow-lg'
                : 'bg-slate-800/80 text-slate-500 border-slate-700/60 opacity-60 cursor-not-allowed'
            }`}
          >
            <Square className="w-4 h-4 mb-0.5" />
            <span>STOP</span>
          </button>

          {/* Pedestrian / 1m Partial Opening */}
          <button
            onClick={() => handlePress('PEDESTRIAN')}
            disabled={isDoorMoving}
            className="telecommand-button flex flex-col items-center justify-center h-16 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-750 active:scale-95 text-xs font-semibold shadow-md"
            title="Pedestrian 1-meter walk-through pass"
          >
            <Footprints className="w-4 h-4 mb-0.5 text-cyan-400" />
            <span>PEDESTRIAN</span>
          </button>

          {/* Courtesy Light Toggle */}
          <button
            onClick={() => handlePress('LIGHT_TOGGLE')}
            className={`telecommand-button flex flex-col items-center justify-center h-16 rounded-xl border text-xs font-semibold shadow-md transition-all ${
              currentDoor.courtesyLightOn
                ? 'bg-amber-500 text-slate-950 border-amber-300 font-bold'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-750 active:scale-95'
            }`}
            title="Toggle Courtesy Driveway Light"
          >
            <Lightbulb className={`w-4 h-4 mb-0.5 ${currentDoor.courtesyLightOn ? 'fill-slate-950' : 'text-amber-400'}`} />
            <span>LIGHT</span>
          </button>
        </div>

        {/* Transmission Route: Local RF Direct vs Anywhere Cloud Relay */}
        <div className="w-full mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs px-1">
          <button
            onClick={onToggleConnectionMode}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
            title="Switch transmission routing method"
          >
            {connectionMode === 'cloud' ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span className="font-mono text-[11px]">
              {connectionMode === 'cloud' ? 'Cloud 5G/Everywhere' : 'Local RF Bridge'}
            </span>
          </button>

          <button
            onClick={onToggleSound}
            className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
              soundEnabled ? 'text-cyan-400 border-cyan-800/80 bg-cyan-950/40' : 'text-slate-500 border-slate-800'
            }`}
          >
            {soundEnabled ? 'Sound FX ON' : 'Mute'}
          </button>
        </div>
      </div>

      {/* Control Center Door Selector Strip & Quick Add under remote */}
      <div className="w-full mt-4 flex items-center justify-center gap-1.5 overflow-x-auto py-1 px-2">
        {allDoors.map((door) => (
          <button
            key={door.id}
            onClick={() => onSelectDoor(door.id)}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium whitespace-nowrap transition-all ${
              door.id === currentDoor.id
                ? 'bg-cyan-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {door.name}
          </button>
        ))}

        {onAddNewDoor && (
          <button
            onClick={onAddNewDoor}
            className="px-2.5 py-1.5 text-xs rounded-lg font-medium whitespace-nowrap bg-slate-900/80 border border-dashed border-slate-700 text-cyan-400 hover:text-cyan-300 hover:border-cyan-500 transition-colors flex items-center gap-1"
            title="Add or auto-detect new gate frequency"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Gate</span>
          </button>
        )}
      </div>
    </div>
  );
};
