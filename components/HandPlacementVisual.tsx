import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Image, Platform } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Path,
  Ellipse,
} from 'react-native-svg';

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
    outputRange: ['12deg', '4deg', '0deg', '4deg', '14deg'],
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

      {/* Stylized Illustrated Hand with Oatmeal Sweater Cuff */}
      <View style={styles.handWrapper}>
        <Svg width={140} height={140} viewBox="0 0 180 180">
          <Defs>
            <LinearGradient id="naturalSkinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#F7D5BE" />
              <Stop offset="55%" stopColor="#E9B89A" />
              <Stop offset="100%" stopColor="#D69C7A" />
            </LinearGradient>
            <LinearGradient id="sleeveClothGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#EFE9DF" />
              <Stop offset="100%" stopColor="#D5CBB8" />
            </LinearGradient>
          </Defs>

          {/* Under-fingers supporting photo */}
          <Path
            d="M42 46 C55 32, 82 38, 98 56 L124 88 L88 112 L52 76 C38 64, 34 54, 42 46 Z"
            fill="#D69C7A"
          />

          {/* Main Hand & Thumb pinching corner */}
          <Path
            d="M24 28 C14 18, 28 4, 44 14 C60 24, 84 48, 102 66 L138 106 L104 138 L66 96 C48 76, 36 58, 22 42 C16 35, 19 31, 24 28 Z"
            fill="url(#naturalSkinGrad)"
            stroke="#C58B6B"
            strokeWidth={1.5}
          />

          {/* Thumb Fingernail Highlight */}
          <Ellipse
            cx={31}
            cy={21}
            rx={7.5}
            ry={5}
            transform="rotate(-32 31 21)"
            fill="#FCEAE0"
            stroke="#D8A489"
            strokeWidth={1}
          />

          {/* Knuckle Creases */}
          <Path
            d="M52 44 Q58 39 63 43"
            fill="none"
            stroke="#C28666"
            strokeWidth={1.4}
            strokeLinecap="round"
          />
          <Path
            d="M72 65 Q79 59 85 64"
            fill="none"
            stroke="#C28666"
            strokeWidth={1.3}
            strokeLinecap="round"
          />

          {/* Cozy Oatmeal Sweater Cuff */}
          <Path
            d="M94 122 L134 86 L176 132 L136 168 Z"
            fill="url(#sleeveClothGrad)"
            stroke="#C2B6A1"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          <Path
            d="M102 114 L126 92"
            stroke="#DF5739"
            strokeWidth={2.5}
            strokeDasharray="4 4"
            strokeLinecap="round"
          />
        </Svg>
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
    bottom: -60,
    right: -48,
    width: 140,
    height: 140,
    shadowColor: '#1C140E',
    shadowOffset: { width: -6, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 20,
  },
});
