import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PencilSimple, ArrowRight, CheckCircle, Sparkle } from 'phosphor-react-native';
import { useColors } from '@/hooks/useColors';
import { useDiary } from '@/contexts/DiaryContext';
import { monthKey, daysInMonth } from '@/lib/data';
import * as Haptics from 'expo-haptics';

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
  const remaining = Math.max(0, 4 - entryCount);
  const isComplete = entryCount >= 4;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}>
      <View style={styles.headerRow}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: isComplete ? 'rgba(76, 175, 80, 0.12)' : 'rgba(232, 89, 58, 0.12)' },
          ]}
        >
          {isComplete ? (
            <Sparkle size={18} color="#4CAF50" weight="fill" />
          ) : (
            <PencilSimple size={18} color={colors.primary} weight="bold" />
          )}
        </View>
        <View style={styles.headerTextWrap}>
          <Text style={[styles.title, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
            {isComplete
              ? "Today's Page Complete"
              : entryCount === 0
              ? "Tonight's 4 Moments"
              : 'Add Remaining Moments'}
          </Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            {isComplete
              ? 'You have preserved 4 honest moments today. Sleep well.'
              : entryCount === 0
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
        style={[
          styles.btn,
          {
            backgroundColor: isComplete ? colors.muted : colors.primary,
            borderColor: isComplete ? colors.borderStrong : colors.primary,
            borderWidth: isComplete ? 1 : 0,
          },
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        activeOpacity={0.85}
      >
        <Text
          style={[
            styles.btnText,
            { color: isComplete ? colors.foreground : colors.primaryForeground },
          ]}
        >
          {isComplete
            ? 'Review / Edit Moments'
            : entryCount === 0
            ? "Log Tonight's 4"
            : `Add Remaining (${remaining} left)`}
        </Text>
        <ArrowRight
          size={16}
          color={isComplete ? colors.foreground : colors.primaryForeground}
          weight="bold"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    height: 48,
    borderRadius: 10,
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
