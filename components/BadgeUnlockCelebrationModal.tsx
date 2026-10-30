/**
 * BadgeUnlockCelebrationModal.tsx
 * High-impact celebratory milestone unlock modal for Dear Day homepage.
 * Inspired by gaming badge unlock experiences (radiating sunburst rays,
 * floating celebratory confetti, prominent 3D badge showcase, and warm editorial CTAs).
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { X, Sparkle, ArrowRight } from 'phosphor-react-native';
import { useColors } from '@/hooks/useColors';
import type { ArchivalStampDef } from '@/lib/milestones';
import { STAMP_3D_ASSETS } from '@/components/ArchivalStamp';

interface BadgeUnlockCelebrationModalProps {
  visible: boolean;
  badge: ArchivalStampDef | null;
  onClose: () => void;
  onViewProfile?: () => void;
}

const CONFETTI_COLORS = ['#E8593A', '#F5A623', '#FAF7EE', '#7A9A7E', '#4A3B68', '#DFD0B8'];

export function BadgeUnlockCelebrationModal({
  visible,
  badge,
  onClose,
  onViewProfile,
}: BadgeUnlockCelebrationModalProps) {
  const colors = useColors();

  // Animations
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const badgeFloatAnim = useRef(new Animated.Value(0)).current;
  const sunburstRotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && badge) {
      // Trigger festive success haptics
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Fallback
      }

      scaleAnim.setValue(0.7);
      opacityAnim.setValue(0);
      badgeFloatAnim.setValue(0);
      sunburstRotAnim.setValue(0);

      // Entrance animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
      ]).start();

      // Ambient floating & sunburst rotation
      const floatLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(badgeFloatAnim, {
            toValue: -10,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(badgeFloatAnim, {
            toValue: 0,
            duration: 1800,
            useNativeDriver: true,
          }),
        ])
      );
      floatLoop.start();

      const sunburstLoop = Animated.loop(
        Animated.timing(sunburstRotAnim, {
          toValue: 1,
          duration: 22000,
          useNativeDriver: true,
        })
      );
      sunburstLoop.start();

      return () => {
        floatLoop.stop();
        sunburstLoop.stop();
      };
    }
  }, [visible, badge, scaleAnim, opacityAnim, badgeFloatAnim, sunburstRotAnim]);

  if (!visible || !badge) return null;

  const stampAsset = STAMP_3D_ASSETS[badge.id] || STAMP_3D_ASSETS['first-ink'];
  const assetUri =
    typeof stampAsset === 'string'
      ? stampAsset
      : (Image as any).resolveAssetSource?.(stampAsset)?.uri || stampAsset?.uri || stampAsset;

  const sunburstRotation = sunburstRotAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        {/* Web Keyframe Animations */}
        {Platform.OS === 'web' && (
          <style>{`
            @keyframes celebrationRaysSpin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes celebrationConfettiDrift {
              0% { transform: translateY(-40px) rotate(0deg); opacity: 0; }
              20% { opacity: 1; }
              80% { opacity: 0.9; }
              100% { transform: translateY(420px) rotate(480deg); opacity: 0; }
            }
            @keyframes celebrationBadgePop {
              0% { transform: scale(0.65) translateY(20px); filter: drop-shadow(0 4px 10px rgba(0,0,0,0.2)); }
              60% { transform: scale(1.06) translateY(-4px); filter: drop-shadow(0 20px 35px rgba(232,89,58,0.4)); }
              100% { transform: scale(1) translateY(0); filter: drop-shadow(0 16px 28px rgba(22,14,8,0.45)); }
            }
          `}</style>
        )}

        {/* Ambient Radial Sunburst Rays Layer */}
        <Animated.View
          style={[
            styles.sunburstContainer,
            Platform.OS !== 'web' && { transform: [{ rotate: sunburstRotation }] },
          ]}
          pointerEvents="none"
        >
          {Platform.OS === 'web' ? (
            <div
              style={{
                width: 480,
                height: 480,
                borderRadius: '50%',
                background: `repeating-conic-gradient(
                  from 0deg,
                  rgba(245, 166, 35, 0.22) 0deg 15deg,
                  transparent 15deg 30deg
                )`,
                animation: 'celebrationRaysSpin 24s linear infinite',
              }}
            />
          ) : (
            <View style={styles.nativeSunburstCircle} />
          )}
        </Animated.View>

        {/* Ambient Confetti Particles Layer */}
        {Platform.OS === 'web' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              overflow: 'hidden',
              zIndex: 2,
            }}
          >
            {Array.from({ length: 24 }).map((_, i) => {
              const leftPercent = 5 + (i * 92) % 90;
              const delay = (i * 0.18).toFixed(2);
              const duration = 2.4 + (i % 5) * 0.4;
              const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
              const size = i % 3 === 0 ? 10 : i % 2 === 0 ? 8 : 6;
              const isCircle = i % 2 === 0;

              return (
                <div
                  key={`confetti-${i}`}
                  style={{
                    position: 'absolute',
                    left: `${leftPercent}%`,
                    top: '-20px',
                    width: size,
                    height: isCircle ? size : size * 1.6,
                    borderRadius: isCircle ? '50%' : '2px',
                    backgroundColor: color,
                    animation: `celebrationConfettiDrift ${duration}s ease-in infinite`,
                    animationDelay: `${delay}s`,
                    opacity: 0,
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Main Celebration Stage Card */}
        <Animated.View
          style={[
            styles.cardStage,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Close button at top corner */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => {
              Haptics.selectionAsync();
              onClose();
            }}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X size={18} color="#FAF7EE" />
          </TouchableOpacity>

          {/* Top Celebration Pill */}
          <View style={styles.pillBadge}>
            <Sparkle size={14} color="#F5A623" weight="fill" />
            <Text style={styles.pillBadgeText}>NEW BADGE UNLOCKED</Text>
            <Sparkle size={14} color="#F5A623" weight="fill" />
          </View>

          {/* 3D Rendered Stamp Badge Centerpiece */}
          <Animated.View
            style={[
              styles.badgeWrap,
              { transform: [{ translateY: badgeFloatAnim }] },
            ]}
          >
            {Platform.OS === 'web' ? (
              <img
                src={assetUri}
                alt={badge.title}
                style={{
                  width: 185,
                  height: 185,
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 16px 30px rgba(0, 0, 0, 0.45))',
                  animation: 'celebrationBadgePop 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards',
                }}
              />
            ) : (
              <Image
                source={stampAsset}
                style={styles.nativeBadgeImage}
                resizeMode="contain"
              />
            )}
          </Animated.View>

          {/* Badge Meta & Title */}
          <View style={styles.contentWrap}>
            <Text style={styles.badgeTitle}>{badge.title}</Text>
            <View style={styles.serialPill}>
              <Text style={styles.serialText}>{badge.serialNumber} • {badge.postmarkText}</Text>
            </View>
            <Text style={styles.badgeDescription}>{badge.description}</Text>
          </View>

          {/* Actions */}
          <View style={styles.actionsWrap}>
            {onViewProfile ? (
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onClose();
                  onViewProfile();
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>View in Profile</Text>
                <ArrowRight size={18} color="#FFFFFF" weight="bold" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                onPress={() => {
                  Haptics.selectionAsync();
                  onClose();
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>Claim Badge</Text>
              </TouchableOpacity>
            )}

            {/* Tap to continue dismissal */}
            <TouchableOpacity
              style={styles.dismissLink}
              onPress={() => {
                Haptics.selectionAsync();
                onClose();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.dismissLinkText}>Tap anywhere to continue</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(18, 13, 9, 0.86)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    position: 'relative',
  },
  sunburstContainer: {
    position: 'absolute',
    width: 480,
    height: 480,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    opacity: 0.85,
    zIndex: 1,
  },
  nativeSunburstCircle: {
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: 'rgba(245, 166, 35, 0.12)',
  },
  cardStage: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#241C16',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 166, 35, 0.35)',
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
    gap: 16,
    position: 'relative',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.45,
    shadowRadius: 36,
    elevation: 20,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(245, 166, 35, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(245, 166, 35, 0.35)',
  },
  pillBadgeText: {
    fontSize: 10.5,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.2,
    color: '#F5A623',
  },
  badgeWrap: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 4,
  },
  nativeBadgeImage: {
    width: 185,
    height: 185,
  },
  contentWrap: {
    alignItems: 'center',
    gap: 8,
    width: '100%',
    paddingHorizontal: 6,
  },
  badgeTitle: {
    fontSize: 23,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#FAF7EE',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  serialPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  serialText: {
    fontSize: 9.5,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.8,
    color: '#D8C6B0',
    textTransform: 'uppercase',
  },
  badgeDescription: {
    fontSize: 13.5,
    fontFamily: 'Inter_400Regular',
    color: '#DDD0C0',
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 2,
  },
  actionsWrap: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  primaryBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#E8593A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38,
    shadowRadius: 14,
    elevation: 8,
  },
  primaryBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  dismissLink: {
    paddingVertical: 4,
  },
  dismissLinkText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(250, 247, 238, 0.65)',
  },
});
