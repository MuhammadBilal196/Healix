import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView, StatusBar, FlatList, Platform } from 'react-native';
import { Card, Button, Chip, Divider, Portal, Dialog, TextInput as PaperTextInput } from 'react-native-paper';
import { useCreateDoctor, useInviteUser } from '../../hooks/useAdmin';
import { navigate } from '../../utils/navigation';
import { useAuthStore } from '../../store/auth';
import { useAdminDoctors, useAdminPendingDoctors, useApproveDoctor, useRejectDoctor, useRevokeDoctor } from '../../hooks/useAdmin';
import { SPACING, RADIUS } from '../../theme';

export default function AdminDoctors() {
  const { dark: isDarkTheme } = useAppTheme();

  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const { data: pendingDoctors = [], isLoading: isLoadingPending } = useAdminPendingDoctors();
  const { data: doctors = [], isLoading: isLoadingDoctors } = useAdminDoctors();
  
  const { mutateAsync: approveDoctor } = useApproveDoctor();
  const { mutateAsync: rejectDoctor } = useRejectDoctor();
  const { mutateAsync: revokeDoctor } = useRevokeDoctor();
  
  const isLoading = isLoadingPending || isLoadingDoctors;
  
  const [tab, setTab] = useState<'PENDING' | 'ALL'>('PENDING');

  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<'DIRECT'|'INVITE'>('INVITE');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [pmdc, setPmdc] = useState('');
  const [cnic, setCnic] = useState('');
  const [password, setPassword] = useState('');
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  
  const createDoctor = useCreateDoctor();
  const inviteUser = useInviteUser();
  
  const handleAddSubmit = async () => {
    try {
      if (addMode === 'INVITE') {
        const res = await inviteUser.mutateAsync({ email: email || undefined, phone: phone || undefined, role: 'DOCTOR' });
        const tokenMsg = res.data?.token ? (' Token: ' + res.data.token) : '';
        if (Platform.OS === 'web') alert('Invitation sent successfully!' + tokenMsg);
        else Alert.alert('Success', 'Invitation sent successfully!' + tokenMsg);
      } else {
        await createDoctor.mutateAsync({ email, phone, fullName, password, cnic, pmdcNumber: pmdc });
        if (Platform.OS === 'web') alert('Doctor created successfully!');
        else Alert.alert('Success', 'Doctor created successfully!');
      }
      setShowAddModal(false);
    } catch (err: any) {
      if (Platform.OS === 'web') alert('Error: ' + (err.message || 'Action failed'));
      else Alert.alert('Error', err.message || 'Action failed');
    }
  };


  const handleApprove = async (id: string) => {
    try {
      await approveDoctor(id);
      Alert.alert('Doctor Approved', 'PMDC credentials verified and consultant account activated.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Action failed');
    }
  };

  const handleReject = (id: string) => { setRejectReason(''); setRejectTargetId(id); return;
    Alert.prompt(
      'Reject PMDC Verification',
      'Reason for rejecting doctor application (min 5 chars):',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          onPress: async (reason?: string) => {
            if (!reason || reason.trim().length < 5) {
              Alert.alert('Error', 'A clear justification reason is required.');
              return;
            }
            try {
              await rejectDoctor({ doctorId: id, reason: reason.trim() });
              Alert.alert('Doctor Rejected', 'Verification application rejected.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Action failed');
            }
          }
        }
      ]
    );
  };

  const confirmRejectDoctor = async () => {
    if (!rejectTargetId || rejectReason.trim().length < 5) {
      Alert.alert('Error', 'A clear justification reason (min 5 chars) is required.');
      return;
    }
    try {
      await rejectDoctor({ doctorId: rejectTargetId, reason: rejectReason.trim() });
      setRejectTargetId(null);
      setRejectReason('');
      Alert.alert('Doctor Rejected', 'Verification application rejected.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Action failed');
    }
  };
  const activeList = tab === 'PENDING' ? pendingDoctors : doctors;

  const renderItem = ({ item: doc }: any) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.doctorName}>{doc.user?.fullName || 'Dr. Medical Consultant'}</Text>
            <Text style={styles.contactInfo}>
              📧 {doc.user?.email} · 📱 {doc.user?.phone}
            </Text>
          </View>
          <Chip
            textStyle={{ color: COLORS.textMuted, fontSize: 10, fontWeight: '800' }}
            style={{ backgroundColor: doc.verificationStatus === 'VERIFIED' ? COLORS.emerald : COLORS.amber }}
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
              textColor={COLORS.textMuted}
              onPress={() => handleApprove(doc.id)}
              style={{ flex: 0.48, borderRadius: RADIUS.md }}
              labelStyle={{ fontWeight: '700' }}
            >
              Approve PMDC
            </Button>
            <Button
              mode="outlined"
              textColor={COLORS.red}
              onPress={() => handleReject(doc.id)}
              style={{ flex: 0.48, borderColor: COLORS.red, borderRadius: RADIUS.md }}
              labelStyle={{ fontWeight: '700' }}
            >
              Reject File
            </Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} backgroundColor={COLORS.bg} />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigate('/admin')} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Back to Command Center</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Doctor Credential Governance</Text>
          <Text style={styles.subtitle}>Audit PMDC medical registration numbers and approve consultants</Text>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'PENDING' && styles.tabBtnActive]}
            onPress={() => setTab('PENDING')}
          >
            <Text style={[styles.tabBtnText, tab === 'PENDING' && styles.tabBtnTextActive]}>
              Pending Verification ({pendingDoctors.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, tab === 'ALL' && styles.tabBtnActive]}
            onPress={() => setTab('ALL')}
          >
            <Text style={[styles.tabBtnText, tab === 'ALL' && styles.tabBtnTextActive]}>
              All Verified Doctors ({doctors.length})
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading && activeList.length === 0 ? (
          <ActivityIndicator color={COLORS.emerald} size="large" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={activeList}
            keyExtractor={(item) => item.id}
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
    
        <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
        
        <Portal>
          <Dialog visible={showAddModal} onDismiss={() => setShowAddModal(false)} style={{ backgroundColor: COLORS.cardElevated }}>
            <Dialog.Title style={{ color: COLORS.textPrimary }}>Add Doctor</Dialog.Title>
            <Dialog.Content>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
                <Button mode={addMode === 'INVITE' ? 'contained' : 'outlined'} onPress={() => setAddMode('INVITE')}>Invite</Button>
                <Button mode={addMode === 'DIRECT' ? 'contained' : 'outlined'} onPress={() => setAddMode('DIRECT')}>Direct Create</Button>
              </View>
              
              <PaperTextInput label="Email" value={email} onChangeText={setEmail} style={{ marginBottom: 10 }} />
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
          <Dialog visible={!!rejectTargetId} onDismiss={() => setRejectTargetId(null)} style={{ backgroundColor: COLORS.surfaceCard }}>
            <Dialog.Title style={{ color: COLORS.textDark }}>Reject PMDC Verification</Dialog.Title>
            <Dialog.Content>
              <PaperTextInput
                label="Rejection Reason (min 5 chars)"
                value={rejectReason}
                onChangeText={setRejectReason}
                style={{ marginBottom: 10 }}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setRejectTargetId(null)}>Cancel</Button>
              <Button textColor={COLORS.red} onPress={() => void confirmRejectDoctor()}>Reject</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  fabText: { fontSize: 32, color: COLORS.textDark, lineHeight: 34 },
  container: { flex: 1, backgroundColor: COLORS.bg, padding: SPACING.lg },
  listContent: { paddingBottom: 40 },
  header: { marginBottom: 20 },
  backBtn: { marginBottom: 8 },
  backText: { color: COLORS.emerald, fontSize: 13, fontWeight: '700' },
  title: { color: COLORS.textDark, fontSize: 20, fontWeight: '800' },
  subtitle: { color: COLORS.textBody, fontSize: 12, marginTop: 4 },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tabBtn: { flex: 1, backgroundColor: COLORS.bg, paddingVertical: 10, borderRadius: RADIUS.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.emeraldLight },
  tabBtnActive: { backgroundColor: COLORS.bg, borderColor: COLORS.emerald },
  tabBtnText: { color: COLORS.textBody, fontSize: 11, fontWeight: '600' },
  tabBtnTextActive: { color: COLORS.emerald, fontWeight: '800' },
  card: { backgroundColor: COLORS.bg, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.emeraldLight, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  doctorName: { color: COLORS.textDark, fontSize: 15, fontWeight: '700' },
  contactInfo: { color: COLORS.textBody, fontSize: 11, marginTop: 2 },
  divider: { backgroundColor: COLORS.emeraldLight, marginVertical: 10 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  detailLabel: { color: COLORS.textBody, fontSize: 12 },
  detailValue: { color: COLORS.textDark, fontSize: 12, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  emptyCard: { backgroundColor: COLORS.bg, borderRadius: RADIUS.lg, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: COLORS.emeraldLight },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyTitle: { color: COLORS.textDark, fontSize: 16, fontWeight: '700' },
  emptySub: { color: COLORS.textBody, fontSize: 12, textAlign: 'center', marginTop: 4 },
}));
