
import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { RADIUS, SPACING } from '../../theme';

export interface WorkflowStep {
  key: 'summary' | 'checkin' | 'vitals' | 'symptoms' | 'remarks' | 'risk' | 'complete';
  label: string;
  completed: boolean;
  active: boolean;
}

interface VisitProgressBarProps {
  steps: WorkflowStep[];
}

export const VisitProgressBar: React.FC<VisitProgressBarProps> = ({ steps }) => {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {steps.map((step, idx) => (
          <View key={step.key} style={styles.stepGroup}>
            <View
              style={[
                styles.stepChip,
                step.completed && styles.completedChip,
                step.active && styles.activeChip,
              ]}
            >
              <Text
                style={[
                  styles.stepIcon,
                  step.completed && styles.completedText,
                  step.active && styles.activeText,
                ]}
              >
                {step.completed ? '✓' : step.active ? '●' : '○'}
              </Text>
              <Text
                style={[
                  styles.stepLabel,
                  step.completed && styles.completedText,
                  step.active && styles.activeText,
                ]}
              >
                {step.label}
              </Text>
            </View>

            {idx < steps.length - 1 && (
              <View style={[styles.connector, step.completed && styles.completedConnector]} />
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  container: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  scrollContent: {
    alignItems: 'center',
  },
  stepGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.glassSurface,
  },
  completedChip: {
    backgroundColor: COLORS.emeraldLight,
  },
  activeChip: {
    backgroundColor: COLORS.emerald,
  },
  stepIcon: {
    color: COLORS.textBody,
    fontSize: 10,
    marginRight: 4,
    fontWeight: '700',
  },
  stepLabel: {
    color: COLORS.textBody,
    fontSize: 10,
    fontWeight: '600',
  },
  completedText: {
    color: COLORS.emerald,
    fontWeight: '700',
  },
  activeText: {
    color: COLORS.textMuted,
    fontWeight: '800',
  },
  connector: {
    width: 12,
    height: 2,
    backgroundColor: COLORS.glassSurface,
    marginHorizontal: 4,
  },
  completedConnector: {
    backgroundColor: COLORS.emerald,
  },
}));
