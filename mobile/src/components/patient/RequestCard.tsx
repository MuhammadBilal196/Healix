
import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../theme';

interface RequestCardProps {
  title: string;
  type: string;
  scheduledAt: string;
  status: string;
  onPress: () => void;
}

export const RequestCard: React.FC<RequestCardProps> = ({
  title,
  type,
  scheduledAt,
  status,
  onPress,
}) => {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const renderBadge = () => {
    switch (status) {
      case 'ASSIGNED':
        return (
          <View style={[styles.badge, { backgroundColor: COLORS.emeraldLight, borderColor: COLORS.emerald }]}>
            <Text style={[styles.badgeText, { color: COLORS.emerald }]}>Assigned</Text>
          </View>
        );
      case 'IN_PROGRESS':
        return (
          <View style={[styles.badge, { backgroundColor: COLORS.amberLight, borderColor: COLORS.amber }]}>
            <Text style={[styles.badgeText, { color: COLORS.amber }]}>In Progress</Text>
          </View>
        );
      case 'COMPLETED':
        return (
          <View style={[styles.badge, { backgroundColor: COLORS.tealLight, borderColor: COLORS.teal }]}>
            <Text style={[styles.badgeText, { color: COLORS.teal }]}>Completed</Text>
          </View>
        );
      case 'CANCELLED':
        return (
          <View style={[styles.badge, { backgroundColor: COLORS.redLight, borderColor: COLORS.red }]}>
            <Text style={[styles.badgeText, { color: COLORS.red }]}>Cancelled</Text>
          </View>
        );
      default:
        return (
          <View style={[styles.badge, { backgroundColor: COLORS.glassSurface, borderColor: COLORS.inputBorder }]}>
            <Text style={[styles.badgeText, { color: COLORS.textBody }]}>{status}</Text>
          </View>
        );
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <View style={styles.iconBg}>
          <Text style={styles.iconText}>🩺</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.reqId}>{title}</Text>
          <Text style={styles.reqType}>{type}</Text>
          <Text style={styles.reqDate}>{scheduledAt}</Text>
        </View>
        {renderBadge()}
      </View>
    </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBg: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.emeraldLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  iconText: {
    fontSize: 20,
  },
  info: {
    flex: 1,
  },
  reqId: {
    color: COLORS.textDark,
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: '700',
  },
  reqType: {
    color: COLORS.textBody,
    fontSize: 11,
    marginTop: 2,
  },
  reqDate: {
    color: COLORS.textBody,
    fontSize: 10,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.round,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
}));
