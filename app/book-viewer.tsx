import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Dimensions, Platform, Alert, ActivityIndicator, Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  BookOpen,
  ShareNetwork,
  Printer,
  Eye,
  EyeSlash,
  PencilSimple,
  CaretLeft,
  CaretRight,
} from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDiary } from '@/contexts/DiaryContext';
import { BookCover } from '@/components/BookCover';
import { ProtectedScreen } from '@/components/ProtectedScreen';
import { bookDisplayName, formatShortDate, formatFullDate } from '@/lib/data';
import { exportBookAsPdf } from '@/lib/pdfExport';
import type { Book, DayLog } from '@/lib/data';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PAGE_WIDTH = SCREEN_WIDTH;
const BOOK_CARD_WIDTH = Math.min(SCREEN_WIDTH - 36, 380);

interface PageItem {
  type: 'cover' | 'day';
  day?: DayLog;
  index: number;
}

export function BookViewerContent() {
  const { monthKey: mk } = useLocalSearchParams<{ monthKey: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getBook, lockCurrentMonth, toggleHideDayInBook } = useDiary();

  const flatRef = useRef<FlatList>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [exporting, setExporting] = useState(false);

  const book = getBook(mk ?? '');

  if (!book) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.background }]}>
        <BookOpen size={48} color={colors.tertiary} />
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Book not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLinkWrap}>
          <Text style={[styles.backLink, { color: colors.primary }]}>Go back to Library</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const sortedDays = [...book.days].sort((a, b) => a.date.localeCompare(b.date));
  const hiddenDays = book.hiddenDays ?? [];

  const pages: PageItem[] = [
    { type: 'cover', index: 0 },
    ...sortedDays.map((day, idx) => ({ type: 'day' as const, day, index: idx + 1 })),
  ];

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const botPad = insets.bottom + 16;

  function scrollToPage(index: number) {
    if (index < 0 || index >= pages.length) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPageIndex(index);
    flatRef.current?.scrollToIndex({ index, animated: true });
  }

  async function handleToggleHide(date: string) {
    Haptics.selectionAsync();
    await toggleHideDayInBook(book!.monthKey, date);
  }

  async function handleLock() {
    Alert.alert(
      'Lock this volume?',
      "Locking permanently closes this book and preserves it as archival print. No further changes can be made.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Lock Volume',
          onPress: async () => {
            await lockCurrentMonth();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          },
        },
      ],
    );
  }

  async function handleExportPdf() {
    if (exporting) return;
    setExporting(true);
    try {
      await exportBookAsPdf(book!);
    } catch {
      Alert.alert('Export failed', 'Could not generate the PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  const currentItem = pages[pageIndex];
  const currentDay = currentItem?.day;
  const isCurrentDayHidden = currentDay ? hiddenDays.includes(currentDay.date) : false;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.headerBtn}
        >
          <ArrowLeft size={22} color={colors.foreground} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text
            style={[styles.headerTitle, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}
            numberOfLines={1}
          >
            {bookDisplayName(book)}
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {pageIndex === 0 ? 'Front Cover' : `Page ${pageIndex} of ${pages.length - 1}`}
          </Text>
        </View>

        <View style={styles.headerActions}>
          {/* Hide/Unhide toggle for current day */}
          {currentDay && (
            <TouchableOpacity
              onPress={() => handleToggleHide(currentDay.date)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={[
                styles.hideBtn,
                {
                  backgroundColor: isCurrentDayHidden ? colors.primary : colors.muted,
                  borderColor: isCurrentDayHidden ? colors.primary : colors.border,
                },
              ]}
            >
              {isCurrentDayHidden ? (
                <Eye size={16} color={colors.primaryForeground} weight="fill" />
              ) : (
                <EyeSlash size={16} color={colors.mutedForeground} />
              )}
              <Text
                style={[
                  styles.hideBtnText,
                  { color: isCurrentDayHidden ? colors.primaryForeground : colors.mutedForeground },
                ]}
              >
                {isCurrentDayHidden ? 'Hidden' : 'Hide'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Export PDF */}
          <TouchableOpacity
            onPress={handleExportPdf}
            disabled={exporting}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.headerBtn}
          >
            {exporting ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <ShareNetwork size={22} color={colors.primary} />
            )}
          </TouchableOpacity>

          {/* Print Order */}
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/order-flow',
                params: { monthKey: book.monthKey },
              } as any)
            }
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.headerBtn}
          >
            <Printer size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Book Spread FlatList with Authentic Page Feel */}
      <FlatList
        ref={flatRef}
        data={pages}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / PAGE_WIDTH);
          if (idx !== pageIndex) {
            setPageIndex(idx);
            Haptics.selectionAsync();
          }
        }}
        renderItem={({ item }) => {
          if (item.type === 'cover') {
            return (
              <View style={[styles.pageSlide, { width: PAGE_WIDTH }]}>
                <View style={[styles.bookCard, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}>
                  {/* Spine depth shadow */}
                  <View style={styles.spineGutter} />
                  <View style={styles.coverInner}>
                    <BookCover book={book} size="large" />
                    <Text
                      style={[
                        styles.coverTitle,
                        { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' },
                      ]}
                    >
                      {bookDisplayName(book)}
                    </Text>
                    {book.description ? (
                      <Text style={[styles.coverDesc, { color: colors.mutedForeground }]}>
                        {book.description}
                      </Text>
                    ) : null}
                    <View style={[styles.dividerPill, { backgroundColor: colors.border }]} />
                    <Text style={[styles.coverSub, { color: colors.tertiary }]}>
                      {book.days.filter((d) => d.entries.length > 0).length} days recorded
                    </Text>
                  </View>
                </View>
              </View>
            );
          }

          const day = item.day!;
          const isHidden = hiddenDays.includes(day.date);
          const slots = Array.from({ length: 4 }, (_, i) => day.entries[i] ?? null);
          const hasEmptySlots = day.entries.length < 4;

          return (
            <View style={[styles.pageSlide, { width: PAGE_WIDTH }]}>
              <View
                style={[
                  styles.bookCard,
                  styles.paperPage,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.borderStrong,
                    opacity: isHidden ? 0.6 : 1,
                  },
                ]}
              >
                {/* Book Spine gutter shadow on left */}
                <View style={styles.spineGutter} />

                {/* Left red notebook margin rule */}
                <View style={[styles.marginRule, { backgroundColor: colors.marginLine || '#E8593A44' }]} />

                {/* Page Content */}
                <View style={styles.dayInner}>
                  {/* Date Heading */}
                  <View style={styles.dayHeader}>
                    <Text
                      style={[
                        styles.dayDate,
                        { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' },
                      ]}
                    >
                      {formatFullDate(day.date)}
                    </Text>
                    <Text style={[styles.dayPageNum, { color: colors.tertiary }]}>
                      p. {item.index}
                    </Text>
                  </View>

                  {/* Hidden Watermark */}
                  {isHidden && (
                    <View style={styles.hiddenWatermark}>
                      <EyeSlash size={16} color={colors.destructive} />
                      <Text style={[styles.hiddenWatermarkText, { color: colors.destructive }]}>
                        Page hidden from print & export
                      </Text>
                    </View>
                  )}

                  {/* 4 Moments Slots */}
                  <View style={styles.slotsList}>
                    {slots.map((entry, idx) => (
                      <View key={idx} style={styles.momentRow}>
                        <View style={styles.momentNumCircle}>
                          <Text style={[styles.momentNum, { color: colors.tertiary }]}>
                            {idx + 1}
                          </Text>
                        </View>
                        <View style={styles.momentContent}>
                          {entry ? (
                            <>
                              <Text
                                style={[
                                  styles.momentText,
                                  { color: colors.foreground, fontFamily: 'Inter_600SemiBold' },
                                ]}
                              >
                                {entry.text}
                              </Text>
                              {entry.photos && entry.photos.length > 0 && (
                                <View style={styles.photoThumbWrap}>
                                  <Image
                                    source={{ uri: entry.photos[0] }}
                                    style={styles.photoThumb}
                                    resizeMode="cover"
                                  />
                                </View>
                              )}
                            </>
                          ) : (
                            <Text style={[styles.emptySlotText, { color: colors.tertiary }]}>
                              Unrecorded moment
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Fill empty moments CTA if day has room */}
                  {hasEmptySlots && !book.locked && (
                    <TouchableOpacity
                      style={[styles.fillEmptyBtn, { borderColor: colors.border }]}
                      onPress={() => {
                        router.push({ pathname: '/log-modal', params: { date: day.date } });
                      }}
                      activeOpacity={0.8}
                    >
                      <PencilSimple size={14} color={colors.primary} />
                      <Text style={[styles.fillEmptyBtnText, { color: colors.primary }]}>
                        Fill {4 - day.entries.length} empty moment{4 - day.entries.length > 1 ? 's' : ''}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* Tactile Book Footer with Page Flip Controls */}
      <View style={[styles.footer, { paddingBottom: botPad, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.navPageBtn, { opacity: pageIndex === 0 ? 0.3 : 1 }]}
          onPress={() => scrollToPage(pageIndex - 1)}
          disabled={pageIndex === 0}
        >
          <CaretLeft size={20} color={colors.foreground} />
          <Text style={[styles.navPageText, { color: colors.foreground }]}>Previous</Text>
        </TouchableOpacity>

        {/* Page progress pill */}
        <View style={styles.pageRibbon}>
          <Text style={[styles.ribbonText, { color: colors.tertiary }]}>
            {pageIndex === 0 ? 'Cover' : `${pageIndex} / ${pages.length - 1}`}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.navPageBtn, { opacity: pageIndex >= pages.length - 1 ? 0.3 : 1 }]}
          onPress={() => scrollToPage(pageIndex + 1)}
          disabled={pageIndex >= pages.length - 1}
        >
          <Text style={[styles.navPageText, { color: colors.foreground }]}>Next</Text>
          <CaretRight size={20} color={colors.foreground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function BookViewer() {
  return (
    <ProtectedScreen>
      <BookViewerContent />
    </ProtectedScreen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 16,
    letterSpacing: 0.2,
  },
  headerSub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  hideBtnText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },

  /* Page Slide & Authentic Book Spread */
  pageSlide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  bookCard: {
    width: BOOK_CARD_WIDTH,
    height: '96%',
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 4, height: 8 },
    elevation: 6,
    position: 'relative',
  },
  spineGutter: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 18,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.08)',
    zIndex: 3,
  },
  marginRule: {
    position: 'absolute',
    left: 48,
    top: 0,
    bottom: 0,
    width: 1,
    zIndex: 2,
  },
  paperPage: {
    paddingLeft: 56,
    paddingRight: 20,
    paddingVertical: 20,
  },

  /* Cover layout */
  coverInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  coverTitle: {
    fontSize: 24,
    textAlign: 'center',
    marginTop: 14,
  },
  coverDesc: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 18,
  },
  dividerPill: {
    width: 32,
    height: 2,
    borderRadius: 1,
    marginVertical: 4,
  },
  coverSub: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },

  /* Day layout */
  dayInner: {
    flex: 1,
    justifyContent: 'space-between',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    paddingBottom: 8,
  },
  dayDate: {
    fontSize: 18,
    letterSpacing: 0.2,
  },
  dayPageNum: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  hiddenWatermark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(232, 89, 58, 0.1)',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  hiddenWatermarkText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  slotsList: {
    flex: 1,
    justifyContent: 'space-evenly',
    paddingVertical: 8,
  },
  momentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  momentNumCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  momentNum: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
  },
  momentContent: {
    flex: 1,
    gap: 6,
  },
  momentText: {
    fontSize: 15,
    lineHeight: 22,
  },
  emptySlotText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
  },
  photoThumbWrap: {
    width: 72,
    height: 52,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 2,
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },
  fillEmptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  fillEmptyBtnText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },

  /* Footer & Page Controls */
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  navPageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  navPageText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  pageRibbon: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ribbonText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },

  /* Empty state */
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  backLinkWrap: { padding: 8 },
  backLink: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
