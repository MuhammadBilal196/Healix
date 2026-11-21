import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView, StatusBar, FlatList } from 'react-native';
import { Card, Chip } from 'react-native-paper';
import { navigate } from '../../utils/navigation';
import { useAdminAuditLogs } from '../../hooks/useAdmin';
import { SPACING, RADIUS } from '../../theme';

export default function AdminAuditLogs() {
  const { dark: isDarkTheme } = useAppTheme();
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const { data: auditLogsRaw, isLoading } = useAdminAuditLogs();
  const auditLogs = Array.isArray(auditLogsRaw) ? auditLogsRaw : (auditLogsRaw as any)?.logs || [];

  const renderItem = ({ item: log }: any) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.logHeader}>
          <Chip style={styles.actionChip} textStyle={{ color: COLORS.navy, fontSize: 10, fontWeight: '800' }}>
            {log.action}
          </Chip>
          <Text style={styles.logTime}>{new Date(log.createdAt).toLocaleString()}</Text>
        </View>
        <Text style={styles.logDesc}>{log.reason || log.details || `${log.entityType || 'System'} operation executed`}</Text>
        {(log.admin?.fullName || log.adminId) && (
          <Text style={styles.logUser}>Admin: {log.admin?.fullName || log.adminId}</Text>
        )}
        {(log.targetUser?.fullName || log.targetUserId || log.userId) && (
          <Text style={styles.logUser}>Target: {log.targetUser?.fullName || log.targetUserId || log.userId}</Text>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigate('/admin')} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Back to Command Center</Text>
          </TouchableOpacity>
          <Text style={styles.title}>System Audit Trail</Text>
          <Text style={styles.subtitle}>HIPAA-compliant logs of administrative actions and overrides</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator color={COLORS.navy} size="large" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={auditLogs}
            keyExtractor={(item: any, idx: number) => item.id || String(idx)}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={() => (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>📜</Text>
                <Text style={styles.emptyTitle}>Audit Log Active</Text>
                <Text style={styles.emptySub}>All administrative actions and credential overrides will appear here.</Text>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.surface },
  container: { flex: 1, backgroundColor: COLORS.surface, padding: SPACING.lg },
  listContent: { paddingBottom: 40 },
  header: { marginBottom: 16 },
  backBtn: { marginBottom: 8 },
  backText: { color: COLORS.navy, fontSize: 13, fontWeight: '700' },
  title: { color: COLORS.textDark, fontSize: 22, fontWeight: '800' },
  subtitle: { color: COLORS.textBody, fontSize: 12.5, marginTop: 4 },
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    marginBottom: 12,
  },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  actionChip: { backgroundColor: COLORS.blueLight },
  logTime: { color: COLORS.textMuted, fontSize: 11 },
  logDesc: { color: COLORS.textDark, fontSize: 13, fontWeight: '600', marginTop: 8 },
  logUser: { color: COLORS.textBody, fontSize: 11.5, marginTop: 4 },
  emptyCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyTitle: { color: COLORS.textDark, fontSize: 16, fontWeight: '700' },
  emptySub: { color: COLORS.textBody, fontSize: 12.5, textAlign: 'center', marginTop: 4 },
});
