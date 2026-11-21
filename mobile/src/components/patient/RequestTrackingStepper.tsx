
import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../theme';

interface Step {
  title: string;
  sub?: string;
  time: string;
  status: 'completed' | 'current' | 'pending';
}

interface RequestTrackingStepperProps {
  steps: Step[];
}

export const RequestTrackingStepper: React.FC<RequestTrackingStepperProps> = ({ steps }) => {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  return (
    <View style={styles.card}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        return (
          <View key={index} style={styles.item}>
            <View style={styles.leftCol}>
              <View
                style={[
                  styles.dot,
                  step.status === 'completed' && styles.dotCompleted,
                  step.status === 'current' && styles.dotCurrent,
                  step.status === 'pending' && styles.dotPending,
                ]}
              >
                {step.status === 'completed' ? (
                  <Text style={styles.checkIcon}>✓</Text>
                ) : step.status === 'current' ? (
                  <View style={styles.innerDot} />
                ) : null}
              </View>
              {!isLast && (
                <View
                  style={[
                    styles.line,
                    step.status === 'completed' && styles.lineActive,
                  ]}
                />
              )}
            </View>

            <View style={styles.rightCol}>
              <Text
                style={[
                  styles.stepTitle,
                  step.status === 'current' && styles.stepTitleCurrent,
                ]}
              >
                {step.title}
              </Text>
              {step.sub && <Text style={styles.stepSub}>{step.sub}</Text>}
              <Text style={styles.stepTime}>{step.time}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  item: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  leftCol: {
    alignItems: 'center',
    marginRight: SPACING.md,
    width: 24,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotCompleted: {
    backgroundColor: COLORS.emerald,
  },
  dotCurrent: {
    backgroundColor: COLORS.transparent,
    borderWidth: 2,
    borderColor: COLORS.emerald,
  },
  innerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.emerald,
  },
  dotPending: {
    backgroundColor: COLORS.transparent,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
  },
  checkIcon: {
    color: COLORS.onAccent,
    fontSize: 12,
    fontWeight: '800',
  },
  line: {
    width: 2,
    height: 36,
    backgroundColor: COLORS.glassSurface,
    marginVertical: 4,
  },
  lineActive: {
    backgroundColor: COLORS.emerald,
  },
  rightCol: {
    flex: 1,
    paddingBottom: SPACING.md,
  },
  stepTitle: {
    color: COLORS.textDark,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
  },
  stepTitleCurrent: {
    color: COLORS.emerald,
    fontWeight: '700',
  },
  stepSub: {
    color: COLORS.textBody,
    fontSize: 11,
    marginTop: 2,
  },
  stepTime: {
    color: COLORS.textBody,
    fontSize: 10,
    marginTop: 2,
  },
}));
