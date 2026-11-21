
import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { SPACING, TYPOGRAPHY } from '../../theme';

interface NurseDashboardHeaderProps {
  nurseName: string;
  greeting?: string;
  photoUrl?: string | null;
  onProfilePress: () => void;
  onNotificationPress: () => void;
  unreadAlertsCount?: number;
}

export const NurseDashboardHeader: React.FC<NurseDashboardHeaderProps> = ({
  nurseName,
  greeting = 'Good Morning,',
  photoUrl,
  onProfilePress,
  onNotificationPress,
  unreadAlertsCount = 0,
}) => {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const initials = nurseName
    ? nurseName.split(' ').map(n => n[0]).join('').substring(0, 2)
    : 'RN';

  return (
    <View style={styles.header}>
      <View style={styles.profileRow}>
        <TouchableOpacity onPress={onProfilePress} activeOpacity={0.8}>
          {photoUrl ? (
            <Avatar.Image size={48} source={{ uri: photoUrl }} style={styles.avatarBorder} />
          ) : (
            <Avatar.Text size={48} label={initials} style={styles.avatarBg} color={COLORS.emerald} />
          )}
        </TouchableOpacity>
        <View style={styles.greetingWrap}>
          <Text style={styles.greetingText}>{greeting}</Text>
          <Text style={styles.nurseNameText}>{nurseName}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.notificationBellBtn}
        onPress={onNotificationPress}
        activeOpacity={0.8}
      >
        <Text style={styles.bellIcon}>🔔</Text>
        {unreadAlertsCount > 0 && <View style={styles.unreadBadgeDot} />}
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBg: {
    backgroundColor: COLORS.bg,
    borderWidth: 1.5,
    borderColor: COLORS.emerald,
  },
  avatarBorder: {
    borderWidth: 1.5,
    borderColor: COLORS.emerald,
  },
  greetingWrap: {
    marginLeft: SPACING.md,
  },
  greetingText: {
    color: COLORS.textBody,
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: '500',
  },
  nurseNameText: {
    color: COLORS.textDark,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '700',
  },
  notificationBellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  bellIcon: {
    fontSize: 18,
  },
  unreadBadgeDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.red,
  },
}));
