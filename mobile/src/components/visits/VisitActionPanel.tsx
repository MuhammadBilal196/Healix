
import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Button, Divider } from 'react-native-paper';
import { Visit } from '../../types/visit';
import { RADIUS, SPACING } from '../../theme';

interface VisitActionPanelProps {
  visit: Visit;
  onVerify: () => void;
  onRecordVitals: () => void;
  onRecordSymptoms: () => void;
  onRecordRemarks: () => void;
  onComplete: () => void;
  isCompleting?: boolean;
}

export const VisitActionPanel: React.FC<VisitActionPanelProps> = ({
  visit,
  onVerify,
  onRecordVitals,
  onRecordSymptoms,
  onRecordRemarks,
  onComplete,
  isCompleting,
}) => {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  if (visit.status === 'SCHEDULED' || visit.status === 'ACCEPTED') {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionHeader}>Identity Verification Required</Text>
          <Divider style={styles.divider} />
          <Text style={styles.description}>
            Verify patient identity using QR Code scan, GPS proximity, or manual verification before recording clinical data.
          </Text>
          <Button
            mode="contained"
            buttonColor={COLORS.emeraldFill}
            textColor={COLORS.onAccent}
            onPress={onVerify}
            style={styles.actionBtn}
            labelStyle={styles.btnLabel}
          >
            Verify Patient & Start Visit
          </Button>
        </Card.Content>
      </Card>
    );
  }

  if (visit.status === 'IN_PROGRESS') {
    const hasVitals = (visit.vitals?.length ?? 0) > 0;
    const hasSymptoms = (visit.symptoms?.length ?? 0) > 0;
    const hasRemarks = !!visit.clinicalRemark;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionHeader}>Clinical Workflow</Text>
          <Divider style={styles.divider} />
          <Text style={styles.description}>
            Record vitals, document symptoms, and submit clinical remarks to complete the visit.
          </Text>
          <View style={styles.actionsStack}>
            <Button
              mode="contained"
              buttonColor={hasVitals ? COLORS.emerald : COLORS.primaryText}
              textColor={COLORS.onAccent}
              onPress={onRecordVitals}
              labelStyle={styles.btnLabel}
            >
              {hasVitals ? 'Vitals Recorded' : '1. Record Vitals'}
            </Button>
            <Button
              mode="contained"
              buttonColor={hasSymptoms ? COLORS.emerald : COLORS.primaryText}
              textColor={COLORS.onAccent}
              onPress={onRecordSymptoms}
              labelStyle={styles.btnLabel}
            >
              {hasSymptoms ? 'Symptoms Logged' : '2. Symptoms Checklist'}
            </Button>
            <Button
              mode="contained"
              buttonColor={hasRemarks ? COLORS.emerald : COLORS.purple}
              textColor={COLORS.onAccent}
              onPress={onRecordRemarks}
              labelStyle={styles.btnLabel}
            >
              {hasRemarks ? 'Remarks Submitted' : '3. Clinical Remarks'}
            </Button>
            <Button
              mode="contained"
              buttonColor={COLORS.emeraldFill}
              textColor={COLORS.onAccent}
              onPress={onComplete}
              loading={isCompleting}
              disabled={isCompleting}
              style={{ marginTop: 8 }}
              labelStyle={styles.btnLabel}
            >
              Complete Visit
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  }

  if (visit.status === 'COMPLETED') {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionHeader}>Visit Completed</Text>
          <Divider style={styles.divider} />
          <Text style={styles.summaryText}>Patient Identity Verified</Text>
          {(visit.vitals?.length ?? 0) > 0 && <Text style={styles.summaryText}>Vitals Recorded</Text>}
          {(visit.symptoms?.length ?? 0) > 0 && <Text style={styles.summaryText}>Symptoms Logged</Text>}
          {visit.clinicalRemark && <Text style={styles.summaryText}>Clinical Remarks Submitted</Text>}
          {visit.completedAt && (
            <Text style={styles.completedAt}>
              Completed: {new Date(visit.completedAt).toLocaleString()}
            </Text>
          )}
        </Card.Content>
      </Card>
    );
  }

  return null;
};

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  card: { backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.inputBorder, marginBottom: SPACING.lg },
  sectionHeader: { color: COLORS.textDark, fontSize: 15, fontWeight: '700' },
  divider: { backgroundColor: COLORS.dividerLight, marginVertical: 12 },
  description: { color: COLORS.textBody, fontSize: 12, marginBottom: 12, lineHeight: 18 },
  actionBtn: { borderRadius: RADIUS.md },
  btnLabel: { fontWeight: '700' },
  actionsStack: { gap: 10 },
  summaryText: { color: COLORS.emerald, fontSize: 13, fontWeight: '600', marginBottom: 6 },
  completedAt: { color: COLORS.textBody, fontSize: 12, marginTop: 8 },
}));
