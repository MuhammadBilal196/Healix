
import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../theme';

interface ConditionCardProps {
  name: string;
  diagnosedDate?: string | null;
  notes?: string | null;
}

export const ConditionCard: React.FC<ConditionCardProps> = ({ name, diagnosedDate, notes }) => {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  return (
    <View style={styles.card}>
      <Text style={styles.name}>{name}</Text>
      {diagnosedDate && <Text style={styles.sub}>Diagnosed: {diagnosedDate}</Text>}
      {notes && <Text style={styles.notes}>{notes}</Text>}
    </View>
  );
};

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  name: {
    color: COLORS.textDark,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '700',
  },
  sub: {
    color: COLORS.textBody,
    fontSize: 11,
    marginTop: 2,
  },
  notes: {
    color: COLORS.textBody,
    fontSize: 10,
    marginTop: 4,
  },
}));
