import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Sun, Moon, DeviceMobile, Check } from 'phosphor-react-native';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/contexts/AppContext';
import { ProtectedScreen } from '@/components/ProtectedScreen';
import * as Haptics from 'expo-haptics';

interface ThemeOption {
  value: 'light' | 'dark' | 'system';
  label: string;
  icon: (color: string) => React.ReactNode;
}

const OPTIONS: ThemeOption[] = [
  { value: 'light', label: 'Light', icon: c => <Sun size={20} color={c} weight="regular" /> },
  { value: 'dark', label: 'Dark', icon: c => <Moon size={20} color={c} weight="regular" /> },
  { value: 'system', label: 'System Default', icon: c => <DeviceMobile size={20} color={c} weight="regular" /> },
];

function AppearanceContent() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { theme, setTheme } = useApp();
  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topPad }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <ArrowLeft size={22} color={colors.foreground} weight="bold" />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
          Appearance
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.sectionLabel, { color: colors.tertiary }]}>Theme Palette</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}>
          {OPTIONS.map((opt, i) => {
            const active = theme === opt.value;
            const iconColor = active ? colors.primary : colors.mutedForeground;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.row,
                  i < OPTIONS.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setTheme(opt.value);
                }}
                activeOpacity={0.75}
              >
                {opt.icon(iconColor)}
                <Text
                  style={[
                    styles.rowLabel,
                    {
                      color: active ? colors.primary : colors.foreground,
                      fontFamily: active ? 'Inter_600SemiBold' : 'Inter_400Regular',
                    },
                  ]}
                >
                  {opt.label}
                </Text>
                {active && <Check size={18} color={colors.primary} weight="bold" />}
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={[styles.hint, { color: colors.tertiary }]}>
          Changes apply instantly. The warm paper theme is optimized for readability and evening reflection.
        </Text>
      </View>
    </View>
  );
}

export default function AppearanceScreen() {
  return (
    <ProtectedScreen>
      <AppearanceContent />
    </ProtectedScreen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 18 },
  content: { padding: 20, gap: 10 },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8, textTransform: 'uppercase' },
  card: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 16,
  },
  rowLabel: { flex: 1, fontSize: 15 },
  hint: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18, marginTop: 4 },
});
