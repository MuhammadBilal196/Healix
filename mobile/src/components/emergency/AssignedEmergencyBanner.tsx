import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../theme';
import { apiClient } from '../../api/client';
import { emergencyApi } from '../../api/emergency.api';
import { useAuthStore } from '../../store/auth';
import { navigate } from '../../utils/navigation';

const ACTIVE = ['PENDING', 'DISPATCHED', 'EN_ROUTE', 'ARRIVED'];

/** Tells a doctor an emergency was assigned to them, so it is never missed on another screen. */
export function AssignedEmergencyBanner() {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);
  const user = useAuthStore(state => state.user);
  const isDoctor = user?.role === 'DOCTOR';
  const events = useQuery({ queryKey: ['emergency', 'events', user?.id], queryFn: () => apiClient.get<any[]>('/emergency/events'), enabled: isDoctor, refetchInterval: 10000 });
  const dispatches = useQuery({ queryKey: ['emergency', 'dispatches', user?.id], queryFn: emergencyApi.list, enabled: isDoctor, refetchInterval: 10000 });

  const awaitingTransport = (events.data || []).filter((e: any) => !e.dispatches?.length).length;
  const activeTrips = (dispatches.data || []).filter(d => ACTIVE.includes(d.status)).length;
  if (!isDoctor || (awaitingTransport === 0 && activeTrips === 0)) return null;

  const parts = [
    awaitingTransport ? `${awaitingTransport} emergency${awaitingTransport > 1 ? ' cases' : ''} need your decision` : '',
    activeTrips ? `${activeTrips} ambulance trip${activeTrips > 1 ? 's' : ''} in progress` : '',
  ].filter(Boolean);

  return (
    <TouchableOpacity accessibilityRole="button" style={styles.card} onPress={() => navigate('/(doctor)/emergency')}>
      <View style={styles.icon}><Ionicons name="alert-circle" size={24} color={COLORS.red} /></View>
      <View style={styles.body}>
        <Text style={styles.title}>Emergency assigned to you</Text>
        <Text style={styles.text}>{parts.join(' · ')}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.red} />
    </TouchableOpacity>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.redLight, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.red, padding: SPACING.lg, marginBottom: SPACING.lg },
  icon: { width: 40, height: 40, borderRadius: RADIUS.md, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 2 },
  title: { ...TYPOGRAPHY.bodyMedium, fontWeight: '700', color: COLORS.red },
  text: { ...TYPOGRAPHY.bodySmall, color: COLORS.textPrimary },
});
