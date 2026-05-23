import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { ThemeToggle, LanguageSwitcher, Button, Avatar } from '../ui';

export default function PublicLayout() {
  const { t } = useTranslation();
  const { user, token, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      {/* Navbar */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="text-xl font-bold text-orange-500">Restora</span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <LanguageSwitcher />

            <div className="w-px h-6 bg-gray-200 dark:bg-white/10 mx-1" />

            {token ? (
              <div className="flex items-center gap-2">
                <Link to={user?.role === 'superadmin' ? '/superadmin' : '/admin'}>
                  <Button variant="ghost" size="sm">{t('nav.dashboard')}</Button>
                </Link>
                <Avatar name={user?.name} size="sm" />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">{t('nav.login')}</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">{t('nav.register')}</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Page content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-white/10 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-400 dark:text-gray-500">
          © {new Date().getFullYear()} Restora. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
