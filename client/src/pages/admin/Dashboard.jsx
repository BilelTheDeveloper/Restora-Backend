import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  TrendingUp, TrendingDown, ShoppingCart, Grid3X3,
  CalendarDays, ArrowRight, ChefHat, Monitor,
  ArrowUpRight, Flame, Users,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/ui';

// ─── Static mock data (replace with API calls when backend ready) ──────────
const REVENUE_TREND = [
  { day: 'Mon', v: 8200 },
  { day: 'Tue', v: 9100 },
  { day: 'Wed', v: 7400 },
  { day: 'Thu', v: 11200 },
  { day: 'Fri', v: 13800 },
  { day: 'Sat', v: 15600 },
  { day: 'Sun', v: 12840 },
];

const ORDER_TYPES = [
  { name: 'Dine-in',  value: 52, color: '#f97316' },
  { name: 'Takeaway', value: 31, color: '#3b82f6' },
  { name: 'Delivery', value: 17, color: '#8b5cf6' },
];

const RECENT_ORDERS = [
  { id: '#0042', items: 4, type: 'Dine-in',  table: 'T-5', status: 'serving',   total: 87.5,  ago: '2 min' },
  { id: '#0041', items: 2, type: 'Takeaway', table: null,  status: 'ready',     total: 34.0,  ago: '8 min' },
  { id: '#0040', items: 6, type: 'Delivery', table: null,  status: 'preparing', total: 112.0, ago: '15 min' },
  { id: '#0039', items: 3, type: 'Dine-in',  table: 'T-3', status: 'paid',      total: 65.5,  ago: '22 min' },
  { id: '#0038', items: 1, type: 'Takeaway', table: null,  status: 'paid',      total: 18.0,  ago: '31 min' },
];

const SPARKS = {
  revenue:      [8200, 9100, 7400, 11200, 13800, 15600, 12840].map(v => ({ v })),
  orders:       [31, 38, 29, 42, 51, 58, 47].map(v => ({ v })),
  tables:       [8, 10, 9, 12, 14, 15, 12].map(v => ({ v })),
  reservations: [5, 7, 4, 8, 9, 10, 8].map(v => ({ v })),
};

// ─── Helpers ───────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const STATUS_MAP = {
  serving:   { label: 'Serving',   dot: 'bg-blue-500',   pill: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' },
  ready:     { label: 'Ready',     dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' },
  preparing: { label: 'Preparing', dot: 'bg-orange-500',  pill: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400' },
  paid:      { label: 'Paid',      dot: 'bg-gray-300',    pill: 'bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-gray-500' },
};

const TYPE_MAP = {
  'Dine-in':  'text-orange-500',
  'Takeaway': 'text-blue-500',
  'Delivery': 'text-purple-500',
};

// ─── Sparkline ─────────────────────────────────────────────────────────────
function Sparkline({ data, color, uid }) {
  return (
    <ResponsiveContainer width="100%" height={44}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`sg-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={2}
          fill={`url(#sg-${uid})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── KPI Card ──────────────────────────────────────────────────────────────
function KpiCard({ label, value, suffix, trend, sub, icon: Icon, iconBg, iconColor, sparkData, sparkColor, sparkUid }) {
  const up = trend >= 0;
  return (
    <div className="bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/6 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-5 pt-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
            <Icon size={17} className={iconColor} />
          </div>
          <div className={[
            'flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full',
            up
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
              : 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400',
          ].join(' ')}>
            {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {up ? '+' : ''}{trend}%
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          {value}
          {suffix && <span className="text-sm font-medium text-gray-400 ml-1">{suffix}</span>}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
      </div>
      <div className="px-2 pb-1 mt-1">
        <Sparkline data={sparkData} color={sparkColor} uid={sparkUid} />
      </div>
    </div>
  );
}

// ─── Revenue chart tooltip ─────────────────────────────────────────────────
function RevenueTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 shadow-xl text-xs">
      <p className="text-gray-400 mb-0.5">{label}</p>
      <p className="font-bold text-gray-900 dark:text-white">
        {payload[0].value.toLocaleString()}
        <span className="font-normal text-gray-400 ml-1">TND</span>
      </p>
    </div>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(true);

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="p-5 sm:p-6 space-y-6 max-w-[1440px]">

      {/* ── Welcome ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium text-gray-400">{getGreeting()}</p>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
            {user?.name?.split(' ')[0] ?? 'Chef'} 👋
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">{dateStr}</p>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className={[
            'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all',
            open
              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
              : 'bg-gray-100 dark:bg-white/5 text-gray-500 border-gray-200 dark:border-white/10',
          ].join(' ')}
        >
          <span className={[
            'w-1.5 h-1.5 rounded-full',
            open ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400',
          ].join(' ')} />
          {open ? 'Restaurant Open' : 'Restaurant Closed'}
        </button>
      </div>

      {/* ── KPI Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Today's Revenue"
          value="12,840"
          suffix="TND"
          trend={12.5}
          sub="vs. yesterday"
          icon={TrendingUp}
          iconBg="bg-orange-50 dark:bg-orange-500/10"
          iconColor="text-orange-500"
          sparkData={SPARKS.revenue}
          sparkColor="#f97316"
          sparkUid="revenue"
        />
        <KpiCard
          label="Orders Today"
          value="47"
          trend={8.2}
          sub="vs. yesterday"
          icon={ShoppingCart}
          iconBg="bg-blue-50 dark:bg-blue-500/10"
          iconColor="text-blue-500"
          sparkData={SPARKS.orders}
          sparkColor="#3b82f6"
          sparkUid="orders"
        />
        <KpiCard
          label="Tables Active"
          value="12"
          suffix="/ 18"
          trend={5.0}
          sub="67% occupancy rate"
          icon={Grid3X3}
          iconBg="bg-purple-50 dark:bg-purple-500/10"
          iconColor="text-purple-500"
          sparkData={SPARKS.tables}
          sparkColor="#8b5cf6"
          sparkUid="tables"
        />
        <KpiCard
          label="Reservations"
          value="8"
          trend={-2.1}
          sub="today's bookings"
          icon={CalendarDays}
          iconBg="bg-teal-50 dark:bg-teal-500/10"
          iconColor="text-teal-500"
          sparkData={SPARKS.reservations}
          sparkColor="#14b8a6"
          sparkUid="reservations"
        />
      </div>

      {/* ── Charts row ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Revenue area chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/6 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Revenue Trend</p>
              <p className="text-xs text-gray-400 mt-0.5">Last 7 days · in TND</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full">
              <ArrowUpRight size={12} />
              +12.5% this week
            </div>
          </div>
          <div className="px-2 pb-4">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={REVENUE_TREND} margin={{ top: 5, right: 12, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#f97316" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.05} vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  dy={4}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                  width={32}
                />
                <Tooltip content={<RevenueTooltip />} cursor={{ stroke: '#f97316', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke="#f97316"
                  strokeWidth={2.5}
                  fill="url(#revGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders by type */}
        <div className="bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/6 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Orders by Type</p>
            <p className="text-xs text-gray-400 mt-0.5">Today's breakdown</p>
          </div>

          <div className="flex justify-center">
            <ResponsiveContainer width="100%" height={148}>
              <PieChart>
                <Pie
                  data={ORDER_TYPES}
                  cx="50%"
                  cy="50%"
                  innerRadius={44}
                  outerRadius={62}
                  paddingAngle={4}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  strokeWidth={0}
                >
                  {ORDER_TYPES.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="px-5 pb-5 space-y-2.5 mt-1">
            {ORDER_TYPES.map((t) => (
              <div key={t.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: t.color }} />
                  <span className="text-xs text-gray-500 dark:text-gray-400">{t.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1 bg-gray-100 dark:bg-white/8 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${t.value}%`, background: t.color }} />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-7 text-right">{t.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent Orders ────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/6 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100 dark:border-white/6">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Recent Orders</p>
            <p className="text-xs text-gray-400 mt-0.5">Last 5 orders today</p>
          </div>
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 font-medium transition-colors"
          >
            View all <ArrowRight size={12} />
          </Link>
        </div>

        {/* Table header */}
        <div className="hidden sm:grid grid-cols-[56px_1fr_100px_90px_96px_52px] gap-3 px-5 py-2 border-b border-gray-50 dark:border-white/4">
          {['Order', 'Details', 'Type', 'Status', 'Total', 'Time'].map(h => (
            <span key={h} className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{h}</span>
          ))}
        </div>

        <div className="divide-y divide-gray-50 dark:divide-white/4">
          {RECENT_ORDERS.map((order) => {
            const s = STATUS_MAP[order.status];
            return (
              <div
                key={order.id}
                className="grid grid-cols-[56px_1fr_100px_90px_96px_52px] gap-3 items-center px-5 py-3 hover:bg-gray-50/60 dark:hover:bg-white/2 transition-colors"
              >
                <span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-300 truncate">
                  {order.id}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                    {order.items} item{order.items > 1 ? 's' : ''}
                    {order.table && <span className="text-gray-400 font-normal"> · {order.table}</span>}
                  </p>
                </div>
                <span className={`text-xs font-medium ${TYPE_MAP[order.type] ?? 'text-gray-500'} truncate`}>
                  {order.type}
                </span>
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
                <span className="text-[10px] text-gray-400 text-right">{order.ago}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Quick Actions ────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Flame size={14} className="text-orange-500" />
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Quick Actions</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: 'Open POS',
              desc: 'Start taking orders',
              icon: Monitor,
              to: '/admin/pos',
              iconColor: 'text-orange-500',
              iconBg: 'bg-orange-50 dark:bg-orange-500/10',
            },
            {
              label: 'Kitchen View',
              desc: 'Check live prep queue',
              icon: ChefHat,
              to: '/admin/kitchen',
              iconColor: 'text-red-500',
              iconBg: 'bg-red-50 dark:bg-red-500/10',
            },
            {
              label: 'Reservations',
              desc: 'Book or manage tables',
              icon: CalendarDays,
              to: '/admin/reservations',
              iconColor: 'text-purple-500',
              iconBg: 'bg-purple-50 dark:bg-purple-500/10',
            },
            {
              label: 'Table Map',
              desc: 'View floor status',
              icon: Grid3X3,
              to: '/admin/tables',
              iconColor: 'text-blue-500',
              iconBg: 'bg-blue-50 dark:bg-blue-500/10',
            },
          ].map(({ label, desc, icon: Icon, to, iconColor, iconBg }) => (
            <Link
              key={to}
              to={to}
              className="group flex items-center gap-3 p-4 bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/6 rounded-2xl hover:border-gray-200 dark:hover:border-white/12 hover:shadow-sm transition-all duration-150"
            >
              <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center shrink-0 transition-transform group-hover:scale-105`}>
                <Icon size={16} className={iconColor} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 truncate">{desc}</p>
              </div>
              <ArrowRight
                size={13}
                className="text-gray-300 dark:text-gray-600 shrink-0 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all"
              />
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
