


import { useState } from 'react';
import { View } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../api/auth.api';
import { WorkflowPage, useFlowStyles } from '../../components/common/WorkflowPage';
import { useAppTheme } from '../../theme/ThemeProvider';
import { RADIUS, SPACING } from '../../theme';

export default function SecurityScreen() {
  const s = useFlowStyles();
  const { colors: COLORS } = useAppTheme();

  const q = useQuery({ queryKey: ['auth', 'security'], queryFn: authApi.getMe });
  const enabled = !!(q.data as any)?.mfaEnabled;
  const [requested, setRequested] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const run = async (confirm: boolean) => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      if (confirm) {
        if (!/^\d{6}$/.test(code)) throw new Error('Enter the six-digit email code.');
        if (enabled) await authApi.disableMfa(code);
        else await authApi.verifyEnableMfa(code);
        setRequested(false);
        setCode('');
        await q.refetch();
        setMessage(enabled ? 'Two-step verification disabled.' : 'Two-step verification enabled.');
      } else {
        if (enabled) await authApi.requestDisableMfa();
        else await authApi.enableMfa();
        setRequested(true);
        setMessage('A 6-digit verification code has been sent to your email.');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <WorkflowPage
      title="Account Security"
      loading={q.isLoading}
      error={error || q.error?.message}
      retry={() => void q.refetch()}
    >
      {!!message && (
        <View style={s.successBanner}>
          <Text style={{ color: COLORS.emerald, fontWeight: '700' }}>✓ {message}</Text>
        </View>
      )}

      <View style={s.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={s.subtitle}>MULTI-FACTOR AUTHENTICATION</Text>
            <Text style={s.title}>Email Two-Step Verification</Text>
          </View>
          <View
            style={{
              backgroundColor: enabled ? COLORS.emeraldLight : COLORS.amberLight,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: RADIUS.round,
            }}
          >
            <Text
              style={{
                color: enabled ? COLORS.emerald : COLORS.amber,
                fontSize: 11,
                fontWeight: '800',
              }}
            >
              {enabled ? 'ENABLED' : 'DISABLED'}
            </Text>
          </View>
        </View>
        <Text style={s.body}>
          When enabled, sign-in requires your password and a verification code sent to your email. Changing this setting also requires an email code.
        </Text>
        <Button
          mode="contained"
          buttonColor={COLORS.navy}
          textColor={COLORS.onAccent}
          disabled={busy || q.isLoading || !!q.error}
          loading={busy}
          onPress={() => void run(false)}
        >
          {requested ? 'Resend Code' : enabled ? 'Request Disable Code' : 'Request Enable Code'}
        </Button>

        {requested && (
          <View style={{ gap: SPACING.sm, marginTop: SPACING.sm }}>
            <TextInput
              mode="outlined"
              outlineColor={COLORS.inputBorder}
              activeOutlineColor={COLORS.navy}
              textColor={COLORS.textDark}
              label="Six-digit email code"
              style={s.input}
              value={code}
              onChangeText={v => setCode(v.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              left={<TextInput.Icon icon="shield-key-outline" />}
            />
            <Button
              mode="contained"
              buttonColor={COLORS.emeraldFill}
              textColor={COLORS.onAccent}
              disabled={busy || code.length !== 6}
              onPress={() => void run(true)}
            >
              {enabled ? 'Confirm Disable' : 'Confirm Enable'}
            </Button>
          </View>
        )}
      </View>
    </WorkflowPage>
  );
}
