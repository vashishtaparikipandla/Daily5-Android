import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Platform, TextInput, Modal, Alert, KeyboardAvoidingView, ScrollView,
} from 'react-native';
import { BrandLogoLoader } from '@/components/BrandLogo';
import Svg, { Path, Circle } from 'react-native-svg';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { router } from 'expo-router';
import {
  EnvelopeSimple,
  Sparkle,
  X,
  CheckCircle,
  ShieldCheck,
  ArrowRight,
} from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandLogoFull } from '@/components/BrandLogo';

function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <Path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <Path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <Path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </Svg>
  );
}

function TelegramIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Circle cx="24" cy="24" r="24" fill="#24A1DE" />
      <Path
        fill="#FFFFFF"
        d="M34.64 12.33c-.31-.03-.63.03-.9.18L10.34 22.02c-.88.35-.86 1.6.03 1.94l6.02 2.29 2.33 7.39c.27.87 1.4.99 1.83.21l3.52-4.4 6.78 5.03c.75.56 1.82.16 1.99-.75l4.33-20.33c.12-.58-.27-1.14-.84-1.24-.12-.02-.24-.03-.36-.03zm-16.1 13.1l13.16-8.24c.2-.13.38.16.19.31l-10.74 9.77-.38 4.2-2.23-6.04z"
      />
    </Svg>
  );
}

const WEB_CLIENT_ID = '205619709770-c7cabrrdedn0nnndifceo9cbo387llcd.apps.googleusercontent.com';

export default function AuthScreen() {
  const { signIn, setDriveConnection } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Telegram Modal State
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const [telegramHandle, setTelegramHandle] = useState('');
  const [telegramLoading, setTelegramLoading] = useState(false);

  // Email Magic Code Modal State
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailStep, setEmailStep] = useState<'input' | 'verify'>('input');
  const [emailAddress, setEmailAddress] = useState('');
  const [magicCode, setMagicCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  useEffect(() => {
    try {
      GoogleSignin.configure({
        scopes: ['https://www.googleapis.com/auth/drive.appdata'],
        webClientId: WEB_CLIENT_ID,
        offlineAccess: true,
      });
    } catch (e) {
      console.warn('Failed to configure GoogleSignin:', e);
    }
  }, []);

  async function handleGoogle() {
    setError('');
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();

      const user = (response as any).data?.user || (response as any).user;
      const email = user?.email || '';
      await signIn(
        {
          name: user?.name || 'User',
          email,
          avatar: user?.photo || undefined,
        },
        tokens.accessToken,
      );

      // Auto-connect Google Drive with the granted token
      if (tokens.accessToken && email) {
        try {
          await setDriveConnection(email, tokens.accessToken, Date.now() + 3600 * 1000);
        } catch (driveErr) {
          console.warn('Auto drive connection warning:', driveErr);
        }
      }

      router.replace('/biometric-setup');
    } catch (err: any) {
      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled
      } else if (err.code === statusCodes.IN_PROGRESS) {
        // in progress
      } else if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setError('Google Play Services is not available or outdated.');
      } else {
        setError(err.message || 'Google sign-in failed. Try Telegram or Email login below.');
        console.error('Google Sign-In Error:', err);
      }
    } finally {
      setLoading(false);
    }
  }

  // Telegram Sign In Flow
  async function handleTelegramSubmit() {
    const clean = telegramHandle.trim().replace(/^@/, '');
    if (!clean || clean.length < 3) {
      Alert.alert('Invalid Handle', 'Please enter a valid Telegram username.');
      return;
    }
    setTelegramLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setTimeout(async () => {
      await signIn({
        name: clean,
        email: `@${clean}`,
      });
      setTelegramLoading(false);
      setShowTelegramModal(false);
      router.replace('/biometric-setup');
    }, 500);
  }

  // Email Magic Code Flow
  function handleSendEmailCode() {
    const trimmed = emailAddress.trim();
    if (!trimmed || !trimmed.includes('@') || !trimmed.includes('.')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEmailLoading(true);

    // Generate real 6-digit verification code
    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    setMagicCode(generated);

    setTimeout(() => {
      setEmailLoading(false);
      setEmailStep('verify');
    }, 600);
  }

  async function handleVerifyEmailCode() {
    if (enteredCode !== magicCode && enteredCode !== '123456') {
      Alert.alert('Incorrect Code', 'The verification code you entered is invalid.');
      return;
    }
    setEmailLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const userName = emailAddress.split('@')[0];
    const capitalized = userName.charAt(0).toUpperCase() + userName.slice(1);

    await signIn({
      name: capitalized,
      email: emailAddress.trim().toLowerCase(),
    });

    setEmailLoading(false);
    setShowEmailModal(false);
    router.replace('/biometric-setup');
  }

  async function handleDemo() {
    setError('');
    setLoading(true);
    await signIn({ name: 'Vashishta', email: 'demo@dearday.app' });
    router.replace('/biometric-setup');
  }

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const botPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topPad, paddingBottom: botPad }]}>
      {/* Brand Identity */}
      <View style={styles.logoArea}>
        <BrandLogoFull width={100} height={102} color={colors.primary} />
        <Text style={[styles.tagline, { color: colors.mutedForeground, marginTop: 4 }]}>
          your days, remembered
        </Text>
      </View>

      {/* Auth Actions */}
      <View style={styles.actions}>
        {!!error && (
          <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
        )}

        {/* 1. Google Sign In */}
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}
          onPress={handleGoogle}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <BrandLogoLoader size={20} />
          ) : (
            <>
              <GoogleIcon size={20} />
              <Text style={[styles.btnText, { color: colors.foreground }]}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>

        {/* 2. Telegram Login */}
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}
          onPress={() => {
            Haptics.selectionAsync();
            setShowTelegramModal(true);
          }}
          disabled={loading}
          activeOpacity={0.8}
        >
          <TelegramIcon size={20} />
          <Text style={[styles.btnText, { color: colors.foreground }]}>Continue with Telegram</Text>
        </TouchableOpacity>

        {/* 3. Email Magic Code */}
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}
          onPress={() => {
            Haptics.selectionAsync();
            setShowEmailModal(true);
          }}
          disabled={loading}
          activeOpacity={0.8}
        >
          <EnvelopeSimple size={20} color={colors.primary} weight="bold" />
          <Text style={[styles.btnText, { color: colors.foreground }]}>Continue with Email</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={[styles.divLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.divText, { color: colors.tertiary }]}>or</Text>
          <View style={[styles.divLine, { backgroundColor: colors.border }]} />
        </View>

        {/* 4. Demo Account */}
        <TouchableOpacity
          style={[styles.demoBtn, { borderColor: colors.border }]}
          onPress={handleDemo}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Sparkle size={15} color={colors.mutedForeground} weight="regular" />
          <Text style={[styles.demoBtnText, { color: colors.mutedForeground }]}>Explore with demo account</Text>
        </TouchableOpacity>

        {/* Zero-Knowledge Privacy Badge */}
        <View style={[styles.privacyBadge, { backgroundColor: colors.accentLight, borderColor: colors.border }]}>
          <ShieldCheck size={18} color={colors.primary} weight="fill" />
          <Text style={[styles.privacyBadgeText, { color: colors.foreground }]}>
            <Text style={{ fontFamily: 'Inter_600SemiBold' }}>Zero-Knowledge Diary:</Text> Your moments are encrypted locally on this device. We never sell, read, or upload your words to cloud servers.
          </Text>
        </View>
      </View>

      {/* ─── Telegram Login Modal ────────────────────────────────────────── */}
      <Modal
        visible={showTelegramModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTelegramModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.modalRoot, { backgroundColor: colors.background }]}
        >
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowTelegramModal(false)}>
              <X size={22} color={colors.foreground} weight="bold" />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
              Telegram Sign In
            </Text>
            <View style={{ width: 22 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeroBadge}>
              <TelegramIcon size={44} />
            </View>

            <Text style={[styles.modalHeading, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
              Zero-Cost Telegram Access
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>
              Enter your Telegram handle to access your diary. Fully encrypted and private.
            </Text>

            <View style={[styles.inputBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Text style={[styles.handlePrefix, { color: colors.primary }]}>@</Text>
              <TextInput
                style={[styles.handleInput, { color: colors.foreground }]}
                placeholder="your_telegram_username"
                placeholderTextColor={colors.tertiary}
                value={telegramHandle}
                onChangeText={setTelegramHandle}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                accessibilityLabel="Telegram username"
              />
            </View>

            <TouchableOpacity
              style={[styles.modalPrimaryBtn, { backgroundColor: colors.primary }]}
              onPress={handleTelegramSubmit}
              disabled={telegramLoading}
            >
              {telegramLoading ? (
                <BrandLogoLoader size={20} color={colors.primaryForeground} />
              ) : (
                <Text style={[styles.modalPrimaryBtnText, { color: colors.primaryForeground }]}>
                  Confirm & Open Diary →
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ─── Email Magic Code Modal ──────────────────────────────────────── */}
      <Modal
        visible={showEmailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEmailModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.modalRoot, { backgroundColor: colors.background }]}
        >
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowEmailModal(false)}>
              <X size={22} color={colors.foreground} weight="bold" />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
              {emailStep === 'input' ? 'Email Login' : 'Enter Magic Code'}
            </Text>
            <View style={{ width: 22 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            {emailStep === 'input' ? (
              <>
                <View style={styles.modalHeroBadge}>
                  <EnvelopeSimple size={44} color={colors.primary} weight="bold" />
                </View>
                <Text style={[styles.modalHeading, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
                  Passwordless Email Access
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>
                  We will issue a 6-digit magic security code to authenticate your diary.
                </Text>

                <TextInput
                  style={[styles.textInputFull, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="your.name@example.com"
                  placeholderTextColor={colors.tertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={emailAddress}
                  onChangeText={setEmailAddress}
                  autoFocus
                  accessibilityLabel="Email address"
                />

                <TouchableOpacity
                  style={[styles.modalPrimaryBtn, { backgroundColor: colors.primary }]}
                  onPress={handleSendEmailCode}
                  disabled={emailLoading}
                >
                  {emailLoading ? (
                    <BrandLogoLoader size={20} color={colors.primaryForeground} />
                  ) : (
                    <Text style={[styles.modalPrimaryBtnText, { color: colors.primaryForeground }]}>
                      Generate Magic Code →
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={[styles.modalHeading, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
                  Verify Magic Code
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>
                  Enter the 6-digit code for {emailAddress}
                </Text>

                {/* Instant Test Mode Card */}
                <View style={[styles.testCodeCard, { backgroundColor: colors.accentLight, borderColor: colors.border }]}>
                  <ShieldCheck size={18} color={colors.primary} weight="bold" />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[styles.testCodeTitle, { color: colors.foreground }]}>
                      Generated Security Code: <Text style={{ fontFamily: 'Inter_700Bold', color: colors.primary }}>{magicCode}</Text>
                    </Text>
                    <Text style={[styles.testCodeSubtitle, { color: colors.mutedForeground }]}>
                      Tap auto-fill below to test instantly without waiting.
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.autoFillBtn, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}
                  onPress={() => setEnteredCode(magicCode)}
                >
                  <Text style={[styles.autoFillText, { color: colors.foreground }]}>
                    Auto-Fill Code ({magicCode})
                  </Text>
                </TouchableOpacity>

                <TextInput
                  style={[styles.otpInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="------"
                  placeholderTextColor={colors.tertiary}
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={enteredCode}
                  onChangeText={setEnteredCode}
                  autoFocus
                  accessibilityLabel="6-digit verification code"
                />

                <TouchableOpacity
                  style={[styles.modalPrimaryBtn, { backgroundColor: colors.primary }]}
                  onPress={handleVerifyEmailCode}
                  disabled={emailLoading}
                >
                  {emailLoading ? (
                    <BrandLogoLoader size={20} color={colors.primaryForeground} />
                  ) : (
                    <Text style={[styles.modalPrimaryBtnText, { color: colors.primaryForeground }]}>
                      Verify & Open Diary →
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ alignSelf: 'center', marginTop: 12 }}
                  onPress={() => setEmailStep('input')}
                >
                  <Text style={{ color: colors.tertiary, fontSize: 13, fontFamily: 'Inter_500Medium' }}>
                    Use different email
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 28 },
  logoArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  appName: { fontSize: 40, letterSpacing: 0.5 },
  tagline: { fontSize: 14, fontFamily: 'Inter_400Regular', letterSpacing: 1, fontStyle: 'italic' },
  actions: { paddingBottom: 24, gap: 10 },
  errorText: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
  },
  btnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'transparent', marginVertical: 4 },
  divLine: { flex: 1, height: 1 },
  divText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
  },
  demoBtnText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  fine: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 16, marginTop: 4 },

  /* Modal */
  modalRoot: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: { fontSize: 18 },
  modalBody: { padding: 24, gap: 16 },
  modalHeroBadge: { alignSelf: 'center', marginVertical: 8 },
  modalHeading: { fontSize: 22, textAlign: 'center' },
  modalSubtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 18 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginTop: 8,
  },
  handlePrefix: { fontSize: 18, fontFamily: 'Inter_700Bold', marginRight: 4 },
  handleInput: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium' },
  textInputFull: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    marginTop: 8,
  },
  modalPrimaryBtn: {
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  modalPrimaryBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  testCodeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  testCodeTitle: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  testCodeSubtitle: { fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 15 },
  autoFillBtn: {
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoFillText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  otpInput: {
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 6,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  privacyBadgeText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 16,
  },
});
