import { useCallback, useEffect, useState } from 'react';
import { api } from '../../store/auth';
import { Clock, ShieldAlert } from 'lucide-react';

export default function Dashboard({ onSelectCase }: { onSelectCase: (caseId: string) => void }) {
  const [queue, setQueue] = useState<any[]>([]);
  const [urgent, setUrgent] = useState<any[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'HIGH'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pending, setPending] = useState<string | null>(null);
  const [confirmCase, setConfirmCase] = useState<any>(null);
  const [emergency, setEmergency] = useState({ awaiting: 0, trips: 0 });
  const refresh = useCallback(async () => {
    try {
      const [assigned, alerts] = await Promise.all([api('GET', '/doctors/queue'), api('GET', '/doctors/queue/high-risk')]);
      setQueue(assigned); setUrgent(alerts); setError('');
      // Emergencies assigned by an administrator do not appear in the case queue, so surface them here.
      const [events, trips] = await Promise.all([api('GET', '/emergency/events').catch(() => []), api('GET', '/dispatch').catch(() => [])]);
      setEmergency({
        awaiting: (events as any[]).filter(e => !e.dispatches?.length).length,
        trips: (trips as any[]).filter(d => ['PENDING', 'DISPATCHED', 'EN_ROUTE', 'ARRIVED'].includes(d.status)).length,
      });
    } catch (e: any) { setError(e.message || 'Unable to load cases'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); const timer = setInterval(() => void refresh(), 10000); return () => clearInterval(timer); }, [refresh]);
  const open = async (item: any) => {
    setPending(item.id); setError('');
    try {
      if (item.status !== 'IN_REVIEW') await api('PUT', `/cases/${item.id}/start-review`, {});
      setConfirmCase(null); onSelectCase(item.id);
    } catch (e: any) { setConfirmCase(null); await refresh(); setError(e.message || 'This case is no longer available'); }
    finally { setPending(null); }
  };
  const activeQueue = filter === 'ALL' ? queue : urgent;
  return <div className="page">
    <div className="page-header"><h2 className="page-title">Doctor Dashboard</h2><p className="page-subtitle">Review assigned cases, respond to urgent broadcasts, and record clinical decisions.</p><button className="btn btn-ghost" disabled={!!pending} onClick={() => void refresh()}>Refresh cases</button></div>
    {(emergency.awaiting > 0 || emergency.trips > 0) && <div className="card" role="alert" style={{ borderColor: 'var(--red)', color: 'var(--red)' }}><strong>Emergency assigned to you</strong><p>{[emergency.awaiting ? `${emergency.awaiting} emergency case(s) need your transport decision` : '', emergency.trips ? `${emergency.trips} ambulance trip(s) in progress` : ''].filter(Boolean).join(' · ')}. Open <strong>Dispatches &amp; Admissions</strong> in the sidebar.</p></div>}
    <div className="tab-bar"><button className={`tab-btn ${filter === 'ALL' ? 'active' : ''}`} onClick={() => setFilter('ALL')}>My cases ({queue.length})</button><button className={`tab-btn ${filter === 'HIGH' ? 'active' : ''}`} onClick={() => setFilter('HIGH')}>High & critical risk ({urgent.length})</button></div>
    {error && <div className="card" role="alert" style={{ color: 'var(--red)' }}>{error}<button className="btn btn-ghost" onClick={() => void refresh()}>Retry</button></div>}
    {loading ? <div className="loading-page"><div className="spinner" /><p>Loading clinical cases…</p></div> : <div className="card"><div className="table-container"><table><thead><tr><th>Patient</th><th>Risk</th><th>Response deadline</th><th>Status</th><th>Actions</th></tr></thead><tbody>{activeQueue.map(item => {
      const broadcast = ['PROFESSIONAL_BROADCAST', 'GENERAL_BROADCAST', 'ADMIN_ESCALATED'].includes(item.status);
      const mins = Math.ceil((Date.parse(item.slaDeadline) - Date.now()) / 60000);
      return <tr key={item.id}><td><strong>{item.visit?.request?.patient?.user?.fullName || 'Patient'}</strong></td><td><span className={`badge ${['HIGH', 'CRITICAL'].includes(item.riskTier) ? 'badge-red' : 'badge-amber'}`}><ShieldAlert size={12} /> {item.riskTier}</span></td><td><div className={mins <= 5 ? 'sla-critical' : ''}><Clock size={14} /> {Number.isFinite(mins) ? mins <= 0 ? 'Response overdue' : `${mins} min remaining` : 'No deadline'}</div></td><td><span className={`badge ${broadcast ? 'badge-amber' : 'badge-green'}`}>{item.status.replaceAll('_', ' ')}</span></td><td><div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}><button className="btn btn-primary btn-sm" disabled={!!pending} onClick={() => broadcast ? setConfirmCase(item) : void open(item)}>{pending === item.id ? 'Opening…' : broadcast ? 'Accept & Review' : item.status === 'ASSIGNED' ? 'Start Review' : 'Continue Review'}</button><button className="btn btn-ghost btn-sm" disabled={!!pending} onClick={() => onSelectCase(item.id)}>View Details</button></div></td></tr>;
    })}{!activeQueue.length && !error && <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center' }}>{filter === 'ALL' ? 'No assigned cases. Check High & critical risk for available broadcasts.' : 'No eligible urgent cases awaiting review.'}</td></tr>}</tbody></table></div></div>}
    {confirmCase && <div className="modal-overlay"><div className="modal" role="dialog" aria-modal="true"><h3>Accept this case?</h3><p>You will take ownership of {confirmCase.visit?.request?.patient?.user?.fullName || 'this patient'}'s case.</p><button className="btn btn-ghost" disabled={!!pending} onClick={() => setConfirmCase(null)}>Cancel</button><button className="btn btn-primary" disabled={!!pending} onClick={() => void open(confirmCase)}>Accept & Review</button></div></div>}
  </div>;
}
