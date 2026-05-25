import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, MapPin, Clock, Menu, X, Crown, ExternalLink, ChevronDown, Calendar } from 'lucide-react';

const DAYS_ORDER = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

const HERO_FALLBACK = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop';

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

export default function TemplateClassic({ data }) {
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
    { name: 'Contact', href: '#footer-classic' },
  ];

  return (
    <div className="bg-[#fafaf8] text-[#1c1917] font-sans overflow-x-hidden selection:bg-orange-200">

      {/* ── NAVBAR ── */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled ? 'py-3 bg-white/95 backdrop-blur-xl shadow-sm border-b border-black/5' : 'py-6 bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white shadow-md"
                 style={{ backgroundColor: clr }}>
              {name.charAt(0)}
            </div>
            <span className={`text-lg font-black tracking-tight transition-colors ${scrolled ? 'text-gray-900' : 'text-white'}`}>
              {name}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(l => (
              <a key={l.name} href={l.href}
                 className={`text-[11px] font-bold uppercase tracking-[0.25em] transition-colors hover:opacity-70 ${scrolled ? 'text-gray-700' : 'text-white/90'}`}>
                {l.name}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {vipService?.enabled && (
              <button onClick={() => navigate(`/r/${slug}/vip`)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black text-white shadow-lg transition-all hover:scale-105"
                      style={{ backgroundColor: clr, boxShadow: `0 4px 20px ${clr}55` }}>
                <Crown size={12} /> {vipCtaText}
              </button>
            )}
            {contact?.phone && (
              <a href={`tel:${contact.phone}`}
                 className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold border-2 transition-all hover:scale-105 ${scrolled ? 'border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white' : 'border-white/70 text-white hover:bg-white hover:text-gray-900'}`}>
                <Phone size={12} /> {ctaText}
              </a>
            )}
          </div>

          <button className={`md:hidden transition-colors ${scrolled ? 'text-gray-900' : 'text-white'}`}
                  onClick={() => setMobileOpen(true)}>
            <Menu size={26} />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, x: '100%' }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: '100%' }}
                      transition={{ type: 'tween', duration: 0.3 }}
                      className="fixed inset-0 z-[200] bg-white flex flex-col p-8">
            <div className="flex justify-between items-center mb-12">
              <span className="text-2xl font-black" style={{ color: clr }}>{name}</span>
              <button onClick={() => setMobileOpen(false)}><X size={28} /></button>
            </div>
            <div className="flex flex-col gap-6">
              {navLinks.map(l => (
                <a key={l.name} href={l.href} onClick={() => setMobileOpen(false)}
                   className="text-3xl font-black uppercase tracking-tight text-gray-900 border-b border-gray-100 pb-4">
                  {l.name}
                </a>
              ))}
            </div>
            <div className="mt-auto flex flex-col gap-3">
              {vipService?.enabled && (
                <button onClick={() => { navigate(`/r/${slug}/vip`); setMobileOpen(false); }}
                        className="w-full py-4 rounded-2xl text-sm font-black text-white"
                        style={{ backgroundColor: clr }}>
                  <Crown size={14} className="inline mr-2" />{vipCtaText}
                </button>
              )}
              {contact?.phone && (
                <a href={`tel:${contact.phone}`}
                   className="w-full py-4 rounded-2xl text-sm font-black text-center border-2 border-gray-900 text-gray-900">
                  {ctaText}
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO ── */}
      <section className="relative h-screen overflow-hidden">
        <img src={hero} alt={name} className="absolute inset-0 w-full h-full object-cover scale-105" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-[#fafaf8]" />

        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: 'easeOut' }}
                    className="relative h-full flex flex-col items-center justify-center text-center px-6 pb-16">
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {cuisine?.map(c => (
              <span key={c} className="text-[10px] font-black uppercase tracking-[0.25em] text-white/90 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
                {c}
              </span>
            ))}
            {isHalal && <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-emerald-500 text-white">Halal</span>}
          </div>

          {badge && (
            <span className="inline-block mb-4 px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-[0.4em] text-white/70 border-white/30">
              {badge}
            </span>
          )}

          <h1 className="text-6xl sm:text-8xl font-black text-white tracking-tighter leading-[0.9] mb-5">
            {name}
          </h1>
          {slogan && (
            <p className="text-xl sm:text-2xl text-white/75 font-light max-w-2xl leading-relaxed mb-10">
              {slogan}
            </p>
          )}

          <div className="flex flex-wrap gap-4 justify-center">
            <a href="#menu"
               className="group flex items-center gap-2 px-8 py-4 rounded-full text-sm font-black text-white border-2 border-white/40 hover:border-white hover:bg-white/10 transition-all backdrop-blur-sm">
              {discoverText} <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform" />
            </a>
            {vipService?.enabled && (
              <button onClick={() => navigate(`/r/${slug}/vip`)}
                      className="flex items-center gap-2 px-8 py-4 rounded-full text-sm font-black text-white shadow-xl transition-all hover:scale-105"
                      style={{ backgroundColor: clr, boxShadow: `0 8px 32px ${clr}66` }}>
                <Crown size={14} /> {vipCtaText}
              </button>
            )}
          </div>

          {rating > 0 && (
            <div className="flex items-center gap-2 mt-10">
              <div className="flex">
                {[1,2,3,4,5].map(i => (
                  <span key={i} style={{ color: i <= Math.round(rating) ? '#fbbf24' : 'rgba(255,255,255,0.2)', fontSize: 18 }}>★</span>
                ))}
              </div>
              <span className="text-white/60 text-sm font-semibold">{rating.toFixed(1)} ({reviewCount} reviews)</span>
            </div>
          )}
        </motion.div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-50">
          <div className="w-px h-10 bg-gradient-to-b from-white/80 to-transparent animate-pulse" />
        </div>
      </section>

      {/* ── INFO STRIP ── */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap gap-6 items-center justify-center md:justify-start text-sm text-gray-500">
          {address?.city && (
            <div className="flex items-center gap-2">
              <MapPin size={14} style={{ color: clr }} />
              {address.street && `${address.street}, `}{address.city}
            </div>
          )}
          {contact?.phone && (
            <a href={`tel:${contact.phone}`} className="flex items-center gap-2 hover:text-gray-900 transition-colors font-medium">
              <Phone size={14} style={{ color: clr }} />{contact.phone}
            </a>
          )}
          {googleMapsLink && (
            <a href={googleMapsLink} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-1.5 font-semibold transition-colors hover:underline" style={{ color: clr }}>
              Get Directions <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>

      {/* ── MENU ── */}
      {showMenu && menuCats.length > 0 && (
        <section id="menu" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
                        className="mb-16">
              <p className="text-[10px] font-black uppercase tracking-[0.5em] mb-3" style={{ color: clr }}>What We Serve</p>
              <div className="flex items-end justify-between gap-4">
                <h2 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tighter leading-none uppercase">
                  Our Menu
                </h2>
                <div className="h-px flex-1 max-w-xs mb-3" style={{ backgroundColor: clr + '40' }} />
              </div>
            </motion.div>

            <div className="space-y-16">
              {menuCats.map((cat, ci) => (
                <motion.div key={ci} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }} transition={{ duration: 0.5, delay: ci * 0.1 }}>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: clr }} />
                    <h3 className="text-2xl font-black text-gray-900 uppercase tracking-wide">{cat.category}</h3>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {cat.items.filter(i => i.available !== false).map((item, ii) => (
                      <div key={ii} className="group flex gap-4 p-4 rounded-2xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all">
                        {item.image ? (
                          <img src={item.image} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-20 h-20 rounded-xl shrink-0 flex items-center justify-center text-3xl"
                               style={{ backgroundColor: clr + '15' }}>
                            🍽
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-black text-gray-900 text-sm group-hover:text-orange-600 transition-colors">{item.name}</p>
                            <span className="font-black text-sm shrink-0 whitespace-nowrap" style={{ color: clr }}>{item.price} <small className="font-bold opacity-70">TND</small></span>
                          </div>
                          {item.description && <p className="text-xs text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">{item.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── ABOUT ── */}
      {showAbout && (about?.text || about?.image) && (
        <section id="about" className="py-24 bg-[#fafaf8]">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
                        className={`grid gap-16 items-center ${about?.image ? 'md:grid-cols-2' : 'max-w-3xl'}`}>
              {about?.image && (
                <div className="relative rounded-3xl overflow-hidden aspect-[4/3] shadow-2xl group">
                  <img src={about.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
              )}
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.5em] mb-4" style={{ color: clr }}>Our Story</p>
                <div className="w-16 h-1 rounded-full mb-6" style={{ backgroundColor: clr }} />
                <h3 className="text-4xl font-black text-gray-900 tracking-tight leading-tight mb-6">
                  Crafted With Passion
                </h3>
                <p className="text-lg text-gray-500 leading-relaxed font-light">{about?.text}</p>
                {contact?.phone && (
                  <a href={`tel:${contact.phone}`}
                     className="inline-flex items-center gap-2 mt-8 text-sm font-black transition-all hover:gap-4" style={{ color: clr }}>
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
        <section id="gallery" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
                        className="mb-12">
              <p className="text-[10px] font-black uppercase tracking-[0.5em] mb-3" style={{ color: clr }}>Atmosphere</p>
              <h2 className="text-5xl font-black text-gray-900 tracking-tighter uppercase">Gallery</h2>
            </motion.div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {images.map((img, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.07 }}
                            className={`overflow-hidden rounded-2xl group ${i % 5 === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}>
                  <div className="aspect-square overflow-hidden">
                    <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer id="footer-classic" className="pt-24 pb-10 bg-[#1c1917] text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-16 mb-16">

            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl text-white"
                       style={{ backgroundColor: clr }}>
                    {name.charAt(0)}
                  </div>
                  <h4 className="text-2xl font-black">{name}</h4>
                </div>
                {slogan && <p className="text-white/50 text-sm leading-relaxed italic">{slogan}</p>}
              </div>
              <div className="space-y-4">
                {address?.city && (
                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="shrink-0 mt-0.5" style={{ color: clr }} />
                    <p className="text-white/60 text-sm">{address.street && `${address.street}, `}{address.city}</p>
                  </div>
                )}
                {contact?.phone && (
                  <div className="flex items-center gap-3">
                    <Phone size={16} style={{ color: clr }} />
                    <a href={`tel:${contact.phone}`} className="text-white text-lg font-black hover:opacity-80 transition-opacity">{contact.phone}</a>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                {socialMedia?.instagram && (
                  <a href={socialMedia.instagram} target="_blank" rel="noopener noreferrer"
                     className="w-10 h-10 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center text-white/60 hover:text-white transition-all">
                    <IGIcon size={16} />
                  </a>
                )}
                {socialMedia?.facebook && (
                  <a href={socialMedia.facebook} target="_blank" rel="noopener noreferrer"
                     className="w-10 h-10 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center text-white/60 hover:text-white transition-all">
                    <FBIcon size={16} />
                  </a>
                )}
                {socialMedia?.tiktok && (
                  <a href={socialMedia.tiktok} target="_blank" rel="noopener noreferrer"
                     className="w-10 h-10 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center text-white/60 hover:text-white transition-all">
                    <TKIcon size={16} />
                  </a>
                )}
              </div>
            </div>

            {sortedHours.length > 0 && (
              <div>
                <h4 className="text-xs font-black uppercase tracking-[0.4em] text-white/40 mb-6 flex items-center gap-2">
                  <Clock size={13} style={{ color: clr }} /> Opening Hours
                </h4>
                <div className="space-y-3">
                  {sortedHours.map((h, i) => (
                    <div key={i} className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                      <span className={`capitalize font-semibold ${h.isClosed ? 'text-white/30' : 'text-white/60'}`}>{h.day}</span>
                      <span className={`font-black text-xs uppercase tracking-wide ${h.isClosed ? 'text-red-400' : 'text-white'}`}>
                        {h.isClosed ? 'Closed' : `${h.open} – ${h.close}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-8 rounded-3xl space-y-6" style={{ backgroundColor: clr + '12', border: `1px solid ${clr}30` }}>
              <Calendar size={36} style={{ color: clr }} />
              <h4 className="text-2xl font-black text-white uppercase italic tracking-tight">Ready to dine?</h4>
              <p className="text-white/50 text-sm leading-relaxed">Reserve your table online or call us directly.</p>
              {vipService?.enabled && (
                <button onClick={() => navigate(`/r/${slug}/vip`)}
                        className="w-full py-4 rounded-2xl text-sm font-black text-white transition-all hover:scale-105 hover:shadow-xl shadow-lg"
                        style={{ backgroundColor: clr, boxShadow: `0 8px 32px ${clr}44` }}>
                  <Crown size={14} className="inline mr-2" />{vipCtaText}
                </button>
              )}
              {contact?.phone && (
                <a href={`tel:${contact.phone}`}
                   className="block w-full py-4 rounded-2xl text-sm font-black text-center border-2 border-white/20 text-white/70 hover:border-white/50 hover:text-white transition-all">
                  {ctaText}
                </a>
              )}
            </div>

          </div>

          <div className="border-t border-white/8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/25">
            <span>{footerText || `© ${new Date().getFullYear()} ${name}. All rights reserved.`}</span>
            <span>Powered by <a href="/" className="hover:text-white/50 transition-colors">Restora</a></span>
          </div>
        </div>
      </footer>

    </div>
  );
}
