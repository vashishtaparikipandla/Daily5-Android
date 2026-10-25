import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { BrandLogoLoader } from '@/components/BrandLogo';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'lg' | 'md' | 'sm';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  haptic?: boolean;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  textStyle,
  haptic = true,
}: ButtonProps) {
  const colors = useColors();

  function handlePress() {
    if (disabled || loading) return;
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  }

  // Variant-based colors
  let bgColor = colors.primary;
  let textColor = colors.primaryForeground;
  let borderColor = 'transparent';
  let borderWidth = 0;

  if (variant === 'secondary') {
    bgColor = colors.card;
    textColor = colors.foreground;
    borderColor = colors.borderStrong;
    borderWidth = 1;
  } else if (variant === 'outline') {
    bgColor = 'transparent';
    textColor = colors.foreground;
    borderColor = colors.borderStrong;
    borderWidth = 1;
  } else if (variant === 'ghost') {
    bgColor = 'transparent';
    textColor = colors.mutedForeground;
  } else if (variant === 'destructive') {
    bgColor = colors.destructive;
    textColor = colors.destructiveForeground;
  }

  // Size-based dimensions
  let height = 48;
  let borderRadius = 10;
  let fontSize = 15;
  let paddingHorizontal = 18;
  let gap = 8;

  if (size === 'md') {
    height = 40;
    borderRadius = 8;
    fontSize = 14;
    paddingHorizontal = 14;
    gap = 6;
  } else if (size === 'sm') {
    height = 32;
    borderRadius = 8;
    fontSize = 12;
    paddingHorizontal = 12;
    gap = 4;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      disabled={disabled || loading}
      style={[
        styles.base,
        {
          height,
          borderRadius,
          backgroundColor: bgColor,
          borderColor,
          borderWidth,
          paddingHorizontal,
          opacity: disabled ? 0.45 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
    >
      {loading ? (
        <BrandLogoLoader size={size === 'sm' ? 18 : size === 'md' ? 22 : 24} color={textColor} />
      ) : (
        <View style={[styles.contentRow, { gap }]}>
          {iconPosition === 'left' && icon}
          <Text
            style={[
              styles.label,
              {
                color: textColor,
                fontSize,
              },
              textStyle,
            ]}
          >
            {label}
          </Text>
          {iconPosition === 'right' && icon}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.2,
  },
});
