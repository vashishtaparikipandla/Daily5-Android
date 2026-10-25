import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Platform, Alert, KeyboardAvoidingView, Image,
  Share, Modal,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  X, Lock, WarningCircle, BookmarkSimple, CheckCircle, BookOpen,
  Camera, TrashSimple, Sparkle, Check, DotsThreeVertical, Star,
  ShareNetwork, Export, Image as ImageIcon,
} from 'phosphor-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDiary } from '@/contexts/DiaryContext';
import { CategoryPicker } from '@/components/CategoryPicker';
import { ProtectedScreen } from '@/components/ProtectedScreen';
import { BrandLogoHorizontal, BrandLogoLoader } from '@/components/BrandLogo';
import { exportDayAsPdf } from '@/lib/pdfExport';
import { randomPrompt } from '@/constants/placeholders';
import { uid, todayStr, formatFullDate } from '@/lib/data';
import type { Entry, CategoryId, PageLayoutType, DayLog } from '@/lib/data';

const MAX_CHARS = 120;
const COUNTER_THRESHOLD = Math.floor(MAX_CHARS * 0.75);

interface SlotState {
  id: string;
  text: string;
  category?: CategoryId;
  photos: string[];
  placeholder: string;
  isImmutable?: boolean; // locked because it is a past day's existing memory
}

function makeSlot(entry?: Entry, isPast = false): SlotState {
  const hasText = !!entry?.text && entry.text.trim().length > 0;
  return {
    id: entry?.id ?? uid(),
    text: entry?.text ?? '',
    category: entry?.category,
    photos: entry?.photos ?? [],
    placeholder: randomPrompt(),
    isImmutable: isPast && hasText,
  };
}

function LogModalContent() {
  const { date: paramDate } = useLocalSearchParams<{ date?: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getDayLog, upsertDayEntries, toggleFavoriteDay, customBooks, createCustomBook } = useDiary();

  const targetDate = paramDate || todayStr();
  const today = todayStr();
  const isPast = targetDate < today;

  const existingLog = getDayLog(targetDate);
  const existingEntries = existingLog?.entries ?? [];

  const [slots, setSlots] = useState<SlotState[]>(() => {
    return Array.from({ length: 4 }, (_, i) => makeSlot(existingEntries[i], isPast));
  });

  const [selectedBooks, setSelectedBooks] = useState<string[]>(() => {
    return existingLog?.bookIds ?? [];
  });

  const [selectedLayout, setSelectedLayout] = useState<PageLayoutType>(() => {
    return existingLog?.layout || 'quad';
  });

  const [showNewBookInput, setShowNewBookInput] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [lockedError, setLockedError] = useState(false);
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(() => !!existingLog?.isFavorite);
  const [sharingImage, setSharingImage] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const shareCardRef = useRef<View>(null);

  function updateSlot(index: number, updates: Partial<SlotState>) {
    if (slots[index].isImmutable && updates.text !== undefined) {
      return; // immutable past memory
    }
    setSlots(prev => prev.map((s, i) => (i === index ? { ...s, ...updates } : s)));
    if (lockedError) setLockedError(false);
  }

  function toggleBook(monthKey: string) {
    Haptics.selectionAsync();
    setSelectedBooks(prev =>
      prev.includes(monthKey) ? prev.filter(k => k !== monthKey) : [...prev, monthKey]
    );
  }

  async function handleCreateQuickBook() {
    if (!newBookTitle.trim()) return;
    try {
      const book = await createCustomBook(newBookTitle.trim());
      setSelectedBooks(prev => [...prev, book.monthKey]);
      setNewBookTitle('');
      setShowNewBookInput(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Error', 'Could not create book.');
    }
  }

  function handleDismiss() {
    const hasUnsaved = slots.some((s, i) => {
      const orig = existingEntries[i]?.text ?? '';
      const origPhoto = existingEntries[i]?.photos?.[0] ?? '';
      const curPhoto = s.photos[0] ?? '';
      return (
        !s.isImmutable &&
        ((s.text.trim() !== orig.trim() && s.text.trim().length > 0) ||
         (curPhoto !== origPhoto && curPhoto.length > 0))
      );
    });

    if (hasUnsaved) {
      Alert.alert(
        'Discard moments?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.dismiss() },
        ],
      );
    } else {
      router.dismiss();
    }
  }

  async function handleDone() {
    const entries = slots
      .filter(s => s.text.trim().length > 0 || s.photos.length > 0)
      .map(s => ({
        id: s.id,
        text: s.text.trim(),
        category: s.category,
        photos: s.photos,
        bookIds: selectedBooks,
      }));

    if (entries.length === 0) {
      Alert.alert('No moments', 'Add at least one photo or memory before saving.');
      return;
    }

    setSaving(true);
    const success = await upsertDayEntries(targetDate, entries, [], selectedBooks, selectedLayout, isFavorite);

    if (!success) {
      setSaving(false);
      setLockedError(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(false);
    router.dismiss();
  }

  async function handleShareDayImage() {
    Haptics.selectionAsync();
    setSharingImage(true);
    try {
      if (!shareCardRef.current) {
        Alert.alert('Error', 'Could not access day card view.');
        return;
      }
      const uri = await captureRef(shareCardRef, {
        format: 'png',
        quality: 1.0,
        result: 'tmpfile',
      });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `Dear Day — ${formatFullDate(targetDate)}`,
        });
      } else {
        await Share.share({
          title: `Dear Day — ${formatFullDate(targetDate)}`,
          message: `Memories from ${formatFullDate(targetDate)} on Dear Day: https://play.google.com/store/apps/details?id=app.daily5.android`,
        });
      }
    } catch {
      Alert.alert('Share Failed', 'Could not render day card image.');
    } finally {
      setSharingImage(false);
    }
  }

  async function handleExportDayPdf() {
    Haptics.selectionAsync();
    setExportingPdf(true);
    try {
      const activeEntries = slots
        .filter(s => s.text.trim().length > 0 || s.photos.length > 0)
        .map(s => ({
          id: s.id,
          text: s.text.trim(),
          category: s.category,
          photos: s.photos,
        }));
      const dayLogToExport: DayLog = {
        date: targetDate,
        entries: activeEntries,
        extras: existingLog?.extras ?? [],
        layout: selectedLayout,
        isFavorite,
      };
      await exportDayAsPdf(dayLogToExport);
    } catch {
      Alert.alert('Export Failed', 'Could not generate day PDF.');
    } finally {
      setExportingPdf(false);
    }
  }

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const botPad = insets.bottom + (Platform.OS === 'web' ? 34 : 16);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={handleDismiss}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Close and discard changes"
        >
          <X size={22} color={colors.mutedForeground} weight="bold" />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={[styles.headerDate, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
            {formatFullDate(targetDate)}
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {isPast ? 'Fill empty moments' : "Tonight's 4 Moments"}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              setShowMoreModal(true);
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={[styles.moreBtn, { backgroundColor: colors.muted }]}
            accessibilityRole="button"
            accessibilityLabel="More options"
          >
            <DotsThreeVertical size={18} color={colors.foreground} weight="bold" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDone}
            disabled={saving}
            style={[styles.doneBtn, { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel="Save moments"
          >
            <Text style={[styles.doneBtnText, { color: colors.primaryForeground }]}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Immutability Banner for Past Days */}
      {isPast && (
        <View style={[styles.immutabilityBanner, { backgroundColor: colors.accentLight, borderColor: colors.borderStrong }]}>
          <Lock size={16} color={colors.accent} weight="fill" style={{ marginTop: 2 }} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.bannerTitle, { color: colors.foreground }]}>
              Permanent Ink
            </Text>
            <Text style={[styles.bannerText, { color: colors.mutedForeground }]}>
              Memories from past days cannot be edited or deleted once the day is past. You can still fill in any empty moments.
            </Text>
          </View>
        </View>
      )}

      {/* Locked Book error */}
      {lockedError && (
        <View style={[styles.errorBanner, { backgroundColor: colors.destructive }]}>
          <WarningCircle size={16} color="#fff" weight="fill" />
          <Text style={styles.errorBannerText}>
            This volume has been locked and can no longer be edited.
          </Text>
        </View>
      )}

      {/* Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: botPad + 280 }]}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        showsVerticalScrollIndicator={false}
      >
        {/* 4 Hierarchical Photo-First Memory Slots */}
        {slots.map((slot, i) => (
          <SlotEditor
            key={slot.id}
            slot={slot}
            slotNumber={i + 1}
            onChange={updates => updateSlot(i, updates)}
            colors={colors}
          />
        ))}
      </ScrollView>

      {/* ── More Options Bottom Sheet ─────────────────────────────────────────── */}
      <Modal
        visible={showMoreModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMoreModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.moreSheet,
              {
                backgroundColor: colors.card,
                borderColor: colors.borderStrong,
                paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16) + 16,
              },
            ]}
          >
            <View style={styles.moreSheetHeader}>
              <View>
                <Text style={[styles.moreSheetTitle, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
                  Day Options
                </Text>
                <Text style={[styles.moreSheetSub, { color: colors.mutedForeground }]}>
                  Collections, favorites & actions
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowMoreModal(false)}>
                <X size={22} color={colors.mutedForeground} weight="bold" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 16 }}>
              {/* 1. Add to Collection Book */}
              <View style={styles.moreSection}>
                <View style={styles.moreSectionHeaderRow}>
                  <Text style={[styles.moreSectionLabel, { color: colors.tertiary }]}>ADD TO COLLECTION BOOK</Text>
                  <TouchableOpacity onPress={() => setShowNewBookInput(s => !s)}>
                    <Text style={[styles.addBookLink, { color: colors.primary }]}>
                      {showNewBookInput ? 'Cancel' : '+ New Book'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {showNewBookInput && (
                  <View style={styles.quickCreateRow}>
                    <TextInput
                      style={[styles.quickInput, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
                      placeholder="e.g. Japan Trip 2026, Best of 2025"
                      placeholderTextColor={colors.tertiary}
                      value={newBookTitle}
                      onChangeText={setNewBookTitle}
                      autoFocus
                    />
                    <TouchableOpacity
                      style={[styles.quickCreateBtn, { backgroundColor: colors.primary }]}
                      onPress={handleCreateQuickBook}
                    >
                      <Text style={[styles.quickCreateBtnText, { color: colors.primaryForeground }]}>Create</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.bookChips}>
                  {customBooks.map(cb => {
                    const active = selectedBooks.includes(cb.monthKey);
                    return (
                      <TouchableOpacity
                        key={cb.monthKey}
                        style={[
                          styles.bookChip,
                          {
                            backgroundColor: active ? colors.primary : colors.muted,
                            borderColor: active ? colors.primary : colors.border,
                          },
                        ]}
                        onPress={() => toggleBook(cb.monthKey)}
                        activeOpacity={0.8}
                      >
                        {active ? (
                          <CheckCircle size={14} color={colors.primaryForeground} weight="fill" />
                        ) : (
                          <BookOpen size={14} color={colors.foreground} weight="regular" />
                        )}
                        <Text
                          style={[
                            styles.bookChipText,
                            { color: active ? colors.primaryForeground : colors.foreground },
                          ]}
                        >
                          {cb.title || cb.monthKey}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  {customBooks.length === 0 && !showNewBookInput && (
                    <Text style={[styles.noCustomText, { color: colors.tertiary }]}>
                      No collection books yet. Tap "+ New Book" to create one.
                    </Text>
                  )}
                </View>
              </View>

              {/* 3. Action Rows: Favorites, Share as Image, Export PDF, Share Link */}
              <View style={[styles.actionRowsCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                {/* Favorite */}
                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={async () => {
                    Haptics.selectionAsync();
                    const nextVal = !isFavorite;
                    setIsFavorite(nextVal);
                    await toggleFavoriteDay(targetDate);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Star size={18} color={isFavorite ? '#E5A93C' : colors.foreground} weight={isFavorite ? 'fill' : 'regular'} />
                    <Text style={[styles.actionRowText, { color: colors.foreground }]}>
                      {isFavorite ? 'Saved to Favorites' : 'Add this day to Favorites'}
                    </Text>
                  </View>
                  {isFavorite && <Check size={16} color={colors.primary} weight="bold" />}
                </TouchableOpacity>

                <View style={[styles.actionDivider, { backgroundColor: colors.border }]} />

                {/* Share as Image (Instagram / Social) with Dear Day Logo Imprint */}
                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={handleShareDayImage}
                  disabled={sharingImage}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    {sharingImage ? (
                      <BrandLogoLoader size={18} color={colors.primary} />
                    ) : (
                      <ImageIcon size={18} color={colors.foreground} weight="bold" />
                    )}
                    <Text style={[styles.actionRowText, { color: colors.foreground }]}>
                      {sharingImage ? 'Generating Image...' : 'Share Day as Image (Instagram / Social)'}
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={[styles.actionDivider, { backgroundColor: colors.border }]} />

                {/* Export as Archival PDF */}
                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={handleExportDayPdf}
                  disabled={exportingPdf}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    {exportingPdf ? (
                      <BrandLogoLoader size={18} color={colors.primary} />
                    ) : (
                      <Export size={18} color={colors.foreground} weight="bold" />
                    )}
                    <Text style={[styles.actionRowText, { color: colors.foreground }]}>
                      {exportingPdf ? 'Exporting PDF...' : 'Export Day as Archival PDF'}
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={[styles.actionDivider, { backgroundColor: colors.border }]} />

                {/* Share Link to Day */}
                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={async () => {
                    Haptics.selectionAsync();
                    try {
                      await Share.share({
                        title: `Dear Day — ${formatFullDate(targetDate)}`,
                        message: `Check out my memories from ${formatFullDate(targetDate)} on Dear Day: https://play.google.com/store/apps/details?id=app.daily5.android`,
                      });
                    } catch {}
                  }}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <ShareNetwork size={18} color={colors.foreground} weight="bold" />
                    <Text style={[styles.actionRowText, { color: colors.foreground }]}>
                      Share Day Link
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Close CTA */}
              <TouchableOpacity
                style={[styles.moreDoneBtn, { backgroundColor: colors.primary }]}
                onPress={() => setShowMoreModal(false)}
              >
                <Text style={[styles.moreDoneBtnText, { color: colors.primaryForeground }]}>
                  Apply & Back to Writing ✓
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Off-screen Pristine Share Card with Official Dear Day Logo Imprint */}
      <View
        ref={shareCardRef}
        collapsable={false}
        pointerEvents="none"
        style={styles.shareExportCard}
      >
        <View style={styles.shareBrandHeader}>
          <BrandLogoHorizontal size={26} color="#E8593A" />
          <Text style={styles.shareSubtitle}>Archival Memoir · 4 Moments</Text>
        </View>

        <Text style={styles.shareDateText}>{formatFullDate(targetDate)}</Text>

        <View style={styles.shareGrid}>
          {slots.map((s, idx) => (
            <View key={s.id} style={styles.shareCell}>
              {s.photos[0] ? (
                <Image source={{ uri: s.photos[0] }} style={styles.sharePhoto} resizeMode="cover" />
              ) : (
                <View style={styles.shareEmptyPhoto}>
                  <Text style={styles.shareEmptyPhotoText}>0{idx + 1}</Text>
                </View>
              )}
              <Text style={styles.shareCaption} numberOfLines={2}>
                {s.text.trim() || '—'}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.shareFooter}>
          <Text style={styles.shareFooterText}>Captured with Dear Day · app.daily5.android</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

interface SlotEditorProps {
  slot: SlotState;
  slotNumber: number;
  onChange: (updates: Partial<SlotState>) => void;
  colors: ReturnType<typeof useColors>;
}

function SlotEditor({ slot, slotNumber, onChange, colors }: SlotEditorProps) {
  const showCounter = slot.text.length >= COUNTER_THRESHOLD;
  const charsLeft = MAX_CHARS - slot.text.length;
  const photo = slot.photos?.[0];

  async function handlePickPhoto() {
    if (slot.isImmutable) return;
    Alert.alert('Moment Photo', 'Select image source', [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Gallery', onPress: pickFromGallery },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function takePhoto() {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow camera access to take photos.');
        return;
      }
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      onChange({ photos: [result.assets[0].uri] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }

  async function pickFromGallery() {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow photo access to select memories.');
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      onChange({ photos: [result.assets[0].uri] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }

  function handleRemovePhoto() {
    if (slot.isImmutable) return;
    onChange({ photos: [] });
  }

  return (
    <View
      style={[
        styles.slotCard,
        {
          backgroundColor: colors.card,
          borderColor: slot.isImmutable ? colors.border : colors.borderStrong,
          opacity: slot.isImmutable ? 0.92 : 1,
        },
      ]}
    >
      {/* Slot Header */}
      <View style={styles.slotHeader}>
        <View style={styles.slotBadgeRow}>
          <View style={[styles.slotBadge, { backgroundColor: colors.muted }]}>
            <Text style={[styles.slotBadgeText, { color: colors.primary }]}>
              PHOTO {String(slotNumber).padStart(2, '0')}
            </Text>
          </View>
          {slot.isImmutable && (
            <View style={styles.lockedTag}>
              <Lock size={11} color={colors.tertiary} weight="fill" />
              <Text style={[styles.lockedTagText, { color: colors.tertiary }]}>Locked</Text>
            </View>
          )}
        </View>

        {!slot.isImmutable && showCounter && (
          <Text style={[styles.counter, { color: charsLeft <= 10 ? colors.destructive : colors.tertiary }]}>
            {slot.text.length}/{MAX_CHARS}
          </Text>
        )}
      </View>

      {/* Prominent Photo-First Canvas Frame */}
      {photo ? (
        <View style={styles.photoCanvas}>
          <Image source={{ uri: photo }} style={styles.photoCanvasImage} resizeMode="cover" />
          <TouchableOpacity
            style={styles.replacePhotoPill}
            onPress={handlePickPhoto}
            disabled={slot.isImmutable}
            activeOpacity={0.8}
          >
            <Camera size={13} color="#FFF" />
            <Text style={styles.replacePhotoPillText}>Replace Photo</Text>
          </TouchableOpacity>
          {!slot.isImmutable && (
            <TouchableOpacity
              style={styles.deletePhotoBtn}
              onPress={handleRemovePhoto}
              activeOpacity={0.8}
            >
              <TrashSimple size={14} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <TouchableOpacity
          style={[
            styles.emptyPhotoCanvas,
            { backgroundColor: colors.muted, borderColor: colors.borderStrong },
          ]}
          onPress={handlePickPhoto}
          disabled={slot.isImmutable}
          activeOpacity={0.75}
        >
          <View style={[styles.cameraIconCircle, { backgroundColor: colors.card }]}>
            <Camera size={26} color={colors.primary} />
          </View>
          <Text style={[styles.emptyPhotoTitle, { color: colors.foreground }]}>
            + Add Moment Photo 0{slotNumber}
          </Text>
          <Text style={[styles.emptyPhotoSub, { color: colors.tertiary }]}>
            Tap to capture or choose from library
          </Text>
        </TouchableOpacity>
      )}

      {/* Caption Input Directly Beneath Photo */}
      <View style={styles.captionContainer}>
        <TextInput
          style={[
            styles.captionInput,
            {
              color: colors.foreground,
              backgroundColor: slot.isImmutable ? colors.muted + '44' : 'transparent',
              fontFamily: 'PlayfairDisplay_400Regular',
            },
          ]}
          placeholder="Write a caption..."
          placeholderTextColor={colors.tertiary}
          value={slot.text}
          onChangeText={t => onChange({ text: t.slice(0, MAX_CHARS) })}
          multiline
          editable={!slot.isImmutable}
          maxLength={MAX_CHARS}
          textAlignVertical="top"
          accessibilityLabel={`Caption for photo ${slotNumber}`}
        />
      </View>

      {/* Category Picker */}
      {!slot.isImmutable && (
        <View style={styles.slotMeta}>
          <CategoryPicker selected={slot.category} onChange={cat => onChange({ category: cat })} />
        </View>
      )}
    </View>
  );
}

export default function LogModal() {
  return (
    <ProtectedScreen>
      <LogModalContent />
    </ProtectedScreen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { flex: 1 },
  headerDate: { fontSize: 18, letterSpacing: 0.2 },
  headerSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moreBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  doneBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  immutabilityBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  bannerTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  bannerText: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
  },
  errorBannerText: { flex: 1, color: '#fff', fontSize: 13, fontFamily: 'Inter_500Medium' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, gap: 16 },

  /* Collection card */
  collectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  collectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  collectionTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  collectionSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 16,
  },
  addBookLink: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  quickCreateRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  quickInput: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    borderWidth: 1,
  },
  quickCreateBtn: {
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickCreateBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  bookChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  bookChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  bookChipText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },

  /* Layout Selector */
  layoutSection: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  layoutSectionHeader: {
    gap: 2,
  },
  layoutSectionTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  layoutSectionSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  layoutChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  layoutChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  layoutChipName: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  layoutChipTag: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
  },

  /* Slot Card */
  slotCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slotBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slotBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  slotBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8,
  },
  lockedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lockedTagText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  counter: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },

  /* Photo Canvas Frame */
  photoCanvas: {
    width: '100%',
    height: 170,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photoCanvasImage: {
    width: '100%',
    height: '100%',
  },
  replacePhotoPill: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  replacePhotoPillText: {
    color: '#FFF',
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  deletePhotoBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPhotoCanvas: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  cameraIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  emptyPhotoTitle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  emptyPhotoSub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },

  /* Caption Input */
  captionContainer: {
    borderRadius: 10,
    paddingVertical: 2,
  },
  captionInput: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 52,
    borderRadius: 8,
    paddingVertical: 4,
  },
  captionFooter: {
    marginTop: 2,
  },
  microHint: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
  },
  slotMeta: {
    gap: 10,
    marginTop: 2,
  },

  /* Layout Indicator Chip */
  layoutIndicatorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 4,
  },
  layoutIndicatorText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.3,
  },

  /* More Options Bottom Sheet */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  moreSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 22,
    maxHeight: '85%',
    gap: 14,
  },
  moreSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  moreSheetTitle: {
    fontSize: 20,
    letterSpacing: 0.2,
  },
  moreSheetSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  moreSection: {
    gap: 8,
  },
  moreSectionLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8,
  },
  moreSectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noCustomText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
    paddingVertical: 6,
  },
  actionRowsCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actionRowText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  actionDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  moreDoneBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  moreDoneBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },

  /* Offscreen Share Card */
  shareExportCard: {
    position: 'absolute',
    left: -9999,
    width: 380,
    backgroundColor: '#F7F4EF',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2DBD2',
    gap: 16,
  },
  shareBrandHeader: {
    alignItems: 'center',
    gap: 4,
  },
  shareSubtitle: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: '#7A746E',
    letterSpacing: 0.5,
  },
  shareDateText: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#1C1916',
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2DBD2',
    paddingBottom: 10,
  },
  shareGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  shareCell: {
    width: 160,
    gap: 6,
  },
  sharePhoto: {
    width: 160,
    height: 120,
    borderRadius: 8,
  },
  shareEmptyPhoto: {
    width: 160,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#EBE5D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareEmptyPhotoText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#A8A199',
  },
  shareCaption: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: '#1C1916',
    lineHeight: 15,
  },
  shareFooter: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2DBD2',
  },
  shareFooterText: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: '#8C827A',
  },
});
