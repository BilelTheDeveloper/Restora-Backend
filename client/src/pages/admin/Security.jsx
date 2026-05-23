import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck, ShieldAlert, ShieldX, Lock, AlertTriangle,
  CheckCircle2, XCircle, LogIn, LogOut, Key, Clock,
  RefreshCw, Monitor, Smartphone, Globe,
} from 'lucide-react';
import api from '../../services/api';

const fetchSummary = () => api.get('/owner/security/summary').then(r => r.data);
const fetchLogs    = () => api.get('/owner/security/logs').then(r => r.data);

function ScoreRing({ score, grade }) {
  const color =
    score >= 90 ? '#10b981' :
    score >= 75 ? '#3b82f6' :
    score >= 60 ? '#f59e0b' :
    score >= 40 ? '#f97316' : '#ef4444';

  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="relative flex items-center justify-center w-28 h-28">
      <svg width="112" height="112" className="-rotate-90">
        <circle cx="56" cy="56" r={r} stroke="#ffffff10" strokeWidth="8" fill="none" />
        <circle
          cx="56" cy="56" r={r}
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 1s ease', filter: `drop-shadow(0 0 6px ${color}80)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-white leading-none">{score}</span>
        <span className="text-xs font-bold mt-0.5" style={{ color }}>{grade}</span>
      </div>
    </div>
  );
}

const EVENT_META = {
  login_success:      { icon: LogIn,        label: 'Login',           color: 'emerald', severity: 'info'    },
  login_failed:       { icon: XCircle,      label: 'Failed Login',    color: 'red',     severity: 'warning' },
  logout:             { icon: LogOut,       label: 'Logout',          color: 'gray',    severity: 'info'    },
  register:           { icon: CheckCircle2, label: 'Registration',    color: 'blue',    severity: 'info'    },
  password_change:    { icon: Key,          label: 'Password Changed', color: 'purple', severity: 'info'    },
  kyc_submit:         { icon: ShieldCheck,  label: 'KYC Submitted',   color: 'orange',  severity: 'info'    },
  kyc_approved:       { icon: ShieldCheck,  label: 'KYC Approved',    color: 'emerald', severity: 'info'    },
  kyc_rejected:       { icon: ShieldX,      label: 'KYC Rejected',    color: 'red',     severity: 'alert'   },
  rate_limit_hit:     { icon: AlertTriangle,label: 'Rate Limited',    color: 'amber',   severity: 'warning' },
  unauthorized_access:{ icon: Lock,         label: 'Unauthorized',    color: 'red',     severity: 'alert'   },
  token_invalid:      { icon: Key,          label: 'Invalid Token',   color: 'red',     severity: 'warning' },
  account_deactivated:{ icon: ShieldX,      label: 'Account Locked',  color: 'red',     severity: 'critical'},
};

const colorMap = {
  emerald: 'bg-emerald-500/15 text-emerald-400',
  red:     'bg-red-500/15 text-red-400',
  blue:    'bg-blue-500/15 text-blue-400',
  orange:  'bg-orange-500/15 text-orange-400',
  purple:  'bg-purple-500/15 text-purple-400',
  amber:   'bg-amber-500/15 text-amber-400',
  gray:    'bg-gray-500/15 text-gray-400',
};

const severityBadge = {
  info:     'bg-gray-500/10 text-gray-400 border-gray-500/20',
  warning:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  alert:    'bg-red-500/10 text-red-400 border-red-500/20',
  critical: 'bg-red-600/15 text-red-300 border-red-600/30',
};

function parseUA(ua = '') {
  if (!ua || ua === 'unknown') return { icon: Monitor, label: 'Unknown' };
  if (/mobile|android|iphone|ipad/i.test(ua)) return { icon: Smartphone, label: 'Mobile' };
  return { icon: Monitor, label: 'Desktop' };
}

function LogRow({ log }) {
  const meta = EVENT_META[log.event] ?? { icon: ShieldAlert, label: log.event, color: 'gray', severity: 'info' };
  const Icon = meta.icon;
  const { icon: UAIcon, label: uaLabel } = parseUA(log.userAgent);
  const timeAgo = (() => {
    const diff = Date.now() - new Date(log.createdAt).getTime();
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  })();

  return (
    <div className="flex items-center gap-3 p-3.5 rounded-xl hover:bg-white/3 transition-colors group border border-transparent hover:border-white/5">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${colorMap[meta.color]}`}>
        <Icon size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-white">{meta.label}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${severityBadge[log.severity]}`}>
            {log.severity}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <Globe size={10} className="text-gray-500 shrink-0" />
          <span className="text-[11px] text-gray-500 truncate">{log.ip || '—'}</span>
          <UAIcon size={10} className="text-gray-500 shrink-0 ml-1" />
          <span className="text-[11px] text-gray-500">{uaLabel}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-gray-500 shrink-0">
        <Clock size={10} />
        {timeAgo}
      </div>
    </div>
  );
}

function SecurityCheckItem({ label, pass, desc }) {
  return (
    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/3 border border-white/6">
      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${pass ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
        {pass ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
      </div>
      <div>
        <p className={`text-xs font-semibold ${pass ? 'text-white' : 'text-red-300'}`}>{label}</p>
        <p className="text-[11px] text-gray-500 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

export default function Security() {
  const {
    data: summary, isLoading: sumLoading, refetch: refetchSum, isFetching: sumFetching,
  } = useQuery({ queryKey: ['security-summary'], queryFn: fetchSummary, retry: 1 });

  const {
    data: logs, isLoading: logsLoading, refetch: refetchLogs,
  } = useQuery({ queryKey: ['security-logs'], queryFn: fetchLogs, retry: 1 });

  const isLoading = sumLoading || logsLoading;

  const refetch = () => { refetchSum(); refetchLogs(); };

  return (
    <div className="flex min-h-[calc(100vh-56px)] items-start justify-center p-4 sm:p-6 pt-8 bg-gradient-to-br from-transparent via-transparent to-orange-950/10">
      <div className="w-full max-w-4xl space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Security Center</h1>
              <p className="text-xs text-gray-400">Account security monitoring & alerts</p>
            </div>
          </div>
          <button
            onClick={refetch}
            disabled={sumFetching}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-gray-300 hover:bg-white/8 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={sumFetching ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-white/3 border border-white/6 animate-pulse" />
            ))}
          </div>
        )}

        {summary && (
          <>
            {/* Score + Stats */}
            <div className="grid sm:grid-cols-3 gap-4">
              {/* Score card */}
              <div className="relative bg-gradient-to-br from-orange-500/10 to-red-500/5 border border-orange-500/15 rounded-2xl p-5 flex items-center gap-5 sm:col-span-1">
                <ScoreRing score={summary.score} grade={summary.grade} />
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Security Score</p>
                  <p className={`text-lg font-black ${summary.score >= 75 ? 'text-emerald-400' : summary.score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                    {summary.score >= 90 ? 'Excellent' :
                     summary.score >= 75 ? 'Good' :
                     summary.score >= 60 ? 'Fair' :
                     summary.score >= 40 ? 'Poor' : 'Critical'}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">Updated just now</p>
                </div>
              </div>

              {/* Failed logins */}
              <div className={`bg-gradient-to-br border rounded-2xl p-5 ${summary.failedLogins.today >= 3 ? 'from-red-500/10 to-rose-500/5 border-red-500/15' : 'from-white/3 to-transparent border-white/6'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${summary.failedLogins.today >= 3 ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/15 text-gray-400'}`}>
                    <XCircle size={16} />
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Failed Logins</p>
                </div>
                <p className="text-3xl font-black text-white">{summary.failedLogins.today}</p>
                <p className="text-xs text-gray-400 mt-1">Today · <span className="text-gray-500">{summary.failedLogins.week} this week</span></p>
              </div>

              {/* Security alerts */}
              <div className={`bg-gradient-to-br border rounded-2xl p-5 ${summary.alerts >= 1 ? 'from-amber-500/10 to-yellow-500/5 border-amber-500/15' : 'from-white/3 to-transparent border-white/6'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${summary.alerts >= 1 ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-500/15 text-gray-400'}`}>
                    <AlertTriangle size={16} />
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Alerts</p>
                </div>
                <p className="text-3xl font-black text-white">{summary.alerts}</p>
                <p className="text-xs text-gray-400 mt-1">Last 7 days</p>
              </div>
            </div>

            {/* Security checklist */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Security Checklist</p>
              <div className="grid sm:grid-cols-2 gap-2">
                <SecurityCheckItem
                  label="KYC Verified"
                  pass={true}
                  desc="Identity and business documents verified"
                />
                <SecurityCheckItem
                  label="No Brute Force Detected"
                  pass={summary.failedLogins.today < 5}
                  desc={summary.failedLogins.today >= 5 ? 'High number of failed logins today' : 'No suspicious login activity detected'}
                />
                <SecurityCheckItem
                  label="Account Active"
                  pass={true}
                  desc="Your account is in good standing"
                />
                <SecurityCheckItem
                  label="No Recent Alerts"
                  pass={summary.alerts === 0}
                  desc={summary.alerts > 0 ? `${summary.alerts} alert(s) in the last 7 days` : 'No critical events in the last 7 days'}
                />
              </div>
            </div>

            {/* Recent activity */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Recent Activity</p>
              <div className="bg-white/2 border border-white/6 rounded-2xl p-2 space-y-0.5">
                {summary.loginHistory.length === 0 ? (
                  <div className="py-8 text-center">
                    <ShieldCheck size={24} className="text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No recent activity</p>
                  </div>
                ) : (
                  summary.loginHistory.map(log => <LogRow key={log.id} log={log} />)
                )}
              </div>
            </div>
          </>
        )}

        {/* Full logs */}
        {logs && logs.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Full Security Log</p>
            <div className="bg-white/2 border border-white/6 rounded-2xl p-2 space-y-0.5 max-h-80 overflow-y-auto">
              {logs.map(log => <LogRow key={log._id} log={log} />)}
            </div>
          </div>
        )}

        {/* Security tips */}
        <div className="bg-gradient-to-br from-blue-500/8 to-indigo-500/5 border border-blue-500/15 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={16} className="text-blue-400" />
            <p className="text-sm font-bold text-white">Security Recommendations</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { icon: Key,           title: 'Strong Password',   desc: 'Use 12+ characters with mixed symbols, numbers and letters.' },
              { icon: Monitor,       title: 'Secure Device',     desc: 'Only log in from trusted devices and networks.' },
              { icon: AlertTriangle, title: 'Report Suspicious', desc: 'Contact support immediately if you notice unrecognized access.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3 p-3 rounded-xl bg-white/3">
                <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon size={13} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{title}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
