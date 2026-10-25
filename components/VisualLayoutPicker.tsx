import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Check } from 'phosphor-react-native';
import { useColors } from '@/hooks/useColors';
import type { PageLayoutType } from '@/lib/data';
import * as Haptics from 'expo-haptics';

export interface LayoutOptionDef {
  id: PageLayoutType;
  title: string;
  tag: string;
  description: string;
}

export const LAYOUT_DEFS: LayoutOptionDef[] = [
  {
    id: 'quad',
    title: 'Gallery 2×2',
    tag: 'Balanced Quad',
    description: '4 square photo frames with captions underneath.',
  },
  {
    id: 'strips',
    title: 'Filmstrips',
    tag: 'Panoramic',
    description: '4 wide horizontal letterbox strips stacked elegantly.',
  },
  {
    id: 'polaroid',
    title: 'Polaroid Cards',
    tag: 'Scrapbook',
    description: 'Tactile white instant-film cards with organic tilt angles.',
  },
];

interface Props {
  selected?: PageLayoutType;
  selectedLayout?: PageLayoutType;
  onSelect?: (layout: PageLayoutType) => void;
  onSelectLayout?: (layout: PageLayoutType) => void;
  horizontal?: boolean;
}

export function VisualLayoutPicker({
  selected,
  selectedLayout,
  onSelect,
  onSelectLayout,
  horizontal = true,
}: Props) {
  const activeLayout = selectedLayout ?? selected ?? 'quad';
  const handleSelect = onSelectLayout ?? onSelect ?? (() => {});
  const colors = useColors();

  function renderWireframe(id: PageLayoutType, active: boolean) {
    const boxColor = active ? colors.primary : '#8C827A';
    const textColor = active ? colors.primary + '88' : '#D0C9C0';
    const paperBg = active ? 'rgba(232, 89, 58, 0.08)' : '#F5F2EB';

    if (id === 'quad') {
      return (
        <View style={[styles.wireframeBox, { backgroundColor: paperBg }]}>
          <View style={styles.wfQuadGrid}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={styles.wfQuadCell}>
                <View style={[styles.wfQuadPhoto, { backgroundColor: boxColor }]} />
                <View style={[styles.wfLine, { backgroundColor: textColor, width: '80%' }]} />
              </View>
            ))}
          </View>
        </View>
      );
    }

    if (id === 'strips') {
      return (
        <View style={[styles.wireframeBox, { backgroundColor: paperBg }]}>
          <View style={styles.wfStripsCol}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={styles.wfStripRow}>
                <View style={[styles.wfStripPhoto, { backgroundColor: boxColor }]} />
                <View style={[styles.wfLine, { backgroundColor: textColor, width: '60%' }]} />
              </View>
            ))}
          </View>
        </View>
      );
    }

    // Polaroid
    return (
      <View style={[styles.wireframeBox, { backgroundColor: paperBg }]}>
        <View style={styles.wfQuadGrid}>
          {[
            { rot: '-3deg' },
            { rot: '3deg' },
            { rot: '2deg' },
            { rot: '-2deg' },
          ].map((item, i) => (
            <View key={i} style={[styles.wfPolaroidCard, { transform: [{ rotate: item.rot }] }]}>
              <View style={[styles.wfPolaroidPhoto, { backgroundColor: boxColor }]} />
              <View style={[styles.wfLine, { backgroundColor: textColor, width: '60%', marginTop: 2 }]} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  const content = (
    <View style={horizontal ? styles.horizontalRow : styles.verticalGrid}>
      {LAYOUT_DEFS.map((layout) => {
        const active = activeLayout === layout.id;
        return (
          <TouchableOpacity
            key={layout.id}
            style={[
              styles.card,
              {
                backgroundColor: active ? colors.accentLight : colors.card,
                borderColor: active ? colors.primary : colors.border,
              },
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              handleSelect(layout.id);
            }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Select ${layout.title} layout`}
          >
            {renderWireframe(layout.id, active)}
            <View style={styles.metaRow}>
              <Text
                style={[
                  styles.title,
                  { color: active ? colors.primary : colors.foreground },
                ]}
              >
                {layout.title}
              </Text>
              {active && <Check size={14} color={colors.primary} weight="bold" />}
            </View>
            <Text style={[styles.tag, { color: active ? colors.primary : colors.tertiary }]}>
              {layout.tag}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  if (horizontal) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollPad}
      >
        {content}
      </ScrollView>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  scrollPad: {
    paddingVertical: 4,
  },
  horizontalRow: {
    flexDirection: 'row',
    gap: 12,
  },
  verticalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  card: {
    width: 124,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 10,
    alignItems: 'center',
    gap: 4,
  },
  wireframeBox: {
    width: 96,
    height: 72,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  title: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  tag: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
  },
  wfLine: {
    height: 2,
    borderRadius: 1,
  },

  /* 1. Quad */
  wfQuadGrid: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'space-between',
  },
  wfQuadCell: {
    width: '46%',
    height: '46%',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wfQuadPhoto: {
    width: '100%',
    height: 20,
    borderRadius: 3,
  },

  /* 2. Strips */
  wfStripsCol: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
  },
  wfStripRow: {
    width: '100%',
    height: '21%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wfStripPhoto: {
    width: '50%',
    height: '100%',
    borderRadius: 2,
  },

  /* 3. Hero */
  wfHeroCol: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
  },
  wfHeroTop: {
    width: '100%',
    height: 32,
    borderRadius: 3,
  },
  wfHeroMicroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    height: 16,
  },
  wfHeroMicroSquare: {
    width: '30%',
    height: '100%',
    borderRadius: 2,
  },

  /* 4. Magazine */
  wfMagCol: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
  },
  wfMagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '46%',
    gap: 4,
  },
  wfMagPhoto: {
    width: '46%',
    height: '100%',
    borderRadius: 3,
  },
  wfMagTextCol: {
    width: '48%',
    gap: 3,
  },

  /* 5. Polaroid */
  wfPolaroidCard: {
    width: '46%',
    height: '46%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  wfPolaroidPhoto: {
    width: '100%',
    height: 18,
    borderRadius: 1,
  },
});
