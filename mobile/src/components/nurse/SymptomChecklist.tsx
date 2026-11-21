
import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../theme';

interface SymptomOption {
  name: string;
  bodySystem: string;
}

const PREDEFINED_SYMPTOMS: SymptomOption[] = [
  { name: 'Chest Pain', bodySystem: 'CARDIOVASCULAR' },
  { name: 'Palpitations', bodySystem: 'CARDIOVASCULAR' },
  { name: 'Shortness of Breath', bodySystem: 'RESPIRATORY' },
  { name: 'Cough', bodySystem: 'RESPIRATORY' },
  { name: 'Headache', bodySystem: 'NEUROLOGICAL' },
  { name: 'Dizziness', bodySystem: 'NEUROLOGICAL' },
  { name: 'Fever', bodySystem: 'GENERAL' },
  { name: 'Fatigue', bodySystem: 'GENERAL' },
  { name: 'Nausea', bodySystem: 'GASTROINTESTINAL' },
];

interface SelectedSymptom {
  symptomName: string;
  bodySystem: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE';
}

interface SymptomChecklistProps {
  onSubmit: (symptoms: SelectedSymptom[]) => Promise<void>;
  isLoading?: boolean;
}

export const SymptomChecklist: React.FC<SymptomChecklistProps> = ({ onSubmit, isLoading = false }) => {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const [selectedMap, setSelectedMap] = useState<{ [key: string]: 'MILD' | 'MODERATE' | 'SEVERE' }>({});

  const toggleSymptom = (name: string) => {
    setSelectedMap(prev => {
      const copy = { ...prev };
      if (copy[name]) {
        delete copy[name];
      } else {
        copy[name] = 'MILD';
      }
      return copy;
    });
  };

  const setSeverity = (name: string, severity: 'MILD' | 'MODERATE' | 'SEVERE') => {
    setSelectedMap(prev => ({ ...prev, [name]: severity }));
  };

  const handleSubmit = async () => {
    const symptoms: SelectedSymptom[] = Object.keys(selectedMap).map(name => {
      const item = PREDEFINED_SYMPTOMS.find(s => s.name === name);
      return {
        symptomName: name,
        bodySystem: item?.bodySystem || 'GENERAL',
        severity: selectedMap[name],
      };
    });

    await onSubmit(symptoms);
  };

  const selectedCount = Object.keys(selectedMap).length;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Symptom Checklist (Feature 3.7)</Text>
      <Text style={styles.subText}>Select observed patient symptoms and severity level:</Text>

      <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>
        {PREDEFINED_SYMPTOMS.map(sym => {
          const isSelected = !!selectedMap[sym.name];
          const currentSev = selectedMap[sym.name] || 'MILD';

          return (
            <View key={sym.name} style={styles.itemRow}>
              <TouchableOpacity
                style={styles.checkboxGroup}
                onPress={() => toggleSymptom(sym.name)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                  {isSelected && <Text style={styles.checkMark}>✓</Text>}
                </View>
                <View>
                  <Text style={styles.symName}>{sym.name}</Text>
                  <Text style={styles.sysTag}>{sym.bodySystem}</Text>
                </View>
              </TouchableOpacity>

              {isSelected && (
                <View style={styles.severityPicker}>
                  {(['MILD', 'MODERATE', 'SEVERE'] as const).map(sev => (
                    <TouchableOpacity
                      key={sev}
                      style={[
                        styles.sevChip,
                        currentSev === sev && styles.sevChipActive,
                      ]}
                      onPress={() => setSeverity(sym.name, sev)}
                    >
                      <Text style={[styles.sevText, currentSev === sev && styles.sevTextActive]}>
                        {sev[0]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        style={[styles.submitBtn, (selectedCount === 0 || isLoading) && styles.disabledBtn]}
        onPress={handleSubmit}
        disabled={selectedCount === 0 || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={COLORS.onAccent} />
        ) : (
          <Text style={styles.submitBtnText}>
            Submit Symptoms ({selectedCount} Selected)
          </Text>
        )}
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
    marginBottom: 2,
  },
  subText: {
    color: COLORS.textBody,
    fontSize: 11,
    marginBottom: SPACING.md,
  },
  listScroll: {
    maxHeight: 280,
    marginBottom: SPACING.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.dividerLight,
  },
  checkboxGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    marginRight: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: COLORS.emerald,
    borderColor: COLORS.emerald,
  },
  checkMark: {
    color: COLORS.onAccent,
    fontSize: 12,
    fontWeight: '800',
  },
  symName: {
    color: COLORS.textDark,
    fontSize: 12,
    fontWeight: '600',
  },
  sysTag: {
    color: COLORS.textBody,
    fontSize: 9,
  },
  severityPicker: {
    flexDirection: 'row',
    gap: 4,
  },
  sevChip: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  sevChipActive: {
    backgroundColor: COLORS.emerald,
    borderColor: COLORS.emerald,
  },
  sevText: {
    color: COLORS.textBody,
    fontSize: 10,
    fontWeight: '700',
  },
  sevTextActive: {
    color: COLORS.onAccent,
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
