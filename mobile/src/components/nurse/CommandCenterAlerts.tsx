
import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../theme';

interface AlertItem {
  id: string;
  type: 'HIGH_RISK' | 'ESCALATION' | 'URGENT';
  patientName: string;
  message: string;
  timeAgo: string;
  visitId?: string;
}

interface CommandCenterAlertsProps {
  alerts: AlertItem[];
  onAlertPress: (alert: AlertItem) => void;
}

export const CommandCenterAlerts: React.FC<CommandCenterAlertsProps> = ({ alerts, onAlertPress }) => {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  if (!alerts || alerts.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Urgent Patient & AI Alerts</Text>
      <View style={styles.alertList}>
        {alerts.map((item) => {
          const isHighRisk = item.type === 'HIGH_RISK';
          const isEscalation = item.type === 'ESCALATION';

          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.alertCard,
                isHighRisk && styles.highRiskCard,
                isEscalation && styles.escalationCard,
              ]}
              onPress={() => onAlertPress(item)}
              activeOpacity={0.85}
            >
              <View style={styles.topRow}>
                <View style={styles.badgeGroup}>
                  <Text style={styles.alertIcon}>
                    {isHighRisk ? '🚨' : isEscalation ? '⚠️' : '🔔'}
                  </Text>
                  <Text
                    style={[
                      styles.badgeText,
                      isHighRisk && styles.highRiskText,
                      isEscalation && styles.escalationText,
                    ]}
                  >
                    {isHighRisk ? 'HIGH RISK PATIENT' : isEscalation ? 'DOCTOR ESCALATION' : 'URGENT ALERT'}
                  </Text>
                </View>
                <Text style={styles.timeAgo}>{item.timeAgo}</Text>
              </View>

              <Text style={styles.patientName}>{item.patientName}</Text>
              <Text style={styles.messageText}>{item.message}</Text>

              <View style={styles.actionRow}>
                <Text style={styles.actionLink}>Review Patient & Vitals ›</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    color: COLORS.textDark,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  alertList: {
    gap: SPACING.sm,
  },
  alertCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  highRiskCard: {
    backgroundColor: COLORS.surfaceCard,
    borderColor: COLORS.red,
  },
  escalationCard: {
    backgroundColor: COLORS.surfaceCard,
    borderColor: COLORS.amber,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.emerald,
  },
  highRiskText: {
    color: COLORS.red,
  },
  escalationText: {
    color: COLORS.amber,
  },
  timeAgo: {
    color: COLORS.textBody,
    fontSize: 10,
  },
  patientName: {
    color: COLORS.textDark,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '700',
    marginTop: 2,
  },
  messageText: {
    color: COLORS.textBody,
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  actionRow: {
    marginTop: SPACING.sm,
  },
  actionLink: {
    color: COLORS.emerald,
    fontSize: 11,
    fontWeight: '700',
  },
}));
