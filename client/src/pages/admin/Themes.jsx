import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Palette, Eye, Sliders, CheckCircle2, ArrowLeft, Save,
  Type, Image as ImageIcon, LayoutTemplate, Sparkles,
  ToggleRight, ToggleLeft, Camera, ExternalLink, RefreshCw,
} from 'lucide-react';
import { restaurantService } from '../../services/restaurantService';
import TemplateClassic from '../public/templates/TemplateClassic';
import TemplateModern  from '../public/templates/TemplateModern';
import TemplateVivid   from '../public/templates/TemplateVivid';

// ─── Template registry ─────────────────────────────────────
const TEMPLATES = [
  {
    id: 'classic',
    name: 'Classic',
    tag: 'Popular',
    tagColor: 'text-emerald-500 bg-emerald-500/10',
    desc: 'Elegant & timeless. Warm tones, traditional layout, masonry gallery.',
    Component: TemplateClassic,
    thumb: ClassicThumb,
  },
  {
    id: 'modern',
    name: 'Modern',
    tag: 'Trending',
    tagColor: 'text-blue-500 bg-blue-500/10',
    desc: 'Dark, bold & minimal. Full-screen hero, editorial menu layout.',
    Component: TemplateModern,
    thumb: ModernThumb,
  },
  {
    id: 'vivid',
    name: 'Vivid',
    tag: 'Fun',
    tagColor: 'text-purple-500 bg-purple-500/10',
    desc: 'Colorful & energetic. Card-based, floating hero image, vibrant CTA.',
    Component: TemplateVivid,
    thumb: VividThumb,
  },
];

// ─── Static preview thumbnails ─────────────────────────────
function ClassicThumb({ active }) {
  return (
    <div className={`w-full h-48 rounded-xl overflow-hidden border-2 transition-all ${active ? 'border-orange-500' : 'border-gray-200 dark:border-white/10'}`}
         style={{ background: '#fafaf8' }}>
      {/* Nav */}
      <div className="h-7 bg-white border-b border-gray-100 flex items-center px-3 gap-2">
        <div className="h-2.5 w-14 rounded-full bg-orange-400" />
        <div className="flex-1" />
        <div className="h-1.5 w-5 rounded-full bg-gray-200" />
        <div className="h-1.5 w-5 rounded-full bg-gray-200" />
        <div className="h-1.5 w-5 rounded-full bg-gray-200" />
      </div>
      {/* Hero */}
      <div className="h-20 bg-gradient-to-br from-orange-400 to-orange-700 flex flex-col items-center justify-center gap-1.5">
        <div className="h-2.5 w-20 bg-white rounded-full opacity-90" />
        <div className="h-1.5 w-14 bg-white/60 rounded-full" />
        <div className="mt-1 h-4 w-20 rounded-full bg-orange-400 border border-white/60" />
      </div>
      {/* About */}
      <div className="px-3 pt-2 grid grid-cols-2 gap-2">
        <div className="h-7 bg-orange-100 rounded-lg" />
        <div className="space-y-1">
          <div className="h-1.5 bg-gray-200 rounded-full w-full" />
          <div className="h-1.5 bg-gray-200 rounded-full w-3/4" />
          <div className="h-1.5 bg-gray-200 rounded-full w-full" />
        </div>
      </div>
      {/* Menu */}
      <div className="px-3 pt-2 grid grid-cols-3 gap-1.5">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-6 rounded-lg" style={{ background: '#fff3ea' }} />
        ))}
      </div>
    </div>
  );
}

function ModernThumb({ active }) {
  return (
    <div className={`w-full h-48 rounded-xl overflow-hidden border-2 transition-all ${active ? 'border-orange-500' : 'border-gray-200 dark:border-white/10'}`}
         style={{ background: '#0c0c0c' }}>
      {/* Nav */}
      <div className="h-7 flex items-center px-3 gap-2">
        <div className="h-2 w-16 rounded-full bg-white/70" />
        <div className="flex-1" />
        <div className="h-1.5 w-5 rounded-full bg-white/20" />
        <div className="h-1.5 w-5 rounded-full bg-white/20" />
      </div>
      {/* Hero */}
      <div className="h-28 relative flex flex-col justify-end px-3 pb-3"
           style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
        <div className="absolute inset-0 bg-white/5" />
        <div className="h-1 w-8 bg-orange-500 rounded-full mb-2" />
        <div className="h-3 w-24 bg-white rounded-full mb-1.5" />
        <div className="h-1.5 w-16 bg-white/30 rounded-full mb-3" />
        <div className="h-5 w-16 rounded-full border border-orange-500" />
      </div>
      {/* Content lines */}
      <div className="px-3 pt-2 space-y-1.5">
        <div className="h-1.5 w-full bg-white/8 rounded-full" />
        <div className="h-1.5 w-3/4 bg-white/8 rounded-full" />
      </div>
    </div>
  );
}

function VividThumb({ active }) {
  return (
    <div className={`w-full h-48 rounded-xl overflow-hidden border-2 transition-all ${active ? 'border-orange-500' : 'border-gray-200 dark:border-white/10'}`}
         style={{ background: '#fff8f4' }}>
      {/* Nav */}
      <div className="h-7 bg-white border-b border-orange-100 flex items-center px-3 gap-2">
        <div className="w-5 h-5 rounded-lg bg-orange-500 flex-shrink-0" />
        <div className="h-2 w-12 rounded-full bg-gray-800" />
        <div className="flex-1" />
        <div className="h-5 w-14 rounded-xl bg-orange-500" />
      </div>
      {/* Hero grid */}
      <div className="grid grid-cols-2 gap-2 p-3 h-32">
        <div className="flex flex-col justify-center gap-2">
          <div className="flex gap-1">
            <div className="h-3.5 w-10 rounded-full bg-orange-500" />
          </div>
          <div className="h-3 w-20 bg-gray-800 rounded-full" />
          <div className="h-2 w-16 bg-gray-400 rounded-full" />
          <div className="h-6 w-16 rounded-2xl bg-orange-500 mt-1" />
        </div>
        <div className="relative">
          <div className="w-full h-full rounded-2xl overflow-hidden"
               style={{ background: 'linear-gradient(135deg, #fed7aa, #fb923c)' }}>
            <div className="absolute inset-0 flex items-center justify-center text-2xl opacity-30">🍽</div>
          </div>
        </div>
      </div>
      {/* Cards */}
      <div className="px-3 grid grid-cols-3 gap-1.5">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-5 bg-white rounded-xl border border-orange-100 shadow-sm" />
        ))}
      </div>
    </div>
  );
}

// ─── Image resize helper ────────────────────────────────────
const resizeToBase64 = (file, maxW = 1200, q = 0.82) =>
  new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio  = Math.min(maxW / img.width, 1);
      const canvas = document.createElement('canvas');
      canvas.width  = img.width  * ratio;
      canvas.height = img.height * ratio;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', q));
    };
    img.src = url;
  });

// ─── Customizer form field ──────────────────────────────────
function FormField({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">{label}</label>
      {children}
    </div>
  );
}

function FormInput({ ...props }) {
  return (
    <input
      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-orange-400 transition-colors"
      {...props}
    />
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
            className="flex items-center justify-between w-full py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
      <span>{label}</span>
      {value
        ? <ToggleRight size={20} className="text-orange-500" />
        : <ToggleLeft  size={20} className="text-gray-300 dark:text-white/20" />
      }
    </button>
  );
}

// ─── Default config ─────────────────────────────────────────
const defaultConfig = (restaurant) => ({
  id:             restaurant?.template?.id             ?? 'classic',
  slogan:         restaurant?.template?.slogan         ?? '',
  heroBackground: restaurant?.template?.heroBackground ?? null,
  primaryColor:   restaurant?.template?.primaryColor   ?? '#f97316',
  badge:          restaurant?.template?.badge          ?? '',
  footerText:     restaurant?.template?.footerText     ?? '',
  showMenu:       restaurant?.template?.showMenu       ?? true,
  showGallery:    restaurant?.template?.showGallery    ?? true,
  showAbout:      restaurant?.template?.showAbout      ?? true,
  showHours:      restaurant?.template?.showHours      ?? false,
  ctaText:        restaurant?.template?.ctaText        ?? 'Reserve a Table',
});

// ─── Main Themes page ───────────────────────────────────────
export default function Themes() {
  const qc = useQueryClient();

  const { data: rd, isLoading } = useQuery({
    queryKey: ['my-restaurant'],
    queryFn:  restaurantService.getMine,
  });
  const restaurant = rd?.data;

  const [mode,   setMode]   = useState('gallery'); // 'gallery' | 'customize'
  const [selTpl, setSelTpl] = useState(null);      // template id being customized
  const [config, setConfig] = useState(defaultConfig(null));

  useEffect(() => {
    if (restaurant) setConfig(defaultConfig(restaurant));
  }, [restaurant]);

  const heroRef = useRef();

  const setC = (k, v) => setConfig(p => ({ ...p, [k]: v }));

  const { mutate: saveTemplate, isPending: saving } = useMutation({
    mutationFn: (data) => restaurantService.update({ template: data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-restaurant'] });
      toast.success('Template saved & activated!');
      setMode('gallery');
    },
    onError: () => toast.error('Save failed — please try again'),
  });

  const openCustomize = (id) => {
    setSelTpl(id);
    setConfig(p => ({ ...p, id }));
    setMode('customize');
  };

  const handleHeroUpload = async (file) => {
    if (!file) return;
    setC('heroBackground', await resizeToBase64(file, 1600, 0.85));
  };

  const activeTplId = restaurant?.template?.id ?? 'classic';

  // ── Preview data merge ──
  const previewRestaurant = restaurant ? {
    ...restaurant,
    ...config,
    coverImage:     restaurant.coverImage,
    heroBackground: config.heroBackground ?? restaurant.coverImage,
  } : null;

  const PreviewComponent = TEMPLATES.find(t => t.id === (selTpl ?? config.id))?.Component;

  // ── Gallery mode ──
  if (mode === 'gallery') {
    return (
      <div className="p-5 sm:p-6 space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Website Templates</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Choose and customise the public page of your restaurant
            </p>
          </div>
          {restaurant?.slug && (
            <a
              href={`/r/${restaurant.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              <ExternalLink size={14} /> View Live Page
            </a>
          )}
        </div>

        {/* Active template badge */}
        {activeTplId && (
          <div className="flex items-center gap-3 p-3.5 bg-orange-50 dark:bg-orange-500/8 border border-orange-200 dark:border-orange-500/20 rounded-2xl">
            <CheckCircle2 size={16} className="text-orange-500 shrink-0" />
            <p className="text-xs font-semibold text-orange-700 dark:text-orange-400">
              Active template: <span className="font-black">{TEMPLATES.find(t => t.id === activeTplId)?.name ?? 'Classic'}</span>
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="grid sm:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-72 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-3 gap-6">
            {TEMPLATES.map(tpl => {
              const Thumb  = tpl.thumb;
              const active = activeTplId === tpl.id;
              return (
                <div key={tpl.id}
                     className={`bg-white dark:bg-[#141414] border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group ${active ? 'border-orange-400 dark:border-orange-500' : 'border-gray-100 dark:border-white/6'}`}>
                  {/* Thumbnail */}
                  <div className="p-3 pb-0">
                    <Thumb active={active} />
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{tpl.name}</h3>
                        {active && <CheckCircle2 size={13} className="text-orange-500" />}
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${tpl.tagColor}`}>
                        {tpl.tag}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed mb-4">{tpl.desc}</p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => openCustomize(tpl.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-colors shadow-sm shadow-orange-500/20"
                      >
                        <Sliders size={12} />
                        {active ? 'Edit' : 'Customize'}
                      </button>
                      {restaurant?.slug && (
                        <a
                          href={`/r/${restaurant.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Preview live page"
                          className="flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 text-xs font-medium rounded-xl transition-colors"
                        >
                          <Eye size={13} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* No restaurant warning */}
        {!isLoading && !restaurant && (
          <div className="text-center py-16 text-gray-400">
            <LayoutTemplate size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Complete your restaurant setup first</p>
            <a href="/admin/setup" className="text-xs text-orange-500 hover:underline mt-1 block">
              Go to Restaurant Setup →
            </a>
          </div>
        )}
      </div>
    );
  }

  // ── Customizer mode ──
  const tplMeta = TEMPLATES.find(t => t.id === (selTpl ?? config.id));

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Customizer topbar */}
      <div className="shrink-0 flex items-center gap-4 px-5 py-3.5 bg-white dark:bg-[#141414] border-b border-gray-100 dark:border-white/6">
        <button
          onClick={() => { setMode('gallery'); setSelTpl(null); }}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Templates
        </button>
        <div className="h-4 w-px bg-gray-200 dark:bg-white/10" />
        <div className="flex items-center gap-2">
          <Palette size={14} className="text-orange-500" />
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            Customising: <span className="text-orange-500">{tplMeta?.name}</span>
          </span>
        </div>
        <div className="flex-1" />
        {restaurant?.slug && (
          <a href={`/r/${restaurant.slug}`} target="_blank" rel="noopener noreferrer"
             className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
            <ExternalLink size={12} /> Live
          </a>
        )}
        <button
          onClick={() => saveTemplate(config)}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors shadow-sm shadow-orange-500/20"
        >
          <Save size={14} />
          {saving ? 'Saving…' : 'Save & Activate'}
        </button>
      </div>

      {/* Customizer body */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Form panel ── */}
        <div className="w-72 shrink-0 overflow-y-auto bg-white dark:bg-[#141414] border-r border-gray-100 dark:border-white/6 p-4 space-y-6">

          {/* Template picker */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Template</p>
            <div className="grid grid-cols-3 gap-2">
              {TEMPLATES.map(t => (
                <button key={t.id} onClick={() => setC('id', t.id)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all border ${config.id === t.id ? 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/30' : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-orange-300 dark:hover:border-orange-500/30'}`}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Identity */}
          <div className="space-y-3">
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-300 dark:text-white/20 flex items-center gap-1.5">
              <Type size={10} /> Identity
            </p>
            <FormField label="Slogan / Tagline">
              <FormInput
                value={config.slogan}
                onChange={e => setC('slogan', e.target.value)}
                placeholder="e.g. The taste of authenticity"
              />
            </FormField>
            <FormField label="Badge / Category">
              <FormInput
                value={config.badge}
                onChange={e => setC('badge', e.target.value)}
                placeholder="e.g. Fine Dining · Tunis"
              />
            </FormField>
            <FormField label="CTA Button Text">
              <FormInput
                value={config.ctaText}
                onChange={e => setC('ctaText', e.target.value)}
                placeholder="Reserve a Table"
              />
            </FormField>
          </div>

          {/* Visuals */}
          <div className="space-y-3">
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-300 dark:text-white/20 flex items-center gap-1.5">
              <Sparkles size={10} /> Visual Style
            </p>

            <FormField label="Accent Colour">
              <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 focus-within:border-orange-400 transition-colors">
                <input
                  type="color"
                  value={config.primaryColor}
                  onChange={e => setC('primaryColor', e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                />
                <span className="text-sm font-mono text-gray-600 dark:text-gray-400">{config.primaryColor}</span>
              </div>
            </FormField>

            <FormField label="Hero Background Image">
              <button type="button" onClick={() => heroRef.current?.click()}
                      className="w-full border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl overflow-hidden hover:border-orange-300 dark:hover:border-orange-500/30 transition-colors">
                <input ref={heroRef} type="file" accept="image/*" className="hidden" onChange={e => handleHeroUpload(e.target.files?.[0])} />
                {config.heroBackground ? (
                  <div className="relative">
                    <img src={config.heroBackground} alt="" className="w-full h-20 object-cover" />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-xs font-semibold">Click to change</span>
                  </div>
                ) : (
                  <div className="py-4 flex flex-col items-center gap-1.5 bg-gray-50 dark:bg-white/3">
                    <Camera size={16} className="text-gray-400" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">Upload custom hero image</p>
                    <p className="text-[10px] text-gray-400">Uses restaurant cover by default</p>
                  </div>
                )}
              </button>
              {config.heroBackground && (
                <button onClick={() => setC('heroBackground', null)}
                        className="text-[10px] text-red-400 hover:text-red-600 transition-colors mt-1">
                  ✕ Remove custom hero
                </button>
              )}
            </FormField>
          </div>

          {/* Sections */}
          <div className="space-y-1">
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-300 dark:text-white/20 mb-2 flex items-center gap-1.5">
              <LayoutTemplate size={10} /> Show Sections
            </p>
            <Toggle label="About / Our Story"  value={config.showAbout}   onChange={v => setC('showAbout',   v)} />
            <Toggle label="Menu"               value={config.showMenu}    onChange={v => setC('showMenu',    v)} />
            <Toggle label="Gallery"            value={config.showGallery} onChange={v => setC('showGallery', v)} />
            <Toggle label="Opening Hours"      value={config.showHours}   onChange={v => setC('showHours',   v)} />
          </div>

          {/* Footer */}
          <div className="space-y-3">
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-300 dark:text-white/20 flex items-center gap-1.5">
              <ImageIcon size={10} /> Footer
            </p>
            <FormField label="Footer Text">
              <FormInput
                value={config.footerText}
                onChange={e => setC('footerText', e.target.value)}
                placeholder={`© ${new Date().getFullYear()} ${restaurant?.name || 'Your Restaurant'}`}
              />
            </FormField>
          </div>
        </div>

        {/* ── Live preview ── */}
        <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-[#0a0a0a] flex flex-col">
          <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-gray-200 dark:bg-white/5 border-b border-gray-300 dark:border-white/8">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="bg-white dark:bg-white/10 rounded-lg px-3 py-1 text-[10px] text-gray-400 font-mono flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                {restaurant?.slug ? `rrestora.vercel.app/r/${restaurant.slug}` : 'your-restaurant.restora.app'}
              </div>
            </div>
            <RefreshCw size={13} className="text-gray-400" />
          </div>

          {/* Scaled preview */}
          {previewRestaurant && PreviewComponent ? (
            <div className="flex-1 overflow-hidden relative">
              <div
                style={{
                  width: '1280px',
                  transformOrigin: 'top left',
                  transform: `scale(var(--preview-scale, 0.6))`,
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
                className="[--preview-scale:0.55] sm:[--preview-scale:0.6] lg:[--preview-scale:0.65]"
              >
                <PreviewComponent data={previewRestaurant} />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              {isLoading ? (
                <RefreshCw size={24} className="text-gray-400 animate-spin" />
              ) : (
                <div className="text-center text-gray-400">
                  <LayoutTemplate size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Complete restaurant setup to preview</p>
                  <a href="/admin/setup" className="text-xs text-orange-500 mt-1 block hover:underline">Go to Setup</a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
