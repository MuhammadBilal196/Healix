import { useAppTheme, useThemeValue } from '../../../theme/ThemeProvider';
import type { ThemeColors } from '../../../theme';
import React, { useState } from 'react';
import { apiClient } from '../../../api/client';
import { appAlert } from '../../../components/common/AppDialogs';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useAuthStore } from '../../../store/auth';
import { useNurseEarnings } from '../../../hooks/useNurse';
import { ErrorState } from '../../../components/common/ErrorState';

import { SPACING, RADIUS, TYPOGRAPHY } from '../../../theme';

function formatCurrency(amount: number): string {
  return `PKR ${amount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-PK', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

export default function NurseEarningsScreen() {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const { user } = useAuthStore();
  const nurseId = user?.nurseId || user?.id || '';
  const { data: earnings, isLoading, error, refetch } = useNurseEarnings(nurseId);
  const [confirming, setConfirming] = useState<string | null>(null);
  const confirmCash = async (paymentId: string) => {
    setConfirming(paymentId);
    try { await apiClient.put(`/payments/${paymentId}/confirm-cash`, {}); await refetch(); }
    catch (e: any) { appAlert('Could not confirm payment', e.message || 'Please try again.'); }
    finally { setConfirming(null); }
  };

  if (error) {
    return <ErrorState error={error.message} onRetry={() => void refetch()} />;
  }

  if (isLoading && !earnings) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primaryText} />
        <Text style={styles.loadingText}>Loading Earnings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>💰 Earnings & Payments</Text>
        <Text style={styles.subtitle}>{earnings?.basis || "Recorded care payments; payout settlement is not connected."}</Text>
      </View>

      {/* Main Stats */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Earned</Text>
        <Text style={styles.totalAmount}>{formatCurrency(earnings?.totalEarned ?? 0)}</Text>
        <View style={styles.totalDivider} />
        <View style={styles.totalRow}>
          <View style={styles.totalStat}>
            <Text style={styles.totalStatNumber}>{earnings?.completedCount ?? 0}</Text>
            <Text style={styles.totalStatLabel}>Completed</Text>
          </View>
          <View style={[styles.totalStat, styles.totalStatBorder]}>
            <Text style={[styles.totalStatNumber, { color: COLORS.amber }]}>{formatCurrency(earnings?.pendingAmount ?? 0)}</Text>
            <Text style={styles.totalStatLabel}>Pending</Text>
          </View>
          <View style={styles.totalStat}>
            <Text style={styles.totalStatNumber}>{earnings?.pendingCount ?? 0}</Text>
            <Text style={styles.totalStatLabel}>Pending Count</Text>
          </View>
        </View>
      </View>

      {/* Payment History */}
      <Text style={styles.sectionTitle}>Payment History</Text>

      {(!earnings?.history || earnings.history.length === 0) ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>No Payments Yet</Text>
          <Text style={styles.emptyText}>Completed visit payments will appear here.</Text>
        </View>
      ) : (
        earnings.history.map((payment: any) => (
          <View key={payment.id} style={styles.paymentRow}>
            <View style={[styles.paymentStatusDot, {
              backgroundColor: payment.status === 'PAID' ? COLORS.emerald :
                payment.status === 'PENDING' ? COLORS.amber : COLORS.red
            }]} />
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
              <Text style={styles.paymentDate}>{formatDate(payment.createdAt)}</Text>
              {payment.status === 'PENDING' && (
                <TouchableOpacity accessibilityRole="button" disabled={confirming === payment.id} onPress={() => void confirmCash(payment.id)} style={styles.confirmBtn}>
                  <Text style={styles.confirmText}>{confirming === payment.id ? 'Saving…' : 'Confirm cash received'}</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={[styles.paymentBadge, {
              backgroundColor: payment.status === 'PAID' ? COLORS.emerald :
                payment.status === 'PENDING' ? COLORS.red : COLORS.bg
            }]}>
              <Text style={[styles.paymentBadgeText, {
                color: payment.status === 'PAID' ? COLORS.emerald :
                  payment.status === 'PENDING' ? COLORS.amber : COLORS.red
              }]}>
                {payment.status}
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.surface, gap: 12 },
  loadingText: { color: COLORS.textBody, fontSize: 14 },
  header: { marginBottom: 20 },
  title: { color: COLORS.textDark, fontSize: 22, fontWeight: '700' },
  subtitle: { color: COLORS.textBody, fontSize: 13, marginTop: 4 },
  totalCard: {
    backgroundColor: COLORS.bg, borderRadius: 18, padding: 24, marginBottom: 24,
    borderWidth: 1, borderColor: COLORS.navy + '44'
  },
  totalLabel: { color: COLORS.textBody, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  totalAmount: { color: COLORS.emerald, fontSize: 34, fontWeight: '800', marginTop: 8, marginBottom: 20 },
  totalDivider: { height: 1, backgroundColor: COLORS.inputBorder, marginBottom: 20 },
  totalRow: { flexDirection: 'row' },
  totalStat: { flex: 1, alignItems: 'center' },
  totalStatBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: COLORS.inputBorder },
  totalStatNumber: { color: COLORS.primaryText, fontSize: 18, fontWeight: '700' },
  totalStatLabel: { color: COLORS.textMuted, fontSize: 11, marginTop: 4 },
  sectionTitle: { color: COLORS.textBody, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  emptyCard: {
    backgroundColor: COLORS.surfaceCard, borderRadius: 14, padding: 32,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.inputBorder
  },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { color: COLORS.textDark, fontSize: 16, fontWeight: '700', marginBottom: 8 },
  emptyText: { color: COLORS.textBody, fontSize: 13, textAlign: 'center' },
  paymentRow: {
    backgroundColor: COLORS.surfaceCard, borderRadius: 12, padding: 16, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.inputBorder
  },
  paymentStatusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 14 },
  paymentInfo: { flex: 1 },
  paymentAmount: { color: COLORS.textDark, fontSize: 16, fontWeight: '700' },
  paymentDate: { color: COLORS.textMuted, fontSize: 12, marginTop: 3 },
  paymentBadge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  paymentBadgeText: { fontSize: 11, fontWeight: '700' },
  confirmBtn: { marginTop: 6, alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: COLORS.teal },
  confirmText: { color: COLORS.teal, fontSize: 12, fontWeight: '700' },
}));


