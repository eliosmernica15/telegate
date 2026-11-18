/**
 * TeleGate - Universal RF Door Telecommand & Frequency Hub
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  DoorDevice,
  UserProfile,
  TransmissionLog,
  GateState,
} from './types/telecommand';
import { KNOWN_MARKET_PRESETS, playTelecommandSound } from './utils/rfProtocols';
import { advanceRollingCounter } from './utils/crypto';
import { GateVisualizer } from './components/GateVisualizer';
import { VirtualTelecommand } from './components/VirtualTelecommand';
import { FrequencyLearnerModal } from './components/FrequencyLearnerModal';
import { ArchitectureExplainerModal } from './components/ArchitectureExplainerModal';
import { VaultManager } from './components/VaultManager';
import { UserManagementModal } from './components/UserManagementModal';
import { RFTelemetryConsole } from './components/RFTelemetryConsole';
import {
  Radio,
  Plus,
  BookOpen,
  Users,
  Database,
  Smartphone,
  ShieldCheck,
  Wifi,
  Zap,
  Activity,
  CheckCircle2,
  Lock,
} from 'lucide-react';

// Image assets generated for production look
import hardwareImage from './assets/images/rf_bridge_hardware_1790181938774.jpg';
import entranceImage from './assets/images/smart_gate_entrance_1790181949303.jpg';
import avatarAdminImage from './assets/images/avatar_admin_1790181960562.jpg';

// Initial pre-configured doors covering the major market frequencies & protocols
const INITIAL_DOORS: DoorDevice[] = [
  {
    id: 'door_driveway_1',
    name: 'Outside Main Driveway Gate',
    location: 'Front Property Entrance',
    gateType: 'sliding_gate',
    frequency: '433.92 MHz',
    protocol: 'fixed_code_24bit',
    modulation: 'ASK/OOK',
    brandPreset: 'Came',
    state: 'closed',
    travelTimeSeconds: 8,
    currentProgress: 0,
    encryptedSignal: {
      algorithm: 'AES-GCM-256',
      iv: 'YLIBZQBcrYVoocEZ',
      ciphertext: 'AGiZr6WGU4g3My3fCWXV6EJj5hdVePq3av3zFHzxIjdxe5jCgyvWMI+qPtsilRXQtZrtY1puisOGLPbw9Del84FOyQAqF51zXJPqPJTcX95GyfywRUmkNvqlj0WxIdBLEina2JAr4qlfmgxrUxrxL0HfYSBy36e8N11oIJzP+aAJfmWhkl/O065ah51p7sBY1tCO',
      tagLength: 128,
      keyFingerprint: '998F1DAB1C10F213',
      rollingCounter: 1420,
      lastSyncTimestamp: Date.now() - 3600000,
    },
    rawPulsesPreview: [9600, 320, 700, 350, 350, 700],
    hexCodePreview: '0xA4F892',
    bridgeId: 'VirtualSimulator',
    isOnline: true,
    rssi: -42,
    courtesyLightOn: false,
    pedestrianSupported: true,
    favorite: true,
  },
  {
    id: 'door_garage_2',
    name: 'North Garage Door',
    location: 'Residential Garage Bay 1',
    gateType: 'overhead_garage',
    frequency: '868.35 MHz',
    protocol: 'rolling_code_bisecur',
    modulation: 'FSK',
    brandPreset: 'Hörmann',
    state: 'closed',
    travelTimeSeconds: 10,
    currentProgress: 0,
    encryptedSignal: {
      algorithm: 'AES-GCM-256',
      iv: 'YF8cg0at3uchSXq/',
      ciphertext: 'mf7TVk5VtYxoHuBaMITi72Gv9chsLTeyjOuHYcvQFsyxnu0Q3SAyCV5VsYfSda1pqVn+B5nHBS/Vjf/8qAlPf0yE6lPRKmvH/olqh4hb+LNf6j3YPrxBuHeYEHxgvqOHi2VoG+TIPYL3ix3lyJh5zOIbf1dRBJLsO+dcG4ows668RK8kcj45mj+L31oldt/A',
      tagLength: 128,
      keyFingerprint: '998F1DAB1C10F213',
      rollingCounter: 2184,
      lastSyncTimestamp: Date.now() - 7200000,
    },
    rawPulsesPreview: [9600, 320, 700, 350, 700, 350],
    hexCodePreview: '0x3D92FC1A',
    bridgeId: 'VirtualSimulator',
    isOnline: true,
    rssi: -38,
    courtesyLightOn: true,
    pedestrianSupported: false,
  },
  {
    id: 'door_courtyard_3',
    name: 'Courtyard Pedestrian Gate',
    location: 'Inner Garden Walkway',
    gateType: 'swing_gate',
    frequency: '433.92 MHz',
    protocol: 'rolling_code_keeloq',
    modulation: 'ASK/OOK',
    brandPreset: 'Nice',
    state: 'closed',
    travelTimeSeconds: 6,
    currentProgress: 0,
    encryptedSignal: {
      algorithm: 'AES-GCM-256',
      iv: 'OGF+qKtK7BiLdTFO',
      ciphertext: 'f6i0Q0Wx5kejjX89aG1nNPNZ1Rltb8MHcxvGlxEqH3PmjWXoZMd+SDRLeaFxRxy1/cKTUzc7ILO4uXVKuPTOqAypLzZt4fxSzLsvqWjKlWrC3vdbCAbDTOGIqgUqNO5zLCZVkVx1K3Swz+EbgJ14GyDANK5iiVHaoGxvYTRVM7zd0Hk6CCj0LcvQ83RQRhQBfIpR0Omj',
      tagLength: 128,
      keyFingerprint: '998F1DAB1C10F213',
      rollingCounter: 890,
      lastSyncTimestamp: Date.now() - 14400000,
    },
    rawPulsesPreview: [9600, 320, 350, 700, 700, 350],
    hexCodePreview: '0x5E81A2C7',
    bridgeId: 'VirtualSimulator',
    isOnline: true,
    rssi: -49,
    courtesyLightOn: false,
    pedestrianSupported: true,
  },
];

const INITIAL_USERS: UserProfile[] = [
  {
    id: 'user_elios_admin',
    name: 'Elios',
    email: 'eliosmernica@gmail.com',
    role: 'admin',
    avatarUrl: avatarAdminImage,
    assignedDoorIds: [],
  },
  {
    id: 'user_sarah_mgr',
    name: 'Sarah Jenkins',
    email: 'sarah.j@estate-mgmt.io',
    role: 'manager',
    assignedDoorIds: ['door_driveway_1', 'door_garage_2', 'door_courtyard_3'],
  },
  {
    id: 'user_alex_driver',
    name: 'Alex Rivera',
    email: 'alex.rivera@delivery.com',
    role: 'member',
    assignedDoorIds: ['door_driveway_1'],
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'remote' | 'vault' | 'logs'>('remote');
  const [doors, setDoors] = useState<DoorDevice[]>(INITIAL_DOORS);
  const [selectedDoorId, setSelectedDoorId] = useState<string>(INITIAL_DOORS[0].id);
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_USERS[0]);

  // Transmit & simulation states
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [connectionMode, setConnectionMode] = useState<'cloud' | 'local_rf'>('cloud');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [logs, setLogs] = useState<TransmissionLog[]>([]);

  // Modals
  const [isLearnerOpen, setIsLearnerOpen] = useState(false);
  const [isExplainerOpen, setIsExplainerOpen] = useState(false);
  const [isUserMgmtOpen, setIsUserMgmtOpen] = useState(false);

  // Active door reference
  const currentDoor = doors.find((d) => d.id === selectedDoorId) || doors[0];

  // Check if current user is allowed to operate the door
  const canOperateCurrentDoor =
    currentUser.role === 'admin' ||
    currentUser.role === 'manager' ||
    currentUser.assignedDoorIds.includes(currentDoor.id);

  // Travel Timer Ticker: animates doors opening and closing in real-time
  useEffect(() => {
    const interval = setInterval(() => {
      setDoors((prevDoors) =>
        prevDoors.map((door) => {
          if (door.state === 'opening') {
            const step = Math.round(100 / (door.travelTimeSeconds * 5));
            const nextProgress = Math.min(100, door.currentProgress + step);
            if (nextProgress >= 100) {
              if (soundEnabled) playTelecommandSound('success');
              return { ...door, currentProgress: 100, state: 'open' };
            }
            return { ...door, currentProgress: nextProgress };
          } else if (door.state === 'closing') {
            const step = Math.round(100 / (door.travelTimeSeconds * 5));
            const nextProgress = Math.max(0, door.currentProgress - step);
            if (nextProgress <= 0) {
              if (soundEnabled) playTelecommandSound('success');
              return { ...door, currentProgress: 0, state: 'closed' };
            }
            return { ...door, currentProgress: nextProgress };
          }
          return door;
        })
      );
    }, 200);

    return () => clearInterval(interval);
  }, [soundEnabled]);

  // Central dispatch handler for the virtual telecommand
  const handleDispatchAction = async (
    action: 'OPEN' | 'CLOSE' | 'STOP' | 'PEDESTRIAN' | 'LIGHT_TOGGLE'
  ) => {
    if (!canOperateCurrentDoor) {
      alert(`Access Restricted: Your role (${currentUser.role}) is not authorized for this door.`);
      return;
    }

    setIsTransmitting(true);
    const startTime = performance.now();

    // Advance rolling counter for security
    const updatedEncrypted = await advanceRollingCounter(currentDoor.encryptedSignal);

    // Update state based on action
    setDoors((prev) =>
      prev.map((door) => {
        if (door.id !== currentDoor.id) return door;

        if (action === 'OPEN') {
          return {
            ...door,
            state: 'opening',
            encryptedSignal: updatedEncrypted,
            lastTriggeredAt: new Date().toLocaleTimeString(),
            lastTriggeredBy: currentUser.name,
          };
        }
        if (action === 'CLOSE') {
          return {
            ...door,
            state: 'closing',
            encryptedSignal: updatedEncrypted,
            lastTriggeredAt: new Date().toLocaleTimeString(),
            lastTriggeredBy: currentUser.name,
          };
        }
        if (action === 'STOP') {
          return {
            ...door,
            state: 'stopped',
            encryptedSignal: updatedEncrypted,
            lastTriggeredAt: new Date().toLocaleTimeString(),
            lastTriggeredBy: currentUser.name,
          };
        }
        if (action === 'PEDESTRIAN') {
          return {
            ...door,
            state: 'opening',
            currentProgress: 35, // 1 meter opening
            encryptedSignal: updatedEncrypted,
            lastTriggeredAt: new Date().toLocaleTimeString(),
            lastTriggeredBy: currentUser.name,
          };
        }
        if (action === 'LIGHT_TOGGLE') {
          return {
            ...door,
            courtesyLightOn: !door.courtesyLightOn,
          };
        }
        return door;
      })
    );

    const latencyMs = Math.round(performance.now() - startTime) + (connectionMode === 'cloud' ? 38 : 12);

    // Append to live transmission telemetry log
    const newLog: TransmissionLog = {
      id: `tx_${Date.now()}`,
      doorId: currentDoor.id,
      doorName: currentDoor.name,
      action,
      timestamp: new Date().toLocaleTimeString(),
      user: currentUser.name,
      userRole: currentUser.role,
      frequency: currentDoor.frequency,
      protocol: currentDoor.protocol,
      counterValue: updatedEncrypted.rollingCounter,
      latencyMs,
      rssi: currentDoor.rssi,
      success: true,
      channel: connectionMode === 'cloud' ? 'Cloud-Relay' : 'Direct-RF',
    };

    setLogs((prev) => [newLog, ...prev.slice(0, 49)]);

    setTimeout(() => {
      setIsTransmitting(false);
    }, 400);
  };

  // Add newly learned door from frequency sniffer
  const handleDoorLearned = (newDoor: DoorDevice) => {
    setDoors((prev) => [newDoor, ...prev]);
    setSelectedDoorId(newDoor.id);
    setActiveTab('remote');

    // Add log
    const learnLog: TransmissionLog = {
      id: `learn_${Date.now()}`,
      doorId: newDoor.id,
      doorName: newDoor.name,
      action: 'OPEN',
      timestamp: new Date().toLocaleTimeString(),
      user: currentUser.name,
      userRole: currentUser.role,
      frequency: newDoor.frequency,
      protocol: newDoor.protocol,
      counterValue: newDoor.encryptedSignal.rollingCounter,
      latencyMs: 24,
      rssi: newDoor.rssi,
      success: true,
      channel: 'Direct-RF',
    };
    setLogs((prev) => [learnLog, ...prev]);
  };

  // Fast 1-click play frequency and create clone control center from existing telecommand
  const handlePlayAndCloneFromExisting = async (sourceDoor: DoorDevice) => {
    setIsTransmitting(true);
    playTelecommandSound('rf_burst');

    const finalName = `${sourceDoor.name} (Remote 2)`;
    const newEncrypted = await advanceRollingCounter(sourceDoor.encryptedSignal);

    setTimeout(() => {
      const clonedDoor: DoorDevice = {
        id: `door_clone_${Date.now()}`,
        name: finalName,
        location: `${sourceDoor.location} (Paired Remote)`,
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

      setDoors((prev) => [clonedDoor, ...prev]);
      setSelectedDoorId(clonedDoor.id);
      setIsTransmitting(false);
      playTelecommandSound('success');

      // Add log
      const cloneLog: TransmissionLog = {
        id: `clone_${Date.now()}`,
        doorId: clonedDoor.id,
        doorName: clonedDoor.name,
        action: 'OPEN',
        timestamp: new Date().toLocaleTimeString(),
        user: currentUser.name,
        userRole: currentUser.role,
        frequency: clonedDoor.frequency,
        protocol: clonedDoor.protocol,
        counterValue: clonedDoor.encryptedSignal.rollingCounter,
        latencyMs: 18,
        rssi: clonedDoor.rssi,
        success: true,
        channel: 'Direct-RF',
      };
      setLogs((prev) => [cloneLog, ...prev]);
    }, 1200);
  };

  // Delete door from database
  const handleDeleteDoor = (doorId: string) => {
    if (doors.length <= 1) {
      alert('You must keep at least one registered door in your database.');
      return;
    }
    const remaining = doors.filter((d) => d.id !== doorId);
    setDoors(remaining);
    if (selectedDoorId === doorId) {
      setSelectedDoorId(remaining[0].id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30">
      {/* Top Bar Contract: Zone 1 (Wordmark) - Zone 2 (Clean Nav) - Zone 3 (Primary CTAs) */}
      <header className="sticky top-0 z-40 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        {/* Zone 1: Brand title wordmark */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Radio className="w-5 h-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
            TeleGate
          </span>
        </div>

        {/* Zone 2: Clean 1-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-400">
          <button
            onClick={() => setActiveTab('remote')}
            className={`transition-colors hover:text-white ${activeTab === 'remote' ? 'text-cyan-400 border-b-2 border-cyan-400 pb-0.5' : ''}`}
          >
            Telecommand
          </button>
          <button
            onClick={() => setActiveTab('vault')}
            className={`transition-colors hover:text-white ${activeTab === 'vault' ? 'text-cyan-400 border-b-2 border-cyan-400 pb-0.5' : ''}`}
          >
            Encrypted Vault
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`transition-colors hover:text-white ${activeTab === 'logs' ? 'text-cyan-400 border-b-2 border-cyan-400 pb-0.5' : ''}`}
          >
            Telemetry Logs
          </button>
          <button
            onClick={() => setIsExplainerOpen(true)}
            className="hover:text-cyan-300 transition-colors flex items-center gap-1 text-slate-300"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>How It Works</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-3">
          {/* Active User Switcher Pill */}
          <button
            onClick={() => setIsUserMgmtOpen(true)}
            className="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
            title="Switch user or manage team permissions"
          >
            <div className="h-6 w-6 rounded-full bg-cyan-700 flex items-center justify-center text-[10px] font-bold text-white">
              {currentUser.name.charAt(0)}
            </div>
            <span className="text-xs font-medium text-slate-200 hidden sm:inline max-w-[90px] truncate">
              {currentUser.name}
            </span>
            <span className="text-[10px] font-mono text-cyan-400 uppercase hidden sm:inline">
              ({currentUser.role})
            </span>
          </button>

          {/* Add Door / Sniff Frequency Button */}
          <button
            onClick={() => setIsLearnerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Door / Frequency</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Navigation Tabs for Mobile Viewport */}
        <div className="flex md:hidden items-center justify-around bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
          <button
            onClick={() => setActiveTab('remote')}
            className={`py-2 px-3 rounded-lg font-medium transition-all ${
              activeTab === 'remote' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400'
            }`}
          >
            Telecommand
          </button>
          <button
            onClick={() => setActiveTab('vault')}
            className={`py-2 px-3 rounded-lg font-medium transition-all ${
              activeTab === 'vault' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400'
            }`}
          >
            Signal Vault
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-2 px-3 rounded-lg font-medium transition-all ${
              activeTab === 'logs' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400'
            }`}
          >
            Telemetry
          </button>
          <button
            onClick={() => setIsExplainerOpen(true)}
            className="py-2 px-3 text-cyan-400 font-medium"
          >
            Guide
          </button>
        </div>

        {/* TAB 1: TELECOMMAND COCKPIT (THE MAIN OBJECTIVE) */}
        {activeTab === 'remote' && (
          <div className="space-y-6">
            {/* Top Operational Status Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-base font-bold text-white tracking-tight">
                    Phone Virtual Telecommand Hub
                  </h1>
                  <p className="text-xs text-slate-400">
                    Control any gate anywhere using Sub-GHz RF Bridge or Cloud 5G Relay
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs">
                <button
                  onClick={() => setIsExplainerOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                  <span>How to connect real hardware</span>
                </button>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Bridge Online: 433 / 868 / 315 MHz</span>
                </div>
              </div>
            </div>

            {/* Split Screen Layout: Left Gate Canvas Visualizer + Right Tactile Telecommand Remote */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column (7 cols): Gate Physical Visualization & Telemetry */}
              <div className="lg:col-span-7 space-y-5">
                <GateVisualizer
                  door={currentDoor}
                  onQuickToggle={() =>
                    handleDispatchAction(currentDoor.state === 'closed' ? 'OPEN' : 'CLOSE')
                  }
                  isTransmitting={isTransmitting}
                />

                {/* Door Information & Protocol Specifications */}
                <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Signal & Radio Specifications</span>
                    <span className="text-cyan-400 font-mono text-[10px]">
                      {currentDoor.bridgeId} Connected
                    </span>
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                      <span className="text-slate-500 text-[10px] block">FREQUENCY</span>
                      <span className="text-cyan-400 font-bold">{currentDoor.frequency}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                      <span className="text-slate-500 text-[10px] block">MODULATION</span>
                      <span className="text-slate-200 font-bold">{currentDoor.modulation}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                      <span className="text-slate-500 text-[10px] block">PROTOCOL</span>
                      <span className="text-slate-200 font-bold truncate block">
                        {currentDoor.protocol.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                      <span className="text-slate-500 text-[10px] block">ROLLING COUNTER</span>
                      <span className="text-emerald-400 font-bold">
                        #{currentDoor.encryptedSignal.rollingCounter}
                      </span>
                    </div>
                  </div>

                  {/* Anti-replay & E2EE verified banner */}
                  <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>End-to-End Encrypted (AES-GCM-256) with Private Master Key</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      RSSI: {currentDoor.rssi} dBm
                    </span>
                  </div>
                </div>

                {/* Real-time mini transmission log */}
                <RFTelemetryConsole logs={logs.slice(0, 5)} onClearLogs={() => setLogs([])} />
              </div>

              {/* Right Column (5 cols): The Handheld Physical Telecommand Remote */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <VirtualTelecommand
                  currentDoor={currentDoor}
                  allDoors={doors}
                  onSelectDoor={(id) => setSelectedDoorId(id)}
                  onDispatchAction={handleDispatchAction}
                  isTransmitting={isTransmitting}
                  connectionMode={connectionMode}
                  onToggleConnectionMode={() =>
                    setConnectionMode((prev) => (prev === 'cloud' ? 'local_rf' : 'cloud'))
                  }
                  soundEnabled={soundEnabled}
                  onToggleSound={() => setSoundEnabled((prev) => !prev)}
                  onPlayAndCloneFrequency={handlePlayAndCloneFromExisting}
                  onAddNewDoor={() => setIsLearnerOpen(true)}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ENCRYPTED VAULT & DATABASE */}
        {activeTab === 'vault' && (
          <VaultManager
            doors={doors}
            onDeleteDoor={handleDeleteDoor}
            onTriggerDoor={(id) => {
              setSelectedDoorId(id);
              setActiveTab('remote');
            }}
          />
        )}

        {/* TAB 3: TELEMETRY CONSOLE */}
        {activeTab === 'logs' && (
          <RFTelemetryConsole logs={logs} onClearLogs={() => setLogs([])} />
        )}
      </main>

      {/* MODAL 1: FREQUENCY LEARNER & SNIFFER */}
      <FrequencyLearnerModal
        isOpen={isLearnerOpen}
        onClose={() => setIsLearnerOpen(false)}
        onDoorLearned={handleDoorLearned}
        connectedDoors={doors}
      />

      {/* MODAL 2: ARCHITECTURE & ENGINEERING GUIDE */}
      <ArchitectureExplainerModal
        isOpen={isExplainerOpen}
        onClose={() => setIsExplainerOpen(false)}
        hardwareImageSrc={hardwareImage}
        gateImageSrc={entranceImage}
      />

      {/* MODAL 3: USER & TEAM ACCESS (RBAC) */}
      <UserManagementModal
        isOpen={isUserMgmtOpen}
        onClose={() => setIsUserMgmtOpen(false)}
        currentUser={currentUser}
        allUsers={users}
        doors={doors}
        onSwitchUser={(u) => setCurrentUser(u)}
        onAddUser={(newUser) => setUsers((prev) => [...prev, newUser])}
      />

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 px-4 sm:px-8 py-4 mt-auto text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span>TeleGate Universal Access</span>
          <span aria-hidden="true">·</span>
          <span>End-to-End Encrypted (AES-256-GCM)</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
          <span>RF Bands: 433MHz · 868MHz · 315MHz · 2.4GHz</span>
          <button
            onClick={() => setIsExplainerOpen(true)}
            className="hover:text-cyan-400 transition-colors underline"
          >
            Hardware Blueprint
          </button>
        </div>
      </footer>
    </div>
  );
}
