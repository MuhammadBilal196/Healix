import { useAppTheme, useThemeValue } from '../../../theme/ThemeProvider';
import type { ThemeColors } from '../../../theme';
import { appAlert, confirmAction } from '../../../components/common/AppDialogs';
import { estimateExplanation, pkr } from '../../../utils/pricing';
import React from 'react';
import { View, StyleSheet, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useListingOffers, useSelectOffer, useRejectOffer, useFavoriteNurses, useToggleFavoriteNurse } from '../../../hooks/useMarketplace';
import { useAuthStore } from '../../../store/auth';
import { marketplaceApi } from '../../../api/marketplace.api';
import { OfferCard } from '../../../components/marketplace/OfferCard';
import { SPACING, TYPOGRAPHY } from '../../../theme';

/**
 * Patient Marketplace — Offer Review Screen
 *
 * Shows all offers submitted by nurses for a specific marketplace listing.
 * Patient can compare offers and select one, triggering contract creation.
 *
 * Replaces the obsolete (patient)/explore/compare.tsx
 * Full UI implementation coming in Phase 10C Step 8.
 */
export default function ListingOffersScreen() {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const { id } = useLocalSearchParams<{ id: string }>();
  const listingId = id || '';
  const router = useRouter();

  const { data: offers, isLoading, error, refetch } = useListingOffers(listingId, {
    pollingInterval: 15000, // Poll for new offers every 15s
  });

  const selectOffer = useSelectOffer();
  const patientId = useAuthStore(state => state.user?.patientId) || '';
  const favorites = useFavoriteNurses(patientId);
  const favorite = useToggleFavoriteNurse(patientId);
  const reject = useRejectOffer();
  const handleFavorite = async (nurseId: string) => { try { await favorite.mutateAsync({ nurseId, remove: !!favorites.data?.some(row => row.nurseId === nurseId) }); } catch(e:any) { appAlert('Could not save favorite',e.message); } };
  const handleReject = async (offerId: string) => { if (!await confirmAction('Reject offer?', 'This offer will no longer be available for selection.')) return; try { await reject.mutateAsync(offerId); } catch(e:any) { appAlert('Could not reject offer',e.message); } };

  const handleSelectOffer = async (offerId: string) => {
    if (!listingId) return;
    try {
      const offer = offers?.find(item => item.id === offerId);
      if (!offer) return;
      const preview = await marketplaceApi.getCostPreview({price:offer.price,priceType:offer.priceType,durationHours:(offer.priceDurationMinutes || 60)/60});
      const minutes = offer.priceDurationMinutes || 60;
      if (!await confirmAction('Select this offer?', `${estimateExplanation(offer.price, offer.priceType, minutes)} = PKR ${pkr(preview.serviceCost)}\nPlatform fee (${preview.feePercentage}%): PKR ${pkr(preview.platformFee)}\nTotal per visit: PKR ${pkr(preview.total)}\n\nThis creates a contract that you and the nurse both need to approve.`)) return;
      const res: any = await selectOffer.mutateAsync({ listingId, offerId });
      const contractId = res?.contractId || res?.data?.contractId;
      if (contractId) {
        router.replace(`/(patient)/marketplace/contracts/${contractId}` as any);
      } else {
        router.replace('/(patient)/(tabs)/requests');
      }
    } catch (err: any) {
      appAlert('Error', err.message || 'Failed to select offer');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.primaryText} size="large" />
        <Text style={styles.loadingText}>Loading offers...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load offers</Text>
        <Text style={styles.errorDetail}>{(error as Error).message}</Text>
      </View>
    );
  }

  if (!offers || offers.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyIcon}>⏳</Text>
        <Text style={styles.emptyText}>Waiting for nurse offers...</Text>
        <Text style={styles.emptySubtext}>Offers will appear here as nurses respond to your listing.</Text>
      </View>
    );
  }

  const offersByNurse = Object.values(offers.reduce<Record<string, typeof offers>>((groups, offer) => {
    (groups[offer.nurseId] ??= []).push(offer);
    return groups;
  }, {})).sort((left, right) => (right[0]?.bestMatchScore ?? 0) - (left[0]?.bestMatchScore ?? 0));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Review Offers</Text>
      <Text style={styles.subtitle}>{offers.length} offer{offers.length !== 1 ? 's' : ''} received</Text>

      {offersByNurse.map((nurseOffers) => <View key={nurseOffers[0].nurseId}>
        <Text style={styles.nurseHeading}>{nurseOffers[0].nurse?.user?.fullName || 'Nurse'} · {nurseOffers.length} offer{nurseOffers.length === 1 ? '' : 's'}</Text>
        {nurseOffers.map((offer) => <OfferCard
          key={offer.id}
          offer={offer}
          isPatientView={true}
          onSelect={handleSelectOffer}
          onReject={handleReject}
          onFavorite={handleFavorite}
          isFavorite={favorites.data?.some(row => row.nurseId === offer.nurseId)}
          busy={favorite.isPending || reject.isPending}
          isSelecting={selectOffer.isPending && selectOffer.variables?.offerId === offer.id}
        />)}
      </View>)}
    </ScrollView>
  );
}

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  content: { padding: SPACING.lg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.surface, padding: SPACING.xl },
  title: { ...TYPOGRAPHY.h2, color: COLORS.textDark, marginBottom: SPACING.xs },
  subtitle: { ...TYPOGRAPHY.bodyMedium, color: COLORS.textBody, marginBottom: SPACING.lg },
  nurseHeading: { ...TYPOGRAPHY.h3, color: COLORS.primaryText, marginBottom: SPACING.sm, marginTop: SPACING.md },
  loadingText: { ...TYPOGRAPHY.bodyMedium, color: COLORS.textBody, marginTop: SPACING.md },
  errorText: { ...TYPOGRAPHY.h3, color: COLORS.red, marginBottom: SPACING.xs },
  errorDetail: { ...TYPOGRAPHY.bodySmall, color: COLORS.textBody },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.md },
  emptyText: { ...TYPOGRAPHY.h3, color: COLORS.textDark, marginBottom: SPACING.xs },
  emptySubtext: { ...TYPOGRAPHY.bodySmall, color: COLORS.textBody, textAlign: 'center' },
}));
