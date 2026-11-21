import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform, StatusBar } from 'react-native';
import { TextInput, Button, Card } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { navigate } from '../../utils/navigation';
import { useResetPassword } from '../../hooks/useAuth';
import { SPACING, RADIUS } from '../../theme';

export default function ResetPasswordScreen() {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const router = useRouter();
  const { emailOrPhone } = useLocalSearchParams<{ emailOrPhone: string }>();
  const resetMutation = useResetPassword();
  const isLoading = resetMutation.isPending;

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const notify = (title: string, msg: string) => {
    if (Platform.OS === 'web') alert(`${title}: ${msg}`);
    else Alert.alert(title, msg);
  };

  const handleSubmit = async () => {
    if (code.trim().length !== 6) {
      notify('Validation Error', 'Verification code must be exactly 6 digits.');
      return;
    }
    if (newPassword.length < 8) {
      notify('Validation Error', 'New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      notify('Validation Error', 'Passwords do not match.');
      return;
    }

    resetMutation.mutate(
      { emailOrPhone: (emailOrPhone || '').trim(), code: code.trim(), password: newPassword },
      {
        onSuccess: () => {
          if (Platform.OS === 'web') {
            alert('Your account password has been updated. Please sign in with your new credentials.');
            navigate('/auth/login');
          } else {
            Alert.alert(
              'Password Reset Successful',
              'Your account password has been updated. Please login with your new credentials.',
              [{ text: 'Go to Login', onPress: () => navigate('/auth/login') }]
            );
          }
        },
        onError: (err: any) => notify('Reset Failed', err.message),
      }
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar barStyle="light-content" />
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>PASSWORD RESET</Text>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter the 6-digit OTP code sent to {emailOrPhone}</Text>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <TextInput
            label="6-Digit OTP Reset Code"
            value={code}
            onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
            keyboardType="numeric"
            placeholder="e.g. 123456"
            maxLength={6}
            mode="outlined"
            outlineColor={COLORS.inputBorder}
            activeOutlineColor={COLORS.navy}
            style={styles.input}
          />

          <TextInput
            label="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder="Min 8 chars, 1 number, 1 symbol"
            mode="outlined"
            outlineColor={COLORS.inputBorder}
            activeOutlineColor={COLORS.navy}
            style={styles.input}
          />

          <TextInput
            label="Confirm New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            mode="outlined"
            outlineColor={COLORS.inputBorder}
            activeOutlineColor={COLORS.navy}
            style={styles.input}
          />

          <Button
            mode="contained"
            buttonColor={COLORS.navy}
            textColor={COLORS.onAccent}
            loading={isLoading}
            disabled={isLoading || code.trim().length !== 6 || newPassword.length === 0}
            onPress={handleSubmit}
            style={styles.btn}
          >
            Confirm &amp; Save Password
          </Button>

          <Button
            mode="text"
            textColor={COLORS.textBody}
            onPress={() => router.replace('/auth/login')}
            style={{ marginTop: 12 }}
          >
            Cancel &amp; Back to Login
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  content: { flexGrow: 1, backgroundColor: COLORS.surface, paddingBottom: 32 },
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
  title: { color: COLORS.headerText, fontSize: 26, fontWeight: '800', marginTop: 4 },
  subtitle: { color: COLORS.inverseMuted, fontSize: 13.5, marginTop: 6, textAlign: 'center', lineHeight: 19 },
  card: {
    marginHorizontal: SPACING.lg,
    marginTop: -24,
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  input: { backgroundColor: COLORS.surfaceCard, marginBottom: 14 },
  btn: { borderRadius: RADIUS.md, paddingVertical: 4 },
});
