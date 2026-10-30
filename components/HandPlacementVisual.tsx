import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Image } from 'react-native';

const HAND_PLACING_ASSET = require('@/assets/images/hand_placing.png');

interface HandPlacementVisualProps {
  photoUrl: string;
}

export function HandPlacementVisual({ photoUrl }: HandPlacementVisualProps) {
  const animProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animProgress, {
      toValue: 1,
      duration: 1100,
      useNativeDriver: true,
    }).start();
  }, [animProgress]);

  // Interpolate entry arc and withdrawal
  const translateX = animProgress.interpolate({
    inputRange: [0, 0.2, 0.6, 0.8, 1],
    outputRange: [60, 20, 0, 15, 75],
  });

  const translateY = animProgress.interpolate({
    inputRange: [0, 0.2, 0.6, 0.8, 1],
    outputRange: [70, 25, 0, 18, 90],
  });

  const rotate = animProgress.interpolate({
    inputRange: [0, 0.2, 0.6, 0.8, 1],
    outputRange: ['10deg', '2deg', '-2deg', '4deg', '14deg'],
  });

  const scale = animProgress.interpolate({
    inputRange: [0, 0.2, 0.6, 0.8, 1],
    outputRange: [1.12, 1.04, 0.98, 1.0, 1.04],
  });

  const opacity = animProgress.interpolate({
    inputRange: [0, 0.15, 0.82, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        {
          opacity,
          transform: [
            { translateX },
            { translateY },
            { rotate },
            { scale },
          ],
        },
      ]}
    >
      {/* Physical Photo Print Being Tucked */}
      <View style={styles.photoPrint}>
        <Image source={{ uri: photoUrl }} style={styles.photoImage} resizeMode="cover" />
      </View>

      {/* 3D Realistic Hand placing the photo print */}
      <View style={styles.handWrapper}>
        <Image
          source={HAND_PLACING_ASSET}
          style={styles.handImage}
          resizeMode="contain"
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    inset: 0,
    zIndex: 999,
  },
  photoPrint: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    padding: 4,
    borderRadius: 3,
    shadowColor: '#19120C',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.38,
    shadowRadius: 28,
    elevation: 16,
    borderWidth: 1,
    borderColor: '#E5DEC9',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
  },
  handWrapper: {
    position: 'absolute',
    bottom: -84,
    right: -24,
    width: 108,
    height: 192,
    transform: [{ rotate: '-14deg' }],
    shadowColor: '#1C140E',
    shadowOffset: { width: -6, height: 12 },
    shadowOpacity: 0.38,
    shadowRadius: 16,
    elevation: 20,
  },
  handImage: {
    width: '100%',
    height: '100%',
  },
});
