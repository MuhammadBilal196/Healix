import { useAppTheme, useThemeValue, usePaperTheme } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import { useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Appbar, Button, Card, Chip, Dialog, Portal, Text, TextInput, Switch, Provider as PaperProvider } from 'react-native-paper';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin.api';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../theme';
import { goBack, navigate } from '../../utils/navigation';

const empty = { name: '', latitude: '', longitude: '', capacityStatus: 'AVAILABLE', affordabilityTier: 'LOW', isCharity: false };
export default function AdminNetworkOperations() {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);
  const paperTheme = usePaperTheme();

  const client = useQueryClient();
  const query = useQuery({ queryKey: ['admin', 'hospitals'], queryFn: adminApi.getHospitals });
  const [edit, setEdit] = useState<any>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [remove, setRemove] = useState<string | null>(null);
  const save = async () => {
    setBusy(true); setError('');
    try {
      if (!edit.name.trim() || !String(edit.latitude).trim() || !String(edit.longitude).trim()) throw new Error('Name and location are required');
      const data = { name: edit.name, latitude: Number(edit.latitude), longitude: Number(edit.longitude), capacityStatus: edit.capacityStatus, affordabilityTier: edit.affordabilityTier, isCharity: edit.isCharity };
      if (edit.id) await adminApi.updateHospital(edit.id, data); else await adminApi.createHospital(data);
      await client.invalidateQueries({ queryKey: ['admin', 'hospitals'] }); setEdit(null);
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  };
  return <PaperProvider theme={paperTheme}><View style={styles.root}><Appbar.Header style={styles.header}><Appbar.BackAction color={COLORS.headerText} onPress={goBack} /><Appbar.Content title="Hospital Network" titleStyle={{ color: COLORS.headerText, fontWeight: '800' }} color={COLORS.headerText} /></Appbar.Header><ScrollView contentContainerStyle={styles.content}>
    <Button mode="outlined" textColor={COLORS.primaryText} icon="ambulance" onPress={() => navigate('/admin/ambulances')}>Open Ambulance Fleet &amp; Dispatches</Button><Button mode="contained" buttonColor={COLORS.navy} textColor={COLORS.onAccent} icon="plus" onPress={() => { setError(''); setEdit({ ...empty }); }}>Add Hospital</Button>
    {(error || query.error) && <Text accessibilityRole="alert" style={styles.error}>{error || (query.error as Error).message}</Text>}
    {query.isLoading && <Text style={{ color: COLORS.textBody }}>Loading hospitals…</Text>}
    {query.data?.map(h => <Card style={styles.card} key={h.id}><Card.Content style={{ gap: 4 }}><Text style={styles.title}>{h.name}</Text><Text style={{ color: COLORS.textBody, fontSize: 12 }}>{h.latitude}, {h.longitude}</Text><Text style={{ color: COLORS.textDark, fontSize: 13, fontWeight: '600' }}>Capacity: {h.capacityStatus} · Budget: {h.affordabilityTier} {h.isCharity ? '· Charity' : ''}</Text><Text style={{ color: COLORS.textMuted, fontSize: 12 }}>Update capacity after confirming with the hospital.</Text></Card.Content><Card.Actions><Button onPress={() => { setError(''); setEdit({ ...h, latitude: String(h.latitude), longitude: String(h.longitude) }); }}>Edit / Capacity</Button><Button textColor={COLORS.red} onPress={() => setRemove(h.id)}>Delete</Button></Card.Actions></Card>)}
    {!query.isLoading && !query.data?.length && <Text style={{ color: COLORS.textBody }}>No hospitals registered.</Text>}
  </ScrollView><Portal><Dialog visible={!!edit} onDismiss={() => !busy && setEdit(null)} style={{ backgroundColor: COLORS.surfaceCard }}><Dialog.Title style={{ color: COLORS.textDark }}>Hospital Details</Dialog.Title><Dialog.Content>
    {['name', 'latitude', 'longitude'].map(key => <TextInput key={key} mode="outlined" outlineColor={COLORS.inputBorder} activeOutlineColor={COLORS.navy} textColor={COLORS.textDark} label={key === 'name' ? 'Hospital name' : key === 'latitude' ? 'Latitude' : 'Longitude'} value={edit?.[key] || ''} onChangeText={value => setEdit((current: any) => ({ ...current, [key]: value }))} keyboardType={key === 'name' ? 'default' : 'numbers-and-punctuation'} style={styles.input} />)}
    <Text style={{ color: COLORS.textDark, fontWeight: '700' }}>Capacity</Text><View style={styles.row}>{['AVAILABLE', 'LIMITED', 'FULL'].map(capacityStatus => <Chip key={capacityStatus} selected={edit?.capacityStatus === capacityStatus} onPress={() => setEdit((current: any) => ({ ...current, capacityStatus }))}>{capacityStatus}</Chip>)}</View>
    <Text style={{ color: COLORS.textDark, fontWeight: '700' }}>Budget Tier</Text><View style={styles.row}>{['LOW', 'MEDIUM', 'HIGH'].map(affordabilityTier => <Chip key={affordabilityTier} selected={edit?.affordabilityTier === affordabilityTier} onPress={() => setEdit((current: any) => ({ ...current, affordabilityTier }))}>{affordabilityTier}</Chip>)}</View><Text style={{ color: COLORS.textDark, fontWeight: '700' }}>Charity hospital</Text><Switch value={edit?.isCharity || false} onValueChange={isCharity => setEdit((current: any) => ({ ...current, isCharity }))} />{error && <Text style={styles.error}>{error}</Text>}
  </Dialog.Content><Dialog.Actions><Button disabled={busy} onPress={() => setEdit(null)}>Cancel</Button><Button mode="contained" buttonColor={COLORS.navy} textColor={COLORS.onAccent} disabled={busy} loading={busy} onPress={() => void save()}>Save Capacity Update</Button></Dialog.Actions></Dialog>
  <Dialog visible={!!remove} onDismiss={() => !busy && setRemove(null)} style={{ backgroundColor: COLORS.surfaceCard }}><Dialog.Title style={{ color: COLORS.textDark }}>Delete hospital?</Dialog.Title><Dialog.Content><Text style={{ color: COLORS.textBody }}>Hospitals with dispatch history must be retained.</Text>{error && <Text style={styles.error}>{error}</Text>}</Dialog.Content><Dialog.Actions><Button disabled={busy} onPress={() => setRemove(null)}>Cancel</Button><Button textColor={COLORS.red} disabled={busy} loading={busy} onPress={async () => { setBusy(true); setError(''); try { await adminApi.deleteHospital(remove!); await query.refetch(); setRemove(null); } catch (e: any) { setError(e.message); } finally { setBusy(false); } }}>Delete</Button></Dialog.Actions></Dialog></Portal></View></PaperProvider>;
}
const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({ root: { flex: 1, backgroundColor: COLORS.surface }, header: { backgroundColor: COLORS.navyDark }, content: { padding: SPACING.lg, gap: SPACING.md }, card: { backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.inputBorder }, title: { color: COLORS.textDark, fontSize: TYPOGRAPHY.sizes.lg, fontWeight: TYPOGRAPHY.weights.bold }, error: { color: COLORS.red }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginVertical: SPACING.md }, input: { marginBottom: SPACING.sm, backgroundColor: COLORS.surfaceCard } }));
