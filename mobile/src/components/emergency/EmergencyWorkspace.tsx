import { useAppTheme, useThemeValue, usePaperTheme } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { Appbar, Button, Card, Chip, Dialog, Portal, Text, TextInput, ActivityIndicator, Provider as PaperProvider, Avatar } from 'react-native-paper';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/auth';
import { emergencyApi, Ambulance } from '../../api/emergency.api';
import { ClinicalDecisionForm } from '../doctor/ClinicalDecisionForm';
import { apiClient } from '../../api/client';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../theme';
import { goBack, navigate } from '../../utils/navigation';
import { AppearanceSettings, ThemeToggleButton } from '../common/AppearanceSettings';

const nextStatus: Record<string, string[]> = {
  PENDING: ['DISPATCHED', 'CANCELLED'],
  DISPATCHED: ['EN_ROUTE', 'ARRIVED', 'CANCELLED'],
  EN_ROUTE: ['ARRIVED', 'CANCELLED'],
  ARRIVED: ['COMPLETED', 'CANCELLED'],
};

export function EmergencyWorkspace({ fleet = false }: { fleet?: boolean }) {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);
  const paperTheme = usePaperTheme();

  const { user, logout } = useAuthStore();
  const role = user?.role;
  const admin = role === 'ADMIN';
  const isParamedic = role === 'PARAMEDIC';
  const readOnly = role === 'PATIENT';
  const client = useQueryClient();

  const dispatches = useQuery({ queryKey: ['emergency', 'dispatches', user?.id], queryFn: emergencyApi.list, refetchInterval: 5000 });
  const vehicles = useQuery({ queryKey: ['emergency', 'fleet'], queryFn: emergencyApi.fleet, enabled: admin, refetchInterval: 10000 });
  const paramedics = useQuery({ queryKey: ['emergency', 'paramedics'], queryFn: () => apiClient.get<any>('/admin/users?role=PARAMEDIC&limit=100'), enabled: admin });
  const events = useQuery({ queryKey: ['emergency', 'events', user?.id], queryFn: () => apiClient.get<any[]>('/emergency/events'), enabled: role === 'DOCTOR', refetchInterval: 5000 });

  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sharing, setSharing] = useState<string | null>(null);
  const [edit, setEdit] = useState<Partial<Ambulance> | null>(null);
  const [confirmation, setConfirmation] = useState<{ label: string; run: (notes: string) => Promise<unknown> } | null>(null);
  const [notes, setNotes] = useState('');
  const [eta, setEta] = useState('15');
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

  const refresh = async () => {
    await client.invalidateQueries({ queryKey: ['emergency'] });
    await client.invalidateQueries({ queryKey: ['admin'] });
  };

  const run = async (task: () => Promise<unknown>) => {
    setBusy(true);
    setError('');
    try {
      await task();
      await refresh();
      setConfirmation(null);
    } catch (e: any) {
      setError(e.message || 'Operation failed');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (sharing && dispatches.data && !dispatches.data.some(d => d.id === sharing && nextStatus[d.status])) {
      setSharing(null);
    }
  }, [sharing, dispatches.data]);

  useEffect(() => {
    if (!sharing) return;
    let disposed = false;
    let subscription: Location.LocationSubscription | undefined;
    let sending = false;
    void (async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!permission.granted) throw new Error('Location permission denied. Enable permission to share your vehicle location.');
        if (disposed) return;
        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 10000, distanceInterval: 10 },
          async position => {
            if (disposed || sending) return;
            sending = true;
            try {
              await emergencyApi.location(sharing, position.coords.latitude, position.coords.longitude);
              await refresh();
            } catch (e: any) {
              if (!disposed) setError(e.message);
            } finally {
              sending = false;
            }
          }
        );
        if (disposed) subscription.remove();
      } catch (e: any) {
        if (!disposed) {
          setError(e.message);
          setSharing(null);
        }
      }
    })();
    return () => {
      disposed = true;
      subscription?.remove();
    };
  }, [sharing]);

  const confirm = (label: string, task: (notes: string) => Promise<unknown>) => {
    setNotes('');
    setConfirmation({ label, run: task });
  };

  const dataError = dispatches.error || vehicles.error || paramedics.error || events.error;
  const inputProps = {
    mode: 'outlined' as const,
    outlineColor: COLORS.inputBorder,
    activeOutlineColor: COLORS.navy,
    textColor: COLORS.textDark,
    style: styles.input,
  };

  const activeCount = (dispatches.data || []).filter(d => !!nextStatus[d.status]).length;
  const initials = (user?.fullName || 'PM')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0])
    .join('');

  return (
    <PaperProvider theme={paperTheme}>
      <View style={styles.root}>
        <Appbar.Header style={styles.header}>
          {!isParamedic && <Appbar.BackAction onPress={goBack} color={COLORS.headerText} />}
          <Appbar.Content
            title={fleet ? 'Ambulance Fleet' : isParamedic ? 'Paramedic Dispatch Console' : 'Emergency Dispatches'}
            titleStyle={{ color: COLORS.headerText, fontWeight: '800', fontSize: 18 }}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 6 }}>
            <ThemeToggleButton compact inverse />
            {isParamedic && (
              <Appbar.Action
                icon={showSettingsDrawer ? 'close' : 'cog-outline'}
                onPress={() => setShowSettingsDrawer(prev => !prev)}
                color={COLORS.headerText}
              />
            )}
          </View>
        </Appbar.Header>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Paramedic Command & Profile Banner */}
          {isParamedic && (
            <View style={styles.heroCard}>
              <View style={styles.heroProfileRow}>
                <Avatar.Text
                  size={52}
                  label={initials}
                  style={{ backgroundColor: COLORS.navy, borderWidth: 2, borderColor: COLORS.accentBlue }}
                  color={COLORS.headerText}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroEyebrow}>EMERGENCY MEDICAL RESPONDER</Text>
                  <Text style={styles.heroName}>{user?.fullName || 'Paramedic Unit'}</Text>
                  <Text style={styles.heroContact}>{user?.email} · {user?.phone}</Text>
                </View>
                <TouchableOpacity
                  style={styles.settingsChip}
                  onPress={() => setShowSettingsDrawer(prev => !prev)}
                >
                  <Ionicons name="person-circle-outline" size={16} color={COLORS.headerText} />
                  <Text style={styles.settingsChipText}>
                    {showSettingsDrawer ? 'Hide Profile' : 'Profile & Settings'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.kpiRow}>
                <View style={styles.kpiBox}>
                  <Text style={styles.kpiVal}>{activeCount}</Text>
                  <Text style={styles.kpiLabel}>Active Dispatches</Text>
                </View>
                <View style={styles.kpiBox}>
                  <Text style={[styles.kpiVal, { color: COLORS.emerald }]}>
                    {sharing ? 'LIVE GPS' : 'STANDBY'}
                  </Text>
                  <Text style={styles.kpiLabel}>Telemetry</Text>
                </View>
                <View style={styles.kpiBox}>
                  <Text style={styles.kpiVal}>{(dispatches.data || []).length}</Text>
                  <Text style={styles.kpiLabel}>Total Trips</Text>
                </View>
              </View>
            </View>
          )}

          {/* Expandable Profile, Appearance & Account Security Panel (Paramedic) */}
          {isParamedic && showSettingsDrawer && (
            <View style={{ gap: SPACING.md }}>
              <AppearanceSettings />
              <Card style={styles.card}>
                <Card.Content style={{ gap: SPACING.sm }}>
                  <Text style={styles.sectionEyebrow}>ACCOUNT &amp; SECURITY</Text>
                  <Text style={styles.title}>Responder Profile Settings</Text>
                  <Text style={styles.bodyText}>
                    Status: {(user?.status || 'ACTIVE').replaceAll('_', ' ')} · Paramedic Emergency Portal
                  </Text>
                  <View style={styles.actionRow}>
                    <Button
                      mode="contained"
                      buttonColor={COLORS.navy}
                      textColor={COLORS.onAccent}
                      icon="lock-outline"
                      onPress={() => navigate('/auth/change-password')}
                    >
                      Change Password
                    </Button>
                    <Button
                      mode="outlined"
                      textColor={COLORS.primaryText}
                      icon="shield-check-outline"
                      onPress={() => navigate('/auth/security')}
                    >
                      Two-Step Verification
                    </Button>
                    <Button
                      mode="outlined"
                      textColor={COLORS.red}
                      icon="logout"
                      onPress={() => void logout()}
                    >
                      Sign Out
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            </View>
          )}

          {(error || dataError) && (
            <View style={styles.errorBanner}>
              <Text accessibilityRole="alert" style={styles.error}>
                {error || (dataError as Error).message}
              </Text>
            </View>
          )}

          <View style={styles.toolbarRow}>
            <Button
              mode="outlined"
              icon="refresh"
              onPress={() => void refresh()}
              loading={dispatches.isFetching}
              textColor={COLORS.primaryText}
            >
              Refresh Feed
            </Button>
            {fleet && (
              <Button
                mode="contained"
                icon="plus"
                buttonColor={COLORS.navy}
                textColor={COLORS.onAccent}
                onPress={() => setEdit({ vehicleNumber: '', plateNumber: '', type: 'BASIC', status: 'AVAILABLE' })}
              >
                Register Ambulance
              </Button>
            )}
          </View>

          {dispatches.isLoading && <ActivityIndicator color={COLORS.primaryText} />}

          {/* Admin Fleet Management */}
          {fleet && (
            <View style={{ gap: SPACING.sm }}>
              <Card style={styles.card}>
                <Card.Content>
                  <Text style={styles.sectionEyebrow}>FLEET SUMMARY</Text>
                  <Text style={styles.bodyText}>
                    Available: {vehicles.data?.filter(v => v.status === 'AVAILABLE').length || 0} · Dispatched:{' '}
                    {vehicles.data?.filter(v => v.status === 'DISPATCHED').length || 0} · Inactive:{' '}
                    {vehicles.data?.filter(v => v.status === 'INACTIVE').length || 0}
                  </Text>
                </Card.Content>
              </Card>
              {vehicles.data?.map(v => (
                <Card key={v.id} style={styles.card}>
                  <Card.Content style={{ gap: 4 }}>
                    <View style={styles.cardTopRow}>
                      <Text style={styles.title}>{v.vehicleNumber} · {v.plateNumber}</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: v.status === 'AVAILABLE' ? COLORS.emeraldLight : COLORS.amberLight },
                        ]}
                      >
                        <Text
                          style={{
                            color: v.status === 'AVAILABLE' ? COLORS.emerald : COLORS.amber,
                            fontSize: 10.5,
                            fontWeight: '800',
                          }}
                        >
                          {v.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.bodyText}>
                      {v.type} · {v.provider || 'Healix Fleet'} · {v.dispatches?.length || 0} active dispatches
                    </Text>
                  </Card.Content>
                  <Card.Actions>
                    <Button disabled={busy} onPress={() => setEdit(v)}>Edit</Button>
                    <Button
                      disabled={busy}
                      textColor={COLORS.red}
                      onPress={() => confirm('Delete unused vehicle?', () => emergencyApi.deleteVehicle(v.id))}
                    >
                      Delete
                    </Button>
                  </Card.Actions>
                </Card>
              ))}
              {!vehicles.isLoading && !vehicles.data?.length && (
                <Card style={styles.card}>
                  <Card.Content>
                    <Text style={styles.bodyText}>No ambulances registered.</Text>
                  </Card.Content>
                </Card>
              )}
            </View>
          )}

          {/* Doctor Emergency Events */}
          {role === 'DOCTOR' &&
            events.data
              ?.filter(e => !e.dispatches.length)
              .map(e => (
                <Card key={e.id} style={[styles.card, { borderLeftWidth: 4, borderLeftColor: COLORS.red }]}>
                  <Card.Content style={{ gap: 6 }}>
                    <Text style={styles.title}>
                      {e.patient.user.fullName} · {e.severity}
                    </Text>
                    <Text style={styles.bodyText}>
                      Assigned emergency · {new Date(e.createdAt).toLocaleString()}
                    </Text>
                    <Button
                      mode="contained"
                      buttonColor={COLORS.redFill}
                      textColor={COLORS.onAccent}
                      onPress={() => setSelectedEvent(e)}
                    >
                      Review Emergency Transport
                    </Button>
                  </Card.Content>
                </Card>
              ))}

          {selectedEvent && (
            <ClinicalDecisionForm
              patient={selectedEvent.patient}
              onCancel={() => {
                setSelectedEvent(null);
                void refresh();
              }}
            />
          )}

          <Text style={styles.sectionTitle}>Dispatch Records</Text>
          {!dispatches.isLoading && !dispatches.data?.length && (
            <Card style={styles.card}>
              <Card.Content style={{ alignItems: 'center', paddingVertical: SPACING.lg }}>
                <Ionicons name="car-outline" size={32} color={COLORS.textMuted} />
                <Text style={[styles.bodyText, { marginTop: 6 }]}>No active or past dispatch records.</Text>
              </Card.Content>
            </Card>
          )}

          {dispatches.data?.map(d => {
            const active = !!nextStatus[d.status];
            const stale = !d.locationUpdatedAt || Date.now() - Date.parse(d.locationUpdatedAt) > 120000;
            const elapsed = Math.floor((Date.now() - Date.parse(d.etaUpdatedAt || d.dispatchedAt)) / 60000);
            const remainingEta = active ? Math.max(0, d.etaMinutes - elapsed) : 0;

            return (
              <Card
                key={d.id}
                style={[
                  styles.card,
                  { borderLeftWidth: 4, borderLeftColor: active ? COLORS.red : COLORS.emerald },
                ]}
              >
                <Card.Content style={{ gap: SPACING.sm }}>
                  <View style={styles.cardTopRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.title}>{d.patient.user.fullName}</Text>
                      <Text style={styles.bodyText}>
                        Unit: {d.ambulance?.vehicleNumber || 'Unassigned'} · Paramedic:{' '}
                        {d.paramedic?.user.fullName || 'Unassigned'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: active ? COLORS.redLight : COLORS.emeraldLight },
                      ]}
                    >
                      <Text
                        style={{
                          color: active ? COLORS.red : COLORS.emerald,
                          fontSize: 11,
                          fontWeight: '800',
                        }}
                      >
                        {d.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.metaGrid}>
                    <View style={styles.metaBox}>
                      <Text style={styles.metaLabel}>Destination</Text>
                      <Text style={styles.metaValue}>{d.hospital.name}</Text>
                    </View>
                    <View style={styles.metaBox}>
                      <Text style={styles.metaLabel}>ETA ({d.etaUpdatedAt ? 'Live' : 'Initial'})</Text>
                      <Text style={styles.metaValue}>{remainingEta} min</Text>
                    </View>
                  </View>

                  {d.latitude != null && d.longitude != null ? (
                    <View style={styles.locationRow}>
                      <Ionicons name="location-outline" size={16} color={stale ? COLORS.amber : COLORS.emerald} />
                      <Text style={[styles.bodyText, { flex: 1 }]}>
                        GPS {stale ? 'STALE' : 'Live'} · {new Date(d.locationUpdatedAt!).toLocaleTimeString()}
                      </Text>
                      <Button
                        compact
                        mode="outlined"
                        onPress={() =>
                          void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${d.latitude},${d.longitude}`)
                        }
                      >
                        Open Map
                      </Button>
                    </View>
                  ) : (
                    <Text style={styles.bodyText}>Vehicle GPS location has not been shared yet.</Text>
                  )}

                  {!!d.notes && <Text style={styles.bodyText}>Notes: {d.notes}</Text>}

                  {!readOnly && (
                    <>
                      <View style={styles.row}>
                        {nextStatus[d.status]?.map(status => (
                          <Button
                            key={status}
                            disabled={busy}
                            mode={status === 'CANCELLED' ? 'outlined' : 'contained'}
                            buttonColor={status === 'CANCELLED' ? undefined : COLORS.navy}
                            textColor={status === 'CANCELLED' ? COLORS.red : COLORS.onAccent}
                            compact
                            onPress={() =>
                              confirm(`Mark dispatch ${status.toLowerCase().replace('_', ' ')}?`, note =>
                                emergencyApi.status(d.id, status, note)
                              )
                            }
                          >
                            {status.replace('_', ' ')}
                          </Button>
                        ))}
                      </View>

                      {role === 'PARAMEDIC' && active && (
                        <View style={styles.telemetryCard}>
                          <Button
                            mode={sharing === d.id ? 'contained' : 'outlined'}
                            buttonColor={sharing === d.id ? COLORS.emeraldFill : undefined}
                            textColor={sharing === d.id ? COLORS.onAccent : COLORS.primaryText}
                            icon={sharing === d.id ? 'broadcast' : 'crosshairs-gps'}
                            disabled={busy}
                            onPress={() => setSharing(sharing === d.id ? null : d.id)}
                          >
                            {sharing === d.id ? 'Stop Sharing Live GPS' : 'Share Live Location'}
                          </Button>
                          <TextInput
                            {...inputProps}
                            label="Updated ETA estimate (minutes)"
                            value={eta}
                            onChangeText={setEta}
                            keyboardType="number-pad"
                          />
                          <Button
                            mode="contained"
                            buttonColor={COLORS.navy}
                            textColor={COLORS.onAccent}
                            disabled={busy}
                            onPress={() =>
                              void run(async () => {
                                const n = Number(eta);
                                if (!eta.trim() || !Number.isInteger(n) || n < 0 || n > 1440) {
                                  throw new Error('Enter a valid ETA in minutes (0–1440)');
                                }
                                const permission = await Location.requestForegroundPermissionsAsync();
                                if (!permission.granted) throw new Error('Location permission denied');
                                const p = await Location.getCurrentPositionAsync({});
                                return emergencyApi.location(d.id, p.coords.latitude, p.coords.longitude, n);
                              })
                            }
                          >
                            Update ETA &amp; Current Location
                          </Button>
                        </View>
                      )}

                      {admin && active && (
                        <View style={{ gap: 6 }}>
                          <Text style={styles.subTitle}>Reassign Ambulance</Text>
                          <View style={styles.row}>
                            {vehicles.data
                              ?.filter(v => v.status === 'AVAILABLE')
                              .map(v => (
                                <Chip
                                  key={v.id}
                                  disabled={busy}
                                  onPress={() =>
                                    confirm(`Assign ${v.vehicleNumber}?`, () =>
                                      apiClient.post(`/admin/emergencies/${d.id}/assign-ambulance`, { ambulanceId: v.id })
                                    )
                                  }
                                >
                                  {v.vehicleNumber}
                                </Chip>
                              ))}
                          </View>
                          <Text style={styles.subTitle}>Reassign Paramedic</Text>
                          <View style={styles.row}>
                            {paramedics.data?.users
                              ?.filter((u: any) => u.status === 'ACTIVE' && u.paramedic?.verificationStatus === 'VERIFIED')
                              .map((u: any) => (
                                <Chip
                                  key={u.id}
                                  disabled={busy}
                                  onPress={() =>
                                    confirm(`Assign ${u.fullName}?`, () =>
                                      apiClient.post(`/admin/emergencies/${d.id}/assign-paramedic`, {
                                        paramedicId: u.paramedic.id,
                                      })
                                    )
                                  }
                                >
                                  {u.fullName}
                                </Chip>
                              ))}
                          </View>
                        </View>
                      )}

                      {d.status !== 'CANCELLED' && !d.admissions.length && (
                        <Button
                          mode="outlined"
                          textColor={COLORS.primaryText}
                          disabled={busy}
                          onPress={() => confirm('Record hospital admission request?', () => emergencyApi.admission(d.id))}
                        >
                          Request Hospital Admission
                        </Button>
                      )}
                    </>
                  )}

                  {d.admissions.map(a => (
                    <View key={a.id} style={styles.admissionBox}>
                      <Text style={{ color: COLORS.textDark, fontWeight: '700', fontSize: 13 }}>
                        Hospital Admission: {a.status}
                      </Text>
                      {!!a.dischargeNotes && <Text style={styles.bodyText}>{a.dischargeNotes}</Text>}
                      {!readOnly && a.status !== 'DISCHARGED' && (
                        <Button
                          mode="contained"
                          buttonColor={COLORS.navy}
                          textColor={COLORS.onAccent}
                          compact
                          disabled={busy}
                          onPress={() =>
                            confirm(
                              a.status === 'REQUESTED'
                                ? 'Confirm hospital admission?'
                                : 'Record discharge and draft follow-up care?',
                              note =>
                                emergencyApi.admissionStatus(
                                  a.id,
                                  a.status === 'REQUESTED' ? 'ADMITTED' : 'DISCHARGED',
                                  note
                                )
                            )
                          }
                        >
                          {a.status === 'REQUESTED' ? 'Confirm Admitted' : 'Record Discharge'}
                        </Button>
                      )}
                    </View>
                  ))}
                </Card.Content>
              </Card>
            );
          })}
        </ScrollView>

        <Portal>
          <Dialog visible={!!edit} onDismiss={() => !busy && setEdit(null)} style={{ backgroundColor: COLORS.surfaceCard }}>
            <Dialog.Title style={{ color: COLORS.textDark }}>{edit?.id ? 'Edit Ambulance' : 'Register Ambulance'}</Dialog.Title>
            <Dialog.Content>
              {(['vehicleNumber', 'plateNumber', 'provider', 'contactNumber'] as const).map(key => (
                <TextInput
                  key={key}
                  {...inputProps}
                  label={
                    ({
                      vehicleNumber: 'Vehicle number',
                      plateNumber: 'Plate number',
                      provider: 'Provider',
                      contactNumber: 'Contact number',
                    } as Record<string, string>)[key]
                  }
                  value={edit?.[key] || ''}
                  onChangeText={value => setEdit(current => ({ ...current, [key]: value }))}
                />
              ))}
              <View style={styles.row}>
                {['BASIC', 'ADVANCED', 'ICU'].map(type => (
                  <Chip key={type} selected={edit?.type === type} onPress={() => setEdit(current => ({ ...current, type }))}>
                    {type}
                  </Chip>
                ))}
              </View>
              {edit?.status !== 'DISPATCHED' && (
                <View style={styles.row}>
                  {['AVAILABLE', 'INACTIVE'].map(status => (
                    <Chip
                      key={status}
                      selected={edit?.status === status}
                      onPress={() => setEdit(current => ({ ...current, status }))}
                    >
                      {status}
                    </Chip>
                  ))}
                </View>
              )}
              {!!error && <Text style={styles.error}>{error}</Text>}
            </Dialog.Content>
            <Dialog.Actions>
              <Button disabled={busy} onPress={() => setEdit(null)}>Cancel</Button>
              <Button
                mode="contained"
                buttonColor={COLORS.navy}
                textColor={COLORS.onAccent}
                loading={busy}
                disabled={busy}
                onPress={() =>
                  void run(async () => {
                    if (!edit?.vehicleNumber?.trim() || !edit.plateNumber?.trim()) {
                      throw new Error('Vehicle and plate numbers are required');
                    }
                    const { id, dispatches: _dispatches, status, ...fields } = edit;
                    await emergencyApi.saveVehicle(id, {
                      vehicleNumber: fields.vehicleNumber,
                      plateNumber: fields.plateNumber,
                      provider: fields.provider,
                      contactNumber: fields.contactNumber,
                      type: fields.type,
                      ...(status !== 'DISPATCHED' ? { status } : {}),
                    });
                    setEdit(null);
                  })
                }
              >
                Save Vehicle
              </Button>
            </Dialog.Actions>
          </Dialog>

          <Dialog
            visible={!!confirmation}
            onDismiss={() => !busy && setConfirmation(null)}
            style={{ backgroundColor: COLORS.surfaceCard }}
          >
            <Dialog.Title style={{ color: COLORS.textDark }}>{confirmation?.label}</Dialog.Title>
            <Dialog.Content>
              <TextInput
                {...inputProps}
                label="Notes (optional)"
                value={notes}
                onChangeText={setNotes}
                multiline
              />
              {!!error && <Text style={styles.error}>{error}</Text>}
            </Dialog.Content>
            <Dialog.Actions>
              <Button disabled={busy} onPress={() => setConfirmation(null)}>Cancel</Button>
              <Button
                mode="contained"
                buttonColor={COLORS.navy}
                textColor={COLORS.onAccent}
                disabled={busy}
                loading={busy}
                onPress={() => confirmation && void run(() => confirmation.run(notes))}
              >
                Confirm
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    </PaperProvider>
  );
}

const createStyles = (COLORS: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.surface },
    header: { backgroundColor: COLORS.navyDark },
    content: { padding: SPACING.lg, gap: SPACING.md, paddingBottom: SPACING.xxxl },
    heroCard: {
      backgroundColor: COLORS.navyDark,
      borderRadius: RADIUS.lg,
      padding: SPACING.lg,
      gap: SPACING.md,
    },
    heroProfileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.md,
    },
    heroEyebrow: {
      color: COLORS.accentBlue,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    heroName: {
      color: COLORS.headerText,
      fontSize: 18,
      fontWeight: '800',
    },
    heroContact: {
      color: COLORS.inverseMuted,
      fontSize: 11.5,
      marginTop: 2,
    },
    settingsChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: COLORS.headerAvatarBg,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: RADIUS.round,
    },
    settingsChipText: {
      color: COLORS.headerText,
      fontSize: 11,
      fontWeight: '700',
    },
    kpiRow: { flexDirection: 'row', gap: SPACING.sm },
    kpiBox: {
      flex: 1,
      backgroundColor: COLORS.headerAvatarBg,
      borderRadius: RADIUS.md,
      paddingVertical: 10,
      alignItems: 'center',
    },
    kpiVal: { color: COLORS.headerText, fontSize: 17, fontWeight: '800' },
    kpiLabel: { color: COLORS.inverseMuted, fontSize: 11, fontWeight: '600', marginTop: 2 },
    toolbarRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
    card: {
      backgroundColor: COLORS.surfaceCard,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: COLORS.inputBorder,
    },
    cardTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: SPACING.sm,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: RADIUS.round,
    },
    sectionEyebrow: {
      color: COLORS.textMuted,
      fontSize: 10.5,
      fontWeight: '800',
      letterSpacing: 0.7,
    },
    sectionTitle: {
      color: COLORS.textDark,
      fontSize: TYPOGRAPHY.sizes.md,
      fontWeight: '800',
      marginTop: SPACING.xs,
    },
    title: {
      color: COLORS.textDark,
      fontSize: TYPOGRAPHY.sizes.lg,
      fontWeight: TYPOGRAPHY.weights.bold,
    },
    subTitle: {
      color: COLORS.textDark,
      fontSize: 13,
      fontWeight: '700',
      marginTop: 4,
    },
    bodyText: {
      color: COLORS.textBody,
      fontSize: TYPOGRAPHY.sizes.sm,
    },
    metaGrid: { flexDirection: 'row', gap: SPACING.sm },
    metaBox: {
      flex: 1,
      backgroundColor: COLORS.surface,
      borderRadius: RADIUS.sm,
      borderWidth: 1,
      borderColor: COLORS.inputBorder,
      padding: SPACING.sm,
    },
    metaLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '600' },
    metaValue: { color: COLORS.textDark, fontSize: 13, fontWeight: '800', marginTop: 2 },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: COLORS.surface,
      padding: SPACING.sm,
      borderRadius: RADIUS.sm,
    },
    telemetryCard: {
      backgroundColor: COLORS.surface,
      padding: SPACING.md,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: COLORS.inputBorder,
      gap: SPACING.sm,
    },
    admissionBox: {
      backgroundColor: COLORS.surface,
      padding: SPACING.md,
      borderRadius: RADIUS.sm,
      borderWidth: 1,
      borderColor: COLORS.inputBorder,
      gap: 6,
    },
    actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
    errorBanner: {
      backgroundColor: COLORS.redLight,
      borderWidth: 1,
      borderColor: COLORS.red,
      borderRadius: RADIUS.md,
      padding: SPACING.md,
    },
    error: { color: COLORS.red, fontWeight: '600' },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginVertical: SPACING.xs },
    input: { marginBottom: SPACING.sm, backgroundColor: COLORS.surfaceCard },
  });
