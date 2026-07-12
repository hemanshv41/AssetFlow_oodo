// OWNER: P2 — flesh out register form (photo upload, custom category fields), QR code search
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import {
  Grid,
  List as ListIcon,
  Search,
  Plus,
  MapPin,
  Tag,
  Calendar,
  Package,
  Layers,
  ChevronRight,
  Sparkles,
  UploadCloud
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

const EMPTY_FORM = { name: '', category_id: '', serial_number: '', location: '', is_bookable: false, image_url: '', imageMode: 'url' };

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Assets() {
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  const load = () => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (status) params.set('status', status);
    api(`/assets?${params}`).then(setAssets).catch((e) => setError(e.message));
  };

  useEffect(load, [q, status]);
  useEffect(() => { api('/org/categories').then(setCategories); }, []);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const b64 = await toBase64(file);
    setForm((f) => ({ ...f, image_url: b64 }));
  };

  const register = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { imageMode, ...rest } = form;
      await api('/assets', { method: 'POST', body: { ...rest, category_id: Number(rest.category_id) } });
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const canRegister = ['admin', 'asset_manager'].includes(user.role);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title block */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Asset Inventory</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and track hardware, equipment, and shared resources.</p>
        </div>
        {canRegister && (
          <button className="btn" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4.5 w-4.5" />
            {showForm ? 'Cancel' : 'Register Asset'}
          </button>
        )}
      </div>

      {error && (
        <div className="text-xs font-semibold text-rose-500 bg-rose-50 border border-rose-100 rounded-xl p-3">
          {error}
        </div>
      )}

      {/* Register Form */}
      {showForm && (
        <form onSubmit={register} className="card grid md:grid-cols-3 gap-5 animate-fade-in bg-slate-50/40">
          <div className="md:col-span-3 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-indigo-500" />
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Asset Registration Details</h3>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 block ml-1">Asset Name</label>
            <input className="input" placeholder="e.g. MacBook Pro 16&quot;" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 block ml-1">Category</label>
            <select className="input" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} required>
              <option value="">Select Category...</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 block ml-1">Serial Number</label>
            <input className="input" placeholder="e.g. SN-MBP-9012" value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 block ml-1">Location</label>
            <input className="input" placeholder="e.g. HQ Floor 3" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>

          {/* Photo upload config */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-semibold text-slate-500 block ml-1">Asset Image</label>
            <div className="flex gap-4 text-xs font-medium text-slate-600 mb-1">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="imageMode" checked={form.imageMode === 'url'} onChange={() => setForm({ ...form, imageMode: 'url', image_url: '' })} className="text-indigo-600 focus:ring-indigo-500" />
                Image URL
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="imageMode" checked={form.imageMode === 'file'} onChange={() => setForm({ ...form, imageMode: 'file', image_url: '' })} className="text-indigo-600 focus:ring-indigo-500" />
                File Upload
              </label>
            </div>
            {form.imageMode === 'url' ? (
              <input className="input" placeholder="https://example.com/image.png" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            ) : (
              <div className="relative">
                <input type="file" accept="image/*" className="hidden" id="asset-file-input" onChange={handleFile} />
                <label htmlFor="asset-file-input" className="w-full flex items-center justify-center gap-2 border border-dashed border-slate-300 rounded-xl py-2 px-4 text-sm font-semibold bg-white hover:bg-slate-50 cursor-pointer text-slate-600 transition-colors">
                  <UploadCloud className="h-4.5 w-4.5 text-slate-400" /> Choose Image File
                </label>
              </div>
            )}
            {form.image_url && (
              <div className="flex items-center gap-2 mt-2">
                <img src={form.image_url} alt="preview" className="h-12 w-12 object-cover rounded-xl border border-slate-200" />
                <span className="text-xs font-semibold text-slate-400">Preview selected</span>
              </div>
            )}
          </div>

          <div className="md:col-span-3 flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
            <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 cursor-pointer">
              <input type="checkbox" checked={form.is_bookable} onChange={(e) => setForm({ ...form, is_bookable: e.target.checked })} className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4" />
              This is a shared resource (allow user bookings)
            </label>
            <button className="btn px-6">Save Asset</button>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/50">
        <div className="flex-1 flex flex-wrap gap-3 items-center">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              placeholder="Search by tag, serial, or name..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <select
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-all font-medium text-slate-600"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            {Object.keys(STATUS_COLORS).map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* View mode toggle */}
        <div className="flex border border-slate-200 rounded-xl p-1 bg-slate-50">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            title="Grid View"
          >
            <Grid className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            title="List View"
          >
            <ListIcon className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Assets Presentation */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {assets.map((a) => (
            <div key={a.id} className="card p-0 overflow-hidden flex flex-col group relative">
              {/* Asset Badge overlay */}
              <div className="absolute top-3 right-3 z-10">
                <span className={`badge border ${STATUS_COLORS[a.status]}`}>
                  {a.status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Asset image container */}
              <div className="h-40 bg-gradient-to-br from-slate-50 to-slate-100 border-b border-slate-100 flex items-center justify-center relative overflow-hidden">
                {a.image_url ? (
                  <img src={a.image_url} alt={a.name} className="h-full w-full object-cover group-hover:scale-103 transition-transform duration-350" />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shadow-sm">
                      <Package className="h-6 w-6" />
                    </div>
                  </div>
                )}
                {a.is_bookable && (
                  <div className="absolute bottom-2 left-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow">
                    <Calendar className="h-3 w-3" /> Shared
                  </div>
                )}
              </div>

              {/* Detail box */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider font-mono flex items-center gap-1">
                    <Tag className="h-3 w-3 text-indigo-400" /> {a.asset_tag}
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-base leading-snug group-hover:text-indigo-600 transition-colors">
                    {a.name}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold pt-1">
                    <Layers className="h-3.5 w-3.5" />
                    {a.category_name}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-xs mt-4">
                  <div className="flex items-center gap-1 text-slate-400 font-semibold truncate">
                    <MapPin className="h-3.5 w-3.5 text-slate-300" />
                    {a.location || 'No Location'}
                  </div>
                  <Link to={`/assets/${a.id}`} className="font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                    Manage <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
          {assets.length === 0 && (
            <div className="col-span-full card p-8 text-center text-slate-400 font-medium">
              No assets matching the filters found.
            </div>
          )}
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="th">Tag</th>
                  <th className="th">Asset Name</th>
                  <th className="th">Category</th>
                  <th className="th">Status</th>
                  <th className="th">Location</th>
                  <th className="th">Holder / Dept</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/30">
                    <td className="td">
                      <span className="font-mono text-indigo-600 font-bold bg-indigo-50/50 border border-indigo-100 rounded-lg px-2.5 py-1 text-xs">
                        {a.asset_tag}
                      </span>
                    </td>
                    <td className="td font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                        {a.image_url ? (
                          <img src={a.image_url} alt="" className="h-6 w-6 object-cover rounded-md border" />
                        ) : (
                          <div className="h-6 w-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-400">
                            <Package className="h-3.5 w-3.5" />
                          </div>
                        )}
                        <span>{a.name}</span>
                        {a.is_bookable && (
                          <span className="bg-indigo-100 text-indigo-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                            Shared
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="td font-semibold text-slate-500">{a.category_name}</td>
                    <td className="td">
                      <span className={`badge border ${STATUS_COLORS[a.status]}`}>
                        {a.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="td">
                      <div className="flex items-center gap-1 text-slate-500">
                        <MapPin className="h-3.5 w-3.5 text-slate-300" />
                        <span>{a.location || '—'}</span>
                      </div>
                    </td>
                    <td className="td font-medium text-slate-500">{a.holder_name || a.holder_department || '—'}</td>
                    <td className="td text-right">
                      <Link to={`/assets/${a.id}`} className="text-indigo-600 hover:text-indigo-800 font-bold text-xs">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {assets.length === 0 && (
            <p className="p-6 text-sm text-slate-400 text-center font-medium">No assets registered yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
