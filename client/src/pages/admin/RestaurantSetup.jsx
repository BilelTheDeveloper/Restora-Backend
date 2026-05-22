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

function Field({ label, required, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function TextInput({ icon: Icon, ...props }) {
  return (
    <div className="flex items-center gap-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 focus-within:border-orange-400 transition-colors">
      {Icon && <Icon size={14} className="text-gray-400 shrink-0" />}
      <input className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none" {...props} />
    </div>
  );
}

export default function RestaurantSetup() {
  const { user, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({
    name:    '',
    street:  '',
    city:    '',
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
    if (!form.name.trim()) { toast.error('Restaurant name is required'); return; }
    if (!form.city)        { toast.error('City is required'); return; }
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
      <div className="p-5 sm:p-6 max-w-lg">
        <div className="bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/6 rounded-2xl p-10 shadow-sm text-center">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Info Saved!</h2>
          <p className="text-sm text-gray-400 mt-2 max-w-xs mx-auto leading-relaxed">
            Your restaurant info has been saved and will be reviewed along with your KYC documents.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setDone(false)}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              Edit Info
            </button>
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors shadow-sm shadow-orange-500/20"
            >
              Go to Dashboard <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6 max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Restaurant Info</h1>
        <p className="text-xs text-gray-400 mt-0.5">Basic details needed to verify your restaurant</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/6 rounded-2xl p-5 shadow-sm space-y-5">

        {/* Name */}
        <Field label="Restaurant Name" required>
          <TextInput
            icon={Store}
            value={form.name}
            onChange={set('name')}
            placeholder="e.g. Le Jasmin"
            required
          />
        </Field>

        {/* Address */}
        <div className="space-y-3">
          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
            <MapPin size={9} /> Location
          </p>

          <Field label="Street Address" required>
            <TextInput
              icon={MapPin}
              value={form.street}
              onChange={set('street')}
              placeholder="Street, neighbourhood, building…"
            />
          </Field>

          <Field label="City" required>
            <div className="flex items-center gap-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 focus-within:border-orange-400 transition-colors">
              <MapPin size={14} className="text-gray-400 shrink-0" />
              <select
                value={form.city}
                onChange={set('city')}
                className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white outline-none cursor-pointer"
                required
              >
                <option value="">Select city…</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </Field>
        </div>

        {/* Social media */}
        <div className="space-y-3">
          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            Social Media <span className="normal-case font-normal">(optional)</span>
          </p>

          {[
            { k: 'facebook',  Icon: FacebookIcon,  ph: 'https://facebook.com/yourpage',  label: 'Facebook'  },
            { k: 'instagram', Icon: InstagramIcon, ph: 'https://instagram.com/yourpage', label: 'Instagram' },
            { k: 'tiktok',    Icon: Globe,         ph: 'https://tiktok.com/@yourpage',   label: 'TikTok'    },
          ].map(({ k, Icon, ph, label }) => (
            <div key={k} className="flex items-center gap-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 focus-within:border-orange-400 transition-colors">
              <Icon size={14} className="text-gray-400 shrink-0" />
              <span className="text-[11px] font-semibold text-gray-400 w-16 shrink-0">{label}</span>
              <input
                type="url"
                value={form[k]}
                onChange={set(k)}
                placeholder={ph}
                className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none"
              />
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors shadow-sm shadow-orange-500/20"
        >
          {saving ? 'Saving…' : 'Save & Continue'}
          {!saving && <ArrowRight size={15} />}
        </button>
      </form>
    </div>
  );
}
