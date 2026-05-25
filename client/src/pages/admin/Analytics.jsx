import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, ScatterChart, Scatter, ZAxis, Cell,
} from 'recharts';
import { TrendingUp, BarChart2, Grid3X3, Clock, Star, Loader2 } from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';
import { useChartColors } from '../../hooks/useChartColors';

const DAYS_OPTIONS = [7, 14, 30, 90];

const QUADRANT_COLORS = { star: '#f59e0b', workhorse: '#3b82f6', puzzle: '#8b5cf6', dog: '#6b7280' };
const QUADRANT_LABELS = { star: '⭐ Stars', workhorse: '💪 Workhorses', puzzle: '🧩 Puzzles', dog: '🐕 Dogs' };

const DOW_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100 dark:border-white/6">
        <Icon size={14} className="text-orange-400" />
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs shadow-lg">
      <p className="text-gray-400 dark:text-white/40 mb-1">{label}</p>
      {payload.map((p, i) => <p key={i} className="font-bold" style={{ color: p.color }}>{p.value?.toFixed?.(1) ?? p.value}</p>)}
    </div>
  );
};

export default function Analytics() {
  const [days, setDays] = useState(30);
  const chart = useChartColors();

  const { data: revenueChart = [], isLoading: loadingChart } = useQuery({
    queryKey: ['revenue-chart', days],
    queryFn: () => analyticsService.getRevenue(days).then(r => r.data),
  });

  const { data: topItems = [], isLoading: loadingItems } = useQuery({
    queryKey: ['top-items', days],
    queryFn: () => analyticsService.getTopItems(days).then(r => r.data),
  });

  const { data: heatmapData } = useQuery({
    queryKey: ['heatmap'],
    queryFn: () => analyticsService.getHeatmap().then(r => r.data),
  });

  const { data: menuEng = [] } = useQuery({
    queryKey: ['menu-eng', days],
    queryFn: () => analyticsService.getMenuEngineering(days).then(r => r.data),
  });

  const { data: tableOcc = [] } = useQuery({
    queryKey: ['table-occ', days],
    queryFn: () => analyticsService.getTableOccupancy(days).then(r => r.data),
  });

  const totalRevenue = revenueChart.reduce((s, d) => s + d.revenue, 0);
  const totalOrders  = revenueChart.reduce((s, d) => s + d.orders,  0);

  // Build heatmap cells
  const matrix = heatmapData?.matrix || [];
  const maxCount = Math.max(1, ...matrix.flatMap(row => row));

  const chartData = revenueChart.map(d => ({ day: d.date.slice(5), revenue: d.revenue, orders: d.orders }));
  const topItemsData = topItems.slice(0, 10).map(i => ({ name: i._id.length > 12 ? i._id.slice(0,12)+'…' : i._id, count: i.count, revenue: Math.round(i.revenue) }));

  return (
    <div className="p-5 sm:p-6 space-y-5 max-w-[1440px] bg-gray-50 dark:bg-[#0a0a0a] min-h-full">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">Real performance data for your restaurant</p>
        </div>
        <div className="flex gap-1.5">
          {DAYS_OPTIONS.map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${days === d ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-white/6 text-gray-500 dark:text-white/50 hover:bg-gray-200 dark:hover:bg-white/10'}`}
            >
              {d === 90 ? '3M' : `${d}D`}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Revenue', value: totalRevenue.toFixed(0), unit: 'TND', color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10' },
          { label: 'Total Orders',  value: totalOrders, unit: '', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
          { label: 'Avg/Order',     value: totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(1) : '0', unit: 'TND', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
          { label: 'Avg/Day',       value: days > 0 ? (totalRevenue / days).toFixed(0) : '0', unit: 'TND', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
            <p className={`text-2xl font-black tabular-nums ${s.color}`}>{s.value} <span className="text-sm font-normal text-gray-400 dark:text-white/30">{s.unit}</span></p>
            <p className="text-[10px] font-semibold text-gray-400 dark:text-white/40 mt-1">{s.label} ({days}d)</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <Section title="Revenue Trend" icon={TrendingUp}>
        {loadingChart ? <div className="h-48 flex items-center justify-center"><Loader2 size={22} className="animate-spin text-white/30" /></div> : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: chart.axis, fontSize: 9 }} axisLine={false} tickLine={false} interval={Math.floor(chartData.length / 7)} />
              <YAxis tick={{ fill: chart.axis, fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} fill="url(#aGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Items */}
        <Section title="Top Menu Items" icon={BarChart2}>
          {loadingItems ? <div className="h-48 flex items-center justify-center"><Loader2 size={22} className="animate-spin text-gray-300 dark:text-white/30" /></div> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topItemsData} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <XAxis type="number" tick={{ fill: chart.axis, fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: chart.axis, fontSize: 9 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#f97316" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Section>

        {/* Hourly Heatmap */}
        <Section title="Busiest Hours Heatmap" icon={Clock}>
          {!heatmapData ? <div className="h-48 flex items-center justify-center"><Loader2 size={22} className="animate-spin text-gray-300 dark:text-white/30" /></div> : (
            <div className="overflow-x-auto">
              <table className="text-[9px] w-full">
                <thead>
                  <tr>
                    <th className="text-gray-300 dark:text-white/30 pr-1 text-left w-6" />
                    {Array.from({ length: 24 }, (_, h) => (
                      <th key={h} className="text-gray-300 dark:text-white/20 w-4 text-center">{h === 0 ? '0' : h % 3 === 0 ? h : ''}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DOW_LABELS.map((day, di) => (
                    <tr key={day}>
                      <td className="text-gray-500 dark:text-white/40 pr-1 font-medium">{day}</td>
                      {(matrix[di] || Array(24).fill(0)).map((count, h) => {
                        const intensity = count / maxCount;
                        return (
                          <td key={h} className="p-0.5">
                            <div className="w-3.5 h-3.5 rounded-sm" style={{
                              background: intensity > 0 ? `rgba(249,115,22,${0.1 + intensity * 0.9})` : chart.grid,
                            }} title={`${day} ${h}:00 — ${count} orders`} />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-[9px] text-gray-400 dark:text-white/30">Less</span>
                {[0.1, 0.3, 0.5, 0.7, 0.9].map(v => (
                  <div key={v} className="w-3 h-3 rounded-sm" style={{ background: `rgba(249,115,22,${v})` }} />
                ))}
                <span className="text-[9px] text-gray-400 dark:text-white/30">More</span>
              </div>
            </div>
          )}
        </Section>
      </div>

      {/* Table Performance */}
      {tableOcc.length > 0 && (
        <Section title="Table Performance (Revenue)" icon={Grid3X3}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {tableOcc.slice(0, 8).map((t, i) => (
              <div key={t.tableId} className="bg-gray-50 dark:bg-white/4 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold text-gray-900 dark:text-white">{t.table?.number ? `T-${t.table.number}` : '—'}</p>
                  {i === 0 && <Star size={10} className="text-amber-400" />}
                </div>
                <p className="text-lg font-black text-orange-400 tabular-nums">{t.revenue?.toFixed(0)}<span className="text-[10px] font-normal text-gray-400 dark:text-white/30 ml-0.5">TND</span></p>
                <p className="text-[10px] text-gray-400 dark:text-white/30">{t.orderCount} covers</p>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
