import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import {
  CalendarDays, Users, CheckCircle2, XCircle, Clock, Phone,
  RefreshCw, Crown, Filter, Bell, Loader2, Check, X, AlertTriangle,
} from 'lucide-react';
import api from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import { useAuthStore } from '../../store/authStore';

const STATUS_MAP = {
  pending:   { label: 'Pending',   dot: 'bg-amber-500',   pill: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',    icon: Clock        },
  confirmed: { label: 'Confirmed', dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300', icon: CheckCircle2 },
  seated:    { label: 'Seated',    dot: 'bg-blue-500',    pill: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',         icon: Users        },
  completed: { label: 'Completed', dot: 'bg-gray-400',    pill: 'bg-gray-50 text-gray-600 dark:bg-white/5 dark:text-gray-400',             icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', dot: 'bg-red-400',     pill: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400',             icon: XCircle      },
  'no-show': { label: 'No Show',   dot: 'bg-gray-500',    pill: 'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-500',            icon: XCircle      },
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

function StatCard({ label, value, icon: Icon, color, bg, highlight }) {
  return (
    <div className={`bg-white dark:bg-[#141414] border rounded-2xl p-4 flex items-center gap-3 transition-all ${
      highlight ? 'border-amber-300 dark:border-amber-500/40 shadow-sm shadow-amber-100 dark:shadow-amber-500/10' : 'border-gray-100 dark:border-white/6'
    }`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
        <Icon size={16} className={color} />
      </div>
      <div>
        <p className="text-xl font-black text-gray-900 dark:text-white tabular-nums">{value}</p>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}

// ── Pending approvals quick-action banner ────────────────────────
function PendingBanner({ count }) {
  if (!count) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-500/8 border border-amber-200 dark:border-amber-500/25 rounded-2xl"
    >
      <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center shrink-0">
        <Bell size={13} className="text-amber-600 dark:text-amber-400" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-black text-amber-800 dark:text-amber-300">
          {count} reservation{count > 1 ? 's' : ''} awaiting your confirmation
        </p>
        <p className="text-[11px] text-amber-600/60 dark:text-amber-400/50 mt-0.5">
          Scroll down — use Confirm or Decline on each pending booking
        </p>
      </div>
    </motion.div>
  );
}

// ── Single reservation row ───────────────────────────────────────
function ReservationRow({ r, onUpdate, isUpdating, flash }) {
  const busy = isUpdating === r._id;
  const isPending = r.status === 'pending';

  return (
    <motion.div
      layout
      animate={flash ? { backgroundColor: ['rgba(251,191,36,0.15)', 'rgba(0,0,0,0)'] } : {}}
      transition={{ duration: 2.5 }}
      className={`flex flex-col sm:flex-row sm:items-start gap-3 p-4 transition-colors ${
        isPending
          ? 'bg-amber-50/60 dark:bg-amber-500/5 hover:bg-amber-50 dark:hover:bg-amber-500/8'
          : 'hover:bg-gray-50 dark:hover:bg-white/2'
      }`}
    >
      {/* Pending stripe indicator */}
      {isPending && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-amber-400 dark:bg-amber-500 rounded-l-xl" />
      )}

      {/* Avatar */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
        isPending ? 'bg-amber-100 dark:bg-amber-500/15' : 'bg-orange-50 dark:bg-orange-500/10'
      }`}>
        <span className={`text-sm font-black ${isPending ? 'text-amber-700 dark:text-amber-400' : 'text-orange-500'}`}>
          {r.customerName?.[0]?.toUpperCase()}
        </span>
      </div>

      {/* Guest info */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold text-gray-900 dark:text-white">{r.customerName}</p>
          <StatusPill status={r.status} />
          {r.table && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 px-1.5 py-0.5 rounded-lg">
              <Crown size={8} /> Table {r.table.number}
              {r.table.capacity && <span className="opacity-60"> · {r.table.capacity} seats</span>}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-white/40 flex-wrap">
          <span className="flex items-center gap-1 font-semibold text-gray-700 dark:text-gray-300">
            <CalendarDays size={11} className="text-orange-400" /> {fmtDate(r.date)}
          </span>
          <span className="flex items-center gap-1"><Clock size={10} /> {r.time}</span>
          <span className="flex items-center gap-1"><Users size={10} /> {r.partySize} guests</span>
          <a href={`tel:${r.customerPhone}`} className="flex items-center gap-1 hover:text-orange-500 transition-colors">
            <Phone size={10} /> {r.customerPhone}
          </a>
        </div>

        {r.notes && (
          <p className="text-[11px] text-gray-400 dark:text-white/30 italic">"{r.notes}"</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0 mt-1">
        {busy && <Loader2 size={13} className="animate-spin text-orange-400" />}

        {isPending && (
          <>
            <button
              onClick={() => onUpdate(r._id, 'cancelled')}
              disabled={busy}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/50 hover:border-red-300 dark:hover:border-red-500/40 hover:text-red-600 dark:hover:text-red-400 transition-all disabled:opacity-40"
            >
              <X size={11} /> Decline
            </button>
            <button
              onClick={() => onUpdate(r._id, 'confirmed')}
              disabled={busy}
              className="flex items-center gap-1 px-4 py-1.5 rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-600 text-white transition-all disabled:opacity-40 shadow-sm shadow-emerald-500/25"
            >
              <Check size={11} /> Confirm
            </button>
          </>
        )}

        {r.status === 'confirmed' && (
          <>
            <button
              onClick={() => onUpdate(r._id, 'seated')}
              disabled={busy}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors disabled:opacity-40"
            >
              Seat
            </button>
            <button
              onClick={() => onUpdate(r._id, 'no-show')}
              disabled={busy}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-40"
            >
              No Show
            </button>
          </>
        )}

        {r.status === 'seated' && (
          <button
            onClick={() => onUpdate(r._id, 'completed')}
            disabled={busy}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors disabled:opacity-40"
          >
            Complete
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ── Page ─────────────────────────────────────────────────────────
export default function Reservations() {
  const qc                              = useQueryClient();
  const { user }                        = useAuthStore();
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter,   setDateFilter]   = useState('');
  const [updatingId,   setUpdatingId]   = useState(null);
  const [flashIds,     setFlashIds]     = useState(new Set());

  // ── Live socket ──────────────────────────────────────────────
  useSocket(user?.restaurant, {
    'reservation:new': ({ reservation }) => {
      qc.invalidateQueries({ queryKey: ['reservations'] });
      if (reservation?._id) {
        setFlashIds(prev => new Set([...prev, reservation._id]));
        setTimeout(() => setFlashIds(prev => { const n = new Set(prev); n.delete(reservation._id); return n; }), 4000);
      }
      toast.success(
        `New booking — ${reservation?.customerName} · ${reservation?.partySize} guests`,
        { icon: '🔔', duration: 5000 }
      );
    },
    'reservation:updated': () => qc.invalidateQueries({ queryKey: ['reservations'] }),
  });

  // ── Data ─────────────────────────────────────────────────────
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['reservations', statusFilter, dateFilter],
    queryFn: () => api.get('/owner/reservations', {
      params: {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        date:   dateFilter || undefined,
      },
    }).then(r => r.data ?? []),
  });

  const reservations = data ?? [];

  // ── Mutations ────────────────────────────────────────────────
  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/owner/reservations/${id}/status`, { status }),
    onMutate:  ({ id }) => setUpdatingId(id),
    onSettled: () => setUpdatingId(null),
    onSuccess: (_, { status }) => {
      qc.invalidateQueries({ queryKey: ['reservations'] });
      qc.invalidateQueries({ queryKey: ['alerts'] });
      qc.invalidateQueries({ queryKey: ['alert-count'] });
      const msgs = {
        confirmed: '✅ Reservation confirmed',
        cancelled: '❌ Reservation declined',
        seated:    '🪑 Guest seated',
        completed: '🏁 Marked complete',
        'no-show': '👻 Marked no-show',
      };
      toast.success(msgs[status] ?? 'Updated');
    },
    onError: () => { toast.error('Update failed'); setUpdatingId(null); },
  });

  const handleUpdate = (id, status) => updateStatus({ id, status });

  const today       = new Date().toISOString().split('T')[0];
  const pendingList = reservations.filter(r => r.status === 'pending');

  const statCounts = {
    pending:   reservations.filter(r => r.status === 'pending').length,
    confirmed: reservations.filter(r => r.status === 'confirmed').length,
    covers:    reservations.filter(r => ['confirmed','seated'].includes(r.status)).reduce((s, r) => s + r.partySize, 0),
  };

  // Sort: pending first, then by date+time
  const sorted = [...reservations].sort((a, b) => {
    const pa = a.status === 'pending' ? 0 : 1;
    const pb = b.status === 'pending' ? 0 : 1;
    if (pa !== pb) return pa - pb;
    return new Date(a.date) - new Date(b.date) || a.time.localeCompare(b.time);
  });

  return (
    <div className="p-5 sm:p-6 space-y-5 max-w-6xl bg-gray-50 dark:bg-[#0a0a0a] min-h-full relative">
      <Toaster position="top-right" toastOptions={{ style: { fontSize: 13 } }} />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">Reservations</h1>
          <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">Manage VIP table bookings and confirmations</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total"     value={reservations.length} icon={CalendarDays} color="text-orange-500"  bg="bg-orange-50 dark:bg-orange-500/10" />
        <StatCard label="Pending"   value={statCounts.pending}  icon={Bell}         color="text-amber-500"   bg="bg-amber-50 dark:bg-amber-500/10"   highlight={statCounts.pending > 0} />
        <StatCard label="Confirmed" value={statCounts.confirmed} icon={CheckCircle2} color="text-emerald-500" bg="bg-emerald-50 dark:bg-emerald-500/10" />
        <StatCard label="Covers"    value={statCounts.covers}   icon={Users}        color="text-purple-500"  bg="bg-purple-50 dark:bg-purple-500/10"  />
      </div>

      {/* Pending banner */}
      <AnimatePresence>
        {pendingList.length > 0 && (
          <PendingBanner count={pendingList.length} key="pending-banner" />
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/6 rounded-2xl p-4 flex flex-wrap gap-3 items-center">
        <Filter size={13} className="text-gray-400 shrink-0" />
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize relative ${
                statusFilter === s
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
              }`}
            >
              {s === 'all' ? 'All' : STATUS_MAP[s]?.label ?? s}
              {s === 'pending' && statCounts.pending > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center">
                  {statCounts.pending > 9 ? '9+' : statCounts.pending}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-[140px] flex items-center gap-2">
          <CalendarDays size={13} className="text-gray-400 shrink-0" />
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 outline-none focus:border-orange-400 transition-colors [color-scheme:light] dark:[color-scheme:dark]"
          />
          {dateFilter && (
            <button onClick={() => setDateFilter('')} className="text-xs text-gray-400 hover:text-red-400 transition-colors">✕</button>
          )}
        </div>
        <button
          onClick={() => setDateFilter(today)}
          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
        >
          Today
        </button>
      </div>

      {/* Reservations list — ALL statuses, pending pinned to top */}
      <div className="bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/6 rounded-2xl overflow-hidden relative">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 dark:text-white/30 gap-2">
            <Loader2 size={18} className="animate-spin" /> Loading reservations…
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-white/20">
            <CalendarDays size={36} className="opacity-20 mb-3" />
            <p className="text-sm font-semibold text-gray-500 dark:text-white/30">No reservations found</p>
            <p className="text-xs mt-1 text-gray-300 dark:text-white/15">
              {statusFilter !== 'all'
                ? `No ${STATUS_MAP[statusFilter]?.label ?? statusFilter} reservations`
                : 'Bookings made via your website will appear here in real time'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {sorted.map(r => (
              <ReservationRow
                key={r._id}
                r={r}
                onUpdate={handleUpdate}
                isUpdating={updatingId}
                flash={flashIds.has(r._id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
