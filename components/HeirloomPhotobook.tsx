import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
  Share,
  Modal,
  ScrollView,
  PanResponder,
  useWindowDimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import {
  Lock,
  Camera,
  ShareNetwork,
  ArrowClockwise,
  CaretLeft,
  CaretRight,
  Plus,
  X,
  BookOpen,
  Sparkle,
  UploadSimple,
  Check,
} from 'phosphor-react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useColors } from '@/hooks/useColors';
import { useDiary } from '@/contexts/DiaryContext';
import { uid, todayStr, type Entry } from '@/lib/data';
import { playStickyGlueSound, playPaperRustleSound } from '@/lib/soundEffects';
import { STICKER_CATALOG } from '@/components/HeirloomStickers';
import { HandPlacementVisual } from '@/components/HandPlacementVisual';

// ============================================================================
// CONSTANTS & LINEN THEMES
// ============================================================================
export const LINEN_THEMES = [
  { name: 'Lavender', main: '#C7C3D4', spine: '#9D97B0', border: '#B5B0C6' },
  { name: 'Terracotta', main: '#D68060', spine: '#B06145', border: '#C26E4F' },
  { name: 'Sage', main: '#9CAF9E', spine: '#788C7A', border: '#899E8B' },
  { name: 'Oatmeal', main: '#D8CFC2', spine: '#B5AA9B', border: '#C5BBAE' },
];

const DAYS_OF_WEEK = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

interface PlacedSticker {
  uid: string;
  id: string;
  x: number;
  y: number;
  rot: number;
}

interface HeirloomPhotobookProps {
  initialDay?: number;
  monthKey?: string;
}

export function HeirloomPhotobook({ initialDay, monthKey }: HeirloomPhotobookProps) {
  const colors = useColors();
  const { width: winWidth } = useWindowDimensions();
  const bookWidth = Math.min(winWidth - 28, 380);
  const bookHeight = Math.min(bookWidth * 1.45, 540);

  const { getDayLog, upsertDayEntries, getBook, updateBookConfig } = useDiary();

  const today = new Date();
  const todayDayNum = today.getDate();
  const currentMonthYear = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const currentMonthName = today.toLocaleDateString('en-US', { month: 'long' });
  const totalDaysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  // Page index: 0 = Front Cover (0.68x), 1..totalDays = Day, totalDays + 1 = Back Cover
  const [activePage, setActivePage] = useState<number>(initialDay ?? todayDayNum);
  const [linenIndex, setLinenIndex] = useState(0); // Terracotta default
  const [cornerTeased, setCornerTeased] = useState(false);
  const [shakingSlotIdx, setShakingSlotIdx] = useState<number | null>(null);
  const [pulseHeaderLock, setPulseHeaderLock] = useState(false);

  // Cover state
  const [coverPhoto, setCoverPhoto] = useState(
    'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=600&q=80'
  );
  const [coverTitle, setCoverTitle] = useState(`${currentMonthName} Family Memories`);
  const [coverSubtitle, setCoverSubtitle] = useState('Curated daily • Printed for the living room');
  const [editingCoverField, setEditingCoverField] = useState<'title' | 'subtitle' | null>(null);
  const [coverMenuVisible, setCoverMenuVisible] = useState(false);
  const [shareToast, setShareToast] = useState(false);

  // Sticker tray & placed stickers per day
  const [stickerTrayOpen, setStickerTrayOpen] = useState(false);
  const [pageStickers, setPageStickers] = useState<Record<number, PlacedSticker[]>>({
    [todayDayNum]: [
      { uid: 'init-stk-1', id: 'stk-love', x: 130, y: 195, rot: -6 },
    ],
  });

  // Hand Placement State
  const [handPlacement, setHandPlacement] = useState<{ slotIdx: number; photoUrl: string } | null>(null);

  // 2-Line Caption Editor Modal
  const [captionEditor, setCaptionEditor] = useState<{ slotIdx: number; text: string } | null>(null);

  // Confetti cannon
  const confettiRef = useRef<any>(null);

  const currentLinen = LINEN_THEMES[linenIndex];
  const isCoverView = activePage === 0 || activePage === totalDaysInMonth + 1;
  const isFutureDay = activePage > todayDayNum && activePage <= totalDaysInMonth;

  // Convert activePage to date string YYYY-MM-DD
  function getActiveDateStr(dayNum: number): string {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(dayNum).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const activeDateStr = getActiveDateStr(activePage);
  const activeDayLog = getDayLog(activeDateStr);
  const dayOfWeekName = activePage >= 1 && activePage <= totalDaysInMonth
    ? DAYS_OF_WEEK[new Date(today.getFullYear(), today.getMonth(), activePage).getDay()]
    : '';

  // Get current 4 slots for active day
  const currentSlots = React.useMemo(() => {
    const entries = activeDayLog?.entries ?? [];
    const slots = [
      { photo: entries[0]?.photos?.[0] || null, caption: entries[0]?.text || '' },
      { photo: entries[1]?.photos?.[0] || null, caption: entries[1]?.text || '' },
      { photo: entries[2]?.photos?.[0] || null, caption: entries[2]?.text || '' },
      { photo: entries[3]?.photos?.[0] || null, caption: entries[3]?.text || '' },
    ];
    return slots;
  }, [activeDayLog]);

  // Handle Page Turns
  const flipToPage = useCallback((targetPage: number) => {
    const clamped = Math.max(0, Math.min(totalDaysInMonth + 1, targetPage));
    if (clamped === activePage) return;
    setCornerTeased(false);
    setCoverMenuVisible(false);
    playPaperRustleSound(clamped > activePage ? 1.05 : 0.92);
    setActivePage(clamped);
  }, [activePage, totalDaysInMonth]);

  // Direct Device Gallery Picker for Slots
  async function handleSlotPicker(slotIdx: number) {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (!res.canceled && res.assets[0]?.uri) {
        const photoUrl = res.assets[0].uri;
        const targetDay = activePage;
        const targetDateStr = getActiveDateStr(targetDay);

        setHandPlacement({ slotIdx, photoUrl });

        setTimeout(() => {
          playStickyGlueSound();
        }, 450);

        setTimeout(async () => {
          const existing = getDayLog(targetDateStr);
          const curEntries: Entry[] = existing ? [...existing.entries] : [];
          while (curEntries.length < slotIdx) {
            curEntries.push({ id: uid(), text: '', photos: [] });
          }
          const existingEntry = curEntries[slotIdx];
          curEntries[slotIdx] = {
            id: existingEntry?.id || uid(),
            text: existingEntry?.text || 'A moment to keep forever.',
            photos: [photoUrl],
          };

          await upsertDayEntries(targetDateStr, curEntries);

          const filledPhotos = curEntries.filter(e => e?.photos?.length).length;
          if (filledPhotos === 4) {
            setTimeout(() => {
              confettiRef.current?.start();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }, 160);
          }
        }, 600);

        setTimeout(() => {
          setHandPlacement(null);
        }, 1150);
      }
    } catch {}
  }

  // Direct Device Gallery Picker for Cover Photo
  async function handleCoverPhotoPicker() {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (!res.canceled && res.assets[0]?.uri) {
        setCoverPhoto(res.assets[0].uri);
        playStickyGlueSound();
      }
    } catch {}
  }

  // Save 2-line caption
  async function handleSaveCaption(text: string) {
    if (!captionEditor) return;
    const slotIdx = captionEditor.slotIdx;
    const targetDateStr = getActiveDateStr(activePage);
    const existing = getDayLog(targetDateStr);
    const curEntries: Entry[] = existing ? [...existing.entries] : [];
    while (curEntries.length <= slotIdx) {
      curEntries.push({ id: uid(), text: '', photos: [] });
    }
    curEntries[slotIdx] = {
      ...curEntries[slotIdx],
      id: curEntries[slotIdx]?.id || uid(),
      text: text.trim(),
    };
    await upsertDayEntries(targetDateStr, curEntries);
    setCaptionEditor(null);
    Haptics.selectionAsync();
  }

  // Add Sticker to active page
  function handleAddSticker(stickerId: string) {
    if (isCoverView) {
      flipToPage(todayDayNum);
      return;
    }
    if (isFutureDay) {
      handleLockedSlotTap(0);
      return;
    }

    const randomX = Math.floor(Math.random() * (bookWidth - 100)) + 30;
    const randomY = Math.floor(Math.random() * (bookHeight - 160)) + 60;
    const randomRot = Math.floor(Math.random() * 20) - 10;

    setPageStickers(prev => {
      const cur = prev[activePage] || [];
      return {
        ...prev,
        [activePage]: [
          ...cur,
          {
            uid: `stk-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            id: stickerId,
            x: randomX,
            y: randomY,
            rot: randomRot,
          },
        ],
      };
    });
    playStickyGlueSound();
  }

  function handleRemoveSticker(stkUid: string) {
    setPageStickers(prev => {
      const cur = prev[activePage] || [];
      return {
        ...prev,
        [activePage]: cur.filter(s => s.uid !== stkUid),
      };
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function handleLockedSlotTap(slotIdx: number) {
    setShakingSlotIdx(slotIdx);
    setPulseHeaderLock(true);
    playPaperRustleSound(0.68);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setTimeout(() => {
      setShakingSlotIdx(null);
      setPulseHeaderLock(false);
    }, 450);
  }

  const stickersOnThisPage = pageStickers[activePage] || [];

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={[styles.topBarBtn, isCoverView && styles.topBarBtnActive]}
          onPress={() => flipToPage(0)}
          activeOpacity={0.8}
        >
          <Text style={[styles.topBarBtnText, isCoverView && styles.topBarBtnTextActive]}>
            Cover
          </Text>
        </TouchableOpacity>

        <Text style={styles.topBarMonthTitle}>
          {currentMonthYear}
        </Text>

        <TouchableOpacity
          style={[styles.todayPillBtn, activePage === todayDayNum && styles.todayPillBtnActive]}
          onPress={() => flipToPage(todayDayNum)}
          activeOpacity={0.8}
        >
          <Text style={[styles.todayPillBtnText, activePage === todayDayNum && styles.todayPillBtnTextActive]}>
            Today (Oct {todayDayNum})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Share Toast */}
      {shareToast && (
        <View style={styles.shareToast}>
          <Check size={14} color="#4ADE80" weight="bold" />
          <Text style={styles.shareToastText}>Book Link Copied to Share!</Text>
        </View>
      )}

      {/* Confetti celebration */}
      <ConfettiCannon
        ref={confettiRef}
        count={50}
        origin={{ x: bookWidth / 2, y: 0 }}
        autoStart={false}
        fadeOut
      />

      {/* AUTHENTIC STUDIO TABLETOP DESK WITH SHADOWS */}
      <View style={styles.tabletopStage}>
        {/* Contact Shadow onto Tabletop */}
        <View
          style={[
            styles.tableContactShadow,
            isCoverView ? styles.tableContactShadowCover : styles.tableContactShadowOpen,
          ]}
        />

        {/* 3D BOOK STAGE */}
        <View
          style={[
            styles.bookStage,
            { width: bookWidth, height: bookHeight },
            isCoverView && styles.bookStageCover,
          ]}
        >
        {/* Left 3D Hardcover Spine Hinge */}
        <View
          style={[
            styles.spineHinge,
            {
              backgroundColor: currentLinen.spine,
              borderColor: currentLinen.border,
            },
          ]}
        />

        {/* Stacked Paper Page Edges (Right and Bottom) */}
        <View style={styles.stackedPagesRight} />
        <View style={styles.stackedPagesBottom} />

        {/* Left Page Peek (when open on a day page) */}
        {!isCoverView && activePage > 1 && (
          <TouchableOpacity
            style={styles.leftPagePeek}
            onPress={() => flipToPage(activePage - 1)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Flip back to ${activePage === 2 ? 'Cover' : `Oct ${activePage - 1}`}`}
          >
            <CaretLeft size={14} color="#8A7E72" weight="bold" />
          </TouchableOpacity>
        )}

        {/* ==============================================================
            A. CLOSED HARDCOVER (Scale 0.68, Embossed Inset Card)
            ============================================================== */}
        {isCoverView ? (
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => flipToPage(todayDayNum)}
            onLongPress={() => {
              setCoverMenuVisible(prev => !prev);
              playPaperRustleSound(1.3);
            }}
            delayLongPress={420}
            style={[
              styles.coverContainer,
              { backgroundColor: currentLinen.main },
            ]}
          >
            {/* Top Embossed Volume Line */}
            <View style={styles.coverTopLine}>
              <Text style={styles.coverTopText}>
                {activePage === 0 ? 'VOLUME 2026 · ARCHIVAL LINEN' : 'HEIRLOOM EDITION'}
              </Text>
            </View>

            {activePage === 0 ? (
              /* Front Cover Inset Card */
              <View style={styles.coverInsetCard}>
                <View style={styles.coverPhotoBox}>
                  <Image source={{ uri: coverPhoto }} style={styles.coverPhotoImg} resizeMode="cover" />
                  <TouchableOpacity
                    style={styles.coverCameraBtn}
                    onPress={handleCoverPhotoPicker}
                    activeOpacity={0.8}
                  >
                    <Camera size={16} color="#FFFFFF" weight="bold" />
                  </TouchableOpacity>
                </View>

                {/* Editable Cover Title */}
                <TouchableOpacity
                  style={styles.coverTitleWrap}
                  onPress={() => setEditingCoverField('title')}
                  activeOpacity={0.8}
                >
                  {editingCoverField === 'title' ? (
                    <TextInput
                      style={styles.coverTitleInput}
                      value={coverTitle}
                      onChangeText={t => setCoverTitle(t.slice(0, 32))}
                      onBlur={() => setEditingCoverField(null)}
                      autoFocus
                      maxLength={32}
                    />
                  ) : (
                    <Text style={styles.coverTitleText} numberOfLines={2}>
                      {coverTitle}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Editable Cover Subtitle */}
                <TouchableOpacity
                  style={styles.coverSubtitleWrap}
                  onPress={() => setEditingCoverField('subtitle')}
                  activeOpacity={0.8}
                >
                  {editingCoverField === 'subtitle' ? (
                    <TextInput
                      style={styles.coverSubtitleInput}
                      value={coverSubtitle}
                      onChangeText={t => setCoverSubtitle(t.slice(0, 48))}
                      onBlur={() => setEditingCoverField(null)}
                      autoFocus
                      maxLength={48}
                    />
                  ) : (
                    <Text style={styles.coverSubtitleText} numberOfLines={2}>
                      {coverSubtitle}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              /* Back Cover */
              <View style={styles.backCoverCard}>
                <View style={styles.backCoverIconBox}>
                  <BookOpen size={24} color="#E8593A" weight="duotone" />
                </View>
                <Text style={styles.backCoverTitle}>October Family Archive</Text>
                <Text style={styles.backCoverDesc}>
                  Archived with love on 220gsm cotton parchment so your family can sit together and relive these days.
                </Text>
              </View>
            )}

            {/* Bottom Minimal Embossed Foil */}
            <View style={styles.coverBottomLine}>
              <Text style={styles.coverBottomText}>
                31 DAYS · TAP & HOLD FOR LINEN THEMES
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          /* ==============================================================
              B. OPEN DAY PAGE (DAYS 1 TO 31)
              ============================================================== */
          <View style={styles.pageContainer}>
            {/* 1. Day Header */}
            <View style={styles.pageHeader}>
              <View style={styles.pageHeaderRow}>
                <Text style={styles.pageHeaderDate}>
                  {dayOfWeekName} • {currentMonthName.toUpperCase()} {activePage}, {today.getFullYear()}
                </Text>
                <Text style={styles.pageHeaderFraction}>
                  {activePage} / {totalDaysInMonth}
                </Text>
              </View>

              {isFutureDay ? (
                /* Future Day Clean Lock Pill */
                <View style={[styles.futureLockPill, pulseHeaderLock && styles.futureLockPillPulse]}>
                  <Lock size={12} color="#B84328" weight="bold" />
                  <Text style={styles.futureLockPillText}>
                    Opens on {currentMonthName.slice(0, 3)} {activePage}
                  </Text>
                </View>
              ) : (
                /* Editable Day Title */
                <Text style={styles.dayTitleText} numberOfLines={1}>
                  {activeDayLog?.entries?.[0]?.text ? `${activeDayLog.entries[0].text.slice(0, 30)}...` : `Memories of ${currentMonthName} ${activePage}`}
                </Text>
              )}
            </View>

            {/* 2. 2x2 Recessed Photo Pockets Grid */}
            <View style={styles.gridContainer}>
              <View style={styles.gridRow}>
                {renderSlot(0)}
                {renderSlot(1)}
              </View>
              <View style={styles.gridRow}>
                {renderSlot(2)}
                {renderSlot(3)}
              </View>
            </View>

            {/* 3. Page Footer Navigation */}
            <View style={styles.pageFooter}>
              <TouchableOpacity
                style={styles.pageFooterBtn}
                onPress={() => flipToPage(activePage - 1)}
                activeOpacity={0.7}
              >
                <CaretLeft size={12} color="#8C7A6B" weight="bold" />
                <Text style={styles.pageFooterBtnText}>
                  {activePage === 1 ? 'Cover' : `${currentMonthName.slice(0, 3)} ${activePage - 1}`}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.pageFooterBtn}
                onPress={() => flipToPage(activePage + 1)}
                activeOpacity={0.7}
              >
                <Text style={styles.pageFooterBtnText}>
                  {activePage === totalDaysInMonth ? 'Back' : `${currentMonthName.slice(0, 3)} ${activePage + 1}`}
                </Text>
                <CaretRight size={12} color="#8C7A6B" weight="bold" />
              </TouchableOpacity>
            </View>

            {/* 4. Placed Stickers Overlay Layer */}
            <View style={styles.stickersOverlay} pointerEvents="box-none">
              {stickersOnThisPage.map(stk => {
                const cat = STICKER_CATALOG.find(c => c.id === stk.id);
                if (!cat) return null;
                return (
                  <TouchableOpacity
                    key={stk.uid}
                    style={[
                      styles.placedSticker,
                      {
                        left: stk.x,
                        top: stk.y,
                        transform: [{ rotate: `${stk.rot}deg` }],
                      },
                    ]}
                    onLongPress={() => handleRemoveSticker(stk.uid)}
                    activeOpacity={0.8}
                  >
                    {cat.render(44)}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 5. Interactive Bottom-Right Corner Curl */}
            <TouchableOpacity
              style={styles.cornerCurlHitbox}
              onPress={() => {
                if (!cornerTeased) {
                  setCornerTeased(true);
                  playPaperRustleSound(1.25);
                } else {
                  setCornerTeased(false);
                  flipToPage(activePage + 1);
                }
              }}
              activeOpacity={0.9}
            >
              <View
                style={[
                  styles.cornerCurlFlap,
                  cornerTeased && styles.cornerCurlFlapTeased,
                ]}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Cover Context Menu (Action Pill Bar on Tap & Hold) */}
      {isCoverView && coverMenuVisible && (
        <View style={styles.coverPillBar}>
          <TouchableOpacity
            style={styles.coverPillBtn}
            onPress={() => flipToPage(activePage === 0 ? totalDaysInMonth + 1 : 0)}
            activeOpacity={0.8}
          >
            <ArrowClockwise size={13} color="#FFFFFF" weight="bold" />
            <Text style={styles.coverPillText}>
              {activePage === 0 ? 'Back Cover' : 'Front Cover'}
            </Text>
          </TouchableOpacity>

          <View style={styles.coverPillSep} />

          <TouchableOpacity
            style={styles.coverPillBtn}
            onPress={async () => {
              setShareToast(true);
              setCoverMenuVisible(false);
              try {
                await Share.share({
                  title: `${currentMonthName} Photobook`,
                  message: `Take a look at our heirloom ${currentMonthName} photobook in Dear Day!`,
                });
              } catch {}
              setTimeout(() => setShareToast(false), 2400);
            }}
            activeOpacity={0.8}
          >
            <ShareNetwork size={13} color="#FFFFFF" weight="bold" />
            <Text style={styles.coverPillText}>Share</Text>
          </TouchableOpacity>

          <View style={styles.coverPillSep} />

          <TouchableOpacity
            style={styles.coverPillBtn}
            onPress={() => {
              setLinenIndex(prev => (prev + 1) % LINEN_THEMES.length);
              Haptics.selectionAsync();
            }}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.linenColorDot,
                { backgroundColor: currentLinen.main },
              ]}
            />
            <Text style={styles.coverPillText}>{currentLinen.name}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ==============================================================
          BOTTOM STICKER DOCK
          ============================================================== */}
      <View style={styles.stickerDock}>
        {!stickerTrayOpen ? (
          /* Overlapped Sticker Cluster Pill (No text) */
          <TouchableOpacity
            style={styles.stickerClusterPill}
            onPress={() => setStickerTrayOpen(true)}
            activeOpacity={0.85}
          >
            <View style={styles.clusterRow}>
              <View style={[styles.clusterItem, { transform: [{ rotate: '-12deg' }] }]}>
                {STICKER_CATALOG[0].render(28)}
              </View>
              <View style={[styles.clusterItem, { transform: [{ rotate: '4deg' }], zIndex: 2 }]}>
                {STICKER_CATALOG[1].render(30)}
              </View>
              <View style={[styles.clusterItem, { transform: [{ rotate: '12deg' }], zIndex: 3 }]}>
                {STICKER_CATALOG[2].render(28)}
              </View>
              <View style={[styles.clusterItem, { transform: [{ rotate: '-6deg' }], zIndex: 2 }]}>
                {STICKER_CATALOG[3].render(28)}
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          /* Expanded Single-Row Carousel */
          <View style={styles.stickerTrayExpanded}>
            <TouchableOpacity
              style={styles.stickerTrayCloseBtn}
              onPress={() => setStickerTrayOpen(false)}
              activeOpacity={0.8}
            >
              <X size={14} color="#3A312B" weight="bold" />
            </TouchableOpacity>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.stickerTrayScroll}
            >
              {STICKER_CATALOG.map(stk => (
                <TouchableOpacity
                  key={stk.id}
                  style={styles.stickerTrayItem}
                  onPress={() => handleAddSticker(stk.id)}
                  activeOpacity={0.8}
                >
                  {stk.render(38)}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
      </View> {/* end tabletopStage */}

      {/* ==============================================================
          2-LINE CAPTION EDITOR MODAL (60-80 CHARS)
          ============================================================== */}
      <Modal
        visible={!!captionEditor}
        transparent
        animationType="fade"
        onRequestClose={() => setCaptionEditor(null)}
      >
        <View style={styles.modalBackdropCenter}>
          <View style={styles.captionModalCard}>
            <View style={styles.captionModalHeader}>
              <Text style={styles.captionModalLabel}>2-LINE PHOTO NOTE</Text>
              <Text
                style={[
                  styles.captionCharCount,
                  (captionEditor?.text.length ?? 0) >= 60 && (captionEditor?.text.length ?? 0) <= 80
                    ? styles.captionCharCountGood
                    : null,
                ]}
              >
                {captionEditor?.text.length ?? 0} / 80 chars
              </Text>
            </View>

            <TextInput
              style={styles.captionTextInput}
              value={captionEditor?.text || ''}
              onChangeText={t => setCaptionEditor(prev => prev ? { ...prev, text: t.slice(0, 80) } : null)}
              placeholder="Write a nostalgic 2-line memory note..."
              placeholderTextColor="#9A8E80"
              multiline
              numberOfLines={2}
              maxLength={80}
              autoFocus
            />

            <View style={styles.captionModalActions}>
              <TouchableOpacity
                style={styles.captionCancelBtn}
                onPress={() => setCaptionEditor(null)}
              >
                <Text style={styles.captionCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.captionSaveBtn}
                onPress={() => handleSaveCaption(captionEditor?.text || '')}
              >
                <Text style={styles.captionSaveText}>Save Note</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

  // Helper to render one of the 4 photo pockets
  function renderSlot(idx: number) {
    const slot = currentSlots[idx];
    const isBeingPlaced = handPlacement?.slotIdx === idx;

    if (isFutureDay) {
      /* Future Day Locked Card */
      return (
        <View key={idx} style={styles.pocketCol}>
          <TouchableOpacity
            style={[
              styles.lockedPocketBox,
              shakingSlotIdx === idx && styles.lockedPocketBoxShake,
            ]}
            onPress={() => handleLockedSlotTap(idx)}
            activeOpacity={0.8}
          >
            <View style={styles.innerCardstockLip} />
            <View style={styles.lockedIconCircle}>
              <Lock size={15} color="#9B8F82" weight="bold" />
            </View>
          </TouchableOpacity>
          <View style={styles.captionSpacer} />
        </View>
      );
    }

    /* Unlocked Day Card */
    return (
      <View key={idx} style={styles.pocketCol}>
        <TouchableOpacity
          style={styles.photoPocketBox}
          onPress={() => {
            Haptics.selectionAsync();
            handleSlotPicker(idx);
          }}
          activeOpacity={0.85}
        >
          {/* Inner Cardstock Lip */}
          <View style={styles.innerCardstockLip} />

          {slot.photo ? (
            <Image source={{ uri: slot.photo }} style={styles.slotPhotoImage} resizeMode="cover" />
          ) : (
            <View style={styles.emptySlotCenter}>
              <View style={styles.slotPlusCircle}>
                <Plus size={16} color="#DF5739" weight="bold" />
              </View>
            </View>
          )}

          {/* 3D Stylized Hand Placement Animation */}
          {isBeingPlaced && (
            <HandPlacementVisual photoUrl={handPlacement.photoUrl} />
          )}
        </TouchableOpacity>

        {/* 2-Line Handwritten Caption */}
        <TouchableOpacity
          style={styles.captionRow}
          onPress={() => setCaptionEditor({ slotIdx: idx, text: slot.caption })}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.captionText,
              !slot.caption && styles.captionTextEmpty,
            ]}
            numberOfLines={2}
          >
            {slot.caption || 'Add a 2-line memory note...'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
}

// ============================================================================
// STYLES (MATCHING ARGON'S EXACT PROPORTIONS & REALISM)
// ============================================================================
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  tabletopStage: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: '#F8F2E8',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#DFD4C0',
    paddingVertical: 10,
    paddingHorizontal: 8,
    shadowColor: '#24160C',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  tableContactShadow: {
    position: 'absolute',
    bottom: 22,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(28, 16, 8, 0.38)',
    zIndex: 1,
  },
  tableContactShadowCover: {
    width: '68%',
  },
  tableContactShadowOpen: {
    width: '88%',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 6,
  },
  topBarBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#EFEAE0',
  },
  topBarBtnActive: {
    backgroundColor: '#2B2420',
  },
  topBarBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4A4039',
  },
  topBarBtnTextActive: {
    color: '#FFFFFF',
  },
  topBarMonthTitle: {
    fontSize: 15,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#2B2420',
  },
  todayPillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: 'rgba(223,87,57,0.12)',
  },
  todayPillBtnActive: {
    backgroundColor: '#DF5739',
  },
  todayPillBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B84328',
  },
  todayPillBtnTextActive: {
    color: '#FFFFFF',
  },
  shareToast: {
    position: 'absolute',
    top: 48,
    alignSelf: 'center',
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#2B2420',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  shareToastText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FAF6F0',
  },

  // 3D Book Stage
  bookStage: {
    borderRadius: 14,
    position: 'relative',
    marginVertical: 4,
    alignSelf: 'center',
  },
  bookStageCover: {
    transform: [{ scale: 0.88 }],
  },
  spineHinge: {
    position: 'absolute',
    left: -12,
    top: -2,
    bottom: -2,
    width: 16,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderRightWidth: 1,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: -3, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 8,
  },
  stackedPagesRight: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    right: -7,
    width: 7,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
    backgroundColor: '#E6DFC9',
    borderRightWidth: 1,
    borderRightColor: '#D8CDB2',
  },
  stackedPagesBottom: {
    position: 'absolute',
    left: 4,
    right: -4,
    bottom: -6,
    height: 6,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    backgroundColor: '#E0D8C0',
    borderBottomWidth: 1,
    borderBottomColor: '#CFBF9F',
  },
  leftPagePeek: {
    position: 'absolute',
    left: -24,
    top: 12,
    bottom: 12,
    width: 24,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    backgroundColor: '#EAE4D7',
    borderWidth: 1,
    borderColor: '#D8CFBC',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 25,
  },

  // Cover Styles
  coverContainer: {
    flex: 1,
    borderRadius: 12,
    padding: 18,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    shadowColor: '#1F1710',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.28,
    shadowRadius: 28,
    elevation: 12,
  },
  coverTopLine: {
    alignItems: 'center',
  },
  coverTopText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.8,
    color: 'rgba(43,36,32,0.5)',
  },
  coverInsetCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  coverPhotoBox: {
    width: 140,
    height: 140,
    borderRadius: 3,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    backgroundColor: '#E8E2D7',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
  coverPhotoImg: {
    width: '100%',
    height: '100%',
  },
  coverCameraBtn: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  coverTitleWrap: {
    marginTop: 12,
    width: '100%',
    alignItems: 'center',
  },
  coverTitleText: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 18,
    color: '#2B2420',
    textAlign: 'center',
  },
  coverTitleInput: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 18,
    color: '#2B2420',
    textAlign: 'center',
    backgroundColor: '#F2ECE1',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    width: '100%',
  },
  coverSubtitleWrap: {
    marginTop: 4,
    width: '100%',
    alignItems: 'center',
  },
  coverSubtitleText: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif',
    fontStyle: 'italic',
    fontSize: 13,
    color: '#6E6359',
    textAlign: 'center',
  },
  coverSubtitleInput: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif',
    fontSize: 13,
    color: '#6E6359',
    textAlign: 'center',
    backgroundColor: '#F2ECE1',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    width: '100%',
  },
  backCoverCard: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  backCoverIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  backCoverTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 18,
    color: '#2B2420',
    marginBottom: 6,
  },
  backCoverDesc: {
    fontSize: 11,
    color: '#3E3A4B',
    textAlign: 'center',
    lineHeight: 16,
  },
  coverBottomLine: {
    alignItems: 'center',
  },
  coverBottomText: {
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: 'rgba(43,36,32,0.4)',
  },

  // Open Day Page Styles
  pageContainer: {
    flex: 1,
    backgroundColor: '#FCFBF8',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E8E2D2',
    position: 'relative',
    shadowColor: '#231A12',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 8,
  },
  pageHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#EAE3D5',
    paddingBottom: 6,
  },
  pageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageHeaderDate: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#8C7A6B',
  },
  pageHeaderFraction: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif',
    fontStyle: 'italic',
    fontSize: 11,
    color: '#8C7A6B',
  },
  futureLockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: '#F2ECE1',
    borderWidth: 1,
    borderColor: '#E2D8C5',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 4,
  },
  futureLockPillPulse: {
    backgroundColor: '#FCECE8',
    borderColor: 'rgba(223,87,57,0.4)',
  },
  futureLockPillText: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 12,
    color: '#5C5046',
  },
  dayTitleText: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 15,
    color: '#2B2420',
    marginTop: 2,
  },

  // 2x2 Grid
  gridContainer: {
    gap: 8,
    marginVertical: 4,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pocketCol: {
    flex: 1,
  },
  photoPocketBox: {
    aspectRatio: 1.12,
    backgroundColor: '#EFECE5',
    borderRadius: 4,
    padding: 4,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(45,35,25,0.08)',
    shadowColor: '#231C16',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  lockedPocketBox: {
    aspectRatio: 1.12,
    backgroundColor: '#EFECE5',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(45,35,25,0.08)',
  },
  lockedPocketBoxShake: {
    transform: [{ translateX: -4 }],
  },
  innerCardstockLip: {
    position: 'absolute',
    inset: 0,
    borderWidth: 3,
    borderColor: '#FCFBF8',
    borderRadius: 3,
    zIndex: 10,
    pointerEvents: 'none',
  },
  slotPhotoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
  },
  emptySlotCenter: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotPlusCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  lockedIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5DFD3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captionSpacer: {
    height: 26,
  },
  captionRow: {
    marginTop: 2,
    height: 26,
    paddingHorizontal: 2,
    justifyContent: 'center',
  },
  captionText: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif',
    fontStyle: 'italic',
    fontSize: 10.5,
    lineHeight: 12.5,
    color: '#3A312B',
  },
  captionTextEmpty: {
    color: '#9A8E80',
  },

  // Page Footer
  pageFooter: {
    borderTopWidth: 1,
    borderTopColor: '#EAE3D5',
    paddingTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 32, // room for corner curl
  },
  pageFooterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  pageFooterBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8C7A6B',
  },

  // Placed Stickers
  stickersOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 900,
  },
  placedSticker: {
    position: 'absolute',
    zIndex: 910,
  },

  // Corner Curl
  cornerCurlHitbox: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 44,
    height: 44,
    zIndex: 950,
  },
  cornerCurlFlap: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 22,
    height: 22,
    borderTopLeftRadius: 5,
    backgroundColor: '#F4EFE4',
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderColor: '#D8CFBC',
    shadowColor: '#1E160F',
    shadowOffset: { width: -3, height: -3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 4,
  },
  cornerCurlFlapTeased: {
    width: 42,
    height: 42,
    backgroundColor: '#EFEAE0',
  },

  // Cover Action Pill Bar
  coverPillBar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#231F1D',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  coverPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  coverPillSep: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  coverPillText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#FAF6F0',
  },
  linenColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },

  // Bottom Sticker Dock
  stickerDock: {
    width: '100%',
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  stickerClusterPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2D9C8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  clusterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: -4,
  },
  clusterItem: {
    marginHorizontal: -4,
  },
  stickerTrayExpanded: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 8,
  },
  stickerTrayCloseBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E5DEC9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickerTrayScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
  },
  stickerTrayItem: {
    padding: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: '#E2D9C8',
  },

  // Gallery Picker Bottom Sheet
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: '#FAF7F2',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2D9C8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 12,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D5CBB8',
    alignSelf: 'center',
    marginBottom: 10,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sheetTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 16,
    color: '#2B2420',
  },
  sheetPresetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  sheetPresetThumb: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#E6DFD3',
  },
  sheetPresetImg: {
    width: '100%',
    height: '100%',
  },
  sheetUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2B2420',
    borderRadius: 12,
    paddingVertical: 12,
  },
  sheetUploadBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Caption Modal
  modalBackdropCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  captionModalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FCFBF8',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DFD6C5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  captionModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  captionModalLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#5C5147',
  },
  captionCharCount: {
    fontSize: 10,
    fontWeight: '600',
    color: '#B85334',
  },
  captionCharCountGood: {
    color: '#15803D',
  },
  captionTextInput: {
    backgroundColor: '#F5F1E8',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DED5C4',
    padding: 10,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif',
    fontStyle: 'italic',
    color: '#2B2420',
    minHeight: 56,
    textAlignVertical: 'top',
  },
  captionModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  captionCancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  captionCancelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6E6359',
  },
  captionSaveBtn: {
    backgroundColor: '#DF5739',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  captionSaveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
