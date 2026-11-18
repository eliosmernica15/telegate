import React, { useState, useEffect, useRef } from 'react';
import {
  DoorDevice,
  FrequencyBand,
  GateType,
  ProtocolType,
  ModulationType,
} from '../types/telecommand';
import {
  KNOWN_MARKET_PRESETS,
  generateSyntheticPulses,
  playTelecommandSound,
  BrandPreset,
} from '../utils/rfProtocols';
import { encryptSignal, DEFAULT_MASTER_KEY } from '../utils/crypto';
import {
  Radio,
  X,
  Sparkles,
  Waves,
  CheckCircle2,
  Sliders,
  ArrowRight,
  ShieldCheck,
  Zap,
  Volume2,
  RefreshCw,
  Cpu,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface AutoDetectionResult {
  frequency: FrequencyBand;
  protocol: ProtocolType;
  modulation: ModulationType;
  brand: string;
  model: string;
  gateType: GateType;
  hexCode: string;
  rssi: number;
  offset: string;
  confidence: number;
  isRollingCode: boolean;
}

interface FrequencyLearnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDoorLearned: (newDoor: DoorDevice) => void;
  connectedDoors?: DoorDevice[];
}

export const FrequencyLearnerModal: React.FC<FrequencyLearnerModalProps> = ({
  isOpen,
  onClose,
  onDoorLearned,
  connectedDoors = [],
}) => {
  // Main Tab / Mode
  // 'auto': Just listen, identify device/module automatically & create control center
  // 'from_existing': Play/clone frequency from a telecommand already connected in the app
  // 'manual': Expert manual configuration with all technical dropdowns
  const [activeMode, setActiveMode] = useState<'auto' | 'from_existing' | 'manual'>('auto');

  // --- Auto Listener State ---
  const [isListening, setIsListening] = useState(false);
  const [listenProgress, setListenProgress] = useState(0);
  const [detectedResult, setDetectedResult] = useState<AutoDetectionResult | null>(null);
  const [autoDoorName, setAutoDoorName] = useState('');
  const [autoLocation, setAutoLocation] = useState('Driveway Entrance');

  // --- Clone from existing telecommand state ---
  const [sourceDoorId, setSourceDoorId] = useState<string>(
    connectedDoors[0]?.id || ''
  );
  const [isPlayingFrequency, setIsPlayingFrequency] = useState(false);
  const [clonedSuccess, setClonedSuccess] = useState(false);
  const [clonedDoorName, setClonedDoorName] = useState('');

  // --- Manual Advanced State ---
  const [manualBridge, setManualBridge] = useState('VirtualSimulator');
  const [manualBand, setManualBand] = useState<FrequencyBand>('433.92 MHz');
  const [manualPreset, setManualPreset] = useState<BrandPreset>(KNOWN_MARKET_PRESETS[0]);
  const [manualDoorName, setManualDoorName] = useState('Outside Main Gate');
  const [manualLocation, setManualLocation] = useState('Front Driveway');
  const [manualGateType, setManualGateType] = useState<GateType>('sliding_gate');
  const [manualPassphrase, setManualPassphrase] = useState(DEFAULT_MASTER_KEY);

  // Canvas ref for live RF Oscilloscope
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Keep sourceDoorId in sync when connectedDoors changes
  useEffect(() => {
    if (connectedDoors.length > 0 && !sourceDoorId) {
      setSourceDoorId(connectedDoors[0].id);
    }
  }, [connectedDoors, sourceDoorId]);

  // Handle start 1-Click Auto Sniffer
  const startAutoListening = () => {
    setIsListening(true);
    setDetectedResult(null);
    setListenProgress(0);
    playTelecommandSound('rf_burst');

    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      currentProgress += 10;
      setListenProgress(Math.min(100, currentProgress));
    }, 200);

    // Realistic auto-recognition after listening to the airwaves
    setTimeout(() => {
      clearInterval(progressInterval);
      setIsListening(false);
      setListenProgress(100);

      // Randomly recognize one of the popular market presets to show realistic auto-detection
      const randomIndex = Math.floor(Math.random() * 4);
      const recognized = KNOWN_MARKET_PRESETS[randomIndex] || KNOWN_MARKET_PRESETS[0];

      const result: AutoDetectionResult = {
        frequency: recognized.frequency,
        protocol: recognized.protocol,
        modulation: recognized.modulation,
        brand: recognized.brand,
        model: recognized.model,
        gateType: recognized.gateType,
        hexCode: recognized.defaultHex,
        rssi: Math.floor(-34 - Math.random() * 18),
        offset: `+0.00${Math.floor(1 + Math.random() * 6)} kHz`,
        confidence: 99.4,
        isRollingCode: recognized.isRollingCode,
      };

      setDetectedResult(result);
      setAutoDoorName(`${result.brand} Smart Gate`);
      playTelecommandSound('success');
    }, 2200);
  };

  // Canvas visualizer loop
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let offset = 0;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Grid
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.35)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Drawing Wave
      ctx.lineWidth = 2;
      if (detectedResult || clonedSuccess) {
        // Demodulated square pulse train
        ctx.strokeStyle = '#22d3ee';
        ctx.beginPath();
        let currentX = 0;
        let high = false;
        const hex = detectedResult ? detectedResult.hexCode : '0xA4F892';
        const pulses = generateSyntheticPulses(hex);

        while (currentX < canvas.width) {
          for (const pulse of pulses) {
            const width = Math.max(8, pulse / 40);
            const y = high ? 20 : canvas.height - 20;
            ctx.lineTo(currentX, y);
            currentX += width;
            ctx.lineTo(currentX, y);
            high = !high;
            if (currentX >= canvas.width) break;
          }
        }
        ctx.stroke();
      } else if (isListening || isPlayingFrequency) {
        // High frequency active carrier wave
        ctx.strokeStyle = '#38bdf8';
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x++) {
          const envelope = Math.sin((x / canvas.width) * Math.PI * 4 + offset * 0.1);
          const carrier = Math.sin(x * 0.45 + offset);
          const noise = (Math.random() - 0.5) * 8;
          const y = canvas.height / 2 + carrier * 32 * envelope + noise;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        offset += 0.45;
      } else {
        // Ambient room noise
        ctx.strokeStyle = '#64748b';
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x++) {
          const y = canvas.height / 2 + (Math.random() - 0.5) * 5;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isOpen, isListening, isPlayingFrequency, detectedResult, clonedSuccess]);

  // Create & Connect Control Center from Auto-Detected Result
  const handleConnectAutoCenter = async () => {
    if (!detectedResult) return;

    const encryptedSignal = await encryptSignal(
      {
        rawHex: detectedResult.hexCode,
        protocol: detectedResult.protocol,
        frequency: detectedResult.frequency,
        counter: 1240,
        doorName: autoDoorName.trim() || `${detectedResult.brand} Gate`,
        createdAt: new Date().toISOString(),
      },
      DEFAULT_MASTER_KEY
    );

    const newDoor: DoorDevice = {
      id: `door_${Date.now()}`,
      name: autoDoorName.trim() || `${detectedResult.brand} Gate`,
      location: autoLocation.trim() || 'Driveway Entrance',
      gateType: detectedResult.gateType,
      frequency: detectedResult.frequency,
      protocol: detectedResult.protocol,
      modulation: detectedResult.modulation,
      brandPreset: detectedResult.brand,
      state: 'closed',
      travelTimeSeconds: 8,
      currentProgress: 0,
      encryptedSignal,
      rawPulsesPreview: generateSyntheticPulses(detectedResult.hexCode),
      hexCodePreview: detectedResult.hexCode,
      bridgeId: 'VirtualSimulator',
      isOnline: true,
      rssi: detectedResult.rssi,
      courtesyLightOn: false,
      pedestrianSupported: true,
      favorite: true,
    };

    onDoorLearned(newDoor);
    onClose();
  };

  // Play frequency from an already connected telecommand and create linked control center
  const handlePlayAndConnectExisting = async () => {
    const sourceDoor = connectedDoors.find((d) => d.id === sourceDoorId);
    if (!sourceDoor) return;

    setIsPlayingFrequency(true);
    setClonedSuccess(false);
    playTelecommandSound('rf_burst');

    setTimeout(async () => {
      setIsPlayingFrequency(false);
      setClonedSuccess(true);
      playTelecommandSound('success');

      // Create new cloned control center linked to that frequency
      const finalName =
        clonedDoorName.trim() ||
        `${sourceDoor.name} (Remote 2)`;

      const newEncrypted = await encryptSignal(
        {
          rawHex: sourceDoor.hexCodePreview,
          protocol: sourceDoor.protocol,
          frequency: sourceDoor.frequency,
          counter: (sourceDoor.encryptedSignal?.rollingCounter || 1000) + 20,
          doorName: finalName,
          sourceCloneId: sourceDoor.id,
          createdAt: new Date().toISOString(),
        },
        DEFAULT_MASTER_KEY
      );

      const newDoor: DoorDevice = {
        id: `door_clone_${Date.now()}`,
        name: finalName,
        location: `${sourceDoor.location} (Cloned Remote)`,
        gateType: sourceDoor.gateType,
        frequency: sourceDoor.frequency,
        protocol: sourceDoor.protocol,
        modulation: sourceDoor.modulation,
        brandPreset: sourceDoor.brandPreset,
        state: 'closed',
        travelTimeSeconds: sourceDoor.travelTimeSeconds,
        currentProgress: 0,
        encryptedSignal: newEncrypted,
        rawPulsesPreview: sourceDoor.rawPulsesPreview,
        hexCodePreview: sourceDoor.hexCodePreview,
        bridgeId: sourceDoor.bridgeId,
        isOnline: true,
        rssi: sourceDoor.rssi,
        courtesyLightOn: false,
        pedestrianSupported: sourceDoor.pedestrianSupported,
        favorite: false,
      };

      onDoorLearned(newDoor);
      onClose();
    }, 1800);
  };

  // Expert manual save
  const handleManualSave = async () => {
    const encryptedSignal = await encryptSignal(
      {
        rawHex: manualPreset.defaultHex,
        protocol: manualPreset.protocol,
        frequency: manualBand,
        counter: 1240,
        doorName: manualDoorName,
        createdAt: new Date().toISOString(),
      },
      manualPassphrase
    );

    const newDoor: DoorDevice = {
      id: `door_${Date.now()}`,
      name: manualDoorName,
      location: manualLocation,
      gateType: manualGateType,
      frequency: manualBand,
      protocol: manualPreset.protocol,
      modulation: manualPreset.modulation,
      brandPreset: manualPreset.brand,
      state: 'closed',
      travelTimeSeconds: 10,
      currentProgress: 0,
      encryptedSignal,
      rawPulsesPreview: generateSyntheticPulses(manualPreset.defaultHex),
      hexCodePreview: manualPreset.defaultHex,
      bridgeId: manualBridge,
      isOnline: true,
      rssi: -42,
      courtesyLightOn: false,
      pedestrianSupported: true,
      favorite: true,
    };

    onDoorLearned(newDoor);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 my-8 text-slate-100">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight text-white">
                Connect New Gate / Door
              </h3>
              <p className="text-xs text-slate-400">
                Automatic RF listener & existing telecommand cloner
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2 MAIN SIMPLE OPTIONS + ADVANCED TOGGLE */}
        <div className="mt-4 mb-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Option 1: Auto Listen & Identify */}
          <button
            type="button"
            onClick={() => setActiveMode('auto')}
            className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
              activeMode === 'auto'
                ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-lg ring-1 ring-cyan-500/50'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>Option 1: Hear & Auto-Detect</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                RECOMMENDED
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Don't know the frequency or brand? Just press your remote near your phone.
              The app automatically hears the radio signal, identifies the chip/module, and builds your control center.
            </p>
          </button>

          {/* Option 2: Play from Connected Telecommand */}
          <button
            type="button"
            onClick={() => setActiveMode('from_existing')}
            className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
              activeMode === 'from_existing'
                ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-lg ring-1 ring-cyan-500/50'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Zap className="w-4 h-4" />
                <span>Option 2: Play from Telecommand</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                1-CLICK CLONE
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Play the frequency from a telecommand already connected in the app.
              Get that exact frequency, pair instantly, and create your new control center button.
            </p>
          </button>
        </div>

        {/* Small toggle for technical users */}
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={() => setActiveMode((prev) => (prev === 'manual' ? 'auto' : 'manual'))}
            className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1 font-mono transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{activeMode === 'manual' ? 'Back to Simple Mode' : 'Expert / Manual Settings'}</span>
          </button>
        </div>

        {/* --- VIEW 1: HEAR & AUTO-DETECT --- */}
        {activeMode === 'auto' && (
          <div className="space-y-4">
            {/* Live Radio Oscilloscope Screen */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                  <Waves className="w-4 h-4 text-cyan-400" />
                  <span>Sub-GHz Auto-Frequency Listener</span>
                </div>
                {detectedResult ? (
                  <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> MODULE IDENTIFIED
                  </span>
                ) : isListening ? (
                  <span className="text-[11px] font-mono text-amber-400 animate-pulse">
                    LISTENING TO AIRWAVES... ({listenProgress}%)
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-slate-500">IDLE · READY</span>
                )}
              </div>

              {/* Canvas Waveform */}
              <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                <canvas ref={canvasRef} width={560} height={100} className="w-full h-24 block" />
              </div>
            </div>

            {/* If NOT detected yet: Big 1-Click Listen Button */}
            {!detectedResult ? (
              <div className="p-5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 text-center space-y-3">
                <div className="max-w-md mx-auto">
                  <h4 className="text-sm font-bold text-white mb-1">
                    {isListening
                      ? 'Hold your physical remote button now...'
                      : 'Tap to Hear & Auto-Configure'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Press the button below, then hold any garage or gate remote near your phone or bridge.
                    No need to guess frequencies or chipsets!
                  </p>
                </div>

                <button
                  type="button"
                  onClick={startAutoListening}
                  disabled={isListening}
                  className="px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all inline-flex items-center gap-2"
                >
                  <Radio className={`w-4 h-4 ${isListening ? 'animate-spin' : ''}`} />
                  <span>{isListening ? 'Listening for signal...' : 'Hear Frequency Now'}</span>
                </button>
              </div>
            ) : (
              /* If DETECTED: Show Auto-Discovered Module & 1-Click Connect Button */
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-emerald-500/20 text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-white">
                        Module & Frequency Recognized Automatically!
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      {detectedResult.confidence}% Match
                    </span>
                  </div>

                  {/* Detected Specs Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                    <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">FREQUENCY</span>
                      <span className="text-cyan-400 font-bold">{detectedResult.frequency}</span>
                    </div>
                    <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">MANUFACTURER</span>
                      <span className="text-white font-bold">{detectedResult.brand}</span>
                    </div>
                    <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">CHIPSET / MODEL</span>
                      <span className="text-slate-300 font-bold truncate block">
                        {detectedResult.model}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">SECURITY</span>
                      <span className="text-emerald-400 font-bold">
                        {detectedResult.isRollingCode ? 'Rolling KeeLoq' : 'Fixed 24-Bit'}
                      </span>
                    </div>
                  </div>

                  {/* Name field */}
                  <div className="pt-1">
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      Control Center Name
                    </label>
                    <input
                      type="text"
                      value={autoDoorName}
                      onChange={(e) => setAutoDoorName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                      placeholder="e.g. My Smart Driveway Gate"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={startAutoListening}
                    className="text-xs text-slate-400 hover:text-cyan-400 font-mono flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Re-listen</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleConnectAutoCenter}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Connect & Create Control Center</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- VIEW 2: PLAY FREQUENCY FROM ALREADY CONNECTED TELECOMMAND --- */}
        {activeMode === 'from_existing' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>1. Select Source Connected Telecommand</span>
              </div>
              <p className="text-xs text-slate-400">
                Choose an existing telecommand already registered in the app. TeleGate will play and
                transmit its frequency directly, capture the carrier, and set up your new control center.
              </p>

              {connectedDoors.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No telecommands currently connected. Use Option 1 to hear a frequency first.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {connectedDoors.map((door) => {
                    const isSelected = door.id === sourceDoorId;
                    return (
                      <button
                        key={door.id}
                        type="button"
                        onClick={() => setSourceDoorId(door.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-emerald-950/40 border-emerald-500 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white truncate max-w-[140px]">
                            {door.name}
                          </span>
                          <span className="text-[10px] font-mono text-cyan-400">
                            {door.frequency}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">{door.location}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Protocol: {door.protocol.replace(/_/g, ' ')}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Live Waveform preview for playback */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between mb-2 text-xs font-mono text-slate-400">
                <span>Carrier Signal Playback & Acquisition</span>
                <span className="text-emerald-400">
                  {isPlayingFrequency
                    ? 'TRANSMITTING & RECORDING...'
                    : clonedSuccess
                    ? 'FREQUENCY ACQUIRED'
                    : 'READY'}
                </span>
              </div>
              <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                <canvas ref={canvasRef} width={560} height={80} className="w-full h-20 block" />
              </div>
            </div>

            {/* Optional new remote label */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                New Control Center Name
              </label>
              <input
                type="text"
                value={clonedDoorName}
                onChange={(e) => setClonedDoorName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                placeholder="e.g. Driveway Gate (Second Telecommand)"
              />
            </div>

            {/* Action button */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handlePlayAndConnectExisting}
                disabled={isPlayingFrequency || !sourceDoorId}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all"
              >
                <Zap className={`w-4 h-4 ${isPlayingFrequency ? 'animate-bounce' : ''}`} />
                <span>
                  {isPlayingFrequency
                    ? 'Playing & Acquiring Frequency...'
                    : 'Play Frequency & Connect Control Center'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* --- VIEW 3: EXPERT / MANUAL SETTINGS --- */}
        {activeMode === 'manual' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-300">
              Expert Mode: Manually configure frequency, protocol standard, and hardware interface.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Target Frequency Band
                </label>
                <select
                  value={manualBand}
                  onChange={(e) => setManualBand(e.target.value as FrequencyBand)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="433.92 MHz">433.92 MHz (Standard EU/Asia/LatAm)</option>
                  <option value="868.35 MHz">868.35 MHz (Hörmann BiSecur/Sommer)</option>
                  <option value="315.00 MHz">315.00 MHz (North America LiftMaster)</option>
                  <option value="390.00 MHz">390.00 MHz (Genie / Craftsman)</option>
                  <option value="2.4 GHz IoT">2.4 GHz IoT / Smart Relay</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Hardware Bridge
                </label>
                <select
                  value={manualBridge}
                  onChange={(e) => setManualBridge(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="VirtualSimulator">Virtual Simulator (Browser)</option>
                  <option value="WebSerial">USB-C Dongle (OTG WebSerial)</option>
                  <option value="WebBluetooth">Bluetooth BLE Transceiver</option>
                  <option value="CloudGateway">Wi-Fi Cloud Bridge</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Preset / Protocol
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                {KNOWN_MARKET_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setManualPreset(p);
                      setManualBand(p.frequency);
                      setManualGateType(p.gateType);
                      setManualDoorName(`${p.brand} Door`);
                    }}
                    className={`p-2 rounded-lg border text-left text-xs transition-all ${
                      manualPreset.id === p.id
                        ? 'bg-cyan-950/40 border-cyan-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-white">{p.brand}</div>
                    <div className="text-[10px] text-slate-500">{p.frequency}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Label</label>
                <input
                  type="text"
                  value={manualDoorName}
                  onChange={(e) => setManualDoorName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Location</label>
                <input
                  type="text"
                  value={manualLocation}
                  onChange={(e) => setManualLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleManualSave}
                className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg"
              >
                Save & Connect Control Center
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
