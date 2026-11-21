import { useEffect, useState } from 'react';
import { api, useAuthStore } from '../../store/auth';

const PROFILE_REASONS = [
  'Verified user contact correction requested by account holder',
  'Updated full name to match official CNIC registry',
];

const CAPABILITY_REASONS = [
  'Updated role capability policy per clinical governance',
  'Adjusted module access during operational audit review',
];

export default function Operations() {
  const actor = useAuthStore(s => s.user);
  const [data, setData] = useState<any>();
  const [page, setPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [refs, setRefs] = useState<Record<string, string>>({});
  const [times, setTimes] = useState<Record<string, string>>({});
  const [edit, setEdit] = useState({ id: '', role: '', fullName: '', phone: '', reason: '' });
  const [permission, setPermission] = useState({
    role: 'PATIENT',
    feature: 'ANALYTICS',
    operation: 'READ',
    allowed: true,
    reason: '',
  });
  const [commission, setCommission] = useState({
    paymentId: '',
    amount: '',
    reference: '',
    recordedAt: '',
    reason: '',
  });

  const refresh = async () => {
    const searchQs = userSearch.trim() ? `&search=${encodeURIComponent(userSearch.trim())}` : '';
    const [cases, payments, permissions, monitor, users] = await Promise.all([
      api('GET', `/support/cases?page=${page}`),
      api('GET', `/admin/payments?page=${page}`),
      api('GET', '/admin/permissions'),
      api('GET', '/admin/operations/monitor'),
      api('GET', `/admin/users?limit=25&page=${page}${searchQs}`),
    ]);
    setData({ cases, payments, permissions, monitor, users });
  };

  useEffect(() => {
    if (!data?.permissions) return;
    setPermission(current => {
      const saved = data.permissions.overrides.find(
        (p: any) => p.role === current.role && p.feature === current.feature && p.operation === current.operation
      );
      return { ...current, allowed: saved ? saved.allowed : true };
    });
  }, [data?.permissions]);

  // Auto-select first editable user so Edit User Profile is active right away
  useEffect(() => {
    const list: any[] | undefined = data?.users?.users;
    if (!list?.length || edit.id) return;
    const firstEditable = list.find(u => u.role !== 'ADMIN' || u.id === actor?.id) || list[0];
    if (firstEditable) {
      setEdit({
        id: firstEditable.id,
        role: firstEditable.role,
        fullName: firstEditable.fullName || '',
        phone: firstEditable.phone || '',
        reason: '',
      });
    }
  }, [data?.users?.users, edit.id, actor?.id]);

  useEffect(() => {
    void refresh().catch(e => setError(e.message));
  }, [page, userSearch]);

  const run = async (task: () => Promise<unknown>, success: string) => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await task();
      setMessage(success);
      await refresh();
    } catch (e: any) {
      setError(e.message || 'Operation failed');
    } finally {
      setBusy(false);
    }
  };

  const update = (item: any, status: string) =>
    run(
      () =>
        api('PUT', `/admin/support/cases/${item.id}`, {
          status,
          notes: notes[item.id] || '',
          ...(status === 'RECORDED'
            ? { externalReference: refs[item.id] || '', completedAt: times[item.id] || '' }
            : {}),
        }),
      'Support case updated.'
    );

  const isOtherAdmin = edit.role === 'ADMIN' && edit.id !== actor?.id;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Administration Operations &amp; Support</h1>
          <p className="page-subtitle">
            Manage user profile updates, role capability overrides, support disputes, and commission settlements
          </p>
        </div>
        <button className="btn btn-ghost" onClick={() => void refresh().catch(e => setError(e.message))}>
          Refresh All
        </button>
      </div>

      {error && <p role="alert">{error}</p>}
      {message && <p role="status">✓ {message}</p>}
      {!data && (
        <div className="loading-page">
          <div className="spinner" />
          <span>Loading operations…</span>
        </div>
      )}

      {data && (
        <>
          <section className="card">
            <h2>Operational Monitor</h2>
            <dl>
              {Object.entries(data.monitor).map(([key, value]) => (
                <div key={key}>
                  <dt>{key}</dt>
                  <dd>{String(value)}</dd>
                </div>
              ))}
            </dl>
          </section>

          <div className="admin-onboarding-grid">
            {/* EDIT USER PROFILE CARD */}
            <section className="card">
              <h2>Edit User Profile</h2>
              <p>Update full name and Pakistan phone number for any Patient, Nurse, Doctor, Paramedic, or your own Admin account.</p>

              <div className="form-group">
                <label>Filter users</label>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={userSearch}
                  onChange={e => {
                    setUserSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              <div className="form-group">
                <label>Select User ({data.users.total} total)</label>
                <select
                  value={edit.id}
                  onChange={e => {
                    const user = data.users.users.find((u: any) => u.id === e.target.value);
                    if (user) {
                      setEdit({
                        id: user.id,
                        role: user.role,
                        fullName: user.fullName || '',
                        phone: user.phone || '',
                        reason: edit.reason,
                      });
                    }
                  }}
                >
                  <option value="">Select user</option>
                  {data.users.users.map((u: any) => (
                    <option value={u.id} key={u.id}>
                      {u.fullName} · {u.role} ({u.email}){u.role === 'ADMIN' && u.id !== actor?.id ? ' [Self-managed]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {isOtherAdmin && (
                <p role="alert">
                  Other administrators manage their own profile. Pick a Patient, Nurse, Doctor, Paramedic, or your own account.
                </p>
              )}

              {edit.id && (
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    void run(
                      () =>
                        api('PUT', `/admin/users/${edit.id}/profile`, {
                          fullName: edit.fullName.trim(),
                          phone: edit.phone.trim(),
                          reason: edit.reason.trim(),
                        }),
                      `Updated profile for ${edit.fullName.trim()}.`
                    );
                  }}
                >
                  <div className="form-grid-2">
                    <label>
                      Full Name
                      <input
                        required
                        minLength={3}
                        value={edit.fullName}
                        onChange={e => setEdit({ ...edit, fullName: e.target.value })}
                      />
                    </label>
                    <label>
                      Phone Number
                      <input
                        required
                        placeholder="+923001234567 or 03001234567"
                        value={edit.phone}
                        onChange={e => setEdit({ ...edit, phone: e.target.value })}
                      />
                    </label>
                  </div>

                  <label>
                    Audit Reason (min 10 characters — current: {edit.reason.trim().length})
                    <input
                      required
                      minLength={10}
                      placeholder="Explain why this user profile is being modified..."
                      value={edit.reason}
                      onChange={e => setEdit({ ...edit, reason: e.target.value })}
                    />
                  </label>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                    {PROFILE_REASONS.map(preset => (
                      <button
                        key={preset}
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setEdit(prev => ({ ...prev, reason: preset }))}
                      >
                        Use: &ldquo;{preset.slice(0, 28)}…&rdquo;
                      </button>
                    ))}
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ marginTop: 12 }}
                    disabled={busy || isOtherAdmin || edit.reason.trim().length < 10}
                  >
                    {busy ? 'Saving...' : 'Save User Profile'}
                  </button>
                </form>
              )}
            </section>

            {/* ROLE CAPABILITIES CARD */}
            <section className="card">
              <h2>Role Capabilities</h2>
              <p>{data.permissions.rule}</p>

              <form
                onSubmit={e => {
                  e.preventDefault();
                  void run(
                    () => api('PUT', '/admin/permissions', { ...permission, reason: permission.reason.trim() }),
                    `Saved ${permission.role} · ${permission.feature} · ${permission.operation} = ${permission.allowed ? 'ALLOWED' : 'BLOCKED'}.`
                  );
                }}
              >
                <div className="form-grid-2">
                  {(['role', 'feature', 'operation'] as const).map(field => (
                    <label key={field} style={{ textTransform: 'capitalize' }}>
                      {field}
                      <select
                        value={(permission as any)[field]}
                        onChange={e => {
                          const next = { ...permission, [field]: e.target.value };
                          const saved = data.permissions.overrides.find(
                            (p: any) =>
                              p.role === next.role &&
                              p.feature === next.feature &&
                              p.operation === next.operation
                          );
                          setPermission({ ...next, allowed: saved ? saved.allowed : true });
                        }}
                      >
                        {(field === 'role'
                          ? data.permissions.roles
                          : field === 'feature'
                          ? data.permissions.features
                          : ['READ', 'WRITE']
                        ).map((value: string) => (
                          <option key={value}>{value}</option>
                        ))}
                      </select>
                    </label>
                  ))}
                  <label>
                    Policy Status
                    <select
                      value={permission.allowed ? 'ALLOW' : 'DENY'}
                      onChange={e => setPermission({ ...permission, allowed: e.target.value === 'ALLOW' })}
                    >
                      <option value="ALLOW">Allowed (Enabled)</option>
                      <option value="DENY">Blocked (Disabled)</option>
                    </select>
                  </label>
                </div>

                <label style={{ marginTop: 10 }}>
                  <input
                    type="checkbox"
                    checked={permission.allowed}
                    onChange={e => setPermission({ ...permission, allowed: e.target.checked })}
                  />
                  Enable within built-in role and ownership checks
                </label>

                <label>
                  Audit Reason (min 10 characters — current: {permission.reason.trim().length})
                  <input
                    required
                    minLength={10}
                    placeholder="Explain reason for updating this capability..."
                    value={permission.reason}
                    onChange={e => setPermission({ ...permission, reason: e.target.value })}
                  />
                </label>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                  {CAPABILITY_REASONS.map(preset => (
                    <button
                      key={preset}
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setPermission(prev => ({ ...prev, reason: preset }))}
                    >
                      Use: &ldquo;{preset.slice(0, 28)}…&rdquo;
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ marginTop: 12 }}
                  disabled={busy || permission.reason.trim().length < 10}
                >
                  {busy ? 'Saving...' : 'Save Role Capability'}
                </button>
              </form>

              <div style={{ marginTop: 16 }}>
                <h3>Active Capability Overrides ({data.permissions.overrides.length})</h3>
                {data.permissions.overrides.length === 0 ? (
                  <p style={{ fontSize: 12.5 }}>No explicit capability overrides saved yet.</p>
                ) : (
                  <div className="table-container" style={{ marginTop: 8 }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Role</th>
                          <th>Feature</th>
                          <th>Op</th>
                          <th>State</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.permissions.overrides.map((ov: any) => (
                          <tr key={`${ov.role}-${ov.feature}-${ov.operation}`}>
                            <td>{ov.role}</td>
                            <td>{ov.feature}</td>
                            <td>{ov.operation}</td>
                            <td>
                              <span className={`badge ${ov.allowed ? 'badge-green' : 'badge-red'}`}>
                                {ov.allowed ? 'ALLOWED' : 'BLOCKED'}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() =>
                                  setPermission({
                                    role: ov.role,
                                    feature: ov.feature,
                                    operation: ov.operation,
                                    allowed: ov.allowed,
                                    reason: permission.reason || CAPABILITY_REASONS[0],
                                  })
                                }
                              >
                                Load &amp; Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </div>

          <section className="card">
            <h2>Refund Requests and Disputes</h2>
            {data.cases.items.length === 0 && <p>No cases recorded.</p>}
            {data.cases.items.map((item: any) => (
              <article key={item.id}>
                <h3>
                  {item.kind} · {item.status} · {item.id.slice(0, 8)}
                </h3>
                <p>{item.reason}</p>
                {item.amount != null && <p>Requested refund: PKR {item.amount}</p>}
                {item.decisionNotes && <p>Staff response: {item.decisionNotes}</p>}
                {item.externalReference && (
                  <p>
                    Recorded external refund: {item.externalReference} · {item.resolvedAt}
                  </p>
                )}
                {!['RECORDED', 'RESOLVED', 'REJECTED'].includes(item.status) && (
                  <>
                    <label>
                      Decision notes
                      <textarea
                        value={notes[item.id] || ''}
                        onChange={e => setNotes({ ...notes, [item.id]: e.target.value })}
                      />
                    </label>
                    {item.kind === 'REFUND' && item.status === 'APPROVED' && (
                      <>
                        <p>Record only a refund already completed outside Healix. Recording does not transfer money.</p>
                        <label>
                          External refund reference
                          <input
                            value={refs[item.id] || ''}
                            onChange={e => setRefs({ ...refs, [item.id]: e.target.value })}
                          />
                        </label>
                        <label>
                          Actual completion time (ISO)
                          <input
                            placeholder="2026-10-06T09:00:00Z"
                            value={times[item.id] || ''}
                            onChange={e => setTimes({ ...times, [item.id]: e.target.value })}
                          />
                        </label>
                      </>
                    )}
                    {(item.kind === 'REFUND'
                      ? item.status === 'APPROVED'
                        ? ['RECORDED', 'REJECTED']
                        : ['IN_REVIEW', 'APPROVED', 'REJECTED']
                      : ['IN_REVIEW', 'RESOLVED', 'REJECTED']
                    ).map(status => (
                      <button key={status} disabled={busy} onClick={() => void update(item, status)}>
                        {status === 'RECORDED' ? 'Record external refund' : status.replaceAll('_', ' ')}
                      </button>
                    ))}
                  </>
                )}
              </article>
            ))}
          </section>

          <section className="card">
            <h2>Recorded Payment Monitoring</h2>
            <p>{data.payments.recordBasis}</p>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Payment</th>
                    <th>Patient</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments.items.map((p: any) => (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td>{p.request.patient.user.fullName}</td>
                      <td>PKR {p.amount}</td>
                      <td>{p.status}</td>
                      <td>{p.commissionAmount == null ? 'Not recorded' : `PKR ${p.commissionAmount}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3 style={{ marginTop: 18 }}>Record an Externally Settled Commission</h3>
            <p>Enter the actual settled amount, date and reference. This does not charge a fee or move money.</p>
            <form
              onSubmit={e => {
                e.preventDefault();
                void run(
                  () =>
                    api('PUT', `/admin/payments/${commission.paymentId}/commission`, {
                      amount: Number(commission.amount),
                      reference: commission.reference,
                      recordedAt: commission.recordedAt,
                      reason: commission.reason,
                    }),
                  'External commission recorded.'
                );
              }}
            >
              <label>
                Paid payment
                <select
                  required
                  value={commission.paymentId}
                  onChange={e => setCommission({ ...commission, paymentId: e.target.value })}
                >
                  <option value="">Select payment</option>
                  {data.payments.items
                    .filter((p: any) => p.status === 'PAID' && p.commissionAmount == null)
                    .map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.id} · PKR {p.amount}
                      </option>
                    ))}
                </select>
              </label>
              <div className="form-grid-2">
                {(['amount', 'reference', 'recordedAt', 'reason'] as const).map(field => (
                  <label key={field} style={{ textTransform: 'capitalize' }}>
                    {field}
                    <input
                      required
                      type={field === 'amount' ? 'number' : 'text'}
                      min={field === 'amount' ? 0 : undefined}
                      step={field === 'amount' ? '0.01' : undefined}
                      value={(commission as any)[field]}
                      onChange={e => setCommission({ ...commission, [field]: e.target.value })}
                    />
                  </label>
                ))}
              </div>
              <button disabled={busy} style={{ marginTop: 10 }}>
                Record Commission
              </button>
            </form>
          </section>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 16 }}>
            <button className="btn btn-ghost" disabled={page === 1} onClick={() => setPage(page - 1)}>
              Previous
            </button>
            <span>Page {page}</span>
            <button
              className="btn btn-ghost"
              disabled={page * 20 >= Math.max(data.cases.total, data.payments.total, data.users.total)}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
