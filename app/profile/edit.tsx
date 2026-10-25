import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Platform, Alert, Image,
} from 'react-native';
import { router } from 'expo-router';
import { BrandLogoLoader } from '@/components/BrandLogo';
import { ArrowLeft, Camera } from 'phosphor-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/contexts/AppContext';
import { ProtectedScreen } from '@/components/ProtectedScreen';
import * as Haptics from 'expo-haptics';

function EditProfileContent() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useApp();
  const [name, setName] = useState(user?.name ?? '');
  const [avatar, setAvatar] = useState<string | undefined>(user?.avatar);
  const [saving, setSaving] = useState(false);

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);

  async function handlePickImage() {
    Haptics.selectionAsync();

    const options: { text: string; onPress?: () => void; style?: 'cancel' | 'destructive' }[] = [
      { text: 'Choose from Gallery', onPress: pickFromGallery },
      { text: 'Take a Photo', onPress: takeCameraPhoto },
    ];

    if (avatar) {
      options.push({
        text: 'Remove Current Photo',
        style: 'destructive',
        onPress: () => setAvatar(undefined),
      });
    }

    options.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert('Profile Picture', 'Choose an option', options);
  }

  async function pickFromGallery() {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow photo gallery access to select an avatar.');
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setAvatar(result.assets[0].uri);
    }
  }

  async function takeCameraPhoto() {
    if (Platform.OS === 'web') return;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access to take a profile picture.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setAvatar(result.assets[0].uri);
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter a display name.');
      return;
    }
    setSaving(true);
    await updateUser({ name: name.trim(), avatar });
    setSaving(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topPad }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={22} color={colors.foreground} weight="bold" />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
          Edit Profile
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <BrandLogoLoader size={18} />
          ) : (
            <Text style={[styles.saveBtn, { color: colors.primary }]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Avatar Picker Block */}
        <View style={styles.avatarBlock}>
          <TouchableOpacity
            style={[styles.avatarWrap, { borderColor: colors.border }]}
            onPress={handlePickImage}
            activeOpacity={0.8}
          >
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: colors.primary }]}>
                <Text style={[styles.avatarLetter, { color: colors.primaryForeground }]}>
                  {(name || user?.name || 'U')[0].toUpperCase()}
                </Text>
              </View>
            )}

            <View style={[styles.cameraBadge, { backgroundColor: colors.foreground }]}>
              <Camera size={14} color={colors.background} weight="fill" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={handlePickImage} style={styles.changePhotoBtn}>
            <Text style={[styles.changePhotoText, { color: colors.primary }]}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Form Inputs */}
        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Display name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={colors.tertiary}
          />

          <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 16 }]}>Email</Text>
          <View style={[styles.emailDisplay, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Text style={[styles.emailText, { color: colors.mutedForeground }]}>{user?.email || 'Not connected'}</Text>
          </View>
          <Text style={[styles.hint, { color: colors.tertiary }]}>
            Your email is tied to your account and backup synchronization.
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function EditProfile() {
  return (
    <ProtectedScreen>
      <EditProfileContent />
    </ProtectedScreen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 18 },
  saveBtn: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  content: { padding: 20, gap: 24 },
  avatarBlock: {
    alignItems: 'center',
    gap: 10,
    marginVertical: 10,
  },
  avatarWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 45,
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 34,
    fontFamily: 'Inter_700Bold',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoBtn: {
    paddingVertical: 4,
  },
  changePhotoText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  form: { gap: 8 },
  label: { fontSize: 12, fontFamily: 'Inter_500Medium', letterSpacing: 0.5, textTransform: 'uppercase' },
  input: {
    height: 48,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    borderWidth: 1,
  },
  emailDisplay: {
    height: 48,
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderWidth: 1,
  },
  emailText: { fontSize: 15, fontFamily: 'Inter_400Regular' },
  hint: { fontSize: 12, fontFamily: 'Inter_400Regular' },
});
