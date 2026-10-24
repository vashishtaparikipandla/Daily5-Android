import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withDelay, Easing,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SplashScreen() {
  const { isLoading, isAuthenticated, hasOnboarded, biometricEnabled, unlock } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigated = useRef(false);
  const [minSplashDone, setMinSplashDone] = useState(false);
  const [statusText, setStatusText] = useState('');

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.88);
  const taglineOpacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
    scale.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
    taglineOpacity.value = withDelay(350, withTiming(1, { duration: 500 }));

    const t = setTimeout(() => {
      setMinSplashDone(true);
    }, 1200);

    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isLoading || !minSplashDone || navigated.current) return;

    navigated.current = true;

    (async () => {
      try {
        if (!hasOnboarded && !isAuthenticated) {
          router.replace('/onboarding');
          return;
        }

        if (!isAuthenticated) {
          router.replace('/auth');
          return;
        }

        if (biometricEnabled) {
          setStatusText('Unlocking…');
          const success = await unlock();
          if (!success) {
            router.replace('/auth');
            return;
          }
        }

        router.replace('/(tabs)');
      } catch (e) {
        console.warn('Navigation error, fallback to auth:', e);
        router.replace('/auth');
      }
    })();
  }, [isLoading, minSplashDone, hasOnboarded, isAuthenticated, biometricEnabled]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  const taglineStyle = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Animated.View style={[styles.center, logoStyle]}>
        <View style={[styles.pageIcon, { borderColor: colors.foreground }]}>
          <View style={[styles.cornerFold, { borderTopColor: colors.primary, borderRightColor: colors.primary }]} />
          <View style={styles.lines}>
            {[1, 2, 3, 4].map(i => (
              <View
                key={i}
                style={[styles.line, {
                  backgroundColor: colors.foreground,
                  opacity: i <= 2 ? 0.7 : 0.4,
                  width: i === 3 ? '60%' : i === 4 ? '40%' : '80%',
                }]}
              />
            ))}
          </View>
        </View>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
          Dear Day
        </Text>
      </Animated.View>
      <Animated.View style={taglineStyle}>
        <Text
          style={[
            styles.tagline,
            { color: statusText.includes('failed') ? colors.destructive : colors.mutedForeground },
          ]}
        >
          {statusText || 'your days, remembered'}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 },
  center: { alignItems: 'center', gap: 20 },
  pageIcon: {
    width: 68, height: 80, borderWidth: 2, borderRadius: 3,
    overflow: 'hidden', justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  cornerFold: {
    position: 'absolute', top: 0, right: 0,
    width: 0, height: 0,
    borderStyle: 'solid',
    borderTopWidth: 18, borderRightWidth: 18,
    borderBottomWidth: 0, borderLeftWidth: 0,
    borderBottomColor: 'transparent', borderLeftColor: 'transparent',
  },
  lines: { gap: 7, paddingHorizontal: 14, width: '100%', paddingTop: 16 },
  line: { height: 2, borderRadius: 1 },
  title: { fontSize: 34, letterSpacing: 0.5 },
  tagline: { fontSize: 13, letterSpacing: 1.5, fontFamily: 'Inter_400Regular', fontStyle: 'italic' },
});
