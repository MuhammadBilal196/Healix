
import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../theme';

interface MedicationCardProps {
  name: string;
  dosage: string;
  frequency: string;
  active: boolean;
}

export const MedicationCard: React.FC<MedicationCardProps> = ({ name, dosage, frequency, active }) => {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.sub}>{dosage} · {frequency}</Text>
      </View>
      <View style={[styles.badge, active ? styles.activeBadge : styles.inactiveBadge]}>
        <Text style={[styles.badgeText, active ? styles.activeText : styles.inactiveText]}>
          {active ? 'Active' : 'Inactive'}
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
  info: { flex: 1 },
  name: { color: COLORS.textDark, fontSize: TYPOGRAPHY.sizes.sm, fontWeight: '700' },
  sub: { color: COLORS.textBody, fontSize: 11, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.round, borderWidth: 1 },
  activeBadge: { backgroundColor: COLORS.emeraldLight, borderColor: COLORS.emerald },
  activeText: { color: COLORS.emerald },
  inactiveBadge: { backgroundColor: COLORS.glassSurface, borderColor: COLORS.inputBorder },
  inactiveText: { color: COLORS.textBody },
  badgeText: { fontSize: 10, fontWeight: '700' },
}));
