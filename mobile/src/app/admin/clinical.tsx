import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import { useState } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator, TouchableOpacity, Alert, Platform } from 'react-native';
import { Text, Card, Chip, Appbar, Button, Portal, Dialog, TextInput } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAdminCases, useAdminDoctors, useOverrideCaseAssignment } from '../../hooks/useAdmin';
import { SPACING, RADIUS } from '../../theme';

type TabType = 'UNASSIGNED' | 'ASSIGNED' | 'IN_REVIEW' | 'RESOLVED';

export default function AdminClinicalOperations() {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('UNASSIGNED');

  const { data: cases, isLoading, isError } = useAdminCases(activeTab);
  const { data: doctorsRaw = [] } = useAdminDoctors();
  const doctors: any[] = Array.isArray(doctorsRaw) ? doctorsRaw : (doctorsRaw as any)?.users || [];
  const verifiedDoctors = doctors.filter((d: any) => d.verificationStatus === 'VERIFIED' || d.user?.status === 'ACTIVE');

  const overrideMutation = useOverrideCaseAssignment();

  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [doctorId, setDoctorId] = useState('');
  const [reason, setReason] = useState('');

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
        {(['UNASSIGNED', 'ASSIGNED', 'IN_REVIEW', 'RESOLVED'] as const).map((tab) => (
          <Chip
            key={tab}
            selected={activeTab === tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            textStyle={activeTab === tab ? styles.activeTabText : styles.tabText}
          >
            {tab}
          </Chip>
        ))}
      </ScrollView>
    </View>
  );

  const handleOverride = () => {
    if (!selectedCase || !doctorId.trim() || reason.trim().length < 5) {
      const msg = 'Select a doctor and enter a reason (min 5 chars).';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Validation Error', msg);
      return;
    }
    overrideMutation.mutate(
      { caseId: selectedCase, doctorId: doctorId.trim(), reason: reason.trim() },
      {
        onSuccess: () => {
          setSelectedCase(null);
          setDoctorId('');
          setReason('');
        },
        onError: (err: any) => {
          const msg = err?.message || 'Failed to override assignment';
          if (Platform.OS === 'web') alert(msg);
          else Alert.alert('Error', msg);
        },
      }
    );
  };

  const renderContent = () => {
    if (isLoading) return <ActivityIndicator color={COLORS.navy} style={{ marginTop: 20 }} />;
    if (isError) return <Text style={{ color: COLORS.red, textAlign: 'center', marginTop: 20 }}>Error loading clinical cases.</Text>;
    if (!cases?.length) return <Text style={styles.emptyText}>No cases found for {activeTab}</Text>;

    return cases.map(c => (
      <Card key={c.id} style={styles.card}>
        <Card.Content>
          <View style={styles.row}>
            <Text style={styles.cardTitle}>Case: {c.id?.slice(0, 8)}</Text>
            <Chip style={styles.statusChip} textStyle={{ fontSize: 10, color: COLORS.navy, fontWeight: '700' }}>{c.status}</Chip>
          </View>
          <Text style={styles.cardSub}>Patient: {c.visit?.request?.patient?.user?.fullName || c.visit?.request?.patientId?.slice(0, 8) || 'N/A'}</Text>
          <Text style={[styles.cardSub, { color: ['HIGH', 'CRITICAL'].includes(c.riskTier) ? COLORS.red : COLORS.textBody, fontWeight: '700' }]}>
            Risk Tier: {c.riskTier || 'N/A'}
          </Text>

          {c.doctorId && (
            <Text style={styles.cardSub}>Assigned Dr: {c.doctor?.user?.fullName || c.doctorId.slice(0, 8)}</Text>
          )}

          {(activeTab === 'UNASSIGNED' || activeTab === 'ASSIGNED') && (
            <Button
              mode="contained"
              buttonColor={COLORS.navy}
              textColor={COLORS.onAccent}
              style={{ marginTop: 12, borderRadius: RADIUS.md }}
              onPress={() => { setDoctorId(c.doctorId || ''); setReason(''); setSelectedCase(c.id); }}
            >
              {c.doctorId ? 'Reassign Doctor' : 'Assign Doctor'}
            </Button>
          )}
        </Card.Content>
      </Card>
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={{ backgroundColor: COLORS.navyDark }}>
        <Appbar.BackAction onPress={() => router.back()} color={COLORS.headerText} />
        <Appbar.Content title="Clinical Operations" titleStyle={{ color: COLORS.headerText, fontWeight: '700' }} />
      </Appbar.Header>

      {renderTabs()}

      <ScrollView contentContainerStyle={styles.content}>
        {renderContent()}
      </ScrollView>

      <Portal>
        <Dialog visible={!!selectedCase} onDismiss={() => setSelectedCase(null)} style={{ backgroundColor: COLORS.surfaceCard }}>
          <Dialog.Title style={{ color: COLORS.textDark, fontWeight: '700' }}>Assign Doctor</Dialog.Title>
          <Dialog.Content>
            {verifiedDoctors.length > 0 && (
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: COLORS.textBody, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>
                  Select Registered Doctor:
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {verifiedDoctors.map((doc: any) => {
                    const selected = doctorId === doc.id;
                    return (
                      <TouchableOpacity
                        key={doc.id}
                        onPress={() => setDoctorId(doc.id)}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: RADIUS.round,
                          backgroundColor: selected ? COLORS.navy : COLORS.surfaceMuted,
                          borderWidth: 1,
                          borderColor: selected ? COLORS.navy : COLORS.inputBorder,
                        }}
                      >
                        <Text style={{ color: selected ? COLORS.onAccent : COLORS.textDark, fontSize: 12, fontWeight: '600' }}>
                          {doc.user?.fullName || doc.id.slice(0, 8)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
            <TextInput
              label="Doctor ID"
              value={doctorId}
              onChangeText={setDoctorId}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Reason for Override (min 5 chars)"
              value={reason}
              onChangeText={setReason}
              mode="outlined"
              style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSelectedCase(null)} textColor={COLORS.textBody}>Cancel</Button>
            <Button onPress={handleOverride} textColor={COLORS.navy} loading={overrideMutation.isPending}>Assign</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  tabsContainer: {
    paddingVertical: 10,
    backgroundColor: COLORS.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.inputBorder,
  },
  tabsScroll: { paddingHorizontal: SPACING.md, gap: 8 },
  tab: { backgroundColor: COLORS.surfaceMuted },
  activeTab: { backgroundColor: COLORS.navy },
  tabText: { color: COLORS.textBody, fontWeight: '600' },
  activeTabText: { color: COLORS.onAccent, fontWeight: '700' },
  content: { padding: SPACING.md, gap: 12, paddingBottom: 40 },
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { color: COLORS.textDark, fontSize: 15.5, fontWeight: '700' },
  statusChip: { backgroundColor: COLORS.blueLight },
  cardSub: { color: COLORS.textBody, fontSize: 13, marginTop: 2 },
  emptyText: { color: COLORS.textBody, textAlign: 'center', marginTop: 40, fontSize: 15 },
  input: { backgroundColor: COLORS.surfaceCard, marginBottom: 10 },
});
