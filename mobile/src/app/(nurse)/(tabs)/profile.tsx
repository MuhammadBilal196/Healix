import { useAppTheme, usePaperTheme, useThemeValue } from '../../../theme/ThemeProvider';
import type { ThemeColors } from '../../../theme';
import { useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Avatar, Button, TextInput, PaperProvider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/auth';
import { useNurseProfile, useNurseVerification, useDeleteQualification } from '../../../hooks/useNurse';
import { apiClient } from '../../../api/client';
import { uploadFile } from '../../../utils/fileTransfer';
import { navigate } from '../../../utils/navigation';
import { EditBioModal } from '../../../components/nurse/EditBioModal';
import { EditQualificationModal } from '../../../components/nurse/EditQualificationModal';
import { EditSpecializationModal } from '../../../components/nurse/EditSpecializationModal';
import { AppearanceSettings, ThemeToggleButton } from '../../../components/common/AppearanceSettings';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../../theme';

export default function NurseProfileScreen() {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);
  const paperTheme = usePaperTheme();

  const { user, logout } = useAuthStore();
  const id = user?.nurseId || '';
  const q = useNurseProfile(id);
  const verification = useNurseVerification(id);
  const remove = useDeleteQualification();
  const qc = useQueryClient();

  const [modal, setModal] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [certificate, setCertificate] = useState<Record<string, string>>({});

  const run = async (task: () => Promise<unknown>) => {
    setBusy(true);
    setError('');
    try {
      await task();
      await qc.invalidateQueries({ queryKey: ['nurse', id] });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const photo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled) {
        await run(() =>
          uploadFile(`/nurses/${id}/photo`, {
            uri: result.assets[0].uri,
            name: result.assets[0].fileName || 'photo.jpg',
            mimeType: result.assets[0].mimeType,
          })
        );
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  const p = q.data;
  const initials = (p?.user.fullName || user?.fullName || 'N')
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .slice(0, 2);

  const navLinks: Array<{
    label: string;
    sub: string;
    path: string;
    icon: any;
    bg: string;
    fg: string;
  }> = [
    { label: 'Availability & Time Off', sub: 'Weekly shifts & vacation schedule', path: '/(nurse)/profile/availability', icon: 'calendar-outline', bg: COLORS.blueLight, fg: COLORS.navy },
    { label: 'Recorded Earnings', sub: 'Completed visit fees & ledger', path: '/(nurse)/profile/earnings', icon: 'wallet-outline', bg: COLORS.emeraldLight, fg: COLORS.emerald },
    { label: 'Performance & Badges', sub: 'Attendance, completion & clinical honors', path: '/(nurse)/profile/performance', icon: 'ribbon-outline', bg: COLORS.purpleLight, fg: COLORS.purple },
    { label: 'Patient Reviews', sub: 'Feedback & clinical ratings', path: '/(nurse)/profile/reviews', icon: 'star-outline', bg: COLORS.amberLight, fg: COLORS.amber },
    { label: 'Analytics & Reports', sub: 'Export CSV clinical summaries', path: '/analytics', icon: 'analytics-outline', bg: COLORS.blueLight, fg: COLORS.iconBlue },
    { label: 'Change Password', sub: 'Update login credentials', path: '/auth/change-password', icon: 'lock-closed-outline', bg: COLORS.surfaceMuted, fg: COLORS.textDark },
    { label: 'Two-Step Verification', sub: 'Email OTP sign-in protection', path: '/auth/security', icon: 'shield-checkmark-outline', bg: COLORS.emeraldLight, fg: COLORS.emerald },
  ];

  const loadError = error || q.error?.message || verification.error?.message;

  return (
    <PaperProvider theme={paperTheme}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="light-content" />
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Clinical Navy Hero Banner */}
          <View style={styles.heroBanner}>
            <View style={styles.heroTopRow}>
              <Text style={styles.heroEyebrow}>NURSE PRACTITIONER</Text>
              <ThemeToggleButton compact inverse />
            </View>

            <View style={styles.heroCenter}>
              {p?.photoUrl ? (
                <Avatar.Image size={78} source={{ uri: p.photoUrl }} style={styles.avatarRing} />
              ) : (
                <Avatar.Text
                  size={78}
                  label={initials}
                  style={styles.avatarBg}
                  color={COLORS.headerText}
                  labelStyle={{ fontWeight: '800', fontSize: 26 }}
                />
              )}
              <Text style={styles.heroName}>{p?.user.fullName || user?.fullName || 'Nurse Profile'}</Text>
              <View style={styles.badgeRow}>
                <View style={styles.heroPill}>
                  <Ionicons
                    name={verification.data?.isFullyVerified ? 'checkmark-circle' : 'time-outline'}
                    size={14}
                    color={verification.data?.isFullyVerified ? COLORS.emerald : COLORS.amber}
                  />
                  <Text style={styles.heroPillText}>
                    {verification.data?.isFullyVerified ? 'Verified Clinician' : 'Verification Pending'}
                  </Text>
                </View>
                {p?.pncNumber && (
                  <View style={styles.heroPill}>
                    <Text style={styles.heroPillText}>PNC: {p.pncNumber}</Text>
                  </View>
                )}
              </View>
              {p && (
                <Text style={styles.heroContact}>
                  {p.user.email} · {p.user.phone} · {p.experience || 0} yrs experience
                </Text>
              )}
            </View>
          </View>

          <View style={styles.body}>
            {q.isLoading && <ActivityIndicator color={COLORS.primaryText} style={{ marginVertical: SPACING.md }} />}
            {!!loadError && (
              <View style={styles.errorBanner}>
                <Text style={{ color: COLORS.red, fontWeight: '600', flex: 1 }} accessibilityRole="alert">
                  {loadError}
                </Text>
                <Button mode="outlined" compact textColor={COLORS.red} onPress={() => { void q.refetch(); void verification.refetch(); }}>
                  Retry
                </Button>
              </View>
            )}

            {p && (
              <>
                {/* Profile Overview & Bio Card */}
                <View style={styles.card}>
                  <Text style={styles.cardEyebrow}>CLINICAL PROFILE</Text>
                  <Text style={styles.cardTitle}>Biography &amp; Credentials</Text>
                  <Text style={styles.bodyText}>{p.bio || 'Add a concise professional biography so patients can learn about your care experience.'}</Text>
                  <View style={styles.statusRow}>
                    <View style={styles.infoBox}>
                      <Text style={styles.infoLabel}>Account Status</Text>
                      <Text style={styles.infoValue}>{p.user.status.replaceAll('_', ' ')}</Text>
                    </View>
                    <View style={styles.infoBox}>
                      <Text style={styles.infoLabel}>Experience</Text>
                      <Text style={styles.infoValue}>{p.experience || 0} Years</Text>
                    </View>
                  </View>
                  <View style={styles.actionRow}>
                    <Button
                      mode="contained"
                      buttonColor={COLORS.navy}
                      textColor={COLORS.onAccent}
                      icon="camera-outline"
                      compact
                      disabled={busy}
                      loading={busy}
                      onPress={() => void photo()}
                    >
                      Upload Photo
                    </Button>
                    <Button
                      mode="outlined"
                      textColor={COLORS.primaryText}
                      icon="pencil-outline"
                      compact
                      onPress={() => setModal('bio')}
                    >
                      Edit Bio
                    </Button>
                    <Button
                      mode="outlined"
                      textColor={COLORS.emerald}
                      icon="file-document-check-outline"
                      compact
                      onPress={() => navigate('/(nurse)/profile/verification')}
                    >
                      Documents
                    </Button>
                  </View>
                </View>

                {/* Appearance & Dark Mode Settings */}
                <AppearanceSettings />

                {/* Qualifications Card */}
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.cardEyebrow}>ACADEMIC &amp; NURSING DEGREES</Text>
                      <Text style={styles.cardTitle}>Qualifications</Text>
                    </View>
                    <Button
                      mode="contained-tonal"
                      compact
                      icon="plus"
                      onPress={() => setModal('qual')}
                    >
                      Add
                    </Button>
                  </View>
                  {p.qualifications.length === 0 && (
                    <Text style={styles.bodyText}>No qualifications listed yet.</Text>
                  )}
                  {p.qualifications.map(qual => (
                    <View key={qual.id} style={styles.subItemCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.subItemTitle}>{qual.title}</Text>
                        <Text style={styles.subItemMeta}>
                          {qual.issuingBody} · Class of {qual.yearObtained}
                        </Text>
                      </View>
                      <Button
                        compact
                        textColor={COLORS.red}
                        disabled={busy}
                        onPress={() => void run(() => remove.mutateAsync({ nurseId: id, qualId: qual.id }))}
                      >
                        Remove
                      </Button>
                    </View>
                  ))}
                </View>

                {/* Specializations Card */}
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.cardEyebrow}>CERTIFIED PRACTICE AREAS</Text>
                      <Text style={styles.cardTitle}>Specializations</Text>
                    </View>
                    <Button
                      mode="contained-tonal"
                      compact
                      icon="plus"
                      onPress={() => setModal('spec')}
                    >
                      Add
                    </Button>
                  </View>
                  {p.specializations.length === 0 && (
                    <Text style={styles.bodyText}>No specializations added yet.</Text>
                  )}
                  {p.specializations.map(spec => (
                    <View key={spec.id} style={styles.specCard}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.subItemTitle}>
                          {spec.specialization.replaceAll('_', ' ')}
                        </Text>
                        <View
                          style={[
                            styles.certBadge,
                            { backgroundColor: spec.certified ? COLORS.emeraldLight : COLORS.amberLight },
                          ]}
                        >
                          <Text
                            style={{
                              color: spec.certified ? COLORS.emerald : COLORS.amber,
                              fontSize: 10.5,
                              fontWeight: '800',
                            }}
                          >
                            {spec.certified ? 'APPROVED' : 'UNVERIFIED'}
                          </Text>
                        </View>
                      </View>
                      <TextInput
                        mode="outlined"
                        outlineColor={COLORS.inputBorder}
                        activeOutlineColor={COLORS.navy}
                        textColor={COLORS.textDark}
                        style={styles.input}
                        label="Certificate URL"
                        value={certificate[spec.id] ?? spec.certificateUrl ?? ''}
                        onChangeText={value => setCertificate(c => ({ ...c, [spec.id]: value }))}
                      />
                      <Button
                        mode="contained"
                        buttonColor={COLORS.navy}
                        textColor={COLORS.onAccent}
                        disabled={busy || !(certificate[spec.id] || spec.certificateUrl)}
                        onPress={() =>
                          void run(() =>
                            apiClient.put(`/nurses/${id}/specializations/${spec.id}/certificate`, {
                              certificateUrl: (certificate[spec.id] ?? spec.certificateUrl)?.trim(),
                            })
                          )
                        }
                      >
                        Submit Certificate for Review
                      </Button>
                    </View>
                  ))}
                </View>

                {/* Nurse Menu & Security Links */}
                {user?.status === 'ACTIVE' && (
                  <>
                    <Text style={styles.sectionHeading}>Practice, Finance &amp; Security</Text>
                    <View style={styles.menuList}>
                      {navLinks.map(item => (
                        <TouchableOpacity
                          key={item.path}
                          activeOpacity={0.8}
                          style={styles.menuCard}
                          onPress={() => navigate(item.path as any)}
                        >
                          <View style={[styles.menuIconBg, { backgroundColor: item.bg }]}>
                            <Ionicons name={item.icon} size={20} color={item.fg} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.menuTitle}>{item.label}</Text>
                            <Text style={styles.menuSub}>{item.sub}</Text>
                          </View>
                          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                <EditBioModal
                  visible={modal === 'bio'}
                  onClose={() => setModal('')}
                  nurseId={id}
                  initialBio={p.bio || ''}
                  initialExperience={String(p.experience || 0)}
                  initialPhotoUrl={p.photoUrl || ''}
                />
                <EditQualificationModal visible={modal === 'qual'} onClose={() => setModal('')} nurseId={id} />
                <EditSpecializationModal visible={modal === 'spec'} onClose={() => setModal('')} nurseId={id} />
              </>
            )}

            <TouchableOpacity style={styles.signOutBtn} onPress={() => void logout()} activeOpacity={0.85}>
              <Ionicons name="log-out-outline" size={18} color={COLORS.red} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </PaperProvider>
  );
}

const createStyles = (COLORS: ThemeColors) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.surface },
    scrollContent: { paddingBottom: 38 },
    heroBanner: {
      backgroundColor: COLORS.navyDark,
      paddingTop: SPACING.lg,
      paddingBottom: SPACING.xxl,
      paddingHorizontal: SPACING.lg,
      borderBottomLeftRadius: RADIUS.xl,
      borderBottomRightRadius: RADIUS.xl,
    },
    heroTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: SPACING.md,
    },
    heroEyebrow: {
      color: COLORS.accentBlue,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1,
    },
    heroCenter: {
      alignItems: 'center',
      gap: 6,
    },
    avatarRing: {
      borderWidth: 3,
      borderColor: COLORS.emerald,
      marginBottom: 4,
    },
    avatarBg: {
      backgroundColor: COLORS.navy,
      borderWidth: 3,
      borderColor: COLORS.emerald,
      marginBottom: 4,
    },
    heroName: {
      color: COLORS.headerText,
      fontSize: TYPOGRAPHY.sizes.xl,
      fontWeight: '800',
    },
    badgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 8,
    },
    heroPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: COLORS.headerAvatarBg,
      paddingHorizontal: 11,
      paddingVertical: 4,
      borderRadius: RADIUS.round,
    },
    heroPillText: {
      color: COLORS.headerText,
      fontSize: 11.5,
      fontWeight: '700',
    },
    heroContact: {
      color: COLORS.inverseMuted,
      fontSize: 11.5,
      marginTop: 4,
      textAlign: 'center',
    },
    body: {
      padding: SPACING.lg,
      gap: SPACING.lg,
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      backgroundColor: COLORS.redLight,
      borderWidth: 1,
      borderColor: COLORS.red,
      borderRadius: RADIUS.md,
      padding: SPACING.md,
    },
    card: {
      backgroundColor: COLORS.surfaceCard,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: COLORS.inputBorder,
      padding: SPACING.lg,
      gap: SPACING.sm,
      shadowColor: COLORS.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: SPACING.sm,
    },
    cardEyebrow: {
      color: COLORS.textMuted,
      fontSize: 10.5,
      fontWeight: '800',
      letterSpacing: 0.7,
    },
    cardTitle: {
      color: COLORS.textDark,
      fontSize: TYPOGRAPHY.sizes.lg,
      fontWeight: '800',
    },
    bodyText: {
      color: COLORS.textBody,
      fontSize: TYPOGRAPHY.sizes.sm,
      lineHeight: 20,
    },
    statusRow: {
      flexDirection: 'row',
      gap: SPACING.md,
      marginTop: 4,
    },
    infoBox: {
      flex: 1,
      backgroundColor: COLORS.surface,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: COLORS.inputBorder,
      padding: SPACING.sm,
    },
    infoLabel: {
      color: COLORS.textMuted,
      fontSize: 11,
      fontWeight: '600',
    },
    infoValue: {
      color: COLORS.textDark,
      fontSize: 13.5,
      fontWeight: '800',
      marginTop: 2,
    },
    actionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.sm,
      marginTop: 4,
    },
    subItemCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: SPACING.md,
      backgroundColor: COLORS.surface,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: COLORS.inputBorder,
    },
    subItemTitle: {
      color: COLORS.textDark,
      fontWeight: '700',
      fontSize: 14,
    },
    subItemMeta: {
      color: COLORS.textMuted,
      fontSize: 12,
      marginTop: 2,
    },
    specCard: {
      backgroundColor: COLORS.surface,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: COLORS.inputBorder,
      padding: SPACING.md,
      gap: SPACING.sm,
    },
    certBadge: {
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: RADIUS.round,
    },
    input: {
      backgroundColor: COLORS.surfaceCard,
    },
    sectionHeading: {
      color: COLORS.textDark,
      fontSize: TYPOGRAPHY.sizes.md,
      fontWeight: '800',
      marginTop: 2,
    },
    menuList: {
      gap: SPACING.sm,
    },
    menuCard: {
      backgroundColor: COLORS.surfaceCard,
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: COLORS.inputBorder,
    },
    menuIconBg: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: SPACING.md,
    },
    menuTitle: {
      color: COLORS.textDark,
      fontSize: TYPOGRAPHY.sizes.sm,
      fontWeight: '700',
    },
    menuSub: {
      color: COLORS.textMuted,
      fontSize: 11.5,
      marginTop: 1,
    },
    signOutBtn: {
      flexDirection: 'row',
      gap: 8,
      backgroundColor: COLORS.redLight,
      borderRadius: RADIUS.md,
      paddingVertical: SPACING.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: COLORS.red,
    },
    signOutText: {
      color: COLORS.red,
      fontSize: TYPOGRAPHY.sizes.sm,
      fontWeight: '800',
    },
  });
