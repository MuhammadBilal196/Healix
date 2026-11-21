import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';

import { View, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { Text, Card, Chip, Appbar, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAdminReviews, useModerateReview } from '../../hooks/useAdmin';
import { SPACING, RADIUS } from '../../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AdminModeration() {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const router = useRouter();

  const { data: reviews, isLoading } = useAdminReviews();
  const moderateMutation = useModerateReview();

  const handleModerate = (id: string, action: 'APPROVED' | 'HIDDEN') => {
    moderateMutation.mutate({ id, action });
  };

  const renderContent = () => {
    if (isLoading) return <ActivityIndicator color={COLORS.navy} style={{ marginTop: 20 }} />;
    if (!reviews?.length) return <Text style={styles.emptyText}>No reviews found</Text>;

    return reviews.map(rev => {
      const isHidden = rev.status === 'HIDDEN' || (rev as any).flagged;
      const rating = rev.rating ?? (rev as any).stars ?? 5;
      const reviewerId = (rev.reviewerId || (rev as any).patientId)?.slice(0, 8) || 'N/A';
      const targetId = (rev.targetId || (rev as any).nurseId)?.slice(0, 8) || 'N/A';
      const comment = rev.comment || (rev as any).reviewText || 'No comment';

      return (
        <Card key={rev.id} style={styles.card}>
          <Card.Content>
            <View style={styles.row}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="star" size={16} color={COLORS.amber} />
                <Text style={styles.ratingText}>{rating}/5</Text>
              </View>
              <Chip
                textStyle={{ fontSize: 10, color: COLORS.onAccent, fontWeight: '700' }}
                style={{ backgroundColor: isHidden ? COLORS.redFill : COLORS.emeraldFill }}
              >
                {isHidden ? 'HIDDEN' : (rev.status || 'APPROVED')}
              </Chip>
            </View>
            <Text style={styles.cardSub}>Reviewer ID: {reviewerId} | Target ID: {targetId}</Text>
            <Text style={styles.comment}>"{comment}"</Text>

            {!isHidden ? (
              <View style={styles.actionRow}>
                <Button
                  mode="outlined"
                  textColor={COLORS.red}
                  style={{ borderColor: COLORS.red, borderRadius: RADIUS.md }}
                  onPress={() => handleModerate(rev.id, 'HIDDEN')}
                >
                  Hide (Flag)
                </Button>
              </View>
            ) : (
              <View style={styles.actionRow}>
                <Button
                  mode="contained"
                  buttonColor={COLORS.emeraldFill}
                  textColor={COLORS.onAccent}
                  style={{ borderRadius: RADIUS.md }}
                  onPress={() => handleModerate(rev.id, 'APPROVED')}
                >
                  Approve (Unflag)
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>
      );
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={{ backgroundColor: COLORS.navyDark }}>
        <Appbar.BackAction onPress={() => router.back()} color={COLORS.headerText} />
        <Appbar.Content title="Review Moderation" titleStyle={{ color: COLORS.headerText, fontWeight: '700' }} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  content: { padding: SPACING.md, gap: 12, paddingBottom: 40 },
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  ratingText: { color: COLORS.amber, fontSize: 14, fontWeight: '700', marginLeft: 4 },
  cardSub: { color: COLORS.textBody, fontSize: 12, marginBottom: 8 },
  comment: { color: COLORS.textDark, fontSize: 14, fontStyle: 'italic', marginBottom: 12 },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-start' },
  emptyText: { color: COLORS.textBody, textAlign: 'center', marginTop: 40, fontSize: 15 },
});
