import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { User, Mail, Phone, Lock, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import { Button, Input, ThemeToggle, LanguageSwitcher } from '../../components/ui';

const STEPS = [
  { id: 1, label: 'Account' },
  { id: 2, label: 'Security' },
];

export default function Register() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => {
    setForm({ ...form, [k]: e.target.value });
    if (errors[k]) setErrors({ ...errors, [k]: '' });
  };

  const validateStep1 = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    if (!form.phone.trim()) e.phone = 'Phone is required';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'At least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const { mutate, isPending } = useMutation({
    mutationFn: authService.register,
    onSuccess: ({ data }) => {
      setAuth(data.user, data.accessToken);
      toast.success(t('register.success'));
      navigate('/admin');
    },
    onError: (err) => toast.error(err.message),
  });

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateStep2()) mutate(form);
  };

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

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className={[
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200',
                    step > s.id
                      ? 'bg-green-500 text-white'
                      : step === s.id
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-200 dark:shadow-orange-900'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
                  ].join(' ')}>
                    {step > s.id ? <Check size={14} /> : s.id}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${step === s.id ? 'text-orange-500' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-12 h-0.5 mx-1 rounded transition-colors duration-300 ${step > s.id ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm p-8">

            {/* Step 1 */}
            {step === 1 && (
              <div>
                <div className="text-center mb-6">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('register.title')}</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tell us about yourself</p>
                </div>
                <div className="space-y-4">
                  <Input
                    label={t('register.name')}
                    type="text"
                    icon={User}
                    required
                    value={form.name}
                    onChange={set('name')}
                    placeholder="Ahmed Ben Ali"
                    error={errors.name}
                  />
                  <Input
                    label={t('register.email')}
                    type="email"
                    icon={Mail}
                    required
                    value={form.email}
                    onChange={set('email')}
                    placeholder="you@example.com"
                    error={errors.email}
                  />
                  <Button onClick={handleNext} fullWidth size="lg" className="mt-2" iconRight={ArrowRight}>
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <form onSubmit={handleSubmit}>
                <div className="text-center mb-6">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">Almost there</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Secure your account</p>
                </div>
                <div className="space-y-4">
                  <Input
                    label={t('register.phone')}
                    type="tel"
                    icon={Phone}
                    required
                    value={form.phone}
                    onChange={set('phone')}
                    placeholder="+216 XX XXX XXX"
                    error={errors.phone}
                  />
                  <Input
                    label={t('register.password')}
                    type="password"
                    icon={Lock}
                    required
                    value={form.password}
                    onChange={set('password')}
                    placeholder="Min. 6 characters"
                    error={errors.password}
                  />
                  <div className="flex gap-3 mt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="lg"
                      onClick={() => setStep(1)}
                      icon={ArrowLeft}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button type="submit" loading={isPending} size="lg" className="flex-2 flex-1">
                      {isPending ? t('register.submitting') : t('register.submit')}
                    </Button>
                  </div>
                </div>
              </form>
            )}

            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
              {t('register.hasAccount')}{' '}
              <Link to="/login" className="text-orange-500 font-medium hover:underline">
                {t('register.loginLink')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
