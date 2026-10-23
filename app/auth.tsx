import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { router } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const WEB_CLIENT_ID = '205619709770-c7cabrrdedn0nnndifceo9cbo387llcd.apps.googleusercontent.com';

export default function AuthScreen() {
  const { signIn } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      await signIn(
        {
          name: user?.name || 'User',
          email: user?.email || '',
          avatar: user?.photo || undefined,
        },
        tokens.accessToken,
      );
      router.replace('/biometric-setup');
    } catch (err: any) {
      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled
      } else if (err.code === statusCodes.IN_PROGRESS) {
        // in progress
      } else if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setError('Google Play Services is not available or outdated.');
      } else {
        setError(err.message || 'Google sign-in failed. Try demo mode below.');
        console.error('Google Sign-In Error:', err);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDemo() {
    setError('');
    setLoading(true);
    await signIn({ name: 'Vashishta', email: 'demo@daily5.app' });
    router.replace('/biometric-setup');
  }

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const botPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topPad, paddingBottom: botPad }]}>
      <View style={styles.logoArea}>
        <Text style={[styles.appName, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
          Daily 5
        </Text>
        <Text style={[styles.tagline, { color: colors.mutedForeground }]}>your days, remembered</Text>
      </View>

      <View style={styles.actions}>
        {!!error && (
          <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
        )}

        <TouchableOpacity
          style={[styles.googleBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleGoogle}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <Ionicons name="logo-google" size={20} color="#4285F4" />
              <Text style={[styles.googleBtnText, { color: colors.foreground }]}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: colors.border }]}>
          <View style={[styles.divLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.divText, { color: colors.tertiary }]}>or</Text>
          <View style={[styles.divLine, { backgroundColor: colors.border }]} />
        </View>

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
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    height: 52, borderRadius: 12, borderWidth: 1,
  },
  googleBtnText: { fontSize: 16, fontFamily: 'Inter_500Medium' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'transparent' },
  divLine: { flex: 1, height: 1 },
  divText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  demoBtn: { height: 44, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  demoBtnText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  fine: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 16 },
});
