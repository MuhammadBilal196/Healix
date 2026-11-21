
import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../theme';

interface VitalsMetricCardProps {
  title: string;
  value: string;
  unit: string;
  status: string;
  sparkHeights: number[];
}

export const VitalsMetricCard: React.FC<VitalsMetricCardProps> = ({
  title,
  value,
  unit,
  status,
  sparkHeights,
}) => {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  return (
    <View style={styles.metricCard}>
      <View style={styles.cardTopRow}>
        <View>
          <Text style={styles.metricTitle}>{title}</Text>
          <View style={styles.valUnitRow}>
            <Text style={styles.metricVal}>{value}</Text>
            <Text style={styles.metricUnit}> {unit}</Text>
          </View>
        </View>

        <View style={styles.normalPill}>
          <Text style={styles.greenDot}>●</Text>
          <Text style={styles.normalText}>{status}</Text>
        </View>
      </View>

      <View style={styles.sparklineRow}>
        {sparkHeights.map((h, i) => (
          <View
            key={i}
            style={[
              styles.sparkBar,
              {
                height: (h / 100) * 32,
                backgroundColor: i === sparkHeights.length - 1 ? COLORS.emerald : COLORS.emeraldLight,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  metricCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  metricTitle: {
    color: COLORS.textBody,
    fontSize: 12,
    marginBottom: 4,
  },
  valUnitRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  metricVal: {
    color: COLORS.textDark,
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '800',
  },
  metricUnit: {
    color: COLORS.textBody,
    fontSize: TYPOGRAPHY.sizes.xs,
  },
  normalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.emeraldLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  greenDot: {
    color: COLORS.emerald,
    fontSize: 8,
    marginRight: 4,
  },
  normalText: {
    color: COLORS.emerald,
    fontSize: 11,
    fontWeight: '600',
  },
  sparklineRow: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  sparkBar: {
    width: 6,
    borderRadius: 3,
  },
}));
