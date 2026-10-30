import React from 'react';
import { Image, View, StyleSheet, TouchableOpacity } from 'react-native';

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

// ─── JUMBLED & BALANCED STICKER CATALOG (+40% SCALED) ────────────────────────
export const STICKER_CATALOG: StickerCatalogItem[] = [
  // 1. Wide Tape
  {
    id: 'stk-tape-1',
    name: 'Washi Ribbon Tape',
    width: 160,
    height: 53,
    trayWidth: 102,
    trayHeight: 34,
    render: (scale = 1) => (
      <Image
        source={PNG_STICKER_ASSETS['stk-tape-1']}
        style={{ width: 160 * scale, height: 53 * scale }}
        resizeMode="contain"
      />
    ),
  },
  // 2. Square Stamp
  {
    id: 'stk-stamp-1',
    name: 'Vintage Postal Stamp I',
    width: 70,
    height: 70,
    trayWidth: 52,
    trayHeight: 52,
    render: (scale = 1) => (
      <Image
        source={PNG_STICKER_ASSETS['stk-stamp-1']}
        style={{ width: 70 * scale, height: 70 * scale }}
        resizeMode="contain"
      />
    ),
  },
  // 3. Rectangular Badge
  {
    id: 'stk-badge-1',
    name: 'Keepsake Label Badge',
    width: 96,
    height: 68,
    trayWidth: 66,
    trayHeight: 47,
    render: (scale = 1) => (
      <Image
        source={PNG_STICKER_ASSETS['stk-badge-1']}
        style={{ width: 96 * scale, height: 68 * scale }}
        resizeMode="contain"
      />
    ),
  },
  // 4. Gold Charm
  {
    id: 'stk-accent-1',
    name: 'Gold Star Charm',
    width: 50,
    height: 52,
    trayWidth: 40,
    trayHeight: 42,
    render: (scale = 1) => (
      <Image
        source={PNG_STICKER_ASSETS['stk-accent-1']}
        style={{ width: 50 * scale, height: 52 * scale }}
        resizeMode="contain"
      />
    ),
  },
  // 5. Square Stamp
  {
    id: 'stk-stamp-3',
    name: 'Vintage Postal Stamp III',
    width: 70,
    height: 72,
    trayWidth: 52,
    trayHeight: 53,
    render: (scale = 1) => (
      <Image
        source={PNG_STICKER_ASSETS['stk-stamp-3']}
        style={{ width: 70 * scale, height: 72 * scale }}
        resizeMode="contain"
      />
    ),
  },
  // 6. Wide Tape
  {
    id: 'stk-tape-2',
    name: 'Archival Washi Strip',
    width: 160,
    height: 53,
    trayWidth: 102,
    trayHeight: 34,
    render: (scale = 1) => (
      <Image
        source={PNG_STICKER_ASSETS['stk-tape-2']}
        style={{ width: 160 * scale, height: 53 * scale }}
        resizeMode="contain"
      />
    ),
  },
  // 7. Round Crest / Emblem
  {
    id: 'stk-emblem-1',
    name: 'Botanical Sprig Crest',
    width: 72,
    height: 70,
    trayWidth: 54,
    trayHeight: 52,
    render: (scale = 1) => (
      <Image
        source={PNG_STICKER_ASSETS['stk-emblem-1']}
        style={{ width: 72 * scale, height: 70 * scale }}
        resizeMode="contain"
      />
    ),
  },
  // 8. Story Badge
  {
    id: 'stk-badge-2',
    name: 'Story Ephemera Badge',
    width: 96,
    height: 70,
    trayWidth: 66,
    trayHeight: 48,
    render: (scale = 1) => (
      <Image
        source={PNG_STICKER_ASSETS['stk-badge-2']}
        style={{ width: 96 * scale, height: 70 * scale }}
        resizeMode="contain"
      />
    ),
  },
  // 9. Wax Seal Charm
  {
    id: 'stk-accent-2',
    name: 'Wax Seal Crest',
    width: 50,
    height: 52,
    trayWidth: 40,
    trayHeight: 42,
    render: (scale = 1) => (
      <Image
        source={PNG_STICKER_ASSETS['stk-accent-2']}
        style={{ width: 50 * scale, height: 52 * scale }}
        resizeMode="contain"
      />
    ),
  },
  // 10. Square Floral Stamp
  {
    id: 'stk-stamp-5',
    name: 'Vintage Floral Stamp',
    width: 70,
    height: 70,
    trayWidth: 52,
    trayHeight: 52,
    render: (scale = 1) => (
      <Image
        source={PNG_STICKER_ASSETS['stk-stamp-5']}
        style={{ width: 70 * scale, height: 70 * scale }}
        resizeMode="contain"
      />
    ),
  },
  // 11. Wide Paper Tape
  {
    id: 'stk-tape-3',
    name: 'Vintage Paper Tape',
    width: 160,
    height: 53,
    trayWidth: 102,
    trayHeight: 34,
    render: (scale = 1) => (
      <Image
        source={PNG_STICKER_ASSETS['stk-tape-3']}
        style={{ width: 160 * scale, height: 53 * scale }}
        resizeMode="contain"
      />
    ),
  },
  // 12. Rectangular Archival Banner
  {
    id: 'stk-badge-3',
    name: 'Archival Banner Pill',
    width: 100,
    height: 64,
    trayWidth: 68,
    trayHeight: 44,
    render: (scale = 1) => (
      <Image
        source={PNG_STICKER_ASSETS['stk-badge-3']}
        style={{ width: 100 * scale, height: 64 * scale }}
        resizeMode="contain"
      />
    ),
  },
  // 13. Square Stamp II
  {
    id: 'stk-stamp-2',
    name: 'Vintage Postal Stamp II',
    width: 70,
    height: 71,
    trayWidth: 52,
    trayHeight: 53,
    render: (scale = 1) => (
      <Image
        source={PNG_STICKER_ASSETS['stk-stamp-2']}
        style={{ width: 70 * scale, height: 71 * scale }}
        resizeMode="contain"
      />
    ),
  },
  // 14. Amber Wax Crest
  {
    id: 'stk-emblem-2',
    name: 'Amber Wax Crest',
    width: 72,
    height: 70,
    trayWidth: 54,
    trayHeight: 52,
    render: (scale = 1) => (
      <Image
        source={PNG_STICKER_ASSETS['stk-emblem-2']}
        style={{ width: 72 * scale, height: 70 * scale }}
        resizeMode="contain"
      />
    ),
  },
  // 15. Brass Charm
  {
    id: 'stk-accent-3',
    name: 'Brass Heirloom Charm',
    width: 50,
    height: 52,
    trayWidth: 40,
    trayHeight: 42,
    render: (scale = 1) => (
      <Image
        source={PNG_STICKER_ASSETS['stk-accent-3']}
        style={{ width: 50 * scale, height: 52 * scale }}
        resizeMode="contain"
      />
    ),
  },
  // 16. Square Stamp IV
  {
    id: 'stk-stamp-4',
    name: 'Vintage Postal Stamp IV',
    width: 70,
    height: 72,
    trayWidth: 52,
    trayHeight: 53,
    render: (scale = 1) => (
      <Image
        source={PNG_STICKER_ASSETS['stk-stamp-4']}
        style={{ width: 70 * scale, height: 72 * scale }}
        resizeMode="contain"
      />
    ),
  },
  // 17. Vintage Heirloom Tag
  {
    id: 'stk-emblem-3',
    name: 'Vintage Heirloom Tag',
    width: 92,
    height: 66,
    trayWidth: 64,
    trayHeight: 46,
    render: (scale = 1) => (
      <Image
        source={PNG_STICKER_ASSETS['stk-emblem-3']}
        style={{ width: 92 * scale, height: 66 * scale }}
        resizeMode="contain"
      />
    ),
  },
  // 18. Square Stamp VI
  {
    id: 'stk-stamp-6',
    name: 'Vintage Postal Stamp VI',
    width: 70,
    height: 70,
    trayWidth: 52,
    trayHeight: 52,
    render: (scale = 1) => (
      <Image
        source={PNG_STICKER_ASSETS['stk-stamp-6']}
        style={{ width: 70 * scale, height: 70 * scale }}
        resizeMode="contain"
      />
    ),
  },
];

interface HeirloomStickersTrayProps {
  selectedStickerId?: string | null;
  onSelectSticker: (id: string) => void;
}

export function HeirloomStickersTray({
  selectedStickerId,
  onSelectSticker,
}: HeirloomStickersTrayProps) {
  return (
    <View style={styles.tray}>
      {STICKER_CATALOG.map((st) => {
        const isSelected = selectedStickerId === st.id;
        return (
          <TouchableOpacity
            key={st.id}
            onPress={() => onSelectSticker(st.id)}
            activeOpacity={0.7}
            style={[
              styles.trayItem,
              isSelected && styles.trayItemActive,
            ]}
          >
            {st.render(st.trayWidth / st.width)}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tray: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  trayItem: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  trayItemActive: {
    opacity: 0.75,
  },
});
