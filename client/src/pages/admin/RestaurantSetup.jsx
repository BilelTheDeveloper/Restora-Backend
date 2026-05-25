import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Save, ArrowLeft, Eye, EyeOff, Camera, Upload, Globe, Mail, Clock,
  Phone, Plus, Trash2, MapPin, Store, ChevronDown, ChevronUp,
  CheckCircle2, Palette, Image as ImageIcon, UtensilsCrossed,
} from 'lucide-react';
import { restaurantService } from '../../services/restaurantService';

// ── Social icons ──────────────────────────────────────────────────────────────
function IGIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  );
}
function FBIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  );
}
function TKIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
    </svg>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────
const DAYS_ORDER = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const CUISINE_OPTIONS = ['Tunisian','Mediterranean','Italian','French','Japanese','Chinese','Indian','Lebanese','American','Mexican','Seafood','Grill','Pizza','Fast Food','Vegetarian'];
const CITIES = ['Tunis','Ariana','Ben Arous','Manouba','Nabeul','Zaghouan','Bizerte','Beja','Jendouba','Kef','Siliana','Sousse','Monastir','Mahdia','Sfax','Kairouan','Kasserine','Sidi Bouzid','Gabes','Mednine','Tataouine','Gafsa','Tozeur','Kebili'];

const DEFAULT_HOURS = DAYS_ORDER.map(day => ({
  day,
  open: '09:00',
  close: '22:00',
  isClosed: day === 'sunday',
}));

// ── Section wrapper ────────────────────────────────────────────────────────────
function Section({ num, icon: Icon, title, accent = 'indigo', children, collapsible = false }) {
  const [open, setOpen] = useState(true);
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    orange: 'bg-orange-50 text-orange-600',
    amber:  'bg-amber-50 text-amber-600',
    emerald:'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
    rose:   'bg-rose-50 text-rose-600',
  };
  return (
    <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
      <div className={`flex items-center justify-between p-8 pb-0 ${collapsible ? 'cursor-pointer' : ''}`}
           onClick={collapsible ? () => setOpen(o => !o) : undefined}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors[accent]}`}>
            {Icon ? <Icon size={20} /> : <span className="font-black text-sm">{String(num).padStart(2,'0')}</span>}
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">{title}</h2>
        </div>
        {collapsible && (open ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />)}
      </div>
      {open && <div className="p-8 pt-6 space-y-6">{children}</div>}
    </section>
  );
}

// ── Input row helper ───────────────────────────────────────────────────────────
function Field({ label, required, error, children }) {
  return (
    <div className="space-y-2">
      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
        {label}{required && <span className="text-rose-500 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-rose-500 font-semibold">{error}</p>}
    </div>
  );
}

function InputBox({ icon: Icon, ...props }) {
  return (
    <div className={`flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3.5 focus-within:ring-2 focus-within:ring-orange-400/40 transition-all ${props.error ? 'ring-2 ring-rose-400' : ''}`}>
      {Icon && <Icon size={16} className="text-slate-400 shrink-0" />}
      <input {...props} error={undefined} className="flex-1 bg-transparent text-sm font-semibold text-slate-900 placeholder-slate-300 outline-none" />
    </div>
  );
}

// ── Image upload cell ──────────────────────────────────────────────────────────
function ImageCell({ src, label, onFile, uploading }) {
  const ref = useRef();
  return (
    <div onClick={() => ref.current.click()}
         className="relative aspect-video bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition-all group">
      {src
        ? <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
        : (
          <div className="flex flex-col items-center gap-2 text-slate-300">
            <Camera size={28} />
            {label && <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>}
          </div>
        )
      }
      {uploading && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <div className="absolute bottom-2 right-2 bg-white/90 rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow">
        <Upload size={13} className="text-slate-600" />
      </div>
      <input type="file" accept="image/*" ref={ref} className="hidden" onChange={onFile} />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function RestaurantSetup() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(null);
  const [cuisineInput, setCuisineInput] = useState('');
  const [saved, setSaved] = useState(false);

  // Pre-load existing restaurant
  const { data: existing } = useQuery({
    queryKey: ['my-restaurant'],
    queryFn: () => restaurantService.getMine().then(r => r.data?.data || r.data),
    staleTime: 0,
  });

  const [form, setForm] = useState(null);

  // Once data arrives, populate the form
  useEffect(() => {
    if (!existing) return;
    const r = existing;
    setForm({
      name:         r.name ?? '',
      description:  r.description ?? '',
      cuisine:      r.cuisine ?? [],
      isHalal:      r.isHalal ?? false,
      coverImage:   r.coverImage ?? '',
      heroBackground: r.template?.heroBackground ?? '',
      slogan:       r.template?.slogan ?? '',
      badge:        r.template?.badge ?? '',
      primaryColor: r.template?.primaryColor ?? '#f97316',
      ctaText:      r.template?.ctaText ?? 'Reserve a Table',
      vipCtaText:   r.template?.vipCtaText ?? 'Book VIP Table',
      discoverText: r.template?.discoverText ?? 'Discover More',
      footerText:   r.template?.footerText ?? '',
      showMenu:     r.template?.showMenu ?? true,
      showGallery:  r.template?.showGallery ?? true,
      showAbout:    r.template?.showAbout ?? true,
      showHours:    r.template?.showHours ?? false,
      aboutText:    r.about?.text ?? '',
      aboutImage:   r.about?.image ?? '',
      images:       r.images?.length ? [...r.images] : ['','','','','',''],
      contact: {
        phone:    r.contact?.phone    ?? '',
        email:    r.contact?.email    ?? '',
        whatsapp: r.contact?.whatsapp ?? '',
        website:  r.contact?.website  ?? '',
      },
      address: {
        street: r.address?.street ?? '',
        city:   r.address?.city   ?? '',
        state:  r.address?.state  ?? '',
      },
      googleMapsLink: r.googleMapsLink ?? '',
      socialMedia: {
        facebook:  r.socialMedia?.facebook  ?? '',
        instagram: r.socialMedia?.instagram ?? '',
        tiktok:    r.socialMedia?.tiktok    ?? '',
      },
      openingHours: r.openingHours?.length ? r.openingHours : DEFAULT_HOURS,
    });
  }, [existing]);

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: payload => restaurantService.update(payload),
    onSuccess: () => {
      qc.invalidateQueries(['my-restaurant']);
      setSaved(true);
      toast.success('Restaurant updated!');
      setTimeout(() => setSaved(false), 3000);
    },
    onError: err => toast.error(err?.response?.data?.message || 'Save failed'),
  });

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const set = (key, value) => setForm(p => ({ ...p, [key]: value }));
  const setNested = (group, key, value) => setForm(p => ({ ...p, [group]: { ...p[group], [key]: value } }));
  const clearErr = (...keys) => setErrors(p => { const n = { ...p }; keys.forEach(k => delete n[k]); return n; });

  const uploadImage = async (file, onDone) => {
    // Since there's no dedicated upload endpoint, use a URL input approach
    // Fallback: create an object URL for preview (user provides hosted URL)
    const url = URL.createObjectURL(file);
    onDone(url);
  };

  const handleHourChange = (idx, field, value) => {
    setForm(p => {
      const hours = [...p.openingHours];
      hours[idx] = { ...hours[idx], [field]: value };
      return { ...p, openingHours: hours };
    });
  };

  const addGallerySlot = () => {
    setForm(p => ({ ...p, images: [...p.images, ''] }));
  };

  const setGalleryUrl = (idx, val) => {
    setForm(p => { const imgs = [...p.images]; imgs[idx] = val; return { ...p, images: imgs }; });
  };

  const addCuisine = (tag) => {
    const t = tag.trim();
    if (!t || form.cuisine.includes(t)) return;
    set('cuisine', [...form.cuisine, t]);
    setCuisineInput('');
  };

  const removeCuisine = (t) => set('cuisine', form.cuisine.filter(c => c !== t));

  const validate = () => {
    const e = {};
    if (!form.name?.trim())             e.name = 'Restaurant name is required';
    if (!form.address?.city)            e.city = 'City is required';
    if (!form.contact?.phone?.trim())   e.phone = 'Phone number is required';
    setErrors(e);
    if (Object.keys(e).length) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return false;
    }
    return true;
  };

  const handleSave = () => {
    if (!validate()) return;
    const payload = {
      name:        form.name.trim(),
      description: form.description,
      cuisine:     form.cuisine,
      isHalal:     form.isHalal,
      coverImage:  form.coverImage,
      images:      form.images.filter(Boolean),
      googleMapsLink: form.googleMapsLink,
      contact: {
        phone:    form.contact.phone,
        email:    form.contact.email,
        whatsapp: form.contact.whatsapp,
        website:  form.contact.website,
      },
      address: {
        street:  form.address.street,
        city:    form.address.city,
        state:   form.address.state,
        country: 'Tunisia',
      },
      socialMedia: form.socialMedia,
      about: {
        text:  form.aboutText,
        image: form.aboutImage,
      },
      openingHours: form.openingHours,
      template: {
        heroBackground: form.heroBackground,
        slogan:         form.slogan,
        badge:          form.badge,
        primaryColor:   form.primaryColor,
        ctaText:        form.ctaText,
        vipCtaText:     form.vipCtaText,
        discoverText:   form.discoverText,
        footerText:     form.footerText,
        showMenu:       form.showMenu,
        showGallery:    form.showGallery,
        showAbout:      form.showAbout,
        showHours:      form.showHours,
      },
    };
    save(payload);
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────────
  if (!form) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading restaurant data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── TOPBAR ── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100 px-6 md:px-10 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2.5 hover:bg-slate-100 rounded-xl transition-all">
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-sm font-black uppercase tracking-[0.18em] text-slate-900">Restaurant Setup</h1>
            <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest">Profile & Website Builder</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-orange-500/25 transition-all hover:scale-105 disabled:opacity-60"
                style={{ background: saved ? '#10b981' : 'linear-gradient(135deg,#f97316,#f59e0b)' }}>
          {saving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : saved ? (
            <><CheckCircle2 size={15} /> Saved!</>
          ) : (
            <><Save size={15} /> Save Changes</>
          )}
        </button>
      </nav>

      <div className="max-w-4xl mx-auto py-10 px-4 md:px-8 space-y-8">

        {/* ── 01 IDENTITY ── */}
        <Section num={1} icon={Store} title="Restaurant Identity" accent="orange">
          <div className="grid md:grid-cols-2 gap-5">
            <Field label="Restaurant Name" required error={errors.name}>
              <InputBox icon={Store} value={form.name} error={errors.name}
                        placeholder="e.g. Le Jasmin" onChange={e => { set('name', e.target.value); clearErr('name'); }} />
            </Field>
            <Field label="Short Description">
              <InputBox icon={UtensilsCrossed} value={form.description}
                        placeholder="Authentic Tunisian cuisine…"
                        onChange={e => set('description', e.target.value)} />
            </Field>
          </div>

          {/* Cuisine tags */}
          <Field label="Cuisine Types">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {form.cuisine.map(c => (
                  <span key={c} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 text-xs font-black">
                    {c}
                    <button onClick={() => removeCuisine(c)} className="hover:text-orange-900"><span>&times;</span></button>
                  </span>
                ))}
              </div>
              {/* Quick tags */}
              <div className="flex flex-wrap gap-2">
                {CUISINE_OPTIONS.filter(c => !form.cuisine.includes(c)).slice(0, 10).map(c => (
                  <button key={c} onClick={() => addCuisine(c)}
                          className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-500 text-xs font-bold hover:bg-orange-100 hover:text-orange-600 transition-all">
                    + {c}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={cuisineInput} onChange={e => setCuisineInput(e.target.value)}
                       onKeyDown={e => e.key === 'Enter' && addCuisine(cuisineInput)}
                       placeholder="Type custom cuisine + Enter…"
                       className="flex-1 bg-slate-50 rounded-xl px-4 py-3 text-sm font-semibold outline-none border border-slate-200 focus:border-orange-400 transition-colors" />
                <button onClick={() => addCuisine(cuisineInput)}
                        className="px-4 py-3 rounded-xl bg-orange-500 text-white text-xs font-black hover:bg-orange-600 transition-colors">
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </Field>

          <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <button onClick={() => set('isHalal', !form.isHalal)}
                    className={`w-12 h-6 rounded-full relative transition-all ${form.isHalal ? 'bg-emerald-500' : 'bg-slate-200'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.isHalal ? 'left-7' : 'left-1'}`} />
            </button>
            <div>
              <p className="text-sm font-black text-slate-800">Halal Certified</p>
              <p className="text-xs text-slate-500">Show Halal badge on your public page</p>
            </div>
          </div>
        </Section>

        {/* ── 02 HERO & COVER ── */}
        <Section num={2} icon={ImageIcon} title="Hero & Cover Images" accent="violet">
          <div className="grid md:grid-cols-2 gap-6">
            <Field label="Hero Background Image">
              <div className="space-y-2">
                <ImageCell src={form.heroBackground} label="Hero BG" uploading={uploading === 'hero'}
                           onFile={e => { const f = e.target.files[0]; if (!f) return; uploadImage(f, url => set('heroBackground', url)); }} />
                <InputBox icon={Globe} value={form.heroBackground} placeholder="Paste image URL…"
                          onChange={e => set('heroBackground', e.target.value)} />
              </div>
            </Field>
            <Field label="Cover / Logo Image">
              <div className="space-y-2">
                <ImageCell src={form.coverImage} label="Cover" uploading={uploading === 'cover'}
                           onFile={e => { const f = e.target.files[0]; if (!f) return; uploadImage(f, url => set('coverImage', url)); }} />
                <InputBox icon={Globe} value={form.coverImage} placeholder="Paste image URL…"
                          onChange={e => set('coverImage', e.target.value)} />
              </div>
            </Field>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <Field label="Hero Slogan">
              <InputBox value={form.slogan} placeholder="Taste the authentic…"
                        onChange={e => set('slogan', e.target.value)} />
            </Field>
            <Field label="Badge / Subtitle">
              <InputBox value={form.badge} placeholder="Est. 2010 · Award Winning"
                        onChange={e => set('badge', e.target.value)} />
            </Field>
          </div>
        </Section>

        {/* ── 03 ABOUT ── */}
        <Section num={3} icon={null} title="About Section" accent="indigo">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-black text-slate-700">Show About section on website</span>
            <button onClick={() => set('showAbout', !form.showAbout)}
                    className={`w-12 h-6 rounded-full relative transition-all ${form.showAbout ? 'bg-indigo-500' : 'bg-slate-200'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.showAbout ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          {form.showAbout && (
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Field label="About Text">
                  <textarea value={form.aboutText} onChange={e => set('aboutText', e.target.value)}
                            placeholder="Tell your restaurant's story, history, what makes you special…"
                            className="w-full bg-slate-50 rounded-2xl p-4 text-sm font-medium text-slate-800 placeholder-slate-300 outline-none resize-none focus:ring-2 focus:ring-indigo-400/40 transition-all"
                            rows={6} />
                </Field>
              </div>
              <div>
                <Field label="About Image">
                  <ImageCell src={form.aboutImage} label="About" uploading={uploading === 'about'}
                             onFile={e => { const f = e.target.files[0]; if (!f) return; uploadImage(f, url => set('aboutImage', url)); }} />
                  <div className="mt-2">
                    <InputBox icon={Globe} value={form.aboutImage} placeholder="Paste URL…"
                              onChange={e => set('aboutImage', e.target.value)} />
                  </div>
                </Field>
              </div>
            </div>
          )}
        </Section>

        {/* ── 04 CONTACT ── */}
        <Section num={4} icon={Phone} title="Contact & Location" accent="emerald">
          <div className="grid md:grid-cols-2 gap-5">
            <Field label="Phone Number" required error={errors.phone}>
              <InputBox icon={Phone} value={form.contact.phone} error={errors.phone}
                        placeholder="+216 XX XXX XXX"
                        onChange={e => { setNested('contact','phone',e.target.value); clearErr('phone'); }} />
            </Field>
            <Field label="Email">
              <InputBox icon={Mail} value={form.contact.email} placeholder="contact@restaurant.tn"
                        onChange={e => setNested('contact','email',e.target.value)} />
            </Field>
            <Field label="WhatsApp">
              <InputBox icon={Phone} value={form.contact.whatsapp} placeholder="+216 XX XXX XXX"
                        onChange={e => setNested('contact','whatsapp',e.target.value)} />
            </Field>
            <Field label="Website">
              <InputBox icon={Globe} value={form.contact.website} placeholder="https://yoursite.com"
                        onChange={e => setNested('contact','website',e.target.value)} />
            </Field>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            <div className="md:col-span-2">
              <Field label="Street Address">
                <InputBox icon={MapPin} value={form.address.street} placeholder="Street, neighbourhood…"
                          onChange={e => setNested('address','street',e.target.value)} />
              </Field>
            </div>
            <Field label="City" required error={errors.city}>
              <div className={`flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3.5 transition-all ${errors.city ? 'ring-2 ring-rose-400' : 'focus-within:ring-2 focus-within:ring-orange-400/40'}`}>
                <MapPin size={16} className="text-slate-400 shrink-0" />
                <select value={form.address.city} onChange={e => { setNested('address','city',e.target.value); clearErr('city'); }}
                        className="flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none cursor-pointer">
                  <option value="">Select city…</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {errors.city && <p className="text-xs text-rose-500 font-semibold mt-1">{errors.city}</p>}
            </Field>
          </div>

          <Field label="Google Maps Link">
            <InputBox icon={MapPin} value={form.googleMapsLink} placeholder="https://maps.google.com/…"
                      onChange={e => set('googleMapsLink', e.target.value)} />
          </Field>

          {/* Socials */}
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">Social Media</p>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { key: 'instagram', Icon: IGIcon, placeholder: 'https://instagram.com/…', color: 'text-pink-500' },
                { key: 'facebook',  Icon: FBIcon, placeholder: 'https://facebook.com/…',  color: 'text-blue-500' },
                { key: 'tiktok',    Icon: TKIcon, placeholder: 'https://tiktok.com/@…',   color: 'text-slate-900' },
              ].map(({ key, Icon, placeholder, color }) => (
                <div key={key} className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3.5">
                  <Icon size={18} className={`${color} shrink-0`} />
                  <input value={form.socialMedia[key]} placeholder={placeholder}
                         onChange={e => setNested('socialMedia', key, e.target.value)}
                         className="flex-1 bg-transparent text-sm font-semibold text-slate-900 placeholder-slate-300 outline-none" />
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ── 05 OPENING HOURS ── */}
        <Section num={5} icon={Clock} title="Opening Hours" accent="amber">
          <div className="space-y-2">
            {form.openingHours.map((h, idx) => (
              <div key={h.day} className="flex items-center justify-between px-5 py-3.5 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all">
                <span className="w-28 text-[11px] font-black uppercase tracking-widest text-slate-500 capitalize">{h.day}</span>
                <div className="flex items-center gap-4">
                  {!h.isClosed ? (
                    <div className="flex items-center gap-2">
                      <input type="time" value={h.open} onChange={e => handleHourChange(idx,'open',e.target.value)}
                             className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-black outline-none focus:border-orange-400 transition-colors" />
                      <span className="text-slate-300 text-[10px] font-black">–</span>
                      <input type="time" value={h.close} onChange={e => handleHourChange(idx,'close',e.target.value)}
                             className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-black outline-none focus:border-orange-400 transition-colors" />
                    </div>
                  ) : (
                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest w-48 text-center">Closed</span>
                  )}
                  <button onClick={() => handleHourChange(idx,'isClosed',!h.isClosed)}
                          className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${h.isClosed ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : 'bg-rose-100 text-rose-500 hover:bg-rose-200'}`}>
                    {h.isClosed ? 'Open' : 'Close'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button onClick={() => set('showHours', !form.showHours)}
                    className={`w-12 h-6 rounded-full relative transition-all ${form.showHours ? 'bg-amber-500' : 'bg-slate-200'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.showHours ? 'left-7' : 'left-1'}`} />
            </button>
            <span className="text-sm font-bold text-slate-600">Show opening hours section on website</span>
          </div>
        </Section>

        {/* ── 06 GALLERY ── */}
        <Section num={6} icon={Camera} title="Photo Gallery" accent="rose">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => set('showGallery', !form.showGallery)}
                    className={`w-12 h-6 rounded-full relative transition-all ${form.showGallery ? 'bg-rose-500' : 'bg-slate-200'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.showGallery ? 'left-7' : 'left-1'}`} />
            </button>
            <span className="text-sm font-bold text-slate-600">Show gallery section on website</span>
          </div>

          {form.showGallery && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {form.images.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <ImageCell src={img} uploading={uploading === `img-${idx}`}
                               onFile={e => { const f = e.target.files[0]; if (!f) return; uploadImage(f, url => setGalleryUrl(idx, url)); }} />
                    <input value={img} onChange={e => setGalleryUrl(idx, e.target.value)}
                           placeholder="Paste URL…"
                           className="mt-1.5 w-full bg-slate-50 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 placeholder-slate-300 outline-none border border-transparent focus:border-orange-300 transition-colors" />
                    {form.images.length > 1 && (
                      <button onClick={() => setForm(p => ({ ...p, images: p.images.filter((_,i) => i !== idx) }))}
                              className="absolute top-2 right-2 bg-white/90 rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow">
                        <Trash2 size={12} className="text-rose-500" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={addGallerySlot}
                      className="flex items-center gap-2 text-sm font-black text-rose-500 hover:text-rose-600 transition-colors">
                <Plus size={16} /> Add photo slot
              </button>
            </>
          )}
        </Section>

        {/* ── 07 TEMPLATE SETTINGS ── */}
        <Section num={7} icon={Palette} title="Website Appearance" accent="violet" collapsible>
          <div className="grid md:grid-cols-2 gap-5">
            <Field label="CTA Button Text">
              <InputBox value={form.ctaText} placeholder="Reserve a Table"
                        onChange={e => set('ctaText', e.target.value)} />
            </Field>
            <Field label="VIP Button Text">
              <InputBox value={form.vipCtaText} placeholder="Book VIP Table"
                        onChange={e => set('vipCtaText', e.target.value)} />
            </Field>
            <Field label="Discover Button Text">
              <InputBox value={form.discoverText} placeholder="Discover More"
                        onChange={e => set('discoverText', e.target.value)} />
            </Field>
            <Field label="Footer Text">
              <InputBox value={form.footerText} placeholder="© 2026 Your Restaurant. All rights reserved."
                        onChange={e => set('footerText', e.target.value)} />
            </Field>
          </div>

          <Field label="Accent / Primary Color">
            <div className="flex items-center gap-4">
              <input type="color" value={form.primaryColor} onChange={e => set('primaryColor', e.target.value)}
                     className="w-14 h-14 rounded-2xl border-2 border-slate-200 cursor-pointer p-1 bg-white" />
              <div>
                <p className="text-sm font-black text-slate-800">{form.primaryColor}</p>
                <p className="text-xs text-slate-400">Used for buttons, accents, and highlights</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {['#f97316','#ef4444','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ec4899','#64748b'].map(c => (
                  <button key={c} onClick={() => set('primaryColor', c)}
                          className={`w-8 h-8 rounded-xl border-2 transition-all hover:scale-110 ${form.primaryColor === c ? 'border-slate-900 scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </Field>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { key: 'showMenu',    label: 'Show Menu' },
              { key: 'showAbout',   label: 'Show About' },
              { key: 'showGallery', label: 'Show Gallery' },
              { key: 'showHours',   label: 'Show Hours' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                <button onClick={() => set(key, !form[key])}
                        className={`w-10 h-5 rounded-full relative transition-all shrink-0 ${form[key] ? 'bg-violet-500' : 'bg-slate-200'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form[key] ? 'left-5' : 'left-0.5'}`} />
                </button>
                <span className="text-xs font-black text-slate-600">{label}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ── SAVE BUTTON ── */}
        <div className="flex items-center justify-between pt-4 pb-10">
          <button onClick={() => navigate(-1)}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all">
            <ArrowLeft size={15} /> Back
          </button>
          <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-3 px-10 py-4 rounded-2xl text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-orange-500/30 transition-all hover:scale-105 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#f97316,#f59e0b)' }}>
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : saved ? (
              <><CheckCircle2 size={16} /> Changes Saved!</>
            ) : (
              <><Save size={16} /> Save All Changes</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
