import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck, ShieldAlert, ShieldX, XCircle, AlertTriangle,
  LogIn, Key, Globe, Clock, RefreshCw, Monitor, Smartphone,
  Filter, CheckCircle2, Activity, Users, Lock,
} from 'lucide-react';
import { adminService } from '../../services/adminService';

const fetchSummary = () => adminService.getSecuritySummary().then(r => r.data);
const fetchLogs    = (params) => adminService.getSecurityLogs(params).then(r => r.data);

// ── Threat level badge ─────────────────────────────────────
function ThreatBadge({ level }) {
  const map = {
    low:      { cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25', dot: 'bg-emerald-500', label: 'Low Threat'      },
    medium:   { cls: 'bg-amber-500/15   text-amber-400   border-amber-500/25',   dot: 'bg-amber-500',   label: 'Medium Threat'    },
    high:     { cls: 'bg-orange-500/15  text-orange-400  border-orange-500/25',  dot: 'bg-orange-500',  label: 'High Threat'      },
    critical: { cls: 'bg-red-500/15     text-red-400     border-red-500/25',     dot: 'bg-red-500 animate-ping',    label: 'CRITICAL'  },
  };
  const m = map[level] ?? map.low;
  return (
    <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold border ${m.cls}`}>
      <span className={`w-2 h-2 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

const EVENT_META = {
  login_success:       { icon: LogIn,         label: 'Login Success',   color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  login_failed:        { icon: XCircle,        label: 'Failed Login',    color: 'text-red-400',     bg: 'bg-red-500/10'     },
  register:            { icon: CheckCircle2,   label: 'Registration',    color: 'text-blue-400',    bg: 'bg-blue-500/10'    },
  password_change:     { icon: Key,            label: 'Password Change', color: 'text-purple-400',  bg: 'bg-purple-500/10'  },
  kyc_submit:          { icon: ShieldCheck,    label: 'KYC Submit',      color: 'text-orange-400',  bg: 'bg-orange-500/10'  },
  kyc_approved:        { icon: ShieldCheck,    label: 'KYC Approved',    color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  kyc_rejected:        { icon: ShieldX,        label: 'KYC Rejected',    color: 'text-red-400',     bg: 'bg-red-500/10'     },
  rate_limit_hit:      { icon: AlertTriangle,  label: 'Rate Limited',    color: 'text-amber-400',   bg: 'bg-amber-500/10'   },
  unauthorized_access: { icon: Lock,           label: 'Unauthorized',    color: 'text-red-400',     bg: 'bg-red-500/10'     },
  token_invalid:       { icon: Key,            label: 'Bad Token',       color: 'text-red-400',     bg: 'bg-red-500/10'     },
  account_deactivated: { icon: ShieldX,        label: 'Acct Deactivated',color: 'text-red-400',     bg: 'bg-red-500/10'     },
  maintenance_on:      { icon: Activity,       label: 'Maintenance ON',  color: 'text-violet-400',  bg: 'bg-violet-500/10'  },
  maintenance_off:     { icon: Activity,       label: 'Maintenance OFF', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
};

const SEV_BADGE = {
  info:     'bg-gray-500/10 text-gray-400 border-gray-500/15',
  warning:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  alert:    'bg-red-500/10 text-red-400 border-red-500/20',
  critical: 'bg-red-700/15 text-red-300 border-red-700/30',
};

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  if (diff < 60000)    return 'just now';
  if (diff < 3600000)  return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function parseUA(ua = '') {
  if (!ua || ua === 'unknown') return Monitor;
  return /mobile|android|iphone|ipad/i.test(ua) ? Smartphone : Monitor;
}

function LogRow({ log }) {
  const meta = EVENT_META[log.event] ?? { icon: ShieldAlert, label: log.event, color: 'text-gray-400', bg: 'bg-gray-500/10' };
  const Icon  = meta.icon;
  const UAIcon = parseUA(log.userAgent);
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors border-b border-white/4 last:border-0 group">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${meta.bg}`}>
        <Icon size={14} className={meta.color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-white">{meta.label}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${SEV_BADGE[log.severity]}`}>{log.severity}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {log.userId && (
            <span className="text-[11px] text-violet-400 font-medium truncate">
              {log.userId?.email || log.email || '—'}
            </span>
          )}
          {!log.userId && log.email && (
            <span className="text-[11px] text-gray-400 truncate">{log.email}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right hidden sm:block">
          <div className="flex items-center gap-1 text-[11px] text-gray-500">
            <Globe size={10} />
            <span>{log.ip || '—'}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-gray-600 mt-0.5">
            <UAIcon size={10} />
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-gray-500 min-w-[60px] justify-end">
          <Clock size={10} />
          {timeAgo(log.createdAt)}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color, icon: Icon, pulse }) {
  const colors = {
    red:     { bg: 'from-red-500/10 to-rose-500/5',     border: 'border-red-500/15',     ico: 'bg-red-500/15 text-red-400'     },
    amber:   { bg: 'from-amber-500/10 to-yellow-500/5', border: 'border-amber-500/15',   ico: 'bg-amber-500/15 text-amber-400' },
    violet:  { bg: 'from-violet-500/10 to-purple-500/5',border: 'border-violet-500/15',  ico: 'bg-violet-500/15 text-violet-400'},
    emerald: { bg: 'from-emerald-500/10 to-teal-500/5', border: 'border-emerald-500/15', ico: 'bg-emerald-500/15 text-emerald-400'},
  };
  const c = colors[color] ?? colors.violet;
  return (
    <div className={`bg-gradient-to-br ${c.bg} border ${c.border} rounded-2xl p-5`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.ico}`}>
          <Icon size={18} />
        </div>
        {pulse && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />}
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-xs font-semibold text-gray-400 mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function SecurityCenter() {
  const [sevFilter, setSevFilter] = useState('');
  const [evtFilter, setEvtFilter] = useState('');

  const { data: summary, isLoading: sumLoading, refetch: refetchSum, isFetching } = useQuery({
    queryKey: ['platform-security-summary'],
    queryFn:  fetchSummary,
    refetchInterval: 30_000,
  });

  const { data: logs, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ['platform-security-logs', sevFilter, evtFilter],
    queryFn:  () => fetchLogs({ severity: sevFilter || undefined, event: evtFilter || undefined, limit: 200 }),
    refetchInterval: 30_000,
  });

  const refetch = () => { refetchSum(); refetchLogs(); };
  const s = summary;

  return (
    <div className="p-5 sm:p-7 space-y-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-xl shadow-red-500/30">
            <ShieldAlert size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Security Center</h1>
            <p className="text-xs text-gray-400 mt-0.5">Platform-wide threat monitoring & audit log</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {s && <ThreatBadge level={s.threatLevel} />}
          <button
            onClick={refetch}
            disabled={isFetching}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/8 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Loading skeletons */}
      {sumLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-gray-100 dark:bg-white/3 animate-pulse" />
          ))}
        </div>
      )}

      {s && (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              icon={XCircle} label="Failed Logins (1h)" color="red"
              value={s.failedLogins.lastHour}
              sub={`${s.failedLogins.last24h} in 24h`}
              pulse={s.failedLogins.lastHour >= 10}
            />
            <StatCard
              icon={AlertTriangle} label="Alerts (7 days)" color="amber"
              value={s.alerts7d}
              sub="Severity: alert or critical"
            />
            <StatCard
              icon={Globe} label="Suspicious IPs" color="violet"
              value={s.topSuspiciousIPs?.length ?? 0}
              sub="IPs with failed logins (24h)"
            />
            <StatCard
              icon={Activity} label="Event Types" color="emerald"
              value={s.eventBreakdown?.length ?? 0}
              sub="Distinct event categories (7d)"
            />
          </div>

          {/* Two-column: breakdown + top IPs */}
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Event breakdown */}
            <div className="bg-white dark:bg-white/3 border border-gray-100 dark:border-white/6 rounded-2xl p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Event Breakdown (7 days)</p>
              <div className="space-y-2.5">
                {s.eventBreakdown?.slice(0, 8).map(({ _id, count }) => {
                  const meta = EVENT_META[_id] ?? { label: _id, color: 'text-gray-400', bg: 'bg-gray-500/10' };
                  const max  = s.eventBreakdown[0]?.count || 1;
                  return (
                    <div key={_id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-semibold ${meta.color}`}>{meta.label}</span>
                        <span className="text-xs font-bold text-gray-500">{count}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-white/8 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${meta.bg.replace('/10', '/60')}`}
                          style={{ width: `${(count / max) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top suspicious IPs */}
            <div className="bg-white dark:bg-white/3 border border-gray-100 dark:border-white/6 rounded-2xl p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Top Suspicious IPs (24h)</p>
              {s.topSuspiciousIPs?.length === 0 ? (
                <div className="py-6 text-center">
                  <ShieldCheck size={24} className="text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No suspicious IPs</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {s.topSuspiciousIPs?.map(({ _id: ip, count }, i) => (
                    <div key={ip} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-white/3">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${i === 0 ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-500'}`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 font-mono text-xs text-gray-700 dark:text-gray-300">{ip || '—'}</div>
                      <span className="text-xs font-bold text-red-400">{count} fails</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent alerts */}
          {s.recentAlerts?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Recent Alerts</p>
              <div className="bg-white dark:bg-white/2 border border-gray-100 dark:border-white/6 rounded-2xl overflow-hidden">
                {s.recentAlerts.slice(0, 10).map(log => <LogRow key={log._id} log={log} />)}
              </div>
            </div>
          )}
        </>
      )}

      {/* Full log with filters */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Full Audit Log</p>
          <div className="flex items-center gap-2">
            <Filter size={12} className="text-gray-400" />
            <select
              value={sevFilter}
              onChange={e => setSevFilter(e.target.value)}
              className="text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1 text-gray-700 dark:text-gray-300 outline-none"
            >
              <option value="">All severities</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="alert">Alert</option>
              <option value="critical">Critical</option>
            </select>
            <select
              value={evtFilter}
              onChange={e => setEvtFilter(e.target.value)}
              className="text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1 text-gray-700 dark:text-gray-300 outline-none"
            >
              <option value="">All events</option>
              <option value="login_failed">Failed Login</option>
              <option value="login_success">Login Success</option>
              <option value="unauthorized_access">Unauthorized</option>
              <option value="maintenance_on">Maintenance ON</option>
              <option value="maintenance_off">Maintenance OFF</option>
              <option value="kyc_submit">KYC Submit</option>
            </select>
          </div>
        </div>
        <div className="bg-white dark:bg-white/2 border border-gray-100 dark:border-white/6 rounded-2xl overflow-hidden max-h-[480px] overflow-y-auto">
          {logsLoading && (
            <div className="p-6 text-center text-sm text-gray-400">Loading logs…</div>
          )}
          {!logsLoading && (!logs || logs.length === 0) && (
            <div className="py-10 text-center">
              <ShieldCheck size={28} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No events found</p>
            </div>
          )}
          {logs?.map(log => <LogRow key={log._id} log={log} />)}
        </div>
      </div>
    </div>
  );
}
