import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Save, ArrowLeft, Eye, EyeOff, Upload, Globe, Mail, Clock,
  Phone, Sparkles, Plus, Trash2, MapPin, Camera, X, AlertCircle,
  CalendarRange, Palette, CheckCircle2, ChevronRight,
} from 'lucide-react';
import { restaurantService } from '../../services/restaurantService';

import TemplateClassic  from '../public/templates/TemplateClassic';
import TemplateModern   from '../public/templates/TemplateModern';
import TemplateVivid    from '../public/templates/TemplateVivid';
import TemplatePrestige from '../public/templates/TemplatePrestige';

const TEMPLATE_MAP = {
  classic:  { Component: TemplateClassic,  name: 'Classic',  accentColor: '#f97316' },
  modern:   { Component: TemplateModern,   name: 'Modern',   accentColor: '#6366f1' },
  vivid:    { Component: TemplateVivid,    name: 'Vivid',    accentColor: '#ec4899' },
  prestige: { Component: TemplatePrestige, name: 'Prestige', accentColor: '#d97706' },
};

function IGIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  );
}
function FBIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  );
}
function TKIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
    </svg>
  );
}

const resizeToBase64 = (file, maxW = 1400, q = 0.85) =>
  new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio  = Math.min(maxW / img.width, 1);
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width  * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', q));
    };
    img.src = url;
  });

const DAYS_ORDER = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const DEFAULT_HOURS = DAYS_ORDER.map(day => ({
  day, open: '09:00', close: '22:00', isClosed: day === 'sunday',
}));

const COLOR_PRESETS = ['#f97316','#ef4444','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ec4899','#3b82f6'];

const errStyle = (errors, field) =>
  errors.includes(field) ? 'border-2 border-rose-500 ring-4 ring-rose-500/10 animate-pulse' : '';

const SHAKE_CSS = `
@keyframes shake {
  0%,100% { transform:translateX(0); }
  25%      { transform:translateX(-5px); }
  75%      { transform:translateX(5px); }
}
.shake { animation: shake 0.25s ease 0s 2; }
`;

// ── Reusable field wrappers ───────────────────────────────────────────────────
function FieldInput({ label, value, onChange, placeholder, error, type = 'text', className = '' }) {
  return (
    <div className="space-y-2">
      {label && <label className="text-[11px] font-black uppercase text-muted-color">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full p-5 bg-elevated rounded-2xl font-bold outline-none text-primary-color placeholder-gray-400 dark:placeholder-gray-600 transition-all ${error || ''} ${className}`}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function ThemeCustomize() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const qc        = useQueryClient();

  const themeId   = location.state?.themeId ?? 'classic';
  const tplMeta   = TEMPLATE_MAP[themeId] ?? TEMPLATE_MAP.classic;
  const PreviewComp = tplMeta.Component;

  const [showPreview,    setShowPreview]    = useState(false);
  const [uploadingField, setUploadingField] = useState(null);
  const [validationErrors, setVE]          = useState([]);
  const [saved,          setSaved]          = useState(false);

  const heroRef    = useRef(null);
  const coverRef   = useRef(null);
  const aboutRef   = useRef(null);
  const galleryRefs = useRef([]);

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: restaurant } = useQuery({
    queryKey: ['my-restaurant'],
    queryFn: () => restaurantService.getMine().then(r => r.data?.data ?? r.data),
    staleTime: 0,
  });

  const [d, setD] = useState(null);

  useEffect(() => {
    if (!restaurant) return;
    const r = restaurant;
    setD({
      name:        r.name        ?? '',
      description: r.description ?? '',
      cuisine:     (r.cuisine    ?? []).join(', '),
      isHalal:     r.isHalal     ?? false,

      heroBackground: r.template?.heroBackground ?? r.coverImage ?? '',
      coverImage:     r.coverImage ?? '',
      slogan:         r.template?.slogan ?? '',
      badge:          r.template?.badge  ?? '',

      aboutShow:  r.template?.showAbout  ?? true,
      aboutTitle: r.about?.text ? 'Our Story' : 'Our Story',
      aboutText:  r.about?.text ?? '',
      aboutImage: r.about?.image ?? '',

      galleryShow:   r.template?.showGallery ?? true,
      galleryImages: r.images?.length
        ? [...r.images, ...Array(Math.max(0, 6 - r.images.length)).fill('')]
        : Array(6).fill(''),

      phone:     r.contact?.phone     ?? '',
      email:     r.contact?.email     ?? '',
      whatsapp:  r.contact?.whatsapp  ?? '',
      website:   r.contact?.website   ?? '',
      street:    r.address?.street    ?? '',
      city:      r.address?.city      ?? '',
      googleMapsLink: r.googleMapsLink ?? '',
      instagram:  r.socialMedia?.instagram ?? '',
      facebook:   r.socialMedia?.facebook  ?? '',
      tiktok:     r.socialMedia?.tiktok    ?? '',

      openingHours: r.openingHours?.length ? r.openingHours : DEFAULT_HOURS,
      showHours:    r.template?.showHours ?? false,

      primaryColor: r.template?.primaryColor  ?? '#f97316',
      ctaText:      r.template?.ctaText       ?? 'Reserve a Table',
      vipCtaText:   r.template?.vipCtaText    ?? 'Book VIP Table',
      discoverText: r.template?.discoverText  ?? 'Discover More',
      footerText:   r.template?.footerText    ?? '',
      showMenu:     r.template?.showMenu      ?? true,

      seasonalHours: r.seasonalHours ?? [],
    });
  }, [restaurant]);

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: payload => restaurantService.update(payload),
    onSuccess: () => {
      qc.invalidateQueries(['my-restaurant']);
      setSaved(true);
      toast.success('Website updated!');
      setTimeout(() => setSaved(false), 3500);
    },
    onError: err => toast.error(err?.response?.data?.message ?? 'Save failed'),
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  const set    = (key, val) => setD(p => ({ ...p, [key]: val }));
  const setHour = (idx, field, val) => setD(p => {
    const hours = [...p.openingHours];
    hours[idx] = { ...hours[idx], [field]: val };
    return { ...p, openingHours: hours };
  });
  const setGallery = (idx, val) => setD(p => {
    const imgs = [...p.galleryImages];
    imgs[idx] = val;
    return { ...p, galleryImages: imgs };
  });
  const clearErr = field => setVE(p => p.filter(e => e !== field));

  const handleUpload = async (file, field) => {
    if (!file) return;
    setUploadingField(field);
    try {
      const base64 = await resizeToBase64(file, 1600, 0.85);
      set(field, base64);
      clearErr(field);
    } finally { setUploadingField(null); }
  };

  const handleGalleryUpload = async (file, idx) => {
    if (!file) return;
    const key = `gallery-${idx}`;
    setUploadingField(key);
    try {
      const base64 = await resizeToBase64(file, 1200, 0.82);
      setGallery(idx, base64);
    } finally { setUploadingField(null); }
  };

  const setSeasonal = (idx, field, val) => setD(p => {
    const next = [...p.seasonalHours];
    next[idx] = { ...next[idx], [field]: val };
    return { ...p, seasonalHours: next };
  });

  // ── Preview data ──────────────────────────────────────────────────────────
  const previewData = d && restaurant ? {
    ...restaurant,
    name:        d.name,
    description: d.description,
    cuisine:     d.cuisine.split(',').map(s => s.trim()).filter(Boolean),
    isHalal:     d.isHalal,
    coverImage:  d.coverImage,
    images:      d.galleryImages.filter(Boolean),
    about:       { text: d.aboutText, image: d.aboutImage },
    contact: { phone: d.phone, email: d.email, whatsapp: d.whatsapp, website: d.website },
    address:     { street: d.street, city: d.city },
    googleMapsLink: d.googleMapsLink,
    socialMedia: { instagram: d.instagram, facebook: d.facebook, tiktok: d.tiktok },
    openingHours: d.openingHours,
    template: {
      ...restaurant.template,
      id:             themeId,
      heroBackground: d.heroBackground,
      slogan:         d.slogan,
      badge:          d.badge,
      primaryColor:   d.primaryColor,
      ctaText:        d.ctaText,
      vipCtaText:     d.vipCtaText,
      discoverText:   d.discoverText,
      footerText:     d.footerText,
      showMenu:       d.showMenu,
      showGallery:    d.galleryShow,
      showAbout:      d.aboutShow,
      showHours:      d.showHours,
    },
    heroBackground: d.heroBackground,
    slogan:         d.slogan,
    badge:          d.badge,
    primaryColor:   d.primaryColor,
    ctaText:        d.ctaText,
    vipCtaText:     d.vipCtaText,
    discoverText:   d.discoverText,
    footerText:     d.footerText,
    showMenu:       d.showMenu,
    showGallery:    d.galleryShow,
    showAbout:      d.aboutShow,
    showHours:      d.showHours,
  } : null;

  // ── Validate & save ───────────────────────────────────────────────────────
  const handleSave = () => {
    const errs = [];
    if (!d.name?.trim())  errs.push('name');
    if (!d.phone?.trim()) errs.push('phone');
    if (errs.length) {
      setVE(errs);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const payload = {
      name:        d.name.trim(),
      description: d.description,
      cuisine:     d.cuisine.split(',').map(s => s.trim()).filter(Boolean),
      isHalal:     d.isHalal,
      coverImage:  d.coverImage,
      images:      d.galleryImages.filter(Boolean),
      googleMapsLink: d.googleMapsLink,
      about:       { text: d.aboutText, image: d.aboutImage },
      contact:     { phone: d.phone, email: d.email, whatsapp: d.whatsapp, website: d.website },
      address:     { street: d.street, city: d.city, country: 'Tunisia' },
      socialMedia: { instagram: d.instagram, facebook: d.facebook, tiktok: d.tiktok },
      openingHours: d.openingHours,
      seasonalHours: d.seasonalHours,
      template: {
        ...(restaurant?.template ?? {}),
        id:             themeId,
        heroBackground: d.heroBackground,
        slogan:         d.slogan,
        badge:          d.badge,
        primaryColor:   d.primaryColor,
        ctaText:        d.ctaText,
        vipCtaText:     d.vipCtaText,
        discoverText:   d.discoverText,
        footerText:     d.footerText,
        showMenu:       d.showMenu,
        showGallery:    d.galleryShow,
        showAbout:      d.aboutShow,
        showHours:      d.showHours,
      },
    };
    save(payload);
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (!d) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-[3px] border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-black uppercase tracking-widest text-muted-color">Loading your data…</p>
        </div>
      </div>
    );
  }

  // ── Save button shared style ──────────────────────────────────────────────
  const saveBtnCls = `flex items-center gap-2.5 px-7 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition-all hover:scale-105 disabled:opacity-60 ${
    saved ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20'
  }`;

  return (
    <div className="min-h-screen bg-base transition-theme">
      <style>{SHAKE_CSS}</style>

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-[60] bg-surface/90 backdrop-blur-xl border-b border-base px-6 md:px-10 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <button
            onClick={() => navigate('/admin/themes')}
            className="p-2.5 hover:bg-elevated rounded-2xl transition-all"
          >
            <ArrowLeft size={20} className="text-secondary-color" />
          </button>
          <div>
            <h1 className="text-sm font-black uppercase tracking-[0.18em] text-primary-color">Website Builder</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Sparkles size={11} className="text-orange-500" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">{tplMeta.name} Theme</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-2.5 bg-surface border border-base px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-secondary-color hover:border-orange-500 hover:text-orange-500 transition-all"
          >
            <Eye size={15} /> Live Preview
          </button>
          <button onClick={handleSave} disabled={isSaving} className={saveBtnCls}>
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : saved ? (
              <><CheckCircle2 size={15} /> Saved!</>
            ) : (
              <><Save size={15} /> Save & Publish</>
            )}
          </button>
        </div>
      </nav>

      {/* ── FORM ── */}
      <div className="max-w-5xl mx-auto py-14 px-4 md:px-8 space-y-10">

        {/* 01 — BRANDING & HERO */}
        <section className="bg-surface rounded-[3rem] p-10 md:p-12 shadow-base border border-base space-y-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center font-black text-sm">01</div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-primary-color">Branding & Hero</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-7">
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-muted-color">Restaurant Name *</label>
              <input
                value={d.name}
                onChange={e => { set('name', e.target.value); clearErr('name'); }}
                className={`w-full p-5 bg-elevated rounded-2xl font-bold outline-none text-primary-color placeholder-gray-400 dark:placeholder-gray-600 transition-all ${errStyle(validationErrors,'name')}`}
                placeholder="Le Jasmin"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-muted-color">Cuisine Types</label>
              <input
                value={d.cuisine}
                onChange={e => set('cuisine', e.target.value)}
                className="w-full p-5 bg-elevated rounded-2xl font-bold outline-none text-primary-color placeholder-gray-400 dark:placeholder-gray-600"
                placeholder="Tunisian, Mediterranean, Grill"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-muted-color">Hero Slogan</label>
              <input
                value={d.slogan}
                onChange={e => set('slogan', e.target.value)}
                className="w-full p-5 bg-elevated rounded-2xl font-bold outline-none text-primary-color placeholder-gray-400 dark:placeholder-gray-600"
                placeholder="Taste the authentic…"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-muted-color">Badge / Subtitle</label>
              <input
                value={d.badge}
                onChange={e => set('badge', e.target.value)}
                className="w-full p-5 bg-elevated rounded-2xl font-bold outline-none text-primary-color placeholder-gray-400 dark:placeholder-gray-600"
                placeholder="Est. 2010 · Award Winning"
              />
            </div>
          </div>

          {/* Hero background */}
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase text-muted-color">Hero Background Image</label>
            <div className={`flex gap-3 p-2 bg-elevated rounded-2xl transition-all ${errStyle(validationErrors,'heroBackground')}`}>
              <input
                value={d.heroBackground}
                onChange={e => set('heroBackground', e.target.value)}
                className="flex-1 p-3 bg-transparent text-xs font-medium outline-none text-primary-color placeholder-gray-400 dark:placeholder-gray-600"
                placeholder="Paste URL or upload…"
              />
              <button
                onClick={() => heroRef.current?.click()}
                className="bg-gray-900 dark:bg-white/10 hover:bg-orange-500 dark:hover:bg-orange-500 text-white px-6 py-2 rounded-xl transition-all flex items-center gap-2 text-xs font-black"
              >
                {uploadingField === 'heroBackground'
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Upload size={16}/>}
                Upload
              </button>
              <input type="file" accept="image/*" ref={heroRef} className="hidden"
                     onChange={e => handleUpload(e.target.files[0], 'heroBackground')} />
            </div>
            {d.heroBackground && (
              <div className="relative rounded-2xl overflow-hidden aspect-video mt-2 group">
                <img src={d.heroBackground} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => set('heroBackground', '')}
                  className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={13} />
                </button>
              </div>
            )}
          </div>

          {/* Cover image */}
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase text-muted-color">Cover / Logo Image</label>
            <div className="flex gap-3 p-2 bg-elevated rounded-2xl">
              <input
                value={d.coverImage}
                onChange={e => set('coverImage', e.target.value)}
                className="flex-1 p-3 bg-transparent text-xs font-medium outline-none text-primary-color placeholder-gray-400 dark:placeholder-gray-600"
                placeholder="Paste URL or upload…"
              />
              <button
                onClick={() => coverRef.current?.click()}
                className="bg-gray-900 dark:bg-white/10 hover:bg-orange-500 dark:hover:bg-orange-500 text-white px-6 py-2 rounded-xl transition-all flex items-center gap-2 text-xs font-black"
              >
                {uploadingField === 'coverImage'
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Upload size={16}/>}
                Upload
              </button>
              <input type="file" accept="image/*" ref={coverRef} className="hidden"
                     onChange={e => handleUpload(e.target.files[0], 'coverImage')} />
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
            <button
              onClick={() => set('isHalal', !d.isHalal)}
              className={`w-12 h-6 rounded-full relative transition-all shrink-0 ${d.isHalal ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-white/15'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${d.isHalal ? 'left-7' : 'left-1'}`} />
            </button>
            <div>
              <p className="text-sm font-black text-primary-color">Halal Certified</p>
              <p className="text-xs text-muted-color">Display a Halal badge on your page</p>
            </div>
          </div>
        </section>

        {/* 02 — ABOUT / OUR STORY */}
        <section className={`bg-surface rounded-[3rem] p-10 md:p-12 shadow-base border border-base space-y-10 transition-all ${!d.aboutShow ? 'opacity-50' : ''}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center font-black text-sm">02</div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-primary-color">Our Story</h2>
            </div>
            <button
              onClick={() => set('aboutShow', !d.aboutShow)}
              className={`p-3 rounded-xl transition-all ${d.aboutShow ? 'bg-orange-500 text-white' : 'bg-elevated text-muted-color hover:bg-elevated'}`}
            >
              {d.aboutShow ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>

          {d.aboutShow && (
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-5">
                <input
                  value={d.aboutTitle}
                  onChange={e => set('aboutTitle', e.target.value)}
                  className="w-full p-5 bg-elevated rounded-2xl font-bold outline-none text-primary-color placeholder-gray-400 dark:placeholder-gray-600"
                  placeholder="About Title — e.g. Our Story"
                />
                <textarea
                  value={d.aboutText}
                  onChange={e => set('aboutText', e.target.value)}
                  rows={6}
                  className="w-full p-5 bg-elevated rounded-2xl text-sm font-medium outline-none resize-none text-primary-color placeholder-gray-400 dark:placeholder-gray-600"
                  placeholder="Tell your restaurant's story, history, and what makes you special…"
                />
              </div>
              <div className="flex flex-col gap-3">
                <label className="text-[11px] font-black uppercase text-muted-color">About Image</label>
                <div
                  onClick={() => aboutRef.current?.click()}
                  className="relative flex-1 min-h-[200px] border-2 border-dashed border-base rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:bg-elevated hover:border-orange-400 overflow-hidden transition-all"
                >
                  {d.aboutImage
                    ? <img src={d.aboutImage} className="absolute inset-0 w-full h-full object-cover" alt="" />
                    : <div className="flex flex-col items-center gap-2 text-muted-color"><Camera size={32} /><span className="text-xs font-black uppercase tracking-widest">Upload</span></div>
                  }
                  {uploadingField === 'aboutImage' && (
                    <div className="absolute inset-0 bg-surface/70 flex items-center justify-center">
                      <div className="w-8 h-8 border-[3px] border-orange-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  <input type="file" accept="image/*" ref={aboutRef} className="hidden"
                         onChange={e => handleUpload(e.target.files[0], 'aboutImage')} />
                </div>
                {d.aboutImage && (
                  <button onClick={() => set('aboutImage', '')} className="text-xs text-rose-400 hover:text-rose-600 font-bold transition-colors">Remove image</button>
                )}
              </div>
            </div>
          )}
        </section>

        {/* 03 — GALLERY */}
        <section className={`bg-surface rounded-[3rem] p-10 md:p-12 shadow-base border border-base space-y-10 transition-all ${!d.galleryShow ? 'opacity-50' : ''}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center font-black text-sm">03</div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-primary-color">Gallery Showcase</h2>
            </div>
            <button
              onClick={() => set('galleryShow', !d.galleryShow)}
              className={`p-3 rounded-xl transition-all ${d.galleryShow ? 'bg-orange-500 text-white' : 'bg-elevated text-muted-color'}`}
            >
              {d.galleryShow ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>

          {d.galleryShow && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                {d.galleryImages.map((img, idx) => (
                  <div key={idx} className="group relative aspect-square bg-elevated rounded-[2rem] border-2 border-dashed border-base overflow-hidden flex items-center justify-center">
                    {img
                      ? <img src={img} className="absolute inset-0 w-full h-full object-cover" alt="" />
                      : <Camera className="text-muted-color" size={32} />
                    }
                    {uploadingField === `gallery-${idx}` && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <label className="cursor-pointer bg-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform">
                        <Upload size={15} className="text-gray-800" />
                        <input type="file" accept="image/*" className="hidden"
                               ref={el => galleryRefs.current[idx] = el}
                               onChange={e => handleGalleryUpload(e.target.files[0], idx)} />
                      </label>
                      {img && (
                        <button
                          onClick={() => setGallery(idx, '')}
                          className="bg-red-500 text-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setD(p => ({ ...p, galleryImages: [...p.galleryImages, ''] }))}
                className="flex items-center gap-2 text-sm font-black text-orange-500 hover:text-orange-600 transition-colors"
              >
                <Plus size={16} /> Add photo slot
              </button>
            </>
          )}
        </section>

        {/* 04 — CONTACT & SOCIALS */}
        <section className="bg-surface rounded-[3rem] p-10 md:p-12 shadow-base border border-base space-y-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center font-black text-sm">04</div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-primary-color">Contact & Socials</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              {[
                { key:'phone',          Icon:Phone,  ph:'Phone Number *',   err:true  },
                { key:'email',          Icon:Mail,   ph:'Business Email',   err:false },
                { key:'whatsapp',       Icon:Phone,  ph:'WhatsApp Number',  err:false },
                { key:'website',        Icon:Globe,  ph:'Website URL',      err:false },
                { key:'street',         Icon:MapPin, ph:'Street Address',   err:false },
                { key:'city',           Icon:MapPin, ph:'City',             err:false },
                { key:'googleMapsLink', Icon:MapPin, ph:'Google Maps Link', err:false },
              ].map(({ key, Icon, ph, err }) => (
                <div key={key} className={`flex items-center gap-4 bg-elevated rounded-2xl p-2 pr-5 transition-all ${err && errStyle(validationErrors, key)}`}>
                  <div className="w-12 h-12 bg-surface rounded-xl flex items-center justify-center text-muted-color shadow-base-sm shrink-0 border border-base">
                    <Icon size={18} />
                  </div>
                  <input
                    value={d[key]}
                    onChange={e => { set(key, e.target.value); if (err) clearErr(key); }}
                    className="flex-1 bg-transparent font-bold text-sm outline-none text-primary-color placeholder-gray-400 dark:placeholder-gray-600"
                    placeholder={ph}
                  />
                </div>
              ))}
            </div>

            <div className="space-y-4">
              {[
                { key:'instagram', Icon:IGIcon, color:'text-pink-500',  ph:'Instagram URL or @username' },
                { key:'facebook',  Icon:FBIcon, color:'text-blue-500',  ph:'Facebook page URL' },
                { key:'tiktok',    Icon:TKIcon, color:'text-primary-color', ph:'TikTok @username' },
              ].map(({ key, Icon, color, ph }) => (
                <div key={key} className="flex items-center gap-4 bg-elevated rounded-2xl p-2 pr-5">
                  <div className={`w-12 h-12 bg-surface rounded-xl flex items-center justify-center ${color} shadow-base-sm shrink-0 border border-base`}>
                    <Icon size={18} />
                  </div>
                  <input
                    value={d[key]}
                    onChange={e => set(key, e.target.value)}
                    className="flex-1 bg-transparent font-bold text-sm outline-none text-primary-color placeholder-gray-400 dark:placeholder-gray-600"
                    placeholder={ph}
                  />
                </div>
              ))}

              <div className="mt-2">
                <label className="text-[11px] font-black uppercase text-muted-color mb-2 block">Restaurant Description</label>
                <textarea
                  value={d.description}
                  onChange={e => set('description', e.target.value)}
                  rows={5}
                  className="w-full bg-elevated rounded-2xl p-4 text-sm font-medium outline-none resize-none text-primary-color placeholder-gray-400 dark:placeholder-gray-600"
                  placeholder="Brief description shown in search & previews…"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 05 — OPENING HOURS */}
        <section className="bg-surface rounded-[3rem] p-10 md:p-12 shadow-base border border-base space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center font-black text-sm">05</div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-primary-color">Opening Hours</h2>
          </div>

          <div className="space-y-2">
            {d.openingHours.map((h, idx) => (
              <div key={h.day} className="flex items-center justify-between p-4 bg-elevated rounded-2xl hover:bg-hover transition-all">
                <span className="w-24 text-[11px] font-black uppercase tracking-widest text-muted-color capitalize">{h.day}</span>
                <div className="flex items-center gap-4">
                  {!h.isClosed ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={h.open}
                        onChange={e => setHour(idx,'open',e.target.value)}
                        className="bg-surface border border-base rounded-xl px-3 py-2 text-xs font-black outline-none text-primary-color"
                      />
                      <span className="text-muted-color text-[10px] font-black">to</span>
                      <input
                        type="time"
                        value={h.close}
                        onChange={e => setHour(idx,'close',e.target.value)}
                        className="bg-surface border border-base rounded-xl px-3 py-2 text-xs font-black outline-none text-primary-color"
                      />
                    </div>
                  ) : (
                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest w-48 text-center">Closed</span>
                  )}
                  <button
                    onClick={() => setHour(idx,'isClosed',!h.isClosed)}
                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${h.isClosed ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-500/15 text-rose-500 dark:text-rose-400'}`}
                  >
                    {h.isClosed ? 'Open' : 'Close'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => set('showHours', !d.showHours)}
              className={`w-11 h-6 rounded-full relative transition-all shrink-0 ${d.showHours ? 'bg-orange-500' : 'bg-gray-300 dark:bg-white/15'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${d.showHours ? 'left-6' : 'left-1'}`} />
            </button>
            <span className="text-sm font-bold text-secondary-color">Show opening hours section on website</span>
          </div>
        </section>

        {/* 06 — SPECIAL PERIODS */}
        <section className="bg-surface rounded-[3rem] p-10 md:p-12 shadow-base border border-base space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center">
                <CalendarRange size={22} />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-primary-color">Special Periods</h2>
            </div>
            <button
              onClick={() => setD(p => ({ ...p, seasonalHours: [...p.seasonalHours, { label:'', startDate:'', endDate:'', isClosed:false, open:'09:00', close:'22:00' }] }))}
              className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"
            >
              <Plus size={15} /> Add Period
            </button>
          </div>

          <p className="text-sm text-secondary-color font-medium">Override your weekly hours for holidays, vacations, or special events.</p>

          {d.seasonalHours.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-base rounded-3xl">
              <CalendarRange size={36} className="text-muted-color mb-2" />
              <p className="text-sm font-bold text-muted-color">No special periods yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {d.seasonalHours.map((sh, idx) => (
                <div key={idx} className="bg-elevated rounded-2xl p-6 space-y-4 border border-base relative">
                  <button
                    onClick={() => setD(p => ({ ...p, seasonalHours: p.seasonalHours.filter((_,i) => i !== idx) }))}
                    className="absolute top-4 right-4 text-muted-color hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="grid md:grid-cols-3 gap-4 pr-8">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-muted-color">Label</label>
                      <input
                        value={sh.label}
                        onChange={e => setSeasonal(idx,'label',e.target.value)}
                        className="w-full bg-surface rounded-xl px-4 py-3 text-sm font-bold outline-none border border-base text-primary-color placeholder-gray-400 dark:placeholder-gray-600"
                        placeholder="e.g. Ramadan"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-muted-color">Start Date</label>
                      <input
                        type="date"
                        value={sh.startDate}
                        onChange={e => setSeasonal(idx,'startDate',e.target.value)}
                        className="w-full bg-surface rounded-xl px-4 py-3 text-sm font-bold outline-none border border-base text-primary-color"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-muted-color">End Date</label>
                      <input
                        type="date"
                        value={sh.endDate}
                        onChange={e => setSeasonal(idx,'endDate',e.target.value)}
                        className="w-full bg-surface rounded-xl px-4 py-3 text-sm font-bold outline-none border border-base text-primary-color"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setSeasonal(idx,'isClosed',!sh.isClosed)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sh.isClosed ? 'bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400' : 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'}`}
                    >
                      {sh.isClosed ? 'Closed All Day' : 'Open — Custom Hours'}
                    </button>
                    {!sh.isClosed && (
                      <div className="flex items-center gap-3">
                        <input
                          type="time"
                          value={sh.open}
                          onChange={e => setSeasonal(idx,'open',e.target.value)}
                          className="bg-surface border border-base rounded-xl px-4 py-2 text-sm font-black outline-none text-primary-color"
                        />
                        <span className="text-muted-color text-xs font-bold">to</span>
                        <input
                          type="time"
                          value={sh.close}
                          onChange={e => setSeasonal(idx,'close',e.target.value)}
                          className="bg-surface border border-base rounded-xl px-4 py-2 text-sm font-black outline-none text-primary-color"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 07 — APPEARANCE */}
        <section className="bg-surface rounded-[3rem] p-10 md:p-12 shadow-base border border-base space-y-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 dark:bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center">
              <Palette size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-primary-color">Appearance</h2>
              <p className="text-[11px] text-muted-color font-bold uppercase tracking-widest mt-0.5">Colors · Copy · Sections</p>
            </div>
          </div>

          {/* Accent color */}
          <div className="space-y-3">
            <label className="text-[11px] font-black uppercase text-muted-color">Accent / Brand Color</label>
            <div className="flex items-center gap-5 flex-wrap">
              <input
                type="color"
                value={d.primaryColor}
                onChange={e => set('primaryColor', e.target.value)}
                className="w-14 h-14 rounded-2xl border-2 border-base p-1 cursor-pointer bg-surface"
              />
              <div>
                <p className="text-sm font-black text-primary-color">{d.primaryColor}</p>
                <p className="text-xs text-muted-color">Buttons, accents, links</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map(c => (
                  <button
                    key={c}
                    onClick={() => set('primaryColor', c)}
                    className={`w-9 h-9 rounded-xl border-2 transition-all hover:scale-110 ${d.primaryColor === c ? 'border-gray-800 dark:border-white scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Button copy texts */}
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { key:'ctaText',      label:'Reserve Button Text',  ph:'Reserve a Table'  },
              { key:'vipCtaText',   label:'VIP Button Text',      ph:'Book VIP Table'   },
              { key:'discoverText', label:'Discover Button Text', ph:'Discover More'    },
              { key:'footerText',   label:'Footer Text',          ph:'© 2026 Le Jasmin' },
            ].map(({ key, label, ph }) => (
              <div key={key} className="space-y-2">
                <label className="text-[11px] font-black uppercase text-muted-color">{label}</label>
                <input
                  value={d[key]}
                  onChange={e => set(key, e.target.value)}
                  className="w-full p-4 bg-elevated rounded-2xl font-bold outline-none text-primary-color placeholder-gray-400 dark:placeholder-gray-600"
                  placeholder={ph}
                />
              </div>
            ))}
          </div>

          {/* Section toggles */}
          <div className="space-y-3">
            <label className="text-[11px] font-black uppercase text-muted-color">Visible Sections</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { key:'showMenu',    label:'Menu'    },
                { key:'aboutShow',   label:'About'   },
                { key:'galleryShow', label:'Gallery' },
                { key:'showHours',   label:'Hours'   },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3 p-4 bg-elevated rounded-2xl">
                  <button
                    onClick={() => set(key, !d[key])}
                    className={`w-10 h-5 rounded-full relative transition-all shrink-0 ${d[key] ? 'bg-orange-500' : 'bg-gray-300 dark:bg-white/15'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${d[key] ? 'left-5' : 'left-0.5'}`} />
                  </button>
                  <span className="text-xs font-black text-secondary-color">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom actions */}
        <div className="flex items-center justify-between pb-10">
          <button
            onClick={() => navigate('/admin/themes')}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-base text-sm font-bold text-secondary-color hover:bg-elevated transition-all"
          >
            <ArrowLeft size={15} /> Back to Templates
          </button>
          <button onClick={handleSave} disabled={isSaving} className={`${saveBtnCls} px-10 py-4 text-sm`}>
            {isSaving
              ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : saved
                ? <><CheckCircle2 size={17}/> Saved!</>
                : <><Save size={17}/> Save & Publish</>}
          </button>
        </div>
      </div>

      {/* ── LIVE PREVIEW OVERLAY ── */}
      {showPreview && previewData && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 bg-[#0a0a0a]/95 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-black text-white/50 uppercase tracking-widest ml-3">
                Live Preview — {tplMeta.name}
              </span>
            </div>
            <button
              onClick={() => setShowPreview(false)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto bg-white">
            <PreviewComp data={previewData} />
          </div>
        </div>
      )}
    </div>
  );
}
