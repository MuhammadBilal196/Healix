
import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import React, { useState } from 'react';
import { StyleSheet, View, Modal, TouchableOpacity, TextInput } from 'react-native';
import { Text } from 'react-native-paper';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../theme';

interface RescheduleRequestModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (newScheduledAt: string) => Promise<void>;
  isLoading?: boolean;
}

export const RescheduleRequestModal: React.FC<RescheduleRequestModalProps> = ({
  visible,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const [scheduledAt, setScheduledAt] = useState('');

  const handleSubmit = async () => {
    if (!scheduledAt.trim()) return;
    await onConfirm(scheduledAt);
    setScheduledAt('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Reschedule Visit</Text>
          <Text style={styles.sub}>Enter preferred date and time (e.g. 14 May 2025 - 10:00 AM):</Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. 14 May 2025 - 10:00 AM"
            placeholderTextColor={COLORS.textBody}
            value={scheduledAt}
            onChangeText={setScheduledAt}
          />

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isLoading}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmBtn, !scheduledAt.trim() && styles.disabledBtn]}
              onPress={handleSubmit}
              disabled={!scheduledAt.trim() || isLoading}
            >
              <Text style={styles.confirmBtnText}>{isLoading ? 'Saving...' : 'Reschedule'}</Text>
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
    marginBottom: SPACING.lg,
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
