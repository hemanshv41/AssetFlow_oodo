// OWNER: P2 — add photo display, status transition buttons, QR code render
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Calendar,
  MapPin,
  DollarSign,
  Package,
  Layers,
  Clock,
  Wrench,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  FileText,
  UploadCloud,
  ChevronRight,
  TrendingUp,
  History
} from 'lucide-react';

const STATUS_COLORS = {
  available: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  allocated: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  reserved: 'bg-sky-50 text-sky-700 border-sky-100',
  under_maintenance: 'bg-amber-50 text-amber-700 border-amber-100',
  lost: 'bg-rose-50 text-rose-700 border-rose-100',
  retired: 'bg-slate-100 text-slate-600 border-slate-200',
  disposed: 'bg-slate-100 text-slate-400 border-slate-200',
};

// Allowed manual status transitions per current status
const TRANSITIONS = {
  available:         ['reserved', 'lost', 'retired', 'disposed'],
  allocated:         ['lost', 'retired'],
  reserved:          ['available', 'lost', 'retired', 'disposed'],
  under_maintenance: ['available', 'lost', 'retired'],
  lost:              ['available'],
  retired:           ['disposed'],
  disposed:          [],
};

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [asset, setAsset] = useState(null);
  const [error, setError] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [edit, setEdit] = useState({});
  const [imageMode, setImageMode] = useState('url');
  const [activePhoto, setActivePhoto] = useState(null);

  const reload = () => api(`/assets/${id}`).then((a) => { setAsset(a); setEdit({ name: a.name, condition: a.condition, location: a.location || '', is_bookable: a.is_bookable, image_url: a.image_url || '' }); });
  useEffect(() => { reload(); }, [id]);

  if (!asset) return <div className="text-slate-500 animate-pulse p-10 font-semibold text-center">Loading Asset details...</div>;

  const canEdit   = ['admin', 'asset_manager'].includes(user.role);
  const canDelete = canEdit;

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const b64 = await toBase64(file);
    setEdit((prev) => ({ ...prev, image_url: b64 }));
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api(`/assets/${id}`, { method: 'PUT', body: edit });
      setShowEdit(false);
      reload();
    } catch (err) { setError(err.message); }
  };

  const transition = async (status) => {
    if (!window.confirm(`Mark asset as "${status.replace(/_/g, ' ')}"?`)) return;
    setError('');
    try {
      await api(`/assets/${id}`, { method: 'PUT', body: { status } });
      reload();
    } catch (err) { setError(err.message); }
  };

  const deleteAsset = async () => {
    if (!window.confirm(`Delete ${asset.asset_tag} — ${asset.name}? This cannot be undone.`)) return;
    try {
      await api(`/assets/${id}`, { method: 'DELETE' });
      navigate('/assets');
    } catch (err) { setError(err.message); }
  };

  const nextStatuses = TRANSITIONS[asset.status] || [];

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link to="/assets" className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to assets
        </Link>
        <div className="flex gap-2">
          {canEdit && (
            <button onClick={() => setShowEdit(true)} className="btn-secondary">
              <Edit2 className="h-4 w-4" /> Edit
            </button>
          )}
          {canDelete && (
            <button onClick={deleteAsset} className="btn-danger">
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="text-xs font-semibold text-rose-500 bg-rose-50 border border-rose-100 rounded-xl p-3">
          {error}
        </div>
      )}

      {/* Main info card */}
      <div className="card flex flex-col md:flex-row gap-6 items-start md:items-stretch">
        <div className="w-full md:w-32 h-32 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border flex-shrink-0 flex items-center justify-center overflow-hidden">
          {asset.image_url ? (
            <img src={asset.image_url} alt={asset.name} className="h-full w-full object-cover" />
          ) : (
            <Package className="h-10 w-10 text-slate-300" />
          )}
        </div>

        <div className="flex-1 flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="text-xs font-bold text-indigo-600 font-mono flex items-center gap-1 uppercase tracking-wider">
                <Package className="h-3.5 w-3.5" /> {asset.asset_tag}
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 leading-snug mt-0.5">{asset.name}</h1>
            </div>
            <span className={`badge border ${STATUS_COLORS[asset.status]}`}>
              {asset.status.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-50 text-xs font-semibold text-slate-500">
            <div>
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">Category</div>
              <div className="text-slate-700 flex items-center gap-1"><Layers className="h-3.5 w-3.5 text-slate-300" /> {asset.category_name}</div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">Condition</div>
              <div className="text-slate-700 flex items-center gap-1">
                <span className={`h-2 w-2 rounded-full inline-block ${asset.condition === 'new' || asset.condition === 'good' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                <span className="capitalize">{asset.condition}</span>
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">Location</div>
              <div className="text-slate-700 truncate flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-slate-300" /> {asset.location || '—'}</div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">Serial Number</div>
              <div className="text-slate-700 truncate font-mono">{asset.serial_number || '—'}</div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">Acquisition Date</div>
              <div className="text-slate-700 flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-slate-300" /> {asset.acquisition_date ? new Date(asset.acquisition_date).toLocaleDateString() : '—'}</div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">Acquisition Cost</div>
              <div className="text-slate-700 flex items-center gap-0.5"><DollarSign className="h-3.5 w-3.5 text-slate-300" /> {asset.acquisition_cost ? Number(asset.acquisition_cost).toLocaleString() : '—'}</div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">Bookable Resource</div>
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${asset.is_bookable ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                {asset.is_bookable ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action transitions */}
      {canEdit && nextStatuses.length > 0 && (
        <div className="card bg-slate-50/20 border-indigo-100/50">
          <h2 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3">Manual Status Update</h2>
          <div className="flex flex-wrap gap-2">
            {nextStatuses.map((s) => {
              const isDestructive = ['lost', 'disposed'].includes(s);
              return (
                <button
                  key={s}
                  onClick={() => transition(s)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-97 cursor-pointer border ${
                    isDestructive
                      ? 'bg-rose-50 hover:bg-rose-100/80 border-rose-100 text-rose-700'
                      : s === 'retired'
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm'
                  }`}
                >
                  Mark as {s.replace(/_/g, ' ')}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
          <form onSubmit={saveEdit} className="bg-white rounded-2xl border border-slate-100 shadow-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="font-bold text-slate-800 text-lg">Edit Asset Details</h2>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Asset Name</label>
              <input className="input" placeholder="Name" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} required />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Condition</label>
              <select className="input" value={edit.condition} onChange={(e) => setEdit({ ...edit, condition: e.target.value })}>
                {['new', 'good', 'fair', 'poor'].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Location</label>
              <input className="input" placeholder="Location" value={edit.location} onChange={(e) => setEdit({ ...edit, location: e.target.value })} />
            </div>

            <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 cursor-pointer">
              <input type="checkbox" checked={edit.is_bookable} onChange={(e) => setEdit({ ...edit, is_bookable: e.target.checked })} className="rounded text-indigo-600 focus:ring-indigo-500" />
              Shared / bookable resource
            </label>

            {/* Photo inside Edit Modal */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-semibold text-slate-500 block">Asset Image</label>
              <div className="flex gap-4 text-xs font-medium text-slate-600">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" checked={imageMode === 'url'} onChange={() => setImageMode('url')} className="text-indigo-600 focus:ring-indigo-500" /> URL Link
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" checked={imageMode === 'file'} onChange={() => setImageMode('file')} className="text-indigo-600 focus:ring-indigo-500" /> Upload File
                </label>
              </div>
              {imageMode === 'url' ? (
                <input className="input" placeholder="Image URL" value={edit.image_url} onChange={(e) => setEdit({ ...edit, image_url: e.target.value })} />
              ) : (
                <div className="relative">
                  <input type="file" accept="image/*" className="hidden" id="edit-file-input" onChange={handleFile} />
                  <label htmlFor="edit-file-input" className="w-full flex items-center justify-center gap-2 border border-dashed border-slate-300 rounded-xl py-2 px-4 text-xs font-semibold bg-white hover:bg-slate-50 cursor-pointer text-slate-600">
                    <UploadCloud className="h-4 w-4 text-slate-400" /> Choose Image File
                  </label>
                </div>
              )}
              {edit.image_url && <img src={edit.image_url} alt="preview" className="h-14 w-14 object-cover rounded-xl border mt-1" />}
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-100">
              <button type="submit" className="btn flex-1">Save Changes</button>
              <button type="button" className="btn-secondary flex-1" onClick={() => setShowEdit(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Allocation & Maintenance timelines */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Allocation History */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-3">
            <History className="h-4.5 w-4.5 text-slate-400" />
            <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Allocation History</h2>
          </div>

          <div className="relative border-l border-slate-100 pl-4 ml-2 space-y-5">
            {asset.allocations.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 font-semibold text-center pl-0 ml-[-8px]">Never allocated.</p>
            ) : (
              asset.allocations.map((al) => {
                const isActive = !al.returned_at;
                return (
                  <div key={al.id} className="relative text-sm">
                    {/* timeline bullet */}
                    <span className={`absolute -left-[21px] top-1.5 h-3.5 w-3.5 rounded-full border-2 ${
                      isActive ? 'bg-indigo-600 border-indigo-100 ring-4 ring-indigo-50' : 'bg-slate-200 border-white'
                    }`} />
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-800">{al.employee_name || al.department_name}</span>
                        <div className="text-xs text-slate-400 mt-0.5">Assigned by {al.allocated_by_name}</div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        isActive ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {isActive ? 'Active' : 'Returned'}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-300" />
                      <span>
                        {new Date(al.allocated_at).toLocaleDateString()}
                        {' → '}
                        {al.returned_at ? new Date(al.returned_at).toLocaleDateString() : 'Present'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Maintenance History */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-3">
            <Wrench className="h-4.5 w-4.5 text-slate-400" />
            <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Maintenance History</h2>
          </div>

          <div className="space-y-4">
            {asset.maintenance.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 font-semibold text-center">No maintenance records.</p>
            ) : (
              asset.maintenance.map((m) => (
                <div key={m.id} className="text-sm p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors flex gap-3.5 items-start">
                  {m.photo_url ? (
                    <img
                      src={m.photo_url}
                      alt="Issue"
                      className="h-10 w-10 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-85"
                      onClick={() => setActivePhoto(m.photo_url)}
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-slate-50 border flex items-center justify-center text-[10px] text-slate-300 font-bold uppercase shrink-0">
                      N/A
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-1">
                      <div className="font-bold text-slate-800 truncate leading-snug">{m.issue}</div>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded capitalize shrink-0">
                        {m.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-x-2 gap-y-0.5 font-semibold">
                      <span>Priority:{' '}
                        <span className={`font-bold ${
                          m.priority === 'critical' ? 'text-rose-600' : m.priority === 'high' ? 'text-amber-500' : 'text-slate-500'
                        }`}>{m.priority}</span>
                      </span>
                      <span>·</span>
                      <span>By {m.raised_by_name}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal for Photo Preview */}
      {activePhoto && (
        <div
          className="fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in"
          onClick={() => setActivePhoto(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] bg-white p-2 rounded-2xl shadow-2xl overflow-hidden">
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
    </div>
  );
}

