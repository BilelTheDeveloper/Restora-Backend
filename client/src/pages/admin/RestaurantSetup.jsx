import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Store, MapPin, Phone, Globe, Users, Clock,
  ChefHat, Utensils, Save, CheckCircle2, ArrowRight,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const CUISINE_TYPES = [
  'Tunisian', 'Mediterranean', 'Italian', 'French', 'Lebanese',
  'Moroccan', 'Turkish', 'Asian', 'American', 'International', 'Other',
];

const CITIES = [
  'Tunis', 'Sfax', 'Sousse', 'Monastir', 'Bizerte', 'Gabes',
  'Ariana', 'Gafsa', 'Nabeul', 'Kairouan', 'Beja', 'Other',
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
    <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 focus-within:border-orange-400 dark:focus-within:border-orange-500 transition-colors">
      {Icon && <Icon size={13} className="text-gray-400 shrink-0" />}
      <input
        className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none"
        {...props}
      />
    </div>
  );
}

function SelectInput({ icon: Icon, options, ...props }) {
  return (
    <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 focus-within:border-orange-400 transition-colors">
      {Icon && <Icon size={13} className="text-gray-400 shrink-0" />}
      <select
        className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white outline-none cursor-pointer"
        {...props}
      >
        <option value="">Select…</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const defaultHours = DAYS.reduce((acc, d, i) => {
  acc[d] = { open: i < 6, from: '11:00', to: '23:00' };
  return acc;
}, {});

export default function RestaurantSetup() {
  const { user } = useAuthStore();
  const [saved,   setSaved]  = useState(false);
  const [hours,   setHours]  = useState(defaultHours);
  const [form,    setForm]   = useState({
    name:        '',
    cuisine:     '',
    city:        '',
    address:     '',
    phone:       user?.phone ?? '',
    website:     '',
    capacity:    '',
    description: '',
  });

  const set  = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));
  const updateHour = (day, field, value) =>
    setHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.cuisine || !form.city) {
      toast.error('Please fill in the required fields');
      return;
    }
    // Save to localStorage until backend restaurant endpoint is wired
    localStorage.setItem('restora-setup', JSON.stringify({ ...form, hours }));
    setSaved(true);
    toast.success('Restaurant profile saved!');
  };

  if (saved) {
    return (
      <div className="p-5 sm:p-6 max-w-2xl">
        <div className="bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/6 rounded-2xl p-10 shadow-sm text-center">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Profile Saved!</h2>
          <p className="text-sm text-gray-400 mt-2 leading-relaxed max-w-xs mx-auto">
            Your restaurant profile has been saved. It will be reviewed along with your KYC documents.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setSaved(false)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              Edit Profile
            </button>
            <a
              href="/admin/kyc"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors shadow-sm shadow-orange-500/20"
            >
              Complete KYC <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6 max-w-2xl space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Restaurant Setup</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Tell us about your restaurant — this will be reviewed with your KYC application
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-500/8 border border-orange-200 dark:border-orange-500/20 rounded-2xl">
        <Utensils size={16} className="text-orange-500 shrink-0 mt-0.5" />
        <p className="text-xs text-orange-700 dark:text-orange-400 leading-relaxed">
          Complete your restaurant profile to speed up the verification process.
          Fields marked <span className="font-bold">*</span> are required.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Basic Info */}
        <div className="bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/6 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-white/6 flex items-center gap-2">
            <Store size={15} className="text-orange-500" />
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Basic Information</p>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Restaurant Name" required>
                <TextInput
                  icon={Store}
                  value={form.name}
                  onChange={set('name')}
                  placeholder="e.g. Le Jasmin"
                  required
                />
              </Field>
              <Field label="Cuisine Type" required>
                <SelectInput
                  icon={ChefHat}
                  options={CUISINE_TYPES}
                  value={form.cuisine}
                  onChange={set('cuisine')}
                  required
                />
              </Field>
              <Field label="City" required>
                <SelectInput
                  icon={MapPin}
                  options={CITIES}
                  value={form.city}
                  onChange={set('city')}
                  required
                />
              </Field>
              <Field label="Seating Capacity">
                <TextInput
                  icon={Users}
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={set('capacity')}
                  placeholder="e.g. 60"
                />
              </Field>
            </div>

            <Field label="Full Address">
              <TextInput
                icon={MapPin}
                value={form.address}
                onChange={set('address')}
                placeholder="Street, district, city"
              />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Phone Number">
                <TextInput
                  icon={Phone}
                  type="tel"
                  value={form.phone}
                  onChange={set('phone')}
                  placeholder="+216 XX XXX XXX"
                />
              </Field>
              <Field label="Website / Social">
                <TextInput
                  icon={Globe}
                  value={form.website}
                  onChange={set('website')}
                  placeholder="www.yourrestaurant.tn"
                />
              </Field>
            </div>

            <Field label="Description">
              <textarea
                rows={3}
                value={form.description}
                onChange={set('description')}
                placeholder="Describe your restaurant, cuisine style and what makes it unique…"
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-orange-400 dark:focus:border-orange-500 transition-colors resize-none"
              />
            </Field>
          </div>
        </div>

        {/* Opening Hours */}
        <div className="bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/6 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-white/6 flex items-center gap-2">
            <Clock size={15} className="text-orange-500" />
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Opening Hours</p>
          </div>
          <div className="p-5 divide-y divide-gray-50 dark:divide-white/4">
            {DAYS.map(day => (
              <div key={day} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-24 shrink-0">{day}</span>

                <button
                  type="button"
                  onClick={() => updateHour(day, 'open', !hours[day].open)}
                  className={[
                    'w-9 h-5 rounded-full transition-all duration-200 relative shrink-0',
                    hours[day].open ? 'bg-orange-500' : 'bg-gray-200 dark:bg-white/10',
                  ].join(' ')}
                >
                  <span className={[
                    'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200',
                    hours[day].open ? 'translate-x-4' : 'translate-x-0',
                  ].join(' ')} />
                </button>

                {hours[day].open ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={hours[day].from}
                      onChange={e => updateHour(day, 'from', e.target.value)}
                      className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1 text-xs text-gray-900 dark:text-white outline-none focus:border-orange-400 transition-colors"
                    />
                    <span className="text-xs text-gray-400">–</span>
                    <input
                      type="time"
                      value={hours[day].to}
                      onChange={e => updateHour(day, 'to', e.target.value)}
                      className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1 text-xs text-gray-900 dark:text-white outline-none focus:border-orange-400 transition-colors"
                    />
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">Closed</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors shadow-sm shadow-orange-500/20"
          >
            <Save size={15} /> Save Restaurant Profile
          </button>
        </div>
      </form>
    </div>
  );
}
