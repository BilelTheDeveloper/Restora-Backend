import { useState } from 'react';
import { Plus, Users, CheckCircle2, Clock, Sparkles } from 'lucide-react';

const INITIAL_TABLES = [
  { id: 1,  name: 'T-01', capacity: 2,  status: 'available', floor: 'Main',    order: null },
  { id: 2,  name: 'T-02', capacity: 4,  status: 'occupied',  floor: 'Main',    order: '#0042' },
  { id: 3,  name: 'T-03', capacity: 4,  status: 'occupied',  floor: 'Main',    order: '#0039' },
  { id: 4,  name: 'T-04', capacity: 2,  status: 'reserved',  floor: 'Main',    order: null },
  { id: 5,  name: 'T-05', capacity: 6,  status: 'occupied',  floor: 'Main',    order: '#0040' },
  { id: 6,  name: 'T-06', capacity: 4,  status: 'available', floor: 'Main',    order: null },
  { id: 7,  name: 'T-07', capacity: 8,  status: 'reserved',  floor: 'Main',    order: null },
  { id: 8,  name: 'T-08', capacity: 2,  status: 'cleaning',  floor: 'Main',    order: null },
  { id: 9,  name: 'T-09', capacity: 4,  status: 'available', floor: 'Terrace', order: null },
  { id: 10, name: 'T-10', capacity: 4,  status: 'occupied',  floor: 'Terrace', order: '#0038' },
  { id: 11, name: 'T-11', capacity: 6,  status: 'available', floor: 'Terrace', order: null },
  { id: 12, name: 'T-12', capacity: 2,  status: 'available', floor: 'Terrace', order: null },
  { id: 13, name: 'T-13', capacity: 10, status: 'reserved',  floor: 'Private', order: null },
  { id: 14, name: 'T-14', capacity: 6,  status: 'available', floor: 'Private', order: null },
];

const STATUS_CONFIG = {
  available: {
    label: 'Available',
    card: 'bg-emerald-50 dark:bg-emerald-500/8 border-emerald-200 dark:border-emerald-500/20',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    dot:   'bg-emerald-500',
    icon:  CheckCircle2,
    iconColor: 'text-emerald-500',
  },
  occupied: {
    label: 'Occupied',
    card: 'bg-orange-50 dark:bg-orange-500/8 border-orange-200 dark:border-orange-500/20',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
    dot:   'bg-orange-500',
    icon:  Users,
    iconColor: 'text-orange-500',
  },
  reserved: {
    label: 'Reserved',
    card: 'bg-purple-50 dark:bg-purple-500/8 border-purple-200 dark:border-purple-500/20',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
    dot:   'bg-purple-500',
    icon:  Clock,
    iconColor: 'text-purple-500',
  },
  cleaning: {
    label: 'Cleaning',
    card: 'bg-yellow-50 dark:bg-yellow-500/8 border-yellow-200 dark:border-yellow-500/20',
    badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400',
    dot:   'bg-yellow-500',
    icon:  Sparkles,
    iconColor: 'text-yellow-500',
  },
};

const FLOORS = ['All', 'Main', 'Terrace', 'Private'];

const statKeys = ['available', 'occupied', 'reserved', 'cleaning'];

export default function Tables() {
  const [tables, setTables] = useState(INITIAL_TABLES);
  const [floor, setFloor]   = useState('All');

  const displayed = floor === 'All' ? tables : tables.filter(t => t.floor === floor);

  const counts = statKeys.reduce((acc, k) => {
    acc[k] = tables.filter(t => t.status === k).length;
    return acc;
  }, {});

  const cycleStatus = (id) => {
    const cycle = { available: 'occupied', occupied: 'cleaning', cleaning: 'available', reserved: 'available' };
    setTables(prev => prev.map(t => t.id === id ? { ...t, status: cycle[t.status], order: null } : t));
  };

  return (
    <div className="p-5 sm:p-6 space-y-6 max-w-[1440px]">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Tables</h1>
          <p className="text-xs text-gray-400 mt-0.5">Floor map &amp; status management</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm shadow-orange-500/20">
          <Plus size={14} /> Add Table
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statKeys.map(key => {
          const cfg = STATUS_CONFIG[key];
          const Icon = cfg.icon;
          return (
            <div key={key} className="bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/6 rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${cfg.badge.split(' ').slice(0, 2).join(' ')} flex items-center justify-center shrink-0`}>
                <Icon size={16} className={cfg.iconColor} />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">{counts[key]}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 capitalize">{cfg.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floor filter + map */}
      <div className="bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/6 rounded-2xl shadow-sm overflow-hidden">

        {/* Floor tabs */}
        <div className="flex items-center gap-0 px-5 pt-4 border-b border-gray-100 dark:border-white/6">
          {FLOORS.map(f => (
            <button
              key={f}
              onClick={() => setFloor(f)}
              className={[
                'px-4 py-2.5 text-xs font-semibold border-b-2 transition-all',
                floor === f
                  ? 'text-orange-500 border-orange-500'
                  : 'text-gray-400 border-transparent hover:text-gray-600 dark:hover:text-gray-300',
              ].join(' ')}
            >
              {f}
            </button>
          ))}

          {/* Legend */}
          <div className="ml-auto flex items-center gap-3 pb-2 pr-1">
            {statKeys.map(k => (
              <div key={k} className="hidden sm:flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[k].dot}`} />
                <span className="text-[9px] text-gray-400 capitalize">{k}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Table grid */}
        <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3">
          {displayed.map(table => {
            const cfg = STATUS_CONFIG[table.status];
            const Icon = cfg.icon;
            return (
              <button
                key={table.id}
                onClick={() => cycleStatus(table.id)}
                title={`Click to cycle status`}
                className={[
                  'border-2 rounded-2xl p-3.5 text-left transition-all duration-150',
                  'hover:shadow-md hover:-translate-y-0.5 active:scale-95',
                  cfg.card,
                ].join(' ')}
              >
                <div className="flex items-start justify-between mb-2.5">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{table.name}</span>
                  <Icon size={13} className={cfg.iconColor} />
                </div>

                <div className="flex items-center gap-1 mb-2">
                  <Users size={10} className="text-gray-400" />
                  <span className="text-[10px] text-gray-500">{table.capacity}</span>
                </div>

                <div>
                  <span className={`inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${cfg.badge}`}>
                    <span className={`w-1 h-1 rounded-full ${cfg.dot} shrink-0`} />
                    {cfg.label}
                  </span>
                </div>

                {table.order && (
                  <p className="text-[9px] text-gray-400 mt-1.5 font-mono">{table.order}</p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Floor name label */}
      <p className="text-[10px] text-gray-400 text-center">
        Click any table to cycle its status · {displayed.length} tables shown
      </p>
    </div>
  );
}
