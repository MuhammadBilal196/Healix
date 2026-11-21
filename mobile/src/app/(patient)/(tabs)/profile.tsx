
import { useAppTheme, useThemeValue } from '../../../theme/ThemeProvider';
import type { ThemeColors } from '../../../theme';
import { appAlert } from '../../../components/common/AppDialogs';
import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Avatar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../store/auth';
import { navigate } from '../../../utils/navigation';
import { AppearanceSettings, ThemeToggleButton } from '../../../components/common/AppearanceSettings';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../../theme';

export default function ProfileScreen() {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const { user, logout } = useAuthStore();

  const userName = user?.fullName || 'Patient Profile';
  const userPhone = user?.phone || 'Phone not provided';
  const userEmail = user?.email || 'Email not provided';
  const initials = userName.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2) || 'P';

  const accountItems = [
    { id: 'personal', title: 'Personal Information', sub: 'Name, address, CNIC & contact info', icon: 'person-outline' as const, bg: COLORS.blueLight, fg: COLORS.navy, route: '/(patient)/profile/edit' },
    { id: 'emergency', title: 'Emergency Contacts', sub: 'Next-of-kin & rapid response list', icon: 'warning-outline' as const, bg: COLORS.redLight, fg: COLORS.red, route: '/(patient)/profile/emergency-contacts' },
    { id: 'medical', title: 'Medical Information', sub: 'Allergies, conditions & medications', icon: 'medkit-outline' as const, bg: COLORS.emeraldLight, fg: COLORS.emerald, route: '/(patient)/health/medical' },
    { id: 'payments', title: 'Payment History', sub: 'Receipts & visit invoices', icon: 'card-outline' as const, bg: COLORS.purpleLight, fg: COLORS.purple, route: '/(patient)/health/payments' },
    { id: 'support', title: 'Refunds & Care Concerns', sub: 'Submit or track support cases', icon: 'chatbox-ellipses-outline' as const, bg: COLORS.amberLight, fg: COLORS.amber, route: '/support' },
    { id: 'analytics', title: 'Analytics & Reports', sub: 'Exportable health & care metrics', icon: 'analytics-outline' as const, bg: COLORS.blueLight, fg: COLORS.iconBlue, route: '/analytics' },
  ];

  const securityItems = [
    { id: 'settings', title: 'All Account Settings', sub: 'Preferences, notifications & help', icon: 'settings-outline' as const, bg: COLORS.blueLight, fg: COLORS.navy, route: '/(patient)/profile/settings' },
    { id: 'password', title: 'Change Password', sub: 'Update your login credentials', icon: 'lock-closed-outline' as const, bg: COLORS.surfaceMuted, fg: COLORS.textDark, route: '/auth/change-password' },
    { id: '2fa', title: 'Two-Step Verification', sub: 'Email OTP sign-in protection', icon: 'shield-checkmark-outline' as const, bg: COLORS.emeraldLight, fg: COLORS.emerald, route: '/auth/security' },
  ];

  const handleLogout = () => appAlert('Sign Out', 'Sign out of your Healix account?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Sign Out', onPress: () => void logout() },
  ]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Clinical Navy Hero Profile Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroTopBar}>
            <Text style={styles.heroEyebrow}>PATIENT ACCOUNT</Text>
            <ThemeToggleButton compact inverse />
          </View>

          <View style={styles.heroCenter}>
            <Avatar.Text
              size={76}
              label={initials}
              style={styles.avatarBg}
              color={COLORS.headerText}
              labelStyle={{ fontWeight: '800', fontSize: 26 }}
            />
            <Text style={styles.heroName}>{userName}</Text>
            <View style={styles.statusPill}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.emerald} />
              <Text style={styles.statusPillText}>
                {(user?.status || 'ACTIVE').replaceAll('_', ' ')} · Patient Portal
              </Text>
            </View>
            <View style={styles.contactChipRow}>
              <View style={styles.contactChip}>
                <Ionicons name="call-outline" size={13} color={COLORS.inverseMuted} />
                <Text style={styles.contactChipText}>{userPhone}</Text>
              </View>
              <View style={styles.contactChip}>
                <Ionicons name="mail-outline" size={13} color={COLORS.inverseMuted} />
                <Text style={styles.contactChipText}>{userEmail}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          {/* Instant Appearance / Dark Mode Card */}
          <AppearanceSettings />

          <Text style={styles.sectionLabel}>Health &amp; Profile Management</Text>
          <View style={styles.menuList}>
            {accountItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuCard}
                onPress={() => navigate(item.route as any)}
                activeOpacity={0.8}
              >
                <View style={[styles.menuIconBg, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={20} color={item.fg} />
                </View>
                <View style={styles.menuTextWrap}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSub}>{item.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Security &amp; Preferences</Text>
          <View style={styles.menuList}>
            {securityItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuCard}
                onPress={() => navigate(item.route as any)}
                activeOpacity={0.8}
              >
                <View style={[styles.menuIconBg, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={20} color={item.fg} />
                </View>
                <View style={styles.menuTextWrap}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSub}>{item.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout} activeOpacity={0.85}>
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
    safeArea: {
      flex: 1,
      backgroundColor: COLORS.surface,
    },
    scrollContent: {
      paddingBottom: 36,
    },
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
    avatarBg: {
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
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: COLORS.headerAvatarBg,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: RADIUS.round,
    },
    statusPillText: {
      color: COLORS.headerText,
      fontSize: 11.5,
      fontWeight: '700',
    },
    contactChipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 8,
      marginTop: 6,
    },
    contactChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: 'rgba(255,255,255,0.1)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: RADIUS.round,
    },
    contactChipText: {
      color: COLORS.inverseMuted,
      fontSize: 11.5,
      fontWeight: '600',
    },
    body: {
      padding: SPACING.lg,
      gap: SPACING.lg,
    },
    sectionLabel: {
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
      shadowColor: COLORS.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 1,
    },
    menuIconBg: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: SPACING.md,
    },
    menuTextWrap: {
      flex: 1,
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
      marginTop: SPACING.xs,
    },
    signOutText: {
      color: COLORS.red,
      fontSize: TYPOGRAPHY.sizes.sm,
      fontWeight: '800',
    },
  });

