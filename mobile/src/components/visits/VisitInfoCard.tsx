
import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Divider } from 'react-native-paper';
import { Visit } from '../../types/visit';
import { VisitStatusBadge } from './VisitStatusBadge';
import { RADIUS, SPACING } from '../../theme';

interface VisitInfoCardProps {
  visit: Visit;
}

const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  const styles = useThemeValue(createStyles);
  return (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);
};

export const VisitInfoCard: React.FC<VisitInfoCardProps> = ({ visit }) => {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const patient = visit.request?.patient;
  const nurse = visit.nurse;

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.headerRow}>
          <Text style={styles.sectionHeader}>Patient Information</Text>
          <VisitStatusBadge status={visit.status} />
        </View>
        <Divider style={styles.divider} />

        <DetailRow label="Patient Name" value={patient?.user?.fullName || 'Not available'} />
        <DetailRow label="Phone" value={patient?.user?.phone || 'Not provided'} />
        <DetailRow label="Address" value={visit.request?.location?.address || 'Not available'} />
        <DetailRow
          label="Scheduled"
          value={visit.request?.scheduledAt ? new Date(visit.request.scheduledAt).toLocaleString() : 'Pending'}
        />
        
        <Divider style={styles.divider} />
        <Text style={styles.sectionHeader}>Request Details</Text>
        <DetailRow label="Visit Type" value={visit.request?.requirements || (visit.request?.type === 'DOCTOR_VISIT' ? 'Doctor Visit' : 'Nurse Visit')} />
        <DetailRow label="Schedule" value={visit.request?.scheduleType === 'RECURRING' ? 'Recurring' : 'One-Time'} />
        {visit.request?.preferredTimeWindow && (
          <DetailRow label="Time Window" value={visit.request.preferredTimeWindow} />
        )}
        {visit.request?.durationMinutes && (
          <DetailRow label="Duration" value={`${visit.request.durationMinutes} mins`} />
        )}

        {nurse && (
          <>
            <Divider style={styles.divider} />
            <Text style={styles.sectionHeader}>Assigned Nurse</Text>
            <DetailRow label="Name" value={nurse.user?.fullName || 'Not assigned'} />
          </>
        )}
      </Card.Content>
    </Card>
  );
};

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  card: { backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.inputBorder, marginBottom: SPACING.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionHeader: { color: COLORS.textDark, fontSize: 15, fontWeight: '700' },
  divider: { backgroundColor: COLORS.dividerLight, marginVertical: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  detailLabel: { color: COLORS.textBody, fontSize: 13 },
  detailValue: { color: COLORS.textDark, fontSize: 13, fontWeight: '600', flexShrink: 1, textAlign: 'right', maxWidth: '55%' },
}));

