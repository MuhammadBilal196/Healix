
import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView, StatusBar, FlatList } from 'react-native';
import { Card } from 'react-native-paper';
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
          <Text style={styles.logAction}>{log.action}</Text>
          <Text style={styles.logTime}>{new Date(log.createdAt).toLocaleString()}</Text>
        </View>
        <Text style={styles.logDesc}>{log.reason || log.details || `${log.entityType || 'System'} operation executed`}</Text>
        {(log.admin?.fullName || log.adminId) && <Text style={styles.logUser}>Admin: {log.admin?.fullName || log.adminId}</Text>}
        {(log.targetUser?.fullName || log.targetUserId || log.userId) && <Text style={styles.logUser}>Target: {log.targetUser?.fullName || log.targetUserId || log.userId}</Text>}

      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} backgroundColor={COLORS.bg} />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigate('/admin')} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Back to Command Center</Text>
          </TouchableOpacity>
          <Text style={styles.title}>System Audit Trail</Text>
          <Text style={styles.subtitle}>HIPAA-compliant logs of administrative actions and overrides</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator color={COLORS.emerald} size="large" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={auditLogs}
            keyExtractor={(item) => item.id || Math.random().toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={() => (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>📜</Text>
                <Text style={styles.emptyTitle}>Audit Log Active</Text>
                <Text style={styles.emptySub}>No audit logs found yet. All administrative actions and credential overrides will be securely recorded here.</Text>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: SPACING.lg },
  listContent: { paddingBottom: 40 },
  header: { marginBottom: 20 },
  backBtn: { marginBottom: 8 },
  backText: { color: COLORS.emerald, fontSize: 13, fontWeight: '700' },
  title: { color: COLORS.textDark, fontSize: 20, fontWeight: '800' },
  subtitle: { color: COLORS.textBody, fontSize: 12, marginTop: 4 },
  card: { backgroundColor: COLORS.bg, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.emeraldLight, marginBottom: 12 },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logAction: { color: COLORS.textDark, fontSize: 14, fontWeight: '700' },
  logTime: { color: COLORS.emerald, fontSize: 10 },
  logDesc: { color: COLORS.textBody, fontSize: 12, marginTop: 6 },
  logUser: { color: COLORS.textBody, fontSize: 10, marginTop: 4 },
  emptyCard: { backgroundColor: COLORS.bg, borderRadius: RADIUS.lg, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: COLORS.emeraldLight },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyTitle: { color: COLORS.textDark, fontSize: 16, fontWeight: '700' },
  emptySub: { color: COLORS.textBody, fontSize: 12, textAlign: 'center', marginTop: 4 },
}));
