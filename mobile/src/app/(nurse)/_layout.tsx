import { useAppTheme, useThemeValue, usePaperTheme } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import React from 'react';
import { View, StyleSheet, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';
import { Stack, usePathname } from 'expo-router';
import { navigate } from '../../utils/navigation';
import { Text, Avatar, PaperProvider } from 'react-native-paper';
import { useAuthStore } from '../../store/auth';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

function NurseRootLayout() {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const { user } = useAuthStore();
  const { width } = useWindowDimensions();
  const pathname = usePathname();

  const isLargeScreen = width > 768;

  if (isLargeScreen) {
    const navItems = [
      { name: 'Dashboard', path: '/(nurse)/(tabs)/home', icon: 'home-outline' },
      { name: 'My Visits', path: '/(nurse)/(tabs)/visits', icon: 'medkit-outline' },
      { name: 'Marketplace', path: '/(nurse)/(tabs)/marketplace', icon: 'briefcase-outline' },
      { name: 'Messages', path: '/(nurse)/(tabs)/messages', icon: 'chatbubbles-outline' },
      { name: 'Profile', path: '/(nurse)/(tabs)/profile', icon: 'person-outline' },
    ];

    const currentActive = pathname;

    return (
      <View style={styles.webContainer}>
        <View style={styles.sidebar}>
          <View style={styles.sidebarHeader}>
            <Text style={styles.brandTitle}>Healix Pro</Text>
            <Text style={styles.brandSub}>Nurse Portal</Text>
          </View>

          <View style={styles.sidebarProfile}>
            <Avatar.Icon size={40} icon="medical-bag" color={COLORS.emerald} style={styles.avatarBg} />
            <View style={styles.profileTextWrap}>
              <Text style={styles.sidebarProfileName} numberOfLines={1}>{user?.fullName ?? 'Nurse'}</Text>
              <Text style={styles.sidebarProfileRole}>Nurse account</Text>
            </View>
          </View>

          <View style={styles.navMenu}>
            {navItems.map((item: any) => {
              const isActive = currentActive.startsWith(item.path.replace(/\/\([^)]+\)/g, '')) || (item.path === '/(nurse)/(tabs)/home' && (currentActive === '/' || currentActive === '/(nurse)'));
              return (
                <TouchableOpacity
                  key={item.path}
                  style={[styles.sidebarNavItem, isActive && styles.sidebarNavItemActive]}
                  onPress={() => navigate(item.path as any)}
                >
                  <Ionicons name={item.icon} size={20} color={isActive ? COLORS.emerald : COLORS.textBody} style={{ width: 24 }} />
                  <Text style={[styles.sidebarNavLabel, isActive && styles.sidebarNavLabelActive]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.sidebarFooter}>
            <Text style={styles.encryptionNotice}>Care team portal</Text>
          </View>
        </View>

        <View style={styles.webContent}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="patients" />
            <Stack.Screen name="schedule" />
            <Stack.Screen name="sync" />
            <Stack.Screen name="ai" />
          </Stack>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}><Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="patients" />
      <Stack.Screen name="schedule" />
      <Stack.Screen name="sync" />
      <Stack.Screen name="ai" />
    </Stack></View>
  );
}

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  webContainer: { flex: 1, flexDirection: 'row', backgroundColor: COLORS.bg },
  sidebar: { width: 250, backgroundColor: COLORS.navyDark, borderRightWidth: 1, borderRightColor: COLORS.emeraldLight, paddingVertical: SPACING.xl, paddingHorizontal: SPACING.md, justifyContent: 'space-between' },
  sidebarHeader: { marginBottom: SPACING.xl, paddingHorizontal: SPACING.sm },
  brandTitle: { ...TYPOGRAPHY.h2, color: COLORS.headerText, fontWeight: 'bold', letterSpacing: -0.5 },
  brandSub: { color: COLORS.textSecondary, marginTop: SPACING.xs },
  sidebarProfile: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, backgroundColor: COLORS.bg, borderRadius: RADIUS.md, marginBottom: SPACING.xl, borderWidth: 0.5, borderColor: COLORS.emeraldLight },
  avatarBg: { backgroundColor: COLORS.emeraldLight },
  profileTextWrap: { marginLeft: SPACING.sm, flex: 1 },
  sidebarProfileName: { color: COLORS.textDark, fontSize: TYPOGRAPHY.sizes.sm, fontWeight: 'bold' },
  sidebarProfileRole: { color: COLORS.emerald, fontSize: 10, marginTop: 2 },
  navMenu: { flex: 1, gap: SPACING.xs },
  sidebarNavItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, paddingHorizontal: SPACING.md, borderRadius: RADIUS.sm, backgroundColor: COLORS.transparent },
  sidebarNavItemActive: { backgroundColor: COLORS.emeraldLight },
  sidebarNavLabel: { color: COLORS.textBody, fontSize: TYPOGRAPHY.sizes.sm, fontWeight: '500', marginLeft: SPACING.sm },
  sidebarNavLabelActive: { color: COLORS.emerald, fontWeight: 'bold' },
  sidebarFooter: { borderTopWidth: 1, borderTopColor: COLORS.glassBorder, paddingTop: SPACING.md },
  encryptionNotice: { color: COLORS.textBody, fontSize: 11, textAlign: 'center' },
  webContent: { flex: 1, backgroundColor: COLORS.surface },
}));


export default function NurseLayout() {
  const { colors: COLORS } = useAppTheme();
  const paperTheme = usePaperTheme();
 return <PaperProvider theme={paperTheme}><NurseRootLayout /></PaperProvider>; }
