import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { ChefHat, Clock, CheckCircle2, ArrowRight, Bell, Loader2, RefreshCw, Filter } from 'lucide-react';
import { orderService } from '../../services/orderService';
import { useAuthStore } from '../../store/authStore';
import { useSocket } from '../../hooks/useSocket';

const COLUMNS = [
  { key: 'pending',   label: 'New Tickets',  accent: '#f59e0b', bg: 'bg-amber-500/10',   border: 'border-amber-500/25' },
  { key: 'preparing', label: 'In Progress',  accent: '#f97316', bg: 'bg-orange-500/10',  border: 'border-orange-500/25' },
  { key: 'ready',     label: 'Ready to Serve',accent: '#10b981',bg: 'bg-emerald-500/10', border: 'border-emerald-500/25' },
];

const TYPE_COLORS = {
  'dine-in':  'text-orange-400 bg-orange-500/10',
  'takeaway': 'text-blue-400   bg-blue-500/10',
  'delivery': 'text-purple-400 bg-purple-500/10',
  'qr':       'text-teal-400   bg-teal-500/10',
};

function TicketTimer({ createdAt }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = new Date(createdAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [createdAt]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const isHot  = mins >= 15;
  const isCrit = mins >= 25;

  return (
    <span className={`text-xs font-mono font-bold tabular-nums flex items-center gap-1 ${
      isCrit ? 'text-red-400 animate-pulse' : isHot ? 'text-amber-400' : 'text-gray-400 dark:text-white/40'
    }`}>
      <Clock size={10} />
      {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </span>
  );
}

function KitchenTicket({ order, onAdvance }) {
  const items = order.items || [];
  const typeStyle = TYPE_COLORS[order.type] || TYPE_COLORS['dine-in'];
  const isNew = order.status === 'pending';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-white dark:bg-[#141414] border rounded-2xl overflow-hidden ${
        isNew ? 'border-amber-500/30 shadow-amber-500/10 shadow-lg' : 'border-gray-100 dark:border-white/8'
      }`}
    >
      {/* Ticket header */}
      <div className={`flex items-center justify-between px-3 py-2 ${isNew ? 'bg-amber-500/10' : 'bg-gray-50 dark:bg-white/3'}`}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-gray-900 dark:text-white">{order.orderNumber}</span>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md capitalize ${typeStyle}`}>
            {order.type}
          </span>
          {order.table?.number && (
            <span className="text-[10px] text-gray-400 dark:text-white/40">T-{order.table.number}</span>
          )}
        </div>
        <TicketTimer createdAt={order.createdAt} />
      </div>

      {/* Items */}
      <div className="px-3 py-3 space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-md bg-gray-100 dark:bg-white/8 text-[10px] font-bold text-gray-700 dark:text-white flex items-center justify-center shrink-0 mt-0.5">
              {item.quantity}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight">{item.name}</p>
              {item.notes && <p className="text-[10px] text-amber-400 mt-0.5">⚠ {item.notes}</p>}
            </div>
          </div>
        ))}
        {order.notes && (
          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-white/6">
            <p className="text-[10px] text-gray-400 dark:text-white/50 italic">{order.notes}</p>
          </div>
        )}
      </div>

      {/* Action */}
      {order.status !== 'ready' && order.status !== 'served' && order.status !== 'completed' && (
        <div className="px-3 pb-3">
          <button onClick={() => onAdvance(order._id, order.status)}
            className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              order.status === 'pending'
                ? 'bg-orange-500/20 hover:bg-orange-500/40 text-orange-400 border border-orange-500/25'
                : 'bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 border border-emerald-500/25'
            }`}
          >
            <ArrowRight size={11} />
            {order.status === 'pending' ? 'Start Preparing' : 'Mark Ready'}
          </button>
        </div>
      )}
    </motion.div>
  );
}

export default function Kitchen() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [newAlert, setNewAlert] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['kitchen-orders'],
    queryFn: () => orderService.list({ status: 'pending,confirmed,preparing,ready', limit: 100 }).then(r => r.data),
    refetchInterval: 15_000,
  });

  const orders = data?.data || [];

  useSocket(user?.restaurant, {
    'order:new': (order) => {
      qc.invalidateQueries(['kitchen-orders']);
      setNewAlert(true);
      setTimeout(() => setNewAlert(false), 3000);
      toast.success(`New ticket: ${order.orderNumber}`, { icon: '🔔', duration: 5000 });
    },
    'order:status_changed': () => qc.invalidateQueries(['kitchen-orders']),
  });

  const NEXT = { pending: 'confirmed', confirmed: 'preparing', preparing: 'ready' };

  const { mutate: advance } = useMutation({
    mutationFn: ({ id, currentStatus }) => orderService.updateStatus(id, NEXT[currentStatus] || 'ready'),
    onSuccess: () => qc.invalidateQueries(['kitchen-orders']),
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const columns = COLUMNS.map(col => ({
    ...col,
    orders: orders.filter(o => {
      if (col.key === 'pending') return ['pending', 'confirmed'].includes(o.status);
      return o.status === col.key;
    }),
  }));

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50 dark:bg-[#0a0a0a] overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 bg-white dark:bg-[#0a0a0a] border-b border-gray-100 dark:border-white/6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ChefHat size={18} className="text-orange-400" />
          <div>
            <h1 className="text-sm font-bold text-gray-900 dark:text-white">Kitchen Display</h1>
            <p className="text-xs text-gray-400 dark:text-white/30">Live ticket board</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AnimatePresence>
            {newAlert && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 rounded-xl"
              >
                <Bell size={12} className="text-amber-400 animate-bounce" />
                <span className="text-xs font-bold text-amber-400">New Ticket!</span>
              </motion.div>
            )}
          </AnimatePresence>
          <span className="text-xs text-gray-400 dark:text-white/30">
            {orders.filter(o => ['pending','confirmed','preparing'].includes(o.status)).length} active
          </span>
          <button onClick={() => refetch()} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/6 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/12 text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white transition-all">
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Kanban */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-gray-300 dark:text-white/30"><Loader2 size={24} className="animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-3 h-full divide-x divide-gray-100 dark:divide-white/6">
            {columns.map(col => (
              <div key={col.key} className="flex flex-col overflow-hidden">
                {/* Column header */}
                <div className={`px-4 py-3 border-b border-gray-100 dark:border-white/6 flex items-center justify-between ${col.bg}`}>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">{col.label}</span>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ background: col.accent + '33', color: col.accent }}>
                    {col.orders.length}
                  </span>
                </div>

                {/* Tickets */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  <AnimatePresence>
                    {col.orders.length === 0 ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }}
                        className="flex flex-col items-center justify-center h-24 text-gray-300 dark:text-white/20 gap-1"
                      >
                        <CheckCircle2 size={20} />
                        <p className="text-[10px]">No tickets</p>
                      </motion.div>
                    ) : (
                      col.orders.map(order => (
                        <KitchenTicket
                          key={order._id}
                          order={order}
                          onAdvance={(id, status) => advance({ id, currentStatus: status })}
                        />
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
