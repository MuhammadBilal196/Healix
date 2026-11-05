import React, { useState, useEffect } from 'react';
import { api } from '../../store/auth';
import { useAdminStore } from '../../store/admin';
import { Search, Eye, AlertTriangle, CheckCircle, Ban, Trash2 } from 'lucide-react';

export default function Users() {
  const { usersData, fetchUsers, fetchUserDetail, userDetail, updateUserStatus, deleteUser, isLoading } = useAdminStore();
  const [inviteEmail,setInviteEmail] = useState(''), [inviteRole,setInviteRole] = useState('ADMIN'), [inviteToken,setInviteToken] = useState(''), [inviteError,setInviteError] = useState(''), [inviteBusy,setInviteBusy] = useState(false);
  const [createRole, setCreateRole] = useState<'DOCTOR' | 'PARAMEDIC'>('DOCTOR');
  const [createForm, setCreateForm] = useState({ fullName: '', email: '', phone: '', password: '', cnic: '', credential: '' });
  const [createError, setCreateError] = useState('');
  const [createBusy, setCreateBusy] = useState(false);
  const [createMessage, setCreateMessage] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  // Modal control
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [modalAction, setModalAction] = useState<'STATUS' | 'DELETE' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [newStatus, setNewStatus] = useState<'ACTIVE' | 'SUSPENDED'>('SUSPENDED');

  useEffect(() => {
    fetchUsers({ search, role, status, page, limit: 10 }).catch(() => {});
  }, [search, role, status, page]);

  const handleOpenDetail = async (user: any) => {
    setSelectedUser(user);
    await fetchUserDetail(user.id);
  };

  const handleOpenStatusModal = (user: any, targetStatus: 'ACTIVE' | 'SUSPENDED') => {
    setSelectedUser(user);
    setNewStatus(targetStatus);
    setModalAction('STATUS');
    setActionReason('');
  };

  const handleOpenDeleteModal = (user: any) => {
    setSelectedUser(user);
    setModalAction('DELETE');
    setActionReason('');
  };

  const handleStatusSubmit = async () => {
    if (!selectedUser || actionReason.length < 5) return;
    try {
      await updateUserStatus(selectedUser.id, newStatus, actionReason);
      setModalAction(null);
      setSelectedUser(null);
      fetchUsers({ search, role, status, page, limit: 10 }).catch(() => {});
    } catch (e: any) {
      alert(e.message || 'Action failed');
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedUser || actionReason.length < 5) return;
    try {
      await deleteUser(selectedUser.id, actionReason);
      setModalAction(null);
      setSelectedUser(null);
      fetchUsers({ search, role, status, page, limit: 10 }).catch(() => {});
    } catch (e: any) {
      alert(e.message || 'Action failed');
    }
  };

  const uData = usersData || { users: [], total: 0, pages: 1 };

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">User Directory & Management</h2>
        <p className="page-subtitle">Search, inspect profiles, activate, deactivate, or soft-delete platform users</p>
      </div>

      <form className="card" onSubmit={async e => { e.preventDefault(); setInviteBusy(true); setInviteError(''); setInviteToken(''); try { const result = await api('POST','/admin/users/invite',{email:inviteEmail,role:inviteRole}); setInviteToken(result.token); } catch(e:any) { setInviteError(e.message); } finally { setInviteBusy(false); } }}>
        <h3>Invite a Healix user</h3><label>Email<input required type="email" className="form-input" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}/></label><label>Role<select className="form-input" value={inviteRole} onChange={e => setInviteRole(e.target.value)}>{['ADMIN','DOCTOR','PARAMEDIC','NURSE','PATIENT'].map(r => <option key={r}>{r}</option>)}</select></label><button className="btn btn-primary" disabled={inviteBusy}>Create invitation</button>{inviteError && <p role="alert">{inviteError}</p>}{inviteToken && <p>Share privately. Accept in the Healix app via Sign In → Accept an invitation. Token (expires in seven days): <code>{inviteToken}</code></p>}
      </form>
      <form className="card" onSubmit={async e => {
        e.preventDefault(); setCreateBusy(true); setCreateError(''); setCreateMessage('');
        try {
          const path = createRole === 'DOCTOR' ? '/admin/users/doctor' : '/admin/users/paramedic';
          const credential = createRole === 'DOCTOR' ? { pmdcNumber: createForm.credential } : { certificationNumber: createForm.credential };
          await api('POST', path, { ...createForm, ...credential });
          setCreateMessage(`${createRole === 'DOCTOR' ? 'Doctor' : 'Paramedic'} account created. The user can sign in now.`);
          setCreateForm({ fullName: '', email: '', phone: '', password: '', cnic: '', credential: '' });
          await fetchUsers({ search, role, status, page, limit: 10 });
        } catch (error: any) { setCreateError(error.message || 'Account creation failed'); }
        finally { setCreateBusy(false); }
      }}>
        <h3>Create doctor or paramedic account</h3>
        <p>The account is active as soon as you create it. Share the sign-in details privately.</p>
        <label>Role<select className="form-input" value={createRole} onChange={e => setCreateRole(e.target.value as 'DOCTOR' | 'PARAMEDIC')}><option value="DOCTOR">Doctor</option><option value="PARAMEDIC">Paramedic</option></select></label>
        <label>Full name<input required className="form-input" value={createForm.fullName} onChange={e => setCreateForm({ ...createForm, fullName: e.target.value })} /></label>
        <label>Email<input required type="email" className="form-input" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} /></label>
        <label>Phone<input required className="form-input" value={createForm.phone} onChange={e => setCreateForm({ ...createForm, phone: e.target.value })} /></label>
        <label>CNIC<input required className="form-input" value={createForm.cnic} onChange={e => setCreateForm({ ...createForm, cnic: e.target.value })} /></label>
        <label>{createRole === 'DOCTOR' ? 'PMDC number' : 'Certification number'}<input required className="form-input" value={createForm.credential} onChange={e => setCreateForm({ ...createForm, credential: e.target.value })} /></label>
        <label>Initial password<input required type="password" minLength={8} className="form-input" value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })} /></label>
        <button className="btn btn-primary" disabled={createBusy}>Create account</button>
        {createError && <p role="alert">{createError}</p>}{createMessage && <p role="status">{createMessage}</p>}
      </form>
      <div className="toolbar">
        <div className="search-box">
          <Search />
          <input
            type="text"
            className="form-input"
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <select className="form-input" style={{ width: '150px' }} value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
          <option value="">All Roles</option>
          <option value="PATIENT">Patients</option>
          <option value="NURSE">Nurses</option>
          <option value="DOCTOR">Doctors</option>
          <option value="PARAMEDIC">Paramedics</option>
          <option value="ADMIN">Administrators</option>
        </select>

        <select className="form-input" style={{ width: '150px' }} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PENDING_VERIFICATION">Pending Verification</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Email / Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Registration Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {uData.users.map((user: any) => (
                <tr key={user.id}>
                  <td style={{ fontWeight: '600' }}>{user.fullName}</td>
                  <td>
                    <div>{user.email}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user.phone}</div>
                  </td>
                  <td>
                    <span className={`badge ${user.role === 'ADMIN' ? 'badge-purple' : user.role === 'DOCTOR' ? 'badge-blue' : user.role === 'NURSE' ? 'badge-teal' : 'badge-green'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${user.status === 'ACTIVE' ? 'badge-green' : user.status === 'SUSPENDED' ? 'badge-red' : 'badge-amber'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn-icon" title="View details" onClick={() => handleOpenDetail(user)}>
                        <Eye size={15} />
                      </button>
                      {user.role !== 'ADMIN' && (
                        <>
                          {user.status === 'ACTIVE' ? (
                            <button className="btn-icon" style={{ color: 'var(--red)' }} title="Deactivate/Suspend" onClick={() => handleOpenStatusModal(user, 'SUSPENDED')}>
                              <Ban size={15} />
                            </button>
                          ) : (
                            <button className="btn-icon" style={{ color: 'var(--emerald)' }} title="Activate" onClick={() => handleOpenStatusModal(user, 'ACTIVE')}>
                              <CheckCircle size={15} />
                            </button>
                          )}
                          <button className="btn-icon" style={{ color: 'var(--red)' }} title="Delete user" onClick={() => handleOpenDeleteModal(user)}>
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {uData.users.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>No users found matching filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {uData.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
            <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
            <span style={{ alignSelf: 'center', color: 'var(--text-secondary)' }}>Page {page} of {uData.pages}</span>
            <button className="btn btn-ghost btn-sm" disabled={page === uData.pages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        )}
      </div>

      {/* User Detail Panel Drawer/Modal */}
      {selectedUser && !modalAction && userDetail && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Inspection: {userDetail.fullName}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div><strong>User ID:</strong> {userDetail.id}</div>
              <div><strong>Email:</strong> {userDetail.email}</div>
              <div><strong>Phone:</strong> {userDetail.phone}</div>
              <div><strong>Role:</strong> {userDetail.role}</div>
              <div><strong>Account Status:</strong> <span className={`badge ${userDetail.status === 'ACTIVE' ? 'badge-green' : 'badge-red'}`}>{userDetail.status}</span></div>
              {userDetail.deactivationReason && (
                <div><strong>Suspension Reason:</strong> <span style={{ color: 'var(--red)' }}>{userDetail.deactivationReason}</span></div>
              )}

              {/* Role profiles details */}
              {userDetail.role === 'NURSE' && userDetail.nurse && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '12px' }}>
                  <h4 style={{ marginBottom: '8px', color: 'var(--teal-light)' }}>Nurse Profile Details</h4>
                  <div><strong>PNC Number:</strong> {userDetail.nurse.pncNumber}</div>
                  <div><strong>Credential Verification:</strong> <span className={`badge ${userDetail.nurse.verificationStatus === 'VERIFIED' ? 'badge-green' : 'badge-amber'}`}>{userDetail.nurse.verificationStatus}</span></div>
                  <div><strong>Experience:</strong> {userDetail.nurse.experience} Years</div>
                  <div><strong>Score:</strong> {userDetail.nurse.score?.compositeScore ?? 'N/A'}/100</div>
                </div>
              )}

              {userDetail.role === 'DOCTOR' && userDetail.doctor && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '12px' }}>
                  <h4 style={{ marginBottom: '8px', color: 'var(--blue)' }}>Doctor Profile Details</h4>
                  <div><strong>PMDC Number:</strong> {userDetail.doctor.pmdcNumber}</div>
                  <div><strong>Credential Verification:</strong> <span className={`badge ${userDetail.doctor.verificationStatus === 'VERIFIED' ? 'badge-green' : 'badge-amber'}`}>{userDetail.doctor.verificationStatus}</span></div>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setSelectedUser(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal (Activate/Deactivate) */}
      {modalAction === 'STATUS' && selectedUser && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="modal-title">Confirm Account Status Modification</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              You are about to change the status of <strong>{selectedUser.fullName}</strong> to <strong>{newStatus}</strong>.
            </p>
            <div className="form-group">
              <label className="form-label">Justification / Reason (min 5 chars)</label>
              <textarea
                className="form-input"
                style={{ height: '80px', resize: 'none' }}
                placeholder="Provide operation log justification..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setModalAction(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={actionReason.length < 5} onClick={handleStatusSubmit}>
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modalAction === 'DELETE' && selectedUser && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="modal-title" style={{ color: 'var(--red)' }}>Confirm Soft-Delete</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Are you sure you want to soft-delete <strong>{selectedUser.fullName}</strong>? This will revoke active sessions and hide the user account from general registry views.
            </p>
            <div className="form-group">
              <label className="form-label">Justification / Reason (min 5 chars)</label>
              <textarea
                className="form-input"
                style={{ height: '80px', resize: 'none' }}
                placeholder="Provide operation log justification..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setModalAction(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={actionReason.length < 5} onClick={handleDeleteSubmit}>
                Soft-Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
