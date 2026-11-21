import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import React, { useState } from 'react';
import { StyleSheet, View, Modal, TouchableOpacity, TextInput } from 'react-native';
import { Text } from 'react-native-paper';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../theme';

interface AddAllergyModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (allergen: string, severity: 'MILD' | 'MODERATE' | 'SEVERE') => Promise<void>;
  isLoading?: boolean;
}

export const AddAllergyModal: React.FC<AddAllergyModalProps> = ({
  visible,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const [allergen, setAllergen] = useState('');
  const [severity, setSeverity] = useState<'MILD' | 'MODERATE' | 'SEVERE'>('MILD');

  const [formError, setFormError] = useState('');
  const handleSubmit = async () => {
    if (!allergen.trim()) return;
    setFormError('');
    try { await onSubmit(allergen, severity);
    setAllergen('');
    setSeverity('MILD');
    onClose();
    } catch(e: any) { setFormError(e.message || 'Could not save. Please try again.'); }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {!!formError && <Text accessibilityRole="alert" style={{color:COLORS.red}}>{formError}</Text>}<Text style={styles.title}>Add Allergy</Text>
          <Text style={styles.sub}>Enter allergen name and select severity level:</Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. Penicillin, Peanuts"
            placeholderTextColor={COLORS.textBody}
            value={allergen}
            onChangeText={setAllergen}
          />

          <Text style={styles.label}>Severity Level:</Text>
          <View style={styles.severityRow}>
            {(['MILD', 'MODERATE', 'SEVERE'] as const).map(sev => (
              <TouchableOpacity
                key={sev}
                style={[
                  styles.sevPill,
                  severity === sev && styles.sevPillActive,
                ]}
                onPress={() => setSeverity(sev)}
              >
                <Text style={[styles.sevText, severity === sev && styles.sevTextActive]}>
                  {sev}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isLoading}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmBtn, !allergen.trim() && styles.disabledBtn]}
              onPress={handleSubmit}
              disabled={!allergen.trim() || isLoading}
            >
              <Text style={styles.confirmBtnText}>{isLoading ? 'Saving...' : 'Add Allergy'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.modalBackdrop,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  title: {
    color: COLORS.textDark,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '700',
    marginBottom: 4,
  },
  sub: {
    color: COLORS.textBody,
    fontSize: 11,
    marginBottom: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    color: COLORS.textDark,
    fontSize: 12,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    marginBottom: SPACING.md,
  },
  label: {
    color: COLORS.textBody,
    fontSize: 11,
    marginBottom: SPACING.xs,
  },
  severityRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  sevPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  sevPillActive: {
    backgroundColor: COLORS.emerald,
    borderColor: COLORS.emerald,
  },
  sevText: {
    color: COLORS.textBody,
    fontSize: 11,
    fontWeight: '600',
  },
  sevTextActive: {
    color: COLORS.onAccent,
    fontWeight: '700',
  },
  btnRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: COLORS.glassSurface,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: COLORS.textBody,
    fontSize: 11,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: COLORS.emeraldFill,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  confirmBtnText: {
    color: COLORS.onAccent,
    fontSize: 11,
    fontWeight: '700',
  },
}));
