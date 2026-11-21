import { useAppTheme, useThemeValue } from '../../../theme/ThemeProvider';
import type { ThemeColors } from '../../../theme';
import React from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { Text } from 'react-native-paper';
import { navigate } from '../../../utils/navigation';
import { useAuthStore } from '../../../store/auth';
import { useDashboardSummary } from '../../../hooks/useDashboard';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../../theme';

const createHEALTH_SECTIONS = (COLORS: ThemeColors) => ([
  { id: 'adherence', path: '/adherence', icon: '📅', title: 'Care Adherence', desc: 'Track due visits and scheduled medication doses', color: COLORS.primaryText, bgColor: COLORS.quickBlue },
  { id: 'doctor-visits', path: '/(patient)/health/home-visits', icon: '🩺', title: 'Doctor Home Visits', desc: 'Request an appointment and follow your doctor visit', color: COLORS.primaryText, bgColor: COLORS.quickBlue },
  { id: 'payments', path: '/(patient)/health/payments', icon: '💳', title: 'Payment History', desc: 'View recorded pending and paid care payments', color: COLORS.primaryText, bgColor: COLORS.quickBlue },
  {
    id: 'vitals',
    path: '/(patient)/records/vitals',
    icon: '🩺',
    title: 'Vitals & Risk Assessment',
    desc: 'Blood pressure, SpO2, heart rate, and AI risk tier',
    color: COLORS.teal,
    bgColor: COLORS.tealLight,
  },
  {
    id: 'medical',
    path: '/(patient)/health/medical',
    icon: '📋',
    title: 'Medical Timeline',
    desc: 'Chronological health events, conditions, and allergies',
    color: COLORS.blue,
    bgColor: COLORS.blueLight,
  },
  {
    id: 'careplans',
    path: '/(patient)/health/careplans',
    icon: '📅',
    title: 'Active Care Plans',
    desc: 'Structured clinical routines assigned by your providers',
    color: COLORS.emerald,
    bgColor: COLORS.emeraldLight,
  },
  {
    id: 'prescriptions',
    path: '/(patient)/health/prescriptions',
    icon: '💊',
    title: 'Prescriptions',
    desc: 'Current medications, dosages, and refill schedules',
    color: COLORS.purple,
    bgColor: COLORS.purpleLight,
  },
  {
    id: 'caregivers',
    path: '/(patient)/health/caregivers',
    icon: '👥',
    title: 'Family Caregivers',
    desc: 'Trusted people with access to your clinical overview',
    color: COLORS.amber,
    bgColor: COLORS.amberLight,
  },
  {
    id: 'recurring',
    path: '/(patient)/health/recurring',
    icon: '🔁',
    title: 'Recurring Visits',
    desc: 'Schedule automatic repeating home care sessions',
    color: COLORS.red,
    bgColor: COLORS.redLight,
  },
]);

export default function HealthOverviewScreen() {
  const { dark: isDarkTheme } = useAppTheme();

  const { colors: COLORS } = useAppTheme();
  const HEALTH_SECTIONS = useThemeValue(createHEALTH_SECTIONS);
  const styles = useThemeValue(createStyles);

  const { user } = useAuthStore();
  const patientId = user?.patientId || '';

  const { data: dashboardSummary } = useDashboardSummary(patientId);

  // Note: Backend DashboardSummaryResponse might not have latestRisk structured exactly like this
  // We'll use optional chaining to safely map whatever data exists for this specific UI component.
  const riskData = (dashboardSummary as any)?.latestRisk;
  const riskTier = riskData?.riskTier || (dashboardSummary as any)?.riskLevel;
  
  const riskColor =
    riskTier === 'HIGH' || riskTier === 'CRITICAL' ? COLORS.red :
    riskTier === 'MEDIUM' || riskTier === 'MODERATE' ? COLORS.amber :
    COLORS.emerald;

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Health Vault</Text>
          <Text style={styles.subtitle}>Your complete clinical profile in one place</Text>
        </View>

        {/* Risk Summary Banner */}
        {riskData && (
          <View style={[styles.riskBanner, { borderColor: riskColor }]}>
            <View style={styles.riskBannerLeft}>
              <Text style={styles.riskBannerLabel}>🧠 Clinical Risk Assessment</Text>
              <Text style={[styles.riskTierText, { color: riskColor }]}>
                {riskTier} RISK · {Number(riskData.fusedScore).toFixed(2)} risk score
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.riskBannerBtn, { borderColor: riskColor }]}
              onPress={() => navigate('/(patient)/records/vitals')}
            >
              <Text style={[styles.riskBannerBtnText, { color: riskColor }]}>View</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Stat Summary Row */}
        <View style={styles.statRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{dashboardSummary?.activeRequestsCount ?? 0}</Text>
            <Text style={styles.statLabel}>Active{'\n'}Bookings</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: (dashboardSummary?.pendingPaymentsSum ?? 0) > 0 ? COLORS.amber : COLORS.emerald }]}>
              {dashboardSummary?.pendingPaymentsCount ?? 0}
            </Text>
            <Text style={styles.statLabel}>Pending{'\n'}Payments</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statVal}>
              {dashboardSummary?.upcomingVisits?.length ?? 0}
            </Text>
            <Text style={styles.statLabel}>Upcoming{'\n'}Visits</Text>
          </View>
        </View>

        {/* Health Section Cards */}
        <Text style={styles.sectionLabel}>Health Records</Text>
        <View style={styles.cardGrid}>
          {HEALTH_SECTIONS.map((section) => (
            <TouchableOpacity
              key={section.id}
              style={styles.healthCard}
              activeOpacity={0.75}
              onPress={() => navigate(section.path as any)}
            >
              <View style={[styles.iconCircle, { backgroundColor: section.bgColor }]}>
                <Text style={styles.sectionIcon}>{section.icon}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{section.title}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>{section.desc}</Text>
              </View>
              <Text style={[styles.cardArrow, { color: section.color }]}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    padding: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.lg,
    marginTop: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.extrabold,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  riskBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  riskBannerLeft: {
    flex: 1,
  },
  riskBannerLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  riskTierText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginTop: 2,
  },
  riskBannerBtn: {
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  riskBannerBtnText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  statRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xl,
    padding: SPACING.md,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
  },
  statVal: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.extrabold,
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 14,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  sectionLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.bold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
  },
  cardGrid: {
    gap: SPACING.sm,
  },
  healthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  sectionIcon: {
    fontSize: 20,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  cardDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  cardArrow: {
    fontSize: 22,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
}));

