import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useDiary } from '@/contexts/DiaryContext';
import { monthKey, daysInMonth } from '@/lib/data';

interface Props {
  onPress: () => void;
  entryCount?: number; // how many moments already logged today
}

export function TonightCard({ onPress, entryCount = 0 }: Props) {
  const colors = useColors();
  const { books } = useDiary();

  const mk = monthKey();
  const currentBook = books.find(b => b.monthKey === mk && !b.isCustom);

  // Page progress
  const totalPages = daysInMonth(mk);
  const filledDays = currentBook?.days.filter(d => d.entries.length > 0).length ?? 0;

  const remaining = 4 - entryCount;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}>
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Ionicons name="pencil" size={16} color={colors.primary} />
        </View>
        <View style={styles.headerTextWrap}>
          <Text style={[styles.title, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
            {entryCount === 0 ? "Tonight's 4 moments" : 'Add remaining moments'}
          </Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            {entryCount === 0
              ? 'Pause before sleep to capture four honest fragments of today.'
              : `${remaining} of 4 moments left to complete today’s page.`}
          </Text>
        </View>
      </View>

      {/* Progress track */}
      <View style={styles.progress}>
        <View style={styles.progressLabelRow}>
          <Text style={[styles.progressLabel, { color: colors.tertiary }]}>
            Volume progress · Page {filledDays} of ~{totalPages}
          </Text>
          <Text style={[styles.progressPercent, { color: colors.primary }]}>
            {Math.round((filledDays / totalPages) * 100)}%
          </Text>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.primary,
                width: `${Math.max(4, Math.min((filledDays / totalPages) * 100, 100))}%`,
              },
            ]}
          />
        </View>
      </View>

      {/* Primary CTA */}
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: colors.primary }]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <Text style={[styles.btnText, { color: colors.primaryForeground }]}>
          {entryCount === 0
            ? "Log tonight's 4"
            : `Add remaining (${remaining} left)`}
        </Text>
        <Ionicons name="arrow-forward" size={16} color={colors.primaryForeground} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 18,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(232, 89, 58, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  headerTextWrap: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 18,
    letterSpacing: 0.2,
  },
  sub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  progress: {
    gap: 6,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  progressPercent: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.2,
  },
});
