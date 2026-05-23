import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Store, MapPin, ArrowRight, CheckCircle2, Globe } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { restaurantService } from '../../services/restaurantService';

function FacebookIcon({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" /></svg>;
}
function InstagramIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

const CITIES = [
  'Tunis','Ariana','Ben Arous','Manouba','Nabeul','Zaghouan','Bizerte',
  'Beja','Jendouba','Kef','Siliana','Sousse','Monastir','Mahdia',
  'Sfax','Kairouan','Kasserine','Sidi Bouzid','Gabes','Mednine',
  'Tataouine','Gafsa','Tozeur','Kebili',
];

export default function RestaurantSetup() {
  const { user, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({
    name:      '',
    street:    '',
    city:      '',
    facebook:  '',
    instagram: '',
    tiktok:    '',
  });

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: data => restaurantService.upsertSetup(data),
    onSuccess: ({ data: restaurant }) => {
      if (restaurant?._id) updateUser({ ...user, restaurant: restaurant._id });
      setDone(true);
      toast.success('Restaurant info saved!');
    },
    onError: err => toast.error(err?.response?.data?.message || 'Save failed — please try again.'),
  });

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.name.trim())   { toast.error('Restaurant name is required'); return; }
    if (!form.city)          { toast.error('City is required'); return; }
    if (!form.street.trim()) { toast.error('Street address is required'); return; }

    save({
      name:    form.name.trim(),
      address: { street: form.street.trim(), city: form.city, country: 'Tunisia' },
      socialMedia: {
        facebook:  form.facebook.trim()  || undefined,
        instagram: form.instagram.trim() || undefined,
        tiktok:    form.tiktok.trim()    || undefined,
      },
    });
  };

  if (done) {
    return (
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-400/20 rounded-3xl blur-2xl" />
            <div className="relative bg-white/90 dark:bg-[#0f0f0f]/90 backdrop-blur-2xl border border-white/60 dark:border-white/8 rounded-3xl shadow-2xl p-10 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-emerald-500/30">
                <CheckCircle2 size={28} className="text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Info Saved!</h2>
              <p className="text-sm text-gray-400 mt-2 max-w-xs mx-auto leading-relaxed">
                Your restaurant info has been saved and will be reviewed along with your KYC documents.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => setDone(false)}
                  className="px-5 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                >
                  Edit Info
                </button>
                <button
                  onClick={() => navigate('/admin')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm font-bold transition-all shadow-lg shadow-orange-500/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/40"
                >
                  Go to Dashboard <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-start justify-center p-4 sm:p-6 pt-10">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-xl shadow-orange-500/30 mb-4">
            <Store size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Restaurant Setup</h1>
          <p className="text-sm text-gray-400 mt-1">Basic details needed to verify your restaurant</p>
        </div>

        {/* Card */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/12 via-transparent to-amber-500/8 rounded-3xl blur-2xl" />
          <form
            onSubmit={handleSubmit}
            className="relative bg-white/90 dark:bg-[#0f0f0f]/90 backdrop-blur-2xl border border-white/60 dark:border-white/8 rounded-3xl shadow-2xl shadow-black/10 p-6 sm:p-8 space-y-6"
          >
            {/* Restaurant Name */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg bg-orange-100 dark:bg-orange-500/15 flex items-center justify-center">
                  <Store size={12} className="text-orange-500" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Restaurant Name</p>
              </div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Name <span className="text-red-400">*</span>
              </label>
              <div className="flex items-center gap-3 bg-gray-50/80 dark:bg-white/5 border-2 border-gray-100 dark:border-white/8 rounded-2xl px-4 py-3 focus-within:border-orange-400 dark:focus-within:border-orange-500/50 transition-all duration-200 focus-within:shadow-md focus-within:shadow-orange-500/10">
                <Store size={15} className="text-gray-400 shrink-0" />
                <input
                  value={form.name}
                  onChange={set('name')}
                  placeholder="e.g. Le Jasmin"
                  required
                  className="flex-1 bg-transparent text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 outline-none"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                  <MapPin size={12} className="text-blue-500" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Location</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Street Address <span className="text-red-400">*</span>
                  </label>
                  <div className="flex items-center gap-3 bg-gray-50/80 dark:bg-white/5 border-2 border-gray-100 dark:border-white/8 rounded-2xl px-4 py-3 focus-within:border-orange-400 dark:focus-within:border-orange-500/50 transition-all duration-200 focus-within:shadow-md focus-within:shadow-orange-500/10">
                    <MapPin size={15} className="text-gray-400 shrink-0" />
                    <input
                      value={form.street}
                      onChange={set('street')}
                      placeholder="Street, neighbourhood, building…"
                      className="flex-1 bg-transparent text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    City <span className="text-red-400">*</span>
                  </label>
                  <div className="flex items-center gap-3 bg-gray-50/80 dark:bg-white/5 border-2 border-gray-100 dark:border-white/8 rounded-2xl px-4 py-3 focus-within:border-orange-400 dark:focus-within:border-orange-500/50 transition-all duration-200 focus-within:shadow-md focus-within:shadow-orange-500/10">
                    <MapPin size={15} className="text-gray-400 shrink-0" />
                    <select
                      value={form.city}
                      onChange={set('city')}
                      required
                      className="flex-1 bg-transparent text-sm font-medium text-gray-900 dark:text-white outline-none cursor-pointer"
                    >
                      <option value="">Select city…</option>
                      {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
                  <Globe size={12} className="text-purple-500" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  Social Media <span className="normal-case font-normal">(optional)</span>
                </p>
              </div>
              <div className="space-y-3">
                {[
                  { k: 'facebook',  Icon: FacebookIcon,  ph: 'https://facebook.com/yourpage',  label: 'Facebook'  },
                  { k: 'instagram', Icon: InstagramIcon, ph: 'https://instagram.com/yourpage', label: 'Instagram' },
                  { k: 'tiktok',    Icon: Globe,         ph: 'https://tiktok.com/@yourpage',   label: 'TikTok'    },
                ].map(({ k, Icon, ph, label }) => (
                  <div key={k} className="flex items-center gap-3 bg-gray-50/80 dark:bg-white/5 border-2 border-gray-100 dark:border-white/8 rounded-2xl px-4 py-3 focus-within:border-orange-400 dark:focus-within:border-orange-500/50 transition-all duration-200 focus-within:shadow-md focus-within:shadow-orange-500/10">
                    <Icon size={14} className="text-gray-400 shrink-0" />
                    <span className="text-[11px] font-bold text-gray-400 w-16 shrink-0">{label}</span>
                    <input
                      type="url"
                      value={form[k]}
                      onChange={set(k)}
                      placeholder={ph}
                      className="flex-1 bg-transparent text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-2xl transition-all shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-0.5"
            >
              {saving ? 'Saving…' : 'Save & Continue'}
              {!saving && <ArrowRight size={15} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
