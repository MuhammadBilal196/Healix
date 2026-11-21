import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import React, { useState } from 'react';
import { StyleSheet, View, Modal, TouchableOpacity, TextInput } from 'react-native';
import { Text } from 'react-native-paper';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../theme';

interface AddEmergencyContactModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (name: string, phone: string, relationship: string) => Promise<void>;
  isLoading?: boolean;
}

export const AddEmergencyContactModal: React.FC<AddEmergencyContactModalProps> = ({ visible, onClose, onSubmit, isLoading = false }) => {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');

  const [formError, setFormError] = useState('');
  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim() || !relationship.trim()) return;
    setFormError('');
    try { await onSubmit(name, phone, relationship);
    setName(''); setPhone(''); setRelationship('');
    onClose();
    } catch(e: any) { setFormError(e.message || 'Could not save. Please try again.'); }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {!!formError && <Text accessibilityRole="alert" style={{color:COLORS.red}}>{formError}</Text>}<Text style={styles.title}>Add Emergency Contact</Text>
          <TextInput style={styles.input} placeholder="Contact Name" placeholderTextColor={COLORS.textBody} value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Phone Number" placeholderTextColor={COLORS.textBody} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <TextInput style={styles.input} placeholder="Relationship (e.g. Sister, Brother)" placeholderTextColor={COLORS.textBody} value={relationship} onChangeText={setRelationship} />
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isLoading}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.confirmBtn, (!name.trim() || !phone.trim() || !relationship.trim()) && styles.disabled]} onPress={handleSubmit} disabled={!name.trim() || !phone.trim() || !relationship.trim() || isLoading}>
              <Text style={styles.confirmText}>{isLoading ? 'Saving...' : 'Add Contact'}</Text>
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
