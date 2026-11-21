
import { useAppTheme, useThemeValue } from '../../../theme/ThemeProvider';
import type { ThemeColors } from '../../../theme';
import React, { useState } from 'react';
import { appAlert } from '../../common/AppDialogs';
import { View, StyleSheet, TextInput, Alert, TouchableOpacity, Platform } from 'react-native';
import { Text, Button, Card, Divider } from 'react-native-paper';
import { useSubmitSymptoms } from '../../../hooks/useVisits';
import { SymptomSeverity, VisitSymptom } from '../../../types/visit';
import { RADIUS, SPACING } from '../../../theme';

interface SymptomsFormProps {
  visitId: string;
  onSuccess: () => void;
  existingSymptoms?: VisitSymptom[];
}

interface SymptomEntry {
  symptomName: string;
  severity: SymptomSeverity;
  notes: string;
}

const SEVERITY_OPTIONS: SymptomSeverity[] = ['MILD', 'MODERATE', 'SEVERE'];
const createSEVERITY_COLORS =  (COLORS: ThemeColors) : Record<SymptomSeverity, string> => ({
  MILD: COLORS.amber,
  MODERATE: COLORS.red,
  SEVERE: COLORS.red,
});

const emptySymptom = (): SymptomEntry => ({ symptomName: '', severity: 'MILD', notes: '' });

export const SymptomsForm: React.FC<SymptomsFormProps> = ({ visitId, onSuccess, existingSymptoms }) => {
  const { colors: COLORS } = useAppTheme();
  const SEVERITY_COLORS = useThemeValue(createSEVERITY_COLORS);
  const styles = useThemeValue(createStyles);

  const [symptoms, setSymptoms] = useState<SymptomEntry[]>(
    existingSymptoms && existingSymptoms.length > 0
      ? existingSymptoms.map((s) => ({ symptomName: s.symptomName, severity: s.severity, notes: s.notes || '' }))
      : [emptySymptom()]
  );
  const [error, setError] = useState('');
  const submitSymptoms = useSubmitSymptoms();

  const updateSymptom = (idx: number, updates: Partial<SymptomEntry>) => {
    setSymptoms((prev) => prev.map((s, i) => (i === idx ? { ...s, ...updates } : s)));
  };

  const addSymptom = () => setSymptoms((prev) => [...prev, emptySymptom()]);

  const removeSymptom = (idx: number) => {
    if (symptoms.length <= 1) return;
    setSymptoms((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    const valid = symptoms.filter((s) => s.symptomName.trim().length > 0);
    if (valid.length === 0) {
      setError('At least one symptom must be entered.');
      return;
    }
    setError('');

    try {
      const result = await submitSymptoms.mutateAsync({
        visitId,
        data: {
          symptoms: valid.map((s) => ({
            symptomName: s.symptomName.trim(),
            severity: s.severity,
            notes: s.notes || undefined,
          })),
        },
      });
      onSuccess();
      appAlert(result.queued ? 'Symptoms saved as a draft' : 'Symptoms saved', result.queued ? 'Not yet delivered. Open Offline drafts to retry. Sync before finishing the visit.' : 'The observation has been saved to the visit.');
    } catch (err: any) {
      appAlert('Could not save observation', err.message || 'Please try again.');
    }
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.title}>📋 Symptoms Checklist</Text>
        <Divider style={styles.divider} />
        {symptoms.map((symptom, idx) => (
          <View key={idx} style={styles.symptomBlock}>
            <View style={styles.symptomHeader}>
              <Text style={styles.symptomLabel}>Symptom #{idx + 1}</Text>
              {symptoms.length > 1 && (
                <TouchableOpacity onPress={() => removeSymptom(idx)}>
                  <Text style={styles.removeBtn}>✕ Remove</Text>
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Symptom name (e.g., Headache)"
              placeholderTextColor={COLORS.textBody}
              value={symptom.symptomName}
              onChangeText={(v) => updateSymptom(idx, { symptomName: v })}
            />
            <View style={styles.severityRow}>
              {SEVERITY_OPTIONS.map((sev) => (
                <TouchableOpacity
                  key={sev}
                  style={[styles.severityBtn, symptom.severity === sev && { backgroundColor: SEVERITY_COLORS[sev] + '33', borderColor: SEVERITY_COLORS[sev] }]}
                  onPress={() => updateSymptom(idx, { severity: sev })}
                >
                  <Text style={[styles.severityText, symptom.severity === sev && { color: SEVERITY_COLORS[sev] }]}>{sev}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[styles.input, { minHeight: 40 }]}
              placeholder="Notes (optional)"
              placeholderTextColor={COLORS.textBody}
              value={symptom.notes}
              onChangeText={(v) => updateSymptom(idx, { notes: v })}
            />
          </View>
        ))}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Button mode="text" textColor={COLORS.emerald} onPress={addSymptom} labelStyle={{ fontWeight: '600' }}>
          + Add Another Symptom
        </Button>
        <Button
          mode="contained"
          buttonColor={COLORS.emeraldFill}
          textColor={COLORS.onAccent}
          onPress={handleSubmit}
          loading={submitSymptoms.isPending}
          disabled={submitSymptoms.isPending}
          style={{ marginTop: 8, borderRadius: RADIUS.md }}
          labelStyle={{ fontWeight: '700' }}
        >
          Submit Symptoms
        </Button>
      </Card.Content>
    </Card>
  );
};

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  card: { backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.inputBorder, marginBottom: SPACING.lg },
  title: { color: COLORS.textDark, fontSize: 16, fontWeight: '700' },
  divider: { backgroundColor: COLORS.dividerLight, marginVertical: 12 },
  symptomBlock: { marginBottom: 16, padding: 12, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.inputBorder },
  symptomHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  symptomLabel: { color: COLORS.emerald, fontSize: 12, fontWeight: '700' },
  removeBtn: { color: COLORS.red, fontSize: 12, fontWeight: '600' },
  input: { backgroundColor: COLORS.surfaceCard, color: COLORS.textDark, borderWidth: 1, borderColor: COLORS.inputBorder, padding: 10, borderRadius: RADIUS.sm, fontSize: 13, marginBottom: 8 },
  severityRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  severityBtn: { flex: 1, paddingVertical: 6, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.inputBorder, alignItems: 'center' },
  severityText: { fontSize: 11, fontWeight: '700', color: COLORS.textBody },
  errorText: { color: COLORS.red, fontSize: 12, marginBottom: 8 },
}));

