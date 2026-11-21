
import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Text } from 'react-native-paper';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface RiskEntry {
  id?: string;
  assessedAt?: string;
  createdAt?: string;
  riskTier?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
  riskScore?: number;
  fusedScore?: number;
  notes?: string | null;
  triggeredBy?: string;
}

export interface RiskHistoryCardProps {
  entries?: RiskEntry[];
  patientName?: string;
  riskTier?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
  fusedScore?: number;
  assessedAt?: string;
  notes?: string | null;
  onEntryPress?: (entry: RiskEntry) => void;
}

export const RiskHistoryCard: React.FC<RiskHistoryCardProps> = ({
  entries,
  patientName,
  riskTier: singleTier = 'LOW',
  fusedScore: singleScore = 0,
  assessedAt: singleDate,
  notes: singleNotes,
  onEntryPress,
}) => {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Severe pulse animation
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.5, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 600, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulseAnim]);

  const list: RiskEntry[] = entries && entries.length > 0
    ? entries
    : [{ riskTier: singleTier, fusedScore: singleScore, assessedAt: singleDate ?? new Date().toISOString(), notes: singleNotes }];

  const getTierColor = (tier: string = 'LOW') => {
    switch (tier.toUpperCase()) {
      case 'CRITICAL': return COLORS.red;
      case 'HIGH': return COLORS.red;
      case 'MEDIUM': return COLORS.amber;
      default: return COLORS.emerald;
    }
  };

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <View style={styles.container}>
      {patientName && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Risk Assessment History</Text>
          <Text style={styles.headerSub}>{patientName}</Text>
        </View>
      )}

      {list.map((item, index) => {
        const tier = (item.riskTier ?? 'LOW').toUpperCase();
        const color = getTierColor(tier);
        const score = item.fusedScore ?? item.riskScore ?? 0;
        const scorePercent = Math.min(Math.max(score > 1 ? score : score * 100, 0), 100);
        const dateStr = item.assessedAt ?? item.createdAt ?? new Date().toISOString();
        const key = item.id ?? `risk-${index}`;
        const isExpanded = expandedId === key;
        const isCritical = tier === 'HIGH' || tier === 'CRITICAL';

        return (
          <TouchableOpacity
            key={key}
            activeOpacity={0.8}
            onPress={() => {
              toggleExpand(key);
              if (onEntryPress) onEntryPress(item);
            }}
          >
            <Animated.View
              style={[
                styles.card,
                { borderColor: color },
                isCritical && { opacity: pulseAnim },
              ]}
            >
              {/* Timeline Indicator Dot */}
              <View style={styles.timelineRow}>
                <View style={[styles.dot, { backgroundColor: color }]} />
                <View style={styles.content}>
                  <View style={styles.topRow}>
                    <Text style={styles.date}>{new Date(dateStr).toLocaleDateString()}</Text>
                    <View style={[styles.badge, { backgroundColor: `${color}20`, borderColor: color }]}>
                      <Text style={[styles.badgeText, { color }]}>{tier}</Text>
                    </View>
                  </View>

                  {/* Fused Score Bar */}
                  <View style={styles.scoreRow}>
                    <Text style={styles.scoreLabel}>Risk Score: {scorePercent.toFixed(0)}%</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${scorePercent}%`, backgroundColor: color }]} />
                    </View>
                  </View>

                  {/* Triggered factor */}
                  {item.triggeredBy && (
                    <Text style={styles.triggeredText}>Triggered by: {item.triggeredBy}</Text>
                  )}

                  {/* Expanded Notes */}
                  {isExpanded && item.notes ? (
                    <View style={styles.notesBox}>
                      <Text style={styles.notesText}>{item.notes}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </Animated.View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  container: { marginVertical: SPACING.sm },
  header: { marginBottom: SPACING.md },
  headerTitle: { color: COLORS.textDark, fontSize: TYPOGRAPHY.sizes.md, fontWeight: '700' },
  headerSub: { color: COLORS.textBody, fontSize: 11 },
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
  },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start' },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, marginRight: SPACING.sm },
  content: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { color: COLORS.textDark, fontSize: TYPOGRAPHY.sizes.sm, fontWeight: '700' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.round, borderWidth: 1 },
  badgeText: { fontSize: 10, fontWeight: '800' },
  scoreRow: { marginTop: 8 },
  scoreLabel: { color: COLORS.textBody, fontSize: 11, fontWeight: '600', marginBottom: 4 },
  barTrack: { height: 6, backgroundColor: COLORS.bg, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  triggeredText: { color: COLORS.teal, fontSize: 11, fontStyle: 'italic', marginTop: 6 },
  notesBox: { marginTop: 8, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: COLORS.inputBorder },
  notesText: { color: COLORS.textBody, fontSize: 12, lineHeight: 18 },
}));
