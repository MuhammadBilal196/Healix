
import { useAppTheme, useThemeValue } from '../../../theme/ThemeProvider';
import type { ThemeColors } from '../../../theme';
import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Alert, TouchableOpacity, Platform } from 'react-native';
import { Text, Button, Card, Divider } from 'react-native-paper';
import { useSubmitClinicalRemarks } from '../../../hooks/useVisits';
import { clinicalRemarkSchema, ClinicalRemark } from '../../../types/visit';
import { RADIUS, SPACING } from '../../../theme';

interface ClinicalRemarksFormProps {
  visitId: string;
  onSuccess: () => void;
  existingRemark?: ClinicalRemark;
}

export const ClinicalRemarksForm: React.FC<ClinicalRemarksFormProps> = ({ visitId, onSuccess, existingRemark }) => {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const [remarksText, setRemarksText] = useState(existingRemark?.remarksText || '');
  const [confidenceLevel, setConfidenceLevel] = useState(existingRemark?.confidenceLevel || 3);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submitRemarks = useSubmitClinicalRemarks();

  const handleSubmit = async () => {
    const result = clinicalRemarkSchema.safeParse({ remarksText, confidenceLevel });
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
      await submitRemarks.mutateAsync({ visitId, data: result.data });
      onSuccess();
      setTimeout(() => {
        if (Platform.OS === 'web') {
          alert('✅ Remarks Saved');
        } else {
          Alert.alert('✅ Remarks Saved', 'Clinical remarks have been submitted.');
        }
      }, 100);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit clinical remarks.');
    }
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.title}>📝 Clinical Remarks</Text>
        <Divider style={styles.divider} />

        <Text style={styles.label}>Remarks</Text>
        <TextInput
          style={[styles.textArea, errors.remarksText ? styles.inputError : null]}
          placeholder="Enter your clinical observations (min 10 characters)..."
          placeholderTextColor={COLORS.textBody}
          value={remarksText}
          onChangeText={setRemarksText}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />
        {errors.remarksText && <Text style={styles.errorText}>{errors.remarksText}</Text>}

        <Text style={[styles.label, { marginTop: 12 }]}>Confidence Level</Text>
        <View style={styles.confidenceRow}>
          {[1, 2, 3, 4, 5].map((level) => (
            <TouchableOpacity
              key={level}
              style={[styles.confidenceBtn, confidenceLevel === level && styles.confidenceBtnActive]}
              onPress={() => setConfidenceLevel(level)}
            >
              <Text style={[styles.confidenceText, confidenceLevel === level && styles.confidenceTextActive]}>
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.confidenceLabelRow}>
          <Text style={styles.confidenceHelper}>Low</Text>
          <Text style={styles.confidenceHelper}>High</Text>
        </View>
        {errors.confidenceLevel && <Text style={styles.errorText}>{errors.confidenceLevel}</Text>}

        <Button
          mode="contained"
          buttonColor={COLORS.purpleFill}
          textColor={COLORS.onAccent}
          onPress={handleSubmit}
          loading={submitRemarks.isPending}
          disabled={submitRemarks.isPending}
          style={{ marginTop: 16, borderRadius: RADIUS.md }}
          labelStyle={{ fontWeight: '700' }}
        >
          Submit Remarks
        </Button>
      </Card.Content>
    </Card>
  );
};

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  card: { backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.inputBorder, marginBottom: SPACING.lg },
  title: { color: COLORS.textDark, fontSize: 16, fontWeight: '700' },
  divider: { backgroundColor: COLORS.dividerLight, marginVertical: 12 },
  label: { color: COLORS.textDark, fontSize: 13, fontWeight: '600', marginBottom: 6 },
  textArea: { backgroundColor: COLORS.surface, color: COLORS.textDark, borderWidth: 1, borderColor: COLORS.inputBorder, padding: 12, borderRadius: RADIUS.md, fontSize: 13, minHeight: 120 },
  inputError: { borderColor: COLORS.red },
  errorText: { color: COLORS.red, fontSize: 11, marginTop: 4 },
  confidenceRow: { flexDirection: 'row', gap: 8 },
  confidenceBtn: { flex: 1, paddingVertical: 10, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.inputBorder, alignItems: 'center', backgroundColor: COLORS.bg },
  confidenceBtnActive: { borderColor: COLORS.purple, backgroundColor: COLORS.purpleLight },
  confidenceText: { color: COLORS.textBody, fontSize: 14, fontWeight: '700' },
  confidenceTextActive: { color: COLORS.purple },
  confidenceLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  confidenceHelper: { color: COLORS.textBody, fontSize: 11 },
}));
