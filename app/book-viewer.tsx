import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Dimensions, Platform, Alert, ActivityIndicator, Image,
  Modal, ScrollView,
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
  SlidersHorizontal,
  Camera,
  Check,
  Sparkle,
  X,
} from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDiary } from '@/contexts/DiaryContext';
import { BookCover } from '@/components/BookCover';
import { ProtectedScreen } from '@/components/ProtectedScreen';
import { exportBookAsPdf } from '@/lib/pdfExport';
import { bookDisplayName, formatShortDate, formatFullDate } from '@/lib/data';
import type { Book, DayLog, Entry, PageLayoutType, BookFontType } from '@/lib/data';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PAGE_WIDTH = SCREEN_WIDTH;
const BOOK_CARD_WIDTH = Math.min(SCREEN_WIDTH - 36, 380);

function resolveBodyFont(font?: BookFontType): { fontFamily: string } {
  if (font === 'sans') return { fontFamily: 'Inter_500Medium' };
  if (font === 'garamond') return { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' };
  if (font === 'typewriter') return { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' };
  return { fontFamily: 'PlayfairDisplay_400Regular' };
}

function resolveHeadingFont(font?: BookFontType): { fontFamily: string; fontWeight?: any } {
  if (font === 'sans') return { fontFamily: 'Inter_700Bold' };
  if (font === 'garamond') return { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontWeight: 'bold' };
  if (font === 'typewriter') return { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: 'bold' };
  return { fontFamily: 'PlayfairDisplay_700Bold' };
}

interface PageItem {
  type: 'cover' | 'day';
  day?: DayLog;
  index: number;
}

export function BookViewerContent() {
  const { monthKey: mk } = useLocalSearchParams<{ monthKey: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getBook, lockCurrentMonth, toggleHideDayInBook, updateBookConfig } = useDiary();

  const flatRef = useRef<FlatList>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [showLayoutModal, setShowLayoutModal] = useState(false);

  const book = getBook(mk ?? '');
  const [selectedLayout, setSelectedLayout] = useState<PageLayoutType>(book?.pageLayout || 'quad');
  const [selectedFont, setSelectedFont] = useState<BookFontType>(book?.fontFamily || 'playfair');

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
    const willHide = !hiddenDays.includes(date);
    await toggleHideDayInBook(book!.monthKey, date);
    Alert.alert(
      willHide ? 'Day Hidden' : 'Day Restored',
      willHide
        ? 'This day is hidden from print orders and PDF exports. Your diary memories remain safe.'
        : 'This day will now be included in print orders and PDF exports.',
    );
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

  async function handleSelectLayout(newLayout: PageLayoutType) {
    setSelectedLayout(newLayout);
    Haptics.selectionAsync();
    await updateBookConfig(book!.monthKey, { pageLayout: newLayout });
  }

  async function handleSelectFont(newFont: BookFontType) {
    setSelectedFont(newFont);
    Haptics.selectionAsync();
    await updateBookConfig(book!.monthKey, { fontFamily: newFont });
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
          accessibilityRole="button"
          accessibilityLabel="Back to library"
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
          {/* Layout & Typography Studio Trigger */}
          <TouchableOpacity
            onPress={() => setShowLayoutModal(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.headerBtn}
            accessibilityRole="button"
            accessibilityLabel="Change page layout and typography"
          >
            <SlidersHorizontal size={20} color={colors.foreground} />
          </TouchableOpacity>

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
              accessibilityRole="button"
              accessibilityLabel={isCurrentDayHidden ? "Unhide this day in book" : "Hide this day in book"}
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
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

          const layoutToUse = day.layout || selectedLayout || 'quad';
          const headingFont = resolveHeadingFont(selectedFont);
          const bodyFont = resolveBodyFont(selectedFont);

          const openEditor = () => {
            router.push({ pathname: '/log-modal', params: { date: day.date } });
          };

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
                    <View>
                      <Text style={[styles.dayDate, { color: colors.foreground }, headingFont]}>
                        {formatFullDate(day.date)}
                      </Text>
                      <TouchableOpacity
                        style={styles.layoutPickerPill}
                        onPress={() => setShowLayoutModal(true)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Sparkle size={11} color={colors.primary} weight="fill" />
                        <Text style={[styles.layoutPickerPillText, { color: colors.primary }]}>
                          Layout: {layoutToUse.toUpperCase()} ▾
                        </Text>
                      </TouchableOpacity>
                    </View>
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

                  {/* 5 Distinct Photo-First Layout Engines */}
                  <View style={styles.layoutEngineContainer}>
                    {layoutToUse === 'quad' && renderQuadLayout(slots, colors, bodyFont, openEditor)}
                    {layoutToUse === 'strips' && renderStripsLayout(slots, colors, bodyFont, openEditor)}
                    {layoutToUse === 'hero' && renderHeroLayout(slots, colors, bodyFont, openEditor)}
                    {layoutToUse === 'magazine' && renderMagazineLayout(slots, colors, bodyFont, openEditor)}
                    {layoutToUse === 'polaroid' && renderPolaroidLayout(slots, colors, bodyFont, openEditor)}
                  </View>

                  {/* Fill empty moments CTA if day has room */}
                  {hasEmptySlots && !book.locked && (
                    <TouchableOpacity
                      style={[styles.fillEmptyBtn, { borderColor: colors.border, backgroundColor: colors.accentLight }]}
                      onPress={openEditor}
                      activeOpacity={0.8}
                    >
                      <PencilSimple size={14} color={colors.primary} />
                      <Text style={[styles.fillEmptyBtnText, { color: colors.primary }]}>
                        Add remaining memories ({4 - day.entries.length} left)
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
          accessibilityRole="button"
          accessibilityLabel="Previous page"
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
          accessibilityRole="button"
          accessibilityLabel="Next page"
        >
          <Text style={[styles.navPageText, { color: colors.foreground }]}>Next</Text>
          <CaretRight size={20} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* ── Layout & Typography Customizer Modal ───────────────────────────── */}
      <Modal
        visible={showLayoutModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLayoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
                  Book Layout & Type
                </Text>
                <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
                  Customize how memories reflow on the printed page
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowLayoutModal(false)}>
                <X size={22} color={colors.foreground} weight="bold" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
              {/* 1. Page Layout Selection (5 options) */}
              <View style={{ gap: 8 }}>
                <Text style={[styles.settingLabel, { color: colors.tertiary }]}>PAGE LAYOUT STYLE (5 STYLES)</Text>
                
                {/* Option 1: Quad (User Figma 1) */}
                <TouchableOpacity
                  style={[
                    styles.layoutOption,
                    { borderColor: selectedLayout === 'quad' ? colors.primary : colors.border },
                    selectedLayout === 'quad' && { backgroundColor: colors.accentLight },
                  ]}
                  onPress={() => handleSelectLayout('quad')}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[styles.layoutOptionTitle, { color: colors.foreground }]}>
                      Layout 1: Gallery 2×2 Quad (Figma Ref)
                    </Text>
                    <Text style={[styles.layoutOptionDesc, { color: colors.mutedForeground }]}>
                      4 balanced square photos with pill tag in corner and 2-line caption.
                    </Text>
                  </View>
                  {selectedLayout === 'quad' && <Check size={18} color={colors.primary} weight="bold" />}
                </TouchableOpacity>

                {/* Option 2: Filmstrips (User Figma 2) */}
                <TouchableOpacity
                  style={[
                    styles.layoutOption,
                    { borderColor: selectedLayout === 'strips' ? colors.primary : colors.border },
                    selectedLayout === 'strips' && { backgroundColor: colors.accentLight },
                  ]}
                  onPress={() => handleSelectLayout('strips')}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[styles.layoutOptionTitle, { color: colors.foreground }]}>
                      Layout 2: Cinematic Filmstrips (Figma Ref)
                    </Text>
                    <Text style={[styles.layoutOptionDesc, { color: colors.mutedForeground }]}>
                      4 panoramic wide banners with split caption on left and pill on right.
                    </Text>
                  </View>
                  {selectedLayout === 'strips' && <Check size={18} color={colors.primary} weight="bold" />}
                </TouchableOpacity>

                {/* Option 3: Hero */}
                <TouchableOpacity
                  style={[
                    styles.layoutOption,
                    { borderColor: selectedLayout === 'hero' ? colors.primary : colors.border },
                    selectedLayout === 'hero' && { backgroundColor: colors.accentLight },
                  ]}
                  onPress={() => handleSelectLayout('hero')}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[styles.layoutOptionTitle, { color: colors.foreground }]}>
                      Layout 3: Editorial Hero + 3 Micro
                    </Text>
                    <Text style={[styles.layoutOptionDesc, { color: colors.mutedForeground }]}>
                      1 dominant focal hero photo with 3 square vignettes beneath.
                    </Text>
                  </View>
                  {selectedLayout === 'hero' && <Check size={18} color={colors.primary} weight="bold" />}
                </TouchableOpacity>

                {/* Option 4: Magazine */}
                <TouchableOpacity
                  style={[
                    styles.layoutOption,
                    { borderColor: selectedLayout === 'magazine' ? colors.primary : colors.border },
                    selectedLayout === 'magazine' && { backgroundColor: colors.accentLight },
                  ]}
                  onPress={() => handleSelectLayout('magazine')}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[styles.layoutOptionTitle, { color: colors.foreground }]}>
                      Layout 4: Magazine Spread (2×2 Split)
                    </Text>
                    <Text style={[styles.layoutOptionDesc, { color: colors.mutedForeground }]}>
                      Alternating photo & quote pacing across 2 stacked rows.
                    </Text>
                  </View>
                  {selectedLayout === 'magazine' && <Check size={18} color={colors.primary} weight="bold" />}
                </TouchableOpacity>

                {/* Option 5: Polaroid */}
                <TouchableOpacity
                  style={[
                    styles.layoutOption,
                    { borderColor: selectedLayout === 'polaroid' ? colors.primary : colors.border },
                    selectedLayout === 'polaroid' && { backgroundColor: colors.accentLight },
                  ]}
                  onPress={() => handleSelectLayout('polaroid')}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[styles.layoutOptionTitle, { color: colors.foreground }]}>
                      Layout 5: Tactile Polaroid Scrapbook
                    </Text>
                    <Text style={[styles.layoutOptionDesc, { color: colors.mutedForeground }]}>
                      White bordered instant-film cards with warm scrapbook tilts.
                    </Text>
                  </View>
                  {selectedLayout === 'polaroid' && <Check size={18} color={colors.primary} weight="bold" />}
                </TouchableOpacity>
              </View>

              {/* 2. Book-Wide Typography */}
              <View style={{ gap: 8 }}>
                <Text style={[styles.settingLabel, { color: colors.tertiary }]}>BOOK-WIDE FONT (APPLIES TO ENTIRE VOLUME)</Text>
                <View style={styles.fontGrid}>
                  {[
                    { id: 'playfair' as const, name: 'Playfair Serif', sub: 'Classic Editorial' },
                    { id: 'garamond' as const, name: 'Garamond', sub: 'Literary Elegance' },
                    { id: 'sans' as const, name: 'Inter Sans', sub: 'Modern & Clean' },
                    { id: 'typewriter' as const, name: 'Typewriter', sub: 'Archival Vintage' },
                  ].map(f => {
                    const active = selectedFont === f.id;
                    return (
                      <TouchableOpacity
                        key={f.id}
                        style={[
                          styles.fontCard,
                          { borderColor: active ? colors.primary : colors.border },
                          active && { backgroundColor: colors.accentLight },
                        ]}
                        onPress={() => handleSelectFont(f.id)}
                      >
                        <Text style={[styles.fontCardName, { color: colors.foreground }]}>{f.name}</Text>
                        <Text style={[styles.fontCardSub, { color: colors.mutedForeground }]}>{f.sub}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalDoneBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowLayoutModal(false)}
            >
              <Text style={[styles.modalDoneBtnText, { color: colors.primaryForeground }]}>
                Apply to Book ✓
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Layout Renderers ─────────────────────────────────────────────────────────

function renderQuadLayout(slots: (Entry | null)[], colors: any, bodyFont: any, onOpenLog: () => void) {
  return (
    <View style={styles.quadGrid}>
      {slots.map((entry, idx) => {
        const photo = entry?.photos?.[0];
        return (
          <TouchableOpacity key={idx} style={styles.quadCell} onPress={onOpenLog} activeOpacity={0.85}>
            <View style={[styles.quadPhotoWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              {photo ? (
                <Image source={{ uri: photo }} style={styles.quadPhoto} resizeMode="cover" />
              ) : (
                <View style={styles.emptyPhotoBox}>
                  <Camera size={18} color={colors.tertiary} />
                  <Text style={[styles.emptyPhotoText, { color: colors.tertiary }]}>+ Photo</Text>
                </View>
              )}
              <View style={styles.pillBadge}>
                <Text style={styles.pillBadgeText}>
                  {entry?.category ? entry.category.toUpperCase() : `0${idx + 1}`}
                </Text>
              </View>
            </View>
            <Text style={[styles.quadCaption, bodyFont, { color: colors.foreground }]} numberOfLines={2}>
              {entry?.text || 'Tap to add memory'}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function renderStripsLayout(slots: (Entry | null)[], colors: any, bodyFont: any, onOpenLog: () => void) {
  return (
    <View style={styles.stripsContainer}>
      {slots.map((entry, idx) => {
        const photo = entry?.photos?.[0];
        return (
          <TouchableOpacity key={idx} style={styles.stripRow} onPress={onOpenLog} activeOpacity={0.85}>
            <View style={[styles.stripPhotoWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              {photo ? (
                <Image source={{ uri: photo }} style={styles.stripPhoto} resizeMode="cover" />
              ) : (
                <View style={styles.emptyPhotoBoxHorizontal}>
                  <Camera size={16} color={colors.tertiary} />
                  <Text style={[styles.emptyPhotoText, { color: colors.tertiary }]}>+ Photo 0{idx + 1}</Text>
                </View>
              )}
            </View>
            <View style={styles.stripMetaRow}>
              <Text style={[styles.stripCaption, bodyFont, { color: colors.foreground }]} numberOfLines={1}>
                {entry?.text || 'Tap to add memory'}
              </Text>
              <View style={[styles.stripPill, { backgroundColor: colors.accentLight }]}>
                <Text style={[styles.stripPillText, { color: colors.primary }]}>
                  {entry?.category ? entry.category.toUpperCase() : `0${idx + 1}`}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function renderHeroLayout(slots: (Entry | null)[], colors: any, bodyFont: any, onOpenLog: () => void) {
  const hero = slots[0];
  const subs = slots.slice(1);
  const heroPhoto = hero?.photos?.[0];

  return (
    <View style={styles.heroContainer}>
      <TouchableOpacity style={styles.heroBox} onPress={onOpenLog} activeOpacity={0.85}>
        <View style={[styles.heroPhotoWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          {heroPhoto ? (
            <Image source={{ uri: heroPhoto }} style={styles.heroPhoto} resizeMode="cover" />
          ) : (
            <View style={styles.emptyPhotoBox}>
              <Camera size={22} color={colors.tertiary} />
              <Text style={[styles.emptyPhotoText, { color: colors.tertiary }]}>+ Hero Photo</Text>
            </View>
          )}
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>★ HERO MOMENT</Text>
          </View>
        </View>
        <Text style={[styles.heroCaption, bodyFont, { color: colors.foreground }]} numberOfLines={2}>
          {hero?.text || 'Tap to record the highlight of today'}
        </Text>
      </TouchableOpacity>

      <View style={styles.microRow}>
        {subs.map((entry, idx) => {
          const photo = entry?.photos?.[0];
          return (
            <TouchableOpacity key={idx} style={styles.microCell} onPress={onOpenLog} activeOpacity={0.85}>
              <View style={[styles.microPhotoWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                {photo ? (
                  <Image source={{ uri: photo }} style={styles.microPhoto} resizeMode="cover" />
                ) : (
                  <View style={styles.emptyPhotoBoxMicro}>
                    <Camera size={14} color={colors.tertiary} />
                  </View>
                )}
              </View>
              <Text style={[styles.microCaption, bodyFont, { color: colors.foreground }]} numberOfLines={2}>
                {entry?.text || `Moment 0${idx + 2}`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function renderMagazineLayout(slots: (Entry | null)[], colors: any, bodyFont: any, onOpenLog: () => void) {
  const m1 = slots[0];
  const m2 = slots[1];

  return (
    <View style={styles.magazineContainer}>
      <View style={styles.magazineRow}>
        <TouchableOpacity style={styles.magazinePhotoCol} onPress={onOpenLog} activeOpacity={0.85}>
          {m1?.photos?.[0] ? (
            <Image source={{ uri: m1.photos[0] }} style={styles.magazinePhoto} resizeMode="cover" />
          ) : (
            <View style={[styles.emptyPhotoBox, { backgroundColor: colors.muted }]}>
              <Camera size={18} color={colors.tertiary} />
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.magazineTextCol} onPress={onOpenLog} activeOpacity={0.85}>
          <Text style={[styles.magazineTag, { color: colors.primary }]}>{m1?.category?.toUpperCase() || '01 · MOMENT'}</Text>
          <Text style={[styles.magazineStory, bodyFont, { color: colors.foreground }]} numberOfLines={3}>
            {m1?.text || 'Tap to record memory...'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.magazineRow}>
        <TouchableOpacity style={styles.magazineTextCol} onPress={onOpenLog} activeOpacity={0.85}>
          <Text style={[styles.magazineTag, { color: colors.primary }]}>{m2?.category?.toUpperCase() || '02 · MOMENT'}</Text>
          <Text style={[styles.magazineStory, bodyFont, { color: colors.foreground }]} numberOfLines={3}>
            {m2?.text || 'Tap to record memory...'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.magazinePhotoCol} onPress={onOpenLog} activeOpacity={0.85}>
          {m2?.photos?.[0] ? (
            <Image source={{ uri: m2.photos[0] }} style={styles.magazinePhoto} resizeMode="cover" />
          ) : (
            <View style={[styles.emptyPhotoBox, { backgroundColor: colors.muted }]}>
              <Camera size={18} color={colors.tertiary} />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function renderPolaroidLayout(slots: (Entry | null)[], colors: any, bodyFont: any, onOpenLog: () => void) {
  return (
    <View style={styles.polaroidGrid}>
      {slots.map((entry, idx) => {
        const photo = entry?.photos?.[0];
        const rot = idx % 2 === 0 ? '-1.5deg' : '1.5deg';
        return (
          <TouchableOpacity
            key={idx}
            style={[styles.polaroidCard, { transform: [{ rotate: rot }] }]}
            onPress={onOpenLog}
            activeOpacity={0.85}
          >
            <View style={styles.polaroidPhotoFrame}>
              {photo ? (
                <Image source={{ uri: photo }} style={styles.polaroidPhoto} resizeMode="cover" />
              ) : (
                <View style={styles.emptyPolaroidBox}>
                  <Camera size={16} color="#999" />
                </View>
              )}
            </View>
            <Text style={[styles.polaroidCaption, bodyFont]} numberOfLines={2}>
              {entry?.text ? `"${entry.text}"` : 'Snapshot unrecorded'}
            </Text>
          </TouchableOpacity>
        );
      })}
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

  /* Layout Engine & Switching Pill */
  layoutPickerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  layoutPickerPillText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
  },
  layoutEngineContainer: {
    flex: 1,
    paddingVertical: 4,
  },

  /* 1. Quad Layout (User Figma Sketch 1) */
  quadGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'space-between',
    gap: 8,
  },
  quadCell: {
    width: '48%',
    height: '48%',
    justifyContent: 'flex-start',
  },
  quadPhotoWrap: {
    width: '100%',
    height: '70%',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  quadPhoto: {
    width: '100%',
    height: '100%',
  },
  pillBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pillBadgeText: {
    fontSize: 8,
    fontFamily: 'Inter_700Bold',
    color: '#FFF',
  },
  quadCaption: {
    fontSize: 11,
    lineHeight: 14,
    marginTop: 4,
  },
  emptyPhotoBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  emptyPhotoText: {
    fontSize: 9,
    fontFamily: 'Inter_500Medium',
  },

  /* 2. Filmstrips Layout (User Figma Sketch 2) */
  stripsContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  stripRow: {
    height: '23%',
    width: '100%',
    justifyContent: 'space-between',
  },
  stripPhotoWrap: {
    width: '100%',
    height: '66%',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
  },
  stripPhoto: {
    width: '100%',
    height: '100%',
  },
  emptyPhotoBoxHorizontal: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  stripMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  stripCaption: {
    flex: 1,
    fontSize: 11,
    marginRight: 6,
  },
  stripPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stripPillText: {
    fontSize: 8,
    fontFamily: 'Inter_700Bold',
  },

  /* 3. Hero + 3 Micro Layout */
  heroContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  heroBox: {
    width: '100%',
    height: '60%',
  },
  heroPhotoWrap: {
    width: '100%',
    height: '80%',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  heroPhoto: {
    width: '100%',
    height: '100%',
  },
  heroBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(232, 89, 58, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  heroBadgeText: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: '#FFF',
  },
  heroCaption: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
  microRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: '36%',
  },
  microCell: {
    width: '31%',
    height: '100%',
  },
  microPhotoWrap: {
    width: '100%',
    height: '66%',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
  },
  microPhoto: {
    width: '100%',
    height: '100%',
  },
  emptyPhotoBoxMicro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  microCaption: {
    fontSize: 10,
    lineHeight: 13,
    marginTop: 2,
  },

  /* 4. Magazine Spread Layout */
  magazineContainer: {
    flex: 1,
    justifyContent: 'space-evenly',
    paddingVertical: 4,
  },
  magazineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '46%',
    gap: 10,
  },
  magazinePhotoCol: {
    width: '48%',
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  magazinePhoto: {
    width: '100%',
    height: '100%',
  },
  magazineTextCol: {
    width: '48%',
    justifyContent: 'center',
    gap: 4,
  },
  magazineTag: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  magazineStory: {
    fontSize: 12,
    lineHeight: 17,
  },

  /* 5. Polaroid Scrapbook Layout */
  polaroidGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'space-between',
    paddingVertical: 4,
    gap: 8,
  },
  polaroidCard: {
    width: '48%',
    height: '48%',
    backgroundColor: '#FFFFFF',
    padding: 6,
    paddingBottom: 8,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  polaroidPhotoFrame: {
    width: '100%',
    height: '70%',
    backgroundColor: '#EEE',
    overflow: 'hidden',
  },
  polaroidPhoto: {
    width: '100%',
    height: '100%',
  },
  emptyPolaroidBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  polaroidCaption: {
    fontSize: 10,
    lineHeight: 13,
    marginTop: 4,
    color: '#333',
    textAlign: 'center',
  },

  /* Modal Customizer Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
  },
  modalSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  settingLabel: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  layoutOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  layoutOptionTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  layoutOptionDesc: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  fontGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fontCard: {
    width: '48%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  fontCardName: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  fontCardSub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  modalDoneBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  modalDoneBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});
