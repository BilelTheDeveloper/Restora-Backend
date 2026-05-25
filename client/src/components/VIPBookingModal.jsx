import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  X, Crown, Users, Calendar, Clock, User,
  Phone, Mail, FileText, CheckCircle2, Loader2, ChevronRight,
} from 'lucide-react';
import api from '../services/api';

// ── Time slots ──────────────────────────────────────────────────
const LUNCH  = ['12:00','12:30','13:00','13:30','14:00','14:30'];
const DINNER = ['19:00','19:30','20:00','20:30','21:00','21:30','22:00','22:30'];

// ── Geometry constants (identical to the builder) ───────────────
const ROUND_R   = 28;
const RECT_W    = 82;
const RECT_H    = 50;
const SQ_HALF   = 30;
const CHAIR_R   = 7;
const CHAIR_GAP = 6;
// PAD added around the room in the viewBox so edge-chairs are never clipped
const PAD = 56;

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

// ── Floor Plan ──────────────────────────────────────────────────
function FloorPlan({ tables, zones, room, bookedIds, selectedId, primaryColor, onSelect }) {
  const wrapRef = useRef();
  const [tooltip, setTooltip]    = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  if (!tables.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <Crown size={30} className="mb-3 opacity-20" style={{ color: primaryColor }}/>
        <p className="text-sm font-bold text-gray-400 mb-1">No tables configured</p>
        <p className="text-xs text-gray-300 max-w-[200px] leading-relaxed">
          Please contact the restaurant directly to reserve.
        </p>
      </div>
    );
  }

  // Build viewBox: room (or table-bounds) + padding so no chair is clipped
  let vx, vy, vw, vh;
  if (room) {
    vx = room.x - PAD;  vy = room.y - PAD;
    vw = room.w + PAD * 2; vh = room.h + PAD * 2;
  } else {
    const xs = tables.map(t => t.position?.x ?? 200);
    const ys = tables.map(t => t.position?.y ?? 200);
    vx = Math.max(0, Math.min(...xs) - PAD);
    vy = Math.max(0, Math.min(...ys) - PAD);
    vw = Math.max(500, Math.max(...xs) - vx + PAD);
    vh = Math.max(320, Math.max(...ys) - vy + PAD);
  }

  const onEnter = (e, t) => {
    if (bookedIds.includes(t._id)) return;
    const rect = wrapRef.current.getBoundingClientRect();
    setTooltip({
      table: t,
      zone:  findZone(t, zones),
      pctX: ((e.clientX - rect.left) / rect.width)  * 100,
      pctY: ((e.clientY - rect.top)  / rect.height) * 100,
    });
    setHoveredId(t._id);
  };
  const onLeave = () => { setTooltip(null); setHoveredId(null); };

  return (
    /*
     * The wrapper fills the space given by the parent (fixed height).
     * The SVG uses width+height 100% so it fills the wrapper, and
     * preserveAspectRatio="xMidYMid meet" scales the viewBox to fit
     * entirely inside without any clipping — the whole floor is always visible.
     */
    <div ref={wrapRef} className="relative w-full h-full rounded-xl overflow-hidden">
      <svg
        viewBox={`${vx} ${vy} ${vw} ${vh}`}
        preserveAspectRatio="xMidYMid meet"
        width="100%"
        height="100%"
        style={{ display: 'block' }}
        onMouseLeave={onLeave}
      >
        <defs>
          {/* Light wood plank floor */}
          <pattern id="fp-plank" width="88" height="18" patternUnits="userSpaceOnUse">
            <rect width="88" height="18" fill="#f5e7cc"/>
            <rect y="1" width="88" height="16" fill="#f8ecd3"/>
            <line x1="0" y1="0"  x2="88" y2="0"  stroke="#e0caA0" strokeWidth="1"/>
            <line x1="12" y1="7" x2="70" y2="7"  stroke="rgba(160,100,30,.06)" strokeWidth=".6"/>
            <line x1="30" y1="13" x2="80" y2="13" stroke="rgba(160,100,30,.04)" strokeWidth=".5"/>
          </pattern>
          <pattern id="fp-dot" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r=".7" fill="rgba(140,90,20,.16)"/>
          </pattern>

          {/* Per-table wood gradients */}
          {tables.map(t => (
            <radialGradient key={t._id} id={`ft-${t._id}`}
              cx="38%" cy="30%" r="70%" gradientUnits="objectBoundingBox">
              <stop offset="0%"   stopColor="#d4a055"/>
              <stop offset="55%"  stopColor="#a06830"/>
              <stop offset="100%" stopColor="#6b4218"/>
            </radialGradient>
          ))}

          {/* Glow filters */}
          <filter id="fp-sel" x="-55%" y="-55%" width="210%" height="210%">
            <feGaussianBlur stdDeviation="7" result="b"/>
            <feFlood floodColor={primaryColor} floodOpacity=".55" result="c"/>
            <feComposite in="c" in2="b" operator="in" result="g"/>
            <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="fp-hov" x="-45%" y="-45%" width="190%" height="190%">
            <feGaussianBlur stdDeviation="5" result="b"/>
            <feFlood floodColor="#c8860a" floodOpacity=".38" result="c"/>
            <feComposite in="c" in2="b" operator="in" result="g"/>
            <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* ── Outer linen ── */}
        <rect x={vx} y={vy} width={vw} height={vh} fill="#e8e0d0"/>

        {/* ── Room floor ── */}
        {room ? (
          <>
            <rect x={room.x} y={room.y} width={room.w} height={room.h} rx={10} fill="url(#fp-plank)"/>
            <rect x={room.x} y={room.y} width={room.w} height={room.h} rx={10}
              fill="url(#fp-dot)" style={{ pointerEvents:'none' }}/>
            <rect x={room.x} y={room.y} width={room.w} height={room.h} rx={10}
              fill="none" stroke="rgba(160,110,40,.35)" strokeWidth="1.5"
              style={{ pointerEvents:'none' }}/>
          </>
        ) : (
          <rect x={vx} y={vy} width={vw} height={vh} fill="url(#fp-plank)"/>
        )}

        {/* ── Zones ── */}
        {zones?.map(z => (
          <g key={z.id} style={{ pointerEvents:'none' }}>
            <rect x={z.x} y={z.y} width={z.w} height={z.h} rx={6}
              fill={z.color ?? '#f59e0b'} fillOpacity={.1}
              stroke={z.color ?? '#f59e0b'} strokeOpacity={.55}
              strokeWidth="1.2" strokeDasharray="6 3"/>
            {z.label && (
              <text x={z.x+10} y={z.y+16} fontSize={9} fontWeight="700"
                fill={z.color ?? '#f59e0b'} style={{ userSelect:'none' }}>
                {z.label}
              </text>
            )}
          </g>
        ))}

        {/* ── Tables ── */}
        {tables.map(t => {
          const tx = t.position?.x ?? 200;
          const ty = t.position?.y ?? 200;
          const isBooked = bookedIds.includes(t._id);
          const isSel    = selectedId === t._id;
          const isHov    = hoveredId  === t._id && !isSel;
          const { hw, hh } = tblHalf(t.shape);
          const chairs     = computeChairs(tx, ty, t.shape, t.capacity);
          const filt       = isSel ? 'url(#fp-sel)' : isHov ? 'url(#fp-hov)' : undefined;
          const fill       = isBooked ? '#c4bbb2' : isSel ? primaryColor : `url(#ft-${t._id})`;
          const stroke     = isSel ? primaryColor : isBooked ? '#aaa098' : '#8a5e22';
          const sw         = isSel ? 2.5 : 1.5;

          return (
            <g key={t._id}
              opacity={isBooked ? .42 : 1}
              style={{ cursor: isBooked ? 'not-allowed' : 'pointer' }}
              onClick={() => !isBooked && onSelect(t._id === selectedId ? null : t._id)}
              onMouseEnter={e => onEnter(e, t)}
              onMouseLeave={onLeave}
            >
              {chairs.map((c, i) => (
                <circle key={i} cx={c.x} cy={c.y} r={CHAIR_R}
                  fill={isBooked ? '#cfc8bf' : '#e8d5ae'}
                  stroke={isBooked ? '#b0a89a' : 'rgba(130,80,15,.48)'}
                  strokeWidth="1" style={{ pointerEvents:'none' }}/>
              ))}

              {t.shape === 'round' ? (
                <g filter={filt}>
                  <circle cx={tx} cy={ty} r={ROUND_R} fill={fill} stroke={stroke} strokeWidth={sw}/>
                  <circle cx={tx} cy={ty} r={ROUND_R*.6}
                    fill={isSel ? 'rgba(255,255,255,.22)' : 'rgba(255,245,225,.28)'}
                    style={{ pointerEvents:'none' }}/>
                </g>
              ) : t.shape === 'rectangle' ? (
                <g filter={filt}>
                  <rect x={tx-hw} y={ty-hh} width={hw*2} height={hh*2} rx={5}
                    fill={fill} stroke={stroke} strokeWidth={sw}/>
                  <rect x={tx-hw*.62} y={ty-hh*.62} width={hw*1.24} height={hh*1.24} rx={3}
                    fill={isSel ? 'rgba(255,255,255,.22)' : 'rgba(255,245,225,.28)'}
                    style={{ pointerEvents:'none' }}/>
                </g>
              ) : (
                <g filter={filt}>
                  <rect x={tx-hw} y={ty-hh} width={hw*2} height={hh*2} rx={7}
                    fill={fill} stroke={stroke} strokeWidth={sw}/>
                  <rect x={tx-hw*.62} y={ty-hh*.62} width={hw*1.24} height={hh*1.24} rx={5}
                    fill={isSel ? 'rgba(255,255,255,.22)' : 'rgba(255,245,225,.28)'}
                    style={{ pointerEvents:'none' }}/>
                </g>
              )}

              <text x={tx} y={ty-4} textAnchor="middle" fontSize={11} fontWeight="800"
                fill={isBooked ? '#999' : isSel ? '#fff' : '#2a1a06'}
                style={{ userSelect:'none', pointerEvents:'none' }}>
                {t.number}
              </text>
              <text x={tx} y={ty+10} textAnchor="middle" fontSize={8.5}
                fill={isBooked ? '#aaa' : isSel ? 'rgba(255,255,255,.7)' : 'rgba(60,35,8,.45)'}
                style={{ userSelect:'none', pointerEvents:'none' }}>
                {t.capacity}p
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div className="absolute z-30 pointer-events-none"
          style={{ left:`${tooltip.pctX}%`, top:`${tooltip.pctY}%`,
                   transform:'translate(-50%, calc(-100% - 10px))' }}>
          <div className="rounded-xl px-3.5 py-2.5 shadow-xl text-left min-w-[140px]"
            style={{ background:'#fff', border:'1px solid rgba(200,155,60,.3)',
                     boxShadow:'0 8px 24px rgba(0,0,0,.14)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Crown size={10} style={{ color: primaryColor }}/>
              <p className="text-xs font-black text-gray-900">Table {tooltip.table.number}</p>
            </div>
            <p className="text-[10px] text-gray-500 capitalize">
              {tooltip.table.capacity} guests · {tooltip.table.shape}
            </p>
            {tooltip.zone?.label && (
              <p className="text-[10px] font-bold mt-1" style={{ color: tooltip.zone.color ?? '#f59e0b' }}>
                {tooltip.zone.label}
              </p>
            )}
            <p className="text-[10px] text-emerald-600 font-semibold mt-1.5">Available · click to select</p>
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-3 h-2 overflow-hidden">
              <div className="w-3 h-3 bg-white rotate-45 -translate-y-1.5"
                style={{ border:'1px solid rgba(200,155,60,.3)' }}/>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-2 right-2.5 flex gap-3 text-[9px] font-semibold"
        style={{ color:'rgba(100,65,15,.55)' }}>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background:'#a06830' }}/>
          Available
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: primaryColor }}/>
          Selected
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-stone-300"/>
          Booked
        </span>
      </div>
    </div>
  );
}

// ── Modal ───────────────────────────────────────────────────────
export default function VIPBookingModal({ slug, restaurantName, primaryColor = '#f97316', onClose }) {
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    date: '', time: '', partySize: 2,
    customerName: '', customerPhone: '', customerEmail: '', notes: '',
  });
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const { data: floorData, isLoading: floorLoading } = useQuery({
    queryKey: ['vip-floor', slug],
    queryFn: () => api.get(`/restaurants/${slug}/tables`).then(r => {
      const raw = r.data;
      if (Array.isArray(raw)) return { tables: raw, zones: [], room: null };
      return raw ?? { tables: [], zones: [], room: null };
    }),
    enabled: !!slug,
  });
  const tables = floorData?.tables ?? [];
  const zones  = floorData?.zones  ?? [];
  const room   = floorData?.room   ?? null;

  const { data: availData } = useQuery({
    queryKey: ['vip-avail', slug, form.date, form.time],
    queryFn: () => api.get(`/restaurants/${slug}/tables/availability`, {
      params: { date: form.date, time: form.time },
    }).then(r => r.data),
    enabled: !!(slug && form.date && form.time),
  });
  const bookedIds = availData?.bookedTableIds ?? [];

  useEffect(() => {
    if (selectedTableId && bookedIds.includes(selectedTableId)) setSelectedTableId(null);
  }, [bookedIds, selectedTableId]);

  const selectedTable = tables.find(t => t._id === selectedTableId);

  const { mutate: book, isPending: booking } = useMutation({
    mutationFn: () => api.post(`/restaurants/${slug}/reservations`, {
      tableId: selectedTableId, ...form, partySize: Number(form.partySize),
    }),
    onSuccess: () => setStep(2),
    onError: err => toast.error(err.response?.data?.message || 'Booking failed. Please try again.'),
  });

  const canSubmit = form.date && form.time && form.partySize && form.customerName && form.customerPhone;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"/>

      <div
        className="relative w-full sm:max-w-5xl rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col"
        style={{
          background: '#fefcf8',
          border: '1px solid rgba(210,185,130,.3)',
          maxHeight: '94vh',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 shrink-0"
          style={{ borderBottom:'1px solid rgba(210,185,130,.2)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background:`${primaryColor}15`, border:`1px solid ${primaryColor}28` }}>
              <Crown size={16} style={{ color: primaryColor }}/>
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-900 leading-tight">VIP Table Reservation</h2>
              <p className="text-[10px] text-gray-400">{restaurantName}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-amber-50 transition-colors">
            <X size={18}/>
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 min-h-0 overflow-hidden">

          {step === 2 ? (
            /* Success */
            <div className="flex flex-col items-center justify-center h-full py-16 px-8 text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
                style={{ background:`${primaryColor}12`, border:`2px solid ${primaryColor}30` }}>
                <CheckCircle2 size={36} style={{ color: primaryColor }}/>
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">Reservation Submitted!</h3>
              <p className="text-gray-500 max-w-sm leading-relaxed text-sm">
                Thank you, <span className="text-gray-800 font-bold">{form.customerName}</span>.
                We&apos;ll confirm your VIP table booking shortly.
              </p>
              {selectedTable && (
                <div className="mt-6 px-5 py-3.5 rounded-2xl inline-flex items-center gap-3 text-sm"
                  style={{ background:`${primaryColor}08`, border:`1px solid ${primaryColor}22` }}>
                  <Crown size={13} style={{ color: primaryColor }}/>
                  <span className="text-gray-600">
                    Table <strong className="text-gray-900">{selectedTable.number}</strong>
                    {' · '}{form.date} at {form.time}{' · '}{form.partySize} guests
                  </span>
                </div>
              )}
              <button onClick={onClose}
                className="mt-8 px-10 py-3 rounded-2xl text-sm font-black text-white hover:scale-[1.03] transition-all"
                style={{ backgroundColor: primaryColor, boxShadow:`0 8px 28px ${primaryColor}45` }}>
                Done
              </button>
            </div>

          ) : (
            /* Step 1 — two-panel */
            <div className="grid lg:grid-cols-[1fr_340px] h-full">

              {/* ── Left: floor plan panel ── */}
              <div className="flex flex-col p-5 border-b lg:border-b-0 lg:border-r min-h-0"
                style={{ borderColor:'rgba(210,185,130,.2)' }}>

                {/* Sub-header */}
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-0.5"
                      style={{ color:`${primaryColor}99` }}>
                      Choose Your Table
                    </p>
                    {selectedTable ? (
                      <p className="text-sm font-bold text-gray-900">
                        Table <span style={{ color: primaryColor }}>{selectedTable.number}</span>
                        <span className="text-gray-400 font-normal"> · {selectedTable.capacity} seats</span>
                        {findZone(selectedTable, zones)?.label && (
                          <span className="text-gray-400 font-normal">
                            {' · '}{findZone(selectedTable, zones).label}
                          </span>
                        )}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400">
                        {floorLoading ? 'Loading…' : 'Click an available table to select it'}
                      </p>
                    )}
                  </div>
                  {selectedTableId && (
                    <button onClick={() => setSelectedTableId(null)}
                      className="text-[10px] text-gray-400 hover:text-gray-700 border border-gray-200 rounded-lg px-2.5 py-1 transition-colors">
                      Clear
                    </button>
                  )}
                </div>

                {/*
                  Floor plan box: flex-1 so it fills remaining height in this column.
                  The SVG inside uses width=100% height=100% + preserveAspectRatio="xMidYMid meet"
                  so the ENTIRE room is always visible, scaled to fit the box.
                */}
                <div className="flex-1 min-h-0 rounded-xl overflow-hidden"
                  style={{ background:'#e8e0d0', minHeight: 220 }}>
                  {floorLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 size={22} className="animate-spin" style={{ color: primaryColor }}/>
                    </div>
                  ) : (
                    <FloorPlan
                      tables={tables} zones={zones} room={room}
                      bookedIds={bookedIds} selectedId={selectedTableId}
                      primaryColor={primaryColor} onSelect={setSelectedTableId}
                    />
                  )}
                </div>

                {!form.date && tables.length > 0 && (
                  <p className="mt-2.5 text-center text-[11px] font-medium shrink-0"
                    style={{ color:`${primaryColor}70` }}>
                    Pick a date &amp; time on the right to see availability
                  </p>
                )}
              </div>

              {/* ── Right: form panel ── */}
              <div className="flex flex-col overflow-y-auto p-5 gap-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 shrink-0">
                  Reservation Details
                </p>

                {/* Date */}
                <Field label="Date" icon={<Calendar size={12} style={{ color: primaryColor }}/>}>
                  <input type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={form.date}
                    onChange={e => setF('date', e.target.value)}
                    className="w-full rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none"
                    style={{ background:'#faf5eb', border:'1px solid rgba(200,155,60,.3)' }}
                  />
                </Field>

                {/* Time */}
                <Field label="Time" icon={<Clock size={12} style={{ color: primaryColor }}/>}>
                  <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-300">Lunch</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {LUNCH.map(t => (
                        <Chip key={t} label={t} active={form.time===t}
                          primary={primaryColor} onClick={() => setF('time', t)}/>
                      ))}
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-300 pt-1">Dinner</p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {DINNER.map(t => (
                        <Chip key={t} label={t} active={form.time===t}
                          primary={primaryColor} onClick={() => setF('time', t)}/>
                      ))}
                    </div>
                  </div>
                </Field>

                {/* Guests */}
                <Field label="Guests" icon={<Users size={12} style={{ color: primaryColor }}/>}>
                  <div className="flex items-center gap-3">
                    <StepBtn onClick={() => setF('partySize', Math.max(1, form.partySize - 1))}>−</StepBtn>
                    <span className="flex-1 text-center text-base font-black text-gray-900">{form.partySize}</span>
                    <StepBtn onClick={() => setF('partySize', Math.min(selectedTable?.capacity ?? 20, form.partySize + 1))}>+</StepBtn>
                  </div>
                </Field>

                <div className="h-px bg-amber-100 shrink-0"/>

                {/* Contact */}
                <Field label="Your Name" icon={<User size={12} style={{ color: primaryColor }}/>}>
                  <Input type="text" placeholder="Full name"
                    value={form.customerName} onChange={e => setF('customerName', e.target.value)}/>
                </Field>
                <Field label="Phone" icon={<Phone size={12} style={{ color: primaryColor }}/>}>
                  <Input type="tel" placeholder="+216 XX XXX XXX"
                    value={form.customerPhone} onChange={e => setF('customerPhone', e.target.value)}/>
                </Field>
                <Field label="Email (optional)" icon={<Mail size={12} style={{ color: primaryColor }}/>}>
                  <Input type="email" placeholder="your@email.com"
                    value={form.customerEmail} onChange={e => setF('customerEmail', e.target.value)}/>
                </Field>
                <Field label="Special Requests" icon={<FileText size={12} style={{ color: primaryColor }}/>}>
                  <textarea rows={2} placeholder="Allergies, occasion, preferences…"
                    value={form.notes} onChange={e => setF('notes', e.target.value)}
                    className="w-full rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-amber-900/25 outline-none resize-none"
                    style={{ background:'#faf5eb', border:'1px solid rgba(200,155,60,.3)' }}/>
                </Field>

                {/* Submit */}
                <button
                  onClick={() => canSubmit && book()}
                  disabled={!canSubmit || booking}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-black text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: canSubmit ? primaryColor : '#c8b480',
                    boxShadow: canSubmit ? `0 6px 24px ${primaryColor}40` : 'none',
                  }}
                >
                  {booking ? <Loader2 size={15} className="animate-spin"/> : <Crown size={14}/>}
                  {booking ? 'Confirming…' : 'Confirm VIP Reservation'}
                  {!booking && <ChevronRight size={14}/>}
                </button>
                <p className="text-[10px] text-amber-900/30 text-center -mt-2 shrink-0">
                  We&apos;ll contact you to confirm. No payment required now.
                </p>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Small UI helpers ────────────────────────────────────────────
function Field({ label, icon, children }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest"
        style={{ color:'rgba(130,85,20,.55)' }}>
        {icon}{label}
      </label>
      {children}
    </div>
  );
}

function Input({ type, placeholder, value, onChange }) {
  return (
    <input type={type} placeholder={placeholder} value={value} onChange={onChange}
      className="w-full rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-amber-900/25 outline-none"
      style={{ background:'#faf5eb', border:'1px solid rgba(200,155,60,.3)' }}/>
  );
}

function Chip({ label, active, primary, onClick }) {
  return (
    <button onClick={onClick}
      className="py-1.5 rounded-lg text-[11px] font-bold transition-all"
      style={active
        ? { background: primary, color:'#fff', boxShadow:`0 3px 10px ${primary}45` }
        : { background:'#faf5eb', color:'#7a4e18', border:'1px solid rgba(200,155,60,.28)' }
      }>
      {label}
    </button>
  );
}

function StepBtn({ children, onClick }) {
  return (
    <button onClick={onClick}
      className="w-9 h-9 rounded-xl font-bold text-lg flex items-center justify-center text-gray-700 hover:bg-amber-50 transition-colors"
      style={{ background:'#faf5eb', border:'1px solid rgba(200,155,60,.28)' }}>
      {children}
    </button>
  );
}
