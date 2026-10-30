import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity,
  Platform, Keyboard, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { MagnifyingGlass, XCircle, X, Clock, Lightbulb, CaretRight, CalendarBlank, BookOpen } from 'phosphor-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDiary } from '@/contexts/DiaryContext';
import { Book, DayLog, Entry } from '@/lib/data';
import { KEYS } from '@/lib/storage';
import { EmptyState } from '@/components/EmptyState';
import * as Haptics from 'expo-haptics';

interface MemorySearchResult {
  book: Book;
  day: DayLog;
  entry: Entry;
  matchIndex: number;
}

const POPULAR_SUGGESTIONS = [
  'Coffee', 'Morning', 'Walk', 'Travel', 'Dinner', 'Family', 'Flight', 'Work',
];

export default function SearchTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { books } = useDiary();

  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'books' | 'memories'>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchTipDismissed, setSearchTipDismissed] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const botPad = insets.bottom + 90;

  useEffect(() => {
    loadRecentSearches();
    AsyncStorage.getItem('@daily5/dismissed_search_tip').then(val => {
      if (val === 'true') setSearchTipDismissed(true);
    });
  }, []);

  async function dismissSearchTip() {
    Haptics.selectionAsync();
    setSearchTipDismissed(true);
    await AsyncStorage.setItem('@daily5/dismissed_search_tip', 'true').catch(() => {});
  }

  async function loadRecentSearches() {
    try {
      const raw = await AsyncStorage.getItem(KEYS.RECENT_SEARCHES);
      if (raw) {
        setRecentSearches(JSON.parse(raw));
      }
    } catch {}
  }

  async function addRecentSearch(term: string) {
    const trimmed = term.trim();
    if (!trimmed) return;
    dismissSearchTip();
    try {
      const updated = [trimmed, ...recentSearches.filter(s => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 8);
      setRecentSearches(updated);
      await AsyncStorage.setItem(KEYS.RECENT_SEARCHES, JSON.stringify(updated));
    } catch {}
  }

  async function removeRecentSearch(term: string) {
    try {
      const updated = recentSearches.filter(s => s !== term);
      setRecentSearches(updated);
      await AsyncStorage.setItem(KEYS.RECENT_SEARCHES, JSON.stringify(updated));
    } catch {}
  }

  async function clearAllRecent() {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem(KEYS.RECENT_SEARCHES);
    } catch {}
  }

  function handleSelectTerm(term: string) {
    Haptics.selectionAsync();
    setQuery(term);
    addRecentSearch(term);
  }

  // Search indexing and filtering
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { matchedBooks: [], matchedMemories: [] };

    // 1. Matched Books
    const matchedBooks = books.filter(b => {
      const name = b.title || b.monthKey;
      const titleMatch = name.toLowerCase().includes(q);
      const descMatch = b.description?.toLowerCase().includes(q) ?? false;
      const monthMatch = b.monthKey.toLowerCase().includes(q);
      return titleMatch || descMatch || monthMatch;
    });

    // 2. Matched Memories across all books
    const matchedMemories: MemorySearchResult[] = [];
    for (const b of books) {
      for (const day of b.days) {
        for (const entry of day.entries) {
          const textMatch = entry.text.toLowerCase().includes(q);
          const catMatch = entry.category?.toLowerCase().includes(q);
          if (textMatch || catMatch) {
            matchedMemories.push({
              book: b,
              day,
              entry,
              matchIndex: entry.text.toLowerCase().indexOf(q),
            });
          }
        }
      }
    }

    return { matchedBooks, matchedMemories };
  }, [query, books]);

  const { matchedBooks, matchedMemories } = searchResults;
  const hasQuery = query.trim().length > 0;
  const totalResults =
    (filterType === 'all' || filterType === 'books' ? matchedBooks.length : 0) +
    (filterType === 'all' || filterType === 'memories' ? matchedMemories.length : 0);

  function highlightSnippet(text: string, q: string) {
    if (!q) return <Text style={{ color: colors.foreground }}>{text}</Text>;
    const lower = text.toLowerCase();
    const idx = lower.indexOf(q.toLowerCase());
    if (idx === -1) return <Text style={{ color: colors.foreground }}>{text}</Text>;

    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + q.length);
    const after = text.slice(idx + q.length);

    return (
      <Text style={{ color: colors.foreground }}>
        {before}
        <Text style={{ backgroundColor: 'rgba(232, 89, 58, 0.2)', color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>
          {match}
        </Text>
        {after}
      </Text>
    );
  }

  function handleOpenMemory(item: MemorySearchResult) {
    Haptics.selectionAsync();
    addRecentSearch(query);
    router.push({
      pathname: '/book-viewer',
      params: { monthKey: item.book.monthKey, initialDate: item.day.date },
    });
  }

  function handleOpenBook(book: Book) {
    Haptics.selectionAsync();
    addRecentSearch(query);
    router.push({
      pathname: '/book-viewer',
      params: { monthKey: book.monthKey },
    });
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topPad }]}>
      {/* Search Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
          Search
        </Text>

        <View style={[styles.searchBar, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <MagnifyingGlass size={18} color={colors.tertiary} weight="bold" />
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: colors.foreground }]}
            placeholder="Search memories, books, thoughts…"
            placeholderTextColor={colors.tertiary}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => query.trim() && addRecentSearch(query)}
            returnKeyType="search"
            autoCorrect={false}
          />
          {hasQuery && (
            <TouchableOpacity
              onPress={() => setQuery('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Clear search text"
            >
              <XCircle size={18} color={colors.tertiary} weight="fill" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills */}
        {hasQuery && (
          <View style={styles.filterBar}>
            {(['all', 'books', 'memories'] as const).map(type => {
              const active = filterType === type;
              const count =
                type === 'all'
                  ? matchedBooks.length + matchedMemories.length
                  : type === 'books'
                  ? matchedBooks.length
                  : matchedMemories.length;
              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: active ? colors.primary : colors.muted,
                      borderColor: active ? colors.primary : colors.borderStrong,
                    },
                  ]}
                  onPress={() => setFilterType(type)}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter by ${type}, ${count} results`}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: active ? colors.primaryForeground : colors.foreground },
                    ]}
                  >
                    {type === 'all' ? 'All' : type === 'books' ? 'Books' : 'Memories'} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Main Content */}
      {!hasQuery ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: botPad }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <View style={styles.recentSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionHeading, { color: colors.tertiary }]}>Recent Searches</Text>
                <TouchableOpacity onPress={clearAllRecent} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <Text style={[styles.clearAllText, { color: colors.primary }]}>Clear</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.chipsRow}>
                {recentSearches.map(term => (
                  <View
                    key={term}
                    style={[styles.recentChip, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <TouchableOpacity onPress={() => handleSelectTerm(term)} style={styles.recentChipBtn}>
                      <Clock size={14} color={colors.tertiary} weight="regular" />
                      <Text style={[styles.recentChipText, { color: colors.foreground }]}>{term}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => removeRecentSearch(term)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${term} from search history`}
                    >
                      <X size={13} color={colors.tertiary} weight="bold" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Quick Ideas / Inspiration */}
          <View style={styles.recentSection}>
            <Text style={[styles.sectionHeading, { color: colors.tertiary }]}>Explore Themes</Text>
            <View style={styles.chipsRow}>
              {POPULAR_SUGGESTIONS.map(term => (
                <TouchableOpacity
                  key={term}
                  style={[styles.suggestChip, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}
                  onPress={() => handleSelectTerm(term)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.suggestChipText, { color: colors.foreground }]}>{term}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Helper notice — distinct archival parchment callout */}
          {!searchTipDismissed && (
            <View
              style={[
                styles.helperNotice,
                {
                  backgroundColor: colors.backgroundAlt || '#F4EFEA',
                  borderColor: colors.border,
                  borderLeftColor: colors.primary,
                  borderLeftWidth: 3.5,
                },
              ]}
            >
              <Lightbulb size={20} color={colors.primary} weight="regular" />
              <Text style={[styles.helperText, { color: colors.mutedForeground, flex: 1 }]}>
                Search across your entire life archive by keywords, emotions, dates, travel spots, or people.
              </Text>
              <TouchableOpacity
                onPress={dismissSearchTip}
                style={{ padding: 4 }}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel="Dismiss search helper"
              >
                <X size={15} color={colors.tertiary} weight="bold" />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      ) : totalResults === 0 ? (
        <EmptyState
          icon={MagnifyingGlass}
          title="No Moments Found"
          description={`We couldn't find any memories matching "${query}". Try checking for spelling or searching a broader keyword.`}
          actionLabel="Explore Library"
          actionIcon={BookOpen}
          onAction={() => router.push('/(tabs)/library')}
        />
      ) : (
        <FlatList
          data={[
            ...(filterType !== 'memories' && matchedBooks.length > 0
              ? [{ type: 'books_header' as const }, ...matchedBooks.map(b => ({ type: 'book' as const, data: b }))]
              : []),
            ...(filterType !== 'books' && matchedMemories.length > 0
              ? [{ type: 'memories_header' as const }, ...matchedMemories.map(m => ({ type: 'memory' as const, data: m }))]
              : []),
          ]}
          keyExtractor={(item, idx) =>
            item.type === 'book'
              ? `b-${item.data.monthKey}`
              : item.type === 'memory'
              ? `m-${item.data.entry.id}`
              : `h-${item.type}-${idx}`
          }
          contentContainerStyle={[styles.resultsList, { paddingBottom: botPad }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          renderItem={({ item }) => {
            if (item.type === 'books_header') {
              return (
                <Text style={[styles.resultSectionTitle, { color: colors.tertiary }]}>
                  Volumes ({matchedBooks.length})
                </Text>
              );
            }

            if (item.type === 'memories_header') {
              return (
                <Text style={[styles.resultSectionTitle, { color: colors.tertiary }]}>
                  Memories & Moments ({matchedMemories.length})
                </Text>
              );
            }

            if (item.type === 'book') {
              const book = item.data;
              return (
                <TouchableOpacity
                  style={[styles.bookCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  activeOpacity={0.7}
                  onPress={() => handleOpenBook(book)}
                >
                  <View style={[styles.bookSpine, { backgroundColor: colors.primary }]} />
                  <View style={styles.bookMeta}>
                    <Text style={[styles.bookTitle, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
                      {book.title}
                    </Text>
                    <Text style={[styles.bookSub, { color: colors.mutedForeground }]}>
                      {book.description ?? `${book.days.length} entries recorded`}
                    </Text>
                  </View>
                  <CaretRight size={16} color={colors.tertiary} weight="bold" />
                </TouchableOpacity>
              );
            }

            if (item.type === 'memory') {
              const { book, day, entry } = item.data;
              const formattedDate = new Date(day.date + 'T12:00:00').toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <TouchableOpacity
                  style={[styles.memoryCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  activeOpacity={0.7}
                  onPress={() => handleOpenMemory(item.data)}
                >
                  <View style={styles.memoryTopRow}>
                    <View style={styles.memoryDateBadge}>
                      <CalendarBlank size={12} color={colors.primary} weight="bold" />
                      <Text style={[styles.memoryDateText, { color: colors.primary }]}>{formattedDate}</Text>
                    </View>
                    <Text style={[styles.memoryBookLabel, { color: colors.tertiary }]}>{book.title}</Text>
                  </View>

                  <Text style={styles.memorySnippetText}>
                    {highlightSnippet(entry.text, query)}
                  </Text>

                  {entry.category && (
                    <View style={styles.categoryBadge}>
                      <Text style={[styles.categoryText, { color: colors.mutedForeground }]}>
                        #{entry.category}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }

            return null;
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  headerTitle: {
    fontSize: 28,
    letterSpacing: 0.2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    height: '100%',
  },
  filterBar: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  scrollContent: {
    padding: 20,
    gap: 24,
  },
  recentSection: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeading: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  clearAllText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 6,
    paddingLeft: 10,
    paddingRight: 8,
    gap: 6,
  },
  recentChipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recentChipText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  suggestChip: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  suggestChipText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  helperNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  helperText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    gap: 10,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  emptyActionText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  resultsList: {
    padding: 20,
    gap: 12,
  },
  resultSectionTitle: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 4,
  },
  bookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  bookSpine: {
    width: 4,
    height: 36,
    borderRadius: 2,
  },
  bookMeta: { flex: 1, gap: 2 },
  bookTitle: { fontSize: 16 },
  bookSub: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  memoryCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  memoryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memoryDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memoryDateText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  memoryBookLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  memorySnippetText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  categoryText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
});
