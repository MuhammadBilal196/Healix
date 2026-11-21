import { useAppTheme, useThemeValue } from '../../../theme/ThemeProvider';
import type { ThemeColors } from '../../../theme';
import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, ActivityIndicator, TouchableOpacity, StatusBar } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { navigate } from '../../../utils/navigation';
import { useAuthStore } from '../../../store/auth';
import { useDoctorQueue, useDoctorHighRiskQueue, useStartCaseReview } from '../../../hooks/useDoctor';
import { ThemeToggleButton } from '../../../components/common/AppearanceSettings';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../../theme';
import { AssignedEmergencyBanner } from '../../../components/emergency/AssignedEmergencyBanner';

export default function DoctorDashboard() {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const user = useAuthStore(s => s.user);
  const [filter, setFilter] = useState<'ALL' | 'HIGH'>('ALL');
  const [actionError, setActionError] = useState('');
  const queue = useDoctorQueue();
  const alerts = useDoctorHighRiskQueue();
  const start = useStartCaseReview();
  const selected = filter === 'ALL' ? queue : alerts;
  const cases = selected.data || [];
  const refresh = () => Promise.all([queue.refetch(), alerts.refetch()]);

  const open = async (id: string, status: string) => {
    setActionError('');
    try {
      if (status !== 'IN_REVIEW') await start.mutateAsync(id);
      navigate(`/(doctor)/reviews/${id}`);
    } catch (e: any) {
      setActionError(e.message || 'Unable to open this case');
      void refresh();
    }
  };

  const totalCount = queue.data?.length || 0;
  const urgentCount = alerts.data?.length || 0;
  const overdueCount = (alerts.data || []).filter(item => {
    const mins = Math.ceil((Date.parse(item.slaDeadline) - Date.now()) / 60000);
    return Number.isFinite(mins) && mins <= 5;
  }).length;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={selected.isRefetching}
            onRefresh={() => void refresh()}
            tintColor={COLORS.primaryText}
          />
        }
      >
        {/* Clinical Navy Hero Banner */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.eyebrow}>CONSULTANT TRIAGE</Text>
              <Text style={styles.name}>{user?.fullName || 'Doctor'}</Text>
              <Text style={styles.headerText}>
                Review assigned clinical escalations &amp; urgent SLA broadcasts
              </Text>
            </View>
            <ThemeToggleButton compact inverse />
          </View>

          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiVal}>{totalCount}</Text>
              <Text style={styles.kpiLabel}>My Queue</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={[styles.kpiVal, { color: COLORS.accentBlue }]}>{urgentCount}</Text>
              <Text style={styles.kpiLabel}>Urgent SLA</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={[styles.kpiVal, { color: overdueCount > 0 ? COLORS.red : COLORS.emerald }]}>
                {overdueCount}
              </Text>
              <Text style={styles.kpiLabel}>Due &le; 5m</Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <AssignedEmergencyBanner />

          {/* Quick Clinical Shortcuts */}
          <View style={styles.quickActionRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.quickActionCard}
              onPress={() => navigate('/(doctor)/emergency')}
            >
              <View style={[styles.quickIcon, { backgroundColor: COLORS.redLight }]}>
                <Ionicons name="medical-outline" size={20} color={COLORS.red} />
              </View>
              <Text style={styles.quickLabel}>Emergency Fleet</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.quickActionCard}
              onPress={() => navigate('/(doctor)/(tabs)/messages')}
            >
              <View style={[styles.quickIcon, { backgroundColor: COLORS.blueLight }]}>
                <Ionicons name="chatbubbles-outline" size={20} color={COLORS.navy} />
              </View>
              <Text style={styles.quickLabel}>Care Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.quickActionCard}
              onPress={() => navigate('/analytics')}
            >
              <View style={[styles.quickIcon, { backgroundColor: COLORS.emeraldLight }]}>
                <Ionicons name="analytics-outline" size={20} color={COLORS.emerald} />
              </View>
              <Text style={styles.quickLabel}>Reports</Text>
            </TouchableOpacity>
          </View>

          {/* Segmented Queue Switch */}
          <View style={styles.segmentedBar}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.segBtn, filter === 'ALL' && styles.segBtnActive]}
              onPress={() => setFilter('ALL')}
            >
              <Text style={[styles.segText, filter === 'ALL' && styles.segTextActive]}>
                Assigned ({totalCount})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.segBtn, filter === 'HIGH' && styles.segBtnActive]}
              onPress={() => setFilter('HIGH')}
            >
              <Text style={[styles.segText, filter === 'HIGH' && styles.segTextActive]}>
                Urgent Broadcasts ({urgentCount})
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>
            {filter === 'ALL' ? 'Active Assigned Cases' : 'High & Critical Risk Cases'}
          </Text>

          {(actionError || selected.error) && (
            <View style={styles.notice}>
              <Text accessibilityRole="alert" style={styles.error}>
                {actionError || (selected.error as Error).message}
              </Text>
              <Button mode="outlined" compact onPress={() => void refresh()}>
                Retry
              </Button>
            </View>
          )}

          {selected.isLoading ? (
            <ActivityIndicator color={COLORS.primaryText} style={{ marginTop: SPACING.md }} />
          ) : !selected.error && !cases.length ? (
            <Card style={styles.card}>
              <Card.Content style={{ alignItems: 'center', paddingVertical: SPACING.xl }}>
                <Ionicons name="checkmark-done-circle-outline" size={34} color={COLORS.emerald} />
                <Text style={[styles.title, { marginTop: SPACING.sm, marginBottom: 4 }]}>
                  No cases in this queue
                </Text>
                <Text style={[styles.bodyText, { textAlign: 'center' }]}>
                  {filter === 'ALL'
                    ? 'New assignments will appear here. Check Urgent Broadcasts for high-risk escalations.'
                    : 'No eligible urgent cases are awaiting your review.'}
                </Text>
              </Card.Content>
            </Card>
          ) : (
            cases.map(item => {
              const broadcast = ['PROFESSIONAL_BROADCAST', 'GENERAL_BROADCAST', 'ADMIN_ESCALATED'].includes(
                item.status
              );
              const mins = Math.ceil((Date.parse(item.slaDeadline) - Date.now()) / 60000);
              const isHighRisk = ['HIGH', 'CRITICAL'].includes(item.riskTier);
              const sla = Number.isFinite(mins)
                ? mins <= 0
                  ? 'Response overdue'
                  : `${mins} min left to respond`
                : 'No response deadline';
              const urgentSla = Number.isFinite(mins) && mins <= 5;

              return (
                <Card
                  key={item.id}
                  style={[
                    styles.card,
                    { borderLeftWidth: 4, borderLeftColor: isHighRisk ? COLORS.red : COLORS.amber },
                  ]}
                >
                  <Card.Content style={{ gap: SPACING.sm }}>
                    <View style={styles.caseHeaderRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.title}>
                          {item.visit?.request?.patient?.user?.fullName || 'Patient'}
                        </Text>
                        <Text style={styles.caseStatus}>{item.status.replaceAll('_', ' ')}</Text>
                      </View>
                      <View
                        style={[
                          styles.riskBadge,
                          { backgroundColor: isHighRisk ? COLORS.redLight : COLORS.amberLight },
                        ]}
                      >
                        <Text
                          style={{
                            color: isHighRisk ? COLORS.red : COLORS.amber,
                            fontSize: 11,
                            fontWeight: '800',
                          }}
                        >
                          {item.riskTier} RISK
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.slaRow,
                        { backgroundColor: urgentSla ? COLORS.redLight : COLORS.surface },
                      ]}
                    >
                      <Ionicons
                        name="time-outline"
                        size={15}
                        color={urgentSla ? COLORS.red : COLORS.textBody}
                      />
                      <Text style={[styles.bodyText, urgentSla && { color: COLORS.red, fontWeight: '700' }]}>
                        {sla}
                      </Text>
                    </View>

                    <View style={styles.caseActionRow}>
                      <Button
                        mode="contained"
                        buttonColor={COLORS.navy}
                        textColor={COLORS.onAccent}
                        disabled={start.isPending}
                        loading={start.isPending && start.variables === item.id}
                        onPress={() => void open(item.id, item.status)}
                        style={{ flex: 1 }}
                      >
                        {broadcast ? 'Accept & Review' : item.status === 'ASSIGNED' ? 'Start Review' : 'Continue Review'}
                      </Button>
                      <Button
                        mode="outlined"
                        textColor={COLORS.primaryText}
                        onPress={() => navigate(`/(doctor)/reviews/${item.id}`)}
                      >
                        Details
                      </Button>
                    </View>
                  </Card.Content>
                </Card>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.surface },
    content: { paddingBottom: SPACING.xxxl },
    header: {
      backgroundColor: COLORS.navyDark,
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.lg,
      paddingBottom: SPACING.xl,
      borderBottomLeftRadius: RADIUS.xl,
      borderBottomRightRadius: RADIUS.xl,
      gap: SPACING.md,
    },
    headerTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    eyebrow: {
      color: COLORS.accentBlue,
      fontSize: 10.5,
      fontWeight: '800',
      letterSpacing: 1,
    },
    name: {
      color: COLORS.headerText,
      fontSize: TYPOGRAPHY.sizes.xxl,
      fontWeight: TYPOGRAPHY.weights.extrabold,
      marginTop: 2,
    },
    headerText: {
      color: COLORS.inverseMuted,
      fontSize: 12.5,
      marginTop: 2,
    },
    kpiRow: {
      flexDirection: 'row',
      gap: SPACING.sm,
    },
    kpiCard: {
      flex: 1,
      backgroundColor: COLORS.headerAvatarBg,
      borderRadius: RADIUS.md,
      paddingVertical: 10,
      paddingHorizontal: 10,
      alignItems: 'center',
    },
    kpiVal: {
      color: COLORS.headerText,
      fontSize: 20,
      fontWeight: '800',
    },
    kpiLabel: {
      color: COLORS.inverseMuted,
      fontSize: 11,
      fontWeight: '600',
      marginTop: 2,
    },
    body: {
      padding: SPACING.lg,
      gap: SPACING.md,
    },
    quickActionRow: {
      flexDirection: 'row',
      gap: SPACING.sm,
    },
    quickActionCard: {
      flex: 1,
      backgroundColor: COLORS.surfaceCard,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: COLORS.inputBorder,
      padding: SPACING.md,
      alignItems: 'center',
      gap: 6,
    },
    quickIcon: {
      width: 38,
      height: 38,
      borderRadius: RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quickLabel: {
      color: COLORS.textDark,
      fontSize: 11.5,
      fontWeight: '700',
      textAlign: 'center',
    },
    segmentedBar: {
      flexDirection: 'row',
      backgroundColor: COLORS.surfaceMuted,
      borderRadius: RADIUS.md,
      padding: 4,
      borderWidth: 1,
      borderColor: COLORS.inputBorder,
    },
    segBtn: {
      flex: 1,
      paddingVertical: 9,
      borderRadius: RADIUS.sm,
      alignItems: 'center',
    },
    segBtnActive: {
      backgroundColor: COLORS.navy,
    },
    segText: {
      color: COLORS.textBody,
      fontSize: 12.5,
      fontWeight: '700',
    },
    segTextActive: {
      color: COLORS.onAccent,
    },
    sectionTitle: {
      color: COLORS.textDark,
      fontSize: TYPOGRAPHY.sizes.md,
      fontWeight: '800',
      marginTop: 2,
    },
    card: {
      backgroundColor: COLORS.surfaceCard,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: COLORS.inputBorder,
    },
    caseHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: SPACING.sm,
    },
    title: {
      color: COLORS.textDark,
      fontSize: TYPOGRAPHY.sizes.lg,
      fontWeight: TYPOGRAPHY.weights.bold,
    },
    caseStatus: {
      color: COLORS.textMuted,
      fontSize: 11.5,
      fontWeight: '600',
      marginTop: 2,
    },
    riskBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: RADIUS.round,
    },
    slaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: RADIUS.sm,
    },
    bodyText: {
      color: COLORS.textBody,
      fontSize: TYPOGRAPHY.sizes.sm,
    },
    caseActionRow: {
      flexDirection: 'row',
      gap: SPACING.sm,
      marginTop: 4,
    },
    error: { color: COLORS.red, flex: 1, fontWeight: '600' },
    notice: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      backgroundColor: COLORS.redLight,
      borderWidth: 1,
      borderColor: COLORS.red,
      padding: SPACING.md,
      borderRadius: RADIUS.md,
    },
  });
