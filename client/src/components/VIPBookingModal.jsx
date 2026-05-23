import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { X, ChevronRight, Crown, Users, Calendar, Clock, User, Phone, Mail, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import api from '../services/api';

const TIMES = [
  '12:00','12:30','13:00','13:30','14:00','14:30','19:00','19:30',
  '20:00','20:30','21:00','21:30','22:00','22:30',
];

function TableShape({ table, isBooked, isSelected, isHovered }) {
  const { shape, number, capacity, position } = table;
  const cx = position?.x ?? 100;
  const cy = position?.y ?? 100;
  const size = 44;

  const color = isSelected ? '#f97316' : isBooked ? '#ef4444' : '#10b981';
  const glowId = `glow-${table._id}`;
  const opacity = isBooked ? 0.35 : 1;

  return (
    <g opacity={opacity} style={{ cursor: isBooked ? 'not-allowed' : 'pointer' }}>
      <defs>
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={isSelected ? 8 : isHovered ? 5 : 3} result="blur" />
          <feFlood floodColor={color} floodOpacity="0.6" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <radialGradient id={`fill-${table._id}`} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor={isSelected ? '#fb923c' : isBooked ? '#7f1d1d' : '#065f46'} />
          <stop offset="100%" stopColor={isSelected ? '#c2410c' : isBooked ? '#450a0a' : '#022c22'} />
        </radialGradient>
      </defs>
      {shape === 'round' ? (
        <circle cx={cx} cy={cy} r={size / 2} fill={`url(#fill-${table._id})`} stroke={color} strokeWidth={isSelected ? 2.5 : 1.5} filter={`url(#${glowId})`} />
      ) : (
        <rect x={cx - size / 2} y={cy - size / 2} width={size} height={size} rx={8} fill={`url(#fill-${table._id})`} stroke={color} strokeWidth={isSelected ? 2.5 : 1.5} filter={`url(#${glowId})`} />
      )}
      <text x={cx} y={cy - 4} textAnchor="middle" fill="white" fontSize={11} fontWeight="700" style={{ userSelect: 'none', pointerEvents: 'none' }}>
        {number}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize={8} style={{ userSelect: 'none', pointerEvents: 'none' }}>
        {capacity}p
      </text>
    </g>
  );
}

function FloorPlan({ tables, bookedIds, selectedId, onSelect }) {
  const [hovered, setHovered] = useState(null);

  if (tables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-12">
        <Crown size={32} className="text-orange-500/40 mb-3" />
        <p className="text-sm text-white/40">Floor plan not configured</p>
        <p className="text-xs text-white/25 mt-1">The owner hasn&apos;t set up tables yet</p>
      </div>
    );
  }

  const allX = tables.map(t => t.position?.x ?? 100);
  const allY = tables.map(t => t.position?.y ?? 100);
  const minX = Math.max(0, Math.min(...allX) - 60);
  const minY = Math.max(0, Math.min(...allY) - 60);
  const maxX = Math.max(...allX) + 60;
  const maxY = Math.max(...allY) + 60;
  const vw = Math.max(400, maxX - minX);
  const vh = Math.max(300, maxY - minY);

  return (
    <div className="relative overflow-auto rounded-2xl" style={{ background: 'radial-gradient(ellipse at 50% 50%, #1a1a2e 0%, #0a0a0f 100%)', minHeight: 280 }}>
      {/* Ambient grid */}
      <svg width="100%" height="100%" className="absolute inset-0 opacity-10 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      <div className="p-4">
        <svg viewBox={`${minX} ${minY} ${vw} ${vh}`} className="w-full" style={{ maxHeight: 320 }}>
          {tables.map(t => {
            const isBooked = bookedIds.includes(t._id);
            return (
              <g
                key={t._id}
                onMouseEnter={() => !isBooked && setHovered(t._id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => !isBooked && onSelect(t._id === selectedId ? null : t._id)}
              >
                <TableShape
                  table={t}
                  isBooked={isBooked}
                  isSelected={selectedId === t._id}
                  isHovered={hovered === t._id}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 right-3 flex gap-3 text-[10px] text-white/50">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Available</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />Selected</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500/50 inline-block" />Booked</span>
      </div>
    </div>
  );
}

export default function VIPBookingModal({ slug, restaurantName, primaryColor = '#f97316', onClose }) {
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [step, setStep] = useState(1); // 1=floor+form, 2=success
  const [form, setForm] = useState({
    date: '', time: '', partySize: 2,
    customerName: '', customerPhone: '', customerEmail: '', notes: '',
  });
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Get floor plan
  const { data: tables = [] } = useQuery({
    queryKey: ['vip-tables', slug],
    queryFn: () => api.get(`/restaurants/${slug}/tables`).then(r => r.data.data ?? []),
    enabled: !!slug,
  });

  // Get availability
  const { data: availData } = useQuery({
    queryKey: ['vip-availability', slug, form.date, form.time],
    queryFn: () => api.get(`/restaurants/${slug}/tables/availability`, { params: { date: form.date, time: form.time } }).then(r => r.data.data),
    enabled: !!(slug && form.date && form.time),
  });

  const bookedIds = availData?.bookedTableIds ?? [];

  // Clear selection if becomes booked
  useEffect(() => {
    if (selectedTableId && bookedIds.includes(selectedTableId)) setSelectedTableId(null);
  }, [bookedIds, selectedTableId]);

  const selectedTable = tables.find(t => t._id === selectedTableId);

  const { mutate: book, isPending: booking } = useMutation({
    mutationFn: () => api.post(`/restaurants/${slug}/reservations`, {
      tableId: selectedTableId,
      ...form,
      partySize: Number(form.partySize),
    }),
    onSuccess: () => setStep(2),
    onError: (err) => toast.error(err.response?.data?.message || 'Booking failed. Please try again.'),
  });

  const canSubmit = form.date && form.time && form.partySize && form.customerName && form.customerPhone;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div
        className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a0a0f 100%)', border: '1px solid rgba(255,255,255,0.08)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/8"
             style={{ background: 'rgba(15,15,26,0.95)', backdropFilter: 'blur(20px)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: primaryColor + '22' }}>
              <Crown size={16} style={{ color: primaryColor }} />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">VIP Table Reservation</h2>
              <p className="text-[10px] text-white/40">{restaurantName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/8 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Success state */}
        {step === 2 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 animate-bounce"
                 style={{ backgroundColor: primaryColor + '22' }}>
              <CheckCircle2 size={36} style={{ color: primaryColor }} />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">Reservation Submitted!</h3>
            <p className="text-white/50 max-w-sm leading-relaxed">
              Thank you, <span className="text-white font-semibold">{form.customerName}</span>. We&apos;ll confirm your VIP table booking shortly.
            </p>
            {selectedTable && (
              <div className="mt-6 px-5 py-3 rounded-2xl border border-white/10 inline-flex items-center gap-3 text-sm">
                <Crown size={14} style={{ color: primaryColor }} />
                <span className="text-white/70">Table <span className="text-white font-bold">{selectedTable.number}</span> · {form.date} at {form.time} · {form.partySize} guests</span>
              </div>
            )}
            <button onClick={onClose} className="mt-8 px-8 py-3 rounded-2xl text-sm font-bold text-white transition-all hover:scale-105"
                    style={{ backgroundColor: primaryColor }}>
              Done
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-[1fr_340px] gap-0 divide-x divide-white/8">
            {/* Floor plan */}
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Select Your Table</h3>
                  {selectedTable ? (
                    <p className="text-sm font-semibold text-white">
                      Table <span style={{ color: primaryColor }}>{selectedTable.number}</span>
                      <span className="text-white/40 font-normal"> · seats {selectedTable.capacity}</span>
                    </p>
                  ) : (
                    <p className="text-sm text-white/30">Click on an available table</p>
                  )}
                </div>
                {selectedTableId && (
                  <button onClick={() => setSelectedTableId(null)} className="text-[10px] text-white/30 hover:text-white/60 transition-colors">
                    Clear
                  </button>
                )}
              </div>
              <FloorPlan
                tables={tables}
                bookedIds={bookedIds}
                selectedId={selectedTableId}
                onSelect={setSelectedTableId}
              />
            </div>

            {/* Booking form */}
            <div className="p-5 space-y-4">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">Reservation Details</h3>

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Date" icon={<Calendar size={13} />}>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={form.date}
                    onChange={e => setF('date', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-orange-400 transition-colors [color-scheme:dark]"
                  />
                </Field>
                <Field label="Time" icon={<Clock size={13} />}>
                  <select value={form.time} onChange={e => setF('time', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-orange-400 transition-colors [color-scheme:dark]">
                    <option value="">Pick time</option>
                    {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
              </div>

              {/* Guests */}
              <Field label="Number of Guests" icon={<Users size={13} />}>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setF('partySize', Math.max(1, form.partySize - 1))}
                          className="w-9 h-9 rounded-xl bg-white/8 text-white hover:bg-white/15 transition-colors font-bold text-lg leading-none flex items-center justify-center">−</button>
                  <span className="flex-1 text-center text-lg font-bold text-white">{form.partySize}</span>
                  <button type="button" onClick={() => setF('partySize', Math.min(selectedTable?.capacity ?? 20, form.partySize + 1))}
                          className="w-9 h-9 rounded-xl bg-white/8 text-white hover:bg-white/15 transition-colors font-bold text-lg leading-none flex items-center justify-center">+</button>
                </div>
              </Field>

              <div className="h-px bg-white/8" />

              {/* Guest info */}
              <Field label="Your Name" icon={<User size={13} />}>
                <input type="text" placeholder="Full name" value={form.customerName}
                       onChange={e => setF('customerName', e.target.value)}
                       className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-orange-400 transition-colors" />
              </Field>

              <Field label="Phone" icon={<Phone size={13} />}>
                <input type="tel" placeholder="+216 XX XXX XXX" value={form.customerPhone}
                       onChange={e => setF('customerPhone', e.target.value)}
                       className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-orange-400 transition-colors" />
              </Field>

              <Field label="Email (optional)" icon={<Mail size={13} />}>
                <input type="email" placeholder="your@email.com" value={form.customerEmail}
                       onChange={e => setF('customerEmail', e.target.value)}
                       className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-orange-400 transition-colors" />
              </Field>

              <Field label="Special Requests" icon={<FileText size={13} />}>
                <textarea placeholder="Allergies, occasion, preferences…" value={form.notes}
                          onChange={e => setF('notes', e.target.value)} rows={2}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-orange-400 transition-colors resize-none" />
              </Field>

              <button
                onClick={() => canSubmit && book()}
                disabled={!canSubmit || booking}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-black text-white transition-all hover:scale-[1.02] hover:shadow-2xl disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{ backgroundColor: primaryColor, boxShadow: canSubmit ? `0 8px 32px ${primaryColor}55` : 'none' }}
              >
                {booking ? <Loader2 size={16} className="animate-spin" /> : <Crown size={15} />}
                {booking ? 'Confirming…' : 'Confirm VIP Reservation'}
              </button>

              <p className="text-[10px] text-white/25 text-center leading-relaxed">
                We&apos;ll contact you to confirm your reservation
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, icon, children }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/35">
        {icon} {label}
      </label>
      {children}
    </div>
  );
}
