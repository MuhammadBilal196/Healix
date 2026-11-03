


import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/auth';
import { apiClient } from '../../../api/client';
import { WorkflowPage, useFlowStyles } from '../../../components/common/WorkflowPage';
export default function PaymentsScreen() {
  const s = useFlowStyles();

  const id = useAuthStore(state => state.user?.patientId) || '';
  const q = useQuery({ queryKey: ['patient', id, 'payments'], queryFn: () => apiClient.get<any[]>(`/patients/${id}/payments`), enabled: !!id });
  return <WorkflowPage title="Payment History" loading={q.isLoading} error={q.error?.message} retry={() => void q.refetch()}><Text style={s.body}>A payment is added when you approve a completed visit. Pay your nurse in cash; it shows as Paid once the nurse confirms. Online payment is not connected yet.</Text>{q.data?.map(p => <View key={p.id} style={s.card}><Text style={s.title}>PKR {Number(p.amount).toLocaleString()}</Text><Text style={s.body}>{p.status === 'PENDING' ? 'Due · pay your nurse in cash' : p.status === 'PAID' ? 'Paid' : p.status} · {String(p.request.type).replace(/_/g, ' ').toLowerCase()}</Text><Text style={s.body}>{new Date(p.createdAt).toLocaleString()}</Text>{p.paidAt && <Text style={s.body}>Paid: {new Date(p.paidAt).toLocaleString()}</Text>}</View>)}{!q.isLoading && !q.error && !q.data?.length && <Text style={s.body}>No payments recorded.</Text>}</WorkflowPage>;
}
