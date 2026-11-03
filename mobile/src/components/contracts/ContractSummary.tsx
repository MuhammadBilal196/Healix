import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../theme';
import type { Contract } from '../../types/contract';
import { ContractStatusBadge } from './ContractStatusBadge';
import { durationLabel, estimateExplanation, pkr, rateLabel, serviceEstimate } from '../../utils/pricing';

/** The agreement itself: who, what, when, how much, and the approval deadline. */
export function ContractSummary({ contract, viewer }: { contract: Contract; viewer: 'patient' | 'nurse' }) {
  useAppTheme();
  const styles = useThemeValue(createStyles);
  const request: any = contract.careRequest;
  const minutes = request?.durationMinutes || 60;
  const estimate = serviceEstimate(contract.price, contract.priceType, minutes);
  const when = request?.scheduledAt || request?.preferredDate;
  const service = request?.type ? String(request.type).replace(/_/g, ' ').toLowerCase() : 'Home nursing care';
  const pending = contract.status === 'PENDING_APPROVAL';

  const Row = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.row}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>
  );

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>Care agreement</Text>
          <Text style={styles.title}>{service.charAt(0).toUpperCase() + service.slice(1)}</Text>
        </View>
        <ContractStatusBadge status={contract.status} />
      </View>

      <Row label="Patient" value={contract.patient?.user?.fullName || (viewer === 'patient' ? 'You' : 'Patient')} />
      <Row label="Nurse" value={contract.nurse?.user?.fullName || (viewer === 'nurse' ? 'You' : 'Nurse')} />
      <Row label="Schedule" value={`${request?.scheduleType === 'RECURRING' ? 'Recurring' : 'One visit'}${when ? ` · from ${new Date(when).toLocaleDateString()}` : ''}${request?.preferredStartTime ? ` at ${request.preferredStartTime}` : ''}`} />
      <Row label="Visit length" value={durationLabel(minutes)} />

      <View style={styles.priceBox}>
        <View style={styles.row}><Text style={styles.label}>Agreed rate</Text><Text style={styles.price}>PKR {pkr(contract.price)} <Text style={styles.unit}>{rateLabel(contract.priceType)}</Text></Text></View>
        <View style={styles.row}><Text style={styles.label}>Per visit estimate</Text><Text style={styles.value}>PKR {pkr(estimate)}</Text></View>
        <Text style={styles.hint}>{estimateExplanation(contract.price, contract.priceType, minutes)} = PKR {pkr(estimate)}</Text>
      </View>

      <Text style={styles.label}>Scope of work</Text>
      <Text style={styles.scope}>{contract.scopeText}</Text>

      {pending && <Text style={styles.deadline}>Both parties must approve before {new Date(contract.expiresAt).toLocaleString()}.</Text>}
    </View>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  card: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.lg, gap: SPACING.sm, marginBottom: SPACING.lg },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, marginBottom: SPACING.sm },
  kicker: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '700' },
  title: { ...TYPOGRAPHY.h2, color: COLORS.textPrimary },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: SPACING.md, paddingVertical: 2 },
  label: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary },
  value: { ...TYPOGRAPHY.bodyMedium, color: COLORS.textPrimary, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  priceBox: { backgroundColor: COLORS.bg, borderRadius: RADIUS.md, padding: SPACING.md, gap: SPACING.xs, marginVertical: SPACING.sm },
  price: { ...TYPOGRAPHY.bodyMedium, fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  unit: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary, fontWeight: '600' },
  hint: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary },
  scope: { ...TYPOGRAPHY.bodyMedium, color: COLORS.textPrimary },
  deadline: { ...TYPOGRAPHY.bodySmall, color: COLORS.amber, fontWeight: '600', marginTop: SPACING.sm },
});
