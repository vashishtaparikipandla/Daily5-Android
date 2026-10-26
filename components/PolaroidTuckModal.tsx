/**
 * PolaroidTuckModal.tsx
 * Nostalgic physical polaroid tucking experience for Dear Day.
 * Allows users to snap or select a photograph, inscribe a handwritten note on the white Polaroid chin,
 * and tuck it into the album sleeve with realistic tactile feedback.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  Platform,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import {
  X,
  Camera,
  Images,
  TrashSimple,
  Check,
  Sparkle,
  PencilSimple,
} from 'phosphor-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CATEGORIES } from '@/constants/categories';
import { CategoryIcon } from '@/components/CategoryIcon';
import { uid, type Entry, type CategoryId } from '@/lib/data';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const POLAROID_WIDTH = Math.min(SCREEN_WIDTH - 64, 320);
const POLAROID_PHOTO_SIZE = POLAROID_WIDTH - 24; // 12px white border on sides
const MAX_NOTE_LENGTH = 120;

const SLOT_PROMPTS = [
  'Morning light & awakening',
  'Afternoon walk or connection',
  'A small joy or serendipity',
  'Evening quiet & reflection',
];

interface PolaroidTuckModalProps {
  visible: boolean;
  onClose: () => void;
  slotIndex: number;
  dateStr: string;
  initialEntry?: Entry | null;
  onSave: (entry: Entry, slotIndex: number) => void;
  onDelete?: (slotIndex: number) => void;
  isImmutable?: boolean;
}

export function PolaroidTuckModal({
  visible,
  onClose,
  slotIndex,
  dateStr,
  initialEntry,
  onSave,
  onDelete,
  isImmutable = false,
}: PolaroidTuckModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [photoUri, setPhotoUri] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [category, setCategory] = useState<CategoryId>('other');

  useEffect(() => {
    if (visible) {
      if (initialEntry) {
        setPhotoUri(initialEntry.photos?.[0] || '');
        setCaption(initialEntry.text || '');
        setCategory(initialEntry.category || 'other');
      } else {
        setPhotoUri('');
        setCaption('');
        setCategory('other');
      }
    }
  }, [visible, initialEntry]);

  async function takePhoto() {
    if (isImmutable) return;
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow camera access to take a photo for your album.');
        return;
      }
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function pickPhoto() {
    if (isImmutable) return;
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow photo gallery access to tuck a photo into your album.');
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setPhotoUri(result.assets[0].uri);
    }
  }

  function handleTuck() {
    if (!photoUri && !caption.trim()) {
      Alert.alert('Empty memory', 'Please add a photo or write a short handwritten note before tucking into the album.');
      return;
    }

    // Heavy tactile haptic thud simulating pressing the physical photo into the paper corner slits
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    const updatedEntry: Entry = {
      id: initialEntry?.id || uid(),
      text: caption.trim(),
      category,
      photos: photoUri ? [photoUri] : [],
    };

    onSave(updatedEntry, slotIndex);
    onClose();
  }

  function handleDelete() {
    Alert.alert(
      'Remove photograph?',
      'This will remove this memory from your daily album page.',
      [
        { text: 'Keep Photo', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onDelete?.(slotIndex);
            onClose();
          },
        },
      ],
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardWrap}
        >
          <View style={[styles.dialogSheet, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, 24) }]}>
            {/* Top Bar */}
            <View style={styles.topBar}>
              <View>
                <Text style={[styles.sheetTitle, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
                  {initialEntry ? 'Inscribe Memory' : 'Tuck a Photograph'}
                </Text>
                <Text style={[styles.sheetSub, { color: colors.mutedForeground }]}>
                  {SLOT_PROMPTS[slotIndex] || 'A quiet fragment preserved'}
                </Text>
              </View>

              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={[styles.closeCircle, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <X size={18} color={colors.foreground} weight="bold" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* The Physical Polaroid Print Card */}
              <View style={[styles.polaroidCard, { width: POLAROID_WIDTH }]}>
                {/* Photo Area (Square) */}
                <View style={[styles.photoViewport, { width: POLAROID_PHOTO_SIZE, height: POLAROID_PHOTO_SIZE }]}>
                  {photoUri ? (
                    <>
                      <Image source={{ uri: photoUri }} style={styles.polaroidImage} resizeMode="cover" />
                      {/* Subtle diagonal plastic gloss sheen */}
                      <View style={styles.glossOverlay} pointerEvents="none" />
                      {!isImmutable && (
                        <TouchableOpacity
                          style={styles.photoReplaceBtn}
                          onPress={pickPhoto}
                          activeOpacity={0.8}
                        >
                          <Camera size={14} color="#FFFFFF" weight="bold" />
                          <Text style={styles.photoReplaceText}>Change</Text>
                        </TouchableOpacity>
                      )}
                    </>
                  ) : (
                    <View style={styles.emptyPhotoPlaceholder}>
                      <View style={[styles.cameraCircle, { backgroundColor: 'rgba(232, 89, 58, 0.12)' }]}>
                        <Camera size={34} color={colors.primary} weight="duotone" />
                      </View>
                      <Text style={[styles.addPhotoTitle, { color: colors.foreground }]}>
                        Add a Photograph
                      </Text>
                      <Text style={[styles.addPhotoSub, { color: colors.mutedForeground }]}>
                        Capture or pick from your camera roll
                      </Text>

                      <View style={styles.photoActionRow}>
                        <TouchableOpacity
                          style={[styles.photoActionBtn, { backgroundColor: colors.primary }]}
                          onPress={takePhoto}
                          activeOpacity={0.8}
                        >
                          <Camera size={15} color={colors.primaryForeground} weight="bold" />
                          <Text style={[styles.photoActionBtnText, { color: colors.primaryForeground }]}>
                            Camera
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.photoActionBtn, { backgroundColor: colors.muted, borderColor: colors.border, borderWidth: 1 }]}
                          onPress={pickPhoto}
                          activeOpacity={0.8}
                        >
                          <Images size={15} color={colors.foreground} weight="bold" />
                          <Text style={[styles.photoActionBtnText, { color: colors.foreground }]}>
                            Gallery
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>

                {/* White Bottom Chin for Handwritten Inscription */}
                <View style={styles.polaroidChin}>
                  <TextInput
                    style={[styles.handwritingInput, { color: '#1E1C19' }]}
                    placeholder="Write a handwritten memory note…"
                    placeholderTextColor="#8C887B"
                    value={caption}
                    onChangeText={setCaption}
                    maxLength={MAX_NOTE_LENGTH}
                    multiline
                    editable={!isImmutable}
                  />

                  <View style={styles.chinFooterRow}>
                    <Text style={styles.dateStampSmall}>
                      {dateStr.replace(/-/g, ' · ')}
                    </Text>
                    <Text style={styles.charCount}>
                      {caption.length}/{MAX_NOTE_LENGTH}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Nostalgic Category Postage Stamps */}
              <View style={styles.categorySection}>
                <Text style={[styles.sectionHeading, { color: colors.tertiary }]}>
                  ARCHIVAL MOTIF / CATEGORY
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                  {CATEGORIES.map(cat => {
                    const isSelected = category === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => {
                          if (isImmutable) return;
                          Haptics.selectionAsync();
                          setCategory(cat.id as CategoryId);
                        }}
                        style={[
                          styles.catPill,
                          {
                            backgroundColor: isSelected ? cat.color + '22' : colors.card,
                            borderColor: isSelected ? cat.color : colors.border,
                          },
                        ]}
                      >
                        <CategoryIcon
                          id={cat.id}
                          size={14}
                          color={isSelected ? cat.color : colors.mutedForeground}
                          weight={isSelected ? 'bold' : 'regular'}
                        />
                        <Text
                          style={[
                            styles.catLabel,
                            { color: isSelected ? cat.color : colors.foreground, fontFamily: isSelected ? 'Inter_700Bold' : 'Inter_500Medium' },
                          ]}
                        >
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Action Buttons */}
              <View style={[styles.actionRow, { paddingBottom: Math.max(insets.bottom, 24) }]}>
                {initialEntry && !isImmutable && (
                  <TouchableOpacity
                    style={[styles.deleteBtn, { borderColor: colors.border }]}
                    onPress={handleDelete}
                    activeOpacity={0.8}
                  >
                    <TrashSimple size={18} color={colors.destructive} />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.tuckBtn, { backgroundColor: colors.primary, flex: 1 }]}
                  onPress={handleTuck}
                  activeOpacity={0.85}
                >
                  <Sparkle size={18} color={colors.primaryForeground} weight="fill" />
                  <Text style={[styles.tuckBtnText, { color: colors.primaryForeground }]}>
                    {initialEntry ? 'Save Inscription' : 'Tuck Photo into Album 📌'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  keyboardWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dialogSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  sheetTitle: {
    fontSize: 20,
    letterSpacing: -0.2,
  },
  sheetSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  closeCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 20,
  },
  polaroidCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E8E3D9',
  },
  photoViewport: {
    borderRadius: 4,
    backgroundColor: '#F5F2EB',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#DDD8CE',
  },
  polaroidImage: {
    width: '100%',
    height: '100%',
  },
  glossOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  photoReplaceBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  photoReplaceText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  emptyPhotoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 6,
  },
  cameraCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  addPhotoTitle: {
    fontSize: 15,
    fontFamily: 'PlayfairDisplay_700Bold',
  },
  addPhotoSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginBottom: 10,
  },
  photoActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  photoActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
  },
  photoActionBtnText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  polaroidChin: {
    marginTop: 12,
    paddingHorizontal: 4,
    minHeight: 64,
    justifyContent: 'space-between',
  },
  handwritingInput: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif',
    lineHeight: 20,
    minHeight: 44,
    textAlignVertical: 'top',
  },
  chinFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  dateStampSmall: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: '#8C887B',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  charCount: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: '#8C887B',
  },
  categorySection: {
    width: '100%',
    gap: 8,
  },
  sectionHeading: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8,
    paddingLeft: 4,
  },
  categoryScroll: {
    gap: 8,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  catLabel: {
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  deleteBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tuckBtn: {
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tuckBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.2,
  },
});