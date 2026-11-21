
import { useAppTheme, useThemeValue } from '../../../theme/ThemeProvider';
import type { ThemeColors } from '../../../theme';
import React from 'react';
import { StyleSheet, View, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import { Text, Card, Avatar, Chip } from 'react-native-paper';
import { navigate } from '../../../utils/navigation';
import { useAuthStore } from '../../../store/auth';
import { useCaregivers } from '../../../hooks/useHealth';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../../theme';
import { LoadingState } from '../../../components/common/LoadingState';
import { ErrorState } from '../../../components/common/ErrorState';

export default function CaregiversScreen() {
  const { dark: isDarkTheme } = useAppTheme();

  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const { user } = useAuthStore();
  const patientId = user?.patientId || '';

  const { data: caregivers = [], isLoading, error, refetch } = useCaregivers(patientId);

  if (isLoading && caregivers.length === 0) return <LoadingState message="Loading caregivers..." />;
  if (error) return <ErrorState error={error as Error} onRetry={refetch} />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Connected Caregivers</Text>
        </View>

        <Text style={styles.subtitle}>Manage family members or caregivers linked to your account</Text>

        <Card style={styles.card}>
          <Card.Title
            title="Active Caregiver Links"
            titleStyle={styles.cardTitle}
            subtitle="Delegated clinical access settings"
            subtitleStyle={styles.cardSub}
            left={(props) => (
              <Avatar.Icon {...props} icon="account-group" color={COLORS.onAccent} style={{ backgroundColor: COLORS.amber }} />
            )}
          />
          <Card.Content>
            {caregivers.length === 0 ? (
              <Text style={styles.emptyText}>No caregiver links registered yet.</Text>
            ) : (
              caregivers.map((link: any) => (
                <View key={link.id} style={styles.linkItem}>
                  <View style={styles.linkHeader}>
                    <Text style={styles.linkName}>{link.caregiver?.fullName || link.caregiverName || 'Caregiver'}</Text>
                    <Chip compact style={styles.accessChip} textStyle={styles.chipText}>
                      Access: {link.permissions ? link.permissions.join(', ') : link.accessLevel || 'General'}
                    </Chip>
                  </View>
                  <Text style={styles.linkDetail}>Email: {link.caregiver?.email || 'N/A'}</Text>
                  <Text style={styles.linkDetail}>Phone: {link.caregiver?.phone || 'N/A'}</Text>
                </View>
              ))
            )}
          </Card.Content>
        </Card>

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
  center: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerTitle: {
    color: COLORS.textDark,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textBody,
    marginBottom: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  cardTitle: {
    color: COLORS.textDark,
    fontWeight: '700',
    fontSize: 16,
  },
  cardSub: {
    color: COLORS.textBody,
    fontSize: 12,
  },
  emptyText: {
    color: COLORS.textBody,
    textAlign: 'center',
    marginVertical: 16,
    fontStyle: 'italic',
  },
  linkItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.inputBorder,
    paddingVertical: 14,
  },
  linkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  linkName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  accessChip: {
    backgroundColor: COLORS.amberLight,
  },
  chipText: {
    color: COLORS.amber,
    fontWeight: 'bold',
    fontSize: 11,
  },
  linkDetail: {
    fontSize: 12,
    color: COLORS.textBody,
    marginTop: 2,
  },
}));

