import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, FlatList, Dimensions, Platform, useWindowDimensions, Image,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import Svg, { Rect, Line, Circle, Text as SvgText } from 'react-native-svg';
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
  Images,
} from 'phosphor-react-native';
import { router } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { BrandLogoIcon } from '@/components/BrandLogo';

const SLIDES = [
  {
    title: 'Remember turning real\npages in photoalbums?',
    body: 'Heavy paper. Sleeve pockets. Sitting on the rug, holding memories that actually felt tangible.',
    visual: 'album',
  },
  {
    title: '10,000 photos.\nZero memories.',
    body: 'Buried in endless camera rolls and screenshots. When everything is captured, nothing is felt.',
    visual: 'dots',
  },
  {
    title: 'Every night,\ntuck 4 into paper.',
    body: 'Four moments before bed. A warm cup, a laugh, a quiet walk. The real fragments of today.',
    visual: 'icons',
  },
  {
    title: 'A living album,\nbound for life.',
    body: 'Each month seals into a clothbound volume. A physical legacy you can flip through forever.',
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

// ─── Slide 0: Authentic Live Photobook Spread with 3D Page Turning ──────────

const ONBOARDING_BOOK_PAGES = [
  {
    dateStr: 'FRIDAY • OCT 24, 2026',
    fraction: '24 / 31',
    headline: 'Autumn Solitude in Kyoto ✎',
    prevBtn: '‹ Cover',
    nextBtn: 'Oct 25 ›',
    photos: [
      { url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=400&q=80', caption: 'Morning matcha' },
      { url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&q=80', caption: 'Cherry petals' },
      { url: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&q=80', caption: 'Handmade soba' },
      { url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&q=80', caption: 'Lantern dusk' },
    ],
  },
  {
    dateStr: 'SATURDAY • OCT 25, 2026',
    fraction: '25 / 31',
    headline: 'Bamboo Groves & Moss Gardens ✎',
    prevBtn: '‹ Oct 24',
    nextBtn: 'Oct 26 ›',
    photos: [
      { url: 'https://images.unsplash.com/photo-1478436127897-769e00d0c715?w=400&q=80', caption: 'Bamboo light' },
      { url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80', caption: 'Temple moss' },
      { url: 'https://images.unsplash.com/photo-1492571350019-22de08371fd3?w=400&q=80', caption: 'Red bridge' },
      { url: 'https://images.unsplash.com/photo-1493780474015-ba834fd0ce2f?w=400&q=80', caption: 'Evening bells' },
    ],
  },
  {
    dateStr: 'SUNDAY • OCT 26, 2026',
    fraction: '26 / 31',
    headline: 'Old Paper & Woodcut Prints ✎',
    prevBtn: '‹ Oct 25',
    nextBtn: 'Oct 27 ›',
    photos: [
      { url: 'https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=400&q=80', caption: 'Ink stones' },
      { url: 'https://images.unsplash.com/photo-1492571350019-22de08371fd3?w=400&q=80', caption: 'Wooden arches' },
      { url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&q=80', caption: 'River dusk' },
      { url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&q=80', caption: 'Night market' },
    ],
  },
];

const ONBOARDING_WASHI_TAPE = require('@/assets/stickers/tape_1.png');

function renderOnboardingSpread(page: typeof ONBOARDING_BOOK_PAGES[0]) {
  return (
    <View style={visualStyles.livePageInnerContent}>
      {/* Top Header Row */}
      <View style={visualStyles.livePageHeaderRow}>
        <Text style={visualStyles.livePageDateText}>{page.dateStr}</Text>
        <Text style={visualStyles.livePageFractionText}>{page.fraction}</Text>
      </View>

      <Text style={visualStyles.livePageHeadlineText} numberOfLines={1}>
        {page.headline}
      </Text>

      {/* 2x2 Recessed Photo Pockets Grid */}
      <View style={visualStyles.livePage2x2Grid}>
        {page.photos.map((item, i) => (
          <View key={`photo-${i}`} style={visualStyles.livePolaroidPocket}>
            {i === 0 && (
              <Image
                source={ONBOARDING_WASHI_TAPE}
                style={visualStyles.livePageWashiTape}
                resizeMode="contain"
              />
            )}
            <Image source={{ uri: item.url }} style={visualStyles.livePocketPhoto} resizeMode="cover" />
            <View style={visualStyles.livePocketChin}>
              <Text style={visualStyles.livePocketChinText} numberOfLines={1}>
                {item.caption}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Bottom Page Navigation Footer */}
      <View style={visualStyles.livePageFooterRow}>
        <View style={visualStyles.livePageNavPill}>
          <Text style={visualStyles.livePageFooterText}>{page.prevBtn}</Text>
        </View>
        <View style={visualStyles.livePageNavPill}>
          <Text style={visualStyles.livePageFooterText}>{page.nextBtn}</Text>
        </View>
      </View>

      {/* Left Spine Gutter Gradient Shadow */}
      <View style={visualStyles.liveSpineGutterShadow} pointerEvents="none" />
    </View>
  );
}

function MiniPhotobookOpeningVisual() {
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flippingPageIdx, setFlippingPageIdx] = useState(0);
  const nativeFlipAnim = useSharedValue(0);

  // Snappy, continuous forward page turning cycle
  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      setFlippingPageIdx(current);
      setIsFlipping(true);
      nativeFlipAnim.value = 0;
      nativeFlipAnim.value = withTiming(-180, { duration: 580, easing: Easing.bezier(0.26, 0.92, 0.38, 1) });

      setTimeout(() => {
        setIsFlipping(false);
        current = (current + 1) % ONBOARDING_BOOK_PAGES.length;
        setCurrentPageIdx(current);
      }, 620);
    }, 1450);

    return () => clearInterval(interval);
  }, []);

  const nextPageIdx = (flippingPageIdx + 1) % ONBOARDING_BOOK_PAGES.length;

  const nativeLeafStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1400 },
      { rotateY: `${nativeFlipAnim.value}deg` },
    ],
    opacity: nativeFlipAnim.value < -90 ? 0 : 1,
  }));

  return (
    <View style={visualStyles.liveBookCenter}>
      {/* Embedded CSS Keyframe for mature 3D page curl matching homepage */}
      {Platform.OS === 'web' && (
        <style>{`
          @keyframes onbRealisticCurlForward {
            0% {
              transform: perspective(1600px) rotateY(0deg) skewY(0deg);
              box-shadow: -4px 0 12px rgba(0,0,0,0.10);
              opacity: 1;
            }
            42% {
              transform: perspective(1600px) rotateY(-78deg) skewY(-4.5deg) scaleX(0.96);
              box-shadow: -22px 10px 28px rgba(25, 18, 12, 0.30);
              opacity: 1;
            }
            78% {
              transform: perspective(1600px) rotateY(-148deg) skewY(-2deg) scaleX(0.98);
              box-shadow: -12px 5px 16px rgba(25, 18, 12, 0.16);
              opacity: 0.92;
            }
            100% {
              transform: perspective(1600px) rotateY(-180deg) skewY(0deg);
              box-shadow: -2px 0 6px rgba(0,0,0,0.04);
              opacity: 0;
            }
          }
        `}</style>
      )}

      {/* Tabletop Ambient Shadow */}
      <View style={visualStyles.liveBookDropShadow} />

      {/* Main Archival Book Stage with Terracotta Linen Hardcover */}
      <View style={visualStyles.liveBookStage}>
        {/* Left Hardcover Spine with stitched debossed hinge */}
        <View style={visualStyles.liveBookSpine}>
          <View style={visualStyles.liveBookSpineStitch} />
        </View>

        {/* Stacked Paper Page Edges on Right & Bottom */}
        <View style={visualStyles.liveBookRightEdge} />
        <View style={visualStyles.liveBookBottomEdge} />

        {/* UNDERLYING SPREAD (Next page waiting smoothly) */}
        <View style={visualStyles.livePageSpread}>
          {renderOnboardingSpread(ONBOARDING_BOOK_PAGES[isFlipping ? nextPageIdx : currentPageIdx])}
        </View>

        {/* TOP FLIPPING LEAF (Curls forward in continuous loop) */}
        {isFlipping && (
          Platform.OS === 'web' ? (
            <div
              style={{
                position: 'absolute',
                left: 16,
                right: 6,
                top: 6,
                bottom: 6,
                backgroundColor: '#FAF7EE',
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: '#E2D9C8',
                borderTopRightRadius: 8,
                borderBottomRightRadius: 8,
                borderTopLeftRadius: 2,
                borderBottomLeftRadius: 2,
                overflow: 'hidden',
                zIndex: 100,
                transformOrigin: 'left center',
                transformStyle: 'preserve-3d',
                animation: 'onbRealisticCurlForward 1.25s cubic-bezier(0.26, 0.92, 0.38, 1) forwards',
              }}
            >
              {renderOnboardingSpread(ONBOARDING_BOOK_PAGES[flippingPageIdx])}
              {/* Specular Paper Sheen Gradient */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  background: 'linear-gradient(112deg, transparent 0%, rgba(255,255,255,0.60) 38%, rgba(225,216,202,0.85) 54%, rgba(40,30,20,0.22) 68%, transparent 85%)',
                }}
              />
            </div>
          ) : (
            <Animated.View style={[visualStyles.livePageSpread, visualStyles.flippingPageLeaf, nativeLeafStyle]}>
              {renderOnboardingSpread(ONBOARDING_BOOK_PAGES[flippingPageIdx])}
            </Animated.View>
          )
        )}
      </View>
    </View>
  );
}

// ─── Slide 1: Half-Cut Smartphone with Endless Scrolling Photo Gallery ──────

const DUMMY_PHOTOS = [
  { id: '1', bg: '#DF5739' },
  { id: '2', bg: '#C8462A' },
  { id: '3', bg: '#E86A4E' },
  { id: '4', bg: '#F28C72' },
  { id: '5', bg: '#D45335' },
  { id: '6', bg: '#B53D23' },
  { id: '7', bg: '#EB7D63' },
  { id: '8', bg: '#FA9E88' },
  { id: '9', bg: '#A6341B' },
  { id: '10', bg: '#E56749' },
  { id: '11', bg: '#F07A5E' },
  { id: '12', bg: '#D95232' },
  { id: '13', bg: '#BE4124' },
  { id: '14', bg: '#F69982' },
  { id: '15', bg: '#DF5739' },
  { id: '16', bg: '#C8462A' },
  { id: '17', bg: '#E86A4E' },
  { id: '18', bg: '#F28C72' },
];

function ScrollingPhoneGalleryVisual() {
  const scrollAnim = useSharedValue(0);

  useEffect(() => {
    scrollAnim.value = withRepeat(
      withTiming(-210, { duration: 2400, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const galleryStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scrollAnim.value }],
  }));

  return (
    <View style={visualStyles.phoneChassisCenter}>
      <View style={visualStyles.phoneBodyFrame}>
        {/* Dynamic Island Notch & Status Bar */}
        <View style={visualStyles.phoneTopBar}>
          <Text style={visualStyles.phoneClock}>9:41</Text>
          <View style={visualStyles.phoneDynamicIsland} />
          <View style={visualStyles.phoneBatteryIcon}>
            <View style={visualStyles.phoneBatteryLevel} />
          </View>
        </View>

        {/* Gallery Header */}
        <View style={visualStyles.phoneGalleryHeader}>
          <Text style={visualStyles.phoneGalleryTitle}>All Photos</Text>
          <Text style={visualStyles.phoneGalleryCount}>10,482 items</Text>
        </View>

        {/* Endless Scrolling 3-Column Grid */}
        <View style={visualStyles.phoneScreenViewport}>
          <Animated.View style={[visualStyles.phoneGridTrack, galleryStyle]}>
            {DUMMY_PHOTOS.concat(DUMMY_PHOTOS).map((item, idx) => (
              <View
                key={`${item.id}-${idx}`}
                style={[visualStyles.phonePhotoThumb, { backgroundColor: item.bg }]}
              >
                <View style={visualStyles.phonePhotoOverlay} />
              </View>
            ))}
          </Animated.View>

          <View style={visualStyles.phoneCutoffFade} />
        </View>
      </View>
    </View>
  );
}

// ─── Slide 2: Real Photos Placed by Animated Hand + Confetti Burst ───────────

const MOCK_FOUR_PHOTOS = [
  {
    id: 0,
    url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=400&q=80',
    title: 'Morning matcha',
  },
  {
    id: 1,
    url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&q=80',
    title: 'Cherry petals',
  },
  {
    id: 2,
    url: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&q=80',
    title: 'Handmade soba',
  },
  {
    id: 3,
    url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&q=80',
    title: 'Lantern dusk',
  },
];

const HAND_PLACING_ASSET = require('@/assets/images/hand_placing.png');

function MiniHandPlacement() {
  return (
    <View style={{ width: 72, height: 128, transform: [{ rotate: '-12deg' }] }}>
      <Image
        source={HAND_PLACING_ASSET}
        style={{
          width: '100%',
          height: '100%',
          shadowColor: '#1C140E',
          shadowOffset: { width: -3, height: 6 },
          shadowOpacity: 0.35,
          shadowRadius: 8,
        }}
        resizeMode="contain"
      />
    </View>
  );
}

function TuckFourPhotosVisual() {
  const [activeSlot, setActiveSlot] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const handX = useSharedValue(70);
  const handY = useSharedValue(70);
  const handOpacity = useSharedValue(0);

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      if (current < 4) {
        const slotTargets = [
          { x: -55, y: -45 },
          { x: 55, y: -45 },
          { x: -55, y: 45 },
          { x: 55, y: 45 },
        ];
        const target = slotTargets[current];

        handX.value = target.x + 30;
        handY.value = target.y + 30;
        handOpacity.value = withTiming(1, { duration: 120 });

        handX.value = withTiming(target.x, { duration: 260, easing: Easing.out(Easing.cubic) });
        handY.value = withTiming(target.y, { duration: 260, easing: Easing.out(Easing.cubic) });

        setTimeout(() => {
          handOpacity.value = withTiming(0, { duration: 140 });
          setActiveSlot(current + 1);
          current++;

          if (current === 4) {
            setTimeout(() => {
              setShowConfetti(true);
            }, 180);

            setTimeout(() => {
              setShowConfetti(false);
              setActiveSlot(0);
              current = 0;
            }, 1400);
          }
        }, 300);
      }
    }, 620);

    return () => clearInterval(interval);
  }, []);

  const handStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: handX.value }, { translateY: handY.value }],
    opacity: handOpacity.value,
  }));

  return (
    <View style={visualStyles.tuckCenter}>
      <View style={visualStyles.tuckPageCard}>
        {/* Subtle Page Header */}
        <View style={visualStyles.tuckHeaderRow}>
          <Text style={visualStyles.tuckHeaderTitle}>DAILY SELECTION • 4 SLOTS</Text>
          <Text style={visualStyles.tuckHeaderCount}>{activeSlot}/4 TUCKED</Text>
        </View>

        <View style={visualStyles.tuckGrid}>
          {MOCK_FOUR_PHOTOS.map((item, idx) => {
            const isPlaced = idx < activeSlot;
            return (
              <View key={item.id} style={visualStyles.tuckSlot}>
                {isPlaced ? (
                  <View style={visualStyles.tuckPlacedPhoto}>
                    <Image source={{ uri: item.url }} style={visualStyles.tuckPhotoImg} resizeMode="cover" />
                    <View style={visualStyles.tuckPolaroidChin}>
                      <Text style={visualStyles.tuckChinText} numberOfLines={1}>
                        {item.title}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={visualStyles.tuckEmptySlot}>
                    <Images size={18} color="#C4B8A6" weight="duotone" />
                    <Text style={visualStyles.tuckEmptySlotLabel}>Slot {idx + 1}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <Animated.View style={[visualStyles.tuckHandContainer, handStyle]}>
          <MiniHandPlacement />
        </Animated.View>

        {showConfetti && (
          <View style={visualStyles.miniConfettiOverlay} pointerEvents="none">
            {[
              { x: -65, y: -45, c: '#DF5739', r: 5 },
              { x: 50, y: -55, c: '#F2C97D', r: 6 },
              { x: -30, y: 35, c: '#C8462A', r: 5 },
              { x: 55, y: 40, c: '#E86A4E', r: 6 },
              { x: 0, y: -65, c: '#2B2420', r: 4 },
              { x: -68, y: 15, c: '#DF5739', r: 5 },
              { x: 68, y: -15, c: '#EB7D63', r: 5 },
              { x: 22, y: 60, c: '#F2C97D', r: 6 },
            ].map((p, i) => (
              <View
                key={i}
                style={[
                  visualStyles.confettiDot,
                  {
                    transform: [{ translateX: p.x }, { translateY: p.y }],
                    backgroundColor: p.c,
                    width: p.r,
                    height: p.r,
                    borderRadius: p.r / 2,
                  },
                ]}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Slide 3: Reverse Closing Photobook into 3D Tilting Cover with Titles ───

const RANDOM_TITLES = [
  'Summer in Kyoto',
  'Volume 2026',
  'The Golden Year',
  'Autumn in New York',
  'Everyday Moments',
];

function ClosingBookCoverTiltVisual() {
  const [titleIdx, setTitleIdx] = useState(0);
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);

  useEffect(() => {
    tiltX.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(6, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true
    );
    tiltY.value = withRepeat(
      withSequence(
        withTiming(10, { duration: 2600, easing: Easing.inOut(Easing.ease) }),
        withTiming(-8, { duration: 2600, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true
    );

    const titleInterval = setInterval(() => {
      setTitleIdx((prev) => (prev + 1) % RANDOM_TITLES.length);
    }, 3200);

    return () => clearInterval(titleInterval);
  }, []);

  const animatedBookStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { perspective: 850 },
        { rotateX: `${tiltX.value}deg` },
        { rotateY: `${tiltY.value}deg` },
        { scale: 1.02 },
      ],
    };
  });

  return (
    <View style={visualStyles.bookTiltCenter}>
      <Animated.View style={[visualStyles.tiltedCoverWrap, animatedBookStyle]}>
        <View style={visualStyles.tiltedSpine} />

        <View style={visualStyles.tiltedCoverSurface}>
          <Text style={visualStyles.tiltedCoverHeader}>HEIRLOOM EDITION • 2026</Text>

          <View style={visualStyles.tiltedInsetCard}>
            <View style={visualStyles.tiltedPhotoWindow}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=600&q=80' }}
                style={visualStyles.tiltedPhotoInner}
                resizeMode="cover"
              />
            </View>
            <Text style={visualStyles.tiltedBookTitle} numberOfLines={1}>
              {RANDOM_TITLES[titleIdx]}
            </Text>
            <View style={{ width: 26, height: 2, backgroundColor: '#DF5739', marginTop: 3 }} />
          </View>

          <Text style={visualStyles.tiltedCoverBrand}>DEAR DAY</Text>
        </View>

        <View style={visualStyles.tiltedPageEdge} />
      </Animated.View>
    </View>
  );
}

// ─── Life Grid (80 Years = 4,160 Weeks) Expansive Tapestry ───────────────────

function LifeGridExpansive({ livedWeeks, currentAge }: { livedWeeks: number; currentAge: number | null }) {
  const colors = useColors();
  const isDark = colors.foreground === '#FFFFFF' || colors.background === '#181412';
  const { width: rawWidth } = useWindowDimensions();
  const containerW = Math.min(rawWidth - 48, 372);
  const leftLabelW = 22;
  const gridW = containerW - leftLabelW - 12;
  const cols = 52;
  const rows = 80;
  const colStep = gridW / cols;
  const dotSize = Math.max(2.5, colStep - 1.8);
  const rowStep = dotSize + 2.0;
  const totalSvgH = rows * rowStep + 16;

  const currentWkIdx = Math.max(0, Math.min(4159, livedWeeks - 1));
  const currentRow = Math.floor(currentWkIdx / cols);

  const rects = [];
  for (let i = 0; i < rows * cols; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const isLived = i < livedWeeks;
    const isCurrent = i === currentWkIdx;
    const x = leftLabelW + col * colStep;
    const y = 8 + row * rowStep;

    rects.push(
      <Rect
        key={`d-${i}`}
        x={x}
        y={y}
        width={dotSize}
        height={dotSize}
        rx={0.8}
        fill={
          isCurrent
            ? '#DF5739'
            : isLived
            ? '#E06548'
            : isDark
            ? '#332A24'
            : '#E8E2D8'
        }
      />
    );
  }

  // Milestone Age Labels down the left
  const ageLabels = [];
  for (let r = 0; r <= 80; r += 10) {
    const y = 8 + r * rowStep + dotSize - 0.5;
    ageLabels.push(
      <SvgText
        key={`lbl-${r}`}
        x={0}
        y={y}
        fontSize="8"
        fontFamily="Inter_600SemiBold"
        fill={colors.tertiary}
      >
        {r}y
      </SvgText>
    );
  }

  return (
    <View style={[visualStyles.gridStageWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Top Legend Bar */}
      <View style={visualStyles.gridHeaderPill}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#DF5739' }} />
          <Text style={[visualStyles.gridLegendText, { color: colors.foreground }]}>
            {livedWeeks.toLocaleString()} lived
          </Text>
        </View>
        <Text style={{ color: colors.tertiary, fontSize: 11 }}>•</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isDark ? '#332A24' : '#E8E2D8' }} />
          <Text style={[visualStyles.gridLegendText, { color: colors.mutedForeground }]}>
            {Math.max(0, 4160 - livedWeeks).toLocaleString()} unwritten
          </Text>
        </View>
      </View>

      {/* Scrollable Dots Canvas */}
      <ScrollView
        style={{ maxHeight: 270 }}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        <Svg width={containerW - 12} height={totalSvgH}>
          {currentAge !== null && (
            <Line
              x1={leftLabelW}
              y1={8 + currentRow * rowStep + dotSize / 2}
              x2={leftLabelW + gridW}
              y2={8 + currentRow * rowStep + dotSize / 2}
              stroke="#DF5739"
              strokeWidth="1"
              strokeDasharray="2,2"
              opacity={0.65}
            />
          )}

          {ageLabels}
          {rects}

          {/* Current Week Beacon Indicator */}
          <Circle
            cx={leftLabelW + (currentWkIdx % cols) * colStep + dotSize / 2}
            cy={8 + currentRow * rowStep + dotSize / 2}
            r={dotSize + 2.5}
            fill="none"
            stroke="#DF5739"
            strokeWidth="1.5"
            opacity={0.9}
          />
        </Svg>
      </ScrollView>

      {/* Landmark Badge at bottom of canvas */}
      <View style={[visualStyles.gridFootnote, { borderTopColor: colors.border }]}>
        <Sparkle size={13} color="#DF5739" weight="fill" />
        <Text style={[visualStyles.gridFootnoteText, { color: colors.foreground }]}>
          You are at <Text style={{ fontFamily: 'Inter_700Bold', color: '#DF5739' }}>Age {currentAge ?? Math.floor(livedWeeks / 52)}</Text> • Week {livedWeeks.toLocaleString()}
        </Text>
      </View>
    </View>
  );
}

// ─── Indian Setup Smart DOB Masking (DD/MM/YYYY) & Calculation Helpers ─────

function formatDobInput(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length <= 2) {
    return digits;
  } else if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  } else {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  }
}

function parseDobDate(s: string): Date | null {
  if (!s || s.length < 8) return null;
  const clean = s.replace(/[.-]/g, '/');
  const parts = clean.split('/');

  let day = 0;
  let month = 0;
  let year = 0;

  if (parts.length === 3) {
    // Primary Indian format: DD/MM/YYYY
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    year = parseInt(parts[2], 10);

    // Fallback if user typed YYYY/MM/DD
    if (parts[0].length === 4) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    }
  }

  if (!year || isNaN(year) || isNaN(month) || isNaN(day)) {
    return null;
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
  const { width: rawWidth } = useWindowDimensions();
  const SW = Math.min(rawWidth, 420);

  const [phase, setPhase] = useState(0);
  // Default predefined birth date: 01/01/2000 (Indian DD/MM/YYYY format)
  const [dob, setDob] = useState('01/01/2000');
  const [dobError, setDobError] = useState('');
  const [recalledDays, setRecalledDays] = useState<number | null>(null);
  const [livedWeeks, setLivedWeeks] = useState(1350);
  const [slide, setSlide] = useState(0);
  const [isRevealing, setIsRevealing] = useState(false);
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
      setDobError('Please enter a valid birth date (DD/MM/YYYY)');
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

  const renderTopNav = (canGoBack: boolean, onBack: () => void, stepText: string) => (
    <View style={styles.topNavRow}>
      {canGoBack ? (
        <TouchableOpacity
          onPress={onBack}
          style={[styles.circleBackBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.75}
        >
          <ArrowLeft size={16} color={colors.foreground} />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 34 }} />
      )}

      <View style={[styles.stepPill, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        <Text style={[styles.stepPillText, { color: colors.foreground }]}>{stepText}</Text>
      </View>

      <TouchableOpacity
        onPress={handleStart}
        style={[styles.skipPill, { backgroundColor: colors.muted, borderColor: colors.border }]}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        activeOpacity={0.7}
      >
        <Text style={[styles.skipPillText, { color: colors.mutedForeground }]}>Skip</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topPad, paddingBottom: botPad }]}>
      <Animated.View style={[styles.content, fadeStyle]}>

        {/* Phase 0 — Predefined & Smart DOB Input (Preview stats removed for anticipation) */}
        {phase === 0 && (
          <View style={styles.phaseScreenWrap}>
            {renderTopNav(false, () => {}, 'Step 1 of 4')}

            <View style={styles.phaseCenterBody}>
              <View style={styles.phaseHeader}>
                <View style={[styles.phaseIconCircle, { backgroundColor: colors.accentLight }]}>
                  <CalendarBlank size={32} color={colors.primary} weight="duotone" />
                </View>
                <Text style={[styles.heading, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
                  When were you born?
                </Text>
                <Text style={[styles.sub, { color: colors.mutedForeground }]}>
                  We'll use this to show you something.
                </Text>
              </View>

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
                  placeholder="DD / MM / YYYY"
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
                {!!dobError && <Text style={[styles.error, { color: colors.destructive }]}>{dobError}</Text>}
              </View>
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

        {/* Phase 1 — Clarified Recall Question with Consistent Top Nav & Layout */}
        {phase === 1 && (
          <View style={styles.phaseScreenWrap}>
            {renderTopNav(true, () => transition(0), 'Step 2 of 4')}

            <View style={styles.phaseCenterBody}>
              <View style={styles.phaseHeader}>
                <Text style={[styles.heading, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
                  How many days from last week can you actually picture?
                </Text>
                <Text style={[styles.sub, { color: colors.mutedForeground }]}>
                  Not just "I went to work" — but a distinct, vivid moment you'll still remember years from now.
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
                      ? "That's completely normal. Without an anchor, the brain erases routine days within 48 hours."
                      : recalledDays <= 4
                      ? "Better than average, but more than half of your week's memories have already dissolved."
                      : "Impressive recall! But without keeping, even your most vivid weeks fade over time."}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.btn,
                { backgroundColor: colors.primary, opacity: recalledDays === null || isRevealing ? 0.6 : 1, marginTop: 12 },
              ]}
              onPress={() => {
                if (recalledDays === null || isRevealing) return;
                setIsRevealing(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setTimeout(() => {
                  transition(2);
                  setIsRevealing(false);
                }, 200);
              }}
              disabled={recalledDays === null || isRevealing}
              activeOpacity={0.85}
            >
              {isRevealing ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <ActivityIndicator size="small" color={colors.primaryForeground} />
                  <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Calculating life in weeks...</Text>
                </View>
              ) : (
                <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Reveal My Life in Weeks →</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Phase 2 — Expansive, Revived Life Grid (4,160 Weeks) */}
        {phase === 2 && (
          <View style={styles.phaseScreenWrap}>
            {renderTopNav(true, () => transition(1), 'Step 3 of 4')}

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingVertical: 4 }}>
              <View style={styles.phaseHeader}>
                <Text style={[styles.heading, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
                  An 80-year life has 4,160 weeks.
                </Text>
                <Text style={[styles.sub, { color: colors.mutedForeground }]}>
                  You've already lived {livedWeeks.toLocaleString()}. How many do you actually remember?
                </Text>
              </View>

              {/* Expansive Tapestry Life Grid with Landmark Age Labels */}
              <LifeGridExpansive livedWeeks={livedWeeks} currentAge={currentAge} />

              {/* Precise Minimal FOMO Banner */}
              <View style={[styles.statBannerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Sparkle size={15} color="#DF5739" weight="fill" />
                  <Text style={[styles.statBannerTitle, { color: colors.foreground }]}>
                    You've lived <Text style={{ fontFamily: 'Inter_700Bold', color: '#DF5739' }}>{livedWeeks.toLocaleString()}</Text> weeks ({Math.round((livedWeeks / 4160) * 100)}%)
                  </Text>
                </View>
                <Text style={[styles.statBannerSub, { color: colors.mutedForeground }]}>
                  {Math.max(0, 4160 - livedWeeks).toLocaleString()} weeks remain to be written. Don't let them vanish.
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.primary, marginTop: 8 }]}
              onPress={() => transition(3)}
              activeOpacity={0.85}
            >
              <Text style={[styles.btnText, { color: colors.primaryForeground }]}>
                Continue →
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Phase 3 — Balanced Golden-Ratio Visual Carousel with Concise Emotional Copy */}
        {phase === 3 && (
          <View style={styles.carouselContainer}>
            {renderTopNav(
              true,
              () => {
                if (slide > 0) {
                  Haptics.selectionAsync();
                  const prev = slide - 1;
                  setSlide(prev);
                  slideRef.current?.scrollToIndex({ index: prev, animated: true });
                } else {
                  transition(2);
                }
              },
              `Step 4 of 4`
            )}

            {/* Centered Graphic Zone */}
            <View style={styles.visualStage}>
              {slide === 0 && <MiniPhotobookOpeningVisual />}
              {slide === 1 && <ScrollingPhoneGalleryVisual />}
              {slide === 2 && <TuckFourPhotosVisual />}
              {slide === 3 && <ClosingBookCoverTiltVisual />}
            </View>

            {/* Synchronized Typography Carousel */}
            <View style={[styles.typographyStage, { width: SW - 48, overflow: 'hidden' }]}>
              <FlatList
                ref={slideRef}
                data={SLIDES}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEnabled={false}
                style={{ width: SW - 48 }}
                keyExtractor={(_, i) => String(i)}
                getItemLayout={(_, index) => ({
                  length: SW - 48,
                  offset: (SW - 48) * index,
                  index,
                })}
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

            {/* Bottom Primary & Secondary CTAs */}
            <View style={[styles.bottomCtaRow, { paddingBottom: Math.max(insets.bottom, 16) }]}>
              {slide > 0 && (
                <TouchableOpacity
                  style={[
                    styles.prevBtn,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    const prev = slide - 1;
                    setSlide(prev);
                    slideRef.current?.scrollToIndex({ index: prev, animated: true });
                  }}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Previous slide"
                >
                  <Text style={[styles.prevBtnText, { color: colors.foreground }]}>← Back</Text>
                </TouchableOpacity>
              )}

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
                  accessibilityRole="button"
                  accessibilityLabel="Next slide"
                >
                  <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Next →</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: colors.primary, flex: 1 }]}
                  onPress={handleStart}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Get Started"
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

// ─── Visual Styles ───────────────────────────────────────────────────────────

const visualStyles = StyleSheet.create({
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 190,
    position: 'relative',
  },
  albumPageMock: {
    width: 220,
    height: 170,
    borderRadius: 12,
    backgroundColor: '#FDFBF7',
    borderWidth: 1.5,
    borderColor: '#E8E3D9',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  mockSpineStitch: {
    position: 'absolute',
    left: 8,
    top: 8,
    bottom: 8,
    width: 2,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#C4472A88',
  },
  mockCornerMount: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderColor: '#C4472A66',
    borderWidth: 1.5,
    borderRadius: 2,
  },
  polaroidCard: {
    width: 130,
    height: 145,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 7,
    borderWidth: 1,
    borderColor: '#E8E3D9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  polaroidPhotoArea: {
    width: '100%',
    height: 95,
    backgroundColor: 'rgba(232, 89, 58, 0.08)',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(232, 89, 58, 0.2)',
  },
  polaroidMetaStamp: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: '#C47B3A',
    letterSpacing: 1,
    marginTop: 4,
  },
  polaroidChin: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 4,
    gap: 4,
  },
  mockHandwriting1: {
    height: 3,
    backgroundColor: '#2C2A2644',
    borderRadius: 2,
    width: '80%',
  },
  mockHandwriting2: {
    height: 3,
    backgroundColor: '#2C2A2622',
    borderRadius: 2,
    width: '55%',
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
  gridStageWrap: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  gridHeaderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  gridLegendText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.2,
  },
  gridFootnote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  gridFootnoteText: {
    fontSize: 11.5,
    fontFamily: 'Inter_500Medium',
  },

  /* Slide 0: Live Photobook Spread with 3D Page Turn */
  liveBookCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 275,
    position: 'relative',
  },
  liveBookDropShadow: {
    position: 'absolute',
    bottom: 10,
    width: 300,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(25, 18, 12, 0.22)',
    filter: 'blur(10px)',
  },
  liveBookStage: {
    width: 304,
    height: 248,
    position: 'relative',
    backgroundColor: '#D68060', // Terracotta Linen Hardcover
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#B06145',
    shadowColor: '#1A140E',
    shadowOpacity: 0.30,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  liveBookSpine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 16,
    backgroundColor: '#B06145',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    zIndex: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveBookSpineStitch: {
    width: 2,
    height: '86%',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(255, 235, 205, 0.40)',
  },
  liveBookRightEdge: {
    position: 'absolute',
    right: 2,
    top: 8,
    bottom: 8,
    width: 4,
    backgroundColor: '#FAF5EE',
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    borderLeftWidth: 1,
    borderLeftColor: '#E2DACB',
  },
  liveBookBottomEdge: {
    position: 'absolute',
    bottom: 2,
    left: 16,
    right: 6,
    height: 4,
    backgroundColor: '#FAF5EE',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 3,
    borderTopWidth: 1,
    borderTopColor: '#E2DACB',
  },
  livePageSpread: {
    position: 'absolute',
    left: 16,
    right: 6,
    top: 6,
    bottom: 6,
    backgroundColor: '#FAF7EE',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: '#E2D9C8',
    overflow: 'hidden',
  },
  livePageInnerContent: {
    flex: 1,
    paddingHorizontal: 11,
    paddingTop: 9,
    paddingBottom: 7,
    justifyContent: 'space-between',
    position: 'relative',
  },
  flippingPageLeaf: {
    zIndex: 100,
  },
  liveSpineGutterShadow: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 22,
    backgroundColor: 'rgba(35, 25, 18, 0.08)',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: 'rgba(0,0,0,0.04)',
    pointerEvents: 'none',
  },
  livePageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 2,
    paddingLeft: 4,
  },
  livePageDateText: {
    fontSize: 8.5,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8,
    color: '#7A695B',
  },
  livePageFractionText: {
    fontSize: 8.5,
    fontFamily: 'Inter_700Bold',
    color: '#DF5739',
  },
  livePageHeadlineText: {
    fontSize: 11.5,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#2B2420',
    marginBottom: 4,
    paddingLeft: 4,
  },
  livePage2x2Grid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'space-between',
  },
  livePolaroidPocket: {
    width: '48.5%',
    height: 74,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
    padding: 3,
    borderWidth: 0.5,
    borderColor: '#DDD6C7',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
    position: 'relative',
  },
  livePageWashiTape: {
    position: 'absolute',
    top: -6,
    left: -4,
    width: 44,
    height: 15,
    transform: [{ rotate: '-8deg' }],
    zIndex: 15,
  },
  livePocketPhoto: {
    width: '100%',
    height: 50,
    borderRadius: 2,
    backgroundColor: '#F2EBE1',
  },
  livePocketChin: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  livePocketChinText: {
    fontSize: 8.5,
    fontFamily: 'Inter_500Medium',
    color: '#6B5E52',
  },
  livePageFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    paddingLeft: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EBE4D5',
  },
  livePageNavPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#F3EFE6',
    borderWidth: 0.5,
    borderColor: '#DFD8CA',
  },
  livePageFooterText: {
    fontSize: 7.5,
    fontFamily: 'Inter_600SemiBold',
    color: '#7A695B',
  },

  /* Slide 1: Half-Cut Smartphone Gallery */
  phoneChassisCenter: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: 275,
  },
  phoneBodyFrame: {
    width: 235,
    height: 265,
    backgroundColor: '#1E1916',
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 4.5,
    borderColor: '#38312B',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  phoneTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 6,
    backgroundColor: '#1E1916',
    zIndex: 20,
  },
  phoneClock: {
    fontSize: 9.5,
    fontFamily: 'Inter_700Bold',
    color: '#FAF6F0',
  },
  phoneDynamicIsland: {
    width: 58,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#000000',
  },
  phoneBatteryIcon: {
    width: 16,
    height: 9,
    borderRadius: 2.5,
    borderWidth: 1,
    borderColor: '#FAF6F0',
    padding: 1,
    justifyContent: 'center',
  },
  phoneBatteryLevel: {
    height: '100%',
    width: '75%',
    backgroundColor: '#FAF6F0',
    borderRadius: 1,
  },
  phoneGalleryHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1E1916',
    zIndex: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  phoneGalleryTitle: {
    color: '#FAF6F0',
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  phoneGalleryCount: {
    color: 'rgba(250,246,240,0.55)',
    fontSize: 9,
    fontFamily: 'Inter_500Medium',
  },
  phoneScreenViewport: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#14100E',
  },
  phoneGridTrack: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    padding: 6,
  },
  phonePhotoThumb: {
    width: 68,
    height: 68,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  phonePhotoOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  phoneCutoffFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 48,
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(to bottom, transparent 0%, #14100E 100%)',
      },
      default: {
        backgroundColor: '#14100E',
        opacity: 0.85,
      },
    }),
    pointerEvents: 'none',
  },

  /* Slide 2: Real Photos Placed by Hand Visual */
  tuckCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 275,
  },
  tuckPageCard: {
    width: 280,
    height: 236,
    borderRadius: 10,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E5DEC9',
    padding: 10,
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    justifyContent: 'space-between',
  },
  tuckHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EBE3D4',
  },
  tuckHeaderTitle: {
    fontSize: 8.5,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8,
    color: '#8C7A6B',
  },
  tuckHeaderCount: {
    fontSize: 8.5,
    fontFamily: 'Inter_700Bold',
    color: '#DF5739',
  },
  tuckGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 8,
    justifyContent: 'space-between',
  },
  tuckSlot: {
    width: 124,
    height: 88,
    borderRadius: 5,
    overflow: 'hidden',
  },
  tuckPlacedPhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  tuckPhotoImg: {
    width: '100%',
    height: 60,
    borderRadius: 3,
    backgroundColor: '#F5ECE1',
  },
  tuckPolaroidChin: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tuckChinText: {
    fontSize: 8.5,
    fontFamily: 'Inter_600SemiBold',
    color: '#2B2420',
  },
  tuckEmptySlot: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
    borderWidth: 1.2,
    borderStyle: 'dashed',
    borderColor: '#D8CFBF',
    backgroundColor: '#F3EDE2',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tuckEmptySlotLabel: {
    fontSize: 8.5,
    fontFamily: 'Inter_500Medium',
    color: '#A09282',
  },
  tuckHandContainer: {
    position: 'absolute',
    top: '42%',
    left: '42%',
    pointerEvents: 'none',
    zIndex: 50,
  },
  miniConfettiOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    zIndex: 60,
  },
  confettiDot: {
    position: 'absolute',
  },

  /* Slide 3: 3D Closing Book Cover Tilt Visual */
  bookTiltCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 275,
  },
  tiltedCoverWrap: {
    width: 205,
    height: 250,
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.34,
    shadowRadius: 18,
    shadowOffset: { width: 8, height: 14 },
    elevation: 10,
  },
  tiltedSpine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 14,
    backgroundColor: '#1E1815',
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
    zIndex: 5,
  },
  tiltedCoverSurface: {
    position: 'absolute',
    left: 12,
    top: 0,
    right: 4,
    bottom: 0,
    backgroundColor: '#2B2420',
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  tiltedCoverHeader: {
    fontSize: 8.5,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1.4,
    color: 'rgba(255,255,255,0.55)',
  },
  tiltedInsetCard: {
    width: '94%',
    backgroundColor: '#FAF8F5',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    gap: 7,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  tiltedPhotoWindow: {
    width: 110,
    height: 86,
    borderRadius: 4,
    backgroundColor: '#F5ECE1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  tiltedPhotoInner: {
    width: '100%',
    height: '100%',
  },
  tiltedBookTitle: {
    fontSize: 12.5,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#2B2420',
    textAlign: 'center',
  },
  tiltedCoverBrand: {
    fontSize: 9.5,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.8,
    color: 'rgba(255,255,255,0.68)',
  },
  tiltedPageEdge: {
    position: 'absolute',
    right: -3,
    top: 8,
    bottom: 8,
    width: 7,
    backgroundColor: '#FAF5EE',
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    borderLeftWidth: 1,
    borderLeftColor: '#E0D8CC',
  },
});

// ─── Main Screen Styles ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24 },
  phaseScreenWrap: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  phaseCenterBody: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 12,
  },
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

  statBannerCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statBannerTitle: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
  statBannerSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 17,
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
  lifeHeroStage: {
    gap: 16,
    marginVertical: 12,
  },
  statPillarsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statPillarCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    alignItems: 'center',
    gap: 3,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statPillarNumber: {
    fontSize: 26,
    lineHeight: 30,
  },
  statPillarLabel: {
    fontSize: 9.5,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
  statPillarSub: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  lifeProgressBarWrap: {
    paddingHorizontal: 4,
    gap: 8,
    marginVertical: 4,
  },
  lifeProgressBarTrack: {
    height: 12,
    borderRadius: 6,
    overflow: 'visible',
    position: 'relative',
    justifyContent: 'center',
  },
  lifeProgressBarFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 6,
  },
  lifeProgressBeacon: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    top: -4,
    marginLeft: -10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  lifeEpochsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  epochCol: {
    gap: 1,
  },
  epochAge: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
  },
  epochName: {
    fontSize: 9,
    fontFamily: 'Inter_500Medium',
  },
  revelationCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  revelationTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  revelationTitle: {
    fontSize: 12.5,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  revelationText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 19,
  },
  revelationSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
    fontStyle: 'italic',
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
    height: 280,
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
  prevBtn: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  bottomCtaRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
