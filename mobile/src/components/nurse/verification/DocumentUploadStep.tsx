
import { useAppTheme, useThemeValue } from '../../../theme/ThemeProvider';
import type { ThemeColors } from '../../../theme';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { DocKey } from './types';
import { CHECK_ITEMS } from './constants';

interface UploadModalProps {
  visible: boolean;
  docKey: DocKey | null;
  onClose: () => void;
  onUpload: (url: string) => Promise<void>;
}

export const DocumentUploadStep: React.FC<UploadModalProps> = ({ visible, docKey, onClose, onUpload }) => {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const [url, setUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      setUrl('');
      setError('');
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleUpload = async () => {
    if (!url.trim()) {
      setError('Please enter a document URL.');
      return;
    }
    setError('');
    setUploading(true);
    try {
      await onUpload(url.trim());
      onClose();
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const label = CHECK_ITEMS.find((i: any) => i.key === docKey)?.label ?? 'Document';

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View style={[styles.modalSheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Handle bar */}
          <View style={styles.modalHandle} />

          <Text style={styles.modalTitle}>Submit Document</Text>
          <Text style={styles.modalSubtitle}>{label}</Text>

          <Text style={styles.inputLabel}>Document URL</Text>
          <TextInput
            style={styles.textInput}
            value={url}
            onChangeText={(t) => {
              setUrl(t);
              setError('');
            }}
            placeholder="https://example.com/document.pdf"
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="none"
            keyboardType="url"
            returnKeyType="done"
            onSubmitEditing={handleUpload}
            selectionColor={COLORS.teal}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Text style={styles.urlHint}>
            Paste the publicly accessible URL of your document (PDF, JPG, PNG).
          </Text>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.75}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.uploadBtn, uploading && styles.uploadBtnDisabled]}
              onPress={handleUpload}
              activeOpacity={0.8}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color={COLORS.onAccent} size="small" />
              ) : (
                <Text style={styles.uploadBtnText}>Upload</Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.modalBackdrop,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    borderTopWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  modalHandle: {
    width: 44,
    height: 4,
    backgroundColor: COLORS.inputBorder,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.teal,
    marginBottom: 24,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  textInput: {
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.textDark,
    fontSize: 14,
    marginBottom: 8,
  },
  errorText: {
    color: COLORS.red,
    fontSize: 12,
    marginBottom: 6,
    marginLeft: 4,
  },
  urlHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 28,
    marginLeft: 2,
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceCard,
  },
  cancelBtnText: {
    color: COLORS.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
  uploadBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.tealFill,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  uploadBtnDisabled: {
    opacity: 0.65,
  },
  uploadBtnText: {
    color: COLORS.onAccent,
    fontSize: 15,
    fontWeight: '700',
  },
}));
