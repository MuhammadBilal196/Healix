import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import React from 'react';
import { StyleSheet, ScrollView, View, StatusBar } from 'react-native';
import { Avatar, Card, Button, Text } from 'react-native-paper';
import { navigate } from '../../utils/navigation';
import { ThemeToggleButton } from '../../components/common/AppearanceSettings';
import { SPACING, RADIUS } from '../../theme';

/**
 * Role Selection Screen.
 * Guides new users to Patient or Nurse registration or Invitation acceptance.
 */
export default function RoleSelectScreen() {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const handleSelectRole = (role: 'PATIENT' | 'NURSE') => {
    navigate('/auth/register', { role });
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.hero}>
        <View style={styles.heroTopRow}>
          <Text style={styles.eyebrow}>CREATE ACCOUNT</Text>
          <ThemeToggleButton compact inverse />
        </View>
        <Text style={styles.header}>Join Healix As</Text>
        <Text style={styles.subtitle}>Select your registration pathway below</Text>
      </View>

      <View style={styles.body}>
        <Card style={[styles.card, { borderLeftColor: COLORS.navy }]} onPress={() => handleSelectRole('PATIENT')}>
          <Card.Title
            title="Patient / Caregiver"
            titleStyle={styles.cardTitle}
            subtitle="Book home nursing visits, view prescriptions & track vitals"
            subtitleNumberOfLines={2}
            subtitleStyle={styles.cardSub}
            left={(props) => <Avatar.Icon {...props} icon="account-heart" color={COLORS.navy} style={{ backgroundColor: COLORS.blueLight }} />}
          />
        </Card>

        <Card style={[styles.card, { borderLeftColor: COLORS.emerald }]} onPress={() => handleSelectRole('NURSE')}>
          <Card.Title
            title="Registered Nurse (PNC)"
            titleStyle={styles.cardTitle}
            subtitle="Provide home visits, record vitals & bid in the care marketplace"
            subtitleNumberOfLines={2}
            subtitleStyle={styles.cardSub}
            left={(props) => <Avatar.Icon {...props} icon="medical-bag" color={COLORS.emerald} style={{ backgroundColor: COLORS.emeraldLight }} />}
          />
        </Card>

        <Card style={[styles.card, { borderLeftColor: COLORS.purple }]} onPress={() => navigate('/auth/invited')}>
          <Card.Title
            title="Invited Clinician or Admin"
            titleStyle={styles.cardTitle}
            subtitle="Activate a Doctor, Paramedic, or Admin account using a 7-day token"
            subtitleNumberOfLines={2}
            subtitleStyle={styles.cardSub}
            left={(props) => <Avatar.Icon {...props} icon="key-variant" color={COLORS.purple} style={{ backgroundColor: COLORS.purpleLight }} />}
          />
        </Card>

        <Button
          mode="text"
          onPress={() => navigate('/auth/login')}
          textColor={COLORS.primaryText}
          style={styles.backButton}
        >
          ‹ Back to Sign In
        </Button>
      </View>
    </ScrollView>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.surface },
  container: { flexGrow: 1, backgroundColor: COLORS.surface },
  hero: {
    backgroundColor: COLORS.navyDark,
    paddingTop: 40,
    paddingBottom: 34,
    paddingHorizontal: SPACING.xl,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  eyebrow: { color: COLORS.accentBlue, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  header: { fontSize: 26, fontWeight: '800', color: COLORS.headerText, marginTop: 4 },
  subtitle: { fontSize: 13.5, color: COLORS.inverseMuted, marginTop: 4 },
  body: { padding: SPACING.lg, marginTop: 8 },
  card: {
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderLeftWidth: 4,
    paddingVertical: 6,
  },
  cardTitle: { color: COLORS.textDark, fontWeight: '700', fontSize: 15.5 },
  cardSub: { color: COLORS.textBody, fontSize: 12.5 },
  backButton: { marginTop: 12 },
});
