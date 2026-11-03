import { useAppTheme, useThemeValue } from '../../../theme/ThemeProvider';
import type { ThemeColors } from '../../../theme';
import { appAlert } from '../../../components/common/AppDialogs';
import React from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '../../../store/auth';
import {
  useMarketplaceListing,
  useSubmitOffer,
  useWithdrawOffer,
  useListingOffers, useUpdateOffer,
} from '../../../hooks/useMarketplace';
import { ListingCard } from '../../../components/marketplace/ListingCard';
import { OfferForm } from '../../../components/marketplace/OfferForm';
import { OfferCard } from '../../../components/marketplace/OfferCard';
import { SubmitOfferDto } from '../../../types/marketplace';
import { SPACING, TYPOGRAPHY } from '../../../theme';

export default function NurseListingDetailScreen() {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const { id } = useLocalSearchParams<{ id: string }>();
  const listingId = id || '';
  const router = useRouter();
  const { user } = useAuthStore();
  const nurseId = user?.nurseId;

  const { listing, isLoading, isError } = useMarketplaceListing(listingId);
  const submitOffer = useSubmitOffer();
  const withdrawOffer = useWithdrawOffer();
  const ownOffers = useListingOffers(listingId, { pollingInterval: 15000 });
  const updateOffer = useUpdateOffer();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.primaryText} size="large" />
      </View>
    );
  }

  if (isError || !listing) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Listing not found</Text>
      </View>
    );
  }

  // Find if nurse has already submitted an offer on this listing
  const existingOffer = ownOffers.data?.find(o => o.nurseId === nurseId && o.status === 'PENDING');

  const handleSubmit = async (data: SubmitOfferDto) => {
    try {
      if (existingOffer) await updateOffer.mutateAsync({ offerId: existingOffer.id, data });
      else await submitOffer.mutateAsync({ listingId, data });
      appAlert('Success', 'Offer submitted successfully!');
      router.back();
    } catch (err: any) {
      appAlert('Error', err.message || 'Failed to submit offer');
    }
  };

  const handleWithdraw = async (offerId: string) => {
    try {
      await withdrawOffer.mutateAsync(offerId);
      appAlert('Success', 'Offer withdrawn.');
    } catch (err: any) {
      appAlert('Error', err.message || 'Failed to withdraw offer');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Listing Details</Text>
      
      <ListingCard listing={listing} />

      <View style={styles.section}>
        {ownOffers.isError && <Text style={styles.errorText}>Could not load your offers. Try again.</Text>}
        {ownOffers.data?.filter(o => o.status !== 'PENDING').map(o => <OfferCard key={o.id} offer={o} />)}
        {existingOffer ? (
          <>
            <Text style={styles.sectionTitle}>Your Offer</Text>
            <OfferCard
              offer={existingOffer}
              isPatientView={false}
              onWithdraw={handleWithdraw}
              isWithdrawing={withdrawOffer.isPending}
            />
            <OfferForm key={existingOffer.id} initialOffer={existingOffer} onSubmit={handleSubmit} isSubmitting={updateOffer.isPending} defaultProposedStart={existingOffer.proposedStart} durationMinutes={listing.careRequest.durationMinutes} />
          </>
        ) : !ownOffers.isLoading && !ownOffers.isError ? (
          <OfferForm
            onSubmit={handleSubmit}
            isSubmitting={submitOffer.isPending}
            durationMinutes={listing.careRequest.durationMinutes}
            defaultProposedStart={listing.careRequest.scheduledAt || listing.careRequest.preferredDate || new Date().toISOString()}
          />
        ) : null}
      </View>
    </ScrollView>
  );
}

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  content: {
    padding: SPACING.lg,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.textDark,
    marginBottom: SPACING.md,
  },
  section: {
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textDark,
    marginBottom: SPACING.md,
  },
  errorText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.red,
  },
}));
