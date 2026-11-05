
import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView, StatusBar, TextInput } from 'react-native';
import { Card, Button } from 'react-native-paper';
import { navigate } from '../../utils/navigation';
import { useAdminConfig, useUpdateAdminConfig } from '../../hooks/useAdmin';
import { SPACING, RADIUS } from '../../theme';

export default function AdminConfig() {
  const { dark: isDarkTheme } = useAppTheme();

  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const { data: configs = [], isLoading } = useAdminConfig();
  const { mutateAsync: updateConfig } = useUpdateAdminConfig();

  const [editState, setEditState] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (configs && Array.isArray(configs)) {
      const initialState: any = {};
      configs.forEach((c: any) => {
        initialState[c.key] = c.value;
      });
      setEditState(initialState);
    }
  }, [configs]);

  const handleSave = async (key: string) => {
    try {
      await updateConfig({ key, value: editState[key] });
      Alert.alert('Success', 'Configuration updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update config');
    }
  };

  const defaultConfigs = [
    { key: 'platform_fee_pct', description: 'Marketplace platform transaction fee (%)' },
    { key: 'escalation_sla_max_minutes', description: 'Doctor escalation response SLA limit (5 - 20 Mins)' },
    { key: 'PLATFORM_COMMISSION_FEE', description: 'Legacy marketplace platform transaction fee (%)' },
    { key: 'SLA_RESPONSE_TIMEOUT_MINS', description: 'Doctor escalation response SLA limit (Mins)' },
    { key: 'GEOFENCE_RADIUS_METERS', description: 'Nurse GPS check-in proximity radius (Meters)' },
    { key: 'HIPAA_ENCRYPTION_MODE', description: 'Real-time message payload encryption' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} backgroundColor={COLORS.bg} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigate('/admin')} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Back to Command Center</Text>
          </TouchableOpacity>
          <Text style={styles.title}>System Parameters</Text>
          <Text style={styles.subtitle}>Configure SLA parameters and platform settings</Text>
          <Button
            mode="outlined"
            textColor={COLORS.emerald}
            style={{ borderColor: COLORS.emerald, marginTop: 12, borderRadius: RADIUS.md, alignSelf: 'flex-start' }}
            onPress={() => navigate('/admin/audit')}
          >
            View System Audit Logs ›
          </Button>
        </View>

        <Text style={styles.sectionLabel}>Active System Parameters</Text>
        
        {isLoading ? (
          <ActivityIndicator color={COLORS.emerald} size="large" style={{ marginTop: 20 }} />
        ) : (
          defaultConfigs.map((cfg) => (
            <Card key={cfg.key} style={styles.card}>
              <Card.Content>
                <View style={styles.configHeader}>
                  <Text style={styles.configKey}>{cfg.key}</Text>
                </View>
                <Text style={styles.configDesc}>{cfg.description}</Text>
                
                <View style={styles.editRow}>
                  <TextInput
                    style={styles.input}
                    value={editState[cfg.key] || ''}
                    onChangeText={(text) => setEditState(prev => ({ ...prev, [cfg.key]: text }))}
                    placeholder="Enter value"
                    placeholderTextColor={COLORS.textBody}
                  />
                  <Button
                    mode="contained"
                    buttonColor={COLORS.emeraldFill}
                    textColor={COLORS.textMuted}
                    onPress={() => handleSave(cfg.key)}
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

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: SPACING.lg, paddingBottom: 40 },
  header: { marginBottom: 20 },
  backBtn: { marginBottom: 8 },
  backText: { color: COLORS.emerald, fontSize: 13, fontWeight: '700' },
  title: { color: COLORS.textDark, fontSize: 20, fontWeight: '800' },
  subtitle: { color: COLORS.textBody, fontSize: 12, marginTop: 4 },
  sectionLabel: { color: COLORS.emerald, fontSize: 15, fontWeight: '700', marginBottom: 12, marginTop: 12 },
  card: { backgroundColor: COLORS.bg, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.emeraldLight, marginBottom: 12 },
  configHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  configKey: { color: COLORS.textDark, fontSize: 13, fontWeight: '700' },
  configDesc: { color: COLORS.textBody, fontSize: 11, marginTop: 4, marginBottom: 12 },
  editRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  input: { flex: 1, backgroundColor: COLORS.bg, color: COLORS.textDark, borderWidth: 1, borderColor: COLORS.emeraldLight, paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.md, fontSize: 13 },
  saveBtn: { borderRadius: RADIUS.md, justifyContent: 'center' }
}));
