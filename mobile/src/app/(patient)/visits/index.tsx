
import { useAppTheme, useThemeValue } from '../../../theme/ThemeProvider';
import type { ThemeColors } from '../../../theme';
import { useState, useMemo } from 'react';
import { StyleSheet, View, ScrollView, SafeAreaView, RefreshControl, StatusBar, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { navigate } from '../../../utils/navigation';
import { useAuthStore } from '../../../store/auth';
import { useCareRequests } from '../../../hooks/useCareRequests';
import { VisitStatusBadge } from '../../../components/visits/VisitStatusBadge';
import { SPACING, RADIUS } from '../../../theme';

/**
 * Patient Visits Screen
 * 
 * The backend does NOT have a GET /patients/:id/visits endpoint.
 * Visits are linked to CareRequests; each accepted CareRequest creates a Visit.
 * We fetch the patient's care requests and filter those that have an associated visit.
 */
export default function PatientVisitsScreen() {
  const { dark: isDarkTheme } = useAppTheme();

  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const { user } = useAuthStore();
  const { data: requests, isLoading, error, refetch } = useCareRequests();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Care requests that have progressed to having a visit
  // The visit data is embedded in the care request's contract/visit relation
  const requestsWithVisits = useMemo(() => {
    if (!requests) return [];
    return requests.filter((r) => !!(r.visit?.id || r.visits?.length));
  }, [requests]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} />
      <View style={styles.headerBox}>
        <Text style={styles.headerTitle}>My Visits</Text>
        <Text style={styles.headerSub}>Track your care visits</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.emerald} />}
      >
        {isLoading && !refreshing && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.emerald} />
            <Text style={styles.mutedText}>Loading visits...</Text>
          </View>
        )}

        {error && (
          <View style={styles.centered}>
            <Text style={styles.errorText}>Failed to load visits</Text>
          </View>
        )}

        {!isLoading && !error && requestsWithVisits.length === 0 && (
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>No Visits Yet</Text>
            <Text style={styles.mutedText}>Your visits will appear here once a care request is accepted.</Text>
          </View>
        )}

        {requestsWithVisits.map((req: any) => {
          const visit = req.visit || req.visits?.[0];
          const scheduledAt = req.scheduledAt ? new Date(req.scheduledAt).toLocaleString() : 'Pending';
          const status = visit?.status || req.status;

          return (
            <TouchableOpacity
              key={req.id}
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => {
                if (visit?.id) {
                  navigate(`/(patient)/visits/${visit.id}`);
                }
              }}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardType}>{req.requirements || (req.type === 'NURSE_VISIT' ? 'Nurse Visit' : 'Care Visit')}</Text>
                  <Text style={styles.cardDate}>🕐 {scheduledAt}</Text>
                </View>
                {status && <VisitStatusBadge status={status} />}
              </View>
              {req.notes && <Text style={styles.cardNotes} numberOfLines={2}>{req.notes}</Text>}
              {!!visit?.id && ['SCHEDULED', 'ACCEPTED'].includes(visit.status) && <Text style={styles.cardNotes}>Open to show your QR code to the nurse</Text>}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  headerBox: { padding: 20, paddingBottom: 24 },
  headerTitle: { color: COLORS.textDark, fontSize: 24, fontWeight: '800' },
  headerSub: { color: COLORS.emerald, fontSize: 14, marginTop: 6, fontWeight: '600' },
  scroll: { flex: 1, backgroundColor: COLORS.surfaceCard, borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden' },
  scrollContent: { padding: 20, paddingBottom: 40, paddingTop: 24 },
  centered: { alignItems: 'center', paddingTop: 60 },
  mutedText: { color: COLORS.textBody, fontSize: 13, textAlign: 'center', marginTop: 4 },
  emptyTitle: { color: COLORS.textMuted, fontSize: 18, fontWeight: '700' },
  errorText: { color: COLORS.red, fontSize: 15, fontWeight: '600' },
  card: {
    backgroundColor: COLORS.surfaceCard,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    marginBottom: SPACING.lg,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardInfo: { flex: 1 },
  cardType: { color: COLORS.textDark, fontSize: 15, fontWeight: '700' },
  cardDate: { color: COLORS.textBody, fontSize: 12, marginTop: 4 },
  cardNotes: { color: COLORS.textBody, fontSize: 12, marginTop: 8 },
}));
