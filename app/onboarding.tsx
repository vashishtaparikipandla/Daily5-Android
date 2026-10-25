import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, FlatList, Dimensions, Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import Svg, { Rect } from 'react-native-svg';
import {
  Lightbulb,
  Coffee,
  Heartbeat,
  Heart,
  Airplane,
  BookOpen,
  ArrowLeft,
  CalendarBlank,
  Sparkle,
} from 'phosphor-react-native';
import { router } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { BrandLogoIcon } from '@/components/BrandLogo';

const { width: SW } = Dimensions.get('window');

const SLIDES = [
  {
    title: 'Life is short.',
    body: 'The moments that matter most are often the ones you almost forgot. Capture them before they fade into the background.',
    visual: 'lamp',
  },
  {
    title: 'Every night,\nchoose 4.',
    body: "Not because the rest don't count — but because focused curation turns passing days into enduring stories.",
    visual: 'dots',
  },
  {
    title: 'Not just\nthe good days.',
    body: 'Hard days, small victories, quiet coffees, twisted ankles. Every real human chapter belongs in your book.',
    visual: 'icons',
  },
  {
    title: 'Every month\nbecomes a book.',
    body: 'A real, tangible volume you can flip through with hardcover elegance, share as a PDF, or order into physical print.',
    visual: 'book',
  },
];

const CATEGORY_CHIPS = [
  { icon: Coffee, color: '#C47B3A', label: 'Coffee' },
  { icon: Heartbeat, color: '#E8593A', label: 'Health' },
  { icon: Heart, color: '#E83A7A', label: 'Love' },
  { icon: Airplane, color: '#3A7EC4', label: 'Travel' },
  { icon: BookOpen, color: '#C43A6F', label: 'Learn' },
];

const GENERATION_PRESETS = [
  { label: 'Gen Z', year: '2002', date: '2002-01-01' },
  { label: 'Millennial', year: '1995', date: '1995-01-01' },
  { label: '90s Kid', year: '1990', date: '1990-01-01' },
  { label: 'Gen X', year: '1980', date: '1980-01-01' },
];

// ─── Slide 0: Glowing Floating Lamp ──────────────────────────────────────────

function LampVisual() {
  const floatAnim = useSharedValue(0);

  useEffect(() => {
    floatAnim.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatAnim.value }],
  }));

  return (
    <View style={visualStyles.centerBox}>
      <View style={visualStyles.lampGlow} />
      <Animated.View style={[visualStyles.lampContainer, animatedStyle]}>
        <View style={visualStyles.lampCircle}>
          <Lightbulb size={68} color="#E8593A" weight="duotone" />
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Slide 1: 4 Pulsing Animated Dots ────────────────────────────────────────

function SingleDot({ index }: { index: number }) {
  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    const delay = index * 260;
    const timeout = setTimeout(() => {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 700, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.7, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.35, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
    }, delay);

    return () => clearTimeout(timeout);
  }, [index]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[visualStyles.obDot, animStyle]} />;
}

function DotsVisual() {
  return (
    <View style={visualStyles.dotsRow}>
      {[0, 1, 2, 3].map((i) => (
        <SingleDot key={i} index={i} />
      ))}
    </View>
  );
}

// ─── Slide 2: Category Chips ─────────────────────────────────────────────────

function CategoryChipsVisual() {
  return (
    <View style={visualStyles.chipsWrap}>
      {CATEGORY_CHIPS.map((chip) => {
        const IconComp = chip.icon;
        return (
          <View
            key={chip.label}
            style={[
              visualStyles.categoryChip,
              {
                borderColor: chip.color + '44',
                backgroundColor: chip.color + '15',
              },
            ]}
          >
            <IconComp size={22} color={chip.color} />
            <Text style={[visualStyles.categoryChipLabel, { color: chip.color }]}>
              {chip.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Slide 3: 3D-Styled Book Cover ───────────────────────────────────────────

function BookVisual() {
  const tiltAnim = useSharedValue(0);

  useEffect(() => {
    tiltAnim.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(4, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 600 },
      { rotateY: `${tiltAnim.value}deg` },
    ],
  }));

  return (
    <View style={visualStyles.bookOuter}>
      <Animated.View style={[visualStyles.bookWrap, animatedStyle]}>
        <View style={visualStyles.bookSpine} />
        <View style={visualStyles.bookCover}>
          <Text style={visualStyles.bookMonth}>July 2026</Text>
          <View style={visualStyles.bookPattern}>
            <BrandLogoIcon size={34} color="rgba(255,255,255,0.95)" />
          </View>
          <Text style={visualStyles.bookBrand}>DEAR DAY</Text>
        </View>
        <View style={visualStyles.bookPages} />
      </Animated.View>
    </View>
  );
}

// ─── Life Grid (80 Years = 4,160 Weeks) ──────────────────────────────────────

function LifeGrid({ livedWeeks }: { livedWeeks: number }) {
  const colors = useColors();
  const DOT = 3;
  const GAP = 1;
  const STEP = DOT + GAP;
  const COLS = 52;
  const ROWS = 80;
  const rects = [];
  for (let i = 0; i < ROWS * COLS; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    rects.push(
      <Rect
        key={i}
        x={col * STEP}
        y={row * STEP}
        width={DOT}
        height={DOT}
        rx={0.8}
        fill={i < livedWeeks ? colors.primary : colors.border}
      />,
    );
  }
  return <Svg width={COLS * STEP} height={ROWS * STEP}>{rects}</Svg>;
}

// ─── Smart DOB Masking & Calculation Helpers ─────────────────────────────────

function formatDobInput(raw: string): string {
  // Normalize slashes and dots to dashes
  const clean = raw.replace(/[./]/g, '-');
  const digits = clean.replace(/\D/g, '');

  if (digits.length <= 4) {
    return digits;
  } else if (digits.length <= 6) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  } else {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  }
}

function parseDobDate(s: string): Date | null {
  if (!s || s.length < 8) return null;
  const clean = s.replace(/\//g, '-');
  const parts = clean.split('-');

  let year = 0;
  let month = 0;
  let day = 0;

  if (parts.length === 3) {
    // If entered as YYYY-MM-DD
    if (parts[0].length === 4) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    } else if (parts[2].length === 4) {
      // If entered as DD-MM-YYYY
      year = parseInt(parts[2], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[0], 10);
    }
  }

  if (!year || isNaN(year) || isNaN(month) || isNaN(day)) {
    const d = new Date(clean + 'T12:00:00');
    if (isNaN(d.getTime())) return null;
    return d;
  }

  if (year < 1910 || year > new Date().getFullYear()) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  const d = new Date(year, month - 1, day, 12, 0, 0);
  if (isNaN(d.getTime()) || d > new Date()) return null;
  return d;
}

function calculateWeeksLived(dobDate: Date | null): number {
  if (!dobDate) return 0;
  const msDiff = Date.now() - dobDate.getTime();
  const weeks = Math.floor(msDiff / (7 * 24 * 60 * 60 * 1000));
  return Math.min(Math.max(0, weeks), 4160);
}

// ─── Main Onboarding Screen ──────────────────────────────────────────────────

export default function OnboardingScreen() {
  const { completeOnboarding } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [phase, setPhase] = useState(0);
  // Default predefined birth date: 2000-01-01 (Gen Z / Young Millennial)
  const [dob, setDob] = useState('2000-01-01');
  const [dobError, setDobError] = useState('');
  const [recalledDays, setRecalledDays] = useState<number | null>(null);
  const [livedWeeks, setLivedWeeks] = useState(1350);
  const [slide, setSlide] = useState(0);
  const slideRef = useRef<FlatList>(null);

  const parsedDate = parseDobDate(dob);
  const currentCalculatedWeeks = parsedDate ? calculateWeeksLived(parsedDate) : 0;
  const currentAge = parsedDate ? Math.floor(currentCalculatedWeeks / 52) : null;

  const fadeVal = useSharedValue(1);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: fadeVal.value }));

  function transition(next: number) {
    fadeVal.value = withTiming(0, { duration: 180 }, () => {
      fadeVal.value = withTiming(1, { duration: 280 });
    });
    setTimeout(() => setPhase(next), 180);
  }

  function handleDobContinue() {
    const date = parseDobDate(dob);
    if (!date) {
      setDobError('Please enter a valid birth date (YYYY-MM-DD)');
      return;
    }
    const weeks = calculateWeeksLived(date);
    setLivedWeeks(weeks);
    setDobError('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    transition(1);
  }

  function handleRecall(n: number) {
    Haptics.selectionAsync();
    setRecalledDays(n);
  }

  async function handleStart() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await completeOnboarding();
    router.replace('/auth');
  }

  const topPad = insets.top + (Platform.OS === 'web' ? 40 : 12);
  const botPad = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16);

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topPad, paddingBottom: botPad }]}>
      <Animated.View style={[styles.content, fadeStyle]}>

        {/* Phase 0 — Predefined & Smart DOB Input */}
        {phase === 0 && (
          <View style={styles.phaseCenter}>
            <View style={styles.phaseHeader}>
              <View style={[styles.phaseIconCircle, { backgroundColor: colors.accentLight }]}>
                <CalendarBlank size={32} color={colors.primary} weight="duotone" />
              </View>
              <Text style={[styles.heading, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
                When were you born?
              </Text>
              <Text style={[styles.sub, { color: colors.mutedForeground }]}>
                We'll illuminate your life's tapestry in weeks. Pre-filled with an example below.
              </Text>
            </View>

            {/* Generational Quick Presets */}
            <View style={styles.presetWrap}>
              <Text style={[styles.presetTitle, { color: colors.tertiary }]}>QUICK SELECTION</Text>
              <View style={styles.presetChipsRow}>
                {GENERATION_PRESETS.map((item) => {
                  const isSelected = dob === item.date;
                  return (
                    <TouchableOpacity
                      key={item.label}
                      style={[
                        styles.presetChip,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.muted,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setDob(item.date);
                        setDobError('');
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.presetChipText,
                          {
                            color: isSelected ? '#FFFFFF' : colors.foreground,
                            fontFamily: isSelected ? 'Inter_600SemiBold' : 'Inter_400Regular',
                          },
                        ]}
                      >
                        {item.label} ({item.year})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Input field with smart auto-formatting */}
            <View style={styles.inputWrap}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    color: colors.foreground,
                    borderColor: dobError ? colors.destructive : colors.borderStrong,
                  },
                ]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.tertiary}
                value={dob}
                onChangeText={(t) => {
                  const formatted = formatDobInput(t);
                  setDob(formatted);
                  setDobError('');
                }}
                keyboardType="numeric"
                maxLength={10}
              />

              {/* Dynamic Live Calculation Card */}
              {parsedDate && currentAge !== null && (
                <View style={[styles.dynamicStatBadge, { backgroundColor: colors.accentLight, borderColor: colors.border }]}>
                  <Sparkle size={15} color={colors.primary} weight="fill" />
                  <Text style={[styles.dynamicStatText, { color: colors.foreground }]}>
                    <Text style={{ fontFamily: 'Inter_700Bold', color: colors.primary }}>{currentAge} years old</Text>
                    {' · '}
                    {currentCalculatedWeeks.toLocaleString()} weeks lived
                    {' · '}
                    {Math.max(0, 4160 - currentCalculatedWeeks).toLocaleString()} ahead
                  </Text>
                </View>
              )}

              {!!dobError && <Text style={[styles.error, { color: colors.destructive }]}>{dobError}</Text>}
            </View>

            <TouchableOpacity
              style={[
                styles.btn,
                { backgroundColor: colors.primary, opacity: dob.length < 8 ? 0.5 : 1, marginTop: 12 },
              ]}
              onPress={handleDobContinue}
              disabled={dob.length < 8}
              activeOpacity={0.85}
            >
              <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Continue →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Phase 1 — Recalled days */}
        {phase === 1 && (
          <View style={styles.phaseCenter}>
            <TouchableOpacity onPress={() => transition(0)} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <ArrowLeft size={22} color={colors.foreground} />
            </TouchableOpacity>
            <View style={styles.phaseHeader}>
              <Text style={[styles.heading, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
                How many days do you remember from last week?
              </Text>
              <Text style={[styles.sub, { color: colors.mutedForeground }]}>
                Be completely honest with yourself.
              </Text>
            </View>

            <View style={styles.chips}>
              {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
                <TouchableOpacity
                  key={n}
                  onPress={() => handleRecall(n)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: recalledDays === n ? colors.primary : colors.card,
                      borderColor: recalledDays === n ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: recalledDays === n ? '#FFFFFF' : colors.foreground }]}>
                    {n}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {recalledDays !== null && (
              <View style={[styles.recallFeedbackCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.recallFeedbackText, { color: colors.foreground }]}>
                  {recalledDays <= 2
                    ? "That's completely normal. The human brain discards routine days automatically."
                    : recalledDays <= 4
                    ? "Better than average, but nearly half the week's memories already dissolved."
                    : "Impressive recall! Dear Day turns those memories into an everlasting photobook."}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.btn,
                { backgroundColor: colors.primary, opacity: recalledDays === null ? 0.4 : 1, marginTop: 20 },
              ]}
              onPress={() => transition(2)}
              disabled={recalledDays === null}
              activeOpacity={0.85}
            >
              <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Reveal My Life Grid →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Phase 2 — Life in Weeks: Full-screen, balanced, composed layout */}
        {phase === 2 && (
          <View style={styles.lifeFullContainer}>
            {/* Header section */}
            <View style={styles.lifeHeader}>
              <TouchableOpacity onPress={() => transition(1)} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <ArrowLeft size={20} color={colors.foreground} />
              </TouchableOpacity>
              <Text style={[styles.headingLife, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
                Your Life in 4,160 Weeks
              </Text>
              <Text style={[styles.subLife, { color: colors.mutedForeground }]}>
                An 80-year lifespan rendered dot by dot. The terracotta squares are behind you.
              </Text>
            </View>

            {/* Framed Archival Grid Tapestry with Age Milestones */}
            <View style={[styles.tapestryFrame, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}>
              {/* Top Axis: Weeks 1 to 52 */}
              <View style={styles.tapestryTopAxis}>
                <Text style={[styles.axisText, { color: colors.tertiary }]}>WK 1</Text>
                <Text style={[styles.axisText, { color: colors.tertiary }]}>52 WEEKS / YR</Text>
                <Text style={[styles.axisText, { color: colors.tertiary }]}>WK 52</Text>
              </View>

              <View style={styles.tapestryBodyRow}>
                {/* Left Milestone Markers: Age 0 to 80 */}
                <View style={styles.ageMilestonesCol}>
                  <Text style={[styles.axisText, { color: colors.tertiary }]}>0</Text>
                  <Text style={[styles.axisText, { color: colors.tertiary }]}>20</Text>
                  <Text style={[styles.axisText, { color: colors.tertiary }]}>40</Text>
                  <Text style={[styles.axisText, { color: colors.tertiary }]}>60</Text>
                  <Text style={[styles.axisText, { color: colors.tertiary }]}>80</Text>
                </View>

                {/* SVG Dot Matrix */}
                <View style={styles.gridCanvasWrap}>
                  <LifeGrid livedWeeks={livedWeeks} />
                </View>
              </View>
            </View>

            {/* Stat Banner Callout */}
            <View style={[styles.statBanner, { backgroundColor: colors.accentLight, borderColor: colors.border }]}>
              <View style={styles.statBannerTop}>
                <Sparkle size={16} color={colors.primary} weight="fill" />
                <Text style={[styles.statBannerTitle, { color: colors.foreground }]}>
                  You've lived <Text style={{ color: colors.primary, fontFamily: 'Inter_700Bold' }}>{livedWeeks.toLocaleString()}</Text> weeks ({Math.round((livedWeeks / 4160) * 100)}%)
                </Text>
              </View>
              <Text style={[styles.statBannerSub, { color: colors.mutedForeground }]}>
                {Math.max(0, 4160 - livedWeeks).toLocaleString()} weeks remain to be written. Make every memory count.
              </Text>
            </View>

            {/* Sticky Safe Bottom Action */}
            <View style={styles.lifeBottomAction}>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: colors.primary }]}
                onPress={() => transition(3)}
                activeOpacity={0.85}
              >
                <Text style={[styles.btnText, { color: colors.primaryForeground }]}>
                  Enter Dear Day →
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Phase 3 — Balanced Golden-Ratio Visual Carousel */}
        {phase === 3 && (
          <View style={styles.carouselContainer}>
            {/* Top Navigation Bar with Back & Skip Pill */}
            <View style={styles.topNavRow}>
              {slide > 0 ? (
                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    const prev = slide - 1;
                    setSlide(prev);
                    slideRef.current?.scrollToIndex({ index: prev, animated: true });
                  }}
                  style={[styles.circleBackBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <ArrowLeft size={16} color={colors.foreground} />
                </TouchableOpacity>
              ) : (
                <View style={{ width: 36 }} />
              )}

              {/* Step indicator */}
              <View style={[styles.stepPill, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Text style={[styles.stepPillText, { color: colors.foreground }]}>
                  {slide + 1} of {SLIDES.length}
                </Text>
              </View>

              {/* Polished Skip Pill */}
              <TouchableOpacity
                onPress={handleStart}
                style={[styles.skipPill, { backgroundColor: colors.muted, borderColor: colors.border }]}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                activeOpacity={0.7}
              >
                <Text style={[styles.skipPillText, { color: colors.mutedForeground }]}>Skip</Text>
              </TouchableOpacity>
            </View>

            {/* Centered Graphic Zone */}
            <View style={styles.visualStage}>
              {slide === 0 && <LampVisual />}
              {slide === 1 && <DotsVisual />}
              {slide === 2 && <CategoryChipsVisual />}
              {slide === 3 && <BookVisual />}
            </View>

            {/* Synchronized Typography Carousel */}
            <View style={styles.typographyStage}>
              <FlatList
                ref={slideRef}
                data={SLIDES}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEnabled={false}
                keyExtractor={(_, i) => String(i)}
                renderItem={({ item }) => (
                  <View style={[styles.slideCard, { width: SW - 48 }]}>
                    <Text style={[styles.slideTitle, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.slideBody, { color: colors.mutedForeground }]}>
                      {item.body}
                    </Text>
                  </View>
                )}
              />
            </View>

            {/* Pagination Pips */}
            <View style={styles.pipsRow}>
              {SLIDES.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.pipDot,
                    {
                      backgroundColor: i === slide ? colors.primary : colors.border,
                      width: i === slide ? 22 : 6,
                    },
                  ]}
                />
              ))}
            </View>

            {/* Bottom Primary CTA */}
            <View style={styles.bottomCtaRow}>
              {slide < SLIDES.length - 1 ? (
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: colors.primary, flex: 1 }]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    const next = slide + 1;
                    setSlide(next);
                    slideRef.current?.scrollToIndex({ index: next, animated: true });
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Next →</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: colors.primary, flex: 1 }]}
                  onPress={handleStart}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Get Started ✨</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

      </Animated.View>
    </View>
  );
}

// ─── Visual Styles ───────────────────────────────────────────────────────────

const visualStyles = StyleSheet.create({
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 190,
    position: 'relative',
  },
  lampGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(232, 89, 58, 0.16)',
  },
  lampContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  lampCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(232, 89, 58, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(232, 89, 58, 0.3)',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    height: 190,
  },
  obDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8593A',
    shadowColor: '#E8593A',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    height: 190,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 30,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  categoryChipLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  bookOuter: {
    height: 195,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookWrap: {
    width: 145,
    height: 180,
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 4, height: 8 },
    elevation: 8,
  },
  bookSpine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 10,
    backgroundColor: '#B53D22',
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    zIndex: 2,
  },
  bookCover: {
    position: 'absolute',
    left: 8,
    top: 0,
    right: 6,
    bottom: 0,
    backgroundColor: '#E8593A',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bookMonth: {
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#FFFFFF',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  bookPattern: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookBrand: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.5,
  },
  bookPages: {
    position: 'absolute',
    right: 0,
    top: 6,
    bottom: 6,
    width: 6,
    backgroundColor: '#FAF5EE',
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    borderLeftWidth: 1,
    borderLeftColor: '#E0D8CC',
  },
});

// ─── Main Screen Styles ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24 },
  phaseCenter: { flex: 1, justifyContent: 'center', gap: 18 },
  phaseHeader: { gap: 8, alignItems: 'center' },
  phaseIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  backBtn: { alignSelf: 'flex-start', padding: 6, marginBottom: 4 },
  heading: { fontSize: 27, lineHeight: 34, textAlign: 'center', letterSpacing: -0.3 },
  sub: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21, textAlign: 'center' },

  presetWrap: { gap: 8, marginTop: 4 },
  presetTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8 },
  presetChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  presetChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
  },
  presetChipText: { fontSize: 12 },

  inputWrap: { gap: 8, marginTop: 4 },
  input: {
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1.5,
    textAlign: 'center',
    borderWidth: 1.5,
  },
  dynamicStatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  dynamicStatText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  error: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center' },

  btn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  btnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 12 },
  chip: {
    width: 62,
    height: 62,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  chipText: { fontSize: 20, fontFamily: 'Inter_600SemiBold' },
  recallFeedbackCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6,
  },
  recallFeedbackText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    lineHeight: 19,
    textAlign: 'center',
  },

  /* Phase 2: Life in Weeks Full Screen Composition */
  lifeFullContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  lifeHeader: {
    gap: 4,
    alignItems: 'center',
  },
  headingLife: {
    fontSize: 24,
    lineHeight: 30,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  subLife: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  tapestryFrame: {
    alignSelf: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tapestryTopAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    marginBottom: 6,
  },
  axisText: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.4,
  },
  tapestryBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ageMilestonesCol: {
    height: 320,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingVertical: 2,
  },
  gridCanvasWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBanner: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    alignItems: 'center',
  },
  statBannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statBannerTitle: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  statBannerSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  lifeBottomAction: {
    width: '100%',
  },

  /* Phase 3: Carousel */
  carouselContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
  },
  circleBackBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  stepPillText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
  },
  skipPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  skipPillText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  visualStage: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typographyStage: {
    alignItems: 'center',
  },
  slideCard: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 6,
  },
  slideTitle: {
    fontSize: 27,
    lineHeight: 34,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  slideBody: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 23,
    textAlign: 'center',
  },
  pipsRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  pipDot: {
    height: 6,
    borderRadius: 3,
  },
  bottomCtaRow: {
    width: '100%',
  },
});
