import { useAppTheme, useThemeValue } from '../../../theme/ThemeProvider';
import type { ThemeColors } from '../../../theme';
import React from 'react';
import { StyleSheet, View, ScrollView, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { Text, Card, Avatar, ProgressBar, Button } from 'react-native-paper';
import { navigate } from '../../../utils/navigation';
import { useAuthStore } from '../../../store/auth';
import { useCarePlans, useCompleteMilestone } from '../../../hooks/useHealth';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../../theme';
import { LoadingState } from '../../../components/common/LoadingState';
import { appAlert } from '../../../components/common/AppDialogs';
import { ErrorState } from '../../../components/common/ErrorState';

export default function CarePlansScreen() {
  const { dark: isDarkTheme } = useAppTheme();

  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const { user } = useAuthStore();
  const patientId = user?.patientId || '';

  const { data: carePlans = [], isLoading, error, refetch } = useCarePlans(patientId);
  const { mutateAsync: completeMilestone, isPending: isCompleting } = useCompleteMilestone();

  const handleComplete = async (milestoneId: string) => {
    try {
      await completeMilestone(milestoneId);
    } catch (err) {
      appAlert('Could not update milestone', err instanceof Error ? err.message : 'Please try again.');
    }
  };

  if (isLoading && carePlans.length === 0) return <LoadingState message="Loading care plans..." />;
  if (error) return <ErrorState error={error as Error} onRetry={refetch} />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>My Care Plans</Text>
        </View>

        <Text style={styles.subtitle}>Track your recovery pathways and clinical milestones</Text>

        <Card style={styles.card}>
          <Card.Title
            title="Active Care Plans"
            titleStyle={styles.cardTitle}
            subtitle="Assigned recovery programs"
            subtitleStyle={styles.cardSub}
            left={(props) => (
              <Avatar.Icon {...props} icon="clipboard-check-outline" color={COLORS.onAccent} style={{ backgroundColor: COLORS.emerald }} />
            )}
          />
          <Card.Content>
            {carePlans.length === 0 ? (
              <Text style={styles.emptyText}>No assigned care plans found.</Text>
            ) : (
              carePlans.map((plan: any) => (
                <View key={plan.id} style={styles.planItem}>
                  <Text style={styles.planTitle}>{plan.title}</Text><Button textColor={COLORS.accentBlue} onPress={() => navigate(`/care-plans/${plan.id}`)}>View version history</Button>
                  {plan.description && <Text style={styles.planDesc}>{plan.description}</Text>}
                  
                  <View style={styles.progressContainer}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>Rehab Progress</Text>
                      <Text style={styles.progressPercent}>{Math.round(plan.progress || 0)}%</Text>
                    </View>
                    <ProgressBar progress={(plan.progress || 0) / 100} color={COLORS.emerald} style={styles.progressBar} />
                  </View>

                  <View style={styles.milestonesContainer}>
                    <Text style={styles.milestonesTitle}>Milestones</Text>
                    {plan.milestones?.map((m: any) => (
                      <View key={m.id} style={styles.milestoneRow}>
                        <TouchableOpacity
                          style={[styles.checkbox, m.completed && styles.checkboxActive]}
                          onPress={() => !m.completed && handleComplete(m.id)}
                          disabled={m.completed || isCompleting}
                        >
                          {m.completed && <Text style={styles.checkText}>✓</Text>}
                        </TouchableOpacity>
                        <Text style={[styles.milestoneText, m.completed && styles.milestoneCompleted]}>{m.title}</Text>
                      </View>
                    ))}
                  </View>

                  <Text style={styles.dateLabel}>
                    Timeline: {new Date(plan.startDate).toLocaleDateString()} to {plan.endDate ? new Date(plan.endDate).toLocaleDateString() : 'Ongoing'}
                  </Text>
                </View>
              ))
            )}
          </Card.Content>
        </Card>

      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  center: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerTitle: {
    color: COLORS.textDark,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textBody,
    marginBottom: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  cardTitle: {
    color: COLORS.textDark,
    fontWeight: '700',
    fontSize: 16,
  },
  cardSub: {
    color: COLORS.textBody,
    fontSize: 12,
  },
  emptyText: {
    color: COLORS.textBody,
    textAlign: 'center',
    marginVertical: 16,
    fontStyle: 'italic',
  },
  planItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.inputBorder,
    paddingVertical: 16,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  planDesc: {
    fontSize: 13,
    color: COLORS.textBody,
    marginTop: 4,
  },
  progressContainer: {
    marginVertical: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    color: COLORS.textBody,
    fontWeight: '500',
  },
  progressPercent: {
    fontSize: 12,
    color: COLORS.emerald,
    fontWeight: 'bold',
  },
  milestonesContainer: { marginTop: 12, marginBottom: 12 },
  milestonesTitle: { fontSize: 14, fontWeight: "600", color: COLORS.textPrimary, marginBottom: 8 },
  milestoneRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: COLORS.teal, alignItems: "center", justifyContent: "center", marginRight: 12 },
  checkboxActive: { backgroundColor: COLORS.teal },
  checkText: { color: COLORS.onAccent, fontSize: 14, fontWeight: "bold" },
  milestoneText: { color: COLORS.textSecondary, fontSize: 14, flex: 1 },
  milestoneCompleted: { textDecorationLine: "line-through", color: COLORS.textMuted },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.emeraldLight,
  },
  dateLabel: {
    fontSize: 11,
    color: COLORS.textBody,
    marginTop: 4,
  },
}));

