import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image, Platform } from 'react-native';
import { Lock } from 'phosphor-react-native';
import { useColors } from '@/hooks/useColors';
import { bookDisplayName } from '@/lib/data';
import type { Book, BookFontType } from '@/lib/data';

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
  if (book.coverConfig?.type === 'solid' && book.coverConfig.value) {
    const isLight = book.coverConfig.value.toLowerCase() === '#e7dfd5';
    return { bg: book.coverConfig.value, text: isLight ? '#2B2D2F' : '#F2E8DC' };
  }
  if (book.coverColor) {
    const isLight = book.coverColor.toLowerCase() === '#e7dfd5';
    return { bg: book.coverColor, text: isLight ? '#2B2D2F' : '#F2E8DC' };
  }
  let hash = 0;
  for (let i = 0; i < book.monthKey.length; i++) {
    hash = (hash * 31 + book.monthKey.charCodeAt(i)) % COVER_PALETTES.length;
  }
  return COVER_PALETTES[hash];
}

function resolveFont(font?: BookFontType): { fontFamily?: string; fontWeight?: any } {
  if (font === 'sans') {
    return { fontFamily: 'Inter_700Bold' };
  }
  if (font === 'garamond') {
    return { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontWeight: 'bold' };
  }
  if (font === 'typewriter') {
    return { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: 'bold' };
  }
  return { fontFamily: 'PlayfairDisplay_700Bold' };
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
  const fontStyle = resolveFont(book.fontFamily || book.coverConfig?.fontFamily);

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

  const title = book.coverConfig?.title || bookDisplayName(book);
  const subtitle = book.coverConfig?.subtitle;
  const daysCount = book.days.filter(d => d.entries.length > 0).length;

  const isPhotoCover = book.coverConfig?.type === 'photo' && !!book.coverConfig.value;
  const isGradientCover = book.coverConfig?.type === 'gradient' && !!book.coverConfig.value;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Book: ${title}, ${daysCount} days recorded`}
      style={[
        styles.cover,
        { width, height, backgroundColor: isGradientCover ? '#1A2938' : palette.bg },
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
            <Lock size={11} color={palette.text} weight="fill" />
          </View>
        )}
      </View>

      {/* Center Art: Framed Photo Inset or 4-dots memory pattern motif */}
      {isPhotoCover ? (
        <View style={styles.photoInsetWrap}>
          <Image
            source={{ uri: book.coverConfig!.value }}
            style={[styles.photoInset, { width: width * 0.55, height: width * 0.55 }]}
            resizeMode="cover"
          />
        </View>
      ) : (
        <View style={styles.motifRow}>
          <View style={[styles.motifDot, { backgroundColor: palette.text }]} />
          <View style={[styles.motifDot, { backgroundColor: palette.text }]} />
          <View style={[styles.motifDot, { backgroundColor: palette.text }]} />
          <View style={[styles.motifDot, { backgroundColor: palette.text }]} />
        </View>
      )}

      {/* Book Bottom Content */}
      <View style={styles.inner}>
        <Text
          style={[styles.title, { color: palette.text, fontSize }, fontStyle]}
          numberOfLines={2}
        >
          {title}
        </Text>

        {subtitle ? (
          <Text
            style={[styles.subtitle, { color: palette.text, fontSize: subSize - 1 }]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}

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
  photoInsetWrap: {
    alignSelf: 'center',
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  photoInset: {
    backgroundColor: '#333',
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
  subtitle: {
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.2,
    opacity: 0.8,
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
