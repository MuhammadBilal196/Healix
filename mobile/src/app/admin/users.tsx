
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

  const { data: users_raw, isLoading  } = useAdminUsers(); const users = users_raw?.users || [];
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
    const matchesSearch = !search ||
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search);
    const matchesRole = !role || u.role === role;
    return matchesSearch && matchesRole;
  });

  const renderItem = ({ item: u }: any) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{u.fullName}</Text>
            <Text style={styles.userSub}>📧 {u.email} · 📱 {u.phone}</Text>
          </View>
          <View style={{ gap: 4, alignItems: 'flex-end' }}>
            <Chip
              textStyle={{ color: COLORS.textMuted, fontSize: 10, fontWeight: '800' }}
              style={{ backgroundColor: COLORS.emerald }}
            >
              {u.role}
            </Chip>
            <Chip
              textStyle={{ color: COLORS.textDark, fontSize: 9, fontWeight: '700' }}
              style={{ backgroundColor: u.status === 'ACTIVE' ? COLORS.emerald : COLORS.red }}
            >
              {u.status}
            </Chip>
          </View>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.actionsRow}>
          {u.role !== 'ADMIN' && <Button
            mode="outlined"
            textColor={u.status === 'ACTIVE' ? COLORS.red : COLORS.emerald}
            onPress={() => handleToggleStatus(u.id, u.status)}
            style={{ borderColor: u.status === 'ACTIVE' ? COLORS.red : COLORS.emerald, borderRadius: RADIUS.md }}
            labelStyle={{ fontWeight: '700' }}
          >
            {u.status === 'ACTIVE' ? 'Suspend Account' : 'Reactivate Account'}
          </Button>}
        </View>
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
          <Text style={styles.title}>User Account Management</Text><Button onPress={() => navigate('/admin/invitations')}>Invite an administrator or clinician</Button><Button onPress={() => navigate('/auth/security')}>My account security</Button>
          <Text style={styles.subtitle}>Audit, suspend, or reactivate accounts across all platform roles</Text>
        </View>

        {/* Search Bar */}
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search name, email, or phone..."
          placeholderTextColor={COLORS.textBody}
          style={styles.searchInput}
        />

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {(['', 'PATIENT', 'NURSE', 'DOCTOR', 'PARAMEDIC', 'ADMIN'] as const).map((r) => (
            <TouchableOpacity
              key={r}
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
          <ActivityIndicator color={COLORS.emerald} size="large" style={{ marginTop: 40 }} />
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

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: SPACING.lg },
  listContent: { paddingBottom: 40 },
  header: { marginBottom: 16 },
  backBtn: { marginBottom: 8 },
  backText: { color: COLORS.emerald, fontSize: 13, fontWeight: '700' },
  title: { color: COLORS.textDark, fontSize: 20, fontWeight: '800' },
  subtitle: { color: COLORS.textBody, fontSize: 12, marginTop: 4 },
  searchInput: { backgroundColor: COLORS.bg, color: COLORS.textDark, borderWidth: 1, borderColor: COLORS.emeraldLight, paddingHorizontal: 14, paddingVertical: 10, borderRadius: RADIUS.md, fontSize: 13, marginBottom: 12 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  filterChip: { backgroundColor: COLORS.bg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.round, borderWidth: 1, borderColor: COLORS.emeraldLight },
  filterChipActive: { backgroundColor: COLORS.emerald, borderColor: COLORS.emerald },
  filterText: { color: COLORS.textBody, fontSize: 11, fontWeight: '600' },
  filterTextActive: { color: COLORS.textMuted, fontWeight: '800' },
  card: { backgroundColor: COLORS.bg, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.emeraldLight, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  userName: { color: COLORS.onAccent, fontSize: 15, fontWeight: '700' },
  userSub: { color: COLORS.textBody, fontSize: 11, marginTop: 2 },
  divider: { backgroundColor: COLORS.emeraldLight, marginVertical: 10 },
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  emptyCard: { backgroundColor: COLORS.bg, borderRadius: RADIUS.lg, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: COLORS.emeraldLight },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyTitle: { color: COLORS.textDark, fontSize: 16, fontWeight: '700' },
  emptySub: { color: COLORS.textBody, fontSize: 12, textAlign: 'center', marginTop: 4 },
}));
