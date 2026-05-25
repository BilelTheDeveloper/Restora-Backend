import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  TrendingUp, ShoppingCart, Grid3X3, CalendarDays, ArrowRight,
  ChefHat, Zap, Bell, Brain, AlertTriangle, CheckCircle2,
  TrendingDown, Activity,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { analyticsService } from '../../services/analyticsService';
import { orderService } from '../../services/orderService';
import { alertService } from '../../services/alertService';
import { useSocket } from '../../hooks/useSocket';
import { useChartColors } from '../../hooks/useChartColors';

const ORDER_TYPE_COLORS = { 'dine-in': '#f97316', takeaway: '#3b82f6', delivery: '#8b5cf6', qr: '#14b8a6' };
const ALERT_COLORS = {
  info:     'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',
  warning:  'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
  critical: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20',
};
const ALERT_ICONS = { info: CheckCircle2, warning: AlertTriangle, critical: Zap };

function StatCard({ label, value, unit, trend, sub, icon: Icon, color = 'orange', live = false }) {
  const COLORS = {
    orange:  'text-orange-500 dark:text-orange-400  bg-orange-50  dark:bg-orange-500/10',
    blue:    'text-blue-500   dark:text-blue-400    bg-blue-50    dark:bg-blue-500/10',
    emerald: 'text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10',
    amber:   'text-amber-500  dark:text-amber-400   bg-amber-50   dark:bg-amber-500/10',
  };
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl p-4 relative overflow-hidden ui-shadow-sm transition-theme"
    >
      {live && (
        <span className="absolute top-3 right-3 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      )}
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${COLORS[color]}`}>
          <Icon size={14} />
        </div>
        <p className="text-[10px] font-bold text-gray-400 dark:text-white/40 uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-3xl font-black text-gray-900 dark:text-white tabular-nums leading-none">
        {value}<span className="text-base font-semibold text-gray-300 dark:text-white/30 ml-1">{unit}</span>
      </p>
      {(trend !== undefined || sub) && (
        <div className="flex items-center gap-1.5 mt-2">
          {trend !== undefined && (
            <span className={`text-xs font-bold flex items-center gap-0.5 ${trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {trend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {trend >= 0 ? '+' : ''}{trend}%
            </span>
          )}
          {sub && <span className="text-[10px] text-gray-400 dark:text-white/30">{sub}</span>}
        </div>
      )}
    </motion.div>
  );
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const chart = useChartColors();

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => analyticsService.getDashboard().then(r => r.data),
    refetchInterval: 30_000,
  });

  const { data: revenueChart = [] } = useQuery({
    queryKey: ['revenue-chart'],
    queryFn: () => analyticsService.getRevenue(14).then(r => r.data),
  });

  const { data: orderTypes = [] } = useQuery({
    queryKey: ['order-types'],
    queryFn: () => analyticsService.getOrderTypes(7).then(r => r.data),
  });

  const { data: activeOrders = [] } = useQuery({
    queryKey: ['active-orders'],
    queryFn: () => orderService.list({ status: 'pending,confirmed,preparing,ready', limit: 6 }).then(r => r.data?.data || []),
    refetchInterval: 20_000,
  });

  const { data: alertsData } = useQuery({
    queryKey: ['alerts-preview'],
    queryFn: () => alertService.list({ unread: 'true', limit: 4 }).then(r => r.data),
  });
  const alerts = alertsData?.alerts || [];

  useSocket(user?.restaurant, {
    'order:new':            () => { qc.invalidateQueries(['active-orders']); qc.invalidateQueries(['dashboard-stats']); },
    'order:status_changed': () =>   qc.invalidateQueries(['active-orders']),
    'alert:new':            () =>   qc.invalidateQueries(['alerts-preview']),
  });

  const today = stats?.today || {};
  const week  = stats?.week  || {};
  const chartData = revenueChart.map(d => ({ day: d.date.slice(5), revenue: d.revenue }));
  const pieData = orderTypes.map(o => ({ name: o._id, value: o.count, color: ORDER_TYPE_COLORS[o._id] || '#6b7280' }));

  const quickLinks = [
    { to: '/admin/pos',          label: 'Open POS',    icon: ShoppingCart, color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10 hover:bg-orange-100 dark:hover:bg-orange-500/20' },
    { to: '/admin/kitchen',      label: 'Kitchen',     icon: ChefHat,      color: 'text-amber-500 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20'   },
    { to: '/admin/tables',       label: 'Floor',       icon: Grid3X3,      color: 'text-blue-500 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20'       },
    { to: '/admin/reservations', label: 'Reservations',icon: CalendarDays, color: 'text-purple-500 dark:text-purple-400',bg: 'bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20' },
    { to: '/admin/analytics',    label: 'Analytics',   icon: TrendingUp,   color: 'text-emerald-500 dark:text-emerald-400',bg:'bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20' },
    { to: '/admin/copilot',      label: 'Copilot',     icon: Brain,        color: 'text-violet-500 dark:text-violet-400',bg: 'bg-violet-50 dark:bg-violet-500/10 hover:bg-violet-100 dark:hover:bg-violet-500/20' },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 ui-shadow">
        <p className="text-[10px] text-gray-400 dark:text-white/40 mb-1">{label}</p>
        <p className="text-sm font-bold text-orange-500 dark:text-orange-400">{payload[0]?.value?.toFixed(1)} TND</p>
      </div>
    );
  };

  return (
    <div className="p-5 sm:p-6 space-y-5 max-w-[1440px] bg-gray-50 dark:bg-[#0a0a0a] min-h-full transition-theme">

      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">{getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-xs text-gray-400 dark:text-white/30 mt-1">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <Link to="/admin/alerts" className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-white/6 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/8 rounded-xl transition-all text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white text-xs font-semibold">
          <Bell size={12} /> {alertsData?.unreadCount || 0} Alerts
        </Link>
      </div>

      {/* KPIs */}
      {loadingStats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-100 dark:bg-white/4 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Revenue Today"   value={today.revenue?.toFixed(0) || '0'} unit="TND" icon={TrendingUp}  color="orange"  live />
          <StatCard label="Orders Today"    value={today.orders || 0}                             icon={ShoppingCart} color="blue"    live />
          <StatCard label="Active Now"      value={today.activeOrders || 0}                       icon={Activity}     color="amber"   live />
          <StatCard label="Occupied Tables" value={today.activeTables || 0}                       icon={Grid3X3}      color="emerald" />
        </div>
      )}

      {/* Revenue chart + Quick links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl p-5 ui-shadow-sm transition-theme">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Revenue — Last 14 Days</h2>
              <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">This week: {week.revenue?.toFixed(0) || 0} TND · {week.orders || 0} orders</p>
            </div>
            <Link to="/admin/analytics" className="text-[10px] text-orange-500 dark:text-orange-400 hover:text-orange-600 flex items-center gap-1">
              Full analytics <ArrowRight size={10} />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: chart.axis, fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: chart.axis, fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} fill="url(#revGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl p-4 flex flex-col gap-2 ui-shadow-sm transition-theme">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Quick Access</h2>
          {quickLinks.map(({ to, label, icon: Icon, color, bg }) => (
            <Link key={to} to={to} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${bg}`}>
              <Icon size={14} className={color} />
              <span className="text-xs font-semibold text-gray-700 dark:text-white">{label}</span>
              <ArrowRight size={10} className="ml-auto text-gray-300 dark:text-white/20" />
            </Link>
          ))}
        </div>
      </div>

      {/* Active orders + Alerts + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <div className="lg:col-span-2 bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl overflow-hidden ui-shadow-sm transition-theme">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-white/6">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Active Orders</h2>
            <Link to="/admin/orders" className="text-[10px] text-orange-500 dark:text-orange-400 hover:text-orange-600 flex items-center gap-1">View all <ArrowRight size={10} /></Link>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-white/4">
            {activeOrders.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-300 dark:text-white/20 text-xs">No active orders</div>
            ) : activeOrders.map(order => {
              const STATUS_DOT = { pending: 'bg-amber-500', confirmed: 'bg-blue-500', preparing: 'bg-orange-500', ready: 'bg-emerald-500 animate-pulse' };
              return (
                <div key={order._id} className="flex items-center gap-3 px-5 py-3">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[order.status] || 'bg-gray-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono font-bold text-gray-900 dark:text-white">{order.orderNumber}</p>
                    <p className="text-[10px] text-gray-400 dark:text-white/40 truncate">{order.items?.slice(0,2).map(i => i.name).join(', ')}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-orange-500 dark:text-orange-400">{order.total?.toFixed(1)} TND</p>
                    <p className="text-[10px] text-gray-400 dark:text-white/30 capitalize">{order.status}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl overflow-hidden ui-shadow-sm transition-theme">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/6">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2"><Zap size={13} className="text-amber-500 dark:text-amber-400" /> Alerts</h2>
              <Link to="/admin/alerts" className="text-[10px] text-orange-500 dark:text-orange-400">View all</Link>
            </div>
            <div className="p-3 space-y-2">
              {alerts.length === 0 ? (
                <div className="text-center py-4 text-gray-300 dark:text-white/20 text-xs flex flex-col items-center gap-1">
                  <CheckCircle2 size={18} /><p>All clear</p>
                </div>
              ) : alerts.map(alert => {
                const Icon = ALERT_ICONS[alert.severity] || Zap;
                const style = ALERT_COLORS[alert.severity] || ALERT_COLORS.info;
                return (
                  <div key={alert._id} className={`flex gap-2 p-2.5 rounded-xl border ${style}`}>
                    <Icon size={12} className="shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold leading-tight">{alert.title}</p>
                      <p className="text-[10px] opacity-70 mt-0.5 line-clamp-1">{alert.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {pieData.length > 0 && (
            <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl p-4 ui-shadow-sm transition-theme">
              <h2 className="text-xs font-bold text-gray-900 dark:text-white mb-3">Orders by Type (7d)</h2>
              <div className="flex items-center gap-3">
                <PieChart width={70} height={70}>
                  <Pie data={pieData} cx={35} cy={35} innerRadius={22} outerRadius={33} dataKey="value" strokeWidth={0}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
                <div className="space-y-1.5 flex-1">
                  {pieData.map(d => (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                        <span className="text-[10px] text-gray-500 dark:text-white/50 capitalize">{d.name}</span>
                      </div>
                      <span className="text-[10px] font-bold text-gray-900 dark:text-white">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
