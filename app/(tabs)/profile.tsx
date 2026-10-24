import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert,
  Share, Image, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import {
  User,
  Bell,
  Palette,
  ShieldCheck,
  Package,
  ShareNetwork,
  Question,
  SignOut,
  CaretRight,
  CloudArrowUp,
  Clock,
  Database,
  GoogleLogo,
  ArrowsClockwise,
} from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/contexts/AppContext';
import { useDiary } from '@/contexts/DiaryContext';
import { useDriveBackup } from '@/contexts/DriveBackupContext';

interface SectionItem {
  icon: (color: string) => React.ReactNode;
  label: string;
  route?: string;
  onPress?: () => void;
  destructive?: boolean;
}

interface Section {
  title?: string;
  items: SectionItem[];
}

function formatBackupDate(d: Date | null): string {
  if (!d) return 'Never';
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffH = Math.floor(diffMins / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return 'Yesterday';
  if (diffD < 7) return `${diffD} days ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ProfileTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, signOut, driveConnected, driveAccount } = useApp();
  const { books, totalDays, totalMoments, streakCount } = useDiary();
  const { driveWorking, lastDriveBackupTime, backupToDrive, refreshDriveBackupTime } = useDriveBackup();

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const botPad = insets.bottom + 90;

  const lockedBooks = books.filter(b => b.locked).length;

  const payloadSize = useMemo(() => {
    const kb = Math.max(14, Math.round(JSON.stringify(books).length / 1024));
    return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
  }, [books]);

  async function handleDriveBackupNow() {
    Haptics.selectionAsync();
    if (!driveConnected) {
      router.push('/profile/privacy');
      return;
    }
    const ok = await backupToDrive();
    if (ok) {
      await refreshDriveBackupTime();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Backup Complete ✨', 'Your latest memories and photobooks are safely archived in your Google Drive.');
    } else {
      Alert.alert('Backup Failed', 'Could not upload to Google Drive. Please verify your connection.');
    }
  }

  async function handleShareApp() {
    try {
      const shareUrl = Platform.select({
        ios: 'https://apps.apple.com/app/dear-day/id123456789',
        default: 'https://play.google.com/store/apps/details?id=app.daily5.android',
      });
      await Share.share({
        title: 'Dear Day — Diary in 4 Moments',
        message: `I'm capturing my everyday life in 4 moments every night on Dear Day. Create your own monthly memory books:\n${shareUrl}`,
      });
    } catch {}
  }

  async function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: async () => { await signOut(); router.replace('/auth'); } },
    ]);
  }

  const sections: Section[] = [
    {
      title: 'Account',
      items: [
        {
          icon: color => <User size={19} color={color} weight="regular" />,
          label: 'Edit Profile',
          route: '/profile/edit',
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: color => <Bell size={19} color={color} weight="regular" />,
          label: 'Notifications',
          route: '/profile/notifications',
        },
        {
          icon: color => <Palette size={19} color={color} weight="regular" />,
          label: 'Appearance',
          route: '/profile/appearance',
        },
      ],
    },
    {
      title: 'Data & Privacy',
      items: [
        {
          icon: color => <ShieldCheck size={19} color={color} weight="regular" />,
          label: 'Data & Cloud Backup Settings',
          route: '/profile/privacy',
        },
        {
          icon: color => <Package size={19} color={color} weight="regular" />,
          label: 'Print Orders',
          route: '/profile/orders',
        },
      ],
    },
    {
      title: 'Support & Community',
      items: [
        {
          icon: color => <ShareNetwork size={19} color={color} weight="regular" />,
          label: 'Share Dear Day with Friends',
          onPress: handleShareApp,
        },
        {
          icon: color => <Question size={19} color={color} weight="regular" />,
          label: 'Help & About',
          route: '/profile/help',
        },
      ],
    },
    {
      items: [
        {
          icon: color => <SignOut size={19} color={color} weight="bold" />,
          label: 'Sign Out',
          onPress: handleSignOut,
          destructive: true,
        },
      ],
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar + name */}
        <View style={styles.avatarBlock}>
          <TouchableOpacity
            style={[styles.avatar, { backgroundColor: colors.primary, overflow: 'hidden' }]}
            onPress={() => router.push('/profile/edit')}
            activeOpacity={0.8}
          >
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
            ) : (
              <Text style={[styles.avatarLetter, { color: colors.primaryForeground }]}>
                {(user?.name ?? 'U')[0].toUpperCase()}
              </Text>
            )}
          </TouchableOpacity>
          <Text style={[styles.name, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
            {user?.name ?? 'You'}
          </Text>
          <Text style={[styles.email, { color: colors.mutedForeground }]}>{user?.email}</Text>
        </View>

        {/* Stats Row */}
        <View style={[styles.statsRow, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}>
          {[
            { value: streakCount, label: 'Day Streak' },
            { value: totalDays, label: 'Days' },
            { value: lockedBooks, label: 'Books' },
            { value: totalMoments, label: 'Moments' },
          ].map(s => (
            <View key={s.label} style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
                {s.value}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* WhatsApp-Style Cloud Backup Status Card */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.tertiary }]}>Cloud Backup & Sync</Text>
          <View style={[styles.backupCard, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}>
            <View style={styles.backupCardHeader}>
              <View style={[styles.backupIconCircle, { backgroundColor: colors.accentLight }]}>
                <CloudArrowUp size={22} color={colors.primary} weight="duotone" />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.backupCardTitle, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
                  {driveConnected ? 'Google Drive Backup' : 'Cloud Backup Disconnected'}
                </Text>
                <Text style={[styles.backupCardSubtitle, { color: colors.mutedForeground }]}>
                  {driveConnected
                    ? 'Encrypted copies of your books & memories survive app reinstallation.'
                    : 'Connect your Google Drive to keep your memories safe.'}
                </Text>
              </View>
            </View>

            {/* WhatsApp-Style Details Box */}
            <View style={[styles.backupMetaBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <View style={styles.backupMetaRow}>
                <Clock size={14} color={colors.tertiary} />
                <Text style={[styles.backupMetaLabel, { color: colors.mutedForeground }]}>Last Backup:</Text>
                <Text style={[styles.backupMetaVal, { color: colors.foreground }]}>
                  {formatBackupDate(lastDriveBackupTime)}
                </Text>
              </View>

              <View style={styles.backupMetaRow}>
                <Database size={14} color={colors.tertiary} />
                <Text style={[styles.backupMetaLabel, { color: colors.mutedForeground }]}>Size:</Text>
                <Text style={[styles.backupMetaVal, { color: colors.foreground }]}>
                  {lastDriveBackupTime ? payloadSize : '—'}
                </Text>
              </View>

              <View style={styles.backupMetaRow}>
                <GoogleLogo size={14} color={colors.tertiary} />
                <Text style={[styles.backupMetaLabel, { color: colors.mutedForeground }]}>Account:</Text>
                <Text style={[styles.backupMetaVal, { color: colors.foreground }]} numberOfLines={1}>
                  {driveAccount || user?.email || 'Not connected'}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.backupBtnRow}>
              <TouchableOpacity
                style={[
                  styles.backupPrimaryBtn,
                  {
                    backgroundColor: colors.primary,
                    opacity: driveWorking ? 0.6 : 1,
                  },
                ]}
                onPress={handleDriveBackupNow}
                disabled={driveWorking}
                activeOpacity={0.85}
              >
                {driveWorking ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <ArrowsClockwise size={16} color="#FFFFFF" weight="bold" />
                )}
                <Text style={styles.backupPrimaryBtnText}>
                  {driveWorking ? 'Backing Up...' : 'Back Up Now'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.backupSettingsBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                onPress={() => router.push('/profile/privacy')}
                activeOpacity={0.8}
              >
                <Text style={[styles.backupSettingsBtnText, { color: colors.foreground }]}>
                  Settings →
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Sections */}
        {sections.map((section, si) => (
          <View key={si} style={styles.section}>
            {section.title && (
              <Text style={[styles.sectionTitle, { color: colors.tertiary }]}>{section.title}</Text>
            )}
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}>
              {section.items.map((item, ii) => {
                const iconColor = item.destructive ? colors.destructive : colors.mutedForeground;
                return (
                  <TouchableOpacity
                    key={item.label}
                    style={[
                      styles.sectionItem,
                      ii < section.items.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                    ]}
                    onPress={item.onPress ?? (() => item.route && router.push(item.route as any))}
                    activeOpacity={0.75}
                  >
                    {item.icon(iconColor)}
                    <Text style={[styles.itemLabel, { color: item.destructive ? colors.destructive : colors.foreground }]}>
                      {item.label}
                    </Text>
                    {!item.onPress && <CaretRight size={15} color={colors.tertiary} weight="bold" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },
  avatarBlock: { alignItems: 'center', gap: 6, paddingVertical: 4 },
  avatar: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: '100%', height: '100%', borderRadius: 20 },
  avatarLetter: { fontSize: 30, fontFamily: 'PlayfairDisplay_700Bold' },
  name: { fontSize: 22, letterSpacing: 0.2 },
  email: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  statsRow: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 22 },
  statLabel: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  section: { gap: 6 },
  sectionTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8, textTransform: 'uppercase', paddingLeft: 4 },
  sectionCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  sectionItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  itemLabel: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium' },

  /* WhatsApp-style Backup Status Card */
  backupCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  backupCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backupIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backupCardTitle: {
    fontSize: 16,
    letterSpacing: -0.2,
  },
  backupCardSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 17,
  },
  backupMetaBox: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  backupMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backupMetaLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    width: 80,
  },
  backupMetaVal: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  backupBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  backupPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 10,
  },
  backupPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  backupSettingsBtn: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backupSettingsBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
});
