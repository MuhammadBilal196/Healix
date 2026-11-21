import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform, StatusBar } from 'react-native';
import { TextInput, Button, Card } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { navigate } from '../../utils/navigation';
import { useForgotPassword } from '../../hooks/useAuth';
import { SPACING, RADIUS } from '../../theme';

export default function ForgotPasswordScreen() {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const router = useRouter();
  const forgotMutation = useForgotPassword();
  const isLoading = forgotMutation.isPending;
  const [emailOrPhone, setEmailOrPhone] = useState('');

  const handleSubmit = async () => {
    const clean = emailOrPhone.trim();
    if (!clean) {
      if (Platform.OS === 'web') alert('Please enter your registered email or phone number.');
      else Alert.alert('Validation Error', 'Please enter your registered email or phone number.');
      return;
    }

    forgotMutation.mutate(
      { emailOrPhone: clean },
      {
        onSuccess: () => {
          if (Platform.OS === 'web') {
            alert('A 6-digit password reset verification code has been generated and sent.');
            navigate('/auth/reset', { emailOrPhone: clean });
          } else {
            Alert.alert(
              'OTP Verification Dispatched',
              'A 6-digit password reset verification code has been generated and sent.',
              [{ text: 'OK', onPress: () => navigate('/auth/reset', { emailOrPhone: clean }) }]
            );
          }
        },
        onError: (err: any) => {
          if (Platform.OS === 'web') alert('Error: ' + err.message);
          else Alert.alert('Error', err.message);
        },
      }
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar barStyle="light-content" />
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>ACCOUNT RECOVERY</Text>
        <Text style={styles.title}>Recover Password</Text>
        <Text style={styles.subtitle}>Enter your email or phone to receive a 6-digit reset OTP</Text>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <TextInput
            label="Email or Phone Number"
            value={emailOrPhone}
            onChangeText={setEmailOrPhone}
            placeholder="e.g. user@gmail.com or 03001234567"
            autoCapitalize="none"
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
            disabled={isLoading || emailOrPhone.trim().length === 0}
            onPress={handleSubmit}
            style={styles.btn}
          >
            Request Reset Code
          </Button>

          <Button
            mode="text"
            textColor={COLORS.textBody}
            onPress={() => router.back()}
            style={{ marginTop: 12 }}
          >
            ‹ Back to Login
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
  input: { backgroundColor: COLORS.surfaceCard, marginBottom: 16 },
  btn: { borderRadius: RADIUS.md, paddingVertical: 4 },
});
