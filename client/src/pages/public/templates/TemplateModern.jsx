import { useState } from 'react';
import { MapPin, Phone, ExternalLink, ArrowRight, ChevronDown, Crown, Clock } from 'lucide-react';
import VIPBookingModal from '../../../components/VIPBookingModal';

const DAYS_ORDER = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

export default function TemplateModern({ data }) {
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
  const sortedHours = DAYS_ORDER.map(d => openingHours?.find(h => h.day === d)).filter(Boolean);

  const handleDiscover = () => {
    const id = showAbout ? 'about' : showMenu ? 'menu' : showGallery ? 'gallery' : 'footer-modern';
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-[#0c0c0c] text-white min-h-screen font-sans">

      {/* ── Nav ── */}
      <header className="fixed top-0 inset-x-0 z-40 px-8 h-20 flex items-center justify-between"
              style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.85), transparent)' }}>
        <span className="text-xl font-black tracking-widest uppercase">{name}</span>
        <nav className="hidden md:flex gap-8 text-xs font-bold tracking-[0.18em] uppercase text-white/60">
          {showAbout   && <a href="#about"   className="hover:text-white transition-colors">About</a>}
          {showMenu    && <a href="#menu"    className="hover:text-white transition-colors">Menu</a>}
          {showGallery && <a href="#gallery" className="hover:text-white transition-colors">Gallery</a>}
        </nav>
        {contact?.phone && (
          <a href={`tel:${contact.phone}`}
             className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase border-2 transition-all hover:text-black"
             style={{ borderColor: clr, color: clr, '--hover-bg': clr }}
             onMouseEnter={e => { e.currentTarget.style.backgroundColor = clr; e.currentTarget.style.color = '#000'; }}
             onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = clr; }}>
            {ctaText}
          </a>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="relative h-screen overflow-hidden">
        {hero ? (
          <img src={hero} alt={name} className="absolute inset-0 w-full h-full object-cover opacity-40" />
        ) : (
          <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 60% 40%, ${clr}33, transparent 70%)` }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60" />

        <div className="relative h-full flex flex-col justify-end pb-24 px-8 md:px-20">
          <div className="max-w-4xl">
            {badge && (
              <div className="flex items-center gap-2 mb-6">
                <div className="h-px w-10" style={{ backgroundColor: clr }} />
                <span className="text-xs font-bold tracking-[0.3em] uppercase" style={{ color: clr }}>{badge}</span>
              </div>
            )}
            <h1 className="text-[clamp(3rem,10vw,7rem)] font-black leading-none tracking-tight mb-6">{name}</h1>
            {slogan && (
              <p className="text-lg md:text-2xl text-white/60 font-light max-w-2xl leading-relaxed mb-10">{slogan}</p>
            )}
            <div className="flex flex-wrap gap-4 items-center">
              <button onClick={handleDiscover}
                      className="group flex items-center gap-3 px-8 py-4 rounded-full text-sm font-bold text-white/70 border border-white/25 hover:text-white hover:border-white/50 hover:bg-white/5 transition-all">
                {discoverText} <ChevronDown size={15} className="group-hover:translate-y-0.5 transition-transform" />
              </button>
              {vipService?.enabled && (
                <button onClick={() => setShowVIP(true)}
                        className="flex items-center gap-3 px-8 py-4 rounded-full text-sm font-black tracking-wider uppercase text-black transition-all hover:scale-105 hover:shadow-2xl"
                        style={{ backgroundColor: clr, boxShadow: `0 0 40px ${clr}55` }}>
                  <Crown size={15} /> {vipCtaText}
                </button>
              )}
              {contact?.phone && (
                <a href={`tel:${contact.phone}`}
                   className="flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors">
                  <Phone size={14} />
                  <span className="underline underline-offset-4">{ctaText}</span>
                </a>
              )}
              {googleMapsLink && (
                <a href={googleMapsLink} target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors">
                  <MapPin size={14} />
                  <span className="underline underline-offset-4">Get Directions</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Cuisine tags */}
        <div className="absolute top-1/2 right-10 -translate-y-1/2 hidden lg:flex flex-col gap-3">
          {cuisine?.map(c => (
            <span key={c} className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30 writing-mode-vertical">{c}</span>
          ))}
        </div>
      </section>

      {/* ── Info bar ── */}
      <div className="border-y border-white/8 bg-[#0c0c0c]">
        <div className="max-w-6xl mx-auto px-8 py-5 flex flex-wrap gap-6 items-center text-sm text-white/40">
          {address?.city && (
            <span className="flex items-center gap-2">
              <MapPin size={13} style={{ color: clr }} />
              {address.street && `${address.street}, `}{address.city}
            </span>
          )}
          {contact?.phone && (
            <a href={`tel:${contact.phone}`} className="flex items-center gap-2 hover:text-white/70 transition-colors">
              <Phone size={13} style={{ color: clr }} />{contact.phone}
            </a>
          )}
          {isHalal && (
            <span className="ml-auto px-3 py-1 rounded-full text-xs font-bold text-emerald-400 border border-emerald-500/30 bg-emerald-500/5">
              Halal Certified
            </span>
          )}
          {rating > 0 && (
            <div className="flex items-center gap-1.5">
              <span style={{ color: '#fbbf24' }}>★</span>
              <span className="text-white/60">{rating.toFixed(1)}</span>
              <span className="text-white/25">({reviewCount})</span>
            </div>
          )}
        </div>
      </div>

      {/* ── About ── */}
      {showAbout && (about?.text || about?.image) && (
        <section id="about" className="py-28">
          <div className="max-w-6xl mx-auto px-8">
            <div className="grid md:grid-cols-[1fr_2fr] gap-16 items-start">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] mb-4" style={{ color: clr }}>Our Story</p>
                <div className="w-16 h-0.5" style={{ backgroundColor: clr }} />
              </div>
              <div className="space-y-8">
                {about?.text && (
                  <p className="text-xl text-white/60 leading-relaxed font-light">{about.text}</p>
                )}
                {about?.image && (
                  <div className="rounded-3xl overflow-hidden aspect-video mt-8">
                    <img src={about.image} alt="" className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Menu ── */}
      {showMenu && menu?.length > 0 && (
        <section id="menu" className="py-28 border-t border-white/5">
          <div className="max-w-6xl mx-auto px-8">
            <div className="grid md:grid-cols-[1fr_2fr] gap-16 items-start">
              <div className="md:sticky md:top-28">
                <p className="text-xs font-black uppercase tracking-[0.3em] mb-4" style={{ color: clr }}>Menu</p>
                <div className="w-16 h-0.5 mb-6" style={{ backgroundColor: clr }} />
                <div className="space-y-2 hidden md:block">
                  {menu.map((cat, i) => (
                    <a key={i} href={`#cat-${i}`}
                       className="block text-sm text-white/30 hover:text-white/70 transition-colors py-1">{cat.category}</a>
                  ))}
                </div>
              </div>

              <div className="space-y-16">
                {menu.filter(cat => cat.items?.length > 0).map((cat, ci) => (
                  <div key={ci} id={`cat-${ci}`}>
                    <h3 className="text-xs font-black uppercase tracking-[0.25em] text-white/30 mb-6">{cat.category}</h3>
                    <div className="space-y-1">
                      {cat.items.filter(i => i.available !== false).map((item, ii) => (
                        <div key={ii}
                             className="flex items-center gap-4 py-4 border-b border-white/5 group hover:border-white/10 transition-colors">
                          {item.image && (
                            <img src={item.image} alt="" className="w-16 h-16 rounded-xl object-cover opacity-70 group-hover:opacity-100 transition-opacity shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-white/80 group-hover:text-white transition-colors">{item.name}</p>
                            {item.description && <p className="text-sm text-white/30 mt-0.5 line-clamp-1">{item.description}</p>}
                          </div>
                          <span className="font-black text-sm shrink-0 transition-colors" style={{ color: clr }}>{item.price} TND</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Gallery ── */}
      {showGallery && images?.length > 0 && (
        <section id="gallery" className="py-28 border-t border-white/5">
          <div className="max-w-6xl mx-auto px-8">
            <p className="text-xs font-black uppercase tracking-[0.3em] mb-2" style={{ color: clr }}>Gallery</p>
            <div className="w-16 h-0.5 mb-12" style={{ backgroundColor: clr }} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {images.map((img, i) => (
                <div key={i} className={`relative overflow-hidden rounded-2xl group ${i === 0 ? 'col-span-2 row-span-2' : ''}`}
                     style={{ aspectRatio: '1/1' }}>
                  <img src={img} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Hours ── */}
      {showHours && openingHours?.length > 0 && (
        <section className="py-20 border-t border-white/5">
          <div className="max-w-xs mx-auto px-8">
            <p className="text-xs font-black uppercase tracking-[0.3em] mb-8 text-center" style={{ color: clr }}>Hours</p>
            <div className="space-y-3">
              {openingHours.map((h, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="capitalize text-white/40">{h.day}</span>
                  <span className={h.isClosed ? 'text-red-400/60' : 'text-white/60'}>
                    {h.isClosed ? 'Closed' : `${h.open} – ${h.close}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer id="footer-modern" className="border-t border-white/8 pt-14 pb-8">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <p className="text-lg font-black tracking-widest uppercase mb-2">{name}</p>
              {slogan && <p className="text-xs text-white/30 italic">{slogan}</p>}
              {vipService?.enabled && (
                <button onClick={() => setShowVIP(true)}
                        className="mt-4 flex items-center gap-1.5 text-xs font-bold transition-all hover:scale-105"
                        style={{ color: clr }}>
                  <Crown size={11} /> Book VIP Table
                </button>
              )}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-3">Contact</p>
              {contact?.phone && (
                <a href={`tel:${contact.phone}`} className="block text-sm text-white/50 hover:text-white/70 mb-1 transition-colors">{contact.phone}</a>
              )}
              {address?.city && <p className="text-sm text-white/50">{address.street && `${address.street}, `}{address.city}</p>}
              {googleMapsLink && (
                <a href={googleMapsLink} target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-1 text-xs mt-2 font-semibold transition-colors" style={{ color: clr }}>
                  Directions <ExternalLink size={10} />
                </a>
              )}
            </div>
            {sortedHours.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-3 flex items-center gap-1.5">
                  <Clock size={10} style={{ color: clr }} /> Hours
                </p>
                <div className="space-y-1.5">
                  {sortedHours.map((h, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="capitalize text-white/40">{h.day.slice(0,3)}</span>
                      <span className={h.isClosed ? 'text-red-400/60' : 'text-white/55'}>
                        {h.isClosed ? 'Closed' : `${h.open}–${h.close}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-3">Social</p>
              <div className="flex gap-2">
                {socialMedia?.facebook && (
                  <a href={socialMedia.facebook} target="_blank" rel="noopener noreferrer"
                     className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-white/40 hover:text-white hover:border-white/40 transition-all text-xs font-black">f</a>
                )}
                {socialMedia?.instagram && (
                  <a href={socialMedia.instagram} target="_blank" rel="noopener noreferrer"
                     className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-white/40 hover:text-white hover:border-white/40 transition-all text-xs font-black">in</a>
                )}
                {socialMedia?.tiktok && (
                  <a href={socialMedia.tiktok} target="_blank" rel="noopener noreferrer"
                     className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-white/40 hover:text-white hover:border-white/40 transition-all text-xs font-black">tk</a>
                )}
              </div>
            </div>
          </div>
          <div className="border-t border-white/8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/20">
            <span>{footerText || `© ${new Date().getFullYear()} ${name}`}</span>
            <a href="/" className="hover:text-white/40 transition-colors">Restora</a>
          </div>
        </div>
      </footer>

      {showVIP && (
        <VIPBookingModal slug={slug} restaurantName={name} primaryColor={clr} onClose={() => setShowVIP(false)} />
      )}
    </div>
  );
}
