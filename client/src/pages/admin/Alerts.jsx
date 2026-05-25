import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import {
  Bell, AlertTriangle, Info, Zap, CheckCheck, X, Loader2, RefreshCw,
  CalendarDays, CheckCircle2, XCircle, ChevronRight,
} from 'lucide-react';
import { alertService } from '../../services/alertService';

const SEVERITY_CONFIG = {
  info:     { icon: Info,          color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20'   },
  warning:  { icon: AlertTriangle, color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20'  },
  critical: { icon: Zap,           color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20'    },
};

// Override icon for reservation types
const TYPE_ICON_OVERRIDE = {
  reservation_new:       CalendarDays,
  reservation_confirmed: CheckCircle2,
  reservation_cancelled: XCircle,
};

const TYPE_LABELS = {
  low_stock:             'Low Stock',
  slow_kitchen:          'Slow Kitchen',
  no_show_risk:          'No-Show Risk',
  revenue_anomaly:       'Revenue Alert',
  peak_hour:             'Peak Hour',
  vip_inactive:          'VIP Inactive',
  reservation_new:       'New Booking',
  reservation_confirmed: 'Confirmed',
  reservation_cancelled: 'Cancelled',
};

const TYPE_COLOR_OVERRIDE = {
  reservation_new:       { color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  reservation_confirmed: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  reservation_cancelled: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
};

const FILTER_OPTIONS = [
  { key: 'all',           label: 'All' },
  { key: 'unread',        label: 'Unread' },
  { key: 'reservations',  label: 'Reservations' },
  { key: 'critical',      label: 'Critical' },
  { key: 'warning',       label: 'Warnings' },
];

export default function Alerts() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('all');

  const isReservationFilter = filter === 'reservations';

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['alerts', filter],
    queryFn: () => alertService.list({
      unread:   filter === 'unread' ? true : undefined,
      severity: ['critical', 'warning'].includes(filter) ? filter : undefined,
      limit:    50,
    }).then(r => r.data),
  });

  const allAlerts = data?.alerts || data || [];
  const RESERVATION_TYPES = ['reservation_new', 'reservation_confirmed', 'reservation_cancelled'];

  const alerts = isReservationFilter
    ? allAlerts.filter(a => RESERVATION_TYPES.includes(a.type))
    : allAlerts;

  const { mutate: markRead } = useMutation({
    mutationFn: (id) => alertService.markRead(id),
    onSuccess: () => { qc.invalidateQueries(['alerts']); qc.invalidateQueries(['alert-count']); },
  });

  const { mutate: markAllRead } = useMutation({
    mutationFn: () => alertService.markAllRead(),
    onSuccess: () => { qc.invalidateQueries(['alerts']); qc.invalidateQueries(['alert-count']); },
  });

  const { mutate: dismiss } = useMutation({
    mutationFn: (id) => alertService.dismiss(id),
    onSuccess: () => { qc.invalidateQueries(['alerts']); qc.invalidateQueries(['alert-count']); },
  });

  const unreadCount = alerts.filter(a => !a.isRead).length;

  return (
    <div className="p-5 sm:p-6 space-y-5 max-w-3xl bg-gray-50 dark:bg-[#0a0a0a] min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">Alert Center</h1>
          <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">Smart notifications from your restaurant</p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-white/6 hover:bg-gray-200 dark:hover:bg-white/12 border border-gray-200 dark:border-white/8 text-gray-500 dark:text-white/60 hover:text-gray-900 dark:hover:text-white text-xs font-semibold rounded-xl transition-all"
            >
              <CheckCheck size={13} /> Mark all read
            </button>
          )}
          <button onClick={() => refetch()} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/6 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/12 text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white transition-all">
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTER_OPTIONS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === f.key ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-white/6 text-gray-500 dark:text-white/50 hover:bg-gray-200 dark:hover:bg-white/10'
            }`}>
            {f.label}
            {f.key === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Alert list */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48 text-gray-300 dark:text-white/30">
          <Loader2 size={22} className="animate-spin" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-300 dark:text-white/20 gap-2">
          <Bell size={28} /><p className="text-xs">No alerts</p>
          <p className="text-[11px] text-gray-300 dark:text-white/15">The alert engine monitors your restaurant 24/7</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {alerts.map(alert => {
              const baseCfg  = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;
              const override = TYPE_COLOR_OVERRIDE[alert.type];
              const cfg      = override ? { ...baseCfg, ...override } : baseCfg;
              const Icon     = TYPE_ICON_OVERRIDE[alert.type] || cfg.icon;
              const isResv   = RESERVATION_TYPES.includes(alert.type);

              return (
                <motion.div
                  key={alert._id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`flex items-start gap-4 bg-white dark:bg-[#111111] border ${cfg.border} rounded-2xl p-4 ${!alert.isRead ? 'ring-1 ring-inset ring-orange-400/20' : ''}`}
                >
                  <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon size={15} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{alert.title}</p>
                          {!alert.isRead && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />}
                          {alert.type && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${cfg.bg} ${cfg.color}`}>
                              {TYPE_LABELS[alert.type] || alert.type}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-white/50 mt-1 leading-relaxed">{alert.message}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <p className="text-[10px] text-gray-300 dark:text-white/25">
                        {new Date(alert.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <div className="flex items-center gap-1.5 ml-auto flex-wrap">
                        {isResv && alert.actionLink && (
                          <NavLink
                            to={alert.actionLink}
                            onClick={() => !alert.isRead && markRead(alert._id)}
                            className="flex items-center gap-1 text-[10px] text-orange-500 dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-300 transition-colors font-semibold"
                          >
                            View reservations <ChevronRight size={10} />
                          </NavLink>
                        )}
                        {!alert.isRead && (
                          <button onClick={() => markRead(alert._id)}
                            className="text-[10px] text-gray-400 dark:text-white/30 hover:text-orange-500 dark:hover:text-orange-400 transition-colors font-semibold">
                            Mark read
                          </button>
                        )}
                        <button onClick={() => dismiss(alert._id)}
                          className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-white/6 hover:bg-gray-200 dark:hover:bg-white/12 text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/60 flex items-center justify-center transition-colors">
                          <X size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
