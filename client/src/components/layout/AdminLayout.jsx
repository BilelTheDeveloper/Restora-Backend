import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { ThemeToggle, LanguageSwitcher, Avatar, Button } from '../ui';
import {
  LayoutDashboard, ShoppingCart, Grid3X3, ChefHat,
  BookOpen, ClipboardList, CalendarDays, Users, Settings,
  LogOut, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';

const useNavItems = () => {
  const { t } = useTranslation('admin');
  return [
    { to: '/admin',              label: t('nav.dashboard'),    icon: LayoutDashboard, end: true },
    { to: '/admin/pos',          label: t('nav.pos'),          icon: ShoppingCart },
    { to: '/admin/tables',       label: t('nav.tables'),       icon: Grid3X3 },
    { to: '/admin/kitchen',      label: t('nav.kitchen'),      icon: ChefHat },
    { to: '/admin/menu',         label: t('nav.menu'),         icon: BookOpen },
    { to: '/admin/orders',       label: t('nav.orders'),       icon: ClipboardList },
    { to: '/admin/reservations', label: t('nav.reservations'), icon: CalendarDays },
    { to: '/admin/staff',        label: t('nav.staff'),        icon: Users },
    { to: '/admin/settings',     label: t('nav.settings'),     icon: Settings },
  ];
};

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const navItems = useNavItems();

  const handleLogout = () => { logout(); navigate('/login'); };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className={`h-16 flex items-center border-b border-white/10 px-4 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && <span className="text-lg font-bold text-orange-400">Restora</span>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors hidden lg:flex"
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => [
              'flex items-center rounded-lg text-sm font-medium transition-all duration-150',
              collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5',
              isActive
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-white/8',
            ].join(' ')}
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-white/10">
        <div className={`flex items-center mb-2 ${collapsed ? 'justify-center' : 'gap-3 px-2'}`}>
          <Avatar name={user?.name} size="sm" className="shrink-0" />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className={[
            'w-full flex items-center rounded-lg py-2 text-sm text-gray-400',
            'hover:text-white hover:bg-white/8 transition-colors',
            collapsed ? 'justify-center px-2' : 'gap-3 px-3',
          ].join(' ')}
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950 overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — desktop */}
      <aside className={[
        'hidden lg:flex flex-col bg-gray-900 dark:bg-gray-950 shrink-0',
        'transition-all duration-200 border-e border-white/5',
        collapsed ? 'w-[60px]' : 'w-56',
      ].join(' ')}>
        <SidebarContent />
      </aside>

      {/* Sidebar — mobile drawer */}
      <aside className={[
        'fixed inset-y-0 start-0 z-50 flex flex-col w-56 bg-gray-900',
        'transition-transform duration-200 lg:hidden',
        mobileOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full',
      ].join(' ')}>
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-white/10 flex items-center px-4 sm:px-6 gap-3 shrink-0">
          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            onClick={() => setMobileOpen(true)}
          >
            <PanelLeftOpen size={20} />
          </button>

          <div className="flex-1" />

          <ThemeToggle />
          <LanguageSwitcher />
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
