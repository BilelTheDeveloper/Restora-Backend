import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Utensils, Globe, Clock } from 'lucide-react';
import { restaurantService } from '../../services/restaurantService';
import TemplateClassic  from './templates/TemplateClassic';
import TemplateModern   from './templates/TemplateModern';
import TemplateVivid    from './templates/TemplateVivid';
import TemplatePrestige from './templates/TemplatePrestige';

const TEMPLATE_MAP = {
  classic:  TemplateClassic,
  modern:   TemplateModern,
  vivid:    TemplateVivid,
  prestige: TemplatePrestige,
};

function PageSkeleton() {
  return (
    <div className="animate-pulse bg-white min-h-screen">
      <div className="h-screen bg-gray-200" />
    </div>
  );
}

export default function RestaurantPage() {
  const { slug } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ['restaurant', slug],
    queryFn:  () => restaurantService.getBySlug(slug),
  });

  if (isLoading) return <PageSkeleton />;

  // Unpublished — show coming-soon screen
  if (data?.unpublished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#090909] text-white text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5">
          <Clock size={24} className="text-orange-500" />
        </div>
        <h2 className="text-2xl font-black mb-2">Coming Soon</h2>
        <p className="text-sm text-white/40 max-w-xs">This restaurant is preparing their website. Check back soon.</p>
        <a href="/" className="mt-6 text-xs text-orange-500 hover:underline flex items-center gap-1">
          <Globe size={11} /> Back to Restora
        </a>
      </div>
    );
  }

  const r = data?.data;
  if (!r) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <Utensils size={24} className="text-gray-400" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Restaurant not found</h2>
        <p className="text-sm text-gray-400 mt-1">This page doesn&apos;t exist or has been removed.</p>
      </div>
    );
  }

  const templateId = r.template?.id ?? 'classic';
  const TemplateComponent = TEMPLATE_MAP[templateId] ?? TemplateClassic;

  const templateData = {
    // Core restaurant fields
    slug:          r.slug,
    name:          r.name,
    cuisine:       r.cuisine,
    coverImage:    r.coverImage,
    images:        r.images,
    about:         r.about,
    menu:          r.menu,
    address:       r.address,
    contact:       r.contact,
    openingHours:  r.openingHours,
    socialMedia:   r.socialMedia,
    googleMapsLink: r.googleMapsLink,
    rating:        r.rating,
    reviewCount:   r.reviewCount,
    isHalal:       r.isHalal,
    vipService:    r.vipService,
    // Template customisation
    slogan:         r.template?.slogan,
    badge:          r.template?.badge,
    heroBackground: r.template?.heroBackground ?? r.coverImage,
    primaryColor:   r.template?.primaryColor ?? '#f97316',
    footerText:     r.template?.footerText,
    ctaText:        r.template?.ctaText        ?? 'Reserve a Table',
    discoverText:   r.template?.discoverText   ?? 'Discover More',
    vipCtaText:     r.template?.vipCtaText     ?? 'Book VIP Table',
    showMenu:       r.template?.showMenu       ?? true,
    showGallery:    r.template?.showGallery    ?? true,
    showAbout:      r.template?.showAbout      ?? true,
    showHours:      r.template?.showHours      ?? false,
  };

  return <TemplateComponent data={templateData} />;
}
