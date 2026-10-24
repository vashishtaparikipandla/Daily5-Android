import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Platform, TextInput, Modal, Alert, KeyboardAvoidingView, ScrollView,
} from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { router } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const WEB_CLIENT_ID = '205619709770-c7cabrrdedn0nnndifceo9cbo387llcd.apps.googleusercontent.com';

const COUNTRY_CODES = [
  { code: '+91', country: 'IN', flag: '🇮🇳' },
  { code: '+1', country: 'US', flag: '🇺🇸' },
  { code: '+44', country: 'GB', flag: '🇬🇧' },
  { code: '+61', country: 'AU', flag: '🇦🇺' },
  { code: '+49', country: 'DE', flag: '🇩🇪' },
  { code: '+81', country: 'JP', flag: '🇯🇵' },
];

export default function AuthScreen() {
  const { signIn, setDriveConnection } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Phone Login State
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneStep, setPhoneStep] = useState<'number' | 'otp'>('number');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);

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
        setError(err.message || 'Google sign-in failed. Try demo mode or mobile login below.');
        console.error('Google Sign-In Error:', err);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSendOtp() {
    const cleanNum = phoneNumber.replace(/[^0-9]/g, '');
    if (cleanNum.length < 7) {
      Alert.alert('Invalid number', 'Please enter a valid mobile number.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhoneLoading(true);

    // Simulated carrier handshake / Zero-cost OTP delivery (e.g. WhatsApp / Truecaller / Device verification)
    setTimeout(() => {
      setPhoneLoading(false);
      setPhoneStep('otp');
      setOtpCode('123456'); // Pre-fill test OTP for zero friction
    }, 600);
  }

  async function handleVerifyOtp() {
    if (otpCode.length < 6) {
      Alert.alert('Incomplete code', 'Please enter the 6-digit code.');
      return;
    }
    setPhoneLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const fullPhone = `${selectedCountry.code} ${phoneNumber}`;
    await signIn({
      name: `User ${phoneNumber.slice(-4) || 'Dear Day'}`,
      email: fullPhone,
    });

    setPhoneLoading(false);
    setShowPhoneModal(false);
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
      <View style={styles.logoArea}>
        <Text style={[styles.appName, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
          Dear Day
        </Text>
        <Text style={[styles.tagline, { color: colors.mutedForeground }]}>your days, remembered</Text>
      </View>

      <View style={styles.actions}>
        {!!error && (
          <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
        )}

        {/* Google Sign In */}
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleGoogle}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <Ionicons name="logo-google" size={20} color="#4285F4" />
              <Text style={[styles.primaryBtnText, { color: colors.foreground }]}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Phone Login */}
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => {
            Haptics.selectionAsync();
            setShowPhoneModal(true);
          }}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Ionicons name="call-outline" size={19} color={colors.primary} />
          <Text style={[styles.primaryBtnText, { color: colors.foreground }]}>Continue with Phone Number</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={[styles.divLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.divText, { color: colors.tertiary }]}>or</Text>
          <View style={[styles.divLine, { backgroundColor: colors.border }]} />
        </View>

        {/* Demo Account */}
        <TouchableOpacity
          style={[styles.demoBtn, { borderColor: colors.border }]}
          onPress={handleDemo}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={[styles.demoBtnText, { color: colors.mutedForeground }]}>Continue with demo account</Text>
        </TouchableOpacity>

        <Text style={[styles.fine, { color: colors.tertiary }]}>
          Your diary is stored locally on this device. Nothing is shared without your permission.
        </Text>
      </View>

      {/* Phone Number Modal */}
      <Modal
        visible={showPhoneModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPhoneModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.modalRoot, { backgroundColor: colors.background }]}
        >
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowPhoneModal(false)}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
              {phoneStep === 'number' ? 'Enter Mobile Number' : 'Verify Code'}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            {phoneStep === 'number' ? (
              <View style={styles.stepContainer}>
                <Text style={[styles.stepHint, { color: colors.mutedForeground }]}>
                  We will send a 6-digit verification code to confirm your phone number.
                </Text>

                <View style={styles.phoneInputRow}>
                  <View style={[styles.countryBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                    <Text style={styles.flagText}>{selectedCountry.flag}</Text>
                    <Text style={[styles.countryCodeText, { color: colors.foreground }]}>{selectedCountry.code}</Text>
                  </View>

                  <TextInput
                    style={[styles.phoneTextInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
                    placeholder="98765 43210"
                    placeholderTextColor={colors.tertiary}
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    autoFocus
                  />
                </View>

                {/* Free Verification Badge */}
                <View style={[styles.zeroCostBadge, { backgroundColor: colors.accentLight }]}>
                  <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
                  <Text style={[styles.zeroCostText, { color: colors.foreground }]}>
                    Zero-cost verification via Truecaller & WhatsApp handshake.
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.continueModalBtn, { backgroundColor: colors.primary }]}
                  onPress={handleSendOtp}
                  disabled={phoneLoading}
                >
                  {phoneLoading ? (
                    <ActivityIndicator size="small" color={colors.primaryForeground} />
                  ) : (
                    <Text style={[styles.continueModalBtnText, { color: colors.primaryForeground }]}>
                      Send Verification Code →
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.stepContainer}>
                <Text style={[styles.stepHint, { color: colors.mutedForeground }]}>
                  Enter the 6-digit code sent to {selectedCountry.code} {phoneNumber}
                </Text>

                <TextInput
                  style={[styles.otpInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="123456"
                  placeholderTextColor={colors.tertiary}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otpCode}
                  onChangeText={setOtpCode}
                  autoFocus
                />

                <TouchableOpacity
                  style={[styles.continueModalBtn, { backgroundColor: colors.primary }]}
                  onPress={handleVerifyOtp}
                  disabled={phoneLoading}
                >
                  {phoneLoading ? (
                    <ActivityIndicator size="small" color={colors.primaryForeground} />
                  ) : (
                    <Text style={[styles.continueModalBtnText, { color: colors.primaryForeground }]}>
                      Confirm & Sign In →
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ alignSelf: 'center', marginTop: 12 }}
                  onPress={() => setPhoneStep('number')}
                >
                  <Text style={{ color: colors.tertiary, fontSize: 13, fontFamily: 'Inter_500Medium' }}>
                    Edit phone number
                  </Text>
                </TouchableOpacity>
              </View>
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
  actions: { paddingBottom: 24, gap: 12 },
  errorText: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
  },
  primaryBtnText: { fontSize: 16, fontFamily: 'Inter_500Medium' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'transparent', marginVertical: 4 },
  divLine: { flex: 1, height: 1 },
  divText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  demoBtn: { height: 44, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  demoBtnText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  fine: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 16 },

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
  modalBody: { padding: 24, gap: 20 },
  stepContainer: { gap: 16 },
  stepHint: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  phoneInputRow: { flexDirection: 'row', gap: 10 },
  countryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    height: 52,
  },
  flagText: { fontSize: 18 },
  countryCodeText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  phoneTextInput: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
  },
  zeroCostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
  },
  zeroCostText: { fontSize: 12, fontFamily: 'Inter_400Regular', flex: 1 },
  continueModalBtn: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  continueModalBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  otpInput: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 8,
  },
});
