import { useAppTheme, useThemeValue } from '../../../theme/ThemeProvider';
import type { ThemeColors } from '../../../theme';
import { appAlert } from '../../../components/common/AppDialogs';
import { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Text, Button, Avatar, Divider } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { navigate, goBack } from '../../../utils/navigation';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../../theme';

import { RequestTrackingStepper } from '../../../components/patient/RequestTrackingStepper';
import { CancelRequestModal } from '../../../components/patient/CancelRequestModal';
import { RescheduleRequestModal } from '../../../components/patient/RescheduleRequestModal';
import {
  useCareRequestDetails,
  useCancelCareRequest,
  useRescheduleCareRequest,
} from '../../../hooks/useCareRequests';

const createGetRiskTierColor = (COLORS: ThemeColors) => ((tier?: string) => {
  switch (tier?.toUpperCase()) {
    case 'CRITICAL':
    case 'HIGH':
      return COLORS.red;
    case 'MEDIUM':
      return COLORS.amber;
    case 'LOW':
      return COLORS.emerald;
    default:
      return COLORS.textBody;
  }
});

const createGetRiskTierBg = (COLORS: ThemeColors) => ((tier?: string) => {
  switch (tier?.toUpperCase()) {
    case 'CRITICAL':
    case 'HIGH':
      return COLORS.redLight;
    case 'MEDIUM':
      return COLORS.amberLight;
    case 'LOW':
      return COLORS.emeraldLight;
    default:
      return COLORS.textBody;
  }
});

export default function RequestDetailsScreen() {
  const { dark: isDarkTheme } = useAppTheme();

  const getRiskTierBg = useThemeValue(createGetRiskTierBg);

  const getRiskTierColor = useThemeValue(createGetRiskTierColor);

  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const { id } = useLocalSearchParams();
  const router = useRouter();

  const { data: request, isLoading, isError, refetch } = useCareRequestDetails(String(id));
  const cancelCareRequest = useCancelCareRequest();
  const rescheduleCareRequest = useRescheduleCareRequest();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primaryText} />
          <Text style={styles.loadingText}>Loading care request...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !request) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => goBack()}>
            <Ionicons name="chevron-back" size={24} color={COLORS.primaryText} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Request Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={COLORS.red} />
          <Text style={styles.errorText}>Failed to load request details.</Text>
          <Button mode="outlined" textColor={COLORS.primaryText} onPress={() => refetch()} style={{ marginTop: 12 }}>
            Retry
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const reqData = request as any;
  const visit = reqData?.visit || (reqData?.visits && reqData.visits.length > 0 ? reqData.visits[0] : null);
  const latestAssessment = visit?.assessments && visit.assessments.length > 0 ? visit.assessments[0] : null;
  const latestVitals = visit?.vitals && visit.vitals.length > 0 ? visit.vitals[0] : null;
  const nurseName =
    visit?.nurse?.user?.fullName || reqData?.contract?.nurse?.user?.fullName || 'Assigned Nurse';
  const doctorSupervisor = visit?.caseAssignment?.doctor?.user?.fullName || visit?.doctor?.user?.fullName;

  const nurseInitials = nurseName
    ? nurseName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'RN';

  const isCancelable = request.status === 'OPEN';
  const isReschedulable = request.status === 'OPEN';

  const trackingSteps = [
    {
      title: 'Request Published',
      time: request.createdAt ? new Date(request.createdAt).toLocaleString() : 'Done',
      status: 'completed' as const,
    },
    {
      title: 'Staff Assigned',
      sub: request.status === 'OPEN' ? 'Awaiting Nurse Offers' : nurseName,
      time: request.status === 'OPEN' ? 'In Negotiation' : 'Assigned',
      status: request.status === 'OPEN' ? ('current' as const) : ('completed' as const),
    },
    {
      title: 'Visit In Progress',
      time: request.status === 'IN_PROGRESS' ? 'Active Now' : request.status === 'COMPLETED' ? 'Done' : 'Pending',
      status:
        request.status === 'IN_PROGRESS'
          ? ('current' as const)
          : request.status === 'COMPLETED'
          ? ('completed' as const)
          : ('pending' as const),
    },
    {
      title: 'Completed',
      time: request.status === 'COMPLETED' ? 'Care Completed' : 'Pending',
      status: request.status === 'COMPLETED' ? ('completed' as const) : ('pending' as const),
    },
  ];

  const handleCancel = async (reason: string) => {
    cancelCareRequest.mutate(
      { id: request.id, data: { reason } },
      {
        onSuccess: () => {
          setShowCancelModal(false);
          if (Platform.OS === 'web') {
            alert('Success: Request has been cancelled successfully.');
          } else {
            appAlert('Success', 'Request has been cancelled successfully.');
          }
        },
        onError: (err: any) => {
          if (Platform.OS === 'web') {
            alert('Cancellation Error: ' + (err.message || 'Could not cancel request.'));
          } else {
            appAlert('Cancellation Error', err.message || 'Could not cancel request.');
          }
        },
      }
    );
  };

  const handleReschedule = async (newDate: string) => {
    rescheduleCareRequest.mutate(
      { id: request.id, data: { newDate } },
      {
        onSuccess: () => {
          setShowRescheduleModal(false);
          if (Platform.OS === 'web') {
            alert('Success: Request has been rescheduled successfully.');
          } else {
            appAlert('Success', 'Request has been rescheduled successfully.');
          }
        },
        onError: (err: any) => {
          if (Platform.OS === 'web') {
            alert('Reschedule Error: ' + (err.message || 'Could not reschedule request.'));
          } else {
            appAlert('Reschedule Error', err.message || 'Could not reschedule request.');
          }
        },
      }
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => goBack()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Order Header Card */}
        <View style={styles.orderHeaderCard}>
          <View style={styles.orderTitleGroup}>
            <View>
              <Text style={styles.orderId}>
                {request.type === 'NURSE_VISIT' ? 'Home Nurse Care' : 'Doctor Consultation'}
              </Text>
              <Text style={styles.orderSubtitle}>
                Request #{String(request.id).substring(0, 8).toUpperCase()}
              </Text>
            </View>
            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor:
                    request.status === 'COMPLETED'
                      ? COLORS.emeraldLight
                      : request.status === 'OPEN'
                      ? COLORS.amberLight
                      : COLORS.headerOverlayMid,
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      request.status === 'COMPLETED'
                        ? COLORS.careEmerald
                        : request.status === 'OPEN'
                        ? COLORS.amber
                        : COLORS.primaryText,
                  },
                ]}
              >
                {request.status.replace('_', ' ')}
              </Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="calendar-clock" size={18} color={COLORS.primaryText} style={{ marginRight: 8 }} />
            <Text style={styles.metaText}>
              {request.preferredDate
                ? new Date(request.preferredDate).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })
                : 'Date TBD'}{' '}
              · {request.preferredTimeWindow || 'Standard Visit'} ({request.durationMinutes || 60} mins)
            </Text>
          </View>

          {request.requirements ? (
            <View style={[styles.metaRow, { marginTop: 6 }]}>
              <MaterialCommunityIcons name="medical-bag" size={18} color={COLORS.accentBlue} style={{ marginRight: 8 }} />
              <Text style={styles.metaText} numberOfLines={2}>{request.requirements}</Text>
            </View>
          ) : null}

          {request.notes ? (
            <View style={styles.orderNotesBox}>
              <Text style={styles.orderNotesLabel}>Patient Notes:</Text>
              <Text style={styles.orderNotesText}>{request.notes}</Text>
            </View>
          ) : null}
        </View>

        {/* ─────────────────────────────────────────────────────────────
            CLINICAL VISIT CARD: VISIT + SCORE & RISK TIER NEXT TO IT!
        ───────────────────────────────────────────────────────────── */}
        {visit && (
          <View style={styles.visitAssessmentCard}>
            {/* Top row: Visit ID & Nurse info + Risk Tier & Score NEXT TO IT */}
            <View style={styles.visitHeaderRow}>
              <View style={styles.nurseInfoCol}>
                <View style={styles.avatarRing}>
                  <Avatar.Text
                    size={42}
                    label={nurseInitials}
                    style={styles.avatarTeal}
                    labelStyle={styles.avatarLabelTeal}
                    color={COLORS.careEmerald}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.visitTitleText}>
                    {nurseName.startsWith('Nurse') || nurseName.startsWith('Dr') ? nurseName : `Nurse ${nurseName}`}
                  </Text>
                  <Text style={styles.visitSubtitleText}>
                    Visit #{visit.id.substring(0, 8).toUpperCase()} · {visit.status}
                  </Text>
                </View>
              </View>

              {/* NEXT TO IT: Score & Risk Tier Badge */}
              {latestAssessment ? (
                <View style={styles.riskBadgeContainer}>
                  <View
                    style={[
                      styles.riskTierPill,
                      { backgroundColor: getRiskTierBg(latestAssessment.riskTier) },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={
                        latestAssessment.riskTier === 'HIGH' || latestAssessment.riskTier === 'CRITICAL'
                          ? 'alert'
                          : latestAssessment.riskTier === 'MEDIUM'
                          ? 'alert-circle-outline'
                          : 'shield-check'
                      }
                      size={14}
                      color={getRiskTierColor(latestAssessment.riskTier)}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.riskTierText,
                        { color: getRiskTierColor(latestAssessment.riskTier) },
                      ]}
                    >
                      {latestAssessment.riskTier} RISK
                    </Text>
                  </View>

                  <View style={styles.scorePill}>
                    <Text style={styles.scoreNumberText}>
                      {Math.round(latestAssessment.fusedScore)}%
                    </Text>
                    <Text style={styles.scoreLabelText}>Score</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.pendingRiskBadge}>
                  <MaterialCommunityIcons name="clock-outline" size={13} color={COLORS.textBody} style={{ marginRight: 3 }} />
                  <Text style={styles.pendingRiskText}>Assessment Pending</Text>
                </View>
              )}
            </View>

            {/* Assessment Clinical Interpretation (if available) */}
            {latestAssessment && (
              <View style={styles.assessmentNotesBox}>
                <View style={styles.assessmentNotesHeader}>
                  <MaterialCommunityIcons name="brain" size={16} color={COLORS.primaryText} style={{ marginRight: 6 }} />
                  <Text style={styles.assessmentNotesTitle}>AI Clinical Assessment & Risk Analysis</Text>
                </View>
                <Text style={styles.assessmentNotesText}>
                  {latestAssessment.notes ||
                    `Patient vital signs and clinical remarks indicate a ${latestAssessment.riskTier} risk tier classification.`}
                </Text>

                {doctorSupervisor && (
                  <View style={styles.doctorSupervisionRow}>
                    <MaterialCommunityIcons name="doctor" size={16} color={COLORS.primaryText} style={{ marginRight: 6 }} />
                    <Text style={styles.doctorSupervisionText}>
                      Clinical Reviewer: <Text style={{ fontWeight: '700' }}>Dr. {doctorSupervisor}</Text>
                    </Text>
                  </View>
                )}
              </View>
            )}

            <Divider style={[styles.divider, { marginVertical: 14 }]} />

            {/* Submitted Vitals Grid (When the nurse submits the vitals) */}
            <View style={styles.vitalsSectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="heart-pulse" size={18} color={COLORS.primaryText} style={{ marginRight: 6 }} />
                <Text style={styles.vitalsSectionTitle}>Recorded Patient Vitals</Text>
              </View>
              {latestVitals && (
                <Text style={styles.vitalsTimestamp}>
                  {new Date(latestVitals.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              )}
            </View>

            {latestVitals ? (
              <View style={styles.vitalsGrid}>
                {/* Blood Pressure */}
                <View style={styles.vitalCard}>
                  <Text style={styles.vitalEmoji}>🩸</Text>
                  <Text style={styles.vitalCardLabel}>Blood Pressure</Text>
                  <Text style={styles.vitalCardValue}>
                    {latestVitals.systolic}/{latestVitals.diastolic}
                  </Text>
                  <Text style={styles.vitalCardUnit}>mmHg</Text>
                </View>

                {/* Heart Rate */}
                <View style={styles.vitalCard}>
                  <Text style={styles.vitalEmoji}>❤️</Text>
                  <Text style={styles.vitalCardLabel}>Heart Rate</Text>
                  <Text style={styles.vitalCardValue}>{latestVitals.heartRate}</Text>
                  <Text style={styles.vitalCardUnit}>bpm</Text>
                </View>

                {/* Oxygen Saturation */}
                <View style={styles.vitalCard}>
                  <Text style={styles.vitalEmoji}>🫁</Text>
                  <Text style={styles.vitalCardLabel}>Oxygen (SpO₂)</Text>
                  <Text style={styles.vitalCardValue}>{latestVitals.oxygenSaturation}%</Text>
                  <Text style={styles.vitalCardUnit}>saturation</Text>
                </View>

                {/* Temperature */}
                <View style={styles.vitalCard}>
                  <Text style={styles.vitalEmoji}>🌡️</Text>
                  <Text style={styles.vitalCardLabel}>Temperature</Text>
                  <Text style={styles.vitalCardValue}>{latestVitals.temperature}°C</Text>
                  <Text style={styles.vitalCardUnit}>body temp</Text>
                </View>

                {/* Blood Sugar (if recorded) */}
                {latestVitals.bloodSugar != null && (
                  <View style={[styles.vitalCard, { flexBasis: '100%' }]}>
                    <Text style={styles.vitalEmoji}>🧪</Text>
                    <Text style={styles.vitalCardLabel}>Blood Glucose</Text>
                    <Text style={styles.vitalCardValue}>{latestVitals.bloodSugar}</Text>
                    <Text style={styles.vitalCardUnit}>mg/dL</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.vitalsPendingBanner}>
                <MaterialCommunityIcons name="clipboard-pulse-outline" size={20} color={COLORS.primaryText} style={{ marginRight: 8 }} />
                <Text style={styles.vitalsPendingText}>
                  Vitals will be recorded live by the nurse during the home visit.
                </Text>
              </View>
            )}

            {/* Quick Visit Action */}
            <TouchableOpacity
              style={styles.visitCheckInButton}
              activeOpacity={0.85}
              onPress={() => navigate(`/(patient)/visits/${visit.id}`)}
            >
              <MaterialCommunityIcons name="qrcode-scan" size={18} color={COLORS.onAccent} style={{ marginRight: 8 }} />
              <Text style={styles.visitCheckInButtonText}>Show Visit QR Code & Details</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tracking Stepper */}
        <View style={styles.stepperContainer}>
          <Text style={styles.sectionHeaderTitle}>Care Journey Status</Text>
          <RequestTrackingStepper steps={trackingSteps} />
        </View>

        {/* Action Buttons */}
        {(isCancelable || isReschedulable) && (
          <View style={styles.actionsContainer}>
            {isCancelable && (
              <Button
                mode="outlined"
                textColor={COLORS.red}
                style={[styles.actionBtn, { borderColor: COLORS.red }]}
                onPress={() => setShowCancelModal(true)}
              >
                Cancel Request
              </Button>
            )}
            {isReschedulable && (
              <Button
                mode="contained"
                buttonColor={COLORS.navy}
                textColor={COLORS.onAccent}
                style={styles.actionBtn}
                onPress={() => setShowRescheduleModal(true)}
              >
                Reschedule
              </Button>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      <CancelRequestModal
        visible={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancel}
        isLoading={cancelCareRequest.isPending}
      />

      <RescheduleRequestModal
        visible={showRescheduleModal}
        onClose={() => setShowRescheduleModal(false)}
        onConfirm={handleReschedule}
        isLoading={rescheduleCareRequest.isPending}
      />
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  container: {
    padding: SPACING.md,
    paddingBottom: 60,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    color: COLORS.textBody,
    fontSize: 14,
    marginTop: SPACING.md,
  },
  errorText: {
    color: COLORS.red,
    fontSize: 15,
    fontWeight: '600',
    marginTop: SPACING.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.dividerLight,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.surface,
  },
  headerTitle: {
    color: COLORS.textDark,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '700',
  },

  /* Order Header Card */
  orderHeaderCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    marginBottom: SPACING.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  orderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderId: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  orderSubtitle: {
    fontSize: 12,
    color: COLORS.textBody,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.round,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  divider: {
    backgroundColor: COLORS.dividerLight,
    marginVertical: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 13,
    color: COLORS.textBody,
    flex: 1,
  },
  orderNotesBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.dividerLight,
  },
  orderNotesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryText,
    marginBottom: 2,
  },
  orderNotesText: {
    fontSize: 12,
    color: COLORS.textBody,
  },

  /* ─────────────────────────────────────────────────────────────
     CLINICAL VISIT & RISK ASSESSMENT CARD
  ───────────────────────────────────────────────────────────── */
  visitAssessmentCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1.5,
    borderColor: COLORS.blueLight,
    marginBottom: SPACING.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  visitHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  nurseInfoCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  avatarRing: {
    borderWidth: 2,
    borderColor: COLORS.emeraldLight,
    borderRadius: RADIUS.round,
    padding: 2,
  },
  avatarTeal: {
    backgroundColor: COLORS.emeraldLight,
  },
  avatarLabelTeal: {
    fontSize: 15,
    fontWeight: '800',
  },
  visitTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  visitSubtitleText: {
    fontSize: 11,
    color: COLORS.textBody,
    marginTop: 2,
  },

  /* Score & Risk Tier Badge Next to Visit */
  riskBadgeContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  riskTierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.round,
  },
  riskTierText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: COLORS.headerOverlayMid,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.round,
    gap: 3,
  },
  scoreNumberText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primaryText,
  },
  scoreLabelText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textBody,
  },
  pendingRiskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.dividerLight,
  },
  pendingRiskText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textBody,
  },

  /* Assessment Notes */
  assessmentNotesBox: {
    backgroundColor: COLORS.blueLight,
    padding: 12,
    borderRadius: RADIUS.md,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.blueLight,
  },
  assessmentNotesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  assessmentNotesTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryText,
  },
  assessmentNotesText: {
    fontSize: 12,
    color: COLORS.textBody,
    lineHeight: 17,
  },
  doctorSupervisionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.blueLight,
  },
  doctorSupervisionText: {
    fontSize: 11,
    color: COLORS.textDark,
  },

  /* Vitals Grid */
  vitalsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  vitalsSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  vitalsTimestamp: {
    fontSize: 11,
    color: COLORS.textBody,
    fontWeight: '500',
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vitalCard: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: COLORS.surface,
    padding: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.dividerLight,
  },
  vitalEmoji: {
    fontSize: 16,
    marginBottom: 2,
  },
  vitalCardLabel: {
    fontSize: 11,
    color: COLORS.textBody,
    fontWeight: '600',
  },
  vitalCardValue: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textDark,
    marginTop: 2,
  },
  vitalCardUnit: {
    fontSize: 10,
    color: COLORS.textBody,
    fontWeight: '500',
  },
  vitalsPendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.dividerLight,
  },
  vitalsPendingText: {
    fontSize: 12,
    color: COLORS.textBody,
    flex: 1,
  },

  visitCheckInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.navy,
    paddingVertical: 11,
    borderRadius: RADIUS.md,
    marginTop: 14,
  },
  visitCheckInButtonText: {
    color: COLORS.onAccent,
    fontSize: 13,
    fontWeight: '700',
  },

  /* Stepper */
  stepperContainer: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    marginBottom: SPACING.md,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 10,
  },

  /* Action Buttons */
  actionsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  actionBtn: {
    flex: 1,
    borderRadius: RADIUS.md,
  },
}));
