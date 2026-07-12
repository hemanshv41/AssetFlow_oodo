// Reports & Analytics — recharts + booking heatmap
import { useEffect, useState, useMemo } from 'react';
import { api } from '../api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  BarChart3,
  PieChart as PieIcon,
  Activity,
  Calendar,
  Grid,
  Clock,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

const STATUS_COLORS = {
  available: '#10b981', // emerald
  allocated: '#6366f1', // indigo
  reserved: '#06b6d4', // cyan
  under_maintenance: '#f59e0b', // amber
  lost: '#f43f5e', // rose
  retired: '#64748b', // slate
  disposed: '#cbd5e1', // light gray
};

const PIE_PALETTE = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#10b981', '#06b6d4', '#f59e0b', '#ef4444'];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl px-4 py-2.5 shadow-2xl text-xs font-semibold">
      <p className="text-slate-400 capitalize mb-1">{String(label).replace(/_/g, ' ')}</p>
      <p className="text-sm font-bold text-white flex items-center gap-1.5">
        <TrendingUp className="h-4 w-4 text-indigo-400" />
        {payload[0].value} Assets
      </p>
    </div>
  );
};

const CustomHorizontalTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl px-4 py-2.5 shadow-2xl text-xs font-semibold">
      <p className="text-slate-200 font-bold mb-1">{data.name}</p>
      <p className="text-slate-400 font-mono mb-1">{data.label}</p>
      <p className="text-sm font-bold text-indigo-400 flex items-center gap-1.5 mt-1 border-t border-slate-800 pt-1">
        Count: {payload[0].value}
      </p>
    </div>
  );
};

function BookingHeatmap({ heatmapData }) {
  const { grid, maxCount } = useMemo(() => {
    const g = Array.from({ length: 7 }, () => Array(24).fill(0));
    let mx = 0;
    (heatmapData || []).forEach(({ day, hour, count }) => {
      g[day][hour] = count;
      if (count > mx) mx = count;
    });
    return { grid: g, maxCount: mx };
  }, [heatmapData]);

  const cellColor = (count) => {
    if (count === 0) return 'bg-slate-50 border-slate-100/50';
    const ratio = count / Math.max(maxCount, 1);
    if (ratio < 0.25) return 'bg-indigo-50 border-indigo-100/60 text-indigo-700';
    if (ratio < 0.5)  return 'bg-indigo-100 border-indigo-200/60 text-indigo-800';
    if (ratio < 0.75) return 'bg-indigo-200 border-indigo-300/60 text-indigo-900';
    return 'bg-indigo-600 border-indigo-700 text-white shadow-sm';
  };

  const labelHours = [0, 3, 6, 9, 12, 15, 18, 21];

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px] p-2">
        {/* Hour labels */}
        <div className="flex ml-12 mb-2">
          {HOURS.map((h) => (
            <div key={h} className="flex-1 text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {labelHours.includes(h) ? `${h}:00` : ''}
            </div>
          ))}
        </div>
        {/* Grid rows */}
        {DAYS.map((dayName, dayIdx) => (
          <div key={dayIdx} className="flex items-center mb-[3px]">
            <span className="w-12 text-xs text-slate-500 font-bold pr-3 text-right">{dayName}</span>
            {HOURS.map((hour) => {
              const count = grid[dayIdx][hour];
              return (
                <div
                  key={hour}
                  className={`flex-1 mx-[1.5px] h-7 rounded-lg border flex items-center justify-center cursor-default transition-all duration-200 hover:ring-2 hover:ring-indigo-400/50 hover:scale-105 ${cellColor(count)}`}
                  title={`${dayName} ${hour}:00 — ${count} booking${count !== 1 ? 's' : ''}`}
                >
                  <span className="text-[10px] font-bold">{count > 0 ? count : ''}</span>
                </div>
              );
            })}
          </div>
        ))}
        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-4 ml-12">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-2">Intensity:</span>
          <span className="text-[10px] text-slate-400 font-semibold">Less</span>
          {['bg-slate-50 border-slate-100', 'bg-indigo-50 border-indigo-100', 'bg-indigo-100 border-indigo-200', 'bg-indigo-200 border-indigo-300', 'bg-indigo-600 border-indigo-700'].map((c, i) => (
            <div key={i} className={`w-4.5 h-4.5 rounded-md border ${c}`} />
          ))}
          <span className="text-[10px] text-slate-400 font-semibold ml-0.5">More</span>
        </div>
      </div>
    </div>
  );
}

export default function Reports() {
  const [data, setData] = useState(null);
  useEffect(() => { api('/reports').then(setData); }, []);
  if (!data) return <div className="text-slate-500 animate-pulse p-10 font-semibold text-center">Loading Analytics dashboard...</div>;

  const statusData = data.assets_by_status.map((r) => ({
    ...r,
    label: r.status.replace(/_/g, ' '),
    fill: STATUS_COLORS[r.status] || '#94a3b8',
  }));

  const deptData = data.department_allocation.map((r, i) => ({
    ...r,
    fill: PIE_PALETTE[i % PIE_PALETTE.length],
  }));

  const maintData = data.maintenance_frequency.map((r) => ({
    label: `${r.asset_tag}`,
    name: r.name,
    requests: r.requests,
  }));

  const usedData = data.most_used_assets.map((r) => ({
    label: `${r.asset_tag}`,
    name: r.name,
    allocations: r.allocation_count,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Reports &amp; Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Visualize hardware deployment, maintenance velocity, and utilization heatmaps.</p>
      </div>

      {/* Row 1: Assets by Status (bar) + Department Allocation (pie) */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-3">
            <BarChart3 className="h-4.5 w-4.5 text-slate-400" />
            <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Assets by Status</h2>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={statusData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} className="capitalize" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.04)', radius: 6 }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={45} animationDuration={800}>
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-3">
            <PieIcon className="h-4.5 w-4.5 text-slate-400" />
            <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Active Allocation by Department</h2>
          </div>
          {deptData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[260px] text-slate-400 text-sm font-semibold">
              <AlertCircle className="h-8 w-8 text-slate-300 mb-2" />
              <span>No active allocations.</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={deptData}
                  dataKey="count"
                  nameKey="department"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={55}
                  paddingAngle={3}
                  animationDuration={850}
                  label={({ department, percent }) =>
                    `${department} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                >
                  {deptData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} assets`, name]}
                  contentStyle={{
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '600',
                    border: '1px solid #f1f5f9',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row 2: Maintenance Frequency + Most-Used Assets (horizontal bars) */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-3">
            <Activity className="h-4.5 w-4.5 text-slate-400" />
            <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Maintenance Frequency (top assets)</h2>
          </div>
          {maintData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-slate-400 text-sm font-semibold">
              <AlertCircle className="h-8 w-8 text-slate-300 mb-2" />
              <span>No maintenance requests raised yet.</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(200, maintData.length * 36)}>
              <BarChart data={maintData} layout="vertical" margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} tickLine={false} axisLine={false} />
                <YAxis dataKey="label" type="category" width={80} tick={{ fontSize: 10, fill: '#64748b', fontStyle: 'normal', fontFamily: 'monospace', fontWeight: 700 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomHorizontalTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.02)', radius: 4 }} />
                <Bar dataKey="requests" fill="#f59e0b" radius={[0, 6, 6, 0]} barSize={16} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-3">
            <TrendingUp className="h-4.5 w-4.5 text-slate-400" />
            <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Most-Used Assets (by allocations)</h2>
          </div>
          {usedData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-slate-400 text-sm font-semibold">
              <AlertCircle className="h-8 w-8 text-slate-300 mb-2" />
              <span>No allocations generated yet.</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(200, usedData.length * 36)}>
              <BarChart data={usedData} layout="vertical" margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} tickLine={false} axisLine={false} />
                <YAxis dataKey="label" type="category" width={80} tick={{ fontSize: 10, fill: '#64748b', fontStyle: 'normal', fontFamily: 'monospace', fontWeight: 700 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomHorizontalTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.02)', radius: 4 }} />
                <Bar dataKey="allocations" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={16} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row 3: Booking Heatmap */}
      <div className="card">
        <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-3">
          <div className="flex items-center gap-2">
            <Grid className="h-4.5 w-4.5 text-slate-400" />
            <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Booking Heatmap</h2>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider hidden sm:block">Booking density by weekday and hour</p>
        </div>
        <BookingHeatmap heatmapData={data.booking_heatmap} />
      </div>
    </div>
  );
}

