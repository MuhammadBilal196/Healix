import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../theme';
import { useCareRequests } from '../../hooks/useCareRequests';
import { navigate } from '../../utils/navigation';

/**
 * After the nurse completes and checks out, the patient must approve the visit. That approval
 * completes the contract and records the payment, so it is shown prominently on the home screen.
 */
export function VisitReviewBanner() {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);
  const requests = useCareRequests();

  const toReview = (requests.data || [])
    .flatMap((r: any) => (r.visits || []).map((v: any) => ({ ...v, nurseName: v.nurse?.user?.fullName })))
    .filter((v: any) => v.status === 'COMPLETED' && !v.completionApprovedAt && !v.completionDisputeReason);
  if (toReview.length === 0) return null;

  const first = toReview[0];
  return (
    <TouchableOpacity accessibilityRole="button" style={styles.card} onPress={() => navigate(`/(patient)/visits/${first.id}`)}>
      <View style={styles.icon}><Ionicons name="checkmark-done-outline" size={22} color={COLORS.teal} /></View>
      <View style={styles.body}>
        <Text style={styles.title}>{toReview.length === 1 ? 'Your visit is finished' : `${toReview.length} visits are finished`}</Text>
        <Text style={styles.text}>{first.nurseName ? `${first.nurseName} completed your visit. ` : ''}Review and approve it to confirm the payment.</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.tealLight, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.teal, padding: SPACING.lg, marginBottom: SPACING.lg },
  icon: { width: 40, height: 40, borderRadius: RADIUS.md, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 2 },
  title: { ...TYPOGRAPHY.bodyMedium, fontWeight: '700', color: COLORS.textPrimary },
  text: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary },
});
