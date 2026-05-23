import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  CalendarDays, Users, CheckCircle2, XCircle, Clock, Phone,
  RefreshCw, Crown, Filter, ChevronDown, Circle,
} from 'lucide-react';
import api from '../../services/api';

const STATUS_MAP = {
  pending:   { label: 'Pending',   dot: 'bg-amber-500',   pill: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',   icon: Clock },
  confirmed: { label: 'Confirmed', dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400', icon: CheckCircle2 },
  seated:    { label: 'Seated',    dot: 'bg-blue-500',    pill: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',         icon: Users },
  completed: { label: 'Completed', dot: 'bg-gray-400',    pill: 'bg-gray-50 text-gray-500 dark:bg-white/5 dark:text-gray-400',             icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', dot: 'bg-red-400',     pill: 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400',             icon: XCircle },
  'no-show': { label: 'No Show',   dot: 'bg-gray-600',    pill: 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-500',            icon: XCircle },
};

const STATUS_FILTERS = ['all', 'pending', 'confirmed', 'seated', 'completed', 'cancelled'];

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function StatusPill({ status }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.pending;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${s.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, color, bg }) {
  return (
    <div className="bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/6 rounded-2xl p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
        <Icon size={16} className={color} />
      </div>
      <div>
        <p className="text-xl font-black text-gray-900 dark:text-white">{value}</p>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}

export default function Reservations() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter,   setDateFilter]   = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['reservations', statusFilter, dateFilter],
    queryFn: () => api.get('/owner/reservations', {
      params: { status: statusFilter !== 'all' ? statusFilter : undefined, date: dateFilter || undefined }
    }).then(r => r.data.data ?? []),
  });

  const reservations = data ?? [];

  const { mutate: updateStatus, variables: updatingId } = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/owner/reservations/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reservations'] });
      toast.success('Status updated');
    },
    onError: () => toast.error('Update failed'),
  });

  const today = new Date().toISOString().split('T')[0];

  const pending   = reservations.filter(r => r.status === 'pending').length;
  const confirmed = reservations.filter(r => r.status === 'confirmed').length;
  const covers    = reservations.filter(r => ['confirmed','seated'].includes(r.status)).reduce((a, r) => a + r.partySize, 0);

  return (
    <div className="p-5 sm:p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Reservations</h1>
          <p className="text-xs text-gray-400 mt-0.5">Manage VIP table bookings</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total"     value={reservations.length} icon={CalendarDays} color="text-orange-500"  bg="bg-orange-50 dark:bg-orange-500/10" />
        <StatCard label="Pending"   value={pending}             icon={Clock}        color="text-amber-500"   bg="bg-amber-50 dark:bg-amber-500/10"   />
        <StatCard label="Confirmed" value={confirmed}           icon={CheckCircle2} color="text-emerald-500" bg="bg-emerald-50 dark:bg-emerald-500/10" />
        <StatCard label="Covers"    value={covers}              icon={Users}        color="text-purple-500"  bg="bg-purple-50 dark:bg-purple-500/10"  />
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/6 rounded-2xl p-4 flex flex-wrap gap-3 items-center">
        <Filter size={13} className="text-gray-400 shrink-0" />
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize ${statusFilter === s ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'}`}>
              {s === 'all' ? 'All' : STATUS_MAP[s]?.label ?? s}
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-[140px] flex items-center gap-2">
          <CalendarDays size={13} className="text-gray-400 shrink-0" />
          <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
                 className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 outline-none focus:border-orange-400 transition-colors [color-scheme:light] dark:[color-scheme:dark]" />
          {dateFilter && (
            <button onClick={() => setDateFilter('')} className="text-xs text-gray-400 hover:text-red-400 transition-colors">✕</button>
          )}
        </div>
        <button onClick={() => setDateFilter(today)} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
          Today
        </button>
      </div>

      {/* Reservations list */}
      <div className="bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/6 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <RefreshCw size={20} className="animate-spin mr-2" /> Loading…
          </div>
        ) : reservations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <CalendarDays size={32} className="opacity-20 mb-3" />
            <p className="text-sm font-medium">No reservations found</p>
            <p className="text-xs mt-1">Bookings made via your website will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {reservations.map(r => {
              const s = STATUS_MAP[r.status] ?? STATUS_MAP.pending;
              const isUpdating = updatingId?.id === r._id;

              return (
                <div key={r._id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-white/2 transition-colors">
                  {/* Guest info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-black text-orange-500">{r.customerName?.[0]?.toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{r.customerName}</p>
                        {r.table && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-orange-500 bg-orange-50 dark:bg-orange-500/10 px-1.5 py-0.5 rounded-lg">
                            <Crown size={8} /> T-{r.table.number}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <a href={`tel:${r.customerPhone}`} className="flex items-center gap-1 text-xs text-gray-400 hover:text-orange-500 transition-colors">
                          <Phone size={10} /> {r.customerPhone}
                        </a>
                        {r.notes && <span className="text-xs text-gray-400 italic truncate max-w-[160px]">"{r.notes}"</span>}
                      </div>
                    </div>
                  </div>

                  {/* Date / time / guests */}
                  <div className="flex items-center gap-4 text-sm shrink-0">
                    <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                      <CalendarDays size={13} className="text-orange-500" />
                      <span className="font-semibold">{fmtDate(r.date)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                      <Clock size={12} /> {r.time}
                    </div>
                    <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                      <Users size={12} /> {r.partySize}
                    </div>
                  </div>

                  {/* Status + actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusPill status={r.status} />

                    {/* Quick actions */}
                    {r.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateStatus({ id: r._id, status: 'confirmed' })}
                          disabled={isUpdating}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => updateStatus({ id: r._id, status: 'cancelled' })}
                          disabled={isUpdating}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors disabled:opacity-50"
                        >
                          Decline
                        </button>
                      </>
                    )}
                    {r.status === 'confirmed' && (
                      <button
                        onClick={() => updateStatus({ id: r._id, status: 'seated' })}
                        disabled={isUpdating}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                      >
                        Seat
                      </button>
                    )}
                    {r.status === 'seated' && (
                      <button
                        onClick={() => updateStatus({ id: r._id, status: 'completed' })}
                        disabled={isUpdating}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                      >
                        Complete
                      </button>
                    )}
                    {isUpdating && <RefreshCw size={14} className="animate-spin text-orange-500" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
