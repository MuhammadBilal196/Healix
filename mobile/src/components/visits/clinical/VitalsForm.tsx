
import { useAppTheme, useThemeValue } from '../../../theme/ThemeProvider';
import type { ThemeColors } from '../../../theme';
import React, { useState } from 'react';
import { appAlert } from '../../common/AppDialogs';
import { View, StyleSheet, TextInput, Alert, Platform } from 'react-native';
import { Text, Button, Card, Divider } from 'react-native-paper';
import { useSubmitVitals } from '../../../hooks/useVisits';
import { vitalsSchema, VitalsRecord } from '../../../types/visit';
import { RADIUS, SPACING } from '../../../theme';

interface VitalsFormProps {
  visitId: string;
  onSuccess: () => void;
  existingVitals?: VitalsRecord[];
}

const FIELDS = [
  { key: 'systolic', label: 'Systolic BP', unit: 'mmHg', placeholder: '120' },
  { key: 'diastolic', label: 'Diastolic BP', unit: 'mmHg', placeholder: '80' },
  { key: 'heartRate', label: 'Heart Rate', unit: 'bpm', placeholder: '72' },
  { key: 'temperature', label: 'Temperature', unit: '°C', placeholder: '36.6' },
  { key: 'oxygenSaturation', label: 'SpO2', unit: '%', placeholder: '98' },
  { key: 'bloodSugar', label: 'Blood Sugar (optional)', unit: 'mg/dL', placeholder: '' },
] as const;

type VitalsForm = { [K in typeof FIELDS[number]['key']]: string };

export const VitalsForm: React.FC<VitalsFormProps> = ({ visitId, onSuccess, existingVitals }) => {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const latest = existingVitals?.[0];
  const [form, setForm] = useState<VitalsForm>({
    systolic: latest?.systolic?.toString() || '',
    diastolic: latest?.diastolic?.toString() || '',
    heartRate: latest?.heartRate?.toString() || '',
    temperature: latest?.temperature?.toString() || '',
    oxygenSaturation: latest?.oxygenSaturation?.toString() || '',
    bloodSugar: latest?.bloodSugar?.toString() || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submitVitals = useSubmitVitals();

  const handleSubmit = async () => {
    const parsed = {
      systolic: Number(form.systolic),
      diastolic: Number(form.diastolic),
      heartRate: Number(form.heartRate),
      temperature: Number(form.temperature),
      oxygenSaturation: Number(form.oxygenSaturation),
      bloodSugar: form.bloodSugar ? Number(form.bloodSugar) : undefined,
    };

    const result = vitalsSchema.safeParse(parsed);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        const field = e.path[0]?.toString();
        if (field) fieldErrors[field] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    try {
      const saved = await submitVitals.mutateAsync({ visitId, data: result.data });
      onSuccess();
      appAlert(saved.queued ? 'Vitals saved as a draft' : 'Vitals saved', saved.queued ? 'Not yet delivered. Open Offline drafts to retry. Sync before finishing the visit.' : 'The observation has been saved to the visit.');
    } catch (err: any) {
      appAlert('Could not save observation', err.message || 'Please try again.');
    }
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.title}>Record Vitals</Text>
        <Divider style={styles.divider} />
        {FIELDS.map((f) => (
          <View key={f.key} style={styles.fieldRow}>
            <Text style={styles.label}>{f.label} <Text style={styles.unit}>({f.unit})</Text></Text>
            <TextInput
              style={[styles.input, errors[f.key] ? styles.inputError : null]}
              value={form[f.key]}
              onChangeText={(v) => setForm((prev) => ({ ...prev, [f.key]: v }))}
              keyboardType="numeric"
              placeholder={f.placeholder}
              placeholderTextColor={COLORS.textBody}
            />
            {errors[f.key] && <Text style={styles.errorText}>{errors[f.key]}</Text>}
          </View>
        ))}
        <Button
          mode="contained"
          buttonColor={COLORS.primaryText}
          textColor={COLORS.onAccent}
          onPress={handleSubmit}
          loading={submitVitals.isPending}
          disabled={submitVitals.isPending}
          style={{ marginTop: 8, borderRadius: RADIUS.md }}
          labelStyle={{ fontWeight: '700' }}
        >
          Submit Vitals
        </Button>
      </Card.Content>
    </Card>
  );
};

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  card: { backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.inputBorder, marginBottom: SPACING.lg },
  title: { color: COLORS.textDark, fontSize: 16, fontWeight: '700' },
  divider: { backgroundColor: COLORS.dividerLight, marginVertical: 12 },
  fieldRow: { marginBottom: 12 },
  label: { color: COLORS.textDark, fontSize: 13, fontWeight: '600', marginBottom: 4 },
  unit: { color: COLORS.textBody, fontWeight: '400' },
  input: { backgroundColor: COLORS.surface, color: COLORS.textDark, borderWidth: 1, borderColor: COLORS.inputBorder, padding: 10, borderRadius: RADIUS.md, fontSize: 14 },
  inputError: { borderColor: COLORS.red },
  errorText: { color: COLORS.red, fontSize: 11, marginTop: 2 },
}));


