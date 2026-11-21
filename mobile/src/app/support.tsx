


import { useEffect, useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Switch, Divider, Chip } from 'react-native-paper';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { useAuthStore } from '../store/auth';
import { apiClient } from '../api/client';
import { WorkflowPage, useFlowStyles } from '../components/common/WorkflowPage';
import { useAppTheme } from '../theme/ThemeProvider';
import { RADIUS, SPACING, TYPOGRAPHY } from '../theme';

const PROFILE_REASONS = [
  'Verified user contact correction requested by holder',
  'Updated full name to match official CNIC registry',
];

const CAPABILITY_REASONS = [
  'Updated role access policy per clinical governance',
  'Temporary restriction during operational audit review',
];

export default function SupportAndOperations() {
  const s = useFlowStyles();
  const { colors: COLORS } = useAppTheme();

  const actor = useAuthStore(state => state.user);
  const admin = actor?.role === 'ADMIN';
  const patient = actor?.role === 'PATIENT';
  const qc = useQueryClient();
  const params = useLocalSearchParams<{ paymentId?: string; visitId?: string }>();

  const [page, setPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [draft, setDraft] = useState({
    requestKey: Crypto.randomUUID(),
    kind: 'DISPUTE',
    paymentId: params.paymentId || '',
    visitId: params.visitId || '',
    amount: '',
    reason: '',
  });
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [references, setReferences] = useState<Record<string, string>>({});
  const [dates, setDates] = useState<Record<string, string>>({});
  const [permission, setPermission] = useState({
    role: 'PATIENT',
    feature: 'ANALYTICS',
    operation: 'READ',
    allowed: true,
    reason: '',
  });
  const [edit, setEdit] = useState({ id: '', role: '', fullName: '', phone: '', reason: '' });

  const cases = useQuery({
    queryKey: ['support-cases', actor?.id, page],
    queryFn: () => apiClient.get<any>(`/support/cases?page=${page}`),
    enabled: !!(admin || patient),
    refetchInterval: 30000,
  });

  const extras = useQuery({
    queryKey: ['support-extras', actor?.id, userPage, userSearch],
    queryFn: async () => {
      if (admin) {
        const searchQs = userSearch.trim() ? `&search=${encodeURIComponent(userSearch.trim())}` : '';
        const [payments, permissions, monitor, users] = await Promise.all([
          apiClient.get<any>('/admin/payments'),
          apiClient.get<any>('/admin/permissions'),
          apiClient.get<any>('/admin/operations/monitor'),
          apiClient.get<any>(`/admin/users?limit=20&page=${userPage}${searchQs}`),
        ]);
        return {
          payments: payments.items,
          permissions,
          monitor,
          users: users.users,
          userTotal: users.total,
          visits: [],
        };
      }
      const [payments, requests] = await Promise.all([
        apiClient.get<any[]>(`/patients/${actor!.patientId}/payments`),
        apiClient.get<any[]>('/patients/requests'),
      ]);
      return {
        payments,
        visits: requests.flatMap(r => r.visits || []),
        users: [],
        userTotal: 0,
        permissions: null,
        monitor: null,
      };
    },
    enabled: !!(admin || patient),
  });

  const permissionData = extras.data?.permissions;
  useEffect(() => {
    if (!permissionData) return;
    setPermission(current => {
      const saved = permissionData.overrides.find(
        (p: any) => p.role === current.role && p.feature === current.feature && p.operation === current.operation
      );
      return { ...current, allowed: saved ? saved.allowed : true };
    });
  }, [permissionData]);

  // Auto-select first editable user so Edit User Profile is immediately active and clear
  const loadedUsers: any[] | undefined = extras.data?.users;
  useEffect(() => {
    if (!admin || !loadedUsers?.length || edit.id) return;
    const firstEditable = loadedUsers.find(u => u.role !== 'ADMIN' || u.id === actor?.id) || loadedUsers[0];
    if (firstEditable) {
      setEdit({
        id: firstEditable.id,
        role: firstEditable.role,
        fullName: firstEditable.fullName || '',
        phone: firstEditable.phone || '',
        reason: '',
      });
    }
  }, [admin, loadedUsers, edit.id, actor?.id]);

  const run = async (task: () => Promise<unknown>, success: string) => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await task();
      setMessage(success);
      await qc.invalidateQueries({ queryKey: ['support-cases'] });
      await qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      await extras.refetch();
    } catch (e: any) {
      setError(e.message || 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  const submit = () =>
    run(async () => {
      await apiClient.post('/support/cases', {
        requestKey: draft.requestKey,
        kind: draft.kind,
        ...(draft.paymentId ? { paymentId: draft.paymentId } : {}),
        ...(draft.visitId ? { visitId: draft.visitId } : {}),
        ...(draft.kind === 'REFUND' ? { amount: Number(draft.amount) } : {}),
        reason: draft.reason,
      });
      setDraft({ ...draft, requestKey: Crypto.randomUUID(), reason: '', amount: '' });
    }, 'Support request recorded. No money is transferred by this form.');

  const update = (item: any, status: string) =>
    run(
      () =>
        apiClient.put(`/admin/support/cases/${item.id}`, {
          status,
          notes: notes[item.id] || '',
          ...(status === 'RECORDED'
            ? { externalReference: references[item.id] || '', completedAt: dates[item.id] || '' }
            : {}),
        }),
      'Support case updated.'
    );

  const selectCapability = (roleVal: string, featureVal: string, opVal: string) => {
    const saved = permissionData?.overrides.find(
      (p: any) => p.role === roleVal && p.feature === featureVal && p.operation === opVal
    );
    setPermission({
      role: roleVal,
      feature: featureVal,
      operation: opVal,
      allowed: saved ? saved.allowed : true,
      reason: permission.reason,
    });
  };

  const inputProps = {
    mode: 'outlined' as const,
    outlineColor: COLORS.inputBorder,
    activeOutlineColor: COLORS.navy,
    textColor: COLORS.textDark,
    style: s.input,
  };

  if (!admin && !patient) {
    return (
      <WorkflowPage title="Support">
        <View style={s.card}>
          <Text style={s.body}>Sign in as a patient or administrator to manage support cases.</Text>
        </View>
      </WorkflowPage>
    );
  }

  const isOtherAdminSelected = edit.role === 'ADMIN' && edit.id !== actor?.id;
  const profileFormValid =
    !!edit.id &&
    !isOtherAdminSelected &&
    edit.fullName.trim().length >= 3 &&
    edit.phone.trim().length >= 10 &&
    edit.reason.trim().length >= 10;
  const capabilityFormValid = permission.reason.trim().length >= 10;

  return (
    <WorkflowPage
      title={admin ? 'Support & Admin Operations' : 'Refunds & Care Concerns'}
      loading={cases.isLoading || extras.isLoading}
      error={error || cases.error?.message || extras.error?.message}
      retry={() => {
        void cases.refetch();
        void extras.refetch();
      }}
    >
      {!!message && (
        <View style={s.successBanner}>
          <Text style={{ color: COLORS.emerald, fontWeight: '700' }} accessibilityRole="alert">
            ✓ {message}
          </Text>
        </View>
      )}

      {/* PATIENT SUPPORT REQUEST FORM */}
      {patient && (
        <View style={s.card}>
          <Text style={s.subtitle}>SUBMIT CARE DISPUTE OR REFUND</Text>
          <Text style={s.title}>New support request</Text>
          <View style={s.row}>
            {['DISPUTE', 'REFUND'].map(kind => (
              <Button
                key={kind}
                mode={draft.kind === kind ? 'contained' : 'outlined'}
                buttonColor={draft.kind === kind ? COLORS.navy : undefined}
                textColor={draft.kind === kind ? COLORS.onAccent : COLORS.primaryText}
                onPress={() => setDraft({ ...draft, kind, visitId: kind === 'REFUND' ? '' : draft.visitId })}
              >
                {kind === 'REFUND' ? 'Refund request' : 'Care concern'}
              </Button>
            ))}
          </View>
          <Text style={s.body}>Choose your recorded payment or visit:</Text>
          {extras.data && extras.data.payments.length === 0 && (
            <Text style={s.body}>No payment records available.</Text>
          )}
          {draft.kind === 'DISPUTE' && extras.data && extras.data.visits.length === 0 && (
            <Text style={s.body}>No visit records available. A concern must relate to one of your visits or payments.</Text>
          )}
          <View style={s.row}>
            {extras.data?.payments.map((p: any) => (
              <Chip
                key={p.id}
                selected={draft.paymentId === p.id}
                onPress={() => setDraft({ ...draft, paymentId: p.id, visitId: '' })}
                style={{
                  backgroundColor: draft.paymentId === p.id ? COLORS.blueLight : COLORS.surfaceMuted,
                  borderColor: draft.paymentId === p.id ? COLORS.navy : COLORS.inputBorder,
                  borderWidth: 1,
                }}
              >
                PKR {p.amount} · {p.status} · {p.id.slice(0, 6)}
              </Chip>
            ))}
          </View>
          {draft.kind === 'DISPUTE' && (
            <View style={s.row}>
              {extras.data?.visits.map((v: any) => (
                <Chip
                  key={v.id}
                  selected={draft.visitId === v.id}
                  onPress={() => setDraft({ ...draft, visitId: v.id, paymentId: '' })}
                  style={{
                    backgroundColor: draft.visitId === v.id ? COLORS.blueLight : COLORS.surfaceMuted,
                    borderColor: draft.visitId === v.id ? COLORS.navy : COLORS.inputBorder,
                    borderWidth: 1,
                  }}
                >
                  Visit {v.id.slice(0, 8)} · {v.status}
                </Chip>
              ))}
            </View>
          )}
          {draft.kind === 'REFUND' && (
            <TextInput
              {...inputProps}
              label="Requested refund (PKR)"
              keyboardType="decimal-pad"
              value={draft.amount}
              onChangeText={amount => setDraft({ ...draft, amount })}
            />
          )}
          <TextInput
            {...inputProps}
            label="Reason (at least 10 characters)"
            multiline
            numberOfLines={3}
            value={draft.reason}
            maxLength={5000}
            onChangeText={reason => setDraft({ ...draft, reason })}
          />
          <Text style={[s.body, { fontSize: 11.5 }]}>
            {draft.reason.trim().length}/10 minimum characters
          </Text>
          <Button
            mode="contained"
            buttonColor={COLORS.navy}
            textColor={COLORS.onAccent}
            disabled={busy || draft.reason.trim().length < 10 || (!draft.paymentId && !draft.visitId)}
            loading={busy}
            onPress={() => void submit()}
          >
            Submit support request
          </Button>
        </View>
      )}

      {/* ADMIN SECTION 1: EDIT USER PROFILE (ACTIVE & PRE-SELECTED) */}
      {admin && (
        <View style={s.card}>
          <Text style={s.subtitle}>IDENTITY GOVERNANCE</Text>
          <Text style={s.title}>Edit a User Profile</Text>
          <Text style={s.body}>
            Select any Patient, Nurse, Doctor, or Paramedic (or your own Admin account) to update contact details with an audit reason.
          </Text>

          <TextInput
            {...inputProps}
            label="Search users by name or email"
            value={userSearch}
            onChangeText={val => {
              setUserSearch(val);
              setUserPage(1);
            }}
            left={<TextInput.Icon icon="magnify" />}
            right={userSearch ? <TextInput.Icon icon="close" onPress={() => setUserSearch('')} /> : undefined}
          />

          <View style={s.row}>
            <Button
              mode="outlined"
              compact
              disabled={userPage === 1}
              onPress={() => setUserPage(userPage - 1)}
            >
              Prev
            </Button>
            <Text style={s.body}>
              Page {userPage} · {extras.data?.userTotal ?? 0} total
            </Text>
            <Button
              mode="outlined"
              compact
              disabled={!extras.data || userPage * 20 >= extras.data.userTotal}
              onPress={() => setUserPage(userPage + 1)}
            >
              Next
            </Button>
          </View>

          <View style={{ gap: 8 }}>
            {extras.data?.users.map((u: any) => {
              const selected = edit.id === u.id;
              const lockedAdmin = u.role === 'ADMIN' && u.id !== actor?.id;
              return (
                <TouchableOpacity
                  key={u.id}
                  activeOpacity={0.8}
                  onPress={() =>
                    setEdit({
                      id: u.id,
                      role: u.role,
                      fullName: u.fullName || '',
                      phone: u.phone || '',
                      reason: edit.reason,
                    })
                  }
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: SPACING.md,
                    borderRadius: RADIUS.md,
                    borderWidth: selected ? 1.5 : 1,
                    borderColor: selected ? COLORS.navy : COLORS.inputBorder,
                    backgroundColor: selected ? COLORS.blueLight : COLORS.surface,
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={{ color: COLORS.textDark, fontWeight: '700', fontSize: 13.5 }}>
                      {u.fullName}
                    </Text>
                    <Text style={{ color: COLORS.textBody, fontSize: 11.5 }}>
                      {u.email} · {u.phone}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <View
                      style={{
                        backgroundColor: selected ? COLORS.navy : COLORS.surfaceMuted,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: RADIUS.round,
                      }}
                    >
                      <Text
                        style={{
                          color: selected ? COLORS.onAccent : COLORS.primaryText,
                          fontSize: 10.5,
                          fontWeight: '800',
                        }}
                      >
                        {u.role}
                      </Text>
                    </View>
                    {lockedAdmin && (
                      <Text style={{ color: COLORS.textMuted, fontSize: 10 }}>Self-managed</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <Divider style={{ backgroundColor: COLORS.dividerLight, marginVertical: SPACING.sm }} />

          {!!edit.id && (
            <View style={{ gap: SPACING.sm }}>
              <Text style={{ color: COLORS.primaryText, fontWeight: '800', fontSize: 13 }}>
                Editing: {edit.fullName || 'Selected User'} ({edit.role})
              </Text>
              {isOtherAdminSelected && (
                <View style={s.errorBanner}>
                  <Text style={{ color: COLORS.red, fontSize: 12.5, fontWeight: '600' }}>
                    Other administrator accounts manage their own profile. Select a Patient, Nurse, Doctor, Paramedic, or your own account.
                  </Text>
                </View>
              )}
              <TextInput
                {...inputProps}
                label="Full name (min 3 characters)"
                value={edit.fullName}
                onChangeText={fullName => setEdit({ ...edit, fullName })}
              />
              <TextInput
                {...inputProps}
                label="Phone (Pakistan format e.g. +923001234567 or 03001234567)"
                value={edit.phone}
                keyboardType="phone-pad"
                onChangeText={phone => setEdit({ ...edit, phone })}
              />
              <TextInput
                {...inputProps}
                label="Audit reason (at least 10 characters)"
                multiline
                value={edit.reason}
                onChangeText={reason => setEdit({ ...edit, reason })}
              />
              <Text style={{ color: edit.reason.trim().length >= 10 ? COLORS.emerald : COLORS.textMuted, fontSize: 11.5, fontWeight: '600' }}>
                Audit reason length: {edit.reason.trim().length}/10 minimum characters
              </Text>
              <View style={s.row}>
                {PROFILE_REASONS.map(preset => (
                  <Chip
                    key={preset}
                    compact
                    onPress={() => setEdit(prev => ({ ...prev, reason: preset }))}
                    style={{ backgroundColor: COLORS.surfaceMuted }}
                  >
                    {preset.slice(0, 26)}...
                  </Chip>
                ))}
              </View>
              <Button
                mode="contained"
                buttonColor={COLORS.navy}
                textColor={COLORS.onAccent}
                loading={busy}
                disabled={busy || !profileFormValid}
                onPress={() =>
                  void run(
                    () =>
                      apiClient.put(`/admin/users/${edit.id}/profile`, {
                        fullName: edit.fullName.trim(),
                        phone: edit.phone.trim(),
                        reason: edit.reason.trim(),
                      }),
                    `Updated profile for ${edit.fullName.trim()}.`
                  )
                }
              >
                Save User Profile
              </Button>
            </View>
          )}
        </View>
      )}

      {/* ADMIN SECTION 2: ROLE CAPABILITIES */}
      {admin && extras.data?.permissions && (
        <View style={s.card}>
          <Text style={s.subtitle}>ACCESS POLICY MATRIX</Text>
          <Text style={s.title}>Role Capabilities</Text>
          <Text style={s.body}>{extras.data.permissions.rule}</Text>

          <Text style={{ color: COLORS.textDark, fontWeight: '700', fontSize: 12.5, marginTop: 4 }}>
            1. Select Role
          </Text>
          <View style={s.row}>
            {extras.data.permissions.roles.map((roleVal: string) => {
              const active = permission.role === roleVal;
              return (
                <Button
                  key={roleVal}
                  compact
                  mode={active ? 'contained' : 'outlined'}
                  buttonColor={active ? COLORS.navy : undefined}
                  textColor={active ? COLORS.onAccent : COLORS.primaryText}
                  onPress={() => selectCapability(roleVal, permission.feature, permission.operation)}
                >
                  {roleVal}
                </Button>
              );
            })}
          </View>

          <Text style={{ color: COLORS.textDark, fontWeight: '700', fontSize: 12.5, marginTop: 4 }}>
            2. Feature Module
          </Text>
          <View style={s.row}>
            {extras.data.permissions.features.map((featVal: string) => {
              const active = permission.feature === featVal;
              return (
                <Button
                  key={featVal}
                  compact
                  mode={active ? 'contained' : 'outlined'}
                  buttonColor={active ? COLORS.navy : undefined}
                  textColor={active ? COLORS.onAccent : COLORS.primaryText}
                  onPress={() => selectCapability(permission.role, featVal, permission.operation)}
                >
                  {featVal}
                </Button>
              );
            })}
          </View>

          <Text style={{ color: COLORS.textDark, fontWeight: '700', fontSize: 12.5, marginTop: 4 }}>
            3. Operation
          </Text>
          <View style={s.row}>
            {['READ', 'WRITE'].map(opVal => {
              const active = permission.operation === opVal;
              return (
                <Button
                  key={opVal}
                  compact
                  mode={active ? 'contained' : 'outlined'}
                  buttonColor={active ? COLORS.navy : undefined}
                  textColor={active ? COLORS.onAccent : COLORS.primaryText}
                  onPress={() => selectCapability(permission.role, permission.feature, opVal)}
                >
                  {opVal}
                </Button>
              );
            })}
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: SPACING.md,
              borderRadius: RADIUS.md,
              backgroundColor: permission.allowed ? COLORS.emeraldLight : COLORS.redLight,
              borderWidth: 1,
              borderColor: permission.allowed ? COLORS.emerald : COLORS.red,
              marginTop: 4,
            }}
          >
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={{ color: COLORS.textDark, fontWeight: '700', fontSize: 13 }}>
                {permission.role} · {permission.feature} · {permission.operation}
              </Text>
              <Text style={{ color: permission.allowed ? COLORS.emerald : COLORS.red, fontSize: 12, fontWeight: '700' }}>
                {permission.allowed ? 'ALLOWED (Within built-in ownership & role rules)' : 'DISABLED (Blocked across routes)'}
              </Text>
            </View>
            <Switch
              value={permission.allowed}
              onValueChange={val => setPermission({ ...permission, allowed: val })}
              color={COLORS.emerald}
            />
          </View>

          <TextInput
            {...inputProps}
            label="Audit reason (at least 10 characters)"
            multiline
            value={permission.reason}
            onChangeText={reason => setPermission({ ...permission, reason })}
          />
          <Text style={{ color: permission.reason.trim().length >= 10 ? COLORS.emerald : COLORS.textMuted, fontSize: 11.5, fontWeight: '600' }}>
            Audit reason length: {permission.reason.trim().length}/10 minimum characters
          </Text>
          <View style={s.row}>
            {CAPABILITY_REASONS.map(preset => (
              <Chip
                key={preset}
                compact
                onPress={() => setPermission(prev => ({ ...prev, reason: preset }))}
                style={{ backgroundColor: COLORS.surfaceMuted }}
              >
                {preset.slice(0, 26)}...
              </Chip>
            ))}
          </View>

          <Button
            mode="contained"
            buttonColor={COLORS.navy}
            textColor={COLORS.onAccent}
            loading={busy}
            disabled={busy || !capabilityFormValid}
            onPress={() =>
              void run(
                () =>
                  apiClient.put('/admin/permissions', {
                    ...permission,
                    reason: permission.reason.trim(),
                  }),
                `Saved ${permission.role} ${permission.feature} (${permission.operation}) = ${permission.allowed ? 'ENABLED' : 'DISABLED'}.`
              )
            }
          >
            Save Role Capability
          </Button>

          <Divider style={{ backgroundColor: COLORS.dividerLight, marginVertical: SPACING.sm }} />
          <Text style={{ color: COLORS.textDark, fontWeight: '700', fontSize: 13 }}>
            Active Capability Overrides ({extras.data.permissions.overrides.length})
          </Text>
          {extras.data.permissions.overrides.length === 0 ? (
            <Text style={s.body}>No explicit overrides saved yet. Default role permissions apply.</Text>
          ) : (
            <View style={{ gap: 6 }}>
              {extras.data.permissions.overrides.map((ov: any) => (
                <TouchableOpacity
                  key={`${ov.role}-${ov.feature}-${ov.operation}`}
                  activeOpacity={0.8}
                  onPress={() =>
                    setPermission({
                      role: ov.role,
                      feature: ov.feature,
                      operation: ov.operation,
                      allowed: ov.allowed,
                      reason: permission.reason || 'Adjusting saved capability override policy',
                    })
                  }
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: SPACING.sm,
                    borderRadius: RADIUS.sm,
                    backgroundColor: COLORS.surface,
                    borderWidth: 1,
                    borderColor: COLORS.inputBorder,
                  }}
                >
                  <Text style={{ color: COLORS.textDark, fontSize: 12.5, fontWeight: '600' }}>
                    {ov.role} · {ov.feature} · {ov.operation}
                  </Text>
                  <Text
                    style={{
                      color: ov.allowed ? COLORS.emerald : COLORS.red,
                      fontSize: 11.5,
                      fontWeight: '800',
                    }}
                  >
                    {ov.allowed ? 'ALLOWED' : 'BLOCKED'} · Edit
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {/* SUPPORT CASES LIST */}
      <Text style={s.sectionHeading}>Support Cases &amp; Refunds</Text>
      {cases.data?.items.length === 0 && (
        <View style={s.card}>
          <Text style={s.body}>No support cases recorded.</Text>
        </View>
      )}
      {cases.data?.items.map((item: any) => (
        <View key={item.id} style={s.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={s.title}>
              {item.kind} · {item.id.slice(0, 8)}
            </Text>
            <View
              style={{
                backgroundColor: COLORS.blueLight,
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderRadius: RADIUS.round,
              }}
            >
              <Text style={{ color: COLORS.primaryText, fontSize: 11, fontWeight: '800' }}>{item.status}</Text>
            </View>
          </View>
          <Text style={s.body}>{item.reason}</Text>
          {item.amount != null && <Text style={s.body}>Requested amount: PKR {item.amount}</Text>}
          <Text style={{ color: COLORS.textMuted, fontSize: 11.5 }}>
            {new Date(item.createdAt).toLocaleString()}
          </Text>
          {item.decisionNotes && <Text style={s.body}>Staff response: {item.decisionNotes}</Text>}
          {item.externalReference && (
            <Text style={s.body}>
              Externally completed refund recorded: {item.externalReference} · {item.resolvedAt}
            </Text>
          )}
          {admin && !['RECORDED', 'RESOLVED', 'REJECTED'].includes(item.status) && (
            <View style={{ gap: SPACING.sm, marginTop: SPACING.xs }}>
              <TextInput
                {...inputProps}
                label="Decision notes (at least 10 characters)"
                multiline
                value={notes[item.id] || ''}
                onChangeText={text => setNotes({ ...notes, [item.id]: text })}
              />
              {item.kind === 'REFUND' && item.status === 'APPROVED' && (
                <>
                  <Text style={s.body}>
                    Record only a refund already completed outside Healix. This action does not transfer money.
                  </Text>
                  <TextInput
                    {...inputProps}
                    label="External refund reference (min 5 chars)"
                    value={references[item.id] || ''}
                    onChangeText={text => setReferences({ ...references, [item.id]: text })}
                  />
                  <TextInput
                    {...inputProps}
                    label="Actual completion time (ISO UTC)"
                    placeholder="2026-10-06T09:00:00Z"
                    value={dates[item.id] || ''}
                    onChangeText={text => setDates({ ...dates, [item.id]: text })}
                  />
                  <Button
                    mode="text"
                    compact
                    onPress={() => setDates({ ...dates, [item.id]: new Date().toISOString() })}
                  >
                    Use Current Timestamp
                  </Button>
                </>
              )}
              <View style={s.row}>
                {(item.kind === 'REFUND'
                  ? item.status === 'APPROVED'
                    ? ['RECORDED', 'REJECTED']
                    : ['IN_REVIEW', 'APPROVED', 'REJECTED']
                  : ['IN_REVIEW', 'RESOLVED', 'REJECTED']
                ).map(status => (
                  <Button
                    key={status}
                    mode="contained-tonal"
                    disabled={busy}
                    onPress={() => void update(item, status)}
                  >
                    {status === 'RECORDED' ? 'Record external refund' : status.replaceAll('_', ' ')}
                  </Button>
                ))}
              </View>
            </View>
          )}
        </View>
      ))}

      <View style={s.row}>
        <Button mode="outlined" disabled={page === 1} onPress={() => setPage(page - 1)}>
          Previous
        </Button>
        <Text style={s.body}>Page {page}</Text>
        <Button
          mode="outlined"
          disabled={!cases.data || page * cases.data.limit >= cases.data.total}
          onPress={() => setPage(page + 1)}
        >
          Next
        </Button>
      </View>

      {/* ADMIN OPERATIONAL MONITOR */}
      {admin && extras.data?.monitor && (
        <View style={s.card}>
          <Text style={s.subtitle}>PROCESS TELEMETRY</Text>
          <Text style={s.title}>Operational Monitor</Text>
          {Object.entries(extras.data.monitor).map(([key, value]) => (
            <View key={key} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
              <Text style={{ color: COLORS.textMuted, fontSize: 12.5, fontWeight: '600' }}>{key}</Text>
              <Text style={{ color: COLORS.textDark, fontSize: 12.5, fontWeight: '700' }}>{String(value)}</Text>
            </View>
          ))}
          <Button mode="outlined" onPress={() => void extras.refetch()}>
            Refresh monitor
          </Button>
        </View>
      )}

      {/* ADMIN RECORDED PAYMENTS */}
      {admin && (
        <View style={s.card}>
          <Text style={s.subtitle}>PAYMENT LEDGER</Text>
          <Text style={s.title}>Recorded Payments</Text>
          <Text style={s.body}>
            Application records without bank reconciliation. Use Web Operations to record an externally settled commission.
          </Text>
          {extras.data?.payments.map((p: any) => (
            <View
              key={p.id}
              style={{
                padding: SPACING.sm,
                borderRadius: RADIUS.sm,
                backgroundColor: COLORS.surface,
                borderWidth: 1,
                borderColor: COLORS.inputBorder,
              }}
            >
              <Text style={{ color: COLORS.textDark, fontWeight: '700', fontSize: 12.5 }}>
                PKR {p.amount} · {p.status}
              </Text>
              <Text style={{ color: COLORS.textMuted, fontSize: 11.5 }}>
                ID: {p.id.slice(0, 8)} · Commission: {p.commissionAmount ?? 'Not recorded'}
              </Text>
            </View>
          ))}
        </View>
      )}
    </WorkflowPage>
  );
}
