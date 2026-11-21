import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';

import { useState } from 'react';
import { StyleSheet, View, ScrollView, StatusBar } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { navigate } from '../../utils/navigation';
import { useVerifyOtp, useResendOtp } from '../../hooks/useAuth';
import { ApiError } from '../../types/api';
import { SPACING, RADIUS } from '../../theme';

export default function VerifyOtpScreen() {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const params = useLocalSearchParams();
  const emailOrPhone = ((params.emailOrPhone as string) || '').trim();

  const [code, setCode] = useState('');
  const resend = useResendOtp();
  const verifyOtpMutation = useVerifyOtp();
  const isLoading = verifyOtpMutation.isPending;
  const error = verifyOtpMutation.error as ApiError | null;

  const handleVerify = () => {
    const clean = code.trim();
    if (!/^\d{6}$/.test(clean) || !emailOrPhone) return;
    verifyOtpMutation.mutate(
      { emailOrPhone, code: clean },
      {
        onSuccess: (result) => {
          navigate('/auth/login', {
            message:
              result.status === 'ACTIVE'
                ? 'Email verified. You can now sign in.'
                : result.role === 'NURSE'
                ? 'Email verified. Sign in to submit your professional verification documents.'
                : 'Email verified. Your account awaits administrator approval.',
          });
        },
      }
    );
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>EMAIL VERIFICATION</Text>
        <Text style={styles.header}>Verify Account</Text>
        <Text style={styles.subtitle}>Enter the 6-digit code sent to {emailOrPhone || 'your email'}</Text>
      </View>

      <View style={styles.card}>
        <TextInput
          label="6-Digit Verification Code"
          value={code}
          maxLength={6}
          keyboardType="number-pad"
          onChangeText={(val) => {
            setCode(val.replace(/\D/g, '').slice(0, 6));
            if (error) verifyOtpMutation.reset();
          }}
          mode="outlined"
          style={styles.input}
          outlineColor={COLORS.inputBorder}
          activeOutlineColor={COLORS.navy}
        />

        {error && (
          <HelperText type="error" visible={true} style={styles.errorText}>
            {error.message}
          </HelperText>
        )}

        <Button
          mode="contained"
          onPress={handleVerify}
          loading={isLoading}
          disabled={isLoading || !/^\d{6}$/.test(code.trim()) || !emailOrPhone}
          style={styles.button}
          contentStyle={styles.buttonContent}
          buttonColor={COLORS.navy}
          textColor={COLORS.onAccent}
        >
          Verify Code
        </Button>

        <Button
          mode="text"
          textColor={COLORS.navy}
          loading={resend.isPending}
          disabled={resend.isPending || !emailOrPhone}
          onPress={() => resend.mutate({ emailOrPhone })}
          style={{ marginTop: 8 }}
        >
          Resend Code
        </Button>
        {resend.isSuccess && <Text style={styles.sentText}>New verification code sent.</Text>}
        {resend.error && <HelperText type="error">{resend.error.message}</HelperText>}

        <Button
          mode="text"
          onPress={() => navigate('/auth/login')}
          textColor={COLORS.textBody}
          style={styles.backButton}
        >
          ‹ Back to Login
        </Button>
      </View>
    </ScrollView>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.surface },
  container: { flexGrow: 1, backgroundColor: COLORS.surface, paddingBottom: 32 },
  hero: {
    backgroundColor: COLORS.navyDark,
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
  },
  eyebrow: { color: COLORS.accentBlue, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  header: { fontSize: 26, fontWeight: '800', color: COLORS.headerText, marginTop: 4 },
  subtitle: { fontSize: 13.5, color: COLORS.inverseMuted, marginTop: 6, textAlign: 'center' },
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.xl,
    marginHorizontal: SPACING.lg,
    marginTop: -24,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    elevation: 4,
  },
  input: {
    marginBottom: 14,
    backgroundColor: COLORS.surfaceCard,
    textAlign: 'center',
    fontSize: 20,
    letterSpacing: 6,
  },
  button: { marginTop: 6, borderRadius: RADIUS.md },
  buttonContent: { paddingVertical: 6 },
  errorText: { marginBottom: 10, fontSize: 13.5, textAlign: 'center' },
  sentText: { textAlign: 'center', color: COLORS.emerald, fontWeight: '600', marginTop: 4 },
  backButton: { marginTop: 10 },
});
