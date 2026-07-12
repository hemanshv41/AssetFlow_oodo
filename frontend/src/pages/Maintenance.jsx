// OWNER: P3 — add photo attach, technician-assignment modal, priority filters
import { useEffect, useState, useRef } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import {
  Wrench,
  AlertTriangle,
  Image as ImageIcon,
  Plus,
  Filter,
  Check,
  X,
  UserPlus,
  Play,
  CheckCircle,
  Eye,
  Trash,
  UploadCloud,
  ChevronDown
} from 'lucide-react';

const PRIORITY_BADGES = {
  critical: 'bg-rose-50 border-rose-200 text-rose-700 font-bold animate-pulse',
  high: 'bg-orange-50 border-orange-200 text-orange-700',
  medium: 'bg-amber-50 border-amber-200 text-amber-700',
  low: 'bg-emerald-50 border-emerald-200 text-emerald-700',
};

const STATUS_BADGES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  approved: 'bg-sky-50 text-sky-700 border-sky-100',
  rejected: 'bg-rose-50 text-rose-700 border-rose-100',
  assigned: 'bg-purple-50 text-purple-700 border-purple-100',
  in_progress: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  resolved: 'bg-emerald-50 text-emerald-700 border-emerald-100'
};

export default function Maintenance() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [assets, setAssets] = useState([]);
  const [form, setForm] = useState({ asset_id: '', issue: '', priority: 'medium', photo_url: '' });
  const [error, setError] = useState('');
  const [activePhoto, setActivePhoto] = useState(null);
  
  // Technician Assignment Modal States
  const [technicians, setTechnicians] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [selectedTechId, setSelectedTechId] = useState('');

  // Manager Filtering States
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const fileInputRef = useRef(null);

  const load = () => {
    api('/maintenance').then(setRequests);
    
    if (user && user.role === 'employee') {
      api('/allocations?mine=true&active=true').then((allocs) => {
        setAssets(allocs.map(al => ({
          id: al.asset_id,
          asset_tag: al.asset_tag,
          name: al.asset_name
        })));
      });
    } else {
      api('/assets').then(setAssets);
    }
  };

  useEffect(load, [user]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Image size must be less than 2MB');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((f) => ({ ...f, photo_url: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const raise = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api('/maintenance', { method: 'POST', body: { ...form, asset_id: Number(form.asset_id) } });
      setForm({ asset_id: '', issue: '', priority: 'medium', photo_url: '' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      load();
    } catch (err) { setError(err.message); }
  };

  const act = async (id, action) => {
    setError('');
    if (action === 'assign') {
      setSelectedRequestId(id);
      api('/technicians')
        .then((data) => {
          setTechnicians(data.filter(t => t.status === 'active'));
          setShowAssignModal(true);
        })
        .catch(err => setError(err.message));
      return;
    }
    
    try {
      await api(`/maintenance/${id}`, { method: 'PUT', body: { action } });
      load();
    } catch (err) { setError(err.message); }
  };

  const assignTechnician = async (e) => {
    e.preventDefault();
    if (!selectedTechId) return;
    setError('');
    try {
      await api(`/maintenance/${selectedRequestId}`, {
        method: 'PUT',
        body: { action: 'assign', technician_id: Number(selectedTechId) }
      });
      setShowAssignModal(false);
      setSelectedRequestId(null);
      setSelectedTechId('');
      load();
    } catch (err) { setError(err.message); }
  };

  const isManager = ['admin', 'asset_manager'].includes(user?.role);
  const NEXT = { pending: ['approve', 'reject'], approved: ['assign'], assigned: ['start', 'resolve'], in_progress: ['resolve'] };

  // Filter requests client-side based on pills and dropdown selection
  const filteredRequests = requests.filter((m) => {
    if (isManager) {
      if (statusFilter !== 'all') {
        if (statusFilter === 'pending' && m.status !== 'pending') return false;
        if (statusFilter === 'approved' && m.status !== 'approved') return false;
        if (statusFilter === 'active' && !['assigned', 'in_progress'].includes(m.status)) return false;
        if (statusFilter === 'resolved' && m.status !== 'resolved') return false;
        if (statusFilter === 'rejected' && m.status !== 'rejected') return false;
      }
      if (priorityFilter !== 'all' && m.priority !== priorityFilter) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Maintenance Tickets</h1>
        <p className="text-sm text-slate-500 mt-1">Report asset faults, monitor repairs, and dispatch technicians.</p>
      </div>

      {error && (
        <div className="text-xs font-semibold text-rose-500 bg-rose-50 border border-rose-100 rounded-xl p-3">
          {error}
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={raise} className="card flex flex-wrap gap-4 items-end bg-slate-50/40">
        <div className="grow max-w-xs space-y-1">
          <label className="text-xs font-bold text-slate-500 ml-1">Asset with issue</label>
          <select className="input" value={form.asset_id} onChange={(e) => setForm({ ...form, asset_id: e.target.value })} required>
            <option value="">Select Asset...</option>
            {assets.map((a) => <option key={a.id} value={a.id}>{a.asset_tag} — {a.name}</option>)}
          </select>
        </div>

        <div className="grow max-w-md space-y-1">
          <label className="text-xs font-bold text-slate-500 ml-1">Describe fault</label>
          <input className="input" placeholder="e.g. Screen flickering when plugged in" value={form.issue} onChange={(e) => setForm({ ...form, issue: e.target.value })} required />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 ml-1">Severity / Priority</label>
          <select className="input font-semibold text-slate-600" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            {['low', 'medium', 'high', 'critical'].map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>

        <div className="grow max-w-xs space-y-1">
          <label className="text-xs font-bold text-slate-500 ml-1">Attach Photo</label>
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              id="maintenance-file"
              onChange={handlePhotoChange}
            />
            <label htmlFor="maintenance-file" className="w-full flex items-center justify-center gap-2 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-semibold bg-white hover:bg-slate-50 cursor-pointer text-slate-600">
              <UploadCloud className="h-4 w-4 text-slate-400" /> Choose Image
            </label>
          </div>
        </div>

        {form.photo_url && (
          <div className="flex items-center gap-2 pb-1 shrink-0">
            <img src={form.photo_url} alt="Preview" className="h-10 w-10 object-cover rounded-xl border border-slate-200" />
            <button
              type="button"
              className="text-xs text-rose-600 hover:text-rose-800 font-bold"
              onClick={() => {
                setForm(f => ({ ...f, photo_url: '' }));
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
            >
              Clear
            </button>
          </div>
        )}

        <button className="btn px-6 py-2.5">
          <Plus className="h-4.5 w-4.5" /> Submit Request
        </button>
      </form>

      {/* Role-based Filter Controls for Admin and Asset Managers */}
      {isManager && (
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/50">
          <div className="flex-1 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mr-2 flex items-center gap-1">
              <Filter className="h-3.5 w-3.5" /> Filter:
            </span>
            {[
              { id: 'all', label: 'All Jobs' },
              { id: 'pending', label: 'Pending' },
              { id: 'approved', label: 'Approved' },
              { id: 'active', label: 'Under Repair' },
              { id: 'resolved', label: 'Resolved' },
              { id: 'rejected', label: 'Rejected' }
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  statusFilter === f.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Priority:</span>
            <select
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 font-bold text-slate-600"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
      )}

      {/* Requests list table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="th">Asset</th>
                <th className="th">Fault Description</th>
                <th className="th">Photo</th>
                <th className="th">Priority</th>
                <th className="th">Raised By</th>
                <th className="th">Status</th>
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/30">
                  <td className="td">
                    <span className="font-mono text-xs text-indigo-600 font-bold bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-1">
                      {m.asset_tag}
                    </span>
                  </td>
                  <td className="td">
                    <div className="font-semibold text-slate-800">{m.issue}</div>
                    {m.technician_name && (
                      <div className="text-[10px] text-indigo-600 font-bold mt-1 inline-flex items-center gap-1 bg-indigo-50/70 border border-indigo-100/50 px-2 py-0.5 rounded-lg">
                        <Wrench className="h-3 w-3" /> Tech Assigned: {m.technician_name} {m.technician_specialty ? `(${m.technician_specialty})` : ''}
                      </div>
                    )}
                  </td>
                  <td className="td">
                    {m.photo_url ? (
                      <div className="relative group/preview inline-block">
                        <img
                          src={m.photo_url}
                          alt="Asset Issue"
                          className="h-10 w-10 object-cover rounded-xl border border-slate-100 cursor-pointer hover:opacity-85 transition-opacity"
                          onClick={() => setActivePhoto(m.photo_url)}
                        />
                        <div className="absolute inset-0 bg-black/40 rounded-xl pointer-events-none opacity-0 group-hover/preview:opacity-100 flex items-center justify-center transition-opacity">
                          <Eye className="h-3.5 w-3.5 text-white" />
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-300 text-xs font-semibold">—</span>
                    )}
                  </td>
                  <td className="td capitalize">
                    <span className={`badge border ${PRIORITY_BADGES[m.priority] || 'bg-slate-50'}`}>
                      {m.priority}
                    </span>
                  </td>
                  <td className="td font-semibold text-slate-500">{m.raised_by_name}</td>
                  <td className="td">
                    <span className={`badge border capitalize ${STATUS_BADGES[m.status] || 'bg-slate-50'}`}>
                      {m.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="td text-right">
                    <div className="flex justify-end gap-1.5">
                      {isManager && (NEXT[m.status] || []).map((action) => {
                        const isApprove = action === 'approve';
                        const isReject = action === 'reject';
                        const isAssign = action === 'assign';
                        const isStart = action === 'start';
                        const isResolve = action === 'resolve';
                        
                        return (
                          <button
                            key={action}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer border ${
                              isApprove ? 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100/50' :
                              isReject ? 'bg-rose-50 border-rose-100 text-rose-700 hover:bg-rose-100/50' :
                              isAssign ? 'bg-purple-50 border-purple-100 text-purple-700 hover:bg-purple-100/50' :
                              isStart ? 'bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100/50' :
                              'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-500 hover:border-emerald-500 shadow-sm'
                            }`}
                            onClick={() => act(m.id, action)}
                          >
                            <span className="flex items-center gap-1">
                              {isApprove && <Check className="h-3.5 w-3.5" />}
                              {isReject && <X className="h-3.5 w-3.5" />}
                              {isAssign && <UserPlus className="h-3.5 w-3.5" />}
                              {isStart && <Play className="h-3.5 w-3.5" />}
                              {isResolve && <CheckCircle className="h-3.5 w-3.5" />}
                              <span className="capitalize">{action}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredRequests.length === 0 && (
          <p className="p-8 text-sm text-slate-400 text-center font-medium">No matching maintenance tickets found.</p>
        )}
      </div>

      {/* Lightbox Modal for Photo Preview */}
      {activePhoto && (
        <div
          className="fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in"
          onClick={() => setActivePhoto(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] bg-white p-2 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
            <img src={activePhoto} alt="Maintenance Issue Preview" className="max-w-full max-h-[80vh] object-contain rounded-xl" />
            <button
              onClick={() => setActivePhoto(null)}
              className="absolute top-4 right-4 bg-slate-950/80 text-white rounded-full p-2 hover:bg-slate-950 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Assign Technician Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-indigo-500" /> Assign Technician
              </h3>
              <button 
                onClick={() => { setShowAssignModal(false); setSelectedRequestId(null); setSelectedTechId(''); }} 
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={assignTechnician} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1.5 block ml-1">Select Active Technician</label>
                <div className="relative">
                  <select 
                    className="input font-semibold text-slate-700 pr-10" 
                    value={selectedTechId} 
                    onChange={e => setSelectedTechId(e.target.value)} 
                    required
                  >
                    <option value="">Select Technician...</option>
                    {technicians.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.specialty || 'General'}) — Jobs: {t.active_requests_count}
                      </option>
                    ))}
                  </select>
                </div>
                {technicians.length === 0 && (
                  <p className="text-xs font-semibold text-rose-500 mt-2 bg-rose-50 p-2 rounded-lg border border-rose-100">
                    No active technicians found. Please register technicians in Org Setup first.
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-4">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => { setShowAssignModal(false); setSelectedRequestId(null); setSelectedTechId(''); }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn px-5" 
                  disabled={!selectedTechId}
                >
                  Assign Technician
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

