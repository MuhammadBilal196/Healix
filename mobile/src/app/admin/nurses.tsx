
import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView, StatusBar, FlatList } from 'react-native';
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
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleApprove = async (id: string) => {
    try {
      await approveNurse(id);
      Alert.alert('Nurse Approved', 'PNC credentials verified and account activated.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Action failed');
    }
  };

  const handleReject = (id: string) => { setRejectReason(''); setRejectTargetId(id); return;
    Alert.prompt(
      'Reject PNC Verification',
      'Reason for rejecting nurse application (min 5 chars):',
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
              await rejectNurse({ nurseId: id, reason: reason.trim() });
              Alert.alert('Nurse Rejected', 'Verification application rejected.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Action failed');
            }
          }
        }
      ]
    );
  };

  const confirmRejectNurse = async () => {
    if (!rejectTargetId || rejectReason.trim().length < 5) {
      Alert.alert('Error', 'A clear justification reason (min 5 chars) is required.');
      return;
    }
    try {
      await rejectNurse({ nurseId: rejectTargetId, reason: rejectReason.trim() });
      setRejectTargetId(null);
      setRejectReason('');
      Alert.alert('Nurse Rejected', 'Verification application rejected.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Action failed');
    }
  };
  const activeList = tab === 'PENDING' ? pendingNurses : nurses;

  const renderItem = ({ item: nurse }: any) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.nurseName}>{nurse.user?.fullName || 'Nurse Specialist'}</Text>
            <Text style={styles.contactInfo}>
              📧 {nurse.user?.email} · 📱 {nurse.user?.phone}
            </Text>
          </View>
          <Chip
            textStyle={{ color: COLORS.textMuted, fontSize: 10, fontWeight: '800' }}
            style={{ backgroundColor: nurse.verificationStatus === 'VERIFIED' ? COLORS.emerald : COLORS.amber }}
          >
            {nurse.verificationStatus}
          </Chip>
        </View>

        <Divider style={styles.divider} />
        <Button onPress={() => navigate(`/admin/nurse-review/${nurse.id}` as any)}>Review documents & specialty certificates</Button>

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
              textColor={COLORS.textMuted}
              onPress={() => handleApprove(nurse.id)}
              style={{ flex: 0.48, borderRadius: RADIUS.md }}
              labelStyle={{ fontWeight: '700' }}
            >
              Approve PNC
            </Button>
            <Button
              mode="outlined"
              textColor={COLORS.red}
              onPress={() => handleReject(nurse.id)}
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
          <Text style={styles.title}>Nurse Credential Governance</Text>
          <Text style={styles.subtitle}>Audit PNC license certificates and approve home visit nurses</Text>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'PENDING' && styles.tabBtnActive]}
            onPress={() => setTab('PENDING')}
          >
            <Text style={[styles.tabBtnText, tab === 'PENDING' && styles.tabBtnTextActive]}>
              Pending Verification ({pendingNurses.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, tab === 'ALL' && styles.tabBtnActive]}
            onPress={() => setTab('ALL')}
          >
            <Text style={[styles.tabBtnText, tab === 'ALL' && styles.tabBtnTextActive]}>
              All Registered Nurses ({nurses.length})
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
                <Text style={styles.emptyIcon}>🩺</Text>
                <Text style={styles.emptyTitle}>Queue Clear</Text>
                <Text style={styles.emptySub}>No nurse credentials require audit in this tab.</Text>
              </View>
            )}
          />
        )}
      </View>
      <Portal>
        <Dialog visible={!!rejectTargetId} onDismiss={() => setRejectTargetId(null)} style={{ backgroundColor: COLORS.surfaceCard }}>
          <Dialog.Title style={{ color: COLORS.textDark }}>Reject PNC Verification</Dialog.Title>
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
            <Button textColor={COLORS.red} onPress={() => void confirmRejectNurse()}>Reject</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
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
  nurseName: { color: COLORS.textDark, fontSize: 15, fontWeight: '700' },
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
