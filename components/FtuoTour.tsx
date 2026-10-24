import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PencilSimple,
  BookOpen,
  Sparkle,
  X,
  ArrowRight,
  ArrowLeft,
  Check,
} from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KEYS } from '@/lib/storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FtuoTourProps {
  forceShow?: boolean;
  onClose?: () => void;
}

interface CoachmarkStep {
  step: number;
  total: number;
  icon: any;
  iconBg: string;
  iconColor: string;
  title: string;
  body: string;
  targetDescription: string;
  // Layout positioning
  targetPosition: 'top_ribbon' | 'center_card' | 'bottom_tab';
  pointerDirection: 'up' | 'down';
  ctaLabel: string;
}

const TOUR_STEPS: CoachmarkStep[] = [
  {
    step: 1,
    total: 3,
    icon: PencilSimple,
    iconBg: 'rgba(232, 89, 58, 0.18)',
    iconColor: '#E8593A',
    title: "Capture Tonight's 4 Moments",
    body: 'Every evening, capture 4 meaningful fragments of your day. Photos first, or quiet thoughts—not a highlight reel, but real honest memories.',
    targetDescription: "Tonight's Archival Entry",
    targetPosition: 'center_card',
    pointerDirection: 'down',
    ctaLabel: 'Next Step →',
  },
  {
    step: 2,
    total: 3,
    icon: Sparkle,
    iconBg: 'rgba(196, 123, 58, 0.18)',
    iconColor: '#C47B3A',
    title: 'Build Your 7-Day Habit',
    body: 'Each day you record fills a circle on your archival ribbon. Watch your streak grow and see your daily entries build momentum.',
    targetDescription: 'Weekly Archival Streak',
    targetPosition: 'top_ribbon',
    pointerDirection: 'up',
    ctaLabel: 'Next Step →',
  },
  {
    step: 3,
    total: 3,
    icon: BookOpen,
    iconBg: 'rgba(42, 123, 98, 0.18)',
    iconColor: '#2A7B62',
    title: 'Your Monthly Photobook',
    body: 'At the end of every month, your daily pages bind into an interactive hardcover book. Turn pages, switch layouts, and order real physical prints.',
    targetDescription: 'Monthly Books Library',
    targetPosition: 'bottom_tab',
    pointerDirection: 'down',
    ctaLabel: 'Start Archiving ✨',
  },
];

export function FtuoTour({ forceShow = false, onClose }: FtuoTourProps) {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    async function checkTourStatus() {
      if (forceShow) {
        setVisible(true);
        return;
      }
      try {
        const completed = await AsyncStorage.getItem(KEYS.FTUO_COMPLETED);
        if (!completed) {
          setVisible(true);
        }
      } catch {
        // Ignore error
      }
    }
    checkTourStatus();
  }, [forceShow]);

  async function handleDismiss() {
    try {
      await AsyncStorage.setItem(KEYS.FTUO_COMPLETED, 'true');
    } catch {}
    setVisible(false);
    onClose?.();
  }

  function handleNext() {
    Haptics.selectionAsync();
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex((idx) => idx + 1);
    } else {
      handleDismiss();
    }
  }

  function handlePrev() {
    Haptics.selectionAsync();
    if (currentStepIndex > 0) {
      setCurrentStepIndex((idx) => idx - 1);
    }
  }

  if (!visible) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const IconComp = currentStep.icon;

  // Compute spotlight highlight geometry and card placement based on targetPosition
  let spotlightStyle: any = {};
  let cardPositionStyle: any = {};

  if (currentStep.targetPosition === 'top_ribbon') {
    // 7-day streak card near top of screen
    spotlightStyle = {
      top: insets.top + 70,
      left: 18,
      width: SCREEN_WIDTH - 36,
      height: 96,
      borderRadius: 16,
    };
    // Card placed below the spotlight
    cardPositionStyle = {
      top: insets.top + 180,
    };
  } else if (currentStep.targetPosition === 'center_card') {
    // Tonight's 4 Moments card in middle of screen
    const targetY = SCREEN_HEIGHT * 0.42;
    spotlightStyle = {
      top: targetY,
      left: 18,
      width: SCREEN_WIDTH - 36,
      height: 140,
      borderRadius: 16,
    };
    // Card placed above the spotlight with pointer pointing down
    cardPositionStyle = {
      top: Math.max(insets.top + 50, targetY - 240),
    };
  } else {
    // Bottom Tab Bar: Books tab (middle right of tab bar)
    spotlightStyle = {
      bottom: Math.max(insets.bottom, 12),
      left: SCREEN_WIDTH * 0.28,
      width: SCREEN_WIDTH * 0.24,
      height: 54,
      borderRadius: 27,
    };
    // Card placed above bottom bar
    cardPositionStyle = {
      bottom: Math.max(insets.bottom, 16) + 74,
    };
  }

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={handleDismiss}
      statusBarTranslucent
    >
      <View style={styles.overlayContainer}>
        {/* Dimmed backdrop */}
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={handleDismiss}
        />

        {/* Spotlight cutout / beacon border */}
        <View style={[styles.spotlightCutout, spotlightStyle]} pointerEvents="none">
          <View style={styles.spotlightRingPulse} />
          <View style={styles.spotlightTargetLabel}>
            <Text style={styles.spotlightTargetLabelText}>
              {currentStep.targetDescription}
            </Text>
          </View>
        </View>

        {/* Floating Coachmark Card */}
        <View style={[styles.cardContainer, cardPositionStyle]}>
          {/* Top Arrow Pointer (if pointing up) */}
          {currentStep.pointerDirection === 'up' && (
            <View style={styles.pointerUpWrapper}>
              <View style={styles.pointerUpTriangle} />
            </View>
          )}

          {/* Coachmark Box */}
          <View style={styles.coachmarkCard}>
            {/* Top Bar with Icon, Title, and Close */}
            <View style={styles.cardHeaderRow}>
              <View style={styles.iconTitleRow}>
                <View style={[styles.stepIconCircle, { backgroundColor: currentStep.iconBg }]}>
                  <IconComp size={20} color={currentStep.iconColor} weight="duotone" />
                </View>
                <Text style={styles.cardTitle}>{currentStep.title}</Text>
              </View>
              <TouchableOpacity
                onPress={handleDismiss}
                style={styles.closeBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <X size={16} color="#A8A29E" weight="bold" />
              </TouchableOpacity>
            </View>

            {/* Explanatory Body */}
            <Text style={styles.cardBody}>{currentStep.body}</Text>

            {/* Bottom Actions Row */}
            <View style={styles.cardFooterRow}>
              {/* Skip or Back */}
              <View style={styles.footerLeftActions}>
                {currentStepIndex > 0 ? (
                  <TouchableOpacity
                    onPress={handlePrev}
                    style={styles.backButton}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <ArrowLeft size={14} color="#D6D3D1" weight="bold" />
                    <Text style={styles.backButtonText}>Back</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={handleDismiss}
                    style={styles.skipButton}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.skipButtonText}>Skip Tour</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Step indicator counter: e.g. 1 of 3 */}
              <View style={styles.stepPill}>
                <Text style={styles.stepPillText}>
                  {currentStep.step} of {currentStep.total}
                </Text>
              </View>

              {/* Primary Next/Done Button */}
              <TouchableOpacity
                onPress={handleNext}
                style={styles.primaryActionButton}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryActionText}>{currentStep.ctaLabel}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Arrow Pointer (if pointing down) */}
          {currentStep.pointerDirection === 'down' && (
            <View style={styles.pointerDownWrapper}>
              <View style={styles.pointerDownTriangle} />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    backgroundColor: 'rgba(15, 12, 10, 0.76)',
  },
  spotlightCutout: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#E8593A',
    backgroundColor: 'rgba(232, 89, 58, 0.08)',
    shadowColor: '#E8593A',
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  spotlightRingPulse: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  spotlightTargetLabel: {
    position: 'absolute',
    bottom: -10,
    alignSelf: 'center',
    backgroundColor: '#E8593A',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  spotlightTargetLabelText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  /* Floating Card */
  cardContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  coachmarkCard: {
    width: '100%',
    backgroundColor: '#1C1917',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#292524',
    padding: 18,
    gap: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  stepIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    flex: 1,
    color: '#FAFAF9',
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#292524',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    color: '#D6D3D1',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#292524',
  },
  footerLeftActions: {
    minWidth: 70,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backButtonText: {
    color: '#D6D3D1',
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  skipButton: {
    paddingVertical: 4,
  },
  skipButtonText: {
    color: '#78716C',
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  stepPill: {
    backgroundColor: '#292524',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stepPillText: {
    color: '#A8A29E',
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
  },
  primaryActionButton: {
    backgroundColor: '#E8593A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },

  /* Caret / Pointer Triangles */
  pointerUpWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: -1,
    zIndex: 2,
  },
  pointerUpTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#1C1917',
  },
  pointerDownWrapper: {
    width: '100%',
    alignItems: 'center',
    marginTop: -1,
    zIndex: 2,
  },
  pointerDownTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#1C1917',
  },
});
