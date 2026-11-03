import { useAppTheme, useThemeValue } from '../../../theme/ThemeProvider';
import type { ThemeColors } from '../../../theme';
import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { Button, Card, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { navigate } from '../../../utils/navigation';
import { useAuthStore } from '../../../store/auth';
import { useDoctorQueue, useDoctorHighRiskQueue, useStartCaseReview } from '../../../hooks/useDoctor';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../../theme';
import { AssignedEmergencyBanner } from '../../../components/emergency/AssignedEmergencyBanner';

export default function DoctorDashboard() {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const user = useAuthStore(s => s.user);
  const [filter, setFilter] = useState<'ALL' | 'HIGH'>('ALL');
  const [actionError, setActionError] = useState('');
  const queue = useDoctorQueue();
  const alerts = useDoctorHighRiskQueue();
  const start = useStartCaseReview();
  const selected = filter === 'ALL' ? queue : alerts;
  const cases = selected.data || [];
  const refresh = () => Promise.all([queue.refetch(), alerts.refetch()]);
  const open = async (id: string, status: string) => {
    setActionError('');
    try {
      if (status !== 'IN_REVIEW') await start.mutateAsync(id);
      navigate(`/(doctor)/reviews/${id}`);
    } catch (e: any) { setActionError(e.message || 'Unable to open this case'); void refresh(); }
  };
  return <SafeAreaView style={styles.root} edges={['top']}>
    <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={selected.isRefetching} onRefresh={() => void refresh()} tintColor={COLORS.primaryText} />}>
      <View style={styles.header}><Text style={styles.greeting}>Doctor dashboard</Text><Text style={styles.name}>{user?.fullName || 'Doctor'}</Text><Text style={styles.headerText}>Review assigned cases and respond to urgent broadcasts.</Text></View>
      <AssignedEmergencyBanner />
      <View style={styles.row}><Button mode={filter === 'ALL' ? 'contained' : 'outlined'} buttonColor={filter === 'ALL' ? COLORS.navy : undefined} textColor={filter === 'ALL' ? COLORS.headerText : COLORS.primaryText} onPress={() => setFilter('ALL')}>My cases ({queue.data?.length || 0})</Button><Button mode={filter === 'HIGH' ? 'contained' : 'outlined'} buttonColor={filter === 'HIGH' ? COLORS.navy : undefined} textColor={filter === 'HIGH' ? COLORS.headerText : COLORS.primaryText} onPress={() => setFilter('HIGH')}>Urgent ({alerts.data?.length || 0})</Button></View>
      <View style={styles.row}><Button icon="ambulance" textColor={COLORS.primaryText} onPress={() => navigate('/(doctor)/emergency')}>Emergency transport</Button><Button icon="message-outline" textColor={COLORS.primaryText} onPress={() => navigate('/(doctor)/(tabs)/messages')}>Messages</Button></View>
      <Text style={styles.title}>{filter === 'ALL' ? 'Assigned cases' : 'High and critical risk cases'}</Text>
      {(actionError || selected.error) && <View style={styles.notice}><Text accessibilityRole="alert" style={styles.error}>{actionError || (selected.error as Error).message}</Text><Button onPress={() => void refresh()}>Retry</Button></View>}
      {selected.isLoading ? <ActivityIndicator color={COLORS.primaryText} /> : !selected.error && !cases.length ? <Card style={styles.card}><Card.Content><Text style={styles.title}>No cases in this queue</Text><Text style={styles.body}>{filter === 'ALL' ? 'New assignments will appear here. Check Urgent for available broadcast cases.' : 'No eligible urgent cases are awaiting your review.'}</Text></Card.Content></Card> : cases.map(item => {
        const broadcast = ['PROFESSIONAL_BROADCAST', 'GENERAL_BROADCAST', 'ADMIN_ESCALATED'].includes(item.status);
        const mins = Math.ceil((Date.parse(item.slaDeadline) - Date.now()) / 60000);
        const sla = Number.isFinite(mins) ? mins <= 0 ? 'Response overdue' : `${mins} min to respond` : 'No response deadline';
        return <Card key={item.id} style={styles.card}><Card.Content><Text style={styles.title}>{item.visit?.request?.patient?.user?.fullName || 'Patient'}</Text><View style={styles.row}><Chip textStyle={{ color: ['HIGH', 'CRITICAL'].includes(item.riskTier) ? COLORS.red : COLORS.amber }}>{item.riskTier}</Chip><Text style={styles.body}>{item.status.replaceAll('_', ' ')}</Text></View><Text style={[styles.body, Number.isFinite(mins) && mins <= 5 && styles.error]}>{sla}</Text><Button mode="contained" buttonColor={COLORS.navy} disabled={start.isPending} loading={start.isPending && start.variables === item.id} onPress={() => void open(item.id, item.status)} style={styles.button}>{broadcast ? 'Accept & review' : item.status === 'ASSIGNED' ? 'Start review' : 'Continue review'}</Button><Button textColor={COLORS.primaryText} onPress={() => navigate(`/(doctor)/reviews/${item.id}`)}>View case details</Button></Card.Content></Card>;
      })}
    </ScrollView>
  </SafeAreaView>;
}
const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.surface }, content: { padding: SPACING.lg, gap: SPACING.lg, paddingBottom: SPACING.xxxl },
  header: { backgroundColor: COLORS.navy, borderRadius: RADIUS.lg, padding: SPACING.xl, gap: SPACING.sm }, greeting: { color: COLORS.headerText, fontSize: TYPOGRAPHY.sizes.md }, name: { color: COLORS.headerText, fontSize: TYPOGRAPHY.sizes.xxl, fontWeight: TYPOGRAPHY.weights.bold }, headerText: { color: COLORS.headerText, fontSize: TYPOGRAPHY.sizes.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, alignItems: 'center' }, card: { backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.lg }, title: { color: COLORS.textDark, fontSize: TYPOGRAPHY.sizes.lg, fontWeight: TYPOGRAPHY.weights.bold, marginBottom: SPACING.sm }, body: { color: COLORS.textBody, fontSize: TYPOGRAPHY.sizes.sm }, error: { color: COLORS.red }, notice: { backgroundColor: COLORS.surfaceCard, padding: SPACING.lg, borderRadius: RADIUS.md }, button: { marginTop: SPACING.md },
}));
