


import { useState } from 'react';
import { View } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { authApi } from '../../api/auth.api';
import { navigate } from '../../utils/navigation';
import { WorkflowPage, useFlowStyles } from '../../components/common/WorkflowPage';
import { useAppTheme } from '../../theme/ThemeProvider';

const FIELD_META: Array<{
  key: 'invitationToken' | 'email' | 'phone' | 'fullName' | 'password' | 'cnic' | 'professionalId';
  label: string;
  icon: string;
}> = [
  { key: 'invitationToken', label: 'Invitation token', icon: 'key-variant' },
  { key: 'fullName', label: 'Full name', icon: 'account-outline' },
  { key: 'email', label: 'Email address', icon: 'email-outline' },
  { key: 'phone', label: 'Pakistan phone number (03XXXXXXXXX)', icon: 'phone-outline' },
  { key: 'cnic', label: 'CNIC (XXXXX-XXXXXXX-X)', icon: 'card-account-details-outline' },
  { key: 'professionalId', label: 'PMDC / PNC / Cert ID (clinicians only)', icon: 'shield-account-outline' },
  { key: 'password', label: 'New Healix password', icon: 'lock-outline' },
];

export default function InvitedRegistration() {
  const s = useFlowStyles();
  const { colors: COLORS } = useAppTheme();

  const [fields, setFields] = useState({
    invitationToken: '',
    email: '',
    phone: '',
    fullName: '',
    password: '',
    cnic: '',
    professionalId: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const result: any = await authApi.registerInvited({
        ...fields,
        invitationToken: fields.invitationToken.trim(),
        email: fields.email.trim(),
        phone: fields.phone.trim(),
        fullName: fields.fullName.trim(),
        cnic: fields.cnic.trim(),
        professionalId: fields.professionalId.trim() || undefined,
      });
      if (result.emailVerificationRequired) {
        navigate('/auth/verify-otp', { emailOrPhone: fields.email.trim() });
      } else {
        navigate('/auth/login', { message: 'Account created. You can sign in now.' });
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <WorkflowPage title="Accept Healix Invitation" error={error}>
      <View style={s.card}>
        <Text style={s.subtitle}>CLINICIAN &amp; ADMIN ONBOARDING</Text>
        <Text style={s.title}>Activate Invited Account</Text>
        <Text style={s.body}>
          Use the 7-day invitation token provided by your Healix administrator. Doctors and paramedics can sign in right after activating their account.
        </Text>
        {FIELD_META.map(({ key, label, icon }) => (
          <TextInput
            key={key}
            mode="outlined"
            outlineColor={COLORS.inputBorder}
            activeOutlineColor={COLORS.navy}
            textColor={COLORS.textDark}
            label={label}
            value={fields[key]}
            onChangeText={v => setFields(f => ({ ...f, [key]: v }))}
            secureTextEntry={key === 'password'}
            autoCapitalize={key === 'fullName' ? 'words' : 'none'}
            style={s.input}
            left={<TextInput.Icon icon={icon} />}
          />
        ))}
        <Button
          mode="contained"
          buttonColor={COLORS.navy}
          textColor={COLORS.onAccent}
          loading={busy}
          disabled={busy || !fields.invitationToken.trim() || !fields.email.trim() || !fields.password}
          onPress={() => void submit()}
        >
          Create Account
        </Button>
      </View>
    </WorkflowPage>
  );
}
