
import { useAppTheme, useThemeValue } from '../../../theme/ThemeProvider';
import type { ThemeColors } from '../../../theme';
import { VisitCompletionPanel } from '../../../components/visits/VisitCompletionPanel';
import { appAlert } from '../../../components/common/AppDialogs';
import { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, StatusBar, Alert, TextInput, TouchableOpacity, Platform } from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { goBack } from '../../../utils/navigation';
import { useVisitDetail, useCompleteVisit, useSaveVisitNotes } from '../../../hooks/useVisits';
import { VisitInfoCard } from '../../../components/visits/VisitInfoCard';
import { VisitActionPanel } from '../../../components/visits/VisitActionPanel';
import { QrScanner } from '../../../components/visits/verification/QrScanner';
import { GpsVerification } from '../../../components/visits/verification/GpsVerification';
import { ManualVerification } from '../../../components/visits/verification/ManualVerification';
import { VitalsForm } from '../../../components/visits/clinical/VitalsForm';
import { SymptomsForm } from '../../../components/visits/clinical/SymptomsForm';
import { ClinicalRemarksForm } from '../../../components/visits/clinical/ClinicalRemarksForm';
import { visitsApi } from '../../../api/visits.api';
import { RADIUS, SPACING } from '../../../theme';

type ActivePanel = 'none' | 'verify' | 'qr' | 'vitals' | 'symptoms' | 'remarks';

export default function NurseVisitDetailScreen() {
  const { dark: isDarkTheme } = useAppTheme();

  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const { id } = useLocalSearchParams<{ id: string }>();
  const visitId = id || '';
  const router = useRouter();

  // Server state via React Query â€” polls every 10s while visit is active
  const { data: visit, isLoading, error, refetch } = useVisitDetail(visitId, { pollingInterval: 10000 });
  const completeVisit = useCompleteVisit();
  const saveNotes = useSaveVisitNotes();

  // Local UI state
  const [activePanel, setActivePanel] = useState<ActivePanel>('none');
  const [notes, setNotes] = useState('');
  const [notesInitialized, setNotesInitialized] = useState(false);

  const [actionError, setActionError] = useState('');
  const [accepting, setAccepting] = useState(false);
  useEffect(() => { if (visit && !notesInitialized) { setNotes(visit.notes || ''); setNotesInitialized(true); } }, [visit, notesInitialized]);
  const accept = async () => { setAccepting(true); setActionError(''); try { await visitsApi.acceptVisit(visitId); await refetch(); } catch(e: any) { setActionError(e.message); } finally { setAccepting(false); } };

  const handleVerificationSuccess = useCallback(() => {
    setActivePanel('none');
    refetch();
  }, [refetch]);

  const handleClinicalSuccess = useCallback(() => {
    setActivePanel('none');
    refetch();
  }, [refetch]);

  const handleComplete = async () => {
    if (!visit || !visit.vitals || visit.vitals.length === 0) {
      if (Platform.OS === 'web') alert('Error: Vitals must be recorded before completing the visit.');
      else appAlert('Error', 'Vitals must be recorded before completing the visit.');
      return;
    }
    if (!visit.symptoms || visit.symptoms.length === 0) {
      if (Platform.OS === 'web') alert('Error: Symptoms must be recorded before completing the visit.');
      else appAlert('Error', 'Symptoms must be recorded before completing the visit.');
      return;
    }
    if (!visit.clinicalRemark) {
      if (Platform.OS === 'web') alert('Error: Clinical remarks must be recorded before completing the visit.');
      else appAlert('Error', 'Clinical remarks must be recorded before completing the visit.');
      return;
    }

    if (Platform.OS === 'web') {
      const confirm = window.confirm('Are you sure you want to complete this visit?');
      if (confirm) {
        try {
          await completeVisit.mutateAsync(visitId);
          // Check out straight away: the patient can only approve the visit after check-out.
          await visitsApi.checkOutVisit(visitId).catch(() => undefined);
          alert('Visit completed and checked out. The patient can now approve it.');
          router.replace('/(nurse)/(tabs)/visits');
        } catch (err: any) {
          alert('Error: ' + (err.message || 'Failed to complete visit.'));
        }
      }
    } else {
      appAlert('Complete Visit', 'Are you sure you want to complete this visit?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              await completeVisit.mutateAsync(visitId);
              // Check out straight away: the patient can only approve the visit after check-out.
              await visitsApi.checkOutVisit(visitId).catch(() => undefined);
              appAlert('Completed', 'Visit completed and checked out. The patient can now approve it.');
              router.replace('/(nurse)/(tabs)/visits');
            } catch (err: any) {
              appAlert('Error', err.message || 'Failed to complete visit. Ensure clinical data is recorded.');
            }
          },
        },
      ]);
    }
  };

  const handleSaveNotes = async () => {
    try {
      await saveNotes.mutateAsync({ visitId, notes });
      appAlert('Saved', 'Visit notes updated.');
    } catch (err: any) {
      appAlert('Error', err.message || 'Failed to save notes.');
    }
  };

  // â”€â”€â”€ Loading / Error States â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (isLoading && !visit) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} backgroundColor={COLORS.bg} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.emerald} />
          <Text style={styles.loadingText}>Loading visit details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !visit) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} backgroundColor={COLORS.bg} />
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error ? (error as Error).message : 'Visit not found'}</Text>
          <Button mode="text" textColor={COLORS.emerald} onPress={() => refetch()}>Retry</Button>
        </View>
      </SafeAreaView>
    );
  }

  // â”€â”€â”€ Verification Panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (activePanel === 'qr') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} backgroundColor={COLORS.bg} />
        <QrScanner visitId={visitId} onSuccess={handleVerificationSuccess} onCancel={() => setActivePanel('verify')} />
      </SafeAreaView>
    );
  }

  // â”€â”€â”€ Main Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} backgroundColor={COLORS.bg} />

      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Visit Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {!!actionError && <Text style={{ color: COLORS.red }}>{actionError}</Text>}
        {visit.status === 'SCHEDULED' && <Button mode="contained" loading={accepting} disabled={accepting} onPress={() => void accept()}>Accept assigned visit</Button>}
        {/* Visit Info */}
        <VisitInfoCard visit={visit} />
        <VisitCompletionPanel visit={visit} onChanged={refetch} />

        {/* Verification Selector (when in verify mode) */}
        {activePanel === 'verify' && (visit.status === 'SCHEDULED' || visit.status === 'ACCEPTED') && (
          <View style={styles.verificationPanel}>
            <Text style={styles.panelTitle}>Select Verification Method</Text>
            <Text style={styles.panelSub}>Verify the patient before starting clinical workflow.</Text>

            <Button
              mode="contained"
              buttonColor={COLORS.emeraldFill}
              textColor={COLORS.textMuted}
              onPress={() => setActivePanel('qr')}
              style={styles.verifyBtn}
              labelStyle={{ fontWeight: '700' }}
            >
              Scan QR Code (Recommended)
            </Button>

            <GpsVerification visitId={visitId} onSuccess={handleVerificationSuccess} />
            <ManualVerification visitId={visitId} onSuccess={handleVerificationSuccess} />

            <Button mode="text" textColor={COLORS.textBody} onPress={() => setActivePanel('none')}>
              Back to verification methods
            </Button>
          </View>
        )}

        {/* Clinical Forms (expanded inline) */}
        {activePanel === 'vitals' && visit.status === 'IN_PROGRESS' && (
          <VitalsForm visitId={visitId} onSuccess={handleClinicalSuccess} existingVitals={visit.vitals} />
        )}
        {activePanel === 'symptoms' && visit.status === 'IN_PROGRESS' && (
          <SymptomsForm visitId={visitId} onSuccess={handleClinicalSuccess} existingSymptoms={visit.symptoms} />
        )}
        {activePanel === 'remarks' && visit.status === 'IN_PROGRESS' && (
          <ClinicalRemarksForm visitId={visitId} onSuccess={handleClinicalSuccess} existingRemark={visit.clinicalRemark} />
        )}

        {/* Action Panel (when no sub-panel is active) */}
        {activePanel === 'none' && (
          <VisitActionPanel
            visit={visit}
            onVerify={() => setActivePanel('verify')}
            onRecordVitals={() => setActivePanel('vitals')}
            onRecordSymptoms={() => setActivePanel('symptoms')}
            onRecordRemarks={() => setActivePanel('remarks')}
            onComplete={handleComplete}
            isCompleting={completeVisit.isPending}
          />
        )}

        {/* Notes Section */}
        {['SCHEDULED', 'ACCEPTED', 'IN_PROGRESS'].includes(visit.status) && (
          <View style={styles.notesCard}>
            <Text style={styles.notesTitle}>Visit Notes</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Enter clinical notes..."
              placeholderTextColor={COLORS.textBody}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <Button
              mode="outlined"
              textColor={COLORS.emerald}
              style={styles.saveNotesBtn}
              onPress={handleSaveNotes}
              loading={saveNotes.isPending}
              labelStyle={{ fontWeight: '700' }}
            >
              Save Notes
            </Button>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.lg },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backIcon: { color: COLORS.textDark, fontSize: 28 },
  headerTitle: { color: COLORS.onAccent, fontSize: 17, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: COLORS.textBody, marginTop: 10, fontSize: 14 },
  errorText: { color: COLORS.red, fontSize: 15, fontWeight: '600', marginBottom: 10 },
  verificationPanel: { marginBottom: SPACING.lg },
  panelTitle: { color: COLORS.textDark, fontSize: 18, fontWeight: '800', marginBottom: 8 },
  panelSub: { color: COLORS.textBody, fontSize: 13, marginBottom: 16 },
  verifyBtn: { borderRadius: RADIUS.md, marginBottom: SPACING.md },
  notesCard: { backgroundColor: COLORS.bg, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.emeraldLight, padding: SPACING.lg, marginBottom: SPACING.lg },
  notesTitle: { color: COLORS.textDark, fontSize: 15, fontWeight: '700', marginBottom: 12 },
  notesInput: { backgroundColor: COLORS.bg, color: COLORS.textDark, borderWidth: 1, borderColor: COLORS.emeraldLight, padding: 12, borderRadius: RADIUS.md, fontSize: 13, minHeight: 100 },
  saveNotesBtn: { borderColor: COLORS.emerald, marginTop: 10 },
}));

