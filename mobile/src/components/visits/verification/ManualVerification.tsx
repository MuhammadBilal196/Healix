
import { useAppTheme, useThemeValue } from '../../../theme/ThemeProvider';
import type { ThemeColors } from '../../../theme';
import React, { useState } from 'react';
import { StyleSheet, TextInput, Alert, Platform } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { useVerifyManual } from '../../../hooks/useVisits';
import { verifyManualSchema } from '../../../types/visit';
import { RADIUS, SPACING } from '../../../theme';

interface ManualVerificationProps {
  visitId: string;
  onSuccess: () => void;
}

export const ManualVerification: React.FC<ManualVerificationProps> = ({ visitId, onSuccess }) => {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const verifyManual = useVerifyManual();


  const handleSubmit = async () => {
    const result = verifyManualSchema.safeParse({ reason });
    if (!result.success) {
      setError(result.error.errors[0]?.message || 'Invalid input');
      return;
    }
    setError('');

    try {
      await verifyManual.mutateAsync({ visitId, data: { reason } });
      if (Platform.OS === 'web') {
        alert('Manual verification recorded.');
        onSuccess();
      } else {
        Alert.alert('Verified', 'Manual verification recorded.', [
          { text: 'Continue', onPress: onSuccess },
        ]);
      }
    } catch (err: any) {
      if (Platform.OS === 'web') {
        alert('Verification Failed: ' + (err.message || 'Manual verification failed.'));
      } else {
        Alert.alert('Verification Failed', err.message || 'Manual verification failed.');
      }
    }
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.title}>Patient-confirmed manual verification</Text>
        <Text style={styles.description}>The patient must confirm your arrival in their app. Record why QR/GPS verification could not be used (at least 10 characters).</Text>
        <TextInput
          style={styles.input}
          placeholder="Reason QR/GPS could not be used..."
          placeholderTextColor={COLORS.textBody}
          value={reason}
          onChangeText={setReason}
          multiline
          numberOfLines={3}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Button
          mode="contained"
          buttonColor={COLORS.amberFill}
          textColor={COLORS.onAccent}
          onPress={handleSubmit}
          loading={verifyManual.isPending}
          disabled={verifyManual.isPending}
          style={styles.btn}
          labelStyle={{ fontWeight: '700' }}
        >
          Verify after patient confirmation
        </Button>
      </Card.Content>
    </Card>
  );
};

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  card: { backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.amber, marginBottom: SPACING.md },
  title: { color: COLORS.amber, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  description: { color: COLORS.textBody, fontSize: 12, marginBottom: 12 },
  input: {
    backgroundColor: COLORS.surface,
    color: COLORS.textDark,
    borderWidth: 1,
    borderColor: COLORS.amberLight,
    padding: 12,
    borderRadius: RADIUS.md,
    fontSize: 13,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  errorText: { color: COLORS.red, fontSize: 12, marginBottom: 8 },
  btn: { borderRadius: RADIUS.md },
}));
