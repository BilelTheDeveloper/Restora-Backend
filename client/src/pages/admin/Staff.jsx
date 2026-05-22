import { useState } from 'react';
import { Plus, Phone, Mail, MoreHorizontal, Users, UserCheck, UserX, ShieldCheck } from 'lucide-react';

const INITIAL_STAFF = [
  { id: 1, name: 'Bilel Mansouri',  role: 'manager',  email: 'bilel@restora.tn',   phone: '+216 55 001 001', status: 'active',   initials: 'BM', color: 'bg-blue-500' },
  { id: 2, name: 'Sana Hamdi',      role: 'cashier',  email: 'sana@restora.tn',    phone: '+216 55 002 002', status: 'active',   initials: 'SH', color: 'bg-pink-500' },
  { id: 3, name: 'Rami Khaled',     role: 'waiter',   email: 'rami@restora.tn',    phone: '+216 55 003 003', status: 'active',   initials: 'RK', color: 'bg-emerald-500' },
  { id: 4, name: 'Leila Trabelsi',  role: 'waiter',   email: 'leila@restora.tn',   phone: '+216 55 004 004', status: 'active',   initials: 'LT', color: 'bg-purple-500' },
  { id: 5, name: 'Omar Jebali',     role: 'kitchen',  email: 'omar@restora.tn',    phone: '+216 55 005 005', status: 'active',   initials: 'OJ', color: 'bg-orange-500' },
  { id: 6, name: 'Hana Bouaziz',    role: 'kitchen',  email: 'hana@restora.tn',    phone: '+216 55 006 006', status: 'inactive', initials: 'HB', color: 'bg-teal-500' },
  { id: 7, name: 'Karim Slim',      role: 'driver',   email: 'karim@restora.tn',   phone: '+216 55 007 007', status: 'active',   initials: 'KS', color: 'bg-amber-500' },
];

const ROLE_CONFIG = {
  manager: { label: 'Manager',  pill: 'bg-blue-50   text-blue-600   dark:bg-blue-500/10   dark:text-blue-400',   icon: ShieldCheck },
  cashier:  { label: 'Cashier',  pill: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400', icon: Users },
  waiter:   { label: 'Waiter',   pill: 'bg-teal-50   text-teal-600   dark:bg-teal-500/10   dark:text-teal-400',   icon: Users },
  kitchen:  { label: 'Kitchen',  pill: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400', icon: Users },
  driver:   { label: 'Driver',   pill: 'bg-amber-50  text-amber-600  dark:bg-amber-500/10  dark:text-amber-400',  icon: Users },
};

const TABS = ['All', 'Active', 'Inactive'];

const STATS = [
  { label: 'Total Staff',  value: '7', icon: Users,      color: 'text-orange-500',  bg: 'bg-orange-50 dark:bg-orange-500/10' },
  { label: 'Active Today', value: '6', icon: UserCheck,  color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  { label: 'Inactive',     value: '1', icon: UserX,      color: 'text-red-400',     bg: 'bg-red-50 dark:bg-red-500/10' },
  { label: 'Roles',        value: '5', icon: ShieldCheck,color: 'text-purple-500',  bg: 'bg-purple-50 dark:bg-purple-500/10' },
];

export default function Staff() {
  const [staff, setStaff] = useState(INITIAL_STAFF);
  const [tab, setTab]     = useState('All');

  const filtered = tab === 'All' ? staff
    : tab === 'Active'   ? staff.filter(s => s.status === 'active')
    : staff.filter(s => s.status === 'inactive');

  const toggleStatus = (id) =>
    setStaff(prev =>
      prev.map(s => s.id === id ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' } : s),
    );

  return (
    <div className="p-5 sm:p-6 space-y-6 max-w-[1440px]">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Staff</h1>
          <p className="text-xs text-gray-400 mt-0.5">Team management &amp; roles</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm shadow-orange-500/20">
          <Plus size={14} /> Add Member
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

      {/* Staff table */}
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
        <div className="hidden md:grid grid-cols-[1fr_90px_1fr_120px_80px_48px] gap-3 px-5 py-2.5 border-b border-gray-50 dark:border-white/4">
          {['Member', 'Role', 'Email', 'Phone', 'Status', ''].map(h => (
            <span key={h} className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{h}</span>
          ))}
        </div>

        <div className="divide-y divide-gray-50 dark:divide-white/4">
          {filtered.map(member => {
            const roleCfg = ROLE_CONFIG[member.role] ?? { label: member.role, pill: 'bg-gray-100 text-gray-500' };
            return (
              <div
                key={member.id}
                className="grid md:grid-cols-[1fr_90px_1fr_120px_80px_48px] gap-3 items-center px-5 py-4 hover:bg-gray-50/60 dark:hover:bg-white/2 transition-colors"
              >
                {/* Avatar + name */}
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 ${member.color} rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                    {member.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{member.name}</p>
                    <div className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${member.status === 'active' ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                      <span className="text-[10px] text-gray-400 capitalize">{member.status}</span>
                    </div>
                  </div>
                </div>

                {/* Role */}
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleCfg.pill} whitespace-nowrap`}>
                  {roleCfg.label}
                </span>

                {/* Email */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <Mail size={11} className="text-gray-400 shrink-0" />
                  <span className="text-xs text-gray-500 truncate">{member.email}</span>
                </div>

                {/* Phone */}
                <div className="flex items-center gap-1.5">
                  <Phone size={11} className="text-gray-400 shrink-0" />
                  <span className="text-xs text-gray-500">{member.phone}</span>
                </div>

                {/* Status toggle */}
                <button
                  onClick={() => toggleStatus(member.id)}
                  className={[
                    'text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-colors',
                    member.status === 'active'
                      ? 'border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                      : 'border-gray-200 dark:border-white/10 text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5',
                  ].join(' ')}
                >
                  {member.status === 'active' ? 'Active' : 'Inactive'}
                </button>

                {/* More menu */}
                <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/8 transition-colors">
                  <MoreHorizontal size={15} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
