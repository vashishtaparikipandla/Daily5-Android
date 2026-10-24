import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Switch, TouchableOpacity,
  Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProtectedScreen } from '@/components/ProtectedScreen';
import {
  NotificationPrefs,
  loadNotificationPrefs,
  saveNotificationPrefs,
  requestNotificationPermission,
  triggerNotificationScenario,
  getUnreadNotificationCount,
} from '@/lib/notifications';
import * as Haptics from 'expo-haptics';

function NotificationsContent() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);

  const [prefs, setPrefs] = useState<NotificationPrefs>({
    nightly: true,
    onThisDay: true,
    bookReady: true,
    orderUpdates: true,
  });
  const [loading, setLoading] = useState(true);
  const [testingType, setTestingType] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    (async () => {
      const p = await loadNotificationPrefs();
      setPrefs(p);
      const count = await getUnreadNotificationCount();
      setUnreadCount(count);
      setLoading(false);
    })();
  }, []);

  async function handleToggle(key: keyof NotificationPrefs, value: boolean) {
    Haptics.selectionAsync();
    if (value && Platform.OS !== 'web') {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Notifications disabled',
          'Please enable notifications in your system settings to receive reminders.',
        );
      }
    }
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    await saveNotificationPrefs(updated);
  }

  async function handleTestScenario(
    type: 'nightly' | 'onThisDay' | 'bookReady' | 'orderUpdates',
    label: string,
  ) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTestingType(type);
    try {
      const notif = await triggerNotificationScenario(type);
      setTestingType(null);
      const count = await getUnreadNotificationCount();
      setUnreadCount(count);
      Alert.alert(
        '🔔 Scenario Triggered',
        `"${label}" was fired!\n\nA push notification was sent to your device and logged to your In-App Notification Center.`,
        [
          { text: 'View In-App', onPress: () => router.push('/notifications') },
          { text: 'OK', style: 'cancel' },
        ],
      );
    } catch (e) {
      setTestingType(null);
      Alert.alert('Test Failed', 'Could not fire scenario notification.');
    }
  }

  const items: {
    key: keyof NotificationPrefs;
    label: string;
    sub: string;
    icon: keyof typeof Ionicons.glyphMap;
  }[] = [
    {
      key: 'nightly',
      label: 'Nightly reminder',
      sub: "Reminds you to log tonight's 4 memories at 9:00 PM",
      icon: 'moon-outline',
    },
    {
      key: 'onThisDay',
      label: 'On This Day',
      sub: 'A gentle morning capsule when you have memories from previous years',
      icon: 'hourglass-outline',
    },
    {
      key: 'bookReady',
      label: 'Monthly book ready',
      sub: 'Notifies you when a 30-day month completes and is ready for binding',
      icon: 'book-outline',
    },
    {
      key: 'orderUpdates',
      label: 'Order & shipping updates',
      sub: 'Tracking and delivery updates for printed physical hardcover books',
      icon: 'cube-outline',
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topPad }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
          Notifications
        </Text>
        <TouchableOpacity
          style={styles.bellBadge}
          onPress={() => router.push('/notifications')}
        >
          <Ionicons name="mail-outline" size={22} color={colors.foreground} />
          {unreadCount > 0 && (
            <View style={[styles.badgeDot, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* In-App Center Shortcut */}
        <TouchableOpacity
          style={[styles.inAppBanner, { backgroundColor: colors.accentLight, borderColor: colors.border }]}
          onPress={() => router.push('/notifications')}
          activeOpacity={0.8}
        >
          <View style={[styles.inAppIconCircle, { backgroundColor: colors.primary }]}>
            <Ionicons name="notifications" size={20} color={colors.primaryForeground} />
          </View>
          <View style={styles.inAppTextWrap}>
            <Text style={[styles.inAppTitle, { color: colors.foreground }]}>In-App Notification Center</Text>
            <Text style={[styles.inAppSub, { color: colors.mutedForeground }]}>
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'View all system updates and logs'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.tertiary} />
        </TouchableOpacity>

        {/* Channels & Preferences */}
        <Text style={[styles.sectionHeading, { color: colors.tertiary }]}>Notification Preferences</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {loading ? (
            <ActivityIndicator style={{ padding: 24 }} size="small" color={colors.primary} />
          ) : (
            items.map((item, i) => (
              <View
                key={item.key}
                style={[
                  styles.row,
                  i < items.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                ]}
              >
                <Ionicons name={item.icon} size={22} color={colors.mutedForeground} style={{ marginRight: 4 }} />
                <View style={styles.rowText}>
                  <Text style={[styles.rowLabel, { color: colors.foreground }]}>{item.label}</Text>
                  <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{item.sub}</Text>
                </View>
                <Switch
                  value={prefs[item.key]}
                  onValueChange={v => handleToggle(item.key, v)}
                  thumbColor={prefs[item.key] ? colors.primaryForeground : colors.tertiary}
                  trackColor={{ true: colors.primary, false: colors.border }}
                />
              </View>
            ))
          )}
        </View>

        {/* Audit & Dummy Scenarios */}
        <Text style={[styles.sectionHeading, { color: colors.tertiary }]}>Audit & Test Scenarios</Text>
        <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
          Test each scenario immediately to verify sound, vibration, device banners, and in-app logging.
        </Text>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.testRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
            onPress={() => handleTestScenario('nightly', 'Nightly 9:00 PM Reminder')}
            disabled={testingType !== null}
          >
            <View style={[styles.testIconWrap, { backgroundColor: '#E8593A18' }]}>
              <Ionicons name="moon" size={18} color="#E8593A" />
            </View>
            <View style={styles.testMeta}>
              <Text style={[styles.testLabel, { color: colors.foreground }]}>Nightly 9:00 PM Reminder</Text>
              <Text style={[styles.testSub, { color: colors.mutedForeground }]}>"Tonight in 4 moments"</Text>
            </View>
            {testingType === 'nightly' ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <View style={[styles.triggerPill, { backgroundColor: colors.accentLight }]}>
                <Text style={[styles.triggerPillText, { color: colors.primary }]}>Fire Test</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
            onPress={() => handleTestScenario('onThisDay', 'On This Day Capsule')}
            disabled={testingType !== null}
          >
            <View style={[styles.testIconWrap, { backgroundColor: '#C47B3A18' }]}>
              <Ionicons name="hourglass-outline" size={18} color="#C47B3A" />
            </View>
            <View style={styles.testMeta}>
              <Text style={[styles.testLabel, { color: colors.foreground }]}>On This Day Morning Capsule</Text>
              <Text style={[styles.testSub, { color: colors.mutedForeground }]}>"A memory from October 2025"</Text>
            </View>
            {testingType === 'onThisDay' ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <View style={[styles.triggerPill, { backgroundColor: colors.accentLight }]}>
                <Text style={[styles.triggerPillText, { color: colors.primary }]}>Fire Test</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
            onPress={() => handleTestScenario('bookReady', 'Monthly Book Bound Alert')}
            disabled={testingType !== null}
          >
            <View style={[styles.testIconWrap, { backgroundColor: '#2E7D3218' }]}>
              <Ionicons name="book-outline" size={18} color="#2E7D32" />
            </View>
            <View style={styles.testMeta}>
              <Text style={[styles.testLabel, { color: colors.foreground }]}>Monthly Book Ready</Text>
              <Text style={[styles.testSub, { color: colors.mutedForeground }]}>"October 2026 is bound!"</Text>
            </View>
            {testingType === 'bookReady' ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <View style={[styles.triggerPill, { backgroundColor: colors.accentLight }]}>
                <Text style={[styles.triggerPillText, { color: colors.primary }]}>Fire Test</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testRow}
            onPress={() => handleTestScenario('orderUpdates', 'Order Shipped Alert')}
            disabled={testingType !== null}
          >
            <View style={[styles.testIconWrap, { backgroundColor: '#1976D218' }]}>
              <Ionicons name="cube-outline" size={18} color="#1976D2" />
            </View>
            <View style={styles.testMeta}>
              <Text style={[styles.testLabel, { color: colors.foreground }]}>Order Shipped & In Transit</Text>
              <Text style={[styles.testSub, { color: colors.mutedForeground }]}>"Book #DD-8492 is on its way"</Text>
            </View>
            {testingType === 'orderUpdates' ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <View style={[styles.triggerPill, { backgroundColor: colors.accentLight }]}>
                <Text style={[styles.triggerPillText, { color: colors.primary }]}>Fire Test</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

export default function NotificationsScreen() {
  return (
    <ProtectedScreen>
      <NotificationsContent />
    </ProtectedScreen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 18 },
  bellBadge: { position: 'relative', padding: 4 },
  badgeDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { fontSize: 10, color: '#fff', fontFamily: 'Inter_600SemiBold' },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  inAppBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  inAppIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inAppTextWrap: { flex: 1, gap: 2 },
  inAppTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  inAppSub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  sectionHeading: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 8,
  },
  sectionSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
    marginTop: -8,
  },
  card: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  rowSub: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 16 },
  testRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  testIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testMeta: { flex: 1, gap: 2 },
  testLabel: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  testSub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  triggerPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  triggerPillText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
});
