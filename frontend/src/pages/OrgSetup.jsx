// OWNER: P1 — Admin-only. 4 tabs: Departments / Categories / Employee Directory / Technicians
import { useEffect, useState } from 'react';
import { api } from '../api';
import {
  Building2,
  Layers,
  Users,
  Wrench,
  Plus,
  Check,
  X,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  UserCheck,
  Phone,
  Mail,
  Shield
} from 'lucide-react';

const TAB_CONFIG = {
  departments: { label: 'Departments', icon: Building2 },
  categories: { label: 'Asset Categories', icon: Layers },
  employees: { label: 'Employee Directory', icon: Users },
  technicians: { label: 'Maintenance Technicians', icon: Wrench },
};

export default function OrgSetup() {
  const [tab, setTab] = useState('departments');
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Organization Setup</h1>
        <p className="text-sm text-slate-500 mt-1">Configure company structure, inventory categories, and access permissions.</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border border-slate-200 rounded-xl p-1 bg-slate-50 w-fit gap-1">
        {Object.entries(TAB_CONFIG).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                tab === key
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/40'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Active Tab View */}
      <div className="animate-fade-in">
        {tab === 'departments' && <Departments />}
        {tab === 'categories' && <Categories />}
        {tab === 'employees' && <Employees />}
        {tab === 'technicians' && <Technicians />}
      </div>
    </div>
  );
}

function Departments() {
  const [depts, setDepts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ name: '', head_id: '', parent_id: '' });
  const [error, setError] = useState('');

  const load = () => {
    api('/org/departments').then(setDepts);
    api('/org/employees').then(setEmployees);
  };
  useEffect(load, []);

  const create = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api('/org/departments', { method: 'POST', body: {
        name: form.name, head_id: form.head_id ? Number(form.head_id) : null, parent_id: form.parent_id ? Number(form.parent_id) : null,
      }});
      setForm({ name: '', head_id: '', parent_id: '' });
      load();
    } catch (err) { setError(err.message); }
  };

  const toggle = async (d) => {
    await api(`/org/departments/${d.id}`, { method: 'PUT', body: { status: d.status === 'active' ? 'inactive' : 'active', head_id: d.head_id, parent_id: d.parent_id } });
    load();
  };

  return (
    <div className="space-y-6">
      {error && <div className="text-xs font-semibold text-rose-500 bg-rose-50 border border-rose-100 rounded-xl p-3">{error}</div>}
      
      <form onSubmit={create} className="card flex flex-wrap gap-4 items-end bg-slate-50/40">
        <div className="grow max-w-xs space-y-1">
          <label className="text-xs font-bold text-slate-500 ml-1">Department Name</label>
          <input className="input" placeholder="e.g. Finance & Accounting" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="grow max-w-xs space-y-1">
          <label className="text-xs font-bold text-slate-500 ml-1">Department Head (optional)</label>
          <select className="input" value={form.head_id} onChange={(e) => setForm({ ...form, head_id: e.target.value })}>
            <option value="">Select Head...</option>
            {employees.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div className="grow max-w-xs space-y-1">
          <label className="text-xs font-bold text-slate-500 ml-1">Parent Department (optional)</label>
          <select className="input" value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })}>
            <option value="">Select Parent...</option>
            {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <button className="btn px-6 py-2.5"><Plus className="h-4.5 w-4.5" /> Add</button>
      </form>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="th">Department Name</th>
                <th className="th">Department Head</th>
                <th className="th">Parent Department</th>
                <th className="th">Status</th>
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {depts.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/30">
                  <td className="td font-bold text-slate-800">{d.name}</td>
                  <td className="td font-semibold text-slate-500">{d.head_name || '—'}</td>
                  <td className="td text-slate-500 font-medium">{d.parent_name || '—'}</td>
                  <td className="td">
                    <span className={`badge border ${d.status === 'active' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="td text-right">
                    <button
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        d.status === 'active'
                          ? 'bg-rose-50 hover:bg-rose-100/50 border-rose-100 text-rose-700'
                          : 'bg-emerald-50 hover:bg-emerald-100/50 border-emerald-100 text-emerald-700'
                      }`}
                      onClick={() => toggle(d)}
                    >
                      {d.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Categories() {
  const [cats, setCats] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const load = () => api('/org/categories').then(setCats);
  useEffect(load, []);

  const create = async (e) => {
    e.preventDefault();
    await api('/org/categories', { method: 'POST', body: form });
    setForm({ name: '', description: '' });
    load();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={create} className="card flex flex-wrap gap-4 items-end bg-slate-50/40">
        <div className="grow max-w-xs space-y-1">
          <label className="text-xs font-bold text-slate-500 ml-1">Category Name</label>
          <input className="input" placeholder="e.g. Computing Devices" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="grow max-w-md space-y-1">
          <label className="text-xs font-bold text-slate-500 ml-1">Category Description</label>
          <input className="input" placeholder="Laptops, workstations, accessories..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <button className="btn px-6 py-2.5"><Plus className="h-4.5 w-4.5" /> Add Category</button>
      </form>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="th">Category</th>
                <th className="th">Description</th>
                <th className="th">Custom Attribute Fields</th>
              </tr>
            </thead>
            <tbody>
              {cats.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/30">
                  <td className="td font-bold text-slate-800">{c.name}</td>
                  <td className="td font-semibold text-slate-500">{c.description || '—'}</td>
                  <td className="td">
                    <div className="flex flex-wrap gap-1.5">
                      {(c.custom_fields || []).map((f, i) => (
                        <span key={i} className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded">
                          {f.name} ({f.type})
                        </span>
                      ))}
                      {(c.custom_fields || []).length === 0 && <span className="text-slate-300 text-xs font-semibold">—</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [depts, setDepts] = useState([]);
  const load = () => { api('/org/employees').then(setEmployees); api('/org/departments').then(setDepts); };
  useEffect(load, []);

  const update = async (id, patch, current) => {
    await api(`/org/employees/${id}`, { method: 'PUT', body: { department_id: current.department_id, ...patch } });
    load();
  };

  return (
    <div className="card p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="th">Employee Name</th>
              <th className="th">Email Address</th>
              <th className="th">Department Assignment</th>
              <th className="th">Access Permission Role</th>
              <th className="th text-right">Directory Status</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/30">
                <td className="td font-bold text-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-slate-50 border flex items-center justify-center font-bold text-slate-400 text-xs shrink-0">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <span>{u.name}</span>
                  </div>
                </td>
                <td className="td font-semibold text-slate-500">{u.email}</td>
                <td className="td">
                  <select className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 font-semibold text-slate-600 max-w-[200px]" value={u.department_id || ''} onChange={(e) => update(u.id, { department_id: e.target.value ? Number(e.target.value) : null }, u)}>
                    <option value="">No Department Assigned</option>
                    {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </td>
                <td className="td">
                  <select className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 font-bold text-slate-700 max-w-[200px]" value={u.role} onChange={(e) => update(u.id, { role: e.target.value }, u)}>
                    <option value="employee">Employee</option>
                    <option value="dept_head">Department Head</option>
                    <option value="asset_manager">Asset Manager</option>
                    <option value="admin">Administrator</option>
                  </select>
                </td>
                <td className="td text-right">
                  <button
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      u.status === 'active'
                        ? 'bg-rose-50 hover:bg-rose-100/50 border-rose-100 text-rose-700'
                        : 'bg-emerald-50 hover:bg-emerald-100/50 border-emerald-100 text-emerald-700'
                    }`}
                    onClick={() => update(u.id, { status: u.status === 'active' ? 'inactive' : 'active' }, u)}
                  >
                    {u.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Technicians() {
  const [techs, setTechs] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '', specialty: '' });
  const [error, setError] = useState('');

  const load = () => {
    api('/technicians')
      .then(setTechs)
      .catch(err => setError(err.message));
  };

  useEffect(load, []);

  const create = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api('/technicians', { method: 'POST', body: form });
      setForm({ name: '', email: '', phone: '', specialty: '' });
      load();
    } catch (err) { setError(err.message); }
  };

  const toggleStatus = async (t) => {
    setError('');
    try {
      await api(`/technicians/${t.id}`, {
        method: 'PUT',
        body: { status: t.status === 'active' ? 'inactive' : 'active' }
      });
      load();
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="space-y-6">
      {error && <div className="text-xs font-semibold text-rose-500 bg-rose-50 border border-rose-100 rounded-xl p-3">{error}</div>}
      
      <form onSubmit={create} className="card grid sm:grid-cols-2 md:grid-cols-5 gap-4 items-end bg-slate-50/40">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 ml-1">Name</label>
          <input className="input" placeholder="e.g. Rajesh Kumar" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 ml-1">Email Address</label>
          <input className="input" type="email" placeholder="e.g. rajesh@agency.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 ml-1">Phone Number</label>
          <input className="input" placeholder="e.g. +91 98765 43210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 ml-1">Specialization Specialty</label>
          <input className="input" placeholder="e.g. Electronics, AC Systems" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
        </div>
        <button className="btn px-6 py-2.5"><Plus className="h-4.5 w-4.5" /> Add Technician</button>
      </form>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="th">Technician Name</th>
                <th className="th">Email</th>
                <th className="th">Phone</th>
                <th className="th">Specialization</th>
                <th className="th">Active Workload</th>
                <th className="th">Status</th>
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {techs.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/30">
                  <td className="td font-bold text-slate-800">{t.name}</td>
                  <td className="td font-semibold text-slate-500">{t.email || '—'}</td>
                  <td className="td text-slate-500 font-medium">{t.phone || '—'}</td>
                  <td className="td font-bold text-slate-600 capitalize">{t.specialty || 'General'}</td>
                  <td className="td font-extrabold text-indigo-600">{t.active_requests_count} active jobs</td>
                  <td className="td">
                    <span className={`badge border ${t.status === 'active' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="td text-right">
                    <button
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        t.status === 'active'
                          ? 'bg-rose-50 hover:bg-rose-100/50 border-rose-100 text-rose-700'
                          : 'bg-emerald-50 hover:bg-emerald-100/50 border-emerald-100 text-emerald-700'
                      }`}
                      onClick={() => toggleStatus(t)}
                    >
                      {t.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

