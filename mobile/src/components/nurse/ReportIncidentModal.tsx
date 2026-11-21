
import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import React, { useState } from 'react';
import { StyleSheet, View, Modal, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../theme';

interface ReportIncidentModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (incidentType: string, description: string) => Promise<void>;
  isLoading?: boolean;
}

export const ReportIncidentModal: React.FC<ReportIncidentModalProps> = ({
  visible,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const [incidentType, setIncidentType] = useState('PATIENT_DETERIORATION');
  const [description, setDescription] = useState('');

  const handleSubmit = async () => {
    if (!description.trim()) return;
    await onSubmit(incidentType, description.trim());
    setDescription('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>🚨 Report Field Emergency / Incident</Text>
          <Text style={styles.subText}>Logs an emergency incident report immediately alerting Healix Operations & Attending Doctor.</Text>

          <Text style={styles.label}>Incident Type:</Text>
          <View style={styles.typeRow}>
            {[
              { id: 'PATIENT_DETERIORATION', label: 'Patient Deterioration' },
              { id: 'EQUIPMENT_FAILURE', label: 'Equipment Failure' },
              { id: 'SAFETY_CONCERN', label: 'Safety Concern' },
            ].map(item => (
              <TouchableOpacity
                key={item.id}
                style={[styles.typePill, incidentType === item.id && styles.typePillActive]}
                onPress={() => setIncidentType(item.id)}
              >
                <Text style={[styles.typeText, incidentType === item.id && styles.typeTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Description & Immediate Actions Taken:</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Describe what occurred and any immediate care given..."
            placeholderTextColor={COLORS.textBody}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isLoading}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, (!description.trim() || isLoading) && styles.disabledBtn]}
              onPress={handleSubmit}
              disabled={!description.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.onAccent} />
              ) : (
                <Text style={styles.submitBtnText}>Submit Report</Text>
              )}
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
    borderColor: COLORS.red,
  },
  title: {
    color: COLORS.red,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '700',
    marginBottom: 4,
  },
  subText: {
    color: COLORS.textBody,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: SPACING.md,
  },
  label: {
    color: COLORS.textBody,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    marginTop: SPACING.xs,
  },
  typeRow: {
    gap: 6,
    marginBottom: SPACING.md,
  },
  typePill: {
    backgroundColor: COLORS.surface,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  typePillActive: {
    backgroundColor: COLORS.redLight,
    borderColor: COLORS.red,
  },
  typeText: {
    color: COLORS.textBody,
    fontSize: 11,
  },
  typeTextActive: {
    color: COLORS.red,
    fontWeight: '700',
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
  multilineInput: {
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
  submitBtn: {
    flex: 1,
    backgroundColor: COLORS.redFill,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: COLORS.onAccent,
    fontSize: 11,
    fontWeight: '700',
  },
}));
