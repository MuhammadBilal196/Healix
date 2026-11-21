import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';

import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView, StatusBar, FlatList, Platform } from 'react-native';
import { Card, Button, Chip, Divider, Portal, Dialog, TextInput as PaperTextInput } from 'react-native-paper';
import { navigate } from '../../utils/navigation';
import { useAdminPendingNurses, useAdminPendingDoctors, useApproveNurse, useRejectNurse, useApproveDoctor, useRejectDoctor } from '../../hooks/useAdmin';
import { SPACING, RADIUS } from '../../theme';

export default function AdminVerification() {
  const { dark: isDarkTheme } = useAppTheme();
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const { data: pendingNurses_raw, isLoading: isLoadingNurses } = useAdminPendingNurses();
  const pendingNurses: any[] = Array.isArray(pendingNurses_raw) ? pendingNurses_raw : (pendingNurses_raw as any)?.users || [];
  const { data: pendingDoctors_raw, isLoading: isLoadingDoctors } = useAdminPendingDoctors();
  const pendingDoctors: any[] = Array.isArray(pendingDoctors_raw) ? pendingDoctors_raw : (pendingDoctors_raw as any)?.users || [];

  const { mutateAsync: approveNurse } = useApproveNurse();
  const { mutateAsync: rejectNurse } = useRejectNurse();
  const { mutateAsync: approveDoctor } = useApproveDoctor();
  const { mutateAsync: rejectDoctor } = useRejectDoctor();

  const isLoading = isLoadingNurses || isLoadingDoctors;
  const [rejectTarget, setRejectTarget] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const notify = (title: string, msg: string) => {
    if (Platform.OS === 'web') alert(`${title}: ${msg}`);
    else Alert.alert(title, msg);
  };

  const pendingList = [
    ...pendingNurses.map((n: any) => ({ ...n, type: 'NURSE' })),
    ...pendingDoctors.map((d: any) => ({ ...d, type: 'DOCTOR' })),
  ].sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const handleApprove = async (item: any) => {
    try {
      if (item.type === 'NURSE') {
        await approveNurse(item.id);
        notify('Nurse Approved', 'PNC credentials verified.');
      } else {
        await approveDoctor(item.id);
        notify('Doctor Approved', 'PMDC credentials verified.');
      }
    } catch (err: any) {
      notify('Error', err.message || 'Action failed');
    }
  };

  const confirmRejectItem = async () => {
    if (!rejectTarget || rejectReason.trim().length < 10) {
      notify('Validation Error', 'A clear justification reason (min 10 chars) is required.');
      return;
    }
    try {
      if (rejectTarget.type === 'NURSE') {
        await rejectNurse({ nurseId: rejectTarget.id, reason: rejectReason.trim() });
      } else {
        await rejectDoctor({ doctorId: rejectTarget.id, reason: rejectReason.trim() });
      }
      setRejectTarget(null);
      setRejectReason('');
      notify('Rejected', 'Verification application rejected.');
    } catch (err: any) {
      notify('Error', err.message || 'Action failed');
    }
  };

  const renderItem = ({ item }: any) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.itemName}>{item.user?.fullName || (item.type === 'NURSE' ? 'Nurse' : 'Doctor')}</Text>
            <Text style={styles.contactInfo}>{item.user?.email} · {item.user?.phone}</Text>
          </View>
          <Chip
            textStyle={{ color: COLORS.onAccent, fontSize: 10, fontWeight: '800' }}
            style={{ backgroundColor: item.type === 'NURSE' ? COLORS.navy : COLORS.purpleFill }}
          >
            {item.type}
          </Chip>
        </View>

        <Divider style={styles.divider} />

        {item.type === 'NURSE' && (
          <Button
            mode="outlined"
            textColor={COLORS.navy}
            style={{ borderColor: COLORS.inputBorder, borderRadius: RADIUS.md, marginBottom: 10 }}
            onPress={() => navigate(`/admin/nurse-review/${item.id}` as any)}
          >
            Review Uploaded Documents
          </Button>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{item.type === 'NURSE' ? 'PNC Registration No:' : 'PMDC Registration No:'}</Text>
          <Text style={styles.detailValue}>{item.type === 'NURSE' ? (item.pncNumber || 'PNC-Pending') : (item.pmdcNumber || 'PMDC-Pending')}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>CNIC Number:</Text>
          <Text style={styles.detailValue}>{item.cnic || 'Recorded'}</Text>
        </View>

        <View style={styles.actionsRow}>
          <Button
            mode="contained"
            buttonColor={COLORS.emeraldFill}
            textColor={COLORS.onAccent}
            onPress={() => void handleApprove(item)}
            style={{ flex: 0.48, borderRadius: RADIUS.md }}
            labelStyle={{ fontWeight: '700' }}
          >
            Approve
          </Button>
          <Button
            mode="outlined"
            textColor={COLORS.red}
            onPress={() => { setRejectReason(''); setRejectTarget(item); }}
            style={{ flex: 0.48, borderColor: COLORS.red, borderRadius: RADIUS.md }}
            labelStyle={{ fontWeight: '700' }}
          >
            Reject
          </Button>
        </View>
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
          <Text style={styles.title}>Verification Queue</Text>
          <Text style={styles.subtitle}>Audit and approve pending clinician credentials</Text>
        </View>

        {isLoading && pendingList.length === 0 ? (
          <ActivityIndicator color={COLORS.navy} size="large" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={pendingList}
            keyExtractor={(item: any) => `${item.type}-${item.id}`}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={() => (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>🛡️</Text>
                <Text style={styles.emptyTitle}>Queue Clear</Text>
                <Text style={styles.emptySub}>No pending verifications at the moment.</Text>
              </View>
            )}
          />
        )}
      </View>

      <Portal>
        <Dialog visible={!!rejectTarget} onDismiss={() => setRejectTarget(null)} style={{ backgroundColor: COLORS.surfaceCard }}>
          <Dialog.Title style={{ color: COLORS.textDark, fontWeight: '700' }}>Reject Verification</Dialog.Title>
          <Dialog.Content>
            <PaperTextInput
              label="Rejection Reason (min 10 chars)"
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              style={{ marginBottom: 10 }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setRejectTarget(null)}>Cancel</Button>
            <Button textColor={COLORS.red} onPress={() => void confirmRejectItem()}>Reject</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.surface },
  container: { flex: 1, backgroundColor: COLORS.surface, padding: SPACING.lg },
  listContent: { paddingBottom: 40 },
  header: { marginBottom: 16 },
  backBtn: { marginBottom: 8 },
  backText: { color: COLORS.navy, fontSize: 13, fontWeight: '700' },
  title: { color: COLORS.textDark, fontSize: 22, fontWeight: '800' },
  subtitle: { color: COLORS.textBody, fontSize: 12.5, marginTop: 4 },
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemName: { color: COLORS.textDark, fontSize: 15, fontWeight: '700' },
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
