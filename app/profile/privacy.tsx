import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Platform,
  Alert, Switch, ActivityIndicator, ScrollView, Modal,
} from 'react-native';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Lock,
  Fingerprint,
  ShieldCheck,
  ArrowsClockwise,
  Key,
  ShareNetwork,
  DownloadSimple,
  ArrowsLeftRight,
  GoogleLogo,
  CloudArrowUp,
  CloudArrowDown,
  LinkBreak,
  CheckCircle,
  Clock,
  Trash,
  CaretRight,
  X,
} from 'phosphor-react-native';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/contexts/AppContext';
import { useDiary } from '@/contexts/DiaryContext';
import { useDriveBackup, DriveSchedule } from '@/contexts/DriveBackupContext';
import { ProtectedScreen } from '@/components/ProtectedScreen';
import { exportBackupFile, importBackupFromFilePicker } from '@/lib/backup';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

const WEB_CLIENT_ID = '205619709770-c7cabrrdedn0nnndifceo9cbo387llcd.apps.googleusercontent.com';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(d: Date | null): string {
  if (!d) return 'Never';
  const now = new Date();
  const diffMs   = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1)  return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffH = Math.floor(diffMins / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return 'Yesterday';
  if (diffD < 7)   return `${diffD} days ago`;
  return d.toLocaleDateString();
}

// ─── Schedule picker ──────────────────────────────────────────────────────────

const SCHEDULE_OPTIONS: { value: DriveSchedule; label: string }[] = [
  { value: 'off',    label: 'Off' },
  { value: 'daily',  label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
];

function SchedulePicker({
  value,
  onChange,
  disabled,
  colors,
}: {
  value: DriveSchedule;
  onChange: (v: DriveSchedule) => void;
  disabled?: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={pickerStyles.row}>
      {SCHEDULE_OPTIONS.map(opt => {
        const active = opt.value === value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[
              pickerStyles.chip,
              {
                backgroundColor: active ? colors.primary : colors.accentLight,
                borderColor: active ? colors.primary : colors.border,
              },
            ]}
            onPress={() => !disabled && onChange(opt.value)}
            disabled={disabled}
          >
            <Text
              style={[
                pickerStyles.label,
                { color: active ? colors.primaryForeground : colors.foreground },
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const pickerStyles = StyleSheet.create({
  row:   { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  chip:  { flex: 1, borderRadius: 8, borderWidth: 1, alignItems: 'center', paddingVertical: 7 },
  label: { fontSize: 13, fontFamily: 'Inter_500Medium' },
});

// ─── Main screen content ──────────────────────────────────────────────────────

function PrivacyContent() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, biometricEnabled, setBiometricEnabled, deleteAccount, backupEnabled, setBackupEnabled,
          driveConnected, driveAccount, setDriveConnection, disconnectGoogleDrive, getDriveToken } = useApp();
  const { performBackup, restoreFromBackup, restoreFromData, lastBackupTime, refreshBackupTime } = useDiary();
  const {
    driveWorking, lastDriveBackupTime, driveSchedule,
    setDriveSchedule, backupToDrive, restoreFromDrive, refreshDriveBackupTime,
  } = useDriveBackup();

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);

  const [togglingBiometric, setTogglingBiometric] = useState(false);
  const [togglingBackup,    setTogglingBackup]     = useState(false);
  const [backingUp,         setBackingUp]          = useState(false);
  const [importing,         setImporting]          = useState(false);
  const [connectingDrive,   setConnectingDrive]    = useState(false);
  const [driveTokenValid,   setDriveTokenValid]    = useState(false);

  // Resolve token validity whenever Drive connection state changes
  useEffect(() => {
    if (!driveConnected) { setDriveTokenValid(false); return; }
    getDriveToken().then(tok => setDriveTokenValid(!!tok));
  }, [driveConnected]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    refreshBackupTime();
    refreshDriveBackupTime();
  }, []);

  // ── Local backup handlers ──────────────────────────────────────────────

  async function handleBiometricToggle(next: boolean) {
    if (togglingBiometric) return;
    setTogglingBiometric(true);
    const result = await setBiometricEnabled(next);
    if (next && !result) {
      Alert.alert(
        'Could not enable biometric',
        'Either biometric is not set up on this device, or the authentication challenge was cancelled.',
      );
    }
    setTogglingBiometric(false);
  }

  async function handleBackupToggle(next: boolean) {
    if (togglingBackup) return;
    setTogglingBackup(true);
    if (next) {
      await setBackupEnabled(true);
      const ok = await performBackup();
      if (!ok) {
        await setBackupEnabled(false);
        Alert.alert('Backup failed', 'Could not create the initial backup. Please try again.');
      } else {
        Alert.alert(
          'Backup enabled',
          'Your diary is now encrypted and backed up automatically.',
        );
        await refreshBackupTime();
      }
    } else {
      Alert.alert(
        'Disable backup?',
        'Your diary will no longer be backed up automatically. Existing backup files will be kept on this device.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Disable', style: 'destructive', onPress: async () => { await setBackupEnabled(false); setTogglingBackup(false); } },
        ],
      );
      setTogglingBackup(false);
      return;
    }
    setTogglingBackup(false);
  }

  async function handleBackupNow() {
    if (backingUp) return;
    setBackingUp(true);
    const ok = await performBackup();
    setBackingUp(false);
    if (ok) { await refreshBackupTime(); Alert.alert('Backup complete', 'Your diary has been encrypted and saved.'); }
    else    { Alert.alert('Backup failed', 'Could not save the backup. Please try again.'); }
  }

  async function handleExport() {
    try { await exportBackupFile(); }
    catch (e: unknown) { Alert.alert('Export failed', e instanceof Error ? e.message : 'Unknown error'); }
  }

  const [showTransferModal, setShowTransferModal] = useState(false);

  async function handleImport() {
    if (importing) return;
    Alert.alert(
      'Import backup file',
      'This will restore your memories and books from the selected backup file (.d5b). If you are switching devices, ensure you entered your 64-character recovery key first.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Choose file',
          onPress: async () => {
            setImporting(true);
            const data = await importBackupFromFilePicker();
            setImporting(false);
            if (!data) {
              Alert.alert(
                'Import failed',
                'Could not decrypt the backup. Make sure you have entered your 64-character recovery key in "Recovery key" first.',
              );
              return;
            }
            const ok = await restoreFromData(data as any);
            if (ok) {
              await performBackup();
              await refreshBackupTime();
              Alert.alert('Restored successfully', 'Your diary entries and books have been restored from your backup!');
            } else {
              Alert.alert('Restore failed', 'The backup file contained invalid data.');
            }
          },
        },
      ],
    );
  }

  async function handleConnectDrive() {
    if (connectingDrive) return;
    setConnectingDrive(true);
    try {
      GoogleSignin.configure({
        scopes: ['https://www.googleapis.com/auth/drive.appdata'],
        webClientId: WEB_CLIENT_ID,
        offlineAccess: true,
      });
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();
      const gUser = (response as any).data?.user || (response as any).user;
      const email = gUser?.email || user?.email || driveAccount || 'Google User';

      if (tokens.accessToken) {
        const expiry = Date.now() + 3600 * 1000;
        await setDriveConnection(email, tokens.accessToken, expiry);
        setDriveTokenValid(true);
        Alert.alert('Google Drive connected', 'Your diary can now be backed up to your Google Drive.');
      } else {
        Alert.alert('Connection failed', 'Could not obtain Google Drive access token. Please try again.');
      }
    } catch (err: any) {
      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled sign-in
      } else if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Google Play Services unavailable', 'Google Play Services is required to connect Google Drive.');
      } else {
        console.error('Google Drive Connection Error:', err);
        Alert.alert('Connection failed', err?.message || 'Could not connect to Google Drive. Please try again.');
      }
    } finally {
      setConnectingDrive(false);
    }
  }

  async function handleReconnectDrive() {
    await handleConnectDrive();
  }

  async function handleDisconnectDrive() {
    Alert.alert(
      'Disconnect Google Drive?',
      'Your diary will no longer back up to Google Drive. Existing Drive backups are kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await disconnectGoogleDrive();
            try {
              await GoogleSignin.signOut();
            } catch {}
            setDriveTokenValid(false);
          },
        },
      ],
    );
  }

  async function handleDriveBackupNow() {
    const tok = await getDriveToken();
    if (!tok) {
      Alert.alert('Session expired', 'Your Google Drive session has expired. Please reconnect to continue backing up.');
      return;
    }
    const ok = await backupToDrive();
    if (ok) { await refreshDriveBackupTime(); Alert.alert('Backup complete', 'Your diary has been backed up to Google Drive.'); }
    else    { Alert.alert('Backup failed', 'Could not upload to Google Drive. Please try again.'); }
  }

  async function handleDriveRestore() {
    Alert.alert(
      'Restore from Google Drive?',
      'This will replace your current diary with the latest Drive backup.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: async () => {
            const tok = await getDriveToken();
            if (!tok) { Alert.alert('Session expired', 'Please reconnect to Google Drive first.'); return; }
            const ok = await restoreFromDrive();
            Alert.alert(ok ? 'Restored' : 'Restore failed', ok ? 'Your diary has been restored from Google Drive.' : 'No backup found or decryption failed.');
          },
        },
      ],
    );
  }

  function handleDelete() {
    Alert.alert(
      'Delete account',
      'This will permanently delete all your diary entries and books. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: async () => { await deleteAccount(); router.replace('/auth'); },
        },
      ],
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────

  const driveSessionExpired = driveConnected && !driveTokenValid;

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topPad }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
          Data & Privacy
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Info banner */}
        <View style={[styles.infoCard, { backgroundColor: colors.accentLight, borderColor: colors.border }]}>
          <Lock size={18} color={colors.primary} weight="fill" />
          <Text style={[styles.infoText, { color: colors.foreground }]}>
            Your diary is stored locally on this device. Backup is end-to-end encrypted — only you hold the key.
          </Text>
        </View>

        {/* Security */}
        <Text style={[styles.sectionLabel, { color: colors.tertiary }]}>Security</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <Fingerprint size={20} color={colors.mutedForeground} />
            <View style={styles.rowMeta}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Biometric unlock</Text>
              <Text style={[styles.rowSub, { color: colors.tertiary }]}>
                {biometricEnabled ? 'Required to open your diary' : 'Enable fingerprint or face unlock'}
              </Text>
            </View>
            {togglingBiometric
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Switch value={biometricEnabled} onValueChange={handleBiometricToggle}
                  thumbColor={biometricEnabled ? colors.primaryForeground : colors.tertiary}
                  trackColor={{ true: colors.primary, false: colors.border }} />}
          </View>
        </View>

        {/* Local encrypted backup */}
        <Text style={[styles.sectionLabel, { color: colors.tertiary }]}>Local Encrypted Backup</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.row, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
            <ShieldCheck size={20} color={colors.primary} />
            <View style={styles.rowMeta}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Automatic device backup</Text>
              <Text style={[styles.rowSub, { color: colors.tertiary }]}>
                {backupEnabled ? `Saved: ${formatTime(lastBackupTime)}` : 'Keep diary encrypted on device'}
              </Text>
            </View>
            {togglingBackup
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Switch value={backupEnabled} onValueChange={handleBackupToggle}
                  thumbColor={backupEnabled ? colors.primaryForeground : colors.tertiary}
                  trackColor={{ true: colors.primary, false: colors.border }} />}
          </View>

          <TouchableOpacity
            style={[styles.row, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
            onPress={handleBackupNow}
            disabled={backingUp}
          >
            <ArrowsClockwise size={20} color={colors.mutedForeground} />
            <View style={styles.rowMeta}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Back up now</Text>
              <Text style={[styles.rowSub, { color: colors.tertiary }]}>
                {lastBackupTime ? `Last saved: ${formatTime(lastBackupTime)}` : 'Create instant encrypted copy'}
              </Text>
            </View>
            {backingUp ? <ActivityIndicator size="small" color={colors.primary} /> : <CaretRight size={16} color={colors.tertiary} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.row, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
            onPress={() => router.push('/profile/backup-key')}
          >
            <Key size={20} color={colors.mutedForeground} />
            <View style={styles.rowMeta}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Recovery key</Text>
              <Text style={[styles.rowSub, { color: colors.tertiary }]}>64-character key required to restore on new device</Text>
            </View>
            <CaretRight size={16} color={colors.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.row, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
            onPress={handleExport}
          >
            <ShareNetwork size={20} color={colors.mutedForeground} />
            <View style={styles.rowMeta}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Export backup file (.d5b)</Text>
              <Text style={[styles.rowSub, { color: colors.tertiary }]}>Share or save to cloud/storage</Text>
            </View>
            <CaretRight size={16} color={colors.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.row, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
            onPress={handleImport}
            disabled={importing}
          >
            <DownloadSimple size={20} color={colors.mutedForeground} />
            <View style={styles.rowMeta}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Import backup file</Text>
              <Text style={[styles.rowSub, { color: colors.tertiary }]}>Restore memories from a .d5b file</Text>
            </View>
            {importing ? <ActivityIndicator size="small" color={colors.primary} /> : <CaretRight size={16} color={colors.tertiary} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={() => setShowTransferModal(true)}
          >
            <ArrowsLeftRight size={20} color={colors.primary} />
            <View style={styles.rowMeta}>
              <Text style={[styles.rowLabel, { color: colors.primary, fontFamily: 'Inter_600SemiBold' }]}>
                Switching devices? Read guide
              </Text>
              <Text style={[styles.rowSub, { color: colors.tertiary }]}>
                Step-by-step instructions for transferring data
              </Text>
            </View>
            <CaretRight size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Google Drive backup */}
        <Text style={[styles.sectionLabel, { color: colors.tertiary }]}>Google Drive Backup</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>

          {/* Not connected */}
          {!driveConnected && (
            <View>
              <View style={[styles.row, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                <GoogleLogo size={20} color={colors.mutedForeground} weight="bold" />
                <View style={styles.rowMeta}>
                  <Text style={[styles.rowLabel, { color: colors.foreground }]}>Google Drive</Text>
                  <Text style={[styles.rowSub, { color: colors.tertiary }]}>
                    Back up your encrypted diary to your personal Drive
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={[styles.row, styles.connectBtn, { backgroundColor: colors.accentLight }]}
                onPress={handleConnectDrive} disabled={connectingDrive}>
                {connectingDrive
                  ? <ActivityIndicator size="small" color={colors.primary} />
                  : <><CloudArrowUp size={18} color={colors.primary} />
                     <Text style={[styles.connectLabel, { color: colors.primary }]}>Connect Google Drive</Text></>}
              </TouchableOpacity>
            </View>
          )}

          {/* Connected — session expired */}
          {driveSessionExpired && (
            <View>
              <View style={[styles.row, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                <GoogleLogo size={20} color={colors.destructive} weight="bold" />
                <View style={styles.rowMeta}>
                  <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                    {driveAccount ?? 'Google Drive'}
                  </Text>
                  <Text style={[styles.rowSub, { color: colors.destructive }]}>Session expired — tap to reconnect</Text>
                </View>
              </View>
              <TouchableOpacity style={[styles.row, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
                onPress={handleReconnectDrive} disabled={connectingDrive}>
                {connectingDrive
                  ? <ActivityIndicator size="small" color={colors.primary} />
                  : <><ArrowsClockwise size={20} color={colors.primary} />
                     <Text style={[styles.rowLabel, { color: colors.primary, flex: 1 }]}>Reconnect</Text></>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.row} onPress={handleDisconnectDrive}>
                <LinkBreak size={20} color={colors.destructive} />
                <Text style={[styles.rowLabel, { color: colors.destructive, flex: 1 }]}>Disconnect Drive</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Connected — session valid */}
          {driveConnected && driveTokenValid && (
            <View>
              {/* Account row */}
              <View style={[styles.row, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                <GoogleLogo size={20} color={colors.primary} weight="bold" />
                <View style={styles.rowMeta}>
                  <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                    {driveAccount ?? 'Google Drive connected'}
                  </Text>
                  <Text style={[styles.rowSub, { color: colors.tertiary }]}>
                    Last backup: {formatTime(lastDriveBackupTime)}
                  </Text>
                </View>
                <CheckCircle size={18} color={colors.primary} weight="fill" />
              </View>

              {/* Back up now */}
              <TouchableOpacity
                style={[styles.row, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
                onPress={handleDriveBackupNow} disabled={driveWorking}>
                <CloudArrowUp size={20} color={colors.mutedForeground} />
                <Text style={[styles.rowLabel, { color: colors.foreground, flex: 1 }]}>Back up to Drive now</Text>
                {driveWorking
                  ? <ActivityIndicator size="small" color={colors.primary} />
                  : <CaretRight size={16} color={colors.tertiary} />}
              </TouchableOpacity>

              {/* Restore */}
              <TouchableOpacity
                style={[styles.row, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
                onPress={handleDriveRestore} disabled={driveWorking}>
                <CloudArrowDown size={20} color={colors.mutedForeground} />
                <Text style={[styles.rowLabel, { color: colors.foreground, flex: 1 }]}>Restore from Drive</Text>
                {driveWorking
                  ? <ActivityIndicator size="small" color={colors.primary} />
                  : <CaretRight size={16} color={colors.tertiary} />}
              </TouchableOpacity>

              {/* Schedule picker */}
              <View style={[styles.scheduleHeader, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                <Clock size={18} color={colors.mutedForeground} />
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>Auto-backup schedule</Text>
              </View>
              <SchedulePicker
                value={driveSchedule}
                onChange={setDriveSchedule}
                disabled={driveWorking}
                colors={colors}
              />

              {/* Disconnect */}
              <TouchableOpacity
                style={[styles.row, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}
                onPress={handleDisconnectDrive}>
                <LinkBreak size={20} color={colors.destructive} />
                <Text style={[styles.rowLabel, { color: colors.destructive, flex: 1 }]}>Disconnect Drive</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Your data */}
        <Text style={[styles.sectionLabel, { color: colors.tertiary }]}>Your data</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.row} onPress={handleDelete}>
            <Trash size={20} color={colors.destructive} />
            <Text style={[styles.rowLabel, { color: colors.destructive }]}>Delete account</Text>
            <CaretRight size={16} color={colors.tertiary} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.footnote, { color: colors.tertiary }]}>
          Backups are encrypted with AES-256-GCM before leaving this device. Your key never leaves the device.
          Drive backups are stored in a private app folder — not visible in your Drive file browser.
        </Text>
      </ScrollView>

      {/* Device Transfer Modal */}
      <Modal
        visible={showTransferModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTransferModal(false)}
      >
        <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
              Transfer to a New Phone
            </Text>
            <TouchableOpacity onPress={() => setShowTransferModal(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <X size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={[styles.guideStep, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.stepNumberBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepInfo}>
                <Text style={[styles.stepTitle, { color: colors.foreground }]}>Copy your Recovery Key</Text>
                <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>
                  Your diary is protected by a 64-character encryption key known only to you. Go to Recovery Key and tap "Copy Key". Keep it safe.
                </Text>
                <TouchableOpacity
                  style={[styles.stepActionBtn, { borderColor: colors.border }]}
                  onPress={() => {
                    setShowTransferModal(false);
                    router.push('/profile/backup-key');
                  }}
                >
                  <Text style={[styles.stepActionText, { color: colors.primary }]}>Open Recovery Key →</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.guideStep, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.stepNumberBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepInfo}>
                <Text style={[styles.stepTitle, { color: colors.foreground }]}>Export your Backup File (.d5b)</Text>
                <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>
                  Tap "Export backup file" to send the encrypted `.d5b` file to your new phone via Google Drive, Nearby Share, or email.
                </Text>
                <TouchableOpacity
                  style={[styles.stepActionBtn, { borderColor: colors.border }]}
                  onPress={() => {
                    setShowTransferModal(false);
                    handleExport();
                  }}
                >
                  <Text style={[styles.stepActionText, { color: colors.primary }]}>Export Backup Now →</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.guideStep, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.stepNumberBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepInfo}>
                <Text style={[styles.stepTitle, { color: colors.foreground }]}>Restore on your New Device</Text>
                <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>
                  Install Dear Day on your new device. In Data & Privacy:{"\n\n"}
                  a) Tap "Recovery Key" → "Enter recovery key" and paste your 64-character key.{"\n\n"}
                  b) Tap "Import backup file" and pick the `.d5b` file. All your daily moments and books will decrypt instantly.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.modalCloseBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowTransferModal(false)}
            >
              <Text style={[styles.modalCloseBtnText, { color: colors.primaryForeground }]}>Got it</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

export default function PrivacyScreen() {
  return <ProtectedScreen><PrivacyContent /></ProtectedScreen>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 18 },
  content: { padding: 20, gap: 12, paddingBottom: 40 },
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 14,
  },
  infoText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', letterSpacing: 0.8, textTransform: 'uppercase' },
  card: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  rowMeta: { flex: 1, gap: 2 },
  rowLabel: { fontSize: 15, fontFamily: 'Inter_400Regular' },
  rowSub: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 16 },
  connectBtn: { margin: 10, borderRadius: 10, justifyContent: 'center', gap: 8 },
  connectLabel: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  scheduleHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  footnote: {
    fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18,
    textAlign: 'center', paddingHorizontal: 8,
  },
  modalRoot: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: { fontSize: 20 },
  modalContent: { padding: 20, gap: 16, paddingBottom: 40 },
  guideStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  stepNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  stepInfo: { flex: 1, gap: 6 },
  stepTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  stepDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  stepActionBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  stepActionText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  modalCloseBtn: {
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  modalCloseBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
