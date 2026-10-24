import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Platform, Modal, Dimensions, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDiary } from '@/contexts/DiaryContext';
import { BookCover } from '@/components/BookCover';
import { bookDisplayName } from '@/lib/data';
import type { Book } from '@/lib/data';
import { exportBookAsPdf } from '@/lib/pdfExport';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 14;
const HORIZONTAL_PAD = 20;
const BOOK_WIDTH = Math.floor((SCREEN_WIDTH - HORIZONTAL_PAD * 2 - CARD_GAP) / 2);

const COLOR_OPTIONS = [
  { label: 'Deep Moss', color: '#2D3F2A' },
  { label: 'Burgundy', color: '#3D2A2F' },
  { label: 'Midnight', color: '#2A3A4A' },
  { label: 'Ochre', color: '#4A3A1A' },
  { label: 'Terracotta', color: '#8B3A22' },
  { label: 'Indigo', color: '#1A2F3F' },
];

export default function LibraryTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { books, createCustomBook } = useDiary();

  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [filter, setFilter] = useState<'all' | 'monthly' | 'custom'>('all');

  // New Book Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newColor, setNewColor] = useState(COLOR_OPTIONS[0].color);
  const [creating, setCreating] = useState(false);

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const botPad = insets.bottom + 90;

  const sortedBooks = [...books].sort((a, b) => {
    // Keep sample book visible, custom books near top, then by monthKey descending
    if (a.isSample && !b.isSample) return -1;
    if (!a.isSample && b.isSample) return 1;
    if (a.isCustom && !b.isCustom) return -1;
    if (!a.isCustom && b.isCustom) return 1;
    return b.monthKey.localeCompare(a.monthKey);
  });

  const filtered = sortedBooks
    .filter(b => {
      if (filter === 'monthly') return !b.isCustom;
      if (filter === 'custom') return b.isCustom && !b.isSample;
      return true;
    })
    .filter(b => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const titleMatch = bookDisplayName(b).toLowerCase().includes(q);
      const entryMatch = b.days.some(d => d.entries.some(e => e.text.toLowerCase().includes(q)));
      return titleMatch || entryMatch;
    });

  const [sharingKey, setSharingKey] = useState<string | null>(null);

  function openBook(book: Book) {
    Haptics.selectionAsync();
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

  async function handleCreateBook() {
    if (!newTitle.trim()) {
      Alert.alert('Title required', 'Please enter a name for your custom book.');
      return;
    }
    setCreating(true);
    try {
      const created = await createCustomBook(newTitle.trim(), newDesc.trim(), newColor);
      setNewTitle('');
      setNewDesc('');
      setShowCreateModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      openBook(created);
    } catch {
      Alert.alert('Error', 'Could not create book.');
    } finally {
      setCreating(false);
    }
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
            style={[styles.newBookBtn, { backgroundColor: colors.primary }]}
            onPress={() => setShowCreateModal(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={18} color={colors.primaryForeground} />
            <Text style={[styles.newBookBtnText, { color: colors.primaryForeground }]}>New Book</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowSearch(s => !s)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.iconBtn}
          >
            <Ionicons name={showSearch ? 'close' : 'search'} size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      {showSearch && (
        <View style={[styles.searchBar, { backgroundColor: colors.muted, marginHorizontal: 20, marginTop: 12 }]}>
          <Ionicons name="search" size={16} color={colors.tertiary} />
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

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {(['all', 'monthly', 'custom'] as const).map(tab => {
          const active = filter === tab;
          const label = tab === 'all' ? 'All Books' : tab === 'monthly' ? 'Monthly Volumes' : 'Custom Collections';
          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.filterChip,
                {
                  backgroundColor: active ? colors.primary : colors.muted,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setFilter(tab);
              }}
            >
              <Text style={[styles.filterChipText, { color: active ? colors.primaryForeground : colors.foreground }]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Exploration Callout for Sample Book */}
      {sortedBooks.some(b => b.isSample) && filter !== 'custom' && !search && (
        <View style={[styles.sampleBanner, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}>
          <Ionicons name="sparkles" size={16} color="#C47B3A" style={{ marginTop: 2 }} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.sampleBannerTitle, { color: colors.foreground }]}>
              Explore Sample Volume
            </Text>
            <Text style={[styles.sampleBannerText, { color: colors.mutedForeground }]}>
              Tap "Kyoto Journey" below to preview how bound layouts, photos, and daily moments look in print.
            </Text>
          </View>
        </View>
      )}

      {/* Book Grid */}
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="book-outline" size={44} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No books found</Text>
          <Text style={[styles.emptySub, { color: colors.tertiary }]}>
            Create a custom book or log memories to populate your library.
          </Text>
        </View>
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
            return (
              <View style={styles.bookCell}>
                <BookCover
                  book={item}
                  size="grid"
                  customWidth={BOOK_WIDTH}
                  onPress={() => openBook(item)}
                />

                {/* Quick Share & Print Actions */}
                <View style={[styles.bookActionsRow, { width: BOOK_WIDTH }]}>
                  <TouchableOpacity
                    style={[styles.bookActionBtn, { backgroundColor: colors.accentLight, borderColor: colors.border }]}
                    onPress={() => handleShareBook(item)}
                    disabled={isSharing}
                    activeOpacity={0.75}
                  >
                    {isSharing ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <>
                        <Ionicons name="share-outline" size={13} color={colors.foreground} />
                        <Text style={[styles.bookActionText, { color: colors.foreground }]}>Share</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.bookActionBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                    onPress={() => handlePrintBook(item)}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="print-outline" size={13} color={colors.primaryForeground} />
                    <Text style={[styles.bookActionText, { color: colors.primaryForeground }]}>Print</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Create Custom Book Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
                New Book Collection
              </Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
              Create a custom book for a special trip, annual best, or family gift. You can add memories from any day into it.
            </Text>

            {/* Title Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.tertiary }]}>BOOK TITLE</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
                placeholder="e.g. Japan Trip 2026, Best of 2025"
                placeholderTextColor={colors.tertiary}
                value={newTitle}
                onChangeText={setNewTitle}
                autoFocus
              />
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.tertiary }]}>SUBTITLE (OPTIONAL)</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
                placeholder="e.g. One week in Tokyo & Kyoto"
                placeholderTextColor={colors.tertiary}
                value={newDesc}
                onChangeText={setNewDesc}
              />
            </View>

            {/* Color Palette */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.tertiary }]}>COVER LINEN COLOR</Text>
              <View style={styles.colorRow}>
                {COLOR_OPTIONS.map(c => {
                  const selected = newColor === c.color;
                  return (
                    <TouchableOpacity
                      key={c.color}
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: c.color },
                        selected && { borderColor: colors.primary, borderWidth: 3 },
                      ]}
                      onPress={() => setNewColor(c.color)}
                    />
                  );
                })}
              </View>
            </View>

            {/* Create CTA */}
            <TouchableOpacity
              style={[styles.createBtn, { backgroundColor: colors.primary, opacity: creating ? 0.6 : 1 }]}
              onPress={handleCreateBook}
              disabled={creating}
            >
              <Text style={[styles.createBtnText, { color: colors.primaryForeground }]}>
                Create Book
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    height: 32,
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
  colorRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
