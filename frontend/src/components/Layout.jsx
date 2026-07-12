import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { api } from '../api';
import {
  LayoutDashboard,
  Laptop,
  RefreshCw,
  Calendar,
  Wrench,
  CheckSquare,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  User,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/assets', label: 'Assets', icon: Laptop },
  { to: '/allocations', label: 'Allocations', icon: RefreshCw },
  { to: '/bookings', label: 'Bookings', icon: Calendar },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench },
  { to: '/audits', label: 'Audits', icon: CheckSquare },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/notifications', label: 'Notifications', icon: Bell, badgeKey: 'unreadNotifications' },
  { to: '/org', label: 'Org Setup', icon: Settings, adminOnly: true },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Fetch unread notifications count
  const fetchUnreadCount = () => {
    api('/notifications')
      .then((data) => {
        const unread = data.filter((n) => !n.read).length;
        setUnreadCount(unread);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchUnreadCount();
    // Poll for notifications every 30s
    const timer = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(timer);
  }, [location.pathname]);

  // Generate simple breadcrumbs from location
  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    if (paths.length === 0) return ['Dashboard'];
    return ['Home', ...paths.map(p => p.charAt(0).toUpperCase() + p.slice(1))];
  };

  const activeLinkClass = "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/10 transition-all duration-200";
  const inactiveLinkClass = "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all duration-200";

  return (
    <div className="min-h-screen flex bg-slate-50/50 text-slate-800">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-slate-950 text-slate-100 flex-col border-r border-slate-900 shadow-xl z-20">
        <div className="px-6 py-6 flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Laptop className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
            Asset<span className="text-indigo-400 font-medium">Flow</span>
          </span>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto py-2">
          {navItems
            .filter((n) => !n.adminOnly || user.role === 'admin')
            .map((n) => {
              const Icon = n.icon;
              return (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.to === '/'}
                  className={({ isActive }) => (isActive ? activeLinkClass : inactiveLinkClass)}
                >
                  <Icon className="h-4.5 w-4.5" />
                  <span className="flex-1">{n.label}</span>
                  {n.badgeKey === 'unreadNotifications' && unreadCount > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </NavLink>
              );
            })}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-slate-900 bg-slate-950/40">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/50 border border-slate-900">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold shadow-md">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-200 truncate">{user.name}</div>
              <div className="text-xs text-slate-500 capitalize truncate">{user.role.replace('_', ' ')}</div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 bg-slate-950/60 z-30 lg:hidden backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed top-0 bottom-0 left-0 w-64 bg-slate-950 text-slate-100 flex flex-col z-40 transition-transform duration-300 lg:hidden ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-6 py-6 flex items-center justify-between border-b border-slate-900">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg">
              <Laptop className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight">
              Asset<span className="text-indigo-400 font-medium">Flow</span>
            </span>
          </div>
          <button onClick={() => setMobileSidebarOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto py-4">
          {navItems
            .filter((n) => !n.adminOnly || user.role === 'admin')
            .map((n) => {
              const Icon = n.icon;
              return (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.to === '/'}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={({ isActive }) => (isActive ? activeLinkClass : inactiveLinkClass)}
                >
                  <Icon className="h-4.5 w-4.5" />
                  <span className="flex-1">{n.label}</span>
                  {n.badgeKey === 'unreadNotifications' && unreadCount > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </NavLink>
              );
            })}
        </nav>

        <div className="p-4 border-t border-slate-900">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/50">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-200 truncate">{user.name}</div>
              <div className="text-xs text-slate-400 capitalize truncate">{user.role.replace('_', ' ')}</div>
            </div>
            <button onClick={logout} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 shrink-0 bg-white border-b border-slate-100 flex items-center justify-between px-6 shadow-sm shadow-slate-100/40 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumbs */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-400 tracking-wide uppercase">
              {getBreadcrumbs().map((b, i, arr) => (
                <div key={b} className="flex items-center gap-1.5">
                  <span className={i === arr.length - 1 ? "text-slate-600 font-bold" : ""}>{b}</span>
                  {i < arr.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-slate-300" />}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick access notification button */}
            <NavLink
              to="/notifications"
              className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all border border-slate-100/80 shadow-sm"
            >
              <Bell className="h-4.5 w-4.5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
              )}
            </NavLink>

            {/* User profile dropdown activator */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5">
              <div className="h-6 w-6 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-bold text-slate-600 hidden md:inline">{user.name}</span>
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 p-6 overflow-y-auto animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

