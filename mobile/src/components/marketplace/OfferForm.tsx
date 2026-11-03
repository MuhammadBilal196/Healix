import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import { durationLabel, estimateExplanation, pkr, serviceEstimate } from '../../utils/pricing';
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, SegmentedButtons, Text } from 'react-native-paper';
import { z } from 'zod';
import { PriceType, SubmitOfferDto, NurseOffer } from '../../types/marketplace';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../theme';
import { localDateTime } from '../../utils/dates';

// Derived from backend validation: submitOfferSchema
const offerSchema = z.object({
  price: z.number().positive('Price must be greater than 0'),
  priceType: z.enum(['HOURLY', 'DAILY', 'FIXED']),
  message: z.string().optional(),
});

interface Props {
  onSubmit: (data: SubmitOfferDto) => void;
  isSubmitting: boolean;
  defaultProposedStart: string;
  initialOffer?: NurseOffer;
  /** Requested visit length, used to preview what the patient will see. */
  durationMinutes?: number;
}

export const OfferForm: React.FC<Props> = ({ onSubmit, isSubmitting, defaultProposedStart, initialOffer, durationMinutes }) => {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const [priceStr, setPriceStr] = useState(initialOffer ? String(initialOffer.price) : '');
  const [priceType, setPriceType] = useState<PriceType>(initialOffer?.priceType || 'HOURLY');
  const [message, setMessage] = useState(initialOffer?.message || '');
  const [error, setError] = useState<string | null>(null);
  const initial = new Date(initialOffer?.proposedStart || defaultProposedStart);
  const validInitial = Number.isFinite(initial.getTime()) && initial.getTime() > Date.now() ? initial : new Date(Date.now() + 3600000);
  const [startDate, setStartDate] = useState(`${validInitial.getFullYear()}-${String(validInitial.getMonth()+1).padStart(2,'0')}-${String(validInitial.getDate()).padStart(2,'0')}`);
  const [startTime, setStartTime] = useState(`${String(validInitial.getHours()).padStart(2,'0')}:${String(validInitial.getMinutes()).padStart(2,'0')}`);

  const handleSubmit = () => {
    setError(null);
    const parsedPrice = Number(priceStr);
    const proposed = localDateTime(startDate, startTime);
    if (!proposed || proposed.getTime() <= Date.now()) { setError('Enter a valid future date and time.'); return; }

    const result = offerSchema.safeParse({
      price: parsedPrice,
      priceType,
      message: message.trim() || undefined,
    });

    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    onSubmit({
      price: result.data.price,
      priceType: result.data.priceType,
      message: result.data.message,
      proposedStart: proposed.toISOString(),
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{initialOffer ? 'Update your offer' : 'Submit an Offer'}</Text>
      <TextInput mode="outlined" label="Start date (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} style={styles.input} textColor={COLORS.textDark} />
      <TextInput mode="outlined" label="Start time (HH:mm, device time zone)" value={startTime} onChangeText={setStartTime} style={styles.input} textColor={COLORS.textDark} />
      
      <View style={styles.field}>
        <Text style={styles.label}>Rate Type</Text>
        <SegmentedButtons
          value={priceType}
          onValueChange={(val) => setPriceType(val as PriceType)}
          buttons={[
            { value: 'HOURLY', label: 'Hourly' },
            { value: 'DAILY', label: 'Daily' },
            { value: 'FIXED', label: 'Fixed' },
          ]}
          style={styles.segmented}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Price (PKR)</Text>
        <TextInput
          mode="outlined"
          value={priceStr}
          onChangeText={setPriceStr}
          keyboardType="numeric"
          placeholder="e.g. 1500"
          style={styles.input}
          outlineColor={COLORS.inputBorder}
          activeOutlineColor={COLORS.navy}
          textColor={COLORS.textDark}
        />
        {Number(priceStr) > 0 && durationMinutes ? (
          <Text style={styles.previewText}>
            The patient will see: {estimateExplanation(Number(priceStr), priceType, durationMinutes)} = PKR {pkr(serviceEstimate(Number(priceStr), priceType, durationMinutes))} for this {durationLabel(durationMinutes)} visit, plus the platform fee.
          </Text>
        ) : null}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Message (Optional)</Text>
        <TextInput
          mode="outlined"
          value={message}
          onChangeText={setMessage}
          placeholder="Why are you a good fit?"
          multiline
          numberOfLines={3}
          style={styles.input}
          outlineColor={COLORS.inputBorder}
          activeOutlineColor={COLORS.navy}
          textColor={COLORS.textDark}
        />
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={isSubmitting}
        style={styles.submitBtn}
        buttonColor={COLORS.navy}
      >
        {initialOffer ? 'Update Offer' : 'Submit Offer'}
      </Button>
    </View>
  );
};

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  container: {
    backgroundColor: COLORS.surfaceCard,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    marginTop: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textDark,
    marginBottom: SPACING.md,
  },
  field: {
    marginBottom: SPACING.md,
  },
  label: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textBody,
    marginBottom: SPACING.xs,
  },
  segmented: {
    backgroundColor: COLORS.transparent,
  },
  input: {
    backgroundColor: COLORS.surface,
  },
  errorText: {
    color: COLORS.red,
    marginBottom: SPACING.md,
    fontSize: 12,
  },
  submitBtn: {
    marginTop: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  previewText: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary, marginTop: SPACING.xs },
}));
