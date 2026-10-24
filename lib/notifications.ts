import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KEYS } from '@/lib/storage';

export type NotificationType = 'nightly' | 'onThisDay' | 'bookReady' | 'orderUpdates' | 'system';

export interface InAppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string; // ISO string
  read: boolean;
  actionRoute?: string;
  actionLabel?: string;
}

export interface NotificationPrefs {
  nightly: boolean;
  onThisDay: boolean;
  bookReady: boolean;
  orderUpdates: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  nightly: true,
  onThisDay: true,
  bookReady: true,
  orderUpdates: true,
};

// Configure foreground presentation behavior
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (e) {
  console.warn('[notifications] Failed to set notification handler:', e);
}

/**
 * Configure Android notification channels.
 */
export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    await Notifications.setNotificationChannelAsync('dearday_reminders', {
      name: 'Dear Day Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#E8593A',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('dearday_orders', {
      name: 'Dear Day Books & Orders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3A7EC4',
      sound: 'default',
    });
  } catch (err) {
    console.warn('[notifications] Channel setup error:', err);
  }
}

/**
 * Request notification permissions.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (e) {
    console.warn('[notifications] Permission request error:', e);
    return false;
  }
}

// ─── Preferences ─────────────────────────────────────────────────────────────

export async function loadNotificationPrefs(): Promise<NotificationPrefs> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.NOTIF_PREFS);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export async function saveNotificationPrefs(prefs: NotificationPrefs): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.NOTIF_PREFS, JSON.stringify(prefs));
    await rescheduleAllNotifications(prefs);
  } catch (e) {
    console.warn('[notifications] Failed to save prefs:', e);
  }
}

// ─── Scheduling ──────────────────────────────────────────────────────────────

export async function rescheduleAllNotifications(prefs?: NotificationPrefs): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const currentPrefs = prefs ?? (await loadNotificationPrefs());
    await Notifications.cancelAllScheduledNotificationsAsync();

    // 1. Nightly 9:00 PM reminder (21:00)
    if (currentPrefs.nightly) {
      await Notifications.scheduleNotificationAsync({
        identifier: 'dearday-nightly-reminder',
        content: {
          title: 'Tonight in 4 moments',
          body: 'Take a breath. What four moments deserved to be remembered today?',
          sound: 'default',
          channelId: 'dearday_reminders',
          data: { actionRoute: '/(tabs)' },
        } as any,
        trigger: {
          hour: 21,
          minute: 0,
          repeats: true,
        } as any,
      });
    }

    // 2. On This Day morning capsule (09:30 AM)
    if (currentPrefs.onThisDay) {
      await Notifications.scheduleNotificationAsync({
        identifier: 'dearday-on-this-day',
        content: {
          title: 'On This Day',
          body: 'A memory from your past is waiting for you in your Dear Day archive.',
          sound: 'default',
          channelId: 'dearday_reminders',
          data: { actionRoute: '/(tabs)' },
        } as any,
        trigger: {
          hour: 9,
          minute: 30,
          repeats: true,
        } as any,
      });
    }
  } catch (err) {
    console.warn('[notifications] Reschedule error:', err);
  }
}

// ─── In-App Notifications Storage ────────────────────────────────────────────

const IN_APP_STORAGE_KEY = '@dearday/in_app_notifications';

export async function getInAppNotifications(): Promise<InAppNotification[]> {
  try {
    const raw = await AsyncStorage.getItem(IN_APP_STORAGE_KEY);
    if (!raw) {
      // Seed initial welcoming notifications if empty
      const initial: InAppNotification[] = [
        {
          id: 'init-1',
          type: 'system',
          title: 'Welcome to Dear Day',
          body: 'Your safe harbor for everyday moments. Every night at 9:00 PM, pause to choose 4 memories.',
          createdAt: new Date().toISOString(),
          read: false,
          actionRoute: '/(tabs)',
          actionLabel: 'Open Journal',
        },
      ];
      await AsyncStorage.setItem(IN_APP_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function saveInAppNotification(notif: InAppNotification): Promise<void> {
  try {
    const existing = await getInAppNotifications();
    const updated = [notif, ...existing.filter(n => n.id !== notif.id)].slice(0, 50); // keep up to 50
    await AsyncStorage.setItem(IN_APP_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('[notifications] Failed to save in-app notification:', e);
  }
}

export async function markNotificationAsRead(id: string): Promise<void> {
  try {
    const existing = await getInAppNotifications();
    const updated = existing.map(n => (n.id === id ? { ...n, read: true } : n));
    await AsyncStorage.setItem(IN_APP_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('[notifications] Failed to mark as read:', e);
  }
}

export async function markAllNotificationsAsRead(): Promise<void> {
  try {
    const existing = await getInAppNotifications();
    const updated = existing.map(n => ({ ...n, read: true }));
    await AsyncStorage.setItem(IN_APP_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('[notifications] Failed to mark all as read:', e);
  }
}

export async function deleteInAppNotification(id: string): Promise<void> {
  try {
    const existing = await getInAppNotifications();
    const updated = existing.filter(n => n.id !== id);
    await AsyncStorage.setItem(IN_APP_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('[notifications] Failed to delete notification:', e);
  }
}

export async function clearAllInAppNotifications(): Promise<void> {
  try {
    await AsyncStorage.removeItem(IN_APP_STORAGE_KEY);
  } catch {}
}

export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const list = await getInAppNotifications();
    return list.filter(n => !n.read).length;
  } catch {
    return 0;
  }
}

// ─── Scenario Tester / Auditing Triggers ──────────────────────────────────────

export const NOTIFICATION_SCENARIOS = {
  nightly: {
    type: 'nightly' as NotificationType,
    title: 'Tonight in 4 moments',
    body: 'Take a breath. What four moments deserved to be remembered today?',
    actionRoute: '/(tabs)',
    actionLabel: 'Log Moments',
  },
  onThisDay: {
    type: 'onThisDay' as NotificationType,
    title: 'On This Day — 1 Year Ago',
    body: '“Walked through the misty park with hot cider.” A memory from October 2025 is waiting for you.',
    actionRoute: '/(tabs)',
    actionLabel: 'View Capsule',
  },
  bookReady: {
    type: 'bookReady' as NotificationType,
    title: 'Your Monthly Book is Ready',
    body: 'October 2026 is bound! Your memories have been arranged into an archival digital volume.',
    actionRoute: '/(tabs)/library',
    actionLabel: 'Open Library',
  },
  orderUpdates: {
    type: 'orderUpdates' as NotificationType,
    title: 'Order Shipped! 📦',
    body: 'Your hardcover Dear Day book #DD-8492 is printed, boxed, and on its way to your doorstep.',
    actionRoute: '/order-flow',
    actionLabel: 'Track Delivery',
  },
};

/**
 * Trigger an immediate test scenario.
 * 1. Fires a device push notification banner with sound.
 * 2. Saves an unread entry into the In-App Notification Center.
 */
export async function triggerNotificationScenario(
  scenarioKey: keyof typeof NOTIFICATION_SCENARIOS,
): Promise<InAppNotification> {
  const scenario = NOTIFICATION_SCENARIOS[scenarioKey];
  const notifId = `test-${scenarioKey}-${Date.now()}`;

  const inAppNotif: InAppNotification = {
    id: notifId,
    type: scenario.type,
    title: scenario.title,
    body: scenario.body,
    createdAt: new Date().toISOString(),
    read: false,
    actionRoute: scenario.actionRoute,
    actionLabel: scenario.actionLabel,
  };

  // 1. Save to in-app notification center (always happens, regardless of push permissions)
  await saveInAppNotification(inAppNotif);

  // 2. Fire native device notification if permitted
  if (Platform.OS !== 'web') {
    try {
      await setupNotificationChannels();
      await Notifications.scheduleNotificationAsync({
        content: {
          title: scenario.title,
          body: scenario.body,
          sound: 'default',
          channelId: scenario.type === 'orderUpdates' || scenario.type === 'bookReady' ? 'dearday_orders' : 'dearday_reminders',
          data: { actionRoute: scenario.actionRoute },
        } as any,
        trigger: null, // trigger immediately
      });
    } catch (err) {
      console.warn('[notifications] Could not fire local test notification banner:', err);
    }
  }

  return inAppNotif;
}
