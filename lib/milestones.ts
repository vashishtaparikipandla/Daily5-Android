/**
 * milestones.ts
 * Archival Milestone Stamps & Streak Honorifics Engine for Dear Day.
 * Museum-grade philatelic postal stamps and poetic ranks earned through dedication.
 */

import type { Book, DayLog } from './data';

export interface HonorificTitle {
  minStreak: number;
  title: string;
  subtitle: string;
  rank: number;
  badge: string;
}

export const HONORIFIC_RANKS: HonorificTitle[] = [
  { minStreak: 100, title: 'Master of Time', subtitle: 'One hundred days. A personal monument.', rank: 8, badge: '👑' },
  { minStreak: 60, title: 'The Historiographer', subtitle: 'Sixty mornings and evenings woven into history.', rank: 7, badge: '🏛️' },
  { minStreak: 30, title: 'Keeper of Days', subtitle: 'An entire month rescued from oblivion. A complete volume.', rank: 6, badge: '⚜️' },
  { minStreak: 21, title: 'The Documentarian', subtitle: 'Three weeks of faithful record-keeping.', rank: 5, badge: '📜' },
  { minStreak: 14, title: 'The Archivist', subtitle: 'Two unbroken weeks. Memory is now a daily craft.', rank: 4, badge: '🖋️' },
  { minStreak: 7, title: 'The Chronicler', subtitle: 'A full week of life preserved against the rush of time.', rank: 3, badge: '✦' },
  { minStreak: 3, title: 'The Scribe', subtitle: 'Three days committed to ink and paper.', rank: 2, badge: '✎' },
  { minStreak: 1, title: 'The Observer', subtitle: 'One who pauses to notice what others overlook.', rank: 1, badge: '👁️' },
  { minStreak: 0, title: 'New Diarist', subtitle: 'Begin your journey with your first recorded moment.', rank: 0, badge: '🌱' },
];

export function getHonorificTitle(streak: number): HonorificTitle {
  return HONORIFIC_RANKS.find(r => streak >= r.minStreak) ?? HONORIFIC_RANKS[HONORIFIC_RANKS.length - 1];
}

export interface MilestoneStats {
  totalDays: number;
  totalMoments: number;
  streakCount: number;
  totalPhotos: number;
  lockedVolumesCount: number;
  distinctCategoriesCount: number;
}

export interface ArchivalStampDef {
  id: string;
  serialNumber: string;
  title: string;
  description: string;
  postmarkText: string;
  motif: 'quill' | 'stars' | 'waxseal' | 'moon' | 'hardbound' | 'column' | 'camera' | 'polymath';
  accentColor: string;
  category: 'journey' | 'craft' | 'streak' | 'volume';
  isUnlocked: (stats: MilestoneStats) => boolean;
}

export const ARCHIVAL_STAMPS: ArchivalStampDef[] = [
  {
    id: 'first-ink',
    serialNumber: '№ 0001',
    title: 'First Ink',
    description: 'Began the archival habit with your first recorded memory.',
    postmarkText: 'FIRST MEMORY',
    motif: 'quill',
    accentColor: '#E8593A',
    category: 'journey',
    isUnlocked: stats => stats.totalMoments >= 1,
  },
  {
    id: 'the-octet',
    serialNumber: '№ 0007',
    title: 'The Octet',
    description: 'Recorded memories across 7 distinct days.',
    postmarkText: 'ONE WEEK BOUND',
    motif: 'stars',
    accentColor: '#3A6888',
    category: 'journey',
    isUnlocked: stats => stats.totalDays >= 7,
  },
  {
    id: 'the-fortnight',
    serialNumber: '№ 0014',
    title: 'The Fortnight',
    description: 'Recorded memories across 14 distinct days.',
    postmarkText: 'TWO WEEKS ARCHIVED',
    motif: 'waxseal',
    accentColor: '#7A4A28',
    category: 'streak',
    isUnlocked: stats => stats.totalDays >= 14,
  },
  {
    id: 'moon-cycle',
    serialNumber: '№ 0030',
    title: 'Moon Cycle',
    description: 'A full lunar cycle of 30 days preserved.',
    postmarkText: 'ONE FULL ORBIT',
    motif: 'moon',
    accentColor: '#4A3B68',
    category: 'journey',
    isUnlocked: stats => stats.totalDays >= 30,
  },
  {
    id: 'centennial',
    serialNumber: '№ 0100',
    title: 'Centennial',
    description: 'One hundred recorded days in your life archive.',
    postmarkText: 'ONE HUNDRED DAYS',
    motif: 'column',
    accentColor: '#B8860B',
    category: 'journey',
    isUnlocked: stats => stats.totalDays >= 100,
  },
  {
    id: 'photographer-eye',
    serialNumber: '№ 0024',
    title: 'Photographer’s Eye',
    description: 'Richly documented 10 moments with original photographs.',
    postmarkText: 'PHOTOGRAPHIC MEMOIR',
    motif: 'camera',
    accentColor: '#2F6852',
    category: 'craft',
    isUnlocked: stats => stats.totalPhotos >= 10,
  },
  {
    id: 'polymath',
    serialNumber: '№ 0055',
    title: 'The Polymath',
    description: 'Captured life across at least 5 different categories.',
    postmarkText: 'MULTIFACETED LIFE',
    motif: 'polymath',
    accentColor: '#8C4368',
    category: 'craft',
    isUnlocked: stats => stats.distinctCategoriesCount >= 5,
  },
  {
    id: 'first-volume',
    serialNumber: '№ 0101',
    title: 'First Bound Volume',
    description: 'Preserved and locked your first complete monthly photobook volume.',
    postmarkText: 'VOLUME I ARCHIVED',
    motif: 'hardbound',
    accentColor: '#8F3E2C',
    category: 'volume',
    isUnlocked: stats => stats.lockedVolumesCount >= 1,
  },
];

export function computeMilestoneStats(books: Book[], streakCount: number): MilestoneStats {
  const datesSet = new Set<string>();
  const categoriesSet = new Set<string>();
  let totalMoments = 0;
  let totalPhotos = 0;
  let lockedVolumesCount = 0;

  for (const b of books) {
    if (b.isSample) continue;
    if (b.locked) lockedVolumesCount++;

    for (const d of b.days) {
      if (d.entries.length > 0) {
        datesSet.add(d.date);
      }
      for (const e of d.entries) {
        totalMoments++;
        if (e.category) categoriesSet.add(e.category);
        if (e.photos && e.photos.length > 0) {
          totalPhotos += e.photos.length;
        }
      }
      for (const ex of d.extras) {
        totalMoments++;
        if (ex.category) categoriesSet.add(ex.category);
        if (ex.photos && ex.photos.length > 0) {
          totalPhotos += ex.photos.length;
        }
      }
    }
  }

  return {
    totalDays: datesSet.size,
    totalMoments,
    streakCount,
    totalPhotos,
    lockedVolumesCount,
    distinctCategoriesCount: categoriesSet.size,
  };
}
