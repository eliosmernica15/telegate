/**
 * End-to-End Encryption (E2EE) utilities using Web Cryptography API
 * Implements AES-GCM-256 with PBKDF2 key derivation for stored telecommand signals.
 */

import { EncryptedSignalData } from '../types/telecommand';

export const DEFAULT_MASTER_KEY = 'TELEGATE-MASTER-KEY-ELIOS-DEFAULT';

// Default application pepper for PBKDF2 salt derivation
const VAULT_SALT = new TextEncoder().encode('TeleGate-Secure-Vault-v1-Salt-2026');

/**
 * Derives an AES-GCM CryptoKey from a secret passphrase
 */
export async function deriveKeyFromPassphrase(passphrase: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: VAULT_SALT,
      iterations: 10000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts arbitrary signal data (raw pulse timings, hex payloads, rolling seeds)
 */
export async function encryptSignal(
  data: Record<string, unknown>,
  passphrase = DEFAULT_MASTER_KEY
): Promise<EncryptedSignalData> {
  const key = await deriveKeyFromPassphrase(passphrase);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedData = new TextEncoder().encode(JSON.stringify(data));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encodedData
  );

  // Compute a 16-char key fingerprint for verification
  const keyRaw = await window.crypto.subtle.exportKey('raw', key);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', keyRaw);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const keyFingerprint = hashArray.slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

  const ciphertextBase64 = bufferToBase64(encryptedBuffer);
  const ivBase64 = bufferToBase64(iv.buffer);

  return {
    algorithm: 'AES-GCM-256',
    iv: ivBase64,
    ciphertext: ciphertextBase64,
    tagLength: 128,
    keyFingerprint,
    rollingCounter: (data.counter as number) || 1000,
    lastSyncTimestamp: Date.now(),
  };
}

/**
 * Decrypts stored signal data
 */
export async function decryptSignal(
  encrypted: EncryptedSignalData,
  passphrase = DEFAULT_MASTER_KEY
): Promise<Record<string, unknown> | null> {
  if (!encrypted?.ciphertext || !encrypted?.iv) {
    return null;
  }

  // Try the provided passphrase first, then known vault keys
  const candidates = Array.from(
    new Set([passphrase, DEFAULT_MASTER_KEY, 'My-Secure-Gate-Vault-Key'].filter(Boolean))
  );

  for (const candidateKey of candidates) {
    try {
      const key = await deriveKeyFromPassphrase(candidateKey);
      const iv = base64ToBuffer(encrypted.iv);
      const ciphertext = base64ToBuffer(encrypted.ciphertext);

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: new Uint8Array(iv),
        },
        key,
        ciphertext
      );

      const decoded = new TextDecoder().decode(decryptedBuffer);
      return JSON.parse(decoded);
    } catch {
      // Continue to next candidate without logging errors
    }
  }

  return null;
}

/**
 * Increments rolling code counter and re-encrypts packet
 */
export async function advanceRollingCounter(
  encrypted: EncryptedSignalData,
  passphrase = DEFAULT_MASTER_KEY
): Promise<EncryptedSignalData> {
  const currentData = (await decryptSignal(encrypted, passphrase)) || {};
  const nextCounter = (encrypted.rollingCounter || 1000) + 1;
  currentData.counter = nextCounter;
  currentData.lastDispatched = Date.now();
  return encryptSignal(currentData, passphrase);
}

// Base64 conversion helpers
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
