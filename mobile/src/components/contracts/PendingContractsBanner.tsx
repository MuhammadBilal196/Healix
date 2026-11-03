import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../theme';
import { useNurseContracts, usePatientContracts } from '../../hooks/useContracts';
import { navigate } from '../../utils/navigation';
import type { Contract } from '../../types/contract';

/**
 * Shows the contracts that are waiting for *this* user's approval, so a nurse or patient
 * never has to hunt for an agreement the other side is waiting on.
 */
export function PendingContractsBanner({ role, profileId }: { role: 'patient' | 'nurse'; profileId?: string }) {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);
  const patientQuery = usePatientContracts(role === 'patient' ? profileId || '' : '', { pollingInterval: 30000 });
  const nurseQuery = useNurseContracts(role === 'nurse' ? profileId || '' : '', { pollingInterval: 30000 });
  const contracts: Contract[] = (role === 'patient' ? patientQuery.data : nurseQuery.data) || [];

  const waiting = contracts.filter(c => c.status === 'PENDING_APPROVAL'
    && Date.parse(c.expiresAt) > Date.now()
    && !(role === 'patient' ? c.patientApproved : c.nurseApproved));
  if (!profileId || waiting.length === 0) return null;

  const first = waiting[0];
  const otherParty = role === 'patient' ? first.nurse?.user?.fullName || 'your nurse' : first.patient?.user?.fullName || 'a patient';
  const path = `/(${role})/marketplace/contracts/${first.id}`;

  return (
    <TouchableOpacity accessibilityRole="button" style={styles.card} onPress={() => navigate(waiting.length === 1 ? path : `/(${role})/marketplace/contracts`)}>
      <View style={styles.icon}><Ionicons name="document-text-outline" size={22} color={COLORS.amber} /></View>
      <View style={styles.body}>
        <Text style={styles.title}>{waiting.length === 1 ? 'A contract needs your approval' : `${waiting.length} contracts need your approval`}</Text>
        <Text style={styles.text}>{waiting.length === 1 ? `Agreement with ${otherParty}. Review the terms and approve within 24 hours.` : 'Review the terms and approve each one within 24 hours.'}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.amberLight, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.amber, padding: SPACING.lg, marginBottom: SPACING.lg },
  icon: { width: 40, height: 40, borderRadius: RADIUS.md, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 2 },
  title: { ...TYPOGRAPHY.bodyMedium, fontWeight: '700', color: COLORS.textPrimary },
  text: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary },
});
