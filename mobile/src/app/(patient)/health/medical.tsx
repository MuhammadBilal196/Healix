
import { useAppTheme, useThemeValue } from '../../../theme/ThemeProvider';
import type { ThemeColors } from '../../../theme';
import { appAlert } from '../../../components/common/AppDialogs';
import { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../store/auth';
import { 
  useMedicalHistory, 
  useAddCondition, 
  useAddAllergy, 
  useAddMedication 
} from '../../../hooks/useHealth';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../../theme';

import { AllergyCard } from '../../../components/patient/AllergyCard';
import { AddAllergyModal } from '../../../components/patient/AddAllergyModal';
import { ConditionCard } from '../../../components/patient/ConditionCard';
import { AddConditionModal } from '../../../components/patient/AddConditionModal';
import { MedicationCard } from '../../../components/patient/MedicationCard';
import { AddMedicationModal } from '../../../components/patient/AddMedicationModal';
import { LoadingState } from '../../../components/common/LoadingState';
import { ErrorState } from '../../../components/common/ErrorState';

const TABS = ['Overview', 'Conditions', 'Allergies', 'Medications'] as const;
type Tab = typeof TABS[number];

export default function MedicalHistoryScreen() {
  const { dark: isDarkTheme } = useAppTheme();

  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const router = useRouter();
  const { user } = useAuthStore();
  const patientId = user?.patientId || '';

  const { data: medicalHistory, isLoading: isFetching, error, refetch } = useMedicalHistory(patientId);
  const { mutateAsync: addCondition, isPending: isAddingCondition } = useAddCondition();
  const { mutateAsync: addAllergy, isPending: isAddingAllergy } = useAddAllergy();
  const { mutateAsync: addMedication, isPending: isAddingMedication } = useAddMedication();

  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [showAllergyModal, setShowAllergyModal] = useState(false);
  const [showConditionModal, setShowConditionModal] = useState(false);
  const [showMedicationModal, setShowMedicationModal] = useState(false);

  const handleAddAllergy = async (allergen: string, severity: 'MILD' | 'MODERATE' | 'SEVERE') => {
    if (!patientId) return;
    try {
      await addAllergy({ patientId, data: { allergen, severity, reaction: '' } });
      appAlert('Success', 'Allergy added to medical record.');
      setShowAllergyModal(false);
    } catch (err: any) {
      throw err;
    }
  };

  const handleAddCondition = async (name: string, diagnosedDate?: string, notes?: string) => {
    if (!patientId) return;
    try {
      await addCondition({ patientId, data: { name, diagnosedDate, notes } });
      appAlert('Success', 'Condition added to medical record.');
      setShowConditionModal(false);
    } catch (err: any) {
      throw err;
    }
  };

  const handleAddMedication = async (name: string, dosage: string, frequency: string) => {
    if (!patientId) return;
    try {
      await addMedication({ patientId, data: { name, dosage, frequency, active: true } });
      appAlert('Success', 'Medication added to medical record.');
      setShowMedicationModal(false);
    } catch (err: any) {
      throw err;
    }
  };

  if (isFetching && !medicalHistory) return <LoadingState message="Loading medical history..." />;
  if (error) return <ErrorState error={error as Error} onRetry={refetch} />;

  const conditions = medicalHistory?.chronicConditions || [];
  const allergies = medicalHistory?.allergies || [];
  const medications = medicalHistory?.medications || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Medical History</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabRow}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabPill, activeTab === tab && styles.tabPillActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Tab: Overview */}
          {activeTab === 'Overview' && (
            <View style={styles.sectionGap}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.sectionTitle}>Chronic Conditions ({conditions.length})</Text>
                <TouchableOpacity onPress={() => setShowConditionModal(true)}>
                  <Text style={styles.addText}>+ Add</Text>
                </TouchableOpacity>
              </View>
              {conditions.slice(0, 2).map((c, i) => (
                <ConditionCard key={c.id || i} name={c.name} diagnosedDate={c.diagnosedDate} notes={c.notes} />
              ))}

              <View style={styles.cardHeaderRow}>
                <Text style={styles.sectionTitle}>Allergies ({allergies.length})</Text>
                <TouchableOpacity onPress={() => setShowAllergyModal(true)}>
                  <Text style={styles.addText}>+ Add</Text>
                </TouchableOpacity>
              </View>
              {allergies.slice(0, 2).map((a, i) => (
                <AllergyCard key={a.id || i} allergen={a.allergen} severity={a.severity} />
              ))}

              <View style={styles.cardHeaderRow}>
                <Text style={styles.sectionTitle}>Active Medications ({medications.length})</Text>
                <TouchableOpacity onPress={() => setShowMedicationModal(true)}>
                  <Text style={styles.addText}>+ Add</Text>
                </TouchableOpacity>
              </View>
              {medications.slice(0, 2).map((m, i) => (
                <MedicationCard key={m.id || i} name={m.name} dosage={m.dosage} frequency={m.frequency} active={m.active} />
              ))}
            </View>
          )}

          {/* Tab: Conditions */}
          {activeTab === 'Conditions' && (
            <View style={styles.sectionGap}>
              <TouchableOpacity style={styles.primaryAddBtn} onPress={() => setShowConditionModal(true)}>
                <Text style={styles.primaryAddBtnText}>+ Add Chronic Condition</Text>
              </TouchableOpacity>
              {conditions.map((c, i) => (
                <ConditionCard key={c.id || i} name={c.name} diagnosedDate={c.diagnosedDate} notes={c.notes} />
              ))}
            </View>
          )}

          {/* Tab: Allergies */}
          {activeTab === 'Allergies' && (
            <View style={styles.sectionGap}>
              <TouchableOpacity style={styles.primaryAddBtn} onPress={() => setShowAllergyModal(true)}>
                <Text style={styles.primaryAddBtnText}>+ Add Allergy</Text>
              </TouchableOpacity>
              {allergies.map((a, i) => (
                <AllergyCard key={a.id || i} allergen={a.allergen} severity={a.severity} />
              ))}
            </View>
          )}

          {/* Tab: Medications */}
          {activeTab === 'Medications' && (
            <View style={styles.sectionGap}>
              <TouchableOpacity style={styles.primaryAddBtn} onPress={() => setShowMedicationModal(true)}>
                <Text style={styles.primaryAddBtnText}>+ Add Medication</Text>
              </TouchableOpacity>
              {medications.map((m, i) => (
                <MedicationCard key={m.id || i} name={m.name} dosage={m.dosage} frequency={m.frequency} active={m.active} />
              ))}
            </View>
          )}
        </ScrollView>

        {/* Modals */}
        <AddConditionModal
          visible={showConditionModal}
          onClose={() => setShowConditionModal(false)}
          onSubmit={handleAddCondition}
          isLoading={isAddingCondition}
        />
        <AddAllergyModal
          visible={showAllergyModal}
          onClose={() => setShowAllergyModal(false)}
          onSubmit={handleAddAllergy}
          isLoading={isAddingAllergy}
        />
        <AddMedicationModal
          visible={showMedicationModal}
          onClose={() => setShowMedicationModal(false)}
          onSubmit={handleAddMedication}
          isLoading={isAddingMedication}
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
  tabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.md,
    padding: 4,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  tabPillActive: {
    backgroundColor: COLORS.emerald,
  },
  tabText: {
    color: COLORS.textBody,
    fontSize: 11,
    fontWeight: '600',
  },
  tabTextActive: {
    color: COLORS.onAccent,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  sectionGap: {
    gap: SPACING.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.textDark,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '700',
  },
  addText: {
    color: COLORS.emerald,
    fontSize: 12,
    fontWeight: '700',
  },
  primaryAddBtn: {
    backgroundColor: COLORS.transparent,
    borderWidth: 1.5,
    borderColor: COLORS.emerald,
    borderStyle: 'dashed',
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  primaryAddBtnText: {
    color: COLORS.emerald,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '700',
  },
}));

