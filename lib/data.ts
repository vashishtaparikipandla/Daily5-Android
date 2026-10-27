export type CategoryId =
  | 'food' | 'travel' | 'people' | 'work'
  | 'health' | 'learning' | 'home' | 'love' | 'other';

export type PageLayoutType = 'quad' | 'strips' | 'polaroid';
export type BookFontType = 'playfair' | 'garamond' | 'sans' | 'typewriter';

export interface BookCoverConfig {
  type: 'solid' | 'gradient' | 'photo';
  value: string; // hex color or gradient CSS or photo URI
  fontFamily?: BookFontType;
  title?: string;
  subtitle?: string;
  spineTag?: string;
}

export const SOLID_COVER_PRESETS = [
  { name: 'Forest Pine', hex: '#2F3E34' },
  { name: 'Terracotta', hex: '#8F3E2C' },
  { name: 'Midnight Navy', hex: '#1E293B' },
  { name: 'Parchment Bone', hex: '#E7DFD5', textDark: true },
  { name: 'Burnt Ochre', hex: '#9E5D2A' },
  { name: 'Deep Plum', hex: '#4A2835' },
  { name: 'Charcoal Black', hex: '#1C1917' },
];

export const GRADIENT_COVER_PRESETS = [
  { name: 'Twilight Sky', colors: ['#141E30', '#243B55'] },
  { name: 'Autumn Ember', colors: ['#870000', '#190A05'] },
  { name: 'Earthy Clay', colors: ['#9E5D2A', '#1C1917'] },
  { name: 'Morning Mist', colors: ['#3E5151', '#7A8B7B'] },
  { name: 'Deep Amethyst', colors: ['#4A0E4E', '#0F0C29'] },
];

export interface Entry {
  id: string;
  text: string;
  category?: CategoryId;
  photos?: string[]; // URIs (local file or remote for demo seed)
  bookIds?: string[]; // IDs of custom books this entry is assigned to
}

export interface DayLog {
  date: string;    // YYYY-MM-DD
  title?: string;  // Custom day headline memory title
  entries: Entry[];
  extras: Entry[];
  bookIds?: string[]; // IDs of custom books this day is assigned to
  layout?: PageLayoutType; // Layout for this day's page in photobook
  isFavorite?: boolean; // User favorited day
}

export interface Book {
  monthKey: string; // YYYY-MM or 'custom_<id>'
  id?: string;
  title?: string;
  description?: string;
  coverColor?: string;
  coverConfig?: BookCoverConfig;
  pageLayout?: PageLayoutType;
  fontFamily?: BookFontType;
  isCustom?: boolean;
  isSample?: boolean; // Demo exploration volume
  locked: boolean;
  days: DayLog[];
  hiddenDays?: string[]; // dates (YYYY-MM-DD) hidden from printing/viewing in this book
  isAnnual?: boolean;
  createdAt?: string;
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function monthKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function monthLabel(mk: string): string {
  if (mk.startsWith('custom_')) {
    return 'Custom Collection';
  }
  const parts = mk.split('-');
  if (parts.length < 2) return mk;
  const [y, m] = parts;
  const d = new Date(parseInt(y), parseInt(m) - 1, 1);
  if (isNaN(d.getTime())) return mk;
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function bookDisplayName(book: Book): string {
  if (book.title) return book.title;
  return monthLabel(book.monthKey);
}

export function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatYear(dateStr: string): string {
  return dateStr.slice(0, 4);
}

/** Days in a YYYY-MM monthKey */
export function daysInMonth(mk: string): number {
  if (mk.startsWith('custom_') || !mk.includes('-')) {
    return 30;
  }
  const [y, m] = mk.split('-').map(Number);
  if (isNaN(y) || isNaN(m)) return 30;
  return new Date(y, m, 0).getDate();
}

/** How many pages a book will have (~30 per month) */
export function estimatedPages(mk: string): number {
  return daysInMonth(mk);
}
