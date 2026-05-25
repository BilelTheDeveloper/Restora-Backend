import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Palette, Eye, Sliders, CheckCircle2, ArrowLeft, Save,
  Type, Image as ImageIcon, LayoutTemplate, Sparkles,
  ToggleRight, ToggleLeft, Camera, ExternalLink, RefreshCw,
  Globe, GlobeLock, Crown, AlertTriangle, Zap, Star,
} from 'lucide-react';
import { restaurantService } from '../../services/restaurantService';
import TemplateClassic  from '../public/templates/TemplateClassic';
import TemplateModern   from '../public/templates/TemplateModern';
import TemplateVivid    from '../public/templates/TemplateVivid';
import TemplatePrestige from '../public/templates/TemplatePrestige';

// ─── Template registry ─────────────────────────────────────
const TEMPLATES = [
  {
    id: 'prestige',
    name: 'Prestige',
    tag: 'Ultra',
    tagColor: '#f59e0b',
    tagBg: 'rgba(245,158,11,0.15)',
    desc: 'Cinematic noir. Gold accents, massive typography, VIP floor-plan flow.',
    Component: TemplatePrestige,
    accentColor: '#f59e0b',
    mood: 'Luxury · Noir · Cinematic',
  },
  {
    id: 'classic',
    name: 'Classic',
    tag: 'Popular',
    tagColor: '#10b981',
    tagBg: 'rgba(16,185,129,0.15)',
    desc: 'Elegant & timeless. Warm tones, traditional layout, masonry gallery.',
    Component: TemplateClassic,
    accentColor: '#f97316',
    mood: 'Warm · Elegant · Traditional',
  },
  {
    id: 'modern',
    name: 'Modern',
    tag: 'Trending',
    tagColor: '#3b82f6',
    tagBg: 'rgba(59,130,246,0.15)',
    desc: 'Dark, bold & minimal. Full-screen hero, editorial menu layout.',
    Component: TemplateModern,
    accentColor: '#f97316',
    mood: 'Bold · Editorial · Dark',
  },
  {
    id: 'vivid',
    name: 'Vivid',
    tag: 'Energetic',
    tagColor: '#a855f7',
    tagBg: 'rgba(168,85,247,0.15)',
    desc: 'Colorful & lively. Card-based layout, floating hero, vibrant CTAs.',
    Component: TemplateVivid,
    accentColor: '#f97316',
    mood: 'Fun · Colorful · Modern',
  },
];

// ─── Full-bleed rich thumbnail previews ──────────────────────

function ClassicThumb() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: '#faf5ef' }}>
      {/* Simulated restaurant photo background */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(160deg, #fde8d0 0%, #f5c89a 40%, #e8a060 70%, #c06820 100%)',
      }}/>
      {/* Texture overlay */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.15\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'1\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
      }}/>

      {/* Nav */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-white/95 backdrop-blur-sm flex items-center px-3 gap-1.5 shadow-sm">
        <div className="w-2 h-2 rounded-sm bg-orange-500"/>
        <div className="h-1.5 w-10 rounded-full bg-orange-500/80"/>
        <div className="flex-1"/>
        <div className="h-1.5 w-6 rounded-full bg-gray-300"/>
        <div className="h-1.5 w-6 rounded-full bg-gray-300"/>
        <div className="h-1.5 w-6 rounded-full bg-gray-300"/>
        <div className="h-4 w-14 rounded-lg bg-orange-500 ml-1"/>
      </div>

      {/* Hero */}
      <div className="absolute top-8 left-0 right-0" style={{ height: 130 }}>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)' }}/>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-4">
          <div className="h-1.5 w-12 rounded-full bg-orange-400/90 mb-0.5"/>
          <div className="h-5 w-32 rounded-full bg-white/95"/>
          <div className="h-1.5 w-24 rounded-full bg-white/55"/>
          <div className="h-1.5 w-20 rounded-full bg-white/40 mt-0.5"/>
          <div className="flex gap-2 mt-1.5">
            <div className="h-5 w-20 rounded-full bg-orange-500 shadow-lg"/>
            <div className="h-5 w-20 rounded-full border border-white/70"/>
          </div>
        </div>
      </div>

      {/* About strip */}
      <div className="absolute left-0 right-0 bg-white/95" style={{ top: 138, height: 40 }}>
        <div className="absolute inset-0 flex gap-2 px-3 py-2.5">
          <div className="w-12 h-full rounded-lg bg-orange-100 shrink-0"/>
          <div className="flex-1 flex flex-col gap-1 justify-center">
            <div className="h-1.5 w-full bg-gray-200 rounded-full"/>
            <div className="h-1.5 w-3/4 bg-gray-200 rounded-full"/>
          </div>
        </div>
      </div>

      {/* Menu label */}
      <div className="absolute left-3 font-black text-gray-800/25" style={{ top: 186, fontSize: 8 }}>MENU</div>

      {/* Menu cards */}
      <div className="absolute left-3 right-3 grid grid-cols-3 gap-1.5" style={{ top: 196 }}>
        {['#fff3ea','#fef8f0','#fff5ee'].map((bg, i) => (
          <div key={i} className="rounded-lg overflow-hidden shadow-sm border border-orange-100" style={{ height: 42 }}>
            <div className="h-3/5" style={{ background: `linear-gradient(135deg, ${i===0?'#fcd3a8':'#f5c490'}, ${i===0?'#f59e50':'#e8882a'})` }}/>
            <div className="h-2/5 bg-white flex items-center px-1.5">
              <div className="h-1 flex-1 bg-gray-200 rounded-full"/>
            </div>
          </div>
        ))}
      </div>

      {/* Footer hint */}
      <div className="absolute bottom-0 left-0 right-0 h-6 bg-gray-800 flex items-center px-3 gap-2">
        <div className="h-1 w-10 rounded-full bg-white/30"/>
        <div className="flex-1"/>
        <div className="h-1 w-8 rounded-full bg-white/20"/>
        <div className="h-1 w-8 rounded-full bg-white/20"/>
      </div>
    </div>
  );
}

function ModernThumb() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: '#080808' }}>
      {/* Cinematic bg */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 60% 30%, rgba(255,100,20,0.12) 0%, rgba(0,0,0,0) 70%), linear-gradient(180deg, #111 0%, #050505 100%)',
      }}/>
      {/* Grid lines */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}/>

      {/* Nav */}
      <div className="absolute top-0 left-0 right-0 h-7 flex items-center px-3">
        <div className="h-2 w-14 rounded-full bg-white/80"/>
        <div className="flex-1"/>
        <div className="h-1 w-5 rounded-full bg-white/25"/>
        <div className="h-1 w-5 rounded-full bg-white/25 ml-1.5"/>
        <div className="h-1 w-5 rounded-full bg-white/25 ml-1.5"/>
      </div>

      {/* Big hero title */}
      <div className="absolute left-3 right-3" style={{ top: 22 }}>
        <div className="h-0.5 w-6 rounded-full mb-2" style={{ background: '#f97316' }}/>
        <div className="h-3 w-28 rounded-sm bg-white/90 mb-1.5"/>
        <div className="h-6 w-36 rounded-sm bg-white mb-1.5"/>
        <div className="h-1.5 w-20 rounded-full bg-white/30 mb-3"/>
        <div className="flex gap-2">
          <div className="h-6 w-20 rounded-full" style={{ border: '1px solid #f97316' }}>
            <div className="h-full w-full rounded-full flex items-center justify-center">
              <div className="h-1 w-10 rounded-full" style={{ background: '#f97316' }}/>
            </div>
          </div>
          <div className="h-6 w-20 rounded-full bg-white/8 border border-white/15"/>
        </div>
      </div>

      {/* Accent diagonal overlay */}
      <div className="absolute" style={{
        top: 18, right: -20, width: 90, height: 140,
        background: 'linear-gradient(135deg, rgba(249,115,22,0.08) 0%, transparent 60%)',
        transform: 'skewX(-5deg)',
      }}/>

      {/* Bottom content */}
      <div className="absolute left-3 right-3" style={{ top: 158 }}>
        <div className="grid grid-cols-2 gap-1.5">
          {[0,1].map(i => (
            <div key={i} className="rounded-lg overflow-hidden" style={{ height: 44, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="h-1/2" style={{ background: 'rgba(255,255,255,0.04)' }}/>
              <div className="px-1.5 pt-1 flex gap-1 flex-col">
                <div className="h-1 w-3/4 rounded-full bg-white/20"/>
                <div className="h-1 w-1/2 rounded-full bg-white/10"/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav bar hint */}
      <div className="absolute bottom-0 left-0 right-0 h-5 flex items-center px-3 gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="h-0.5 w-8 rounded-full bg-white/20"/>
        <div className="flex-1"/>
        <div className="h-0.5 w-4 rounded-full bg-orange-500/60"/>
        <div className="h-0.5 w-4 rounded-full bg-white/15 ml-1"/>
      </div>
    </div>
  );
}

function VividThumb() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: '#fdf8ff' }}>
      {/* Colorful gradient blobs */}
      <div className="absolute" style={{ top: -20, right: -20, width: 120, height: 120, background: 'radial-gradient(circle, rgba(249,115,22,0.2) 0%, transparent 70%)', borderRadius: '50%' }}/>
      <div className="absolute" style={{ bottom: 20, left: -20, width: 100, height: 100, background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)', borderRadius: '50%' }}/>

      {/* Nav */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-white shadow-sm flex items-center px-3 gap-1.5">
        <div className="w-5 h-5 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
          <div className="w-1.5 h-1.5 rounded-sm bg-white"/>
        </div>
        <div className="h-1.5 w-10 rounded-full bg-gray-800"/>
        <div className="flex-1"/>
        <div className="h-1 w-5 rounded-full bg-gray-300"/>
        <div className="h-1 w-5 rounded-full bg-gray-300"/>
        <div className="h-5 w-14 rounded-xl bg-orange-500 ml-1"/>
      </div>

      {/* Hero split */}
      <div className="absolute left-0 right-0" style={{ top: 32, height: 110 }}>
        <div className="absolute inset-0 grid grid-cols-2">
          {/* Left text */}
          <div className="flex flex-col justify-center pl-3 gap-1.5">
            <div className="h-3 w-10 rounded-full" style={{ background: 'linear-gradient(90deg,#f97316,#a855f7)' }}/>
            <div className="h-4 w-24 rounded-sm bg-gray-800"/>
            <div className="h-1.5 w-16 rounded-full bg-gray-300"/>
            <div className="h-6 w-16 rounded-2xl bg-orange-500 mt-1 shadow-lg shadow-orange-200"/>
          </div>
          {/* Right image */}
          <div className="relative overflow-hidden rounded-bl-3xl">
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #fed7aa 0%, #fb923c 50%, #ea580c 100%)' }}/>
            <div className="absolute inset-0 flex items-center justify-center opacity-25">
              <div className="w-12 h-12 rounded-full bg-white/40"/>
            </div>
            {/* Floating dish card */}
            <div className="absolute bottom-2 left-1 right-1 h-6 rounded-xl bg-white/90 shadow-lg flex items-center px-2 gap-1">
              <div className="w-3 h-3 rounded-full bg-orange-400 shrink-0"/>
              <div className="flex-1">
                <div className="h-1 w-full bg-gray-200 rounded-full"/>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Colored section */}
      <div className="absolute left-0 right-0" style={{ top: 142, height: 35, background: 'linear-gradient(90deg, rgba(249,115,22,0.08) 0%, rgba(168,85,247,0.08) 100%)' }}>
        <div className="absolute inset-0 flex items-center px-3 gap-2">
          {['#f97316','#a855f7','#10b981'].map((c,i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ background: c }}/>
              <div className="h-1 w-8 rounded-full bg-gray-300"/>
            </div>
          ))}
        </div>
      </div>

      {/* Card grid */}
      <div className="absolute left-3 right-3 grid grid-cols-3 gap-1" style={{ top: 185 }}>
        {['#fff3ea','#faf5ff','#f0fdf4'].map((bg, i) => (
          <div key={i} className="rounded-xl shadow-sm overflow-hidden" style={{ height: 40, background: bg, border: `1px solid ${i===0?'#fed7aa':i===1?'#e9d5ff':'#bbf7d0'}` }}>
            <div className="h-3/5 rounded-t-xl" style={{ background: i===0?'linear-gradient(135deg,#fed7aa,#f97316)':i===1?'linear-gradient(135deg,#e9d5ff,#a855f7)':'linear-gradient(135deg,#bbf7d0,#10b981)' }}/>
            <div className="px-1 pt-0.5"><div className="h-1 bg-gray-200 rounded-full w-3/4"/></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PrestigeThumb() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: '#060606' }}>
      {/* Deep dramatic bg */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.08) 0%, rgba(0,0,0,0) 65%), radial-gradient(ellipse at 100% 100%, rgba(120,60,0,0.15) 0%, transparent 60%)',
      }}/>

      {/* Nav */}
      <div className="absolute top-0 left-0 right-0 h-7 flex items-center px-3" style={{ borderBottom: '1px solid rgba(245,158,11,0.12)' }}>
        <div className="w-4 h-4 rounded-md flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
          <div className="w-1.5 h-1.5 rounded-sm" style={{ background: '#f59e0b' }}/>
        </div>
        <div className="h-1.5 w-14 rounded-full bg-white/70 ml-1.5"/>
        <div className="flex-1"/>
        <div className="h-1 w-5 rounded-full bg-white/20"/>
        <div className="h-1 w-5 rounded-full bg-white/20 ml-1.5"/>
        <div className="h-5 w-14 rounded-lg ml-1.5" style={{ background: '#f59e0b' }}>
          <div className="h-full w-full rounded-lg flex items-center justify-center">
            <div className="h-1 w-8 rounded-full bg-black/40"/>
          </div>
        </div>
      </div>

      {/* Gold accent line */}
      <div className="absolute left-3 right-3 h-px" style={{ top: 32, background: 'linear-gradient(90deg, rgba(245,158,11,0.6), rgba(245,158,11,0.1))' }}/>

      {/* Hero */}
      <div className="absolute left-3 right-3" style={{ top: 40 }}>
        <div className="h-px w-8 rounded-full mb-2.5" style={{ background: '#f59e0b' }}/>
        <div className="mb-1">
          <div className="h-1.5 w-20 rounded-sm bg-white/35 mb-1"/>
          <div className="h-8 w-36 rounded-sm bg-white/90"/>
        </div>
        <div className="h-1.5 w-24 rounded-full bg-white/20 mb-3"/>
        <div className="flex gap-2">
          <div className="h-6 w-22 rounded-xl" style={{ background: '#f59e0b' }}>
            <div className="h-full w-full rounded-xl flex items-center justify-center">
              <div className="h-1 w-10 rounded-full bg-black/40"/>
            </div>
          </div>
          <div className="h-6 w-20 rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.2)' }}>
            <div className="h-full w-full rounded-xl flex items-center justify-center">
              <div className="h-1 w-8 rounded-full bg-white/40"/>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="absolute left-3 right-3 h-px" style={{ top: 142, background: 'linear-gradient(90deg, rgba(245,158,11,0.3), rgba(245,158,11,0.05))' }}/>

      {/* Features grid */}
      <div className="absolute left-3 right-3 grid grid-cols-4 gap-1" style={{ top: 148 }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg flex flex-col items-center justify-center gap-0.5 py-2" style={{ height: 42, background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.1)' }}>
            <div className="w-3 h-3 rounded-full" style={{ background: 'rgba(245,158,11,0.3)' }}/>
            <div className="h-1 w-5 rounded-full bg-white/15"/>
          </div>
        ))}
      </div>

      {/* Floor plan teaser */}
      <div className="absolute left-3 right-3 rounded-lg overflow-hidden" style={{ top: 198, height: 30, background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.12)' }}>
        <div className="absolute inset-0 flex items-center px-2 gap-2">
          <div className="w-3 h-3 rounded" style={{ background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.3)' }}/>
          <div className="h-1 w-12 rounded-full bg-white/20"/>
          <div className="flex-1"/>
          <div className="h-4 w-12 rounded-lg" style={{ background: 'rgba(245,158,11,0.3)' }}/>
        </div>
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
      {value ? <ToggleRight size={20} className="text-orange-500"/> : <ToggleLeft size={20} className="text-gray-400 dark:text-gray-500"/>}
    </button>
  );
}

// ─── Default config ─────────────────────────────────────────
const defaultConfig = (r) => ({
  id:             r?.template?.id             ?? 'classic',
  slogan:         r?.template?.slogan         ?? '',
  heroBackground: r?.template?.heroBackground ?? null,
  primaryColor:   r?.template?.primaryColor   ?? '#f97316',
  badge:          r?.template?.badge          ?? '',
  footerText:     r?.template?.footerText     ?? '',
  showMenu:       r?.template?.showMenu       ?? true,
  showGallery:    r?.template?.showGallery    ?? true,
  showAbout:      r?.template?.showAbout      ?? true,
  showHours:      r?.template?.showHours      ?? false,
  ctaText:        r?.template?.ctaText        ?? 'Reserve a Table',
  discoverText:   r?.template?.discoverText   ?? 'Discover More',
  vipCtaText:     r?.template?.vipCtaText     ?? 'Book VIP Table',
});

// ─── Theme Card ─────────────────────────────────────────────
function ThemeCard({ tpl, active, onCustomize, liveUrl }) {
  const [hovered, setHovered] = useState(false);

  const ThumbComp = {
    classic: ClassicThumb,
    modern:  ModernThumb,
    vivid:   VividThumb,
    prestige: PrestigeThumb,
  }[tpl.id];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative rounded-2xl overflow-hidden cursor-pointer"
      style={{
        aspectRatio: '3 / 4',
        boxShadow: active
          ? `0 0 0 2.5px ${tpl.accentColor}, 0 20px 60px rgba(0,0,0,0.25)`
          : hovered
            ? '0 20px 50px rgba(0,0,0,0.18)'
            : '0 4px 20px rgba(0,0,0,0.08)',
        transform: hovered ? 'translateY(-4px) scale(1.01)' : 'translateY(0) scale(1)',
        transition: 'transform .25s ease, box-shadow .25s ease',
      }}>

      {/* Full-bleed thumbnail */}
      <ThumbComp/>

      {/* Hover reveal overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 transition-all duration-200"
        style={{ background: 'rgba(0,0,0,0.55)', opacity: hovered ? 1 : 0, backdropFilter: hovered ? 'blur(2px)' : 'none' }}>
        <button
          onClick={() => onCustomize(tpl.id)}
          className="flex items-center gap-2 px-6 py-2.5 rounded-2xl font-bold text-sm text-white shadow-lg transition-transform hover:scale-105"
          style={{ background: tpl.accentColor === '#f97316' ? 'linear-gradient(135deg, #f97316, #ea580c)' : `linear-gradient(135deg, ${tpl.accentColor}, ${tpl.accentColor}cc)` }}>
          <Sliders size={14}/> Customize
        </button>
        {liveUrl && (
          <a href={liveUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2 rounded-2xl font-semibold text-xs text-white border border-white/30 hover:bg-white/10 transition-colors">
            <Eye size={13}/> Preview Live
          </a>
        )}
      </div>

      {/* Active badge */}
      {active && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: tpl.accentColor, boxShadow: `0 4px 12px ${tpl.accentColor}60` }}>
          <CheckCircle2 size={10} className="text-white"/>
          <span className="text-[9px] font-bold text-white uppercase tracking-wide">Active</span>
        </div>
      )}

      {/* Tag */}
      {!active && (
        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-bold"
          style={{ background: tpl.tagBg, color: tpl.tagColor, backdropFilter: 'blur(8px)' }}>
          {tpl.tag}
        </div>
      )}

      {/* Bottom info bar */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pt-10"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 60%, transparent 100%)' }}>
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <h3 className="text-base font-black text-white leading-tight">{tpl.name}</h3>
            <p className="text-[10px] font-medium mt-0.5" style={{ color: tpl.accentColor === '#f97316' ? '#fdba74' : tpl.tagColor }}>{tpl.mood}</p>
          </div>
        </div>
        <p className="text-[10px] text-white/55 leading-relaxed line-clamp-2 mb-3">{tpl.desc}</p>
        <button
          onClick={() => onCustomize(tpl.id)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-white transition-all"
          style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
          <Sliders size={11}/> {active ? 'Edit Design' : 'Use Template'}
        </button>
      </div>
    </div>
  );
}

// ─── Main Themes page ───────────────────────────────────────
export default function Themes() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: rd, isLoading } = useQuery({
    queryKey: ['my-restaurant'],
    queryFn:  restaurantService.getMine,
  });
  const restaurant = rd?.data;

  const [mode,   setMode]   = useState('gallery');
  const [selTpl, setSelTpl] = useState(null);
  const [config, setConfig] = useState(defaultConfig(null));

  useEffect(() => { if (restaurant) setConfig(defaultConfig(restaurant)); }, [restaurant]);

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

  const { mutate: togglePublish, isPending: publishing } = useMutation({
    mutationFn: (val) => restaurantService.update({ isPublished: val }),
    onSuccess: (_, val) => {
      qc.invalidateQueries({ queryKey: ['my-restaurant'] });
      toast.success(val ? 'Website published! 🎉' : 'Website unpublished');
    },
    onError: () => toast.error('Failed to update publish status'),
  });

  const hasMenu      = restaurant?.menu?.some(c => c.items?.length > 0);
  const isPublished  = restaurant?.isPublished ?? false;
  const activeTplId  = restaurant?.template?.id ?? 'classic';
  const activeTpl    = TEMPLATES.find(t => t.id === activeTplId);

  const openCustomize = (id) => navigate('/admin/themes/customize', { state: { themeId: id } });

  const handleHeroUpload = async (file) => {
    if (!file) return;
    setC('heroBackground', await resizeToBase64(file, 1600, 0.85));
  };

  const previewRestaurant = restaurant ? {
    ...restaurant, ...config, slug: restaurant.slug,
    coverImage: restaurant.coverImage,
    heroBackground: config.heroBackground ?? restaurant.coverImage,
    vipService: restaurant.vipService,
  } : null;

  const PreviewComponent = TEMPLATES.find(t => t.id === (selTpl ?? config.id))?.Component;

  // ── Gallery mode ──────────────────────────────────────────
  if (mode === 'gallery') {
    return (
      <div className="p-5 sm:p-6 space-y-8 max-w-6xl">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Palette size={18} className="text-orange-500"/>
              <h1 className="text-xl font-black text-gray-900 dark:text-white">Website Templates</h1>
            </div>
            <p className="text-xs text-gray-400">
              Choose your look — all templates are fully customisable with your brand colours, images and copy.
            </p>
          </div>
          {restaurant?.slug && (
            <a href={`/r/${restaurant.slug}`} target="_blank" rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
              <ExternalLink size={13}/> View Live
            </a>
          )}
        </div>

        {/* Active + Publish row */}
        {restaurant && (
          <div className="grid sm:grid-cols-2 gap-4">

            {/* Active template */}
            <div className="flex items-center gap-4 p-4 rounded-2xl"
              style={{ background: `linear-gradient(135deg, ${activeTpl?.accentColor ?? '#f97316'}12, ${activeTpl?.accentColor ?? '#f97316'}06)`, border: `1px solid ${activeTpl?.accentColor ?? '#f97316'}28` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: activeTpl?.accentColor ?? '#f97316' }}>
                <Sparkles size={18} className="text-white"/>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-gray-900 dark:text-white">Active template</p>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ background: activeTpl?.accentColor ?? '#f97316' }}>
                    {activeTpl?.name ?? 'Classic'}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5 truncate">{activeTpl?.mood ?? 'Warm · Elegant'}</p>
              </div>
              <button onClick={() => openCustomize(activeTplId)}
                className="shrink-0 ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors text-white"
                style={{ background: activeTpl?.accentColor ?? '#f97316' }}>
                <Sliders size={11}/> Edit
              </button>
            </div>

            {/* Publish panel */}
            <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-colors ${isPublished ? 'bg-emerald-50 dark:bg-emerald-500/8 border-emerald-200 dark:border-emerald-500/20' : 'bg-gray-50 dark:bg-white/3 border-gray-200 dark:border-white/8'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isPublished ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-white/10'}`}>
                {isPublished ? <Globe size={18} className="text-white"/> : <GlobeLock size={18} className="text-gray-500 dark:text-gray-400"/>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900 dark:text-white">
                  {isPublished ? 'Website is live' : 'Not published'}
                </p>
                <p className="text-[10px] text-gray-400 truncate">
                  {isPublished && restaurant.slug ? `restora.app/r/${restaurant.slug}` : 'Publish to go live'}
                </p>
                {!hasMenu && (
                  <div className="flex items-center gap-1 mt-0.5 text-[9px] text-amber-500">
                    <AlertTriangle size={9}/> Menu needed first —{' '}
                    <a href="/admin/menu" className="underline">add items</a>
                  </div>
                )}
              </div>
              <button
                onClick={() => hasMenu && togglePublish(!isPublished)}
                disabled={publishing || (!hasMenu && !isPublished)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isPublished ? 'bg-red-50 dark:bg-red-500/10 text-red-500 border border-red-200 dark:border-red-500/20' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'}`}>
                {publishing ? <RefreshCw size={11} className="animate-spin"/> : isPublished ? <GlobeLock size={11}/> : <Globe size={11}/>}
                {isPublished ? 'Unpublish' : 'Publish'}
              </button>
            </div>
          </div>
        )}

        {/* Template grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" style={{ aspectRatio: '3/4' }}/>
            ))}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">All Templates</h2>
              <p className="text-xs text-gray-400">{TEMPLATES.length} designs available</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {TEMPLATES.map(tpl => (
                <ThemeCard
                  key={tpl.id}
                  tpl={tpl}
                  active={activeTplId === tpl.id}
                  onCustomize={openCustomize}
                  liveUrl={restaurant?.slug ? `/r/${restaurant.slug}` : null}
                />
              ))}
            </div>
          </div>
        )}

        {!isLoading && !restaurant && (
          <div className="text-center py-20">
            <LayoutTemplate size={36} className="mx-auto mb-3 text-gray-300 dark:text-white/15"/>
            <p className="text-sm font-semibold text-gray-400">Complete your restaurant setup first</p>
            <a href="/admin/setup" className="text-xs text-orange-500 hover:underline mt-1.5 block">
              Go to Restaurant Setup →
            </a>
          </div>
        )}
      </div>
    );
  }

  // ── Customizer mode ───────────────────────────────────────
  const tplMeta = TEMPLATES.find(t => t.id === (selTpl ?? config.id));
  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* Topbar */}
      <div className="shrink-0 flex items-center gap-4 px-5 py-3.5 bg-white dark:bg-[#141414] border-b border-gray-100 dark:border-white/6">
        <button onClick={() => { setMode('gallery'); setSelTpl(null); }}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ArrowLeft size={15}/> Templates
        </button>
        <div className="h-4 w-px bg-gray-200 dark:bg-white/10"/>
        <div className="flex items-center gap-2">
          <Palette size={13} className="text-orange-500"/>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            Customising: <span className="text-orange-500">{tplMeta?.name}</span>
          </span>
        </div>
        <div className="flex-1"/>
        {restaurant?.slug && (
          <a href={`/r/${restaurant.slug}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
            <ExternalLink size={12}/> Live
          </a>
        )}
        <button onClick={() => saveTemplate(config)} disabled={saving}
          className="flex items-center gap-2 px-5 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors shadow-sm shadow-orange-500/20">
          <Save size={13}/>{saving ? 'Saving…' : 'Save & Activate'}
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">

        {/* Form panel */}
        <div className="w-72 shrink-0 overflow-y-auto bg-white dark:bg-[#141414] border-r border-gray-100 dark:border-white/6 p-4 space-y-6">

          {/* Template quick-switch */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Template</p>
            <div className="grid grid-cols-2 gap-1.5">
              {TEMPLATES.map(t => (
                <button key={t.id} onClick={() => setC('id', t.id)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all border ${config.id === t.id ? 'text-white border-orange-500 shadow-sm shadow-orange-500/20' : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-orange-300'}`}
                  style={config.id === t.id ? { background: t.accentColor } : {}}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Identity */}
          <div className="space-y-3">
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><Type size={10}/> Identity</p>
            <FormField label="Slogan / Tagline">
              <FormInput value={config.slogan} onChange={e => setC('slogan', e.target.value)} placeholder="e.g. The taste of authenticity"/>
            </FormField>
            <FormField label="Badge / Category">
              <FormInput value={config.badge} onChange={e => setC('badge', e.target.value)} placeholder="e.g. Fine Dining · Tunis"/>
            </FormField>
            <FormField label="CTA Button Text">
              <FormInput value={config.ctaText} onChange={e => setC('ctaText', e.target.value)} placeholder="Reserve a Table"/>
            </FormField>
            <FormField label="Discover More Button">
              <FormInput value={config.discoverText} onChange={e => setC('discoverText', e.target.value)} placeholder="Discover More"/>
            </FormField>
            <FormField label="VIP Button Text">
              <FormInput value={config.vipCtaText} onChange={e => setC('vipCtaText', e.target.value)} placeholder="Book VIP Table"/>
            </FormField>
          </div>

          {/* VIP */}
          <div className="space-y-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/8 border border-amber-200 dark:border-amber-500/20">
            <p className="text-[9px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 flex items-center gap-1.5"><Crown size={10}/> VIP Booking</p>
            <p className="text-[10px] text-amber-700 dark:text-amber-500/80 leading-relaxed">
              Enable to show the VIP booking flow. Manage tables in{' '}
              <a href="/admin/vip-setup" className="font-bold underline">VIP Setup</a>.
            </p>
          </div>

          {/* Visual style */}
          <div className="space-y-3">
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><Sparkles size={10}/> Visual Style</p>
            <FormField label="Accent Colour">
              <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 focus-within:border-orange-400 transition-colors">
                <input type="color" value={config.primaryColor} onChange={e => setC('primaryColor', e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0"/>
                <span className="text-sm font-mono text-gray-600 dark:text-gray-400">{config.primaryColor}</span>
              </div>
            </FormField>
            <FormField label="Hero Background Image">
              <button type="button" onClick={() => heroRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl overflow-hidden hover:border-orange-300 dark:hover:border-orange-500/30 transition-colors">
                <input ref={heroRef} type="file" accept="image/*" className="hidden" onChange={e => handleHeroUpload(e.target.files?.[0])}/>
                {config.heroBackground ? (
                  <div className="relative">
                    <img src={config.heroBackground} alt="" className="w-full h-20 object-cover"/>
                    <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-xs font-semibold">Click to change</span>
                  </div>
                ) : (
                  <div className="py-4 flex flex-col items-center gap-1.5 bg-gray-50 dark:bg-white/3">
                    <Camera size={16} className="text-gray-400"/>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Upload custom hero image</p>
                    <p className="text-[10px] text-gray-400">Uses restaurant cover by default</p>
                  </div>
                )}
              </button>
              {config.heroBackground && (
                <button onClick={() => setC('heroBackground', null)} className="text-[10px] text-red-400 hover:text-red-600 transition-colors mt-1">
                  ✕ Remove custom hero
                </button>
              )}
            </FormField>
          </div>

          {/* Sections */}
          <div className="space-y-1">
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5"><LayoutTemplate size={10}/> Show Sections</p>
            <Toggle label="About / Our Story"  value={config.showAbout}   onChange={v => setC('showAbout',   v)}/>
            <Toggle label="Menu"               value={config.showMenu}    onChange={v => setC('showMenu',    v)}/>
            <Toggle label="Gallery"            value={config.showGallery} onChange={v => setC('showGallery', v)}/>
            <Toggle label="Opening Hours"      value={config.showHours}   onChange={v => setC('showHours',   v)}/>
          </div>

          {/* Footer */}
          <div className="space-y-3">
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><ImageIcon size={10}/> Footer</p>
            <FormField label="Footer Text">
              <FormInput value={config.footerText} onChange={e => setC('footerText', e.target.value)}
                placeholder={`© ${new Date().getFullYear()} ${restaurant?.name || 'Your Restaurant'}`}/>
            </FormField>
          </div>
        </div>

        {/* Live preview */}
        <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-[#0a0a0a] flex flex-col">
          <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-white/5 border-b border-gray-300 dark:border-white/8">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400"/>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"/>
              <div className="w-2.5 h-2.5 rounded-full bg-green-400"/>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="bg-white dark:bg-white/10 rounded-lg px-3 py-1 text-[10px] text-gray-400 font-mono flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400"/>
                {restaurant?.slug ? `restora.app/r/${restaurant.slug}` : 'your-restaurant.restora.app'}
              </div>
            </div>
            <RefreshCw size={12} className="text-gray-400"/>
          </div>
          {previewRestaurant && PreviewComponent ? (
            <div className="flex-1 overflow-hidden relative">
              <div style={{ width: '1280px', transformOrigin: 'top left', transform: 'scale(var(--ps, 0.6))', pointerEvents: 'none', userSelect: 'none' }}
                className="[--ps:0.52] sm:[--ps:0.58] lg:[--ps:0.65]">
                <PreviewComponent data={previewRestaurant}/>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              {isLoading
                ? <RefreshCw size={24} className="text-gray-400 animate-spin"/>
                : <div className="text-center text-gray-400">
                    <LayoutTemplate size={32} className="mx-auto mb-2 opacity-30"/>
                    <p className="text-sm">Complete restaurant setup to preview</p>
                    <a href="/admin/setup" className="text-xs text-orange-500 mt-1 block hover:underline">Go to Setup</a>
                  </div>
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
