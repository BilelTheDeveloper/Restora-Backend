import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, MapPin, Clock, Menu, X, Crown, ExternalLink, ChevronDown, ArrowRight } from 'lucide-react';

const DAYS_ORDER = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const HERO_FALLBACK = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=2074&auto=format&fit=crop';

function IGIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  );
}
function FBIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  );
}
function TKIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
    </svg>
  );
}

export default function TemplateModern({ data }) {
  const {
    name, slug, slogan, badge, cuisine, coverImage, heroBackground, primaryColor = '#f97316',
    about, menu, images, socialMedia, googleMapsLink,
    contact, address, openingHours, footerText, ctaText = 'Reserve a Table',
    showMenu = true, showGallery = true, showAbout = true,
    vipService, discoverText = 'Discover More', vipCtaText = 'Book VIP Table',
    isHalal, rating, reviewCount,
  } = data;

  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMenuCat, setActiveMenuCat] = useState(0);
  const clr  = primaryColor;
  const hero = heroBackground || coverImage || HERO_FALLBACK;
  const sortedHours = DAYS_ORDER.map(d => openingHours?.find(h => h.day === d)).filter(Boolean);
  const menuCats = (menu ?? []).filter(c => c.items?.length > 0);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const navLinks = [
    ...(showMenu    ? [{ name: 'Menu',    href: '#menu'    }] : []),
    ...(showAbout   ? [{ name: 'About',   href: '#about'   }] : []),
    ...(showGallery ? [{ name: 'Gallery', href: '#gallery' }] : []),
    { name: 'Contact', href: '#footer-modern' },
  ];

  return (
    <div className="bg-[#080808] text-white font-sans overflow-x-hidden selection:bg-white/20">

      {/* ── NAVBAR ── */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled ? 'py-4 bg-black/90 backdrop-blur-2xl border-b border-white/6' : 'py-7 bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
          <span className="text-lg font-black tracking-[0.12em] uppercase">{name}</span>

          <div className="hidden md:flex items-center gap-10">
            {navLinks.map(l => (
              <a key={l.name} href={l.href}
                 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 hover:text-white transition-colors">
                {l.name}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {vipService?.enabled && (
              <button onClick={() => navigate(`/r/${slug}/vip`)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all hover:scale-105"
                      style={{ backgroundColor: clr, color: '#000', boxShadow: `0 4px 20px ${clr}55` }}>
                <Crown size={12} /> {vipCtaText}
              </button>
            )}
            {contact?.phone && (
              <a href={`tel:${contact.phone}`}
                 className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white/60 border border-white/15 hover:border-white/40 hover:text-white transition-all">
                <Phone size={12} /> Call
              </a>
            )}
          </div>

          <button className="md:hidden text-white/80 hover:text-white" onClick={() => setMobileOpen(true)}>
            <Menu size={26} />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, x: '100%' }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: '100%' }}
                      transition={{ type: 'tween', duration: 0.3 }}
                      className="fixed inset-0 z-[200] bg-black flex flex-col p-8">
            <div className="flex justify-end mb-14">
              <button onClick={() => setMobileOpen(false)}><X size={30} className="text-white/70 hover:text-white" /></button>
            </div>
            <div className="flex flex-col gap-8">
              {navLinks.map((l, i) => (
                <motion.a key={l.name} href={l.href} onClick={() => setMobileOpen(false)}
                          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                          className="text-4xl font-black uppercase tracking-tight text-white/80 hover:text-white border-b border-white/8 pb-5">
                  {l.name}
                </motion.a>
              ))}
            </div>
            <div className="mt-auto space-y-3">
              {vipService?.enabled && (
                <button onClick={() => { navigate(`/r/${slug}/vip`); setMobileOpen(false); }}
                        className="w-full py-4 rounded-xl text-sm font-black"
                        style={{ backgroundColor: clr, color: '#000' }}>
                  <Crown size={13} className="inline mr-2" />{vipCtaText}
                </button>
              )}
              {contact?.phone && (
                <a href={`tel:${contact.phone}`}
                   className="block w-full py-4 rounded-xl text-sm font-black text-center border border-white/20 text-white/60 hover:text-white transition-colors">
                  {ctaText}
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO ── */}
      <section className="relative h-screen overflow-hidden">
        <img src={hero} alt={name} className="absolute inset-0 w-full h-full object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#080808]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

        {/* Accent line */}
        <div className="absolute top-0 inset-x-0 h-0.5" style={{ background: `linear-gradient(to right, ${clr}, transparent 60%)` }} />

        <div className="relative h-full flex flex-col justify-end pb-28 px-8 md:px-16">
          <div className="max-w-4xl">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: 'easeOut' }}>
              {badge && (
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px w-10" style={{ backgroundColor: clr }} />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: clr }}>{badge}</span>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mb-6">
                {cuisine?.map(c => (
                  <span key={c} className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border"
                        style={{ borderColor: `${clr}50`, color: clr, backgroundColor: `${clr}10` }}>
                    {c}
                  </span>
                ))}
                {isHalal && (
                  <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Halal</span>
                )}
              </div>

              <h1 className="text-[clamp(3.5rem,11vw,7rem)] font-black leading-[0.9] tracking-tighter mb-6 text-white">
                {name}
              </h1>
              {slogan && (
                <p className="text-lg md:text-xl text-white/50 font-light max-w-2xl leading-relaxed mb-10 italic">
                  {slogan}
                </p>
              )}

              <div className="flex flex-wrap gap-4 items-center">
                <a href="#menu"
                   className="group flex items-center gap-3 px-8 py-4 rounded-2xl text-sm font-bold text-white/70 border border-white/20 hover:text-white hover:border-white/50 hover:bg-white/5 transition-all">
                  {discoverText} <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform" />
                </a>
                {vipService?.enabled && (
                  <button onClick={() => navigate(`/r/${slug}/vip`)}
                          className="flex items-center gap-3 px-8 py-4 rounded-2xl text-sm font-black transition-all hover:scale-105"
                          style={{ backgroundColor: clr, color: '#000', boxShadow: `0 0 40px ${clr}55` }}>
                    <Crown size={14} /> {vipCtaText}
                  </button>
                )}
              </div>

              {rating > 0 && (
                <div className="flex items-center gap-3 mt-10">
                  <div className="flex">
                    {[1,2,3,4,5].map(i => (
                      <span key={i} style={{ color: i <= Math.round(rating) ? '#fbbf24' : 'rgba(255,255,255,0.1)', fontSize: 16 }}>★</span>
                    ))}
                  </div>
                  <span className="text-white/40 text-sm">{rating.toFixed(1)} · {reviewCount} reviews</span>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Vertical cuisine tags */}
        <div className="absolute top-1/2 right-10 -translate-y-1/2 hidden xl:flex flex-col gap-4">
          {cuisine?.slice(0,3).map(c => (
            <span key={c} className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20"
                  style={{ writingMode: 'vertical-rl' }}>
              {c}
            </span>
          ))}
        </div>
      </section>

      {/* ── INFO STRIP ── */}
      <div className="border-y border-white/6 bg-[#0c0c0c]">
        <div className="max-w-7xl mx-auto px-8 py-4 flex flex-wrap gap-6 items-center text-xs text-white/35">
          {address?.city && (
            <span className="flex items-center gap-2">
              <MapPin size={12} style={{ color: clr }} />{address.street && `${address.street}, `}{address.city}
            </span>
          )}
          {contact?.phone && (
            <a href={`tel:${contact.phone}`} className="flex items-center gap-2 hover:text-white/60 transition-colors">
              <Phone size={12} style={{ color: clr }} />{contact.phone}
            </a>
          )}
          {googleMapsLink && (
            <a href={googleMapsLink} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-1.5 font-bold transition-colors hover:opacity-70" style={{ color: clr }}>
              Directions <ExternalLink size={10} />
            </a>
          )}
          {isHalal && (
            <span className="ml-auto px-3 py-1 rounded-full text-xs font-bold text-emerald-400 border border-emerald-500/25 bg-emerald-500/5">Halal Certified</span>
          )}
        </div>
      </div>

      {/* ── MENU ── */}
      {showMenu && menuCats.length > 0 && (
        <section id="menu" className="py-28 border-b border-white/5">
          <div className="max-w-7xl mx-auto px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="flex items-end justify-between mb-14">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-3" style={{ color: clr }}>What We Serve</p>
                <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none text-white uppercase">Our Menu</h2>
              </div>
              <div className="hidden md:flex flex-col items-end gap-1 text-white/20 text-xs font-bold mb-2">
                <span>{menuCats.reduce((a, c) => a + (c.items?.length || 0), 0)} items</span>
                <span>{menuCats.length} categories</span>
              </div>
            </motion.div>

            {/* Category tabs */}
            {menuCats.length > 1 && (
              <div className="flex gap-2 flex-wrap mb-12">
                {menuCats.map((cat, i) => (
                  <button key={i} onClick={() => setActiveMenuCat(i)}
                          className="px-5 py-2 rounded-xl text-xs font-black transition-all"
                          style={activeMenuCat === i
                            ? { backgroundColor: clr, color: '#000' }
                            : { backgroundColor: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    {cat.category}
                  </button>
                ))}
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div key={activeMenuCat} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          transition={{ duration: 0.25 }}>
                <div className="space-y-1">
                  {menuCats[activeMenuCat]?.items.filter(i => i.available !== false).map((item, ii) => (
                    <motion.div key={ii} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: ii * 0.05 }}
                                className="flex items-center gap-5 py-5 border-b border-white/5 group hover:border-white/12 transition-all">
                      {item.image ? (
                        <img src={item.image} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl shrink-0 flex items-center justify-center text-2xl"
                             style={{ background: `radial-gradient(${clr}20, transparent)` }}>
                          🍽
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-white/80 group-hover:text-white transition-colors">{item.name}</p>
                        {item.description && <p className="text-sm text-white/30 mt-0.5 line-clamp-1">{item.description}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-sm" style={{ color: clr }}>{item.price} TND</span>
                        <ArrowRight size={14} className="text-white/15 group-hover:text-white/40 group-hover:translate-x-1 transition-all" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* ── ABOUT ── */}
      {showAbout && (about?.text || about?.image) && (
        <section id="about" className="py-28 border-b border-white/5">
          <div className="max-w-7xl mx-auto px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="grid md:grid-cols-[1fr_2fr] gap-16 items-start">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-4" style={{ color: clr }}>Our Story</p>
                <div className="w-14 h-0.5" style={{ backgroundColor: clr }} />
              </div>
              <div className="space-y-8">
                {about?.text && (
                  <p className="text-xl text-white/55 leading-relaxed font-light">{about.text}</p>
                )}
                {about?.image && (
                  <div className="rounded-3xl overflow-hidden aspect-video mt-8 group">
                    <img src={about.image} alt="" className="w-full h-full object-cover opacity-75 group-hover:opacity-95 group-hover:scale-105 transition-all duration-700" />
                  </div>
                )}
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
          <div className="max-w-7xl mx-auto px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="mb-12">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-3" style={{ color: clr }}>Atmosphere</p>
              <div className="w-14 h-0.5 mb-2" style={{ backgroundColor: clr }} />
            </motion.div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {images.map((img, i) => (
                <motion.div key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                            transition={{ delay: i * 0.06 }}
                            className={`relative overflow-hidden rounded-2xl group ${i === 0 ? 'col-span-2 row-span-2' : ''}`}
                            style={{ aspectRatio: '1/1' }}>
                  <img src={img} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer id="footer-modern" className="pt-20 pb-10 border-t border-white/6 bg-[#060606]">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-1">
              <p className="text-xl font-black tracking-[0.1em] uppercase mb-3">{name}</p>
              {slogan && <p className="text-xs text-white/30 italic leading-relaxed mb-5">{slogan}</p>}
              {vipService?.enabled && (
                <button onClick={() => navigate(`/r/${slug}/vip`)}
                        className="flex items-center gap-1.5 text-xs font-black transition-all hover:scale-105" style={{ color: clr }}>
                  <Crown size={11} /> {vipCtaText}
                </button>
              )}
              <div className="flex gap-2 mt-5">
                {socialMedia?.instagram && (
                  <a href={socialMedia.instagram} target="_blank" rel="noopener noreferrer"
                     className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center text-white/35 hover:text-white hover:border-white/30 transition-all">
                    <IGIcon size={14} />
                  </a>
                )}
                {socialMedia?.facebook && (
                  <a href={socialMedia.facebook} target="_blank" rel="noopener noreferrer"
                     className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center text-white/35 hover:text-white hover:border-white/30 transition-all">
                    <FBIcon size={14} />
                  </a>
                )}
                {socialMedia?.tiktok && (
                  <a href={socialMedia.tiktok} target="_blank" rel="noopener noreferrer"
                     className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center text-white/35 hover:text-white hover:border-white/30 transition-all">
                    <TKIcon size={14} />
                  </a>
                )}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/25 mb-4">Contact</p>
              {contact?.phone && (
                <a href={`tel:${contact.phone}`} className="block text-sm text-white/45 hover:text-white/70 mb-2 transition-colors">{contact.phone}</a>
              )}
              {address?.city && <p className="text-sm text-white/40">{address.street && `${address.street}, `}{address.city}</p>}
              {googleMapsLink && (
                <a href={googleMapsLink} target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-1 text-xs mt-3 font-bold transition-colors" style={{ color: clr }}>
                  Directions <ExternalLink size={10} />
                </a>
              )}
            </div>

            {sortedHours.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/25 mb-4 flex items-center gap-1.5">
                  <Clock size={10} style={{ color: clr }} /> Hours
                </p>
                <div className="space-y-2">
                  {sortedHours.map((h, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="capitalize text-white/35">{h.day.slice(0,3)}</span>
                      <span className={h.isClosed ? 'text-red-400/60' : 'text-white/50'}>
                        {h.isClosed ? 'Closed' : `${h.open}–${h.close}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {vipService?.enabled && (
              <div className="rounded-2xl p-6 space-y-4" style={{ background: `${clr}10`, border: `1px solid ${clr}25` }}>
                <Crown size={28} style={{ color: clr }} />
                <h4 className="font-black text-lg uppercase tracking-tight">VIP Dining</h4>
                <p className="text-xs text-white/40 leading-relaxed">{vipService.description || 'Exclusive tables for an unforgettable experience.'}</p>
                <button onClick={() => navigate(`/r/${slug}/vip`)}
                        className="w-full py-3 rounded-xl text-xs font-black transition-all hover:scale-105"
                        style={{ backgroundColor: clr, color: '#000' }}>
                  {vipCtaText}
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-white/6 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/20">
            <span>{footerText || `© ${new Date().getFullYear()} ${name}`}</span>
            <a href="/" className="hover:text-white/40 transition-colors">Restora</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
