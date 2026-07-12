// OWNER: P2 — the conflict-rule demo lives here: allocating a taken asset shows holder + Transfer Request button
import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import {
  RefreshCw,
  User,
  Calendar,
  AlertTriangle,
  Send,
  Check,
  X,
  Plus,
  ArrowRight,
  ClipboardList
} from 'lucide-react';

export default function Allocations() {
  const { user } = useAuth();
  const [allocations, setAllocations] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ asset_id: '', employee_id: '', expected_return_date: '' });
  const [conflict, setConflict] = useState(null); // { message, asset_id }
  const [error, setError] = useState('');

  const load = () => {
    api('/allocations').then(setAllocations);
    api('/allocations/transfers').then(setTransfers);
    api('/assets').then(setAssets);
    api('/org/employees').then(setEmployees);
  };
  useEffect(load, []);

  const allocate = async (e) => {
    e.preventDefault();
    setError(''); setConflict(null);
    try {
      await api('/allocations', { method: 'POST', body: {
        asset_id: Number(form.asset_id), employee_id: Number(form.employee_id),
        expected_return_date: form.expected_return_date || null,
      }});
      setForm({ asset_id: '', employee_id: '', expected_return_date: '' });
      load();
    } catch (err) {
      // 409 = conflict rule: show holder and offer Transfer Request instead
      if (err.status === 409 && err.data.held_by) setConflict({ message: err.message, asset_id: Number(form.asset_id) });
      else setError(err.message);
    }
  };

  const requestTransfer = async () => {
    try {
      await api('/allocations/transfers', { method: 'POST', body: {
        asset_id: conflict.asset_id, to_employee_id: Number(form.employee_id), reason: 'Requested after allocation conflict',
      }});
      setConflict(null);
      load();
    } catch (err) { setError(err.message); }
  };

  const decideTransfer = async (id, action) => {
    try { await api(`/allocations/transfers/${id}`, { method: 'PUT', body: { action } }); load(); }
    catch (err) { setError(err.message); }
  };

  const markReturned = async (id) => {
    const notes = prompt('Condition / check-in notes?') || '';
    try { await api(`/allocations/${id}/return`, { method: 'POST', body: { return_notes: notes } }); load(); }
    catch (err) { setError(err.message); }
  };

  const canManage = ['admin', 'asset_manager', 'dept_head'].includes(user.role);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Allocations &amp; Transfers</h1>
        <p className="text-sm text-slate-500 mt-1">Assign assets to employees and manage asset transfer requests.</p>
      </div>

      {error && (
        <div className="text-xs font-semibold text-rose-500 bg-rose-50 border border-rose-100 rounded-xl p-3">
          {error}
        </div>
      )}

      {/* Allocation creation form */}
      {canManage && (
        <form onSubmit={allocate} className="card flex flex-wrap gap-4 items-end bg-slate-50/40">
          <div className="grow max-w-xs space-y-1">
            <label className="text-xs font-bold text-slate-500 ml-1">Select Asset</label>
            <select className="input" value={form.asset_id} onChange={(e) => setForm({ ...form, asset_id: e.target.value })} required>
              <option value="">Select Asset...</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.asset_tag} — {a.name} ({a.status})
                </option>
              ))}
            </select>
          </div>

          <div className="grow max-w-xs space-y-1">
            <label className="text-xs font-bold text-slate-500 ml-1">Assign To Employee</label>
            <select className="input" value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} required>
              <option value="">Select Employee...</option>
              {employees.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 ml-1">Expected Return Date</label>
            <input className="input" type="date" value={form.expected_return_date} onChange={(e) => setForm({ ...form, expected_return_date: e.target.value })} />
          </div>

          <button className="btn px-6 py-2.5">
            <Plus className="h-4.5 w-4.5" /> Allocate
          </button>
        </form>
      )}

      {/* Conflict Alert Banner */}
      {conflict && (
        <div className="card border-amber-200 bg-amber-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 animate-pulse">
          <div className="flex items-center gap-3 text-amber-800 text-sm font-semibold">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            <span>{conflict.message}</span>
          </div>
          <button className="btn bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 shadow-amber-500/10 shrink-0" onClick={requestTransfer}>
            <Send className="h-4 w-4" /> Request Transfer
          </button>
        </div>
      )}

      {/* Allocations Table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50">
          <h2 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Active Allocations</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="th">Asset</th>
                <th className="th">Assignee</th>
                <th className="th">Allocated Date</th>
                <th className="th">Expected Return</th>
                <th className="th">Status</th>
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allocations.map((al) => (
                <tr key={al.id} className={al.is_overdue ? 'bg-rose-50/20' : 'hover:bg-slate-50/30'}>
                  <td className="td font-bold text-slate-800">
                    <span className="font-mono text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-1 text-xs mr-2">
                      {al.asset_tag}
                    </span>
                    <span>{al.asset_name}</span>
                  </td>
                  <td className="td font-semibold text-slate-600">{al.employee_name || al.department_name}</td>
                  <td className="td text-slate-500 font-semibold">{new Date(al.allocated_at).toLocaleDateString()}</td>
                  <td className="td">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-semibold">
                        {al.expected_return_date ? new Date(al.expected_return_date).toLocaleDateString() : '—'}
                      </span>
                      {al.is_overdue && (
                        <span className="bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-extrabold px-2 py-0.5 rounded-lg">
                          OVERDUE
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="td capitalize">
                    <span className={`badge ${al.status === 'active' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                      {al.status}
                    </span>
                  </td>
                  <td className="td text-right">
                    {al.status === 'active' && (
                      <button className="btn-secondary text-xs !py-1.5 px-3" onClick={() => markReturned(al.id)}>
                        Mark Returned
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {allocations.length === 0 && (
          <p className="p-6 text-sm text-slate-400 text-center font-medium">No active allocations.</p>
        )}
      </div>

      {/* Transfer Requests */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-3">
          <ClipboardList className="h-4.5 w-4.5 text-slate-400" />
          <h2 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Transfer Requests</h2>
        </div>

        <div className="space-y-3">
          {transfers.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 font-semibold text-center">No transfer requests found.</p>
          ) : (
            transfers.map((t) => (
              <div key={t.id} className="flex flex-col sm:flex-row sm:items-center justify-between text-sm p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors gap-3">
                <div>
                  <div className="font-bold text-slate-800 flex items-center gap-2">
                    <span className="font-mono text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {t.asset_tag}
                    </span>
                    <span className="text-slate-400"><ArrowRight className="h-3.5 w-3.5 inline" /></span>
                    <span>{t.to_employee_name || t.to_department_name}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 font-semibold">
                    Requested by {t.requested_by_name}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`badge border capitalize ${
                    t.status === 'pending' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                    t.status === 'approved' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                    'bg-rose-50 border-rose-100 text-rose-700'
                  }`}>
                    {t.status}
                  </span>

                  {t.status === 'pending' && canManage && (
                    <div className="flex gap-2">
                      <button className="btn-secondary !p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 border-emerald-100/50" onClick={() => decideTransfer(t.id, 'approve')} title="Approve">
                        <Check className="h-4 w-4" />
                      </button>
                      <button className="btn-secondary !p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border-rose-100/50" onClick={() => decideTransfer(t.id, 'reject')} title="Reject">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

