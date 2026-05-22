import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Mail, Lock } from 'lucide-react';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import { Button, Input, ThemeToggle, LanguageSwitcher } from '../../components/ui';

export default function Login() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ email: '', password: '' });

  const { mutate, isPending } = useMutation({
    mutationFn: authService.login,
    onSuccess: ({ data }) => {
      setAuth(data.user, data.token);
      toast.success(t('login.success'));
      navigate(data.user.role === 'superadmin' ? '/superadmin' : '/admin');
    },
    onError: (err) => toast.error(err.message),
  });

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col transition-colors">
      {/* Top bar */}
      <div className="flex justify-between items-center px-6 py-4">
        <Link to="/" className="text-xl font-bold text-orange-500">Restora</Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('login.title')}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('login.subtitle')}</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); mutate(form); }} className="space-y-4">
              <Input
                label={t('login.email')}
                type="email"
                icon={Mail}
                required
                value={form.email}
                onChange={set('email')}
                placeholder="you@example.com"
              />
              <Input
                label={t('login.password')}
                type="password"
                icon={Lock}
                required
                value={form.password}
                onChange={set('password')}
                placeholder="••••••••"
              />
              <Button type="submit" loading={isPending} fullWidth size="lg" className="mt-2">
                {isPending ? t('login.submitting') : t('login.submit')}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
              {t('login.noAccount')}{' '}
              <Link to="/register" className="text-orange-500 font-medium hover:underline">
                {t('login.registerLink')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
