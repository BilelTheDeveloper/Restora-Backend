import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { ThemeToggle, LanguageSwitcher, Avatar } from '../ui';
import {
  LayoutDashboard, ShoppingCart, Grid3X3, ChefHat,
  BookOpen, ClipboardList, CalendarDays, Users, Settings,
  LogOut, PanelLeftClose, PanelLeftOpen, Bell, Search,
  Utensils, Lock, ShieldCheck, Store, ShieldAlert, Palette,
} from 'lucide-react';

// ── Navigation ─────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: 'Operations',
    items: [
      { to: '/admin',              icon: LayoutDashboard, label: 'Dashboard',    end: true },
      { to: '/admin/pos',          icon: ShoppingCart,    label: 'POS' },
      { to: '/admin/orders',       icon: ClipboardList,   label: 'Orders',       badge: 3 },
      { to: '/admin/kitchen',      icon: ChefHat,         label: 'Kitchen',      badge: 5 },
      { to: '/admin/tables',       icon: Grid3X3,         label: 'Tables' },
      { to: '/admin/reservations', icon: CalendarDays,    label: 'Reservations', badge: 2 },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/admin/menu',   icon: BookOpen, label: 'Menu' },
      { to: '/admin/staff',  icon: Users,    label: 'Staff' },
      { to: '/admin/themes', icon: Palette,  label: 'Themes' },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/admin/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

const VERIFICATION_NAV = [
  { to: '/admin/kyc',   icon: ShieldCheck, label: 'KYC Verification' },
  { to: '/admin/setup', icon: Store,        label: 'Restaurant Setup' },
];

const LOCKED_ROUTES = ['/admin/kyc', '/admin/setup'];

// ── NavItem (active) ───────────────────────────────────────
function NavItem({ item, collapsed, onClose }) {
  const { to, icon: Icon, label, end, badge } = item;
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
          : 'text-gray-400 hover:text-gray-100 hover:bg-white/6',
      ].join(' ')}
    >
      <Icon size={16} className="shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{label}</span>
          {badge != null && (
            <span className={[
              'text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full inline-flex items-center justify-center leading-none',
              isActive ? 'bg-white/25 text-white' : 'bg-orange-500/15 text-orange-400',
            ].join(' ')}>
              {badge}
            </span>
          )}
        </>
      )}
      {collapsed && badge != null && (
        <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-orange-500 rounded-full ring-2 ring-[#111111]" />
      )}
    </NavLink>
  );
}

// ── NavItem (locked) ───────────────────────────────────────
function LockedNavItem({ item, collapsed }) {
  const { icon: Icon, label } = item;
  return (
    <div
      title={collapsed ? label : 'Complete KYC to unlock'}
      className={[
        'flex items-center text-sm font-medium rounded-xl opacity-30 cursor-not-allowed select-none',
        collapsed ? 'justify-center p-2.5 w-10 h-10 mx-auto' : 'gap-3 px-3 py-2.5',
        'text-gray-400',
      ].join(' ')}
    >
      <Icon size={16} className="shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{label}</span>
          <Lock size={11} className="text-gray-600" />
        </>
      )}
    </div>
  );
}

// ── Sidebar ────────────────────────────────────────────────
function Sidebar({ collapsed, setCollapsed, mobileMode = false, onClose, user, onLogout, isVerified, verificationStatus }) {
  return (
    <div className="flex flex-col h-full">

      {/* Logo */}
      <div className={[
        'h-14 flex items-center border-b border-white/8 shrink-0',
        collapsed ? 'px-3 justify-center' : 'px-4 justify-between',
      ].join(' ')}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-md shadow-orange-500/40 shrink-0">
            <Utensils size={13} className="text-white" strokeWidth={2.5} />
          </div>
          {!collapsed && <span className="font-bold text-white tracking-tight text-[15px]">Restora</span>}
        </div>
        {!mobileMode && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-white/8 transition-colors"
          >
            {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
          </button>
        )}
      </div>

      {/* Verification status banner */}
      {!isVerified && !collapsed && (
        <div className="mx-3 mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert size={13} className="text-amber-400 shrink-0" />
            <span className="text-[11px] font-semibold text-amber-400">
              {verificationStatus === 'under_review' ? 'Under Review' : 'Verification Required'}
            </span>
          </div>
          <p className="text-[9px] text-amber-400/60 leading-relaxed">
            {verificationStatus === 'under_review'
              ? 'Your KYC is being reviewed. We\'ll notify you soon.'
              : 'Submit your KYC to unlock the full dashboard.'}
          </p>
        </div>
      )}
      {!isVerified && collapsed && (
        <div className="flex justify-center mt-3 shrink-0">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Verification required" />
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-4">

        {/* Verification links — always visible when not verified */}
        {!isVerified && (
          <div>
            {!collapsed && (
              <p className="px-3 mb-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-amber-500/60 select-none">
                Verification
              </p>
            )}
            <div className="space-y-0.5">
              {VERIFICATION_NAV.map(item => (
                <NavItem key={item.to} item={item} collapsed={collapsed} onClose={onClose} />
              ))}
            </div>
            <div className="border-t border-white/8 mt-4 mx-1" />
          </div>
        )}

        {/* Main nav — locked when not verified */}
        {NAV_GROUPS.map((group, idx) => (
          <div key={group.label}>
            {!collapsed ? (
              <p className="px-3 mb-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-600 select-none">
                {group.label}
              </p>
            ) : idx > 0 ? (
              <div className="border-t border-white/8 mb-3 mx-1" />
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
      <div className="shrink-0 p-3 border-t border-white/8">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <Avatar name={user?.name} size="sm" />
            <button
              onClick={onLogout}
              title="Logout"
              className="p-2 w-full flex justify-center rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors group cursor-default">
            <Avatar name={user?.name} size="sm" className="shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate leading-tight">
                {user?.name ?? 'Restaurant Owner'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isVerified ? 'bg-green-500' : 'bg-amber-500'}`} />
                <p className="text-[10px] text-gray-500 capitalize">
                  {isVerified ? (user?.role ?? 'owner') : 'Pending verification'}
                </p>
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Logout"
              className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
            >
              <LogOut size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── AdminLayout ────────────────────────────────────────────
export default function AdminLayout() {
  const [collapsed, setCollapsed]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout }            = useAuthStore();
  const navigate                    = useNavigate();
  const location                    = useLocation();

  const verificationStatus = user?.verificationStatus ?? 'pending';
  // Staff roles (cashier, waiter, etc.) don't go through KYC — treat them as verified
  const isOwner    = user?.role === 'owner';
  const isVerified = !isOwner || verificationStatus === 'approved';

  // Redirect unverified users away from locked routes
  useEffect(() => {
    if (!isVerified) {
      const onAllowed = LOCKED_ROUTES.some(p => location.pathname.startsWith(p));
      if (!onAllowed) navigate('/admin/kyc', { replace: true });
    }
  }, [isVerified, location.pathname, navigate]);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0a0a0a] overflow-hidden">

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside className={[
        'hidden lg:block bg-[#111111] shrink-0 border-r border-white/5',
        'transition-all duration-300 ease-in-out overflow-hidden',
        collapsed ? 'w-[68px]' : 'w-[240px]',
      ].join(' ')}>
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          user={user}
          onLogout={handleLogout}
          isVerified={isVerified}
          verificationStatus={verificationStatus}
        />
      </aside>

      {/* Mobile Drawer */}
      <aside className={[
        'fixed inset-y-0 start-0 z-50 lg:hidden',
        'w-[240px] bg-[#111111] border-r border-white/5',
        'transition-transform duration-300 ease-in-out',
        mobileOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full',
      ].join(' ')}>
        <Sidebar
          collapsed={false}
          setCollapsed={() => {}}
          mobileMode
          onClose={() => setMobileOpen(false)}
          user={user}
          onLogout={handleLogout}
          isVerified={isVerified}
          verificationStatus={verificationStatus}
        />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Topbar */}
        <header className="h-14 bg-white dark:bg-[#141414] border-b border-gray-100 dark:border-white/5 flex items-center gap-3 px-4 sm:px-5 shrink-0">
          <button
            className="lg:hidden p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/8 transition-colors"
            onClick={() => setMobileOpen(true)}
          >
            <PanelLeftOpen size={18} />
          </button>

          {/* Search (disabled when not verified) */}
          <div className={[
            'hidden sm:flex items-center gap-2 border rounded-lg px-3 h-8 w-60 transition-colors',
            isVerified
              ? 'bg-gray-50 dark:bg-white/4 border-gray-200 dark:border-white/8 cursor-pointer hover:border-orange-300 dark:hover:border-orange-500/30'
              : 'bg-gray-50 dark:bg-white/2 border-gray-100 dark:border-white/5 cursor-not-allowed opacity-50',
          ].join(' ')}>
            <Search size={13} className="text-gray-400" />
            <span className="text-xs text-gray-400 flex-1 select-none">Search...</span>
            <kbd className="text-[10px] text-gray-300 dark:text-gray-600 border border-gray-200 dark:border-white/10 rounded px-1 py-0.5 font-sans">⌘K</kbd>
          </div>

          <div className="flex-1" />

          {/* Verification badge in topbar */}
          {!isVerified && (
            <div className={[
              'hidden sm:flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border',
              verificationStatus === 'under_review'
                ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-500 border-blue-200 dark:border-blue-500/20'
                : 'bg-amber-50 dark:bg-amber-500/10 text-amber-500 border-amber-200 dark:border-amber-500/20',
            ].join(' ')}>
              <span className={`w-1.5 h-1.5 rounded-full ${verificationStatus === 'under_review' ? 'bg-blue-500 animate-pulse' : 'bg-amber-500'}`} />
              {verificationStatus === 'under_review' ? 'Under Review' : 'Not Verified'}
            </div>
          )}

          <button className="relative p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/8 transition-colors">
            <Bell size={17} />
            {!isVerified && (
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-amber-500 rounded-full" />
            )}
          </button>

          <div className="h-5 w-px bg-gray-200 dark:bg-white/8" />
          <ThemeToggle />
          <LanguageSwitcher />
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
