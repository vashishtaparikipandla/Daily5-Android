import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Platform, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Moon,
  Hourglass,
  BookOpen,
  Package,
  Bell,
  BellSlash,
  X,
} from 'phosphor-react-native';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProtectedScreen } from '@/components/ProtectedScreen';
import {
  InAppNotification,
  getInAppNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteInAppNotification,
  triggerNotificationScenario,
} from '@/lib/notifications';
import * as Haptics from 'expo-haptics';

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffH = Math.floor(diffMins / 60);
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    if (diffD === 1) return 'Yesterday';
    if (diffD < 7) return `${diffD}d ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function renderIconForType(type: InAppNotification['type'], color: string) {
  switch (type) {
    case 'nightly':
      return <Moon size={18} color={color} weight="fill" />;
    case 'onThisDay':
      return <Hourglass size={18} color={color} weight="fill" />;
    case 'bookReady':
      return <BookOpen size={18} color={color} weight="fill" />;
    case 'orderUpdates':
      return <Package size={18} color={color} weight="fill" />;
    case 'system':
    default:
      return <Bell size={18} color={color} weight="fill" />;
  }
}

function getIconColor(type: InAppNotification['type']): string {
  switch (type) {
    case 'nightly':
      return '#E8593A';
    case 'onThisDay':
      return '#C47B3A';
    case 'bookReady':
      return '#2E7D32';
    case 'orderUpdates':
      return '#1976D2';
    case 'system':
    default:
      return '#7C3AED';
  }
}

function NotificationsContent() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);

  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const items = await getInAppNotifications();
    setNotifications(items);
    setLoading(false);
  }

  async function handleMarkAllRead() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await markAllNotificationsAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  async function handlePressNotification(item: InAppNotification) {
    Haptics.selectionAsync();
    if (!item.read) {
      await markNotificationAsRead(item.id);
      setNotifications(prev => prev.map(n => (n.id === item.id ? { ...n, read: true } : n)));
    }
    if (item.actionRoute) {
      router.push(item.actionRoute as any);
    }
  }

  async function handleDelete(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await deleteInAppNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  }

  async function handleSendSample() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newNotif = await triggerNotificationScenario('nightly');
    setNotifications(prev => [newNotif, ...prev]);
  }

  const unreadCount = notifications.filter(n => !n.read).length;
  const filtered = filter === 'unread' ? notifications.filter(n => !n.read) : notifications;

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topPad }]}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={22} color={colors.foreground} weight="bold" />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
          Notifications
        </Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={[styles.markReadText, { color: colors.primary }]}>Mark read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 64 }} />
        )}
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'all' && [styles.filterTabActive, { borderColor: colors.primary }],
          ]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[
              styles.filterText,
              { color: filter === 'all' ? colors.foreground : colors.tertiary },
              filter === 'all' && styles.filterTextActive,
            ]}
          >
            All ({notifications.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'unread' && [styles.filterTabActive, { borderColor: colors.primary }],
          ]}
          onPress={() => setFilter('unread')}
        >
          <Text
            style={[
              styles.filterText,
              { color: filter === 'unread' ? colors.foreground : colors.tertiary },
              filter === 'unread' && styles.filterTextActive,
            ]}
          >
            Unread {unreadCount > 0 ? `(${unreadCount})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIconCircle, { backgroundColor: colors.accentLight }]}>
            <BellSlash size={32} color={colors.tertiary} weight="regular" />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
          </Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            {filter === 'unread'
              ? 'You have read all your notifications.'
              : 'Reminders and journal updates will appear here, even without push notifications.'}
          </Text>
          <TouchableOpacity
            style={[styles.sampleBtn, { backgroundColor: colors.primary }]}
            onPress={handleSendSample}
          >
            <Text style={[styles.sampleBtnText, { color: colors.primaryForeground }]}>
              Trigger Test Notification
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const iconColor = getIconColor(item.type);
            return (
              <TouchableOpacity
                style={[
                  styles.card,
                  {
                    backgroundColor: item.read ? colors.card : colors.accentLight,
                    borderColor: item.read ? colors.border : colors.primary,
                  },
                ]}
                activeOpacity={0.7}
                onPress={() => handlePressNotification(item)}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconWrap, { backgroundColor: `${iconColor}18` }]}>
                    {renderIconForType(item.type, iconColor)}
                  </View>
                  <View style={styles.titleWrap}>
                    <View style={styles.titleRow}>
                      <Text
                        style={[
                          styles.cardTitle,
                          {
                            color: colors.foreground,
                            fontFamily: item.read ? 'Inter_500Medium' : 'Inter_600SemiBold',
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      {!item.read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
                    </View>
                    <Text style={[styles.cardTime, { color: colors.tertiary }]}>
                      {formatTimestamp(item.createdAt)}
                    </Text>
                  </View>

                  <TouchableOpacity
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={() => handleDelete(item.id)}
                  >
                    <X size={15} color={colors.tertiary} weight="bold" />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.cardBody, { color: colors.mutedForeground }]}>{item.body}</Text>

                {item.actionLabel && (
                  <View style={styles.actionRow}>
                    <Text style={[styles.actionBtnText, { color: colors.primary }]}>
                      {item.actionLabel} →
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
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
  markReadText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterTab: {
    paddingVertical: 12,
    marginRight: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterTabActive: {},
  filterText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  filterTextActive: { fontFamily: 'Inter_600SemiBold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, gap: 12 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle: { fontSize: 15, flexShrink: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  cardTime: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  cardBody: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  actionRow: { marginTop: 4 },
  actionBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  emptySub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  sampleBtn: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  sampleBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
