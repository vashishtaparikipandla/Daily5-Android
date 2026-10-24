import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useColors } from '@/hooks/useColors';
import * as Haptics from 'expo-haptics';

interface EmptyStateProps {
  icon: React.ComponentType<{ size: number; color: string; weight?: any }>;
  iconColor?: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionIcon?: React.ComponentType<{ size: number; color: string; weight?: any }>;
  onAction?: () => void;
  style?: any;
}

export function EmptyState({
  icon: IconComponent,
  iconColor,
  title,
  description,
  actionLabel,
  actionIcon: ActionIconComponent,
  onAction,
  style,
}: EmptyStateProps) {
  const colors = useColors();
  const effectiveIconColor = iconColor || colors.primary;

  return (
    <View style={[styles.container, style]}>
      {/* Icon Bubble */}
      <View style={[styles.iconCircle, { backgroundColor: colors.accentLight, borderColor: colors.border }]}>
        <IconComponent size={34} color={effectiveIconColor} weight="duotone" />
      </View>

      {/* Typography */}
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
          {title}
        </Text>
        <Text style={[styles.description, { color: colors.mutedForeground }]}>
          {description}
        </Text>
      </View>

      {/* Optional CTA Action Button */}
      {actionLabel && onAction && (
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}
          onPress={() => {
            Haptics.selectionAsync();
            onAction();
          }}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          {ActionIconComponent && (
            <ActionIconComponent size={16} color={colors.primary} weight="bold" />
          )}
          <Text style={[styles.actionText, { color: colors.primary }]}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 340,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  textWrap: {
    alignItems: 'center',
    gap: 6,
    maxWidth: 320,
  },
  title: {
    fontSize: 20,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 21,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 4,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  actionText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
});
