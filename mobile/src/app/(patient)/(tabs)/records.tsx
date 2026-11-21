
import { useAppTheme, useThemeValue } from '../../../theme/ThemeProvider';
import type { ThemeColors } from '../../../theme';
import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Text } from 'react-native-paper';
import { navigate } from '../../../utils/navigation';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../../theme';

export default function HealthRecordsScreen() {
  const { dark: isDarkTheme } = useAppTheme();

  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const recordItems = [
      {
        id: 'clinical-outcomes',
        title: 'Clinical Outcomes & Diagnoses',
        subtitle: 'Doctor diagnoses and completed cases',
        icon: '🩺',
        bgColor: COLORS.redLight, // Red-ish
        route: '/(patient)/health/clinical-outcomes',
      },
  
    {
      id: 'vitals',
      title: 'Vitals & Biometrics',
      subtitle: 'View your vital signs history and sparklines',
      icon: '🩺',
      bgColor: COLORS.emeraldLight,
      route: '/(patient)/records/vitals',
    },
    {
      id: 'prescriptions',
      title: 'Prescriptions & Medications',
      subtitle: 'All active and past prescriptions',
      icon: '💊',
      bgColor: COLORS.blueLight,
      route: '/(patient)/health/prescriptions',
    },
    {
      id: 'lab-results',
      title: 'Medical Timeline & Labs',
      subtitle: 'Chronological health record and conditions',
      icon: '🧪',
      bgColor: COLORS.purpleLight,
      route: '/(patient)/health/medical',
    },
    {
      id: 'visits',
      title: 'Care Visits & History',
      subtitle: 'Your care requests and visit history',
      icon: '📋',
      bgColor: COLORS.amberLight,
      route: '/(patient)/(tabs)/requests',
    },
    {
      id: 'care-plans',
      title: 'Active Care Plans',
      subtitle: 'Your structured clinical care plans',
      icon: '📑',
      bgColor: COLORS.redLight,
      route: '/(patient)/health/careplans',
    },
    {
      id: 'risk-history',
      title: 'AI Risk History',
      subtitle: 'AI fusion risk assessment timeline',
      icon: '📊',
      bgColor: COLORS.blueLight,
      route: '/(patient)/records/risk-history',
    },
    {
      id: 'medical-info',
      title: 'Medical Information & Allergies',
      subtitle: 'Allergies, chronic conditions & profile',
      icon: '🏥',
      bgColor: COLORS.emeraldLight,
      route: '/(patient)/health/medical',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Health Vault Records</Text>
        </View>

        {/* Record Cards List */}
        <View style={styles.cardList}>
          {recordItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.recordCard}
              onPress={() => navigate(item.route as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconBg, { backgroundColor: item.bgColor }]}>
                <Text style={styles.iconText}>{item.icon}</Text>
              </View>

              <View style={styles.textWrap}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSub}>{item.subtitle}</Text>
              </View>

              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  headerTitle: {
    color: COLORS.textDark,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '700',
  },
  cardList: {
    gap: SPACING.md,
  },
  recordCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  iconText: {
    fontSize: 20,
  },
  textWrap: {
    flex: 1,
  },
  cardTitle: {
    color: COLORS.textDark,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '700',
  },
  cardSub: {
    color: COLORS.textBody,
    fontSize: 11,
    marginTop: 2,
  },
  chevron: {
    color: COLORS.textBody,
    fontSize: 22,
    fontWeight: '600',
  },
}));

