import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { getCategoryById } from '@/constants/categories';
import { CategoryIcon } from './CategoryIcon';
import type { Entry } from '@/lib/data';

interface Props {
  entry: Entry | null;
  slotNumber: number;
  onPress?: () => void;
  compact?: boolean;
}

const SLOT_HEIGHT = 88;

export function EntrySlot({ entry, slotNumber, onPress, compact }: Props) {
  const colors = useColors();
  const category = entry?.category ? getCategoryById(entry.category) : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.75}
      style={[
        styles.container,
        {
          minHeight: compact ? SLOT_HEIGHT - 12 : SLOT_HEIGHT,
          borderColor: colors.borderStrong,
          backgroundColor: colors.card,
        },
      ]}
    >
      <View style={[styles.numBadge, { backgroundColor: colors.muted }]}>
        <Text style={[styles.num, { color: colors.foreground }]}>{slotNumber}</Text>
      </View>

      <View style={styles.content}>
        {entry ? (
          <>
            <Text style={[styles.text, { color: colors.foreground }]} numberOfLines={3}>
              {entry.text}
            </Text>
            <View style={styles.meta}>
              {category && (
                <View style={[styles.catBadge, { backgroundColor: category.color + '22', borderColor: category.color + '44' }]}>
                  <CategoryIcon id={category.id} size={11} color={category.color} weight="bold" />
                  <Text style={[styles.catLabel, { color: category.color }]}>{category.label}</Text>
                </View>
              )}
              {!!entry.photos?.length && (
                <View style={styles.photos}>
                  {entry.photos.slice(0, 2).map((uri, i) => (
                    <Image key={i} source={{ uri }} style={styles.photo} />
                  ))}
                </View>
              )}
            </View>
          </>
        ) : (
          <View style={[styles.emptyLine, { backgroundColor: colors.border }]} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  numBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  num: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  content: { flex: 1, gap: 6 },
  text: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  catBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  catLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  photos: { flexDirection: 'row', gap: 4 },
  photo: { width: 26, height: 26, borderRadius: 4, backgroundColor: '#eee' },
  emptyLine: { height: 1, borderRadius: 1, marginTop: 12, opacity: 0.5 },
});
