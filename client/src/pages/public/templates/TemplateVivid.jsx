import { useState } from 'react';
import { MapPin, Phone, ExternalLink, Star, ChevronDown, Crown, Clock } from 'lucide-react';
import VIPBookingModal from '../../../components/VIPBookingModal';

const DAYS_ORDER = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

export default function TemplateVivid({ data }) {
  const {
    name, slug, slogan, badge, cuisine, coverImage, heroBackground, primaryColor = '#f97316',
    about, menu, images, socialMedia, googleMapsLink,
    contact, address, openingHours, footerText, ctaText = 'Reserve a Table',
    showMenu = true, showGallery = true, showAbout = true, showHours = false,
    vipService, discoverText = 'Discover More', vipCtaText = 'Book VIP Table',
    isHalal, rating, reviewCount,
  } = data;

  const [showVIP, setShowVIP] = useState(false);
  const hero = heroBackground || coverImage;
  const clr  = primaryColor;
  const rgb  = hexToRgb(clr.startsWith('#') ? clr : '#f97316');
  const sortedHours = DAYS_ORDER.map(d => openingHours?.find(h => h.day === d)).filter(Boolean);

  const handleDiscover = () => {
    const id = showAbout ? 'about' : showMenu ? 'menu' : showGallery ? 'gallery' : 'footer-vivid';
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-[#fff8f4] text-[#1a0a00] font-sans">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-black/5 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-sm"
                 style={{ backgroundColor: clr }}>
              {name.charAt(0)}
            </div>
            <span className="font-black text-lg tracking-tight">{name}</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-500">
            {showAbout   && <a href="#about"   className="hover:text-gray-900 transition-colors">About</a>}
            {showMenu    && <a href="#menu"    className="hover:text-gray-900 transition-colors">Menu</a>}
            {showGallery && <a href="#gallery" className="hover:text-gray-900 transition-colors">Gallery</a>}
          </nav>
          {contact?.phone && (
            <a href={`tel:${contact.phone}`}
               className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
               style={{ backgroundColor: clr, boxShadow: `0 6px 20px rgba(${rgb},0.4)` }}>
              <Phone size={13} /> {ctaText}
            </a>
          )}
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden" style={{ minHeight: '85vh' }}>
        {/* Background */}
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, rgba(${rgb},0.12) 0%, transparent 60%)` }} />

        {/* Decorative circles */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10 blur-3xl"
             style={{ backgroundColor: clr }} />
        <div className="absolute bottom-0 -left-20 w-64 h-64 rounded-full opacity-8 blur-2xl"
             style={{ backgroundColor: clr }} />

        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-20 grid md:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <div>
            <div className="flex flex-wrap gap-2 mb-6">
              {cuisine?.map(c => (
                <span key={c} className="text-xs font-bold px-3 py-1.5 rounded-full text-white"
                      style={{ backgroundColor: clr }}>
                  {c}
                </span>
              ))}
              {isHalal && (
                <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-500 text-white">Halal</span>
              )}
            </div>
            <h1 className="text-5xl sm:text-6xl font-black leading-tight tracking-tight mb-5">{name}</h1>
            {slogan && <p className="text-xl text-gray-500 font-light leading-relaxed mb-8">{slogan}</p>}

            {badge && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 mb-8 font-semibold text-sm"
                   style={{ borderColor: clr, color: clr, backgroundColor: `rgba(${rgb},0.06)` }}>
                ✦ {badge}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button onClick={handleDiscover}
                      className="group flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-bold border-2 transition-all hover:scale-105"
                      style={{ borderColor: clr, color: clr, backgroundColor: `rgba(${rgb},0.06)` }}>
                {discoverText} <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform" />
              </button>
              {vipService?.enabled && (
                <button onClick={() => setShowVIP(true)}
                        className="flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-black text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                        style={{ backgroundColor: clr, boxShadow: `0 8px 24px rgba(${rgb},0.45)` }}>
                  <Crown size={14} /> {vipCtaText}
                </button>
              )}
              {contact?.phone && (
                <a href={`tel:${contact.phone}`}
                   className="flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-bold text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all">
                  <Phone size={14} /> {ctaText}
                </a>
              )}
            </div>

            {/* Stats row */}
            {(rating > 0 || contact?.phone) && (
              <div className="flex flex-wrap gap-6 mt-10 pt-8 border-t border-black/8">
                {rating > 0 && (
                  <div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill={i < Math.round(rating) ? '#fbbf24' : 'none'}
                              className={i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{reviewCount} reviews</p>
                  </div>
                )}
                {address?.city && (
                  <div>
                    <p className="text-sm font-bold text-gray-700">{address.city}</p>
                    <p className="text-xs text-gray-400 mt-1">{address.street || 'Tunisia'}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Hero image */}
          <div className="relative">
            {hero ? (
              <div className="relative rounded-[2rem] overflow-hidden shadow-2xl aspect-[4/5]"
                   style={{ boxShadow: `0 40px 80px rgba(${rgb},0.25)` }}>
                <img src={hero} alt={name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 rounded-[2rem]"
                     style={{ background: `linear-gradient(to top, rgba(${rgb},0.3) 0%, transparent 50%)` }} />
              </div>
            ) : (
              <div className="aspect-[4/5] rounded-[2rem] flex items-center justify-center"
                   style={{ background: `linear-gradient(135deg, rgba(${rgb},0.2), rgba(${rgb},0.08))` }}>
                <span className="text-9xl opacity-30">🍽</span>
              </div>
            )}

            {/* Floating card */}
            {contact?.phone && (
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-4 shadow-2xl border border-black/5">
                <p className="text-xs font-bold text-gray-400 mb-1">Call to Reserve</p>
                <p className="font-black text-gray-900">{contact.phone}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── About ── */}
      {showAbout && (about?.text || about?.image) && (
        <section id="about" className="py-24 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <span className="text-xs font-black uppercase tracking-[0.3em] px-4 py-2 rounded-full text-white"
                    style={{ backgroundColor: clr }}>Our Story</span>
            </div>
            <div className={`grid gap-12 items-center ${about?.image ? 'md:grid-cols-2' : 'max-w-2xl mx-auto'}`}>
              {about?.image && (
                <div className="relative rounded-[2rem] overflow-hidden aspect-[4/3] shadow-2xl"
                     style={{ boxShadow: `0 30px 60px rgba(${rgb},0.2)` }}>
                  <img src={about.image} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div>
                <p className="text-lg text-gray-600 leading-relaxed">{about?.text}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Menu ── */}
      {showMenu && menu?.length > 0 && (
        <section id="menu" className="py-24" style={{ background: `linear-gradient(180deg, rgba(${rgb},0.04) 0%, rgba(${rgb},0.02) 100%)` }}>
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <span className="text-xs font-black uppercase tracking-[0.3em] px-4 py-2 rounded-full text-white"
                    style={{ backgroundColor: clr }}>Menu</span>
            </div>
            <div className="space-y-12">
              {menu.filter(cat => cat.items?.length > 0).map((cat, ci) => (
                <div key={ci}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-8 w-1.5 rounded-full" style={{ backgroundColor: clr }} />
                    <h3 className="text-xl font-black">{cat.category}</h3>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cat.items.filter(i => i.available !== false).map((item, ii) => (
                      <div key={ii}
                           className="bg-white rounded-2xl p-4 shadow-sm border border-black/5 hover:shadow-md hover:-translate-y-1 transition-all duration-200 group">
                        {item.image && (
                          <div className="aspect-video rounded-xl overflow-hidden mb-4">
                            <img src={item.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          </div>
                        )}
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold text-gray-900">{item.name}</p>
                          <span className="font-black text-sm shrink-0 px-2.5 py-1 rounded-full text-white"
                                style={{ backgroundColor: clr }}>
                            {item.price}
                          </span>
                        </div>
                        {item.description && <p className="text-sm text-gray-400 mt-1.5 line-clamp-2">{item.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Gallery ── */}
      {showGallery && images?.length > 0 && (
        <section id="gallery" className="py-24 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <span className="text-xs font-black uppercase tracking-[0.3em] px-4 py-2 rounded-full text-white"
                    style={{ backgroundColor: clr }}>Gallery</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((img, i) => (
                <div key={i} className={`rounded-3xl overflow-hidden group cursor-pointer ${i === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}
                     style={{ aspectRatio: '1/1', boxShadow: `0 10px 40px rgba(${rgb},0.1)` }}>
                  <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Hours ── */}
      {showHours && openingHours?.length > 0 && (
        <section className="py-20">
          <div className="max-w-md mx-auto px-6">
            <div className="text-center mb-8">
              <span className="text-xs font-black uppercase tracking-[0.3em] px-4 py-2 rounded-full text-white"
                    style={{ backgroundColor: clr }}>Hours</span>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 space-y-3">
              {openingHours.map((h, i) => (
                <div key={i} className="flex justify-between py-2.5 border-b border-black/5 last:border-0 text-sm">
                  <span className="capitalize font-semibold text-gray-700">{h.day}</span>
                  <span className={h.isClosed ? 'text-red-400' : 'text-gray-500'}>
                    {h.isClosed ? 'Closed' : `${h.open} – ${h.close}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer id="footer-vivid" className="py-16 text-white" style={{ background: `linear-gradient(135deg, ${clr}, ${clr}cc)` }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-black text-lg">
                  {name.charAt(0)}
                </div>
                <span className="font-black text-xl">{name}</span>
              </div>
              {slogan && <p className="text-sm text-white/70">{slogan}</p>}
              {vipService?.enabled && (
                <button onClick={() => setShowVIP(true)}
                        className="mt-4 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                  <Crown size={11} /> Book VIP Table
                </button>
              )}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-3">Contact</p>
              {contact?.phone && <p className="text-sm text-white/80 mb-1">{contact.phone}</p>}
              {contact?.email && <p className="text-sm text-white/70 mb-1 break-all">{contact.email}</p>}
              {address?.city && <p className="text-sm text-white/80">{address.street && `${address.street}, `}{address.city}</p>}
              {googleMapsLink && (
                <a href={googleMapsLink} target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-1 text-sm text-white/70 mt-2 hover:text-white transition-colors underline underline-offset-4">
                  Directions <ExternalLink size={11} />
                </a>
              )}
            </div>
            {sortedHours.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-3 flex items-center gap-1.5">
                  <Clock size={10} /> Hours
                </p>
                <div className="space-y-1.5">
                  {sortedHours.map((h, i) => (
                    <div key={i} className="flex justify-between text-xs gap-2">
                      <span className="capitalize text-white/60">{h.day.slice(0,3)}</span>
                      <span className={h.isClosed ? 'text-red-200/70' : 'text-white/80'}>
                        {h.isClosed ? 'Closed' : `${h.open}–${h.close}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-3">Social</p>
              <div className="flex gap-2">
                {socialMedia?.facebook && (
                  <a href={socialMedia.facebook} target="_blank" rel="noopener noreferrer"
                     className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center font-bold text-xs transition-colors">f</a>
                )}
                {socialMedia?.instagram && (
                  <a href={socialMedia.instagram} target="_blank" rel="noopener noreferrer"
                     className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center font-bold text-xs transition-colors">in</a>
                )}
                {socialMedia?.tiktok && (
                  <a href={socialMedia.tiktok} target="_blank" rel="noopener noreferrer"
                     className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center font-bold text-xs transition-colors">tk</a>
                )}
              </div>
            </div>
          </div>
          <div className="border-t border-white/20 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
            <span>{footerText || `© ${new Date().getFullYear()} ${name}`}</span>
            <span>Powered by <a href="/" className="text-white/60 hover:text-white transition-colors">Restora</a></span>
          </div>
        </div>
      </footer>

      {showVIP && (
        <VIPBookingModal slug={slug} restaurantName={name} primaryColor={clr} onClose={() => setShowVIP(false)} />
      )}
    </div>
  );
}
