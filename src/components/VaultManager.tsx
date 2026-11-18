import React, { useState } from 'react';
import { DoorDevice } from '../types/telecommand';
import { decryptSignal, DEFAULT_MASTER_KEY } from '../utils/crypto';
import {
  Database,
  ShieldCheck,
  Key,
  Download,
  Trash2,
  Radio,
  Clock,
  Eye,
  EyeOff,
  Copy,
  Check,
} from 'lucide-react';

interface VaultManagerProps {
  doors: DoorDevice[];
  onDeleteDoor: (doorId: string) => void;
  onTriggerDoor: (doorId: string) => void;
}

export const VaultManager: React.FC<VaultManagerProps> = ({
  doors,
  onDeleteDoor,
  onTriggerDoor,
}) => {
  const [inspectedDoorId, setInspectedDoorId] = useState<string | null>(null);
  const [decryptedPayload, setDecryptedPayload] = useState<Record<string, unknown> | null>(null);
  const [passphraseInput, setPassphraseInput] = useState(DEFAULT_MASTER_KEY);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleInspect = async (door: DoorDevice) => {
    if (inspectedDoorId === door.id) {
      setInspectedDoorId(null);
      setDecryptedPayload(null);
      return;
    }

    setInspectedDoorId(door.id);
    setDecryptError(null);

    // Try decrypting using the master passphrase or fallback
    const result = await decryptSignal(door.encryptedSignal, passphraseInput);
    if (result) {
      setDecryptedPayload(result);
    } else {
      setDecryptError('Unable to decrypt with provided passphrase. Invalid AES-GCM-256 tag.');
      setDecryptedPayload(null);
    }
  };

  const handleExportVault = () => {
    const exportData = {
      version: 'TeleGate-v1.0-Vault',
      exportedAt: new Date().toISOString(),
      doors: doors.map((d) => ({
        id: d.id,
        name: d.name,
        location: d.location,
        gateType: d.gateType,
        frequency: d.frequency,
        protocol: d.protocol,
        encryptedSignal: d.encryptedSignal,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `telegate_encrypted_signals_vault_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Database className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold tracking-tight text-white">
              Encrypted Remote Signals Database
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            End-to-End Encrypted (AES-GCM-256) storage for recorded RF telecommands & rolling seeds
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportVault}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Encrypted Backup</span>
          </button>
        </div>
      </div>

      {/* Signals List / Data Grid */}
      <div className="overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Door Label & Location</th>
                <th className="py-3.5 px-4">Frequency Band</th>
                <th className="py-3.5 px-4">Protocol Architecture</th>
                <th className="py-3.5 px-4">AES-256 Key Fingerprint</th>
                <th className="py-3.5 px-4 text-right">Rolling Counter</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {doors.map((door) => {
                const isInspecting = inspectedDoorId === door.id;

                return (
                  <React.Fragment key={door.id}>
                    <tr className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{door.name}</div>
                        <div className="text-[11px] text-slate-400">{door.location}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-mono text-cyan-400 font-medium">{door.frequency}</div>
                        <div className="text-[10px] text-slate-500">{door.modulation}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-200">
                          {door.protocol.replace(/_/g, ' ')}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Brand: {door.brandPreset || 'Universal'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{door.encryptedSignal.keyFingerprint}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">AES-GCM-256 Verified</span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-200">
                        #{door.encryptedSignal.rollingCounter}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleInspect(door)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                            title="Inspect Encrypted Ciphertext"
                          >
                            {isInspecting ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            onClick={() => onTriggerDoor(door.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 font-semibold text-[11px] transition-colors"
                          >
                            Test Replay
                          </button>

                          <button
                            onClick={() => onDeleteDoor(door.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-slate-700 transition-colors"
                            title="Delete Signal Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Inspection Drawer */}
                    {isInspecting && (
                      <tr className="bg-slate-950/90">
                        <td colSpan={6} className="p-4 border-b border-slate-800">
                          <div className="rounded-xl bg-slate-900 p-4 border border-slate-800 space-y-3 font-mono text-[11px]">
                            <div className="flex items-center justify-between text-xs text-slate-300 pb-2 border-b border-slate-800">
                              <span className="font-bold text-cyan-400">
                                Cryptographic Vault Inspection: {door.name}
                              </span>
                              <div className="flex items-center gap-2">
                                <span>Master Passphrase:</span>
                                <input
                                  type="password"
                                  value={passphraseInput}
                                  onChange={(e) => setPassphraseInput(e.target.value)}
                                  className="bg-slate-950 border border-slate-700 px-2 py-1 rounded text-white text-xs w-48"
                                />
                                <button
                                  onClick={() => handleInspect(door)}
                                  className="px-2 py-1 bg-cyan-600 text-white rounded text-xs"
                                >
                                  Decrypt
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                              <div>
                                <span className="text-slate-500 block mb-1">
                                  STORED CIPHERTEXT (AES-256 GCM Base64):
                                </span>
                                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 break-all text-[10px] text-slate-400">
                                  {door.encryptedSignal.ciphertext}
                                </div>
                                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                                  <span>IV: {door.encryptedSignal.iv}</span>
                                  <span>Tag Length: {door.encryptedSignal.tagLength}-bit</span>
                                </div>
                              </div>

                              <div>
                                <span className="text-slate-500 block mb-1">DECRYPTED PAYLOAD:</span>
                                {decryptedPayload ? (
                                  <div className="p-2.5 rounded bg-slate-950 border border-emerald-900/60 text-emerald-400 text-[10px] space-y-1">
                                    <div>Raw Pulse Hex: <strong>{String(decryptedPayload.rawHex || door.hexCodePreview)}</strong></div>
                                    <div>Protocol: {String(decryptedPayload.protocol)}</div>
                                    <div>Sequence Seed: #{String(decryptedPayload.counter)}</div>
                                    <div className="text-slate-500">Created: {String(decryptedPayload.createdAt || 'N/A')}</div>
                                  </div>
                                ) : (
                                  <div className="p-2.5 rounded bg-slate-950 border border-red-900/60 text-red-400 text-[10px]">
                                    {decryptError || 'Enter valid passphrase to decrypt.'}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
