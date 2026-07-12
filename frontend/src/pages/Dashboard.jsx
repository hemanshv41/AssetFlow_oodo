import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import {
  CheckCircle,
  UserCheck,
  Wrench,
  Calendar,
  ArrowLeftRight,
  Clock,
  Plus,
  AlertTriangle,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

const KPIS_CONFIG = {
  assets_available: { label: 'Available Assets', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: CheckCircle },
  assets_allocated: { label: 'Assigned Assets', color: 'text-indigo-600 bg-indigo-50 border-indigo-100', icon: UserCheck },
  maintenance_active: { label: 'In Maintenance', color: 'text-amber-600 bg-amber-50 border-amber-100', icon: Wrench },
  active_bookings: { label: 'Active Bookings', color: 'text-sky-600 bg-sky-50 border-sky-100', icon: Calendar },
  pending_transfers: { label: 'Pending Transfers', color: 'text-purple-600 bg-purple-50 border-purple-100', icon: ArrowLeftRight },
  upcoming_returns: { label: 'Upcoming Returns', color: 'text-slate-600 bg-slate-50 border-slate-100', icon: Clock },
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/dashboard').then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-4 font-semibold">{error}</div>;
  if (!data) return <div className="text-slate-500 animate-pulse p-10 font-semibold text-center">Loading Dashboard data...</div>;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time status of your enterprise assets and resources.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/assets" className="btn">
            <Plus className="h-4 w-4" /> Register Asset
          </Link>
          <Link to="/bookings" className="btn-secondary">
            <Calendar className="h-4 w-4" /> Book Resource
          </Link>
          <Link to="/maintenance" className="btn-secondary">
            <Wrench className="h-4 w-4" /> Raise Maintenance
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-5">
        {Object.entries(KPIS_CONFIG).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <div key={key} className="card p-5 relative overflow-hidden group hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-xl border ${config.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-0.5">
                  Live <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-ping" />
                </span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {data.kpis[key] ?? 0}
              </div>
              <div className="text-xs font-semibold text-slate-400 mt-1 truncate">
                {config.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Returns Alerts and Feeds */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Overdue Returns */}
        <div className="card border-rose-100 bg-rose-50/20">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
              <AlertTriangle className="h-5 w-5 animate-bounce" />
            </div>
            <h2 className="font-bold text-slate-900 text-lg">
              Overdue Returns <span className="text-rose-600">({data.kpis.overdue_returns})</span>
            </h2>
          </div>

          <div className="space-y-3">
            {data.overdue_returns.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6 font-semibold">
                No overdue returns. Good job! 🎉
              </p>
            ) : (
              data.overdue_returns.map((r) => (
                <div key={r.id} className="flex justify-between items-center text-sm py-3 px-4 rounded-xl bg-white border border-rose-100/50 shadow-sm shadow-rose-100/10">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800 truncate">{r.asset_name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Tag: <span className="font-mono text-indigo-600 font-semibold">{r.asset_tag}</span> · {r.employee_name}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(r.expected_return_date).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Returns */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600">
              <Clock className="h-5 w-5" />
            </div>
            <h2 className="font-bold text-slate-900 text-lg">Upcoming Returns</h2>
          </div>

          <div className="space-y-3">
            {data.upcoming_returns.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6 font-semibold">
                No returns expected in next 7 days.
              </p>
            ) : (
              data.upcoming_returns.map((r) => (
                <div key={r.id} className="flex justify-between items-center text-sm py-3 px-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800 truncate">{r.asset_name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Tag: <span className="font-mono text-slate-600">{r.asset_tag}</span> · {r.employee_name}
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                    {new Date(r.expected_return_date).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

