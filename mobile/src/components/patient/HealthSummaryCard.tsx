
import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../theme';

interface HealthSummaryCardProps {
  heartRate?: number | string;
  bloodPressure?: string;
  riskLevel?: string;
  heartRateStatus?: string;
  bpStatus?: string;
  riskStatus?: string;
  onPress?: () => void;
}

export const HealthSummaryCard: React.FC<HealthSummaryCardProps> = ({
  heartRate = '--',
  bloodPressure = '--/--',
  riskLevel = 'Low',
  heartRateStatus = 'Normal',
  bpStatus = 'Normal',
  riskStatus = 'Stable',
  onPress,
}) => {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  return (
    <TouchableOpacity style={styles.summaryCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.metricColumn}>
        <Text style={styles.metricLabel}>Heart Rate</Text>
        <View style={styles.metricValRow}>
          <Text style={styles.metricVal}>{heartRate}</Text>
          <Text style={styles.metricUnit}> bpm</Text>
        </View>
        <View style={styles.statusPillGreen}>
          <Text style={styles.statusPillTextGreen}>{heartRateStatus}</Text>
        </View>
      </View>

      <View style={styles.metricDivider} />

      <View style={styles.metricColumn}>
        <Text style={styles.metricLabel}>Blood Pressure</Text>
        <Text style={styles.metricVal}>{bloodPressure}</Text>
        <View style={styles.statusPillGreen}>
          <Text style={styles.statusPillTextGreen}>{bpStatus}</Text>
        </View>
      </View>

      <View style={styles.metricDivider} />

      <View style={styles.metricColumn}>
        <Text style={styles.metricLabel}>Risk Level</Text>
        <Text style={styles.metricVal}>{riskLevel}</Text>
        <View style={styles.statusPillGreen}>
          <Text style={styles.statusPillTextGreen}>{riskStatus}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  summaryCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  metricColumn: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    color: COLORS.textBody,
    fontSize: 11,
    marginBottom: 4,
  },
  metricValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  metricVal: {
    color: COLORS.textDark,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '800',
  },
  metricUnit: {
    color: COLORS.textBody,
    fontSize: 10,
  },
  metricDivider: {
    width: 1,
    height: '70%',
    backgroundColor: COLORS.glassSurface,
  },
  statusPillGreen: {
    backgroundColor: COLORS.emeraldLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 6,
  },
  statusPillTextGreen: {
    color: COLORS.emerald,
    fontSize: 10,
    fontWeight: '600',
  },
}));
