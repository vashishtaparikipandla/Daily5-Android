import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Linking } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, EnvelopeSimple, Globe, FileText, CaretRight } from 'phosphor-react-native';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { ProtectedScreen } from '@/components/ProtectedScreen';

function HelpContent() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const items = [
    {
      icon: <EnvelopeSimple size={19} color={colors.mutedForeground} weight="regular" />,
      label: 'Contact Support',
      onPress: () => Linking.openURL('mailto:support@dearday.app'),
    },
    {
      icon: <Globe size={19} color={colors.mutedForeground} weight="regular" />,
      label: 'Privacy Policy',
      onPress: () => Linking.openURL('https://dearday.app/privacy'),
    },
    {
      icon: <FileText size={19} color={colors.mutedForeground} weight="regular" />,
      label: 'Terms of Service',
      onPress: () => Linking.openURL('https://dearday.app/terms'),
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topPad }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <ArrowLeft size={22} color={colors.foreground} weight="bold" />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
          Help & About
        </Text>
        <View style={{ width: 22 }} />
      </View>
      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}>
          {items.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.row,
                i < items.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
              ]}
              onPress={item.onPress}
              activeOpacity={0.75}
            >
              {item.icon}
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>{item.label}</Text>
              <CaretRight size={15} color={colors.tertiary} weight="bold" />
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.versionBlock}>
          <Text style={[styles.appName, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
            Dear Day
          </Text>
          <Text style={[styles.version, { color: colors.tertiary }]}>Version {version}</Text>
          <Text style={[styles.tagline, { color: colors.tertiary }]}>your days, remembered</Text>
        </View>
      </View>
    </View>
  );
}

export default function HelpScreen() {
  return (
    <ProtectedScreen>
      <HelpContent />
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
  content: { padding: 20, gap: 24 },
  card: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  rowLabel: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium' },
  versionBlock: { alignItems: 'center', gap: 4, paddingVertical: 16 },
  appName: { fontSize: 20 },
  version: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  tagline: { fontSize: 12, fontFamily: 'Inter_400Regular', fontStyle: 'italic' },
});
