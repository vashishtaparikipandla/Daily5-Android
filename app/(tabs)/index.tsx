import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Bell } from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/contexts/AppContext';
import { useDiary } from '@/contexts/DiaryContext';
import { WoodenTableBackground } from '@/components/WoodenTableBackground';
import { BrandLogoHorizontal } from '@/components/BrandLogo';
import { HeirloomPhotobook } from '@/components/HeirloomPhotobook';
import { BadgeUnlockCelebrationModal } from '@/components/BadgeUnlockCelebrationModal';
import { ARCHIVAL_STAMPS, computeMilestoneStats, type ArchivalStampDef } from '@/lib/milestones';
import { updateCustomerBadgeStats } from '@/lib/firebase';
import { todayStr } from '@/lib/data';
import { getUnreadNotificationCount } from '@/lib/notifications';

export default function TodayTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const { books, streakCount, totalMoments, getOnThisDay } = useDiary();
  const [unreadCount, setUnreadCount] = useState(0);
  const [celebratingBadge, setCelebratingBadge] = useState<ArchivalStampDef | null>(null);

  useFocusEffect(
    useCallback(() => {
      getUnreadNotificationCount().then(setUnreadCount);
    }, [])
  );

  // Check for newly unlocked milestone badges and celebrate on homepage
  useEffect(() => {
    let isMounted = true;
    async function checkBadgeUnlocks() {
      try {
        const stats = computeMilestoneStats(books, streakCount);
        const unlocked = ARCHIVAL_STAMPS.filter(s => s.isUnlocked(stats));
        const rawCelebrated = await AsyncStorage.getItem('@dearday_celebrated_badges_v1');
        const celebratedIds: string[] = rawCelebrated ? JSON.parse(rawCelebrated) : [];

        // Find the first unlocked badge not yet celebrated
        const newlyUnlocked = unlocked.find(s => !celebratedIds.includes(s.id));
        if (newlyUnlocked && isMounted) {
          setCelebratingBadge(newlyUnlocked);
        }

        // Always sync current unlocked count to Firebase Firestore
        const userEmail = user?.email || 'demo@dearday.app';
        updateCustomerBadgeStats(userEmail, unlocked.length, unlocked.map(s => s.id));
      } catch (err) {
        // Safe non-blocking
      }
    }

    checkBadgeUnlocks();
    return () => {
      isMounted = false;
    };
  }, [books, streakCount, totalMoments, user?.email]);

  const handleDismissCelebration = async () => {
    if (!celebratingBadge) return;
    const badgeId = celebratingBadge.id;
    setCelebratingBadge(null);
    try {
      const rawCelebrated = await AsyncStorage.getItem('@dearday_celebrated_badges_v1');
      const celebratedIds: string[] = rawCelebrated ? JSON.parse(rawCelebrated) : [];
      if (!celebratedIds.includes(badgeId)) {
        celebratedIds.push(badgeId);
        await AsyncStorage.setItem('@dearday_celebrated_badges_v1', JSON.stringify(celebratedIds));
      }
    } catch {
      // Safe non-blocking
    }
  };

  const today = todayStr();
  const onThisDay = getOnThisDay();

  const dayOfWeek = new Date(today + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' });
  const fullDate = new Date(today + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  const topPad = insets.top + (Platform.OS === 'web' ? 12 : 0);
  const botPad = insets.bottom + 80; // room for tab bar

  function openLog() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/log-modal');
  }

  return (
    <WoodenTableBackground>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: topPad + 4, paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Seamless Header Row matching Library, Discover, Search (Unboxed) */}
        <View style={styles.headerRow}>
          <BrandLogoHorizontal height={28} color={colors.primary} />

          <TouchableOpacity
            style={[styles.notifBtn, { backgroundColor: 'rgba(255,255,255,0.75)', borderColor: 'rgba(215, 205, 190, 0.6)' }]}
            onPress={() => {
              Haptics.selectionAsync();
              router.push('/notifications');
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={`Notifications, ${unreadCount > 0 ? unreadCount : 'no'} unread`}
          >
            <Bell size={20} color={colors.foreground} weight="regular" />
            {unreadCount > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.unreadBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* 3D Heirloom Photobook with 4 Linen Themes, 2x2 Recessed Pockets, Hand Tuck & Stickers */}
        <HeirloomPhotobook />

        {/* On This Day — Archival & Distinct Time Capsule Styling */}
        {onThisDay.length > 0 && (
          <View style={styles.otdSection}>
            <View style={styles.otdHeaderRow}>
              <View style={[styles.otdHeaderDot, { backgroundColor: colors.accent }]} />
              <Text style={[styles.otdHeaderTitle, { color: colors.accent }]}>
                On This Day · Time Capsule
              </Text>
            </View>

            {onThisDay.slice(0, 3).map(({ book, day }) => {
              const year = day.date.slice(0, 4);
              return (
                <TouchableOpacity
                  key={day.date}
                  style={[
                    styles.otdCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.borderStrong,
                    },
                  ]}
                  onPress={() => router.push({ pathname: '/book-viewer', params: { monthKey: book.monthKey } })}
                  activeOpacity={0.85}
                >
                  <View style={styles.otdCardTop}>
                    <View style={styles.otdBadge}>
                      <Text style={styles.otdBadgeText}>{year} · THIS DAY</Text>
                    </View>
                  </View>
                  <Text style={[styles.otdText, { color: colors.foreground }]} numberOfLines={2}>
                    {day.entries[0]?.text || 'A memory from this day'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Celebratory Milestone Badge Unlock Modal */}
      <BadgeUnlockCelebrationModal
        visible={!!celebratingBadge}
        badge={celebratingBadge}
        onClose={handleDismissCelebration}
        onViewProfile={() => {
          handleDismissCelebration();
          router.push('/profile');
        }}
      />
    </WoodenTableBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 6,
    marginBottom: 4,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 2,
  },

  /* 7-Day Habit Tracker Card */
  streakCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
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
  weekDayNum: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
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
    marginTop: 8,
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
    fontSize: 12.5,
    fontFamily: 'Inter_600SemiBold',
  },
  weeklyReelSubtitle: {
    fontSize: 10.5,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },

  notifBtn: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unreadBadgeText: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
  hairline: { height: 1, marginVertical: 2 },
  editorLinkRow: {
    alignItems: 'center',
    marginVertical: 4,
  },
  editorLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  editorLinkText: {
    fontSize: 11.5,
    fontFamily: 'Inter_500Medium',
  },
  celebrationCard: {
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  celebrationIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  celebrationSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 16,
  },
  flipPageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  flipPageBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  section: { gap: 0 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8, textTransform: 'uppercase' },
  editLink: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },

  /* On This Day / Archival styling */
  otdSection: { marginTop: 4, gap: 12 },
  otdHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  otdHeaderDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  otdHeaderTitle: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  otdCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  otdCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  otdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(196, 123, 58, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  otdBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#C47B3A',
    letterSpacing: 0.6,
  },
  otdEntries: {
    gap: 6,
  },
  otdEntryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  otdBullet: {
    fontSize: 14,
    lineHeight: 20,
  },
  otdText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  otdFooter: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginTop: 2,
  },
});
