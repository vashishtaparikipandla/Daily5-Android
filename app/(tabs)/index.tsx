import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, Dimensions,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Bell, Fire, Sparkle, ArrowRight, BookOpen, Check, CaretRight, FilmStrip } from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDiary } from '@/contexts/DiaryContext';
import { PaperBackground } from '@/components/PaperBackground';
import { TonightCard } from '@/components/TonightCard';
import { EntrySlot } from '@/components/EntrySlot';
import { FtuoTour } from '@/components/FtuoTour';
import { StreakCalendarModal } from '@/components/StreakCalendarModal';
import { WeeklyReelModal } from '@/components/WeeklyReelModal';
import { BrandLogoIcon } from '@/components/BrandLogo';
import { todayStr, type DayLog } from '@/lib/data';
import { getHonorificTitle } from '@/lib/milestones';
import { getUnreadNotificationCount } from '@/lib/notifications';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Warm terracotta and luxury bookbinding celebration palette
const CELEBRATION_COLORS = ['#E8593A', '#C47B3A', '#2D3F2A', '#D8B4C0', '#F2E8DC', '#E83A7A'];

export default function TodayTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getTodayLog, getDayLog, getOnThisDay, streakCount } = useDiary();
  const [unreadCount, setUnreadCount] = useState(0);
  const [celebrate, setCelebrate] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showWeeklyReel, setShowWeeklyReel] = useState(false);
  const confettiRef = useRef<any>(null);
  const hasCelebratedToday = useRef(false);

  useFocusEffect(
    useCallback(() => {
      getUnreadNotificationCount().then(setUnreadCount);
    }, [])
  );

  const today = todayStr();
  const todayLog = getTodayLog();
  const entries = todayLog?.entries ?? [];
  const onThisDay = getOnThisDay();
  const isComplete = entries.length === 4;

  useEffect(() => {
    if (isComplete && !hasCelebratedToday.current) {
      hasCelebratedToday.current = true;
      setCelebrate(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      confettiRef.current?.start();
    }
  }, [isComplete]);

  // Compute Monday–Sunday for current week with logging status
  const weekDays = useMemo(() => {
    const now = new Date(today + 'T12:00:00');
    const dayIndex = now.getDay(); // 0 = Sunday, 1 = Monday, ...
    const diffToMonday = (dayIndex + 6) % 7; // Monday = 0, Sunday = 6
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

  const honorific = getHonorificTitle(streakCount);
  const weeklyDaysLogs = useMemo(() => {
    return weekDays.map(w => getDayLog(w.dateStr)).filter(Boolean) as DayLog[];
  }, [weekDays, getDayLog]);
  const hasWeeklyMoments = weeklyDaysLogs.some(d => d.entries.length > 0);

  const dayOfWeek = new Date(today + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' });
  const fullDate = new Date(today + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const botPad = insets.bottom + 90; // room for tab bar

  function openLog() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/log-modal');
  }

  return (
    <PaperBackground showMarginLine={false}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: topPad + 12, paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Date header + Notification Bell */}
        <View style={styles.headerRow}>
          <View style={styles.dateHeader}>
            <View style={styles.brandRow}>
              <BrandLogoIcon size={16} color={colors.primary} />
              <Text style={[styles.brandText, { color: colors.primary }]}>DEAR DAY</Text>
            </View>
            <Text style={[styles.dayOfWeek, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
              {dayOfWeek}
            </Text>
            <Text style={[styles.fullDate, { color: colors.mutedForeground, fontFamily: 'PlayfairDisplay_400Regular' }]}>
              {fullDate}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.notifBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
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

        {/* 7-Day Habit Tracker Card */}
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
                    item.isToday && !item.hasEntry && {
                      borderColor: colors.primary,
                      borderWidth: 2,
                      backgroundColor: colors.accentLight,
                    },
                    item.isFuture && { opacity: 0.35 },
                  ]}
                  onPress={() => {
                    if (!item.isFuture) {
                      Haptics.selectionAsync();
                      router.push({ pathname: '/log-modal', params: { date: item.dateStr } });
                    }
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

                {/* Reserved height footer so all 7 columns stay pixel-aligned */}
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

        <View style={[styles.hairline, { backgroundColor: colors.border }]} />

        {/* Celebration Banner when 4/4 moments captured */}
        {isComplete && (
          <View style={[styles.celebrationCard, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.celebrationIconWrap, { backgroundColor: colors.accentLight }]}>
                <Sparkle size={18} color={colors.primary} weight="fill" />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.celebrationTitle, { color: colors.foreground }]}>
                  Today's Story is Complete ✨
                </Text>
                <Text style={[styles.celebrationSubtitle, { color: colors.mutedForeground }]}>
                  You captured all 4 fragments. Your daily page has been preserved.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.flipPageBtn, { backgroundColor: colors.accentLight, borderColor: colors.border }]}
              onPress={() => {
                Haptics.selectionAsync();
                router.push({ pathname: '/book-viewer', params: { monthKey: today.slice(0, 7) } });
              }}
              accessibilityRole="button"
              accessibilityLabel="Flip today's page in book"
              activeOpacity={0.8}
            >
              <BookOpen size={15} color={colors.primary} weight="bold" />
              <Text style={[styles.flipPageBtnText, { color: colors.primary }]}>
                Flip Today's Page in Book →
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Logged entries for today */}
        {entries.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionLabel, { color: colors.tertiary }]}>
                {entries.length === 4 ? "Today's 4 Moments" : `${entries.length} of 4 Moments Recorded`}
              </Text>
              <TouchableOpacity
                onPress={openLog}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Edit today's moments"
              >
                <Text style={[styles.editLink, { color: colors.primary }]}>Edit</Text>
              </TouchableOpacity>
            </View>
            {entries.map((entry, i) => (
              <EntrySlot
                key={entry.id}
                entry={entry}
                slotNumber={i + 1}
                onPress={openLog}
              />
            ))}
          </View>
        )}

        {/* Tonight card / Add remaining CTA */}
        {entries.length < 4 && (
          <TonightCard onPress={openLog} entryCount={entries.length} />
        )}

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
                  {/* Vintage stamp badge */}
                  <View style={styles.otdCardTop}>
                    <View style={styles.otdBadge}>
                      <Sparkle size={12} color="#C47B3A" weight="fill" />
                      <Text style={styles.otdBadgeText}>{year} · THIS DAY</Text>
                    </View>
                    <ArrowRight size={14} color={colors.tertiary} weight="bold" />
                  </View>

                  {/* Memories recorded on that day */}
                  <View style={styles.otdEntries}>
                    {day.entries.slice(0, 2).map((e) => (
                      <View key={e.id} style={styles.otdEntryRow}>
                        <Text style={[styles.otdBullet, { color: colors.accent }]}>•</Text>
                        <Text
                          style={[styles.otdText, { color: colors.foreground }]}
                          numberOfLines={2}
                        >
                          {e.text}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <Text style={[styles.otdFooter, { color: colors.tertiary }]}>
                    Open {book.title || 'Volume'} →
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Confetti Cannon celebration layer */}
      <ConfettiCannon
        ref={confettiRef}
        count={80}
        origin={{ x: SCREEN_WIDTH / 2, y: -20 }}
        colors={CELEBRATION_COLORS}
        autoStart={false}
        fadeOut
      />

      {/* First-time User Onboarding Spotlight Tour */}
      <FtuoTour />

      {/* Archival Journey & Streak Calendar Modal */}
      <StreakCalendarModal
        visible={showStreakModal}
        onClose={() => setShowStreakModal(false)}
      />

      <WeeklyReelModal
        visible={showWeeklyReel}
        onClose={() => setShowWeeklyReel(false)}
        weeklyDays={weeklyDaysLogs}
        streakCount={streakCount}
      />
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateHeader: { gap: 2 },
  dateTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  streakText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  brandText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.2,
  },
  dayOfWeek: { fontSize: 26, letterSpacing: 0.2 },
  fullDate: { fontSize: 16 },

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
