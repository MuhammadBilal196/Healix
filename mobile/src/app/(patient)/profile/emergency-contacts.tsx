
import { useAppTheme, useThemeValue } from '../../../theme/ThemeProvider';
import type { ThemeColors } from '../../../theme';
import { appAlert } from '../../../components/common/AppDialogs';
import { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Linking, Alert } from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../store/auth';
import { usePatientProfile, useAddEmergencyContact, useDeleteEmergencyContact } from '../../../hooks/usePatient';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../../theme';
import { AddEmergencyContactModal } from '../../../components/patient/AddEmergencyContactModal';
import { LoadingState } from '../../../components/common/LoadingState';
import { ErrorState } from '../../../components/common/ErrorState';

export default function EmergencyContactsScreen() {
  const { dark: isDarkTheme } = useAppTheme();

  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const router = useRouter();
  const { user } = useAuthStore();
  const patientId = user?.patientId || '';

  const { data: patientProfile, isLoading: isFetching, error, refetch } = usePatientProfile(patientId);
  const { mutateAsync: addContact, isPending: isAdding } = useAddEmergencyContact();
  const { mutateAsync: deleteContact, isPending: isDeleting } = useDeleteEmergencyContact();

  const [showAddModal, setShowAddModal] = useState(false);

  const handleAdd = async (name: string, phone: string, relationship: string) => {
    if (!patientId) return;
    try {
      await addContact({ patientId, data: { name, phone, relationship } });
      appAlert('Success', 'Emergency contact added.');
      setShowAddModal(false);
    } catch (err: any) {
      throw err;
    }
  };

  const handleDelete = (contactId: string, name: string) => {
    appAlert('Delete Contact', `Remove ${name} from emergency contacts?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!patientId) return;
          try {
            await deleteContact({ patientId, contactId });
            appAlert('Deleted', 'Emergency contact removed.');
          } catch (err: any) {
            appAlert('Error', err.message || 'Failed to delete contact.');
          }
        },
      },
    ]);
  };

  if (isFetching && !patientProfile) return <LoadingState message="Loading emergency contacts..." />;
  if (error) return <ErrorState error={error as Error} onRetry={refetch} />;

  const contacts = patientProfile?.emergencyContacts || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Emergency Contacts</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
          {contacts.length > 0 ? (
            contacts.map((contact) => (
              <View key={contact.id} style={styles.contactCard}>
                <Avatar.Text
                  size={48}
                  label={contact.name ? contact.name.split(' ').map((n: string) => n[0]).join('') : 'EC'}
                  style={styles.avatarBg}
                  color={COLORS.emerald}
                />

                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactRelation}>{contact.relationship}</Text>
                  <Text style={styles.contactPhone}>{contact.phone}</Text>
                </View>

                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() => Linking.openURL(`tel:${contact.phone}`)}
                >
                  <Text style={styles.callIcon}>📞</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(contact.id, contact.name)}
                  disabled={isDeleting}
                >
                  <Text style={[styles.deleteIcon, isDeleting && { opacity: 0.5 }]}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🚨</Text>
              <Text style={styles.emptyTitle}>No Emergency Contacts</Text>
              <Text style={styles.emptySub}>
                Add trusted family members or caregivers to be notified in an emergency.
              </Text>
            </View>
          )}

          {/* Add New Contact Button */}
          <TouchableOpacity style={styles.addContactBtn} onPress={() => setShowAddModal(true)}>
            <Text style={styles.addContactText}>+ Add New Contact</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            These contacts will be notified automatically during emergency SOS triggers.
          </Text>
        </View>

        {/* Modal */}
        <AddEmergencyContactModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAdd}
          isLoading={isAdding}
        />
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
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    color: COLORS.textDark,
    fontSize: 28,
    fontWeight: '300',
  },
  headerTitle: {
    color: COLORS.textDark,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '700',
  },
  listContainer: {
    paddingBottom: 80,
    gap: SPACING.md,
  },
  contactCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  avatarBg: {
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  contactInfo: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  contactName: {
    color: COLORS.textDark,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '700',
  },
  contactRelation: {
    color: COLORS.textBody,
    fontSize: 11,
    marginTop: 2,
  },
  contactPhone: {
    color: COLORS.textBody,
    fontSize: 10,
    marginTop: 2,
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.emeraldFill,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  callIcon: {
    fontSize: 16,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.redLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    fontSize: 14,
  },
  addContactBtn: {
    backgroundColor: COLORS.transparent,
    borderWidth: 1.5,
    borderColor: COLORS.emerald,
    borderStyle: 'dashed',
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  addContactText: {
    color: COLORS.emerald,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
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
    marginTop: 4,
  },
  infoBanner: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    marginBottom: SPACING.xs,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  infoText: {
    color: COLORS.textBody,
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
}));



