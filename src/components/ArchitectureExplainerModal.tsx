import React from 'react';
import { X, Radio, Cpu, Smartphone, ShieldCheck, Zap, Server, Cable, ExternalLink } from 'lucide-react';

interface ArchitectureExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  hardwareImageSrc?: string;
  gateImageSrc?: string;
}

export const ArchitectureExplainerModal: React.FC<ArchitectureExplainerModalProps> = ({
  isOpen,
  onClose,
  hardwareImageSrc,
  gateImageSrc,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 my-8 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>How It Works: The Universal Door & RF Architecture</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Complete engineering blueprint: How your phone controls any garage or gate in the world
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 pt-4 text-xs text-slate-300 leading-relaxed">
          {/* Key Truth 1: The Phone Radio Limitation & The Bridge */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <h4 className="text-sm font-bold text-cyan-400 mb-2 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              1. The Physical Hardware Reality: Why Phones Need an RF Bridge
            </h4>
            <p className="mb-3">
              Automated gates and garage doors worldwide operate on <strong className="text-white">Sub-1GHz radio frequencies</strong>:
              most commonly <span className="font-mono text-cyan-300">433.92 MHz</span> (Europe/Asia/Latin America),{' '}
              <span className="font-mono text-cyan-300">315.00 MHz / 390.00 MHz</span> (North America), and{' '}
              <span className="font-mono text-cyan-300">868.35 MHz</span> (Modern high-security European brands like Hörmann BiSecur).
            </p>
            <div className="bg-amber-950/30 border border-amber-800/60 p-3 rounded-lg text-amber-200">
              <strong>Crucial Technical Fact: </strong>
              Smartphones (iPhones and Androids) physically do <em>not</em> have Sub-1GHz radio antennas inside their silicon.
              Phones only have Wi-Fi (2.4/5GHz), Bluetooth (2.4GHz), and NFC (13.56MHz).
            </div>
          </div>

          {/* Key Truth 2: The 3 Hardware Approaches to control every door */}
          <div>
            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              2. The 3 Industry Methods to Bridge Your Phone to ANY Door
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Method A */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-cyan-400 mb-1">Method A: Home Wi-Fi RF Bridge</div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase block mb-2">Everywhere 5G Access</span>
                  <p className="text-[11px] text-slate-400">
                    A small $15 device (like an <strong className="text-slate-200">ESP32 + CC1101</strong>, Sonoff RF Bridge, or Broadlink)
                    plugs into a USB wall adapter in your garage or home. It connects to your Wi-Fi.
                    When you tap "Open" on your phone from 1,000 miles away, TeleGate sends an encrypted cloud webhook to your bridge,
                    which broadcasts the 433MHz/868MHz signal to your gate!
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-900 text-[10px] text-emerald-400 font-mono">
                  ✓ Works from anywhere worldwide
                </div>
              </div>

              {/* Method B */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-purple-400 mb-1">Method B: USB OTG / BLE Dongle</div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase block mb-2">Direct Local Link</span>
                  <p className="text-[11px] text-slate-400">
                    A tiny Sub-GHz USB-C dongle plugs directly into your smartphone or laptop.
                    The browser uses the <strong className="text-slate-200">Web Serial API</strong> or <strong className="text-slate-200">Web Bluetooth API</strong>
                    to listen to frequency spectrums directly and transmit pulses locally without internet.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-900 text-[10px] text-cyan-400 font-mono">
                  ✓ Zero cloud latency, 100% offline
                </div>
              </div>

              {/* Method C */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-amber-400 mb-1">Method C: Smart Dry-Contact Relay</div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase block mb-2">100% Universal Guarantee</span>
                  <p className="text-[11px] text-slate-400">
                    A micro relay (e.g. <strong className="text-slate-200">Shelly Plus 1</strong> or Meross) wires into the wall-switch push button
                    terminals on ANY garage motor on Earth. This bypasses complicated rolling-code encryption entirely!
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-900 text-[10px] text-amber-400 font-mono">
                  ✓ Bypasses rolling-code limitations
                </div>
              </div>
            </div>
          </div>

          {/* Visual Showcase from Image Generation */}
          {hardwareImageSrc && (
            <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center">
              <img
                src={hardwareImageSrc}
                alt="RF Bridge Hardware Module"
                referrerPolicy="no-referrer"
                className="w-full sm:w-1/2 h-44 object-cover"
              />
              <div className="p-4 sm:w-1/2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 block mb-1">
                  Reference Bridge Hardware
                </span>
                <h5 className="text-sm font-bold text-white mb-1">ESP32 + CC1101 Multi-Band Transceiver</h5>
                <p className="text-[11px] text-slate-400">
                  Transmits and sniffs 300MHz to 928MHz with software-defined frequency tuning.
                  Can be powered by any 5V USB-C cable or connected to your home router.
                </p>
              </div>
            </div>
          )}

          {/* Key Truth 3: Fixed Code vs Rolling Code */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              3. Fixed Code vs. Rolling Code (KeeLoq)
            </h4>
            <div className="space-y-2 text-[11px] text-slate-400">
              <p>
                <strong className="text-slate-200">Fixed Code (DIP switch / PT2262 / Came TAM): </strong>
                The remote sends the same pulse sequence every time you press it.
                TeleGate's sniffer captures it in 2 seconds, and your phone can replay it immediately.
              </p>
              <p>
                <strong className="text-slate-200">Rolling Code (Nice Flor-S, Chamberlain Security+ 2.0, Somfy RTS, Hörmann BiSecur): </strong>
                The remote encrypts a 16-bit or 32-bit counter with a manufacturer seed key.
                If you replay an old code, the gate rejects it!
                To program TeleGate for rolling code doors, you put your door's motor receiver into "Learn Mode" (by pressing the PRG button on the ceiling motor),
                then transmit from TeleGate once to register your phone as a legitimate authorized new telecommand.
              </p>
            </div>
          </div>

          {/* Key Truth 4: End-to-End Encryption */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              4. End-to-End Encryption (E2EE) Vault in TeleGate
            </h4>
            <p className="text-[11px] text-slate-400">
              Every remote frequency code and rolling seed saved in TeleGate is encrypted client-side in the browser using{' '}
              <strong className="text-slate-200">AES-GCM-256</strong> via the standard Web Cryptography API.
              Only users with your private passphrase can decrypt and trigger the gate signal.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg transition-all"
          >
            Got It, Back to TeleGate
          </button>
        </div>
      </div>
    </div>
  );
};
