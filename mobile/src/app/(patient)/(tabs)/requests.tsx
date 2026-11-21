import { useAppTheme, useThemeValue } from '../../../theme/ThemeProvider';
import type { ThemeColors } from '../../../theme';
import { useState, useMemo } from 'react';
import { StyleSheet, View, ScrollView, SafeAreaView, StatusBar, RefreshControl, ActivityIndicator } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { navigate } from '../../../utils/navigation';
import { useAuthStore } from '../../../store/auth';
import { useCareRequests } from '../../../hooks/useCareRequests';
import { useCaregivers } from '../../../hooks/useHealth';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../../theme';

import { CareTeamRow, CareTeamMember } from '../../../components/patient/CareTeamRow';
import { CareJourneyCard } from '../../../components/patient/CareJourneyCard';
import { RequestFilterPills, CareSegment } from '../../../components/patient/RequestFilterPills';
import { CareRequestResponse } from '../../../types/care';

export default function RequestsScreen() {
  const { dark: isDarkTheme } = useAppTheme();

  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const { user } = useAuthStore();
  const patientId = user?.patientId || '';

  const [activeSegment, setActiveSegment] = useState<CareSegment>('UPCOMING');

  const {
    data: requests,
    isLoading: loadingRequests,
    isError: errorRequests,
    refetch: refetchRequests,
    isRefetching,
  } = useCareRequests();

  const {
    data: caregiversData,
    refetch: refetchCaregivers,
  } = useCaregivers(patientId);

  const onRefresh = async () => {
    await Promise.all([
      refetchRequests(),
      refetchCaregivers(),
    ]);
  };

  // ─────────────────────────────────────────────────────────────
  // 1. DERIVE CARE TEAM MEMBERS FROM REAL DATA
  // ─────────────────────────────────────────────────────────────
  const careTeam: CareTeamMember[] = useMemo(() => {
    const membersMap = new Map<string, CareTeamMember>();

    // From Caregivers API
    if (caregiversData && Array.isArray(caregiversData)) {
      caregiversData.forEach((cg: any) => {
        const id = cg.id || cg.caregiverId;
        const name = cg.caregiverName || cg.name || 'Caregiver';
        membersMap.set(name, {
          id,
          name,
          role: cg.relationship || 'Connected Nurse',
        });
      });
    }

    // From Requests & Visits history (assigned staff)
    if (requests && Array.isArray(requests)) {
      requests.forEach((req: any) => {
        const visit = req.visit || (req.visits && req.visits.length > 0 ? req.visits[0] : null);
        const staff = visit?.nurse?.user || req.nurse?.user;
        if (staff?.fullName) {
          const existing = membersMap.get(staff.fullName);
          const count = (existing?.visitsCount || 0) + 1;
          membersMap.set(staff.fullName, {
            id: staff.id || existing?.id || `staff-${staff.fullName}`,
            name: staff.fullName,
            visitsCount: count,
            role: 'Staff Nurse',
          });
        }
      });
    }

    return Array.from(membersMap.values());
  }, [caregiversData, requests]);

  // ─────────────────────────────────────────────────────────────
  // 2. SEGMENT UPCOMING VS PAST
  // ─────────────────────────────────────────────────────────────
  const { upcomingRequests, pastRequests } = useMemo(() => {
    const upcoming: CareRequestResponse[] = [];
    const past: CareRequestResponse[] = [];

    (requests || []).forEach((req) => {
      if (req.status === 'COMPLETED' || req.status === 'CANCELLED') {
        past.push(req);
      } else {
        // OPEN, ASSIGNED, IN_PROGRESS
        upcoming.push(req);
      }
    });

    return { upcomingRequests: upcoming, pastRequests: past };
  }, [requests]);

  const displayedRequests = activeSegment === 'UPCOMING' ? upcomingRequests : pastRequests;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={COLORS.primaryText}
            colors={[COLORS.navy]}
          />
        }
      >
        {/* Header: Subtitle & Context */}
        <View style={styles.header}>
          <Text style={styles.headerSubtitle}>Requests, visits & agreements</Text>
        </View>

        {/* Your Care Team */}
        <CareTeamRow
          careTeam={careTeam}
          onAddNursePress={() => navigate('/(patient)/requests/new')}
          onMemberPress={(member) => navigate('/(patient)/requests/new')}
        />
        <Button mode="outlined" textColor={COLORS.primaryText} onPress={() => navigate('/(patient)/visits')}>
          My visits and QR codes
        </Button>

        {/* Upcoming vs Past Segmented Control */}
        <RequestFilterPills
          activeSegment={activeSegment}
          onSegmentChange={setActiveSegment}
          upcomingCount={upcomingRequests.length}
          pastCount={pastRequests.length}
        />

        {/* List Content */}
        {loadingRequests && !isRefetching ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={COLORS.primaryText} />
            <Text style={styles.loadingText}>Loading your care requests...</Text>
          </View>
        ) : errorRequests ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={44} color={COLORS.red} />
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorSub}>We couldn't load your care requests.</Text>
            <Button
              mode="contained"
              buttonColor={COLORS.navy}
              textColor={COLORS.onAccent}
              style={styles.retryBtn}
              onPress={() => refetchRequests()}
            >
              Try again
            </Button>
          </View>
        ) : displayedRequests.length > 0 ? (
          <View style={styles.listSection}>
            {displayedRequests.map((req) => (
              <CareJourneyCard
                key={req.id}
                request={req}
                onCardPress={() => navigate(`/(patient)/requests/${req.id}`)}
                onCheckInPress={(visitId) => navigate(`/(patient)/visits/${visitId}`)}
                onCompareOffersPress={(listingId) => navigate(`/(patient)/marketplace/${listingId}`)}
                onViewContractPress={(contractId) => navigate(`/(patient)/marketplace/contracts/${contractId}`)}
                onRebookPress={() => navigate('/(patient)/requests/new')}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="calendar-outline" size={32} color={COLORS.primaryText} />
            </View>
            <Text style={styles.emptyTitle}>
              {activeSegment === 'UPCOMING' ? 'No care requests yet' : 'No past care history'}
            </Text>
            <Text style={styles.emptySub}>
              {activeSegment === 'UPCOMING'
                ? 'When you need home care, you can request a nurse and track everything here.'
                : 'Your completed visits and care records will be archived here.'}
            </Text>
            {activeSegment === 'UPCOMING' && (
              <Button
                mode="contained"
                buttonColor={COLORS.navy}
                textColor={COLORS.onAccent}
                style={styles.requestCareBtn}
                onPress={() => navigate('/(patient)/requests/new')}
              >
                Request care
              </Button>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  header: {
    marginBottom: SPACING.sm,
    paddingTop: SPACING.xs,
  },
  headerSubtitle: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  listSection: {
    gap: SPACING.xs,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: SPACING.md,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  errorCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    marginTop: SPACING.xl,
  },
  errorTitle: {
    color: COLORS.textDark,
    fontSize: TYPOGRAPHY.sizes.md + 1,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginTop: SPACING.sm,
  },
  errorSub: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: SPACING.lg,
  },
  retryBtn: {
    borderRadius: RADIUS.round,
    paddingHorizontal: SPACING.md,
  },
  emptyCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    marginTop: SPACING.lg,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    color: COLORS.textDark,
    fontSize: TYPOGRAPHY.sizes.md + 1,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  emptySub: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: SPACING.lg,
    lineHeight: 20,
    maxWidth: 280,
  },
  requestCareBtn: {
    borderRadius: RADIUS.round,
    paddingHorizontal: SPACING.md,
  },
}));
