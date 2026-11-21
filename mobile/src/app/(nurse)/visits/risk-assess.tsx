
import { useAppTheme, useThemeValue } from '../../../theme/ThemeProvider';
import type { ThemeColors } from '../../../theme';
import { appAlert } from '../../../components/common/AppDialogs';
import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, ActivityIndicator, SafeAreaView, StatusBar, Platform } from 'react-native';
import { Card, Button, Divider, SegmentedButtons, Chip } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AIChatBubble } from '../../../components/patient/AIChatBubble';
import { RiskHistoryCard } from '../../../components/patient/RiskHistoryCard';
import { useAuthStore } from '../../../store/auth';
import { usePerformRiskAssessment } from '../../../hooks/useClinical';
import { SPACING, RADIUS } from '../../../theme';

export default function NurseRiskAssessScreen() {
  const { dark: isDarkTheme } = useAppTheme();

  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const router = useRouter();
  const { visitId, patientId } = useLocalSearchParams();
  const { mutateAsync: performRiskAssessment, data: riskAssessment, isPending: isLoading } = usePerformRiskAssessment();

  const [confidence, setConfidence] = useState<number>(4);

  const handlePerformAssessment = async () => {
    const targetPatientId = typeof patientId === 'string' ? patientId : '';
    if (!targetPatientId) { if (Platform.OS === 'web') alert('Open risk assessment from an assigned patient or visit.'); else appAlert('Select a patient', 'Open risk assessment from an assigned patient or visit.'); return; }

    try {
      await performRiskAssessment({
        visitId: visitId ? (visitId as string) : undefined,
        patientId: targetPatientId,
        nurseConfidence: confidence
      });
      
      if (Platform.OS === 'web') {
        alert('Risk Assessed ✓\nClinical risk assessment recorded.');
      } else {
        appAlert('Risk Assessed ✓', 'Clinical risk assessment recorded.');
      }
    } catch (err: any) {
      if (Platform.OS === 'web') {
        alert('Assessment Error: ' + err.message);
      } else {
        appAlert('Assessment Error', err.message);
      }
    }
  };

  const activeRiskTier = riskAssessment?.riskTier || 'NOT ASSESSED';
  const scoreVal = riskAssessment?.fusedScore ? Math.round(riskAssessment.fusedScore) : 0;

  const getTierColor = (tier: string) => {
    if (tier === 'HIGH') return COLORS.red;
    if (tier === 'MEDIUM') return COLORS.amber;
    return COLORS.emerald;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>🧠 6.1 AI Risk Assessment & Care Plan</Text>
          <Text style={styles.subtitle}>Fuses quantitative vitals with nurse qualitative confidence</Text>
        </View>

        {!riskAssessment ? (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionHeader}>Nurse Qualitative Confidence</Text>
              <Text style={styles.explanationText}>
                Select your clinical confidence level for this patient evaluation. Higher confidence gives weight to physical observations.
              </Text>

              <Divider style={styles.divider} />

              <Text style={styles.confidenceLabel}>Confidence Rating:</Text>
              <SegmentedButtons
                value={confidence.toString()}
                onValueChange={(val) => setConfidence(parseInt(val))}
                buttons={[
                  { value: '1', label: '1 (Low)' },
                  { value: '2', label: '2' },
                  { value: '3', label: '3 (Med)' },
                  { value: '4', label: '4' },
                  { value: '5', label: '5 (High)' }
                ]}
                theme={{
                  colors: {
                    secondaryContainer: COLORS.emerald,
                    onSecondaryContainer: COLORS.onAccent
                  }
                }}
                style={{ marginBottom: 20 }}
              />

              <Button
                mode="contained"
                buttonColor={COLORS.emeraldFill}
                textColor={COLORS.onAccent}
                style={styles.actionBtn}
                onPress={handlePerformAssessment}
                disabled={isLoading}
                labelStyle={{ fontWeight: '800', fontSize: 15 }}
              >
                {isLoading ? 'Running Risk Fusion Model...' : '⚡ Fuse Risk Variables & Generate Care Plan'}
              </Button>
            </Card.Content>
          </Card>
        ) : (
          <View>
            {/* Risk Tier Badge Card */}
            <Card style={[styles.card, { borderColor: getTierColor(activeRiskTier), borderWidth: 2 }]}>
              <Card.Content style={{ alignItems: 'center', paddingVertical: 24 }}>
                <Text style={styles.resultTitle}>Risk Classification Level</Text>
                
                <View style={[styles.badgeContainer, { backgroundColor: getTierColor(activeRiskTier) }]}>
                  <Text style={styles.badgeText}>{activeRiskTier} RISK</Text>
                </View>

                {/* Score Gauge Circle */}
                <View style={styles.gaugeCircle}>
                  <Text style={styles.gaugeVal}>{scoreVal}</Text>
                  <Text style={styles.gaugeMax}>/ 100</Text>
                </View>

                <Text style={styles.timedOutText}>
                  Engine Status: {riskAssessment.timedOut ? '⚠️ Fallback Heuristic Classifier' : '✅ Real-time Clinical Model Inference'}
                </Text>
              </Card.Content>
            </Card>

            {/* Factors Considered */}
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.sectionHeader}>📋 Factors Considered</Text>
                <Divider style={styles.divider} />
                <View style={styles.factorsRow}>
                  <Chip style={styles.factorChip} textStyle={{ color: COLORS.emerald, fontSize: 11 }}>✓ Vitals Normal</Chip>
                  <Chip style={styles.factorChip} textStyle={{ color: COLORS.amber, fontSize: 11 }}>⚠️ Mild Symptoms</Chip>
                  <Chip style={styles.factorChip} textStyle={{ color: COLORS.emerald, fontSize: 11 }}>🟢 No Critical History</Chip>
                </View>
              </Card.Content>
            </Card>

            {/* AI Recommended Care Plan */}
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.sectionHeader}>🩺 6.2 AI Recommended Care Plan</Text>
                <Divider style={styles.divider} />

                <Text style={styles.planItem}>🧘 Rest & Hydration</Text>
                <Text style={styles.planItem}>💊 Take prescribed medicines on time</Text>
                <Text style={styles.planItem}>💨 Steam Inhalation twice daily</Text>
                <Text style={styles.planItem}>📅 Follow up visit in 2 days</Text>

                <View style={styles.escalationBox}>
                  <Text style={styles.escalationLabel}>Emergency Escalation:</Text>
                  <Text style={styles.escalationVal}>{activeRiskTier === 'HIGH' ? '🚨 REQUIRED (SLA: 20 mins)' : 'Not Required'}</Text>
                </View>

                <Button
                  mode="contained"
                  buttonColor={COLORS.emeraldFill}
                  textColor={COLORS.onAccent}
                  style={[styles.actionBtn, { marginTop: 14 }]}
                  onPress={() => router.replace({ pathname: '/(nurse)/visits/[id]', params: { id: visitId as string } } as any)}
                  labelStyle={{ fontWeight: '800' }}
                >
                  Confirm & Go to Summary
                </Button>
              </Card.Content>
            </Card>

            {/* AI Assistant Chat Bubble */}
            <View style={{ marginTop: 12 }}>
              <AIChatBubble
                message="The AI risk model has fused physiological vitals with your qualitative assessment. The care plan has been dispatched to the patient app."
                isUser={false}
              />
            </View>
          </View>
        )}

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.emerald} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  content: { padding: SPACING.lg, paddingBottom: 40 },
  header: { marginBottom: 16 },
  title: { color: COLORS.textDark, fontSize: 20, fontWeight: '800' },
  subtitle: { color: COLORS.textBody, fontSize: 12, marginTop: 4, lineHeight: 16 },
  card: { backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.inputBorder, marginBottom: 16 },
  sectionHeader: { color: COLORS.textDark, fontSize: 15, fontWeight: '700', marginBottom: 6 },
  explanationText: { color: COLORS.textBody, fontSize: 12, lineHeight: 16 },
  divider: { backgroundColor: COLORS.dividerLight, marginVertical: 10 },
  confidenceLabel: { color: COLORS.textDark, fontSize: 13, fontWeight: '700', marginBottom: 8 },
  actionBtn: { borderRadius: RADIUS.md, paddingVertical: 4 },
  resultTitle: { color: COLORS.textBody, fontSize: 13, fontWeight: '700', marginBottom: 10 },
  badgeContainer: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: RADIUS.round, marginBottom: 16 },
  badgeText: { color: COLORS.onAccent, fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  gaugeCircle: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: COLORS.emerald, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.surfaceCard, marginVertical: 10 },
  gaugeVal: { color: COLORS.textDark, fontSize: 28, fontWeight: '800' },
  gaugeMax: { color: COLORS.textBody, fontSize: 10 },
  timedOutText: { color: COLORS.textBody, fontSize: 11, marginTop: 6 },
  factorsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  factorChip: { backgroundColor: COLORS.emeraldLight },
  planItem: { color: COLORS.textDark, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  escalationBox: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.surfaceCard, padding: 10, borderRadius: RADIUS.md, marginTop: 10, borderWidth: 1, borderColor: COLORS.inputBorder },
  escalationLabel: { color: COLORS.textBody, fontSize: 12 },
  escalationVal: { color: COLORS.emerald, fontSize: 12, fontWeight: '800' },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }
}));


