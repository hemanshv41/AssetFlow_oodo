// OWNER: P3 — upgrade the list into a proper calendar/day view; add reschedule + reminder toast
import { useEffect, useState } from 'react';
import { api } from '../api';
import {
  Calendar,
  Clock,
  User,
  Plus,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText,
  MapPin
} from 'lucide-react';

export default function Bookings() {
  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [form, setForm] = useState({ asset_id: '', start_time: '', end_time: '', purpose: '' });
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const load = () => {
    api('/assets?bookable=true').then(setResources);
    api('/bookings').then(setBookings);
  };
  useEffect(load, []);

  const book = async (e) => {
    e.preventDefault();
    setError(''); setOk('');
    try {
      await api('/bookings', { method: 'POST', body: { ...form, asset_id: Number(form.asset_id) } });
      setOk('Booking confirmed successfully! ✅');
      setForm({ asset_id: '', start_time: '', end_time: '', purpose: '' });
      load();
    } catch (err) {
      setError(err.message); // 409 shows the overlapping booking details
    }
  };

  const cancel = async (id) => {
    if (!window.confirm('Cancel this resource booking?')) return;
    try { await api(`/bookings/${id}/cancel`, { method: 'POST' }); load(); }
    catch (err) { setError(err.message); }
  };

  const statusColor = {
    upcoming: 'bg-sky-50 text-sky-700 border-sky-100',
    ongoing: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    completed: 'bg-slate-100 text-slate-600 border-slate-200',
    cancelled: 'bg-rose-50 text-rose-700 border-rose-100'
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Resource Bookings</h1>
        <p className="text-sm text-slate-500 mt-1">Schedule and manage shared rooms, equipment, and company resources.</p>
      </div>

      {error && (
        <div className="text-xs font-semibold text-rose-500 bg-rose-50 border border-rose-100 rounded-xl p-3">
          🚫 {error}
        </div>
      )}
      {ok && (
        <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
          {ok}
        </div>
      )}

      {/* Booking Form */}
      <form onSubmit={book} className="card flex flex-wrap gap-4 items-end bg-slate-50/40">
        <div className="grow max-w-xs space-y-1">
          <label className="text-xs font-bold text-slate-500 ml-1">Select Resource</label>
          <select className="input" value={form.asset_id} onChange={(e) => setForm({ ...form, asset_id: e.target.value })} required>
            <option value="">Select Resource...</option>
            {resources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} {r.location ? `(${r.location})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 ml-1">Start Time</label>
          <input className="input" type="datetime-local" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} required />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 ml-1">End Time</label>
          <input className="input" type="datetime-local" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} required />
        </div>

        <div className="grow max-w-xs space-y-1">
          <label className="text-xs font-bold text-slate-500 ml-1">Purpose / Notes</label>
          <input className="input" placeholder="e.g. Weekly Sync Meeting" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
        </div>

        <button className="btn px-6 py-2.5">
          <Plus className="h-4.5 w-4.5" /> Book Resource
        </button>
      </form>

      {/* Bookings log */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50">
          <h2 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Booking Schedule</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="th">Resource</th>
                <th className="th">Booked By</th>
                <th className="th">From</th>
                <th className="th">To</th>
                <th className="th">Status</th>
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/30">
                  <td className="td font-bold text-slate-800">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-indigo-500" />
                      <span>{b.asset_name}</span>
                    </div>
                  </td>
                  <td className="td font-semibold text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-slate-300" />
                      <span>{b.booked_by_name}</span>
                    </div>
                  </td>
                  <td className="td text-slate-500 font-semibold">
                    <div className="flex items-center gap-1 text-xs">
                      <Clock className="h-3.5 w-3.5 text-slate-300" />
                      {new Date(b.start_time).toLocaleString()}
                    </div>
                  </td>
                  <td className="td text-slate-500 font-semibold">
                    <div className="flex items-center gap-1 text-xs">
                      <Clock className="h-3.5 w-3.5 text-slate-300" />
                      {new Date(b.end_time).toLocaleString()}
                    </div>
                  </td>
                  <td className="td">
                    <span className={`badge border capitalize ${statusColor[b.live_status]}`}>
                      {b.live_status}
                    </span>
                  </td>
                  <td className="td text-right">
                    {b.live_status === 'upcoming' && (
                      <button className="btn-secondary text-xs !py-1.5 px-3 hover:text-rose-600 hover:bg-rose-50" onClick={() => cancel(b.id)}>
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {bookings.length === 0 && (
          <p className="p-6 text-sm text-slate-400 text-center font-medium">No resource bookings yet.</p>
        )}
      </div>
    </div>
  );
}

