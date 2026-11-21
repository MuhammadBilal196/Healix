import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { THEMES, ThemeId, ThemeColors, SPACING, RADIUS, TYPOGRAPHY } from '../../theme';
import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';

export function ThemeToggleButton({
  compact = false,
  inverse = false,
}: {
  compact?: boolean;
  inverse?: boolean;
}) {
  const { dark, setTheme, colors: COLORS } = useAppTheme();
  const nextTheme: ThemeId = dark ? 'minimal-clean' : 'dark-futuristic';

  return (
    <TouchableOpacity
      onPress={() => { void setTheme(nextTheme); }}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={dark ? 'Switch to Clinical Light mode' : 'Switch to Dark Night mode'}
      style={[
        toggleStyles.pill,
        {
          backgroundColor: inverse ? COLORS.headerAvatarBg : COLORS.surfaceMuted,
          borderColor: inverse ? 'rgba(255,255,255,0.28)' : COLORS.inputBorder,
        },
        compact && toggleStyles.compactPill,
      ]}
    >
      <Ionicons
        name={dark ? 'sunny' : 'moon'}
        size={compact ? 17 : 15}
        color={inverse ? COLORS.headerText : COLORS.primaryText}
      />
      {!compact && (
        <Text
          style={[
            toggleStyles.label,
            { color: inverse ? COLORS.headerText : COLORS.textDark },
          ]}
        >
          {dark ? 'Light Mode' : 'Dark Mode'}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const toggleStyles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: RADIUS.round,
    borderWidth: 1,
  },
  compactPill: {
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
});

export function AppearanceSettings() {
  const { themeId, setTheme, persistenceError, colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const options: Array<{
    id: ThemeId;
    title: string;
    subtitle: string;
    icon: 'sunny' | 'moon';
  }> = [
    {
      id: 'minimal-clean',
      title: 'Clinical Light',
      subtitle: THEMES['minimal-clean'].name,
      icon: 'sunny',
    },
    {
      id: 'dark-futuristic',
      title: 'Dark Night',
      subtitle: THEMES['dark-futuristic'].name,
      icon: 'moon',
    },
  ];

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Appearance &amp; Theme</Text>
          <Text style={styles.sub}>Choose Clinical Light or Dark Night across Healix</Text>
        </View>
        <View style={styles.activeBadge}>
          <Text style={styles.activeBadgeText}>{themeId === 'dark-futuristic' ? 'Dark' : 'Light'}</Text>
        </View>
      </View>

      <View style={styles.segmentGrid}>
        {options.map((opt) => {
          const active = themeId === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              activeOpacity={0.85}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              onPress={() => { void setTheme(opt.id); }}
              style={[
                styles.optionCard,
                active && {
                  backgroundColor: COLORS.blueLight,
                  borderColor: COLORS.accentBlue,
                  borderWidth: 1.5,
                },
              ]}
            >
              <View style={styles.optionTop}>
                <View
                  style={[
                    styles.iconWrap,
                    { backgroundColor: active ? COLORS.navy : COLORS.surfaceMuted },
                  ]}
                >
                  <Ionicons
                    name={opt.icon}
                    size={18}
                    color={active ? COLORS.onAccent : COLORS.textBody}
                  />
                </View>
                {active && (
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.emerald} />
                )}
              </View>
              <Text style={styles.optionTitle}>{opt.title}</Text>
              <Text style={styles.optionSub}>{opt.subtitle}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {!!persistenceError && (
        <Text style={styles.error} accessibilityRole="alert">
          {persistenceError}
        </Text>
      )}
    </View>
  );
}

const createStyles = (COLORS: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: COLORS.surfaceCard,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: COLORS.inputBorder,
      padding: SPACING.lg,
      gap: SPACING.md,
      shadowColor: COLORS.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: SPACING.sm,
    },
    title: {
      color: COLORS.textDark,
      fontSize: TYPOGRAPHY.sizes.md,
      fontWeight: TYPOGRAPHY.weights.bold,
    },
    sub: {
      color: COLORS.textBody,
      fontSize: TYPOGRAPHY.sizes.xs,
      marginTop: 2,
    },
    activeBadge: {
      backgroundColor: COLORS.emeraldLight,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: RADIUS.round,
      borderWidth: 1,
      borderColor: COLORS.emerald,
    },
    activeBadgeText: {
      color: COLORS.emerald,
      fontSize: 11,
      fontWeight: '700',
    },
    segmentGrid: {
      flexDirection: 'row',
      gap: SPACING.md,
    },
    optionCard: {
      flex: 1,
      backgroundColor: COLORS.surface,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: COLORS.inputBorder,
      padding: SPACING.md,
      gap: 4,
    },
    optionTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    iconWrap: {
      width: 32,
      height: 32,
      borderRadius: RADIUS.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionTitle: {
      color: COLORS.textDark,
      fontSize: TYPOGRAPHY.sizes.sm,
      fontWeight: '700',
    },
    optionSub: {
      color: COLORS.textMuted,
      fontSize: 11,
    },
    error: {
      color: COLORS.red,
      fontSize: TYPOGRAPHY.sizes.xs,
    },
  });
