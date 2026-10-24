import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { bookDisplayName } from '@/lib/data';
import type { Book } from '@/lib/data';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Procedural cover palettes
const COVER_PALETTES = [
  { bg: '#2D3F2A', text: '#C8D8B4' },
  { bg: '#3D2A2F', text: '#D8B4C0' },
  { bg: '#2A3A4A', text: '#B4C8D8' },
  { bg: '#4A3A1A', text: '#D8C8A0' },
  { bg: '#1A2F3F', text: '#A0B8C8' },
  { bg: '#3F2A1A', text: '#D0B090' },
  { bg: '#2A1A3F', text: '#B8A8D0' },
  { bg: '#1A3F2A', text: '#A8D0B8' },
];

function paletteForBook(book: Book) {
  if (book.coverColor) {
    return { bg: book.coverColor, text: '#F2E8DC' };
  }
  let hash = 0;
  for (let i = 0; i < book.monthKey.length; i++) {
    hash = (hash * 31 + book.monthKey.charCodeAt(i)) % COVER_PALETTES.length;
  }
  return COVER_PALETTES[hash];
}

interface Props {
  book: Book;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large' | 'grid';
  customWidth?: number;
}

export function BookCover({ book, onPress, size = 'grid', customWidth }: Props) {
  const colors = useColors();
  const palette = paletteForBook(book);

  // Responsive book sizing for 2-column grid with minimal whitespace
  const gridW = customWidth || Math.floor((SCREEN_WIDTH - 40 - 14) / 2);
  const gridH = Math.round(gridW * 1.36);

  let width = gridW;
  let height = gridH;
  let fontSize = 16;
  let subSize = 12;

  if (size === 'small') {
    width = 90;
    height = 125;
    fontSize = 11;
    subSize = 9;
  } else if (size === 'medium') {
    width = 135;
    height = 185;
    fontSize = 14;
    subSize = 11;
  } else if (size === 'large') {
    width = 175;
    height = 240;
    fontSize = 17;
    subSize = 13;
  }

  const title = bookDisplayName(book);
  const daysCount = book.days.filter(d => d.entries.length > 0).length;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.85}
      style={[
        styles.cover,
        { width, height, backgroundColor: palette.bg },
      ]}
    >
      {/* Spine-like left strip with subtle embossing */}
      <View style={styles.spine} />

      {/* Top right badges: Sample or Locked */}
      <View style={styles.topBadges}>
        {book.isSample && (
          <View style={styles.sampleBadge}>
            <Text style={styles.sampleBadgeText}>SAMPLE</Text>
          </View>
        )}
        {book.locked && (
          <View style={styles.lockCircle}>
            <Ionicons name="lock-closed" size={11} color={palette.text} />
          </View>
        )}
      </View>

      {/* Center 4-dots memory pattern motif */}
      <View style={styles.motifRow}>
        <View style={[styles.motifDot, { backgroundColor: palette.text }]} />
        <View style={[styles.motifDot, { backgroundColor: palette.text }]} />
        <View style={[styles.motifDot, { backgroundColor: palette.text }]} />
        <View style={[styles.motifDot, { backgroundColor: palette.text }]} />
      </View>

      {/* Book Bottom Content */}
      <View style={styles.inner}>
        <Text
          style={[styles.title, { color: palette.text, fontSize, fontFamily: 'PlayfairDisplay_700Bold' }]}
          numberOfLines={2}
        >
          {title}
        </Text>

        <View style={[styles.divider, { backgroundColor: palette.text }]} />

        <Text style={[styles.count, { color: palette.text, fontSize: subSize }]}>
          {daysCount} {daysCount === 1 ? 'day' : 'days'} recorded
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cover: {
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 2, height: 5 },
    position: 'relative',
    justifyContent: 'space-between',
  },
  spine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 14,
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.08)',
  },
  topBadges: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 6,
    paddingTop: 10,
    paddingRight: 10,
    zIndex: 2,
  },
  sampleBadge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sampleBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8,
  },
  lockCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  motifRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.35,
  },
  motifDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  inner: {
    paddingLeft: 22,
    paddingRight: 12,
    paddingBottom: 16,
    gap: 4,
  },
  title: {
    letterSpacing: 0.3,
    lineHeight: 22,
  },
  divider: {
    height: 1.5,
    width: 28,
    borderRadius: 1,
    marginVertical: 4,
    opacity: 0.35,
  },
  count: {
    fontFamily: 'Inter_400Regular',
    letterSpacing: 0.3,
    opacity: 0.75,
  },
});
