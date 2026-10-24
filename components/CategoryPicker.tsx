import React from 'react';
import { ScrollView, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { CATEGORIES } from '@/constants/categories';
import { CategoryIcon } from './CategoryIcon';
import type { CategoryId } from '@/lib/data';
import * as Haptics from 'expo-haptics';

interface Props {
  selected?: CategoryId;
  onChange: (id: CategoryId) => void;
}

export function CategoryPicker({ selected, onChange }: Props) {
  const colors = useColors();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll} contentContainerStyle={styles.row}>
      {CATEGORIES.map(cat => {
        const active = selected === cat.id;
        return (
          <TouchableOpacity
            key={cat.id}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(cat.id);
            }}
            activeOpacity={0.75}
            style={[
              styles.chip,
              {
                backgroundColor: active ? cat.color + '22' : colors.muted,
                borderColor: active ? cat.color : colors.border,
                borderWidth: 1,
              },
            ]}
          >
            <CategoryIcon
              id={cat.id}
              size={14}
              color={active ? cat.color : colors.mutedForeground}
              weight={active ? 'bold' : 'regular'}
            />
            <Text style={[styles.label, { color: active ? cat.color : colors.mutedForeground }]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  row: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 8,
  },
  label: { fontSize: 12, fontFamily: 'Inter_500Medium' },
});
