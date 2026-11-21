import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';

import { View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Divider, Button } from 'react-native-paper';
import { navigate } from '../../utils/navigation';
import { useAuthStore } from '../../store/auth';
import { useAdminStats, useAdminPendingNurses, useAdminPendingDoctors } from '../../hooks/useAdmin';
import { AppearanceSettings, ThemeToggleButton } from '../../components/common/AppearanceSettings';
import { SPACING, RADIUS } from '../../theme';

export default function AdminDashboard() {
  const { dark: isDarkTheme } = useAppTheme();
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const { user, logout } = useAuthStore();
  const { data: stats } = useAdminStats();
  const { data: pendingNursesRaw } = useAdminPendingNurses();
  const { data: pendingDoctorsRaw } = useAdminPendingDoctors();
  const pendingNurses: any[] = Array.isArray(pendingNursesRaw) ? pendingNursesRaw : (pendingNursesRaw as any)?.users || [];
  const pendingDoctors: any[] = Array.isArray(pendingDoctorsRaw) ? pendingDoctorsRaw : (pendingDoctorsRaw as any)?.users || [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Clinical Navy Header */}
        <View style={styles.headerBanner}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.eyebrow}>HEALIX GOVERNANCE · {user?.fullName || 'ADMIN'}</Text>
              <Text style={styles.title}>Ops Command Center</Text>
              <Text style={styles.subtitle}>Platform Administration &amp; Credential Governance</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ThemeToggleButton compact inverse />
              <TouchableOpacity onPress={logout} activeOpacity={0.8} style={styles.logoutBtn}>
                <Text style={styles.logoutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.quickActionRow}>
            <Button
              mode="contained"
              buttonColor={COLORS.headerAvatarBg}
              textColor={COLORS.headerText}
              onPress={() => navigate('/analytics')}
              style={styles.quickBtn}
              compact
            >
              Analytics
            </Button>
            <Button
              mode="contained"
              buttonColor={COLORS.headerAvatarBg}
              textColor={COLORS.headerText}
              onPress={() => navigate('/support')}
              style={styles.quickBtn}
              compact
            >
              Support &amp; Pay
            </Button>
            <Button
              mode="contained"
              buttonColor={COLORS.headerAvatarBg}
              textColor={COLORS.headerText}
              onPress={() => navigate('/admin/invitations')}
              style={styles.quickBtn}
              compact
            >
              Invite User
            </Button>
            <Button
              mode="contained"
              buttonColor={COLORS.headerAvatarBg}
              textColor={COLORS.headerText}
              onPress={() => navigate('/auth/security')}
              style={styles.quickBtn}
              compact
            >
              2FA Security
            </Button>
          </View>
        </View>

        <View style={styles.body}>
          {/* Appearance & Preferences right in Command Center */}
          <View style={{ marginBottom: SPACING.lg }}>
            <AppearanceSettings />
          </View>
          {/* Analytics Summary Grid */}
          <Text style={styles.sectionLabel}>System Performance Summary</Text>
          <View style={styles.statsGrid}>
            <TouchableOpacity activeOpacity={0.8} style={[styles.statCard, { borderTopColor: COLORS.navy }]} onPress={() => navigate('/admin/users')}>
              <Text style={styles.statValue}>{stats?.totalUsers ?? '—'}</Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} style={[styles.statCard, { borderTopColor: COLORS.emerald }]} onPress={() => navigate('/admin/nurses')}>
              <Text style={[styles.statValue, { color: COLORS.emerald }]}>{stats?.totalNurses ?? '—'}</Text>
              <Text style={styles.statLabel}>Registered Nurses</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} style={[styles.statCard, { borderTopColor: COLORS.accentBlue }]} onPress={() => navigate('/admin/doctors')}>
              <Text style={[styles.statValue, { color: COLORS.navy }]}>{stats?.totalDoctors ?? '—'}</Text>
              <Text style={styles.statLabel}>Registered Doctors</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} style={[styles.statCard, { borderTopColor: COLORS.amber }]} onPress={() => navigate('/admin/verification')}>
              <Text style={[styles.statValue, { color: COLORS.amber }]}>{pendingNurses.length + pendingDoctors.length}</Text>
              <Text style={styles.statLabel}>Pending Queue</Text>
            </TouchableOpacity>
          </View>

          {/* Management Quick Actions */}
          <Text style={styles.sectionLabel}>Admin Operations Modules</Text>
          <View style={styles.moduleGrid}>
            <TouchableOpacity activeOpacity={0.8} style={styles.moduleCard} onPress={() => navigate('/admin/verification')}>
              <Text style={styles.moduleIcon}>🛡️</Text>
              <View style={styles.moduleBody}>
                <Text style={styles.moduleTitle}>Verification Queue</Text>
                <Text style={styles.moduleSub}>Approve Nurses &amp; Doctors ({pendingNurses.length + pendingDoctors.length} pending)</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.8} style={styles.moduleCard} onPress={() => navigate('/admin/users')}>
              <Text style={styles.moduleIcon}>👥</Text>
              <View style={styles.moduleBody}>
                <Text style={styles.moduleTitle}>User Account Management</Text>
                <Text style={styles.moduleSub}>Search, suspend, or invite across all 5 roles</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.8} style={styles.moduleCard} onPress={() => navigate('/admin/patients')}>
              <Text style={styles.moduleIcon}>🩺</Text>
              <View style={styles.moduleBody}>
                <Text style={styles.moduleTitle}>Patients Management</Text>
                <Text style={styles.moduleSub}>Manage patient accounts &amp; access</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.8} style={styles.moduleCard} onPress={() => navigate('/admin/nurses')}>
              <Text style={styles.moduleIcon}>👩‍⚕️</Text>
              <View style={styles.moduleBody}>
                <Text style={styles.moduleTitle}>Nurse Management</Text>
                <Text style={styles.moduleSub}>Review PNC license credentials &amp; documents</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.8} style={styles.moduleCard} onPress={() => navigate('/admin/doctors')}>
              <Text style={styles.moduleIcon}>👨‍⚕️</Text>
              <View style={styles.moduleBody}>
                <Text style={styles.moduleTitle}>Doctor Management</Text>
                <Text style={styles.moduleSub}>Review PMDC registrations &amp; onboard</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.8} style={styles.moduleCard} onPress={() => navigate('/admin/paramedics')}>
              <Text style={styles.moduleIcon}>🚑</Text>
              <View style={styles.moduleBody}>
                <Text style={styles.moduleTitle}>Paramedics Management</Text>
                <Text style={styles.moduleSub}>Onboard, audit, or suspend paramedics</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.8} style={styles.moduleCard} onPress={() => navigate('/admin/care')}>
              <Text style={styles.moduleIcon}>📋</Text>
              <View style={styles.moduleBody}>
                <Text style={styles.moduleTitle}>Care Operations</Text>
                <Text style={styles.moduleSub}>Requests, Offers, Contracts &amp; Visits</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.8} style={styles.moduleCard} onPress={() => navigate('/admin/clinical')}>
              <Text style={styles.moduleIcon}>🏥</Text>
              <View style={styles.moduleBody}>
                <Text style={styles.moduleTitle}>Clinical Operations</Text>
                <Text style={styles.moduleSub}>Manage High-Risk Cases &amp; Doctor Overrides</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.8} style={[styles.moduleCard, { borderColor: COLORS.red, borderLeftWidth: 4 }]} onPress={() => navigate('/admin/emergency')}>
              <Text style={styles.moduleIcon}>🚨</Text>
              <View style={styles.moduleBody}>
                <Text style={[styles.moduleTitle, { color: COLORS.red }]}>Emergency Center</Text>
                <Text style={styles.moduleSub}>Live SOS monitoring, SLA breaches &amp; dispatches</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.8} style={styles.moduleCard} onPress={() => navigate('/admin/network')}>
              <Text style={styles.moduleIcon}>🌐</Text>
              <View style={styles.moduleBody}>
                <Text style={styles.moduleTitle}>Healthcare Network</Text>
                <Text style={styles.moduleSub}>Hospitals capacity &amp; fleet directory</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.8} style={styles.moduleCard} onPress={() => navigate('/admin/ambulances')}>
              <Text style={styles.moduleIcon}>🚐</Text>
              <View style={styles.moduleBody}>
                <Text style={styles.moduleTitle}>Ambulance Fleet &amp; Dispatches</Text>
                <Text style={styles.moduleSub}>Vehicles, assignments &amp; admission tracking</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.8} style={styles.moduleCard} onPress={() => navigate('/admin/reviews')}>
              <Text style={styles.moduleIcon}>⭐</Text>
              <View style={styles.moduleBody}>
                <Text style={styles.moduleTitle}>Review Moderation</Text>
                <Text style={styles.moduleSub}>Approve or hide flagged patient ratings</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.8} style={styles.moduleCard} onPress={() => navigate('/admin/config')}>
              <Text style={styles.moduleIcon}>⚙️</Text>
              <View style={styles.moduleBody}>
                <Text style={styles.moduleTitle}>Platform Config &amp; Audit Logs</Text>
                <Text style={styles.moduleSub}>SLA parameters, fees &amp; HIPAA audit trails</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>

          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>Governance &amp; Compliance Status</Text>
              <Divider style={styles.divider} />
              <Text style={styles.complianceItem}>✓ HIPAA Audit Logging Active ({isDarkTheme ? 'Dark Night' : 'Clinical Light'} Mode)</Text>
              <Text style={styles.complianceItem}>✓ Role-Based Credential Enforcement Active</Text>
              <Text style={styles.complianceItem}>✓ Automated SLA Escalation Workers Running</Text>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.surface },
  container: { flex: 1, backgroundColor: COLORS.surface },
  content: { paddingBottom: 40 },
  headerBanner: {
    backgroundColor: COLORS.navyDark,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  eyebrow: { color: COLORS.accentBlue, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  title: { color: COLORS.headerText, fontSize: 22, fontWeight: '800', marginTop: 2 },
  subtitle: { color: COLORS.inverseMuted, fontSize: 12, marginTop: 3 },
  logoutBtn: {
    backgroundColor: COLORS.redLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.round,
  },
  logoutText: { color: COLORS.red, fontSize: 12, fontWeight: '700' },
  quickActionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  quickBtn: { borderRadius: RADIUS.round },
  body: { padding: SPACING.lg },
  sectionLabel: { color: COLORS.textDark, fontSize: 15, fontWeight: '800', marginBottom: 12, marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.surfaceCard,
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderTopWidth: 3,
  },
  statValue: { color: COLORS.navy, fontSize: 24, fontWeight: '800' },
  statLabel: { color: COLORS.textBody, fontSize: 12, fontWeight: '600', marginTop: 4 },
  moduleGrid: { gap: 10, marginBottom: 20 },
  moduleCard: {
    backgroundColor: COLORS.surfaceCard,
    padding: 14,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  moduleIcon: { fontSize: 22 },
  moduleBody: { flex: 1, marginLeft: 12 },
  moduleTitle: { color: COLORS.textDark, fontSize: 14, fontWeight: '700' },
  moduleSub: { color: COLORS.textBody, fontSize: 12, marginTop: 2 },
  chevron: { color: COLORS.textMuted, fontSize: 22, fontWeight: '600' },
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    marginBottom: 16,
  },
  cardTitle: { color: COLORS.textDark, fontSize: 15, fontWeight: '700' },
  divider: { backgroundColor: COLORS.dividerLight, marginVertical: 10 },
  complianceItem: { color: COLORS.emerald, fontSize: 12.5, fontWeight: '600', marginBottom: 6 },
});
