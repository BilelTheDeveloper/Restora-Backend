import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Phone, Star, ExternalLink, Globe, Clock, Utensils, ChevronRight } from 'lucide-react';
import { restaurantService } from '../../services/restaurantService';

function FacebookIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" /></svg>;
}
function InstagramIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}
function TikTokIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.17a8.16 8.16 0 004.77 1.52V7.25a4.85 4.85 0 01-1-.56z" /></svg>;
}

// ─── Loading skeleton ──────────────────────────────────────
function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-72 sm:h-96 bg-gray-200 dark:bg-white/8" />
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="h-8 bg-gray-200 dark:bg-white/8 rounded w-1/3" />
        <div className="h-4 bg-gray-200 dark:bg-white/8 rounded w-1/2" />
        <div className="h-24 bg-gray-200 dark:bg-white/8 rounded" />
      </div>
    </div>
  );
}

// ─── Section heading ───────────────────────────────────────
function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{children}</h2>
      <div className="flex-1 h-px bg-gray-100 dark:bg-white/8" />
    </div>
  );
}

// ─── RestaurantPage ────────────────────────────────────────
export default function RestaurantPage() {
  const { slug } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ['restaurant', slug],
    queryFn: () => restaurantService.getBySlug(slug),
  });

  if (isLoading) return <Skeleton />;

  const r = data?.data;
  if (!r) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/8 flex items-center justify-center mb-4">
          <Utensils size={24} className="text-gray-400" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Restaurant not found</h2>
        <p className="text-sm text-gray-400 mt-1">This restaurant page doesn't exist or has been removed.</p>
      </div>
    );
  }

  const hasSocialMedia = r.socialMedia?.facebook || r.socialMedia?.instagram || r.socialMedia?.tiktok;
  const hasAbout       = r.about?.text || r.about?.image || r.description;
  const hasMenu        = r.menu?.length > 0 && r.menu.some(cat => cat.items?.length > 0);
  const hasGallery     = r.images?.length > 0;

  return (
    <div className="bg-white dark:bg-[#0a0a0a] min-h-screen">

      {/* ── Hero ── */}
      <div className="relative h-72 sm:h-[420px] bg-gray-900 overflow-hidden">
        {r.coverImage ? (
          <img
            src={r.coverImage}
            alt={r.name}
            className="w-full h-full object-cover opacity-70"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-600 to-orange-800 opacity-80" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        {/* Restaurant info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-wrap gap-2 mb-3">
              {r.cuisine?.map(c => (
                <span key={c} className="text-xs font-medium bg-white/20 backdrop-blur-sm text-white px-2.5 py-1 rounded-full">
                  {c}
                </span>
              ))}
              {r.isHalal && (
                <span className="text-xs font-medium bg-emerald-500 text-white px-2.5 py-1 rounded-full">Halal</span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">{r.name}</h1>

            <div className="flex flex-wrap items-center gap-4 mt-3">
              {r.address?.city && (
                <span className="flex items-center gap-1.5 text-sm text-white/80">
                  <MapPin size={14} /> {r.address.city}
                </span>
              )}
              {r.rating > 0 && (
                <span className="flex items-center gap-1.5 text-sm text-white/80">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  {r.rating.toFixed(1)}
                  <span className="text-white/50">({r.reviewCount} reviews)</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-14">

        {/* Quick info bar */}
        <div className="flex flex-wrap gap-3 p-4 bg-gray-50 dark:bg-white/4 border border-gray-100 dark:border-white/8 rounded-2xl shadow-sm">
          {r.contact?.phone && (
            <a
              href={`tel:${r.contact.phone}`}
              className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-500/15 flex items-center justify-center">
                <Phone size={13} className="text-orange-500" />
              </div>
              {r.contact.phone}
            </a>
          )}

          {r.googleMapsLink && (
            <a
              href={r.googleMapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center">
                <MapPin size={13} className="text-blue-500" />
              </div>
              Get Directions
              <ExternalLink size={11} className="text-gray-400" />
            </a>
          )}

          {hasSocialMedia && (
            <div className="flex items-center gap-2 ml-auto">
              {r.socialMedia?.facebook && (
                <a href={r.socialMedia.facebook} target="_blank" rel="noopener noreferrer"
                   className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white transition-colors">
                  <FacebookIcon size={14} />
                </a>
              )}
              {r.socialMedia?.instagram && (
                <a href={r.socialMedia.instagram} target="_blank" rel="noopener noreferrer"
                   className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 flex items-center justify-center text-white transition-colors">
                  <InstagramIcon size={14} />
                </a>
              )}
              {r.socialMedia?.tiktok && (
                <a href={r.socialMedia.tiktok} target="_blank" rel="noopener noreferrer"
                   className="w-8 h-8 rounded-lg bg-gray-900 dark:bg-white dark:text-gray-900 hover:opacity-80 flex items-center justify-center text-white transition-colors">
                  <TikTokIcon size={14} />
                </a>
              )}
            </div>
          )}
        </div>

        {/* ── About ── */}
        {hasAbout && (
          <section>
            <SectionTitle>About</SectionTitle>
            <div className={`grid gap-8 items-center ${r.about?.image ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
              {r.about?.image && (
                <div className="rounded-2xl overflow-hidden aspect-[4/3]">
                  <img src={r.about.image} alt="About" className="w-full h-full object-cover" />
                </div>
              )}
              <div>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-[15px]">
                  {r.about?.text || r.description}
                </p>
                {r.address?.street && (
                  <p className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400 mt-4">
                    <MapPin size={15} className="text-orange-500 mt-0.5 shrink-0" />
                    {r.address.street}{r.address.city && `, ${r.address.city}`}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── Menu ── */}
        {hasMenu && (
          <section>
            <SectionTitle>Menu</SectionTitle>
            <div className="space-y-8">
              {r.menu
                .filter(cat => cat.items?.some(i => i.available !== false))
                .map((cat, ci) => (
                  <div key={ci}>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">{cat.category}</span>
                      <ChevronRight size={13} className="text-orange-400" />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {cat.items
                        .filter(item => item.available !== false)
                        .map((item, ii) => (
                          <div
                            key={ii}
                            className="flex items-center gap-3 p-3.5 bg-gray-50 dark:bg-white/4 hover:bg-orange-50 dark:hover:bg-orange-500/5 border border-gray-100 dark:border-white/8 rounded-xl transition-colors"
                          >
                            {item.image ? (
                              <img src={item.image} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0 border border-gray-200 dark:border-white/10" />
                            ) : (
                              <div className="w-14 h-14 rounded-xl bg-orange-100 dark:bg-orange-500/15 flex items-center justify-center shrink-0">
                                <Utensils size={18} className="text-orange-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.name}</p>
                              {item.description && (
                                <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{item.description}</p>
                              )}
                            </div>
                            <span className="text-sm font-bold text-orange-500 shrink-0">{item.price} TND</span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* ── Gallery ── */}
        {hasGallery && (
          <section>
            <SectionTitle>Gallery</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {r.images.map((img, i) => (
                <div
                  key={i}
                  className={`rounded-xl overflow-hidden ${i === 0 ? 'sm:col-span-2 sm:row-span-2 aspect-video sm:aspect-square' : 'aspect-square'}`}
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Hours ── */}
        {r.openingHours?.length > 0 && (
          <section>
            <SectionTitle>Opening Hours</SectionTitle>
            <div className="bg-gray-50 dark:bg-white/4 border border-gray-100 dark:border-white/8 rounded-2xl overflow-hidden">
              {r.openingHours.map((h, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-white/6 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <Clock size={13} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{h.day}</span>
                  </div>
                  <span className={`text-sm ${h.isClosed ? 'text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                    {h.isClosed ? 'Closed' : `${h.open} – ${h.close}`}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Footer / Contact ── */}
        <div className="border-t border-gray-100 dark:border-white/8 pt-8 flex flex-wrap gap-4 items-center justify-between text-sm text-gray-400">
          <span className="font-semibold text-gray-600 dark:text-gray-300">{r.name}</span>
          {r.address?.city && <span className="flex items-center gap-1"><MapPin size={13} />{r.address.city}, Tunisia</span>}
          <a href="/" className="flex items-center gap-1 text-orange-500 hover:text-orange-600 font-medium transition-colors">
            <Globe size={13} /> Powered by Restora
          </a>
        </div>
      </div>
    </div>
  );
}
