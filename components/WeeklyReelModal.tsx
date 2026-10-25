/**
 * WeeklyReelModal.tsx
 * The Sunday Edition: 7-Day Archival Story Reel for Dear Day.
 * Full-screen visual memory player with auto-advance, tap navigation, and weekly archival summary.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Dimensions,
  Share,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { X, ShareNetwork, Sparkle, ArrowRight, CaretLeft, CaretRight } from 'phosphor-react-native';
import { useColors } from '@/hooks/useColors';
import { BrandLogoIcon } from '@/components/BrandLogo';
import { getHonorificTitle } from '@/lib/milestones';
import { formatFullDate, type DayLog, type Entry } from '@/lib/data';
import { getCategoryById } from '@/constants/categories';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SLIDE_DURATION = 4500; // 4.5 seconds per slide

interface WeeklyReelModalProps {
  visible: boolean;
  onClose: () => void;
  weeklyDays: DayLog[];
  streakCount: number;
  title?: string;
  subtitle?: string;
  summaryTitle?: string;
  summarySubtitle?: string;
}

export function WeeklyReelModal({
  visible,
  onClose,
  weeklyDays,
  streakCount,
  title = 'THE SUNDAY EDITION',
  subtitle,
  summaryTitle = 'Week in Review',
  summarySubtitle = 'Another chapter preserved for a lifetime.',
}: WeeklyReelModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  // Filter days that have at least one entry
  const activeDays = weeklyDays.filter(d => d.entries.length > 0);
  const totalSlides = activeDays.length + 1; // +1 for the final summary slide
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const progress = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      setCurrentIndex(0);
      progress.value = 0;
      return;
    }

    startSlideProgress();
  }, [visible, currentIndex, isPaused]);

  function startSlideProgress() {
    progress.value = 0;
    if (isPaused) return;

    progress.value = withTiming(
      1,
      { duration: SLIDE_DURATION, easing: Easing.linear },
      finished => {
        if (finished) {
          runOnJS(advanceSlide)();
        }
      },
    );
  }

  function advanceSlide() {
    if (currentIndex < totalSlides - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentIndex(prev => prev + 1);
    } else {
      // Reached the end
    }
  }

  function prevSlide() {
    if (currentIndex > 0) {
      Haptics.selectionAsync();
      setCurrentIndex(prev => prev - 1);
    }
  }

  function nextSlide() {
    if (currentIndex < totalSlides - 1) {
      Haptics.selectionAsync();
      setCurrentIndex(prev => prev + 1);
    }
  }

  async function handleShareWeekly() {
    Haptics.selectionAsync();
    const honorific = getHonorificTitle(streakCount);
    try {
      await Share.share({
        message: `✦ My Week in Review with Dear Day:\n\n• ${activeDays.length} Days Recorded\n• Rank: ${honorific.title} (${streakCount}-Day Streak)\n\nPreserving life one day at a time with Dear Day.`,
        title: 'Dear Day — The Sunday Edition',
      });
    } catch {
      // User cancelled
    }
  }

  if (!visible) return null;

  const isSummarySlide = currentIndex === activeDays.length;
  const currentDay = !isSummarySlide ? activeDays[currentIndex] : null;
  const honorific = getHonorificTitle(streakCount);

  // Pick hero entry (prioritize entry with photo)
  const heroEntry = currentDay
    ? currentDay.entries.find(e => e.photos && e.photos.length > 0) || currentDay.entries[0]
    : null;
  const heroPhoto = heroEntry?.photos?.[0];
  const cat = heroEntry ? getCategoryById(heroEntry.category) : null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        {/* Full-Screen Canvas */}
        <View style={[styles.reelCanvas, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
          {/* Progress Indicators Bar */}
          <View style={styles.progressRow}>
            {Array.from({ length: totalSlides }).map((_, i) => (
              <View key={i} style={styles.progressBarTrack}>
                {i === currentIndex ? (
                  <Animated.View
                    style={[
                      styles.progressBarFill,
                      useAnimatedStyle(() => ({
                        width: `${progress.value * 100}%`,
                      })),
                    ]}
                  />
                ) : (
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: i < currentIndex ? '100%' : '0%' },
                    ]}
                  />
                )}
              </View>
            ))}
          </View>

          {/* Top Header Row */}
          <View style={styles.topHeader}>
            <View style={styles.headerLeft}>
              <BrandLogoIcon size={16} color="#E8593A" />
              <Text style={styles.headerTitle}>{title.toUpperCase()}</Text>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={20} color="#FFFFFF" weight="bold" />
            </TouchableOpacity>
          </View>

          {/* Slide Content */}
          {!isSummarySlide && currentDay && (
            <View style={styles.slideContent}>
              <View style={styles.dateBanner}>
                <Text style={styles.dayOfWeekText}>
                  {new Date(currentDay.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' })}
                </Text>
                <Text style={styles.fullDateText}>{formatFullDate(currentDay.date)}</Text>
              </View>

              {/* Hero Photo / Visual Card */}
              <View style={styles.mediaCard}>
                {heroPhoto ? (
                  <Image source={{ uri: heroPhoto }} style={styles.heroImage} resizeMode="cover" />
                ) : (
                  <View style={styles.textOnlyCard}>
                    <Text style={styles.textOnlyQuote}>“</Text>
                    <Text style={styles.textOnlyCaption}>{heroEntry?.text || 'A quiet moment observed.'}</Text>
                  </View>
                )}

                {cat && (
                  <View style={[styles.catTag, { backgroundColor: cat.color + '33', borderColor: cat.color + '77' }]}>
                    <Text style={[styles.catTagText, { color: cat.color }]}>{cat.label}</Text>
                  </View>
                )}
              </View>

              {/* Caption Card */}
              {heroPhoto && heroEntry?.text ? (
                <View style={styles.captionBox}>
                  <Text style={styles.captionText} numberOfLines={3}>
                    {heroEntry.text}
                  </Text>
                </View>
              ) : null}
            </View>
          )}

          {/* Final Summary Slide */}
          {isSummarySlide && (
            <View style={styles.summarySlide}>
              <View style={styles.summaryBadge}>
                <Sparkle size={24} color="#E8593A" weight="fill" />
              </View>

              <Text style={styles.summaryTitle}>{summaryTitle}</Text>
              <Text style={styles.summarySubtitle}>
                {summarySubtitle}
              </Text>

              {/* Key Stats Grid */}
              <View style={styles.summaryStatsGrid}>
                <View style={styles.summaryStatBox}>
                  <Text style={styles.statLargeNum}>{activeDays.length}</Text>
                  <Text style={styles.statLargeLabel}>Days Recorded</Text>
                </View>
                <View style={styles.summaryStatBox}>
                  <Text style={styles.statLargeNum}>{streakCount}</Text>
                  <Text style={styles.statLargeLabel}>Current Streak</Text>
                </View>
              </View>

              {/* Earned Honorific Rank */}
              <View style={styles.rankCard}>
                <Text style={styles.rankBadge}>{honorific.badge}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rankLabel}>CURRENT ARCHIVAL RANK</Text>
                  <Text style={styles.rankTitle}>{honorific.title}</Text>
                  <Text style={styles.rankDesc}>{honorific.subtitle}</Text>
                </View>
              </View>

              {/* Share & Close CTAs */}
              <View style={styles.summaryActions}>
                <TouchableOpacity
                  style={styles.shareWeeklyBtn}
                  onPress={handleShareWeekly}
                  activeOpacity={0.8}
                >
                  <ShareNetwork size={18} color="#FFFFFF" weight="bold" />
                  <Text style={styles.shareWeeklyBtnText}>Share Week in Review</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.doneBtn}
                  onPress={onClose}
                  activeOpacity={0.8}
                >
                  <Text style={styles.doneBtnText}>Close & Return to Today ✓</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Invisible Left / Right Tap Touch Targets for Navigation */}
          <TouchableOpacity
            style={styles.navLeftTouch}
            onPress={prevSlide}
            activeOpacity={1}
          />
          <TouchableOpacity
            style={styles.navRightTouch}
            onPress={nextSlide}
            activeOpacity={1}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#0F0E0D',
  },
  reelCanvas: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    position: 'relative',
  },
  progressRow: {
    flexDirection: 'row',
    gap: 4,
    height: 3,
    marginBottom: 8,
  },
  progressBarTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#E8593A',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    zIndex: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.85)',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
  },
  dateBanner: {
    alignItems: 'center',
    gap: 2,
  },
  dayOfWeekText: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#FFFFFF',
  },
  fullDateText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#B5ADA4',
  },
  mediaCard: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.46,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1E1C19',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  textOnlyCard: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1C19',
  },
  textOnlyQuote: {
    fontSize: 48,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#E8593A',
    opacity: 0.5,
  },
  textOnlyCaption: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay_400Regular',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 26,
  },
  catTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    borderWidth: 0.5,
  },
  catTagText: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  captionBox: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  captionText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#FFFFFF',
    lineHeight: 18,
    textAlign: 'center',
  },

  /* Summary Slide */
  summarySlide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 12,
  },
  summaryBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(232,89,58,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  summaryTitle: {
    fontSize: 28,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#FFFFFF',
  },
  summarySubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#B5ADA4',
    textAlign: 'center',
  },
  summaryStatsGrid: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginVertical: 4,
  },
  summaryStatBox: {
    flex: 1,
    backgroundColor: '#1C1916',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  statLargeNum: {
    fontSize: 28,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#E8593A',
  },
  statLargeLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: '#8C827A',
  },
  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    backgroundColor: '#1E1C19',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(232,89,58,0.3)',
    padding: 14,
  },
  rankBadge: {
    fontSize: 26,
  },
  rankLabel: {
    fontSize: 8.5,
    fontFamily: 'Inter_700Bold',
    color: '#E8593A',
    letterSpacing: 0.8,
  },
  rankTitle: {
    fontSize: 16,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#FFFFFF',
  },
  rankDesc: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: '#A8A196',
  },
  summaryActions: {
    width: '100%',
    gap: 10,
    marginTop: 8,
    zIndex: 20,
  },
  shareWeeklyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E8593A',
    paddingVertical: 14,
    borderRadius: 12,
  },
  shareWeeklyBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
  doneBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  doneBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#A8A196',
  },

  /* Invisible Left / Right Touch Targets */
  navLeftTouch: {
    position: 'absolute',
    top: 60,
    bottom: 100,
    left: 0,
    width: SCREEN_WIDTH * 0.35,
    zIndex: 10,
  },
  navRightTouch: {
    position: 'absolute',
    top: 60,
    bottom: 100,
    right: 0,
    width: SCREEN_WIDTH * 0.65,
    zIndex: 10,
  },
});
