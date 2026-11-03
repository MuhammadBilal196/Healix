import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../theme';
import { CareRequestResponse } from '../../types/care';

interface CareJourneyCardProps {
  request: CareRequestResponse;
  onCardPress: () => void;
  onCheckInPress?: (visitId: string) => void;
  onCompareOffersPress?: (listingId: string) => void;
  onViewContractPress?: (contractId: string) => void;
  onRebookPress?: (nurseName?: string) => void;
}

export const CareJourneyCard: React.FC<CareJourneyCardProps> = ({
  request,
  onCardPress,
  onCheckInPress,
  onCompareOffersPress,
  onViewContractPress,
  onRebookPress,
}) => {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const reqData = request as any;
  // Pick the visit that matters now. visits[0] used to be the first-ever visit, so a completed
  // visit kept showing as "Scheduled" with its old date.
  const allVisits: any[] = reqData?.visits?.length ? reqData.visits : reqData?.visit ? [reqData.visit] : [];
  const startOf = (v: any) => Date.parse(v?.agreedStartTime || v?.scheduledAt || v?.createdAt || 0) || 0;
  const awaitingReview = allVisits.filter(v => v.status === 'COMPLETED' && !v.completionApprovedAt).sort((a, b) => startOf(b) - startOf(a));
  const upcoming = allVisits.filter(v => ['SCHEDULED', 'ACCEPTED', 'IN_PROGRESS'].includes(v.status)).sort((a, b) => startOf(a) - startOf(b));
  const finished = allVisits.filter(v => v.status === 'COMPLETED').sort((a, b) => startOf(b) - startOf(a));
  const visit = awaitingReview[0] || upcoming[0] || finished[0] || allVisits[0] || null;
  const completedCount = finished.length;
  const nurse = visit?.nurse?.user || reqData?.nurse?.user;
  const nurseName = nurse?.fullName || (request.type === 'NURSE_VISIT' ? 'Assigned Nurse' : 'Assigned Doctor');
  const serviceTitle = request.requirements || (request.type === 'NURSE_VISIT' ? 'Home Nurse Care' : 'Doctor Consultation');
  const latestAssessment = visit?.assessments && visit.assessments.length > 0 ? visit.assessments[0] : null;
  const latestVitals = visit?.vitals && visit.vitals.length > 0 ? visit.vitals[0] : null;
  
  const nurseInitials = nurseName
    ? nurseName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'RN';

  const scheduledDate = visit?.agreedStartTime || visit?.scheduledAt || request.scheduledAt || request.preferredDate;
  const formattedDate = scheduledDate
    ? new Date(scheduledDate).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : 'Date TBD';

  const formattedTime = scheduledDate
    ? new Date(scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const isToday = scheduledDate ? new Date(scheduledDate).toDateString() === new Date().toDateString() : false;

  // ─────────────────────────────────────────────────────────────
  // 1. UPCOMING WITH ASSIGNED VISIT
  // ─────────────────────────────────────────────────────────────
  if (request.status === 'ASSIGNED' || request.status === 'IN_PROGRESS' || (visit && request.status !== 'COMPLETED' && request.status !== 'CANCELLED')) {
    const recurringNote = request.scheduleType === 'RECURRING' && completedCount > 0 ? ` · visit ${completedCount + (visit?.status === 'COMPLETED' ? 0 : 1)} of series` : '';
    const visitTimingText = visit?.status === 'COMPLETED' && !visit?.completionApprovedAt
      ? 'Visit completed · tap to review and approve'
      : visit?.status === 'IN_PROGRESS'
        ? 'Visit in progress now'
        : (isToday
          ? `Visit today${formattedTime ? ` · ${formattedTime}` : ''}`
          : `Scheduled ${formattedDate}${formattedTime ? ` · ${formattedTime}` : ''}`) + recurringNote;

    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.88} onPress={onCardPress}>
        <View style={styles.cardHeader}>
          <View style={styles.avatarRing}>
            <Avatar.Text
              size={48}
              label={nurseInitials}
              style={styles.avatarTeal}
              labelStyle={styles.avatarLabelTeal}
              color={COLORS.careEmerald}
            />
          </View>
          <View style={styles.headerInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
              <Text style={[styles.titleBold, { flex: 1 }]} numberOfLines={1}>
                {nurseName.startsWith('Nurse') || nurseName.startsWith('Dr') ? nurseName : `Nurse ${nurseName}`}
              </Text>
              {latestAssessment && (
                <View style={styles.cardRiskRow}>
                  <View
                    style={[
                      styles.miniRiskBadge,
                      {
                        backgroundColor:
                          latestAssessment.riskTier === 'HIGH' || latestAssessment.riskTier === 'CRITICAL'
                            ? COLORS.redLight
                            : latestAssessment.riskTier === 'MEDIUM'
                            ? COLORS.amberLight
                            : COLORS.emeraldLight,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.miniRiskText,
                        {
                          color:
                            latestAssessment.riskTier === 'HIGH' || latestAssessment.riskTier === 'CRITICAL'
                              ? COLORS.red
                              : latestAssessment.riskTier === 'MEDIUM'
                              ? COLORS.amber
                              : COLORS.emerald,
                        },
                      ]}
                    >
                      {latestAssessment.riskTier}
                    </Text>
                  </View>
                  <View style={styles.miniScoreBadge}>
                    <Text style={styles.miniScoreText}>
                      Score {Math.round(latestAssessment.fusedScore)}%
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <Text style={styles.serviceSub} numberOfLines={1}>
              {serviceTitle}
            </Text>
            <Text style={styles.timingAmber} numberOfLines={1}>
              {visitTimingText}
            </Text>
            {latestVitals && (
              <Text style={styles.vitalsSummaryText} numberOfLines={1}>
                🩺 {latestVitals.systolic}/{latestVitals.diastolic} mmHg · {latestVitals.heartRate} bpm · {latestVitals.oxygenSaturation}% SpO₂
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.primaryActionButton}
          activeOpacity={0.85}
          onPress={() => {
            if (visit?.id && onCheckInPress) {
              onCheckInPress(visit.id);
            } else {
              onCardPress();
            }
          }}
        >
          <Text style={styles.primaryActionText}>{visit?.id ? 'Show visit QR code' : 'View visit status'}</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. CONTRACT PENDING APPROVAL (AFTER OFFER SELECTION)
  // ─────────────────────────────────────────────────────────────
  if (request.contract && request.contract.status === 'PENDING_APPROVAL') {
    const contract = request.contract;
    const contractNurse = contract.nurse?.user?.fullName || nurseName || 'Nurse';
    const contractNurseInitials = contractNurse
      ? contractNurse
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .substring(0, 2)
          .toUpperCase()
      : 'RN';

    const priceText = `PKR ${contract.price} · ${contract.priceType === 'HOURLY' ? 'Hourly rate' : 'Fixed rate'}`;
    const approvalStatusText = contract.patientApproved
      ? 'Awaiting nurse confirmation'
      : 'Contract ready for review';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={() => {
          if (onViewContractPress) {
            onViewContractPress(contract.id);
          } else {
            onCardPress();
          }
        }}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.avatarRing, { borderColor: COLORS.blueLight }]}>
            <Avatar.Text
              size={48}
              label={contractNurseInitials}
              style={{ backgroundColor: COLORS.blueLight }}
              labelStyle={[styles.avatarLabelTeal, { color: COLORS.accentBlue }]}
              color={COLORS.accentBlue}
            />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.titleBold} numberOfLines={1}>
              {approvalStatusText}
            </Text>
            <Text style={styles.serviceSub} numberOfLines={1}>
              {contractNurse.startsWith('Nurse') || contractNurse.startsWith('Dr') ? contractNurse : `Nurse ${contractNurse}`} · {serviceTitle}
            </Text>
            <Text style={[styles.timingAmber, { color: COLORS.accentBlue }]} numberOfLines={1}>
              {priceText}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.primaryActionButton, { backgroundColor: COLORS.navy }]}
          activeOpacity={0.85}
          onPress={() => {
            if (onViewContractPress) {
              onViewContractPress(contract.id);
            } else {
              onCardPress();
            }
          }}
        >
          <Text style={styles.primaryActionText}>
            {contract.patientApproved ? 'View contract details' : 'Review contract'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 3. OPEN REQUEST (AWAITING OFFERS OR HAS OFFERS)
  // ─────────────────────────────────────────────────────────────
  if (request.status === 'OPEN') {
    const listingId = request.marketplaceListing?.id || request.id;
    const offersCount = request.marketplaceListing?._count?.offers ?? 0;
    const hasOffers = offersCount > 0;
    const requestedTiming = request.createdAt
      ? `Requested ${new Date(request.createdAt).toLocaleDateString(undefined, { weekday: 'long' })}`
      : 'Requested recently';

    const actionText = offersCount === 1 ? 'See offers' : 'Compare offers';

    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.88} onPress={onCardPress}>
        <View style={styles.cardHeader}>
          {hasOffers ? (
            /* Stacked Avatars Visual — only when offers exist */
            <View style={styles.stackedAvatarsRow}>
              <View style={[styles.miniAvatar, { backgroundColor: COLORS.surfaceCard, zIndex: 3 }]}>
                <Text style={[styles.miniAvatarText, { color: COLORS.primaryText }]}>HM</Text>
              </View>
              <View style={[styles.miniAvatar, { backgroundColor: COLORS.surfaceCard, marginLeft: -12, zIndex: 2 }]}>
                <Text style={[styles.miniAvatarText, { color: COLORS.primaryText }]}>AR</Text>
              </View>
              {offersCount > 2 && (
                <View style={[styles.miniAvatar, { backgroundColor: COLORS.amberLight, marginLeft: -12, zIndex: 1 }]}>
                  <Text style={[styles.miniAvatarText, { color: COLORS.red }]}>+{offersCount - 2}</Text>
                </View>
              )}
            </View>
          ) : (
            /* Waiting indicator when no offers yet */
            <View style={styles.waitingAvatarRing}>
              <View style={styles.waitingDot} />
            </View>
          )}

          <View style={styles.headerInfo}>
            <Text style={styles.titleBold} numberOfLines={1}>
              {hasOffers
                ? `${offersCount} offer${offersCount > 1 ? 's' : ''} available`
                : 'Awaiting nurse offers'}
            </Text>
            <Text style={styles.serviceSub} numberOfLines={1}>
              {serviceTitle}
            </Text>
            <Text style={styles.timingMuted} numberOfLines={1}>
              {requestedTiming}
            </Text>
          </View>
        </View>

        {hasOffers ? (
          <TouchableOpacity
            style={styles.primaryActionButton}
            activeOpacity={0.85}
            onPress={() => {
              if (onCompareOffersPress) {
                onCompareOffersPress(listingId);
              } else {
                onCardPress();
              }
            }}
          >
            <Text style={styles.primaryActionText}>{actionText}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.waitingBar}>
            <Text style={styles.waitingBarText}>Your request is live on the marketplace</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 3. COMPLETED CARE
  // ─────────────────────────────────────────────────────────────
  if (request.status === 'COMPLETED') {
    const completedDateText = request.updatedAt
      ? `Completed ${new Date(request.updatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`
      : 'Completed';

    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.88} onPress={onCardPress}>
        <View style={styles.cardHeader}>
          <View style={styles.avatarRing}>
            <Avatar.Text
              size={48}
              label={nurseInitials}
              style={styles.avatarTeal}
              labelStyle={styles.avatarLabelTeal}
              color={COLORS.careEmerald}
            />
          </View>
          <View style={styles.headerInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
              <Text style={[styles.titleBold, { flex: 1 }]} numberOfLines={1}>
                {serviceTitle}
              </Text>
              {latestAssessment && (
                <View style={styles.cardRiskRow}>
                  <View
                    style={[
                      styles.miniRiskBadge,
                      {
                        backgroundColor:
                          latestAssessment.riskTier === 'HIGH' || latestAssessment.riskTier === 'CRITICAL'
                            ? COLORS.redLight
                            : latestAssessment.riskTier === 'MEDIUM'
                            ? COLORS.amberLight
                            : COLORS.emeraldLight,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.miniRiskText,
                        {
                          color:
                            latestAssessment.riskTier === 'HIGH' || latestAssessment.riskTier === 'CRITICAL'
                              ? COLORS.red
                              : latestAssessment.riskTier === 'MEDIUM'
                              ? COLORS.amber
                              : COLORS.emerald,
                        },
                      ]}
                    >
                      {latestAssessment.riskTier}
                    </Text>
                  </View>
                  <View style={styles.miniScoreBadge}>
                    <Text style={styles.miniScoreText}>
                      Score {Math.round(latestAssessment.fusedScore)}%
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <Text style={styles.serviceSub} numberOfLines={1}>
              {nurseName.startsWith('Nurse') || nurseName.startsWith('Dr') ? nurseName : `Nurse ${nurseName}`}
            </Text>
            <Text style={styles.timingMuted} numberOfLines={1}>
              {completedDateText}
            </Text>
            {latestVitals && (
              <Text style={styles.vitalsSummaryText} numberOfLines={1}>
                🩺 {latestVitals.systolic}/{latestVitals.diastolic} mmHg · {latestVitals.heartRate} bpm · {latestVitals.oxygenSaturation}% SpO₂
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.outlinedActionButton}
          activeOpacity={0.85}
          onPress={() => {
            if (onRebookPress) {
              onRebookPress(nurseName);
            } else {
              onCardPress();
            }
          }}
        >
          <Text style={styles.outlinedActionText}>
            Book {nurseName.split(' ')[0]} again
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 4. CANCELLED / OTHER FALLBACK
  // ─────────────────────────────────────────────────────────────
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.88} onPress={onCardPress}>
      <View style={styles.cardHeader}>
        <View style={[styles.avatarRing, { borderColor: COLORS.redLight }]}>
          <Avatar.Text
            size={48}
            label={nurseInitials}
            style={{ backgroundColor: COLORS.redLight }}
            labelStyle={styles.avatarLabelTeal}
            color={COLORS.red}
          />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.titleBold} numberOfLines={1}>
            {serviceTitle}
          </Text>
          <Text style={styles.serviceSub} numberOfLines={1}>
            Status: {request.status}
          </Text>
          <Text style={styles.timingMuted} numberOfLines={1}>
            {formattedDate}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.outlinedActionButton}
        activeOpacity={0.85}
        onPress={onCardPress}
      >
        <Text style={styles.outlinedActionText}>View details</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatarRing: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: COLORS.emeraldLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarTeal: {
    backgroundColor: COLORS.emeraldLight,
  },
  avatarLabelTeal: {
    fontSize: 16,
    fontWeight: '700',
  },
  stackedAvatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 60,
    marginRight: SPACING.sm,
  },
  miniAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniAvatarText: {
    fontSize: 11,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
  },
  titleBold: {
    color: COLORS.textDark,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  serviceSub: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: 2,
  },
  timingAmber: {
    color: COLORS.red, // Amber-700 for high-contrast visibility
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginTop: 3,
  },
  timingMuted: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.sizes.xs,
    marginTop: 3,
  },
  primaryActionButton: {
    backgroundColor: COLORS.purpleFill, // Deep royal indigo matching the screenshot button
    borderRadius: RADIUS.round,
    paddingVertical: SPACING.md - 2,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  primaryActionText: {
    color: COLORS.onAccent,
    fontSize: TYPOGRAPHY.sizes.sm + 1,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  outlinedActionButton: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.round,
    paddingVertical: SPACING.md - 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
  },
  outlinedActionText: {
    color: COLORS.textDark,
    fontSize: TYPOGRAPHY.sizes.sm + 1,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  waitingAvatarRing: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: COLORS.amberLight,
    backgroundColor: COLORS.amberLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  waitingDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.amber,
  },
  waitingBar: {
    backgroundColor: COLORS.amberLight,
    borderRadius: RADIUS.round,
    paddingVertical: SPACING.md - 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.amberLight,
  },
  waitingBarText: {
    color: COLORS.amber,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  cardRiskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniRiskBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.round,
  },
  miniRiskText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  miniScoreBadge: {
    backgroundColor: COLORS.headerOverlayMid,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.round,
  },
  miniScoreText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primaryText,
  },
  vitalsSummaryText: {
    fontSize: 11,
    color: COLORS.textBody,
    marginTop: 3,
    fontWeight: '500',
  },
}));
