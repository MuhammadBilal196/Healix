
import { useAppTheme, useThemeValue } from '../../../theme/ThemeProvider';
import type { ThemeColors } from '../../../theme';
import { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Text } from 'react-native-paper';
import { navigate } from '../../../utils/navigation';
import { useAuthStore } from '../../../store/auth';
import { useCareRequests } from '../../../hooks/useCareRequests';
import { useDashboardSummary } from '../../../hooks/useDashboard';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../../theme';

export default function NotificationsScreen() {
  const { dark: isDarkTheme } = useAppTheme();

  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const { user } = useAuthStore();
  const patientId = user?.patientId || '';

  const { data: requests = [] } = useCareRequests();
  const { data: dashboardSummary } = useDashboardSummary(patientId);

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const [markedRead, setMarkedRead] = useState<Record<string, boolean>>({});

  // Derive dynamic notification list from real care requests and risk assessments
  const dynamicNotifications: any[] = [];

  if (dashboardSummary?.latestRisk) {
    const risk = dashboardSummary.latestRisk;
    dynamicNotifications.push({
      id: 'risk-notif-1',
      title: `AI Clinical Risk Tier: ${risk.riskTier}`,
      body: risk.notes || `Fused risk score calculated at ${(risk.fusedScore * 100).toFixed(0)}%.`,
      time: (risk as any).createdAt || (risk as any).assessedAt ? new Date((risk as any).createdAt || (risk as any).assessedAt).toLocaleDateString() : 'Recent',
      unread: !markedRead['risk-notif-1'],
      icon: '🚨',
      bgColor: risk.riskTier === 'HIGH' ? COLORS.redLight : COLORS.emeraldLight,
      route: '/(patient)/records/risk-history',
    });
  }

  (requests || []).forEach((req) => {
    let title = 'Care Visit Update';
    let body = `Request ${req.id.substring(0, 8).toUpperCase()} status is ${req.status}.`;
    let icon = '📋';
    let bgColor = COLORS.blueLight;

    if (req.status === 'ASSIGNED') {
      title = 'Staff Assigned to Visit';
      body = `Provider assigned for your  visit on ${req.scheduledAt ? new Date(req.scheduledAt).toLocaleString() : 'TBD'}.`;
      icon = '🩺';
      bgColor = COLORS.emeraldLight;
    } else if (req.status === 'IN_PROGRESS') {
      title = 'Care Visit In Progress';
      body = 'Your healthcare provider has arrived and checked in.';
      icon = '🟢';
      bgColor = COLORS.amberLight;
    } else if (req.status === 'COMPLETED') {
      title = 'Care Visit Completed';
      body = 'Visit summary and vitals have been saved to your health vault.';
      icon = '✅';
      bgColor = COLORS.purpleLight;
    }

    dynamicNotifications.push({
      id: `req-notif-${req.id}`,
      title,
      body,
      time: req.scheduledAt ? new Date(req.scheduledAt).toLocaleDateString() : 'Scheduled',
      unread: !markedRead[`req-notif-${req.id}`],
      icon,
      bgColor,
      route: `/(patient)/requests/${req.id}`,
    });
  });

  const handleMarkAllRead = () => {
    const allReadMap: Record<string, boolean> = {};
    dynamicNotifications.forEach(n => { allReadMap[n.id] = true; });
    setMarkedRead(allReadMap);
  };

  const filteredNotifications = dynamicNotifications.filter(n => {
    if (activeFilter === 'UNREAD') return n.unread;
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} />
      <View style={styles.container}>
        
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAllReadText}>Mark all as read</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterPill, activeFilter === 'ALL' && styles.filterPillActive]}
            onPress={() => setActiveFilter('ALL')}
          >
            <Text style={[styles.filterText, activeFilter === 'ALL' && styles.filterTextActive]}>
              All ({dynamicNotifications.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, activeFilter === 'UNREAD' && styles.filterPillActive]}
            onPress={() => setActiveFilter('UNREAD')}
          >
            <Text style={[styles.filterText, activeFilter === 'UNREAD' && styles.filterTextActive]}>
              Unread ({dynamicNotifications.filter(n => n.unread).length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* List */}
        <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.notificationCard,
                  item.unread && styles.notificationCardUnread,
                ]}
                onPress={() => navigate(item.route as any)}
                activeOpacity={0.8}
              >
                <View style={[styles.iconBg, { backgroundColor: item.bgColor }]}>
                  <Text style={styles.iconText}>{item.icon}</Text>
                </View>

                <View style={styles.contentWrap}>
                  <View style={styles.titleRow}>
                    <Text style={styles.notifTitle}>{item.title}</Text>
                    <Text style={styles.notifTime}>{item.time}</Text>
                  </View>
                  <Text style={styles.notifBody}>{item.body}</Text>
                </View>

                {item.unread && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptySub}>
                Updates on care visits, prescriptions, and AI risk alerts will appear here.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    flex: 1,
    padding: SPACING.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  headerTitle: {
    color: COLORS.textDark,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '700',
  },
  markAllReadText: {
    color: COLORS.emerald,
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  filterPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  filterPillActive: {
    backgroundColor: COLORS.emerald,
    borderColor: COLORS.emerald,
  },
  filterText: {
    color: COLORS.textBody,
    fontSize: 12,
    fontWeight: '600',
  },
  filterTextActive: {
    color: COLORS.onAccent,
    fontWeight: '700',
  },
  listContainer: {
    paddingBottom: 40,
    gap: SPACING.md,
  },
  notificationCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  notificationCardUnread: {
    borderColor: COLORS.accentBlue,
    backgroundColor: COLORS.surfaceCard,
  },
  iconBg: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  iconText: {
    fontSize: 18,
  },
  contentWrap: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  notifTitle: {
    color: COLORS.textDark,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '700',
    flex: 1,
    marginRight: SPACING.xs,
  },
  notifTime: {
    color: COLORS.textBody,
    fontSize: 10,
  },
  notifBody: {
    color: COLORS.textBody,
    fontSize: 11,
    lineHeight: 15,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.emerald,
    marginLeft: SPACING.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 12,
  },
  emptyTitle: {
    color: COLORS.textDark,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '700',
  },
  emptySub: {
    color: COLORS.textBody,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 16,
  },
}));

