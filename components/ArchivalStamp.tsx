/**
 * ArchivalStamp.tsx
 * Pure 3D Philatelic Stamp Object for Dear Day.
 * Renders ONLY the 3D rendered milestone badge objects directly,
 * with dynamic 3D cursor/touch tilting and spatial depth.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Share,
  Image,
  Platform,
  Animated,
  PanResponder,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { X, Lock, CheckCircle, ShareNetwork, Sparkle } from 'phosphor-react-native';
import { useColors } from '@/hooks/useColors';
import type { ArchivalStampDef } from '@/lib/milestones';

// ============================================================================
// 1. 3D RENDERED ASSET MAPPING (8 CHRONOLOGICAL STAMPS)
// ============================================================================
export const STAMP_3D_ASSETS: Record<string, any> = {
  'first-ink': require('@/assets/images/stamps/stamp-1.png'),
  'the-octet': require('@/assets/images/stamps/stamp-2.png'),
  'the-fortnight': require('@/assets/images/stamps/stamp-3.png'),
  'moon-cycle': require('@/assets/images/stamps/stamp-4.png'),
  'centennial': require('@/assets/images/stamps/stamp-5.png'),
  'photographer-eye': require('@/assets/images/stamps/stamp-6.png'),
  'polymath': require('@/assets/images/stamps/stamp-7.png'),
  'first-volume': require('@/assets/images/stamps/stamp-8.png'),
};

interface ArchivalStampProps {
  stamp: ArchivalStampDef;
  isUnlocked: boolean;
  onPress?: () => void;
  size?: 'compact' | 'normal' | 'large';
}

export function ArchivalStamp({
  stamp,
  isUnlocked,
  size = 'normal',
}: ArchivalStampProps) {
  const colors = useColors();
  const [showDetail, setShowDetail] = useState(false);

  const stampAsset = STAMP_3D_ASSETS[stamp.id] || STAMP_3D_ASSETS['first-ink'];

  function handlePress() {
    Haptics.selectionAsync();
    setShowDetail(true);
  }

  async function handleShare() {
    Haptics.selectionAsync();
    try {
      await Share.share({
        message: `I just unlocked the "${stamp.title}" stamp (${stamp.serialNumber}) in Dear Day!\n\n"${stamp.description}"\n\nPreserving life one day at a time with Dear Day.`,
        title: `Dear Day — ${stamp.title}`,
      });
    } catch {
      // User cancelled
    }
  }

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={handlePress}
        style={[
          styles.stampWrapper,
          !isUnlocked && styles.stampLockedWrap,
        ]}
      >
        {/* Floating 3D Stamp Badge */}
        <View style={styles.stampBadgeContainer}>
          <Image
            source={stampAsset}
            style={[
              styles.thumbnail3DImage,
              !isUnlocked && styles.thumbnail3DImageLocked,
            ]}
            resizeMode="contain"
          />

          {/* Locked Badge Overlay - Positioned cleanly at corner */}
          {!isUnlocked && (
            <View style={styles.lockBadgeOverlay} pointerEvents="none">
              <View style={styles.lockBadgePill}>
                <Lock size={11} color="#FFFFFF" weight="fill" />
              </View>
            </View>
          )}
        </View>

        {/* Minimal Stamp Title */}
        <Text
          style={[
            styles.stampTitle,
            { color: isUnlocked ? colors.foreground : colors.mutedForeground },
          ]}
          numberOfLines={1}
        >
          {stamp.title}
        </Text>
      </TouchableOpacity>

      {/* Inspect Detail Modal with Interactive 3D Tilting */}
      <Modal
        visible={showDetail}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDetail(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            {/* Close Button */}
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowDetail(false)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={18} color={colors.foreground} />
            </TouchableOpacity>

            {/* Interactive Pure 3D Tilting Stamp Showcase */}
            <Tilting3DStampShowcase
              stamp={stamp}
              isUnlocked={isUnlocked}
              stampAsset={stampAsset}
            />

            {/* Stamp Meta & Details */}
            <View style={styles.modalMeta}>
              <View style={styles.statusPill}>
                {isUnlocked ? (
                  <>
                    <CheckCircle size={14} color="#E8593A" weight="fill" />
                    <Text style={[styles.statusText, { color: '#E8593A' }]}>OFFICIALLY COLLECTED</Text>
                  </>
                ) : (
                  <>
                    <Lock size={14} color="#8A8278" weight="fill" />
                    <Text style={[styles.statusText, { color: '#8A8278' }]}>AWAITING COMPLETION</Text>
                  </>
                )}
              </View>

              <Text style={[styles.modalTitle, { color: colors.foreground }]}>{stamp.title}</Text>
              <Text style={[styles.modalDesc, { color: colors.mutedForeground }]}>{stamp.description}</Text>
            </View>

            {/* Action Button */}
            {isUnlocked ? (
              <TouchableOpacity
                style={[styles.shareBtn, { backgroundColor: colors.primary }]}
                onPress={handleShare}
                activeOpacity={0.8}
              >
                <ShareNetwork size={18} color={colors.primaryForeground} weight="bold" />
                <Text style={[styles.shareBtnText, { color: colors.primaryForeground }]}>
                  Share Collector Stamp
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.lockedNote, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.lockedNoteText, { color: colors.mutedForeground }]}>
                  Keep logging memories to collect this 3D stamp in your passport.
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

// ============================================================================
// 2. 3D TILTING STAMP SHOWCASE (PURE 3D OBJECT WITH MOUSE & TOUCH PHYSICS)
// ============================================================================

interface Tilting3DProps {
  stamp: ArchivalStampDef;
  isUnlocked: boolean;
  stampAsset: any;
}

function Tilting3DStampShowcase({ stamp, isUnlocked, stampAsset }: Tilting3DProps) {
  const stageRef = useRef<HTMLDivElement>(null);

  // Web dynamic mouse tilt state
  const [tilt, setTilt] = useState<{ rx: number; ry: number; isInteracting: boolean }>({
    rx: 0,
    ry: 0,
    isInteracting: false,
  });

  // Native animated values
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const ambientWobble = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS === 'web') {
      const el = stageRef.current;
      if (!el) return;

      const handleMove = (e: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        const px = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const py = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        const rx = (py - 0.5) * -34; // -17 to +17 deg
        const ry = (px - 0.5) * 38;  // -19 to +19 deg
        setTilt({ rx, ry, isInteracting: true });
      };

      const handleLeave = () => {
        setTilt({ rx: 0, ry: 0, isInteracting: false });
      };

      el.addEventListener('mousemove', handleMove);
      el.addEventListener('mouseleave', handleLeave);
      return () => {
        el.removeEventListener('mousemove', handleMove);
        el.removeEventListener('mouseleave', handleLeave);
      };
    } else {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(ambientWobble, {
            toValue: 1,
            duration: 2600,
            useNativeDriver: true,
          }),
          Animated.timing(ambientWobble, {
            toValue: -1,
            duration: 2800,
            useNativeDriver: true,
          }),
          Animated.timing(ambientWobble, {
            toValue: 0,
            duration: 2200,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [ambientWobble]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        const clampedX = Math.max(-26, Math.min(26, gesture.dx * 0.18));
        const clampedY = Math.max(-22, Math.min(22, -gesture.dy * 0.18));
        pan.setValue({ x: clampedX, y: clampedY });
      },
      onPanResponderRelease: () => {
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const assetUri =
    typeof stampAsset === 'string'
      ? stampAsset
      : (Image as any).resolveAssetSource?.(stampAsset)?.uri || stampAsset?.uri || stampAsset;

  if (Platform.OS === 'web') {
    return (
      <div
        ref={stageRef}
        className="tilt-viewport-stage"
        style={{
          width: 220,
          height: 220,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          perspective: 1000,
          cursor: 'grab',
          userSelect: 'none',
        }}
      >
        <style>{`
          @keyframes stamp3dAmbientWobble {
            0% {
              transform: perspective(1000px) rotateX(6deg) rotateY(-8deg) rotateZ(-0.8deg) scale(1.04);
            }
            50% {
              transform: perspective(1000px) rotateX(-5deg) rotateY(9deg) rotateZ(1deg) scale(1.06);
            }
            100% {
              transform: perspective(1000px) rotateX(6deg) rotateY(-8deg) rotateZ(-0.8deg) scale(1.04);
            }
          }
          .stamp-card-tiltable {
            transition: transform 0.14s cubic-bezier(0.16, 1, 0.3, 1);
            transform-style: preserve-3d;
            will-change: transform;
          }
        `}</style>

        <div
          className="stamp-card-tiltable"
          style={{
            width: 170,
            height: 170,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: tilt.isInteracting
              ? `perspective(1000px) rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg) scale(1.08)`
              : undefined,
            animation: !tilt.isInteracting ? 'stamp3dAmbientWobble 5.6s ease-in-out infinite' : undefined,
          }}
        >
          {/* Pure 3D Rendered Stamp Badge */}
          <img
            src={assetUri}
            alt={stamp.title}
            style={{
              width: 155,
              height: 155,
              objectFit: 'contain',
              filter: isUnlocked
                ? `drop-shadow(${(-tilt.ry * 0.9).toFixed(1)}px ${(14 + tilt.rx * 0.7).toFixed(1)}px 24px rgba(22, 14, 8, 0.35))`
                : 'grayscale(100%) contrast(1.1) brightness(0.95) opacity(0.70)',
              transition: 'filter 0.14s ease-out',
            }}
          />
        </div>
      </div>
    );
  }

  // Native 3D Animation & PanResponder
  const sumY = Animated.add(
    pan.y,
    ambientWobble.interpolate({
      inputRange: [-1, 1],
      outputRange: [-6, 6],
    })
  );

  const sumX = Animated.add(
    pan.x,
    ambientWobble.interpolate({
      inputRange: [-1, 1],
      outputRange: [-8, 8],
    })
  );

  const rotateX = sumY.interpolate({
    inputRange: [-28, 28],
    outputRange: ['-22deg', '22deg'],
  });

  const rotateY = sumX.interpolate({
    inputRange: [-34, 34],
    outputRange: ['-26deg', '26deg'],
  });

  return (
    <View style={styles.nativeShowcaseWrap} {...panResponder.panHandlers}>
      <Animated.View
        style={[
          styles.bigStampBody,
          {
            transform: [
              { perspective: 950 },
              { rotateX },
              { rotateY },
              { scale: 1.06 },
            ],
          },
        ]}
      >
        <Image
          source={stampAsset}
          style={[
            styles.big3DImage,
            !isUnlocked && styles.thumbnail3DImageLocked,
          ]}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  stampWrapper: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  stampLockedWrap: {
    opacity: 0.92,
  },
  stampBadgeContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  thumbnail3DImage: {
    width: 74,
    height: 74,
    shadowColor: '#1A140E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  thumbnail3DImageLocked: {
    opacity: 0.68,
    ...(Platform.OS === 'web'
      ? ({
          filter: 'grayscale(100%) contrast(1.1) brightness(0.95)',
        } as any)
      : {}),
  },
  lockBadgeOverlay: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    zIndex: 10,
  },
  lockBadgePill: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(32, 24, 18, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  stampTitle: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.2,
    textAlign: 'center',
    maxWidth: 82,
  },

  /* Modal Showcase */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(28,25,22,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 350,
    borderRadius: 22,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 16,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.28,
    shadowRadius: 28,
    elevation: 16,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  nativeShowcaseWrap: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigStampBody: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  big3DImage: {
    width: 150,
    height: 150,
    shadowColor: '#160E08',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.34,
    shadowRadius: 20,
    elevation: 10,
  },
  modalMeta: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(232,89,58,0.08)',
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8,
  },
  modalTitle: {
    fontSize: 19,
    fontFamily: 'PlayfairDisplay_700Bold',
    textAlign: 'center',
  },
  modalDesc: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  shareBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    marginTop: 2,
  },
  shareBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  lockedNote: {
    width: '100%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  lockedNoteText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 17,
  },
});
