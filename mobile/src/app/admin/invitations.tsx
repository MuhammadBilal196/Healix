


import { useState } from 'react';
import { Text, TextInput, Button } from 'react-native-paper';
import { View } from 'react-native';
import { apiClient } from '../../api/client';
import { WorkflowPage, useFlowStyles } from '../../components/common/WorkflowPage';
import { useAppTheme } from '../../theme/ThemeProvider';

export default function Invitations() {
  const s = useFlowStyles();
  const { colors: COLORS } = useAppTheme();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState('ADMIN');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setBusy(true);
    setError('');
    setToken('');
    try {
      const result = await apiClient.post<any>('/admin/users/invite', { email: email.trim(), role }, { retry: false });
      setToken(result.token);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <WorkflowPage title="Invite an Account" error={error}>
      <View style={s.card}>
        <Text style={s.subtitle}>ONE-TIME INVITATION</Text>
        <Text style={s.title}>Create Role Invitation</Text>
        <Text style={s.body}>
          Invite a specific email. Share the resulting token privately with that person; it expires after 7 days and can be used once. They accept it from Sign In &rarr; Accept an Invitation and choose their own password.
        </Text>
        <TextInput
          mode="outlined"
          outlineColor={COLORS.inputBorder}
          activeOutlineColor={COLORS.navy}
          textColor={COLORS.textDark}
          style={s.input}
          label="Recipient email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          left={<TextInput.Icon icon="email-outline" />}
        />
        <Text style={{ color: COLORS.textDark, fontWeight: '700', fontSize: 12.5 }}>Select Assigned Role</Text>
        <View style={s.row}>
          {['ADMIN', 'DOCTOR', 'PARAMEDIC', 'NURSE', 'PATIENT'].map(r => (
            <Button
              key={r}
              compact
              mode={role === r ? 'contained' : 'outlined'}
              buttonColor={role === r ? COLORS.navy : undefined}
              textColor={role === r ? COLORS.onAccent : COLORS.primaryText}
              onPress={() => setRole(r)}
            >
              {r}
            </Button>
          ))}
        </View>
        <Button
          mode="contained"
          buttonColor={COLORS.navy}
          textColor={COLORS.onAccent}
          disabled={busy || !email.trim()}
          loading={busy}
          onPress={() => void submit()}
        >
          Create Invitation
        </Button>
      </View>
      {!!token && (
        <View style={s.successBanner}>
          <Text style={s.title}>One-time invitation token</Text>
          <Text selectable style={[s.body, { fontWeight: '700', marginTop: 4 }]}>
            {token}
          </Text>
        </View>
      )}
    </WorkflowPage>
  );
}
