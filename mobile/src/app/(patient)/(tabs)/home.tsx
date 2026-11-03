import { useAppTheme, useThemeValue } from '../../../theme/ThemeProvider';
import type { ThemeColors } from '../../../theme';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, SafeAreaView, StatusBar, RefreshControl } from 'react-native';
import { navigate } from '../../../utils/navigation';
import { useAuthStore } from '../../../store/auth';
import { useDashboardSummary } from '../../../hooks/useDashboard';
import { PendingContractsBanner } from '../../../components/contracts/PendingContractsBanner';
import { VisitReviewBanner } from '../../../components/visits/VisitReviewBanner';
import { usePrescriptions } from '../../../hooks/useHealth';
import { SPACING } from '../../../theme';
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
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navyDark} translucent />
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
        {/* Scenic Header */}
        <Button textColor={COLORS.headerText} onPress={() => navigate('/(patient)/emergency')}>Track Emergency Transport & Admission</Button>
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

        {/* White background content area */}
        <View style={styles.whiteSection}>
          <View style={{gap:SPACING.sm}}><Button onPress={() => navigate('/(patient)/(tabs)/requests')}>Active care requests: {dashData?.activeRequestsCount ?? 0}</Button><Button onPress={() => navigate('/(patient)/marketplace/contracts')}>Active contracts: {dashData?.activeContractsCount ?? 0}</Button>{!!dashData?.severeAllergiesCount && <Button textColor={COLORS.red} onPress={() => navigate('/(patient)/health/medical')}>{dashData.severeAllergiesCount} severe allergy record(s) — review with your care team</Button>}{dashData?.latestRisk && <Button onPress={() => navigate('/(patient)/records/risk-history')}>Latest recorded risk: {dashData.latestRisk.riskTier || dashData.latestRisk.riskLevel || 'View assessment'}</Button>}<Text style={{color:COLORS.textBody}}>Recorded pending payments: PKR {Number(dashData?.pendingPaymentsSum ?? 0).toLocaleString()}</Text></View>
          {/* Quick Actions Grid */}
          <QuickActionsGrid
            onRequestPress={() => navigate('/(patient)/requests/new')}
            onRecordsPress={() => navigate('/(patient)/(tabs)/records')}
            onMessagesPress={() => navigate('/(patient)/(tabs)/messages')}
            onHealthPress={() => navigate('/(patient)/health')}
          />

          <Button onPress={() => navigate('/(patient)/health/home-visits')}>Request / track a doctor home visit</Button>
          <Button onPress={() => navigate('/(patient)/health/payments')}>Payment history · {dashData?.pendingPaymentsCount ?? 0} pending</Button>
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
}));
