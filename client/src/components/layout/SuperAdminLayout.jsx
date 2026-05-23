import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { adminService } from '../../services/adminService';
import { Avatar, ThemeToggle } from '../ui';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, ShieldCheck, Store, LogOut,
  Utensils, PanelLeftOpen, PanelLeftClose, Bell,
  ShieldAlert, Wrench, AlertTriangle, X,
} from 'lucide-react';

const NAV = [
  { to: '/superadmin',             label: 'Dashboard',  icon: LayoutDashboard, end: true  },
  { to: '/superadmin/kyc-queue',   label: 'KYC Queue',  icon: ShieldCheck,     badge: true },
  { to: '/superadmin/restaurants', label: 'Restaurants', icon: Store },
  { to: '/superadmin/security',    label: 'Security',    icon: ShieldAlert },
];

function NavItem({ item, collapsed, pendingKYC }) {
  const { to, label, icon: Icon, end, badge } = item;
  return (
    <NavLink
      to={to}
      end={end}
      title={collapsed ? label : undefined}
      className={({ isActive }) => [
        'relative flex items-center text-sm font-medium rounded-xl transition-all duration-150 select-none',
        collapsed ? 'justify-center p-2.5 w-10 h-10 mx-auto' : 'gap-3 px-3 py-2.5',
        isActive
          ? 'bg-violet-600 text-white shadow-sm shadow-violet-600/30'
          : 'text-gray-400 hover:text-gray-100 hover:bg-white/6',
      ].join(' ')}
    >
      <Icon size={16} className="shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1">{label}</span>
          {badge && pendingKYC > 0 && (
            <span className="text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white inline-flex items-center justify-center">
              {pendingKYC}
            </span>
          )}
        </>
      )}
      {collapsed && badge && pendingKYC > 0 && (
        <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full ring-2 ring-[#111]" />
      )}
    </NavLink>
  );
}

// ── Maintenance toggle modal ───────────────────────────────
function MaintenanceModal({ current, onClose }) {
  const qc = useQueryClient();
  const [enabled,       setEnabled]       = useState(current?.enabled ?? false);
  const [message,       setMessage]       = useState(current?.message ?? '');
  const [scheduledUntil, setScheduledUntil] = useState(
    current?.scheduledUntil ? new Date(current.scheduledUntil).toISOString().slice(0, 16) : ''
  );

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => adminService.toggleMaintenance(data),
    onSuccess: () => {
      toast.success(`Maintenance mode ${enabled ? 'enabled' : 'disabled'}`);
      qc.invalidateQueries({ queryKey: ['app-status'] });
      qc.invalidateQueries({ queryKey: ['maintenance'] });
      onClose();
    },
    onError: () => toast.error('Failed to update maintenance mode'),
  });

  const submit = () => {
    mutate({
      enabled,
      message:         message.trim() || undefined,
      scheduledUntil:  scheduledUntil ? new Date(scheduledUntil).toISOString() : null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#0f0f0f] border border-white/10 rounded-3xl shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Wrench size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Maintenance Mode</h2>
              <p className="text-xs text-gray-400">Controls site-wide access</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/8 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/3 border border-white/8">
          <div>
            <p className="text-sm font-semibold text-white">Enable Maintenance</p>
            <p className="text-xs text-gray-400 mt-0.5">All visitors see the maintenance page</p>
          </div>
          <button
            type="button"
            onClick={() => setEnabled(v => !v)}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${enabled ? 'bg-amber-500' : 'bg-white/10'}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${enabled ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        {/* Warning */}
        {enabled && (
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20">
            <AlertTriangle size={15} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-400 leading-relaxed">
              <strong>Warning:</strong> Enabling maintenance blocks ALL users except you (superadmin). Restaurant owners and the public will see the maintenance page.
            </p>
          </div>
        )}

        {/* Message */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-2">Message shown to visitors</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="We're performing scheduled maintenance. We'll be back shortly!"
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500/50 resize-none transition-colors"
          />
        </div>

        {/* Scheduled until */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-2">
            Scheduled until <span className="font-normal text-gray-500">(optional)</span>
          </label>
          <input
            type="datetime-local"
            value={scheduledUntil}
            onChange={e => setScheduledUntil(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50 transition-colors [color-scheme:dark]"
          />
          <p className="text-[11px] text-gray-500 mt-1">Shows a live countdown on the maintenance page</p>
        </div>

        {/* Action */}
        <button
          onClick={submit}
          disabled={isPending}
          className={`w-full py-3 rounded-2xl text-sm font-bold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
            ${enabled
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-500/30'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-emerald-500/30'}`}
        >
          {isPending ? 'Saving…' : enabled ? 'Enable Maintenance Mode' : 'Disable Maintenance Mode'}
        </button>
      </div>
    </div>
  );
}

// ── SuperAdminLayout ───────────────────────────────────────
export default function SuperAdminLayout() {
  const [collapsed, setCollapsed]       = useState(false);
  const [showMaintModal, setMaintModal] = useState(false);
  const { user, logout }                = useAuthStore();
  const navigate                        = useNavigate();

  const { data: statsData } = useQuery({
    queryKey: ['platform-stats'],
    queryFn:  adminService.getStats,
    refetchInterval: 30_000,
  });
  const pendingKYC = statsData?.data?.pendingKYC ?? 0;

  const { data: maintData } = useQuery({
    queryKey: ['maintenance'],
    queryFn:  () => adminService.getMaintenance().then(r => r.data),
    refetchInterval: 30_000,
  });
  const isMaintenanceOn = maintData?.enabled ?? false;

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0a0a0a] overflow-hidden">

      {showMaintModal && (
        <MaintenanceModal current={maintData} onClose={() => setMaintModal(false)} />
      )}

      {/* Sidebar */}
      <aside className={[
        'hidden lg:flex flex-col bg-[#111111] shrink-0 border-r border-white/5',
        'transition-all duration-300 ease-in-out overflow-hidden',
        collapsed ? 'w-[68px]' : 'w-[220px]',
      ].join(' ')}>

        {/* Logo */}
        <div className={[
          'h-14 flex items-center border-b border-white/8 shrink-0',
          collapsed ? 'px-3 justify-center' : 'px-4 justify-between',
        ].join(' ')}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-md shrink-0">
              <Utensils size={13} className="text-white" strokeWidth={2.5} />
            </div>
            {!collapsed && (
              <div>
                <span className="font-bold text-white text-[14px] tracking-tight">Restora</span>
                <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-600/30 text-violet-400">ADMIN</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-white/8 transition-colors"
          >
            {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          {!collapsed && (
            <p className="px-3 mb-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-600 select-none">Platform</p>
          )}
          {NAV.map(item => (
            <NavItem key={item.to} item={item} collapsed={collapsed} pendingKYC={pendingKYC} />
          ))}

          {/* Maintenance button */}
          <div className={collapsed ? 'flex justify-center' : ''}>
            <button
              onClick={() => setMaintModal(true)}
              title={collapsed ? 'Maintenance' : undefined}
              className={[
                'flex items-center text-sm font-medium rounded-xl transition-all duration-150 select-none mt-1',
                collapsed ? 'justify-center p-2.5 w-10 h-10 mx-auto' : 'gap-3 px-3 py-2.5 w-full',
                isMaintenanceOn
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-white/6',
              ].join(' ')}
            >
              <Wrench size={16} className="shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">Maintenance</span>
                  {isMaintenanceOn && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-white">ON</span>
                  )}
                </>
              )}
              {collapsed && isMaintenanceOn && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-500 rounded-full ring-2 ring-[#111]" />
              )}
            </button>
          </div>
        </nav>

        {/* User */}
        <div className="shrink-0 p-3 border-t border-white/8">
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <Avatar name={user?.name} size="sm" />
              <button onClick={handleLogout} title="Logout"
                      className="p-2 w-full flex justify-center rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors group cursor-default">
              <Avatar name={user?.name} size="sm" className="shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user?.name ?? 'Admin'}</p>
                <p className="text-[10px] text-violet-400 font-semibold">Super Admin</p>
              </div>
              <button onClick={handleLogout} title="Logout"
                      className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all">
                <LogOut size={13} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Topbar */}
        <header className="h-14 bg-white dark:bg-[#141414] border-b border-gray-100 dark:border-white/5 flex items-center gap-3 px-5 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-violet-500" />
            <span className="text-xs font-bold text-violet-500 uppercase tracking-widest">Platform Admin</span>
          </div>
          <div className="flex-1" />

          {/* Maintenance indicator in topbar */}
          {isMaintenanceOn && (
            <button
              onClick={() => setMaintModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 rounded-full hover:bg-amber-100 dark:hover:bg-amber-500/15 transition-colors"
            >
              <Wrench size={12} className="text-amber-500" />
              <span className="text-[11px] font-bold text-amber-500">Maintenance ON</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            </button>
          )}

          {pendingKYC > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[11px] font-bold text-red-500">{pendingKYC} KYC pending</span>
            </div>
          )}

          <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/8 transition-colors">
            <Bell size={17} />
          </button>
          <div className="h-5 w-px bg-gray-200 dark:bg-white/8" />
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
