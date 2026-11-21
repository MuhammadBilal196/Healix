import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView, StatusBar, FlatList, Platform } from 'react-native';
import { Card, Button, Chip, Divider, Portal, Dialog, TextInput as PaperTextInput } from 'react-native-paper';
import { useCreateDoctor, useInviteUser, useAdminDoctors, useAdminPendingDoctors, useApproveDoctor, useRejectDoctor, useRevokeDoctor } from '../../hooks/useAdmin';
import { navigate } from '../../utils/navigation';
import { SPACING, RADIUS } from '../../theme';

export default function AdminDoctors() {
  const { dark: isDarkTheme } = useAppTheme();
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const { data: pendingRaw = [], isLoading: isLoadingPending } = useAdminPendingDoctors();
  const { data: doctorsRaw = [], isLoading: isLoadingDoctors } = useAdminDoctors();
  const pendingDoctors: any[] = Array.isArray(pendingRaw) ? pendingRaw : (pendingRaw as any)?.users || [];
  const doctors: any[] = Array.isArray(doctorsRaw) ? doctorsRaw : (doctorsRaw as any)?.users || [];

  const { mutateAsync: approveDoctor } = useApproveDoctor();
  const { mutateAsync: rejectDoctor } = useRejectDoctor();
  const { mutateAsync: revokeDoctor } = useRevokeDoctor();
  const createDoctor = useCreateDoctor();
  const inviteUser = useInviteUser();

  const isLoading = isLoadingPending || isLoadingDoctors;
  const [tab, setTab] = useState<'PENDING' | 'ALL'>('PENDING');

  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<'DIRECT' | 'INVITE'>('INVITE');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [pmdc, setPmdc] = useState('');
  const [cnic, setCnic] = useState('');
  const [password, setPassword] = useState('');

  const [reasonModal, setReasonModal] = useState<{ id: string; mode: 'REJECT' | 'REVOKE' } | null>(null);
  const [reasonText, setReasonText] = useState('');

  const notify = (title: string, msg: string) => {
    if (Platform.OS === 'web') alert(`${title}: ${msg}`);
    else Alert.alert(title, msg);
  };

  const handleAddSubmit = async () => {
    try {
      if (addMode === 'INVITE') {
        const res: any = await inviteUser.mutateAsync({ email: email.trim() || undefined, phone: phone.trim() || undefined, role: 'DOCTOR' });
        const tok = res?.token || res?.data?.token;
        notify('Invitation Sent', tok ? `Share token privately: ${tok}` : 'Invitation created successfully.');
      } else {
        await createDoctor.mutateAsync({ email: email.trim(), phone: phone.trim(), fullName: fullName.trim(), password, cnic: cnic.trim(), pmdcNumber: pmdc.trim() });
        notify('Doctor Created', 'Doctor account created and active.');
      }
      setShowAddModal(false);
      setEmail(''); setPhone(''); setFullName(''); setPmdc(''); setCnic(''); setPassword('');
    } catch (err: any) {
      notify('Error', err.message || 'Action failed');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveDoctor(id);
      notify('Doctor Approved', 'PMDC credentials verified and consultant account activated.');
    } catch (err: any) {
      notify('Error', err.message || 'Action failed');
    }
  };

  const confirmReasonAction = async () => {
    if (!reasonModal || reasonText.trim().length < 10) {
      notify('Validation Error', 'Please provide a clear justification (at least 10 characters).');
      return;
    }
    try {
      if (reasonModal.mode === 'REJECT') {
        await rejectDoctor({ doctorId: reasonModal.id, reason: reasonText.trim() });
        notify('Doctor Rejected', 'Verification application rejected.');
      } else {
        await revokeDoctor({ doctorId: reasonModal.id, reason: reasonText.trim() });
        notify('Credentials Revoked', 'Doctor credentials revoked and active cases flagged.');
      }
      setReasonModal(null);
      setReasonText('');
    } catch (err: any) {
      notify('Error', err.message || 'Action failed');
    }
  };

  const activeList = tab === 'PENDING' ? pendingDoctors : doctors;

  const renderItem = ({ item: doc }: any) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.doctorName}>{doc.user?.fullName || 'Dr. Medical Consultant'}</Text>
            <Text style={styles.contactInfo}>{doc.user?.email} · {doc.user?.phone}</Text>
          </View>
          <Chip
            textStyle={{ color: COLORS.onAccent, fontSize: 10, fontWeight: '800' }}
            style={{ backgroundColor: doc.verificationStatus === 'VERIFIED' ? COLORS.emeraldFill : doc.verificationStatus === 'PENDING' ? COLORS.amberFill : COLORS.redFill }}
          >
            {doc.verificationStatus}
          </Chip>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>PMDC Registration No:</Text>
          <Text style={styles.detailValue}>{doc.pmdcNumber || 'PMDC-Pending'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>CNIC Number:</Text>
          <Text style={styles.detailValue}>{doc.cnic || 'Recorded'}</Text>
        </View>

        {doc.verificationStatus === 'PENDING' && (
          <View style={styles.actionsRow}>
            <Button
              mode="contained"
              buttonColor={COLORS.emeraldFill}
              textColor={COLORS.onAccent}
              onPress={() => void handleApprove(doc.id)}
              style={{ flex: 0.48, borderRadius: RADIUS.md }}
              labelStyle={{ fontWeight: '700' }}
            >
              Approve PMDC
            </Button>
            <Button
              mode="outlined"
              textColor={COLORS.red}
              onPress={() => { setReasonText(''); setReasonModal({ id: doc.id, mode: 'REJECT' }); }}
              style={{ flex: 0.48, borderColor: COLORS.red, borderRadius: RADIUS.md }}
              labelStyle={{ fontWeight: '700' }}
            >
              Reject
            </Button>
          </View>
        )}

        {doc.verificationStatus === 'VERIFIED' && (
          <View style={styles.actionsRow}>
            <Button
              mode="outlined"
              textColor={COLORS.red}
              onPress={() => { setReasonText(''); setReasonModal({ id: doc.id, mode: 'REVOKE' }); }}
              style={{ flex: 1, borderColor: COLORS.red, borderRadius: RADIUS.md }}
              labelStyle={{ fontWeight: '700' }}
            >
              Revoke PMDC Credentials
            </Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigate('/admin')} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Back to Command Center</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Doctor Credential Governance</Text>
          <Text style={styles.subtitle}>Audit PMDC registrations, onboard consultants, and manage status</Text>
        </View>

        <View style={styles.tabRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.tabBtn, tab === 'PENDING' && styles.tabBtnActive]}
            onPress={() => setTab('PENDING')}
          >
            <Text style={[styles.tabBtnText, tab === 'PENDING' && styles.tabBtnTextActive]}>
              Pending ({pendingDoctors.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.tabBtn, tab === 'ALL' && styles.tabBtnActive]}
            onPress={() => setTab('ALL')}
          >
            <Text style={[styles.tabBtnText, tab === 'ALL' && styles.tabBtnTextActive]}>
              All Doctors ({doctors.length})
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading && activeList.length === 0 ? (
          <ActivityIndicator color={COLORS.navy} size="large" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={activeList}
            keyExtractor={(item: any) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={() => (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>👨‍⚕️</Text>
                <Text style={styles.emptyTitle}>Queue Clear</Text>
                <Text style={styles.emptySub}>No doctor credentials require audit in this tab.</Text>
              </View>
            )}
          />
        )}
      </View>

      <TouchableOpacity activeOpacity={0.85} style={styles.fab} onPress={() => setShowAddModal(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Portal>
        <Dialog visible={showAddModal} onDismiss={() => setShowAddModal(false)} style={{ backgroundColor: COLORS.surfaceCard }}>
          <Dialog.Title style={{ color: COLORS.textDark, fontWeight: '700' }}>Add Doctor</Dialog.Title>
          <Dialog.Content>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
              <Button mode={addMode === 'INVITE' ? 'contained' : 'outlined'} onPress={() => setAddMode('INVITE')}>Invite</Button>
              <Button mode={addMode === 'DIRECT' ? 'contained' : 'outlined'} onPress={() => setAddMode('DIRECT')}>Direct Create</Button>
            </View>
            <PaperTextInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" style={{ marginBottom: 10 }} />
            <PaperTextInput label="Phone" value={phone} onChangeText={setPhone} style={{ marginBottom: 10 }} />
            {addMode === 'DIRECT' && (
              <>
                <PaperTextInput label="Full Name" value={fullName} onChangeText={setFullName} style={{ marginBottom: 10 }} />
                <PaperTextInput label="Password" value={password} onChangeText={setPassword} secureTextEntry style={{ marginBottom: 10 }} />
                <PaperTextInput label="CNIC" value={cnic} onChangeText={setCnic} style={{ marginBottom: 10 }} />
                <PaperTextInput label="PMDC Number" value={pmdc} onChangeText={setPmdc} style={{ marginBottom: 10 }} />
              </>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAddModal(false)}>Cancel</Button>
            <Button onPress={handleAddSubmit} loading={createDoctor.isPending || inviteUser.isPending}>Submit</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={!!reasonModal} onDismiss={() => setReasonModal(null)} style={{ backgroundColor: COLORS.surfaceCard }}>
          <Dialog.Title style={{ color: COLORS.textDark, fontWeight: '700' }}>
            {reasonModal?.mode === 'REJECT' ? 'Reject PMDC Verification' : 'Revoke PMDC Credentials'}
          </Dialog.Title>
          <Dialog.Content>
            <PaperTextInput
              label="Justification Reason (min 10 chars)"
              value={reasonText}
              onChangeText={setReasonText}
              multiline
              style={{ marginBottom: 10 }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setReasonModal(null)}>Cancel</Button>
            <Button textColor={COLORS.red} onPress={() => void confirmReasonAction()}>
              {reasonModal?.mode === 'REJECT' ? 'Reject' : 'Revoke'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.surface },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  fabText: { fontSize: 30, color: COLORS.onAccent, fontWeight: '700', lineHeight: 32 },
  container: { flex: 1, backgroundColor: COLORS.surface, padding: SPACING.lg },
  listContent: { paddingBottom: 80 },
  header: { marginBottom: 16 },
  backBtn: { marginBottom: 8 },
  backText: { color: COLORS.navy, fontSize: 13, fontWeight: '700' },
  title: { color: COLORS.textDark, fontSize: 22, fontWeight: '800' },
  subtitle: { color: COLORS.textBody, fontSize: 12.5, marginTop: 4 },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  tabBtn: {
    flex: 1,
    backgroundColor: COLORS.surfaceCard,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  tabBtnActive: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  tabBtnText: { color: COLORS.textBody, fontSize: 12, fontWeight: '600' },
  tabBtnTextActive: { color: COLORS.onAccent, fontWeight: '700' },
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  doctorName: { color: COLORS.textDark, fontSize: 15, fontWeight: '700' },
  contactInfo: { color: COLORS.textBody, fontSize: 12, marginTop: 3 },
  divider: { backgroundColor: COLORS.dividerLight, marginVertical: 10 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  detailLabel: { color: COLORS.textBody, fontSize: 12 },
  detailValue: { color: COLORS.textDark, fontSize: 12, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  emptyCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyTitle: { color: COLORS.textDark, fontSize: 16, fontWeight: '700' },
  emptySub: { color: COLORS.textBody, fontSize: 12.5, textAlign: 'center', marginTop: 4 },
});
