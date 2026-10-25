import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { loadBooks, saveBooks } from '@/lib/storage';
import { seedDemoData } from '@/lib/seed';
import {
  uid, todayStr, monthKey,
  type Book, type DayLog, type Entry,
  type PageLayoutType, type BookFontType, type BookCoverConfig,
} from '@/lib/data';
import {
  saveBackupToFile,
  loadBackupFromFile,
  backupFileExists,
  getLastBackupTime,
} from '@/lib/backup';
import { useApp } from '@/contexts/AppContext';

interface DiaryContextValue {
  books: Book[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  getBook: (mk: string) => Book | undefined;
  getTodayBook: () => Book | undefined;
  getTodayLog: () => DayLog | undefined;
  getDayLog: (date: string) => DayLog | undefined;
  customBooks: Book[];
  sampleBooks: Book[];
  monthlyBooks: Book[];
  createCustomBook: (
    title: string,
    description?: string,
    coverColor?: string,
    options?: {
      coverConfig?: BookCoverConfig;
      pageLayout?: PageLayoutType;
      fontFamily?: BookFontType;
    },
  ) => Promise<Book>;
  updateBookConfig: (
    monthKey: string,
    updates: Partial<Pick<Book, 'title' | 'description' | 'coverColor' | 'coverConfig' | 'pageLayout' | 'fontFamily'>>,
  ) => Promise<void>;
  deleteCustomBook: (monthKey: string) => Promise<void>;
  addDayToCustomBook: (customMonthKey: string, date: string, entries?: Entry[]) => Promise<boolean>;
  toggleHideDayInBook: (bookMonthKey: string, date: string) => Promise<void>;
  toggleFavoriteDay: (date: string) => Promise<boolean>;
  /** Returns false (and does nothing) if the target book is locked. */
  upsertDayEntries: (
    date: string,
    entries: Entry[],
    extras?: Entry[],
    customBookKeys?: string[],
    dayLayout?: PageLayoutType,
    isFavorite?: boolean,
  ) => Promise<boolean>;
  lockCurrentMonth: () => Promise<void>;
  getOnThisDay: () => { book: Book; day: DayLog }[];
  totalMoments: number;
  totalDays: number;
  streakCount: number;
  /** Manually trigger an encrypted backup. */
  performBackup: () => Promise<boolean>;
  /** Restore books from the local backup file. Returns true on success. */
  restoreFromBackup: () => Promise<boolean>;
  /**
   * Restore books from already-decrypted data (e.g. from a Drive download).
   * Saves to AsyncStorage and updates in-memory state.
   */
  restoreFromData: (data: unknown) => Promise<boolean>;
  /** ISO string of the last successful backup, or null. */
  lastBackupTime: Date | null;
  /** Refresh the last backup time display. */
  refreshBackupTime: () => Promise<void>;
}

const DiaryContext = createContext<DiaryContextValue | null>(null);

export function DiaryProvider({ children }: { children: React.ReactNode }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastBackupTime, setLastBackupTime] = useState<Date | null>(null);
  const { backupEnabled } = useApp();

  useEffect(() => { init(); }, []);

  // Refresh last backup time whenever backup enabled changes
  useEffect(() => {
    if (backupEnabled) refreshBackupTime();
  }, [backupEnabled]);

  async function init() {
    try {
      await seedDemoData();
      const loaded = await loadBooks();

      // If no local books exist, check for a backup to restore
      if (loaded.length === 0) {
        const exists = await backupFileExists();
        if (exists) {
          // Prompt user — this fires after the splash, so the UI is ready
          Alert.alert(
            'Backup found',
            'A Dear Day backup was found on this device. Would you like to restore your diary?',
            [
              {
                text: 'Restore',
                onPress: async () => {
                  const restored = await loadBackupFromFile();
                  if (restored && Array.isArray(restored) && restored.length > 0) {
                    const booksData = restored as Book[];
                    await saveBooks(booksData);
                    setBooks(booksData);
                    Alert.alert('Restored', 'Your diary has been restored from backup.');
                  } else {
                    Alert.alert(
                      'Restore failed',
                      'The backup could not be decrypted. If you switched devices, enter your recovery key in Data & Privacy first.',
                    );
                  }
                },
              },
              { text: 'Skip', style: 'cancel' },
            ],
          );
        }
      }

      setBooks(loaded);
    } catch (e) { console.warn('DiaryContext init error', e); }
    setIsLoading(false);

    // Load last backup time
    try {
      const t = await getLastBackupTime();
      setLastBackupTime(t);
    } catch {}
  }

  async function refresh() {
    const loaded = await loadBooks();
    setBooks(loaded);
  }

  async function refreshBackupTime() {
    try {
      const t = await getLastBackupTime();
      setLastBackupTime(t);
    } catch {}
  }

  /** Run an encrypted backup of current books. Returns true on success. */
  async function performBackup(booksToBackup?: Book[]): Promise<boolean> {
    try {
      await saveBackupToFile(booksToBackup ?? books);
      const t = await getLastBackupTime();
      setLastBackupTime(t);
      return true;
    } catch (e) {
      console.warn('[DiaryContext] backup failed', e);
      return false;
    }
  }

  /** Restore books from the backup file (with current encryption key). */
  async function restoreFromBackup(): Promise<boolean> {
    try {
      const data = await loadBackupFromFile();
      let booksData: Book[] | null = null;
      if (Array.isArray(data)) {
        booksData = data as Book[];
      } else if (data && typeof data === 'object' && Array.isArray((data as any).books)) {
        booksData = (data as any).books as Book[];
      }
      if (!booksData || booksData.length === 0) return false;
      await saveBooks(booksData);
      setBooks(booksData);
      return true;
    } catch {
      return false;
    }
  }

  /** Restore books from already-decrypted data (e.g. downloaded from Drive). */
  async function restoreFromData(data: unknown): Promise<boolean> {
    try {
      let booksData: Book[] | null = null;
      if (Array.isArray(data)) {
        booksData = data as Book[];
      } else if (data && typeof data === 'object' && Array.isArray((data as any).books)) {
        booksData = (data as any).books as Book[];
      }
      if (!booksData || booksData.length === 0) return false;
      await saveBooks(booksData);
      setBooks(booksData);
      return true;
    } catch {
      return false;
    }
  }

  function getBook(mk: string) {
    return books.find(b => b.monthKey === mk);
  }

  function getTodayBook() {
    const mk = monthKey();
    return books.find(b => b.monthKey === mk && !b.locked);
  }

  function getTodayLog() {
    const today = todayStr();
    return getTodayBook()?.days.find(d => d.date === today);
  }

  function getDayLog(date: string) {
    for (const book of books) {
      const day = book.days.find(d => d.date === date);
      if (day) return day;
    }
    return undefined;
  }

  const customBooks = books.filter(b => b.isCustom && !b.isSample);
  const sampleBooks = books.filter(b => b.isSample);
  const monthlyBooks = books.filter(b => !b.isCustom);

  async function createCustomBook(
    title: string,
    description?: string,
    coverColor?: string,
    options?: {
      coverConfig?: BookCoverConfig;
      pageLayout?: PageLayoutType;
      fontFamily?: BookFontType;
    },
  ): Promise<Book> {
    const id = uid();
    const newBook: Book = {
      monthKey: `custom_${id}`,
      id,
      title: title.trim(),
      description: description?.trim(),
      coverColor: coverColor || options?.coverConfig?.value || '#2F3E34',
      coverConfig: options?.coverConfig,
      pageLayout: options?.pageLayout || 'quad',
      fontFamily: options?.fontFamily || 'playfair',
      isCustom: true,
      locked: false,
      days: [],
      hiddenDays: [],
      createdAt: new Date().toISOString(),
    };
    const updated = [newBook, ...books];
    await saveBooks(updated);
    setBooks(updated);
    if (backupEnabled) performBackup(updated).catch(() => {});
    return newBook;
  }

  async function updateBookConfig(
    monthKey: string,
    updates: Partial<Pick<Book, 'title' | 'description' | 'coverColor' | 'coverConfig' | 'pageLayout' | 'fontFamily'>>,
  ): Promise<void> {
    const updated = books.map(b => (b.monthKey === monthKey ? { ...b, ...updates } : b));
    await saveBooks(updated);
    setBooks(updated);
    if (backupEnabled) performBackup(updated).catch(() => {});
  }

  async function deleteCustomBook(monthKey: string): Promise<void> {
    const updated = books.filter(b => b.monthKey !== monthKey);
    await saveBooks(updated);
    setBooks(updated);
    if (backupEnabled) performBackup(updated).catch(() => {});
  }

  async function toggleHideDayInBook(bookMonthKey: string, date: string): Promise<void> {
    const updated = books.map(b => {
      if (b.monthKey !== bookMonthKey) return b;
      const currentHidden = b.hiddenDays ?? [];
      const isHidden = currentHidden.includes(date);
      const nextHidden = isHidden ? currentHidden.filter(d => d !== date) : [...currentHidden, date];
      return { ...b, hiddenDays: nextHidden };
    });
    await saveBooks(updated);
    setBooks(updated);
    if (backupEnabled) performBackup(updated).catch(() => {});
  }

  async function addDayToCustomBook(customMonthKey: string, date: string, customEntries?: Entry[]): Promise<boolean> {
    const targetBook = books.find(b => b.monthKey === customMonthKey);
    if (!targetBook) return false;

    // Resolve entries from dayLog if not passed explicitly
    const entriesToAdd = customEntries ?? getDayLog(date)?.entries ?? [];
    if (entriesToAdd.length === 0) return false;

    const updated = books.map(b => {
      if (b.monthKey !== customMonthKey) return b;
      const existingDayIndex = b.days.findIndex(d => d.date === date);
      if (existingDayIndex >= 0) {
        const nextDays = [...b.days];
        nextDays[existingDayIndex] = { date, entries: entriesToAdd, extras: [] };
        return { ...b, days: nextDays };
      }
      return { ...b, days: [...b.days, { date, entries: entriesToAdd, extras: [] }] };
    });

    await saveBooks(updated);
    setBooks(updated);
    if (backupEnabled) performBackup(updated).catch(() => {});
    return true;
  }

  async function toggleFavoriteDay(date: string): Promise<boolean> {
    let nextFav = false;
    const updated = books.map(b => {
      const hasDay = b.days.some(d => d.date === date);
      if (!hasDay) return b;
      return {
        ...b,
        days: b.days.map(d => {
          if (d.date === date) {
            nextFav = !d.isFavorite;
            return { ...d, isFavorite: nextFav };
          }
          return d;
        }),
      };
    });
    await saveBooks(updated);
    setBooks(updated);
    if (backupEnabled) performBackup(updated).catch(() => {});
    return nextFav;
  }

  async function upsertDayEntries(
    date: string,
    entries: Entry[],
    extras: Entry[] = [],
    customBookKeys?: string[],
    dayLayout?: PageLayoutType,
    isFavorite?: boolean,
  ): Promise<boolean> {
    const mk = date.slice(0, 7);
    const today = todayStr();
    const isPast = date < today;

    // Reject writes to locked monthly books
    const existingBook = books.find(b => b.monthKey === mk);
    if (existingBook?.locked) {
      console.warn('[DiaryContext] upsertDayEntries: book is locked', mk);
      return false;
    }

    // Immutability enforcement for past days:
    // If date is in the past, existing non-empty memories cannot be overwritten or deleted.
    // The user can only fill empty slots!
    let finalEntries = entries;
    if (isPast && existingBook) {
      const existingDay = existingBook.days.find(d => d.date === date);
      if (existingDay && existingDay.entries.length > 0) {
        finalEntries = entries.map((newEntry, idx) => {
          const oldEntry = existingDay.entries[idx];
          if (oldEntry && oldEntry.text.trim().length > 0) {
            // Preserve the original immutable memory
            return oldEntry;
          }
          return newEntry;
        });
      }
    }

    let updated = books.map(b => {
      const layoutToUse = dayLayout || b.pageLayout || 'quad';
      // 1. Update standard monthly volume
      if (b.monthKey === mk) {
        const hasDay = b.days.some(d => d.date === date);
        if (hasDay) {
          return {
            ...b,
            days: b.days.map(d =>
              d.date === date
                ? {
                    ...d,
                    entries: finalEntries,
                    extras,
                    layout: dayLayout || d.layout || layoutToUse,
                    isFavorite: isFavorite !== undefined ? isFavorite : d.isFavorite,
                  }
                : d
            ),
          };
        }
        return {
          ...b,
          days: [
            ...b.days,
            {
              date,
              entries: finalEntries,
              extras,
              layout: layoutToUse,
              isFavorite: isFavorite ?? false,
            },
          ],
        };
      }

      // 2. Also sync to any selected custom books
      if (customBookKeys && customBookKeys.includes(b.monthKey)) {
        const hasDay = b.days.some(d => d.date === date);
        if (hasDay) {
          return {
            ...b,
            days: b.days.map(d =>
              d.date === date
                ? {
                    ...d,
                    entries: finalEntries,
                    extras,
                    layout: dayLayout || d.layout || layoutToUse,
                    isFavorite: isFavorite !== undefined ? isFavorite : d.isFavorite,
                  }
                : d
            ),
          };
        }
        return {
          ...b,
          days: [
            ...b.days,
            {
              date,
              entries: finalEntries,
              extras,
              layout: layoutToUse,
              isFavorite: isFavorite ?? false,
            },
          ],
        };
      }

      return b;
    });

    // Create book for this month if none exists
    if (!updated.find(b => b.monthKey === mk)) {
      updated = [
        ...updated,
        {
          monthKey: mk,
          locked: false,
          pageLayout: 'quad',
          fontFamily: 'playfair',
          days: [
            {
              date,
              entries: finalEntries,
              extras,
              layout: dayLayout || 'quad',
              isFavorite: isFavorite ?? false,
            },
          ],
        },
      ];
    }

    await saveBooks(updated);
    setBooks(updated);

    // Auto-backup in the background when enabled
    if (backupEnabled) {
      performBackup(updated).catch(() => {});
    }

    return true;
  }

  async function lockCurrentMonth() {
    const mk = monthKey();
    const updated = books.map(b => b.monthKey === mk ? { ...b, locked: true } : b);
    await saveBooks(updated);
    setBooks(updated);

    // Backup after locking — locking is a significant event
    if (backupEnabled) {
      performBackup(updated).catch(() => {});
    }
  }

  function getOnThisDay() {
    const now = new Date();
    const mmdd = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentYear = now.getFullYear();
    const result: { book: Book; day: DayLog }[] = [];
    for (const book of books) {
      if (book.isCustom) continue; // Only compare against past monthly books
      if (parseInt(book.monthKey.slice(0, 4)) >= currentYear) continue;
      for (const day of book.days) {
        if (day.date.slice(5) === mmdd) result.push({ book, day });
      }
    }
    return result.sort((a, b) => b.day.date.localeCompare(a.day.date));
  }

  const totalMoments = books.reduce(
    (sum, b) => sum + b.days.reduce((s, d) => s + d.entries.length + d.extras.length, 0),
    0,
  );
  const totalDays = books.reduce(
    (sum, b) => sum + b.days.filter(d => d.entries.length > 0).length,
    0,
  );

  const streakCount = React.useMemo(() => {
    const datesWithEntries = new Set<string>();
    for (const b of books) {
      if (b.isSample) continue;
      for (const d of b.days) {
        if (d.entries.length > 0) {
          datesWithEntries.add(d.date);
        }
      }
    }

    const today = todayStr();
    const cur = new Date(today + 'T12:00:00');

    let checkDate = cur;
    if (!datesWithEntries.has(today)) {
      const yesterday = new Date(cur);
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
      if (!datesWithEntries.has(yStr)) {
        return 0;
      }
      checkDate = yesterday;
    }

    let streak = 0;
    const runner = new Date(checkDate);
    while (true) {
      const dStr = `${runner.getFullYear()}-${String(runner.getMonth() + 1).padStart(2, '0')}-${String(runner.getDate()).padStart(2, '0')}`;
      if (datesWithEntries.has(dStr)) {
        streak++;
        runner.setDate(runner.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }, [books]);

  return (
    <DiaryContext.Provider value={{
      books, isLoading, refresh,
      getBook, getTodayBook, getTodayLog, getDayLog,
      customBooks, sampleBooks, monthlyBooks,
      createCustomBook, updateBookConfig, deleteCustomBook, addDayToCustomBook, toggleHideDayInBook,
      toggleFavoriteDay,
      upsertDayEntries, lockCurrentMonth, getOnThisDay,
      totalMoments, totalDays, streakCount,
      performBackup: () => performBackup(),
      restoreFromBackup,
      restoreFromData,
      lastBackupTime,
      refreshBackupTime,
    }}>
      {children}
    </DiaryContext.Provider>
  );
}

export function useDiary() {
  const ctx = useContext(DiaryContext);
  if (!ctx) throw new Error('useDiary must be inside DiaryProvider');
  return ctx;
}
