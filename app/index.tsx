import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withDelay, withRepeat, withSequence, Easing,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandLogoFull } from '@/components/BrandLogo';

export default function SplashScreen() {
  const { isLoading, isAuthenticated, hasOnboarded, biometricEnabled, unlock } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigated = useRef(false);
  const [minSplashDone, setMinSplashDone] = useState(false);
  const [statusText, setStatusText] = useState('');

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.92);
  const taglineOpacity = useSharedValue(0);

  // Gentle sway animation based on Argon's motion specs
  const rotation = useSharedValue(0);
  const skewX = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
    scale.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
    taglineOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));

    // Gentle swaying loop anchored from bottom
    rotation.value = withRepeat(
      withSequence(
        withTiming(-2.2, { duration: 1150, easing: Easing.inOut(Easing.quad) }),
        withTiming(2.2, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1150, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );

    skewX.value = withRepeat(
      withSequence(
        withTiming(-2.5, { duration: 1150, easing: Easing.inOut(Easing.quad) }),
        withTiming(2.5, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1150, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );

    const t = setTimeout(() => {
      setMinSplashDone(true);
    }, 1400);

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
    transform: [
      { scale: scale.value },
      { rotateZ: `${rotation.value}deg` },
      { skewX: `${skewX.value}deg` },
    ],
    transformOrigin: '50% 100%',
  }));
  const taglineStyle = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Animated.View style={[styles.center, logoStyle]}>
        <BrandLogoFull width={116} height={118} color={colors.primary} />
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
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 28 },
  center: { alignItems: 'center', justifyContent: 'center' },
  tagline: { fontSize: 13, letterSpacing: 1.5, fontFamily: 'Inter_400Regular', fontStyle: 'italic' },
});
