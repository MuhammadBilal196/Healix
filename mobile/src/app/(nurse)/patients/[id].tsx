
import { useAppTheme, useThemeValue } from '../../../theme/ThemeProvider';
import type { ThemeColors } from '../../../theme';
import React from 'react';
import { SafeAreaView, StyleSheet, View, Text, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { navigate } from '../../../utils/navigation';
import { usePatientProfile } from '../../../hooks/usePatient';
import { PatientMedicalSummaryCard } from '../../../components/nurse/PatientMedicalSummaryCard';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { SPACING, TYPOGRAPHY } from '../../../theme';

export default function PatientDetailScreen() {
  const { dark: isDarkTheme } = useAppTheme();

  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: patientProfile, isLoading, error } = usePatientProfile(id || '');

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigate('/(nurse)/patients')} style={{ marginRight: 12 }}>
            <Text style={{ color: COLORS.textDark, fontSize: 24 }}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Loading...</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.emerald} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !patientProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigate('/(nurse)/patients')} style={{ marginRight: 12 }}>
            <Text style={{ color: COLORS.textDark, fontSize: 24 }}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Patient Medical Profile</Text>
        </View>
        <EmptyState title="Patient Not Found" subtitle="Could not retrieve details for this patient." />
      </SafeAreaView>
    );
  }

  const formattedPatient = {
    patientName: patientProfile.user?.fullName || 'Unknown',
    dob: (patientProfile.dob || patientProfile.dateOfBirth) ? new Date(patientProfile.dob || patientProfile.dateOfBirth!).toISOString().split('T')[0] : 'N/A',
    gender: patientProfile.gender || 'N/A',
    allergies: patientProfile.allergies || [],
    chronicConditions: patientProfile.medicalConditions?.map((c: any) => ({ name: c })) || [],
    emergencyContacts: patientProfile.emergencyContacts || [],
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigate('/(nurse)/patients')} style={{ marginRight: 12 }}>
          <Text style={{ color: COLORS.textDark, fontSize: 24 }}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{formattedPatient.patientName}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
        <PatientMedicalSummaryCard patient={formattedPatient} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.emeraldLight,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: { color: COLORS.textDark, fontSize: TYPOGRAPHY.sizes.lg, fontWeight: '700' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
}));
