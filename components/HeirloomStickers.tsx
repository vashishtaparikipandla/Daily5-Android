import React from 'react';
import { Image } from 'react-native';

export const PNG_STICKER_ASSETS: Record<string, any> = {
  'stk-tape-1': require('@/assets/stickers/tape_1.png'),
  'stk-tape-2': require('@/assets/stickers/tape_2.png'),
  'stk-tape-3': require('@/assets/stickers/tape_3.png'),
  'stk-badge-1': require('@/assets/stickers/sticker_badge_1.png'),
  'stk-badge-2': require('@/assets/stickers/sticker_gemini_3.png'),
  'stk-badge-3': require('@/assets/stickers/sticker_gemini_6.png'),
  'stk-stamp-1': require('@/assets/stickers/sticker_vintage_1.png'),
  'stk-stamp-2': require('@/assets/stickers/sticker_vintage_2.png'),
  'stk-stamp-3': require('@/assets/stickers/sticker_vintage_3.png'),
  'stk-stamp-4': require('@/assets/stickers/sticker_vintage_4.png'),
  'stk-stamp-5': require('@/assets/stickers/sticker_vintage_5.png'),
  'stk-stamp-6': require('@/assets/stickers/sticker_vintage_6.png'),
  'stk-emblem-1': require('@/assets/stickers/sticker_gemini_1.png'),
  'stk-emblem-2': require('@/assets/stickers/sticker_gemini_4.png'),
  'stk-emblem-3': require('@/assets/stickers/sticker_gemini_5.png'),
  'stk-accent-1': require('@/assets/stickers/sticker_gemini_2.png'),
  'stk-accent-2': require('@/assets/stickers/sticker_gemini_7.png'),
  'stk-accent-3': require('@/assets/stickers/sticker_gemini_8.png'),
};

export interface StickerCatalogItem {
  id: string;
  name: string;
  width: number;
  height: number;
  trayWidth: number;
  trayHeight: number;
  render: (scale?: number) => React.ReactNode;
}

export const STICKER_CATALOG: StickerCatalogItem[] = [
  // ─── 1. LONG WASHI RIBBON TAPES (~3:1 ASPECT RATIO) ─────────────────────
  {
    id: 'stk-tape-1',
    name: 'Washi Ribbon Tape',
    width: 130,
    height: 43,
    trayWidth: 72,
    trayHeight: 24,
    render: (scale = 1) => (
      <Image
        source={PNG_STICKER_ASSETS['stk-tape-1']}
        style={{ width: 130 * scale, height: 43 * scale }}
        resizeMode="contain"
      />
    ),
  },
  {
    id: 'stk-tape-2',
    name: 'Archival Washi Strip',
    width: 130,
    height: 43,
    trayWidth: 72,
    trayHeight: 24,
    render: (scale = 1) => (
      <Image
        source={PNG_STICKER_ASSETS['stk-tape-2']}
        style={{ width: 130 * scale, height: 43 * scale }}
        resizeMode="contain"
      />
    ),
  },
  {
    id: 'stk-tape-3',
    name: 'Vintage Paper Tape',
    width: 130,
    height: 43,
    trayWidth: 72,
    trayHeight: 24,
    render: (scale = 1) => (
      <Image
        source={PNG_STICKER_ASSETS['stk-tape-3']}
        style={{ width: 130 * scale, height: 43 * scale }}
        resizeMode="contain"
      />
    ),
  },

  // ─── 2. RECTANGULAR BADGES & LABELS (~1.4 - 1.6 ASPECT RATIO) ─────────────
  {
    id: 'stk-badge-1',
    name: 'Keepsake Label Badge',
    width: 74,
    height: 53,
    trayWidth: 46,
    trayHeight: 33,
    render: (scale = 1) => (
      <Image
        source={PNG_STICKER_ASSETS['stk-badge-1']}
        style={{ width: 74 * scale, height: 53 * scale }}
        resizeMode="contain"
      />
    ),
  },
  {
    id: 'stk-badge-2',
    name: 'Story Ephemera Badge',
    width: 74,
    height: 54,
    trayWidth: 46,
    trayHeight: 33,
    render: (scale = 1) => (
      <Image
        source={PNG_STICKER_ASSETS['stk-badge-2']}
        style={{ width: 74 * scale, height: 54 * scale }}
        resizeMode="contain"
      />
    ),
  },
  {
    id: 'stk-badge-3',
    name: 'Archival Banner Pill',
    width: 78,
    height: 49,
    trayWidth: 48,
    trayHeight: 30,
    render: (scale = 1) => (
      <Image
        source={PNG_STICKER_ASSETS['stk-badge-3']}
        style={{ width: 78 * scale, height: 49 * scale }}
        resizeMode="contain"
      />
    ),
  },

  // ─── 3. SQUARE ARCHIVAL STAMPS (~1:1 ASPECT RATIO) ───────────────────────
  {
    id: 'stk-stamp-1',
    name: 'Vintage Postal Stamp I',
    width: 54,
    height: 54,
    trayWidth: 36,
    trayHeight: 36,
    render: (scale = 1) => (
      <Image
        source={PNG_STICKER_ASSETS['stk-stamp-1']}
        style={{ width: 54 * scale, height: 54 * scale }}
        resizeMode="contain"
      />
    ),
  },
  {
    id: 'stk-stamp-2',
    name: 'Vintage Postal Stamp II',
    width: 54,
    height: 55,
    trayWidth: 36,
    trayHeight: 36,
    render: (scale = 1) => (
      <Image
        source={PNG_STICKER_ASSETS['stk-stamp-2']}
        style={{ width: 54 * scale, height: 55 * scale }}
        resizeMode="contain"
      />
    ),
  },
  {
    id: 'stk-stamp-3',
    name: 'Vintage Postal Stamp III',
    width: 53,
    height: 55,
    trayWidth: 36,
    trayHeight: 36,
    render: (scale = 1) => (
      <Image
        source={PNG_STICKER_ASSETS['stk-stamp-3']}
        style={{ width: 53 * scale, height: 55 * scale }}
        resizeMode="contain"
      />
    ),
  },
  {
    id: 'stk-stamp-4',
    name: 'Vintage Postal Stamp IV',
    width: 53,
    height: 56,
    trayWidth: 36,
    trayHeight: 36,
    render: (scale = 1) => (
      <Image
        source={PNG_STICKER_ASSETS['stk-stamp-4']}
        style={{ width: 53 * scale, height: 56 * scale }}
        resizeMode="contain"
      />
    ),
  },
  {
    id: 'stk-stamp-5',
    name: 'Vintage Postal Stamp V',
    width: 55,
    height: 56,
    trayWidth: 36,
    trayHeight: 36,
    render: (scale = 1) => (
      <Image
        source={PNG_STICKER_ASSETS['stk-stamp-5']}
        style={{ width: 55 * scale, height: 56 * scale }}
        resizeMode="contain"
      />
    ),
  },
  {
    id: 'stk-stamp-6',
    name: 'Vintage Postal Stamp VI',
    width: 56,
    height: 53,
    trayWidth: 36,
    trayHeight: 34,
    render: (scale = 1) => (
      <Image
        source={PNG_STICKER_ASSETS['stk-stamp-6']}
        style={{ width: 56 * scale, height: 53 * scale }}
        resizeMode="contain"
      />
    ),
  },

  // ─── 4. 3D MEMORY EMBLEMS & SEALS ─────────────────────────────────────────
  {
    id: 'stk-emblem-1',
    name: 'Heirloom Wax Crest',
    width: 60,
    height: 51,
    trayWidth: 40,
    trayHeight: 34,
    render: (scale = 1) => (
      <Image
        source={PNG_STICKER_ASSETS['stk-emblem-1']}
        style={{ width: 60 * scale, height: 51 * scale }}
        resizeMode="contain"
      />
    ),
  },
  {
    id: 'stk-emblem-2',
    name: '3D Memory Seal I',
    width: 54,
    height: 54,
    trayWidth: 36,
    trayHeight: 36,
    render: (scale = 1) => (
      <Image
        source={PNG_STICKER_ASSETS['stk-emblem-2']}
        style={{ width: 54 * scale, height: 54 * scale }}
        resizeMode="contain"
      />
    ),
  },
  {
    id: 'stk-emblem-3',
    name: '3D Memory Seal II',
    width: 54,
    height: 54,
    trayWidth: 36,
    trayHeight: 36,
    render: (scale = 1) => (
      <Image
        source={PNG_STICKER_ASSETS['stk-emblem-3']}
        style={{ width: 54 * scale, height: 54 * scale }}
        resizeMode="contain"
      />
    ),
  },

  // ─── 5. PETITE ACCENT CHARMS (DELICATE EMBELLISHMENTS) ─────────────────────
  {
    id: 'stk-accent-1',
    name: 'Petite Star Charm',
    width: 42,
    height: 38,
    trayWidth: 30,
    trayHeight: 27,
    render: (scale = 1) => (
      <Image
        source={PNG_STICKER_ASSETS['stk-accent-1']}
        style={{ width: 42 * scale, height: 38 * scale }}
        resizeMode="contain"
      />
    ),
  },
  {
    id: 'stk-accent-2',
    name: 'Mini Ribbon Charm',
    width: 38,
    height: 39,
    trayWidth: 28,
    trayHeight: 29,
    render: (scale = 1) => (
      <Image
        source={PNG_STICKER_ASSETS['stk-accent-2']}
        style={{ width: 38 * scale, height: 39 * scale }}
        resizeMode="contain"
      />
    ),
  },
  {
    id: 'stk-accent-3',
    name: 'Vertical Accent Tag',
    width: 32,
    height: 41,
    trayWidth: 24,
    trayHeight: 31,
    render: (scale = 1) => (
      <Image
        source={PNG_STICKER_ASSETS['stk-accent-3']}
        style={{ width: 32 * scale, height: 41 * scale }}
        resizeMode="contain"
      />
    ),
  },
];
