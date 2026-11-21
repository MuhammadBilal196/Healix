import { useAppTheme, useThemeValue } from '../../../theme/ThemeProvider';
import type { ThemeColors } from '../../../theme';
import { useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Appbar, Button, Card, Text, TextInput, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { navigate, goBack } from '../../../utils/navigation';
import { useCaseReview, useConsultationDoctors, useStartCaseReview, useRequestSecondOpinion, useSubmitAiFeedback } from '../../../hooks/useDoctor';
import { useComplianceMetrics } from '../../../hooks/useClinical';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../../theme';

export default function CaseReviewScreen() {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const { id } = useLocalSearchParams<{ id: string }>();
  const review = useCaseReview(id || '');
  const data = review.data;
  const patient = data?.case.visit?.request?.patient;
  const compliance = useComplianceMetrics(patient?.id || '');
  const doctors = useConsultationDoctors();
  const start = useStartCaseReview();
  const opinion = useRequestSecondOpinion();
  const feedback = useSubmitAiFeedback();
  const [comment, setComment] = useState('');
  const [showDoctors, setShowDoctors] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const run = async (task: () => Promise<unknown>, success: string) => {
    setError(''); setMessage('');
    try { await task(); setMessage(success); } catch (e: any) { setError(e.message || 'Action failed'); }
  };
  const active = !!data && ['ASSIGNED', 'IN_REVIEW'].includes(data.case.status);
  const broadcast = !!data && ['PROFESSIONAL_BROADCAST', 'GENERAL_BROADCAST', 'ADMIN_ESCALATED'].includes(data.case.status);
  const busy = start.isPending || opinion.isPending || feedback.isPending;
  return <View style={styles.root}><Appbar.Header style={styles.header}><Appbar.BackAction onPress={goBack} color={COLORS.headerText} /><Appbar.Content title="Case Review" color={COLORS.headerText} /></Appbar.Header>
    <ScrollView contentContainerStyle={styles.content}>
      {review.isLoading && <ActivityIndicator color={COLORS.primaryText} />}
      {review.error && <Card style={styles.card}><Card.Content><Text accessibilityRole="alert" style={styles.error}>{(review.error as Error).message}</Text><Button onPress={() => void review.refetch()}>Retry</Button></Card.Content></Card>}
      {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}{message && <Text style={styles.success}>{message}</Text>}
      {data && <>
        <Card style={styles.card}><Card.Content><Text style={styles.title}>{patient?.user.fullName || 'Patient'}</Text><Text style={styles.body}>Risk: {data.case.riskTier} | {data.case.status.replaceAll('_', ' ')}</Text><Text style={styles.body}>Response deadline: {new Date(data.case.slaDeadline).toLocaleString()}</Text>
          {(broadcast || data.case.status === 'ASSIGNED') && <Button mode="contained" disabled={busy} loading={start.isPending} buttonColor={COLORS.navy} onPress={() => void run(() => start.mutateAsync(id), 'Case ready for review.')}>{broadcast ? 'Accept case' : 'Start review'}</Button>}
          {active ? <Button disabled={busy} textColor={COLORS.primaryText} onPress={() => navigate(`/(doctor)/action/${id}`)}>Diagnosis, care plan, prescriptions & decision</Button> : !broadcast && <Text style={styles.body}>This case is closed. Clinical actions are unavailable.</Text>}
        </Card.Content></Card>
        {patient?.id && <View style={styles.row}><Button onPress={() => navigate('/care-plans', { patientId: patient.id })}>Care plans and revisions</Button><Button onPress={() => navigate('/adherence', { patientId: patient.id })}>Scheduled-dose adherence</Button></View>}
      {compliance.data && <Card style={styles.card}><Card.Content><Text style={styles.title}>Care adherence</Text><Text style={styles.body}>Visits: {compliance.data.visitCompliance == null ? 'No due visits' : `${compliance.data.visitCompliance}%`} | Scheduled doses: {compliance.data.medicationCompliance == null ? 'No scheduled doses' : `${compliance.data.medicationCompliance}%`}</Text><Text style={styles.body}>{compliance.data.complianceFlag}</Text></Card.Content></Card>}
        <Card style={styles.card}><Card.Content><Text style={styles.title}>Recorded vitals</Text>{!data.clinicalData.vitals.length && <Text style={styles.body}>No vitals recorded.</Text>}{data.clinicalData.vitals.map(v => <View key={v.id} style={styles.item}><Text style={styles.body}>BP: {v.systolic ?? '-'} / {v.diastolic ?? '-'} mmHg</Text><Text style={styles.body}>Pulse: {v.heartRate ?? '-'} bpm | SpO2: {v.oxygenSaturation ?? '-'}% | Temperature: {v.temperature ?? '-'} C</Text></View>)}</Card.Content></Card>
        <Card style={styles.card}><Card.Content><Text style={styles.title}>Symptoms & nurse assessment</Text>{data.clinicalData.symptoms.map(s => <Text key={s.id} style={styles.body}>{s.symptomName} | {s.severity}</Text>)}<Text style={styles.body}>{data.clinicalData.nurseRemarks || data.clinicalData.notes || 'No assessment notes provided.'}</Text>{data.clinicalData.nurseConfidence != null && <Text style={styles.body}>Nurse confidence: {data.clinicalData.nurseConfidence}/5</Text>}</Card.Content></Card>
        <Card style={styles.card}><Card.Content><Text style={styles.title}>Decision support</Text><Text style={styles.body}>{data.aiInsights.disclaimer}</Text><Text style={styles.body}>{data.aiInsights.summary}</Text>{data.aiInsights.recommendations.map((r, i) => <View key={i} style={styles.item}><Text style={styles.body}>{r.text}</Text><Text style={styles.body}>Source: {r.source}</Text></View>)}{active && <><TextInput mode="outlined" outlineColor={COLORS.inputBorder} activeOutlineColor={COLORS.navy} textColor={COLORS.textDark} style={{ backgroundColor: COLORS.surfaceCard, marginBottom: SPACING.sm }} label="Feedback on the summary" value={comment} onChangeText={setComment} multiline /><Button mode="contained" buttonColor={COLORS.navy} textColor={COLORS.onAccent} disabled={busy || comment.trim().length < 5} loading={feedback.isPending} onPress={() => void run(async () => { await feedback.mutateAsync({ caseId: id, data: { targetType: 'SUMMARY', comment: comment.trim() } }); setComment(''); }, 'Feedback recorded.')}>Submit feedback</Button></>}</Card.Content></Card>
        <Card style={styles.card}><Card.Content><Text style={styles.title}>Second opinions</Text>{!data.case.secondOpinions.length && <Text style={styles.body}>No consultations requested.</Text>}{data.case.secondOpinions.map(o => <Text key={o.id} style={styles.body}>{o.consultedDoctor?.user?.fullName || 'Doctor'} | {o.status}</Text>)}{active && <Button disabled={busy} onPress={() => setShowDoctors(!showDoctors)}>Request second opinion</Button>}{showDoctors && active && <>{doctors.error && <Text style={styles.error}>{(doctors.error as Error).message}</Text>}{doctors.isLoading && <ActivityIndicator />}{doctors.data?.map(d => <Button key={d.id} disabled={busy} loading={opinion.isPending && opinion.variables?.consultedDoctorId === d.id} onPress={() => void run(async () => { await opinion.mutateAsync({ caseId: id, consultedDoctorId: d.id }); setShowDoctors(false); }, 'Consultation requested.')}>{d.user.fullName}</Button>)}{!doctors.isLoading && !doctors.error && !doctors.data?.length && <Text>No eligible doctors available.</Text>}</>}</Card.Content></Card>
      </>}
    </ScrollView>
  </View>;
}
const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({ row: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }, root: { flex: 1, backgroundColor: COLORS.surface }, header: { backgroundColor: COLORS.navy }, content: { padding: SPACING.lg, gap: SPACING.lg, paddingBottom: SPACING.xxxl }, card: { backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.lg }, title: { fontSize: TYPOGRAPHY.sizes.lg, fontWeight: TYPOGRAPHY.weights.bold, color: COLORS.textDark, marginBottom: SPACING.md }, body: { color: COLORS.textBody, fontSize: TYPOGRAPHY.sizes.sm, marginBottom: SPACING.sm }, item: { paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.dividerLight, marginBottom: SPACING.md }, error: { color: COLORS.red }, success: { color: COLORS.careEmerald } }));
