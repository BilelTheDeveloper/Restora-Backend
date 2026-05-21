import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Phone, Clock, Star } from 'lucide-react';
import { restaurantService } from '../../services/restaurantService';

export default function RestaurantPage() {
  const { slug } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ['restaurant', slug],
    queryFn: () => restaurantService.getBySlug(slug),
  });

  const restaurant = data?.data;

  if (isLoading) return (
    <div className="max-w-5xl mx-auto px-4 py-12 animate-pulse space-y-4">
      <div className="h-56 bg-gray-200 rounded-xl" />
      <div className="h-8 bg-gray-200 rounded w-1/3" />
    </div>
  );

  if (!restaurant) return (
    <div className="text-center py-24 text-gray-500">Restaurant not found.</div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Cover */}
      <div className="h-56 bg-gray-200 rounded-2xl overflow-hidden mb-6">
        {restaurant.coverImage && (
          <img src={restaurant.coverImage} alt={restaurant.name} className="w-full h-full object-cover" />
        )}
      </div>

      {/* Info */}
      <div className="flex items-start gap-4 mb-8">
        {restaurant.logo && (
          <img src={restaurant.logo} alt="" className="w-20 h-20 rounded-xl object-cover border shadow-sm" />
        )}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{restaurant.name}</h1>
          <p className="text-gray-500 mt-1">{restaurant.cuisine?.join(' · ')}</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            {restaurant.address?.city && (
              <span className="flex items-center gap-1"><MapPin size={14} />{restaurant.address.city}</span>
            )}
            {restaurant.contact?.phone && (
              <span className="flex items-center gap-1"><Phone size={14} />{restaurant.contact.phone}</span>
            )}
            <span className="flex items-center gap-1">
              <Star size={14} className="text-yellow-400 fill-yellow-400" />
              {restaurant.rating?.toFixed(1)} ({restaurant.reviewCount} reviews)
            </span>
          </div>
          {restaurant.description && (
            <p className="mt-3 text-gray-600 max-w-xl">{restaurant.description}</p>
          )}
        </div>
      </div>

      <p className="text-gray-400 text-center py-8">Menu, reservations & ordering coming soon.</p>
    </div>
  );
}
