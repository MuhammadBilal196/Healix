
import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../theme';

interface AssignedStaffCardProps {
  name: string;
  role: string;
  rating?: number;
  onChatPress: () => void;
  onCallPress: () => void;
}

export const AssignedStaffCard: React.FC<AssignedStaffCardProps> = ({
  name,
  role,
  rating = 4.8,
  onChatPress,
  onCallPress,
}) => {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Avatar.Icon size={50} icon="account-heart" style={styles.avatar} color={COLORS.emerald} />
        <View style={styles.info}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.role}>{role}</Text>
        </View>
        <View style={styles.ratingBadge}>
          <Text style={styles.starIcon}>⭐</Text>
          <Text style={styles.ratingText}>{rating}</Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.chatBtn} onPress={onChatPress} activeOpacity={0.8}>
          <Text style={styles.chatBtnText}>💬 Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.callBtn} onPress={onCallPress} activeOpacity={0.8}>
          <Text style={styles.callBtnText}>📞 Call</Text>
        </TouchableOpacity>
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatar: {
    backgroundColor: COLORS.bg,
  },
  info: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  name: {
    color: COLORS.textDark,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '700',
  },
  role: {
    color: COLORS.textBody,
    fontSize: 11,
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.amberLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  starIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  ratingText: {
    color: COLORS.amber,
    fontSize: 11,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  chatBtn: {
    flex: 1,
    backgroundColor: COLORS.emeraldLight,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.emerald,
  },
  chatBtnText: {
    color: COLORS.emerald,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '700',
  },
  callBtn: {
    flex: 1,
    backgroundColor: COLORS.emeraldFill,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  callBtnText: {
    color: COLORS.onAccent,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '700',
  },
}));
