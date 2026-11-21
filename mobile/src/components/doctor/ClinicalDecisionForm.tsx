import { useAppTheme, useThemeValue, usePaperTheme } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Card, Chip, Dialog, Portal, Text, TextInput, Provider as PaperProvider } from 'react-native-paper';
import { emergencyApi, Hospital } from '../../api/emergency.api';
import { doctorApi } from '../../api/doctor.api';
import { apiClient } from '../../api/client';
import { useQueryClient } from '@tanstack/react-query';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../theme';
import { navigate } from '../../utils/navigation';

export function ClinicalDecisionForm({ caseId, patient, onCancel }: { caseId?: string; patient: { id: string; latitude?: number; longitude?: number }; onCancel: () => void }) {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);
  const paperTheme = usePaperTheme();

  const client = useQueryClient();
  const [decision, setDecision] = useState(caseId ? 'CONTINUE_MONITORING' : 'REQUEST_EMERGENCY');
  const [justification, setJustification] = useState('');
  const [latitude, setLatitude] = useState(patient.latitude?.toString() || '');
  const [longitude, setLongitude] = useState(patient.longitude?.toString() || '');
  const [tier, setTier] = useState('HIGH');
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [hospitalId, setHospitalId] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const search = async () => { setBusy(true); setError(''); setHospitalId(''); try { if (!latitude.trim() || !longitude.trim()) throw new Error('Enter the patient location'); const result = await emergencyApi.hospitals(patient.id, Number(latitude), Number(longitude), tier); setHospitals(result); if (!result.length) setError('No hospitals match this search. Update the budget or contact admin.'); } catch (e: any) { setError(e.message); } finally { setBusy(false); } };
  const submit = async () => { setBusy(true); setError(''); try { if (caseId) await doctorApi.submitClinicalDecision(caseId, { decision, justification: justification.trim(), hospitalId: hospitalId || undefined, autoDispatch: decision === 'REQUEST_EMERGENCY' }); else await apiClient.post('/dispatch', { patientId: patient.id, hospitalId, justification: justification.trim() }); await client.invalidateQueries({ queryKey: ['doctor'] }); await client.invalidateQueries({ queryKey: ['emergency'] }); setConfirm(false); if (!caseId) onCancel(); else if (decision === 'REQUEST_EMERGENCY') navigate('/(doctor)/emergency'); else onCancel(); } catch (e: any) { setConfirm(false); setError(e.message); } finally { setBusy(false); } };
  return <PaperProvider theme={paperTheme}><Card style={styles.card}><Card.Content>
    <Text style={styles.title}>Clinical Decision</Text>
    <View style={styles.row}>{[['CONTINUE_MONITORING', 'Continue Monitoring'], ['RECOMMEND_ADMISSION', 'Recommend Admission'], ['REQUEST_EMERGENCY', 'Dispatch Ambulance']].filter(([value]) => !!caseId || value === 'REQUEST_EMERGENCY').map(([value, label]) => <Chip key={value} disabled={busy} selected={decision === value} onPress={() => setDecision(value)}>{label}</Chip>)}</View>
    <TextInput mode="outlined" outlineColor={COLORS.inputBorder} activeOutlineColor={COLORS.navy} textColor={COLORS.textDark} style={styles.input} label="Clinical justification (at least 10 characters)" multiline value={justification} onChangeText={setJustification} />
    {decision === 'REQUEST_EMERGENCY' && <>
      <Text style={styles.title}>Choose destination hospital</Text><TextInput mode="outlined" outlineColor={COLORS.inputBorder} activeOutlineColor={COLORS.navy} textColor={COLORS.textDark} style={styles.input} label="Patient latitude" value={latitude} onChangeText={setLatitude} keyboardType="numbers-and-punctuation" /><TextInput mode="outlined" outlineColor={COLORS.inputBorder} activeOutlineColor={COLORS.navy} textColor={COLORS.textDark} style={styles.input} label="Patient longitude" value={longitude} onChangeText={setLongitude} keyboardType="numbers-and-punctuation" />
      <Text>Budget: Low, Medium or Any</Text><View style={styles.row}>{[['LOW', 'Low'], ['MEDIUM', 'Medium'], ['HIGH', 'Any']].filter(([value]) => !!caseId || value === 'REQUEST_EMERGENCY').map(([value, label]) => <Chip key={value} selected={tier === value} onPress={() => setTier(value)}>{label}</Chip>)}</View>
      <Button disabled={busy} loading={busy} onPress={() => void search()}>Find Hospitals</Button>
      {hospitals.map(h => <View key={h.id} style={styles.hospital}><Button disabled={h.capacityStatus === 'FULL' || busy} mode={hospitalId === h.id ? 'contained' : 'outlined'} onPress={() => setHospitalId(h.id)}>{h.name}</Button><Text>{h.distance?.toFixed(1)} km · {h.capacityStatus} · {h.isCharity ? 'Charity' : h.affordabilityTier}</Text><Text>{h.staleCapacityWarning ? 'Capacity update is stale — confirm availability.' : 'Capacity updated recently.'}</Text></View>)}
    </>}
    {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    <Button mode="contained" disabled={busy || justification.trim().length < 10 || (decision === 'REQUEST_EMERGENCY' && !hospitalId)} onPress={() => setConfirm(true)}>Review and Confirm</Button><Button disabled={busy} onPress={onCancel}>Back to Actions</Button>
  </Card.Content></Card><Portal><Dialog visible={confirm} onDismiss={() => !busy && setConfirm(false)}><Dialog.Title>Confirm clinical decision?</Dialog.Title><Dialog.Content><Text>{decision === 'REQUEST_EMERGENCY' ? `Request a Healix ambulance to ${hospitals.find(h => h.id === hospitalId)?.name}. ${caseId ? 'The case closes after successful dispatch.' : 'The assigned emergency remains tracked until the trip is completed.'}` : 'Record this decision in the patient case.'}</Text><Text>{justification}</Text></Dialog.Content><Dialog.Actions><Button disabled={busy} onPress={() => setConfirm(false)}>Cancel</Button><Button disabled={busy} loading={busy} onPress={() => void submit()}>Confirm</Button></Dialog.Actions></Dialog></Portal></PaperProvider>;
}
const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({ card: { backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.lg }, title: { color: COLORS.textDark, fontSize: TYPOGRAPHY.sizes.lg, fontWeight: TYPOGRAPHY.weights.bold, marginVertical: SPACING.md }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginVertical: SPACING.md }, hospital: { marginBottom: SPACING.md }, error: { color: COLORS.red, marginVertical: SPACING.md }, input: { backgroundColor: COLORS.surfaceCard, marginBottom: SPACING.sm } }));
