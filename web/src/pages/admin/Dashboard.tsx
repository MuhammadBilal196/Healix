import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../../store/admin';
import { Users, UserCheck, ShieldAlert, Award, FileText, CheckCircle2 } from 'lucide-react';

export default function Dashboard() {
  const { stats, fetchStats, isLoading, fetchClinicalCases, overrideAssignment } = useAdminStore();
  const [escalatedCases, setEscalatedCases] = useState<any[]>([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [assigningCase, setAssigningCase] = useState<string | null>(null);

  useEffect(() => {
    fetchStats().catch(() => {});
    loadEscalatedCases();
  }, []);

  const loadEscalatedCases = async () => {
    try {
      const allCases: any = await fetchClinicalCases();
      const caseList = Array.isArray(allCases) ? allCases : (allCases?.data || []);
      const alerts = caseList.filter((c: any) => 
        c.status === 'ADMIN_ESCALATED' || 
        (c.status === 'PROFESSIONAL_BROADCAST' && c.slaDeadline && new Date(c.slaDeadline) < new Date()) ||
        c.status === 'UNASSIGNED'
      );
      setEscalatedCases(alerts);
    } catch(e) {}
    setLoadingCases(false);
  };

  const handleAssignDoctor = async (caseId: string) => {
    const docId = prompt('Enter the Doctor ID to assign to this emergency case:');
    if (!docId) return;
    setAssigningCase(caseId);
    try {
      await overrideAssignment(caseId, docId, 'Emergency Admin Override');
      alert('Doctor assigned successfully.');
      loadEscalatedCases();
    } catch(e: any) {
      alert('Failed to assign doctor: ' + e.message);
    }
    setAssigningCase(null);
  };

  if (isLoading && !stats && loadingCases) {
    return (
      <div className="loading-page">
        <div className="spinner"></div>
      </div>
    );
  }

  const s = stats || {
    totalUsers: 0,
    activeUsers: 0,
    pendingNurses: 0,
    pendingDoctors: 0,
    totalVisits: 0,
    completedVisits: 0,
    activeContracts: 0,
    highRiskCases: 0,
    totalNurses: 0,
    totalDoctors: 0,
    totalPatients: 0,
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Operations Control Panel</h2>
        <p className="page-subtitle">Platform health metrics, user onboarding status, and visit telemetry</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card teal">
          <div className="stat-icon"><Users /></div>
          <div className="stat-value">{s.totalUsers}</div>
          <div className="stat-label">Total Registered Users</div>
          <div className="stat-sub">Active: {s.activeUsers} | Suspended: {s.totalUsers - s.activeUsers}</div>
        </div>

        <div className="stat-card emerald">
          <div className="stat-icon"><CheckCircle2 /></div>
          <div className="stat-value">{s.pendingNurses}</div>
          <div className="stat-label">Pending Nurses</div>
          <div className="stat-sub">Total verified: {s.totalNurses - s.pendingNurses}</div>
        </div>

        <div className="stat-card purple">
          <div className="stat-icon"><Award /></div>
          <div className="stat-value">{s.pendingDoctors}</div>
          <div className="stat-label">Pending Doctors</div>
          <div className="stat-sub">Total verified: {s.totalDoctors - s.pendingDoctors}</div>
        </div>

        <div className="stat-card blue">
          <div className="stat-icon"><FileText /></div>
          <div className="stat-value">{s.activeContracts}</div>
          <div className="stat-label">Active Contracts</div>
          <div className="stat-sub">Total agreements active in-field</div>
        </div>

        <div className="stat-card red">
          <div className="stat-icon"><ShieldAlert /></div>
          <div className="stat-value">{s.highRiskCases}</div>
          <div className="stat-label">High-Risk Cases</div>
          <div className="stat-sub">Awaiting urgent doctor review</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <h3 className="card-title">System-Wide Telemetry</h3>
        <div className="vitals-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="vital-box">
            <div className="vital-value">{s.totalVisits}</div>
            <div className="vital-label">Visits Scheduled</div>
          </div>
          <div className="vital-box">
            <div className="vital-value">{s.completedVisits}</div>
            <div className="vital-label">Visits Completed</div>
          </div>
          <div className="vital-box">
            <div className="vital-value">{s.totalNurses}</div>
            <div className="vital-label">Nurses Registered</div>
          </div>
          <div className="vital-box">
            <div className="vital-value">{s.totalDoctors}</div>
            <div className="vital-label">Doctors Registered</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
          <h3 className="card-title">🚨 Emergency Escalations Action Required</h3>
          {loadingCases ? <p>Loading cases...</p> : escalatedCases.length === 0 ? <p style={{margin: '16px'}}>No emergency cases require admin intervention.</p> : (
            <table className="data-table" style={{width: '100%', marginTop: '16px'}}>
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Patient</th>
                  <th>Risk Tier</th>
                  <th>Status</th>
                  <th>SLA Deadline</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {escalatedCases.map(c => (
                  <tr key={c.id}>
                    <td>{c.id.substring(0,8)}...</td>
                    <td>{c.visit?.request?.patient?.user?.fullName || 'Unknown'}</td>
                    <td><span className={'badge ' + (c.riskTier === 'CRITICAL' ? 'error' : 'warning')}>{c.riskTier}</span></td>
                    <td>
                      {c.status}
                      {c.status === 'PROFESSIONAL_BROADCAST' && <span style={{color: 'red', marginLeft: 8, fontSize: '0.8rem'}}>⚠️ Professional SLA exceeded</span>}
                    </td>
                    <td>{new Date(c.slaDeadline).toLocaleTimeString()}</td>
                    <td>
                      <button 
                        className="btn btn-primary btn-sm" 
                        onClick={() => handleAssignDoctor(c.id)}
                        disabled={assigningCase === c.id}
                        style={{padding: '4px 8px', background: '#EF4444', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer'}}
                      >
                        {assigningCase === c.id ? 'Assigning...' : 'ASSIGN DOCTOR'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }
