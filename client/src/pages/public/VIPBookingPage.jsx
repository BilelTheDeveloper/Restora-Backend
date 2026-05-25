import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast, { Toaster } from 'react-hot-toast';
import {
  ArrowLeft, Crown, Users, Calendar, Clock,
  User, Phone, Mail, FileText, CheckCircle2,
  Loader2, ChevronRight, MapPin, Layers,
} from 'lucide-react';
import api from '../../services/api';

// ── Geometry constants ── identical to builder ─────────────────
const CHAIR_R   = 7;
const CHAIR_GAP = 6;
const WALL_T    = 14;
const PAD       = 60;

const LUNCH  = ['12:00','12:30','13:00','13:30','14:00','14:30'];
const DINNER = ['19:00','19:30','20:00','20:30','21:00','21:30','22:00','22:30'];

function tblHalf(shape, cap = 4) {
  if (shape === 'round') {
    if (cap <= 2) return { hw: 20, hh: 20 };
    if (cap <= 4) return { hw: 28, hh: 28 };
    if (cap <= 6) return { hw: 34, hh: 34 };
    return { hw: 40, hh: 40 };
  }
  if (shape === 'rectangle' || shape === 'banquet') {
    if (cap <= 4)  return { hw: 41, hh: 26 };
    if (cap <= 6)  return { hw: 55, hh: 28 };
    if (cap <= 8)  return { hw: 68, hh: 30 };
    return { hw: 100, hh: 30 };
  }
  // square
  if (cap <= 2) return { hw: 22, hh: 22 };
  return { hw: 30, hh: 30 };
}

function chairs(cx, cy, shape, cap) {
  cap = Math.min(cap, 12);
  if (cap <= 0) return [];
  const out = [];
  const { hw, hh } = tblHalf(shape, cap);
  if (shape === 'round') {
    const r = hw + CHAIR_GAP + CHAIR_R;
    for (let i = 0; i < cap; i++) {
      const a = (2 * Math.PI * i / cap) - Math.PI / 2;
      out.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
    }
  } else {
    const off  = CHAIR_GAP + CHAIR_R;
    const tCap = Math.max(1, Math.round(cap * hw / (hw + hh)));
    const sCap = Math.floor((cap - tCap * 2) / 2);
    const aTop = Math.ceil((cap - sCap * 2) / 2);
    const aBot = Math.floor((cap - sCap * 2) / 2);
    for (let i = 0; i < aTop; i++) out.push({ x: cx - hw + (2*hw)*(i+0.5)/aTop, y: cy - hh - off });
    for (let i = 0; i < aBot; i++) out.push({ x: cx - hw + (2*hw)*(i+0.5)/aBot, y: cy + hh + off });
    for (let i = 0; i < sCap; i++) out.push({ x: cx - hw - off, y: cy - hh + (2*hh)*(i+0.5)/sCap });
    for (let i = 0; i < sCap; i++) out.push({ x: cx + hw + off, y: cy - hh + (2*hh)*(i+0.5)/sCap });
  }
  return out;
}

function wallPoly(x1, y1, x2, y2, t = WALL_T) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx*dx + dy*dy);
  if (len < 1) return '';
  const nx = (-dy / len) * t / 2;
  const ny = (dx  / len) * t / 2;
  return `${x1+nx},${y1+ny} ${x2+nx},${y2+ny} ${x2-nx},${y2-ny} ${x1-nx},${y1-ny}`;
}

function inZone(t, zones) {
  const cx = t.position?.x ?? 0, cy = t.position?.y ?? 0;
  return zones?.find(z => cx >= z.x && cx <= z.x + z.w && cy >= z.y && cy <= z.y + z.h);
}

// ── Floor Plan SVG ─────────────────────────────────────────────
function FloorPlan({ floor, tables, bookedIds, selectedId, primaryColor, onSelect }) {
  const [hov, setHov] = useState(null);

  const room    = floor?.room    ?? null;
  const zones   = floor?.zones   ?? [];
  const walls   = floor?.walls   ?? [];
  const doors   = floor?.doors   ?? [];
  const windows = floor?.windows ?? [];

  if (!tables.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-10">
        <Crown size={40} className="mb-4 opacity-15" style={{ color: primaryColor }}/>
        <p className="text-base font-bold text-stone-400">No tables on this floor</p>
        <p className="text-sm text-stone-300 mt-1 max-w-xs">
          The restaurant hasn't set up this floor yet. Please call to reserve.
        </p>
      </div>
    );
  }

  // viewBox: union of room bounds + all table positions + PAD
  let vx, vy, vw, vh;
  {
    const xs = tables.map(t => t.position?.x ?? 200);
    const ys = tables.map(t => t.position?.y ?? 200);
    let minX = Math.min(...xs);
    let minY = Math.min(...ys);
    let maxX = Math.max(...xs);
    let maxY = Math.max(...ys);
    if (room) {
      minX = Math.min(minX, room.x - WALL_T);
      minY = Math.min(minY, room.y - WALL_T);
      maxX = Math.max(maxX, room.x + room.w + WALL_T);
      maxY = Math.max(maxY, room.y + room.h + WALL_T);
    }
    vx = minX - PAD; vy = minY - PAD;
    vw = Math.max(300, maxX - minX + PAD * 2);
    vh = Math.max(200, maxY - minY + PAD * 2);
  }

  return (
    <svg
      viewBox={`${vx} ${vy} ${vw} ${vh}`}
      preserveAspectRatio="xMidYMid meet"
      width="100%" height="100%"
      style={{ display: 'block' }}
    >
      <defs>
        <pattern id="vp-plank" width="88" height="18" patternUnits="userSpaceOnUse">
          <rect width="88" height="18" fill="#f2e4c4"/>
          <rect y="1" width="88" height="16" fill="#f6eacb"/>
          <line x1="0" y1="0" x2="88" y2="0" stroke="#dcc898" strokeWidth="1"/>
          <line x1="14" y1="7" x2="72" y2="7" stroke="rgba(150,95,20,.065)" strokeWidth=".6"/>
          <line x1="32" y1="13" x2="82" y2="13" stroke="rgba(150,95,20,.045)" strokeWidth=".5"/>
        </pattern>
        <pattern id="vp-dot" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="11" cy="11" r=".75" fill="rgba(130,85,15,.18)"/>
        </pattern>
        <pattern id="vp-wall-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(100,70,30,.08)" strokeWidth="3"/>
        </pattern>
        {tables.map(t => (
          <radialGradient key={t._id} id={`vt-${t._id}`} cx="36%" cy="28%" r="72%" gradientUnits="objectBoundingBox">
            <stop offset="0%"   stopColor="#dba858"/>
            <stop offset="50%"  stopColor="#a87030"/>
            <stop offset="100%" stopColor="#6e4418"/>
          </radialGradient>
        ))}
        <filter id="vp-sel" x="-55%" y="-55%" width="210%" height="210%">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feFlood floodColor={primaryColor} floodOpacity=".6" result="c"/>
          <feComposite in="c" in2="b" operator="in" result="g"/>
          <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="vp-hov" x="-45%" y="-45%" width="190%" height="190%">
          <feGaussianBlur stdDeviation="5" result="b"/>
          <feFlood floodColor="#c8820a" floodOpacity=".35" result="c"/>
          <feComposite in="c" in2="b" operator="in" result="g"/>
          <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Outer linen area */}
      <rect x={vx} y={vy} width={vw} height={vh} fill="#ddd5c4"/>

      {room && (
        <>
          {/* Exterior wall shell — warm stone */}
          <rect x={room.x - WALL_T} y={room.y - WALL_T}
            width={room.w + WALL_T*2} height={room.h + WALL_T*2}
            rx={WALL_T + 8} fill="#b8997a"/>
          <rect x={room.x - WALL_T} y={room.y - WALL_T}
            width={room.w + WALL_T*2} height={room.h + WALL_T*2}
            rx={WALL_T + 8} fill="url(#vp-wall-hatch)" style={{ pointerEvents:'none' }}/>

          {/* Door gaps */}
          {doors.map(d => (
            <g key={`dg-${d.id}`} transform={`translate(${d.x} ${d.y}) rotate(${d.rotation ?? 0})`}
               style={{ pointerEvents:'none' }}>
              <rect x={-(d.width ?? 70)/2 - 1} y={-WALL_T - 3}
                width={(d.width ?? 70) + 2} height={WALL_T*2 + 6} fill="#ddd5c4"/>
            </g>
          ))}
          {/* Window gaps */}
          {windows.map(w => (
            <g key={`wg-${w.id}`} transform={`translate(${w.x} ${w.y}) rotate(${w.rotation ?? 0})`}
               style={{ pointerEvents:'none' }}>
              <rect x={-(w.width ?? 80)/2 - 1} y={-WALL_T - 3}
                width={(w.width ?? 80) + 2} height={WALL_T*2 + 6} fill="#ddd5c4"/>
            </g>
          ))}

          {/* Floor fill */}
          <rect x={room.x} y={room.y} width={room.w} height={room.h} rx={4} fill="url(#vp-plank)"/>
          <rect x={room.x} y={room.y} width={room.w} height={room.h} rx={4}
            fill="url(#vp-dot)" style={{ pointerEvents:'none' }}/>

          {/* Window glass */}
          {windows.map(w => {
            const ww = w.width ?? 80;
            return (
              <g key={w.id} transform={`translate(${w.x} ${w.y}) rotate(${w.rotation ?? 0})`}
                 style={{ pointerEvents:'none' }}>
                <rect x={-ww/2} y={-5} width={ww} height={10}
                  fill="#c8dff0" fillOpacity={0.85} stroke="#8ab5d4" strokeWidth={1}/>
                {[0, -ww*0.28, ww*0.28].map((gx, i) => (
                  <line key={i} x1={gx} y1={-4} x2={gx} y2={4}
                    stroke="#6a9ec0" strokeWidth={0.8} opacity={0.9}/>
                ))}
                <line x1={-ww/2} y1={-WALL_T} x2={-ww/2} y2={WALL_T} stroke="#9c7a4a" strokeWidth={1.5}/>
                <line x1={ ww/2} y1={-WALL_T} x2={ ww/2} y2={WALL_T} stroke="#9c7a4a" strokeWidth={1.5}/>
              </g>
            );
          })}

          {/* Door elements */}
          {doors.map(d => {
            const dw  = d.width    ?? 70;
            const oa  = (d.openAngle ?? 75) * Math.PI / 180;
            const sd  = d.swingDir ?? 1;
            const pex = -dw/2 + dw * Math.cos(oa);
            const pey = dw * Math.sin(oa) * sd;
            return (
              <g key={d.id} transform={`translate(${d.x} ${d.y}) rotate(${d.rotation ?? 0})`}
                 style={{ pointerEvents:'none' }}>
                <line x1={-dw/2} y1={-WALL_T} x2={-dw/2} y2={WALL_T} stroke="#9c7a4a" strokeWidth={2}/>
                <line x1={ dw/2} y1={-WALL_T} x2={ dw/2} y2={WALL_T} stroke="#9c7a4a" strokeWidth={2}/>
                <path d={`M ${dw/2} 0 A ${dw} ${dw} 0 0 ${sd>0?1:0} ${pex} ${pey}`}
                  fill="none" stroke="#9c7a4a" strokeWidth={1} strokeDasharray="5 3" opacity={0.6}/>
                <line x1={-dw/2} y1={0} x2={pex} y2={pey}
                  stroke="#9c7a4a" strokeWidth={2.5} strokeLinecap="round"/>
                <circle cx={-dw/2} cy={0} r={3} fill="#9c7a4a"/>
              </g>
            );
          })}

          {/* Interior walls */}
          {walls.map(w => {
            const pts = wallPoly(w.x1, w.y1, w.x2, w.y2, w.thickness ?? WALL_T);
            return pts ? (
              <polygon key={w.id} points={pts} fill="#b8997a" style={{ pointerEvents:'none' }}/>
            ) : null;
          })}

          {/* Room inner edge */}
          <rect x={room.x} y={room.y} width={room.w} height={room.h} rx={4}
            fill="none" stroke="rgba(155,105,35,.3)" strokeWidth={1.5}
            style={{ pointerEvents:'none' }}/>
        </>
      )}

      {/* No room — plain linen floor */}
      {!room && (
        <rect x={vx} y={vy} width={vw} height={vh} fill="url(#vp-plank)"/>
      )}

      {/* Zones */}
      {zones.map(z => (
        <g key={z.id} style={{ pointerEvents:'none' }}>
          <rect x={z.x} y={z.y} width={z.w} height={z.h} rx={7}
            fill={z.color ?? '#f59e0b'} fillOpacity={.1}
            stroke={z.color ?? '#f59e0b'} strokeOpacity={.6}
            strokeWidth="1.4" strokeDasharray="7 4"/>
          {z.label && (
            <text x={z.x+12} y={z.y+18} fontSize={11} fontWeight="700"
              fill={z.color ?? '#f59e0b'} style={{ userSelect:'none' }}>
              {z.label}
            </text>
          )}
        </g>
      ))}

      {/* Tables */}
      {tables.map(t => {
        const tx     = t.position?.x ?? 200;
        const ty     = t.position?.y ?? 200;
        const rot    = t.rotation ?? 0;
        const booked = bookedIds.includes(t._id);
        const sel    = selectedId === t._id;
        const hover  = hov === t._id && !sel;
        const { hw, hh } = tblHalf(t.shape, t.capacity);
        const ch     = chairs(tx, ty, t.shape, t.capacity);
        const filt   = sel ? 'url(#vp-sel)' : hover ? 'url(#vp-hov)' : undefined;
        const fill   = booked ? '#bbb4aa' : sel ? primaryColor : `url(#vt-${t._id})`;
        const stroke = sel ? primaryColor : booked ? '#a09890' : '#8a5c1e';
        const sw     = sel ? 3 : 1.8;

        return (
          <g key={t._id}
            transform={`rotate(${rot}, ${tx}, ${ty})`}
            opacity={booked ? .4 : 1}
            style={{ cursor: booked ? 'not-allowed' : 'pointer' }}
            onClick={() => !booked && onSelect(t._id === selectedId ? null : t._id)}
            onMouseEnter={() => !booked && setHov(t._id)}
            onMouseLeave={() => setHov(null)}
          >
            {ch.map((c, i) => (
              <circle key={i} cx={c.x} cy={c.y} r={CHAIR_R}
                fill={booked ? '#ccc5bc' : '#ead8b2'}
                stroke={booked ? '#aea69e' : 'rgba(120,75,12,.5)'}
                strokeWidth="1.2" style={{ pointerEvents:'none' }}/>
            ))}
            {t.shape === 'round' ? (
              <g filter={filt}>
                <circle cx={tx} cy={ty} r={hw} fill={fill} stroke={stroke} strokeWidth={sw}/>
                <circle cx={tx} cy={ty} r={hw*.58}
                  fill={sel ? 'rgba(255,255,255,.24)' : 'rgba(255,246,224,.3)'}
                  style={{ pointerEvents:'none' }}/>
              </g>
            ) : t.shape === 'rectangle' ? (
              <g filter={filt}>
                <rect x={tx-hw} y={ty-hh} width={hw*2} height={hh*2} rx={6}
                  fill={fill} stroke={stroke} strokeWidth={sw}/>
                <rect x={tx-hw*.6} y={ty-hh*.6} width={hw*1.2} height={hh*1.2} rx={4}
                  fill={sel ? 'rgba(255,255,255,.24)' : 'rgba(255,246,224,.3)'}
                  style={{ pointerEvents:'none' }}/>
              </g>
            ) : (
              <g filter={filt}>
                <rect x={tx-hw} y={ty-hh} width={hw*2} height={hh*2} rx={8}
                  fill={fill} stroke={stroke} strokeWidth={sw}/>
                <rect x={tx-hw*.6} y={ty-hh*.6} width={hw*1.2} height={hh*1.2} rx={6}
                  fill={sel ? 'rgba(255,255,255,.24)' : 'rgba(255,246,224,.3)'}
                  style={{ pointerEvents:'none' }}/>
              </g>
            )}
            <text x={tx} y={ty-5} textAnchor="middle" fontSize={12} fontWeight="800"
              fill={booked ? '#999' : sel ? '#fff' : '#2c1a04'}
              style={{ userSelect:'none', pointerEvents:'none' }}>
              {t.number}
            </text>
            <text x={tx} y={ty+10} textAnchor="middle" fontSize={9}
              fill={booked ? '#aaa' : sel ? 'rgba(255,255,255,.75)' : 'rgba(60,35,5,.5)'}
              style={{ userSelect:'none', pointerEvents:'none' }}>
              {t.capacity}p
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function VIPBookingPage() {
  const { slug } = useParams();
  const navigate  = useNavigate();

  const [selectedId,    setSelectedId]    = useState(null);
  const [done,          setDone]          = useState(false);
  const [activeFloorId, setActiveFloorId] = useState(null);
  const [form, setForm] = useState({
    date: '', time: '', partySize: 2,
    customerName: '', customerPhone: '', customerEmail: '', notes: '',
  });
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Restaurant info
  const { data: restData } = useQuery({
    queryKey: ['restaurant', slug],
    queryFn: () => api.get(`/restaurants/${slug}`).then(r => r.data),
    enabled: !!slug,
  });

  // Floor plan
  const { data: floorData, isLoading: floorLoading } = useQuery({
    queryKey: ['vip-floor', slug],
    queryFn: () => api.get(`/restaurants/${slug}/tables`).then(r => {
      const raw = r.data;
      if (Array.isArray(raw)) return { tables: raw, floors: [], zones: [], room: null };
      return raw ?? { tables: [], floors: [], zones: [], room: null };
    }),
    enabled: !!slug,
  });

  // Normalise to floors format (backwards compat with legacy room/zones)
  const floors = useMemo(() => {
    if (!floorData) return [];
    if (floorData.floors?.length) return floorData.floors;
    // Legacy: wrap single room/zones into a floor
    return [{
      id: 'floor-main', name: 'Ground Floor', order: 0,
      room:    floorData.room    ?? null,
      zones:   floorData.zones   ?? [],
      walls:   [], doors: [], windows: [],
    }];
  }, [floorData]);

  const allTables = floorData?.tables ?? [];

  // Set default active floor once floors are loaded
  useEffect(() => {
    if (floors.length && !activeFloorId) setActiveFloorId(floors[0].id);
  }, [floors, activeFloorId]);

  const activeFloor  = useMemo(() => floors.find(f => f.id === activeFloorId) ?? floors[0], [floors, activeFloorId]);
  const floorTables  = useMemo(
    () => allTables.filter(t => {
      if (!activeFloor) return false;
      // If table has floorId, use it; otherwise fall back to first floor
      if (t.floorId) return t.floorId === activeFloor.id;
      return activeFloor.id === floors[0]?.id;
    }),
    [allTables, activeFloor, floors],
  );

  // Availability
  const { data: availData } = useQuery({
    queryKey: ['vip-avail', slug, form.date, form.time],
    queryFn: () => api.get(`/restaurants/${slug}/tables/availability`, {
      params: { date: form.date, time: form.time },
    }).then(r => r.data),
    enabled: !!(slug && form.date && form.time),
  });
  const bookedIds = availData?.bookedTableIds ?? [];

  useEffect(() => {
    if (selectedId && bookedIds.includes(selectedId)) setSelectedId(null);
  }, [bookedIds, selectedId]);

  // When table changes, snap party size into the valid range for that table
  useEffect(() => {
    if (!selectedTable) return;
    const cap = selectedTable.capacity;
    const min = cap <= 4 ? cap : cap - 2;
    const cur = Number(form.partySize);
    if (cur < min) setF('partySize', min);
    if (cur > cap) setF('partySize', cap);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const selectedTable = allTables.find(t => t._id === selectedId);
  const zone = selectedTable ? inZone(selectedTable, activeFloor?.zones ?? []) : null;

  const { mutate: book, isPending: booking } = useMutation({
    mutationFn: () => api.post(`/restaurants/${slug}/reservations`, {
      tableId: selectedId, ...form, partySize: Number(form.partySize),
    }),
    onSuccess: () => setDone(true),
    onError: err => toast.error(err.response?.data?.message || 'Booking failed — please try again.'),
  });

  // Min party: capacity ≤ 4 → must fill exactly; capacity > 4 → capacity - 2
  const minParty = selectedTable
    ? (selectedTable.capacity <= 4 ? selectedTable.capacity : selectedTable.capacity - 2)
    : 1;
  const overCapacity = selectedTable && Number(form.partySize) > selectedTable.capacity;
  const underMin     = selectedTable && Number(form.partySize) < minParty;
  const partySizeErr = overCapacity || underMin;
  const canSubmit = form.date && form.time && form.partySize && form.customerName && form.customerPhone && !partySizeErr;
  const name         = restData?.name ?? '';
  const primaryColor = restData?.template?.primaryColor ?? '#f97316';
  const city         = restData?.address?.city ?? '';

  // ── Success screen ─────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{ background: 'linear-gradient(135deg, #fefcf8 0%, #fdf5e8 100%)' }}>
        <Toaster position="top-center"/>
        <div className="w-24 h-24 rounded-full flex items-center justify-center mb-8"
          style={{ background: `${primaryColor}14`, border: `3px solid ${primaryColor}30` }}>
          <CheckCircle2 size={44} style={{ color: primaryColor }}/>
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-3">Reservation Submitted!</h1>
        <p className="text-gray-500 text-base max-w-md leading-relaxed">
          Thank you, <span className="font-bold text-gray-800">{form.customerName}</span>.
          The team at <span className="font-bold text-gray-800">{name}</span> will confirm your VIP table booking shortly.
        </p>
        {selectedTable && (
          <div className="mt-8 px-6 py-4 rounded-2xl inline-flex items-center gap-4"
            style={{ background: `${primaryColor}0d`, border: `1.5px solid ${primaryColor}25` }}>
            <Crown size={18} style={{ color: primaryColor }}/>
            <div className="text-left">
              <p className="text-sm font-black text-gray-900">
                Table {selectedTable.number}
                {zone?.label && <span className="font-normal text-gray-500"> · {zone.label}</span>}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{form.date} · {form.time} · {form.partySize} guests</p>
            </div>
          </div>
        )}
        <div className="flex gap-3 mt-10">
          <button onClick={() => navigate(`/r/${slug}`)}
            className="px-8 py-3 rounded-2xl text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors">
            Back to Restaurant
          </button>
          <button
            onClick={() => { setDone(false); setSelectedId(null); setForm({ date:'',time:'',partySize:2,customerName:'',customerPhone:'',customerEmail:'',notes:'' }); }}
            className="px-8 py-3 rounded-2xl text-sm font-black text-white transition-all hover:scale-[1.03]"
            style={{ backgroundColor: primaryColor, boxShadow: `0 8px 28px ${primaryColor}45` }}>
            Book Another Table
          </button>
        </div>
      </div>
    );
  }

  // ── Main layout ────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#faf7f2' }}>
      <Toaster position="top-center"/>

      {/* Top bar */}
      <header className="shrink-0 flex items-center gap-4 px-5 sm:px-8 py-4 bg-white border-b"
        style={{ borderColor: 'rgba(210,185,120,.25)' }}>
        <button onClick={() => navigate(`/r/${slug}`)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform"/>
          Back
        </button>
        <div className="h-5 w-px bg-gray-200"/>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `${primaryColor}18` }}>
            <Crown size={13} style={{ color: primaryColor }}/>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-gray-900 truncate leading-tight">VIP Table Reservation</p>
            {(name || city) && (
              <p className="text-[11px] text-gray-400 flex items-center gap-1 leading-tight">
                {city && <><MapPin size={9}/>{city} · </>}{name}
              </p>
            )}
          </div>
        </div>
        {selectedTable && (
          <div className="ml-auto flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold"
            style={{ background: `${primaryColor}12`, color: primaryColor, border: `1px solid ${primaryColor}25` }}>
            <Crown size={11}/>
            Table {selectedTable.number}
            {zone?.label && <span className="opacity-60">· {zone.label}</span>}
            · {selectedTable.capacity} seats
          </div>
        )}
      </header>

      {/* Content */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">

        {/* LEFT — Floor Plan */}
        <div className="flex-1 min-h-0 flex flex-col p-5 sm:p-6 gap-3">

          {/* Label + legend row */}
          <div className="shrink-0 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest" style={{ color: `${primaryColor}99` }}>
                Select Your Table
              </h2>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {form.date && form.time
                  ? `Showing availability for ${form.date} at ${form.time}`
                  : 'Pick a date & time on the right to see live availability'}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-[10px] font-semibold text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full" style={{ background: '#a07030' }}/>Available
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full" style={{ background: primaryColor }}/>Selected
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-stone-300"/>Booked
              </span>
            </div>
          </div>

          {/* Floor tabs (only when multiple floors exist) */}
          {floors.length > 1 && (
            <div className="shrink-0 flex items-center gap-1.5 overflow-x-auto">
              <Layers size={11} className="text-gray-400 shrink-0"/>
              {floors.map(f => (
                <button key={f.id} onClick={() => { setActiveFloorId(f.id); setSelectedId(null); }}
                  className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeFloorId === f.id ? 'text-white' : 'text-gray-500 bg-stone-100 hover:bg-stone-200'}`}
                  style={activeFloorId === f.id ? { backgroundColor: primaryColor, color: '#fff' } : {}}>
                  {f.name}
                </button>
              ))}
            </div>
          )}

          {/* Floor plan container */}
          <div className="flex-1 min-h-0 rounded-2xl overflow-hidden relative"
            style={{ background: '#e2d8c8', boxShadow: 'inset 0 1px 3px rgba(0,0,0,.08)' }}>
            {floorLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 size={28} className="animate-spin" style={{ color: primaryColor }}/>
              </div>
            ) : (
              <FloorPlan
                floor={activeFloor}
                tables={floorTables}
                bookedIds={bookedIds}
                selectedId={selectedId}
                primaryColor={primaryColor}
                onSelect={setSelectedId}
              />
            )}
            {!selectedId && !floorLoading && floorTables.length > 0 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none">
                <p className="text-[10px] font-semibold px-3 py-1.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,.85)', color: 'rgba(100,65,15,.7)',
                           border: '1px solid rgba(200,155,60,.25)', backdropFilter: 'blur(8px)' }}>
                  Click any available table to select it
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Booking Form */}
        <div className="w-full lg:w-[380px] shrink-0 flex flex-col bg-white border-t lg:border-t-0 lg:border-l overflow-y-auto"
          style={{ borderColor: 'rgba(210,185,120,.22)' }}>

          <div className="shrink-0 px-6 py-5 border-b" style={{ borderColor: 'rgba(210,185,120,.18)' }}>
            <h2 className="text-base font-black text-gray-900">Reservation Details</h2>
            <p className="text-xs text-gray-400 mt-0.5">Fill in your details to confirm your VIP table</p>
          </div>

          <div className="flex-1 px-6 py-5 space-y-5">

            {/* Selected table card */}
            {selectedTable ? (
              <div className="flex items-center gap-3 p-3.5 rounded-2xl"
                style={{ background: `${primaryColor}0c`, border: `1.5px solid ${primaryColor}22` }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${primaryColor}18` }}>
                  <Crown size={15} style={{ color: primaryColor }}/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-gray-900">
                    Table {selectedTable.number}
                    {zone?.label && (
                      <span className="ml-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: (zone.color ?? '#f59e0b') + '22', color: zone.color ?? '#f59e0b' }}>
                        {zone.label}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 capitalize">{selectedTable.capacity} seats · {selectedTable.shape}</p>
                </div>
                <button onClick={() => setSelectedId(null)}
                  className="text-[10px] text-gray-400 hover:text-gray-600 shrink-0 border border-gray-200 rounded-lg px-2 py-1">
                  Change
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-dashed"
                style={{ borderColor: 'rgba(200,155,60,.3)', background: 'rgba(250,245,235,.5)' }}>
                <Crown size={16} className="opacity-30 shrink-0" style={{ color: primaryColor }}/>
                <p className="text-xs text-gray-400">Select a table from the floor plan on the left</p>
              </div>
            )}

            {/* Date */}
            <FField label="Date" icon={<Calendar size={12} style={{ color: primaryColor }}/>}>
              <input type="date" min={new Date().toISOString().split('T')[0]}
                value={form.date} onChange={e => setF('date', e.target.value)}
                className="w-full rounded-xl px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:ring-2"
                style={{ background: '#faf5eb', border: '1px solid rgba(200,155,60,.3)',
                         ['--tw-ring-color']: primaryColor + '40' }}/>
            </FField>

            {/* Time */}
            <FField label="Time" icon={<Clock size={12} style={{ color: primaryColor }}/>}>
              <div className="space-y-2.5">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-300 mb-1.5">Lunch</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {LUNCH.map(t => <TC key={t} t={t} sel={form.time===t} clr={primaryColor} onClick={() => setF('time', t)}/>)}
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-300 mb-1.5">Dinner</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {DINNER.map(t => <TC key={t} t={t} sel={form.time===t} clr={primaryColor} onClick={() => setF('time', t)}/>)}
                  </div>
                </div>
              </div>
            </FField>

            {/* Guests */}
            <FField label="Guests" icon={<Users size={12} style={{ color: primaryColor }}/>}>
              <div className="flex items-center gap-3">
                <SB onClick={() => setF('partySize', Math.max(1, form.partySize - 1))}>−</SB>
                <span className={`flex-1 text-center text-lg font-black ${partySizeErr ? 'text-red-600' : 'text-gray-900'}`}>
                  {form.partySize}
                </span>
                <SB onClick={() => setF('partySize', form.partySize + 1)}>+</SB>
              </div>
              {selectedTable && (
                overCapacity ? (
                  <p className="text-xs text-red-600 font-semibold mt-2">
                    ⚠ Table {selectedTable.number} seats max {selectedTable.capacity}. Too many guests — pick a bigger table or reduce guests.
                  </p>
                ) : underMin ? (
                  <p className="text-xs text-red-600 font-semibold mt-2">
                    ⚠ Table {selectedTable.number} requires at least {minParty} guests (min for a {selectedTable.capacity}-seat table). Choose a smaller table or add more guests.
                  </p>
                ) : (
                  <p className="text-[10px] mt-1.5" style={{ color: 'rgba(130,85,20,.45)' }}>
                    Table {selectedTable.number} · {minParty === selectedTable.capacity
                      ? `${selectedTable.capacity} guests exactly`
                      : `${minParty}–${selectedTable.capacity} guests`}
                  </p>
                )
              )}
            </FField>

            <div className="h-px" style={{ background: 'rgba(210,185,120,.2)' }}/>

            <FField label="Full Name" icon={<User size={12} style={{ color: primaryColor }}/>}>
              <FInput type="text" ph="Your full name" v={form.customerName} chg={e => setF('customerName', e.target.value)}/>
            </FField>
            <FField label="Phone" icon={<Phone size={12} style={{ color: primaryColor }}/>}>
              <FInput type="tel" ph="+216 XX XXX XXX" v={form.customerPhone} chg={e => setF('customerPhone', e.target.value)}/>
            </FField>
            <FField label="Email (optional)" icon={<Mail size={12} style={{ color: primaryColor }}/>}>
              <FInput type="email" ph="your@email.com" v={form.customerEmail} chg={e => setF('customerEmail', e.target.value)}/>
            </FField>
            <FField label="Special Requests" icon={<FileText size={12} style={{ color: primaryColor }}/>}>
              <textarea rows={3} placeholder="Allergies, occasions, preferences…"
                value={form.notes} onChange={e => setF('notes', e.target.value)}
                className="w-full rounded-xl px-3.5 py-2.5 text-sm text-gray-800 placeholder-amber-900/25 outline-none resize-none"
                style={{ background: '#faf5eb', border: '1px solid rgba(200,155,60,.3)' }}/>
            </FField>
          </div>

          {/* Sticky submit footer */}
          <div className="shrink-0 px-6 pb-6 pt-4 border-t" style={{ borderColor: 'rgba(210,185,120,.18)' }}>
            {!canSubmit && (
              <p className={`text-[10px] text-center mb-3 font-medium ${partySizeErr ? 'text-red-600/70' : 'text-amber-700/50'}`}>
                {overCapacity
                  ? `⚠ ${form.partySize} guests exceed table ${selectedTable?.number}'s max (${selectedTable?.capacity} seats)`
                  : underMin
                  ? `⚠ Table ${selectedTable?.number} needs at least ${minParty} guests`
                  : !selectedId ? '① Select a table from the floor plan'
                  : !form.date  ? '② Choose a date'
                  : !form.time  ? '③ Pick a time slot'
                  : !form.customerName || !form.customerPhone ? '④ Enter your contact details'
                  : ''}
              </p>
            )}
            <button onClick={() => canSubmit && book()} disabled={!canSubmit || booking}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-sm font-black text-white transition-all disabled:opacity-35 disabled:cursor-not-allowed"
              style={{ backgroundColor: canSubmit ? primaryColor : '#c8b480', boxShadow: canSubmit ? `0 8px 32px ${primaryColor}45` : 'none' }}>
              {booking ? <Loader2 size={16} className="animate-spin"/> : <Crown size={15}/>}
              {booking ? 'Confirming your reservation…' : 'Confirm VIP Reservation'}
              {!booking && <ChevronRight size={15}/>}
            </button>
            <p className="text-[10px] text-center text-amber-900/30 mt-3">
              No payment required now · We&apos;ll call to confirm
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tiny helpers ──────────────────────────────────────────────
function FField({ label, icon, children }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest"
        style={{ color: 'rgba(130,85,20,.55)' }}>
        {icon}{label}
      </label>
      {children}
    </div>
  );
}
function FInput({ type, ph, v, chg }) {
  return (
    <input type={type} placeholder={ph} value={v} onChange={chg}
      className="w-full rounded-xl px-3.5 py-2.5 text-sm text-gray-800 placeholder-amber-900/25 outline-none"
      style={{ background: '#faf5eb', border: '1px solid rgba(200,155,60,.3)' }}/>
  );
}
function TC({ t, sel, clr, onClick }) {
  return (
    <button onClick={onClick}
      className="py-2 rounded-xl text-[11px] font-bold transition-all"
      style={sel
        ? { background: clr, color: '#fff', boxShadow: `0 4px 14px ${clr}45` }
        : { background: '#faf5eb', color: '#7a4e18', border: '1px solid rgba(200,155,60,.28)' }}>
      {t}
    </button>
  );
}
function SB({ children, onClick }) {
  return (
    <button onClick={onClick}
      className="w-10 h-10 rounded-xl font-bold text-xl flex items-center justify-center text-gray-700 hover:bg-amber-50 transition-colors"
      style={{ background: '#faf5eb', border: '1px solid rgba(200,155,60,.28)' }}>
      {children}
    </button>
  );
}
