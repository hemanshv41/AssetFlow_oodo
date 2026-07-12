// OWNER: P4 — cycle detail drill-down (mark each asset verified/missing/damaged), discrepancy report view
import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import {
  ClipboardCheck,
  Calendar,
  Users,
  Check,
  X,
  AlertTriangle,
  Plus,
  ArrowRight,
  TrendingUp,
  FileText
} from 'lucide-react';

export default function Audits() {
  const { user } = useAuth();
  const [cycles, setCycles] = useState([]);
  const [depts, setDepts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState(null); // detailed cycle with asset checklist
  const [form, setForm] = useState({ name: '', scope_department_id: '', start_date: '', end_date: '', auditor_ids: [] });
  const [error, setError] = useState('');

  const load = () => {
    api('/audits').then(setCycles);
    api('/org/departments').then(setDepts);
    api('/org/employees').then(setEmployees);
  };
  useEffect(load, []);

  const openCycle = (id) => api(`/audits/${id}`).then(setSelected).catch((e) => setError(e.message));

  const create = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api('/audits', { method: 'POST', body: {
        ...form, scope_department_id: form.scope_department_id ? Number(form.scope_department_id) : null,
      }});
      setForm({ name: '', scope_department_id: '', start_date: '', end_date: '', auditor_ids: [] });
      load();
    } catch (err) { setError(err.message); }
  };

  const mark = async (assetId, result) => {
    const notes = result !== 'verified' ? prompt('Notes for the discrepancy?') || '' : '';
    try {
      await api(`/audits/${selected.id}/records`, { method: 'POST', body: { asset_id: assetId, result, notes } });
      openCycle(selected.id);
    } catch (err) { setError(err.message); }
  };

  const close = async () => {
    if (!confirm('Close this cycle? Missing assets will be marked Lost. This locks the cycle.')) return;
    await api(`/audits/${selected.id}/close`, { method: 'POST' });
    setSelected(null);
    load();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Inventory Audits</h1>
        <p className="text-sm text-slate-500 mt-1">Conduct regular stock audits and reconcile missing or damaged equipment.</p>
      </div>

      {error && (
        <div className="text-xs font-semibold text-rose-500 bg-rose-50 border border-rose-100 rounded-xl p-3">
          {error}
        </div>
      )}

      {/* Cycle creation form */}
      {user.role === 'admin' && (
        <form onSubmit={create} className="card flex flex-wrap gap-4 items-end bg-slate-50/40">
          <div className="grow max-w-xs space-y-1">
            <label className="text-xs font-bold text-slate-500 ml-1">Cycle Name</label>
            <input className="input" placeholder="e.g. Q3 IT Assets Audit" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>

          <div className="grow max-w-xs space-y-1">
            <label className="text-xs font-bold text-slate-500 ml-1">Department Scope</label>
            <select className="input font-medium text-slate-600" value={form.scope_department_id} onChange={(e) => setForm({ ...form, scope_department_id: e.target.value })}>
              <option value="">All Departments</option>
              {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 ml-1">Start Date</label>
            <input className="input" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 ml-1">End Date</label>
            <input className="input" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} required />
          </div>

          <div className="grow max-w-xs space-y-1">
            <label className="text-xs font-bold text-slate-500 ml-1">Auditors (Ctrl + Click to select multiple)</label>
            <select className="input text-xs" multiple value={form.auditor_ids}
              onChange={(e) => setForm({ ...form, auditor_ids: [...e.target.selectedOptions].map((o) => Number(o.value)) })}>
              {employees.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>

          <button className="btn px-6 py-2.5">
            <Plus className="h-4.5 w-4.5" /> Create Cycle
          </button>
        </form>
      )}

      {/* Main split grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Cycle list card */}
        <div className="space-y-4">
          <h2 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider ml-1">Audit Cycles</h2>
          {cycles.map((c) => {
            const total = c.records_count || 0;
            const unchecked = c.discrepancy_count || 0;
            const progress = total > 0 ? Math.min(100, Math.round(((total - unchecked) / total) * 100)) : 0;
            
            return (
              <button
                key={c.id}
                onClick={() => openCycle(c.id)}
                className={`card w-full text-left cursor-pointer transition-all ${
                  selected?.id === c.id
                    ? 'border-indigo-500 ring-2 ring-indigo-50 bg-indigo-50/5'
                    : 'hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-slate-800 text-base">{c.name}</span>
                  <span className={`badge border capitalize ${c.status === 'open' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                    {c.status}
                  </span>
                </div>

                <div className="text-xs text-slate-500 font-semibold space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-300" />
                    <span>Scope: {c.department_name || 'All Departments'} · {new Date(c.start_date).toLocaleDateString()} – {new Date(c.end_date).toLocaleDateString()}</span>
                  </div>
                  
                  {/* Progress bar container */}
                  <div className="pt-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                      <span>AUDIT RECONCILIATION</span>
                      <span>{c.records_count} CHECKED · <span className="text-rose-500">{c.discrepancy_count} DISCREPANCIES</span></span>
                    </div>
                  </div>
                </div>

                {/* Auditor list */}
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-3 border-t border-slate-50 pt-2 flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-slate-300" /> Auditors: {(c.auditors || []).map((a) => a.name).join(', ') || 'None Assigned'}
                </div>
              </button>
            );
          })}
          {cycles.length === 0 && <p className="text-sm text-slate-400 py-6 text-center font-medium">No audit cycles created yet.</p>}
        </div>

        {/* Selected audit cycle details checklist */}
        {selected && (
          <div className="card h-fit">
            <div className="flex justify-between items-center border-b border-slate-50 pb-3 mb-4">
              <div>
                <h2 className="font-extrabold text-slate-800 text-base">{selected.name}</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Asset Checklist</p>
              </div>
              {selected.status === 'open' && (
                <button className="btn text-xs !py-1.5 px-4" onClick={close}>
                  Close Cycle
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto pr-1">
              {selected.assets.map((a) => (
                <div key={a.id} className="flex items-center justify-between text-sm py-3.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800 truncate">{a.name}</div>
                    <div className="text-xs text-slate-500 font-semibold mt-0.5 flex items-center gap-1.5">
                      <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[10px]">
                        {a.asset_tag}
                      </span>
                      {a.result && (
                        <span className={`badge border capitalize text-[10px] ${
                          a.result === 'verified' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                          a.result === 'missing' ? 'bg-rose-50 border-rose-100 text-rose-700' :
                          'bg-amber-50 border-amber-100 text-amber-700'
                        }`}>
                          {a.result}
                        </span>
                      )}
                    </div>
                  </div>

                  {selected.status === 'open' && (
                    <div className="flex gap-1.5 shrink-0 ml-3">
                      <button className="btn-secondary !p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 border-emerald-100/50" onClick={() => mark(a.id, 'verified')} title="Verify">
                        <Check className="h-4 w-4" />
                      </button>
                      <button className="btn-secondary !p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border-rose-100/50" onClick={() => mark(a.id, 'missing')} title="Mark Missing">
                        <X className="h-4 w-4" />
                      </button>
                      <button className="btn-secondary !p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 border-amber-100/50" onClick={() => mark(a.id, 'damaged')} title="Mark Damaged">
                        <AlertTriangle className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

