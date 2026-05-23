import { useQuery } from '@tanstack/react-query';
import {
  Activity, Database, Cpu, MemoryStick, Clock, Server,
  CheckCircle2, XCircle, AlertTriangle, RefreshCw, Zap,
  HardDrive, Wifi, Globe,
} from 'lucide-react';
import api from '../../services/api';

const fetchHealth = () => api.get('/owner/health').then(r => r.data);

function StatusDot({ status }) {
  const map = {
    up:      'bg-emerald-500 shadow-emerald-500/50',
    down:    'bg-red-500 shadow-red-500/50',
    healthy: 'bg-emerald-500 shadow-emerald-500/50',
    degraded:'bg-amber-500 shadow-amber-500/50',
  };
  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full shadow-lg animate-pulse ${map[status] ?? 'bg-gray-400'}`} />
  );
}

function StatusBadge({ status }) {
  const map = {
    up:       { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'Operational' },
    down:     { cls: 'bg-red-500/10 text-red-400 border-red-500/20',             label: 'Down'        },
    healthy:  { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'Healthy'     },
    degraded: { cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20',       label: 'Degraded'   },
  };
  const { cls, label } = map[status] ?? { cls: 'bg-gray-500/10 text-gray-400 border-gray-500/20', label: 'Unknown' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${cls}`}>
      <StatusDot status={status} />
      {label}
    </span>
  );
}

function MetricCard({ icon: Icon, label, value, sub, color = 'orange', extra }) {
  const colorMap = {
    orange:  { bg: 'from-orange-500/10 to-amber-500/5',  icon: 'bg-orange-500/15 text-orange-400',   border: 'border-orange-500/10' },
    blue:    { bg: 'from-blue-500/10 to-indigo-500/5',   icon: 'bg-blue-500/15 text-blue-400',       border: 'border-blue-500/10'   },
    emerald: { bg: 'from-emerald-500/10 to-teal-500/5',  icon: 'bg-emerald-500/15 text-emerald-400', border: 'border-emerald-500/10'},
    purple:  { bg: 'from-purple-500/10 to-violet-500/5', icon: 'bg-purple-500/15 text-purple-400',   border: 'border-purple-500/10' },
    red:     { bg: 'from-red-500/10 to-rose-500/5',      icon: 'bg-red-500/15 text-red-400',         border: 'border-red-500/10'    },
  };
  const c = colorMap[color];
  return (
    <div className={`relative bg-gradient-to-br ${c.bg} border ${c.border} rounded-2xl p-5 overflow-hidden group hover:scale-[1.01] transition-transform duration-200`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.icon}`}>
          <Icon size={18} />
        </div>
        {extra}
      </div>
      <p className="text-2xl font-bold text-white mb-0.5">{value}</p>
      <p className="text-xs font-semibold text-gray-400">{label}</p>
      {sub && <p className="text-[11px] text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function ProgressBar({ value, color = 'orange' }) {
  const colorMap = {
    orange:  'bg-gradient-to-r from-orange-500 to-amber-400',
    emerald: 'bg-gradient-to-r from-emerald-500 to-teal-400',
    blue:    'bg-gradient-to-r from-blue-500 to-indigo-400',
    red:     'bg-gradient-to-r from-red-500 to-rose-400',
    amber:   'bg-gradient-to-r from-amber-500 to-yellow-400',
  };
  const bar = colorMap[color] ?? colorMap.orange;
  const danger = value > 85 ? 'red' : value > 65 ? 'amber' : color;
  const barColor = colorMap[danger];
  return (
    <div className="w-full h-2 bg-white/8 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${barColor}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

function ServiceRow({ icon: Icon, name, status, latency, extra }) {
  const isUp = status === 'up' || status === 'healthy';
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/3 border border-white/6 hover:bg-white/5 transition-colors">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isUp ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
        <Icon size={18} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-white">{name}</p>
        {extra && <p className="text-xs text-gray-400 mt-0.5">{extra}</p>}
      </div>
      <div className="text-right">
        <StatusBadge status={status} />
        {latency != null && (
          <p className="text-[11px] text-gray-500 mt-1">{latency}ms latency</p>
        )}
      </div>
    </div>
  );
}

export default function Health() {
  const { data, isLoading, isError, refetch, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    refetchInterval: 30_000,
    retry: 1,
  });

  const h = data;
  const lastRefreshed = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : '—';

  return (
    <div className="flex min-h-[calc(100vh-56px)] items-start justify-center p-4 sm:p-6 pt-8 bg-gradient-to-br from-transparent via-transparent to-blue-950/10">
      <div className="w-full max-w-4xl space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Activity size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">System Health</h1>
                <p className="text-xs text-gray-400">Real-time infrastructure monitoring</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-gray-500">Last: {lastRefreshed}</span>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-gray-300 hover:bg-white/8 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-white/3 border border-white/6 animate-pulse" />
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="flex items-center gap-4 p-5 rounded-2xl bg-red-500/10 border border-red-500/20">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <XCircle size={20} className="text-red-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-red-400">Health check failed</p>
              <p className="text-xs text-red-400/70 mt-0.5">Could not reach the server health endpoint.</p>
            </div>
          </div>
        )}

        {h && (
          <>
            {/* Overall status banner */}
            <div className={`relative overflow-hidden rounded-2xl border p-5 ${h.status === 'healthy' ? 'bg-emerald-500/8 border-emerald-500/20' : 'bg-amber-500/8 border-amber-500/20'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${h.status === 'healthy' ? 'bg-emerald-500 shadow-emerald-500/40' : 'bg-amber-500 shadow-amber-500/40'}`}>
                    {h.status === 'healthy'
                      ? <CheckCircle2 size={24} className="text-white" />
                      : <AlertTriangle size={24} className="text-white" />}
                  </div>
                  <div>
                    <p className={`text-lg font-bold ${h.status === 'healthy' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      All Systems {h.status === 'healthy' ? 'Operational' : 'Degraded'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      API responded in {h.responseTime}ms · {new Date(h.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <StatusBadge status={h.status} />
              </div>
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <MetricCard
                icon={Clock}
                label="Uptime"
                value={h.system.uptime.human}
                sub="Since last restart"
                color="blue"
              />
              <MetricCard
                icon={Zap}
                label="API Latency"
                value={`${h.responseTime}ms`}
                sub="Response time"
                color="orange"
              />
              <MetricCard
                icon={Database}
                label="DB Latency"
                value={h.services.database.status === 'up' ? `${h.services.database.latency}ms` : '—'}
                sub={h.services.database.name}
                color={h.services.database.status === 'up' ? 'emerald' : 'red'}
              />
              <MetricCard
                icon={Cpu}
                label="Load Avg"
                value={h.system.loadAvg[0]}
                sub={`${h.system.cpuCount} CPU cores`}
                color="purple"
              />
            </div>

            {/* Memory & Heap */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white/3 border border-white/6 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <MemoryStick size={16} className="text-blue-400" />
                  <p className="text-sm font-bold text-white">System Memory</p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Used</span>
                    <span className="text-xs font-bold text-white">
                      {h.system.memory.used} MB / {h.system.memory.total} MB
                    </span>
                  </div>
                  <ProgressBar value={h.system.memory.percentage} />
                  <div className="flex justify-between text-[11px] text-gray-500">
                    <span>{h.system.memory.percentage}% used</span>
                    <span>{h.system.memory.free} MB free</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/3 border border-white/6 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <HardDrive size={16} className="text-purple-400" />
                  <p className="text-sm font-bold text-white">Node.js Heap</p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Heap Used</span>
                    <span className="text-xs font-bold text-white">
                      {h.system.heap.used} MB / {h.system.heap.total} MB
                    </span>
                  </div>
                  <ProgressBar
                    value={Math.round((h.system.heap.used / h.system.heap.total) * 100)}
                    color="purple"
                  />
                  <div className="flex justify-between text-[11px] text-gray-500">
                    <span>{Math.round((h.system.heap.used / h.system.heap.total) * 100)}% heap used</span>
                    <span>Node {h.system.nodeVersion}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Services */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Services</p>
              <div className="space-y-2">
                <ServiceRow
                  icon={Database}
                  name="MongoDB Database"
                  status={h.services.database.status}
                  latency={h.services.database.latency}
                  extra={`Database: ${h.services.database.name}`}
                />
                <ServiceRow
                  icon={Server}
                  name="REST API"
                  status={h.services.api.status}
                  latency={h.services.api.latency}
                  extra={`Node.js ${h.system.nodeVersion} · ${h.environment}`}
                />
                <ServiceRow
                  icon={Wifi}
                  name="WebSocket / Socket.IO"
                  status="up"
                  extra="Real-time event bus"
                />
                <ServiceRow
                  icon={Globe}
                  name="Client Application"
                  status="up"
                  extra="React SPA"
                />
              </div>
            </div>

            {/* System info footer */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Platform',     value: h.system.platform },
                { label: 'Node.js',      value: h.system.nodeVersion },
                { label: 'Environment',  value: h.environment },
                { label: 'CPU Cores',    value: h.system.cpuCount },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/3 border border-white/6 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">{label}</p>
                  <p className="text-sm font-bold text-white mt-1">{String(value)}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
