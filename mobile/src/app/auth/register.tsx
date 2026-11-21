import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import { useState } from 'react';
import { StyleSheet, View, ScrollView, Platform, StatusBar } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { navigate } from '../../utils/navigation';
import { useRegister } from '../../hooks/useAuth';
import { ThemeToggleButton } from '../../components/common/AppearanceSettings';
import { ApiError } from '../../types/api';
import { SPACING, RADIUS } from '../../theme';

export default function RegisterScreen() {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const params = useLocalSearchParams();
  const role = (params.role as string) || 'PATIENT';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [cnic, setCnic] = useState('');
  const [pncNumber, setPncNumber] = useState('');

  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const registerMutation = useRegister();
  const isLoading = registerMutation.isPending;
  const error = registerMutation.error as ApiError | null;

  const formatCnic = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 13);
    if (digits.length <= 5) return digits;
    if (digits.length <= 12) return digits.slice(0, 5) + '-' + digits.slice(5);
    return digits.slice(0, 5) + '-' + digits.slice(5, 12) + '-' + digits.slice(12);
  };

  const handleCnicChange = (val: string) => {
    setCnic(formatCnic(val));
    if (error) registerMutation.reset();
  };

  const isEmailValid = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  const isPhoneValid = (val: string) => /^03\d{9}$/.test(val.trim());
  const isCnicValid = (val: string) => /^\d{5}-\d{7}-\d{1}$/.test(val.trim());
  const isPasswordValid = (val: string) => /^(?=.*[0-9])(?=.*[!@#$%^&*()[\]{}|_+=;:"'<>,.?/~`\-]).{8,}$/.test(val);

  const isFormValid = () => {
    if (!['PATIENT', 'NURSE'].includes(role)) return false;
    if (!fullName.trim() || fullName.trim().length < 3) return false;
    if (!isEmailValid(email)) return false;
    if (!isPhoneValid(phone)) return false;
    if (!isPasswordValid(password)) return false;
    if (!isCnicValid(cnic)) return false;
    if (role === 'NURSE' && !pncNumber.trim()) return false;
    return true;
  };

  const handleRegister = async () => {
    if (!isFormValid()) return;
    const payload: any = {
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password,
      role,
      cnic: cnic.trim(),
    };
    if (role === 'NURSE') payload.pncNumber = pncNumber.trim();

    registerMutation.mutate(payload, {
      onSuccess: () => {
        navigate('/auth/verify-otp', { emailOrPhone: email.trim() });
      },
    });
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <StatusBar barStyle="light-content" />
      <View style={styles.hero}>
        <View style={styles.heroTopRow}>
          <Text style={styles.eyebrow}>{role === 'NURSE' ? 'NURSE ONBOARDING' : 'PATIENT ONBOARDING'}</Text>
          <ThemeToggleButton compact inverse />
        </View>
        <Text style={styles.header}>Create Account</Text>
        <Text style={styles.subtitle}>Registering as a {role === 'NURSE' ? 'Registered Nurse (PNC)' : 'Patient'}</Text>
      </View>

      <View style={styles.card}>
        <TextInput
          label="Full Name"
          value={fullName}
          onChangeText={(val) => { setFullName(val); if (error) registerMutation.reset(); }}
          mode="outlined"
          error={fullName.length > 0 && fullName.trim().length < 3}
          left={<TextInput.Icon icon="account-outline" />}
          style={styles.input}
          outlineColor={COLORS.inputBorder}
          activeOutlineColor={COLORS.navy}
          textColor={COLORS.textDark}
        />
        {fullName.length > 0 && fullName.trim().length < 3 && (
          <HelperText type="error" visible style={styles.fieldError}>Full name must be at least 3 characters</HelperText>
        )}

        <TextInput
          label="Email Address"
          value={email}
          onChangeText={(val) => { setEmail(val); if (error) registerMutation.reset(); }}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          error={email.length > 0 && !isEmailValid(email)}
          left={<TextInput.Icon icon="email-outline" />}
          style={styles.input}
          outlineColor={COLORS.inputBorder}
          activeOutlineColor={COLORS.navy}
          textColor={COLORS.textDark}
        />
        {email.length > 0 && !isEmailValid(email) && (
          <HelperText type="error" visible style={styles.fieldError}>Enter a valid email address</HelperText>
        )}

        <TextInput
          label="Phone Number"
          value={phone}
          placeholder="03001234567"
          onChangeText={(val) => { setPhone(val); if (error) registerMutation.reset(); }}
          mode="outlined"
          keyboardType="phone-pad"
          error={phone.length > 0 && !isPhoneValid(phone)}
          left={<TextInput.Icon icon="phone-outline" />}
          style={styles.input}
          outlineColor={COLORS.inputBorder}
          activeOutlineColor={COLORS.navy}
          textColor={COLORS.textDark}
        />
        {phone.length > 0 && !isPhoneValid(phone) && (
          <HelperText type="error" visible style={styles.fieldError}>Must start with 03 (11 digits)</HelperText>
        )}

        <TextInput
          label="Password"
          value={password}
          onChangeText={(val) => { setPassword(val); if (error) registerMutation.reset(); }}
          mode="outlined"
          secureTextEntry={secureTextEntry}
          error={password.length > 0 && !isPasswordValid(password)}
          left={<TextInput.Icon icon="lock-outline" />}
          right={<TextInput.Icon icon={secureTextEntry ? 'eye-outline' : 'eye-off-outline'} onPress={() => setSecureTextEntry(!secureTextEntry)} />}
          style={styles.input}
          outlineColor={COLORS.inputBorder}
          activeOutlineColor={COLORS.navy}
          textColor={COLORS.textDark}
        />
        {password.length > 0 && !isPasswordValid(password) && (
          <HelperText type="error" visible style={styles.fieldError}>Requires 8+ chars with 1 number &amp; 1 symbol</HelperText>
        )}

        <TextInput
          label="CNIC Number"
          value={cnic}
          placeholder="37405-1234567-1"
          onChangeText={handleCnicChange}
          mode="outlined"
          keyboardType="numeric"
          maxLength={15}
          error={cnic.length > 0 && !isCnicValid(cnic)}
          left={<TextInput.Icon icon="card-account-details-outline" />}
          style={styles.input}
          outlineColor={COLORS.inputBorder}
          activeOutlineColor={COLORS.navy}
          textColor={COLORS.textDark}
        />
        {cnic.length > 0 && !isCnicValid(cnic) && (
          <HelperText type="error" visible style={styles.fieldError}>Format: XXXXX-XXXXXXX-X</HelperText>
        )}

        {role === 'NURSE' && (
          <>
            <TextInput
              label="PNC Registration Number"
              value={pncNumber}
              onChangeText={(val) => { setPncNumber(val); if (error) registerMutation.reset(); }}
              mode="outlined"
              error={pncNumber.length > 0 && !pncNumber.trim()}
              left={<TextInput.Icon icon="shield-account-outline" />}
              style={styles.input}
              outlineColor={COLORS.inputBorder}
              activeOutlineColor={COLORS.navy}
              textColor={COLORS.textDark}
            />
            {pncNumber.length > 0 && !pncNumber.trim() && (
              <HelperText type="error" visible style={styles.fieldError}>PNC registration number is required</HelperText>
            )}
          </>
        )}

        {error && <HelperText type="error" visible style={styles.errorText}>{error.message}</HelperText>}

        <Button
          mode="contained"
          onPress={handleRegister}
          loading={isLoading}
          disabled={isLoading || !isFormValid()}
          style={styles.button}
          contentStyle={styles.buttonContent}
          buttonColor={COLORS.navy}
          textColor={COLORS.onAccent}
        >
          Register Account
        </Button>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Text style={styles.link} onPress={() => { registerMutation.reset(); navigate('/auth/login'); }}>Sign In</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.surface },
  container: {
    flexGrow: 1,
    paddingBottom: 32,
    backgroundColor: COLORS.surface,
    alignSelf: 'center',
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 520 : '100%',
  },
  hero: {
    backgroundColor: COLORS.navyDark,
    paddingTop: 36,
    paddingBottom: 44,
    paddingHorizontal: 22,
    alignItems: 'center',
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
  },
  heroTopRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  eyebrow: { color: COLORS.accentBlue, fontSize: 10.5, fontWeight: '800', letterSpacing: 1 },
  header: { fontSize: 26, fontWeight: '800', color: COLORS.headerText, marginTop: 4 },
  subtitle: { fontSize: 13.5, color: COLORS.inverseMuted, marginTop: 4 },
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.xl,
    marginHorizontal: SPACING.lg,
    marginTop: -24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    elevation: 4,
  },
  input: { marginBottom: 4, marginTop: 8, backgroundColor: COLORS.surfaceCard },
  fieldError: { marginBottom: 2, fontSize: 12 },
  button: { marginTop: 16, borderRadius: RADIUS.md },
  buttonContent: { paddingVertical: 6 },
  errorText: { marginTop: 8, marginBottom: 8, fontSize: 13.5, textAlign: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { color: COLORS.textBody, fontSize: 14 },
  link: { color: COLORS.primaryText, fontWeight: '800', fontSize: 14 },
});
