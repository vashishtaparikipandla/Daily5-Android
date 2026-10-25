import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { BrandLogoLoader } from '@/components/BrandLogo';
import { useColorScheme } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import {
  BookOpen,
  Books,
  Compass,
  MagnifyingGlass,
  User,
  Lock,
  Fingerprint,
} from 'phosphor-react-native';
import { BlurView } from 'expo-blur';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/contexts/AppContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Full-screen biometric lock overlay. Shown when the user navigates
 * directly to a tab without passing through the splash unlock flow.
 */
function BiometricLock({ onUnlock }: { onUnlock: () => Promise<boolean> }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    handleUnlock();
  }, []);

  async function handleUnlock() {
    setLoading(true);
    setError('');
    const success = await onUnlock();
    if (!success) {
      setError('Biometric verification failed. Tap to retry.');
    }
    setLoading(false);
  }

  return (
    <View style={[styles.lockRoot, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.lockCenter}>
        <View style={[styles.lockIcon, { backgroundColor: colors.accentLight }]}>
          <Lock size={36} color={colors.primary} weight="fill" />
        </View>
        <Text style={[styles.lockTitle, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
          Dear Day is Locked
        </Text>
        {error ? (
          <Text style={[styles.lockError, { color: colors.destructive }]}>{error}</Text>
        ) : (
          <Text style={[styles.lockSub, { color: colors.mutedForeground }]}>
            Use biometric to unlock your personal diary
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={[styles.lockBtn, { backgroundColor: colors.primary, opacity: loading ? 0.6 : 1 }]}
        onPress={handleUnlock}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <BrandLogoLoader size={22} color={colors.primaryForeground} />
        ) : (
          <>
            <Fingerprint size={20} color={colors.primaryForeground} weight="bold" />
            <Text style={[styles.lockBtnText, { color: colors.primaryForeground }]}>Unlock Diary</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function TabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';
  const { isAuthenticated, isUnlocked, unlock } = useApp();

  // Guard: unauthenticated users are redirected to auth
  if (!isAuthenticated) {
    return <Redirect href="/auth" />;
  }

  // Guard: authenticated but not yet unlocked — show biometric lock
  if (!isUnlocked) {
    return <BiometricLock onUnlock={unlock} />;
  }

  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'android' ? 14 : 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: isIOS ? 'transparent' : colors.card,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          elevation: 10,
          height: 54 + bottomPad,
          paddingBottom: bottomPad,
          paddingTop: 6,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
          ) : undefined,
        tabBarLabelStyle: {
          fontFamily: 'Inter_500Medium',
          fontSize: 10.5,
          letterSpacing: 0.2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, focused }) => (
            <BookOpen size={22} color={color} weight={focused ? 'fill' : 'regular'} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ color, focused }) => (
            <Books size={22} color={color} weight={focused ? 'fill' : 'regular'} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, focused }) => (
            <Compass size={22} color={color} weight={focused ? 'fill' : 'regular'} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, focused }) => (
            <MagnifyingGlass size={22} color={color} weight={focused ? 'bold' : 'regular'} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <User size={22} color={color} weight={focused ? 'fill' : 'regular'} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  lockRoot: { flex: 1, paddingHorizontal: 28, justifyContent: 'space-between', paddingVertical: 40 },
  lockCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  lockIcon: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  lockTitle: { fontSize: 24, textAlign: 'center' },
  lockSub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  lockError: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  lockBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 48, borderRadius: 10,
  },
  lockBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
