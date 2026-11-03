import { useAppTheme, useThemeValue } from '../../../../theme/ThemeProvider';
import type { ThemeColors } from '../../../../theme';
import { ContractHistory } from '../../../../components/contracts/ContractHistory';
import { appAlert, confirmAction } from '../../../../components/common/AppDialogs';
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { navigate } from '../../../../utils/navigation';
import { useContract, useApproveContract, useRejectContract, useCancelContract } from '../../../../hooks/useContracts';
import { ContractApprovalPanel } from '../../../../components/contracts/ContractApprovalPanel';
import { ContractSummary } from '../../../../components/contracts/ContractSummary';
import { SPACING, TYPOGRAPHY, RADIUS } from '../../../../theme';

export default function NurseContractDetailScreen() {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const { id } = useLocalSearchParams<{ id: string }>();
  const contractId = id || '';

  const { data: contract, isLoading, isError, error } = useContract(contractId, {
    pollingInterval: 10000, // Poll every 10s to see if patient approves
  });

  const approveContract = useApproveContract();
  const rejectContract = useRejectContract();
  const cancelContract = useCancelContract();
  const [reason, setReason] = useState('');

  const handleApprove = async (cid: string) => {
    if (!await confirmAction('Approve this agreement?', 'Review the rate and scope above. Your approval is recorded; the agreement activates when both parties approve.')) return;
    try {
      const approved = await approveContract.mutateAsync(cid);
      appAlert('Success', approved.status === 'ACTIVE' ? 'Both parties approved. The contract is active.' : 'Your approval is recorded. Waiting for the other party.');
    } catch (err: any) {
      appAlert('Error', err.message || 'Failed to approve contract');
    }
  };

  const handleReject = async (cid: string) => {
    if (!reason.trim()) { appAlert('Reason required', 'Enter your rejection reason below.'); return; }
    if (!await confirmAction('Reject agreement?', reason.trim())) return;
    try {
      await rejectContract.mutateAsync({ id: cid, data: { reason: reason.trim() } });
      appAlert('Rejected', 'Contract has been rejected.');
    } catch (err: any) {
      appAlert('Error', err.message || 'Failed to reject contract');
    }
  };

  const handleCancel = async () => { if (!reason.trim()) { appAlert('Reason required','Enter a cancellation reason below.'); return; } if (!await confirmAction('Cancel agreement?',reason.trim())) return; try { await cancelContract.mutateAsync({id:contractId,data:{reason:reason.trim()}}); } catch(e:any) { appAlert('Could not cancel',e.message); } };

  if (isLoading && !contract) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.primaryText} size="large" />
      </View>
    );
  }

  if (isError || !contract) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Contract not found</Text>
        <Text style={styles.errorDetail}>{(error as Error)?.message}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ContractSummary contract={contract} viewer="nurse" />

      <ContractApprovalPanel
        contract={contract}
        isPatientView={false}
        onApprove={handleApprove}
        onReject={handleReject}
        isApproving={approveContract.isPending}
        isRejecting={rejectContract.isPending}
        style={styles.approvalPanel}
      />
      { ['PENDING_APPROVAL','ACTIVE'].includes(contract.status) && <TextInput mode="outlined" label="Reason (only needed to reject or cancel)" multiline maxLength={2000} value={reason} onChangeText={setReason} textColor={COLORS.textDark} style={{ marginTop: SPACING.lg }} /> }
      {contract.status === 'ACTIVE' && <View style={styles.infoBox}>
        <Text style={styles.infoValue}>Both parties approved. Your visit is being prepared and should appear in Assigned Visits shortly.</Text>
        <Button onPress={() => navigate('/(nurse)/(tabs)/visits')}>View assigned visits</Button>
      </View>}
      {['PENDING_APPROVAL','ACTIVE'].includes(contract.status) && <Button disabled={cancelContract.isPending || approveContract.isPending || rejectContract.isPending} onPress={handleCancel}>Cancel contract</Button>}
      <ContractHistory contract={contract} />
    </ScrollView>
  );
}

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    padding: SPACING.lg,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
  },
  infoBox: {
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoLabel: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  infoValue: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  scopeText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textPrimary,
    fontStyle: 'italic',
  },
  approvalPanel: {
    marginTop: SPACING.lg,
  },
  errorText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.red,
    marginBottom: SPACING.xs,
  },
  errorDetail: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
}));
