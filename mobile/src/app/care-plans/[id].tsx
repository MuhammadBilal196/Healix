


import { useState } from 'react';
import { View } from 'react-native';
import { Text, Button, TextInput } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth';
import { apiClient } from '../../api/client';
import { localDateTime } from '../../utils/dates';
import { WorkflowPage, useFlowStyles } from '../../components/common/WorkflowPage';
export default function CarePlanHistory() {
  const s = useFlowStyles();

 const { id = '' } = useLocalSearchParams<{ id: string }>(); const user = useAuthStore(state => state.user); const qc = useQueryClient();
 const record = useQuery({ queryKey: ['carePlanHistory', id], queryFn: () => apiClient.get<any>(`/care-plans/${id}/history`), enabled: !!id });
 const plan = record.data?.current; const editable = user?.role === 'DOCTOR' && plan?.doctorId === user.doctorId;
 const [draft, setDraft] = useState<any>(null); const [reason, setReason] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
 const edit = () => { setReason(''); setError(''); setDraft({ version: plan.version, title: plan.title, description: plan.description || '', milestones: plan.milestones.map((item:any) => ({ ...item, targetDate: item.targetDate.slice(0,10) })) }); };
 const update = (index: number, patch: any) => setDraft((previous:any) => ({ ...previous, milestones: previous.milestones.map((item:any, i:number) => i === index ? { ...item, ...patch } : item) }));
 const save = async () => { setBusy(true); setError(''); try {
  const milestones = draft.milestones.map((item:any) => { const date = localDateTime(item.targetDate); if (!date) throw new Error('Use a valid milestone date (YYYY-MM-DD).'); return { id: item.id, title: item.title, targetDate: date.toISOString() }; });
  await apiClient.put(`/care-plans/${id}`, { version: draft.version, title: draft.title, description: draft.description, milestones, reason });
  setDraft(null); await qc.invalidateQueries({ queryKey: ['carePlanHistory', id] }); await qc.invalidateQueries({ queryKey: ['carePlans'] }); await qc.invalidateQueries({ queryKey: ['health','care-plans'] });
 } catch(e) { setError(e instanceof Error ? e.message : 'Could not save revision'); } finally { setBusy(false); } };
 return <WorkflowPage title="Care plan history" loading={record.isLoading} error={error || record.error?.message} retry={() => void record.refetch()}>{plan && <>
  <View style={s.card}><Text style={s.title}>{plan.title}</Text><Text style={s.body}>Version {plan.version} · {Math.round(plan.progress)}% · {plan.status}</Text><Text style={s.body}>{plan.description}</Text>{plan.milestones.map((item:any) => <Text key={item.id} style={s.body}>{item.completed ? 'Completed' : 'Pending'} · {item.title} · {new Date(item.targetDate).toLocaleDateString()}</Text>)}{editable && !draft && <Button onPress={edit}>Revise this plan</Button>}</View>
  {draft && <View style={s.card}><TextInput mode="outlined" style={s.input} label="Title" value={draft.title} onChangeText={title => setDraft((previous:any) => ({ ...previous, title }))}/><TextInput mode="outlined" style={s.input} label="Description" multiline value={draft.description} onChangeText={description => setDraft((previous:any) => ({ ...previous, description }))}/>{draft.milestones.map((item:any, index:number) => <View key={item.id || `new-${index}`}><TextInput mode="outlined" style={s.input} label="Milestone" value={item.title} onChangeText={title => update(index,{title})}/><TextInput mode="outlined" style={s.input} label="Target date (YYYY-MM-DD)" value={item.targetDate} onChangeText={targetDate => update(index,{targetDate})}/>{!item.completed && <Button disabled={busy} onPress={() => setDraft((previous:any) => ({ ...previous, milestones: previous.milestones.filter((_:any, i:number) => i !== index) }))}>Remove pending milestone</Button>}</View>)}<Button disabled={busy} onPress={() => setDraft((previous:any) => ({ ...previous, milestones: [...previous.milestones, { title: '', targetDate: '' }] }))}>Add milestone</Button><TextInput mode="outlined" style={s.input} label="Reason for revision (10+ characters)" multiline value={reason} onChangeText={setReason}/><Button mode="contained" disabled={busy || reason.trim().length < 10} loading={busy} onPress={save}>Save version {draft.version + 1}</Button><Button disabled={busy} onPress={() => setDraft(null)}>Cancel edit</Button></View>}
  <Text style={s.title}>Recorded revisions</Text>{record.data.history.length === 0 && <Text style={s.body}>This plan has not been revised.</Text>}{record.data.history.map((revision:any) => <View key={revision.id} style={s.card}><Text style={s.title}>Version {revision.version} · {revision.snapshot.title}</Text><Text style={s.body}>{revision.reason}</Text><Text style={s.body}>{new Date(revision.createdAt).toLocaleString()} · Reviewer {revision.changedBy}</Text><Text style={s.body}>{revision.snapshot.description}</Text>{revision.snapshot.milestones?.map((item:any) => <Text key={item.id} style={s.body}>{item.title} · {new Date(item.targetDate).toLocaleDateString()}</Text>)}</View>)}
 </>}</WorkflowPage>;
}
