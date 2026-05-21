import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { useTranslation } from 'react-i18next';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useThemeStore();
  const { t } = useTranslation();

  return (
    <button
      onClick={toggleTheme}
      title={t('theme.toggle')}
      className={[
        'w-9 h-9 flex items-center justify-center rounded-lg',
        'text-gray-500 dark:text-gray-400',
        'hover:bg-gray-100 dark:hover:bg-white/10',
        'transition-colors duration-150',
        className,
      ].join(' ')}
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
