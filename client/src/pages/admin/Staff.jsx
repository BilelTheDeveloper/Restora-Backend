import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Users, Plus, X, Mail, Phone, ShieldCheck, ChefHat, Loader2,
  TrendingUp, Calendar, Clock, Star, Edit3, UserPlus, BarChart2,
  Check, AlertCircle,
} from 'lucide-react';
import { staffService } from '../../services/staffService';

const ROLE_CONFIG = {
  manager:  { label: 'Manager',  color: 'text-blue-400',    bg: 'bg-blue-500/10',    icon: ShieldCheck },
  cashier:  { label: 'Cashier',  color: 'text-purple-400',  bg: 'bg-purple-500/10',  icon: Users       },
  waiter:   { label: 'Waiter',   color: 'text-teal-400',    bg: 'bg-teal-500/10',    icon: Users       },
  kitchen:  { label: 'Kitchen',  color: 'text-orange-400',  bg: 'bg-orange-500/10',  icon: ChefHat     },
  delivery: { label: 'Delivery', color: 'text-amber-400',   bg: 'bg-amber-500/10',   icon: Users       },
  staff:    { label: 'Staff',    color: 'text-gray-500 dark:text-white/60',    bg: 'bg-gray-100 dark:bg-white/8',         icon: Users       },
};

const ROLE_OPTIONS = ['manager', 'cashier', 'waiter', 'kitchen', 'delivery'];
const DOW_LABELS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS        = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2,'0')}:00`);

function InviteModal({ onClose, onInvite }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'waiter' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
        className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-sm"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/8">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Invite Staff Member</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/6 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/12 text-gray-400 dark:text-white/50 transition-all">
            <X size={13} />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-400 dark:text-white/30 mb-1.5">Full Name</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              className="w-full bg-gray-50 dark:bg-white/6 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20 focus:outline-none focus:border-orange-500/50"
              placeholder="Sana Hamdi" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-400 dark:text-white/30 mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
              className="w-full bg-gray-50 dark:bg-white/6 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20 focus:outline-none focus:border-orange-500/50"
              placeholder="staff@restaurant.tn" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-400 dark:text-white/30 mb-1.5">Role</label>
            <select value={form.role} onChange={e => set('role', e.target.value)}
              className="w-full bg-gray-50 dark:bg-white/6 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-orange-500/50">
              {ROLE_OPTIONS.map(r => <option key={r} value={r}>{ROLE_CONFIG[r]?.label || r}</option>)}
            </select>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 dark:bg-white/6 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-white/60 text-sm font-semibold rounded-xl transition-colors">Cancel</button>
            <button onClick={() => form.name && form.email && onInvite(form)}
              disabled={!form.name || !form.email}
              className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-40">
              Send Invite
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ShiftModal({ staff, shift, onClose, onSave }) {
  const [form, setForm] = useState(shift || {
    staffId: staff?._id || '',
    date: new Date().toISOString().slice(0, 10),
    startTime: '09:00',
    endTime: '17:00',
    role: staff?.role || 'waiter',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
        className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-sm"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/8">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">{shift ? 'Edit Shift' : 'New Shift'}</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/6 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/12 text-gray-400 dark:text-white/50 transition-all"><X size={13} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-400 dark:text-white/30 mb-1.5">Date</label>
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
              className="w-full bg-gray-50 dark:bg-white/6 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-orange-500/50" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-400 dark:text-white/30 mb-1.5">Start</label>
              <select value={form.startTime} onChange={e => set('startTime', e.target.value)}
                className="w-full bg-gray-50 dark:bg-white/6 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-orange-500/50">
                {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-400 dark:text-white/30 mb-1.5">End</label>
              <select value={form.endTime} onChange={e => set('endTime', e.target.value)}
                className="w-full bg-gray-50 dark:bg-white/6 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-orange-500/50">
                {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 dark:bg-white/6 text-gray-500 dark:text-white/60 text-sm font-semibold rounded-xl">Cancel</button>
            <button onClick={() => onSave(form)} className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-colors">
              {shift ? 'Update' : 'Create Shift'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function StaffCard({ member, onEdit, onShift }) {
  const cfg = ROLE_CONFIG[member.role] || ROLE_CONFIG.staff;
  const Icon = cfg.icon;
  const initials = member.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center text-sm font-black text-orange-400 shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{member.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Icon size={10} className={cfg.color} />
            <span className={`text-[10px] font-semibold ${cfg.color}`}>{cfg.label}</span>
          </div>
        </div>
      </div>

      {(member.email || member.phone) && (
        <div className="space-y-1 mb-3">
          {member.email && (
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-white/40">
              <Mail size={10} className="text-gray-300 dark:text-white/20" />{member.email}
            </div>
          )}
          {member.phone && (
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-white/40">
              <Phone size={10} className="text-gray-300 dark:text-white/20" />{member.phone}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-1.5">
        <button onClick={() => onShift(member)}
          className="flex-1 py-1.5 bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/20 text-orange-400 text-[11px] font-semibold rounded-lg transition-colors flex items-center justify-center gap-1">
          <Calendar size={10} /> Shift
        </button>
        <button onClick={() => onEdit(member)}
          className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/6 hover:bg-gray-200 dark:hover:bg-white/12 text-gray-400 dark:text-white/40 flex items-center justify-center transition-colors">
          <Edit3 size={11} />
        </button>
      </div>
    </div>
  );
}

function PerformanceTab({ staffList }) {
  const { data: perf = [], isLoading } = useQuery({
    queryKey: ['staff-performance'],
    queryFn: () => staffService.getPerformance().then(r => r.data),
  });

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-gray-400 dark:text-white/30" /></div>;
  if (perf.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-300 dark:text-white/20 gap-2">
      <BarChart2 size={28} /><p className="text-xs">No performance data yet</p>
    </div>
  );

  const maxRevenue = Math.max(1, ...perf.map(p => p.revenue || 0));

  return (
    <div className="space-y-3">
      {perf.map((p, i) => {
        const member = staffList.find(s => s._id === p.staffId) || {};
        const initials = (member.name || p.name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
        const revPct = (p.revenue / maxRevenue) * 100;
        return (
          <div key={i} className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/15 flex items-center justify-center text-sm font-black text-orange-400 shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white">{member.name || p.name || 'Unknown'}</p>
                <p className="text-[10px] text-gray-400 dark:text-white/30">{ROLE_CONFIG[member.role]?.label || 'Staff'}</p>
              </div>
              {i === 0 && <Star size={14} className="text-amber-400 fill-amber-400" />}
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-gray-100 dark:bg-white/4 rounded-xl p-2 text-center">
                <p className="text-base font-black text-blue-400 tabular-nums">{p.ordersHandled || 0}</p>
                <p className="text-[9px] text-gray-400 dark:text-white/30">Orders</p>
              </div>
              <div className="bg-gray-100 dark:bg-white/4 rounded-xl p-2 text-center">
                <p className="text-base font-black text-orange-400 tabular-nums">{Math.round(p.revenue || 0)}</p>
                <p className="text-[9px] text-gray-400 dark:text-white/30">Revenue TND</p>
              </div>
              <div className="bg-gray-100 dark:bg-white/4 rounded-xl p-2 text-center">
                <p className="text-base font-black text-emerald-400 tabular-nums">{p.avgServiceTime || '—'}</p>
                <p className="text-[9px] text-gray-400 dark:text-white/30">Avg Time</p>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[9px] text-gray-400 dark:text-white/30 mb-1">
                <span>Revenue contribution</span>
                <span>{revPct.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 bg-gray-200 dark:bg-white/6 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${revPct}%` }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Staff() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('roster');
  const [showInvite, setShowInvite] = useState(false);
  const [shiftModal, setShiftModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [roleFilter, setRoleFilter] = useState('All');

  const { data: staffList = [], isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: () => staffService.list().then(r => r.data),
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => staffService.getShifts().then(r => r.data),
    enabled: tab === 'shifts',
  });

  const { mutate: invite, isPending: inviting } = useMutation({
    mutationFn: (data) => staffService.invite(data),
    onSuccess: () => { toast.success('Invitation sent'); qc.invalidateQueries(['staff']); setShowInvite(false); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to invite'),
  });

  const { mutate: createShift } = useMutation({
    mutationFn: (data) => staffService.createShift(data),
    onSuccess: () => { toast.success('Shift created'); qc.invalidateQueries(['shifts']); setShiftModal(null); },
    onError: () => toast.error('Failed to create shift'),
  });

  const roles = ['All', ...new Set(staffList.map(s => s.role).filter(Boolean))];
  const filtered = roleFilter === 'All' ? staffList : staffList.filter(s => s.role === roleFilter);

  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - today.getDay() + i);
    return d;
  });

  return (
    <div className="p-5 sm:p-6 space-y-5 max-w-[1440px] bg-gray-50 dark:bg-[#0a0a0a] min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">Staff</h1>
          <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">Team roster, shifts & performance</p>
        </div>
        <button onClick={() => setShowInvite(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-colors">
          <UserPlus size={13} /> Invite Staff
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Staff',  value: staffList.length,                                      color: 'text-gray-900 dark:text-white',       bg: 'bg-gray-100 dark:bg-white/5'          },
          { label: 'Managers',     value: staffList.filter(s => s.role === 'manager').length,    color: 'text-blue-400',    bg: 'bg-blue-500/10'      },
          { label: 'Waiters',      value: staffList.filter(s => s.role === 'waiter').length,     color: 'text-teal-400',    bg: 'bg-teal-500/10'      },
          { label: 'Kitchen',      value: staffList.filter(s => s.role === 'kitchen').length,    color: 'text-orange-400',  bg: 'bg-orange-500/10'    },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
            <p className={`text-2xl font-black tabular-nums ${s.color}`}>{s.value}</p>
            <p className="text-[10px] font-semibold text-gray-400 dark:text-white/40 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5">
        {[
          { key: 'roster',      label: 'Roster',       icon: Users     },
          { key: 'shifts',      label: 'Shifts',       icon: Calendar  },
          { key: 'performance', label: 'Performance',  icon: BarChart2 },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === t.key ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-white/6 text-gray-400 dark:text-white/50 hover:bg-gray-200 dark:hover:bg-white/10'
            }`}>
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      {/* Roster */}
      {tab === 'roster' && (
        <>
          {roles.length > 2 && (
            <div className="flex gap-1.5 flex-wrap">
              {roles.map(r => (
                <button key={r} onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    roleFilter === r ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-white/6 text-gray-400 dark:text-white/50 hover:text-gray-900 dark:hover:text-white'
                  }`}>
                  {r === 'All' ? 'All' : ROLE_CONFIG[r]?.label || r}
                </button>
              ))}
            </div>
          )}
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-gray-400 dark:text-white/30" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-300 dark:text-white/20 gap-2">
              <Users size={28} /><p className="text-xs">No staff yet · Invite your team above</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filtered.map(m => (
                <StaffCard key={m._id} member={m} onEdit={setEditModal} onShift={s => setShiftModal({ staff: s })} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Shifts (week view) */}
      {tab === 'shifts' && (
        <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-white/6">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">This Week</h2>
            <button onClick={() => setShiftModal({ staff: null })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/15 border border-orange-500/25 text-orange-400 text-xs font-bold rounded-xl hover:bg-orange-500/25 transition-colors">
              <Plus size={12} /> New Shift
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-400 dark:text-white/30 w-32">Staff</th>
                  {weekDays.map((d, i) => (
                    <th key={i} className={`px-2 py-3 text-center text-[10px] font-semibold min-w-[80px] ${
                      d.toDateString() === today.toDateString() ? 'text-orange-400' : 'text-gray-400 dark:text-white/30'
                    }`}>
                      {DOW_LABELS[d.getDay()]} {d.getDate()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/4">
                {staffList.slice(0, 10).map(member => (
                  <tr key={member._id} className="hover:bg-gray-50 dark:hover:bg-white/2">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-orange-500/15 flex items-center justify-center text-[10px] font-black text-orange-400">
                          {member.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <span className="text-xs text-gray-700 dark:text-white/70 truncate max-w-[80px]">{member.name?.split(' ')[0]}</span>
                      </div>
                    </td>
                    {weekDays.map((d, di) => {
                      const dateStr = d.toISOString().slice(0, 10);
                      const dayShifts = shifts.filter(s => s.staffId === member._id && s.date?.slice(0, 10) === dateStr);
                      return (
                        <td key={di} className="px-2 py-3 text-center">
                          {dayShifts.length > 0 ? (
                            <div className="bg-orange-500/15 border border-orange-500/25 rounded-lg px-1.5 py-1 text-[9px] font-bold text-orange-400">
                              {dayShifts[0].startTime}–{dayShifts[0].endTime}
                            </div>
                          ) : (
                            <button onClick={() => setShiftModal({ staff: member, date: dateStr })}
                              className="w-full h-6 rounded-lg bg-gray-100 dark:bg-white/3 hover:bg-gray-200 dark:hover:bg-white/8 text-gray-300 dark:text-white/15 hover:text-gray-500 dark:hover:text-white/40 transition-colors flex items-center justify-center">
                              <Plus size={10} />
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Performance */}
      {tab === 'performance' && <PerformanceTab staffList={staffList} />}

      <AnimatePresence>
        {showInvite && (
          <InviteModal onClose={() => setShowInvite(false)} onInvite={invite} />
        )}
        {shiftModal && (
          <ShiftModal
            staff={shiftModal.staff}
            shift={shiftModal.shift}
            onClose={() => setShiftModal(null)}
            onSave={(data) => createShift({ ...data, staffId: shiftModal.staff?._id || data.staffId })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
