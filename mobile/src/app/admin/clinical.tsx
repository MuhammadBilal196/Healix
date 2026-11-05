
import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import { useState } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { Text, Card, Chip, Appbar, Button, Portal, Dialog, TextInput } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAdminCases, useOverrideCaseAssignment } from '../../hooks/useAdmin';
import { SPACING, RADIUS } from '../../theme';

type TabType = 'UNASSIGNED' | 'ASSIGNED' | 'IN_REVIEW' | 'RESOLVED';

export default function AdminClinicalOperations() {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('UNASSIGNED');

  const { data: cases, isLoading, isError } = useAdminCases(activeTab);
  const overrideMutation = useOverrideCaseAssignment();

  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [doctorId, setDoctorId] = useState('');
  const [reason, setReason] = useState('');

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
        {['UNASSIGNED', 'ASSIGNED', 'IN_REVIEW', 'RESOLVED'].map((tab) => (
          <Chip 
            key={tab}
            selected={activeTab === tab} 
            onPress={() => setActiveTab(tab as TabType)}
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
    if (!selectedCase || !doctorId || !reason) return;
    overrideMutation.mutate({ caseId: selectedCase, doctorId, reason }, {
      onSuccess: () => {
        setSelectedCase(null);
        setDoctorId('');
        setReason('');
      }
    });
  };

  const renderContent = () => {
    if (isLoading) return <ActivityIndicator color={COLORS.emerald} style={{ marginTop: 20 }} />;
    if (isError) return <Text style={{ color: COLORS.red, textAlign: 'center', marginTop: 20 }}>Error loading clinical cases.</Text>;
    if (!cases?.length) return <Text style={styles.emptyText}>No cases found for {activeTab}</Text>;
    
    return cases.map(c => (
      <Card key={c.id} style={styles.card}>
        <Card.Content>
          <View style={styles.row}>
            <Text style={styles.cardTitle}>Case: {c.id?.slice(0, 8)}</Text>
            <Chip textStyle={{ fontSize: 10 }}>{c.status}</Chip>
          </View>
          <Text style={styles.cardSub}>Patient ID: {c.visit?.request?.patientId?.slice(0, 8) || 'N/A'}</Text>
          <Text style={styles.cardSub}>Patient: {c.visit?.request?.patient?.user?.fullName || c.visit?.request?.patientId?.slice(0, 8) || 'N/A'}</Text>
          <Text style={styles.cardSub}>Risk Tier: {c.riskTier || 'N/A'}</Text>
          
          {c.doctorId && (
            <Text style={styles.cardSub}>Assigned Dr: {c.doctor?.user?.fullName || c.doctorId.slice(0, 8)}</Text>
          )}

          {activeTab === 'UNASSIGNED' && (
            <Button 
              mode="contained" 
              style={{ marginTop: 10, backgroundColor: COLORS.emeraldLight }}
              labelStyle={{ color: COLORS.emerald }}
              onPress={() => setSelectedCase(c.id)}
            >
              Override Assignment
            </Button>
          )}
        </Card.Content>
      </Card>
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={{ backgroundColor: COLORS.bg }}>
        <Appbar.BackAction onPress={() => router.back()} color={COLORS.textDark} />
        <Appbar.Content title="Clinical Operations" titleStyle={{ color: COLORS.textDark }} />
      </Appbar.Header>
      
      {renderTabs()}
      
      <ScrollView contentContainerStyle={styles.content}>
        {renderContent()}
      </ScrollView>

      <Portal>
        <Dialog visible={!!selectedCase} onDismiss={() => setSelectedCase(null)} style={{ backgroundColor: COLORS.bg }}>
          <Dialog.Title style={{ color: COLORS.textDark }}>Assign Doctor</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Doctor ID"
              value={doctorId}
              onChangeText={setDoctorId}
              style={styles.input}
              textColor={COLORS.textDark}
              theme={{ colors: { primary: COLORS.emerald, text: COLORS.textDark, placeholder: COLORS.textBody } }}
            />
            <TextInput
              label="Reason for Override"
              value={reason}
              onChangeText={setReason}
              style={styles.input}
              textColor={COLORS.textDark}
              theme={{ colors: { primary: COLORS.emerald, text: COLORS.textDark, placeholder: COLORS.textBody } }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSelectedCase(null)} textColor={COLORS.textBody}>Cancel</Button>
            <Button onPress={handleOverride} textColor={COLORS.emerald} loading={overrideMutation.isPending}>Assign</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  tabsContainer: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.emeraldLight },
  tabsScroll: { paddingHorizontal: SPACING.md, gap: 10 },
  tab: { backgroundColor: COLORS.bg },
  activeTab: { backgroundColor: COLORS.emerald },
  tabText: { color: COLORS.textBody },
  activeTabText: { color: COLORS.textMuted, fontWeight: 'bold' },
  content: { padding: SPACING.md, gap: 12, paddingBottom: 40 },
  card: { backgroundColor: COLORS.bg, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.emeraldLight },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { color: COLORS.textDark, fontSize: 16, fontWeight: '700' },
  cardSub: { color: COLORS.textBody, fontSize: 13, marginTop: 2 },
  emptyText: { color: COLORS.textBody, textAlign: 'center', marginTop: 40, fontSize: 16 },
  input: { backgroundColor: COLORS.modalBackdrop, marginBottom: 10 },
}));
