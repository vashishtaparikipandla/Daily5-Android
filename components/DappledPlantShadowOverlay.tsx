import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Image, Platform, Animated } from 'react-native';

const PLANT_SHADOW_ASSET = require('@/assets/images/plant-shadow.png');

export function DappledPlantShadowOverlay() {
  const swayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS !== 'web') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(swayAnim, {
            toValue: 1,
            duration: 4800,
            useNativeDriver: true,
          }),
          Animated.timing(swayAnim, {
            toValue: -1,
            duration: 5200,
            useNativeDriver: true,
          }),
          Animated.timing(swayAnim, {
            toValue: 0,
            duration: 4200,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [swayAnim]);

  const translateX = swayAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-6, 0, 8],
  });
  const translateY = swayAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-4, 0, 5],
  });
  const rotate = swayAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-1deg', '0deg', '1.2deg'],
  });

  return (
    <View style={styles.overlayContainer} pointerEvents="none">
      {Platform.OS === 'web' && (
        <style>{`
          @keyframes plantBranchSway {
            0% {
              transform: translate3d(0px, 0px, 0px) rotate(0deg) scale(1.02);
            }
            28% {
              transform: translate3d(7px, -4px, 0px) rotate(1.2deg) scale(1.03);
            }
            58% {
              transform: translate3d(-5px, 6px, 0px) rotate(-0.9deg) scale(1.018);
            }
            82% {
              transform: translate3d(4px, 2px, 0px) rotate(0.6deg) scale(1.025);
            }
            100% {
              transform: translate3d(0px, 0px, 0px) rotate(0deg) scale(1.02);
            }
          }
          .dappled-plant-layer {
            animation: plantBranchSway 9.5s ease-in-out infinite alternate;
            transform-origin: top right;
            will-change: transform;
            mix-blend-mode: multiply;
          }
        `}</style>
      )}

      {Platform.OS === 'web' ? (
        <div
          className="dappled-plant-layer"
          style={{
            position: 'absolute',
            top: -20,
            right: -20,
            left: -20,
            bottom: -20,
            pointerEvents: 'none',
            opacity: 0.62,
            backgroundImage: `url(${PLANT_SHADOW_ASSET})`,
            backgroundSize: 'cover',
            backgroundPosition: 'top right',
            backgroundRepeat: 'no-repeat',
            filter: 'blur(1px)',
          }}
        />
      ) : (
        <Animated.View
          style={[
            styles.nativeAnimContainer,
            {
              transform: [{ translateX }, { translateY }, { rotate }],
            },
          ]}
        >
          <Image
            source={PLANT_SHADOW_ASSET}
            style={styles.shadowImage}
            resizeMode="cover"
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99,
    overflow: 'hidden',
  },
  nativeAnimContainer: {
    position: 'absolute',
    top: -24,
    right: -24,
    left: -24,
    bottom: -24,
    opacity: 0.58,
  },
  shadowImage: {
    width: '100%',
    height: '100%',
  },
});
