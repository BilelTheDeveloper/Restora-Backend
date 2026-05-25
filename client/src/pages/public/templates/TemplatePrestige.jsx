import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, MapPin, Clock, Menu, X, Crown, ExternalLink, ChevronDown, Calendar } from 'lucide-react';

const DAYS_ORDER = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const HERO_FALLBACK = 'https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=2074&auto=format&fit=crop';

function hexToRgb(hex) {
  const h = (hex || '#f97316').replace('#','');
  return `${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)}`;
}

function IGIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  );
}
function FBIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
    </svg>
  );
}
function TKIcon({ size = 14 }) {
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

  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMenuCat, setActiveMenuCat] = useState(0);
  const [lightboxImg, setLightboxImg] = useState(null);
  const clr  = primaryColor;
  const rgb  = hexToRgb(clr);
  const hero = heroBackground || coverImage || HERO_FALLBACK;
  const sortedHours = DAYS_ORDER.map(d => openingHours?.find(h => h.day === d)).filter(Boolean);
  const menuCats = (menu ?? []).filter(c => c.items?.length > 0);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const navLinks = [
    ...(showMenu    ? [{ name: 'Menu',    href: '#menu'    }] : []),
    ...(showAbout   ? [{ name: 'Story',   href: '#about'   }] : []),
    ...(showGallery ? [{ name: 'Gallery', href: '#gallery' }] : []),
    { name: 'Contact', href: '#contact-footer' },
  ];

  return (
    <div className="font-sans bg-[#090909] text-white min-h-screen overflow-x-hidden selection:bg-amber-500/20">

      {/* ── NAVBAR ── */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-black/92 backdrop-blur-2xl border-b border-white/6' : 'bg-transparent'
      }`} style={{ padding: scrolled ? '12px 0' : '24px 0' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${clr}22` }}>
              <Crown size={13} style={{ color: clr }} />
            </div>
            <span className="text-base font-black uppercase" style={{ letterSpacing: '0.2em' }}>{name}</span>
          </div>

          <nav className="hidden md:flex items-center gap-10 text-[11px] font-bold tracking-[0.2em] uppercase text-white/45">
            {navLinks.map(l => (
              <a key={l.name} href={l.href} className="hover:text-white transition-colors">{l.name}</a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {vipService?.enabled && (
              <button onClick={() => navigate(`/r/${slug}/vip`)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all hover:scale-105"
                      style={{ backgroundColor: clr, color: '#000', boxShadow: `0 4px 20px rgba(${rgb},0.45)` }}>
                <Crown size={11} /> {vipCtaText}
              </button>
            )}
            {contact?.phone && (
              <a href={`tel:${contact.phone}`}
                 className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white/55 border border-white/12 hover:border-white/35 hover:text-white transition-all">
                <Phone size={11} /> Call
              </a>
            )}
          </div>

          <button className="md:hidden text-white/70 hover:text-white" onClick={() => setMobileOpen(true)}>
            <Menu size={26} />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex flex-col p-8">
            <div className="flex justify-between items-center mb-14">
              <div className="flex items-center gap-2">
                <Crown size={16} style={{ color: clr }} />
                <span className="font-black uppercase tracking-widest">{name}</span>
              </div>
              <button onClick={() => setMobileOpen(false)}>
                <X size={26} className="text-white/60 hover:text-white" />
              </button>
            </div>
            <div className="flex flex-col gap-6">
              {navLinks.map((l, i) => (
                <motion.a key={l.name} href={l.href} onClick={() => setMobileOpen(false)}
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                          className="text-3xl font-black uppercase tracking-tight text-white/70 hover:text-white border-b border-white/6 pb-4">
                  {l.name}
                </motion.a>
              ))}
            </div>
            <div className="mt-auto space-y-3">
              {vipService?.enabled && (
                <button onClick={() => { navigate(`/r/${slug}/vip`); setMobileOpen(false); }}
                        className="w-full py-4 rounded-2xl text-sm font-black"
                        style={{ backgroundColor: clr, color: '#000' }}>
                  <Crown size={13} className="inline mr-2" />{vipCtaText}
                </button>
              )}
              {contact?.phone && (
                <a href={`tel:${contact.phone}`}
                   className="block w-full py-4 rounded-2xl text-sm font-black text-center border border-white/15 text-white/60">
                  {contact.phone}
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-end overflow-hidden">
        <img src={hero} alt={name} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090909] via-transparent to-black/30" />
        {/* Gold accent line */}
        <div className="absolute top-0 inset-x-0 h-[2px]" style={{ background: `linear-gradient(to right, ${clr}, transparent 70%)` }} />

        <div className="relative w-full max-w-7xl mx-auto px-6 md:px-10 pb-24 pt-36">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: 'easeOut' }}>
            <div className="flex flex-wrap gap-2 mb-8">
              {cuisine?.map(c => (
                <span key={c} className="text-[10px] font-black uppercase tracking-[0.25em] px-3 py-1.5 rounded-full"
                      style={{ backgroundColor: `rgba(${rgb},0.15)`, color: clr, border: `1px solid rgba(${rgb},0.3)` }}>
                  {c}
                </span>
              ))}
              {isHalal && (
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Halal</span>
              )}
            </div>

            {badge && (
              <p className="text-xs font-bold uppercase tracking-[0.4em] mb-4" style={{ color: clr }}>
                — {badge} —
              </p>
            )}

            <h1 className="text-[clamp(3.5rem,12vw,8rem)] font-black leading-[0.88] tracking-tighter mb-6 text-white">
              {name}
            </h1>

            {slogan && (
              <p className="text-lg md:text-2xl text-white/50 font-light italic max-w-xl leading-relaxed mb-10">
                {slogan}
              </p>
            )}

            {rating > 0 && (
              <div className="flex items-center gap-2 mb-10">
                <div className="flex">
                  {[1,2,3,4,5].map(i => (
                    <span key={i} style={{ color: i <= Math.round(rating) ? '#fbbf24' : 'rgba(255,255,255,0.12)', fontSize: 17 }}>★</span>
                  ))}
                </div>
                <span className="text-sm font-bold text-white/50">{rating.toFixed(1)}</span>
                <span className="text-sm text-white/25">({reviewCount} reviews)</span>
              </div>
            )}

            <div className="flex flex-wrap gap-4 items-center">
              <a href="#menu"
                 className="group flex items-center gap-3 px-8 py-4 rounded-2xl text-sm font-bold text-white border border-white/20 hover:border-white/50 hover:bg-white/5 transition-all">
                {discoverText} <ChevronDown size={15} className="group-hover:translate-y-1 transition-transform" />
              </a>
              {vipService?.enabled && (
                <button onClick={() => navigate(`/r/${slug}/vip`)}
                        className="group flex items-center gap-3 px-8 py-4 rounded-2xl text-sm font-black transition-all hover:scale-105"
                        style={{ backgroundColor: clr, color: '#000', boxShadow: `0 8px 40px rgba(${rgb},0.5)` }}>
                  <Crown size={14} /> {vipCtaText}
                </button>
              )}
              {googleMapsLink && (
                <a href={googleMapsLink} target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-2 text-sm text-white/35 hover:text-white/65 transition-colors">
                  <MapPin size={13} />
                  <span className="underline underline-offset-4">{address?.city || 'Find us'}</span>
                </a>
              )}
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-25 animate-bounce">
          <div className="w-px h-10 bg-gradient-to-b from-white to-transparent" />
        </div>
      </section>

      {/* ── INFO STRIP ── */}
      <div className="border-y border-white/6 bg-[#0f0f0f]">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-4 flex flex-wrap gap-6 items-center text-xs text-white/30">
          {address?.city && (
            <span className="flex items-center gap-2">
              <MapPin size={11} style={{ color: clr }} />{address.street && `${address.street}, `}{address.city}
            </span>
          )}
          {contact?.phone && (
            <a href={`tel:${contact.phone}`} className="flex items-center gap-2 hover:text-white/55 transition-colors">
              <Phone size={11} style={{ color: clr }} />{contact.phone}
            </a>
          )}
          {googleMapsLink && (
            <a href={googleMapsLink} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-1.5 font-bold transition-colors hover:opacity-70" style={{ color: clr }}>
              Get Directions <ExternalLink size={10} />
            </a>
          )}
          <div className="flex-1" />
          {vipService?.enabled && (
            <button onClick={() => navigate(`/r/${slug}/vip`)}
                    className="flex items-center gap-1.5 font-bold transition-colors hover:opacity-70" style={{ color: clr }}>
              <Crown size={10} /> VIP Reservations
            </button>
          )}
        </div>
      </div>

      {/* ── MENU ── */}
      {showMenu && menuCats.length > 0 && (
        <section id="menu" className="py-28 border-b border-white/5">
          <div className="max-w-7xl mx-auto px-6 md:px-10">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="flex items-end justify-between mb-14">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.45em] mb-3" style={{ color: clr }}>Culinary Experience</p>
                <div className="w-20 h-[2px] mb-1" style={{ background: `linear-gradient(to right, ${clr}, transparent)` }} />
                <h2 className="text-5xl md:text-6xl font-black tracking-tighter leading-none text-white uppercase mt-4">Our Menu</h2>
              </div>
            </motion.div>

            {/* Category tabs */}
            {menuCats.length > 1 && (
              <div className="flex gap-2 flex-wrap mb-12">
                {menuCats.map((cat, i) => (
                  <button key={i} onClick={() => setActiveMenuCat(i)}
                          className="px-5 py-2.5 rounded-xl text-xs font-black transition-all"
                          style={activeMenuCat === i
                            ? { backgroundColor: clr, color: '#000' }
                            : { backgroundColor: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    {cat.category}
                  </button>
                ))}
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div key={activeMenuCat} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
                          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {menuCats[activeMenuCat]?.items.filter(i => i.available !== false).map((item, ii) => (
                  <motion.div key={ii} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: ii * 0.06 }}
                              className="group relative rounded-2xl overflow-hidden border border-white/6 hover:border-white/15 transition-all duration-300 hover:-translate-y-1"
                              style={{ background: 'rgba(255,255,255,0.025)' }}>
                    {item.image ? (
                      <div className="aspect-video overflow-hidden">
                        <img src={item.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-75 group-hover:opacity-100" />
                      </div>
                    ) : (
                      <div className="aspect-video flex items-center justify-center text-4xl"
                           style={{ background: `radial-gradient(${clr}18, transparent)` }}>
                        🍽
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <p className="font-bold text-white/85">{item.name}</p>
                        <span className="shrink-0 text-xs font-black px-2.5 py-1 rounded-lg"
                              style={{ backgroundColor: `${clr}22`, color: clr }}>
                          {item.price} TND
                        </span>
                      </div>
                      {item.description && <p className="text-xs text-white/30 line-clamp-2 leading-relaxed">{item.description}</p>}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* ── ABOUT ── */}
      {showAbout && (about?.text || about?.image) && (
        <section id="about" className="py-28 md:py-36 border-b border-white/5">
          <div className="max-w-7xl mx-auto px-6 md:px-10">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className={`grid gap-16 items-center ${about?.image ? 'md:grid-cols-2' : 'max-w-3xl'}`}>
              {about?.image && (
                <div className="relative">
                  <div className="absolute -inset-4 rounded-[2rem] opacity-25 blur-2xl" style={{ background: `radial-gradient(${clr}, transparent)` }} />
                  <div className="relative rounded-[2rem] overflow-hidden aspect-[3/4] shadow-2xl"
                       style={{ boxShadow: `0 40px 80px rgba(${rgb},0.25)` }}>
                    <img src={about.image} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                </div>
              )}
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.45em] mb-4" style={{ color: clr }}>Our Story</p>
                <div className="w-20 h-[2px] mb-8" style={{ background: `linear-gradient(to right, ${clr}, transparent)` }} />
                <p className="text-xl md:text-2xl text-white/60 font-light leading-relaxed mb-8">{about?.text}</p>
                {contact?.phone && (
                  <a href={`tel:${contact.phone}`}
                     className="inline-flex items-center gap-2 text-sm font-bold transition-all hover:gap-4"
                     style={{ color: clr }}>
                    Make a Reservation <ExternalLink size={13} />
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ── GALLERY ── */}
      {showGallery && images?.length > 0 && (
        <section id="gallery" className="py-28 border-b border-white/5">
          <div className="max-w-7xl mx-auto px-6 md:px-10">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="mb-12">
              <p className="text-[10px] font-black uppercase tracking-[0.45em] mb-3" style={{ color: clr }}>Atmosphere</p>
              <div className="w-20 h-[2px]" style={{ background: `linear-gradient(to right, ${clr}, transparent)` }} />
            </motion.div>
            <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
              {images.map((img, i) => (
                <motion.div key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => setLightboxImg(img)}
                            className="break-inside-avoid relative overflow-hidden rounded-2xl cursor-pointer group">
                  <img src={img} alt="" className="w-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-current opacity-0 group-hover:opacity-100 rounded-2xl transition-all duration-300"
                       style={{ borderColor: clr }} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer id="contact-footer" className="border-t border-white/6 pt-20 pb-10" style={{ background: '#060606' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="grid md:grid-cols-4 gap-12 mb-16">

            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${clr}22` }}>
                  <Crown size={13} style={{ color: clr }} />
                </div>
                <span className="font-black text-lg tracking-widest uppercase">{name}</span>
              </div>
              {slogan && <p className="text-sm text-white/35 italic leading-relaxed mb-6">{slogan}</p>}
              <div className="flex gap-2 mb-5">
                {socialMedia?.instagram && (
                  <a href={socialMedia.instagram} target="_blank" rel="noopener noreferrer"
                     className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center text-white/35 hover:text-white hover:border-white/30 transition-all">
                    <IGIcon size={13} />
                  </a>
                )}
                {socialMedia?.facebook && (
                  <a href={socialMedia.facebook} target="_blank" rel="noopener noreferrer"
                     className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center text-white/35 hover:text-white hover:border-white/30 transition-all">
                    <FBIcon size={13} />
                  </a>
                )}
                {socialMedia?.tiktok && (
                  <a href={socialMedia.tiktok} target="_blank" rel="noopener noreferrer"
                     className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center text-white/35 hover:text-white hover:border-white/30 transition-all">
                    <TKIcon size={13} />
                  </a>
                )}
              </div>
              {vipService?.enabled && (
                <button onClick={() => navigate(`/r/${slug}/vip`)}
                        className="flex items-center gap-1.5 text-xs font-black transition-all hover:scale-105" style={{ color: clr }}>
                  <Crown size={10} /> {vipCtaText}
                </button>
              )}
            </div>

            {sortedHours.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/25 mb-5 flex items-center gap-2">
                  <Clock size={10} style={{ color: clr }} /> Hours
                </p>
                <div className="space-y-2.5">
                  {sortedHours.map((h, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="capitalize text-white/35">{h.day.slice(0,3)}</span>
                      <span className={h.isClosed ? 'text-red-400/55' : 'text-white/55'}>
                        {h.isClosed ? 'Closed' : `${h.open} – ${h.close}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/25 mb-5">Contact</p>
              <div className="space-y-3">
                {contact?.phone && (
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-2.5 text-sm text-white/45 hover:text-white/80 transition-colors">
                    <Phone size={11} style={{ color: clr }} />{contact.phone}
                  </a>
                )}
                {contact?.email && (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-2.5 text-sm text-white/45 hover:text-white/80 transition-colors break-all">
                    <ExternalLink size={11} style={{ color: clr }} />{contact.email}
                  </a>
                )}
                {address?.city && (
                  <div className="flex items-start gap-2.5 text-sm text-white/45">
                    <MapPin size={11} className="mt-0.5 shrink-0" style={{ color: clr }} />
                    {address.street && `${address.street}, `}{address.city}
                  </div>
                )}
                {googleMapsLink && (
                  <a href={googleMapsLink} target="_blank" rel="noopener noreferrer"
                     className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all hover:scale-105"
                     style={{ borderColor: clr, color: clr, backgroundColor: `rgba(${rgb},0.08)` }}>
                    <MapPin size={10} /> Open in Maps
                  </a>
                )}
              </div>
            </div>

            <div className="rounded-3xl p-6 space-y-5"
                 style={{ background: `rgba(${rgb},0.07)`, border: `1px solid rgba(${rgb},0.2)` }}>
              <Calendar size={30} style={{ color: clr }} />
              <h4 className="font-black text-lg text-white uppercase italic tracking-tight">Reserve a Table</h4>
              <p className="text-xs text-white/40 leading-relaxed">Experience fine dining at its best. Book your exclusive table now.</p>
              {vipService?.enabled && (
                <button onClick={() => navigate(`/r/${slug}/vip`)}
                        className="w-full py-3.5 rounded-2xl text-xs font-black text-black shadow-lg transition-all hover:scale-105"
                        style={{ backgroundColor: clr, boxShadow: `0 8px 24px rgba(${rgb},0.4)` }}>
                  <Crown size={12} className="inline mr-1.5" />{vipCtaText}
                </button>
              )}
              {contact?.phone && (
                <a href={`tel:${contact.phone}`}
                   className="block w-full py-3.5 rounded-2xl text-xs font-black text-center border border-white/15 text-white/60 hover:border-white/35 hover:text-white transition-all">
                  Call to Reserve
                </a>
              )}
            </div>
          </div>

          <div className="border-t border-white/6 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-white/18">
            <span>{footerText || `© ${new Date().getFullYear()} ${name}. All rights reserved.`}</span>
            <span>Powered by <a href="/" className="hover:text-white/40 transition-colors font-semibold" style={{ color: clr }}>Restora</a></span>
          </div>
        </div>
      </footer>

      {/* ── LIGHTBOX ── */}
      <AnimatePresence>
        {lightboxImg && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/92 backdrop-blur-xl p-4"
                      onClick={() => setLightboxImg(null)}>
            <motion.img initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                        src={lightboxImg} alt="" className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl" />
            <button className="absolute top-5 right-5 p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
                    onClick={() => setLightboxImg(null)}>
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
