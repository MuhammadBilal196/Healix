
import { useAppTheme, useThemeValue } from '../../../theme/ThemeProvider';
import type { ThemeColors } from '../../../theme';
import { useState } from 'react';
import { StyleSheet, View, ScrollView, SafeAreaView, RefreshControl, TouchableOpacity, StatusBar } from 'react-native';
import { Text } from 'react-native-paper';
import { navigate } from '../../../utils/navigation';
import { useAuthStore } from '../../../store/auth';
import { useNurseVisits } from '../../../hooks/useVisits';
import { VisitSummaryCard } from '../../../components/visits/VisitSummaryCard';
import { Visit } from '../../../types/visit';
import { SPACING } from '../../../theme';

const FILTERS: Array<{ key: string; label: string }> = [
  { key: 'ALL', label: 'All' },
  { key: 'SCHEDULED', label: 'Scheduled' },
  { key: 'IN_PROGRESS', label: 'Active' },
  { key: 'COMPLETED', label: 'Done' },
];

export default function NurseVisitsScreen() {
  const { dark: isDarkTheme } = useAppTheme();

  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const { user } = useAuthStore();
  const nurseId = user?.nurseId || user?.id || '';
  const { data: visits, isLoading, error, refetch } = useNurseVisits(nurseId);
  const [filter, setFilter] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const filtered = (visits || []).filter((v: Visit) => {
    if (filter === 'ALL') return true;
    return v.status === filter;
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} />
      <View style={styles.headerBox}>
        <Text style={styles.headerTitle}>Assigned Visits</Text>
        <Text style={styles.headerSub}>Manage your care schedule</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.emerald} />}
      >
        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.pill, filter === f.key && styles.pillActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.pillText, filter === f.key && styles.pillTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* States */}
        {isLoading && !refreshing && (
          <View style={styles.centered}>
            <Text style={styles.mutedText}>Loading visits...</Text>
          </View>
        )}

        {error && (
          <View style={styles.centered}>
            <Text style={styles.errorText}>Failed to load visits</Text>
            <Text style={styles.mutedText}>{(error as Error).message}</Text>
          </View>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>No Visits</Text>
            <Text style={styles.mutedText}>
              {filter === 'ALL' ? 'You have no assigned visits yet.' : `No ${filter.toLowerCase()} visits.`}
            </Text>
          </View>
        )}

        {/* Visit Cards */}
        {filtered.map((visit: Visit) => (
          <VisitSummaryCard
            key={visit.id}
            visit={visit}
            onPress={() => navigate(`/(nurse)/visits/${visit.id}`)}
          />
        ))}
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
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  pill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.inputBorder },
  pillActive: { backgroundColor: COLORS.emerald, borderColor: COLORS.emerald },
  pillText: { fontSize: 12, fontWeight: '600', color: COLORS.textBody },
  pillTextActive: { color: COLORS.onAccent, fontWeight: '700' },
  centered: { flex: 1, alignItems: 'center', paddingTop: 60 },
  mutedText: { color: COLORS.textBody, fontSize: 13, textAlign: 'center', marginTop: 4 },
  emptyTitle: { color: COLORS.textMuted, fontSize: 18, fontWeight: '700' },
  errorText: { color: COLORS.red, fontSize: 15, fontWeight: '600' },
}));

