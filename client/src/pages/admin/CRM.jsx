import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Users, Search, Star, Clock, TrendingUp, Phone, Mail, Cake,
  ChevronRight, X, Plus, Edit3, Loader2, UserCheck, AlertCircle,
  Heart, Utensils, MessageSquare, Calendar,
} from 'lucide-react';
import { customerService } from '../../services/customerService';

const SEGMENTS = [
  { key: 'all',      label: 'All Guests',  color: 'text-white/60' },
  { key: 'vip',      label: 'VIP',         color: 'text-amber-400' },
  { key: 'regular',  label: 'Regulars',    color: 'text-blue-400'  },
  { key: 'new',      label: 'New',         color: 'text-emerald-400' },
  { key: 'inactive', label: 'Inactive',    color: 'text-red-400'   },
];

function StatCard({ icon: Icon, value, label, color, bg }) {
  return (
    <div className={`${bg} rounded-2xl p-4 flex items-center gap-3`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bg.replace('/10', '/20')}`}>
        <Icon size={16} className={color} />
      </div>
      <div>
        <p className={`text-2xl font-black tabular-nums ${color}`}>{value ?? '—'}</p>
        <p className="text-[10px] font-semibold text-gray-400 dark:text-white/40">{label}</p>
      </div>
    </div>
  );
}

function CustomerCard({ customer, onClick }) {
  const initials = customer.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  const isVIP = customer.vipStatus;
  const isInactive = customer.lastVisit && (Date.now() - new Date(customer.lastVisit).getTime()) > 45 * 86400 * 1000;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={() => onClick(customer)}
      className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl p-4 cursor-pointer hover:border-gray-200 dark:hover:border-white/15 transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${
          isVIP ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-100 dark:bg-white/8 text-gray-500 dark:text-white/60'
        }`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{customer.name}</p>
            {isVIP && <Star size={10} className="text-amber-400 fill-amber-400 shrink-0" />}
          </div>
          <p className="text-[11px] text-gray-400 dark:text-white/40 mt-0.5">{customer.phone || customer.email || 'No contact'}</p>
        </div>
        <ChevronRight size={14} className="text-gray-300 dark:text-white/20 group-hover:text-gray-500 dark:group-hover:text-white/50 transition-colors shrink-0 mt-1" />
      </div>

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-white/6">
        <div className="flex-1 text-center">
          <p className="text-sm font-black text-orange-500 dark:text-orange-400 tabular-nums">{customer.totalVisits ?? 0}</p>
          <p className="text-[9px] text-gray-400 dark:text-white/30">Visits</p>
        </div>
        <div className="w-px h-6 bg-gray-100 dark:bg-white/6" />
        <div className="flex-1 text-center">
          <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{Math.round(customer.averageSpend ?? 0)}</p>
          <p className="text-[9px] text-gray-400 dark:text-white/30">Avg TND</p>
        </div>
        <div className="w-px h-6 bg-gray-100 dark:bg-white/6" />
        <div className="flex-1 text-center">
          <p className={`text-[10px] font-bold ${
            isInactive ? 'text-red-500 dark:text-red-400' : isVIP ? 'text-amber-500 dark:text-amber-400' : 'text-gray-400 dark:text-white/40'
          }`}>
            {isVIP ? 'VIP' : isInactive ? 'Inactive' : 'Regular'}
          </p>
          <p className="text-[9px] text-gray-400 dark:text-white/30">Status</p>
        </div>
      </div>
    </motion.div>
  );
}

function CustomerDrawer({ customer, onClose, onRefresh }) {
  const [noteText, setNoteText] = useState('');
  const qc = useQueryClient();

  const { mutate: addNote, isPending } = useMutation({
    mutationFn: () => customerService.addVisit(customer._id, {
      date: new Date(),
      notes: noteText,
      covers: 1,
      spend: 0,
    }),
    onSuccess: () => {
      toast.success('Note added');
      setNoteText('');
      qc.invalidateQueries(['customers']);
      onRefresh?.();
    },
    onError: () => toast.error('Failed to add note'),
  });

  if (!customer) return null;

  const isVIP = customer.vipStatus;
  const initials = customer.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-[#0f0f0f] border-l border-gray-100 dark:border-white/8 z-40 flex flex-col shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/6">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-base font-black ${
            isVIP ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-100 dark:bg-white/8 text-gray-500 dark:text-white/60'
          }`}>
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">{customer.name}</h2>
              {isVIP && <Star size={12} className="text-amber-400 fill-amber-400" />}
            </div>
            <p className="text-xs text-gray-400 dark:text-white/40">
              Member since {new Date(customer.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/6 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/12 text-gray-400 dark:text-white/50 hover:text-gray-900 dark:hover:text-white transition-all">
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Contact */}
        <div className="space-y-2">
          {customer.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-white/60">
              <Phone size={13} className="text-gray-400 dark:text-white/30" />
              {customer.phone}
            </div>
          )}
          {customer.email && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-white/60">
              <Mail size={13} className="text-gray-400 dark:text-white/30" />
              {customer.email}
            </div>
          )}
          {customer.birthday && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-white/60">
              <Cake size={13} className="text-gray-400 dark:text-white/30" />
              {new Date(customer.birthday).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}
            </div>
          )}
        </div>

        {/* Lifetime stats */}
        <div>
          <p className="text-[10px] font-bold text-gray-400 dark:text-white/30 uppercase tracking-wider mb-2">Lifetime Stats</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Visits',    value: customer.totalVisits ?? 0,                 color: 'text-orange-500 dark:text-orange-400' },
              { label: 'Total TND', value: Math.round(customer.totalSpend ?? 0),       color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Avg TND',   value: Math.round(customer.averageSpend ?? 0),     color: 'text-blue-600 dark:text-blue-400' },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 dark:bg-white/4 rounded-xl p-3 text-center">
                <p className={`text-lg font-black tabular-nums ${s.color}`}>{s.value}</p>
                <p className="text-[9px] text-gray-400 dark:text-white/30">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Preferences */}
        {(customer.preferences?.dietaryNotes || customer.allergies?.length > 0 || customer.preferences?.seatingPreference) && (
          <div>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-2">Preferences</p>
            <div className="space-y-2">
              {customer.allergies?.length > 0 && (
                <div className="flex items-start gap-2 bg-red-500/8 border border-red-500/20 rounded-xl p-3">
                  <AlertCircle size={13} className="text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-red-400 mb-1">Allergies</p>
                    <div className="flex flex-wrap gap-1">
                      {customer.allergies.map(a => (
                        <span key={a} className="text-[10px] bg-red-500/15 text-red-300 px-2 py-0.5 rounded-full">{a}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {customer.preferences?.dietaryNotes && (
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-white/50 bg-gray-50 dark:bg-white/4 rounded-xl p-3">
                  <Utensils size={12} className="text-gray-400 dark:text-white/30 shrink-0" />
                  {customer.preferences.dietaryNotes}
                </div>
              )}
              {customer.preferences?.seatingPreference && (
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-white/50 bg-gray-50 dark:bg-white/4 rounded-xl p-3">
                  <Heart size={12} className="text-gray-400 dark:text-white/30 shrink-0" />
                  Prefers: {customer.preferences.seatingPreference}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Favorite items */}
        {customer.preferences?.favoriteItems?.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-2">Favorite Items</p>
            <div className="flex flex-wrap gap-1.5">
              {customer.preferences.favoriteItems.map(item => (
                <span key={item} className="text-[11px] bg-orange-500/10 text-orange-300 border border-orange-500/20 px-2.5 py-1 rounded-full">{item}</span>
              ))}
            </div>
          </div>
        )}

        {/* Visit history */}
        {customer.visitHistory?.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-2">Recent Visits</p>
            <div className="space-y-2">
              {customer.visitHistory.slice(-5).reverse().map((v, i) => (
                <div key={i} className="flex items-start gap-2.5 bg-gray-50 dark:bg-white/3 rounded-xl p-3">
                  <Calendar size={12} className="text-gray-400 dark:text-white/30 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-gray-500 dark:text-white/60">{new Date(v.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      {v.spend > 0 && <p className="text-[11px] font-bold text-orange-500 dark:text-orange-400">{v.spend} TND</p>}
                    </div>
                    {v.notes && <p className="text-[10px] text-gray-400 dark:text-white/30 mt-0.5 truncate">{v.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Internal notes */}
        {customer.internalNotes && (
          <div>
            <p className="text-[10px] font-bold text-gray-400 dark:text-white/30 uppercase tracking-wider mb-2">Staff Notes</p>
            <p className="text-xs text-gray-500 dark:text-white/50 bg-gray-50 dark:bg-white/4 rounded-xl p-3 leading-relaxed">{customer.internalNotes}</p>
          </div>
        )}
      </div>

      {/* Add note */}
      <div className="px-5 py-4 border-t border-gray-100 dark:border-white/6 space-y-2">
        <p className="text-[10px] font-bold text-gray-400 dark:text-white/30 uppercase tracking-wider">Quick Note</p>
        <div className="flex gap-2">
          <input
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && noteText.trim() && addNote()}
            placeholder="Add a visit note…"
            className="flex-1 bg-gray-50 dark:bg-white/6 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20 focus:outline-none focus:border-orange-500/50"
          />
          <button
            onClick={() => noteText.trim() && addNote()}
            disabled={!noteText.trim() || isPending}
            className="w-9 h-9 rounded-xl bg-orange-500/20 hover:bg-orange-500/40 border border-orange-500/25 flex items-center justify-center text-orange-400 transition-all disabled:opacity-40"
          >
            {isPending ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function CRM() {
  const [segment, setSegment] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const qc = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['customer-stats'],
    queryFn: () => customerService.getStats().then(r => r.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['customers', segment, search],
    queryFn: () => customerService.list({ segment: segment === 'all' ? undefined : segment, search: search || undefined }).then(r => r.data),
    placeholderData: (prev) => prev,
  });

  const customers = data?.customers || data || [];

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-gray-50 dark:bg-[#0a0a0a]">
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <div className="px-5 py-4 bg-white dark:bg-transparent border-b border-gray-100 dark:border-white/6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-black text-gray-900 dark:text-white">Guest CRM</h1>
              <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">Know every guest by name</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={Users}     value={stats?.total}        label="Total Guests"   color="text-gray-700 dark:text-white"      bg="bg-gray-100 dark:bg-white/5" />
            <StatCard icon={Star}      value={stats?.vip}          label="VIP Guests"     color="text-amber-600 dark:text-amber-400"  bg="bg-amber-50 dark:bg-amber-500/10" />
            <StatCard icon={UserCheck} value={stats?.newThisMonth} label="New This Month" color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-500/10" />
            <StatCard icon={Clock}     value={stats?.inactive}     label="Inactive 45d+"  color="text-red-500 dark:text-red-400"      bg="bg-red-50 dark:bg-red-500/10" />
          </div>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 bg-white dark:bg-transparent flex items-center gap-3 border-b border-gray-100 dark:border-white/6 flex-wrap">
          {/* Segment tabs */}
          <div className="flex gap-1.5">
            {SEGMENTS.map(s => (
              <button key={s.key} onClick={() => setSegment(s.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  segment === s.key
                    ? 'bg-orange-500 text-white'
                    : `bg-gray-100 dark:bg-white/6 ${s.color} hover:bg-gray-200 dark:hover:bg-white/10`
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-40">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or phone…"
              className="w-full bg-gray-100 dark:bg-white/6 border border-gray-200 dark:border-white/8 rounded-xl pl-8 pr-3 py-2 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20 focus:outline-none focus:border-orange-500/40"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-gray-300 dark:text-white/30">
              <Loader2 size={22} className="animate-spin" />
            </div>
          ) : customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-300 dark:text-white/20 gap-2">
              <Users size={28} />
              <p className="text-xs">No guests found</p>
              <p className="text-[11px] text-gray-300 dark:text-white/15">Guests are created automatically from reservations and orders</p>
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              <AnimatePresence>
                {customers.map(c => (
                  <CustomerCard key={c._id} customer={c} onClick={setSelected} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <CustomerDrawer
            customer={selected}
            onClose={() => setSelected(null)}
            onRefresh={() => qc.invalidateQueries(['customers'])}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
