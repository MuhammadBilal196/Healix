


import { useState } from 'react';
import { View } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/auth';
import { nurseApi } from '../../../api/nurse.api';
import { WorkflowPage, useFlowStyles } from '../../../components/common/WorkflowPage';
export default function VacationsScreen() {
  const s = useFlowStyles();

  const id = useAuthStore(state => state.user?.nurseId) || ''; const qc = useQueryClient();
  const q = useQuery({ queryKey: ['nurse', id, 'vacations'], queryFn: () => nurseApi.getVacations(id), enabled: !!id });
  const [start, setStart] = useState(''); const [end, setEnd] = useState(''); const [reason, setReason] = useState(''); const [error, setError] = useState('');
  const m = useMutation({ mutationFn: (vacationId?: string) => vacationId ? nurseApi.deleteVacation(id, vacationId) : nurseApi.addVacation(id, { startDate: new Date(`${start}T00:00:00`).toISOString(), endDate: new Date(`${end}T23:59:59`).toISOString(), reason: reason.trim() || undefined }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['nurse', id, 'vacations'] }); setError(''); }, onError: (e: Error) => setError(e.message) });
  const save = () => { const a = new Date(`${start}T00:00:00`); const b = new Date(`${end}T23:59:59`); if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end) || !Number.isFinite(a.getTime()) || !Number.isFinite(b.getTime()) || b <= a || b.getTime() < Date.now()) { setError('Choose a valid future date range (YYYY-MM-DD).'); return; } m.mutate(undefined); };
  return <WorkflowPage title="Vacation & Time Off" loading={q.isLoading} error={error || q.error?.message} retry={() => void q.refetch()}><View style={s.card}><Text style={s.title}>Block a date range</Text><Text style={s.body}>Time off prevents new care bookings. Resolve existing visit conflicts first.</Text><TextInput mode="outlined" style={s.input} label="Start date (YYYY-MM-DD)" value={start} onChangeText={setStart} /><TextInput mode="outlined" style={s.input} label="End date (YYYY-MM-DD, inclusive)" value={end} onChangeText={setEnd} /><TextInput mode="outlined" style={s.input} label="Reason (optional)" value={reason} onChangeText={setReason} /><Button mode="contained" loading={m.isPending} disabled={m.isPending} onPress={save}>Add time off</Button></View>{q.data?.map(v => <View key={v.id} style={s.card}><Text style={s.title}>{new Date(v.startDate).toLocaleDateString()} – {new Date(v.endDate).toLocaleDateString()}</Text><Text style={s.body}>{v.reason}</Text><Button disabled={m.isPending} onPress={() => m.mutate(v.id)}>Remove time off</Button></View>)}{!q.isLoading && !q.error && !q.data?.length && <Text style={s.body}>No time off recorded.</Text>}</WorkflowPage>;
}
