import React, { useState, useMemo } from 'react';
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
  Fire,
  Sparkle,
  Check,
  FilmStrip,
} from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/contexts/AppContext';
import { useDiary } from '@/contexts/DiaryContext';
import { StreakCalendarModal } from '@/components/StreakCalendarModal';
import { WeeklyReelModal } from '@/components/WeeklyReelModal';
import { BrandLogoIcon } from '@/components/BrandLogo';
import { getHonorificTitle, computeMilestoneStats, ARCHIVAL_STAMPS } from '@/lib/milestones';
import { ArchivalStamp } from '@/components/ArchivalStamp';
import { todayStr, type DayLog } from '@/lib/data';

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
  const { books, totalDays, totalMoments, streakCount, getDayLog } = useDiary();
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showWeeklyReel, setShowWeeklyReel] = useState(false);

  const today = todayStr();
  const honorific = getHonorificTitle(streakCount);
  const milestoneStats = React.useMemo(() => computeMilestoneStats(books, streakCount), [books, streakCount]);
  const unlockedStampsCount = ARCHIVAL_STAMPS.filter(s => s.isUnlocked(milestoneStats)).length;

  // Compute Monday–Sunday for current week
  const weekDays = useMemo(() => {
    const now = new Date(today + 'T12:00:00');
    const dayIndex = now.getDay();
    const diffToMonday = (dayIndex + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);

    const days = [];
    const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const log = getDayLog(dateStr);
      const hasEntry = (log?.entries.length ?? 0) > 0;
      const isToday = dateStr === today;
      const isFuture = dateStr > today;
      const dayNum = d.getDate();

      days.push({
        dateStr,
        label: dayLabels[i],
        dayNum,
        hasEntry,
        isToday,
        isFuture,
      });
    }
    return days;
  }, [today, getDayLog]);

  const weeklyDaysLogs = useMemo(() => {
    return weekDays.map(w => getDayLog(w.dateStr)).filter(Boolean) as DayLog[];
  }, [weekDays, getDayLog]);
  const hasWeeklyMoments = weeklyDaysLogs.some(d => d.entries.length > 0);

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
      {/* Header matching Library, Discover, Search */}
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
          Profile
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: 16, paddingBottom: botPad }]}
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

        {/* 7-Day Habit Tracker Card (Relocated from Home) */}
        <View style={[styles.streakCard, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}>
          <TouchableOpacity
            style={styles.streakHeaderRow}
            onPress={() => {
              Haptics.selectionAsync();
              setShowStreakModal(true);
            }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="View Archival Journey and Habit Calendar"
          >
            <View style={styles.streakTitleGroup}>
              <View style={[styles.streakFlameCircle, { backgroundColor: colors.accentLight }]}>
                <Fire size={20} color={colors.primary} weight="fill" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.streakTitle, { color: colors.foreground }]}>
                  {streakCount > 0 ? `${streakCount}-Day Streak · ${honorific.title}` : 'Start Your Streak'}
                </Text>
                <Text style={[styles.streakSubtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {streakCount > 0
                    ? `${streakCount} day${streakCount === 1 ? '' : 's'} recorded in a row`
                    : 'Capture 4 moments today to start'}
                </Text>
              </View>
            </View>

            <View style={[styles.streakMilestoneBadge, { backgroundColor: colors.accentLight, borderColor: colors.border }]}>
              <Sparkle size={11} color={colors.primary} weight="fill" />
              <Text style={[styles.streakMilestoneText, { color: colors.primary }]}>
                {weekDays.filter(d => d.hasEntry).length}/7 DAYS
              </Text>
            </View>
          </TouchableOpacity>

          {/* 7 Day Pills Ribbon */}
          <View style={styles.weekRibbon}>
            {weekDays.map(item => (
              <View key={item.dateStr} style={styles.weekDayCol}>
                <Text
                  style={[
                    styles.weekDayLabel,
                    { color: item.isToday ? colors.primary : colors.tertiary },
                    item.isToday && { fontFamily: 'Inter_700Bold' },
                  ]}
                >
                  {item.label}
                </Text>
                <Text
                  style={[
                    styles.weekDayDateNum,
                    { color: item.isToday ? colors.primary : colors.mutedForeground },
                    item.isToday && { fontFamily: 'Inter_700Bold' },
                  ]}
                >
                  {item.dayNum}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.weekDayCircle,
                    { borderColor: colors.border, backgroundColor: colors.muted },
                    item.hasEntry && { backgroundColor: colors.primary, borderColor: colors.primary },
                    item.isFuture && { opacity: 0.35 },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setShowStreakModal(true);
                  }}
                  disabled={item.isFuture}
                  activeOpacity={0.7}
                  accessibilityLabel={`${item.label} ${item.dayNum}: ${item.hasEntry ? 'completed' : 'not recorded'}`}
                >
                  {item.hasEntry ? (
                    <Check size={14} color="#FFFFFF" weight="bold" />
                  ) : item.isToday ? (
                    <View style={[styles.pendingTodayDot, { backgroundColor: colors.primary }]} />
                  ) : null}
                </TouchableOpacity>

                <View style={styles.indicatorContainer}>
                  {item.isToday && (
                    <View style={[styles.todayDot, { backgroundColor: colors.primary }]} />
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* Sunday Edition / Weekly Story Reel Trigger */}
          {hasWeeklyMoments && (
            <TouchableOpacity
              style={[styles.weeklyReelBanner, { borderTopColor: colors.border }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowWeeklyReel(true);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.weeklyReelLeft}>
                <View style={[styles.reelIconCircle, { backgroundColor: colors.accentLight }]}>
                  <FilmStrip size={15} color={colors.primary} weight="bold" />
                </View>
                <View>
                  <Text style={[styles.weeklyReelTitle, { color: colors.foreground }]}>
                    The Sunday Edition · 7-Day Reel
                  </Text>
                  <Text style={[styles.weeklyReelSubtitle, { color: colors.mutedForeground }]}>
                    Relive this week's moments in a visual story
                  </Text>
                </View>
              </View>
              <CaretRight size={16} color={colors.primary} weight="bold" />
            </TouchableOpacity>
          )}
        </View>

        {/* Passport & Milestone Stamps Album */}
        <View style={styles.section}>
          <View style={styles.passportHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.tertiary }]}>
              PASSPORT
            </Text>
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

      <WeeklyReelModal
        visible={showWeeklyReel}
        weeklyDays={weeklyDaysLogs}
        streakCount={streakCount}
        onClose={() => setShowWeeklyReel(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 28,
    letterSpacing: 0.2,
  },
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

  // 7-Day Habit Tracker Card
  streakCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  streakHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  streakFlameCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.2,
  },
  streakSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
  streakMilestoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  streakMilestoneText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  weekRibbon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  weekDayCol: {
    alignItems: 'center',
    gap: 6,
    width: 38,
  },
  weekDayLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  weekDayDateNum: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    marginTop: -4,
    marginBottom: 2,
  },
  weekDayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingTodayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  indicatorContainer: {
    height: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  weeklyReelBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  weeklyReelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  reelIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weeklyReelTitle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  weeklyReelSubtitle: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
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
