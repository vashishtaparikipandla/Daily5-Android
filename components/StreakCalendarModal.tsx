import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import {
  Fire,
  Sparkle,
  CaretLeft,
  CaretRight,
  X,
  Check,
  CalendarBlank,
  BookOpen,
} from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useDiary } from '@/contexts/DiaryContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface StreakCalendarModalProps {
  visible: boolean;
  onClose: () => void;
}

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function StreakCalendarModal({ visible, onClose }: StreakCalendarModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { books, streakCount, totalDays, totalMoments } = useDiary();

  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Determine user's active view month
  const [viewDate, setViewDate] = useState(() => new Date());

  // Build a lookup map of date -> entry count
  const dateMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of books) {
      if (b.isSample) continue;
      for (const d of b.days) {
        if (d.entries.length > 0) {
          map.set(d.date, d.entries.length);
        }
      }
    }
    return map;
  }, [books]);

  // Determine earliest date recorded or joined
  const earliestDateStr = useMemo(() => {
    let earliest = today;
    for (const [dateStr] of dateMap.entries()) {
      if (dateStr < earliest) earliest = dateStr;
    }
    return earliest;
  }, [dateMap, today]);

  // Compute month days for current viewDate
  const monthData = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth(); // 0-indexed

    const firstDay = new Date(year, month, 1);
    const startWeekday = firstDay.getDay(); // 0 (Sun) to 6 (Sat)
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: {
      dayNum: number;
      dateStr: string;
      count: number;
      isToday: boolean;
      isFuture: boolean;
      isBeforeJoin: boolean;
    }[] = [];

    // Prefix empty slots
    for (let i = 0; i < startWeekday; i++) {
      days.push({
        dayNum: 0,
        dateStr: '',
        count: 0,
        isToday: false,
        isFuture: false,
        isBeforeJoin: false,
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const count = dateMap.get(dateStr) ?? 0;
      const isToday = dateStr === today;
      const isFuture = dateStr > today;
      const isBeforeJoin = dateStr < earliestDateStr;

      days.push({
        dayNum: day,
        dateStr,
        count,
        isToday,
        isFuture,
        isBeforeJoin,
      });
    }

    return {
      year,
      month,
      monthName: firstDay.toLocaleString('default', { month: 'long', year: 'numeric' }),
      days,
    };
  }, [viewDate, dateMap, today, earliestDateStr]);

  // Month completion metrics
  const monthStats = useMemo(() => {
    let recorded = 0;
    let totalEligible = 0;
    for (const d of monthData.days) {
      if (d.dayNum === 0 || d.isFuture) continue;
      totalEligible++;
      if (d.count > 0) recorded++;
    }
    const percent = totalEligible > 0 ? Math.round((recorded / totalEligible) * 100) : 0;
    return { recorded, totalEligible, percent };
  }, [monthData]);

  function handlePrevMonth() {
    Haptics.selectionAsync();
    setViewDate(curr => new Date(curr.getFullYear(), curr.getMonth() - 1, 1));
  }

  function handleNextMonth() {
    Haptics.selectionAsync();
    setViewDate(curr => new Date(curr.getFullYear(), curr.getMonth() + 1, 1));
  }

  function handleDayPress(dateStr: string, isFuture: boolean) {
    if (isFuture || !dateStr) return;
    Haptics.selectionAsync();
    onClose();
    router.push({ pathname: '/log-modal', params: { date: dateStr } });
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16) + 16,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.headerFlame, { backgroundColor: colors.accentLight }]}>
                <Fire size={22} color={colors.primary} weight="fill" />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
                  Archival Journey
                </Text>
                <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                  Daily memory consistency & habit tracker
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={18} color={colors.foreground} weight="bold" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* KPI Cards Row (Matching user's reference) */}
            <View style={styles.statsRow}>
              <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}>
                <Text style={[styles.statNum, { color: colors.primary, fontFamily: 'PlayfairDisplay_700Bold' }]}>
                  {streakCount}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Day Streak</Text>
              </View>

              <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}>
                <Text style={[styles.statNum, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
                  {totalDays}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Days Logged</Text>
              </View>

              <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}>
                <Text style={[styles.statNum, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
                  {totalMoments}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Moments</Text>
              </View>

              <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}>
                <Text style={[styles.statNum, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
                  {monthStats.percent}%
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Completion</Text>
              </View>
            </View>

            {/* Month Navigator */}
            <View style={[styles.monthNavCard, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}>
              <View style={styles.monthNavTop}>
                <TouchableOpacity onPress={handlePrevMonth} style={styles.monthArrowBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <CaretLeft size={20} color={colors.foreground} weight="bold" />
                </TouchableOpacity>

                <View style={styles.monthTitleWrap}>
                  <CalendarBlank size={18} color={colors.primary} weight="duotone" />
                  <Text style={[styles.monthTitleText, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
                    {monthData.monthName}
                  </Text>
                </View>

                <TouchableOpacity onPress={handleNextMonth} style={styles.monthArrowBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <CaretRight size={20} color={colors.foreground} weight="bold" />
                </TouchableOpacity>
              </View>

              {/* Weekday Header */}
              <View style={styles.weekdaysRow}>
                {WEEKDAY_NAMES.map(name => (
                  <Text key={name} style={[styles.weekdayLabel, { color: colors.tertiary }]}>
                    {name}
                  </Text>
                ))}
              </View>

              {/* Calendar Grid */}
              <View style={styles.daysGrid}>
                {monthData.days.map((item, idx) => {
                  if (item.dayNum === 0) {
                    return <View key={`empty-${idx}`} style={styles.dayCell} />;
                  }

                  const isFull = item.count >= 4;
                  const isPartial = item.count > 0 && item.count < 4;
                  const ratio = Math.min(item.count / 4, 1);

                  // SVG Circle geometry for circular progress ring
                  const size = 36;
                  const strokeWidth = 3;
                  const radius = (size - strokeWidth) / 2;
                  const circumference = 2 * Math.PI * radius;
                  const strokeDashoffset = circumference - ratio * circumference;

                  return (
                    <TouchableOpacity
                      key={item.dateStr}
                      style={styles.dayCell}
                      onPress={() => handleDayPress(item.dateStr, item.isFuture)}
                      disabled={item.isFuture}
                      activeOpacity={0.7}
                    >
                      <View style={styles.circleContainer}>
                        {isFull ? (
                          // 100% full circle with checkmark
                          <View style={[styles.solidCircle, { backgroundColor: colors.primary }]}>
                            <Check size={16} color="#FFFFFF" weight="bold" />
                          </View>
                        ) : isPartial ? (
                          // Circular progress ring (25%, 50%, 75%)
                          <View style={styles.ringWrapper}>
                            <Svg width={size} height={size}>
                              {/* Background track */}
                              <Circle
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                stroke={colors.border}
                                strokeWidth={strokeWidth}
                                fill="transparent"
                              />
                              {/* Progress arc in terracotta */}
                              <Circle
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                stroke={colors.primary}
                                strokeWidth={strokeWidth}
                                strokeDasharray={`${circumference} ${circumference}`}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                fill="transparent"
                                origin={`${size / 2}, ${size / 2}`}
                                rotation="-90"
                              />
                            </Svg>
                            <Text style={[styles.dayNumberText, { color: colors.foreground }]}>
                              {item.dayNum}
                            </Text>
                          </View>
                        ) : (
                          // Empty circle (missed or pending)
                          <View
                            style={[
                              styles.emptyCircle,
                              {
                                borderColor: item.isToday ? colors.primary : colors.border,
                                backgroundColor: item.isToday ? colors.accentLight : 'transparent',
                                opacity: item.isFuture ? 0.25 : 0.75,
                                borderWidth: item.isToday ? 2 : 1,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.dayNumberText,
                                {
                                  color: item.isToday ? colors.primary : colors.mutedForeground,
                                  fontFamily: item.isToday ? 'Inter_700Bold' : 'Inter_500Medium',
                                },
                              ]}
                            >
                              {item.dayNum}
                            </Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Progress Summary Footer */}
              <View style={[styles.monthFooterBanner, { backgroundColor: colors.accentLight, borderColor: colors.border }]}>
                <Sparkle size={15} color={colors.primary} weight="fill" />
                <Text style={[styles.monthFooterText, { color: colors.foreground }]}>
                  {monthStats.recorded} of {monthStats.totalEligible} days archived this month ({monthStats.percent}%)
                </Text>
              </View>
            </View>

            {/* Legend Guide */}
            <View style={[styles.legendCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.legendTitle, { color: colors.tertiary }]}>LEGEND</Text>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendMiniCircle, { backgroundColor: colors.primary }]}>
                    <Check size={10} color="#FFFFFF" weight="bold" />
                  </View>
                  <Text style={[styles.legendLabel, { color: colors.mutedForeground }]}>100% (4 Moments)</Text>
                </View>

                <View style={styles.legendItem}>
                  <View style={[styles.legendMiniRing, { borderColor: colors.primary }]}>
                    <View style={[styles.legendMiniDot, { backgroundColor: colors.primary }]} />
                  </View>
                  <Text style={[styles.legendLabel, { color: colors.mutedForeground }]}>1-3 Moments</Text>
                </View>

                <View style={styles.legendItem}>
                  <View style={[styles.legendMiniCircle, { borderColor: colors.border, borderWidth: 1 }]} />
                  <Text style={[styles.legendLabel, { color: colors.mutedForeground }]}>Empty</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerFlame: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },

  /* Stats Row */
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 2,
  },
  statNum: {
    fontSize: 18,
    letterSpacing: -0.2,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
  },

  /* Month Card */
  monthNavCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  monthNavTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  monthTitleText: {
    fontSize: 16,
    letterSpacing: 0.2,
  },
  monthArrowBtn: {
    padding: 6,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  weekdayLabel: {
    width: (SCREEN_WIDTH - 72) / 7,
    textAlign: 'center',
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: (SCREEN_WIDTH - 72) / 7,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleContainer: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solidCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringWrapper: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  emptyCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    position: 'absolute',
  },
  monthFooterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  monthFooterText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },

  /* Legend */
  legendCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  legendTitle: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.8,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendMiniCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendMiniRing: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendMiniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
});
