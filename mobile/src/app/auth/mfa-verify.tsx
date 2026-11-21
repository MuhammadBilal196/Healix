import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import { useState } from 'react';
import { Text, StyleSheet, ScrollView, View, StatusBar } from 'react-native';
import { TextInput, Button, Card, HelperText } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/auth';
import { navigate } from '../../utils/navigation';
import { SPACING, RADIUS } from '../../theme';

export default function MfaVerifyScreen() {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const { emailOrPhone } = useLocalSearchParams<{ emailOrPhone: string }>();
  const [code, setCode] = useState('');
  const setSession = useAuthStore((state) => state.setSession);

  const mfaMutation = useMutation({
    mutationFn: (data: { emailOrPhone: string; code: string }) => authApi.verifyMfaLogin(data),
    onSuccess: async (res) => {
      await setSession(res.user, res.tokens.accessToken, res.tokens.refreshToken);
    },
  });

  const handleVerify = () => {
    const clean = code.trim();
    if (clean.length !== 6) return;
    mfaMutation.mutate({ emailOrPhone: (emailOrPhone || '').trim(), code: clean });
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>TWO-STEP SECURITY</Text>
        <Text style={styles.header}>MFA Verification</Text>
        <Text style={styles.subtitle}>Enter the 6-digit code sent to {emailOrPhone}</Text>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <TextInput
            label="6-Digit MFA Code"
            value={code}
            onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
            mode="outlined"
            keyboardType="number-pad"
            maxLength={6}
            style={styles.input}
            outlineColor={COLORS.inputBorder}
            activeOutlineColor={COLORS.navy}
          />
          {mfaMutation.error && (
            <HelperText type="error" visible={true}>
              {(mfaMutation.error as any).message || 'Invalid code'}
            </HelperText>
          )}
          <Button
            mode="contained"
            onPress={handleVerify}
            loading={mfaMutation.isPending}
            disabled={mfaMutation.isPending || code.trim().length !== 6}
            style={styles.button}
            buttonColor={COLORS.navy}
            textColor={COLORS.onAccent}
          >
            Verify &amp; Login
          </Button>
          <Button
            mode="text"
            textColor={COLORS.textBody}
            onPress={() => navigate('/auth/login')}
            style={{ marginTop: 10 }}
          >
            ‹ Back to Login
          </Button>
        </Card.Content>
      </Card>
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
    marginHorizontal: SPACING.lg,
    marginTop: -24,
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  input: {
    marginBottom: 14,
    backgroundColor: COLORS.surfaceCard,
    textAlign: 'center',
    fontSize: 20,
    letterSpacing: 6,
  },
  button: { paddingVertical: 4, marginTop: 8, borderRadius: RADIUS.md },
});
