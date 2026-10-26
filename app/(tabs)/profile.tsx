import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert,
  Share, Image,
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
} from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/contexts/AppContext';
import { useDiary } from '@/contexts/DiaryContext';
import { StreakCalendarModal } from '@/components/StreakCalendarModal';
import { BrandLogoIcon } from '@/components/BrandLogo';
import { getHonorificTitle, computeMilestoneStats, ARCHIVAL_STAMPS } from '@/lib/milestones';
import { ArchivalStamp } from '@/components/ArchivalStamp';

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

export default function ProfileTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useApp();
  const { books, totalDays, totalMoments, streakCount } = useDiary();
  const [showStreakModal, setShowStreakModal] = useState(false);

  const honorific = getHonorificTitle(streakCount);
  const milestoneStats = React.useMemo(() => computeMilestoneStats(books, streakCount), [books, streakCount]);
  const unlockedStampsCount = ARCHIVAL_STAMPS.filter(s => s.isUnlocked(milestoneStats)).length;

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const botPad = insets.bottom + 90;

  const lockedBooks = books.filter(b => b.locked).length;

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
        {/* Official Brand Badge */}
        <View style={styles.brandBadge}>
          <BrandLogoIcon size={22} color={colors.primary} />
          <Text style={[styles.brandBadgeText, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
            Dear Day
          </Text>
        </View>

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

          {/* Archival Honorific Rank Badge */}
          <View style={[styles.honorificPill, { backgroundColor: colors.accentLight, borderColor: colors.primary + '35' }]}>
            <Text style={styles.honorificBadge}>{honorific.badge}</Text>
            <Text style={[styles.honorificTitle, { color: colors.primary }]}>{honorific.title}</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={[styles.statsRow, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}>
          {[
            { value: streakCount, label: 'Day Streak', isStreak: true },
            { value: totalDays, label: 'Days' },
            { value: lockedBooks, label: 'Books' },
            { value: totalMoments, label: 'Moments' },
          ].map(s => {
            const content = (
              <>
                <Text style={[styles.statValue, { color: s.isStreak ? colors.primary : colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
                  {s.value}
                </Text>
                <Text style={[styles.statLabel, { color: s.isStreak ? colors.primary : colors.mutedForeground }]}>
                  {s.label}{s.isStreak ? ' ↗' : ''}
                </Text>
              </>
            );

            if (s.isStreak) {
              return (
                <TouchableOpacity
                  key={s.label}
                  style={styles.stat}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setShowStreakModal(true);
                  }}
                  activeOpacity={0.7}
                >
                  {content}
                </TouchableOpacity>
              );
            }

            return (
              <View key={s.label} style={styles.stat}>
                {content}
              </View>
            );
          })}
        </View>

        {/* Archival Passport & Milestone Stamps Album */}
        <View style={styles.section}>
          <View style={styles.passportHeaderRow}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold', fontSize: 16 }]}>
                Archival Passport & Stamps
              </Text>
              <Text style={[styles.passportSubtitle, { color: colors.mutedForeground }]}>
                {unlockedStampsCount} of {ARCHIVAL_STAMPS.length} collected · Tap stamp to inspect
              </Text>
            </View>
            <View style={[styles.passportRankChip, { backgroundColor: colors.accentLight }]}>
              <Text style={[styles.passportRankChipText, { color: colors.primary }]}>
                {honorific.title}
              </Text>
            </View>
          </View>

          <View style={[styles.stampAlbumCard, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stampScroll}>
              {ARCHIVAL_STAMPS.map(stamp => (
                <ArchivalStamp
                  key={stamp.id}
                  stamp={stamp}
                  isUnlocked={stamp.isUnlocked(milestoneStats)}
                  size="compact"
                />
              ))}
            </ScrollView>
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

      <StreakCalendarModal
        visible={showStreakModal}
        onClose={() => setShowStreakModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 8,
  },
  brandBadgeText: {
    fontSize: 16,
    letterSpacing: 0.3,
  },
  avatarBlock: { alignItems: 'center', gap: 6, paddingVertical: 4 },
  avatar: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: '100%', height: '100%', borderRadius: 20 },
  avatarLetter: { fontSize: 30, fontFamily: 'PlayfairDisplay_700Bold' },
  name: { fontSize: 22, letterSpacing: 0.2 },
  email: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  honorificPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
    marginTop: 2,
  },
  honorificBadge: {
    fontSize: 12,
  },
  honorificTitle: {
    fontSize: 12,
    fontFamily: 'PlayfairDisplay_700Bold',
    letterSpacing: 0.2,
  },
  statsRow: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 22 },
  statLabel: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  passportHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  passportSubtitle: {
    fontSize: 11.5,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
  passportRankChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  passportRankChipText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
  stampAlbumCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  stampScroll: {
    paddingHorizontal: 4,
    gap: 8,
    alignItems: 'center',
  },
  section: { gap: 6 },
  sectionTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8, textTransform: 'uppercase', paddingLeft: 4 },
  sectionCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  sectionItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  itemLabel: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium' },
});
