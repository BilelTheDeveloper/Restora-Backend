import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Utensils } from 'lucide-react';
import { restaurantService } from '../../services/restaurantService';
import TemplateClassic from './templates/TemplateClassic';
import TemplateModern  from './templates/TemplateModern';
import TemplateVivid   from './templates/TemplateVivid';

const TEMPLATE_MAP = {
  classic: TemplateClassic,
  modern:  TemplateModern,
  vivid:   TemplateVivid,
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

  const r = data?.data;
  if (!r) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <Utensils size={24} className="text-gray-400" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Restaurant not found</h2>
        <p className="text-sm text-gray-400 mt-1">This page doesn't exist or has been removed.</p>
      </div>
    );
  }

  const templateId = r.template?.id ?? 'classic';
  const TemplateComponent = TEMPLATE_MAP[templateId] ?? TemplateClassic;

  const templateData = {
    // Core restaurant fields
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
    // Template customisation (may override)
    slogan:         r.template?.slogan,
    badge:          r.template?.badge,
    heroBackground: r.template?.heroBackground ?? r.coverImage,
    primaryColor:   r.template?.primaryColor ?? '#f97316',
    footerText:     r.template?.footerText,
    ctaText:        r.template?.ctaText ?? 'Reserve a Table',
    showMenu:       r.template?.showMenu  ?? true,
    showGallery:    r.template?.showGallery ?? true,
    showAbout:      r.template?.showAbout  ?? true,
    showHours:      r.template?.showHours  ?? false,
  };

  return <TemplateComponent data={templateData} />;
}
