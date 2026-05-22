import { MapPin, Phone, Clock, ExternalLink } from 'lucide-react';

function SocialLink({ href, children }) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
       className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:border-white/60 transition-all text-xs font-bold">
      {children}
    </a>
  );
}

export default function TemplateClassic({ data }) {
  const {
    name, slogan, badge, cuisine, coverImage, heroBackground, primaryColor = '#f97316',
    about, menu, images, socialMedia, googleMapsLink,
    contact, address, openingHours, footerText, ctaText = 'Reserve a Table',
    showMenu = true, showGallery = true, showAbout = true, showHours = false,
    isHalal, rating, reviewCount,
  } = data;

  const hero  = heroBackground || coverImage;
  const clr   = primaryColor;

  return (
    <div className="font-sans bg-[#fafaf8] text-[#1c1917]">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div>
            <span className="text-xl font-black tracking-tight" style={{ color: clr }}>{name}</span>
            {badge && <span className="ml-2 text-xs text-gray-400">{badge}</span>}
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            {showAbout  && <a href="#about"   className="hover:text-gray-900 transition-colors">About</a>}
            {showMenu   && <a href="#menu"    className="hover:text-gray-900 transition-colors">Menu</a>}
            {showGallery && <a href="#gallery" className="hover:text-gray-900 transition-colors">Gallery</a>}
          </nav>
          {contact?.phone && (
            <a href={`tel:${contact.phone}`}
               className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white shadow-sm transition-all hover:scale-105"
               style={{ backgroundColor: clr }}>
              <Phone size={13} /> {ctaText}
            </a>
          )}
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative h-[80vh] min-h-[520px] overflow-hidden">
        {hero ? (
          <img src={hero} alt={name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${clr}dd, ${clr}88)` }} />
        )}
        <div className="absolute inset-0 bg-black/45" />

        <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
          <div className="flex flex-wrap gap-2 justify-center mb-5">
            {cuisine?.map(c => (
              <span key={c} className="text-xs font-semibold text-white/90 bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">
                {c}
              </span>
            ))}
            {isHalal && (
              <span className="text-xs font-semibold text-white bg-emerald-500 px-3 py-1 rounded-full">Halal</span>
            )}
          </div>
          <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tight leading-none mb-4">{name}</h1>
          {slogan && <p className="text-xl sm:text-2xl text-white/80 font-light max-w-xl">{slogan}</p>}

          <div className="flex flex-wrap gap-3 mt-10 justify-center">
            {contact?.phone && (
              <a href={`tel:${contact.phone}`}
                 className="flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                 style={{ backgroundColor: clr }}>
                <Phone size={15} /> {ctaText}
              </a>
            )}
            {googleMapsLink && (
              <a href={googleMapsLink} target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold bg-white/15 backdrop-blur-sm text-white border border-white/30 hover:bg-white/25 transition-all">
                <MapPin size={15} /> Directions
              </a>
            )}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-60">
          <div className="w-px h-10 bg-white/50 animate-pulse" />
          <div className="w-1.5 h-1.5 rounded-full bg-white" />
        </div>
      </section>

      {/* ── Info strip ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-wrap gap-6 items-center justify-center md:justify-start text-sm text-gray-600">
          {address?.city && (
            <div className="flex items-center gap-2">
              <MapPin size={15} className="shrink-0" style={{ color: clr }} />
              <span>{address.street && `${address.street}, `}{address.city}</span>
            </div>
          )}
          {contact?.phone && (
            <div className="flex items-center gap-2">
              <Phone size={15} className="shrink-0" style={{ color: clr }} />
              <a href={`tel:${contact.phone}`} className="hover:underline">{contact.phone}</a>
            </div>
          )}
          {googleMapsLink && (
            <a href={googleMapsLink} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-1.5 font-medium transition-colors"
               style={{ color: clr }}>
              Get Directions <ExternalLink size={12} />
            </a>
          )}
          {rating > 0 && (
            <div className="flex items-center gap-1.5 ml-auto">
              {'★★★★★'.split('').map((s, i) => (
                <span key={i} style={{ color: i < Math.round(rating) ? '#fbbf24' : '#d1d5db', fontSize: '14px' }}>★</span>
              ))}
              <span className="text-gray-500 ml-1">({reviewCount} reviews)</span>
            </div>
          )}
        </div>
      </div>

      {/* ── About ── */}
      {showAbout && (about?.text || about?.image) && (
        <section id="about" className="py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-center gap-4 mb-12">
              <div className="h-px flex-1 bg-gray-200" />
              <h2 className="text-3xl font-black tracking-tight">Our Story</h2>
              <div className="h-px flex-1 bg-gray-200" />
            </div>
            <div className={`grid gap-12 items-center ${about?.image ? 'md:grid-cols-2' : 'max-w-2xl mx-auto'}`}>
              {about?.image && (
                <div className="relative rounded-3xl overflow-hidden aspect-[4/3] shadow-2xl">
                  <img src={about.image} alt="" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
              )}
              <div>
                <div className="w-12 h-1 rounded-full mb-6" style={{ backgroundColor: clr }} />
                <p className="text-lg text-gray-600 leading-relaxed">{about?.text}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Menu ── */}
      {showMenu && menu?.length > 0 && (
        <section id="menu" className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-center gap-4 mb-12">
              <div className="h-px flex-1 bg-gray-200" />
              <h2 className="text-3xl font-black tracking-tight">Our Menu</h2>
              <div className="h-px flex-1 bg-gray-200" />
            </div>
            <div className="space-y-12">
              {menu.filter(cat => cat.items?.length > 0).map((cat, ci) => (
                <div key={ci}>
                  <h3 className="text-sm font-bold uppercase tracking-[0.2em] mb-6 pb-3 border-b border-gray-100"
                      style={{ color: clr }}>
                    {cat.category}
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {cat.items.filter(i => i.available !== false).map((item, ii) => (
                      <div key={ii} className="flex gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                        {item.image ? (
                          <img src={item.image} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0" />
                        ) : (
                          <div className="w-20 h-20 rounded-xl shrink-0 flex items-center justify-center text-2xl"
                               style={{ backgroundColor: clr + '15' }}>
                            🍽
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-bold text-gray-900">{item.name}</p>
                            <span className="font-black text-sm shrink-0" style={{ color: clr }}>{item.price} TND</span>
                          </div>
                          {item.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>}
                        </div>
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
        <section id="gallery" className="py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-center gap-4 mb-12">
              <div className="h-px flex-1 bg-gray-200" />
              <h2 className="text-3xl font-black tracking-tight">Gallery</h2>
              <div className="h-px flex-1 bg-gray-200" />
            </div>
            <div className="columns-2 md:columns-3 gap-4 space-y-4">
              {images.map((img, i) => (
                <div key={i} className="break-inside-avoid rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                  <img src={img} alt="" className="w-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Hours ── */}
      {showHours && openingHours?.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-md mx-auto px-6">
            <h2 className="text-2xl font-black text-center mb-8">Opening Hours</h2>
            <div className="divide-y divide-gray-100">
              {openingHours.map((h, i) => (
                <div key={i} className="flex justify-between py-3 text-sm">
                  <span className="capitalize font-medium text-gray-700">{h.day}</span>
                  <span className={h.isClosed ? 'text-red-400' : 'text-gray-600'}>
                    {h.isClosed ? 'Closed' : `${h.open} – ${h.close}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer className="py-12 text-white" style={{ backgroundColor: '#1c1917' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <p className="text-2xl font-black mb-2" style={{ color: clr }}>{name}</p>
              {badge && <p className="text-sm text-white/50">{badge}</p>}
              {slogan && <p className="text-sm text-white/60 mt-2">{slogan}</p>}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Contact</p>
              {contact?.phone && <p className="text-sm text-white/70 mb-1">{contact.phone}</p>}
              {address?.city && <p className="text-sm text-white/70">{address?.street && `${address.street}, `}{address.city}</p>}
              {googleMapsLink && (
                <a href={googleMapsLink} target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-1 text-sm mt-2 transition-colors hover:underline"
                   style={{ color: clr }}>
                  Get Directions <ExternalLink size={11} />
                </a>
              )}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Follow Us</p>
              <div className="flex gap-2">
                <SocialLink href={socialMedia?.facebook}>f</SocialLink>
                <SocialLink href={socialMedia?.instagram}>in</SocialLink>
                <SocialLink href={socialMedia?.tiktok}>tk</SocialLink>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/30">
            <span>{footerText || `© ${new Date().getFullYear()} ${name}. All rights reserved.`}</span>
            <span>Powered by <a href="/" className="hover:text-white/50 transition-colors">Restora</a></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
