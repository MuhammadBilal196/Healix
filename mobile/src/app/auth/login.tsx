import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { navigate } from '../../utils/navigation';
import { useLogin } from '../../hooks/useAuth';
import { ApiError } from '../../types/api';
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton';
import { ThemeToggleButton } from '../../components/common/AppearanceSettings';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/auth';
import { SPACING, RADIUS } from '../../theme';

/**
 * Clinical Login Screen.
 * Supports email or phone inputs with secure password checking and
 * redirects unverified users to OTP verification or MFA challenge.
 */
export default function LoginScreen() {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const params = useLocalSearchParams<{ message?: string }>();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleError, setGoogleError] = useState('');
  const setSession = useAuthStore(state => state.setSession);

  const loginMutation = useLogin();
  const isLoading = loginMutation.isPending;
  const error = loginMutation.error as ApiError | null;

  const handleLogin = () => {
    const cleanId = emailOrPhone.trim();
    if (!cleanId || !password) return;
    loginMutation.mutate(
      { emailOrPhone: cleanId, password },
      {
        onSuccess: (data: any) => {
          if (data.mfaRequired) {
            navigate('/auth/mfa-verify', { emailOrPhone: cleanId });
          }
        },
        onError: (err: any) => {
          if (err.message && err.message.includes('verify your OTP')) {
            navigate('/auth/verify-otp', { emailOrPhone: cleanId });
          }
        },
      }
    );
  };

  const handleGoogleCredential = async (credential: string) => {
    setGoogleBusy(true);
    setGoogleError('');
    try {
      const result = await authApi.googleLogin({ credential });
      if (result.mfaRequired) {
        navigate('/auth/mfa-verify', { emailOrPhone: result.email });
      } else {
        await setSession(result.user, result.tokens.accessToken, result.tokens.refreshToken);
      }
    } catch (err: any) {
      setGoogleError(err.message || 'Google sign-in failed.');
    } finally {
      setGoogleBusy(false);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <StatusBar barStyle="light-content" />
      <View style={styles.hero}>
        <View style={styles.heroTopRow}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandMark}>H</Text>
          </View>
          <ThemeToggleButton compact inverse />
        </View>
        <Text style={styles.eyebrow}>HEALIX CLINICAL HEALTH</Text>
        <Text style={styles.logoText}>Healix</Text>
        <Text style={styles.subtitle}>Trusted Home Care &amp; Rapid Clinical Triage</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.hint}>Sign in to access your Patient, Nurse, Doctor, Paramedic, or Admin portal</Text>
        {!!params.message && (
          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerText}>{params.message}</Text>
          </View>
        )}

        <TextInput
          label="Email or Phone Number"
          value={emailOrPhone}
          onChangeText={(val) => {
            setEmailOrPhone(val);
            if (error) loginMutation.reset();
          }}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          left={<TextInput.Icon icon="email-outline" />}
          style={styles.input}
          outlineColor={COLORS.inputBorder}
          activeOutlineColor={COLORS.navy}
          textColor={COLORS.textDark}
        />

        <TextInput
          label="Password"
          value={password}
          onChangeText={(val) => {
            setPassword(val);
            if (error) loginMutation.reset();
          }}
          mode="outlined"
          secureTextEntry={secureTextEntry}
          left={<TextInput.Icon icon="lock-outline" />}
          right={
            <TextInput.Icon
              icon={secureTextEntry ? 'eye-outline' : 'eye-off-outline'}
              onPress={() => setSecureTextEntry(!secureTextEntry)}
            />
          }
          style={styles.input}
          outlineColor={COLORS.inputBorder}
          activeOutlineColor={COLORS.navy}
          textColor={COLORS.textDark}
        />

        {error && (
          <HelperText type="error" visible={true} style={styles.errorText}>
            {error.message}
          </HelperText>
        )}

        <Button
          mode="contained"
          onPress={handleLogin}
          loading={isLoading}
          disabled={isLoading || !emailOrPhone.trim() || !password}
          style={styles.button}
          contentStyle={styles.buttonContent}
          buttonColor={COLORS.navy}
          textColor={COLORS.onAccent}
        >
          Sign In
        </Button>

        <GoogleSignInButton onCredential={handleGoogleCredential} onError={setGoogleError} disabled={googleBusy || isLoading} />
        {!!googleError && <HelperText type="error" visible>{googleError}</HelperText>}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don&apos;t have an account? </Text>
          <Text
            style={styles.link}
            onPress={() => {
              loginMutation.reset();
              navigate('/auth/role-select');
            }}
          >
            Create Account
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            loginMutation.reset();
            navigate('/auth/forgot');
          }}
          style={styles.forgotBtn}
        >
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        <Button
          mode="outlined"
          icon="key-variant"
          textColor={COLORS.primaryText}
          style={styles.inviteBtn}
          onPress={() => navigate('/auth/invited')}
        >
          Accept an Invitation Token
        </Button>

        <View style={styles.trustRow}>
          <View style={styles.trustItem}>
            <Ionicons name="shield-checkmark" size={14} color={COLORS.emerald} />
            <Text style={styles.trustText}>HIPAA Audit</Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="medkit" size={14} color={COLORS.accentBlue} />
            <Text style={styles.trustText}>PMDC &amp; PNC Verified</Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="pulse" size={14} color={COLORS.red} />
            <Text style={styles.trustText}>24/7 Triage</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.surface },
  container: { flexGrow: 1, backgroundColor: COLORS.surface, paddingBottom: 32 },
  hero: {
    backgroundColor: COLORS.navyDark,
    paddingTop: 40,
    paddingBottom: 52,
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
    marginBottom: 8,
  },
  brandBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.navy,
    borderWidth: 1.5,
    borderColor: COLORS.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMark: { color: COLORS.headerText, fontSize: 18, fontWeight: '800' },
  eyebrow: { color: COLORS.accentBlue, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  logoText: { fontSize: 36, fontWeight: '800', color: COLORS.headerText, letterSpacing: -0.5, marginTop: 2 },
  subtitle: { fontSize: 13.5, color: COLORS.inverseMuted, marginTop: 4, textAlign: 'center' },
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.xl,
    marginHorizontal: SPACING.lg,
    marginTop: -28,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.textDark },
  hint: { fontSize: 13, color: COLORS.textBody, marginBottom: 16, marginTop: 4, lineHeight: 19 },
  infoBanner: {
    backgroundColor: COLORS.emeraldLight,
    borderColor: COLORS.emerald,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: 14,
  },
  infoBannerText: { color: COLORS.emerald, fontSize: 13, fontWeight: '700' },
  input: { marginBottom: 12, backgroundColor: COLORS.surfaceCard },
  button: { marginTop: 6, borderRadius: RADIUS.md },
  buttonContent: { paddingVertical: 6 },
  errorText: { marginBottom: 8, fontSize: 13 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
  footerText: { color: COLORS.textBody, fontSize: 14 },
  link: { color: COLORS.primaryText, fontWeight: '800', fontSize: 14 },
  forgotBtn: { marginTop: 10, alignItems: 'center', paddingVertical: 4 },
  forgotText: { color: COLORS.primaryText, fontWeight: '700', fontSize: 13 },
  inviteBtn: { marginTop: 12, borderColor: COLORS.inputBorder, borderRadius: RADIUS.md },
  trustRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 8,
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.dividerLight,
  },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trustText: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700' },
});
