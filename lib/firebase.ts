import { Platform } from 'react-native';

export const FIREBASE_CONFIG = {
  projectId: 'deardayandroid',
  apiKey: 'AIzaSyD_EHV-J3lRwCsoK_eqZESAv4qm50czxxY',
  storageBucket: 'deardayandroid.firebasestorage.app',
};

const BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents`;

export interface CustomerStats {
  totalMemories?: number;
  streakDays?: number;
  booksCount?: number;
  unlockedBadgeCount?: number;
  unlockedBadgeIds?: string[];
}

export interface CustomerProfile {
  email: string;
  displayName: string;
  avatar?: string;
  joinedAt?: string;
  lastActiveAt?: string;
  platform?: string;
  appVersion?: string;
  marketingOptIn?: boolean;
  retargetingEligible?: boolean;
  stats?: CustomerStats;
}

/**
 * Encodes a JavaScript value into Firestore REST API format.
 */
function encodeFirestoreValue(val: any): any {
  if (val === null || val === undefined) {
    return { nullValue: null };
  }
  if (typeof val === 'boolean') {
    return { booleanValue: val };
  }
  if (typeof val === 'number') {
    if (Number.isInteger(val)) {
      return { integerValue: String(val) };
    }
    return { doubleValue: val };
  }
  if (typeof val === 'string') {
    return { stringValue: val };
  }
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.map(encodeFirestoreValue),
      },
    };
  }
  if (typeof val === 'object') {
    const fields: Record<string, any> = {};
    for (const key of Object.keys(val)) {
      if (val[key] !== undefined) {
        fields[key] = encodeFirestoreValue(val[key]);
      }
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

/**
 * Converts a JS object into Firestore document fields.
 */
function toFirestoreFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      fields[key] = encodeFirestoreValue(val);
    }
  }
  return fields;
}

/**
 * Sanitize email or user ID for Firestore document ID.
 */
function sanitizeDocId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
}

/**
 * Synchronizes customer profile to Firebase Firestore for retargeting, analytics, and re-engagement.
 * Creates the document if it doesn't exist, or merges fields if it already exists.
 */
export async function syncCustomerProfile(profile: CustomerProfile): Promise<boolean> {
  if (!profile.email) return false;

  const docId = sanitizeDocId(profile.email);
  const now = new Date().toISOString();

  const payload = {
    email: profile.email,
    displayName: profile.displayName || 'Dear Day Storyteller',
    avatar: profile.avatar || '',
    lastActiveAt: now,
    platform: Platform.OS,
    appVersion: '1.0.0',
    marketingOptIn: profile.marketingOptIn ?? true,
    retargetingEligible: profile.retargetingEligible ?? true,
    stats: profile.stats || {},
  };

  try {
    const url = `${BASE_URL}/users/${encodeURIComponent(docId)}?key=${FIREBASE_CONFIG.apiKey}&updateMask.fieldPaths=email&updateMask.fieldPaths=displayName&updateMask.fieldPaths=avatar&updateMask.fieldPaths=lastActiveAt&updateMask.fieldPaths=platform&updateMask.fieldPaths=appVersion&updateMask.fieldPaths=marketingOptIn&updateMask.fieldPaths=retargetingEligible&updateMask.fieldPaths=stats`;

    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: toFirestoreFields(payload),
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('Firestore sync returned non-OK status:', res.status, errText);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('Error syncing customer profile to Firestore:', err);
    return false;
  }
}

/**
 * Updates a customer's last active timestamp on app launch for retention tracking.
 */
export async function updateCustomerActivity(email: string): Promise<void> {
  if (!email) return;
  const docId = sanitizeDocId(email);
  const now = new Date().toISOString();

  try {
    const url = `${BASE_URL}/users/${encodeURIComponent(docId)}?key=${FIREBASE_CONFIG.apiKey}&updateMask.fieldPaths=lastActiveAt`;
    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          lastActiveAt: { stringValue: now },
        },
      }),
    });
  } catch (err) {
    // Non-blocking fail-safe
  }
}

/**
 * Updates unlocked badge count and IDs in Firebase Firestore for customer analytics and retargeting.
 */
export async function updateCustomerBadgeStats(
  email: string,
  unlockedBadgeCount: number,
  unlockedBadgeIds: string[]
): Promise<boolean> {
  if (!email) return false;
  const docId = sanitizeDocId(email);

  try {
    const url = `${BASE_URL}/users/${encodeURIComponent(docId)}?key=${FIREBASE_CONFIG.apiKey}&updateMask.fieldPaths=stats.unlockedBadgeCount&updateMask.fieldPaths=stats.unlockedBadgeIds`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          'stats.unlockedBadgeCount': encodeFirestoreValue(unlockedBadgeCount),
          'stats.unlockedBadgeIds': encodeFirestoreValue(unlockedBadgeIds),
        },
      }),
    });

    return res.ok;
  } catch (err) {
    console.warn('Error updating badge stats in Firestore:', err);
    return false;
  }
}
