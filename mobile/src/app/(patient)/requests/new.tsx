import { useAppTheme, useThemeValue } from '../../../theme/ThemeProvider';
import type { ThemeColors } from '../../../theme';
import { appAlert } from '../../../components/common/AppDialogs';
import { useLocalSearchParams } from 'expo-router';
import { hasValidCoordinates } from '../../../utils/location';
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TextInput,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Text, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { goBack, navigate } from '../../../utils/navigation';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../../theme';

import { RequestTemplateSelector, RequestTemplate } from '../../../components/care/RequestTemplateSelector';
import { ScheduleTypeSelector } from '../../../components/care/ScheduleTypeSelector';
import { DateTimePreferencePicker } from '../../../components/care/DateTimePreferencePicker';
import { LocationPicker } from '../../../components/care/LocationPicker';
import { useCreateCareRequest } from '../../../hooks/useCareRequests';
import { CreateCareRequestDto, ScheduleType, TimeWindow, RecurringFrequency } from '../../../types/care';
import { useAuthStore } from '../../../store/auth';

import { usePatientProfile } from '../../../hooks/usePatient';

export default function NewCareRequestScreen() {
  const { dark: isDarkTheme } = useAppTheme();

  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const params = useLocalSearchParams<{ scheduleType?: string }>();
  const createCareRequest = useCreateCareRequest();
  const { user } = useAuthStore();
  const { data: patientProfile } = usePatientProfile(user?.patientId || '');

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Form State
  const [notes, setNotes] = useState('');
  const [requirements, setRequirements] = useState('');
  const [duration, setDuration] = useState('45');
  
  const [scheduleType, setScheduleType] = useState<ScheduleType>(params.scheduleType === 'RECURRING' ? 'RECURRING' : 'ONE_TIME');
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [selectedTimeWindow, setSelectedTimeWindow] = useState<TimeWindow | null>(null);
  
  const [location, setLocation] = useState({
    address: '',
    latitude: NaN,
    longitude: NaN,
  });

  // Effect to sync address
  React.useEffect(() => {
    if (patientProfile?.address) {
      setLocation(prev => prev.address ? prev : ({ address: patientProfile.address || '', latitude: patientProfile.latitude ?? NaN, longitude: patientProfile.longitude ?? NaN }));
    }
  }, [patientProfile]);

  const [recurringFrequency, setRecurringFrequency] = useState<RecurringFrequency>('WEEKLY');
  const [occurrencesLimit, setOccurrencesLimit] = useState('4');

  const handleSelectTemplate = (tpl: RequestTemplate | null) => {
    setSelectedTemplateId(tpl ? tpl.id : null);
    if (tpl) {
      setNotes(tpl.defaultNotes);
      setRequirements(tpl.preferredSpecialization);
      setDuration(tpl.recommendedDuration.toString());
    } else {
      setNotes('');
      setRequirements('');
      setDuration('45');
    }
  };

  const isFormValid = () => {
    if (!selectedDate) return false;
    if (!selectedTime && !selectedTimeWindow) return false;
    if (!location.address.trim() || !hasValidCoordinates(location)) return false;
    if (!Number.isInteger(Number(duration)) || Number(duration) <= 0) return false;
    if (scheduleType === 'RECURRING' && (!Number.isInteger(Number(occurrencesLimit)) || Number(occurrencesLimit) <= 0)) return false;
    return true;
  };

  const handleSubmit = () => {
    if (!isFormValid()) return;

    let timeStr: string | undefined = undefined;
    if (selectedTime) {
      timeStr = selectedTime.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' });
    }

    const payload: CreateCareRequestDto = {
      type: 'NURSE_VISIT', // Currently fixed for patient flow
      notes: notes.trim(),
      requirements: requirements.trim(),
      scheduleType,
      durationMinutes: parseInt(duration),
      location,
    };

    if (selectedDate) {
      const futureDate = new Date(selectedDate);
      if (selectedTime) {
        futureDate.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
      } else {
        futureDate.setHours(23, 59, 59, 999);
      }
      if (futureDate <= new Date()) {
        appAlert('Invalid date', 'Choose a future date and time.');
        return;
      }
      
      if (scheduleType === 'ONE_TIME') {
        payload.preferredDate = futureDate.toISOString();
      } else {
        payload.recurring = {
          startDate: futureDate.toISOString(),
          frequency: recurringFrequency,
          occurrencesLimit: parseInt(occurrencesLimit) || 4
        };
      }
    }

    if (timeStr) {
      payload.preferredStartTime = timeStr;
    } else if (selectedTimeWindow) {
      payload.preferredTimeWindow = selectedTimeWindow;
    }

    createCareRequest.mutate(payload, {
      onSuccess: () => {
        if (Platform.OS === 'web') {
          alert('Request Published! Your visit request is now live.');
          goBack();
        } else {
          appAlert('Success', 'Request Published!', [{ text: 'OK', onPress: () => goBack() }]);
        }
      },
      onError: (err: any) => {
        if (Platform.OS === 'web') {
          alert(`Error: ${err.message || 'Failed to create request'}`);
        } else {
          appAlert('Error', err.message || 'Failed to create request');
        }
      }
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} />
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientMid, COLORS.gradientEnd, COLORS.gradientEnd, COLORS.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => goBack()}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Request</Text>
          <TouchableOpacity style={styles.settingsBtn}>
            <Text style={styles.settingsBtnText}>⚙</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <Button onPress={() => navigate('/(patient)/health/home-visits')}>Need a doctor home visit? Request an appointment</Button>
          {/* Template Section */}
          <Text style={styles.sectionTitle}>Select a Template</Text>
          <RequestTemplateSelector
            selectedTemplateId={selectedTemplateId}
            onSelect={handleSelectTemplate}
          />

          {/* Notes & Requirements Card */}
          <View style={styles.glassCard}>
            <Text style={styles.label}>Notes / Description</Text>
            <TextInput
              style={[styles.glassInput, styles.textArea]}
              placeholder="Describe your medical needs..."
              placeholderTextColor={COLORS.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            <Text style={styles.label}>Special Requirements (Optional)</Text>
            <TextInput
              style={styles.glassInput}
              placeholder="e.g. Female Nurse, Wound Care Specialist"
              placeholderTextColor={COLORS.textMuted}
              value={requirements}
              onChangeText={setRequirements}
            />

            <Text style={styles.label}>Expected Duration (minutes)</Text>
            <TextInput
              style={styles.glassInput}
              placeholder="45"
              placeholderTextColor={COLORS.textMuted}
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
            />
          </View>

          {/* Schedule & Date/Time Card */}
          <View style={styles.glassCard}>
            <ScheduleTypeSelector scheduleType={scheduleType} onChange={setScheduleType} />

            <DateTimePreferencePicker
              isRecurring={false}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              selectedTime={selectedTime}
              onTimeChange={setSelectedTime}
              selectedTimeWindow={selectedTimeWindow}
              onTimeWindowChange={setSelectedTimeWindow}
            />
            
            {scheduleType === 'RECURRING' && (
              <View style={{ marginTop: SPACING.md }}>
                <Text style={styles.label}>Frequency</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                  {(['DAILY', 'WEEKLY', 'BIWEEKLY'] as RecurringFrequency[]).map(freq => (
                    <TouchableOpacity
                      key={freq}
                      style={[
                        styles.glassInput, 
                        { flex: 1, alignItems: 'center', marginBottom: 0, padding: 10 }, 
                        recurringFrequency === freq && { borderColor: COLORS.navy, backgroundColor: COLORS.navy + '20' }
                      ]}
                      onPress={() => setRecurringFrequency(freq as any)}
                    >
                      <Text style={{ color: recurringFrequency === freq ? COLORS.primaryText : COLORS.textBody, fontWeight: '600' }}>{freq}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.label}>Occurrences Limit</Text>
                <TextInput
                  style={styles.glassInput}
                  value={occurrencesLimit}
                  onChangeText={setOccurrencesLimit}
                  keyboardType="numeric"
                />
              </View>
            )}
          </View>

          {/* Location Card */}
          <View style={styles.glassCard}>
            <LocationPicker
              location={location}
              onChange={setLocation}
              savedLocation={patientProfile ? { address: patientProfile.address || '', latitude: patientProfile.latitude ?? NaN, longitude: patientProfile.longitude ?? NaN } : undefined}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, (!isFormValid() || createCareRequest.isPending) && styles.submitBtnDisabled]}
            activeOpacity={0.85}
            onPress={handleSubmit}
            disabled={!isFormValid() || createCareRequest.isPending}
          >
            <LinearGradient
              colors={[COLORS.actionStart, COLORS.actionMid, COLORS.actionEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              <Text style={styles.submitBtnLabel}>
                {createCareRequest.isPending ? 'Submitting...' : 'Submit Request'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ? StatusBar.currentHeight + SPACING.md : 44 : SPACING.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.glassSurface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  backBtnText: {
    color: COLORS.textDark,
    fontSize: 20,
    fontWeight: '600',
  },
  headerTitle: {
    color: COLORS.textDark,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '700',
  },
  settingsBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.glassSurface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  settingsBtnText: {
    color: COLORS.textDark,
    fontSize: 18,
  },
  container: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: SPACING.md,
  },
  glassCard: {
    backgroundColor: COLORS.glassSurface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    // Shadow for depth
    shadowColor: COLORS.shadowSoft,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  glassInput: {
    backgroundColor: COLORS.glassSurface,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    color: COLORS.textDark,
    fontSize: TYPOGRAPHY.sizes.md,
    marginBottom: SPACING.md,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  submitBtn: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginTop: SPACING.md,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitGradient: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.xl,
  },
  submitBtnLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '700',
    color: COLORS.onAccent,
    letterSpacing: 0.3,
  },
}));
