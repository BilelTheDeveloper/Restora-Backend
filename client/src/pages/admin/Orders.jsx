import { useState } from 'react';
import { Plus, ClipboardList, Clock, CheckCircle2, Truck } from 'lucide-react';

const ORDERS = [
  { id: '#0042', type: 'Dine-in',  table: 'T-5', customer: null,      items: ['Couscous Royal', 'Fresh Juice ×2', 'Baklava'],      status: 'serving',   total: 87.5,  time: '14:32' },
  { id: '#0041', type: 'Takeaway', table: null,  customer: 'Anis B.', items: ['Grilled Fish', 'Crème Brûlée'],                     status: 'ready',     total: 34.0,  time: '14:28' },
  { id: '#0040', type: 'Delivery', table: null,  customer: 'Sana M.', items: ['Pasta Arrabiata ×2', 'Baklava', 'Soft Drink'],      status: 'preparing', total: 112.0, time: '14:22' },
  { id: '#0039', type: 'Dine-in',  table: 'T-3', customer: null,      items: ['Lamb Tagine', 'Soup Harissa', 'Café Turc'],         status: 'paid',      total: 65.5,  time: '14:08' },
  { id: '#0038', type: 'Takeaway', table: null,  customer: 'Rami K.', items: ['Brick au Thon'],                                    status: 'paid',      total: 18.0,  time: '13:59' },
  { id: '#0037', type: 'Dine-in',  table: 'T-2', customer: null,      items: ['Salade Mechouia', 'Café Turc ×2'],                  status: 'paid',      total: 22.0,  time: '13:45' },
  { id: '#0036', type: 'Delivery', table: null,  customer: 'Leila H.',items: ['Lamb Tagine', 'Fresh Juice'],                       status: 'paid',      total: 33.5,  time: '13:30' },
];

const STATUS_MAP = {
  serving:   { label: 'Serving',   dot: 'bg-blue-500',    pill: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' },
  ready:     { label: 'Ready',     dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' },
  preparing: { label: 'Preparing', dot: 'bg-orange-500',  pill: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400' },
  paid:      { label: 'Paid',      dot: 'bg-gray-300',    pill: 'bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-gray-500' },
};

const TYPE_COLOR = {
  'Dine-in':  'text-orange-500 bg-orange-50 dark:bg-orange-500/10',
  'Takeaway': 'text-blue-500   bg-blue-50   dark:bg-blue-500/10',
  'Delivery': 'text-purple-500 bg-purple-50 dark:bg-purple-500/10',
};

const TABS = ['All', 'Dine-in', 'Takeaway', 'Delivery'];

const STATS = [
  { label: 'Active',    value: '3', icon: ClipboardList, color: 'text-orange-500',  bg: 'bg-orange-50 dark:bg-orange-500/10' },
  { label: 'Preparing', value: '1', icon: Clock,         color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-500/10' },
  { label: 'Ready',     value: '1', icon: CheckCircle2,  color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  { label: 'Deliveries',value: '1', icon: Truck,         color: 'text-purple-500',  bg: 'bg-purple-50 dark:bg-purple-500/10' },
];

export default function Orders() {
  const [tab, setTab] = useState('All');

  const filtered = tab === 'All' ? ORDERS : ORDERS.filter(o => o.type === tab);

  return (
    <div className="p-5 sm:p-6 space-y-6 max-w-[1440px]">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Orders</h1>
          <p className="text-xs text-gray-400 mt-0.5">Today's order management</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm shadow-orange-500/20">
          <Plus size={14} /> New Order
        </button>
      </div>

      {/* Stat chips */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STATS.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/6 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon size={16} className={color} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">{value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Orders card */}
      <div className="bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/6 rounded-2xl shadow-sm overflow-hidden">

        {/* Tabs */}
        <div className="flex items-center gap-0 px-5 pt-4 border-b border-gray-100 dark:border-white/6">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={[
                'px-4 py-2.5 text-xs font-semibold border-b-2 transition-all',
                tab === t
                  ? 'text-orange-500 border-orange-500'
                  : 'text-gray-400 border-transparent hover:text-gray-600 dark:hover:text-gray-300',
              ].join(' ')}
            >
              {t}
              {t !== 'All' && (
                <span className="ml-1.5 text-[9px] font-bold bg-gray-100 dark:bg-white/8 text-gray-400 px-1.5 py-0.5 rounded-full">
                  {ORDERS.filter(o => o.type === t).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Column headers */}
        <div className="hidden md:grid grid-cols-[60px_1fr_90px_96px_96px_52px] gap-3 px-5 py-2.5 border-b border-gray-50 dark:border-white/4">
          {['Order', 'Items', 'Type', 'Status', 'Total', 'Time'].map(h => (
            <span key={h} className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{h}</span>
          ))}
        </div>

        <div className="divide-y divide-gray-50 dark:divide-white/4">
          {filtered.map(order => {
            const s = STATUS_MAP[order.status];
            return (
              <div
                key={order.id}
                className="grid md:grid-cols-[60px_1fr_90px_96px_96px_52px] gap-3 items-center px-5 py-3.5 hover:bg-gray-50/60 dark:hover:bg-white/2 transition-colors"
              >
                <span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-300">{order.id}</span>

                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                    {order.items.slice(0, 2).join(', ')}
                    {order.items.length > 2 && (
                      <span className="text-gray-400"> +{order.items.length - 2}</span>
                    )}
                  </p>
                  {(order.table || order.customer) && (
                    <p className="text-[10px] text-gray-400 mt-0.5">{order.table ?? order.customer}</p>
                  )}
                </div>

                <div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TYPE_COLOR[order.type]}`}>
                    {order.type}
                  </span>
                </div>

                <div>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.pill}`}>
                    <span className={`w-1 h-1 rounded-full ${s.dot} shrink-0`} />
                    {s.label}
                  </span>
                </div>

                <span className="text-xs font-bold text-gray-900 dark:text-white">
                  {order.total.toFixed(1)}
                  <span className="text-gray-400 font-normal text-[10px] ml-0.5">TND</span>
                </span>

                <span className="text-[10px] text-gray-400">{order.time}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
