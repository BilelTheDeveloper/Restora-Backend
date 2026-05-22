import { useState } from 'react';
import {
  Store, Clock, CreditCard, Bell, Palette,
  Save, MapPin, Phone, Globe, Mail,
} from 'lucide-react';

const TABS = [
  { key: 'profile',      label: 'Restaurant',  icon: Store },
  { key: 'hours',        label: 'Hours',        icon: Clock },
  { key: 'payments',     label: 'Payments',     icon: CreditCard },
  { key: 'notifications',label: 'Notifications',icon: Bell },
  { key: 'appearance',   label: 'Appearance',   icon: Palette },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const INITIAL_HOURS = DAYS.reduce((acc, day, i) => {
  acc[day] = { open: i < 6, from: '11:00', to: '23:00' };
  return acc;
}, {});

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">{label}</label>
      {children}
    </div>
  );
}

function Input({ icon: Icon, ...props }) {
  return (
    <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 focus-within:border-orange-400 dark:focus-within:border-orange-500 transition-colors">
      {Icon && <Icon size={14} className="text-gray-400 shrink-0" />}
      <input
        className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none"
        {...props}
      />
    </div>
  );
}

function Toggle({ checked, onChange, label, desc }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-gray-50 dark:border-white/4 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</p>
        {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={[
          'w-11 h-6 rounded-full transition-all duration-200 relative shrink-0',
          checked ? 'bg-orange-500' : 'bg-gray-200 dark:bg-white/10',
        ].join(' ')}
      >
        <span className={[
          'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0',
        ].join(' ')} />
      </button>
    </div>
  );
}

function SaveButton() {
  return (
    <div className="flex justify-end pt-2">
      <button className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm shadow-orange-500/20">
        <Save size={14} /> Save Changes
      </button>
    </div>
  );
}

// ── Tab panels ─────────────────────────────────────────────

function ProfileTab() {
  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Restaurant Name">
          <Input icon={Store} defaultValue="Restora Tunis" placeholder="Restaurant name" />
        </Field>
        <Field label="Phone Number">
          <Input icon={Phone} defaultValue="+216 55 123 456" placeholder="+216 ..." />
        </Field>
        <Field label="Email Address">
          <Input icon={Mail} defaultValue="contact@restora.tn" placeholder="email@example.com" />
        </Field>
        <Field label="Website">
          <Input icon={Globe} defaultValue="www.restora.tn" placeholder="www.example.com" />
        </Field>
      </div>
      <Field label="Address">
        <Input icon={MapPin} defaultValue="12 Rue de la Liberté, Tunis 1001" placeholder="Full address" />
      </Field>
      <Field label="Description">
        <textarea
          rows={3}
          defaultValue="Authentic Tunisian cuisine in the heart of Tunis. Traditional recipes, warm atmosphere."
          className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-orange-400 dark:focus:border-orange-500 transition-colors resize-none"
        />
      </Field>
      <SaveButton />
    </div>
  );
}

function HoursTab() {
  const [hours, setHours] = useState(INITIAL_HOURS);

  const update = (day, field, value) =>
    setHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));

  return (
    <div className="space-y-6">
      <p className="text-xs text-gray-400">Set your opening and closing times for each day of the week.</p>
      <div className="divide-y divide-gray-50 dark:divide-white/4">
        {DAYS.map(day => (
          <div key={day} className="flex items-center gap-4 py-3.5">
            <div className="w-28 shrink-0">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{day}</p>
            </div>

            <button
              onClick={() => update(day, 'open', !hours[day].open)}
              className={[
                'w-10 h-5 rounded-full transition-all duration-200 relative shrink-0',
                hours[day].open ? 'bg-orange-500' : 'bg-gray-200 dark:bg-white/10',
              ].join(' ')}
            >
              <span className={[
                'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200',
                hours[day].open ? 'translate-x-5' : 'translate-x-0',
              ].join(' ')} />
            </button>

            {hours[day].open ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="time"
                  value={hours[day].from}
                  onChange={e => update(day, 'from', e.target.value)}
                  className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-900 dark:text-white outline-none focus:border-orange-400 transition-colors"
                />
                <span className="text-xs text-gray-400">to</span>
                <input
                  type="time"
                  value={hours[day].to}
                  onChange={e => update(day, 'to', e.target.value)}
                  className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-900 dark:text-white outline-none focus:border-orange-400 transition-colors"
                />
              </div>
            ) : (
              <span className="text-xs text-gray-400 flex-1">Closed</span>
            )}
          </div>
        ))}
      </div>
      <SaveButton />
    </div>
  );
}

function PaymentsTab() {
  const [vals, setVals] = useState({ cash: true, card: true, online: false, tva: true, tvaRate: '19', serviceCharge: false, serviceRate: '10' });
  const toggle = k => setVals(p => ({ ...p, [k]: !p[k] }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Payment Methods</p>
        <div className="bg-gray-50 dark:bg-white/3 rounded-2xl px-4">
          <Toggle checked={vals.cash}   onChange={() => toggle('cash')}   label="Cash" desc="Accept cash payments" />
          <Toggle checked={vals.card}   onChange={() => toggle('card')}   label="Card / POS Terminal" desc="Visa, Mastercard, etc." />
          <Toggle checked={vals.online} onChange={() => toggle('online')} label="Online Payment" desc="Flouci, Paymee & others" />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Taxes &amp; Fees</p>
        <div className="bg-gray-50 dark:bg-white/3 rounded-2xl px-4">
          <Toggle checked={vals.tva} onChange={() => toggle('tva')} label="Apply TVA" desc={`Currently set to ${vals.tvaRate}%`} />
          {vals.tva && (
            <div className="py-3 border-t border-gray-100 dark:border-white/8">
              <Field label="TVA Rate (%)">
                <Input defaultValue={vals.tvaRate} placeholder="19" />
              </Field>
            </div>
          )}
          <Toggle checked={vals.serviceCharge} onChange={() => toggle('serviceCharge')} label="Service Charge" desc="Added to every bill" />
        </div>
      </div>
      <SaveButton />
    </div>
  );
}

function NotificationsTab() {
  const [vals, setVals] = useState({ newOrder: true, orderReady: true, newReservation: true, lowStock: false, dailyReport: true, sms: false });
  const toggle = k => setVals(p => ({ ...p, [k]: !p[k] }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">In-App Alerts</p>
        <div className="bg-gray-50 dark:bg-white/3 rounded-2xl px-4">
          <Toggle checked={vals.newOrder}       onChange={() => toggle('newOrder')}       label="New Order"        desc="Alert when a new order comes in" />
          <Toggle checked={vals.orderReady}     onChange={() => toggle('orderReady')}     label="Order Ready"      desc="Alert when kitchen marks order ready" />
          <Toggle checked={vals.newReservation} onChange={() => toggle('newReservation')} label="New Reservation"  desc="Alert on new booking" />
          <Toggle checked={vals.lowStock}       onChange={() => toggle('lowStock')}       label="Low Stock"        desc="Alert when item stock is low" />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Reports</p>
        <div className="bg-gray-50 dark:bg-white/3 rounded-2xl px-4">
          <Toggle checked={vals.dailyReport} onChange={() => toggle('dailyReport')} label="Daily Report" desc="End-of-day summary by email" />
          <Toggle checked={vals.sms}         onChange={() => toggle('sms')}         label="SMS Alerts"   desc="Critical alerts via SMS (extra cost)" />
        </div>
      </div>
      <SaveButton />
    </div>
  );
}

function AppearanceTab() {
  const [theme, setTheme] = useState('system');
  const [lang,  setLang]  = useState('en');
  const [color, setColor] = useState('orange');

  const ACCENT_COLORS = [
    { key: 'orange', hex: '#f97316', label: 'Orange (default)' },
    { key: 'blue',   hex: '#3b82f6', label: 'Blue' },
    { key: 'green',  hex: '#22c55e', label: 'Green' },
    { key: 'purple', hex: '#8b5cf6', label: 'Purple' },
  ];

  return (
    <div className="space-y-6">
      <Field label="Theme">
        <div className="flex bg-gray-100 dark:bg-white/5 rounded-xl p-1 gap-1 w-fit">
          {['light', 'dark', 'system'].map(t => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={[
                'px-4 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all',
                theme === t
                  ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
              ].join(' ')}
            >
              {t}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Language">
        <div className="flex gap-2">
          {[{ key: 'en', label: '🇺🇸 English' }, { key: 'fr', label: '🇫🇷 Français' }, { key: 'ar', label: '🇹🇳 العربية' }].map(l => (
            <button
              key={l.key}
              onClick={() => setLang(l.key)}
              className={[
                'px-4 py-2 text-xs font-semibold rounded-xl border transition-all',
                lang === l.key
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'border-gray-200 dark:border-white/10 text-gray-500 hover:border-orange-300',
              ].join(' ')}
            >
              {l.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Accent Color">
        <div className="flex items-center gap-3">
          {ACCENT_COLORS.map(c => (
            <button
              key={c.key}
              onClick={() => setColor(c.key)}
              title={c.label}
              className={[
                'w-8 h-8 rounded-full transition-all duration-150',
                color === c.key ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-[#141414] scale-110' : 'hover:scale-105',
              ].join(' ')}
              style={{ background: c.hex }}
            />
          ))}
        </div>
      </Field>

      <SaveButton />
    </div>
  );
}

// ── Main Settings ───────────────────────────────────────────

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');

  const PANELS = {
    profile:       <ProfileTab />,
    hours:         <HoursTab />,
    payments:      <PaymentsTab />,
    notifications: <NotificationsTab />,
    appearance:    <AppearanceTab />,
  };

  return (
    <div className="p-5 sm:p-6 space-y-6 max-w-[1440px]">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-xs text-gray-400 mt-0.5">Configure your restaurant preferences</p>
      </div>

      <div className="flex gap-5 items-start">

        {/* Sidebar nav */}
        <div className="hidden lg:block w-48 shrink-0 space-y-0.5">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={[
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left',
                activeTab === key
                  ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/25'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-800 dark:hover:text-gray-200',
              ].join(' ')}
            >
              <Icon size={15} className="shrink-0" />
              {label}
            </button>
          ))}
        </div>

        {/* Mobile tab bar */}
        <div className="lg:hidden flex gap-1 overflow-x-auto pb-1 w-full">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={[
                'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all',
                activeTab === key
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-500',
              ].join(' ')}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div className="flex-1 min-w-0 bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/6 rounded-2xl shadow-sm p-6">
          <div className="mb-5 pb-4 border-b border-gray-100 dark:border-white/6">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              {TABS.find(t => t.key === activeTab)?.label}
            </h2>
          </div>
          {PANELS[activeTab]}
        </div>
      </div>
    </div>
  );
}
