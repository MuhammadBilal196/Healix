import { useAppTheme, useThemeValue, usePaperTheme } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, TextInput, SafeAreaView, StatusBar, FlatList, Platform } from 'react-native';
import { Card, Button, Chip, Divider, Portal, Dialog, TextInput as PaperTextInput, Provider as PaperProvider } from 'react-native-paper';
import { navigate } from '../../utils/navigation';
import { useAdminParamedics, useUpdateUserStatus, useCreateParamedic, useInviteUser } from '../../hooks/useAdmin';
import { SPACING, RADIUS } from '../../theme';

export default function AdminParamedics() {
  const { dark: isDarkTheme } = useAppTheme();
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);
  const paperTheme = usePaperTheme();

  const { data: users_raw, isLoading } = useAdminParamedics();
  const users = users_raw?.users || [];
  const { mutateAsync: updateUserStatus } = useUpdateUserStatus();
  const createParamedic = useCreateParamedic();
  const inviteUser = useInviteUser();

  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<'DIRECT' | 'INVITE'>('INVITE');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [cnic, setCnic] = useState('');
  const [certNumber, setCertNumber] = useState('');
  const [password, setPassword] = useState('');

  const notify = (title: string, msg: string) => {
    if (Platform.OS === 'web') alert(`${title}: ${msg}`);
    else Alert.alert(title, msg);
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const targetStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await updateUserStatus({ userId, status: targetStatus });
      notify('Status Updated', `Paramedic account status changed to ${targetStatus}`);
    } catch (err: any) {
      notify('Error', err.message || 'Action failed');
    }
  };

  const handleAddSubmit = async () => {
    try {
      if (addMode === 'INVITE') {
        if (!email.trim()) {
          notify('Validation Error', 'Email address is required for an invitation.');
          return;
        }
        const res: any = await inviteUser.mutateAsync({ email: email.trim(), phone: phone.trim() || undefined, role: 'PARAMEDIC' });
        const token = res?.token || res?.data?.token;
        notify('Invitation Created', token ? `Share token privately: ${token}` : 'Invitation sent successfully.');
      } else {
        await createParamedic.mutateAsync({
          email: email.trim(),
          phone: phone.trim(),
          fullName: fullName.trim(),
          password,
          cnic: cnic.trim(),
          certificationNumber: certNumber.trim(),
        });
        notify('Paramedic Created', 'Paramedic account is active and ready to sign in.');
      }
      setShowAddModal(false);
      setEmail(''); setPhone(''); setFullName(''); setCnic(''); setCertNumber(''); setPassword('');
    } catch (err: any) {
      notify('Error', err.message || 'Action failed');
    }
  };

  const filteredUsers = users.filter((u: any) => {
    const q = search.toLowerCase();
    return !search ||
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.includes(search);
  });

  const renderItem = ({ item: u }: any) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.userName}>{u.fullName}</Text>
            <Text style={styles.userSub}>{u.email} · {u.phone}</Text>
            {!!u.paramedic?.certificationNumber && (
              <Text style={styles.certSub}>EMT Cert: {u.paramedic.certificationNumber}</Text>
            )}
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
      </Card.Content>
    </Card>
  );

  return (
    <PaperProvider theme={paperTheme}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} />
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigate('/admin')} style={styles.backBtn}>
              <Text style={styles.backText}>‹ Back to Command Center</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Paramedic Management</Text>
            <Text style={styles.subtitle}>Onboard, audit, suspend, or reactivate paramedic accounts</Text>
          </View>

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search name, email, or phone..."
            placeholderTextColor={COLORS.textMuted}
            style={styles.searchInput}
          />

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
                  <Text style={styles.emptyIcon}>🚑</Text>
                  <Text style={styles.emptyTitle}>No Paramedics Found</Text>
                  <Text style={styles.emptySub}>Tap + below to invite or create a paramedic account.</Text>
                </View>
              )}
            />
          )}
        </View>

        <TouchableOpacity activeOpacity={0.85} style={styles.fab} onPress={() => setShowAddModal(true)}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>

        <Portal>
          <Dialog visible={showAddModal} onDismiss={() => setShowAddModal(false)} style={{ backgroundColor: COLORS.surfaceCard }}>
            <Dialog.Title style={{ color: COLORS.textDark, fontWeight: '700' }}>Add Paramedic</Dialog.Title>
            <Dialog.Content>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                <Button mode={addMode === 'INVITE' ? 'contained' : 'outlined'} onPress={() => setAddMode('INVITE')}>Invite</Button>
                <Button mode={addMode === 'DIRECT' ? 'contained' : 'outlined'} onPress={() => setAddMode('DIRECT')}>Direct Create</Button>
              </View>
              <PaperTextInput mode="outlined" outlineColor={COLORS.inputBorder} activeOutlineColor={COLORS.navy} textColor={COLORS.textDark} label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" style={{ marginBottom: 10, backgroundColor: COLORS.surfaceCard }} />
              {addMode === 'DIRECT' && (
                <>
                  <PaperTextInput mode="outlined" outlineColor={COLORS.inputBorder} activeOutlineColor={COLORS.navy} textColor={COLORS.textDark} label="Phone (e.g. 03001234567)" value={phone} onChangeText={setPhone} style={{ marginBottom: 10, backgroundColor: COLORS.surfaceCard }} />
                  <PaperTextInput mode="outlined" outlineColor={COLORS.inputBorder} activeOutlineColor={COLORS.navy} textColor={COLORS.textDark} label="Full Name" value={fullName} onChangeText={setFullName} style={{ marginBottom: 10, backgroundColor: COLORS.surfaceCard }} />
                  <PaperTextInput mode="outlined" outlineColor={COLORS.inputBorder} activeOutlineColor={COLORS.navy} textColor={COLORS.textDark} label="Password" value={password} onChangeText={setPassword} secureTextEntry style={{ marginBottom: 10, backgroundColor: COLORS.surfaceCard }} />
                  <PaperTextInput mode="outlined" outlineColor={COLORS.inputBorder} activeOutlineColor={COLORS.navy} textColor={COLORS.textDark} label="CNIC (xxxxx-xxxxxxx-x)" value={cnic} onChangeText={setCnic} style={{ marginBottom: 10, backgroundColor: COLORS.surfaceCard }} />
                  <PaperTextInput mode="outlined" outlineColor={COLORS.inputBorder} activeOutlineColor={COLORS.navy} textColor={COLORS.textDark} label="EMT Certification Number" value={certNumber} onChangeText={setCertNumber} style={{ marginBottom: 10, backgroundColor: COLORS.surfaceCard }} />
                </>
              )}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowAddModal(false)}>Cancel</Button>
              <Button onPress={handleAddSubmit} loading={createParamedic.isPending || inviteUser.isPending}>Submit</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </SafeAreaView>
    </PaperProvider>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.surface },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  fabText: { fontSize: 30, color: COLORS.onAccent, fontWeight: '700', lineHeight: 32 },
  container: { flex: 1, backgroundColor: COLORS.surface, padding: SPACING.lg },
  listContent: { paddingBottom: 80 },
  header: { marginBottom: 16 },
  backBtn: { marginBottom: 8 },
  backText: { color: COLORS.navy, fontSize: 13, fontWeight: '700' },
  title: { color: COLORS.textDark, fontSize: 22, fontWeight: '800' },
  subtitle: { color: COLORS.textBody, fontSize: 12.5, marginTop: 4 },
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
  certSub: { color: COLORS.navy, fontSize: 11.5, fontWeight: '600', marginTop: 4 },
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
