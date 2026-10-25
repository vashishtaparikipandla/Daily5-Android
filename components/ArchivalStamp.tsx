/**
 * ArchivalStamp.tsx
 * Visual philatelic postage stamp component for Dear Day.
 * Features serrated postage edges, engraved vector motifs, and terracotta cancel postmarks.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Share,
} from 'react-native';
import Svg, {
  Path,
  Circle,
  Rect,
  Line,
  G,
} from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { X, Lock, CheckCircle, ShareNetwork } from 'phosphor-react-native';
import { useColors } from '@/hooks/useColors';
import type { ArchivalStampDef, MilestoneStats } from '@/lib/milestones';

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

  const width = size === 'compact' ? 84 : size === 'large' ? 140 : 104;
  const height = width * 1.32; // Standard postage stamp proportion

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
        activeOpacity={0.85}
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

            {/* Central Engraved Motif */}
            <View style={styles.motifContainer}>
              <StampMotif motif={stamp.motif} color={isUnlocked ? stamp.accentColor : '#A8A196'} size={width * 0.44} />
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
                <Lock size={16} color="#8A8278" weight="fill" />
              </View>
            )}
          </View>
        </View>

        {/* Decorative Perforation Teeth (Top & Bottom subtle scalloping) */}
        <View style={styles.perforationsTop} />
        <View style={styles.perforationsBottom} />
      </TouchableOpacity>

      {/* Inspect Detail Modal */}
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
            >
              <X size={18} color={colors.foreground} />
            </TouchableOpacity>

            {/* Big Stamp Rendering */}
            <View style={styles.bigStampContainer}>
              <View
                style={[
                  styles.bigStampBody,
                  {
                    backgroundColor: isUnlocked ? '#FFFDF9' : '#EDE8E0',
                    borderColor: isUnlocked ? '#D9D1C5' : '#D0C8BC',
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
                    <StampMotif motif={stamp.motif} color={isUnlocked ? stamp.accentColor : '#A8A196'} size={72} />
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
              </View>
            </View>

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

// ─── Postmark Ring (Postal Cancellation Stamp) ───────────────────────────────

function PostmarkRing({ text, color = '#E8593A', size = 76 }: { text: string; color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Outer Circle */}
      <Circle cx="50" cy="50" r="44" stroke={color} strokeWidth="1.8" fill="none" opacity={0.85} strokeDasharray="3 1.5" />
      {/* Inner Circle */}
      <Circle cx="50" cy="50" r="36" stroke={color} strokeWidth="1" fill="none" opacity={0.65} />
      {/* Wavy Cancellation Lines */}
      <Line x1="12" y1="44" x2="88" y2="44" stroke={color} strokeWidth="1" opacity={0.6} />
      <Line x1="10" y1="50" x2="90" y2="50" stroke={color} strokeWidth="1.2" opacity={0.8} />
      <Line x1="12" y1="56" x2="88" y2="56" stroke={color} strokeWidth="1" opacity={0.6} />
      {/* Center Postmark Seal */}
      <Circle cx="50" cy="50" r="4" fill={color} opacity={0.9} />
    </Svg>
  );
}

// ─── Motif Engravings ────────────────────────────────────────────────────────

function StampMotif({ motif, color, size }: { motif: ArchivalStampDef['motif']; color: string; size: number }) {
  switch (motif) {
    case 'quill':
      return (
        <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
          <Path d="M42 6C34 6 22 14 16 26L14 36L22 32C32 26 40 14 42 6Z" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M14 36L8 42" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
          <Path d="M22 20C25 24 28 27 32 30" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity={0.5} />
        </Svg>
      );
    case 'stars':
      return (
        <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
          <Circle cx="24" cy="14" r="3.5" fill={color} />
          <Circle cx="12" cy="22" r="3" fill={color} opacity={0.85} />
          <Circle cx="36" cy="22" r="3" fill={color} opacity={0.85} />
          <Circle cx="8" cy="34" r="2.5" fill={color} opacity={0.7} />
          <Circle cx="40" cy="34" r="2.5" fill={color} opacity={0.7} />
          <Circle cx="18" cy="40" r="2.5" fill={color} opacity={0.6} />
          <Circle cx="30" cy="40" r="2.5" fill={color} opacity={0.6} />
        </Svg>
      );
    case 'waxseal':
      return (
        <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
          <Circle cx="24" cy="24" r="18" stroke={color} strokeWidth="2" strokeDasharray="2 2" />
          <Circle cx="24" cy="24" r="13" stroke={color} strokeWidth="1.5" />
          <Path d="M24 16V32M16 24H32" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </Svg>
      );
    case 'moon':
      return (
        <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
          <Path d="M30 10C20 12 14 20 16 30C18 40 28 44 38 40C26 46 12 36 12 24C12 14 22 6 30 10Z" fill={color} />
          <Circle cx="36" cy="16" r="1.5" fill={color} />
        </Svg>
      );
    case 'column':
      return (
        <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
          <Rect x="10" y="8" width="28" height="4" rx="1" fill={color} />
          <Rect x="12" y="36" width="24" height="4" rx="1" fill={color} />
          <Line x1="16" y1="12" x2="16" y2="36" stroke={color} strokeWidth="2" />
          <Line x1="24" y1="12" x2="24" y2="36" stroke={color} strokeWidth="2" />
          <Line x1="32" y1="12" x2="32" y2="36" stroke={color} strokeWidth="2" />
        </Svg>
      );
    case 'camera':
      return (
        <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
          <Rect x="8" y="14" width="32" height="24" rx="4" stroke={color} strokeWidth="2" />
          <Circle cx="24" cy="26" r="7" stroke={color} strokeWidth="2" />
          <Circle cx="24" cy="26" r="2.5" fill={color} />
          <Path d="M16 14L19 9H29L32 14" stroke={color} strokeWidth="2" strokeLinejoin="round" />
        </Svg>
      );
    case 'polymath':
      return (
        <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
          <Circle cx="24" cy="24" r="17" stroke={color} strokeWidth="1.8" />
          <Path d="M24 7L27 21L41 24L27 27L24 41L21 27L7 24L21 21Z" fill={color} opacity={0.8} />
        </Svg>
      );
    case 'hardbound':
    default:
      return (
        <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
          <Rect x="12" y="8" width="24" height="32" rx="2" stroke={color} strokeWidth="2" />
          <Line x1="17" y1="8" x2="17" y2="40" stroke={color} strokeWidth="1.5" />
          <Path d="M24 8V22L28 19L32 22V8" fill={color} opacity={0.85} />
        </Svg>
      );
  }
}

const styles = StyleSheet.create({
  stampWrapper: {
    position: 'relative',
    margin: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  stampLockedWrap: {
    opacity: 0.65,
  },
  stampBody: {
    flex: 1,
    borderRadius: 4,
    borderWidth: 1,
    padding: 3,
  },
  innerBorder: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 2,
    padding: 3,
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  footerRow: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 1,
  },
  stampTitle: {
    fontSize: 7.5,
    fontFamily: 'PlayfairDisplay_700Bold',
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
    backgroundColor: 'rgba(235, 230, 222, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
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

  /* Modal */
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
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 18,
    position: 'relative',
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
  bigStampContainer: {
    width: 150,
    height: 198,
    marginTop: 8,
  },
  bigStampBody: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 1.5,
    padding: 5,
  },
  bigInnerBorder: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 4,
    padding: 6,
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  bigPostageHeader: {
    fontSize: 7,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8,
  },
  bigSerialText: {
    fontSize: 7.5,
    fontFamily: 'Inter_700Bold',
  },
  bigMotifContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigStampTitle: {
    fontSize: 12,
    fontFamily: 'PlayfairDisplay_700Bold',
    textAlign: 'center',
  },
  bigPostmarkOverlay: {
    position: 'absolute',
    top: -18,
    right: -24,
    transform: [{ rotate: '-18deg' }],
  },
  modalMeta: {
    alignItems: 'center',
    gap: 6,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 99,
    backgroundColor: 'rgba(0,0,0,0.04)',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8,
  },
  modalTitle: {
    fontSize: 20,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
  },
  shareBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  lockedNote: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  lockedNoteText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
});
