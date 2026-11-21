import { useAppTheme, useThemeValue } from '../../../theme/ThemeProvider';
import type { ThemeColors } from '../../../theme';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, SafeAreaView, StatusBar, RefreshControl, TouchableOpacity } from 'react-native';
import { navigate } from '../../../utils/navigation';
import { useAuthStore } from '../../../store/auth';
import { useDashboardSummary } from '../../../hooks/useDashboard';
import { PendingContractsBanner } from '../../../components/contracts/PendingContractsBanner';
import { VisitReviewBanner } from '../../../components/visits/VisitReviewBanner';
import { usePrescriptions } from '../../../hooks/useHealth';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../../theme';
import { Button, Text } from 'react-native-paper';

import { DashboardHeader } from '../../../components/patient/DashboardHeader';
import { UpcomingVisitCard } from '../../../components/patient/UpcomingVisitCard';
import { QuickActionsGrid } from '../../../components/patient/QuickActionsGrid';
import { TodaysReminders } from '../../../components/patient/TodaysReminders';

export default function PatientHomeScreen() {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const { user } = useAuthStore();
  const patientId = user?.patientId || '';

  const { data: dashboardSummary, refetch: refetchDashboard, isLoading: loadingDash, error: dashboardError } = useDashboardSummary(patientId);
  const { data: prescriptionsData, refetch: refetchPrescriptions } = usePrescriptions(patientId);

  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState('Good morning,');

  useEffect(() => {
    const hrs = new Date().getHours();
    if (hrs < 12) setGreeting('Good morning,');
    else if (hrs < 17) setGreeting('Good afternoon,');
    else setGreeting('Good evening,');
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    if (patientId) {
      await Promise.all([
        refetchDashboard(),
        refetchPrescriptions(),
      ]);
    }
    setRefreshing(false);
  };

  const userName = user?.fullName || 'Patient';

  // Dashboard data
  const dashData = dashboardSummary as any;
  const upcomingVisits = dashData?.upcomingVisits || [];
  const upcomingVisit = upcomingVisits.length > 0 ? upcomingVisits[0] : null;

  // Build reminders from prescriptions
  const reminders = React.useMemo(() => {
    if (!prescriptionsData || !Array.isArray(prescriptionsData)) return [];
    return prescriptionsData.filter(rx => !rx.corrections?.length).flatMap(rx => rx.items.map(item => ({ id: item.id, name: `${item.medicationName} · ${item.dosage}`, time: item.frequency }))).slice(0, 3);
  }, [prescriptionsData]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primaryText}
            colors={[COLORS.navy]}
          />
        }
      >
        {loadingDash && <Text style={{ color: COLORS.headerText }}>Loading your care summary...</Text>}
        {dashboardError && <><Text style={{ color: COLORS.red }}>{dashboardError.message}</Text><Button onPress={() => void refetchDashboard()}>Retry dashboard</Button></>}
        <PendingContractsBanner role="patient" profileId={patientId} />
        <VisitReviewBanner />
        {/* Emergency Alert Strip */}
        <TouchableOpacity
          style={styles.emergencyBanner}
          activeOpacity={0.85}
          onPress={() => navigate('/(patient)/emergency')}
        >
          <View style={styles.emergencyDot} />
          <Text style={styles.emergencyBannerText}>Track Emergency Transport & Admission</Text>
          <Text style={styles.emergencyBannerChevron}>›</Text>
        </TouchableOpacity>
        <DashboardHeader
          userName={userName}
          greeting={greeting}
          onProfilePress={() => navigate('/(patient)/(tabs)/profile')}
          onNotificationPress={() => navigate('/(patient)/notifications')}
        />

        {/* Upcoming Visit Card — overlaps the header */}
        <View style={styles.visitCardSection}>
          <UpcomingVisitCard
            staffName={upcomingVisit?.nurse?.user?.fullName || upcomingVisit?.doctor?.user?.fullName || 'Assigned Staff'}
            scheduledAt={upcomingVisit?.agreedStartTime || upcomingVisit?.request?.scheduledAt ? new Date(upcomingVisit.agreedStartTime || upcomingVisit.request.scheduledAt).toLocaleString() : 'No upcoming visit'}
            status={upcomingVisit?.status || 'No visit scheduled'}
            onPress={() => navigate(upcomingVisit?.id ? `/(patient)/visits/${upcomingVisit.id}` as any : '/(patient)/visits')}
            onSeeAllPress={() => navigate('/(patient)/(tabs)/requests')}
          />
        </View>

        {/* Light clinical surface content area */}
        <View style={styles.whiteSection}>
          {/* Clinical Status & Metrics Strip */}
          <View style={styles.metricsRow}>
            <TouchableOpacity
              style={styles.metricPillCard}
              activeOpacity={0.8}
              onPress={() => navigate('/(patient)/(tabs)/requests')}
            >
              <Text style={styles.metricNumber}>{dashData?.activeRequestsCount ?? 0}</Text>
              <Text style={styles.metricLabel}>Active Requests</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.metricPillCard}
              activeOpacity={0.8}
              onPress={() => navigate('/(patient)/marketplace/contracts')}
            >
              <Text style={styles.metricNumber}>{dashData?.activeContractsCount ?? 0}</Text>
              <Text style={styles.metricLabel}>Active Contracts</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.metricPillCard}
              activeOpacity={0.8}
              onPress={() => navigate('/(patient)/health/payments')}
            >
              <Text style={[styles.metricNumber, (dashData?.pendingPaymentsSum ?? 0) > 0 && { color: COLORS.amber }]}>
                {dashData?.pendingPaymentsCount ?? 0}
              </Text>
              <Text style={styles.metricLabel}>
                PKR {Number(dashData?.pendingPaymentsSum ?? 0).toLocaleString()} Due
              </Text>
            </TouchableOpacity>
          </View>

          {!!dashData?.severeAllergiesCount && (
            <TouchableOpacity
              style={styles.alertCardDanger}
              activeOpacity={0.85}
              onPress={() => navigate('/(patient)/health/medical')}
            >
              <Text style={styles.alertCardDangerText}>
                {dashData.severeAllergiesCount} severe allergy record(s) — review with your care team ›
              </Text>
            </TouchableOpacity>
          )}

          {dashData?.latestRisk && (
            <TouchableOpacity
              style={styles.alertCardInfo}
              activeOpacity={0.85}
              onPress={() => navigate('/(patient)/records/risk-history')}
            >
              <Text style={styles.alertCardInfoText}>
                Latest recorded risk: {dashData.latestRisk.riskTier || dashData.latestRisk.riskLevel || 'View assessment'} ›
              </Text>
            </TouchableOpacity>
          )}

          {/* Quick Actions Grid */}
          <QuickActionsGrid
            onRequestPress={() => navigate('/(patient)/requests/new')}
            onRecordsPress={() => navigate('/(patient)/(tabs)/records')}
            onMessagesPress={() => navigate('/(patient)/(tabs)/messages')}
            onHealthPress={() => navigate('/(patient)/health')}
          />

          <View style={styles.secondaryActions}>
            <TouchableOpacity
              style={styles.secondaryActionCard}
              activeOpacity={0.82}
              onPress={() => navigate('/(patient)/health/home-visits')}
            >
              <Text style={styles.secondaryActionTitle}>Doctor Home Visits</Text>
              <Text style={styles.secondaryActionSub}>Request or track a physician appointment ›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryActionCard}
              activeOpacity={0.82}
              onPress={() => navigate('/(patient)/health/payments')}
            >
              <Text style={styles.secondaryActionTitle}>Payment History</Text>
              <Text style={styles.secondaryActionSub}>
                {dashData?.pendingPaymentsCount ?? 0} pending invoice(s) ›
              </Text>
            </TouchableOpacity>
          </View>
          {/* Today's Reminders */}
          <TodaysReminders
            reminders={reminders}
            onSeeAll={() => navigate('/(patient)/health/prescriptions')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.navyDark,
  },
  container: {
    paddingBottom: 30,
  },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.navy,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.accentBlue,
    gap: SPACING.sm,
  },
  emergencyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.red,
  },
  emergencyBannerText: {
    flex: 1,
    color: COLORS.onAccent,
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  emergencyBannerChevron: {
    color: COLORS.inverseMuted,
    fontSize: 18,
    fontWeight: '700',
  },
  visitCardSection: {
    paddingHorizontal: SPACING.lg,
    zIndex: 10,
  },
  whiteSection: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    minHeight: 400,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  metricPillCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
  },
  metricNumber: {
    color: COLORS.primaryText,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.extrabold,
  },
  metricLabel: {
    color: COLORS.textBody,
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weights.medium,
    textAlign: 'center',
    marginTop: 2,
  },
  alertCardDanger: {
    backgroundColor: COLORS.redLight,
    borderWidth: 1,
    borderColor: COLORS.red,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  alertCardDangerText: {
    color: COLORS.red,
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  alertCardInfo: {
    backgroundColor: COLORS.blueLight,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  alertCardInfoText: {
    color: COLORS.primaryText,
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  secondaryActions: {
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  secondaryActionCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    padding: SPACING.md,
  },
  secondaryActionTitle: {
    color: COLORS.textDark,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  secondaryActionSub: {
    color: COLORS.textBody,
    fontSize: TYPOGRAPHY.sizes.xs,
    marginTop: 2,
  },
}));
