import React from 'react';
import { StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { router, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import { SPACING, TYPOGRAPHY } from '../../theme';
import { useAuthStore } from '../../store/auth';
import { getDashboardRoute } from '../../utils/authRouting';

/** Screens that already draw their own header with a back button (avoid showing two). */
const HAS_OWN_HEADER = [
  'admin/care', 'admin/emergency', 'admin/reviews', 'admin/clinical',
  '(doctor)/action', '(doctor)/careplan', '(doctor)/messages/chat',
  '(nurse)/messages/chat', '(patient)/messages/chat',
  '(patient)/profile/emergency-contacts', '(patient)/records/risk-history',
  '(patient)/health/medical', '(patient)/requests/new',
];

/** Friendly titles for route folders and files. Anything missing is prettified automatically. */
const TITLES: Record<string, string> = {
  marketplace: 'Marketplace', contracts: 'Contracts', favorites: 'Saved Nurses', requests: 'Care Requests',
  records: 'Health Records', 'risk-history': 'Risk History', health: 'My Health', medical: 'Medical History',
  careplans: 'Care Plans', 'care-plans': 'Care Plans', prescriptions: 'Prescriptions', caregivers: 'Caregivers',
  recurring: 'Recurring Care', notifications: 'Notifications', visits: 'Visits', messages: 'Messages', chat: 'Chat',
  ai: 'AI Assistant', profile: 'Profile', patients: 'Patients', schedule: 'Schedule', sync: 'Offline Sync',
  emergency: 'Emergency', analytics: 'Analytics', support: 'Support', adherence: 'Medication Adherence',
  reviews: 'Reviews', diagnosis: 'Diagnosis', careplan: 'Care Plan', action: 'Clinical Actions',
  users: 'Users', nurses: 'Nurses', doctors: 'Doctors', paramedics: 'Paramedics', ambulances: 'Ambulance Fleet',
  network: 'Hospital Network', invitations: 'Invitations', verification: 'Verification', config: 'Settings',
  audit: 'Audit Log', clinical: 'Clinical Operations', care: 'Care Operations', 'nurse-review': 'Nurse Review',
  security: 'Account Security', 'change-password': 'Change Password', new: 'New Request',
};

function prettify(name: string) {
  return TITLES[name] ?? name.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function titleFor(parts: string[]) {
  const last = parts[parts.length - 1];
  if (!last) return '';
  if (last.startsWith('[')) {
    const parent = parts[parts.length - 2] ?? '';
    const label = prettify(parent).replace(/s$/, '');
    return parent ? `${label} Details` : 'Details';
  }
  if (last === 'index') return prettify(parts[parts.length - 2] ?? '');
  return prettify(last);
}

/**
 * Top bar with a back arrow for every inner screen. Back always returns to the previous
 * screen; only when there is no history (e.g. opened from a link) does it go to the dashboard.
 */
export function BackBar() {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const role = useAuthStore(state => state.user?.role);
  const segments = useSegments() as string[];
  const path = segments.join('/');

  const isRoot = segments.length === 0
    || segments.includes('(tabs)')
    || path === 'admin' || path === 'admin/index'
    || path === '(paramedic)' || path === '(paramedic)/index'
    || segments[0] === 'auth' && !['security', 'change-password'].includes(segments[1] ?? '')
    || segments[0] === 'unsupported-role';
  if (isRoot || width > 768 || HAS_OWN_HEADER.some(prefix => path.startsWith(prefix))) return null;

  const visible = segments.filter(s => !(s.startsWith('(') && s.endsWith(')')));
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace((role ? getDashboardRoute(role) : '/auth/login') as any);
  };

  return (
    <View style={[styles.bar, { paddingTop: Math.max(insets.top, SPACING.sm) }]}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" onPress={goBack} style={styles.back} hitSlop={12}>
        <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.title} numberOfLines={1}>{titleFor(visible)}</Text>
      <View style={styles.back} />
    </View>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingHorizontal: SPACING.sm, paddingBottom: SPACING.sm },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', ...TYPOGRAPHY.bodyMedium, fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
});
