


import { View } from 'react-native';
import { Text, Button } from 'react-native-paper';
import Constants from 'expo-constants';
import { WorkflowPage, useFlowStyles } from '../../../components/common/WorkflowPage';
import { navigate } from '../../../utils/navigation';
import { AppearanceSettings } from '../../../components/common/AppearanceSettings';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { SPACING } from '../../../theme';

export default function SettingsScreen() {
  const s = useFlowStyles();
  const { colors: COLORS } = useAppTheme();

  return (
    <WorkflowPage title="Account Settings">
      <AppearanceSettings />

      <View style={s.card}>
        <Text style={s.subtitle}>SECURITY &amp; ACCESS</Text>
        <Text style={s.title}>Account &amp; Profile</Text>
        <View style={{ gap: SPACING.sm }}>
          <Button
            mode="contained"
            buttonColor={COLORS.navy}
            textColor={COLORS.onAccent}
            icon="lock-outline"
            onPress={() => navigate('/auth/change-password')}
          >
            Change Password
          </Button>
          <Button
            mode="outlined"
            textColor={COLORS.primaryText}
            icon="shield-check-outline"
            onPress={() => navigate('/auth/security')}
          >
            Two-Step Verification
          </Button>
          <Button
            mode="outlined"
            textColor={COLORS.primaryText}
            icon="account-edit-outline"
            onPress={() => navigate('/(patient)/profile/edit')}
          >
            Edit Personal Information
          </Button>
          <Button
            mode="outlined"
            textColor={COLORS.primaryText}
            icon="phone-alert-outline"
            onPress={() => navigate('/(patient)/profile/emergency-contacts')}
          >
            Emergency Contacts
          </Button>
          <Button
            mode="outlined"
            textColor={COLORS.primaryText}
            icon="bell-outline"
            onPress={() => navigate('/(patient)/notifications')}
          >
            Notification Inbox
          </Button>
        </View>
        <Text style={[s.body, { marginTop: SPACING.xs }]}>Language: English</Text>
      </View>

      <View style={s.card}>
        <Text style={s.subtitle}>HELP &amp; GOVERNANCE</Text>
        <Text style={s.title}>Using Healix</Text>
        <Text style={s.body}>
          Use Requests to book care and compare nurse offers. Use Records and Health to review visits, prescribed medication, and care plans. Messages connects you to an eligible care team.
        </Text>
        <Text style={s.body}>
          Use Emergency Transport to follow an existing escalation. For an immediate emergency, call your local emergency service.
        </Text>
      </View>

      <View style={s.card}>
        <Text style={s.title}>Privacy &amp; App Info</Text>
        <Text style={s.body}>
          Your care records are available to authorized care participants. Sign out on shared devices and keep your password private.
        </Text>
        <Text style={[s.body, { fontWeight: '700' }]}>
          Healix Version {Constants.expoConfig?.version || '1.0.0'}
        </Text>
      </View>
    </WorkflowPage>
  );
}
