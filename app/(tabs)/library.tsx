import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Platform, Modal, Dimensions, Alert, ScrollView, Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import {
  Plus, MagnifyingGlass, X, Sparkle, BookOpen, ShareNetwork, Printer,
  Camera, Check, Image as ImageIcon,
} from 'phosphor-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDiary } from '@/contexts/DiaryContext';
import { BookCover } from '@/components/BookCover';
import { EmptyState } from '@/components/EmptyState';
import {
  bookDisplayName,
  SOLID_COVER_PRESETS,
  GRADIENT_COVER_PRESETS,
  type Book,
  type BookCoverConfig,
  type BookFontType,
  type PageLayoutType,
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
  const { books, createCustomBook } = useDiary();

  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [filter, setFilter] = useState<'all' | 'monthly' | 'custom' | 'favorites'>('all');

  // New Book Studio States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [coverType, setCoverType] = useState<'solid' | 'gradient' | 'photo'>('solid');
  const [solidColor, setSolidColor] = useState(SOLID_COVER_PRESETS[0].hex);
  const [gradientIndex, setGradientIndex] = useState(0);
  const [customPhotoUri, setCustomPhotoUri] = useState<string | null>(null);
  const [selectedFont, setSelectedFont] = useState<BookFontType>('playfair');
  const [selectedLayout, setSelectedLayout] = useState<PageLayoutType>('quad');
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
      if (filter === 'favorites') return b.days.some(d => d.isFavorite);
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

  async function pickCoverPhoto() {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow photo access to select a book cover photo.');
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setCustomPhotoUri(result.assets[0].uri);
      setCoverType('photo');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }

  async function handleCreateBook() {
    if (!newTitle.trim()) {
      Alert.alert('Title required', 'Please enter a name for your custom book.');
      return;
    }
    setCreating(true);
    try {
      const coverVal =
        coverType === 'solid'
          ? solidColor
          : coverType === 'gradient'
          ? GRADIENT_COVER_PRESETS[gradientIndex].colors[0]
          : customPhotoUri || SOLID_COVER_PRESETS[0].hex;

      const coverConfig: BookCoverConfig = {
        type: coverType,
        value: coverVal,
        fontFamily: selectedFont,
        title: newTitle.trim(),
        subtitle: newDesc.trim() || undefined,
        spineTag: 'VOL. 01',
      };

      const created = await createCustomBook(
        newTitle.trim(),
        newDesc.trim(),
        coverType === 'solid' ? solidColor : undefined,
        {
          coverConfig,
          pageLayout: selectedLayout,
          fontFamily: selectedFont,
        },
      );
      setNewTitle('');
      setNewDesc('');
      setCustomPhotoUri(null);
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
            <Plus size={16} color={colors.primaryForeground} weight="bold" />
            <Text style={[styles.newBookBtnText, { color: colors.primaryForeground }]}>New Book</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowSearch(s => !s)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.iconBtn}
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

      {/* Filter Chips */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {(['all', 'monthly', 'custom', 'favorites'] as const).map(tab => {
            const active = filter === tab;
            const label =
              tab === 'all'
                ? 'All Books'
                : tab === 'monthly'
                ? 'Monthly Volumes'
                : tab === 'custom'
                ? 'Custom Collections'
                : 'Favorites';
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
                accessibilityRole="button"
                accessibilityLabel={`Filter: ${label}`}
              >
                <Text style={[styles.filterChipText, { color: active ? colors.primaryForeground : colors.foreground }]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Exploration Callout for Sample Book */}
      {!sampleBannerDismissed && sortedBooks.some(b => b.isSample) && filter !== 'custom' && !search && (
        <View style={[styles.sampleBanner, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}>
          <Sparkle size={16} color="#C47B3A" weight="fill" style={{ marginTop: 2 }} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.sampleBannerTitle, { color: colors.foreground }]}>
              Explore Sample Volume
            </Text>
            <Text style={[styles.sampleBannerText, { color: colors.mutedForeground }]}>
              Tap "Kyoto Journey" below to preview how bound layouts, photos, and daily moments look in your personal archive.
            </Text>
          </View>
          <TouchableOpacity
            onPress={dismissSampleBanner}
            style={styles.sampleCloseBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Dismiss sample announcement"
          >
            <X size={15} color={colors.tertiary} weight="bold" />
          </TouchableOpacity>
        </View>
      )}

      {/* Book Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No Books Found"
          description={
            search
              ? `No photobooks found matching "${search}". Try searching another keyword.`
              : 'Create a custom photobook or capture daily moments to bind your monthly volumes.'
          }
          actionLabel={search ? 'Clear Search' : '+ Create Custom Book'}
          actionIcon={search ? X : Plus}
          onAction={() => {
            if (search) setSearch('');
            else setShowCreateModal(true);
          }}
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

      {/* Create Custom Book Modal (Cover Studio) */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.borderStrong, maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
                  Book Cover Studio
                </Text>
                <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
                  Design an archival custom keepsake volume
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <X size={22} color={colors.mutedForeground} weight="bold" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 20 }}>
              {/* Live Interactive Cover Preview */}
              <View style={[styles.previewContainer, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <BookCover
                  book={{
                    monthKey: 'preview',
                    title: newTitle.trim() || 'Volume Title',
                    description: newDesc.trim() || 'Subtitle or date',
                    days: [],
                    locked: false,
                    isCustom: true,
                    pageLayout: selectedLayout,
                    fontFamily: selectedFont,
                    coverConfig: {
                      type: coverType,
                      value:
                        coverType === 'solid'
                          ? solidColor
                          : coverType === 'gradient'
                          ? GRADIENT_COVER_PRESETS[gradientIndex].colors[0]
                          : customPhotoUri || SOLID_COVER_PRESETS[0].hex,
                      fontFamily: selectedFont,
                      title: newTitle.trim() || 'Volume Title',
                      subtitle: newDesc.trim() || undefined,
                      spineTag: 'VOL. 01',
                    },
                  }}
                  size="medium"
                />
                <Text style={[styles.previewLabel, { color: colors.tertiary }]}>
                  REAL-TIME PRINT PREVIEW
                </Text>
              </View>

              {/* Title Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.tertiary }]}>BOOK TITLE</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
                  placeholder="e.g. Japan Trip 2026, Best of 2025"
                  placeholderTextColor={colors.tertiary}
                  value={newTitle}
                  onChangeText={setNewTitle}
                />
              </View>

              {/* Subtitle */}
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

              {/* Cover Style Mode Tabs */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.tertiary }]}>COVER FINISH</Text>
                <View style={styles.tabRow}>
                  {[
                    { id: 'solid' as const, label: 'Solid Cloth' },
                    { id: 'gradient' as const, label: 'Atmospheric' },
                    { id: 'photo' as const, label: 'Custom Photo' },
                  ].map(tab => {
                    const active = coverType === tab.id;
                    return (
                      <TouchableOpacity
                        key={tab.id}
                        style={[
                          styles.tabBtn,
                          {
                            backgroundColor: active ? colors.primary : colors.muted,
                            borderColor: active ? colors.primary : colors.border,
                          },
                        ]}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setCoverType(tab.id);
                        }}
                      >
                        <Text
                          style={[
                            styles.tabBtnText,
                            { color: active ? colors.primaryForeground : colors.foreground },
                          ]}
                        >
                          {tab.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 1. Solid Cloth Swatches */}
              {coverType === 'solid' && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.tertiary }]}>PREMIUM BOOKCLOTH PALETTE</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
                    {SOLID_COVER_PRESETS.map(preset => {
                      const selected = solidColor === preset.hex;
                      return (
                        <TouchableOpacity
                          key={preset.hex}
                          style={[
                            styles.swatchCard,
                            { backgroundColor: colors.muted, borderColor: selected ? colors.primary : colors.border },
                          ]}
                          onPress={() => {
                            Haptics.selectionAsync();
                            setSolidColor(preset.hex);
                          }}
                        >
                          <View style={[styles.swatchCircle, { backgroundColor: preset.hex }]}>
                            {selected && <Check size={14} color={preset.textDark ? '#000' : '#FFF'} weight="bold" />}
                          </View>
                          <Text style={[styles.swatchName, { color: colors.foreground }]} numberOfLines={1}>
                            {preset.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* 2. Gradient Swatches */}
              {coverType === 'gradient' && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.tertiary }]}>ATMOSPHERIC GRADIENT PALETTES</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
                    {GRADIENT_COVER_PRESETS.map((preset, idx) => {
                      const selected = gradientIndex === idx;
                      return (
                        <TouchableOpacity
                          key={preset.name}
                          style={[
                            styles.gradientCard,
                            {
                              backgroundColor: preset.colors[0],
                              borderColor: selected ? colors.primary : 'transparent',
                              borderWidth: selected ? 3 : 1,
                            },
                          ]}
                          onPress={() => {
                            Haptics.selectionAsync();
                            setGradientIndex(idx);
                          }}
                        >
                          <Text style={styles.gradientCardName}>{preset.name}</Text>
                          {selected && (
                            <View style={styles.gradientCheck}>
                              <Check size={12} color="#FFF" weight="bold" />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* 3. Custom Photo from Phone */}
              {coverType === 'photo' && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.tertiary }]}>INSET COVER PHOTO</Text>
                  {customPhotoUri ? (
                    <View style={styles.photoPickedRow}>
                      <Image source={{ uri: customPhotoUri }} style={styles.pickedPhotoThumb} resizeMode="cover" />
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={[styles.pickedPhotoTitle, { color: colors.foreground }]}>Cover Photo Selected</Text>
                        <TouchableOpacity
                          style={[styles.changePhotoBtn, { borderColor: colors.primary }]}
                          onPress={pickCoverPhoto}
                        >
                          <Text style={[styles.changePhotoBtnText, { color: colors.primary }]}>Change Photo</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.pickPhotoBox, { backgroundColor: colors.muted, borderColor: colors.borderStrong }]}
                      onPress={pickCoverPhoto}
                    >
                      <Camera size={24} color={colors.primary} />
                      <Text style={[styles.pickPhotoBoxText, { color: colors.foreground }]}>
                        Choose Photo from Library
                      </Text>
                      <Text style={[styles.pickPhotoBoxSub, { color: colors.tertiary }]}>
                        Square crop debossed into cloth cover
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Typography Selector */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.tertiary }]}>BOOK-WIDE TYPOGRAPHY</Text>
                <View style={styles.typographyGrid}>
                  {[
                    { id: 'playfair' as const, name: 'Playfair', sub: 'Classic Serif' },
                    { id: 'garamond' as const, name: 'Garamond', sub: 'Literary Elegance' },
                    { id: 'sans' as const, name: 'Inter Sans', sub: 'Clean & Modern' },
                    { id: 'typewriter' as const, name: 'Typewriter', sub: 'Vintage Archival' },
                  ].map(font => {
                    const active = selectedFont === font.id;
                    return (
                      <TouchableOpacity
                        key={font.id}
                        style={[
                          styles.fontCard,
                          {
                            backgroundColor: active ? colors.accentLight : colors.muted,
                            borderColor: active ? colors.primary : colors.border,
                          },
                        ]}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setSelectedFont(font.id);
                        }}
                      >
                        <Text style={[styles.fontCardTitle, { color: colors.foreground }]}>{font.name}</Text>
                        <Text style={[styles.fontCardSub, { color: colors.tertiary }]}>{font.sub}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Default Page Layout */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.tertiary }]}>DEFAULT PAGE LAYOUT</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
                  {[
                    { id: 'quad' as const, name: '2×2 Quad' },
                    { id: 'strips' as const, name: 'Filmstrips' },
                    { id: 'polaroid' as const, name: 'Polaroid' },
                  ].map(lo => {
                    const active = selectedLayout === lo.id;
                    return (
                      <TouchableOpacity
                        key={lo.id}
                        style={[
                          styles.layoutPill,
                          {
                            backgroundColor: active ? colors.accentLight : colors.muted,
                            borderColor: active ? colors.primary : colors.border,
                          },
                        ]}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setSelectedLayout(lo.id);
                        }}
                      >
                        {active && <Check size={12} color={colors.primary} weight="bold" />}
                        <Text style={[styles.layoutPillText, { color: active ? colors.primary : colors.foreground }]}>
                          {lo.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Create CTA */}
              <TouchableOpacity
                style={[styles.createBtn, { backgroundColor: colors.primary, opacity: creating ? 0.6 : 1 }]}
                onPress={handleCreateBook}
                disabled={creating}
              >
                <Text style={[styles.createBtnText, { color: colors.primaryForeground }]}>
                  Create & Open Book Collection ✓
                </Text>
              </TouchableOpacity>
            </ScrollView>
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
