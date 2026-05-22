import { useQuery } from '@tanstack/react-query';
import { ExternalLink, MapPin, Star, CheckCircle2, XCircle } from 'lucide-react';
import { adminService } from '../../services/adminService';

const PLAN_COLORS = {
  trial:      'bg-gray-100 dark:bg-white/8 text-gray-500',
  basic:      'bg-blue-50 dark:bg-blue-500/10 text-blue-500',
  pro:        'bg-violet-50 dark:bg-violet-500/10 text-violet-500',
  enterprise: 'bg-amber-50 dark:bg-amber-500/10 text-amber-500',
};

const KYC_COLORS = {
  approved:     'text-emerald-500',
  under_review: 'text-amber-500',
  rejected:     'text-red-400',
  pending:      'text-gray-400',
};

export default function Restaurants() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-restaurants'],
    queryFn:  adminService.getAllRestaurants,
  });
  const restaurants = data?.data ?? [];

  return (
    <div className="p-5 sm:p-6 space-y-5 max-w-5xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">All Restaurants</h1>
          <p className="text-xs text-gray-400 mt-0.5">{restaurants.length} restaurants on the platform</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : restaurants.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <p className="text-sm">No restaurants yet</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/6 rounded-2xl shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_80px] gap-4 px-5 py-3 border-b border-gray-100 dark:border-white/6 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            <span>Restaurant</span>
            <span>Owner</span>
            <span>City</span>
            <span>Plan</span>
            <span>Status</span>
          </div>

          {/* Rows */}
          {restaurants.map((r, i) => (
            <div
              key={r._id}
              className={`grid grid-cols-[2fr_1.5fr_1fr_1fr_80px] gap-4 px-5 py-4 items-center transition-colors hover:bg-gray-50 dark:hover:bg-white/3 ${i < restaurants.length - 1 ? 'border-b border-gray-100 dark:border-white/5' : ''}`}
            >
              {/* Name */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center text-violet-500 font-black text-xs shrink-0">
                  {r.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{r.name}</p>
                  <div className="flex items-center gap-1.5">
                    {r.rating > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-amber-500">
                        <Star size={9} className="fill-amber-500" /> {r.rating.toFixed(1)}
                      </span>
                    )}
                    <a href={`/r/${r.slug}`} target="_blank" rel="noopener noreferrer"
                       className="text-[10px] text-gray-400 hover:text-violet-500 flex items-center gap-0.5 transition-colors">
                      <ExternalLink size={9} /> View
                    </a>
                  </div>
                </div>
              </div>

              {/* Owner */}
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{r.owner?.name ?? '—'}</p>
                <p className={`text-[10px] font-semibold capitalize ${KYC_COLORS[r.owner?.verificationStatus] ?? 'text-gray-400'}`}>
                  {r.owner?.verificationStatus?.replace('_', ' ') ?? '—'}
                </p>
              </div>

              {/* City */}
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                {r.address?.city && <><MapPin size={10} className="shrink-0" />{r.address.city}</>}
              </div>

              {/* Plan */}
              <div>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${PLAN_COLORS[r.subscription?.plan] ?? PLAN_COLORS.trial}`}>
                  {r.subscription?.plan ?? 'trial'}
                </span>
              </div>

              {/* Status */}
              <div className="flex items-center gap-1.5">
                {r.isActive
                  ? <CheckCircle2 size={14} className="text-emerald-500" />
                  : <XCircle     size={14} className="text-red-400" />
                }
                <span className={`text-[10px] font-semibold ${r.isActive ? 'text-emerald-500' : 'text-red-400'}`}>
                  {r.isActive ? 'Active' : 'Off'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
