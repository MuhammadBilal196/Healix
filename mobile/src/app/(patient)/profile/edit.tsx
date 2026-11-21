import { useAppTheme, useThemeValue } from '../../../theme/ThemeProvider';
import type { ThemeColors } from '../../../theme';
import { localDateTime } from '../../../utils/dates';
import { appAlert } from '../../../components/common/AppDialogs';
import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { navigate } from '../../../utils/navigation';
import { useAuthStore } from '../../../store/auth';
import { usePatientProfile, useUpdatePatientProfile } from '../../../hooks/usePatient';
import { SPACING, RADIUS } from '../../../theme';
import { LoadingState } from '../../../components/common/LoadingState';
import { ErrorState } from '../../../components/common/ErrorState';

export default function ProfileEditScreen() {
  const { dark: isDarkTheme } = useAppTheme();

  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const { user, loadUser } = useAuthStore();
  const patientId = user?.patientId || '';

  const { data: patientProfile, isLoading: isFetching, error: fetchError, refetch } = usePatientProfile(patientId);
  const { mutateAsync: updateProfile, isPending: isUpdating } = useUpdatePatientProfile();

  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [city,setCity] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  useEffect(() => {
    if (patientProfile) {
      setFullName(patientProfile.user?.fullName || user?.fullName || '');
      setDob(patientProfile.dob ? new Date(patientProfile.dob).toISOString().split('T')[0] : '');
      setGender(patientProfile.gender || '');
      setAddress(patientProfile.address || '');
      setCity(patientProfile.city || '');
      setLatitude(patientProfile.latitude?.toString() || '');
      setLongitude(patientProfile.longitude?.toString() || '');
    }
  }, [patientProfile, user]);

  const isDobValid = (val: string) => {
    if (!val) return true;
    const parsed = localDateTime(val); return !!parsed && parsed.getTime() <= Date.now();
  };

  const isFormValid = () => {
    if (fullName.trim().length < 3) return false;
    if (dob && !isDobValid(dob)) return false;
    if (latitude && (!Number.isFinite(Number(latitude)) || Math.abs(Number(latitude)) > 90)) return false;
    if (longitude && (!Number.isFinite(Number(longitude)) || Math.abs(Number(longitude)) > 180)) return false;
    return true;
  };

  const handleSave = async () => {
    if (!isFormValid() || !patientId) return;

    const payload: any = {
      fullName: fullName.trim(),
      gender: gender.trim() || undefined,
      address: address.trim() || undefined,
      city: city.trim() || null,
      dob: dob ? new Date(dob) : undefined,
    };

    if (latitude.trim() && longitude.trim()) { payload.latitude=Number(latitude);payload.longitude=Number(longitude); }
    else if (!latitude.trim() && !longitude.trim()) {payload.latitude=null;payload.longitude=null;}
    else {appAlert('Location incomplete','Enter both coordinates or clear both.');return;}

    try {
      await updateProfile({ patientId, data: payload });
      await loadUser(); // Update global auth user name just in case
      appAlert('Success', 'Profile updated successfully.');
      navigate('/(patient)/(tabs)/profile');
    } catch (err: any) {
      appAlert('Update Failed', err.message || 'Could not update profile.');
    }
  };

  if (isFetching && !patientProfile) return <LoadingState message="Loading profile data..." />;
  if (fetchError) return <ErrorState error={fetchError as Error} onRetry={refetch} />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>

        <Text style={styles.subtitle}>Update your personal details and routing coordinates</Text>

        <View style={styles.card}>
          <TextInput
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            mode="outlined"
            error={fullName.length > 0 && fullName.trim().length < 3}
            style={styles.input}
            outlineColor={COLORS.emeraldLight}
            activeOutlineColor={COLORS.emerald}
            textColor={COLORS.textDark}
            theme={{ colors: { onSurfaceVariant: COLORS.textBody } }}
          />
          {fullName.length > 0 && fullName.trim().length < 3 && (
            <HelperText type="error" visible={true} style={styles.errorHelper}>
              Full name must be at least 3 characters long
            </HelperText>
          )}

          <TextInput
            label="Date of Birth (YYYY-MM-DD)"
            value={dob}
            placeholder="e.g. 1995-12-30"
            placeholderTextColor={COLORS.textBody}
            onChangeText={setDob}
            mode="outlined"
            error={dob.length > 0 && !isDobValid(dob)}
            style={styles.input}
            outlineColor={COLORS.emeraldLight}
            activeOutlineColor={COLORS.emerald}
            textColor={COLORS.textDark}
            theme={{ colors: { onSurfaceVariant: COLORS.textBody } }}
          />
          {dob.length > 0 && !isDobValid(dob) && (
            <HelperText type="error" visible={true} style={styles.errorHelper}>
              Must be YYYY-MM-DD format
            </HelperText>
          )}

          <TextInput
            label="Gender"
            value={gender}
            placeholder="e.g. Male, Female"
            placeholderTextColor={COLORS.textBody}
            onChangeText={setGender}
            mode="outlined"
            style={styles.input}
            outlineColor={COLORS.emeraldLight}
            activeOutlineColor={COLORS.emerald}
            textColor={COLORS.textDark}
            theme={{ colors: { onSurfaceVariant: COLORS.textBody } }}
          />

          <TextInput mode="outlined" label="City (visible in the nurse marketplace)" value={city} onChangeText={setCity} textColor={COLORS.textPrimary} style={styles.input} />
          <TextInput
            label="Address"
            value={address}
            placeholder="e.g. House 12, Street 5, DHA Phase 6"
            placeholderTextColor={COLORS.textBody}
            onChangeText={value=>{setAddress(value);setLatitude('');setLongitude('');}}
            mode="outlined"
            multiline
            numberOfLines={2}
            style={styles.input}
            outlineColor={COLORS.emeraldLight}
            activeOutlineColor={COLORS.emerald}
            textColor={COLORS.textDark}
            theme={{ colors: { onSurfaceVariant: COLORS.textBody } }}
          />

          <View style={styles.row}>
            <TextInput
              label="Latitude"
              value={latitude}
              placeholder="e.g. 31.5204"
              placeholderTextColor={COLORS.textBody}
              onChangeText={setLatitude}
              mode="outlined"
              keyboardType="numeric"
              style={[styles.input, { flex: 1, marginRight: 8 }]}
              error={latitude.length > 0 && isNaN(Number(latitude))}
              outlineColor={COLORS.emeraldLight}
              activeOutlineColor={COLORS.emerald}
              textColor={COLORS.textDark}
              theme={{ colors: { onSurfaceVariant: COLORS.textBody } }}
            />
            <TextInput
              label="Longitude"
              value={longitude}
              placeholder="e.g. 74.3587"
              placeholderTextColor={COLORS.textBody}
              onChangeText={setLongitude}
              mode="outlined"
              keyboardType="numeric"
              style={[styles.input, { flex: 1, marginLeft: 8 }]}
              error={longitude.length > 0 && isNaN(Number(longitude))}
              outlineColor={COLORS.emeraldLight}
              activeOutlineColor={COLORS.emerald}
              textColor={COLORS.textDark}
              theme={{ colors: { onSurfaceVariant: COLORS.textBody } }}
            />
          </View>
          {(latitude.length > 0 && isNaN(Number(latitude))) || (longitude.length > 0 && isNaN(Number(longitude))) ? (
            <HelperText type="error" visible={true} style={styles.errorHelper}>
              Coordinates must be valid numbers
            </HelperText>
          ) : null}

          <Button
            mode="contained"
            onPress={handleSave}
            loading={isUpdating}
            disabled={isUpdating || !isFormValid()}
            style={styles.saveBtn}
            buttonColor={COLORS.emeraldFill}
            textColor={COLORS.onAccent}
          >
            Save Profile
          </Button>

          <Button
            mode="outlined"
            onPress={() => navigate('/(patient)/(tabs)/profile')}
            style={styles.cancelBtn}
            textColor={COLORS.emerald}
          >
            Cancel
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.surface },
  container: { flexGrow: 1, padding: SPACING.lg, paddingBottom: 60, maxWidth: 800, width: '100%', alignSelf: 'center' },
  headerRow: { marginTop: SPACING.md, marginBottom: SPACING.xs },
  headerTitle: { color: COLORS.textDark, fontSize: 28, fontWeight: '800' },
  subtitle: { color: COLORS.textBody, fontSize: 14, marginBottom: SPACING.xl },
  card: { backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.inputBorder },
  input: { marginBottom: 4, marginTop: 8, backgroundColor: COLORS.surfaceCard },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  errorHelper: { color: COLORS.red, fontSize: 12, marginBottom: 8 },
  saveBtn: { marginTop: SPACING.xl, paddingVertical: 6, borderRadius: RADIUS.md },
  cancelBtn: { marginTop: SPACING.sm, paddingVertical: 6, borderRadius: RADIUS.md, borderColor: COLORS.inputBorder },
}));


