import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  X, Crown, Users, Calendar, Clock, User,
  Phone, Mail, FileText, CheckCircle2, Loader2, ChevronRight,
} from 'lucide-react';
import api from '../services/api';

// ── Time slots ─────────────────────────────────────────────────
const TIMES = [
  '12:00','12:30','13:00','13:30','14:00','14:30',
  '19:00','19:30','20:00','20:30','21:00','21:30','22:00','22:30',
];

// ── Floor geometry (mirrors builder) ───────────────────────────
const ROUND_R   = 28;
const RECT_W    = 82;
const RECT_H    = 50;
const SQ_HALF   = 30;
const CHAIR_R   = 7;
const CHAIR_GAP = 6;

function tblHalf(shape) {
  if (shape === 'round')     return { hw: ROUND_R,    hh: ROUND_R };
  if (shape === 'rectangle') return { hw: RECT_W / 2, hh: RECT_H / 2 };
  return { hw: SQ_HALF, hh: SQ_HALF };
}

function computeChairs(cx, cy, shape, capacity) {
  const cap = Math.min(capacity, 12);
  if (cap <= 0) return [];
  const chairs = [];
  if (shape === 'round') {
    const r = ROUND_R + CHAIR_GAP + CHAIR_R;
    for (let i = 0; i < cap; i++) {
      const a = (2 * Math.PI * i / cap) - Math.PI / 2;
      chairs.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
    }
  } else {
    const { hw, hh } = tblHalf(shape);
    const off  = CHAIR_GAP + CHAIR_R;
    const tCap = Math.max(1, Math.round(cap * hw / (hw + hh)));
    const sCap = Math.floor((cap - tCap * 2) / 2);
    const aTop = Math.ceil((cap - sCap * 2) / 2);
    const aBot = Math.floor((cap - sCap * 2) / 2);
    for (let i = 0; i < aTop; i++)
      chairs.push({ x: cx - hw + (2*hw)*(i+0.5)/aTop,  y: cy - hh - off });
    for (let i = 0; i < aBot; i++)
      chairs.push({ x: cx - hw + (2*hw)*(i+0.5)/aBot,  y: cy + hh + off });
    for (let i = 0; i < sCap; i++)
      chairs.push({ x: cx - hw - off, y: cy - hh + (2*hh)*(i+0.5)/sCap });
    for (let i = 0; i < sCap; i++)
      chairs.push({ x: cx + hw + off, y: cy - hh + (2*hh)*(i+0.5)/sCap });
  }
  return chairs;
}

function findZone(t, zones) {
  const cx = t.position?.x ?? 0;
  const cy = t.position?.y ?? 0;
  return zones?.find(z => cx >= z.x && cx <= z.x + z.w && cy >= z.y && cy <= z.y + z.h);
}

// ── Floor Plan SVG ─────────────────────────────────────────────
function FloorPlan({ tables, zones, room, bookedIds, selectedId, primaryColor, onSelect }) {
  const containerRef = useRef();
  const [tooltip, setTooltip] = useState(null); // { table, zone, pctX, pctY }

  if (!tables.length) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center px-6">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: `${primaryColor}12` }}>
          <Crown size={28} style={{ color: primaryColor, opacity: 0.5 }}/>
        </div>
        <p className="text-sm font-bold text-amber-900/50 mb-1">No tables available</p>
        <p className="text-xs text-amber-900/30 leading-relaxed max-w-[200px]">
          VIP booking is not yet configured for this restaurant. Please contact us directly to reserve.
        </p>
      </div>
    );
  }

  // Compute viewBox from room or table bounds
  let vx, vy, vw, vh;
  if (room) {
    vx = room.x - 24; vy = room.y - 24;
    vw = room.w + 48; vh = room.h + 48;
  } else {
    const allX = tables.map(t => t.position?.x ?? 100);
    const allY = tables.map(t => t.position?.y ?? 100);
    vx = Math.max(0, Math.min(...allX) - 70);
    vy = Math.max(0, Math.min(...allY) - 70);
    vw = Math.max(400, Math.max(...allX) - vx + 70);
    vh = Math.max(300, Math.max(...allY) - vy + 70);
  }

  const handleTableEnter = (e, t) => {
    if (bookedIds.includes(t._id)) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pctX = ((e.clientX - rect.left) / rect.width)  * 100;
    const pctY = ((e.clientY - rect.top)  / rect.height) * 100;
    const zone = findZone(t, zones);
    setTooltip({ table: t, zone, pctX, pctY });
  };

  return (
    <div ref={containerRef} className="relative rounded-2xl overflow-hidden" style={{ background: '#faf7f2' }}>
      <svg
        viewBox={`${vx} ${vy} ${vw} ${vh}`}
        className="w-full"
        style={{ maxHeight: 340, display: 'block' }}
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          {/* Light wood plank floor */}
          <pattern id="pub-floor" width="90" height="18" patternUnits="userSpaceOnUse">
            <rect width="90" height="18" fill="#f5e7cc"/>
            <rect y="1" width="90" height="17" fill="#f7ebd0"/>
            <line x1="0" y1="0" x2="90" y2="0" stroke="#e4cfaa" strokeWidth="1"/>
            <line x1="10" y1="6" x2="68" y2="6" stroke="rgba(150,110,50,0.07)" strokeWidth="0.7"/>
            <line x1="26" y1="13" x2="80" y2="13" stroke="rgba(150,110,50,0.05)" strokeWidth="0.5"/>
          </pattern>
          {/* Grid dots */}
          <pattern id="pub-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="0.6" fill="rgba(150,110,50,0.12)"/>
          </pattern>
          {/* Table wood gradients */}
          {tables.map(t => (
            <radialGradient key={`g-${t._id}`} id={`ptbl-${t._id}`} cx="38%" cy="32%" r="68%" gradientUnits="objectBoundingBox">
              <stop offset="0%"   stopColor="#c8a266"/>
              <stop offset="60%"  stopColor="#9a6c38"/>
              <stop offset="100%" stopColor="#6b4a1e"/>
            </radialGradient>
          ))}
          {/* Selected glow */}
          <filter id="pub-sel" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="b"/>
            <feFlood floodColor={primaryColor} floodOpacity="0.55" result="c"/>
            <feComposite in="c" in2="b" operator="in" result="g"/>
            <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          {/* Hover ring */}
          <filter id="pub-hov" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="b"/>
            <feFlood floodColor="#d4a050" floodOpacity="0.45" result="c"/>
            <feComposite in="c" in2="b" operator="in" result="g"/>
            <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Room floor */}
        {room && (
          <>
            <rect x={room.x} y={room.y} width={room.w} height={room.h} rx={8} fill="url(#pub-floor)"/>
            <rect x={room.x} y={room.y} width={room.w} height={room.h} rx={8} fill="url(#pub-grid)" style={{ pointerEvents: 'none' }}/>
            <rect x={room.x} y={room.y} width={room.w} height={room.h} rx={8}
              fill="none" stroke="rgba(160,120,60,0.25)" strokeWidth="1.5"
              style={{ pointerEvents: 'none' }}/>
          </>
        )}

        {/* Zones */}
        {zones?.map(z => (
          <g key={z.id}>
            <rect x={z.x} y={z.y} width={z.w} height={z.h} rx={5}
              fill={z.color ?? '#f59e0b'} fillOpacity={0.1}
              stroke={z.color ?? '#f59e0b'} strokeOpacity={0.3}
              strokeWidth="1"
              style={{ pointerEvents: 'none' }}
            />
            {z.label && (
              <text x={z.x + 8} y={z.y + 14} fontSize={9} fontWeight="700"
                fill={z.color ?? '#f59e0b'} fillOpacity={0.7}
                style={{ userSelect: 'none', pointerEvents: 'none' }}>
                {z.label}
              </text>
            )}
          </g>
        ))}

        {/* Tables */}
        {tables.map(t => {
          const tx       = t.position?.x ?? 100;
          const ty       = t.position?.y ?? 100;
          const isBooked = bookedIds.includes(t._id);
          const isSel    = selectedId === t._id;
          const { hw, hh } = tblHalf(t.shape);
          const chairs   = computeChairs(tx, ty, t.shape, t.capacity);
          const filt     = isSel ? 'url(#pub-sel)' : undefined;

          return (
            <g
              key={t._id}
              opacity={isBooked ? 0.38 : 1}
              style={{ cursor: isBooked ? 'not-allowed' : 'pointer' }}
              onClick={() => !isBooked && onSelect(t._id === selectedId ? null : t._id)}
              onMouseEnter={e => !isBooked && handleTableEnter(e, t)}
              onMouseLeave={() => setTooltip(null)}
            >
              {/* Chairs */}
              {chairs.map((c, i) => (
                <circle key={i} cx={c.x} cy={c.y} r={CHAIR_R}
                  fill={isBooked ? '#d0c8c0' : '#f0e0c4'}
                  stroke={isBooked ? '#b8b0a8' : 'rgba(160,110,40,0.45)'}
                  strokeWidth="1"
                  style={{ pointerEvents: 'none' }}
                />
              ))}

              {/* Table surface */}
              {t.shape === 'round' ? (
                <g filter={filt}>
                  <circle cx={tx} cy={ty} r={ROUND_R}
                    fill={isBooked ? '#c8bfb6' : isSel ? primaryColor : `url(#ptbl-${t._id})`}
                    stroke={isSel ? primaryColor : isBooked ? '#a8a099' : '#9a6c38'}
                    strokeWidth={isSel ? 2.5 : 1.5}/>
                  <circle cx={tx} cy={ty} r={ROUND_R * 0.62}
                    fill={isSel ? 'rgba(255,255,255,0.22)' : 'rgba(255,250,240,0.2)'}
                    style={{ pointerEvents: 'none' }}/>
                </g>
              ) : t.shape === 'rectangle' ? (
                <g filter={filt}>
                  <rect x={tx - hw} y={ty - hh} width={hw*2} height={hh*2} rx={5}
                    fill={isBooked ? '#c8bfb6' : isSel ? primaryColor : `url(#ptbl-${t._id})`}
                    stroke={isSel ? primaryColor : isBooked ? '#a8a099' : '#9a6c38'}
                    strokeWidth={isSel ? 2.5 : 1.5}/>
                  <rect x={tx - hw*0.62} y={ty - hh*0.62} width={hw*1.24} height={hh*1.24} rx={3}
                    fill={isSel ? 'rgba(255,255,255,0.22)' : 'rgba(255,250,240,0.2)'}
                    style={{ pointerEvents: 'none' }}/>
                </g>
              ) : (
                <g filter={filt}>
                  <rect x={tx - hw} y={ty - hh} width={hw*2} height={hh*2} rx={7}
                    fill={isBooked ? '#c8bfb6' : isSel ? primaryColor : `url(#ptbl-${t._id})`}
                    stroke={isSel ? primaryColor : isBooked ? '#a8a099' : '#9a6c38'}
                    strokeWidth={isSel ? 2.5 : 1.5}/>
                  <rect x={tx - hw*0.62} y={ty - hh*0.62} width={hw*1.24} height={hh*1.24} rx={5}
                    fill={isSel ? 'rgba(255,255,255,0.22)' : 'rgba(255,250,240,0.2)'}
                    style={{ pointerEvents: 'none' }}/>
                </g>
              )}

              {/* Table number */}
              <text x={tx} y={ty - 4} textAnchor="middle"
                fill={isBooked ? '#9a9290' : isSel ? '#fff' : 'rgba(50,30,5,0.85)'}
                fontSize={11} fontWeight="800"
                style={{ userSelect: 'none', pointerEvents: 'none' }}>
                {t.number}
              </text>
              <text x={tx} y={ty + 10} textAnchor="middle"
                fill={isBooked ? '#9a9290' : isSel ? 'rgba(255,255,255,0.7)' : 'rgba(50,30,5,0.45)'}
                fontSize={8.5}
                style={{ userSelect: 'none', pointerEvents: 'none' }}>
                {t.capacity}p
              </text>
            </g>
          );
        })}
      </svg>

      {/* Hover tooltip */}
      {tooltip && (
        <div
          className="absolute z-20 pointer-events-none"
          style={{ left: `${tooltip.pctX}%`, top: `${tooltip.pctY}%`, transform: 'translate(-50%, calc(-100% - 14px))' }}
        >
          <div className="bg-white shadow-xl rounded-2xl px-3.5 py-2.5 border border-amber-100 text-left min-w-[130px]">
            <div className="flex items-center gap-1.5 mb-1">
              <Crown size={10} style={{ color: primaryColor }}/>
              <p className="text-xs font-black text-gray-800">Table {tooltip.table.number}</p>
            </div>
            <p className="text-[10px] text-gray-500 font-medium capitalize">{tooltip.table.capacity} guests · {tooltip.table.shape}</p>
            {tooltip.zone?.label && (
              <p className="text-[10px] font-bold mt-1" style={{ color: tooltip.zone.color ?? '#f59e0b' }}>
                {tooltip.zone.label}
              </p>
            )}
            <p className="text-[10px] text-emerald-600 font-semibold mt-1.5">Available — click to select</p>
            {/* Tooltip arrow */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-3 h-2 overflow-hidden">
              <div className="w-3 h-3 bg-white border-r border-b border-amber-100 rotate-45 -translate-y-1.5 translate-x-0"/>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-3 right-3 flex gap-3 text-[9px] text-amber-900/50 font-medium">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-700 inline-block"/>Available
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: primaryColor }}/>Selected
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-stone-400/50 inline-block"/>Booked
        </span>
      </div>
    </div>
  );
}

// ── Booking Modal ──────────────────────────────────────────────
export default function VIPBookingModal({ slug, restaurantName, primaryColor = '#f97316', onClose }) {
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    date: '', time: '', partySize: 2,
    customerName: '', customerPhone: '', customerEmail: '', notes: '',
  });
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Fetch floor plan — handles both old (array) and new ({ tables, zones, room }) API shape
  const { data: floorData } = useQuery({
    queryKey: ['vip-floor', slug],
    queryFn: () => api.get(`/restaurants/${slug}/tables`).then(r => {
      const raw = r.data.data;
      if (Array.isArray(raw)) return { tables: raw, zones: [], room: null };
      return raw ?? { tables: [], zones: [], room: null };
    }),
    enabled: !!slug,
  });
  const tables = floorData?.tables ?? [];
  const zones  = floorData?.zones  ?? [];
  const room   = floorData?.room   ?? null;

  // Availability
  const { data: availData } = useQuery({
    queryKey: ['vip-avail', slug, form.date, form.time],
    queryFn: () => api.get(`/restaurants/${slug}/tables/availability`, {
      params: { date: form.date, time: form.time },
    }).then(r => r.data.data),
    enabled: !!(slug && form.date && form.time),
  });
  const bookedIds = availData?.bookedTableIds ?? [];

  // Clear selection if it becomes booked
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"/>
      <div
        className="relative w-full max-w-5xl max-h-[94vh] overflow-y-auto rounded-3xl shadow-2xl"
        style={{ background: '#fefcf8', border: '1px solid rgba(200,160,80,0.18)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b"
          style={{ background: 'rgba(254,252,248,0.96)', backdropFilter: 'blur(20px)', borderColor: 'rgba(200,160,80,0.15)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: primaryColor + '18' }}>
              <Crown size={16} style={{ color: primaryColor }}/>
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-900">VIP Table Reservation</h2>
              <p className="text-[10px] text-gray-400">{restaurantName}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-amber-50 transition-colors">
            <X size={18}/>
          </button>
        </div>

        {/* Step 2 — Success */}
        {step === 2 ? (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
              style={{ background: `${primaryColor}15` }}>
              <CheckCircle2 size={38} style={{ color: primaryColor }}/>
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Reservation Submitted!</h3>
            <p className="text-gray-500 max-w-sm leading-relaxed text-sm">
              Thank you, <span className="text-gray-800 font-bold">{form.customerName}</span>.
              We&apos;ll confirm your VIP table booking shortly.
            </p>
            {selectedTable && (
              <div className="mt-6 px-5 py-3 rounded-2xl border inline-flex items-center gap-3 text-sm"
                style={{ background: `${primaryColor}08`, borderColor: `${primaryColor}25` }}>
                <Crown size={13} style={{ color: primaryColor }}/>
                <span className="text-gray-600">Table <strong className="text-gray-900">{selectedTable.number}</strong> · {form.date} at {form.time} · {form.partySize} guests</span>
              </div>
            )}
            <button onClick={onClose}
              className="mt-8 px-10 py-3 rounded-2xl text-sm font-bold text-white transition-all hover:scale-[1.03]"
              style={{ backgroundColor: primaryColor, boxShadow: `0 8px 32px ${primaryColor}45` }}>
              Done
            </button>
          </div>

        ) : (
          /* Step 1 — Floor + Form */
          <div className="grid lg:grid-cols-[1fr_340px]">

            {/* Floor plan side */}
            <div className="p-5 border-b lg:border-b-0 lg:border-r" style={{ borderColor: 'rgba(200,160,80,0.15)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-800/50 mb-0.5">
                    Choose Your Table
                  </h3>
                  {selectedTable ? (
                    <p className="text-sm font-bold text-gray-900">
                      Table <span style={{ color: primaryColor }}>{selectedTable.number}</span>
                      <span className="text-gray-400 font-normal"> · {selectedTable.capacity} seats</span>
                      {findZone(selectedTable, zones)?.label && (
                        <span className="text-gray-400 font-normal"> · {findZone(selectedTable, zones).label}</span>
                      )}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400">Click an available table on the floor plan</p>
                  )}
                </div>
                {selectedTableId && (
                  <button onClick={() => setSelectedTableId(null)}
                    className="text-[10px] text-gray-400 hover:text-gray-700 transition-colors border border-gray-200 rounded-lg px-2.5 py-1 hover:border-gray-400">
                    Clear
                  </button>
                )}
              </div>

              <FloorPlan
                tables={tables}
                zones={zones}
                room={room}
                bookedIds={bookedIds}
                selectedId={selectedTableId}
                primaryColor={primaryColor}
                onSelect={setSelectedTableId}
              />

              {/* Date + time prompt below floor */}
              {!form.date && (
                <p className="mt-3 text-center text-[11px] text-amber-700/50 font-medium">
                  Select a date & time to see availability
                </p>
              )}
            </div>

            {/* Booking form */}
            <div className="p-5 space-y-4 overflow-y-auto">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-800/50">Reservation Details</h3>

              {/* Date */}
              <FormField label="Date" icon={<Calendar size={12} className="text-amber-600"/>}>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={form.date}
                  onChange={e => setF('date', e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none transition-colors"
                  style={{ background: '#faf6ef', border: '1px solid rgba(200,160,80,0.3)' }}
                />
              </FormField>

              {/* Time chips */}
              <FormField label="Time" icon={<Clock size={12} className="text-amber-600"/>}>
                <div className="grid grid-cols-4 gap-1.5">
                  {TIMES.map(t => (
                    <button key={t} onClick={() => setF('time', t)}
                      className="py-1.5 rounded-lg text-[11px] font-bold transition-all"
                      style={form.time === t
                        ? { background: primaryColor, color: '#fff', boxShadow: `0 4px 12px ${primaryColor}40` }
                        : { background: '#faf6ef', color: '#5a4020', border: '1px solid rgba(200,160,80,0.25)' }
                      }>
                      {t}
                    </button>
                  ))}
                </div>
              </FormField>

              {/* Party size */}
              <FormField label="Guests" icon={<Users size={12} className="text-amber-600"/>}>
                <div className="flex items-center gap-3">
                  <button onClick={() => setF('partySize', Math.max(1, form.partySize - 1))}
                    className="w-9 h-9 rounded-xl font-bold text-lg flex items-center justify-center transition-colors"
                    style={{ background: '#faf6ef', color: '#5a4020', border: '1px solid rgba(200,160,80,0.25)' }}>−</button>
                  <span className="flex-1 text-center text-base font-black text-gray-900">{form.partySize}</span>
                  <button onClick={() => setF('partySize', Math.min(selectedTable?.capacity ?? 20, form.partySize + 1))}
                    className="w-9 h-9 rounded-xl font-bold text-lg flex items-center justify-center transition-colors"
                    style={{ background: '#faf6ef', color: '#5a4020', border: '1px solid rgba(200,160,80,0.25)' }}>+</button>
                </div>
              </FormField>

              <div className="h-px" style={{ background: 'rgba(200,160,80,0.15)' }}/>

              {/* Contact */}
              <FormField label="Your Name" icon={<User size={12} className="text-amber-600"/>}>
                <input type="text" placeholder="Full name" value={form.customerName}
                  onChange={e => setF('customerName', e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-amber-900/25 outline-none transition-colors"
                  style={{ background: '#faf6ef', border: '1px solid rgba(200,160,80,0.3)' }}
                />
              </FormField>
              <FormField label="Phone" icon={<Phone size={12} className="text-amber-600"/>}>
                <input type="tel" placeholder="+216 XX XXX XXX" value={form.customerPhone}
                  onChange={e => setF('customerPhone', e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-amber-900/25 outline-none transition-colors"
                  style={{ background: '#faf6ef', border: '1px solid rgba(200,160,80,0.3)' }}
                />
              </FormField>
              <FormField label="Email (optional)" icon={<Mail size={12} className="text-amber-600"/>}>
                <input type="email" placeholder="your@email.com" value={form.customerEmail}
                  onChange={e => setF('customerEmail', e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-amber-900/25 outline-none transition-colors"
                  style={{ background: '#faf6ef', border: '1px solid rgba(200,160,80,0.3)' }}
                />
              </FormField>
              <FormField label="Special Requests" icon={<FileText size={12} className="text-amber-600"/>}>
                <textarea placeholder="Allergies, occasion, preferences…" value={form.notes}
                  onChange={e => setF('notes', e.target.value)} rows={2}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-amber-900/25 outline-none resize-none transition-colors"
                  style={{ background: '#faf6ef', border: '1px solid rgba(200,160,80,0.3)' }}
                />
              </FormField>

              {/* Submit */}
              <button
                onClick={() => canSubmit && book()}
                disabled={!canSubmit || booking}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-black text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: canSubmit ? primaryColor : '#d4c4a4',
                  boxShadow: canSubmit ? `0 8px 28px ${primaryColor}40` : 'none',
                  transform: canSubmit && !booking ? undefined : undefined,
                }}
              >
                {booking ? <Loader2 size={16} className="animate-spin"/> : <Crown size={14}/>}
                {booking ? 'Confirming…' : 'Confirm VIP Reservation'}
                {!booking && <ChevronRight size={14}/>}
              </button>

              <p className="text-[10px] text-amber-900/30 text-center leading-relaxed">
                We&apos;ll contact you to confirm. No payment required now.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FormField({ label, icon, children }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-800/50">
        {icon} {label}
      </label>
      {children}
    </div>
  );
}
