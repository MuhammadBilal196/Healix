import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView, StatusBar, TextInput, Platform } from 'react-native';
import { Card, Button } from 'react-native-paper';
import { navigate } from '../../utils/navigation';
import { useAdminConfig, useUpdateAdminConfig } from '../../hooks/useAdmin';
import { SPACING, RADIUS } from '../../theme';

const KNOWN_DESCRIPTIONS: Record<string, string> = {
  platform_fee_pct: 'Marketplace platform transaction commission (%)',
  escalation_sla_max_minutes: 'Doctor escalation response SLA limit (5 - 20 mins)',
  PLATFORM_COMMISSION_FEE: 'Legacy marketplace platform transaction fee (%)',
  SLA_RESPONSE_TIMEOUT_MINS: 'Doctor escalation response SLA limit (mins)',
  GEOFENCE_RADIUS_METERS: 'Nurse GPS check-in proximity radius (meters)',
  HIPAA_ENCRYPTION_MODE: 'Real-time message payload encryption',
};

export default function AdminConfig() {
  const { dark: isDarkTheme } = useAppTheme();
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const { data: configs = [], isLoading } = useAdminConfig();
  const { mutateAsync: updateConfig, isPending } = useUpdateAdminConfig();

  const [editState, setEditState] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (configs && Array.isArray(configs)) {
      const initialState: Record<string, string> = {};
      configs.forEach((c: any) => {
        initialState[c.key] = String(c.value ?? '');
      });
      setEditState(initialState);
    }
  }, [configs]);

  const mergedConfigs = useMemo(() => {
    const dbKeys = Array.isArray(configs) ? configs.map((c: any) => c.key) : [];
    const orderedKeys = Array.from(new Set([
      'platform_fee_pct',
      'escalation_sla_max_minutes',
      ...dbKeys,
    ]));
    return orderedKeys.map((key) => ({
      key,
      description: KNOWN_DESCRIPTIONS[key] || (key.startsWith('feature_flag_') ? 'Dynamic feature flag setting' : 'Platform configuration parameter'),
    }));
  }, [configs]);

  const handleSave = async (key: string) => {
    const val = (editState[key] ?? '').trim();
    if (!val) {
      const msg = 'Configuration value cannot be empty.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Validation Error', msg);
      return;
    }
    try {
      await updateConfig({ key, value: val });
      const msg = `${key} updated successfully`;
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Success', msg);
    } catch (error: any) {
      const msg = error.message || 'Failed to update config';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Error', msg);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigate('/admin')} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Back to Command Center</Text>
          </TouchableOpacity>
          <Text style={styles.title}>System Parameters</Text>
          <Text style={styles.subtitle}>Configure SLA timers, platform fees, and feature flags</Text>
          <Button
            mode="outlined"
            textColor={COLORS.navy}
            style={{ borderColor: COLORS.navy, marginTop: 12, borderRadius: RADIUS.md, alignSelf: 'flex-start' }}
            onPress={() => navigate('/admin/audit')}
          >
            View System Audit Logs ›
          </Button>
        </View>

        <Text style={styles.sectionLabel}>Active System Parameters</Text>

        {isLoading ? (
          <ActivityIndicator color={COLORS.navy} size="large" style={{ marginTop: 20 }} />
        ) : (
          mergedConfigs.map((cfg) => (
            <Card key={cfg.key} style={styles.card}>
              <Card.Content>
                <View style={styles.configHeader}>
                  <Text style={styles.configKey}>{cfg.key}</Text>
                </View>
                <Text style={styles.configDesc}>{cfg.description}</Text>

                <View style={styles.editRow}>
                  <TextInput
                    style={styles.input}
                    value={editState[cfg.key] ?? ''}
                    onChangeText={(text) => setEditState(prev => ({ ...prev, [cfg.key]: text }))}
                    placeholder="Enter value"
                    placeholderTextColor={COLORS.textMuted}
                  />
                  <Button
                    mode="contained"
                    buttonColor={COLORS.navy}
                    textColor={COLORS.onAccent}
                    disabled={isPending}
                    onPress={() => void handleSave(cfg.key)}
                    style={styles.saveBtn}
                    labelStyle={{ fontWeight: '700', fontSize: 12 }}
                  >
                    Save
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.surface },
  container: { flex: 1, backgroundColor: COLORS.surface },
  content: { padding: SPACING.lg, paddingBottom: 40 },
  header: { marginBottom: 16 },
  backBtn: { marginBottom: 8 },
  backText: { color: COLORS.navy, fontSize: 13, fontWeight: '700' },
  title: { color: COLORS.textDark, fontSize: 22, fontWeight: '800' },
  subtitle: { color: COLORS.textBody, fontSize: 12.5, marginTop: 4 },
  sectionLabel: { color: COLORS.navy, fontSize: 15, fontWeight: '700', marginBottom: 12, marginTop: 8 },
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    marginBottom: 12,
  },
  configHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  configKey: { color: COLORS.textDark, fontSize: 13.5, fontWeight: '700' },
  configDesc: { color: COLORS.textBody, fontSize: 12, marginTop: 4, marginBottom: 12 },
  editRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: COLORS.surfaceMuted,
    color: COLORS.textDark,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    fontSize: 13.5,
  },
  saveBtn: { borderRadius: RADIUS.md, justifyContent: 'center' },
});
