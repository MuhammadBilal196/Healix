import { useAppTheme, useThemeValue } from '../../../theme/ThemeProvider';
import type { ThemeColors } from '../../../theme';
import { useState } from 'react';
import { StyleSheet, View, ScrollView, SafeAreaView, RefreshControl, StatusBar } from 'react-native';

import { Text } from 'react-native-paper';
import { navigate } from '../../../utils/navigation';
import { useAuthStore } from '../../../store/auth';
import { useNurseProfile, useNurseScore, useNurseReviews } from '../../../hooks/useNurse';
import { useNurseVisits } from '../../../hooks/useVisits';
import { NurseScoreCard } from '../../../components/nurse/NurseScoreCard';
import { NurseReviewCard } from '../../../components/nurse/NurseReviewCard';
import { VisitCard } from '../../../components/nurse/VisitCard';
import { VisitFilterPills } from '../../../components/nurse/VisitFilterPills';
import { EmptyState } from '../../../components/common/EmptyState';
import { LoadingState } from '../../../components/common/LoadingState';
import { ErrorState } from '../../../components/common/ErrorState';
import { NurseQuickActions } from '../../../components/nurse/NurseQuickActions';
import { PendingContractsBanner } from '../../../components/contracts/PendingContractsBanner';

export default function NurseHomeScreen() {
  const { dark: isDarkTheme } = useAppTheme();

  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const { user, accessToken } = useAuthStore();
  const nurseId = user?.nurseId;
  const token = accessToken;
  const { data: profile, isLoading: loadingProfile, error: profileError, refetch: refetchProfile } = useNurseProfile(nurseId || '');
  const { data: assignedVisits, isLoading: loadingVisits, error: visitsError, refetch: refetchVisits } = useNurseVisits(nurseId || '');
  const { data: nurseScore, error: scoreError, refetch: refetchScore } = useNurseScore(nurseId || '');
  const { data: nurseReviews, error: reviewsError, refetch: refetchReviews } = useNurseReviews(nurseId || '');

  const visits = assignedVisits || [];
  const loading = loadingProfile || loadingVisits;
  const error = profileError?.message || visitsError?.message || scoreError?.message || reviewsError?.message;

  const [filter, setFilter] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchProfile(),
      refetchVisits(),
      refetchScore(),
      refetchReviews(),
    ]);
    setRefreshing(false);
  };

  const quickActions = {
    onCheckInPress: () => navigate('/(nurse)/(tabs)/visits'),
    onPatientsPress: () => navigate('/(nurse)/patients'),
    onBidsPress: () => navigate('/(nurse)/(tabs)/marketplace'),
    onMessagesPress: () => navigate('/(nurse)/(tabs)/messages'),
    onEmergencyPress: () => navigate('/(nurse)/(tabs)/visits'),
    onScanQRPress: () => navigate('/(nurse)/(tabs)/visits'),
  };

  const filteredVisits = visits.filter((v: any) => {
    if (filter === 'ALL') return true;
    return v.status === filter;
  });

  const latestReview = nurseReviews && nurseReviews.length > 0 ? nurseReviews[0] : null;

  if (loading && !profile) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={onRefresh} />;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} backgroundColor={COLORS.bg} />
      
      {/* Header Greeting (Teal Background) */}
      <View style={styles.headerBox}>
        <Text style={styles.greetingTitle}>Welcome back, {user?.fullName || 'Nurse'}</Text>
        <Text style={styles.greetingSub}>
          Nurse account · {profile?.available ? '🟢 Available for Visits' : '🔴 Currently Unavailable'}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.emerald} colors={[COLORS.navy]} />}
      >
        <PendingContractsBanner role="nurse" profileId={nurseId} />

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <NurseQuickActions {...quickActions} />
        </View>

        {/* Performance Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Summary</Text>
          <NurseScoreCard
            compositeScore={nurseScore?.compositeScore ?? 0}
            skillScore={nurseScore?.skillScore ?? 0}
            skillAssessmentCount={nurseScore?.skillAssessmentCount ?? 0}
            experienceScore={nurseScore?.experienceScore ?? 0}
            reliabilityScore={nurseScore?.reliabilityScore ?? 0}
            performanceScore={nurseScore?.performanceScore ?? 0}
          />
        </View>

        {/* Recent Patient Review */}
        {latestReview ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Patient Review</Text>
            <NurseReviewCard
              patientName={latestReview.patient?.user?.fullName || 'Verified Patient'}
              rating={latestReview.stars}
              comment={latestReview.reviewText || 'No written comment.'}
              reviewedAt={new Date(latestReview.createdAt).toLocaleDateString()}
            />
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Patient Review</Text>
            <View style={styles.emptyReviewCard}>
              <Text style={styles.emptyReviewIcon}>⭐</Text>
              <Text style={styles.emptyReviewTitle}>No Patient Reviews Yet</Text>
              <Text style={styles.emptyReviewSub}>Completed visit ratings and patient reviews will appear here.</Text>
            </View>
          </View>
        )}

        {/* Today's Visits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assigned Care Visits</Text>
          <VisitFilterPills
            activeFilter={filter}
            onFilterChange={setFilter}
            filters={['ALL', 'SCHEDULED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED']}
          />
          {filteredVisits.length === 0 ? (
            <EmptyState title="No Scheduled Visits" subtitle="You have no assigned care visits for this status." />
          ) : (
            filteredVisits.map((v: any) => (
              <VisitCard
                key={v.id}
                visitId={v.id}
                patientName={v.request?.patient?.user?.fullName || 'Assigned Patient'}
                scheduledTime={v.request?.scheduledAt ? new Date(v.request.scheduledAt).toLocaleString() : 'Scheduled'}
                visitType={v.request?.requirements || v.request?.type || 'NURSE_VISIT'}
                status={v.status}
                address={v.request?.patient?.address || 'Patient Address'}
                onPress={() => navigate(`/(nurse)/visits/${v.id}`)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.navyDark },
  headerBox: { padding: 20, paddingBottom: 30, backgroundColor: COLORS.navyDark },
  greetingTitle: { color: COLORS.onAccent, fontSize: 24, fontWeight: '800' },
  greetingSub: { color: COLORS.primaryText, fontSize: 14, marginTop: 6, fontWeight: '600' },
  scroll: { flex: 1, backgroundColor: COLORS.surface, borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden' },
  scrollContent: { padding: 20, paddingBottom: 40, paddingTop: 30 },
  section: { marginBottom: 28 },
  sectionTitle: { color: COLORS.textDark, fontSize: 18, fontWeight: '800', marginBottom: 16 },
  emptyReviewCard: { backgroundColor: COLORS.surfaceCard, padding: 24, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.inputBorder, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  emptyReviewIcon: { fontSize: 28, marginBottom: 8 },
  emptyReviewTitle: { color: COLORS.textDark, fontSize: 15, fontWeight: '700' },
  emptyReviewSub: { color: COLORS.textMuted, fontSize: 13, textAlign: 'center', marginTop: 4 },
}));

