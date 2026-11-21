
import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../theme';

interface AllergyCardProps {
  allergen: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE' | string;
}

export const AllergyCard: React.FC<AllergyCardProps> = ({ allergen, severity }) => {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const isSevere = severity === 'SEVERE';
  const isModerate = severity === 'MODERATE';

  return (
    <View style={styles.card}>
      <View style={styles.infoGroup}>
        <Text style={styles.allergenName}>{allergen}</Text>
        <Text style={styles.label}>Allergy Reaction</Text>
      </View>
      <View
        style={[
          styles.badge,
          isSevere && styles.severeBadge,
          isModerate && styles.moderateBadge,
        ]}
      >
        <Text
          style={[
            styles.badgeText,
            isSevere && styles.severeText,
            isModerate && styles.moderateText,
          ]}
        >
          {severity}
        </Text>
      </View>
    </View>
  );
};

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  infoGroup: {
    flex: 1,
  },
  allergenName: {
    color: COLORS.textDark,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '700',
  },
  label: {
    color: COLORS.textBody,
    fontSize: 11,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.emeraldLight,
    borderWidth: 1,
    borderColor: COLORS.emerald,
  },
  badgeText: {
    color: COLORS.emerald,
    fontSize: 10,
    fontWeight: '700',
  },
  moderateBadge: {
    backgroundColor: COLORS.amberLight,
    borderColor: COLORS.amber,
  },
  moderateText: {
    color: COLORS.amber,
  },
  severeBadge: {
    backgroundColor: COLORS.redLight,
    borderColor: COLORS.red,
  },
  severeText: {
    color: COLORS.red,
  },
}));
