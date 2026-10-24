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
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const { width: SW } = Dimensions.get('window');

const SLIDES = [
  {
    title: 'Life is short.',
    body: 'The moments that matter most are the ones you almost forgot.',
    visual: 'lamp',
  },
  {
    title: 'Every night,\nchoose 4.',
    body: "Not because the rest don't count — but because some things deserve to be remembered.",
    visual: 'dots',
  },
  {
    title: 'Not just\nthe good days.',
    body: 'Hard days, small victories, twisted ankles. Every moment belongs.',
    visual: 'icons',
  },
  {
    title: 'Every month\nbecomes a book.',
    body: 'A real, physical record you can hold, share, or print.',
    visual: 'book',
  },
];

const CATEGORY_CHIPS = [
  { icon: 'cafe-outline' as const, color: '#C47B3A', label: 'Coffee' },
  { icon: 'pulse-outline' as const, color: '#E8593A', label: 'Health' },
  { icon: 'heart-outline' as const, color: '#E83A7A', label: 'Love' },
  { icon: 'airplane-outline' as const, color: '#3A7EC4', label: 'Travel' },
  { icon: 'book-outline' as const, color: '#C43A6F', label: 'Learn' },
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
      {/* Amber radial aura */}
      <View style={visualStyles.lampGlow} />
      <Animated.View style={[visualStyles.lampContainer, animatedStyle]}>
        <View style={visualStyles.lampCircle}>
          <Ionicons name="bulb-outline" size={68} color="#E8593A" />
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
      {CATEGORY_CHIPS.map((chip, i) => (
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
          <Ionicons name={chip.icon} size={22} color={chip.color} />
          <Text style={[visualStyles.categoryChipLabel, { color: chip.color }]}>
            {chip.label}
          </Text>
        </View>
      ))}
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
        {/* Book spine highlight */}
        <View style={visualStyles.bookSpine} />

        {/* Book Cover */}
        <View style={visualStyles.bookCover}>
          <Text style={visualStyles.bookMonth}>July 2026</Text>
          <View style={visualStyles.bookPattern}>
            <Ionicons name="cafe-outline" size={18} color="rgba(255,255,255,0.9)" />
            <Ionicons name="airplane-outline" size={18} color="rgba(255,255,255,0.9)" />
            <Ionicons name="heart-outline" size={18} color="rgba(255,255,255,0.9)" />
            <Ionicons name="book-outline" size={18} color="rgba(255,255,255,0.9)" />
          </View>
          <Text style={visualStyles.bookBrand}>DEAR DAY</Text>
        </View>

        {/* Book paper pages on the side */}
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

// ─── Main Onboarding Screen ──────────────────────────────────────────────────

export default function OnboardingScreen() {
  const { completeOnboarding } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [phase, setPhase] = useState(0);
  const [dob, setDob] = useState('');
  const [dobError, setDobError] = useState('');
  const [recalledDays, setRecalledDays] = useState<number | null>(null);
  const [livedWeeks, setLivedWeeks] = useState(0);
  const [slide, setSlide] = useState(0);
  const slideRef = useRef<FlatList>(null);

  const fadeVal = useSharedValue(1);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: fadeVal.value }));

  function transition(next: number) {
    fadeVal.value = withTiming(0, { duration: 180 }, () => {
      fadeVal.value = withTiming(1, { duration: 280 });
    });
    setTimeout(() => setPhase(next), 180);
  }

  function parseDob(s: string): Date | null {
    const clean = s.replace(/\//g, '-');
    const d = new Date(clean + 'T12:00:00');
    if (isNaN(d.getTime())) return null;
    if (d.getFullYear() < 1900 || d > new Date()) return null;
    return d;
  }

  function handleDobContinue() {
    const date = parseDob(dob);
    if (!date) {
      setDobError('Enter a valid date (YYYY-MM-DD)');
      return;
    }
    const weeks = Math.floor((Date.now() - date.getTime()) / (7 * 24 * 60 * 60 * 1000));
    setLivedWeeks(Math.min(weeks, 4160));
    setDobError('');
    transition(1);
  }

  function handleRecall(n: number) {
    Haptics.selectionAsync();
    setRecalledDays(n);
  }

  async function handleStart() {
    await completeOnboarding();
    router.replace('/auth');
  }

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const botPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topPad, paddingBottom: botPad }]}>
      <Animated.View style={[styles.content, fadeStyle]}>

        {/* Phase 0 — DOB */}
        {phase === 0 && (
          <View style={styles.phase}>
            <Text style={[styles.heading, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
              When were you born?
            </Text>
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>
              We'll show you something honest about time.
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.muted,
                  color: colors.foreground,
                  borderColor: dobError ? colors.destructive : colors.border,
                },
              ]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.tertiary}
              value={dob}
              onChangeText={(t) => {
                setDob(t);
                setDobError('');
              }}
              keyboardType="numeric"
              maxLength={10}
              autoFocus
            />
            {!!dobError && <Text style={[styles.error, { color: colors.destructive }]}>{dobError}</Text>}
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.primary, opacity: dob.length < 8 ? 0.5 : 1 }]}
              onPress={handleDobContinue}
              disabled={dob.length < 8}
            >
              <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Phase 1 — Recalled days */}
        {phase === 1 && (
          <View style={styles.phase}>
            <TouchableOpacity onPress={() => transition(0)} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.heading, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
              How many days do you remember from last week?
            </Text>
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>Be honest.</Text>
            <View style={styles.chips}>
              {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
                <TouchableOpacity
                  key={n}
                  onPress={() => handleRecall(n)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: recalledDays === n ? colors.primary : colors.muted,
                      borderColor: recalledDays === n ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: recalledDays === n ? colors.primaryForeground : colors.foreground }]}>
                    {n}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {recalledDays !== null && (
              <Text style={[styles.sub, { color: colors.mutedForeground, marginTop: 8 }]}>
                {recalledDays <= 2
                  ? "That's honest. Most people can't either."
                  : recalledDays <= 4
                  ? 'Better than average. Still a lot that faded.'
                  : "That's exceptional. Dear Day will make it permanent."}
              </Text>
            )}
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.primary, opacity: recalledDays === null ? 0.4 : 1, marginTop: 24 }]}
              onPress={() => transition(2)}
              disabled={recalledDays === null}
            >
              <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Show me</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Phase 2 — Life viz */}
        {phase === 2 && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.lifePhase}>
            <Text style={[styles.heading, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
              Your life in weeks
            </Text>
            <Text style={[styles.sub, { color: colors.mutedForeground, textAlign: 'center' }]}>
              An 80-year life has 4,160 weeks. The warm ones are already behind you.
            </Text>
            <View style={styles.gridWrap}>
              <LifeGrid livedWeeks={livedWeeks} />
            </View>
            <View style={styles.revealStats}>
              <Text style={[styles.revealText, { color: colors.foreground }]}>
                You've already lived <Text style={{ color: colors.accent, fontWeight: '700' }}>{livedWeeks}</Text> weeks.
              </Text>
              <Text style={[styles.revealSub, { color: colors.mutedForeground }]}>
                How many of them do you remember?
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.primary, width: '100%', paddingHorizontal: 24 }]}
              onPress={() => transition(3)}
            >
              <Text style={[styles.btnText, { color: colors.primaryForeground }]}>
                Enter Dear Day →
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* Phase 3 — Visual Carousel */}
        {phase === 3 && (
          <View style={styles.carousel}>
            {/* Top row skip */}
            <View style={styles.topBar}>
              <View style={{ flex: 1 }} />
              <TouchableOpacity onPress={handleStart} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={[styles.skip, { color: colors.tertiary }]}>Skip</Text>
              </TouchableOpacity>
            </View>

            {/* Visual Zone for current slide */}
            <View style={styles.visualZone}>
              {slide === 0 && <LampVisual />}
              {slide === 1 && <DotsVisual />}
              {slide === 2 && <CategoryChipsVisual />}
              {slide === 3 && <BookVisual />}
            </View>

            {/* Carousel Content */}
            <FlatList
              ref={slideRef}
              data={SLIDES}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              scrollEnabled={false}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item }) => (
                <View style={[styles.slide, { width: SW - 56 }]}>
                  <Text style={[styles.slideTitle, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.slideBody, { color: colors.mutedForeground }]}>{item.body}</Text>
                </View>
              )}
            />

            {/* Dots */}
            <View style={styles.pips}>
              {SLIDES.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.pip,
                    {
                      backgroundColor: i === slide ? colors.primary : colors.border,
                      width: i === slide ? 20 : 6,
                    },
                  ]}
                />
              ))}
            </View>

            {/* Bottom Navigation */}
            <View style={styles.slideNav}>
              {slide < SLIDES.length - 1 ? (
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: colors.primary, flex: 1 }]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    const next = slide + 1;
                    setSlide(next);
                    slideRef.current?.scrollToIndex({ index: next, animated: true });
                  }}
                >
                  <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Next</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: colors.primary, flex: 1 }]}
                  onPress={handleStart}
                >
                  <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Get Started</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const visualStyles = StyleSheet.create({
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
    position: 'relative',
  },
  lampGlow: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(232, 89, 58, 0.15)',
  },
  lampContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  lampCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(232, 89, 58, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(232, 89, 58, 0.25)',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    height: 180,
  },
  obDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8593A',
    shadowColor: '#E8593A',
    shadowOpacity: 0.4,
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
    height: 180,
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
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookWrap: {
    width: 145,
    height: 180,
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.35,
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

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 28 },
  phase: { flex: 1, justifyContent: 'center', gap: 16 },
  backBtn: { marginBottom: 12 },
  heading: { fontSize: 28, lineHeight: 36, letterSpacing: 0.2 },
  sub: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 22 },
  input: {
    height: 52, borderRadius: 12, paddingHorizontal: 16,
    fontSize: 17, fontFamily: 'Inter_400Regular',
    borderWidth: 1, marginTop: 8,
  },
  error: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  btn: {
    height: 52, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 8,
  },
  btnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  chip: {
    width: 56, height: 56, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  chipText: { fontSize: 20, fontFamily: 'Inter_600SemiBold' },
  lifePhase: { alignItems: 'center', paddingVertical: 20, gap: 16 },
  gridWrap: { alignItems: 'center', marginVertical: 8 },
  revealStats: { alignItems: 'center', gap: 6, marginVertical: 4 },
  revealText: { fontSize: 17, fontFamily: 'Inter_500Medium' },
  revealSub: { fontSize: 15, fontFamily: 'Inter_400Regular' },

  /* Carousel */
  carousel: { flex: 1, justifyContent: 'space-between', paddingBottom: 16 },
  topBar: { height: 40, flexDirection: 'row', alignItems: 'center' },
  visualZone: { height: 200, justifyContent: 'center', alignItems: 'center' },
  slide: { gap: 12, paddingHorizontal: 4 },
  slideTitle: { fontSize: 28, letterSpacing: 0.2, lineHeight: 36 },
  slideBody: { fontSize: 16, fontFamily: 'Inter_400Regular', lineHeight: 24 },
  pips: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginVertical: 12 },
  pip: { height: 6, borderRadius: 3 },
  slideNav: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  skip: { fontSize: 15, fontFamily: 'Inter_500Medium', padding: 4 },
});
