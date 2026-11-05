
import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';

import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView, StatusBar, FlatList } from 'react-native';
import { useState } from 'react';
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

  const pendingList = [
    ...pendingNurses.map((n: any) => ({ ...n, type: 'NURSE' })),
    ...pendingDoctors.map((d: any) => ({ ...d, type: 'DOCTOR' }))
  ].sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const handleApprove = async (item: any) => {
    try {
      if (item.type === 'NURSE') {
        await approveNurse(item.id);
        Alert.alert('Nurse Approved', 'PNC credentials verified.');
      } else {
        await approveDoctor(item.id);
        Alert.alert('Doctor Approved', 'PMDC credentials verified.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Action failed');
    }
  };

  const handleReject = (item: any) => { setRejectReason(''); setRejectTarget(item); return;
    Alert.prompt(
      `Reject ${item.type} Verification`,
      `Reason for rejecting application (min 5 chars):`,
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
              if (item.type === 'NURSE') {
                await rejectNurse({ nurseId: item.id, reason: reason.trim() });
              } else {
                await rejectDoctor({ doctorId: item.id, reason: reason.trim() });
              }
              Alert.alert('Rejected', 'Verification application rejected.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Action failed');
            }
          }
        }
      ]
    );
  };

  const confirmRejectItem = async () => {
    if (!rejectTarget || rejectReason.trim().length < 5) {
      Alert.alert('Error', 'A clear justification reason (min 5 chars) is required.');
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
      Alert.alert('Rejected', 'Verification application rejected.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Action failed');
    }
  };
  const renderItem = ({ item }: any) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemName}>{item.user?.fullName || (item.type === 'NURSE' ? 'Nurse' : 'Doctor')}</Text>
            <Text style={styles.contactInfo}>
              📧 {item.user?.email} · 📱 {item.user?.phone}
            </Text>
          </View>
          <Chip
            textStyle={{ color: COLORS.textMuted, fontSize: 10, fontWeight: '800' }}
            style={{ backgroundColor: item.type === 'NURSE' ? COLORS.navy : COLORS.purple }}
          >
            {item.type}
          </Chip>
        </View>

        <Divider style={styles.divider} />
        {item.type === 'NURSE' && <Button onPress={() => navigate(`/admin/nurse-review/${item.id}` as any)}>Review uploaded documents</Button>}

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
            textColor={COLORS.textMuted}
            onPress={() => handleApprove(item)}
            style={{ flex: 0.48, borderRadius: RADIUS.md }}
            labelStyle={{ fontWeight: '700' }}
          >
            Approve
          </Button>
          <Button
            mode="outlined"
            textColor={COLORS.red}
            onPress={() => handleReject(item)}
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
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} backgroundColor={COLORS.bg} />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigate('/admin')} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Back to Command Center</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Verification Queue</Text>
          <Text style={styles.subtitle}>Audit and approve pending credential verifications</Text>
        </View>

        {isLoading && pendingList.length === 0 ? (
          <ActivityIndicator color={COLORS.emerald} size="large" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={pendingList}
            keyExtractor={(item) => `${item.type}-${item.id}`}
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
          <Dialog.Title style={{ color: COLORS.textDark }}>Reject Verification</Dialog.Title>
          <Dialog.Content>
            <PaperTextInput
              label="Rejection Reason (min 5 chars)"
              value={rejectReason}
              onChangeText={setRejectReason}
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

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: SPACING.lg },
  listContent: { paddingBottom: 40 },
  header: { marginBottom: 20 },
  backBtn: { marginBottom: 8 },
  backText: { color: COLORS.emerald, fontSize: 13, fontWeight: '700' },
  title: { color: COLORS.textDark, fontSize: 20, fontWeight: '800' },
  subtitle: { color: COLORS.textBody, fontSize: 12, marginTop: 4 },
  card: { backgroundColor: COLORS.bg, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.emeraldLight, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemName: { color: COLORS.textDark, fontSize: 15, fontWeight: '700' },
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
