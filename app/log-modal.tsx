import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Platform, Alert, KeyboardAvoidingView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { X, Lock, WarningCircle, BookmarkSimple, CheckCircle, BookOpen } from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDiary } from '@/contexts/DiaryContext';
import { CategoryPicker } from '@/components/CategoryPicker';
import { PhotoPicker } from '@/components/PhotoPicker';
import { ProtectedScreen } from '@/components/ProtectedScreen';
import { randomPrompt } from '@/constants/placeholders';
import { uid, todayStr, formatFullDate } from '@/lib/data';
import type { Entry, CategoryId } from '@/lib/data';

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
      return !s.isImmutable && s.text.trim() !== orig.trim() && s.text.trim().length > 0;
    });

    if (hasUnsaved) {
      Alert.alert(
        'Discard moments?',
        'You have unsaved writing. Are you sure you want to discard your changes?',
        [
          { text: 'Keep Writing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.dismiss() },
        ],
      );
    } else {
      router.dismiss();
    }
  }

  async function handleDone() {
    const entries = slots
      .filter(s => s.text.trim().length > 0)
      .map(s => ({
        id: s.id,
        text: s.text.trim(),
        category: s.category,
        photos: s.photos,
        bookIds: selectedBooks,
      }));

    if (entries.length === 0) {
      Alert.alert('No moments', 'Add at least one moment before saving.');
      return;
    }

    setSaving(true);
    const success = await upsertDayEntries(targetDate, entries, [], selectedBooks);

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

        {/* 4 Hierarchical Memory Slots */}
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
              MOMENT {String(slotNumber).padStart(2, '0')}
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

      {/* Prominent, 20% larger bold text input */}
      <TextInput
        style={[
          styles.textInput,
          {
            color: colors.foreground,
            backgroundColor: slot.isImmutable ? colors.muted + '44' : 'transparent',
          },
        ]}
        placeholder={slot.placeholder}
        placeholderTextColor={colors.tertiary}
        value={slot.text}
        onChangeText={t => onChange({ text: t.slice(0, MAX_CHARS) })}
        multiline
        editable={!slot.isImmutable}
        maxLength={MAX_CHARS}
        textAlignVertical="top"
        accessibilityLabel={`Moment ${slotNumber} of 4`}
        accessibilityHint="Enter up to 120 characters describing this moment"
      />

      {/* Micro-hint */}
      <Text style={[styles.microHint, { color: colors.tertiary }]}>
        1–2 lines formatted under photo in physical book
      </Text>

      {/* Category & Photo Pickers */}
      {!slot.isImmutable && (
        <View style={styles.slotMeta}>
          <CategoryPicker selected={slot.category} onChange={cat => onChange({ category: cat })} />
          <PhotoPicker photos={slot.photos} onChange={photos => onChange({ photos })} maxPhotos={2} />
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

  /* Slot Card */
  slotCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    gap: 10,
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
  textInput: {
    fontSize: 18, // 20% larger than original 15px
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 26,
    minHeight: 56,
    borderRadius: 8,
    paddingVertical: 4,
  },
  microHint: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
  },
  slotMeta: {
    gap: 10,
    marginTop: 4,
  },
});
