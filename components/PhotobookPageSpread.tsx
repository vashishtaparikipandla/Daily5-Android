/**
 * PhotobookPageSpread.tsx
 * Authentic physical photo album page component for Dear Day.
 * Renders Today's (or any day's) archival spread featuring a 2x2 Polaroid sleeve grid,
 * handmade cotton paper textures, leather spine stitching, and tactile corner mounts.
 */

import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  PanResponder,
  Animated,
} from 'react-native';
import {
  Camera,
  CaretLeft,
  CaretRight,
  BookOpen,
  Sparkle,
  CheckCircle,
  Plus,
} from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { formatFullDate, type DayLog, type Entry } from '@/lib/data';
import { getCategoryById } from '@/constants/categories';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ALBUM_WIDTH = Math.min(SCREEN_WIDTH - 24, 430);
const POLAROID_GRID_GAP = 12;
const POLAROID_SLOT_WIDTH = (ALBUM_WIDTH - 48 - POLAROID_GRID_GAP) / 2;
const POLAROID_SLOT_HEIGHT = POLAROID_SLOT_WIDTH * 1.25;

const PROMPTS = [
  { label: 'Morning Light', sub: 'The first awakening' },
  { label: 'Afternoon Walk', sub: 'Connection & motion' },
  { label: 'A Small Joy', sub: 'Serendipity observed' },
  { label: 'Evening Reflection', sub: 'The quiet hours' },
];

interface PhotobookPageSpreadProps {
  dateStr: string;
  dayLog?: DayLog;
  onTuckPhoto: (slotIndex: number) => void;
  onFlipPrev?: () => void;
  onFlipNext?: () => void;
  canFlipNext?: boolean;
  onOpenFullBook?: () => void;
}

export function PhotobookPageSpread({
  dateStr,
  dayLog,
  onTuckPhoto,
  onFlipPrev,
  onFlipNext,
  canFlipNext = false,
  onOpenFullBook,
}: PhotobookPageSpreadProps) {
  const colors = useColors();

  const entries: (Entry | null)[] = Array.from(
    { length: 4 },
    (_, i) => dayLog?.entries[i] ?? null,
  );
  const filledCount = entries.filter(Boolean).length;
  const isComplete = filledCount === 4;

  const dayDate = new Date(dateStr + 'T12:00:00');
  const dayOfWeek = dayDate.toLocaleDateString('en-US', { weekday: 'long' });
  const dayNum = dayDate.getDate();
  const monthName = dayDate.toLocaleDateString('en-US', { month: 'long' });
  const year = dayDate.getFullYear();

  // Subtle 3D page curl gesture tracking
  const panX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 15,
      onPanResponderMove: (_, gesture) => {
        panX.setValue(gesture.dx * 0.4);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > 60 && onFlipPrev) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          Animated.timing(panX, {
            toValue: 120,
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            panX.setValue(0);
            onFlipPrev();
          });
        } else if (gesture.dx < -60 && canFlipNext && onFlipNext) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          Animated.timing(panX, {
            toValue: -120,
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            panX.setValue(0);
            onFlipNext();
          });
        } else {
          Animated.spring(panX, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    }),
  ).current;

  function renderSlot(idx: number) {
    const entry = entries[idx];
    const hasEntry = !!entry;
    const photo = entry?.photos?.[0];
    const cat = entry?.category ? getCategoryById(entry.category) : undefined;
    const prompt = PROMPTS[idx];

    return (
      <TouchableOpacity
        key={idx}
        style={[
          styles.polaroidSlot,
          {
            borderColor: hasEntry ? '#DDD8CE' : '#D5CFC2',
            backgroundColor: hasEntry ? '#FFFFFF' : '#F5F1E8',
          },
        ]}
        onPress={() => {
          Haptics.selectionAsync();
          onTuckPhoto(idx);
        }}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`Sleeve ${idx + 1}: ${hasEntry ? entry?.text : prompt.label}`}
      >
        {/* Physical Archival Corner Mount Slits (all 4 corners) */}
        <View style={[styles.cornerMount, styles.cornerMountTL, { borderColor: '#B85D3B88' }]} />
        <View style={[styles.cornerMount, styles.cornerMountTR, { borderColor: '#B85D3B88' }]} />
        <View style={[styles.cornerMount, styles.cornerMountBL, { borderColor: '#B85D3B88' }]} />
        <View style={[styles.cornerMount, styles.cornerMountBR, { borderColor: '#B85D3B88' }]} />

        {hasEntry ? (
          // Filled Polaroid Print
          <View style={styles.filledPolaroidWrap}>
            <View style={styles.polaroidPhotoArea}>
              {photo ? (
                <Image source={{ uri: photo }} style={styles.polaroidImage} resizeMode="cover" />
              ) : (
                <View style={[styles.textOnlyPhoto, { backgroundColor: 'rgba(232,89,58,0.1)' }]}>
                  <Text style={[styles.textOnlyQuote, { color: '#E8593A' }]}>“</Text>
                  <Text style={[styles.textOnlyBody, { color: '#1C1916' }]} numberOfLines={3}>
                    {entry.text}
                  </Text>
                </View>
              )}

              {/* Plastic Sheen Reflection Line */}
              <View style={styles.photoSheen} pointerEvents="none" />

              {/* Category Tag */}
              {cat && (
                <View style={[styles.catBadge, { backgroundColor: cat.color + 'EE' }]}>
                  <Text style={styles.catBadgeText}>{cat.label.toUpperCase()}</Text>
                </View>
              )}
            </View>

            {/* Polaroid White Bottom Chin */}
            <View style={styles.polaroidChin}>
              <Text
                style={[
                  styles.chinCaption,
                  { color: '#1C1916', fontFamily: Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif' },
                ]}
                numberOfLines={2}
              >
                {entry.text || prompt.label}
              </Text>
            </View>
          </View>
        ) : (
          // Empty Paper Sleeve with Pocket Mount
          <View style={styles.emptySleeveWrap}>
            <View style={[styles.emptyCameraCircle, { backgroundColor: 'rgba(232,89,58,0.12)' }]}>
              <Camera size={20} color="#E8593A" weight="duotone" />
            </View>
            <Text style={[styles.emptySlotTitle, { color: '#1C1916' }]}>
              {prompt.label}
            </Text>
            <Text style={[styles.emptySlotSub, { color: '#7A746E' }]}>
              {prompt.sub}
            </Text>

            <View style={[styles.tuckPillBadge, { backgroundColor: '#EDE7DC', borderColor: '#DDD4C4' }]}>
              <Plus size={10} color="#E8593A" weight="bold" />
              <Text style={[styles.tuckPillText, { color: '#E8593A' }]}>Tuck Photo</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <Animated.View
      style={[
        styles.albumContainer,
        {
          width: ALBUM_WIDTH,
          transform: [{ translateX: panX }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Leather Book Spine Binding on Left with Thread Saddle Stitches */}
      <View style={styles.spineLeatherStrip}>
        <View style={styles.stitchDashes} />
        <View style={styles.spineCreaseShadow} />
      </View>

      {/* Notebook Red Margin Line */}
      <View style={[styles.marginRule, { backgroundColor: 'rgba(232,89,58,0.25)' }]} />

      {/* Paper Page Inner Content */}
      <View style={styles.pageInner}>
        {/* Album Header */}
        <View style={styles.albumHeader}>
          <View style={styles.headerTitleGroup}>
            <Text style={[styles.volumeMeta, { color: '#8C857B' }]}>
              VOL. {year} · {monthName.toUpperCase()}
            </Text>
            <Text
              style={[
                styles.dateHeading,
                { color: '#1C1916', fontFamily: 'PlayfairDisplay_700Bold' },
              ]}
            >
              {dayOfWeek}, {monthName} {dayNum}
            </Text>
            <Text style={[styles.pageMeta, { color: '#7A746E' }]}>
              Page {dayNum} of {monthName} Album · {filledCount}/4 Sleeves Tucked
            </Text>
          </View>

          {/* Archival Status Stamp */}
          {isComplete ? (
            <View style={[styles.sealedStampPill, { borderColor: '#E8593A', backgroundColor: 'rgba(232,89,58,0.12)' }]}>
              <Sparkle size={13} color="#E8593A" weight="fill" />
              <Text style={[styles.sealedStampText, { color: '#E8593A' }]}>SEALED</Text>
            </View>
          ) : (
            <View style={[styles.activePill, { borderColor: '#D9D3C7', backgroundColor: '#EDE7DC' }]}>
              <Text style={[styles.activePillText, { color: '#7A746E' }]}>
                {4 - filledCount} LEFT
              </Text>
            </View>
          )}
        </View>

        {/* 2x2 Polaroid Grid (Archival Corner Mount Sleeves) */}
        <View style={styles.polaroidGrid}>
          <View style={styles.gridRow}>
            {renderSlot(0)}
            {renderSlot(1)}
          </View>
          <View style={styles.gridRow}>
            {renderSlot(2)}
            {renderSlot(3)}
          </View>
        </View>

        {/* Page Footer Navigation Bar */}
        <View style={[styles.pageFooter, { borderTopColor: '#E8E3D8' }]}>
          <TouchableOpacity
            style={[styles.footerNavBtn, { opacity: onFlipPrev ? 1 : 0.3 }]}
            onPress={onFlipPrev}
            disabled={!onFlipPrev}
            activeOpacity={0.7}
          >
            <CaretLeft size={16} color="#1C1916" />
            <Text style={[styles.footerNavText, { color: '#1C1916' }]}>Yesterday</Text>
          </TouchableOpacity>

          {onOpenFullBook && (
            <TouchableOpacity
              style={[styles.openFullBookBtn, { backgroundColor: 'rgba(232,89,58,0.12)', borderColor: '#E8E3D8' }]}
              onPress={onOpenFullBook}
              activeOpacity={0.8}
            >
              <BookOpen size={14} color="#E8593A" weight="bold" />
              <Text style={[styles.openFullBookText, { color: '#E8593A' }]}>
                Browse Album
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.footerNavBtn, { opacity: canFlipNext && onFlipNext ? 1 : 0.3 }]}
            onPress={onFlipNext}
            disabled={!canFlipNext || !onFlipNext}
            activeOpacity={0.7}
          >
            <Text style={[styles.footerNavText, { color: '#1C1916' }]}>Tomorrow</Text>
            <CaretRight size={16} color="#1C1916" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  albumContainer: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#FAF7F2',
    borderColor: '#E8E3D8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 6,
    marginVertical: 12,
  },
  spineLeatherStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 14,
    backgroundColor: '#8C4830',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  stitchDashes: {
    width: 2,
    height: '92%',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#F7F4EF99',
  },
  spineCreaseShadow: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  marginRule: {
    position: 'absolute',
    left: 28,
    top: 0,
    bottom: 0,
    width: 1,
    zIndex: 1,
  },
  pageInner: {
    paddingLeft: 34,
    paddingRight: 16,
    paddingTop: 18,
    paddingBottom: 14,
  },
  albumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitleGroup: {
    flex: 1,
    gap: 2,
  },
  volumeMeta: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.2,
  },
  dateHeading: {
    fontSize: 19,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  pageMeta: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
  sealedStampPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  sealedStampText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8,
  },
  activePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  activePillText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  polaroidGrid: {
    gap: 10,
    marginBottom: 16,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  polaroidSlot: {
    flex: 1,
    aspectRatio: 0.82,
    borderRadius: 6,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cornerMount: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderWidth: 1.5,
    zIndex: 3,
  },
  cornerMountTL: {
    top: 2,
    left: 2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  cornerMountTR: {
    top: 2,
    right: 2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  cornerMountBL: {
    bottom: 2,
    left: 2,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  cornerMountBR: {
    bottom: 2,
    right: 2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  filledPolaroidWrap: {
    flex: 1,
    padding: 6,
    paddingBottom: 8,
    justifyContent: 'space-between',
  },
  polaroidPhotoArea: {
    flex: 1,
    borderRadius: 3,
    backgroundColor: '#F0ECE1',
    overflow: 'hidden',
    position: 'relative',
  },
  polaroidImage: {
    width: '100%',
    height: '100%',
  },
  photoSheen: {
    position: 'absolute',
    top: -30,
    left: -30,
    width: 120,
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    transform: [{ rotate: '45deg' }],
  },
  catBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  catBadgeText: {
    fontSize: 8,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  textOnlyPhoto: {
    flex: 1,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textOnlyQuote: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay_700Bold',
    lineHeight: 22,
  },
  textOnlyBody: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 14,
  },
  polaroidChin: {
    paddingTop: 5,
    paddingHorizontal: 2,
  },
  chinCaption: {
    fontSize: 10.5,
    lineHeight: 14,
  },
  chinTime: {
    fontSize: 8.5,
    fontFamily: 'Inter_500Medium',
    color: '#8C887B',
    marginTop: 2,
  },
  emptySleeveWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    gap: 4,
  },
  emptyCameraCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  emptySlotTitle: {
    fontSize: 11,
    fontFamily: 'PlayfairDisplay_700Bold',
    textAlign: 'center',
  },
  emptySlotSub: {
    fontSize: 9,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 12,
  },
  tuckPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  tuckPillText: {
    fontSize: 9.5,
    fontFamily: 'Inter_700Bold',
  },
  pageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  footerNavText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  openFullBookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  openFullBookText: {
    fontSize: 11.5,
    fontFamily: 'Inter_700Bold',
  },
});