


import { localDateTime } from '../../../utils/dates';
import { useState } from 'react';
import { View } from 'react-native';
import { Text, Button, TextInput, RadioButton } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/auth';
import { apiClient } from '../../../api/client';
import { WorkflowPage, useFlowStyles } from '../../../components/common/WorkflowPage';
export default function DoctorVisitsScreen() {
  const s = useFlowStyles();

  const id = useAuthStore(state => state.user?.patientId) || ''; const qc = useQueryClient();
  const visits = useQuery({ queryKey: ['patient', id, 'home-visits'], queryFn: () => apiClient.get<any[]>(`/patients/${id}/home-visits`), enabled: !!id, refetchInterval: 10000 });
  const doctors = useQuery({ queryKey: ['patient', id, 'home-visit-doctors'], queryFn: () => apiClient.get<any[]>(`/patients/${id}/home-visits/doctors`), enabled: !!id });
  const [doctorId, setDoctor] = useState(''); const [date, setDate] = useState(''); const [time, setTime] = useState(''); const [error, setError] = useState('');
  const mutation = useMutation({ mutationFn: (task: { endpoint: string; body: any; cancel?: boolean }) => task.cancel ? apiClient.put(task.endpoint, task.body) : apiClient.post(task.endpoint, task.body), onSuccess: () => { qc.invalidateQueries({ queryKey: ['patient', id, 'home-visits'] }); setError(''); setDate(''); setTime(''); }, onError: (e: Error) => setError(e.message) });
  const request = () => { const scheduled = localDateTime(date, time); if (!doctorId || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) || !scheduled || scheduled.getTime() <= Date.now()) { setError('Select a doctor and a future date/time.'); return; } mutation.mutate({ endpoint: `/patients/${id}/home-visits`, body: { doctorId, scheduledAt: scheduled.toISOString() } }); };
  return <WorkflowPage title="Doctor Home Visits" loading={visits.isLoading || doctors.isLoading} error={error || visits.error?.message || doctors.error?.message} retry={() => { void visits.refetch(); void doctors.refetch(); }}>
    <View style={s.card}><Text style={s.title}>Request a home visit</Text><Text style={s.body}>Your doctor must accept the requested appointment. For an emergency, contact local emergency services.</Text><RadioButton.Group value={doctorId} onValueChange={setDoctor}>{doctors.data?.map(d => <RadioButton.Item key={d.id} label={`${d.user.fullName} · PMDC ${d.pmdcNumber}`} value={d.id} />)}</RadioButton.Group>{!doctors.isLoading && !doctors.error && !doctors.data?.length && <Text>No verified doctors are available.</Text>}<TextInput mode="outlined" style={s.input} label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} /><TextInput mode="outlined" style={s.input} label="Time (HH:MM, local time)" value={time} onChangeText={setTime} /><Button mode="contained" disabled={mutation.isPending || !doctors.data?.length} loading={mutation.isPending} onPress={request}>Request appointment</Button></View>
    {visits.data?.map(v => <View key={v.id} style={s.card}><Text style={s.title}>{v.doctors?.user?.fullName || 'Doctor'}</Text><Text style={s.body}>{new Date(v.scheduledAt).toLocaleString()} · {v.status.replaceAll('_', ' ')}</Text>{v.findings && <Text style={s.body}>Findings: {v.findings}</Text>}{v.outcomeNotes && <Text style={s.body}>Outcome: {v.outcomeNotes}</Text>}{['REQUESTED', 'SCHEDULED'].includes(v.status) && <Button disabled={mutation.isPending} onPress={() => mutation.mutate({ endpoint: `/patients/${id}/home-visits/${v.id}/cancel`, body: {}, cancel: true })}>Cancel appointment</Button>}</View>)}
    {!visits.isLoading && !visits.error && !visits.data?.length && <Text style={s.body}>No home visit requests yet.</Text>}
  </WorkflowPage>;
}
