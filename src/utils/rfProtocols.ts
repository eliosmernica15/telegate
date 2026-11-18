/**
 * Market RF Protocols, Waveform Generators, and Hardware Bridge Definitions
 */

import { FrequencyBand, ProtocolType, ModulationType, GateType } from '../types/telecommand';

export interface BrandPreset {
  id: string;
  brand: string;
  model: string;
  gateType: GateType;
  frequency: FrequencyBand;
  protocol: ProtocolType;
  modulation: ModulationType;
  defaultHex: string;
  description: string;
  isRollingCode: boolean;
  pairingInstructions: string;
}

export const KNOWN_MARKET_PRESETS: BrandPreset[] = [
  {
    id: 'came_top432',
    brand: 'Came',
    model: 'TOP-432EE / TAM-432SA',
    gateType: 'sliding_gate',
    frequency: '433.92 MHz',
    protocol: 'fixed_code_24bit',
    modulation: 'ASK/OOK',
    defaultHex: '0xA4F892',
    description: 'Very common European sliding and swing gate opener (24-bit fixed code).',
    isRollingCode: false,
    pairingInstructions: 'Direct Clone: Press the remote near the bridge to capture the fixed pulse sequence instantly.',
  },
  {
    id: 'nice_flor_s',
    brand: 'Nice',
    model: 'Flor-S / Era One',
    gateType: 'swing_gate',
    frequency: '433.92 MHz',
    protocol: 'rolling_code_keeloq',
    modulation: 'ASK/OOK',
    defaultHex: '0x5E81A2C7',
    description: 'High security rolling code using KeeLoq encryption algorithm with 66-bit frame.',
    isRollingCode: true,
    pairingInstructions: 'Press motor receiver PRG button, then transmit signal from TeleGate to register the rolling seed into motor EEPROM.',
  },
  {
    id: 'hormann_bisecur',
    brand: 'Hörmann',
    model: 'BiSecur HSE 4 / HSM 4',
    gateType: 'overhead_garage',
    frequency: '868.35 MHz',
    protocol: 'rolling_code_bisecur',
    modulation: 'FSK',
    defaultHex: '0x3D92FC1A4B0E88',
    description: 'Modern 128-bit AES encrypted bidirectional garage and gate automation.',
    isRollingCode: true,
    pairingInstructions: 'Put motor into teach-in mode (flashing red/blue LED) and tap Enroll on TeleGate bridge.',
  },
  {
    id: 'chamberlain_sec_plus',
    brand: 'Chamberlain / LiftMaster',
    model: 'Security+ 2.0 (Yellow Learn Button)',
    gateType: 'overhead_garage',
    frequency: '315.00 MHz',
    protocol: 'rolling_code_security_plus',
    modulation: 'ASK/OOK',
    defaultHex: '0x882B491F0C',
    description: 'Tri-band rolling code used in millions of North American residential garage doors.',
    isRollingCode: true,
    pairingInstructions: 'Press yellow circular learn button on overhead motor until LED glows steady, then tap Transmit.',
  },
  {
    id: 'somfy_rts',
    brand: 'Somfy',
    model: 'RTS Telis 1 / Keytis NS',
    gateType: 'rolling_shutter',
    frequency: '433.92 MHz',
    protocol: 'rolling_code_keeloq',
    modulation: 'ASK/OOK',
    defaultHex: '0x6A19FF4E',
    description: 'Widely used for rolling window shutters, garage roll-ups, and driveway gates.',
    isRollingCode: true,
    pairingInstructions: 'Press PROG button on motor or existing remote for 2s until shutter jogs, then press Program on TeleGate.',
  },
  {
    id: 'bft_mitto',
    brand: 'BFT',
    model: 'Mitto 2 / Mitto 4',
    gateType: 'barrier_boom',
    frequency: '433.92 MHz',
    protocol: 'rolling_code_keeloq',
    modulation: 'ASK/OOK',
    defaultHex: '0x7B9941EA',
    description: 'Italian commercial barriers, condominium gates, and swing gate operators.',
    isRollingCode: true,
    pairingInstructions: 'Press hidden button or simultaneous 1+2 on remote, then trigger TeleGate capture.',
  },
  {
    id: 'universal_fixed_dip',
    brand: 'Universal Fixed Code',
    model: '12-DIP Switch / PT2262 Clone',
    gateType: 'sliding_gate',
    frequency: '433.92 MHz',
    protocol: 'fixed_code_24bit',
    modulation: 'ASK/OOK',
    defaultHex: '0x334455',
    description: 'Universal 8-to-12 switch code gates. 100% cloneable in 1 click.',
    isRollingCode: false,
    pairingInstructions: 'Instantly cloned by holding existing remote within 20cm of RF bridge.',
  },
  {
    id: 'universal_smart_relay',
    brand: 'Universal Smart Dry-Contact Relay',
    model: 'Shelly Plus 1 / ESP32 Relay / Meross',
    gateType: 'overhead_garage',
    frequency: '2.4 GHz IoT',
    protocol: 'smart_dry_contact_relay',
    modulation: 'Wi-Fi/MQTT',
    defaultHex: '0xRELAY_PULSE_500MS',
    description: '100% Universal Solution: Connects to standard wall push-button terminals on ANY motor, bypassing all RF restrictions.',
    isRollingCode: false,
    pairingInstructions: 'Connect bridge Wi-Fi to your home router or cloud webhook. Works on 100% of motors on Earth with dry-contact terminals.',
  },
];

/**
 * Generate synthetic RF raw pulse timings [high_us, low_us, ...] for visualization
 */
export function generateSyntheticPulses(hexCode: string): number[] {
  const pulses: number[] = [];
  // Preamble sync
  pulses.push(9600, 320);

  // Convert hex to binary sequence
  const cleanHex = hexCode.replace(/^0x/i, '');
  let binary = '';
  for (let i = 0; i < cleanHex.length; i++) {
    const bin = parseInt(cleanHex[i], 16).toString(2).padStart(4, '0');
    binary += bin;
  }

  // Manchester / PWM Pulse Width Modulation
  for (let i = 0; i < binary.length; i++) {
    if (binary[i] === '1') {
      pulses.push(700, 350); // Short pulse
    } else {
      pulses.push(350, 700); // Long pulse
    }
  }
  // End of frame silence
  pulses.push(12000);
  return pulses;
}

/**
 * Play realistic telecommand relay click & RF burst via Web Audio
 */
export function playTelecommandSound(type: 'click' | 'rf_burst' | 'success' | 'alert') {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } else if (type === 'rf_burst') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1800, ctx.currentTime);
      osc.frequency.setValueAtTime(2400, ctx.currentTime + 0.04);
      osc.frequency.setValueAtTime(1600, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } else if (type === 'success') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.24);
    }
  } catch (err) {
    // Audio contexts might require user gesture in some browsers
    console.debug('Web audio feedback skipped:', err);
  }
}
