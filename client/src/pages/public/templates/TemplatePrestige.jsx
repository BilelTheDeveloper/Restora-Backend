import { useState, useEffect } from 'react';
import { MapPin, Phone, Clock, ExternalLink, ChevronDown, Crown } from 'lucide-react';
import VIPBookingModal from '../../../components/VIPBookingModal';

function IGIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}
function FBIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
    </svg>
  );
}

const DAYS_ORDER = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return `${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)}`;
}

function TikTokIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.89a8.17 8.17 0 004.78 1.52V7.02a4.85 4.85 0 01-1.01-.33z"/>
    </svg>
  );
}

export default function TemplatePrestige({ data }) {
  const {
    name, slug, slogan, badge, cuisine, coverImage, heroBackground, primaryColor = '#f97316',
    about, menu, images, socialMedia, googleMapsLink,
    contact, address, openingHours, footerText,
    showMenu = true, showGallery = true, showAbout = true,
    vipService, discoverText = 'Discover More', vipCtaText = 'Book VIP Table',
    isHalal, rating, reviewCount,
  } = data;

  const [showVIP, setShowVIP] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeMenuCat, setActiveMenuCat] = useState(0);
  const [lightboxImg, setLightboxImg] = useState(null);
  const hero = heroBackground || coverImage;
  const clr  = primaryColor;
  const rgb  = hexToRgb(clr.startsWith('#') ? clr : '#f97316');

  const menuCats = (menu ?? []).filter(c => c.items?.length > 0);
  const sortedHours = DAYS_ORDER.map(d => openingHours?.find(h => h.day === d)).filter(Boolean);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleDiscover = () => {
    const id = showAbout ? 'about' : showMenu ? 'menu' : showGallery ? 'gallery' : 'contact-footer';
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="font-sans bg-[#090909] text-white min-h-screen">

      {/* ── Nav ── */}
      <header
        className="fixed top-0 inset-x-0 z-50 transition-all duration-500"
        style={{
          background: scrolled ? 'rgba(9,9,9,0.96)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-10 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: clr + '22' }}>
              <Crown size={14} style={{ color: clr }} />
            </div>
            <span className="text-base font-black tracking-widest uppercase" style={{ letterSpacing: '0.2em' }}>{name}</span>
          </div>

          <nav className="hidden md:flex items-center gap-10 text-[11px] font-bold tracking-[0.18em] uppercase text-white/50">
            {showAbout   && <a href="#about"   className="hover:text-white transition-colors">Story</a>}
            {showMenu    && <a href="#menu"    className="hover:text-white transition-colors">Menu</a>}
            {showGallery && <a href="#gallery" className="hover:text-white transition-colors">Gallery</a>}
            <a href="#contact-footer" className="hover:text-white transition-colors">Contact</a>
          </nav>

          <div className="flex items-center gap-3">
            {vipService?.enabled && (
              <button
                onClick={() => setShowVIP(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all hover:scale-105"
                style={{ backgroundColor: clr, color: '#000', boxShadow: `0 4px 20px rgba(${rgb},0.4)` }}
              >
                <Crown size={11} /> {vipCtaText}
              </button>
            )}
            {contact?.phone && (
              <a href={`tel:${contact.phone}`}
                 className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white/70 border border-white/15 hover:border-white/40 hover:text-white transition-all">
                <Phone size={11} /> Call
              </a>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-end overflow-hidden">
        {hero ? (
          <img src={hero} alt={name} className="absolute inset-0 w-full h-full object-cover scale-105 transition-transform duration-[20s]" style={{ transform: 'scale(1.05)' }} />
        ) : (
          <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 30% 50%, rgba(${rgb},0.3), transparent 70%)` }} />
        )}
        {/* Multi-layer cinematic overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090909] via-transparent to-black/30" />

        {/* Accent line top */}
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(to right, ${clr}, transparent)` }} />

        <div className="relative w-full max-w-7xl mx-auto px-6 md:px-10 pb-24 pt-32">
          {/* Cuisine tags */}
          <div className="flex flex-wrap gap-2 mb-8">
            {cuisine?.map(c => (
              <span key={c} className="text-[10px] font-black uppercase tracking-[0.25em] px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: `rgba(${rgb},0.15)`, color: clr, border: `1px solid rgba(${rgb},0.3)` }}>
                {c}
              </span>
            ))}
            {isHalal && (
              <span className="text-[10px] font-black uppercase tracking-[0.25em] px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Halal
              </span>
            )}
          </div>

          {badge && (
            <p className="text-xs font-bold uppercase tracking-[0.35em] mb-4" style={{ color: clr }}>
              — {badge} —
            </p>
          )}

          <h1 className="text-[clamp(3.5rem,12vw,8rem)] font-black leading-[0.9] tracking-tighter mb-6 text-white">
            {name}
          </h1>

          {slogan && (
            <p className="text-lg md:text-2xl text-white/55 font-light italic max-w-xl leading-relaxed mb-12">
              {slogan}
            </p>
          )}

          {rating > 0 && (
            <div className="flex items-center gap-2 mb-10">
              <div className="flex">
                {[1,2,3,4,5].map(i => (
                  <span key={i} style={{ color: i <= Math.round(rating) ? '#fbbf24' : 'rgba(255,255,255,0.15)', fontSize: 16 }}>★</span>
                ))}
              </div>
              <span className="text-sm font-bold text-white/60">{rating.toFixed(1)}</span>
              <span className="text-sm text-white/30">({reviewCount} reviews)</span>
            </div>
          )}

          {/* CTA row */}
          <div className="flex flex-wrap gap-4 items-center">
            <button
              onClick={handleDiscover}
              className="group flex items-center gap-3 px-8 py-4 rounded-2xl text-sm font-bold text-white border border-white/20 hover:border-white/50 hover:bg-white/8 transition-all"
            >
              {discoverText}
              <ChevronDown size={16} className="group-hover:translate-y-1 transition-transform" />
            </button>
            {vipService?.enabled && (
              <button
                onClick={() => setShowVIP(true)}
                className="group flex items-center gap-3 px-8 py-4 rounded-2xl text-sm font-black transition-all hover:scale-105 hover:shadow-2xl"
                style={{ backgroundColor: clr, color: '#000', boxShadow: `0 8px 40px rgba(${rgb},0.5)` }}
              >
                <Crown size={15} /> {vipCtaText}
              </button>
            )}
            {googleMapsLink && (
              <a href={googleMapsLink} target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors">
                <MapPin size={14} />
                <span className="underline underline-offset-4">{address?.city || 'Find us'}</span>
              </a>
            )}
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30 animate-bounce">
          <div className="w-px h-12 bg-gradient-to-b from-white to-transparent" />
          <ChevronDown size={12} className="text-white" />
        </div>
      </section>

      {/* ── Info strip ── */}
      <div className="border-y border-white/6 bg-[#0f0f0f]">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-4 flex flex-wrap gap-6 items-center text-xs text-white/35">
          {address?.city && (
            <span className="flex items-center gap-2">
              <MapPin size={12} style={{ color: clr }} />
              {address.street && `${address.street}, `}{address.city}
            </span>
          )}
          {contact?.phone && (
            <a href={`tel:${contact.phone}`} className="flex items-center gap-2 hover:text-white/60 transition-colors">
              <Phone size={12} style={{ color: clr }} />{contact.phone}
            </a>
          )}
          {googleMapsLink && (
            <a href={googleMapsLink} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-1.5 font-semibold transition-colors hover:text-white/60" style={{ color: clr }}>
              Get Directions <ExternalLink size={10} />
            </a>
          )}
          <div className="flex-1" />
          {vipService?.enabled && (
            <button onClick={() => setShowVIP(true)} className="flex items-center gap-1.5 font-bold transition-colors" style={{ color: clr }}>
              <Crown size={11} /> VIP Reservations
            </button>
          )}
        </div>
      </div>

      {/* ── About ── */}
      {showAbout && (about?.text || about?.image) && (
        <section id="about" className="py-28 md:py-36">
          <div className="max-w-7xl mx-auto px-6 md:px-10">
            <div className={`grid gap-16 items-center ${about?.image ? 'md:grid-cols-2' : 'max-w-3xl'}`}>
              {about?.image && (
                <div className="relative">
                  <div className="absolute -inset-4 rounded-[2rem] opacity-30 blur-2xl" style={{ background: `radial-gradient(${clr}, transparent)` }} />
                  <div className="relative rounded-[2rem] overflow-hidden aspect-[3/4]" style={{ boxShadow: `0 40px 80px rgba(${rgb},0.25)` }}>
                    <img src={about.image} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                </div>
              )}
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-4" style={{ color: clr }}>Our Story</p>
                <div className="w-20 h-[2px] mb-8" style={{ background: `linear-gradient(to right, ${clr}, transparent)` }} />
                <p className="text-xl md:text-2xl text-white/65 font-light leading-relaxed">{about?.text}</p>
                {contact?.phone && (
                  <a href={`tel:${contact.phone}`} className="inline-flex items-center gap-2 mt-10 text-sm font-bold transition-all hover:gap-4"
                     style={{ color: clr }}>
                    Make a Reservation <ExternalLink size={13} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Menu ── */}
      {showMenu && menuCats.length > 0 && (
        <section id="menu" className="py-28 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6 md:px-10">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-3" style={{ color: clr }}>Menu</p>
                <div className="w-20 h-[2px]" style={{ background: `linear-gradient(to right, ${clr}, transparent)` }} />
              </div>
            </div>

            {/* Category tabs */}
            {menuCats.length > 1 && (
              <div className="flex gap-2 flex-wrap mb-12">
                {menuCats.map((cat, i) => (
                  <button key={i} onClick={() => setActiveMenuCat(i)}
                          className="px-5 py-2 rounded-xl text-xs font-bold transition-all"
                          style={activeMenuCat === i
                            ? { backgroundColor: clr, color: '#000' }
                            : { backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {cat.category}
                  </button>
                ))}
              </div>
            )}

            {/* Items grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuCats[activeMenuCat]?.items.filter(i => i.available !== false).map((item, ii) => (
                <div key={ii}
                     className="group relative rounded-2xl overflow-hidden border border-white/6 hover:border-white/15 transition-all duration-300 hover:-translate-y-1"
                     style={{ background: 'rgba(255,255,255,0.03)' }}>
                  {item.image ? (
                    <div className="aspect-video overflow-hidden">
                      <img src={item.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100" />
                    </div>
                  ) : (
                    <div className="aspect-video flex items-center justify-center text-4xl" style={{ background: `radial-gradient(${clr}22, transparent)` }}>
                      🍽
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <p className="font-bold text-white/90">{item.name}</p>
                      <span className="shrink-0 text-xs font-black px-2.5 py-1 rounded-lg" style={{ backgroundColor: clr + '22', color: clr }}>
                        {item.price} TND
                      </span>
                    </div>
                    {item.description && <p className="text-xs text-white/35 line-clamp-2 leading-relaxed">{item.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Gallery ── */}
      {showGallery && images?.length > 0 && (
        <section id="gallery" className="py-28 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6 md:px-10">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-3" style={{ color: clr }}>Gallery</p>
            <div className="w-20 h-[2px] mb-12" style={{ background: `linear-gradient(to right, ${clr}, transparent)` }} />
            <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
              {images.map((img, i) => (
                <div key={i} onClick={() => setLightboxImg(img)}
                     className="break-inside-avoid relative overflow-hidden rounded-2xl cursor-pointer group"
                     style={{ boxShadow: `0 8px 40px rgba(0,0,0,0.4)` }}>
                  <img src={img} alt="" className="w-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"
                       style={{ '--hover-border-color': clr }}>
                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-current opacity-0 group-hover:opacity-100 rounded-2xl transition-all duration-300"
                         style={{ borderColor: clr }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer id="contact-footer" className="border-t border-white/8 pt-16 pb-8" style={{ background: '#060606' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="grid md:grid-cols-4 gap-10 mb-14">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: clr + '22' }}>
                  <Crown size={14} style={{ color: clr }} />
                </div>
                <span className="font-black text-lg tracking-widest uppercase">{name}</span>
              </div>
              {slogan && <p className="text-sm text-white/40 italic leading-relaxed mb-5">{slogan}</p>}
              <div className="flex gap-2">
                {socialMedia?.instagram && (
                  <a href={socialMedia.instagram} target="_blank" rel="noopener noreferrer"
                     className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all">
                    <IGIcon size={14} />
                  </a>
                )}
                {socialMedia?.facebook && (
                  <a href={socialMedia.facebook} target="_blank" rel="noopener noreferrer"
                     className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all">
                    <FBIcon size={14} />
                  </a>
                )}
                {socialMedia?.tiktok && (
                  <a href={socialMedia.tiktok} target="_blank" rel="noopener noreferrer"
                     className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all">
                    <TikTokIcon size={14} />
                  </a>
                )}
              </div>
            </div>

            {/* Opening hours */}
            {sortedHours.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-4 flex items-center gap-2">
                  <Clock size={11} style={{ color: clr }} /> Hours
                </p>
                <div className="space-y-2">
                  {sortedHours.map((h, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="capitalize text-white/40">{h.day.slice(0,3)}</span>
                      <span className={h.isClosed ? 'text-red-400/60' : 'text-white/55'}>
                        {h.isClosed ? 'Closed' : `${h.open} – ${h.close}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-4">Contact</p>
              <div className="space-y-3">
                {contact?.phone && (
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-2.5 text-sm text-white/50 hover:text-white/80 transition-colors">
                    <Phone size={12} style={{ color: clr }} />{contact.phone}
                  </a>
                )}
                {contact?.email && (
                  <a href={`mailto:${contact.email}`} className="flex items-start gap-2.5 text-sm text-white/50 hover:text-white/80 transition-colors break-all">
                    <ExternalLink size={12} className="mt-0.5 shrink-0" style={{ color: clr }} />{contact.email}
                  </a>
                )}
                {contact?.whatsapp && (
                  <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                     className="flex items-center gap-2.5 text-sm text-white/50 hover:text-emerald-400 transition-colors">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400">WA</span>
                    WhatsApp
                  </a>
                )}
              </div>
            </div>

            {/* Location */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-4">Find Us</p>
              {address?.city && (
                <p className="text-sm text-white/50 leading-relaxed mb-4">
                  {address.street && <>{address.street}<br /></>}{address.city}
                  {address.state && `, ${address.state}`}
                </p>
              )}
              {googleMapsLink && (
                <a href={googleMapsLink} target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all hover:scale-105"
                   style={{ borderColor: clr, color: clr, backgroundColor: `rgba(${rgb},0.08)` }}>
                  <MapPin size={11} /> Open in Maps
                </a>
              )}
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/6 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-white/20">
            <span>{footerText || `© ${new Date().getFullYear()} ${name}. All rights reserved.`}</span>
            <span>
              Powered by{' '}
              <a href="/" className="hover:text-white/40 transition-colors font-semibold" style={{ color: clr }}>Restora</a>
            </span>
          </div>
        </div>
      </footer>

      {/* ── Lightbox ── */}
      {lightboxImg && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-lg p-4"
             onClick={() => setLightboxImg(null)}>
          <img src={lightboxImg} alt="" className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl" />
          <button className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors" onClick={() => setLightboxImg(null)}>
            ✕
          </button>
        </div>
      )}

      {/* ── VIP Modal ── */}
      {showVIP && (
        <VIPBookingModal
          slug={slug}
          restaurantName={name}
          primaryColor={clr}
          onClose={() => setShowVIP(false)}
        />
      )}
    </div>
  );
}
