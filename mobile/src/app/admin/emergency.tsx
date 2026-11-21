import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import { useState } from 'react';
import { navigate } from '../../utils/navigation';
import { View, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Text, Card, Chip, Appbar, Button, Portal, Dialog, TextInput, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import {
  useAdminEmergencies,
  useEscalateEmergency,
  useAssignEmergencyDoctor,
  useResolveEmergency,
  useAssignEmergencyParamedic,
  useAdminDoctors
} from '../../hooks/useAdmin';
import { SPACING, RADIUS } from '../../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AdminEmergency } from '../../types/admin';

export default function AdminEmergencyCenter() {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const router = useRouter();

  // Active emergencies automatically refetch every 5000ms
  const { data: emergencies, isLoading, isError, refetch } = useAdminEmergencies();
  const { data: registeredDoctors = [], isLoading: isLoadingDoctors } = useAdminDoctors();

  const escalateMutation = useEscalateEmergency();
  const assignDoctorMutation = useAssignEmergencyDoctor();
  const assignParamedicMutation = useAssignEmergencyParamedic();
  const resolveMutation = useResolveEmergency();

  // Dialog states
  const [selectedEmergencyId, setSelectedEmergencyId] = useState<string | null>(null);
  const [doctorId, setDoctorId] = useState('');
  const [doctorDropdownOpen, setDoctorDropdownOpen] = useState(false);
  const [selectedDoctorDisplay, setSelectedDoctorDisplay] = useState('');

  const [selectedDispatchId, setSelectedDispatchId] = useState<string | null>(null);
  const [paramedicId, setParamedicId] = useState('');

  const [resolvingEmergencyId, setResolvingEmergencyId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const handleAssignDoctor = () => {
    if (!selectedEmergencyId || !doctorId.trim()) return;
    assignDoctorMutation.mutate({ id: selectedEmergencyId, doctorId: doctorId.trim() }, {
      onSuccess: () => {
        setSelectedEmergencyId(null);
        setDoctorId('');
        setDoctorDropdownOpen(false);
        setSelectedDoctorDisplay('');
      }
    });
  };

  const handleAssignParamedic = () => {
    if (!selectedDispatchId || !paramedicId.trim()) return;
    assignParamedicMutation.mutate({ dispatchId: selectedDispatchId, paramedicId: paramedicId.trim() }, {
      onSuccess: () => {
        setSelectedDispatchId(null);
        setParamedicId('');
      }
    });
  };

  const handleResolve = () => {
    if (!resolvingEmergencyId) return;
    resolveMutation.mutate({ id: resolvingEmergencyId, notes: resolutionNotes.trim() }, {
      onSuccess: () => {
        setResolvingEmergencyId(null);
        setResolutionNotes('');
      }
    });
  };

  const renderDispatchCard = (dispatch: NonNullable<AdminEmergency['activeDispatch']>) => {
    return (
      <View style={styles.dispatchSection}>
        <View style={styles.dispatchHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialCommunityIcons name="ambulance" size={18} color={COLORS.primaryText} />
            <Text style={styles.dispatchTitle}>Ambulance Dispatch</Text>
          </View>
          <Chip
            textStyle={{ fontSize: 11, fontWeight: '700', color: COLORS.onAccent }}
            style={{
              backgroundColor:
                dispatch.status === 'COMPLETED'
                  ? COLORS.emeraldFill
                  : dispatch.status === 'ARRIVED'
                  ? COLORS.navy
                  : COLORS.amberFill
            }}
          >
            {dispatch.status}
          </Chip>
        </View>

        <View style={styles.dispatchDetailsGrid}>
          {dispatch.ambulance ? (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="car-emergency" size={16} color={COLORS.textBody} />
              <Text style={styles.detailText}>
                <Text style={{ fontWeight: '700' }}>Ambulance: </Text>
                {dispatch.ambulance.vehicleNumber} ({dispatch.ambulance.plateNumber}) • {dispatch.ambulance.type}
              </Text>
            </View>
          ) : (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="car-off" size={16} color={COLORS.amber} />
              <Text style={[styles.detailText, { color: COLORS.amber }]}>No vehicle assigned</Text>
            </View>
          )}

          {dispatch.paramedic ? (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="account-tie" size={16} color={COLORS.textBody} />
              <Text style={styles.detailText}>
                <Text style={{ fontWeight: '700' }}>Paramedic: </Text>
                {dispatch.paramedic.name} ({dispatch.paramedic.phone || dispatch.paramedic.certificationNumber})
              </Text>
            </View>
          ) : (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="account-alert" size={16} color={COLORS.amber} />
              <Text style={[styles.detailText, { color: COLORS.amber }]}>Paramedic unassigned</Text>
            </View>
          )}

          {dispatch.hospital && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="hospital-building" size={16} color={COLORS.textBody} />
              <Text style={styles.detailText}>
                <Text style={{ fontWeight: '700' }}>Hospital: </Text>
                {dispatch.hospital.name}
              </Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="timer-outline" size={16} color={COLORS.textBody} />
            <Text style={styles.detailText}>
              <Text style={{ fontWeight: '700' }}>ETA: </Text>
              {dispatch.etaMinutes} mins
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderContent = () => {
    if (isLoading && !emergencies) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator color={COLORS.red} size="large" />
          <Text style={styles.loadingText}>Monitoring emergency queue...</Text>
        </View>
      );
    }
    if (isError) {
      return (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={COLORS.red} />
          <Text style={styles.errorText}>Error loading emergencies. Check connection.</Text>
          <Button mode="outlined" textColor={COLORS.primaryText} onPress={() => refetch()} style={{ marginTop: 12 }}>
            Retry
          </Button>
        </View>
      );
    }
    if (!emergencies?.length) {
      return (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="check-circle-outline" size={56} color={COLORS.careEmerald} />
          <Text style={styles.allClearTitle}>All Clear</Text>
          <Text style={styles.allClearSubtitle}>No active emergencies or SLA breaches at this moment.</Text>
        </View>
      );
    }

    return emergencies.map((em) => {
      const isCritical = em.severity === 'CRITICAL' || em.status === 'CRITICAL';
      const isBreached = em.slaBreach;

      return (
        <Card
          key={em.id}
          style={[
            styles.card,
            isBreached && styles.breachedCard,
            isCritical && styles.criticalCard
          ]}
        >
          <Card.Content>
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <MaterialCommunityIcons
                  name={isBreached ? 'alert-octagon' : 'alert-decagram'}
                  size={22}
                  color={isBreached || isCritical ? COLORS.red : COLORS.amber}
                />
                <View>
                  <Text style={styles.cardTitle}>Emergency #{em.id.slice(0, 8)}</Text>
                  <Text style={styles.cardSourceText}>Source: {em.source || 'CLINICAL'}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Chip
                  textStyle={{ fontSize: 10, fontWeight: '700', color: COLORS.onAccent }}
                  style={{ backgroundColor: isCritical ? COLORS.redFill : COLORS.amberFill }}
                >
                  {em.severity || 'CRITICAL'}
                </Chip>
                <Chip
                  textStyle={{ fontSize: 10, fontWeight: '700', color: COLORS.onAccent }}
                  style={{ backgroundColor: em.status === 'RESOLVED' ? COLORS.emeraldFill : COLORS.navy }}
                >
                  {em.status}
                </Chip>
              </View>
            </View>

            {/* SLA Breach Alert Banner */}
            {isBreached && (
              <View style={styles.breachBanner}>
                <MaterialCommunityIcons name="alarm-light" size={16} color={COLORS.red} />
                <Text style={styles.breachBannerText}>SLA TIMEOUT BREACHED — IMMEDIATE CLINICAL ACTION REQUIRED</Text>
              </View>
            )}

            {/* Patient & Doctor Clinical Info */}
            <View style={styles.infoBlock}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Patient:</Text>
                <Text style={styles.infoValue}>
                  {em.patientName || 'Unknown Patient'} {em.patientPhone ? `(${em.patientPhone})` : ''}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Assigned Doctor:</Text>
                {(() => {
                  const matchedDoc = registeredDoctors.find((d: any) => d.id === em.assignedDoctorId);
                  const docDisplayName = em.assignedDoctorName
                    ? em.assignedDoctorName
                    : matchedDoc?.user?.fullName
                    ? (matchedDoc.user.fullName.startsWith('Dr') ? matchedDoc.user.fullName : `Dr. ${matchedDoc.user.fullName}`)
                    : em.assignedDoctorId
                    ? `Doctor (${em.assignedDoctorId.slice(0, 8)})`
                    : 'Unassigned (Awaiting Review)';

                  return (
                    <Text style={[styles.infoValue, !em.assignedDoctorId && { color: COLORS.red, fontWeight: '700' }]}>
                      {docDisplayName}
                    </Text>
                  );
                })()}
              </View>
            </View>

            {/* Ambulance Dispatch Section */}
            {em.activeDispatch && renderDispatchCard(em.activeDispatch)}

            <Divider style={{ marginVertical: 12 }} />

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              {!em.assignedDoctorId && (
                <Button
                  mode="contained"
                  buttonColor={COLORS.navy}
                  textColor={COLORS.onAccent}
                  icon="doctor"
                  onPress={() => setSelectedEmergencyId(em.id)}
                  style={styles.actionBtn}
                  compact
                >
                  Assign Doctor
                </Button>
              )}

              {em.activeDispatch && !em.activeDispatch.paramedic && (
                <Button
                  mode="contained"
                  buttonColor={COLORS.blueFill}
                  textColor={COLORS.onAccent}
                  icon="account-plus"
                  onPress={() => setSelectedDispatchId(em.activeDispatch?.id || null)}
                  style={styles.actionBtn}
                  compact
                >
                  Assign Paramedic
                </Button>
              )}

              {em.status !== 'RESOLVED' && (
                <Button
                  mode="outlined"
                  textColor={COLORS.careEmerald}
                  icon="check-circle"
                  onPress={() => setResolvingEmergencyId(em.id)}
                  style={[styles.actionBtn, { borderColor: COLORS.careEmerald }]}
                  compact
                >
                  Resolve
                </Button>
              )}

              {em.severity !== 'CRITICAL' && (
                <Button
                  mode="text"
                  textColor={COLORS.red}
                  icon="alert"
                  onPress={() => escalateMutation.mutate(em.id)}
                  loading={escalateMutation.isPending}
                  compact
                >
                  Escalate
                </Button>
              )}
            </View>
          </Card.Content>
        </Card>
      );
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={{ backgroundColor: COLORS.navyDark }}>
        <Appbar.BackAction onPress={() => router.back()} color={COLORS.headerText} />
        <Appbar.Action icon="ambulance" color={COLORS.headerText} onPress={() => navigate('/admin/ambulances')} />
        <Appbar.Content title="Emergency Center" titleStyle={{ color: COLORS.headerText, fontWeight: 'bold' }} />
        <Appbar.Action icon="refresh" color={COLORS.headerText} onPress={() => refetch()} />
      </Appbar.Header>

      <View style={styles.liveIndicator}>
        <View style={styles.dot} />
        <Text style={styles.liveText}>LIVE MONITORING (Active Queue • 5s Pulse)</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {renderContent()}
      </ScrollView>

      {/* Assign Doctor Dialog */}
      <Portal>
        <Dialog
          visible={!!selectedEmergencyId}
          onDismiss={() => {
            setSelectedEmergencyId(null);
            setDoctorDropdownOpen(false);
            setDoctorId('');
            setSelectedDoctorDisplay('');
          }}
          style={{ backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.md }}
        >
          <Dialog.Title style={{ color: COLORS.textDark, fontWeight: '700' }}>Assign Emergency Doctor</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: COLORS.textBody, marginBottom: 12, fontSize: 13 }}>
              Select a doctor from the registry or enter a Doctor ID to immediately transfer clinical supervision:
            </Text>

            {/* Doctor Selection Dropdown Button */}
            <Text style={{ color: COLORS.textDark, fontWeight: '700', fontSize: 13, marginBottom: 6 }}>
              Select Registered Doctor:
            </Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              activeOpacity={0.8}
              onPress={() => setDoctorDropdownOpen(prev => !prev)}
            >
              <MaterialCommunityIcons name="doctor" size={20} color={COLORS.primaryText} style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.dropdownSelectedText,
                    !selectedDoctorDisplay && { color: COLORS.textSecondary }
                  ]}
                  numberOfLines={1}
                >
                  {selectedDoctorDisplay || 'Choose a registered doctor...'}
                </Text>
              </View>
              <MaterialCommunityIcons
                name={doctorDropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={22}
                color={COLORS.primaryText}
              />
            </TouchableOpacity>

            {/* Dropdown Menu List */}
            {doctorDropdownOpen && (
              <View style={styles.dropdownListContainer}>
                <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                  {isLoadingDoctors ? (
                    <View style={{ padding: 14, alignItems: 'center' }}>
                      <ActivityIndicator size="small" color={COLORS.primaryText} />
                      <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 4 }}>Loading doctors...</Text>
                    </View>
                  ) : registeredDoctors.length === 0 ? (
                    <View style={{ padding: 14, alignItems: 'center' }}>
                      <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>No registered doctors found.</Text>
                    </View>
                  ) : (
                    registeredDoctors.map((doc: any) => {
                      const isSelected = doctorId === doc.id;
                      const rawName = doc.user?.fullName || 'Physician';
                      const docName = rawName.startsWith('Dr') ? rawName : `Dr. ${rawName}`;
                      const spec = doc.specialization || doc.pmdcNumber || 'General Physician';
                      return (
                        <TouchableOpacity
                          key={doc.id}
                          style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]}
                          onPress={() => {
                            setDoctorId(doc.id);
                            setSelectedDoctorDisplay(`${docName} (${spec})`);
                            setDoctorDropdownOpen(false);
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.doctorItemName, isSelected && { color: COLORS.primaryText, fontWeight: '700' }]}>
                              {docName}
                            </Text>
                            <Text style={styles.doctorItemSub} numberOfLines={1}>
                              {spec} · {doc.user?.email || doc.id.slice(0, 8)}
                            </Text>
                          </View>
                          {isSelected && (
                            <MaterialCommunityIcons name="check-circle" size={18} color={COLORS.careEmerald} />
                          )}
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>
              </View>
            )}

            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 12 }}>
              <Divider style={{ flex: 1, backgroundColor: COLORS.dividerLight }} />
              <Text style={{ marginHorizontal: 8, color: COLORS.textSecondary, fontSize: 11, fontWeight: '600' }}>
                OR ENTER DOCTOR ID MANUALLY
              </Text>
              <Divider style={{ flex: 1, backgroundColor: COLORS.dividerLight }} />
            </View>

            <TextInput
              label="Doctor ID"
              value={doctorId}
              onChangeText={(text) => {
                setDoctorId(text);
                const matched = registeredDoctors.find((d: any) => d.id === text.trim());
                if (matched) {
                  const rawName = matched.user?.fullName || 'Physician';
                  const docName = rawName.startsWith('Dr') ? rawName : `Dr. ${rawName}`;
                  const spec = (matched as any).specialization || matched.pmdcNumber || 'Consultant';
                  setSelectedDoctorDisplay(`${docName} (${spec})`);
                } else {
                  setSelectedDoctorDisplay('');
                }
              }}
              mode="outlined"
              style={{ backgroundColor: COLORS.surface }}
              activeOutlineColor={COLORS.navy}
              placeholder="e.g. uuid-doctor-id"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setSelectedEmergencyId(null);
                setDoctorDropdownOpen(false);
                setDoctorId('');
                setSelectedDoctorDisplay('');
              }}
              textColor={COLORS.textBody}
            >
              Cancel
            </Button>
            <Button
              onPress={handleAssignDoctor}
              textColor={COLORS.primaryText}
              loading={assignDoctorMutation.isPending}
              disabled={!doctorId.trim() || assignDoctorMutation.isPending}
            >
              Assign
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Assign Paramedic Dialog */}
        <Dialog
          visible={!!selectedDispatchId}
          onDismiss={() => setSelectedDispatchId(null)}
          style={{ backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.md }}
        >
          <Dialog.Title style={{ color: COLORS.textDark, fontWeight: '700' }}>Assign Paramedic</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: COLORS.textBody, marginBottom: 8, fontSize: 13 }}>
              Enter Paramedic ID to allocate to this ambulance dispatch:
            </Text>
            <TextInput
              label="Paramedic ID"
              value={paramedicId}
              onChangeText={setParamedicId}
              mode="outlined"
              style={{ backgroundColor: COLORS.surface }}
              activeOutlineColor={COLORS.blue}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSelectedDispatchId(null)} textColor={COLORS.textBody}>Cancel</Button>
            <Button
              onPress={handleAssignParamedic}
              textColor={COLORS.blue}
              loading={assignParamedicMutation.isPending}
            >
              Assign
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Resolve Emergency Dialog */}
        <Dialog
          visible={!!resolvingEmergencyId}
          onDismiss={() => setResolvingEmergencyId(null)}
          style={{ backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.md }}
        >
          <Dialog.Title style={{ color: COLORS.textDark, fontWeight: '700' }}>Resolve Emergency</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: COLORS.textBody, marginBottom: 8, fontSize: 13 }}>
              Confirm resolution of this emergency. Active dispatches will be completed and vehicles released to available status.
            </Text>
            <TextInput
              label="Resolution Notes (Optional)"
              value={resolutionNotes}
              onChangeText={setResolutionNotes}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={{ backgroundColor: COLORS.surface }}
              activeOutlineColor={COLORS.careEmerald}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setResolvingEmergencyId(null)} textColor={COLORS.textBody}>Cancel</Button>
            <Button
              onPress={handleResolve}
              textColor={COLORS.careEmerald}
              loading={resolveMutation.isPending}
            >
              Confirm Resolve
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: COLORS.redLight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.redLight
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.red, marginRight: 8 },
  liveText: { color: COLORS.red, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  content: { padding: SPACING.md, gap: 14, paddingBottom: 40 },
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    elevation: 2
  },
  breachedCard: {
    borderColor: COLORS.red,
    borderWidth: 2
  },
  criticalCard: {
    borderLeftWidth: 5,
    borderLeftColor: COLORS.red
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  cardTitle: { color: COLORS.textDark, fontSize: 16, fontWeight: '700' },
  cardSourceText: { color: COLORS.textBody, fontSize: 12, marginTop: 1 },
  breachBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.redLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    marginVertical: 8
  },
  breachBannerText: { color: COLORS.red, fontSize: 11, fontWeight: '800' },
  infoBlock: {
    backgroundColor: COLORS.surface,
    padding: 10,
    borderRadius: RADIUS.sm,
    marginVertical: 6,
    gap: 4
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { color: COLORS.textBody, fontSize: 13, fontWeight: '600' },
  infoValue: { color: COLORS.textDark, fontSize: 13, fontWeight: '500' },
  dispatchSection: {
    marginTop: 10,
    backgroundColor: COLORS.surfaceMuted,
    padding: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.inputBorder
  },
  dispatchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  dispatchTitle: { color: COLORS.primaryText, fontSize: 14, fontWeight: '700' },
  dispatchDetailsGrid: { gap: 6 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { color: COLORS.textBody, fontSize: 12 },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center'
  },
  actionBtn: { borderRadius: RADIUS.sm },
  centerContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 10 },
  loadingText: { color: COLORS.textBody, fontSize: 14 },
  errorText: { color: COLORS.red, fontSize: 14, textAlign: 'center' },
  allClearTitle: { color: COLORS.textDark, fontSize: 18, fontWeight: '700', marginTop: 8 },
  allClearSubtitle: { color: COLORS.textBody, fontSize: 13, textAlign: 'center', paddingHorizontal: 20 },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dropdownSelectedText: {
    color: COLORS.textDark,
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownListContainer: {
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: RADIUS.sm,
    marginTop: 4,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.dividerLight,
  },
  dropdownItemSelected: {
    backgroundColor: COLORS.blueLight,
  },
  doctorItemName: {
    color: COLORS.textDark,
    fontSize: 13,
    fontWeight: '600',
  },
  doctorItemSub: {
    color: COLORS.textBody,
    fontSize: 11,
    marginTop: 2,
  },
}));
