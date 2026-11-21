import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import React, { useState } from 'react';
import { StyleSheet, View, Modal, TouchableOpacity, TextInput } from 'react-native';
import { Text } from 'react-native-paper';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../theme';

interface AddConditionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (name: string, diagnosedDate?: string, notes?: string) => Promise<void>;
  isLoading?: boolean;
}

export const AddConditionModal: React.FC<AddConditionModalProps> = ({
  visible,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const [name, setName] = useState('');
  const [diagnosedDate, setDiagnosedDate] = useState('');
  const [notes, setNotes] = useState('');

  const [formError, setFormError] = useState('');
  const handleSubmit = async () => {
    if (!name.trim()) return;
    setFormError('');
    try { await onSubmit(name, diagnosedDate || undefined, notes || undefined);
    setName('');
    setDiagnosedDate('');
    setNotes('');
    onClose();
    } catch(e: any) { setFormError(e.message || 'Could not save. Please try again.'); }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {!!formError && <Text accessibilityRole="alert" style={{color:COLORS.red}}>{formError}</Text>}<Text style={styles.title}>Add Chronic Condition</Text>
          <Text style={styles.sub}>Enter condition details:</Text>

          <TextInput
            style={styles.input}
            placeholder="Condition Name (e.g. Hypertension, Diabetes)"
            placeholderTextColor={COLORS.textBody}
            value={name}
            onChangeText={setName}
          />

          <TextInput
            style={styles.input}
            placeholder="Diagnosed Date (e.g. 2022-05-10)"
            placeholderTextColor={COLORS.textBody}
            value={diagnosedDate}
            onChangeText={setDiagnosedDate}
          />

          <TextInput
            style={styles.input}
            placeholder="Notes (optional)"
            placeholderTextColor={COLORS.textBody}
            value={notes}
            onChangeText={setNotes}
          />

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isLoading}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmBtn, !name.trim() && styles.disabledBtn]}
              onPress={handleSubmit}
              disabled={!name.trim() || isLoading}
            >
              <Text style={styles.confirmBtnText}>{isLoading ? 'Saving...' : 'Add Condition'}</Text>
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
  btnRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.sm,
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
