import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  CheckCircle2, Clock, Users, Sparkles, X, RefreshCw,
  TrendingUp, UtensilsCrossed, Loader2, Activity,
} from 'lucide-react';
import { restaurantService } from '../../services/restaurantService';
import { analyticsService } from '../../services/analyticsService';
import { useAuthStore } from '../../store/authStore';
import { useSocket } from '../../hooks/useSocket';

const STATUS_CONFIG = {
  available: { label: 'Available', ring: 'ring-emerald-500/40', dot: 'bg-emerald-500', card: 'bg-emerald-500/8 border-emerald-500/20', text: 'text-emerald-400', icon: CheckCircle2, pulse: false },
  occupied:  { label: 'Occupied',  ring: 'ring-orange-500/60',  dot: 'bg-orange-500',  card: 'bg-orange-500/10 border-orange-500/30',  text: 'text-orange-400',  icon: Users,        pulse: true  },
  reserved:  { label: 'Reserved',  ring: 'ring-purple-500/40',  dot: 'bg-purple-500',  card: 'bg-purple-500/8 border-purple-500/20',   text: 'text-purple-400',  icon: Clock,        pulse: false },
  cleaning:  { label: 'Cleaning',  ring: 'ring-yellow-500/40',  dot: 'bg-yellow-500',  card: 'bg-yellow-500/8 border-yellow-500/20',   text: 'text-yellow-400',  icon: Sparkles,     pulse: false },
};

function TableCard({ table, occupancyData, onClick, isSelected }) {
  const cfg = STATUS_CONFIG[table.status] || STATUS_CONFIG.available;
  const Icon = cfg.icon;
  const occ = occupancyData?.find(o => o.tableId?.toString() === table._id?.toString());

  return (
    <motion.div
      layout
      onClick={() => onClick(table)}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      className={`relative cursor-pointer rounded-2xl border p-4 transition-all ${cfg.card} ${isSelected ? `ring-2 ${cfg.ring}` : 'ring-0'} bg-white dark:bg-transparent`}
    >
      {cfg.pulse && (
        <span className="absolute top-3 right-3">
          <span className={`absolute inline-flex h-2 w-2 rounded-full ${cfg.dot} opacity-75 animate-ping`} />
          <span className={`relative inline-flex h-2 w-2 rounded-full ${cfg.dot}`} />
        </span>
      )}

      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-lg font-black text-gray-900 dark:text-white">T-{table.number}</p>
          <p className="text-[10px] text-gray-400 dark:text-white/40 mt-0.5">{table.floor || 'Main'}</p>
        </div>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${cfg.dot.replace('bg-', 'bg-').replace('500', '500/20')}`}>
          <Icon size={14} className={cfg.text} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Users size={11} className="text-gray-300 dark:text-white/30" />
          <span className="text-[11px] text-gray-400 dark:text-white/50">{table.capacity}</span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.text} ${cfg.card}`}>{cfg.label}</span>
      </div>

      {occ && (
        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-white/6">
          <p className="text-[10px] text-gray-400 dark:text-white/30">{occ.revenue?.toFixed(0)} TND · {occ.orderCount} covers</p>
        </div>
      )}
    </motion.div>
  );
}

function TableDrawer({ table, occupancyData, onClose, onUpdateStatus }) {
  if (!table) return null;
  const cfg = STATUS_CONFIG[table.status] || STATUS_CONFIG.available;
  const occ = occupancyData?.find(o => o.tableId?.toString() === table._id?.toString());

  const QUICK_STATUSES = table.status === 'occupied'
    ? [{ key: 'cleaning', label: 'Mark Cleaning' }, { key: 'available', label: 'Mark Available' }]
    : table.status === 'cleaning'
    ? [{ key: 'available', label: 'Mark Available' }]
    : [];

  return (
    <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-[#0f0f0f] border-l border-gray-100 dark:border-white/8 z-40 flex flex-col shadow-2xl"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/6">
        <div>
          <p className="text-xs text-gray-400 dark:text-white/40">Table {table.number}</p>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">{table.floor || 'Main Floor'}</h2>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/6 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/12 text-gray-400 dark:text-white/50 hover:text-gray-900 dark:hover:text-white transition-all">
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Status */}
        <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${cfg.card}`}>
          <span className={`w-2 h-2 rounded-full ${cfg.dot} ${cfg.pulse ? 'animate-pulse' : ''}`} />
          <span className={`text-sm font-bold ${cfg.text}`}>{cfg.label}</span>
        </div>

        {/* Specs */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-50 dark:bg-white/4 rounded-xl p-3 text-center">
            <p className="text-lg font-black text-gray-900 dark:text-white">{table.capacity}</p>
            <p className="text-[10px] text-gray-400 dark:text-white/40">Capacity</p>
          </div>
          <div className="bg-gray-50 dark:bg-white/4 rounded-xl p-3 text-center">
            <p className="text-sm font-bold text-gray-900 dark:text-white capitalize">{table.shape || 'round'}</p>
            <p className="text-[10px] text-gray-400 dark:text-white/40">Shape</p>
          </div>
        </div>

        {/* Occupancy stats (last 30 days) */}
        {occ && (
          <div>
            <p className="text-[10px] font-bold text-gray-400 dark:text-white/40 uppercase tracking-wider mb-2">30-Day Performance</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gray-50 dark:bg-white/4 rounded-xl p-3 text-center">
                <p className="text-base font-black text-orange-400">{occ.revenue?.toFixed(0)}</p>
                <p className="text-[9px] text-gray-400 dark:text-white/40">Revenue TND</p>
              </div>
              <div className="bg-gray-50 dark:bg-white/4 rounded-xl p-3 text-center">
                <p className="text-base font-black text-blue-400">{occ.orderCount}</p>
                <p className="text-[9px] text-gray-400 dark:text-white/40">Covers</p>
              </div>
              <div className="bg-gray-50 dark:bg-white/4 rounded-xl p-3 text-center">
                <p className="text-base font-black text-emerald-400">{occ.avgSpend?.toFixed(0)}</p>
                <p className="text-[9px] text-gray-400 dark:text-white/40">Avg Spend</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {QUICK_STATUSES.length > 0 && (
        <div className="px-5 py-4 border-t border-gray-100 dark:border-white/6 space-y-2">
          {QUICK_STATUSES.map(s => (
            <button key={s.key} onClick={() => onUpdateStatus(table._id, s.key)}
              className="w-full py-2.5 bg-gray-100 dark:bg-white/8 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-900 dark:text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default function Tables() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [selectedTable, setSelectedTable] = useState(null);
  const [floorFilter, setFloorFilter] = useState('All');

  const { data: tables = [], isLoading, refetch } = useQuery({
    queryKey: ['owner-tables'],
    queryFn: () => restaurantService.getTables().then(r => r.data),
    refetchInterval: 60_000,
  });

  const { data: occupancyData = [] } = useQuery({
    queryKey: ['table-occupancy'],
    queryFn: () => analyticsService.getTableOccupancy(30).then(r => r.data),
  });

  useSocket(user?.restaurant, {
    'table:status_changed': ({ tableId, status }) => {
      qc.setQueryData(['owner-tables'], (old = []) =>
        old.map(t => t._id?.toString() === tableId?.toString() ? { ...t, status } : t)
      );
    },
  });

  const { mutate: updateTableStatus } = useMutation({
    mutationFn: ({ id, status }) => restaurantService.updateTable(id, { status }),
    onSuccess: () => { qc.invalidateQueries(['owner-tables']); toast.success('Table updated'); setSelectedTable(null); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const floors = ['All', ...new Set(tables.map(t => t.floor || 'Main'))];
  const filtered = floorFilter === 'All' ? tables : tables.filter(t => (t.floor || 'Main') === floorFilter);

  const stats = {
    available: tables.filter(t => t.status === 'available').length,
    occupied:  tables.filter(t => t.status === 'occupied').length,
    reserved:  tables.filter(t => t.status === 'reserved').length,
    cleaning:  tables.filter(t => t.status === 'cleaning').length,
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-gray-50 dark:bg-[#0a0a0a]">
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <div className="px-5 py-4 bg-white dark:bg-transparent border-b border-gray-100 dark:border-white/6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-bold text-gray-900 dark:text-white">Tables</h1>
            <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">Live floor status</p>
          </div>
          <button onClick={() => refetch()} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/6 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/12 text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white transition-all">
            <RefreshCw size={13} />
          </button>
        </div>

        {/* Stats */}
        <div className="px-5 py-3 bg-white dark:bg-transparent flex gap-3 border-b border-gray-100 dark:border-white/6 flex-wrap">
          {[
            { label: 'Available', count: stats.available, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
            { label: 'Occupied',  count: stats.occupied,  color: 'text-orange-600 dark:text-orange-400',  bg: 'bg-orange-50 dark:bg-orange-500/10' },
            { label: 'Reserved',  count: stats.reserved,  color: 'text-purple-600 dark:text-purple-400',  bg: 'bg-purple-50 dark:bg-purple-500/10' },
            { label: 'Cleaning',  count: stats.cleaning,  color: 'text-yellow-600 dark:text-yellow-400',  bg: 'bg-yellow-50 dark:bg-yellow-500/10' },
          ].map(s => (
            <div key={s.label} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${s.bg}`}>
              <span className={`text-lg font-black tabular-nums ${s.color}`}>{s.count}</span>
              <span className="text-[10px] text-gray-500 dark:text-white/40">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Floor filter */}
        {floors.length > 2 && (
          <div className="px-5 py-2 bg-white dark:bg-transparent flex gap-2 border-b border-gray-100 dark:border-white/6 overflow-x-auto scrollbar-none">
            {floors.map(floor => (
              <button key={floor} onClick={() => setFloorFilter(floor)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  floorFilter === floor ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-white/6 text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {floor}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-gray-300 dark:text-white/30"><Loader2 size={22} className="animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-300 dark:text-white/20 gap-2">
              <UtensilsCrossed size={28} /><p className="text-xs">No tables configured</p>
              <p className="text-[11px] text-gray-300 dark:text-white/15">Add tables in VIP Setup</p>
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              <AnimatePresence>
                {filtered.map(table => (
                  <TableCard
                    key={table._id}
                    table={table}
                    occupancyData={occupancyData}
                    onClick={setSelectedTable}
                    isSelected={selectedTable?._id === table._id}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedTable && (
          <TableDrawer
            table={selectedTable}
            occupancyData={occupancyData}
            onClose={() => setSelectedTable(null)}
            onUpdateStatus={(id, status) => updateTableStatus({ id, status })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
