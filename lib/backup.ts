/**
 * Encrypted backup for Dear Day diary data.
 *
 * Encryption: AES-256 via CryptoJS (runs natively in Hermes on Android & iOS).
 * Key storage: expo-secure-store (backed up to iCloud Keychain on iOS and
 *   Android Backup Service on Android — survives reinstall on the same account).
 * File storage: expo-file-system legacy API, documents directory (backed
 *   up to iCloud on iOS and Android Auto Backup on Android automatically).
 *
 * Cross-device recovery: The encryption key is stored in SecureStore which the
 *   OS backs up. For manual disaster recovery, users can view and note their
 *   64-hex-char recovery key and re-enter it on a new device.
 */

import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';
import { Platform } from 'react-native';

const BACKUP_KEY_STORE_KEY = 'daily5_backup_aes_key_v1';
const BACKUP_FILE_NAME = 'dearday_backup.d5b';
const BACKUP_VERSION = 2;

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateSecureHex32(): string {
  try {
    const wordArr = CryptoJS.lib.WordArray.random(32);
    const hex = wordArr.toString(CryptoJS.enc.Hex);
    if (hex && hex.length === 64) return hex;
  } catch {}

  // Fallback entropy accumulator
  const chars = '0123456789abcdef';
  let hex = '';
  for (let i = 0; i < 64; i++) {
    hex += chars[Math.floor(Math.random() * 16)];
  }
  return hex;
}

/** Returns the backup file path in the app's documents directory. */
export function getBackupFilePath(): string {
  const dir = FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? '';
  return `${dir}${BACKUP_FILE_NAME}`;
}

// ─── Key management ─────────────────────────────────────────────────────────

async function storeKey(hex: string): Promise<void> {
  if (Platform.OS !== 'web') {
    try {
      await SecureStore.setItemAsync(BACKUP_KEY_STORE_KEY, hex);
    } catch (e) {
      console.warn('[backup] SecureStore.setItemAsync failed:', e);
    }
  }
  // Always mirror to AsyncStorage as fallback
  try {
    await AsyncStorage.setItem(BACKUP_KEY_STORE_KEY, hex);
  } catch {}
}

async function readStoredKey(): Promise<string | null> {
  let hex: string | null = null;
  if (Platform.OS !== 'web') {
    try {
      hex = await SecureStore.getItemAsync(BACKUP_KEY_STORE_KEY);
    } catch (e) {
      console.warn('[backup] SecureStore.getItemAsync failed:', e);
    }
  }
  if (!hex || hex.length !== 64) {
    try {
      hex = await AsyncStorage.getItem(BACKUP_KEY_STORE_KEY);
    } catch {}
  }
  return hex && hex.length === 64 ? hex : null;
}

/**
 * Returns the 64-char hex recovery key, creating one if none exists.
 */
export async function getOrCreateRecoveryKey(): Promise<string> {
  if (Platform.OS === 'web') return '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  let hex = await readStoredKey();
  if (!hex) {
    hex = generateSecureHex32();
    await storeKey(hex);
  }
  return hex;
}

/** Format the recovery key in groups of 8 for display: XXXXXXXX-XXXXXXXX-… */
export function formatRecoveryKey(hex: string): string {
  return hex.match(/.{8}/g)?.join('-') ?? hex;
}

/**
 * Validates and imports a recovery key from a hex string (with or without dashes/spaces).
 * Returns true if successfully stored.
 */
export async function importRecoveryKey(input: string): Promise<boolean> {
  try {
    const clean = input.trim().toLowerCase().replace(/[\s\-]/g, '');
    if (!/^[0-9a-f]{64}$/.test(clean)) return false;
    await storeKey(clean);
    return true;
  } catch {
    return false;
  }
}

// ─── Encrypt / Decrypt ──────────────────────────────────────────────────────

export interface BackupPayload {
  version: number;
  appName: string;
  createdAt: string;
  platform: string;
  data: string; // AES ciphertext
}

export async function encryptBackup(data: unknown): Promise<BackupPayload> {
  const keyHex = await getOrCreateRecoveryKey();
  const rawJson = JSON.stringify(data);
  const encrypted = CryptoJS.AES.encrypt(rawJson, keyHex).toString();

  return {
    version: BACKUP_VERSION,
    appName: 'Dear Day',
    createdAt: new Date().toISOString(),
    platform: Platform.OS,
    data: encrypted,
  };
}

export async function decryptBackup(payload: any): Promise<unknown> {
  if (!payload || !payload.data) {
    throw new Error('Invalid backup payload');
  }
  const keyHex = await getOrCreateRecoveryKey();
  const bytes = CryptoJS.AES.decrypt(payload.data, keyHex);
  const decryptedUtf8 = bytes.toString(CryptoJS.enc.Utf8);

  if (!decryptedUtf8) {
    throw new Error('Decryption failed. Incorrect recovery key or corrupt backup file.');
  }

  return JSON.parse(decryptedUtf8);
}

// ─── File operations ────────────────────────────────────────────────────────

/** Write an encrypted backup of `data` to the documents directory. */
export async function saveBackupToFile(data: unknown): Promise<void> {
  const payload = await encryptBackup(data);
  const filePath = getBackupFilePath();
  await FileSystem.writeAsStringAsync(
    filePath,
    JSON.stringify(payload, null, 2),
    { encoding: FileSystem.EncodingType.UTF8 },
  );
}

/** Returns true if a backup file exists in the documents directory. */
export async function backupFileExists(): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(getBackupFilePath());
    return info.exists;
  } catch {
    return false;
  }
}

/**
 * Load and decrypt the backup from the documents directory.
 * Returns null if no backup exists or decryption fails.
 */
export async function loadBackupFromFile(): Promise<unknown | null> {
  try {
    const exists = await backupFileExists();
    if (!exists) return null;
    const json = await FileSystem.readAsStringAsync(
      getBackupFilePath(),
      { encoding: FileSystem.EncodingType.UTF8 },
    );
    const payload = JSON.parse(json);
    return await decryptBackup(payload);
  } catch (err) {
    console.warn('[backup] loadBackupFromFile failed:', err);
    return null;
  }
}

/** Returns the timestamp of the last backup, or null if none. */
export async function getLastBackupTime(): Promise<Date | null> {
  try {
    const exists = await backupFileExists();
    if (!exists) return null;
    const json = await FileSystem.readAsStringAsync(
      getBackupFilePath(),
      { encoding: FileSystem.EncodingType.UTF8 },
    );
    const payload = JSON.parse(json);
    return payload.createdAt ? new Date(payload.createdAt) : null;
  } catch {
    return null;
  }
}

/** Delete the backup file from the documents directory. */
export async function deleteBackupFile(): Promise<void> {
  try {
    const exists = await backupFileExists();
    if (exists) await FileSystem.deleteAsync(getBackupFilePath(), { idempotent: true });
  } catch {}
}

// ─── Share / Import ─────────────────────────────────────────────────────────

/** Share the backup file via the OS sharing sheet. If none exists, creates one first from current data. */
export async function exportBackupFile(fallbackData?: unknown): Promise<void> {
  let exists = await backupFileExists();
  if (!exists && fallbackData) {
    await saveBackupToFile(fallbackData);
    exists = true;
  }
  if (!exists) {
    throw new Error('No local backup file found. Tap "Back up now" first to generate one.');
  }
  const Sharing = await import('expo-sharing');
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('File sharing is not available on this device.');
  }

  await Sharing.shareAsync(getBackupFilePath(), {
    mimeType: 'application/octet-stream',
    dialogTitle: 'Save Dear Day Encrypted Backup',
    UTI: 'public.data',
  });
}

/**
 * Let the user pick a backup file and decrypt it with the current key.
 * Returns the decrypted data, or null if cancelled / failed.
 */
export async function importBackupFromFilePicker(): Promise<unknown | null> {
  try {
    const DocumentPicker = await import('expo-document-picker');
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets || result.assets.length === 0) return null;
    const uri = result.assets[0].uri;
    const json = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
    const payload = JSON.parse(json);
    return await decryptBackup(payload);
  } catch (err) {
    console.warn('[backup] importBackupFromFilePicker failed:', err);
    return null;
  }
}
