import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image, Platform } from 'react-native';
import { Lock, Camera, BookOpen } from 'phosphor-react-native';
import { bookDisplayName } from '@/lib/data';
import type { Book } from '@/lib/data';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Authentic Heirloom Linen Themes matching Argon
export const LINEN_THEMES = [
  { name: 'Terracotta', main: '#8B4A34', spine: '#6B3524', border: '#7A3F2C', text: '#F4ECE4' },
  { name: 'Lavender', main: '#756A85', spine: '#5C526B', border: '#675C75', text: '#F3EEF8' },
  { name: 'Sage', main: '#5D705C', spine: '#485947', border: '#50624F', text: '#EFF5EE' },
  { name: 'Oatmeal', main: '#B5AA9B', spine: '#978A7A', border: '#A69A8B', text: '#2B2420' },
];

function getThemeForBook(book: Book) {
  const val = (book.coverConfig?.value || book.coverColor || '').toLowerCase();
  if (val.includes('sage') || val === '#5d705c' || val === '#2f3e34') return LINEN_THEMES[2];
  if (val.includes('lavender') || val === '#756a85') return LINEN_THEMES[1];
  if (val.includes('oatmeal') || val === '#d8cfc2' || val === '#b5aa9b' || val === '#e7dfd5') return LINEN_THEMES[3];
  if (val.includes('terracotta') || val === '#8b4a34' || val === '#c85a32') return LINEN_THEMES[0];

  // Stable hash based on monthKey
  let hash = 0;
  for (let i = 0; i < (book.monthKey || '').length; i++) {
    hash = (hash * 31 + book.monthKey.charCodeAt(i)) % LINEN_THEMES.length;
  }
  return LINEN_THEMES[hash];
}

interface Props {
  book: Book;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large' | 'grid';
  customWidth?: number;
}

export function BookCover({ book, onPress, size = 'grid', customWidth }: Props) {
  const theme = getThemeForBook(book);

  // Sizing
  const gridW = customWidth || Math.floor((SCREEN_WIDTH - 40 - 14) / 2);
  const gridH = Math.round(gridW * 1.38);

  let width = gridW;
  let height = gridH;

  if (size === 'small') {
    width = 90;
    height = 125;
  } else if (size === 'medium') {
    width = 135;
    height = 188;
  } else if (size === 'large') {
    width = 175;
    height = 242;
  }

  const title = book.coverConfig?.title || book.title || bookDisplayName(book);
  const subtitle = book.coverConfig?.subtitle || book.description || 'Curated daily archive';
  const daysCount = book.days.filter(d => d.entries.length > 0).length;
  const yearStr = book.monthKey.slice(0, 4) || '2026';

  // Find a cover photo from config, or first entry with photo
  const coverPhoto =
    (book.coverConfig?.type === 'photo' && book.coverConfig.value)
      ? book.coverConfig.value
      : (book.days.find(d => d.entries.some(e => e.photos && e.photos.length > 0))?.entries.find(e => e.photos && e.photos.length > 0)?.photos?.[0])
      || (book.isSample ? 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=600&q=80' : null);

  const isSmall = size === 'small';
  const isMedium = size === 'medium';

  return (
    <View style={[styles.outerWrapper, { width, height }]}>
      {/* Tabletop Contact Shadow */}
      <View style={[styles.tableShadow, { width: width * 0.94 }]} />

      <TouchableOpacity
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel={`Book: ${title}, ${daysCount} days recorded`}
        style={[
          styles.coverContainer,
          {
            width,
            height,
            backgroundColor: theme.main,
            borderColor: theme.border,
          },
        ]}
      >
        {/* Left Hardcover Spine with physical stitching and depth */}
        <View style={[styles.spineBand, { backgroundColor: theme.spine }]}>
          <View style={styles.spineStitchLine} />
        </View>

        {/* Right Stacked Paper Pages Edge Strip */}
        <View style={styles.pageEdgeStrip} />

        {/* Top Badges (Sample or Lock) */}
        {(book.isSample || book.locked) && (
          <View style={styles.badgeRow}>
            {book.isSample && (
              <View style={styles.sampleBadge}>
                <Text style={styles.sampleBadgeText}>SAMPLE</Text>
              </View>
            )}
            {book.locked && (
              <View style={styles.lockBadge}>
                <Lock size={10} color="#FFFFFF" weight="fill" />
              </View>
            )}
          </View>
        )}

        {/* Inset Cream Debossed Card matching Argon Cover */}
        <View style={[styles.insetCard, isSmall && styles.insetCardSmall]}>
          {/* Foil Volume Header */}
          <Text style={[styles.foilTag, isSmall && { fontSize: 6.5, letterSpacing: 0.8 }]}>
            VOL. {yearStr} • ARCHIVAL LINEN
          </Text>

          {/* Photo Frame or Camera Placeholder */}
          <View style={[styles.photoFrame, isSmall && styles.photoFrameSmall]}>
            {coverPhoto ? (
              <Image source={{ uri: coverPhoto }} style={styles.coverImg} resizeMode="cover" />
            ) : (
              <View style={styles.emptyPhotoBox}>
                <Camera size={isSmall ? 12 : 18} color="#A89B8C" weight="regular" />
              </View>
            )}
          </View>

          {/* Debossed Typography */}
          <Text
            style={[styles.bookTitle, isSmall && styles.bookTitleSmall]}
            numberOfLines={2}
          >
            {title}
          </Text>

          {!isSmall && (
            <Text style={styles.bookSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}

          {/* Days Ribbon */}
          <View style={styles.ribbonRow}>
            <View style={styles.ribbonLine} />
            <Text style={[styles.ribbonText, isSmall && { fontSize: 7 }]}>
              {daysCount} {daysCount === 1 ? 'DAY' : 'DAYS'} RECORDED
            </Text>
            <View style={styles.ribbonLine} />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableShadow: {
    position: 'absolute',
    bottom: -6,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(28, 18, 10, 0.32)',
    ...Platform.select({
      web: {
        filter: 'blur(5px)',
      } as any,
      default: {},
    }),
  },
  coverContainer: {
    borderRadius: 10,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
    paddingLeft: 18,
    paddingRight: 10,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#201408',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  spineBand: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 14,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.22)',
  },
  spineStitchLine: {
    position: 'absolute',
    left: 6,
    top: 6,
    bottom: 6,
    width: 1,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.28)',
    borderStyle: 'dashed',
  },
  pageEdgeStrip: {
    position: 'absolute',
    right: 0,
    top: 4,
    bottom: 4,
    width: 3.5,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: '#EAE2D2',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0,0,0,0.15)',
  },
  badgeRow: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 10,
  },
  sampleBadge: {
    backgroundColor: 'rgba(255,255,255,0.28)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sampleBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.6,
  },
  lockBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insetCard: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FAF6F0',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DFD7C7',
    padding: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  insetCardSmall: {
    padding: 4,
  },
  foilTag: {
    fontSize: 7.5,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.1,
    color: '#8C7A6B',
    textAlign: 'center',
    marginTop: 2,
  },
  photoFrame: {
    width: '76%',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#DFD7C7',
    padding: 3,
    shadowColor: '#201408',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    overflow: 'hidden',
  },
  photoFrameSmall: {
    width: '65%',
    padding: 2,
  },
  coverImg: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
  },
  emptyPhotoBox: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5EFE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '700',
    fontSize: 12.5,
    color: '#2B2420',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 2,
  },
  bookTitleSmall: {
    fontSize: 9,
    lineHeight: 11,
  },
  bookSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    color: '#7D7165',
    textAlign: 'center',
    marginTop: -2,
  },
  ribbonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 4,
    marginBottom: 2,
  },
  ribbonLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5DEC9',
  },
  ribbonText: {
    fontSize: 7.5,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.8,
    color: '#A09080',
  },
});
