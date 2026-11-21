import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView, StatusBar, FlatList, Platform } from 'react-native';
import { Card, Button, Chip, Divider, Portal, Dialog, TextInput as PaperTextInput } from 'react-native-paper';
import { navigate } from '../../utils/navigation';
import { useAdminNurses, useAdminPendingNurses, useApproveNurse, useRejectNurse, useRevokeNurse } from '../../hooks/useAdmin';
import { SPACING, RADIUS } from '../../theme';

export default function AdminNurses() {
  const { dark: isDarkTheme } = useAppTheme();
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const { data: pendingNurses_raw, isLoading: isLoadingPending } = useAdminPendingNurses();
  const pendingNurses: any[] = Array.isArray(pendingNurses_raw) ? pendingNurses_raw : (pendingNurses_raw as any)?.users || [];
  const { data: nurses_raw, isLoading: isLoadingNurses } = useAdminNurses();
  const nurses: any[] = Array.isArray(nurses_raw) ? nurses_raw : (nurses_raw as any)?.users || [];

  const { mutateAsync: approveNurse } = useApproveNurse();
  const { mutateAsync: rejectNurse } = useRejectNurse();
  const { mutateAsync: revokeNurse } = useRevokeNurse();

  const isLoading = isLoadingPending || isLoadingNurses;
  const [tab, setTab] = useState<'PENDING' | 'ALL'>('PENDING');
  const [reasonModal, setReasonModal] = useState<{ id: string; mode: 'REJECT' | 'REVOKE' } | null>(null);
  const [reasonText, setReasonText] = useState('');

  const notify = (title: string, msg: string) => {
    if (Platform.OS === 'web') alert(`${title}: ${msg}`);
    else Alert.alert(title, msg);
  };

  const handleApprove = async (id: string) => {
    try {
      await approveNurse(id);
      notify('Nurse Approved', 'PNC credentials verified and account activated.');
    } catch (err: any) {
      notify('Error', err.message || 'Action failed');
    }
  };

  const confirmReasonAction = async () => {
    if (!reasonModal || reasonText.trim().length < 10) {
      notify('Validation Error', 'A clear justification reason (min 10 chars) is required.');
      return;
    }
    try {
      if (reasonModal.mode === 'REJECT') {
        await rejectNurse({ nurseId: reasonModal.id, reason: reasonText.trim() });
        notify('Nurse Rejected', 'Verification application rejected.');
      } else {
        await revokeNurse({ nurseId: reasonModal.id, reason: reasonText.trim() });
        notify('Credentials Revoked', 'Nurse PNC credentials have been revoked.');
      }
      setReasonModal(null);
      setReasonText('');
    } catch (err: any) {
      notify('Error', err.message || 'Action failed');
    }
  };

  const activeList = tab === 'PENDING' ? pendingNurses : nurses;

  const renderItem = ({ item: nurse }: any) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.nurseName}>{nurse.user?.fullName || 'Nurse Specialist'}</Text>
            <Text style={styles.contactInfo}>{nurse.user?.email} · {nurse.user?.phone}</Text>
          </View>
          <Chip
            textStyle={{ color: COLORS.onAccent, fontSize: 10, fontWeight: '800' }}
            style={{ backgroundColor: nurse.verificationStatus === 'VERIFIED' ? COLORS.emeraldFill : nurse.verificationStatus === 'PENDING' ? COLORS.amberFill : COLORS.redFill }}
          >
            {nurse.verificationStatus}
          </Chip>
        </View>

        <Divider style={styles.divider} />

        <Button
          mode="outlined"
          textColor={COLORS.navy}
          style={{ borderColor: COLORS.inputBorder, borderRadius: RADIUS.md, marginBottom: 10 }}
          onPress={() => navigate(`/admin/nurse-review/${nurse.id}` as any)}
        >
          Review Documents &amp; Specialty Certificates
        </Button>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>PNC Registration No:</Text>
          <Text style={styles.detailValue}>{nurse.pncNumber || 'PNC-Pending'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>CNIC Number:</Text>
          <Text style={styles.detailValue}>{nurse.cnic || 'Recorded'}</Text>
        </View>

        {nurse.verificationStatus === 'PENDING' && (
          <View style={styles.actionsRow}>
            <Button
              mode="contained"
              buttonColor={COLORS.emeraldFill}
              textColor={COLORS.onAccent}
              onPress={() => void handleApprove(nurse.id)}
              style={{ flex: 0.48, borderRadius: RADIUS.md }}
              labelStyle={{ fontWeight: '700' }}
            >
              Approve PNC
            </Button>
            <Button
              mode="outlined"
              textColor={COLORS.red}
              onPress={() => { setReasonText(''); setReasonModal({ id: nurse.id, mode: 'REJECT' }); }}
              style={{ flex: 0.48, borderColor: COLORS.red, borderRadius: RADIUS.md }}
              labelStyle={{ fontWeight: '700' }}
            >
              Reject
            </Button>
          </View>
        )}

        {nurse.verificationStatus === 'VERIFIED' && (
          <View style={styles.actionsRow}>
            <Button
              mode="outlined"
              textColor={COLORS.red}
              onPress={() => { setReasonText(''); setReasonModal({ id: nurse.id, mode: 'REVOKE' }); }}
              style={{ flex: 1, borderColor: COLORS.red, borderRadius: RADIUS.md }}
              labelStyle={{ fontWeight: '700' }}
            >
              Revoke PNC Credentials
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
          <Text style={styles.title}>Nurse Credential Governance</Text>
          <Text style={styles.subtitle}>Audit PNC certificates, documents, and home care authorization</Text>
        </View>

        <View style={styles.tabRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.tabBtn, tab === 'PENDING' && styles.tabBtnActive]}
            onPress={() => setTab('PENDING')}
          >
            <Text style={[styles.tabBtnText, tab === 'PENDING' && styles.tabBtnTextActive]}>
              Pending ({pendingNurses.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.tabBtn, tab === 'ALL' && styles.tabBtnActive]}
            onPress={() => setTab('ALL')}
          >
            <Text style={[styles.tabBtnText, tab === 'ALL' && styles.tabBtnTextActive]}>
              All Nurses ({nurses.length})
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
                <Text style={styles.emptyIcon}>🩺</Text>
                <Text style={styles.emptyTitle}>Queue Clear</Text>
                <Text style={styles.emptySub}>No nurse credentials require audit in this tab.</Text>
              </View>
            )}
          />
        )}
      </View>

      <Portal>
        <Dialog visible={!!reasonModal} onDismiss={() => setReasonModal(null)} style={{ backgroundColor: COLORS.surfaceCard }}>
          <Dialog.Title style={{ color: COLORS.textDark, fontWeight: '700' }}>
            {reasonModal?.mode === 'REJECT' ? 'Reject PNC Verification' : 'Revoke PNC Credentials'}
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
  container: { flex: 1, backgroundColor: COLORS.surface, padding: SPACING.lg },
  listContent: { paddingBottom: 40 },
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
  nurseName: { color: COLORS.textDark, fontSize: 15, fontWeight: '700' },
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
