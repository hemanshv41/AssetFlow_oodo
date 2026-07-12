// OWNER: P4 — unread badge in sidebar, toast on new notifications (poll every 30s)
import { useEffect, useState } from 'react';
import { api } from '../api';
import {
  Bell,
  History,
  CheckCheck,
  AlertCircle,
  Calendar,
  User,
  Wrench,
  ChevronRight,
  TrendingUp,
  Tag
} from 'lucide-react';

const NOTIFICATION_ICONS = {
  asset_assigned: User,
  maintenance_approved: Wrench,
  booking_confirmed: Calendar,
  transfer_approved: TrendingUp,
  overdue_return: AlertCircle,
  default: Bell
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [activity, setActivity] = useState([]);
  const [tab, setTab] = useState('notifications');

  const load = () => {
    api('/notifications').then(setNotifications);
    api('/activity').then(setActivity);
  };
  useEffect(load, []);

  const markAll = async () => {
    await api('/notifications/read-all', { method: 'POST' });
    load();
  };

  return (
    <div className="space-y-6 max-w-3xl animate-fade-in">
      {/* Title */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Activity &amp; Alerts</h1>
          <p className="text-sm text-slate-500 mt-1">Review system alerts, task assignments, and audit logs.</p>
        </div>
        {tab === 'notifications' && notifications.some(n => !n.read) && (
          <button className="btn-secondary text-xs shrink-0" onClick={markAll}>
            <CheckCheck className="h-4 w-4 text-indigo-500" /> Mark all read
          </button>
        )}
      </div>

      {/* Tab selectors */}
      <div className="flex border border-slate-200 rounded-xl p-1 bg-slate-50 w-fit">
        <button
          onClick={() => setTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            tab === 'notifications' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Bell className="h-4 w-4" /> Notifications
          {notifications.filter(n => !n.read).length > 0 && (
            <span className="bg-rose-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
              {notifications.filter(n => !n.read).length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('activity')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            tab === 'activity' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <History className="h-4 w-4" /> Activity Log
        </button>
      </div>

      {/* Notifications tab */}
      {tab === 'notifications' && (
        <div className="card p-0 divide-y divide-slate-100 overflow-hidden">
          {notifications.length === 0 ? (
            <p className="p-8 text-sm text-slate-400 text-center font-medium">No alerts or notifications yet.</p>
          ) : (
            notifications.map((n) => {
              const Icon = NOTIFICATION_ICONS[n.type] || NOTIFICATION_ICONS.default;
              const isUnread = !n.read;
              return (
                <div
                  key={n.id}
                  className={`p-4 flex items-start gap-4 transition-colors ${
                    isUnread ? 'bg-indigo-50/15' : 'hover:bg-slate-50/30'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${
                    isUnread
                      ? 'bg-indigo-50 border-indigo-100 text-indigo-600 ring-2 ring-indigo-50/50'
                      : 'bg-slate-50 border-slate-100 text-slate-400'
                  }`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className={`text-sm text-slate-800 leading-snug ${isUnread ? 'font-bold' : 'font-medium'}`}>
                      {n.message}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-2">
                      <span className="text-indigo-500">{n.type.replace(/_/g, ' ')}</span>
                      <span>·</span>
                      <span>{new Date(n.created_at).toLocaleString()}</span>
                    </div>
                  </div>

                  {isUnread && (
                    <span className="h-2.5 w-2.5 rounded-full bg-indigo-600 ring-4 ring-indigo-50 shrink-0 mt-2.5" />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Activity log tab */}
      {tab === 'activity' && (
        <div className="card p-0 divide-y divide-slate-100 overflow-hidden">
          {activity.length === 0 ? (
            <p className="p-8 text-sm text-slate-400 text-center font-medium">No activity logged.</p>
          ) : (
            activity.map((l) => (
              <div key={l.id} className="p-4 flex items-start sm:items-center justify-between gap-3 hover:bg-slate-50/30">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-slate-50 border flex items-center justify-center text-slate-400 font-bold text-xs shrink-0">
                    {l.user_name ? l.user_name.charAt(0).toUpperCase() : 'S'}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800">{l.user_name || 'System'}</span>
                    <span className="text-xs text-slate-500 font-semibold ml-1 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/50">
                      {l.action}
                    </span>
                    {l.details && (
                      <span className="text-xs font-semibold text-slate-400 block sm:inline sm:ml-2">
                        — {l.details}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-bold shrink-0 self-start sm:self-center">
                  {new Date(l.created_at).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

