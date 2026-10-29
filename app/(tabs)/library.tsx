import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Platform, Dimensions, Alert, Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import {
  MagnifyingGlass, X, BookOpen, ShareNetwork, Printer,
} from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDiary } from '@/contexts/DiaryContext';
import { BookCover } from '@/components/BookCover';
import { EmptyState } from '@/components/EmptyState';
import {
  bookDisplayName,
  type Book,
} from '@/lib/data';
import { exportBookAsPdf } from '@/lib/pdfExport';
import { BrandLogoLoader } from '@/components/BrandLogo';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 14;
const HORIZONTAL_PAD = 20;
const BOOK_WIDTH = Math.floor((SCREEN_WIDTH - HORIZONTAL_PAD * 2 - CARD_GAP) / 2);

export default function LibraryTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { books } = useDiary();

  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const botPad = insets.bottom + 90;

  const sortedBooks = [...books].sort((a, b) => {
    return b.monthKey.localeCompare(a.monthKey);
  });

  const filtered = sortedBooks
    .filter(b => !b.isSample)
    .filter(b => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const titleMatch = bookDisplayName(b).toLowerCase().includes(q);
      const entryMatch = b.days.some(d => d.entries.some(e => e.text.toLowerCase().includes(q)));
      return titleMatch || entryMatch;
    });

  const [sharingKey, setSharingKey] = useState<string | null>(null);
  const [sampleBannerDismissed, setSampleBannerDismissed] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('@daily5/dismissed_sample_banner').then(val => {
      if (val === 'true') setSampleBannerDismissed(true);
    });
  }, []);

  async function dismissSampleBanner() {
    Haptics.selectionAsync();
    setSampleBannerDismissed(true);
    await AsyncStorage.setItem('@daily5/dismissed_sample_banner', 'true').catch(() => {});
  }

  function openBook(book: Book) {
    Haptics.selectionAsync();
    if (book.isSample) {
      dismissSampleBanner();
    }
    router.push({ pathname: '/book-viewer', params: { monthKey: book.monthKey } });
  }

  async function handleShareBook(book: Book) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSharingKey(book.monthKey);
    try {
      await exportBookAsPdf(book);
    } catch (e: any) {
      Alert.alert('Export Error', e?.message || 'Could not export book PDF.');
    } finally {
      setSharingKey(null);
    }
  }

  function handlePrintBook(book: Book) {
    Haptics.selectionAsync();
    router.push({ pathname: '/order-flow', params: { monthKey: book.monthKey } });
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
          Library
        </Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => setShowSearch(s => !s)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel={showSearch ? 'Close search' : 'Search library'}
          >
            {showSearch ? (
              <X size={20} color={colors.mutedForeground} weight="bold" />
            ) : (
              <MagnifyingGlass size={20} color={colors.mutedForeground} weight="bold" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      {showSearch && (
        <View style={[styles.searchBar, { backgroundColor: colors.muted, marginHorizontal: 20, marginTop: 12 }]}>
          <MagnifyingGlass size={16} color={colors.tertiary} weight="bold" />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search moments & volumes…"
            placeholderTextColor={colors.tertiary}
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
        </View>
      )}

      {/* Book Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={search ? 'No Volumes Found' : 'Your Archival Library is Ready'}
          description={
            search
              ? `No photobooks found matching "${search}". Try searching another keyword.`
              : 'As you tuck moments into your daily spreads, bound archival monthly volumes appear here automatically.'
          }
          actionLabel={search ? 'Clear Search' : undefined}
          actionIcon={search ? X : undefined}
          onAction={search ? () => setSearch('') : undefined}
        />
      ) : (
        <FlatList
          data={filtered}
          numColumns={2}
          keyExtractor={b => b.monthKey}
          contentContainerStyle={[styles.grid, { paddingBottom: botPad }]}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isSharing = sharingKey === item.monthKey;
            const bookTitle = item.title || item.monthKey;
            return (
              <View style={styles.bookCell}>
                <BookCover
                  book={item}
                  size="grid"
                  customWidth={BOOK_WIDTH}
                  onPress={() => openBook(item)}
                />

                {/* Quick Share Action */}
                <View style={[styles.bookActionsRow, { width: BOOK_WIDTH }]}>
                  <TouchableOpacity
                    style={[styles.bookActionBtn, { backgroundColor: colors.accentLight, borderColor: colors.border, flex: 1 }]}
                    onPress={() => handleShareBook(item)}
                    disabled={isSharing}
                    activeOpacity={0.75}
                    hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                    accessibilityRole="button"
                    accessibilityLabel={`Share ${bookTitle}`}
                  >
                    {isSharing ? (
                      <BrandLogoLoader size={16} />
                    ) : (
                      <>
                        <ShareNetwork size={14} color={colors.foreground} weight="bold" />
                        <Text style={[styles.bookActionText, { color: colors.foreground }]}>Share Volume</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 28, letterSpacing: 0.2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  newBookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  newBookBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  iconBtn: {
    padding: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  sampleBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 4,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  sampleCloseBtn: {
    padding: 4,
    marginLeft: 4,
  },
  sampleBannerTitle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  sampleBannerText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 16,
  },
  grid: {
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 14,
  },
  row: {
    gap: CARD_GAP,
    justifyContent: 'flex-start',
  },
  bookCell: {
    width: BOOK_WIDTH,
    gap: 8,
  },
  bookActionsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  bookActionBtn: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  bookActionText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 40 },
  emptyText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  emptySub: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 18 },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 24,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: { fontSize: 22 },
  modalSub: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8 },
  modalInput: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    borderWidth: 1,
  },
  /* Cover Studio Styles */
  previewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  previewLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  tabBtnText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  swatchCard: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    width: 84,
    gap: 6,
  },
  swatchCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchName: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
  },
  gradientCard: {
    width: 110,
    height: 58,
    borderRadius: 10,
    padding: 8,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  gradientCardName: {
    color: '#FFF',
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  gradientCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPickedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pickedPhotoThumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
  },
  pickedPhotoTitle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  changePhotoBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  changePhotoBtnText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  pickPhotoBox: {
    width: '100%',
    height: 110,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  pickPhotoBoxText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  pickPhotoBoxSub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  typographyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fontCard: {
    width: '48%',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  fontCardTitle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  fontCardSub: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  layoutPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  layoutPillText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  createBtn: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  createBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});
