import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import { alertService } from '../../services/alertService';
import { ThemeToggle, LanguageSwitcher, Avatar } from '../ui';
import { useSocket } from '../../hooks/useSocket';
import {
  LayoutDashboard, ShoppingCart, Grid3X3, ChefHat,
  BookOpen, ClipboardList, CalendarDays, Users, Settings,
  LogOut, PanelLeftClose, PanelLeftOpen, Bell, Search,
  Utensils, Lock, ShieldCheck, Store, ShieldAlert, Palette, Crown,
  TrendingUp, Bot, QrCode, Package, DollarSign, UserCircle,
  AlertTriangle, X, CheckCheck, Info, Zap,
} from 'lucide-react';

const NAV_GROUPS = [
  {
    label: 'Live Operations',
    items: [
      { to: '/admin',              icon: LayoutDashboard, label: 'Dashboard',   end: true },
      { to: '/admin/pos',          icon: ShoppingCart,    label: 'POS' },
      { to: '/admin/orders',       icon: ClipboardList,   label: 'Orders' },
      { to: '/admin/kitchen',      icon: ChefHat,         label: 'Kitchen' },
      { to: '/admin/tables',       icon: Grid3X3,         label: 'Tables' },
      { to: '/admin/reservations', icon: CalendarDays,    label: 'Reservations' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { to: '/admin/analytics', icon: TrendingUp, label: 'Analytics' },
      { to: '/admin/revenue',   icon: DollarSign, label: 'Revenue Engine' },
      { to: '/admin/copilot',   icon: Bot,        label: 'Copilot' },
    ],
  },
  {
    label: 'Guests & Staff',
    items: [
      { to: '/admin/crm',   icon: UserCircle, label: 'Guest CRM' },
      { to: '/admin/staff', icon: Users,      label: 'Staff' },
    ],
  },
  {
    label: 'Restaurant',
    items: [
      { to: '/admin/menu',      icon: BookOpen, label: 'Menu' },
      { to: '/admin/inventory', icon: Package,  label: 'Inventory' },
      { to: '/admin/themes',    icon: Palette,  label: 'Themes' },
      { to: '/admin/vip-setup', icon: Crown,    label: 'VIP Setup' },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/admin/qr-manager', icon: QrCode,   label: 'QR Manager' },
      { to: '/admin/alerts',     icon: Bell,     label: 'Alerts' },
      { to: '/admin/settings',   icon: Settings, label: 'Settings' },
    ],
  },
];

const VERIFICATION_NAV = [
  { to: '/admin/kyc',   icon: ShieldCheck, label: 'KYC Verification' },
  { to: '/admin/setup', icon: Store,       label: 'Restaurant Setup' },
];

const LOCKED_ROUTES = ['/admin/kyc', '/admin/setup'];

const SEVERITY_CFG = {
  info:     { icon: Info,          color: 'text-blue-500 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-500/10'   },
  warning:  { icon: AlertTriangle, color: 'text-amber-500 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-500/10'  },
  critical: { icon: Zap,           color: 'text-red-500 dark:text-red-400',      bg: 'bg-red-50 dark:bg-red-500/10'     },
};

function NavItem({ item, collapsed, onClose }) {
  const { to, icon: Icon, label, end } = item;
  const { pathname } = useLocation();
  const isActive = end ? pathname === to : pathname.startsWith(to);

  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClose}
      title={collapsed ? label : undefined}
      className={[
        'relative flex items-center text-sm font-medium rounded-xl transition-all duration-150 select-none',
        collapsed ? 'justify-center p-2.5 w-10 h-10 mx-auto' : 'gap-3 px-3 py-2.5',
        isActive
          ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-white/6',
      ].join(' ')}
    >
      <Icon size={16} className="shrink-0" />
      {!collapsed && <span className="flex-1 truncate">{label}</span>}
    </NavLink>
  );
}

function LockedNavItem({ item, collapsed }) {
  const { icon: Icon, label } = item;
  return (
    <div
      title={collapsed ? label : 'Complete KYC to unlock'}
      className={[
        'flex items-center text-sm font-medium rounded-xl opacity-30 cursor-not-allowed select-none',
        collapsed ? 'justify-center p-2.5 w-10 h-10 mx-auto' : 'gap-3 px-3 py-2.5',
        'text-gray-400 dark:text-gray-500',
      ].join(' ')}
    >
      <Icon size={16} className="shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{label}</span>
          <Lock size={11} />
        </>
      )}
    </div>
  );
}

function AlertsDropdown({ onClose }) {
  const qc = useQueryClient();
  const { data: alertsData } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertService.list({ limit: 10 }).then(r => r.data),
  });
  const alerts = alertsData?.alerts || alertsData || [];

  const markAllRead = async () => {
    try { await alertService.markAllRead(); qc.invalidateQueries(['alerts']); qc.invalidateQueries(['alert-count']); } catch {}
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-2xl ui-shadow-lg z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/8">
        <p className="text-xs font-bold text-gray-900 dark:text-white">Alerts</p>
        <div className="flex items-center gap-2">
          {alerts.some(a => !a.isRead) && (
            <button onClick={markAllRead} className="text-[10px] text-orange-500 hover:text-orange-600 dark:text-orange-400 flex items-center gap-1">
              <CheckCheck size={11} /> Mark all read
            </button>
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-white/30 dark:hover:text-white/60 transition-colors">
            <X size={13} />
          </button>
        </div>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-300 dark:text-white/20">
            <Bell size={20} className="mb-2" />
            <p className="text-xs">No alerts</p>
          </div>
        ) : (
          alerts.map(alert => {
            const cfg = SEVERITY_CFG[alert.severity] || SEVERITY_CFG.info;
            const Icon = cfg.icon;
            return (
              <div key={alert._id} className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/3 transition-colors ${!alert.isRead ? 'bg-orange-50/40 dark:bg-white/2' : ''}`}>
                <div className={`w-7 h-7 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                  <Icon size={12} className={cfg.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-gray-900 dark:text-white">{alert.title}</p>
                  <p className="text-[10px] text-gray-500 dark:text-white/40 mt-0.5 leading-relaxed">{alert.message}</p>
                  <p className="text-[9px] text-gray-400 dark:text-white/20 mt-1">{new Date(alert.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                {!alert.isRead && <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0 mt-2" />}
              </div>
            );
          })
        )}
      </div>
      <div className="px-4 py-2.5 border-t border-gray-100 dark:border-white/8">
        <NavLink to="/admin/alerts" onClick={onClose} className="text-[11px] text-orange-500 dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-300 transition-colors">
          View all alerts →
        </NavLink>
      </div>
    </motion.div>
  );
}

function Sidebar({ collapsed, setCollapsed, mobileMode = false, onClose, user, onLogout, isVerified, verificationStatus }) {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111111]">
      {/* Logo */}
      <div className={[
        'h-14 flex items-center border-b border-gray-100 dark:border-white/8 shrink-0',
        collapsed ? 'px-3 justify-center' : 'px-4 justify-between',
      ].join(' ')}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-md shadow-orange-500/40 shrink-0">
            <Utensils size={13} className="text-white" strokeWidth={2.5} />
          </div>
          {!collapsed && <span className="font-bold text-gray-900 dark:text-white tracking-tight text-[15px]">Restora</span>}
        </div>
        {!mobileMode && (
          <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/8 transition-colors">
            {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
          </button>
        )}
      </div>

      {/* Verification banner */}
      {!isVerified && !collapsed && (
        <div className="mx-3 mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert size={13} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
              {verificationStatus === 'under_review' ? 'Under Review' : 'Verification Required'}
            </span>
          </div>
          <p className="text-[9px] text-amber-600/70 dark:text-amber-400/60 leading-relaxed">
            {verificationStatus === 'under_review' ? "Your KYC is being reviewed." : 'Submit your KYC to unlock the full dashboard.'}
          </p>
        </div>
      )}
      {!isVerified && collapsed && (
        <div className="flex justify-center mt-3 shrink-0">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Verification required" />
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-4 scrollbar-none">
        {!isVerified && (
          <div>
            {!collapsed && (
              <p className="px-3 mb-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-amber-600/70 dark:text-amber-500/60 select-none">Verification</p>
            )}
            <div className="space-y-0.5">
              {VERIFICATION_NAV.map(item => <NavItem key={item.to} item={item} collapsed={collapsed} onClose={onClose} />)}
            </div>
            <div className="border-t border-gray-100 dark:border-white/8 mt-4 mx-1" />
          </div>
        )}

        {NAV_GROUPS.map((group, idx) => (
          <div key={group.label}>
            {!collapsed ? (
              <p className="px-3 mb-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-600 select-none">{group.label}</p>
            ) : idx > 0 ? (
              <div className="border-t border-gray-100 dark:border-white/8 mb-3 mx-1" />
            ) : null}
            <div className="space-y-0.5">
              {group.items.map(item =>
                isVerified
                  ? <NavItem key={item.to} item={item} collapsed={collapsed} onClose={onClose} />
                  : <LockedNavItem key={item.to} item={item} collapsed={collapsed} />
              )}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="shrink-0 p-3 border-t border-gray-100 dark:border-white/8">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <Avatar name={user?.name} size="sm" />
            <button onClick={onLogout} title="Logout" className="p-2 w-full flex justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group cursor-default">
            <Avatar name={user?.name} size="sm" className="shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 dark:text-white truncate leading-tight">{user?.name ?? 'Restaurant Owner'}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isVerified ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <p className="text-[10px] text-gray-400 dark:text-gray-500 capitalize">
                  {isVerified ? (user?.role ?? 'owner') : 'Pending verification'}
                </p>
              </div>
            </div>
            <button onClick={onLogout} title="Logout" className="p-1.5 rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all">
              <LogOut size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [collapsed, setCollapsed]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const alertsRef                   = useRef(null);
  const { user, logout }            = useAuthStore();
  const navigate                    = useNavigate();
  const location                    = useLocation();
  const qc                          = useQueryClient();

  const verificationStatus = user?.verificationStatus ?? 'pending';
  const isOwner    = user?.role === 'owner';
  const isVerified = !isOwner || verificationStatus === 'approved';

  useSocket(user?.restaurant, {
    'alert:new':           () => { qc.invalidateQueries(['alerts']); qc.invalidateQueries(['alert-count']); },
    'order:new':           () => { qc.invalidateQueries(['kitchen-orders']); qc.invalidateQueries(['orders']); qc.invalidateQueries(['dashboard-stats']); },
    'order:status_changed':() => { qc.invalidateQueries(['kitchen-orders']); qc.invalidateQueries(['orders']); },
    'table:status_changed':() =>   qc.invalidateQueries(['owner-tables']),
    'reservation:new':     () => {
      qc.invalidateQueries(['reservations']);
      qc.invalidateQueries(['alerts']);
      qc.invalidateQueries(['alert-count']);
    },
    'reservation:updated': () => { qc.invalidateQueries(['reservations']); },
  });

  const { data: alertCount = 0 } = useQuery({
    queryKey: ['alert-count'],
    queryFn: () => alertService.unreadCount().then(r => r.data?.count ?? 0),
    refetchInterval: 60_000,
    enabled: isVerified,
  });

  useEffect(() => {
    if (!isVerified) {
      const onAllowed = LOCKED_ROUTES.some(p => location.pathname.startsWith(p));
      if (!onAllowed) navigate('/admin/kyc', { replace: true });
    }
  }, [isVerified, location.pathname, navigate]);

  useEffect(() => {
    const handler = (e) => { if (alertsRef.current && !alertsRef.current.contains(e.target)) setShowAlerts(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    try { await authService.logout(); } catch {}
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0a0a0a] overflow-hidden">

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Desktop Sidebar */}
      <aside className={[
        'hidden lg:block shrink-0 border-r border-gray-100 dark:border-white/5',
        'transition-all duration-300 ease-in-out overflow-hidden',
        collapsed ? 'w-[68px]' : 'w-[240px]',
      ].join(' ')}>
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} user={user} onLogout={handleLogout} isVerified={isVerified} verificationStatus={verificationStatus} />
      </aside>

      {/* Mobile Drawer */}
      <aside className={[
        'fixed inset-y-0 start-0 z-50 lg:hidden',
        'w-[240px] border-r border-gray-100 dark:border-white/5',
        'transition-transform duration-300 ease-in-out',
        mobileOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full',
      ].join(' ')}>
        <Sidebar collapsed={false} setCollapsed={() => {}} mobileMode onClose={() => setMobileOpen(false)} user={user} onLogout={handleLogout} isVerified={isVerified} verificationStatus={verificationStatus} />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Topbar */}
        <header className="h-14 bg-white dark:bg-[#141414] border-b border-gray-100 dark:border-white/5 flex items-center gap-3 px-4 sm:px-5 shrink-0">
          <button className="lg:hidden p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/8 transition-colors" onClick={() => setMobileOpen(true)}>
            <PanelLeftOpen size={18} />
          </button>

          <div className={[
            'hidden sm:flex items-center gap-2 border rounded-lg px-3 h-8 w-60 transition-colors',
            isVerified
              ? 'bg-gray-50 dark:bg-white/4 border-gray-200 dark:border-white/8 cursor-pointer hover:border-orange-400 dark:hover:border-orange-500/30'
              : 'bg-gray-50 dark:bg-white/2 border-gray-100 dark:border-white/5 cursor-not-allowed opacity-50',
          ].join(' ')}>
            <Search size={13} className="text-gray-400" />
            <span className="text-xs text-gray-400 flex-1 select-none">Search...</span>
            <kbd className="text-[10px] text-gray-300 dark:text-gray-600 border border-gray-200 dark:border-white/10 rounded px-1 py-0.5 font-sans">⌘K</kbd>
          </div>

          <div className="flex-1" />

          {!isVerified && (
            <div className={[
              'hidden sm:flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border',
              verificationStatus === 'under_review'
                ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'
                : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-200 dark:border-amber-500/20',
            ].join(' ')}>
              <span className={`w-1.5 h-1.5 rounded-full ${verificationStatus === 'under_review' ? 'bg-blue-500 animate-pulse' : 'bg-amber-500'}`} />
              {verificationStatus === 'under_review' ? 'Under Review' : 'Not Verified'}
            </div>
          )}

          <div className="relative" ref={alertsRef}>
            <button onClick={() => setShowAlerts(s => !s)}
              className="relative p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/8 transition-colors">
              <Bell size={17} />
              {alertCount > 0 && (
                <motion.span
                  key={alertCount}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {alertCount > 9 ? '9+' : alertCount}
                </motion.span>
              )}
            </button>
            <AnimatePresence>
              {showAlerts && <AlertsDropdown onClose={() => setShowAlerts(false)} />}
            </AnimatePresence>
          </div>

          <div className="h-5 w-px bg-gray-100 dark:bg-white/8" />
          <ThemeToggle />
          <LanguageSwitcher />
        </header>

        <main className="flex-1 overflow-y-auto flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
