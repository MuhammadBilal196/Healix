
import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import React, { useState } from 'react';
import { StyleSheet, View, Modal, TouchableOpacity, TextInput } from 'react-native';
import { Text } from 'react-native-paper';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../theme';

interface CancelRequestModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  isLoading?: boolean;
}

export const CancelRequestModal: React.FC<CancelRequestModalProps> = ({
  visible,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const [reason, setReason] = useState('');

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    await onConfirm(reason);
    setReason('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Cancel Care Request</Text>
          <Text style={styles.sub}>Please state the reason for cancellation:</Text>

          <TextInput
            style={styles.input}
            placeholder="Reason for cancellation..."
            placeholderTextColor={COLORS.textBody}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
          />

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isLoading}>
              <Text style={styles.cancelBtnText}>Keep Request</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmBtn, !reason.trim() && styles.disabledBtn]}
              onPress={handleSubmit}
              disabled={!reason.trim() || isLoading}
            >
              <Text style={styles.confirmBtnText}>{isLoading ? 'Cancelling...' : 'Cancel Request'}</Text>
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
    textAlignVertical: 'top',
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
    backgroundColor: COLORS.redFill,
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
