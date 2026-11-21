
import { useAppTheme, useThemeValue } from '../../../theme/ThemeProvider';
import type { ThemeColors } from '../../../theme';
import { VisitCompletionPanel } from '../../../components/visits/VisitCompletionPanel';
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { Text, Button, ActivityIndicator, TextInput, Switch } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { goBack } from '../../../utils/navigation';
import { useVisitDetail, useQrToken, useConfirmArrival } from '../../../hooks/useVisits';
import { VisitInfoCard } from '../../../components/visits/VisitInfoCard';
import { VisitStatusBadge } from '../../../components/visits/VisitStatusBadge';
import { visitsApi } from '../../../api/visits.api';
import { SPACING, RADIUS } from '../../../theme';

export default function PatientVisitDetailScreen() {
  const { dark: isDarkTheme } = useAppTheme();

  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const { id } = useLocalSearchParams<{ id: string }>();
  const visitId = id || '';

  const { data: visit, isLoading, error, refetch } = useVisitDetail(visitId, { pollingInterval: 15000 });
  const { data: qrData, isLoading: qrLoading, refetch: refetchQr } = useQrToken(visitId);
  const confirmArrival = useConfirmArrival();
  const [actionError, setActionError] = useState(''); const [stars, setStars] = useState('5'); const [reviewText, setReview] = useState(''); const [recommend, setRecommend] = useState(true); const [reviewing, setReviewing] = useState(false);
  const review = async () => { if (!Number.isInteger(Number(stars)) || Number(stars) < 1 || Number(stars) > 5) { setActionError('Enter a whole star rating from 1 to 5.'); return; } setReviewing(true); setActionError(''); try { await visitsApi.submitReview(visitId, { stars: Number(stars), reviewText: reviewText.trim() || undefined, recommend }); await refetch(); } catch(e: any) { setActionError(e.message); } finally { setReviewing(false); } };

  if (isLoading && !visit) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.emerald} />
          <Text style={styles.loadingText}>Loading visit...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !visit) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} />
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error ? (error as Error).message : 'Visit not found'}</Text>
          <Button mode="text" textColor={COLORS.emerald} onPress={() => refetch()}>Retry</Button>
        </View>
      </SafeAreaView>
    );
  }

  const isActive = visit.status === 'SCHEDULED' || visit.status === 'ACCEPTED';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} />

      <View style={styles.headerRow}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Visit Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <VisitInfoCard visit={visit} />
        <VisitCompletionPanel visit={visit} onChanged={refetch} />
        {!!actionError && <Text style={{ color: COLORS.red }}>{actionError}</Text>}
        {isActive && !visit.patientConfirmed && <><Text style={styles.qrSubtitle}>Confirm only after your assigned nurse arrives. This enables manual verification if QR or GPS cannot be used.</Text><Button mode="contained" loading={confirmArrival.isPending} disabled={confirmArrival.isPending} onPress={async () => { setActionError(''); try { await confirmArrival.mutateAsync(visitId); } catch(e: any) { setActionError(e.message); } }}>Confirm nurse has arrived</Button></>}
        {visit.patientConfirmed && <Text style={styles.summaryItem}>Arrival confirmed</Text>}
        {visit.status === 'COMPLETED' && visit.nurseId && <View style={styles.completedCard}>{visit.review ? <><Text style={styles.completedTitle}>Your feedback: {visit.review.stars}/5</Text><Text style={styles.qrSubtitle}>{visit.review.reviewText}</Text></> : <><Text style={styles.completedTitle}>Rate your nurse</Text><TextInput mode="outlined" outlineColor={COLORS.inputBorder} activeOutlineColor={COLORS.navy} textColor={COLORS.textDark} style={{ backgroundColor: COLORS.surfaceCard, marginBottom: 8 }} label="Stars (1–5)" value={stars} onChangeText={setStars} keyboardType="number-pad" /><TextInput mode="outlined" outlineColor={COLORS.inputBorder} activeOutlineColor={COLORS.navy} textColor={COLORS.textDark} style={{ backgroundColor: COLORS.surfaceCard, marginBottom: 8 }} label="Review (optional)" value={reviewText} onChangeText={setReview} multiline /><Text style={styles.qrSubtitle}>Would you recommend this nurse?</Text><Switch value={recommend} onValueChange={setRecommend} /><Button mode="contained" buttonColor={COLORS.navy} textColor={COLORS.onAccent} loading={reviewing} disabled={reviewing} onPress={() => void review()}>Submit feedback</Button></>}</View>}

        {/* QR Code for nurse verification */}
        {isActive && (
          <View style={styles.qrSection}>
            <Text style={styles.qrTitle}>Your Visit QR Code</Text>
            <Text style={styles.qrSubtitle}>
              Show this to your nurse when they arrive to verify your identity.
            </Text>

            <View style={styles.qrCard}>
              {qrLoading ? (
                <ActivityIndicator size="large" color={COLORS.emerald} />
              ) : qrData?.token ? (
                <View style={styles.qrWrapper}>
                  <QRCode value={qrData.token} size={200} color={COLORS.textMuted} backgroundColor={COLORS.surfaceCard} />
                  <Text style={styles.tokenPreview}>{qrData.token.substring(0, 16)}...</Text>
                </View>
              ) : (
                <View style={styles.qrError}>
                  <Text style={styles.qrErrorText}>QR code not available</Text>
                  <Button mode="outlined" textColor={COLORS.emerald} style={{ borderColor: COLORS.emerald, marginTop: 8 }} onPress={() => refetchQr()}>
                    Retry
                  </Button>
                </View>
              )}
            </View>

            <Button
              mode="contained"
              buttonColor={COLORS.emeraldFill}
              textColor={COLORS.onAccent}
              style={styles.refreshBtn}
              onPress={() => refetchQr()}
              labelStyle={{ fontWeight: '700' }}
            >
              Refresh QR Code
            </Button>
          </View>
        )}

        {/* Visit Status Summary */}
        {visit.status === 'COMPLETED' && (
          <View style={styles.completedCard}>
            <Text style={styles.completedTitle}>✅ Visit Completed</Text>
            {visit.completedAt && (
              <Text style={styles.completedDate}>
                Completed on {new Date(visit.completedAt).toLocaleString()}
              </Text>
            )}
            {(visit.vitals?.length ?? 0) > 0 && <Text style={styles.summaryItem}>✓ Vitals recorded</Text>}
            {(visit.symptoms?.length ?? 0) > 0 && <Text style={styles.summaryItem}>✓ Symptoms documented</Text>}
            {visit.clinicalRemark && <Text style={styles.summaryItem}>✓ Clinical remarks submitted</Text>}
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
  headerTitle: { color: COLORS.textDark, fontSize: 17, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: COLORS.textBody, marginTop: 10, fontSize: 14 },
  errorText: { color: COLORS.red, fontSize: 15, fontWeight: '600', marginBottom: 10 },
  qrSection: { alignItems: 'center', marginBottom: SPACING.xl },
  qrTitle: { color: COLORS.textDark, fontSize: 20, fontWeight: '800', marginBottom: 8 },
  qrSubtitle: { color: COLORS.textBody, fontSize: 13, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  qrCard: {
    backgroundColor: COLORS.surfaceCard,
    padding: 24,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    width: 260,
    minHeight: 280,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 24,
  },
  qrWrapper: { alignItems: 'center' },
  tokenPreview: { color: COLORS.textBody, fontSize: 11, marginTop: 16, fontFamily: 'monospace' },
  qrError: { alignItems: 'center' },
  qrErrorText: { color: COLORS.textBody, fontSize: 13 },
  refreshBtn: { width: '100%', borderRadius: RADIUS.md },
  completedCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  completedTitle: { color: COLORS.emerald, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  completedDate: { color: COLORS.textBody, fontSize: 12, marginBottom: 12 },
  summaryItem: { color: COLORS.emerald, fontSize: 13, fontWeight: '600', marginBottom: 4 },
}));
