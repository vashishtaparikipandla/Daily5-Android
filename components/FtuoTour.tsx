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
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { KEYS } from '@/lib/storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FtuoTourProps {
  forceShow?: boolean;
  onClose?: () => void;
}

const STEPS = [
  {
    step: 1,
    tag: 'STEP 1 OF 4',
    icon: 'pencil-outline' as const,
    badgeColor: '#E8593A',
    badgeBg: 'rgba(232, 89, 58, 0.14)',
    title: 'Log your 4 memories',
    body: 'Every evening, capture 4 meaningful moments from your day right on your home screen. Not a highlight reel—just honest, real fragments of your life.',
    actionLabel: 'Got it',
    tip: '💡 Tap "Log tonight\'s 4" anytime to write.',
  },
  {
    step: 2,
    tag: 'STEP 2 OF 4',
    icon: 'book-outline' as const,
    badgeColor: '#C47B3A',
    badgeBg: 'rgba(196, 123, 58, 0.14)',
    title: 'Explore monthly books',
    body: 'At the end of each month, your daily moments are bound into a personal digital book in your Books tab. Flip through your life month by month.',
    actionLabel: 'Next',
    tip: '📖 Access anytime via the Books tab below.',
  },
  {
    step: 3,
    tag: 'STEP 3 OF 4',
    icon: 'cube-outline' as const,
    badgeColor: '#2A7B62',
    badgeBg: 'rgba(42, 123, 98, 0.14)',
    title: 'Order physical prints',
    body: 'Turn your digital memories into real, tangible paperbacks. You can order a beautifully printed pocket book delivered right to your door.',
    actionLabel: 'Next',
    tip: '📦 Custom linen-bound format with archival paper.',
  },
  {
    step: 4,
    tag: 'STEP 4 OF 4',
    icon: 'share-social-outline' as const,
    badgeColor: '#3A7EC4',
    badgeBg: 'rgba(58, 126, 196, 0.14)',
    title: 'Share book as PDF',
    body: 'Export crisp, print-ready PDF editions of any monthly volume. Share your memories with family or keep an offline archive in your Google Drive.',
    actionLabel: "Let's begin",
    tip: '📄 Export directly from the book viewer.',
  },
];

export function FtuoTour({ forceShow = false, onClose }: FtuoTourProps) {
  const colors = useColors();
  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

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
        // If error, ignore
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
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      handleDismiss();
    }
  }

  function handlePrev() {
    Haptics.selectionAsync();
    if (currentStep > 0) {
      setCurrentStep(s => s - 1);
    }
  }

  if (!visible) return null;

  const step = STEPS[currentStep];

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        {/* Backdrop touch to dismiss */}
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={handleDismiss}
        />

        {/* Focused Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.borderStrong,
            },
          ]}
        >
          {/* Top header row */}
          <View style={styles.topRow}>
            <View
              style={[
                styles.badge,
                { backgroundColor: step.badgeBg },
              ]}
            >
              <Text style={[styles.badgeText, { color: step.badgeColor }]}>
                {step.tag}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleDismiss}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={[styles.skipText, { color: colors.tertiary }]}>
                Skip tour
              </Text>
            </TouchableOpacity>
          </View>

          {/* Visual Icon */}
          <View style={styles.iconContainer}>
            <View
              style={[
                styles.iconBubble,
                { backgroundColor: step.badgeBg, borderColor: step.badgeColor + '33' },
              ]}
            >
              <Ionicons name={step.icon} size={36} color={step.badgeColor} />
            </View>
          </View>

          {/* Text Content */}
          <Text
            style={[
              styles.title,
              { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' },
            ]}
          >
            {step.title}
          </Text>

          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            {step.body}
          </Text>

          {/* Tip callout */}
          <View
            style={[
              styles.tipBox,
              { backgroundColor: colors.muted, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.tipText, { color: colors.foreground }]}>
              {step.tip}
            </Text>
          </View>

          {/* Progress Dots */}
          <View style={styles.pipsRow}>
            {STEPS.map((s, idx) => (
              <View
                key={s.step}
                style={[
                  styles.pip,
                  {
                    backgroundColor:
                      idx === currentStep ? colors.primary : colors.border,
                    width: idx === currentStep ? 20 : 6,
                  },
                ]}
              />
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            {currentStep > 0 && (
              <TouchableOpacity
                style={[styles.backBtn, { borderColor: colors.border }]}
                onPress={handlePrev}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={18} color={colors.foreground} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: colors.primary, flex: 1 },
              ]}
              onPress={handleNext}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.actionBtnText,
                  { color: colors.primaryForeground },
                ]}
              >
                {step.actionLabel}
              </Text>
              <Ionicons
                name={currentStep === STEPS.length - 1 ? 'checkmark' : 'arrow-forward'}
                size={18}
                color={colors.primaryForeground}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: Math.min(SCREEN_WIDTH - 40, 380),
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.8,
  },
  skipText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBubble: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  body: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 16,
  },
  tipBox: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 20,
  },
  tipText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
  pipsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  pip: {
    height: 6,
    borderRadius: 3,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtn: {
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});
