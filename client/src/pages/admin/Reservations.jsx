import { useState } from 'react';
import { Plus, CalendarDays, Users, CheckCircle2, XCircle, Phone, Clock } from 'lucide-react';

const RESERVATIONS = [
  { id: 1, name: 'Ahmed Ben Ali',   phone: '+216 55 123 456', date: 'Today',    time: '20:00', guests: 4, table: 'T-07', status: 'confirmed', notes: 'Birthday celebration' },
  { id: 2, name: 'Sana Mansouri',   phone: '+216 98 765 432', date: 'Today',    time: '20:30', guests: 2, table: 'T-04', status: 'confirmed', notes: '' },
  { id: 3, name: 'Rami Khaled',     phone: '+216 23 456 789', date: 'Today',    time: '21:00', guests: 6, table: 'T-07', status: 'pending',   notes: 'Allergic to nuts' },
  { id: 4, name: 'Leila Hamrouni',  phone: '+216 77 888 999', date: 'Tomorrow', time: '12:30', guests: 3, table: 'T-02', status: 'confirmed', notes: '' },
  { id: 5, name: 'Karim Bouaziz',   phone: '+216 55 444 333', date: 'Tomorrow', time: '19:00', guests: 8, table: 'T-13', status: 'pending',   notes: 'Business dinner' },
  { id: 6, name: 'Hana Trabelsi',   phone: '+216 21 333 777', date: 'Tomorrow', time: '20:00', guests: 2, table: 'T-01', status: 'cancelled', notes: '' },
  { id: 7, name: 'Omar Jebali',     phone: '+216 55 999 111', date: 'Thu 22',   time: '13:00', guests: 4, table: 'T-06', status: 'confirmed', notes: '' },
];

const STATUS_MAP = {
  confirmed: { label: 'Confirmed', dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' },
  pending:   { label: 'Pending',   dot: 'bg-amber-500',   pill: 'bg-amber-50   text-amber-600   dark:bg-amber-500/10   dark:text-amber-400' },
  cancelled: { label: 'Cancelled', dot: 'bg-red-400',     pill: 'bg-red-50     text-red-500      dark:bg-red-500/10     dark:text-red-400' },
};

const TABS = ['All', 'Today', 'Tomorrow', 'Upcoming'];

const STATS = [
  { label: 'Today',     value: '3', icon: CalendarDays,  color: 'text-orange-500',  bg: 'bg-orange-50 dark:bg-orange-500/10' },
  { label: 'Confirmed', value: '5', icon: CheckCircle2,  color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  { label: 'Pending',   value: '2', icon: Clock,         color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-500/10' },
  { label: 'Covers',    value: '29', icon: Users,        color: 'text-purple-500',  bg: 'bg-purple-50 dark:bg-purple-500/10' },
];

export default function Reservations() {
  const [tab, setTab]   = useState('All');
  const [data, setData] = useState(RESERVATIONS);

  const filtered = tab === 'All' ? data
    : tab === 'Today'    ? data.filter(r => r.date === 'Today')
    : tab === 'Tomorrow' ? data.filter(r => r.date === 'Tomorrow')
    : data.filter(r => !['Today', 'Tomorrow'].includes(r.date));

  const confirm = (id) =>
    setData(prev => prev.map(r => r.id === id ? { ...r, status: 'confirmed' } : r));

  const cancel = (id) =>
    setData(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r));

  return (
    <div className="p-5 sm:p-6 space-y-6 max-w-[1440px]">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Reservations</h1>
          <p className="text-xs text-gray-400 mt-0.5">Booking & table scheduling</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm shadow-orange-500/20">
          <Plus size={14} /> New Reservation
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STATS.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/6 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon size={16} className={color} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">{value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/6 rounded-2xl shadow-sm overflow-hidden">

        {/* Tabs */}
        <div className="flex items-center gap-0 px-5 pt-4 border-b border-gray-100 dark:border-white/6">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={[
                'px-4 py-2.5 text-xs font-semibold border-b-2 transition-all',
                tab === t
                  ? 'text-orange-500 border-orange-500'
                  : 'text-gray-400 border-transparent hover:text-gray-600 dark:hover:text-gray-300',
              ].join(' ')}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Column headers */}
        <div className="hidden lg:grid grid-cols-[1fr_80px_80px_64px_56px_96px_100px] gap-3 px-5 py-2.5 border-b border-gray-50 dark:border-white/4">
          {['Guest', 'Date', 'Time', 'Guests', 'Table', 'Status', 'Actions'].map(h => (
            <span key={h} className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{h}</span>
          ))}
        </div>

        <div className="divide-y divide-gray-50 dark:divide-white/4">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-400">No reservations found</p>
            </div>
          ) : filtered.map(res => {
            const s = STATUS_MAP[res.status];
            return (
              <div
                key={res.id}
                className="grid lg:grid-cols-[1fr_80px_80px_64px_56px_96px_100px] gap-3 items-center px-5 py-4 hover:bg-gray-50/60 dark:hover:bg-white/2 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{res.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Phone size={10} className="text-gray-400" />
                    <span className="text-[10px] text-gray-400">{res.phone}</span>
                  </div>
                  {res.notes && (
                    <p className="text-[10px] text-gray-400 mt-0.5 italic truncate">{res.notes}</p>
                  )}
                </div>

                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">{res.date}</span>

                <div className="flex items-center gap-1">
                  <Clock size={11} className="text-gray-400" />
                  <span className="text-xs font-semibold text-gray-900 dark:text-white">{res.time}</span>
                </div>

                <div className="flex items-center gap-1">
                  <Users size={11} className="text-gray-400" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">{res.guests}</span>
                </div>

                <span className="text-xs font-mono font-medium text-gray-500 dark:text-gray-400">{res.table}</span>

                <div>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.pill}`}>
                    <span className={`w-1 h-1 rounded-full ${s.dot} shrink-0`} />
                    {s.label}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {res.status === 'pending' && (
                    <>
                      <button
                        onClick={() => confirm(res.id)}
                        className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                      >
                        <CheckCircle2 size={10} /> Confirm
                      </button>
                      <button
                        onClick={() => cancel(res.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        title="Cancel"
                      >
                        <XCircle size={14} />
                      </button>
                    </>
                  )}
                  {res.status === 'confirmed' && (
                    <button
                      onClick={() => cancel(res.id)}
                      className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 hover:border-red-300 hover:text-red-500 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  {res.status === 'cancelled' && (
                    <span className="text-[10px] text-gray-400">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
