
import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../theme';

interface VitalsData {
  systolic: number;
  diastolic: number;
  heartRate: number;
  temperature: number;
  oxygenSaturation: number;
  bloodSugar?: number;
}

interface VitalsEntryFormProps {
  onSubmit: (vitals: VitalsData) => Promise<void>;
  isLoading?: boolean;
}

export const VitalsEntryForm: React.FC<VitalsEntryFormProps> = ({ onSubmit, isLoading = false }) => {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [temperature, setTemperature] = useState('');
  const [spO2, setSpO2] = useState('');
  const [bloodSugar, setBloodSugar] = useState('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = (): boolean => {
    const errs: { [key: string]: string } = {};

    const sys = Number(systolic);
    if (!sys || sys < 60 || sys > 250) errs.systolic = 'Systolic BP (60-250 mmHg)';

    const dia = Number(diastolic);
    if (!dia || dia < 40 || dia > 150) errs.diastolic = 'Diastolic BP (40-150 mmHg)';

    const hr = Number(heartRate);
    if (!hr || hr < 30 || hr > 220) errs.heartRate = 'Heart Rate (30-220 bpm)';

    const temp = Number(temperature);
    if (!temp || temp < 34.0 || temp > 42.0) errs.temperature = 'Temp (34.0 - 42.0 °C)';

    const spo = Number(spO2);
    if (!spo || spo < 50 || spo > 100) errs.spO2 = 'SpO2 (50-100%)';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    await onSubmit({
      systolic: Number(systolic),
      diastolic: Number(diastolic),
      heartRate: Number(heartRate),
      temperature: Number(temperature),
      oxygenSaturation: Number(spO2),
      bloodSugar: bloodSugar ? Number(bloodSugar) : undefined,
    });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Log Patient Vitals (Feature 3.7)</Text>

      <View style={styles.grid}>
        {/* Systolic BP */}
        <View style={styles.fieldCol}>
          <Text style={styles.label}>Systolic BP (mmHg)</Text>
          <TextInput
            style={[styles.input, errors.systolic && styles.inputError]}
            placeholder="e.g. 120"
            placeholderTextColor={COLORS.textBody}
            keyboardType="numeric"
            value={systolic}
            onChangeText={setSystolic}
          />
          {errors.systolic && <Text style={styles.errText}>{errors.systolic}</Text>}
        </View>

        {/* Diastolic BP */}
        <View style={styles.fieldCol}>
          <Text style={styles.label}>Diastolic BP (mmHg)</Text>
          <TextInput
            style={[styles.input, errors.diastolic && styles.inputError]}
            placeholder="e.g. 80"
            placeholderTextColor={COLORS.textBody}
            keyboardType="numeric"
            value={diastolic}
            onChangeText={setDiastolic}
          />
          {errors.diastolic && <Text style={styles.errText}>{errors.diastolic}</Text>}
        </View>

        {/* Heart Rate */}
        <View style={styles.fieldCol}>
          <Text style={styles.label}>Heart Rate (bpm)</Text>
          <TextInput
            style={[styles.input, errors.heartRate && styles.inputError]}
            placeholder="e.g. 72"
            placeholderTextColor={COLORS.textBody}
            keyboardType="numeric"
            value={heartRate}
            onChangeText={setHeartRate}
          />
          {errors.heartRate && <Text style={styles.errText}>{errors.heartRate}</Text>}
        </View>

        {/* Temperature */}
        <View style={styles.fieldCol}>
          <Text style={styles.label}>Temperature (°C)</Text>
          <TextInput
            style={[styles.input, errors.temperature && styles.inputError]}
            placeholder="e.g. 36.8"
            placeholderTextColor={COLORS.textBody}
            keyboardType="numeric"
            value={temperature}
            onChangeText={setTemperature}
          />
          {errors.temperature && <Text style={styles.errText}>{errors.temperature}</Text>}
        </View>

        {/* SpO2 */}
        <View style={styles.fieldCol}>
          <Text style={styles.label}>Oxygen Saturation (%)</Text>
          <TextInput
            style={[styles.input, errors.spO2 && styles.inputError]}
            placeholder="e.g. 98"
            placeholderTextColor={COLORS.textBody}
            keyboardType="numeric"
            value={spO2}
            onChangeText={setSpO2}
          />
          {errors.spO2 && <Text style={styles.errText}>{errors.spO2}</Text>}
        </View>

        {/* Blood Sugar */}
        <View style={styles.fieldCol}>
          <Text style={styles.label}>Blood Sugar (mg/dL)</Text>
          <TextInput
            style={styles.input}
            placeholder="Optional e.g. 110"
            placeholderTextColor={COLORS.textBody}
            keyboardType="numeric"
            value={bloodSugar}
            onChangeText={setBloodSugar}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, isLoading && styles.disabledBtn]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? <ActivityIndicator size="small" color={COLORS.onAccent} /> : <Text style={styles.submitBtnText}>Save & Log Vitals</Text>}
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  title: {
    color: COLORS.textDark,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  fieldCol: {
    width: '47%',
  },
  label: {
    color: COLORS.textBody,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    color: COLORS.textDark,
    fontSize: 12,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  inputError: {
    borderColor: COLORS.red,
  },
  errText: {
    color: COLORS.red,
    fontSize: 9,
    marginTop: 2,
  },
  submitBtn: {
    backgroundColor: COLORS.emeraldFill,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: COLORS.onAccent,
    fontSize: 12,
    fontWeight: '700',
  },
}));
