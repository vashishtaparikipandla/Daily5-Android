import React from 'react';
import { View, StyleSheet, Image, Platform } from 'react-native';

const DESK_FLATLAY_ASSET = require('@/assets/images/desk-flatlay.png');

interface Props {
  children: React.ReactNode;
}

export function WoodenTableBackground({ children }: Props) {
  return (
    <View style={styles.root}>
      {/* Busy-Life Desk Flatlay Background (Laptop, spectacles, coffee, pens, desk) */}
      <View style={styles.flatlayLayer} pointerEvents="none">
        <Image
          source={DESK_FLATLAY_ASSET}
          style={styles.flatlayImage}
          resizeMode="cover"
        />
        {/* Soft radial vignette to illuminate center photobook & blend edges */}
        <View style={styles.lightingVignette} />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#ECE3D4',
  },
  flatlayLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    overflow: 'hidden',
  },
  flatlayImage: {
    width: '100%',
    height: '100%',
  },
  lightingVignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(238, 230, 218, 0.12)',
    ...Platform.select({
      web: {
        backgroundImage: 'radial-gradient(ellipse 85% 70% at 50% 48%, rgba(255,255,255,0.06) 0%, rgba(25,18,12,0.18) 75%, rgba(18,12,8,0.34) 100%)',
      } as any,
      default: {},
    }),
  },
});
