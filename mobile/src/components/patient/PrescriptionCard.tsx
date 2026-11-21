
import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import React from 'react';
import { StyleSheet, View, TouchableOpacity, Linking } from 'react-native';
import { Text } from 'react-native-paper';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../theme';

interface PrescriptionCardProps {
  doctorName: string;
  prescribedAt: string;
  instructions?: string | null;
  fileUrl?: string;
  onDownload: () => void;
}

export const PrescriptionCard: React.FC<PrescriptionCardProps> = ({ doctorName, prescribedAt, instructions, fileUrl, onDownload }) => {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const handleDownload = () => {
    if (fileUrl) { Linking.openURL(fileUrl).catch(() => {}); }
    onDownload();
  };

  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.doctor}>Dr. {doctorName}</Text>
        <Text style={styles.date}>{prescribedAt}</Text>
        {instructions ? <Text style={styles.instructions} numberOfLines={2}>{instructions}</Text> : null}
      </View>
      <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload} activeOpacity={0.8}>
        <Text style={styles.downloadText}>📄 PDF</Text>
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  card: { backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.lg, padding: SPACING.md, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.inputBorder },
  info: { flex: 1 },
  doctor: { color: COLORS.textDark, fontSize: TYPOGRAPHY.sizes.sm, fontWeight: '700' },
  date: { color: COLORS.textBody, fontSize: 11, marginTop: 2 },
  instructions: { color: COLORS.textBody, fontSize: 10, marginTop: 4 },
  downloadBtn: { backgroundColor: COLORS.emeraldLight, paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.emerald },
  downloadText: { color: COLORS.emerald, fontSize: 11, fontWeight: '700' },
}));
