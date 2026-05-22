import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ShieldCheck, Store, Users, CheckCircle2, ArrowRight } from 'lucide-react';
import { adminService } from '../../services/adminService';

function StatCard({ label, value, icon: Icon, color, sub, to }) {
  const card = (
    <div className={`bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/6 rounded-2xl p-5 shadow-sm flex items-start gap-4 ${to ? 'hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer' : ''}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">
          {value ?? <span className="inline-block w-10 h-6 bg-gray-100 dark:bg-white/8 rounded animate-pulse" />}
        </p>
        {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {to && <ArrowRight size={15} className="text-gray-300 dark:text-white/20 mt-1 shrink-0" />}
    </div>
  );
  return to ? <Link to={to}>{card}</Link> : card;
}

export default function SuperAdminDashboard() {
  const { data } = useQuery({
    queryKey: ['platform-stats'],
    queryFn:  adminService.getStats,
    refetchInterval: 30_000,
  });
  const s = data?.data;

  return (
    <div className="p-5 sm:p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Platform Overview</h1>
        <p className="text-xs text-gray-400 mt-0.5">Live stats across the Restora network</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Restaurants"
          value={s?.totalRestaurants}
          icon={Store}
          color="bg-violet-50 dark:bg-violet-500/10 text-violet-500"
          to="/superadmin/restaurants"
        />
        <StatCard
          label="Active Restaurants"
          value={s?.activeRestaurants}
          icon={CheckCircle2}
          color="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500"
          sub="currently live"
        />
        <StatCard
          label="KYC Pending"
          value={s?.pendingKYC}
          icon={ShieldCheck}
          color={s?.pendingKYC > 0 ? 'bg-red-50 dark:bg-red-500/10 text-red-500' : 'bg-gray-100 dark:bg-white/8 text-gray-400'}
          to="/superadmin/kyc-queue"
          sub={s?.pendingKYC > 0 ? 'awaiting review' : 'all clear'}
        />
        <StatCard
          label="Restaurant Owners"
          value={s?.totalOwners}
          icon={Users}
          color="bg-blue-50 dark:bg-blue-500/10 text-blue-500"
        />
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link to="/superadmin/kyc-queue"
              className="flex items-center gap-4 p-5 bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/6 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group">
          <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center shrink-0">
            <ShieldCheck size={18} className="text-violet-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900 dark:text-white">Review KYC Submissions</p>
            <p className="text-xs text-gray-400 mt-0.5">Approve or reject restaurant owner identities</p>
          </div>
          <ArrowRight size={16} className="text-gray-300 dark:text-white/20 group-hover:text-violet-500 transition-colors" />
        </Link>

        <Link to="/superadmin/restaurants"
              className="flex items-center gap-4 p-5 bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/6 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
            <Store size={18} className="text-blue-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900 dark:text-white">All Restaurants</p>
            <p className="text-xs text-gray-400 mt-0.5">Browse and manage every restaurant on the platform</p>
          </div>
          <ArrowRight size={16} className="text-gray-300 dark:text-white/20 group-hover:text-blue-500 transition-colors" />
        </Link>
      </div>
    </div>
  );
}
