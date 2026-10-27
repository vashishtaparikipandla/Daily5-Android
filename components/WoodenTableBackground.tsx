import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

interface Props {
  children: React.ReactNode;
}

export function WoodenTableBackground({ children }: Props) {
  return (
    <View style={styles.root}>
      {/* Wood table texture overlay */}
      <View style={styles.woodBase} pointerEvents="none">
        {/* Subtle wood plank seam lines */}
        <View style={styles.plankSeam1} />
        <View style={styles.plankSeam2} />
        <View style={styles.plankSeam3} />
        {/* Ambient top-down desk lamp vignette */}
        <View style={styles.deskLampSheen} />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#D9C5AD',
    ...Platform.select({
      web: {
        /* Photorealistic Oiled Oak Desk Texture:
           1. Organic wood knots & annular growth rings
           2. Natural vertical wood plank joints
           3. Horizontal fibrous wood grain striations
           4. Warm radial desk-lamp ambient lighting falloff */
        backgroundImage: `
          repeating-radial-gradient(ellipse at 25% -20%, transparent 0, transparent 48px, rgba(120, 75, 35, 0.038) 48px, rgba(120, 75, 35, 0.038) 51px),
          repeating-radial-gradient(ellipse at 85% 120%, transparent 0, transparent 65px, rgba(110, 70, 30, 0.032) 65px, rgba(110, 70, 30, 0.032) 68px),
          repeating-linear-gradient(90deg, rgba(65, 38, 18, 0.07) 0px, rgba(65, 38, 18, 0.07) 1.5px, transparent 1.5px, transparent 128px),
          repeating-linear-gradient(180deg, rgba(255, 255, 255, 0.14) 0px, rgba(255, 255, 255, 0.14) 1.5px, rgba(80, 45, 18, 0.035) 1.5px, rgba(80, 45, 18, 0.035) 3.5px),
          radial-gradient(ellipse 95% 75% at 50% 28%, #F2E4D2 0%, #E2CFB8 46%, #CEB496 78%, #BEA182 100%)
        `,
        backgroundAttachment: 'fixed',
      } as any,
      default: {},
    }),
  },
  woodBase: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    overflow: 'hidden',
  },
  plankSeam1: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '26%',
    width: 1,
    backgroundColor: 'rgba(65, 38, 18, 0.06)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.15)',
  },
  plankSeam2: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '54%',
    width: 1,
    backgroundColor: 'rgba(65, 38, 18, 0.06)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.15)',
  },
  plankSeam3: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '82%',
    width: 1,
    backgroundColor: 'rgba(65, 38, 18, 0.06)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.15)',
  },
  deskLampSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 380,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    ...Platform.select({
      web: {
        background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.35) 0%, transparent 70%)',
      } as any,
      default: {},
    }),
  },
});
