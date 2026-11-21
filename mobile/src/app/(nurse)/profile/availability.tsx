


import { useState } from 'react';
import { View } from 'react-native';
import { Text, TextInput, Button, Chip, Switch } from 'react-native-paper';
import { useAuthStore } from '../../../store/auth';
import { useNurseProfile, useUpdateProfile, useNurseAvailability, useAddAvailability, useDeleteAvailability } from '../../../hooks/useNurse';
import { WorkflowPage, useFlowStyles } from '../../../components/common/WorkflowPage';
import { navigate } from '../../../utils/navigation';
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export default function AvailabilityScreen() {
  const s = useFlowStyles();

  const id = useAuthStore(state => state.user?.nurseId) || ''; const q = useNurseAvailability(id); const profile = useNurseProfile(id);
  const add = useAddAvailability(); const remove = useDeleteAvailability(); const update = useUpdateProfile();
  const [dayOfWeek, setDay] = useState(1); const [startTime, setStart] = useState('09:00'); const [endTime, setEnd] = useState('17:00'); const [shiftType, setShift] = useState('DAY'); const [error, setError] = useState('');
  const busy = add.isPending || remove.isPending || update.isPending;
  const run = async (f: () => Promise<unknown>) => { setError(''); try { await f(); } catch(e: any) { setError(e.message); } };
  const save = () => { if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime) || startTime >= endTime) { setError('Use valid HH:MM times with the end after the start. Split overnight shifts across two days.'); return; } void run(() => add.mutateAsync({ nurseId: id, data: { dayOfWeek, startTime, endTime, shiftType } })); };
  return <WorkflowPage title="Availability & Shifts" loading={q.isLoading || profile.isLoading} error={error || q.error?.message || profile.error?.message} retry={() => { void q.refetch(); void profile.refetch(); }}>
    <View style={s.card}><Text style={s.title}>Available for care requests</Text><Switch value={profile.data?.available || false} disabled={busy || !profile.data} onValueChange={available => void run(() => update.mutateAsync({ nurseId: id, data: { available } }))} /><Text style={s.body}>Complete your photo, biography and qualifications before enabling availability.</Text><Button onPress={() => navigate('/(nurse)/profile/vacations')}>Manage vacation / time off</Button></View>
    <View style={s.card}><Text style={s.title}>Add weekly time slot</Text><View style={s.row}>{days.map((day, i) => <Chip key={day} selected={i === dayOfWeek} onPress={() => setDay(i)}>{day.slice(0, 3)}</Chip>)}</View><View style={s.row}>{['DAY', 'EVENING', 'NIGHT'].map(shift => <Chip key={shift} selected={shift === shiftType} onPress={() => setShift(shift)}>{shift}</Chip>)}</View><TextInput mode="outlined" style={s.input} label="Start (HH:MM)" value={startTime} onChangeText={setStart} /><TextInput mode="outlined" style={s.input} label="End (HH:MM)" value={endTime} onChangeText={setEnd} /><Button mode="contained" disabled={busy} loading={add.isPending} onPress={save}>Add slot</Button></View>
    {q.data?.map(slot => <View key={slot.id} style={s.card}><Text style={s.title}>{days[slot.dayOfWeek]} · {slot.shiftType}</Text><Text style={s.body}>{slot.startTime} – {slot.endTime}</Text><Button disabled={busy} onPress={() => void run(() => remove.mutateAsync({ nurseId: id, slotId: slot.id }))}>Remove slot</Button></View>)}{!q.isLoading && !q.error && !q.data?.length && <Text style={s.body}>No weekly slots set.</Text>}
  </WorkflowPage>;
}
