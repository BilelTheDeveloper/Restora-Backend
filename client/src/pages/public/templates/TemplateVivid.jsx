import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, MapPin, Clock, Menu, X, Crown, ExternalLink, ChevronDown, Star } from 'lucide-react';

const DAYS_ORDER = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const HERO_FALLBACK = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2070&auto=format&fit=crop';

function hexToRgb(hex) {
  const h = (hex || '#f97316').replace('#','');
  return `${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)}`;
}

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

export default function TemplateVivid({ data }) {
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
  const rgb  = hexToRgb(clr);
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
    { name: 'Contact', href: '#footer-vivid' },
  ];

  return (
    <div className="bg-[#fff8f4] text-[#1a0a00] font-sans overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled ? 'py-3 bg-white/95 backdrop-blur-xl shadow-sm border-b border-black/5' : 'py-6 bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-base shadow-lg transition-transform hover:scale-110"
                 style={{ backgroundColor: clr, boxShadow: `0 4px 16px rgba(${rgb},0.4)` }}>
              {name.charAt(0)}
            </div>
            <span className={`text-lg font-black tracking-tight transition-colors ${scrolled ? 'text-gray-900' : 'text-white'}`}>
              {name}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(l => (
              <a key={l.name} href={l.href}
                 className={`text-[11px] font-bold uppercase tracking-[0.22em] transition-colors ${scrolled ? 'text-gray-500 hover:text-gray-900' : 'text-white/80 hover:text-white'}`}>
                {l.name}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {vipService?.enabled && (
              <button onClick={() => navigate(`/r/${slug}/vip`)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black text-white shadow-lg transition-all hover:scale-105"
                      style={{ backgroundColor: clr, boxShadow: `0 6px 20px rgba(${rgb},0.45)` }}>
                <Crown size={12} /> {vipCtaText}
              </button>
            )}
            {contact?.phone && (
              <a href={`tel:${contact.phone}`}
                 className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold border-2 transition-all hover:scale-105 ${scrolled ? `text-gray-700 border-gray-200 hover:border-gray-400` : 'text-white border-white/40 hover:border-white'}`}>
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
          <motion.div initial={{ opacity: 0, y: '-100%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: '-100%' }}
                      transition={{ type: 'tween', duration: 0.35 }}
                      className="fixed inset-0 z-[200] flex flex-col p-8"
                      style={{ background: `linear-gradient(135deg, rgba(${rgb},0.97), rgba(${rgb},0.88))` }}>
            <div className="flex justify-between items-center mb-12">
              <span className="text-2xl font-black text-white">{name}</span>
              <button onClick={() => setMobileOpen(false)}><X size={28} className="text-white/80" /></button>
            </div>
            <div className="flex flex-col gap-6">
              {navLinks.map((l, i) => (
                <motion.a key={l.name} href={l.href} onClick={() => setMobileOpen(false)}
                          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                          className="text-3xl font-black uppercase tracking-tight text-white border-b border-white/20 pb-4">
                  {l.name}
                </motion.a>
              ))}
            </div>
            <div className="mt-auto space-y-3">
              {contact?.phone && (
                <a href={`tel:${contact.phone}`}
                   className="block w-full py-4 rounded-2xl text-sm font-black text-center bg-white text-gray-900">
                  {ctaText}
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO ── */}
      <section className="relative min-h-screen overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-15 blur-3xl pointer-events-none"
             style={{ backgroundColor: clr }} />
        <div className="absolute bottom-0 -left-32 w-80 h-80 rounded-full opacity-10 blur-2xl pointer-events-none"
             style={{ backgroundColor: clr }} />

        <div className="relative max-w-7xl mx-auto px-6 pt-28 pb-20 grid md:grid-cols-2 gap-12 items-center min-h-screen">
          {/* Text side */}
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: 'easeOut' }}>
            <div className="flex flex-wrap gap-2 mb-6">
              {cuisine?.map(c => (
                <span key={c} className="text-xs font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full text-white shadow-sm"
                      style={{ backgroundColor: clr }}>
                  {c}
                </span>
              ))}
              {isHalal && <span className="text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-emerald-500 text-white">Halal</span>}
            </div>

            {badge && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 mb-6 font-bold text-sm"
                   style={{ borderColor: clr, color: clr, backgroundColor: `rgba(${rgb},0.07)` }}>
                ✦ {badge}
              </div>
            )}

            <h1 className="text-6xl sm:text-7xl font-black leading-[0.9] tracking-tighter mb-5">{name}</h1>
            {slogan && (
              <p className="text-xl text-gray-500 font-light leading-relaxed mb-8">{slogan}</p>
            )}

            {rating > 0 && (
              <div className="flex items-center gap-2 mb-8">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} fill={i < Math.round(rating) ? '#fbbf24' : 'none'}
                        className={i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'} />
                ))}
                <span className="text-sm text-gray-400 font-semibold ml-1">{rating.toFixed(1)} · {reviewCount} reviews</span>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <a href="#menu"
                 className="group flex items-center gap-2 px-7 py-4 rounded-2xl text-sm font-black border-2 transition-all hover:scale-105 hover:shadow-lg"
                 style={{ borderColor: clr, color: clr, backgroundColor: `rgba(${rgb},0.07)`, boxShadow: `0 0 0 0 rgba(${rgb},0)` }}>
                {discoverText} <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform" />
              </a>
              {vipService?.enabled && (
                <button onClick={() => navigate(`/r/${slug}/vip`)}
                        className="flex items-center gap-2 px-7 py-4 rounded-2xl text-sm font-black text-white shadow-lg transition-all hover:scale-105"
                        style={{ backgroundColor: clr, boxShadow: `0 8px 24px rgba(${rgb},0.45)` }}>
                  <Crown size={14} /> {vipCtaText}
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-8 mt-10 pt-8 border-t border-black/8">
              {address?.city && (
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Location</p>
                  <p className="font-bold text-gray-800">{address.city}</p>
                </div>
              )}
              {contact?.phone && (
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Phone</p>
                  <a href={`tel:${contact.phone}`} className="font-black text-gray-900 hover:opacity-70 transition-opacity">{contact.phone}</a>
                </div>
              )}
            </div>
          </motion.div>

          {/* Image side */}
          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.9, ease: 'easeOut' }}
                      className="relative">
            <div className="relative rounded-[2.5rem] overflow-hidden aspect-[4/5] shadow-2xl"
                 style={{ boxShadow: `0 40px 80px rgba(${rgb},0.25)` }}>
              <img src={hero} alt={name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 rounded-[2.5rem]"
                   style={{ background: `linear-gradient(to top, rgba(${rgb},0.3) 0%, transparent 50%)` }} />
            </div>
            {/* Floating phone card */}
            {contact?.phone && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
                          className="absolute -bottom-5 -left-5 bg-white rounded-2xl p-4 shadow-2xl border border-black/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Call to Reserve</p>
                <p className="font-black text-gray-900 text-sm">{contact.phone}</p>
              </motion.div>
            )}
            {/* Floating rating card */}
            {rating > 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }}
                          className="absolute -top-5 -right-5 bg-white rounded-2xl p-4 shadow-2xl border border-black/5">
                <p className="text-2xl font-black text-gray-900">{rating.toFixed(1)} <span className="text-yellow-400">★</span></p>
                <p className="text-[10px] text-gray-400 font-bold">{reviewCount} reviews</p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── MENU ── */}
      {showMenu && menuCats.length > 0 && (
        <section id="menu" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="text-center mb-14">
              <span className="inline-block text-[10px] font-black uppercase tracking-[0.4em] px-5 py-2 rounded-full text-white mb-5"
                    style={{ backgroundColor: clr }}>
                What We Serve
              </span>
              <h2 className="text-5xl font-black tracking-tighter">Our Menu</h2>
            </motion.div>

            {menuCats.map((cat, ci) => (
              <motion.div key={ci} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }} transition={{ delay: ci * 0.1 }}
                          className="mb-14">
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-8 w-1.5 rounded-full" style={{ backgroundColor: clr }} />
                  <h3 className="text-2xl font-black tracking-tight">{cat.category}</h3>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {cat.items.filter(i => i.available !== false).map((item, ii) => (
                    <motion.div key={ii} whileHover={{ y: -4, boxShadow: `0 20px 40px rgba(${rgb},0.15)` }}
                                className="bg-[#fff8f4] rounded-2xl p-4 border border-black/5 hover:border-orange-200 transition-all group cursor-pointer">
                      {item.image && (
                        <div className="aspect-video rounded-xl overflow-hidden mb-4">
                          <img src={item.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      )}
                      {!item.image && (
                        <div className="aspect-video rounded-xl flex items-center justify-center text-4xl mb-4"
                             style={{ background: `linear-gradient(135deg, rgba(${rgb},0.1), rgba(${rgb},0.04))` }}>
                          🍽
                        </div>
                      )}
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-black text-gray-900">{item.name}</p>
                        <span className="text-xs font-black px-2.5 py-1 rounded-full text-white shrink-0"
                              style={{ backgroundColor: clr }}>
                          {item.price} TND
                        </span>
                      </div>
                      {item.description && <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">{item.description}</p>}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ── ABOUT ── */}
      {showAbout && (about?.text || about?.image) && (
        <section id="about" className="py-24" style={{ background: `linear-gradient(180deg, rgba(${rgb},0.05) 0%, white 100%)` }}>
          <div className="max-w-7xl mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="text-center mb-14">
              <span className="inline-block text-[10px] font-black uppercase tracking-[0.4em] px-5 py-2 rounded-full text-white mb-5"
                    style={{ backgroundColor: clr }}>Our Story</span>
              <h2 className="text-5xl font-black tracking-tighter">Crafted With Passion</h2>
            </motion.div>
            <div className={`grid gap-12 items-center ${about?.image ? 'md:grid-cols-2' : 'max-w-2xl mx-auto'}`}>
              {about?.image && (
                <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                            className="relative rounded-[2rem] overflow-hidden aspect-[4/3] shadow-2xl group"
                            style={{ boxShadow: `0 30px 60px rgba(${rgb},0.2)` }}>
                  <img src={about.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </motion.div>
              )}
              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <p className="text-lg text-gray-600 leading-relaxed mb-6">{about?.text}</p>
                {contact?.phone && (
                  <a href={`tel:${contact.phone}`}
                     className="inline-flex items-center gap-2 font-black text-sm transition-all hover:gap-4"
                     style={{ color: clr }}>
                    Make a Reservation <ExternalLink size={13} />
                  </a>
                )}
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* ── GALLERY ── */}
      {showGallery && images?.length > 0 && (
        <section id="gallery" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="text-center mb-14">
              <span className="inline-block text-[10px] font-black uppercase tracking-[0.4em] px-5 py-2 rounded-full text-white mb-5"
                    style={{ backgroundColor: clr }}>Atmosphere</span>
              <h2 className="text-5xl font-black tracking-tighter">Our Gallery</h2>
            </motion.div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((img, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                            className={`rounded-3xl overflow-hidden group ${i === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}
                            style={{ aspectRatio: '1/1', boxShadow: `0 10px 40px rgba(${rgb},0.12)` }}>
                  <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer id="footer-vivid" className="py-16 text-white"
              style={{ background: `linear-gradient(135deg, ${clr}, ${clr}cc)` }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center font-black text-lg">
                  {name.charAt(0)}
                </div>
                <span className="font-black text-xl">{name}</span>
              </div>
              {slogan && <p className="text-sm text-white/70 mb-4 italic">{slogan}</p>}
              {vipService?.enabled && (
                <button onClick={() => navigate(`/r/${slug}/vip`)}
                        className="flex items-center gap-1.5 text-xs font-black px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors">
                  <Crown size={11} /> {vipCtaText}
                </button>
              )}
              <div className="flex gap-2 mt-4">
                {socialMedia?.instagram && (
                  <a href={socialMedia.instagram} target="_blank" rel="noopener noreferrer"
                     className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                    <IGIcon size={14} />
                  </a>
                )}
                {socialMedia?.facebook && (
                  <a href={socialMedia.facebook} target="_blank" rel="noopener noreferrer"
                     className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                    <FBIcon size={14} />
                  </a>
                )}
                {socialMedia?.tiktok && (
                  <a href={socialMedia.tiktok} target="_blank" rel="noopener noreferrer"
                     className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                    <TKIcon size={14} />
                  </a>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-widest text-white/50 mb-3">Contact</p>
              {contact?.phone && (
                <a href={`tel:${contact.phone}`} className="block text-sm text-white/80 font-bold mb-2 hover:text-white transition-colors">{contact.phone}</a>
              )}
              {contact?.email && <p className="text-sm text-white/60 mb-1 break-all">{contact.email}</p>}
              {address?.city && <p className="text-sm text-white/70">{address.street && `${address.street}, `}{address.city}</p>}
              {googleMapsLink && (
                <a href={googleMapsLink} target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-1 text-sm text-white/70 mt-2 hover:text-white transition-colors underline underline-offset-4">
                  Directions <ExternalLink size={11} />
                </a>
              )}
            </div>

            {sortedHours.length > 0 && (
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-white/50 mb-3 flex items-center gap-1.5">
                  <Clock size={11} /> Hours
                </p>
                <div className="space-y-2">
                  {sortedHours.map((h, i) => (
                    <div key={i} className="flex justify-between text-xs gap-2">
                      <span className="capitalize text-white/60">{h.day.slice(0,3)}</span>
                      <span className={h.isClosed ? 'text-white/40 line-through' : 'text-white/85 font-bold'}>
                        {h.isClosed ? 'Closed' : `${h.open}–${h.close}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white/15 rounded-3xl p-6 space-y-4">
              <h4 className="font-black text-lg text-white">Reserve Now</h4>
              <p className="text-white/60 text-xs leading-relaxed">Experience the best of {name}. Book your table online.</p>
              {contact?.phone && (
                <a href={`tel:${contact.phone}`}
                   className="block w-full py-3 rounded-xl bg-white text-sm font-black text-center transition-all hover:scale-105"
                   style={{ color: clr }}>
                  {ctaText}
                </a>
              )}
            </div>
          </div>

          <div className="border-t border-white/20 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
            <span>{footerText || `© ${new Date().getFullYear()} ${name}`}</span>
            <span>Powered by <a href="/" className="text-white/60 hover:text-white transition-colors">Restora</a></span>
          </div>
        </div>
      </footer>

    </div>
  );
}
