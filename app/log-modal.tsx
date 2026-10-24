import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Platform, Alert, KeyboardAvoidingView, Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  X, Lock, WarningCircle, BookmarkSimple, CheckCircle, BookOpen,
  Camera, TrashSimple, Sparkle, Check,
} from 'phosphor-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDiary } from '@/contexts/DiaryContext';
import { CategoryPicker } from '@/components/CategoryPicker';
import { PhotoPicker } from '@/components/PhotoPicker';
import { ProtectedScreen } from '@/components/ProtectedScreen';
import { randomPrompt } from '@/constants/placeholders';
import { uid, todayStr, formatFullDate } from '@/lib/data';
import type { Entry, CategoryId, PageLayoutType } from '@/lib/data';

const LAYOUT_OPTIONS: { id: PageLayoutType; name: string; tag: string }[] = [
  { id: 'quad', name: '2×2 Quad', tag: 'Figma Ref' },
  { id: 'strips', name: 'Filmstrips', tag: 'Figma Ref' },
  { id: 'hero', name: 'Hero + 3', tag: 'Editorial' },
  { id: 'magazine', name: 'Magazine', tag: 'Split 2×2' },
  { id: 'polaroid', name: 'Polaroid', tag: 'Scrapbook' },
];

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
  const { getDayLog, upsertDayEntries, customBooks, createCustomBook } = useDiary();

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
    const success = await upsertDayEntries(targetDate, entries, [], selectedBooks, selectedLayout);

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

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const botPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

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
            {isPast ? 'Fill empty moments' : "Tonight's 4"}
          </Text>
        </View>
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
        contentContainerStyle={[styles.scrollContent, { paddingBottom: botPad + 30 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Custom Books Assignment Section */}
        <View style={[styles.collectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.collectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <BookmarkSimple size={16} color={colors.primary} weight="bold" />
              <Text style={[styles.collectionTitle, { color: colors.foreground }]}>
                Add to Collection Book
              </Text>
            </View>
            <TouchableOpacity onPress={() => setShowNewBookInput(s => !s)}>
              <Text style={[styles.addBookLink, { color: colors.primary }]}>
                {showNewBookInput ? 'Cancel' : '+ New Book'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.collectionSub, { color: colors.tertiary }]}>
            Assign this day to a travel trip, annual best, or keepsake book. It stays in your monthly book too!
          </Text>

          {/* Quick Create Book Input */}
          {showNewBookInput && (
            <View style={styles.quickCreateRow}>
              <TextInput
                style={[styles.quickInput, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
                placeholder="e.g. Japan Trip 2026, Best Memories..."
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

          {/* Chips list of custom books */}
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
          </View>
        </View>

        {/* Photobook Page Layout Selector */}
        <View style={[styles.layoutSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.layoutSectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Sparkle size={16} color={colors.primary} weight="bold" />
              <Text style={[styles.layoutSectionTitle, { color: colors.foreground }]}>
                Photobook Page Layout
              </Text>
            </View>
            <Text style={[styles.layoutSectionSub, { color: colors.tertiary }]}>
              Reflows today's 4 photos on the printed page
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.layoutChipsRow}
          >
            {LAYOUT_OPTIONS.map(lo => {
              const active = selectedLayout === lo.id;
              return (
                <TouchableOpacity
                  key={lo.id}
                  style={[
                    styles.layoutChip,
                    {
                      backgroundColor: active ? colors.accentLight : colors.muted,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedLayout(lo.id);
                  }}
                  activeOpacity={0.8}
                >
                  {active ? (
                    <Check size={14} color={colors.primary} weight="bold" />
                  ) : null}
                  <Text
                    style={[
                      styles.layoutChipName,
                      { color: active ? colors.primary : colors.foreground },
                    ]}
                  >
                    {lo.name}
                  </Text>
                  <Text
                    style={[
                      styles.layoutChipTag,
                      { color: active ? colors.primary : colors.tertiary },
                    ]}
                  >
                    {lo.tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

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
          placeholder={slot.placeholder || 'Write a 1–2 line caption under this photo...'}
          placeholderTextColor={colors.tertiary}
          value={slot.text}
          onChangeText={t => onChange({ text: t.slice(0, MAX_CHARS) })}
          multiline
          editable={!slot.isImmutable}
          maxLength={MAX_CHARS}
          textAlignVertical="top"
          accessibilityLabel={`Caption for photo ${slotNumber}`}
        />
        <View style={styles.captionFooter}>
          <Text style={[styles.microHint, { color: colors.tertiary }]}>
            Archival caption printed under photo in book
          </Text>
        </View>
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
});
