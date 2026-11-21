import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import React, { useState } from 'react';
import { StyleSheet, View, Modal, TouchableOpacity, TextInput } from 'react-native';
import { Text } from 'react-native-paper';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../theme';

interface AddMedicationModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (name: string, dosage: string, frequency: string) => Promise<void>;
  isLoading?: boolean;
}

export const AddMedicationModal: React.FC<AddMedicationModalProps> = ({ visible, onClose, onSubmit, isLoading = false }) => {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');

  const [formError, setFormError] = useState('');
  const handleSubmit = async () => {
    if (!name.trim() || !dosage.trim() || !frequency.trim()) return;
    setFormError('');
    try { await onSubmit(name, dosage, frequency);
    setName(''); setDosage(''); setFrequency('');
    onClose();
    } catch(e: any) { setFormError(e.message || 'Could not save. Please try again.'); }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {!!formError && <Text accessibilityRole="alert" style={{color:COLORS.red}}>{formError}</Text>}<Text style={styles.title}>Add Medication</Text>
          <TextInput style={styles.input} placeholder="Medication Name" placeholderTextColor={COLORS.textBody} value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Dosage (e.g. 500mg)" placeholderTextColor={COLORS.textBody} value={dosage} onChangeText={setDosage} />
          <TextInput style={styles.input} placeholder="Frequency (e.g. Twice daily)" placeholderTextColor={COLORS.textBody} value={frequency} onChangeText={setFrequency} />
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isLoading}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.confirmBtn, (!name.trim() || !dosage.trim() || !frequency.trim()) && styles.disabled]} onPress={handleSubmit} disabled={!name.trim() || !dosage.trim() || !frequency.trim() || isLoading}>
              <Text style={styles.confirmText}>{isLoading ? 'Saving...' : 'Add Medication'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  overlay: { flex: 1, backgroundColor: COLORS.modalBackdrop, justifyContent: 'center', padding: SPACING.lg },
  modal: { backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.lg, padding: SPACING.xl, borderWidth: 1, borderColor: COLORS.inputBorder },
  title: { color: COLORS.textDark, fontSize: TYPOGRAPHY.sizes.md, fontWeight: '700', marginBottom: SPACING.md },
  input: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md, color: COLORS.textDark, fontSize: 12, borderWidth: 1, borderColor: COLORS.inputBorder, marginBottom: SPACING.md },
  btnRow: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm },
  cancelBtn: { flex: 1, backgroundColor: COLORS.glassSurface, paddingVertical: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center' },
  cancelText: { color: COLORS.textBody, fontSize: 11, fontWeight: '600' },
  confirmBtn: { flex: 1, backgroundColor: COLORS.emeraldFill, paddingVertical: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center' },
  disabled: { opacity: 0.5 },
  confirmText: { color: COLORS.onAccent, fontSize: 11, fontWeight: '700' },
}));
