import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, MapPin, Star } from 'lucide-react';
import { restaurantService } from '../../services/restaurantService';

export default function Home() {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['restaurants', { search, city }],
    queryFn: () => restaurantService.getAll({ search, city }),
  });

  const restaurants = data?.data || [];

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-orange-500 to-orange-600 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Discover Great Restaurants</h1>
          <p className="text-orange-100 text-lg mb-8">Order online, book a table, or explore nearby restaurants</p>
          <div className="bg-white rounded-2xl p-2 flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center gap-2 px-3">
              <Search size={18} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search restaurants or cuisine..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 text-gray-800 text-sm outline-none"
              />
            </div>
            <div className="flex items-center gap-2 px-3 sm:border-l">
              <MapPin size={18} className="text-gray-400" />
              <input
                type="text"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-32 text-gray-800 text-sm outline-none"
              />
            </div>
            <button className="bg-orange-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors">
              Search
            </button>
          </div>
        </div>
      </section>

      {/* Restaurants grid */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-6">
          {search || city ? 'Search Results' : 'Featured Restaurants'}
        </h2>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm animate-pulse">
                <div className="h-40 bg-gray-200 dark:bg-gray-700" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : restaurants.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-16">No restaurants found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {restaurants.map((r) => (
              <Link key={r._id} to={`/r/${r.slug}`} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md dark:shadow-black/30 transition-shadow">
                <div className="h-40 bg-gray-200 dark:bg-gray-700 relative">
                  {r.coverImage && <img src={r.coverImage} alt={r.name} className="w-full h-full object-cover" />}
                  {r.isHalal && (
                    <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">Halal</span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100">{r.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{r.cuisine?.join(', ')}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{r.rating?.toFixed(1)}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">({r.reviewCount})</span>
                    {r.address?.city && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">{r.address.city}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
