import { useAppTheme, useThemeValue } from '../../../theme/ThemeProvider';
import type { ThemeColors } from '../../../theme';
import { ScrollView, View, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Button, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/auth';
import { authApi } from '../../../api/auth.api';
import { navigate } from '../../../utils/navigation';
import { AppearanceSettings, ThemeToggleButton } from '../../../components/common/AppearanceSettings';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../../theme';

export default function DoctorProfileScreen() {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const { user, logout } = useAuthStore();
  const profile = useQuery({ queryKey: ['doctor', 'profile', user?.id], queryFn: authApi.getMe });
  const current = profile.data || user;
  const doctor = profile.data?.doctor;

  const initials = (current?.fullName || 'Dr')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0])
    .join('');

  const quickActions: Array<{
    title: string;
    sub: string;
    path: string;
    icon: any;
    bg: string;
    fg: string;
  }> = [
    { title: 'Review Patient Cases', sub: 'High-risk clinical queue & escalations', path: '/(doctor)/(tabs)/home', icon: 'medkit-outline', bg: COLORS.blueLight, fg: COLORS.navy },
    { title: 'Emergency Dispatches & Admissions', sub: 'Ambulance tracking & hospital capacity', path: '/(doctor)/emergency', icon: 'medical-outline', bg: COLORS.redLight, fg: COLORS.red },
    { title: 'Clinical Messages', sub: 'Communicate with nurses & patients', path: '/(doctor)/(tabs)/messages', icon: 'chatbubbles-outline', bg: COLORS.emeraldLight, fg: COLORS.emerald },
    { title: 'Analytics & Reports', sub: 'View clinical review metrics & CSV export', path: '/analytics', icon: 'analytics-outline', bg: COLORS.purpleLight, fg: COLORS.purple },
    { title: 'Change Password', sub: 'Update account password', path: '/auth/change-password', icon: 'lock-closed-outline', bg: COLORS.surfaceMuted, fg: COLORS.textDark },
    { title: 'Two-Step Verification', sub: 'Email OTP sign-in protection', path: '/auth/security', icon: 'shield-checkmark-outline', bg: COLORS.emeraldLight, fg: COLORS.emerald },
  ];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Clinical Navy Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroTopBar}>
            <Text style={styles.heroEyebrow}>CONSULTANT PHYSICIAN</Text>
            <ThemeToggleButton compact inverse />
          </View>

          <View style={styles.heroCenter}>
            <Avatar.Text
              size={76}
              label={initials}
              style={styles.avatar}
              color={COLORS.headerText}
              labelStyle={{ fontWeight: '800', fontSize: 26 }}
            />
            <Text style={styles.heroName}>{current?.fullName || 'Doctor'}</Text>

            <View style={styles.badgeRow}>
              <View style={styles.heroPill}>
                <Ionicons
                  name={doctor?.verificationStatus === 'VERIFIED' ? 'checkmark-circle' : 'time-outline'}
                  size={14}
                  color={doctor?.verificationStatus === 'VERIFIED' ? COLORS.emerald : COLORS.amber}
                />
                <Text style={styles.heroPillText}>
                  {doctor?.verificationStatus || current?.status || 'ACTIVE'}
                </Text>
              </View>
              {doctor?.pmdcNumber && (
                <View style={styles.heroPill}>
                  <Text style={styles.heroPillText}>PMDC: {doctor.pmdcNumber}</Text>
                </View>
              )}
            </View>

            <Text style={styles.heroContact}>
              {current?.email || 'Email not provided'} · {current?.phone || 'Phone not provided'}
            </Text>
          </View>
        </View>

        <View style={styles.body}>
          {/* Credentials Card */}
          <View style={styles.card}>
            <Text style={styles.cardEyebrow}>PRACTICE &amp; CREDENTIALS</Text>
            <Text style={styles.title}>Professional Details</Text>
            {profile.isLoading ? (
              <ActivityIndicator color={COLORS.primaryText} />
            ) : profile.error ? (
              <View style={{ gap: SPACING.sm }}>
                <Text accessibilityRole="alert" style={styles.error}>
                  {(profile.error as Error).message}
                </Text>
                <Button mode="outlined" compact onPress={() => void profile.refetch()}>
                  Retry
                </Button>
              </View>
            ) : (
              <View style={styles.statGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>PMDC Number</Text>
                  <Text style={styles.statValue}>{doctor?.pmdcNumber || 'Not set'}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Emergency Status</Text>
                  <Text
                    style={[
                      styles.statValue,
                      { color: doctor?.emergencyAvailable ? COLORS.emerald : COLORS.amber },
                    ]}
                  >
                    {doctor ? (doctor.emergencyAvailable ? 'Available' : 'Unavailable') : 'Unknown'}
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Verification</Text>
                  <Text style={styles.statValue}>{doctor?.verificationStatus || 'Unavailable'}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Account</Text>
                  <Text style={styles.statValue}>{(current?.status || 'ACTIVE').replaceAll('_', ' ')}</Text>
                </View>
              </View>
            )}
            {!!doctor?.bio && <Text style={styles.bodyText}>{doctor.bio}</Text>}
          </View>

          {/* Dark / Light Appearance Card */}
          <AppearanceSettings />

          <Text style={styles.sectionHeading}>Clinical Actions &amp; Settings</Text>
          <View style={styles.menuList}>
            {quickActions.map(item => (
              <TouchableOpacity
                key={item.path}
                style={styles.menuCard}
                activeOpacity={0.8}
                onPress={() => navigate(item.path as any)}
              >
                <View style={[styles.menuIconBg, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={20} color={item.fg} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSub}>{item.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.signOutBtn} onPress={() => void logout()} activeOpacity={0.85}>
            <Ionicons name="log-out-outline" size={18} color={COLORS.red} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.surface },
    scrollContent: { paddingBottom: 38 },
    heroBanner: {
      backgroundColor: COLORS.navyDark,
      paddingTop: SPACING.lg,
      paddingBottom: SPACING.xxl,
      paddingHorizontal: SPACING.lg,
      borderBottomLeftRadius: RADIUS.xl,
      borderBottomRightRadius: RADIUS.xl,
    },
    heroTopBar: {
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
    avatar: {
      backgroundColor: COLORS.navy,
      borderWidth: 3,
      borderColor: COLORS.accentBlue,
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
    cardEyebrow: {
      color: COLORS.textMuted,
      fontSize: 10.5,
      fontWeight: '800',
      letterSpacing: 0.7,
    },
    title: {
      fontSize: TYPOGRAPHY.sizes.lg,
      fontWeight: TYPOGRAPHY.weights.bold,
      color: COLORS.textDark,
    },
    bodyText: {
      color: COLORS.textBody,
      fontSize: TYPOGRAPHY.sizes.sm,
      lineHeight: 20,
    },
    error: { color: COLORS.red },
    statGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.sm,
      marginTop: 4,
    },
    statBox: {
      width: '48%',
      backgroundColor: COLORS.surface,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: COLORS.inputBorder,
      padding: SPACING.sm,
    },
    statLabel: {
      color: COLORS.textMuted,
      fontSize: 11,
      fontWeight: '600',
    },
    statValue: {
      color: COLORS.textDark,
      fontSize: 13.5,
      fontWeight: '800',
      marginTop: 2,
    },
    sectionHeading: {
      color: COLORS.textDark,
      fontSize: TYPOGRAPHY.sizes.md,
      fontWeight: '800',
    },
    menuList: { gap: SPACING.sm },
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
