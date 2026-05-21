import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  ShoppingCart, Users, CalendarDays, TrendingUp,
  Monitor, LayoutGrid, ChefHat, BookOpen,
  ClipboardList, CalendarCheck, UserCog, Settings2,
  ArrowRight,
} from 'lucide-react';
import { Card } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';

const MODULE_LIST = [
  {
    key: 'pos',
    path: '/admin/pos',
    icon: Monitor,
    color: 'text-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'hover:border-orange-300 dark:hover:border-orange-700',
  },
  {
    key: 'tables',
    path: '/admin/tables',
    icon: LayoutGrid,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'hover:border-blue-300 dark:hover:border-blue-700',
  },
  {
    key: 'kitchen',
    path: '/admin/kitchen',
    icon: ChefHat,
    color: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'hover:border-red-300 dark:hover:border-red-700',
  },
  {
    key: 'menu',
    path: '/admin/menu',
    icon: BookOpen,
    color: 'text-yellow-500',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'hover:border-yellow-300 dark:hover:border-yellow-700',
  },
  {
    key: 'orders',
    path: '/admin/orders',
    icon: ClipboardList,
    color: 'text-indigo-500',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    border: 'hover:border-indigo-300 dark:hover:border-indigo-700',
  },
  {
    key: 'reservations',
    path: '/admin/reservations',
    icon: CalendarCheck,
    color: 'text-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'hover:border-purple-300 dark:hover:border-purple-700',
  },
  {
    key: 'staff',
    path: '/admin/staff',
    icon: UserCog,
    color: 'text-teal-500',
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    border: 'hover:border-teal-300 dark:hover:border-teal-700',
  },
  {
    key: 'settings',
    path: '/admin/settings',
    icon: Settings2,
    color: 'text-gray-500',
    bg: 'bg-gray-100 dark:bg-gray-800',
    border: 'hover:border-gray-300 dark:hover:border-gray-600',
  },
];

export default function Dashboard() {
  const { t } = useTranslation('admin');
  const user = useAuthStore((s) => s.user);

  const stats = [
    {
      label: t('dashboard.todayOrders'),
      value: '0',
      icon: ShoppingCart,
      color: 'text-orange-500',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
    },
    {
      label: t('dashboard.customers'),
      value: '0',
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: t('dashboard.reservations'),
      value: '0',
      icon: CalendarDays,
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      label: t('dashboard.revenue'),
      value: '0 TND',
      icon: TrendingUp,
      color: 'text-green-500',
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
  ];

  return (
    <div className="space-y-8">

      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('dashboard.welcome')},{' '}
          <span className="text-orange-500">{user?.name?.split(' ')[0] ?? '—'}</span>
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
          </Card>
        ))}
      </div>

      {/* Module grid */}
      <div>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">{t('dashboard.modules')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.modulesDesc')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MODULE_LIST.map(({ key, path, icon: Icon, color, bg, border }) => (
            <Link
              key={key}
              to={path}
              className={[
                'group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl p-5',
                'flex flex-col gap-3 transition-all duration-200',
                'hover:shadow-md hover:-translate-y-0.5',
                border,
              ].join(' ')}
            >
              <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon size={22} className={color} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                  {t(`nav.${key}`)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                  {t(`dashboard.moduleDesc.${key}`)}
                </p>
              </div>

              <div className="flex items-center gap-1 text-xs font-medium text-orange-500 group-hover:gap-2 transition-all">
                {t('dashboard.open')}
                <ArrowRight size={13} />
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
