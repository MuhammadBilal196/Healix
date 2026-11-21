


import { useState } from 'react';
import { View } from 'react-native';
import { Text, Button, TextInput } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth';
import { apiClient } from '../api/client';
import { localDateTime } from '../utils/dates';
import { WorkflowPage, useFlowStyles } from '../components/common/WorkflowPage';
export default function CareAdherence() {
  const s = useFlowStyles();

 const params = useLocalSearchParams<{ patientId?: string }>(); const user = useAuthStore(state => state.user); const patientId = params.patientId || user?.patientId || ''; const qc = useQueryClient();
 const [page, setPage] = useState(1);
 const records = useQuery({ queryKey: ['adherence', patientId, page], queryFn: async () => {
  const [metrics, doses, history] = await Promise.all([apiClient.get<any>(`/patients/${patientId}/compliance`), apiClient.get<any>(`/patients/${patientId}/medication-doses?page=${page}`), apiClient.get<any>(`/patients/${patientId}/medical-history`)]); return { metrics, doses: doses.items, dosePage: doses, medications: history.medications.filter((med:any) => med.active) };
 }, enabled: !!patientId });
 const [medicationId, setMedicationId] = useState(''); const [date, setDate] = useState(''); const [days, setDays] = useState('7'); const [times, setTimes] = useState(''); const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
 const run = async (task: () => Promise<unknown>, success: string) => { setBusy(true); setError(''); setMessage(''); try { await task(); setMessage(success); await records.refetch(); await qc.invalidateQueries({ queryKey: ['clinical','compliance',patientId] }); } catch(e) { setError(e instanceof Error ? e.message : 'Could not save'); } finally { setBusy(false); } };
 const schedule = () => run(async () => {
  const first = localDateTime(date); const count = Number(days); const clockTimes = times.split(',').map(value => value.trim());
  if (!first || !Number.isInteger(count) || count < 1 || count > 90 || clockTimes.length > 8 || clockTimes.some(time => !localDateTime(date,time))) throw new Error('Use a valid start date, 1–90 days and 1–8 times in HH:MM format.');
  const timestamps: string[] = [];
  for (let day = 0; day < count; day++) for (const time of clockTimes) { const dose = localDateTime(date,time)!; dose.setDate(dose.getDate()+day); if (dose.getTime() >= Date.now()) timestamps.push(dose.toISOString()); }
  if (!timestamps.length) throw new Error('Choose at least one future dose time.');
  await apiClient.post(`/patients/${patientId}/medications/${medicationId}/schedule`, { times: timestamps });
 }, 'Scheduled doses added. Follow your prescribed regimen; this screen does not set a dosage.');
 const metrics = records.data?.metrics;
 if (!patientId) return <WorkflowPage title="Care adherence"><Text style={s.body}>Choose a patient from your care workflow, or sign in as a patient.</Text></WorkflowPage>;
 return <WorkflowPage title="Care adherence" loading={records.isLoading} error={error || records.error?.message} retry={() => void records.refetch()}>
  {!!message && <Text style={s.body}>{message}</Text>}{metrics && <View style={s.card}><Text style={s.title}>Last 30 days</Text><Text style={s.body}>Due visits: {metrics.completedVisits}/{metrics.dueVisits} completed · {metrics.visitCompliance == null ? 'No due visits' : `${metrics.visitCompliance}%`}</Text><Text style={s.body}>Scheduled doses: {metrics.takenDoses}/{metrics.dueDoses} recorded taken · {metrics.medicationCompliance == null ? 'No due scheduled doses' : `${metrics.medicationCompliance}%`}</Text><Text style={s.body}>Within two hours: {metrics.medicationTimingCompliance == null ? 'No data' : `${metrics.medicationTimingCompliance}%`}. This is an informational timing measure.</Text><Text style={s.body}>Active medications without a dose schedule: {metrics.unscheduledMedications}. Unscheduled logs are not counted as dose adherence.</Text><Text style={s.body}>Visit trend: {metrics.trend.replaceAll('_',' ')}</Text></View>}
  <View style={s.card}><Text style={s.title}>Add a daily dose schedule</Text><Text style={s.body}>Use the medication's prescribed times. This records reminders and self-reports; it does not change your prescription. Times below use this device's local time.</Text>{records.data?.medications.map((med:any) => <Button key={med.id} mode={medicationId === med.id ? 'contained' : 'outlined'} onPress={() => setMedicationId(med.id)}>{med.name} · {med.dosage} · {med.frequency}</Button>)}<TextInput mode="outlined" style={s.input} label="Start date (YYYY-MM-DD)" value={date} onChangeText={setDate}/><TextInput mode="outlined" style={s.input} label="Number of days (1–90)" keyboardType="number-pad" value={days} onChangeText={setDays}/><TextInput mode="outlined" style={s.input} label="Daily times, comma separated (08:00, 20:00)" value={times} onChangeText={setTimes}/><Button mode="contained" disabled={busy || !medicationId} loading={busy} onPress={schedule}>Add scheduled doses</Button></View>
  <Text style={s.title}>Scheduled doses</Text>{records.data && <View style={s.row}><Button disabled={page === 1 || busy} onPress={() => setPage(previous => previous-1)}>Previous</Button><Text style={s.body}>Page {page} · {records.data.dosePage.total} doses</Text><Button disabled={page*records.data.dosePage.limit >= records.data.dosePage.total || busy} onPress={() => setPage(previous => previous+1)}>Next</Button></View>}{records.data?.doses.length === 0 && <Text style={s.body}>No scheduled doses recorded.</Text>}{records.data?.doses.map((dose:any) => <View key={dose.id} style={s.card}><Text style={s.title}>{dose.medication.name} · {dose.medication.dosage}</Text><Text style={s.body}>{new Date(dose.scheduledAt).toLocaleString()} · {dose.status === 'PENDING' && new Date(dose.scheduledAt).getTime() < Date.now() ? 'Due · no report' : dose.status}</Text>{dose.log && <Text style={s.body}>Recorded taken: {new Date(dose.log.takenAt).toLocaleString()}</Text>}{!dose.log && new Date(dose.scheduledAt).getTime() <= Date.now() && <View style={s.row}><Button disabled={busy} onPress={() => void run(() => apiClient.put(`/patients/${patientId}/medication-doses/${dose.id}`, { status: 'TAKEN' }), 'Dose recorded as taken.')}>Record taken now</Button><Button disabled={busy || dose.status === 'SKIPPED'} onPress={() => void run(() => apiClient.put(`/patients/${patientId}/medication-doses/${dose.id}`, { status: 'SKIPPED' }), 'Dose recorded as skipped.')}>Record skipped</Button></View>}</View>)}
 </WorkflowPage>;
}
