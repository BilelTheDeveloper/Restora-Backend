import { useState } from 'react';
import { ChefHat, Clock, CheckCircle2, ArrowRight, Bell } from 'lucide-react';

const INITIAL_ORDERS = [
  {
    id: '#0042', type: 'Dine-in',  table: 'T-5', status: 'pending',
    items: ['Couscous Royal ×1', 'Lamb Tagine ×1', 'Soup Harissa ×2'],
    waitMin: 0,   priority: 'high',
  },
  {
    id: '#0041', type: 'Takeaway', table: null,  status: 'pending',
    items: ['Grilled Fish ×1', 'Salade Mechouia ×1'],
    waitMin: 3,   priority: 'normal',
  },
  {
    id: '#0040', type: 'Delivery', table: null,  status: 'preparing',
    items: ['Pasta Arrabiata ×2', 'Baklava ×1', 'Soft Drink ×2'],
    waitMin: 8,   priority: 'normal',
  },
  {
    id: '#0038', type: 'Dine-in',  table: 'T-3', status: 'preparing',
    items: ['Brick au Thon ×3', 'Café Turc ×2'],
    waitMin: 14,  priority: 'normal',
  },
  {
    id: '#0037', type: 'Takeaway', table: null,  status: 'ready',
    items: ['Crème Brûlée ×2', 'Fresh Juice ×1'],
    waitMin: 18,  priority: 'normal',
  },
  {
    id: '#0036', type: 'Dine-in',  table: 'T-2', status: 'ready',
    items: ['Couscous Royal ×2', 'Lamb Tagine ×1'],
    waitMin: 22,  priority: 'normal',
  },
];

const COLUMNS = [
  { key: 'pending',   label: 'New Orders',  badge: 'bg-orange-500', desc: 'Waiting to start' },
  { key: 'preparing', label: 'Preparing',   badge: 'bg-blue-500',   desc: 'In progress' },
  { key: 'ready',     label: 'Ready',       badge: 'bg-emerald-500',desc: 'Awaiting pickup' },
];

const TYPE_COLOR = {
  'Dine-in':  'text-orange-500  bg-orange-50  dark:bg-orange-500/10',
  'Takeaway': 'text-blue-500    bg-blue-50    dark:bg-blue-500/10',
  'Delivery': 'text-purple-500  bg-purple-50  dark:bg-purple-500/10',
};

export default function Kitchen() {
  const [orders, setOrders] = useState(INITIAL_ORDERS);

  const advance = (id) => {
    const next = { pending: 'preparing', preparing: 'ready' };
    setOrders(prev =>
      prev.map(o => o.id === id && next[o.status] ? { ...o, status: next[o.status] } : o),
    );
  };

  const dismiss = (id) =>
    setOrders(prev => prev.filter(o => o.id !== id));

  const col = (key) => orders.filter(o => o.status === key);

  return (
    <div className="p-5 sm:p-6 space-y-6 max-w-[1440px]">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-500/10 rounded-xl flex items-center justify-center">
            <ChefHat size={18} className="text-orange-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Kitchen Display</h1>
            <p className="text-xs text-gray-400 mt-0.5">Live order queue · {orders.length} active orders</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-500 font-semibold bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          Kitchen Online
        </div>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map(col_cfg => {
          const colOrders = col(col_cfg.key);
          return (
            <div key={col_cfg.key} className="space-y-3">

              {/* Column header */}
              <div className="flex items-center gap-2 px-1">
                <span className={`w-2 h-2 rounded-full ${col_cfg.badge}`} />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{col_cfg.label}</span>
                <span className={`ml-auto text-[10px] font-bold min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center ${col_cfg.badge} text-white`}>
                  {colOrders.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-3">
                {colOrders.length === 0 ? (
                  <div className="bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/6 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm">
                    <CheckCircle2 size={20} className="text-gray-200 dark:text-white/10 mb-2" />
                    <p className="text-xs text-gray-400">{col_cfg.desc}</p>
                  </div>
                ) : (
                  colOrders.map(order => (
                    <div
                      key={order.id}
                      className={[
                        'bg-white dark:bg-[#141414] border rounded-2xl shadow-sm overflow-hidden transition-all',
                        order.priority === 'high'
                          ? 'border-orange-200 dark:border-orange-500/25'
                          : 'border-gray-100 dark:border-white/6',
                      ].join(' ')}
                    >
                      {/* Card header */}
                      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-50 dark:border-white/4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-300">{order.id}</span>
                          {order.table && (
                            <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-white/8 px-1.5 py-0.5 rounded-md">
                              {order.table}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock size={11} className="text-gray-400" />
                          <span className={`text-[10px] font-semibold ${order.waitMin > 10 ? 'text-red-500' : 'text-gray-400'}`}>
                            {order.waitMin}m
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="px-4 py-3 space-y-1.5">
                        {order.items.map(item => (
                          <div key={item} className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full shrink-0 mt-0.5" />
                            <span className="text-xs text-gray-700 dark:text-gray-300">{item}</span>
                          </div>
                        ))}
                      </div>

                      {/* Footer */}
                      <div className="px-4 py-3 flex items-center justify-between border-t border-gray-50 dark:border-white/4">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TYPE_COLOR[order.type]}`}>
                          {order.type}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {col_cfg.key === 'ready' ? (
                            <button
                              onClick={() => dismiss(order.id)}
                              className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                            >
                              <Bell size={10} /> Done
                            </button>
                          ) : (
                            <button
                              onClick={() => advance(order.id)}
                              className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                            >
                              {col_cfg.key === 'pending' ? 'Start' : 'Ready'}
                              <ArrowRight size={10} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
