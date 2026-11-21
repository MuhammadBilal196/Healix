import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform, StatusBar } from 'react-native';
import { TextInput, Button, Card } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useChangePassword } from '../../hooks/useAuth';
import { SPACING, RADIUS } from '../../theme';

export default function ChangePasswordScreen() {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const router = useRouter();
  const changeMutation = useChangePassword();
  const isLoading = changeMutation.isPending;

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const notify = (title: string, msg: string) => {
    if (Platform.OS === 'web') alert(`${title}: ${msg}`);
    else Alert.alert(title, msg);
  };

  const handleSubmit = async () => {
    if (oldPassword.trim().length === 0) {
      notify('Validation Error', 'Please enter your current password.');
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

    changeMutation.mutate(
      { oldPassword, newPassword },
      {
        onSuccess: () => {
          if (Platform.OS === 'web') {
            alert('Your password has been updated. Please sign in again.');
            router.replace('/auth/login');
          } else {
            Alert.alert(
              'Password Changed Successfully',
              'Your password has been updated. Please sign in again.',
              [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
            );
          }
        },
        onError: (err: any) => notify('Change Password Failed', err.message),
      }
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar barStyle="light-content" />
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>ACCOUNT SECURITY</Text>
        <Text style={styles.title}>Change Password</Text>
        <Text style={styles.subtitle}>Update your account security credentials</Text>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <TextInput
            label="Current Password"
            value={oldPassword}
            onChangeText={setOldPassword}
            secureTextEntry
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
            disabled={isLoading || oldPassword.trim().length === 0 || newPassword.length === 0}
            onPress={handleSubmit}
            style={styles.btn}
          >
            Update Password
          </Button>

          <Button
            mode="outlined"
            textColor={COLORS.textBody}
            style={{ borderColor: COLORS.inputBorder, borderRadius: RADIUS.md, marginTop: 12 }}
            onPress={() => router.back()}
          >
            Cancel
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
  subtitle: { color: COLORS.inverseMuted, fontSize: 13.5, marginTop: 6, textAlign: 'center' },
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
