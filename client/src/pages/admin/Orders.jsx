import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ClipboardList, CheckCircle2, Truck, UtensilsCrossed, X,
  CreditCard, Search, RefreshCw, Loader2, ShoppingCart, ArrowRight,
} from 'lucide-react';
import { orderService } from '../../services/orderService';
import { useAuthStore } from '../../store/authStore';
import { useSocket } from '../../hooks/useSocket';

const STATUS_MAP = {
  pending:   { label: 'Pending',   dot: 'bg-amber-500',   pill: 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/25' },
  confirmed: { label: 'Confirmed', dot: 'bg-blue-500',    pill: 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/25' },
  preparing: { label: 'Preparing', dot: 'bg-orange-500',  pill: 'bg-orange-50 dark:bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/25' },
  ready:     { label: 'Ready',     dot: 'bg-emerald-500', pill: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/25' },
  served:    { label: 'Served',    dot: 'bg-teal-500',    pill: 'bg-teal-50 dark:bg-teal-500/15 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-500/25' },
  completed: { label: 'Paid',      dot: 'bg-gray-400',    pill: 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/40 border-gray-200 dark:border-white/10' },
  cancelled: { label: 'Cancelled', dot: 'bg-red-500',     pill: 'bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/25' },
};

const TYPE_CONFIG = {
  'dine-in':  { label: 'Dine-in',  color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10', icon: UtensilsCrossed },
  'takeaway': { label: 'Takeaway', color: 'text-blue-600 dark:text-blue-400',     bg: 'bg-blue-50 dark:bg-blue-500/10',     icon: ShoppingCart },
  'delivery': { label: 'Delivery', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10', icon: Truck },
  'qr':       { label: 'QR Order', color: 'text-teal-600 dark:text-teal-400',     bg: 'bg-teal-50 dark:bg-teal-500/10',     icon: ClipboardList },
};

const NEXT_STATUS = {
  pending: 'confirmed', confirmed: 'preparing', preparing: 'ready',
  ready: 'served', served: 'completed',
};
const STATUS_TABS = ['all', 'pending', 'confirmed', 'preparing', 'ready', 'completed'];

function OrderDrawer({ order, onClose, onStatusUpdate, onPay }) {
  const [payModal, setPayModal] = useState(false);
  const [payMethod, setPayMethod] = useState('cash');
  if (!order) return null;
  const s = STATUS_MAP[order.status] || STATUS_MAP.pending;
  const typeConf = TYPE_CONFIG[order.type] || TYPE_CONFIG['dine-in'];
  const TypeIcon = typeConf.icon;
  const nextStatus = NEXT_STATUS[order.status];

  return (
    <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-[#0f0f0f] border-l border-gray-100 dark:border-white/8 z-40 flex flex-col ui-shadow-lg"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/6">
        <div>
          <p className="text-xs text-gray-400 dark:text-white/40 font-mono">{order.orderNumber}</p>
          <h2 className="text-base font-bold text-gray-900 dark:text-white mt-0.5">Order Details</h2>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/6 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/12 text-gray-500 dark:text-white/50 transition-all">
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${s.pill}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{s.label}
          </span>
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${typeConf.bg} ${typeConf.color}`}>
            <TypeIcon size={10} /> {typeConf.label}
          </span>
          {order.table && <span className="text-xs text-gray-400 dark:text-white/40">Table {order.table.number}</span>}
        </div>

        <div>
          <p className="text-[10px] font-bold text-gray-400 dark:text-white/40 uppercase tracking-wider mb-2">Items</p>
          <div className="bg-gray-50 dark:bg-white/4 rounded-xl divide-y divide-gray-100 dark:divide-white/5">
            {order.items?.map((item, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2.5">
                <div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">{item.name}</p>
                  {item.notes && <p className="text-[10px] text-gray-400 dark:text-white/40">{item.notes}</p>}
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-orange-500 dark:text-orange-400">×{item.quantity}</p>
                  <p className="text-[10px] text-gray-400 dark:text-white/40">{(item.price * item.quantity).toFixed(1)} TND</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-white/4 rounded-xl p-4 space-y-1.5">
          <div className="flex justify-between text-xs text-gray-500 dark:text-white/50"><span>Subtotal</span><span>{order.subtotal?.toFixed(2)} TND</span></div>
          {order.taxAmount > 0 && <div className="flex justify-between text-xs text-gray-500 dark:text-white/50"><span>Tax</span><span>{order.taxAmount?.toFixed(2)} TND</span></div>}
          <div className="flex justify-between text-sm font-bold text-gray-900 dark:text-white pt-1.5 border-t border-gray-200 dark:border-white/8">
            <span>Total</span><span className="text-orange-500 dark:text-orange-400">{order.total?.toFixed(2)} TND</span>
          </div>
        </div>

        {(order.customerName || order.customerPhone) && (
          <div className="bg-gray-50 dark:bg-white/4 rounded-xl p-4">
            <p className="text-[10px] font-bold text-gray-400 dark:text-white/40 uppercase tracking-wider mb-1.5">Customer</p>
            {order.customerName && <p className="text-sm font-semibold text-gray-900 dark:text-white">{order.customerName}</p>}
            {order.customerPhone && <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">{order.customerPhone}</p>}
          </div>
        )}
      </div>

      <div className="px-5 py-4 border-t border-gray-100 dark:border-white/6 space-y-2">
        {nextStatus && (
          <button onClick={() => onStatusUpdate(order._id, nextStatus)}
            className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
            <ArrowRight size={14} /> Mark as {STATUS_MAP[nextStatus]?.label}
          </button>
        )}
        {order.paymentStatus !== 'paid' && (
          <AnimatePresence>
            {payModal ? (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                <div className="flex gap-2">
                  {['cash','card','online'].map(m => (
                    <button key={m} onClick={() => setPayMethod(m)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all capitalize ${
                        payMethod === m ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-200 dark:border-white/10 text-gray-400 dark:text-white/40 hover:bg-gray-50 dark:hover:bg-white/4'
                      }`}>{m}</button>
                  ))}
                </div>
                <button onClick={() => { onPay(order._id, payMethod); setPayModal(false); }}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                  <CreditCard size={14} /> Collect {payMethod.charAt(0).toUpperCase() + payMethod.slice(1)}
                </button>
              </motion.div>
            ) : (
              <button onClick={() => setPayModal(true)}
                className="w-full py-2.5 bg-gray-100 dark:bg-white/8 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-700 dark:text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
                <CreditCard size={14} /> Process Payment
              </button>
            )}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}

export default function Orders() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['orders', statusFilter],
    queryFn: () => orderService.list({ status: statusFilter, limit: 100 }).then(r => r.data),
    refetchInterval: 30_000,
  });
  const orders = data?.data || [];

  useSocket(user?.restaurant, {
    'order:new': (order) => {
      qc.invalidateQueries(['orders']);
      toast.success(`New order ${order.orderNumber}!`, { icon: '🔔', duration: 4000 });
    },
    'order:status_changed': () => qc.invalidateQueries(['orders']),
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }) => orderService.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries(['orders']); toast.success('Status updated'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const { mutate: processPayment } = useMutation({
    mutationFn: ({ id, method }) => orderService.processPayment(id, method),
    onSuccess: () => { qc.invalidateQueries(['orders']); setSelected(null); toast.success('Payment collected!'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const filtered = orders.filter(o => {
    if (!search) return true;
    return o.orderNumber?.includes(search) || o.customerName?.toLowerCase().includes(search.toLowerCase());
  });
  const selected_order = selected ? orders.find(o => o._id === selected) : null;

  const stats = {
    active:  orders.filter(o => ['pending','confirmed','preparing'].includes(o.status)).length,
    ready:   orders.filter(o => o.status === 'ready').length,
    paid:    orders.filter(o => o.paymentStatus === 'paid').length,
    revenue: orders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + (o.total || 0), 0),
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-gray-50 dark:bg-[#0a0a0a] transition-theme">
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-white/6 flex items-center justify-between gap-3 flex-wrap bg-white dark:bg-[#0a0a0a]">
          <div>
            <h1 className="text-base font-bold text-gray-900 dark:text-white">Orders</h1>
            <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">Today's live order board</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
                className="bg-gray-100 dark:bg-white/6 border border-gray-200 dark:border-white/8 rounded-xl pl-8 pr-3 py-1.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:border-orange-400 dark:focus:border-orange-500/50 w-44" />
            </div>
            <button onClick={() => refetch()} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/6 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/12 text-gray-400 dark:text-white/40 transition-all">
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="px-5 py-3 grid grid-cols-4 gap-3 border-b border-gray-100 dark:border-white/6 bg-white dark:bg-[#0a0a0a]">
          {[
            { label: 'Active',   value: stats.active,                    color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10' },
            { label: 'Ready',    value: stats.ready,                     color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
            { label: 'Paid',     value: stats.paid,                      color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
            { label: 'Revenue',  value: `${stats.revenue.toFixed(0)} TND`, color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl p-2.5 text-center`}>
              <p className={`text-base font-black tabular-nums ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-gray-500 dark:text-white/40 font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="px-5 flex gap-0 border-b border-gray-100 dark:border-white/6 overflow-x-auto scrollbar-none bg-white dark:bg-[#0a0a0a]">
          {STATUS_TABS.map(tab => (
            <button key={tab} onClick={() => setStatusFilter(tab)}
              className={`px-3 py-2.5 text-xs font-semibold border-b-2 transition-all shrink-0 capitalize ${
                statusFilter === tab ? 'text-orange-500 dark:text-orange-400 border-orange-500' : 'text-gray-400 dark:text-white/30 border-transparent hover:text-gray-600 dark:hover:text-white/60'
              }`}>
              {tab === 'all' ? 'All' : STATUS_MAP[tab]?.label || tab}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-gray-300 dark:text-white/30"><Loader2 size={22} className="animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-300 dark:text-white/20 gap-2">
              <ClipboardList size={28} /><p className="text-xs">No orders</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-white/4">
              <AnimatePresence>
                {filtered.map(order => {
                  const s = STATUS_MAP[order.status] || STATUS_MAP.pending;
                  const typeConf = TYPE_CONFIG[order.type] || TYPE_CONFIG['dine-in'];
                  const TypeIcon = typeConf.icon;
                  const nextStatus = NEXT_STATUS[order.status];
                  const isSelected = selected === order._id;

                  return (
                    <motion.div key={order._id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className={`flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-white/2 transition-colors cursor-pointer ${isSelected ? 'bg-orange-50 dark:bg-orange-500/5 border-r-2 border-orange-500' : ''}`}
                      onClick={() => setSelected(isSelected ? null : order._id)}
                    >
                      <div className={`w-1 h-8 rounded-full shrink-0 ${s.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-xs font-mono font-bold text-gray-900 dark:text-white">{order.orderNumber}</span>
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${typeConf.bg} ${typeConf.color}`}>
                            <TypeIcon size={9} /> {typeConf.label}
                          </span>
                          {order.table && <span className="text-[10px] text-gray-400 dark:text-white/30">T-{order.table.number}</span>}
                        </div>
                        <p className="text-xs text-gray-400 dark:text-white/40 truncate">
                          {order.items?.slice(0, 2).map(i => `${i.name} ×${i.quantity}`).join(', ')}
                          {order.items?.length > 2 ? ` +${order.items.length - 2} more` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${s.pill}`}>
                          <span className={`w-1 h-1 rounded-full ${s.dot}`} /> {s.label}
                        </span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white tabular-nums">{order.total?.toFixed(1)} <span className="text-gray-400 dark:text-white/30 font-normal text-[10px]">TND</span></span>
                        {nextStatus && (
                          <button onClick={e => { e.stopPropagation(); updateStatus({ id: order._id, status: nextStatus }); }}
                            className="px-2 py-1 bg-orange-50 dark:bg-orange-500/15 hover:bg-orange-100 dark:hover:bg-orange-500/30 text-orange-600 dark:text-orange-400 text-[10px] font-bold rounded-lg border border-orange-200 dark:border-orange-500/20 transition-all whitespace-nowrap">
                            → {STATUS_MAP[nextStatus]?.label}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selected_order && (
          <OrderDrawer
            order={selected_order}
            onClose={() => setSelected(null)}
            onStatusUpdate={(id, status) => updateStatus({ id, status })}
            onPay={(id, method) => processPayment({ id, method })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
