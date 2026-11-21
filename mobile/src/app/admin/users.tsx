import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, TextInput, SafeAreaView, StatusBar, FlatList } from 'react-native';
import { Card, Button, Chip, Divider } from 'react-native-paper';
import { navigate } from '../../utils/navigation';
import { useAdminUsers, useUpdateUserStatus } from '../../hooks/useAdmin';
import { SPACING, RADIUS } from '../../theme';

export default function AdminUsers() {
  const { dark: isDarkTheme } = useAppTheme();
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const { data: users_raw, isLoading } = useAdminUsers();
  const users = users_raw?.users || [];
  const { mutateAsync: updateUserStatus } = useUpdateUserStatus();

  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const targetStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await updateUserStatus({ userId, status: targetStatus });
      Alert.alert('Status Updated', `User account status changed to ${targetStatus}`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Action failed');
    }
  };

  const filteredUsers = users.filter((u: any) => {
    const q = search.toLowerCase();
    const matchesSearch = !search ||
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.includes(search);
    const matchesRole = !role || u.role === role;
    return matchesSearch && matchesRole;
  });

  const renderItem = ({ item: u }: any) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.userName}>{u.fullName}</Text>
            <Text style={styles.userSub}>{u.email} · {u.phone}</Text>
          </View>
          <View style={{ gap: 6, alignItems: 'flex-end' }}>
            <Chip
              textStyle={{ color: COLORS.onAccent, fontSize: 10, fontWeight: '800' }}
              style={{ backgroundColor: COLORS.navy }}
            >
              {u.role}
            </Chip>
            <Chip
              textStyle={{ color: COLORS.onAccent, fontSize: 10, fontWeight: '700' }}
              style={{ backgroundColor: u.status === 'ACTIVE' ? COLORS.emeraldFill : u.status === 'SUSPENDED' ? COLORS.redFill : COLORS.amberFill }}
            >
              {u.status}
            </Chip>
          </View>
        </View>

        {u.role !== 'ADMIN' && (
          <>
            <Divider style={styles.divider} />
            <View style={styles.actionsRow}>
              <Button
                mode="outlined"
                textColor={u.status === 'ACTIVE' ? COLORS.red : COLORS.emerald}
                onPress={() => handleToggleStatus(u.id, u.status)}
                style={{ borderColor: u.status === 'ACTIVE' ? COLORS.red : COLORS.emerald, borderRadius: RADIUS.md }}
                labelStyle={{ fontWeight: '700' }}
              >
                {u.status === 'ACTIVE' ? 'Suspend Account' : 'Reactivate Account'}
              </Button>
            </View>
          </>
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
          <Text style={styles.title}>User Account Management</Text>
          <Text style={styles.subtitle}>Audit, suspend, or reactivate accounts across all platform roles</Text>
          <View style={styles.headerActions}>
            <Button mode="contained" buttonColor={COLORS.navy} textColor={COLORS.onAccent} compact onPress={() => navigate('/admin/invitations')}>
              Invite User
            </Button>
            <Button mode="outlined" textColor={COLORS.navy} style={{ borderColor: COLORS.inputBorder }} compact onPress={() => navigate('/auth/security')}>
              My Security
            </Button>
          </View>
        </View>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search name, email, or phone..."
          placeholderTextColor={COLORS.textMuted}
          style={styles.searchInput}
        />

        <View style={styles.filterRow}>
          {(['', 'PATIENT', 'NURSE', 'DOCTOR', 'PARAMEDIC', 'ADMIN'] as const).map((r) => (
            <TouchableOpacity
              key={r}
              activeOpacity={0.8}
              style={[styles.filterChip, role === r && styles.filterChipActive]}
              onPress={() => setRole(r)}
            >
              <Text style={[styles.filterText, role === r && styles.filterTextActive]}>
                {r === '' ? 'All Roles' : r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading && filteredUsers.length === 0 ? (
          <ActivityIndicator color={COLORS.navy} size="large" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item: any) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={() => (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>👥</Text>
                <Text style={styles.emptyTitle}>No Users Found</Text>
                <Text style={styles.emptySub}>No user accounts match the current filter options.</Text>
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
  header: { marginBottom: 14 },
  backBtn: { marginBottom: 8 },
  backText: { color: COLORS.navy, fontSize: 13, fontWeight: '700' },
  title: { color: COLORS.textDark, fontSize: 22, fontWeight: '800' },
  subtitle: { color: COLORS.textBody, fontSize: 12.5, marginTop: 4 },
  headerActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  searchInput: {
    backgroundColor: COLORS.surfaceCard,
    color: COLORS.textDark,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: RADIUS.md,
    fontSize: 13.5,
    marginBottom: 12,
  },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  filterChip: {
    backgroundColor: COLORS.surfaceCard,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  filterChipActive: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  filterText: { color: COLORS.textBody, fontSize: 11.5, fontWeight: '600' },
  filterTextActive: { color: COLORS.onAccent, fontWeight: '700' },
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  userName: { color: COLORS.textDark, fontSize: 15, fontWeight: '700' },
  userSub: { color: COLORS.textBody, fontSize: 12, marginTop: 3 },
  divider: { backgroundColor: COLORS.dividerLight, marginVertical: 10 },
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end' },
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
