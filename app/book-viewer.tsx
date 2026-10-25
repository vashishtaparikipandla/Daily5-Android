import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, Platform, Alert, Image,
  Modal, ScrollView, Animated, PanResponder,
} from 'react-native';
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
  FilmStrip,
  LockSimple,
} from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDiary } from '@/contexts/DiaryContext';
import { BookCover } from '@/components/BookCover';
import { BrandLogoLoader } from '@/components/BrandLogo';
import { VisualLayoutPicker } from '@/components/VisualLayoutPicker';
import { WeeklyReelModal } from '@/components/WeeklyReelModal';
import { ProtectedScreen } from '@/components/ProtectedScreen';
import { exportBookAsPdf } from '@/lib/pdfExport';
import { bookDisplayName, formatShortDate, formatFullDate } from '@/lib/data';
import type { Book, DayLog, Entry, PageLayoutType, BookFontType } from '@/lib/data';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PAGE_WIDTH = SCREEN_WIDTH;
const BOOK_CARD_WIDTH = Math.min(SCREEN_WIDTH - 24, 440);

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

  const [pageIndex, setPageIndex] = useState(0);
  const [turnDirection, setTurnDirection] = useState<'next' | 'prev' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [exporting, setExporting] = useState(false);
  const [showLayoutModal, setShowLayoutModal] = useState(false);
  const [showVolumeReel, setShowVolumeReel] = useState(false);
  const [showSealModal, setShowSealModal] = useState(false);

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
  const botPad = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16) + 16;

  const pageIndexRef = useRef(pageIndex);
  pageIndexRef.current = pageIndex;
  const pagesLengthRef = useRef(pages.length);
  pagesLengthRef.current = pages.length;
  const isAnimatingRef = useRef(isAnimating);
  isAnimatingRef.current = isAnimating;
  const turnDirectionRef = useRef(turnDirection);
  turnDirectionRef.current = turnDirection;

  function flipNext() {
    if (isAnimatingRef.current || pageIndexRef.current >= pagesLengthRef.current - 1) return;
    setIsAnimating(true);
    isAnimatingRef.current = true;
    setTurnDirection('next');
    turnDirectionRef.current = 'next';
    flipAnim.setValue(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(flipAnim, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start(() => {
      setPageIndex(p => Math.min(pagesLengthRef.current - 1, p + 1));
      flipAnim.setValue(0);
      setTurnDirection(null);
      turnDirectionRef.current = null;
      setIsAnimating(false);
      isAnimatingRef.current = false;
    });
  }

  function flipPrev() {
    if (isAnimatingRef.current || pageIndexRef.current <= 0) return;
    setIsAnimating(true);
    isAnimatingRef.current = true;
    setTurnDirection('prev');
    turnDirectionRef.current = 'prev';
    flipAnim.setValue(1);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(flipAnim, {
      toValue: 0,
      duration: 320,
      useNativeDriver: true,
    }).start(() => {
      setPageIndex(p => Math.max(0, p - 1));
      flipAnim.setValue(0);
      setTurnDirection(null);
      turnDirectionRef.current = null;
      setIsAnimating(false);
      isAnimatingRef.current = false;
    });
  }

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 16 && Math.abs(gestureState.dy) < 40;
      },
      onPanResponderGrant: () => {},
      onPanResponderMove: (_, gestureState) => {
        if (isAnimatingRef.current) return;
        if (gestureState.dx < 0 && pageIndexRef.current < pagesLengthRef.current - 1) {
          if (turnDirectionRef.current !== 'next') {
            setTurnDirection('next');
            turnDirectionRef.current = 'next';
          }
          const prog = Math.min(1, Math.max(0, -gestureState.dx / (BOOK_CARD_WIDTH * 0.75)));
          flipAnim.setValue(prog);
        } else if (gestureState.dx > 0 && pageIndexRef.current > 0) {
          if (turnDirectionRef.current !== 'prev') {
            setTurnDirection('prev');
            turnDirectionRef.current = 'prev';
          }
          const prog = Math.max(0, Math.min(1, 1 - gestureState.dx / (BOOK_CARD_WIDTH * 0.75)));
          flipAnim.setValue(prog);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isAnimatingRef.current) return;
        const currentDir = turnDirectionRef.current;
        if (currentDir === 'next') {
          if (gestureState.dx < -50 || gestureState.vx < -0.3) {
            setIsAnimating(true);
            isAnimatingRef.current = true;
            Animated.timing(flipAnim, {
              toValue: 1,
              duration: 240,
              useNativeDriver: true,
            }).start(() => {
              setPageIndex(p => Math.min(pagesLengthRef.current - 1, p + 1));
              flipAnim.setValue(0);
              setTurnDirection(null);
              turnDirectionRef.current = null;
              setIsAnimating(false);
              isAnimatingRef.current = false;
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            });
          } else {
            Animated.spring(flipAnim, { toValue: 0, useNativeDriver: true }).start(() => {
              setTurnDirection(null);
              turnDirectionRef.current = null;
            });
          }
        } else if (currentDir === 'prev') {
          if (gestureState.dx > 50 || gestureState.vx > 0.3) {
            setIsAnimating(true);
            isAnimatingRef.current = true;
            Animated.timing(flipAnim, {
              toValue: 0,
              duration: 240,
              useNativeDriver: true,
            }).start(() => {
              setPageIndex(p => Math.max(0, p - 1));
              flipAnim.setValue(0);
              setTurnDirection(null);
              turnDirectionRef.current = null;
              setIsAnimating(false);
              isAnimatingRef.current = false;
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            });
          } else {
            Animated.spring(flipAnim, { toValue: 1, useNativeDriver: true }).start(() => {
              setTurnDirection(null);
              turnDirectionRef.current = null;
            });
          }
        } else {
          flipAnim.setValue(0);
        }
      },
    })
  ).current;

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
      'Lock & Seal this volume?',
      "Locking permanently closes this book and preserves it as archival print. No further changes can be made.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Lock Volume',
          onPress: async () => {
            await lockCurrentMonth();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setShowSealModal(true);
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

  const rotateY = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-180deg'],
  });

  const turningOpacity = flipAnim.interpolate({
    inputRange: [0, 0.49, 0.5, 1],
    outputRange: [1, 1, 0, 0],
  });

  const turningShadowOpacity = flipAnim.interpolate({
    inputRange: [0, 0.35, 0.5, 1],
    outputRange: [0, 0.5, 0, 0],
  });

  const underlyingShadowOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.35, 0.15, 0],
  });

  const turningItem =
    turnDirection === 'prev'
      ? pageIndex > 0
        ? pages[pageIndex - 1]
        : null
      : pages[pageIndex];

  const underlyingItem =
    turnDirection === 'prev'
      ? pages[pageIndex]
      : pageIndex < pages.length - 1
      ? pages[pageIndex + 1]
      : null;

  function renderPage(item: PageItem, isTop: boolean) {
    if (item.type === 'cover') {
      const coverBg = book!.coverColor || '#231F1C';
      return (
        <View style={[styles.bookCard, styles.hardboundCard, { backgroundColor: coverBg }]}>
          {/* Thick Hardbound Left Spine (34dp) */}
          <View style={styles.hardboundSpine}>
            <View style={styles.spineRibbonStitch} />
            <View style={styles.spineGoldFoilStripe} />
          </View>

          {/* Brass Corner Accents */}
          <View style={[styles.cornerBrass, styles.cornerTopRight]} />
          <View style={[styles.cornerBrass, styles.cornerBottomRight]} />

          {/* Gold Foil Embossed Cover Frame & Inset */}
          <View style={styles.hardboundInner}>
            {/* Series Header with Rules */}
            <View style={styles.hardboundSeriesRow}>
              <View style={styles.goldSeriesRule} />
              <Text style={styles.hardboundSeriesLabel}>DEAR DAY ARCHIVAL MEMOIR</Text>
              <View style={styles.goldSeriesRule} />
            </View>

            {/* Debossed Gold Title & Subtitle */}
            <View style={styles.hardboundTitleCenter}>
              <Text style={styles.hardboundVolumeTag}>
                VOL. {book!.monthKey.replace('-', ' • ')}
              </Text>
              <Text
                style={[styles.hardboundTitleText, { fontFamily: 'PlayfairDisplay_700Bold' }]}
                numberOfLines={3}
              >
                {bookDisplayName(book!)}
              </Text>
              {book!.description ? (
                <Text style={styles.hardboundDescText} numberOfLines={2}>
                  “{book!.description}”
                </Text>
              ) : null}
            </View>

            {/* Archival Seal & Tactile Turn CTA */}
            <View style={styles.hardboundFooter}>
              <View style={styles.archivalSealBox}>
                <Sparkle size={13} color="#D4AF37" weight="fill" />
                <Text style={styles.archivalSealText}>
                  {book!.locked ? 'ARCHIVAL SEALED • PERMANENT' : 'ARCHIVAL FIRST EDITION • COTTON PAPER'}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                {!book!.locked && (
                  <TouchableOpacity
                    style={[styles.openVolumeBtn, { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)', borderWidth: 1 }]}
                    onPress={handleLock}
                    activeOpacity={0.8}
                  >
                    <LockSimple size={13} color="#F7F4EF" weight="bold" />
                    <Text style={styles.openVolumeBtnText}>Seal Book</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.openVolumeBtn}
                  onPress={flipNext}
                  activeOpacity={0.8}
                >
                  <Text style={styles.openVolumeBtnText}>Open Volume</Text>
                  <CaretRight size={14} color="#F7F4EF" weight="bold" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Silk Ribbon Bookmark */}
            <View style={[styles.silkRibbon, { backgroundColor: colors.primary }]} />
          </View>
        </View>
      );
    }

    const day = item.day!;
    const isHidden = hiddenDays.includes(day.date);
    const slots = Array.from({ length: 4 }, (_, i) => day.entries[i] ?? null);
    const hasEmptySlots = day.entries.length < 4;

    const layoutToUse = selectedLayout || day.layout || 'quad';
    const headingFont = resolveHeadingFont(selectedFont);
    const bodyFont = resolveBodyFont(selectedFont);

    const openEditor = () => {
      router.push({ pathname: '/log-modal', params: { date: day.date } });
    };

    return (
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
          {/* Clean Archival Date Heading (No in-page layout picker) */}
          <View style={styles.dayHeader}>
            <Text style={[styles.dayDate, { color: colors.foreground }, headingFont]}>
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

          {/* 3 Core Photo-First Layout Engines */}
          <View style={styles.layoutEngineContainer}>
            {layoutToUse === 'strips' ? (
              renderStripsLayout(slots, colors, bodyFont, openEditor)
            ) : layoutToUse === 'polaroid' ? (
              renderPolaroidLayout(slots, colors, bodyFont, openEditor)
            ) : (
              renderQuadLayout(slots, colors, bodyFont, openEditor)
            )}
          </View>

          {/* Fill empty moments CTA */}
          {hasEmptySlots && !book!.locked && (
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
    );
  }

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
          {/* Watch Volume Retrospective Story Reel */}
          {sortedDays.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowVolumeReel(true);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.headerBtn}
              accessibilityRole="button"
              accessibilityLabel="Watch Volume Reel"
            >
              <FilmStrip size={20} color={colors.primary} weight="bold" />
            </TouchableOpacity>
          )}

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
              <BrandLogoLoader size={20} color={colors.primary} />
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

      {/* Authentic StPageFlip 3D Stacked Book Viewport */}
      <View style={styles.bookStage} {...panResponder.panHandlers}>
        {/* Underlying Page (already situated beneath) */}
        {underlyingItem && (
          <View style={styles.stackedPageUnderneath}>
            {renderPage(underlyingItem, false)}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.underlyingPageShadow,
                { opacity: underlyingShadowOpacity },
              ]}
            />
          </View>
        )}

        {/* Flipping Top Page with 3D Spine-Anchored RotateY */}
        {turningItem && (
          <Animated.View
            style={[
              styles.stackedPageTop,
              {
                opacity: turningOpacity,
                transform: [
                  { perspective: 1400 },
                  { translateX: -BOOK_CARD_WIDTH / 2 },
                  { rotateY },
                  { translateX: BOOK_CARD_WIDTH / 2 },
                ],
              },
            ]}
          >
            {renderPage(turningItem, true)}

            {/* Dynamic Spine / Paper Peel Gradient Shadow */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.turningPageShadow,
                { opacity: turningShadowOpacity },
              ]}
            />
          </Animated.View>
        )}
      </View>

      {/* Tactile Book Footer with Page Flip Controls */}
      <View style={[styles.footer, { paddingBottom: botPad, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.navPageBtn, { opacity: pageIndex === 0 ? 0.3 : 1 }]}
          onPress={flipPrev}
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
          onPress={flipNext}
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
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: colors.card,
                borderColor: colors.borderStrong,
                paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16) + 24,
              },
            ]}
          >
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
              {/* 1. Page Layout Selection (5 Visual Layouts) */}
              <View style={{ gap: 8 }}>
                <Text style={[styles.settingLabel, { color: colors.tertiary }]}>
                  PAGE LAYOUT STYLE (5 STYLES)
                </Text>
                <VisualLayoutPicker
                  selectedLayout={selectedLayout}
                  onSelectLayout={handleSelectLayout}
                />
              </View>

              {/* 2. Book-Wide Typography (Live Visual Font Specimens) */}
              <View style={{ gap: 8 }}>
                <Text style={[styles.settingLabel, { color: colors.tertiary }]}>
                  BOOK-WIDE FONT (APPLIES TO ENTIRE VOLUME)
                </Text>
                <View style={styles.fontGrid}>
                  {[
                    {
                      id: 'playfair' as const,
                      name: 'Playfair Serif',
                      specimen: 'Aa Bb Gg 123',
                      sample: '“Every sunset is an archive of a day well lived.”',
                      fontStyle: { fontFamily: 'PlayfairDisplay_700Bold' },
                      bodyStyle: { fontFamily: 'PlayfairDisplay_400Regular' },
                    },
                    {
                      id: 'garamond' as const,
                      name: 'Garamond',
                      specimen: 'Aa Bb Gg 123',
                      sample: '“Every sunset is an archive of a day well lived.”',
                      fontStyle: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontWeight: 'bold' as const },
                      bodyStyle: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
                    },
                    {
                      id: 'sans' as const,
                      name: 'Inter Sans',
                      specimen: 'Aa Bb Gg 123',
                      sample: '“Every sunset is an archive of a day well lived.”',
                      fontStyle: { fontFamily: 'Inter_700Bold' },
                      bodyStyle: { fontFamily: 'Inter_400Regular' },
                    },
                    {
                      id: 'typewriter' as const,
                      name: 'Typewriter',
                      specimen: 'Aa Bb Gg 123',
                      sample: '“Every sunset is an archive of a day well lived.”',
                      fontStyle: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: 'bold' as const },
                      bodyStyle: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
                    },
                  ].map(f => {
                    const active = selectedFont === f.id;
                    return (
                      <TouchableOpacity
                        key={f.id}
                        style={[
                          styles.fontCard,
                          {
                            borderColor: active ? colors.primary : colors.borderStrong,
                            backgroundColor: active ? colors.accentLight : colors.card,
                          },
                        ]}
                        onPress={() => handleSelectFont(f.id)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.fontCardHeader}>
                          <Text style={[styles.fontCardName, { color: colors.foreground }]}>{f.name}</Text>
                          {active && <Check size={16} color={colors.primary} weight="bold" />}
                        </View>
                        <Text style={[styles.fontSpecimen, f.fontStyle, { color: colors.foreground }]}>
                          {f.specimen}
                        </Text>
                        <Text style={[styles.fontSampleText, f.bodyStyle, { color: colors.mutedForeground }]} numberOfLines={2}>
                          {f.sample}
                        </Text>
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

      {/* ── Volume Retrospective Story Reel Modal ──────────────────────── */}
      <WeeklyReelModal
        visible={showVolumeReel}
        onClose={() => setShowVolumeReel(false)}
        weeklyDays={sortedDays}
        streakCount={book.days.length}
        title={`VOL. ${book.monthKey} RETROSPECTIVE`}
        subtitle="Archival memories in review"
        summaryTitle="Volume in Review"
        summarySubtitle={`${book.days.length} days captured and preserved.`}
      />

      {/* ── Archival Wax Seal Ceremony Modal ───────────────────────────── */}
      <Modal
        visible={showSealModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSealModal(false)}
      >
        <View style={styles.sealModalOverlay}>
          <View style={[styles.sealModalCard, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}>
            <View style={styles.sealWaxRing}>
              <View style={styles.sealWaxCore}>
                <Sparkle size={32} color="#F7F4EF" weight="fill" />
              </View>
            </View>

            <Text style={[styles.sealModalTitle, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
              Volume Bound & Sealed
            </Text>
            <Text style={[styles.sealModalSub, { color: colors.mutedForeground }]}>
              This edition of {bookDisplayName(book)} is now permanently closed and preserved in your archival library.
            </Text>

            <View style={styles.sealActionRow}>
              <TouchableOpacity
                style={[styles.sealActionSecondary, { borderColor: colors.border }]}
                onPress={() => {
                  setShowSealModal(false);
                  router.back();
                }}
              >
                <Text style={[styles.sealActionSecondaryText, { color: colors.foreground }]}>
                  Back to Library
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sealActionPrimary, { backgroundColor: colors.primary }]}
                onPress={() => {
                  setShowSealModal(false);
                  setShowVolumeReel(true);
                }}
              >
                <FilmStrip size={16} color={colors.primaryForeground} weight="bold" />
                <Text style={[styles.sealActionPrimaryText, { color: colors.primaryForeground }]}>
                  Watch Reel
                </Text>
              </TouchableOpacity>
            </View>
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

  /* Authentic StPageFlip Stage & Stacked Page Turn */
  bookStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    position: 'relative',
  },
  stackedPageUnderneath: {
    position: 'absolute',
    width: BOOK_CARD_WIDTH,
    height: '96%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  stackedPageTop: {
    width: BOOK_CARD_WIDTH,
    height: '96%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    backfaceVisibility: 'hidden',
  },
  underlyingPageShadow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    borderRadius: 20,
    zIndex: 10,
  },
  turningPageShadow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    borderRadius: 20,
    zIndex: 10,
  },
  pageSlide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  bookCard: {
    width: BOOK_CARD_WIDTH,
    height: '100%',
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

  /* Hardbound Book Volume Cover */
  hardboundCard: {
    borderColor: '#3D352E',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 6, height: 10 },
    elevation: 10,
  },
  hardboundSpine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 32,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderRightWidth: 1.5,
    borderRightColor: '#D4AF3788',
    zIndex: 5,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 30,
  },
  spineRibbonStitch: {
    width: 2,
    height: '80%',
    backgroundColor: 'rgba(212, 175, 55, 0.35)',
    borderRadius: 1,
  },
  spineGoldFoilStripe: {
    position: 'absolute',
    right: 2,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#D4AF37',
    opacity: 0.5,
  },
  cornerBrass: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderColor: '#D4AF37',
    zIndex: 6,
  },
  cornerTopRight: {
    top: 8,
    right: 8,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderTopRightRadius: 6,
  },
  cornerBottomRight: {
    bottom: 8,
    right: 8,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomRightRadius: 6,
  },
  hardboundInner: {
    flex: 1,
    paddingLeft: 46,
    paddingRight: 22,
    paddingVertical: 28,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hardboundSeriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  goldSeriesRule: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.45)',
  },
  hardboundSeriesLabel: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.2,
    color: '#D4AF37',
    textTransform: 'uppercase',
  },
  hardboundTitleCenter: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 6,
  },
  hardboundVolumeTag: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.5,
    color: '#E5C378',
    textTransform: 'uppercase',
  },
  hardboundTitleText: {
    fontSize: 26,
    color: '#FBF8F3',
    textAlign: 'center',
    lineHeight: 34,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  hardboundDescText: {
    fontSize: 13,
    fontFamily: 'PlayfairDisplay_400Regular',
    fontStyle: 'italic',
    color: '#D8CEBE',
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 4,
  },
  hardboundFooter: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  archivalSealBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderColor: 'rgba(212, 175, 55, 0.35)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  archivalSealText: {
    fontSize: 8,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8,
    color: '#D4AF37',
    textTransform: 'uppercase',
  },
  openVolumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(229, 195, 120, 0.18)',
    borderColor: '#D4AF37',
    borderWidth: 1,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  openVolumeBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#F7F4EF',
    letterSpacing: 0.3,
  },
  silkRibbon: {
    position: 'absolute',
    left: 48,
    bottom: -16,
    width: 14,
    height: 38,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    zIndex: 7,
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
  fontGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  fontCard: {
    width: '48%',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  fontCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fontCardName: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  fontSpecimen: {
    fontSize: 16,
    letterSpacing: 0.5,
  },
  fontSampleText: {
    fontSize: 10,
    lineHeight: 14,
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
  sealModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sealModalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  sealWaxRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#C4472A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(196, 71, 42, 0.1)',
  },
  sealWaxCore: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#C4472A',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  sealModalTitle: {
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
  sealModalSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  sealActionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  sealActionSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealActionSecondaryText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  sealActionPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  sealActionPrimaryText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
});
