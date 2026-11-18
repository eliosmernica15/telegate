export type GateType = 
  | 'sliding_gate'
  | 'swing_gate'
  | 'overhead_garage'
  | 'rolling_shutter'
  | 'barrier_boom'
  | 'pedestrian_latch';

export type FrequencyBand = 
  | '433.92 MHz'
  | '868.35 MHz'
  | '315.00 MHz'
  | '390.00 MHz'
  | '418.00 MHz'
  | '915.00 MHz'
  | '2.4 GHz IoT';

export type ProtocolType = 
  | 'fixed_code_24bit'
  | 'rolling_code_keeloq'
  | 'rolling_code_bisecur'
  | 'rolling_code_security_plus'
  | 'smart_dry_contact_relay';

export type ModulationType = 'ASK/OOK' | 'FSK' | '2-FSK' | 'GFSK' | 'Wi-Fi/MQTT';

export type GateState = 'closed' | 'opening' | 'open' | 'closing' | 'stopped';

export type BridgeType = 'WebSerial' | 'WebBluetooth' | 'CloudGateway' | 'VirtualSimulator';

export type UserRole = 'admin' | 'manager' | 'member' | 'guest';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  assignedDoorIds: string[]; // empty means all doors if admin
}

export interface EncryptedSignalData {
  algorithm: 'AES-GCM-256';
  iv: string; // Base64
  ciphertext: string; // Base64 encrypted pulse timings & command codes
  tagLength: number;
  keyFingerprint: string;
  rollingCounter: number;
  lastSyncTimestamp: number;
}

export interface DoorDevice {
  id: string;
  name: string;
  location: string;
  gateType: GateType;
  frequency: FrequencyBand;
  protocol: ProtocolType;
  modulation: ModulationType;
  brandPreset?: string;
  state: GateState;
  travelTimeSeconds: number;
  currentProgress: number; // 0 (closed) to 100 (open)
  lastTriggeredAt?: string;
  lastTriggeredBy?: string;
  encryptedSignal: EncryptedSignalData;
  rawPulsesPreview: number[]; // microsecond pulses [high, low, ...]
  hexCodePreview: string;
  bridgeId: string;
  isOnline: boolean;
  rssi: number; // dBm e.g. -48
  courtesyLightOn: boolean;
  pedestrianSupported: boolean;
  favorite?: boolean;
}

export interface RFBridge {
  id: string;
  name: string;
  type: BridgeType;
  status: 'connected' | 'disconnected' | 'listening' | 'transmitting';
  portOrAddress: string;
  firmwareVersion: string;
  supportedBands: FrequencyBand[];
  lastPing: number;
}

export interface TransmissionLog {
  id: string;
  doorId: string;
  doorName: string;
  action: 'OPEN' | 'CLOSE' | 'STOP' | 'PEDESTRIAN' | 'LIGHT_TOGGLE';
  timestamp: string;
  user: string;
  userRole: UserRole;
  frequency: FrequencyBand;
  protocol: ProtocolType;
  counterValue: number;
  latencyMs: number;
  rssi: number;
  success: boolean;
  channel: 'Direct-RF' | 'Cloud-Relay' | 'WebSerial' | 'WebBluetooth';
}
