import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer,
  Cell, ReferenceLine, AreaChart, Area,
} from 'recharts';
import { TrendingUp, Star, Zap, HelpCircle, Trash2, Loader2, ArrowUpRight } from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';
import { useChartColors } from '../../hooks/useChartColors';

const DAYS_OPTIONS = [7, 14, 30, 90];

const QUADRANT = {
  star:      { label: 'Stars',       icon: Star,       color: '#f59e0b', bg: 'bg-amber-500/10',   border: 'border-amber-500/25',   badge: 'bg-amber-500/15 text-amber-400',   rec: 'Highlight on menu · Premium pricing' },
  workhorse: { label: 'Workhorses',  icon: Zap,        color: '#3b82f6', bg: 'bg-blue-500/10',    border: 'border-blue-500/25',    badge: 'bg-blue-500/15 text-blue-400',     rec: 'Optimize cost · Keep featuring'      },
  puzzle:    { label: 'Puzzles',     icon: HelpCircle, color: '#8b5cf6', bg: 'bg-purple-500/10',  border: 'border-purple-500/25',  badge: 'bg-purple-500/15 text-purple-400', rec: 'Reposition · Bundle with popular item' },
  dog:       { label: 'Dogs',        icon: Trash2,     color: '#6b7280', bg: 'bg-white/5',         border: 'border-white/8',        badge: 'bg-white/10 text-white/40',        rec: 'Consider removing · Raise price'     },
};

const QuadrantChip = ({ q }) => {
  const cfg = QUADRANT[q];
  if (!cfg) return null;
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>;
};

const MatrixTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs max-w-[200px] shadow-lg">
      <p className="font-bold text-gray-900 dark:text-white mb-1 truncate">{d.name}</p>
      <p className="text-gray-400 dark:text-white/50">Orders: <span className="text-gray-900 dark:text-white font-semibold">{d.count}</span></p>
      <p className="text-gray-400 dark:text-white/50">Revenue: <span className="text-orange-500 dark:text-orange-400 font-semibold">{Math.round(d.revenue)} TND</span></p>
      <QuadrantChip q={d.quadrant} />
    </div>
  );
};

export default function Revenue() {
  const [days, setDays] = useState(30);
  const chart = useChartColors();

  const { data: menuEng = [], isLoading } = useQuery({
    queryKey: ['menu-eng', days],
    queryFn: () => analyticsService.getMenuEngineering(days).then(r => r.data),
  });

  const { data: revenueChart = [] } = useQuery({
    queryKey: ['revenue-chart', days],
    queryFn: () => analyticsService.getRevenue(days).then(r => r.data),
  });

  const chartData = revenueChart.map(d => ({ day: d.date?.slice(5), revenue: d.revenue }));

  // Scatter data: x=count (popularity), y=revenue (profit proxy), z=revenue (bubble size)
  const scatterData = menuEng.map(d => ({
    name: d.name,
    x: d.count,
    y: Math.round(d.revenue),
    z: Math.max(50, Math.min(800, d.revenue * 2)),
    quadrant: d.quadrant,
    count: d.count,
    revenue: d.revenue,
  }));

  const avgCount   = menuEng.length ? menuEng.reduce((s, d) => s + d.count,   0) / menuEng.length : 0;
  const avgRevenue = menuEng.length ? menuEng.reduce((s, d) => s + d.revenue, 0) / menuEng.length : 0;

  const byQuadrant = {
    star:      menuEng.filter(d => d.quadrant === 'star'),
    workhorse: menuEng.filter(d => d.quadrant === 'workhorse'),
    puzzle:    menuEng.filter(d => d.quadrant === 'puzzle'),
    dog:       menuEng.filter(d => d.quadrant === 'dog'),
  };

  const totalRevenue = revenueChart.reduce((s, d) => s + d.revenue, 0);
  const totalOrders  = revenueChart.reduce((s, d) => s + d.orders,  0);

  return (
    <div className="p-5 sm:p-6 space-y-5 max-w-[1440px] bg-gray-50 dark:bg-[#0a0a0a] min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">Revenue Engine</h1>
          <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">Menu engineering & profit optimization</p>
        </div>
        <div className="flex gap-1.5">
          {DAYS_OPTIONS.map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                days === d ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-white/6 text-gray-500 dark:text-white/50 hover:bg-gray-200 dark:hover:bg-white/10'
              }`}
            >
              {d === 90 ? '3M' : `${d}D`}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Revenue',    value: `${Math.round(totalRevenue)} TND`,        color: 'text-orange-500 dark:text-orange-400',  bg: 'bg-orange-50 dark:bg-orange-500/10'  },
          { label: 'Orders',     value: totalOrders,                              color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-500/10'    },
          { label: 'Stars',      value: byQuadrant.star.length,                  color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-500/10'   },
          { label: 'Avg/Order',  value: totalOrders > 0 ? `${(totalRevenue/totalOrders).toFixed(1)} TND` : '—', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
        ].map(k => (
          <div key={k.label} className={`${k.bg} rounded-2xl p-4`}>
            <p className={`text-2xl font-black tabular-nums ${k.color}`}>{k.value}</p>
            <p className="text-[10px] font-semibold text-gray-400 dark:text-white/40 mt-1">{k.label} ({days}d)</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Matrix */}
        <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100 dark:border-white/6">
            <TrendingUp size={14} className="text-orange-400" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Menu Engineering Matrix</h2>
            <span className="text-xs text-gray-400 dark:text-white/30 ml-auto">x = Orders · y = Revenue</span>
          </div>
          <div className="p-5">
            {isLoading ? (
              <div className="h-72 flex items-center justify-center"><Loader2 size={22} className="animate-spin text-gray-300 dark:text-white/30" /></div>
            ) : scatterData.length === 0 ? (
              <div className="h-72 flex flex-col items-center justify-center text-gray-300 dark:text-white/20 gap-2">
                <TrendingUp size={28} /><p className="text-xs">No order data yet</p>
              </div>
            ) : (
              <>
                {/* Quadrant labels overlay */}
                <div className="relative">
                  <div className="absolute inset-0 pointer-events-none grid grid-cols-2 grid-rows-2 text-[10px] font-bold z-10" style={{ margin: '5px 10px 30px 40px' }}>
                    <div className="flex items-start justify-start pt-2 pl-2 text-purple-400/50">PUZZLES</div>
                    <div className="flex items-start justify-end pt-2 pr-2 text-amber-400/50">STARS</div>
                    <div className="flex items-end justify-start pb-2 pl-2 text-white/20">DOGS</div>
                    <div className="flex items-end justify-end pb-2 pr-2 text-blue-400/50">WORKHORSES</div>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <ScatterChart margin={{ top: 5, right: 10, bottom: 30, left: 40 }}>
                      <XAxis type="number" dataKey="x" name="Orders" tick={{ fill: chart.axis, fontSize: 9 }} axisLine={false} tickLine={false} label={{ value: 'Popularity (orders)', position: 'bottom', fill: chart.axis, fontSize: 9 }} />
                      <YAxis type="number" dataKey="y" name="Revenue" tick={{ fill: chart.axis, fontSize: 9 }} axisLine={false} tickLine={false} label={{ value: 'Revenue (TND)', angle: -90, position: 'left', fill: chart.axis, fontSize: 9 }} />
                      <ZAxis type="number" dataKey="z" range={[40, 400]} />
                      <ReferenceLine x={avgCount}   stroke={chart.grid} strokeDasharray="4 4" />
                      <ReferenceLine y={avgRevenue} stroke={chart.grid} strokeDasharray="4 4" />
                      <Tooltip content={<MatrixTooltip />} />
                      <Scatter data={scatterData}>
                        {scatterData.map((d, i) => (
                          <Cell key={i} fill={QUADRANT[d.quadrant]?.color || '#6b7280'} fillOpacity={0.85} />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="flex flex-wrap gap-3 mt-1">
                  {Object.entries(QUADRANT).map(([key, cfg]) => (
                    <div key={key} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.color }} />
                      <span className="text-[10px] text-gray-400 dark:text-white/40">{cfg.label}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Revenue trend */}
        <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100 dark:border-white/6">
            <ArrowUpRight size={14} className="text-orange-400" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Revenue Trend</h2>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData} margin={{ top: 5, right: 0, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fill: chart.axis, fontSize: 9 }} axisLine={false} tickLine={false} interval={Math.floor(chartData.length / 6)} />
                <YAxis tick={{ fill: chart.axis, fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: chart.tooltip.bg, border: `1px solid ${chart.tooltip.border}`, borderRadius: 12, fontSize: 11 }} itemStyle={{ color: '#f97316' }} labelStyle={{ color: chart.tooltip.muted }} />
                <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} fill="url(#revGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quadrant cards */}
      {menuEng.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Object.entries(QUADRANT).map(([key, cfg]) => {
            const items = byQuadrant[key] || [];
            const Icon = cfg.icon;
            return (
              <div key={key} className={`${cfg.bg} border ${cfg.border} rounded-2xl overflow-hidden`}>
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-white/6">
                  <Icon size={13} style={{ color: cfg.color }} />
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white">{cfg.label}</h3>
                  <span className="ml-auto text-xs font-black tabular-nums" style={{ color: cfg.color }}>{items.length}</span>
                </div>
                <div className="p-4 space-y-2">
                  <p className="text-[10px] text-gray-400 dark:text-white/30 italic mb-3">{cfg.rec}</p>
                  {items.length === 0 ? (
                    <p className="text-[11px] text-gray-300 dark:text-white/20 text-center py-2">None in this period</p>
                  ) : (
                    items.slice(0, 5).map((item, i) => (
                      <div key={i} className="flex items-center justify-between gap-2">
                        <p className="text-xs text-gray-600 dark:text-white/70 truncate flex-1">{item.name}</p>
                        <p className="text-[10px] font-bold text-gray-400 dark:text-white/40 tabular-nums shrink-0">{item.count}×</p>
                      </div>
                    ))
                  )}
                  {items.length > 5 && (
                    <p className="text-[10px] text-gray-300 dark:text-white/20 text-center">+{items.length - 5} more</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
