/**
 * ArchivalStamp.tsx
 * Visual philatelic postage stamp component for Dear Day.
 * Features realistic 3D rendered stamps, philatelic serrated borders,
 * interactive 3D gyroscope/cursor tilting, and terracotta cancel postmarks.
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
import Svg, {
  Circle,
  Rect,
  Line,
  G,
} from 'react-native-svg';
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

  const width = size === 'compact' ? 88 : size === 'large' ? 140 : 106;
  const height = width * 1.32; // Philatelic aspect ratio

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
        activeOpacity={0.88}
        onPress={handlePress}
        style={[
          styles.stampWrapper,
          { width, height },
          !isUnlocked && styles.stampLockedWrap,
        ]}
      >
        {/* Philatelic Stamp Canvas */}
        <View
          style={[
            styles.stampBody,
            {
              backgroundColor: isUnlocked ? '#FFFDF9' : '#EDE8E0',
              borderColor: isUnlocked ? '#D9D1C5' : '#D0C8BC',
            },
          ]}
        >
          {/* Inner Guilloche Border */}
          <View
            style={[
              styles.innerBorder,
              { borderColor: isUnlocked ? stamp.accentColor + '55' : 'rgba(0,0,0,0.1)' },
            ]}
          >
            {/* Top Postage Header */}
            <View style={styles.headerRow}>
              <Text style={[styles.postageHeader, { color: isUnlocked ? stamp.accentColor : '#9C958C' }]}>
                DEAR DAY
              </Text>
              <Text style={[styles.serialText, { color: isUnlocked ? stamp.accentColor : '#9C958C' }]}>
                {stamp.serialNumber.replace('№ ', '')}
              </Text>
            </View>

            {/* Central 3D Rendered Stamp Motif */}
            <View style={styles.motifContainer}>
              <Image
                source={stampAsset}
                style={[
                  styles.thumbnail3DImage,
                  { width: width * 0.58, height: width * 0.58 },
                  !isUnlocked && styles.thumbnail3DImageLocked,
                ]}
                resizeMode="contain"
              />
            </View>

            {/* Bottom Title */}
            <View style={styles.footerRow}>
              <Text
                style={[
                  styles.stampTitle,
                  { color: isUnlocked ? '#1C1916' : '#7A746E' },
                ]}
                numberOfLines={1}
              >
                {stamp.title}
              </Text>
            </View>

            {/* Terracotta Postmark Cancellation Stamp */}
            {isUnlocked && (
              <View style={styles.postmarkOverlay} pointerEvents="none">
                <PostmarkRing text={stamp.postmarkText} color="#E8593A" />
              </View>
            )}

            {/* Locked Shroud */}
            {!isUnlocked && (
              <View style={styles.lockedShroud} pointerEvents="none">
                <View style={styles.lockBadgePill}>
                  <Lock size={13} color="#FFFFFF" weight="fill" />
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Decorative Perforation Teeth (Philatelic Scalloped Edges) */}
        <View style={styles.perforationsTop} />
        <View style={styles.perforationsBottom} />
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

            {/* Interactive 3D Tilting Stamp Showcase */}
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
                    <Text style={[styles.statusText, { color: '#E8593A' }]}>OFFICIALLY EARNED & CANCELLED</Text>
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

              {/* 3D Tilt Cue Badge */}
              <View style={styles.tiltCueRow}>
                <Sparkle size={12} color="#A3876B" weight="bold" />
                <Text style={styles.tiltCueText}>
                  {Platform.OS === 'web' ? 'Hover or move cursor to tilt in 3D' : 'Drag to tilt and inspect in 3D'}
                </Text>
              </View>
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
                  Keep logging memories to stamp this in your archival album.
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
// 2. 3D TILTING STAMP SHOWCASE (INTERACTIVE POINTER & GYRO PHYSICS)
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
        const rx = (py - 0.5) * -32; // -16 to +16 deg
        const ry = (px - 0.5) * 36;  // -18 to +18 deg
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
        const clampedX = Math.max(-24, Math.min(24, gesture.dx * 0.16));
        const clampedY = Math.max(-20, Math.min(20, -gesture.dy * 0.16));
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
          height: 270,
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
              transform: perspective(1000px) rotateX(6deg) rotateY(-8deg) rotateZ(-0.8deg) scale(1.02);
            }
            50% {
              transform: perspective(1000px) rotateX(-5deg) rotateY(9deg) rotateZ(1deg) scale(1.04);
            }
            100% {
              transform: perspective(1000px) rotateX(6deg) rotateY(-8deg) rotateZ(-0.8deg) scale(1.02);
            }
          }
          .stamp-card-tiltable {
            transition: transform 0.14s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.14s ease;
            transform-style: preserve-3d;
            will-change: transform;
          }
        `}</style>

        <div
          className="stamp-card-tiltable"
          style={{
            width: 172,
            height: 228,
            backgroundColor: isUnlocked ? '#FFFDF9' : '#EDE8E0',
            borderRadius: 8,
            border: `1.5px solid ${isUnlocked ? '#D9D1C5' : '#D0C8BC'}`,
            padding: 6,
            position: 'relative',
            transform: tilt.isInteracting
              ? `perspective(1000px) rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg) scale(1.05)`
              : undefined,
            animation: !tilt.isInteracting ? 'stamp3dAmbientWobble 5.6s ease-in-out infinite' : undefined,
            boxShadow: tilt.isInteracting
              ? `${(-tilt.ry * 0.9).toFixed(1)}px ${(16 + tilt.rx * 0.7).toFixed(1)}px 30px rgba(25, 18, 12, 0.32), inset 0 1px 2px rgba(255,255,255,0.8)`
              : '0 16px 32px rgba(25, 18, 12, 0.24), inset 0 1px 2px rgba(255,255,255,0.8)',
          }}
        >
          {/* Inner Guilloche Border */}
          <div
            style={{
              width: '100%',
              height: '100%',
              border: `1px solid ${isUnlocked ? stamp.accentColor + '66' : 'rgba(0,0,0,0.1)'}`,
              borderRadius: 4,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '6px 8px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Holographic Specular Light Sheen */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                background: `linear-gradient(${(125 + tilt.ry * 2.5).toFixed(0)}deg, rgba(255,255,255,0.48) 0%, rgba(255,255,255,0.08) 45%, transparent 70%)`,
                opacity: isUnlocked ? 0.9 : 0.4,
                mixBlendMode: 'overlay',
                zIndex: 4,
              }}
            />

            {/* Top Postage Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                style={{
                  fontSize: 7.5,
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 800,
                  letterSpacing: 0.8,
                  color: isUnlocked ? stamp.accentColor : '#9C958C',
                }}
              >
                DEAR DAY ARCHIVAL
              </span>
              <span
                style={{
                  fontSize: 7.5,
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 700,
                  color: isUnlocked ? stamp.accentColor : '#9C958C',
                }}
              >
                {stamp.serialNumber}
              </span>
            </div>

            {/* Central 3D Rendered Artwork */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                transform: 'translateZ(26px)',
              }}
            >
              <img
                src={assetUri}
                alt={stamp.title}
                style={{
                  width: 110,
                  height: 110,
                  objectFit: 'contain',
                  filter: isUnlocked
                    ? 'drop-shadow(0 12px 20px rgba(22, 14, 8, 0.32))'
                    : 'grayscale(100%) opacity(0.35)',
                  transition: 'transform 0.14s ease-out',
                }}
              />
            </div>

            {/* Bottom Title */}
            <div style={{ width: '100%', textAlign: 'center', paddingBottom: 2 }}>
              <span
                style={{
                  fontSize: 9.5,
                  fontFamily: "'Playfair Display', serif",
                  fontWeight: 700,
                  letterSpacing: 0.4,
                  color: isUnlocked ? '#1C1916' : '#7A746E',
                }}
              >
                {stamp.title}
              </span>
            </div>

            {/* Terracotta Postmark Cancellation Ring */}
            {isUnlocked && (
              <div
                style={{
                  position: 'absolute',
                  top: -10,
                  right: -14,
                  transform: 'rotate(-18deg)',
                  pointerEvents: 'none',
                  zIndex: 3,
                }}
              >
                <PostmarkRing text={stamp.postmarkText} color="#E8593A" size={118} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Native 3D Animation & PanResponder
  const rotateX = Animated.add(
    pan.y.interpolate({
      inputRange: [-20, 20],
      outputRange: ['-16deg', '16deg'],
    }),
    ambientWobble.interpolate({
      inputRange: [-1, 1],
      outputRange: ['-5deg', '5deg'],
    })
  );

  const rotateY = Animated.add(
    pan.x.interpolate({
      inputRange: [-24, 24],
      outputRange: ['-18deg', '18deg'],
    }),
    ambientWobble.interpolate({
      inputRange: [-1, 1],
      outputRange: ['-7deg', '7deg'],
    })
  );

  return (
    <View style={styles.nativeShowcaseWrap} {...panResponder.panHandlers}>
      <Animated.View
        style={[
          styles.bigStampBody,
          {
            backgroundColor: isUnlocked ? '#FFFDF9' : '#EDE8E0',
            borderColor: isUnlocked ? '#D9D1C5' : '#D0C8BC',
            transform: [
              { perspective: 950 },
              { rotateX },
              { rotateY },
              { scale: 1.04 },
            ],
          },
        ]}
      >
        <View
          style={[
            styles.bigInnerBorder,
            { borderColor: isUnlocked ? stamp.accentColor + '66' : 'rgba(0,0,0,0.1)' },
          ]}
        >
          <View style={styles.headerRow}>
            <Text style={[styles.bigPostageHeader, { color: isUnlocked ? stamp.accentColor : '#9C958C' }]}>
              DEAR DAY ARCHIVAL PRESS
            </Text>
            <Text style={[styles.bigSerialText, { color: isUnlocked ? stamp.accentColor : '#9C958C' }]}>
              {stamp.serialNumber}
            </Text>
          </View>

          <View style={styles.bigMotifContainer}>
            <Image
              source={stampAsset}
              style={[
                styles.big3DImage,
                !isUnlocked && styles.thumbnail3DImageLocked,
              ]}
              resizeMode="contain"
            />
          </View>

          <View style={styles.footerRow}>
            <Text
              style={[
                styles.bigStampTitle,
                { color: isUnlocked ? '#1C1916' : '#7A746E' },
              ]}
            >
              {stamp.title}
            </Text>
          </View>

          {isUnlocked && (
            <View style={styles.bigPostmarkOverlay} pointerEvents="none">
              <PostmarkRing text={stamp.postmarkText} color="#E8593A" size={120} />
            </View>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Postmark Ring (Postal Cancellation Stamp) ───────────────────────────────

function PostmarkRing({ text, color = '#E8593A', size = 76 }: { text: string; color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx="50" cy="50" r="44" stroke={color} strokeWidth="1.8" fill="none" opacity={0.85} strokeDasharray="3 1.5" />
      <Circle cx="50" cy="50" r="38" stroke={color} strokeWidth="1" fill="none" opacity={0.7} />
      <G opacity={0.85}>
        <Line x1="16" y1="46" x2="84" y2="46" stroke={color} strokeWidth="1.2" />
        <Line x1="16" y1="54" x2="84" y2="54" stroke={color} strokeWidth="1.2" />
      </G>
    </Svg>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  stampWrapper: {
    position: 'relative',
    marginHorizontal: 3,
  },
  stampLockedWrap: {
    opacity: 0.72,
  },
  stampBody: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 1.5,
    padding: 3.5,
    shadowColor: '#1A140E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 5,
    elevation: 3,
  },
  innerBorder: {
    flex: 1,
    borderRadius: 3,
    borderWidth: 1,
    padding: 3,
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 1,
  },
  postageHeader: {
    fontSize: 6.5,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  serialText: {
    fontSize: 6.5,
    fontFamily: 'Inter_600SemiBold',
  },
  motifContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnail3DImage: {
    shadowColor: '#160E08',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 4,
  },
  thumbnail3DImageLocked: {
    opacity: 0.32,
    tintColor: '#8C8276',
  },
  footerRow: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 1,
  },
  stampTitle: {
    fontSize: 7.5,
    fontFamily: 'PlayfairDisplay_700Bold',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  postmarkOverlay: {
    position: 'absolute',
    top: -12,
    right: -16,
    transform: [{ rotate: '-18deg' }],
  },
  lockedShroud: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(235, 230, 222, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadgePill: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(40, 32, 26, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  perforationsTop: {
    position: 'absolute',
    top: -2,
    left: 4,
    right: 4,
    height: 3,
  },
  perforationsBottom: {
    position: 'absolute',
    bottom: -2,
    left: 4,
    right: 4,
    height: 3,
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
    maxWidth: 360,
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
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigStampBody: {
    width: 172,
    height: 228,
    borderRadius: 8,
    borderWidth: 1.5,
    padding: 6,
    shadowColor: '#19120C',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 12,
  },
  bigInnerBorder: {
    flex: 1,
    borderRadius: 4,
    borderWidth: 1,
    padding: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  bigPostageHeader: {
    fontSize: 7.5,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8,
  },
  bigSerialText: {
    fontSize: 7.5,
    fontFamily: 'Inter_600SemiBold',
  },
  bigMotifContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  big3DImage: {
    width: 110,
    height: 110,
    shadowColor: '#160E08',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  bigStampTitle: {
    fontSize: 10,
    fontFamily: 'PlayfairDisplay_700Bold',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  bigPostmarkOverlay: {
    position: 'absolute',
    top: -12,
    right: -16,
    transform: [{ rotate: '-18deg' }],
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
  tiltCueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(163, 135, 107, 0.1)',
  },
  tiltCueText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: '#8A6D52',
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
