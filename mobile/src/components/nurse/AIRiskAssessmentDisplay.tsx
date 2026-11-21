
import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../theme';

interface AIRiskAssessmentDisplayProps {
  riskTier: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  fusedScore: number;
  factors?: string[];
  recommendations?: string[];
  escalationRequired?: boolean;
  onEscalatePress?: () => void;
}

export const AIRiskAssessmentDisplay: React.FC<AIRiskAssessmentDisplayProps> = ({
  riskTier = 'LOW',
  fusedScore = 0.2,
  factors = ['Elevated blood pressure', 'Irregular heart rate'],
  recommendations = ['Monitor vitals every 4 hours', 'Notify attending doctor if BP > 140/90'],
  escalationRequired = false,
  onEscalatePress,
}) => {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const isHigh = riskTier === 'HIGH';
  const isMed = riskTier === 'MEDIUM';

  const tierColor = isHigh ? COLORS.red : isMed ? COLORS.amber : COLORS.emerald;
  const tierBg = isHigh ? COLORS.redLight : isMed ? COLORS.amberLight : COLORS.emeraldLight;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Text style={styles.sparkleIcon}>✨</Text>
          <Text style={styles.title}>AI Clinical Risk Analysis</Text>
        </View>
        <View style={[styles.tierBadge, { backgroundColor: tierBg, borderColor: tierColor }]}>
          <Text style={[styles.tierText, { color: tierColor }]}>{riskTier} RISK</Text>
        </View>
      </View>

      <View style={styles.scoreRow}>
        <Text style={styles.scoreLabel}>Fused Risk Score:</Text>
        <Text style={[styles.scoreValue, { color: tierColor }]}>{(fusedScore * 100).toFixed(0)}%</Text>
      </View>

      {/* Contributing Factors */}
      {factors && factors.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Contributing Risk Factors:</Text>
          {factors.map((f, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{f}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Clinical Recommendations:</Text>
          {recommendations.map((r, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.bulletCheck}>✓</Text>
              <Text style={styles.bulletText}>{r}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Doctor Escalation Action */}
      {(escalationRequired || isHigh) && onEscalatePress && (
        <TouchableOpacity style={styles.escalateBtn} onPress={onEscalatePress} activeOpacity={0.8}>
          <Text style={styles.escalateBtnText}>🚨 Escalate to Doctor Immediately</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sparkleIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  title: {
    color: COLORS.textDark,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '700',
  },
  tierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.round,
    borderWidth: 1,
  },
  tierText: {
    fontSize: 10,
    fontWeight: '800',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  scoreLabel: {
    color: COLORS.textBody,
    fontSize: 12,
    marginRight: 8,
  },
  scoreValue: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '800',
  },
  section: {
    marginTop: SPACING.sm,
  },
  sectionHeading: {
    color: COLORS.textDark,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  bulletDot: {
    color: COLORS.amber,
    marginRight: 6,
  },
  bulletCheck: {
    color: COLORS.emerald,
    fontSize: 11,
    marginRight: 6,
  },
  bulletText: {
    color: COLORS.textBody,
    fontSize: 11,
    flex: 1,
  },
  escalateBtn: {
    backgroundColor: COLORS.redFill,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  escalateBtnText: {
    color: COLORS.onAccent,
    fontSize: 12,
    fontWeight: '700',
  },
}));
