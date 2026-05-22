import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { ThemeToggle, LanguageSwitcher, Avatar } from '../ui';
import {
  LayoutDashboard, ShoppingCart, Grid3X3, ChefHat,
  BookOpen, ClipboardList, CalendarDays, Users, Settings,
  LogOut, PanelLeftClose, PanelLeftOpen, Bell, Search, Utensils,
} from 'lucide-react';

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
      { to: '/admin/menu',  icon: BookOpen, label: 'Menu' },
      { to: '/admin/staff', icon: Users,    label: 'Staff' },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/admin/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

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

function Sidebar({ collapsed, setCollapsed, mobileMode = false, onClose, user, onLogout }) {
  return (
    <div className="flex flex-col h-full">

      {/* ── Logo ──────────────────────────────────────── */}
      <div className={[
        'h-14 flex items-center border-b border-white/8 shrink-0',
        collapsed ? 'px-3 justify-center' : 'px-4 justify-between',
      ].join(' ')}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-md shadow-orange-500/40 shrink-0">
            <Utensils size={13} className="text-white" strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <span className="font-bold text-white tracking-tight text-[15px]">Restora</span>
          )}
        </div>
        {!mobileMode && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={[
              'p-1.5 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-white/8 transition-colors',
              collapsed ? 'mt-0' : '',
            ].join(' ')}
          >
            {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
          </button>
        )}
      </div>

      {/* ── Navigation ────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
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
              {group.items.map((item) => (
                <NavItem key={item.to} item={item} collapsed={collapsed} onClose={onClose} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── User card ─────────────────────────────────── */}
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
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                <p className="text-[10px] text-gray-500 capitalize">{user?.role ?? 'owner'}</p>
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

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

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

      {/* ── Desktop Sidebar ──────────────────────────── */}
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
        />
      </aside>

      {/* ── Mobile Drawer ────────────────────────────── */}
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
        />
      </aside>

      {/* ── Main content ─────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Topbar */}
        <header className="h-14 bg-white dark:bg-[#141414] border-b border-gray-100 dark:border-white/5 flex items-center gap-3 px-4 sm:px-5 shrink-0">

          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/8 transition-colors"
            onClick={() => setMobileOpen(true)}
          >
            <PanelLeftOpen size={18} />
          </button>

          {/* Search */}
          <div className="hidden sm:flex items-center gap-2 bg-gray-50 dark:bg-white/4 border border-gray-200 dark:border-white/8 rounded-lg px-3 h-8 w-60 cursor-pointer group hover:border-orange-300 dark:hover:border-orange-500/30 transition-colors">
            <Search size={13} className="text-gray-400" />
            <span className="text-xs text-gray-400 flex-1 select-none">Search...</span>
            <kbd className="text-[10px] text-gray-300 dark:text-gray-600 border border-gray-200 dark:border-white/10 rounded px-1 py-0.5 font-sans">
              ⌘K
            </kbd>
          </div>

          <div className="flex-1" />

          {/* Notification bell */}
          <button className="relative p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/8 transition-colors">
            <Bell size={17} />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-orange-500 rounded-full" />
          </button>

          <div className="h-5 w-px bg-gray-200 dark:bg-white/8" />

          <ThemeToggle />
          <LanguageSwitcher />
        </header>

        {/* Page outlet */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
