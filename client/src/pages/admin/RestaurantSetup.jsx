import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Store, MapPin, Phone, Globe,
  ChevronLeft, ChevronRight, Plus, Trash2, CheckCircle2,
  BookOpen, Camera, Image, ArrowRight, Save, X,
  ToggleLeft, ToggleRight, DollarSign, Edit3,
} from 'lucide-react';

function FacebookIcon({ size = 13 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" /></svg>;
}
function InstagramIcon({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}
import { useAuthStore } from '../../store/authStore';
import { restaurantService } from '../../services/restaurantService';

// ─── Helpers ───────────────────────────────────────────────
const resizeToBase64 = (file, maxW = 1000, quality = 0.8) =>
  new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio = Math.min(maxW / img.width, 1);
      const canvas = document.createElement('canvas');
      canvas.width  = img.width  * ratio;
      canvas.height = img.height * ratio;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = url;
  });

// ─── Constants ─────────────────────────────────────────────
const CITIES = ['Tunis','Sfax','Sousse','Monastir','Bizerte','Gabes','Ariana','Gafsa','Nabeul','Kairouan','Beja','Other'];
const CUISINE_TYPES = ['Tunisian','Mediterranean','Italian','French','Lebanese','Moroccan','Turkish','Asian','American','International','Other'];
const STEPS = [
  { label: 'Basic Info', Icon: Store    },
  { label: 'Menu',       Icon: BookOpen },
  { label: 'About',      Icon: Edit3    },
  { label: 'Gallery',    Icon: Image    },
];

// ─── Step bar ──────────────────────────────────────────────
function StepBar({ current }) {
  return (
    <div className="flex items-center justify-between mb-6">
      {STEPS.map(({ label, Icon }, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={[
                'w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all',
                done   ? 'bg-orange-500 text-white'
                       : active ? 'bg-orange-500 text-white ring-4 ring-orange-500/20'
                                : 'bg-gray-100 dark:bg-white/8 text-gray-400',
              ].join(' ')}>
                {done ? <CheckCircle2 size={15} /> : <Icon size={15} />}
              </div>
              <span className={`text-[9px] mt-1 whitespace-nowrap font-medium ${active || done ? 'text-orange-500' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-5 rounded transition-colors ${done ? 'bg-orange-500' : 'bg-gray-100 dark:bg-white/8'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Reusable field ────────────────────────────────────────
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
    <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 focus-within:border-orange-400 transition-colors">
      {Icon && <Icon size={13} className="text-gray-400 shrink-0" />}
      <input className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none" {...props} />
    </div>
  );
}

// ─── Image upload ──────────────────────────────────────────
function ImageUpload({ value, onChange, className = '', label, hint }) {
  const ref = useRef();
  const handle = async (file) => {
    if (!file) return;
    onChange(await resizeToBase64(file, 1200, 0.82));
  };
  return (
    <button
      type="button"
      onClick={() => ref.current?.click()}
      className={`relative overflow-hidden rounded-2xl border-2 transition-all group ${className} ${value ? 'border-orange-300 dark:border-orange-500/30' : 'border-dashed border-gray-200 dark:border-white/10 hover:border-orange-300 dark:hover:border-orange-500/30'}`}
    >
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => handle(e.target.files?.[0])} />
      {value ? (
        <>
          <img src={value} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-xs font-semibold px-3 py-1.5 bg-black/50 rounded-lg">Click to change</span>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-50 dark:bg-white/3">
          <Camera size={22} className="text-gray-400" />
          <div className="text-center">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{label || 'Upload photo'}</p>
            {hint && <p className="text-[10px] text-gray-400 mt-0.5">{hint}</p>}
          </div>
        </div>
      )}
    </button>
  );
}

// ─── Step 1: Basic Info ────────────────────────────────────
function BasicInfoStep({ data, onChange }) {
  const set    = k => e => onChange({ ...data, [k]: e.target.value });
  const social = k => e => onChange({ ...data, socialMedia: { ...data.socialMedia, [k]: e.target.value } });

  return (
    <div className="space-y-5">
      <Field label="Cover Photo">
        <ImageUpload
          value={data.coverImage}
          onChange={v => onChange({ ...data, coverImage: v })}
          className="w-full h-40"
          label="Upload cover photo"
          hint="Recommended: 1200 × 400 px"
        />
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Restaurant Name" required>
          <TextInput icon={Store} value={data.name} onChange={set('name')} placeholder="e.g. Le Jasmin" required />
        </Field>

        <Field label="Cuisine Type" required>
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 focus-within:border-orange-400 transition-colors">
            <BookOpen size={13} className="text-gray-400 shrink-0" />
            <select value={data.cuisine} onChange={set('cuisine')} className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white outline-none cursor-pointer">
              <option value="">Select cuisine…</option>
              {CUISINE_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </Field>

        <Field label="City" required>
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 focus-within:border-orange-400 transition-colors">
            <MapPin size={13} className="text-gray-400 shrink-0" />
            <select value={data.city} onChange={set('city')} className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white outline-none cursor-pointer">
              <option value="">Select city…</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </Field>

        <Field label="Phone Number">
          <TextInput icon={Phone} type="tel" value={data.phone} onChange={set('phone')} placeholder="+216 XX XXX XXX" />
        </Field>
      </div>

      <Field label="Street Address">
        <TextInput icon={MapPin} value={data.address} onChange={set('address')} placeholder="Street, district" />
      </Field>

      <Field label="Google Maps Link">
        <TextInput icon={Globe} value={data.googleMapsLink} onChange={set('googleMapsLink')} placeholder="https://maps.google.com/..." />
      </Field>

      <div>
        <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Social Media (optional)</p>
        <div className="space-y-3">
          {[
            { k: 'facebook',  label: 'Facebook',  Icon: FacebookIcon,  ph: 'https://facebook.com/yourpage' },
            { k: 'instagram', label: 'Instagram',  Icon: InstagramIcon, ph: 'https://instagram.com/yourpage' },
            { k: 'tiktok',    label: 'TikTok',     Icon: Globe,     ph: 'https://tiktok.com/@yourpage' },
          ].map(({ k, label, Icon, ph }) => (
            <div key={k} className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 focus-within:border-orange-400 transition-colors">
              <Icon size={13} className="text-gray-400 shrink-0" />
              <span className="text-xs text-gray-400 w-16 shrink-0">{label}</span>
              <input
                type="url"
                value={data.socialMedia?.[k] ?? ''}
                onChange={social(k)}
                placeholder={ph}
                className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Menu Builder ──────────────────────────────────
function MenuStep({ menu, onChange }) {
  const [newCat,   setNewCat]   = useState('');
  const [addingTo, setAddingTo] = useState(null); // catIdx
  const [newItem,  setNewItem]  = useState({ name: '', price: '', description: '', available: true });

  const addCategory = () => {
    if (!newCat.trim()) return;
    onChange([...menu, { category: newCat.trim(), items: [] }]);
    setNewCat('');
  };

  const removeCategory = i => onChange(menu.filter((_, idx) => idx !== i));

  const confirmAddItem = (catIdx) => {
    if (!newItem.name.trim() || !newItem.price) {
      toast.error('Item name and price are required');
      return;
    }
    const updated = [...menu];
    updated[catIdx] = {
      ...updated[catIdx],
      items: [...updated[catIdx].items, { ...newItem, price: parseFloat(newItem.price) }],
    };
    onChange(updated);
    setNewItem({ name: '', price: '', description: '', available: true });
    setAddingTo(null);
  };

  const removeItem = (catIdx, itemIdx) => {
    const updated = [...menu];
    updated[catIdx].items = updated[catIdx].items.filter((_, i) => i !== itemIdx);
    onChange(updated);
  };

  const toggleItem = (catIdx, itemIdx) => {
    const updated = [...menu];
    updated[catIdx].items[itemIdx] = {
      ...updated[catIdx].items[itemIdx],
      available: !updated[catIdx].items[itemIdx].available,
    };
    onChange(updated);
  };

  const handleItemImage = async (file, catIdx, itemIdx) => {
    const b64 = await resizeToBase64(file, 500, 0.75);
    const updated = [...menu];
    updated[catIdx].items[itemIdx] = { ...updated[catIdx].items[itemIdx], image: b64 };
    onChange(updated);
  };

  return (
    <div className="space-y-5">
      <p className="text-xs text-gray-400">Build your menu with categories and items. Customers will see this on your public page.</p>

      {/* Add category */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 focus-within:border-orange-400 transition-colors">
          <BookOpen size={13} className="text-gray-400 shrink-0" />
          <input
            value={newCat}
            onChange={e => setNewCat(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCategory())}
            placeholder="Category name (e.g. Starters, Mains, Desserts…)"
            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none"
          />
        </div>
        <button
          type="button"
          onClick={addCategory}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors shrink-0"
        >
          <Plus size={15} /> Add
        </button>
      </div>

      {menu.length === 0 && (
        <div className="py-10 text-center border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl">
          <BookOpen size={24} className="mx-auto text-gray-300 dark:text-white/10 mb-2" />
          <p className="text-sm text-gray-400">No categories yet — add one above</p>
        </div>
      )}

      {/* Categories */}
      {menu.map((cat, catIdx) => (
        <div key={catIdx} className="border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-white/4 border-b border-gray-200 dark:border-white/10">
            <BookOpen size={14} className="text-orange-500 shrink-0" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white flex-1">{cat.category}</span>
            <span className="text-xs text-gray-400 mr-2">{cat.items.length} item{cat.items.length !== 1 ? 's' : ''}</span>
            <button type="button" onClick={() => removeCategory(catIdx)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
              <Trash2 size={13} />
            </button>
          </div>

          {/* Items */}
          {cat.items.length > 0 && (
            <div className="divide-y divide-gray-100 dark:divide-white/5">
              {cat.items.map((item, itemIdx) => (
                <div key={itemIdx} className="flex items-center gap-3 px-4 py-3">
                  {/* Item image */}
                  <label className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-white/8 shrink-0 cursor-pointer border border-gray-200 dark:border-white/10">
                    {item.image
                      ? <img src={item.image} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Camera size={12} className="text-gray-400" /></div>
                    }
                    <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleItemImage(e.target.files[0], catIdx, itemIdx)} />
                  </label>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                    {item.description && <p className="text-xs text-gray-400 truncate">{item.description}</p>}
                  </div>
                  <span className="text-sm font-bold text-orange-500 shrink-0 mr-1">{item.price} TND</span>
                  <button type="button" onClick={() => toggleItem(catIdx, itemIdx)} className="shrink-0">
                    {item.available
                      ? <ToggleRight size={22} className="text-emerald-500" />
                      : <ToggleLeft  size={22} className="text-gray-300 dark:text-white/20" />
                    }
                  </button>
                  <button type="button" onClick={() => removeItem(catIdx, itemIdx)} className="shrink-0 p-1 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add item inline form */}
          {addingTo === catIdx ? (
            <div className="p-4 bg-orange-50 dark:bg-orange-500/5 border-t border-orange-200 dark:border-orange-500/20 space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <input
                  value={newItem.name}
                  onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))}
                  placeholder="Item name *"
                  className="bg-white dark:bg-white/8 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400 transition-colors text-gray-900 dark:text-white placeholder-gray-400"
                />
                <div className="flex items-center gap-2 bg-white dark:bg-white/8 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 focus-within:border-orange-400 transition-colors">
                  <DollarSign size={12} className="text-gray-400 shrink-0" />
                  <input
                    type="number" min="0" step="0.5"
                    value={newItem.price}
                    onChange={e => setNewItem(p => ({ ...p, price: e.target.value }))}
                    placeholder="Price (TND) *"
                    className="flex-1 bg-transparent text-sm outline-none text-gray-900 dark:text-white placeholder-gray-400"
                  />
                </div>
              </div>
              <input
                value={newItem.description}
                onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))}
                placeholder="Description (optional)"
                className="w-full bg-white dark:bg-white/8 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400 transition-colors text-gray-900 dark:text-white placeholder-gray-400"
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => confirmAddItem(catIdx)} className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition-colors">
                  <Plus size={13} /> Add Item
                </button>
                <button type="button" onClick={() => { setAddingTo(null); setNewItem({ name: '', price: '', description: '', available: true }); }} className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingTo(catIdx)}
              className="flex items-center gap-2 px-4 py-3 w-full text-xs font-medium text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/5 transition-colors border-t border-gray-100 dark:border-white/5"
            >
              <Plus size={13} /> Add item to {cat.category}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Step 3: About ─────────────────────────────────────────
function AboutStep({ data, onChange }) {
  return (
    <div className="space-y-5">
      <p className="text-xs text-gray-400">Tell customers your story — this appears prominently on your public page.</p>

      <Field label="About Photo">
        <ImageUpload
          value={data.image}
          onChange={v => onChange({ ...data, image: v })}
          className="w-full h-52"
          label="Upload a restaurant photo"
          hint="Interior, team photo, or signature dish"
        />
      </Field>

      <Field label="About Text" required>
        <textarea
          rows={6}
          value={data.text}
          onChange={e => onChange({ ...data, text: e.target.value })}
          placeholder="Describe your restaurant, cuisine style, ambiance, and what makes it unique…"
          className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-orange-400 transition-colors resize-none"
        />
      </Field>
    </div>
  );
}

// ─── Step 4: Gallery ───────────────────────────────────────
function GalleryStep({ gallery, onChange }) {
  const ref = useRef();
  const MAX = 8;

  const addImages = async (files) => {
    const remaining = MAX - gallery.length;
    const toProcess = Array.from(files).slice(0, remaining);
    const b64s = await Promise.all(toProcess.map(f => resizeToBase64(f, 900, 0.78)));
    onChange([...gallery, ...b64s]);
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400">Add up to {MAX} photos to showcase your restaurant to customers.</p>

      {gallery.length < MAX && (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="w-full border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-orange-300 dark:hover:border-orange-500/30 rounded-2xl py-10 transition-colors flex flex-col items-center gap-2"
        >
          <input ref={ref} type="file" accept="image/*" multiple className="hidden" onChange={e => addImages(e.target.files)} />
          <Camera size={26} className="text-gray-400" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Click to upload photos</p>
          <p className="text-xs text-gray-400">{gallery.length}/{MAX} uploaded · JPG, PNG</p>
        </button>
      )}

      {gallery.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {gallery.map((img, i) => (
            <div key={i} className="relative aspect-video rounded-xl overflow-hidden group">
              <img src={img} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(gallery.filter((_, idx) => idx !== i))}
                className="absolute top-2 right-2 w-7 h-7 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
              >
                <X size={12} className="text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {gallery.length === 0 && (
        <p className="text-center text-xs text-gray-400 py-4">No photos uploaded yet</p>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────
export default function RestaurantSetup() {
  const { user, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  const [basics, setBasics] = useState({
    name: '', cuisine: '', city: '', address: '', phone: user?.phone ?? '',
    googleMapsLink: '', coverImage: null,
    socialMedia: { facebook: '', instagram: '', tiktok: '' },
  });
  const [menu,    setMenu]    = useState([]);
  const [about,   setAbout]   = useState({ text: '', image: null });
  const [gallery, setGallery] = useState([]);

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: data => restaurantService.upsertSetup(data),
    onSuccess: ({ data: restaurant }) => {
      if (restaurant?._id) updateUser({ ...user, restaurant: restaurant._id });
      setDone(true);
      toast.success('Restaurant profile saved!');
    },
    onError: err => toast.error(err?.response?.data?.message || 'Save failed — please try again.'),
  });

  const handleSubmit = () => {
    if (!basics.name.trim() || !basics.cuisine || !basics.city) {
      toast.error('Restaurant name, cuisine, and city are required');
      setStep(0);
      return;
    }
    save({
      name:           basics.name,
      cuisine:        [basics.cuisine],
      address:        { city: basics.city, street: basics.address, country: 'Tunisia' },
      contact:        { phone: basics.phone },
      googleMapsLink: basics.googleMapsLink,
      coverImage:     basics.coverImage,
      socialMedia:    basics.socialMedia,
      menu,
      about,
      images:         gallery,
    });
  };

  const canNext = () => {
    if (step === 0) return basics.name.trim() && basics.cuisine && basics.city;
    return true;
  };

  if (done) {
    return (
      <div className="p-5 sm:p-6 max-w-2xl">
        <div className="bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/6 rounded-2xl p-10 shadow-sm text-center">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Restaurant Profile Saved!</h2>
          <p className="text-sm text-gray-400 mt-2 max-w-xs mx-auto leading-relaxed">
            Your profile is complete and will be reviewed with your KYC documents. Your restaurant page is now live.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setDone(false)}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              Edit Profile
            </button>
            <button
              onClick={() => navigate('/admin/kyc')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors shadow-sm shadow-orange-500/20"
            >
              Back to KYC <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Restaurant Setup</h1>
        <p className="text-xs text-gray-400 mt-0.5">Set up your restaurant's public profile</p>
      </div>

      <div className="bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/6 rounded-2xl p-5 shadow-sm">
        <StepBar current={step} />

        {step === 0 && <BasicInfoStep data={basics} onChange={setBasics} />}
        {step === 1 && <MenuStep menu={menu} onChange={setMenu} />}
        {step === 2 && <AboutStep data={about} onChange={setAbout} />}
        {step === 3 && <GalleryStep gallery={gallery} onChange={setGallery} />}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-100 dark:border-white/6">
          <button
            type="button"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} /> Back
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={() => {
                if (!canNext()) { toast.error('Please fill the required fields'); return; }
                setStep(s => s + 1);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-orange-500/20"
            >
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-orange-500/20"
            >
              <Save size={15} />
              {saving ? 'Saving…' : 'Save & Publish'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
