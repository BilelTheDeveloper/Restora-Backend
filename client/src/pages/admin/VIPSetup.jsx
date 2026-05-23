import { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Crown, Plus, Trash2, Save, ToggleLeft, ToggleRight,
  Circle, Square, RefreshCw, Undo, Redo,
  ZoomIn, ZoomOut, Tag, RotateCcw,
} from 'lucide-react';
import api from '../../services/api';

// ── Constants ──────────────────────────────────────────────────
const CANVAS_W   = 920;
const CANVAS_H   = 600;
const CX         = CANVAS_W / 2;
const CY         = CANVAS_H / 2;
const GRID       = 20;
const ROUND_R    = 28;
const RECT_W     = 82;
const RECT_H     = 50;
const SQ_HALF    = 30;
const CHAIR_R    = 7;
const CHAIR_GAP  = 6;
const HANDLE_PX  = 5;            // screen-size of resize handle (half)
const DEFAULT_ROOM = { x: 40, y: 40, w: 840, h: 520 };
const ZONE_COLORS  = ['#f59e0b','#14b8a6','#f43f5e','#8b5cf6','#0ea5e9','#84cc16','#f97316','#ec4899'];

const snap = v => Math.round(v / GRID) * GRID;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const genId = () => `z${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

// ── Table geometry helpers ─────────────────────────────────────
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
    const off = CHAIR_GAP + CHAIR_R;
    const tCap = Math.max(1, Math.round(cap * hw / (hw + hh)));
    const sCap = Math.floor((cap - tCap * 2) / 2);
    const aTop = Math.ceil((cap - sCap * 2) / 2);
    const aBot = Math.floor((cap - sCap * 2) / 2);
    for (let i = 0; i < aTop; i++)
      chairs.push({ x: cx - hw + (2 * hw) * (i + 0.5) / aTop,  y: cy - hh - off });
    for (let i = 0; i < aBot; i++)
      chairs.push({ x: cx - hw + (2 * hw) * (i + 0.5) / aBot,  y: cy + hh + off });
    for (let i = 0; i < sCap; i++)
      chairs.push({ x: cx - hw - off, y: cy - hh + (2 * hh) * (i + 0.5) / sCap });
    for (let i = 0; i < sCap; i++)
      chairs.push({ x: cx + hw + off, y: cy - hh + (2 * hh) * (i + 0.5) / sCap });
  }
  return chairs;
}

// ── Floor Canvas SVG ───────────────────────────────────────────
function FloorCanvas({
  svgRef, tables, zones, room, selected, zoom, hoveredId,
  startTableDrag, startZoneDrag, startZoneResize, startRoomResize,
  onPointerMove, onPointerUp, onWheel, onBgClick,
}) {
  const HS   = HANDLE_PX / zoom;
  const r    = room ?? DEFAULT_ROOM;

  const ROOM_CORNERS = [
    ['nw', r.x,        r.y,         'nw-resize'],
    ['ne', r.x + r.w,  r.y,         'ne-resize'],
    ['se', r.x + r.w,  r.y + r.h,   'se-resize'],
    ['sw', r.x,        r.y + r.h,   'sw-resize'],
  ];

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
      className="w-full rounded-2xl touch-none select-none"
      style={{ maxHeight: 500, background: '#0c0a07' }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onWheel={onWheel}
      onClick={onBgClick}
    >
      <defs>
        {/* Dark wood plank floor */}
        <pattern id="floor-planks" width="90" height="18" patternUnits="userSpaceOnUse">
          <rect width="90" height="18" fill="#1b1208"/>
          <rect y="1" width="90" height="17" fill="#1d1309"/>
          <line x1="0" y1="0" x2="90" y2="0" stroke="#0b0804" strokeWidth="1.5"/>
          <line x1="10" y1="5" x2="68" y2="5" stroke="rgba(255,200,80,0.04)" strokeWidth="0.8"/>
          <line x1="26" y1="12" x2="84" y2="12" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5"/>
        </pattern>
        {/* Grid dots on floor */}
        <pattern id="grid-dots" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
          <circle cx={GRID / 2} cy={GRID / 2} r="0.8" fill="rgba(255,255,255,0.1)"/>
        </pattern>
        {/* Table wood gradients */}
        {tables.map(t => {
          const id = t._localId ?? t._id;
          return (
            <radialGradient key={`g-${id}`} id={`tbl-${id}`} cx="38%" cy="32%" r="68%" gradientUnits="objectBoundingBox">
              <stop offset="0%"   stopColor="#906c1a"/>
              <stop offset="55%"  stopColor="#5c4010"/>
              <stop offset="100%" stopColor="#3b2708"/>
            </radialGradient>
          );
        })}
        {/* Selected orange glow */}
        <filter id="sel-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" result="b"/>
          <feFlood floodColor="#f97316" floodOpacity="0.65" result="c"/>
          <feComposite in="c" in2="b" operator="in" result="g"/>
          <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        {/* Hover soft glow */}
        <filter id="hov-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feFlood floodColor="#fbbf24" floodOpacity="0.4" result="c"/>
          <feComposite in="c" in2="b" operator="in" result="g"/>
          <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Outer void */}
      <rect width={CANVAS_W} height={CANVAS_H} fill="#0c0a07"/>

      {/* Zoom transform group — all world content lives here */}
      <g transform={`translate(${CX} ${CY}) scale(${zoom}) translate(${-CX} ${-CY})`}>

        {/* Room floor fill */}
        <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={8} fill="url(#floor-planks)"/>
        {/* Grid dots */}
        <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={8} fill="url(#grid-dots)" style={{ pointerEvents: 'none' }}/>

        {/* Zones */}
        {zones.map(z => {
          const isSel = selected?.type === 'zone' && selected?.id === z.id;
          const col = z.color ?? '#f59e0b';
          return (
            <g key={z.id}>
              <rect
                x={z.x} y={z.y} width={z.w} height={z.h} rx={5}
                fill={col} fillOpacity={isSel ? 0.22 : 0.13}
                stroke={col} strokeOpacity={isSel ? 0.8 : 0.38}
                strokeWidth={isSel ? 1.5 / zoom : 1 / zoom}
                style={{ cursor: 'move' }}
                onPointerDown={e => { e.stopPropagation(); startZoneDrag(e, z.id); }}
                onClick={e => e.stopPropagation()}
              />
              {z.label && (
                <text
                  x={z.x + 8} y={z.y + 14}
                  fontSize={10 / zoom} fontWeight="700"
                  fill={col} fillOpacity={0.9}
                  style={{ userSelect: 'none', pointerEvents: 'none' }}
                >
                  {z.label}
                </text>
              )}
              {/* Zone resize handles */}
              {isSel && [
                ['nw', z.x,       z.y,        'nw-resize'],
                ['ne', z.x + z.w, z.y,        'ne-resize'],
                ['se', z.x + z.w, z.y + z.h,  'se-resize'],
                ['sw', z.x,       z.y + z.h,  'sw-resize'],
              ].map(([corner, hx, hy, cursor]) => (
                <rect
                  key={corner}
                  x={hx - HS} y={hy - HS} width={HS * 2} height={HS * 2} rx={HS * 0.35}
                  fill="white" fillOpacity={0.88}
                  stroke={col} strokeWidth={0.6 / zoom}
                  style={{ cursor }}
                  onPointerDown={e => { e.stopPropagation(); startZoneResize(e, z.id, corner); }}
                  onClick={e => e.stopPropagation()}
                />
              ))}
            </g>
          );
        })}

        {/* Tables */}
        {tables.map(t => {
          const id    = t._localId ?? t._id;
          const tx    = t.position?.x ?? 200;
          const ty    = t.position?.y ?? 200;
          const isSel = selected?.type === 'table' && selected?.id === id;
          const isHov = hoveredId === id && !isSel;
          const chairs = computeChairs(tx, ty, t.shape, t.capacity);
          const { hw, hh } = tblHalf(t.shape);
          const filt  = isSel ? 'url(#sel-glow)' : isHov ? 'url(#hov-glow)' : undefined;

          return (
            <g
              key={id}
              style={{ cursor: 'grab' }}
              onPointerDown={e => { e.stopPropagation(); startTableDrag(e, id); }}
              onClick={e => e.stopPropagation()}
            >
              {/* Chairs */}
              {chairs.map((c, i) => (
                <circle key={i} cx={c.x} cy={c.y} r={CHAIR_R}
                  fill="#2c1c09" stroke="rgba(180,130,50,0.38)" strokeWidth="1"
                  style={{ pointerEvents: 'none' }}
                />
              ))}

              {/* Table surface */}
              {t.shape === 'round' ? (
                <g filter={filt}>
                  <circle cx={tx} cy={ty} r={ROUND_R}
                    fill={`url(#tbl-${id})`}
                    stroke={isSel ? '#f97316' : '#7a5514'}
                    strokeWidth={isSel ? 2.5 : 1.5}/>
                  <circle cx={tx} cy={ty} r={ROUND_R * 0.62}
                    fill="rgba(255,255,255,0.055)" style={{ pointerEvents: 'none' }}/>
                </g>
              ) : t.shape === 'rectangle' ? (
                <g filter={filt}>
                  <rect x={tx - hw} y={ty - hh} width={hw * 2} height={hh * 2} rx={5}
                    fill={`url(#tbl-${id})`}
                    stroke={isSel ? '#f97316' : '#7a5514'}
                    strokeWidth={isSel ? 2.5 : 1.5}/>
                  <rect x={tx - hw * 0.62} y={ty - hh * 0.62} width={hw * 1.24} height={hh * 1.24} rx={3}
                    fill="rgba(255,255,255,0.055)" style={{ pointerEvents: 'none' }}/>
                </g>
              ) : (
                <g filter={filt}>
                  <rect x={tx - hw} y={ty - hh} width={hw * 2} height={hh * 2} rx={7}
                    fill={`url(#tbl-${id})`}
                    stroke={isSel ? '#f97316' : '#7a5514'}
                    strokeWidth={isSel ? 2.5 : 1.5}/>
                  <rect x={tx - hw * 0.62} y={ty - hh * 0.62} width={hw * 1.24} height={hh * 1.24} rx={5}
                    fill="rgba(255,255,255,0.055)" style={{ pointerEvents: 'none' }}/>
                </g>
              )}

              {/* Number + capacity */}
              <text x={tx} y={ty - 5} textAnchor="middle"
                fill="rgba(255,238,190,0.92)" fontSize={11} fontWeight="800"
                style={{ userSelect: 'none', pointerEvents: 'none' }}>
                {t.number || '?'}
              </text>
              <text x={tx} y={ty + 9} textAnchor="middle"
                fill="rgba(255,238,190,0.42)" fontSize={8.5}
                style={{ userSelect: 'none', pointerEvents: 'none' }}>
                {t.capacity}p
              </text>
            </g>
          );
        })}

        {/* Room boundary border (top layer, no pointer events) */}
        <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={8}
          fill="none"
          stroke="rgba(255,255,255,0.2)" strokeWidth={2 / zoom}
          strokeDasharray={`${8 / zoom} 0`}
          style={{ pointerEvents: 'none' }}
        />
        {/* Outer subtle glow rim */}
        <rect x={r.x - 2} y={r.y - 2} width={r.w + 4} height={r.h + 4} rx={10}
          fill="none"
          stroke="rgba(255,255,255,0.04)" strokeWidth={4 / zoom}
          style={{ pointerEvents: 'none' }}
        />

        {/* Room resize corner handles */}
        {ROOM_CORNERS.map(([corner, hx, hy, cursor]) => (
          <rect
            key={corner}
            x={hx - HS} y={hy - HS} width={HS * 2} height={HS * 2} rx={HS * 0.3}
            fill="white" fillOpacity={0.7}
            stroke="rgba(255,255,255,0.25)" strokeWidth={0.5 / zoom}
            style={{ cursor }}
            onPointerDown={e => { e.stopPropagation(); startRoomResize(e, corner); }}
            onClick={e => e.stopPropagation()}
          />
        ))}

        {tables.length === 0 && (
          <text x={CX} y={CY} textAnchor="middle" dominantBaseline="middle"
            fill="rgba(255,255,255,0.16)" fontSize={13}>
            Add tables using the toolbar above ↑
          </text>
        )}
      </g>
    </svg>
  );
}

// ── Edit Panel ─────────────────────────────────────────────────
function EditPanel({ selected, tables, zones, onUpdateTable, onUpdateZone, onDelete }) {
  if (!selected) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500 dark:text-gray-600 px-4">
        <Crown size={28} className="opacity-15 mb-3"/>
        <p className="text-xs font-medium">Select a table or zone<br/>to edit its properties</p>
      </div>
    );
  }

  if (selected.type === 'table') {
    const t = tables.find(t => (t._localId ?? t._id) === selected.id);
    if (!t) return null;
    return (
      <div className="p-4 space-y-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Table Properties</p>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Number</label>
          <input
            type="text" value={t.number ?? ''}
            onChange={e => onUpdateTable('number', e.target.value)}
            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-orange-400 transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Capacity</label>
          <div className="flex items-center gap-2">
            <button onClick={() => onUpdateTable('capacity', Math.max(1, (t.capacity ?? 4) - 1))}
              className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/8 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-800 dark:text-white font-bold text-base flex items-center justify-center transition-colors">−</button>
            <span className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-white">{t.capacity ?? 4} seats</span>
            <button onClick={() => onUpdateTable('capacity', (t.capacity ?? 4) + 1)}
              className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/8 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-800 dark:text-white font-bold text-base flex items-center justify-center transition-colors">+</button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Shape</label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { val: 'round',     icon: <Circle size={11}/>,  label: 'Round' },
              { val: 'square',    icon: <Square size={11}/>,  label: 'Square' },
              { val: 'rectangle', icon: <span className="text-[9px] font-black">▬</span>, label: 'Rect' },
            ].map(({ val, icon, label }) => (
              <button key={val} onClick={() => onUpdateTable('shape', val)}
                className={`flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-bold transition-all border ${t.shape === val ? 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/25' : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-orange-300 dark:hover:border-orange-500/40'}`}>
                {icon} {label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-[10px] text-gray-400 dark:text-gray-600 pt-1">
          Position: ({Math.round(t.position?.x ?? 0)}, {Math.round(t.position?.y ?? 0)})
        </div>

        <button onClick={onDelete}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-red-500 bg-red-50 dark:bg-red-500/8 hover:bg-red-100 dark:hover:bg-red-500/16 border border-red-200 dark:border-red-500/20 transition-colors">
          <Trash2 size={12}/> Delete Table
        </button>
      </div>
    );
  }

  if (selected.type === 'zone') {
    const z = zones.find(z => z.id === selected.id);
    if (!z) return null;
    return (
      <div className="p-4 space-y-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Zone Properties</p>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Label</label>
          <input
            type="text" value={z.label ?? ''} placeholder="e.g. VIP Section"
            onChange={e => onUpdateZone('label', e.target.value)}
            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-orange-400 transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Color</label>
          <div className="flex flex-wrap gap-2">
            {ZONE_COLORS.map(col => (
              <button key={col} onClick={() => onUpdateZone('color', col)}
                className="w-7 h-7 rounded-lg transition-all"
                style={{
                  backgroundColor: col,
                  boxShadow: z.color === col ? `0 0 0 2px white, 0 0 0 4px ${col}` : 'none',
                  transform: z.color === col ? 'scale(1.15)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        </div>

        <div className="text-[10px] text-gray-400 dark:text-gray-600 pt-1">
          Size: {Math.round(z.w)} × {Math.round(z.h)} px
        </div>

        <button onClick={onDelete}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-red-500 bg-red-50 dark:bg-red-500/8 hover:bg-red-100 dark:hover:bg-red-500/16 border border-red-200 dark:border-red-500/20 transition-colors">
          <Trash2 size={12}/> Delete Zone
        </button>
      </div>
    );
  }

  return null;
}

// ── Main VIPSetup ──────────────────────────────────────────────
let localIdCtr = 1;

export default function VIPSetup() {
  const qc = useQueryClient();

  // ── Server data ──────────────────────────────────────────────
  const { data: rd } = useQuery({
    queryKey: ['my-restaurant'],
    queryFn: () => api.get('/restaurants/admin/mine').then(r => r.data),
  });
  const restaurant = rd?.data;

  const { data: tablesData, isLoading: tablesLoading } = useQuery({
    queryKey: ['my-tables'],
    queryFn: () => api.get('/owner/tables').then(r => r.data.data ?? []),
    enabled: !!restaurant,
  });

  // ── Local state ──────────────────────────────────────────────
  const [tables,     setTables]     = useState([]);
  const [deletedIds, setDeletedIds] = useState([]);
  const [vip,        setVip]        = useState({ enabled: false, description: '', minSpend: 0, zones: [], room: { ...DEFAULT_ROOM } });
  const [selected,   setSelected]   = useState(null); // { type: 'table'|'zone', id } | null
  const [hoveredId,  setHoveredId]  = useState(null);
  const [zoom,       setZoom]       = useState(1);
  const [dirty,      setDirty]      = useState(false);

  // ── Refs ─────────────────────────────────────────────────────
  const svgRef     = useRef();
  const dragRef    = useRef(null);
  const zoomRef    = useRef(1);
  const historyRef = useRef({ past: [], future: [] });

  // Keep zoomRef fresh (avoids stale closure in handlers)
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  // ── Seed from server ─────────────────────────────────────────
  useEffect(() => {
    if (tablesData) setTables(tablesData.map(t => ({ ...t, _localId: t._id })));
  }, [tablesData]);

  useEffect(() => {
    if (restaurant?.vipService) {
      const vs = restaurant.vipService;
      setVip({
        enabled:     vs.enabled     ?? false,
        description: vs.description ?? '',
        minSpend:    vs.minSpend    ?? 0,
        zones:       vs.zones       ?? [],
        room:        vs.room        ?? { ...DEFAULT_ROOM },
      });
    }
  }, [restaurant]);

  // ── History helpers ──────────────────────────────────────────
  const snapshot = useCallback(() => ({
    tables: tables.map(t => ({ ...t, position: { ...t.position } })),
    zones:  vip.zones.map(z => ({ ...z })),
    room:   { ...vip.room },
  }), [tables, vip]);

  const pushHistory = useCallback(() => {
    const h = historyRef.current;
    h.past.push(snapshot());
    h.future = [];
    if (h.past.length > 50) h.past.shift();
  }, [snapshot]);

  const undo = useCallback(() => {
    const h = historyRef.current;
    if (!h.past.length) return;
    h.future.push(snapshot());
    const prev = h.past.pop();
    setTables(prev.tables);
    setVip(p => ({ ...p, zones: prev.zones, room: prev.room }));
    setDirty(true);
    setSelected(null);
  }, [snapshot]);

  const redo = useCallback(() => {
    const h = historyRef.current;
    if (!h.future.length) return;
    h.past.push(snapshot());
    const next = h.future.pop();
    setTables(next.tables);
    setVip(p => ({ ...p, zones: next.zones, room: next.room }));
    setDirty(true);
    setSelected(null);
  }, [snapshot]);

  // ── Mouse coord helpers ──────────────────────────────────────
  const toWorld = useCallback((clientX, clientY) => {
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = (clientX - rect.left)  * (CANVAS_W / rect.width);
    const svgY = (clientY - rect.top)   * (CANVAS_H / rect.height);
    const z    = zoomRef.current;
    return { x: (svgX - CX) / z + CX, y: (svgY - CY) / z + CY };
  }, []);

  // ── Drag starts ──────────────────────────────────────────────
  const startTableDrag = useCallback((e, id) => {
    e.stopPropagation();
    const t = tables.find(t => (t._localId ?? t._id) === id);
    const w = toWorld(e.clientX, e.clientY);
    dragRef.current = {
      type: 'table', id,
      startMX: w.x, startMY: w.y,
      startOX: t?.position?.x ?? 0, startOY: t?.position?.y ?? 0,
    };
    setSelected({ type: 'table', id });
    svgRef.current.setPointerCapture(e.pointerId);
  }, [tables, toWorld]);

  const startZoneDrag = useCallback((e, id) => {
    e.stopPropagation();
    const z = vip.zones.find(z => z.id === id);
    const w = toWorld(e.clientX, e.clientY);
    dragRef.current = {
      type: 'zone-move', id,
      startMX: w.x, startMY: w.y,
      startOX: z?.x ?? 0, startOY: z?.y ?? 0,
    };
    setSelected({ type: 'zone', id });
    svgRef.current.setPointerCapture(e.pointerId);
  }, [vip.zones, toWorld]);

  const startZoneResize = useCallback((e, id, corner) => {
    e.stopPropagation();
    const z = vip.zones.find(z => z.id === id);
    const w = toWorld(e.clientX, e.clientY);
    dragRef.current = {
      type: 'zone-resize', id, corner,
      startMX: w.x, startMY: w.y,
      startOX: z?.x ?? 0, startOY: z?.y ?? 0, startOW: z?.w ?? 160, startOH: z?.h ?? 100,
    };
    svgRef.current.setPointerCapture(e.pointerId);
  }, [vip.zones, toWorld]);

  const startRoomResize = useCallback((e, corner) => {
    e.stopPropagation();
    const rm = vip.room;
    const w  = toWorld(e.clientX, e.clientY);
    dragRef.current = {
      type: 'room-resize', id: null, corner,
      startMX: w.x, startMY: w.y,
      startOX: rm?.x ?? DEFAULT_ROOM.x, startOY: rm?.y ?? DEFAULT_ROOM.y,
      startOW: rm?.w ?? DEFAULT_ROOM.w, startOH: rm?.h ?? DEFAULT_ROOM.h,
    };
    svgRef.current.setPointerCapture(e.pointerId);
  }, [vip.room, toWorld]);

  // ── Pointer move ─────────────────────────────────────────────
  const handlePointerMove = useCallback((e) => {
    if (!dragRef.current) return;
    const { type, id, corner, startMX, startMY, startOX, startOY, startOW, startOH } = dragRef.current;
    const w  = toWorld(e.clientX, e.clientY);
    const dx = w.x - startMX;
    const dy = w.y - startMY;

    if (type === 'table') {
      const nx = snap(clamp(startOX + dx, 30, CANVAS_W - 30));
      const ny = snap(clamp(startOY + dy, 30, CANVAS_H - 30));
      setTables(p => p.map(t => (t._localId ?? t._id) === id ? { ...t, position: { x: nx, y: ny } } : t));
      setDirty(true);

    } else if (type === 'zone-move') {
      const nx = snap(startOX + dx);
      const ny = snap(startOY + dy);
      setVip(p => ({ ...p, zones: p.zones.map(z => z.id === id ? { ...z, x: nx, y: ny } : z) }));
      setDirty(true);

    } else if (type === 'zone-resize') {
      let x = startOX, y = startOY, zw = startOW, zh = startOH;
      if (corner === 'nw') { x = snap(startOX + dx); y = snap(startOY + dy); zw = snap(startOW - dx); zh = snap(startOH - dy); }
      else if (corner === 'ne') { zw = snap(startOW + dx); y = snap(startOY + dy); zh = snap(startOH - dy); }
      else if (corner === 'se') { zw = snap(startOW + dx); zh = snap(startOH + dy); }
      else if (corner === 'sw') { x = snap(startOX + dx); zw = snap(startOW - dx); zh = snap(startOH + dy); }
      if (zw < 60) zw = 60;
      if (zh < 40) zh = 40;
      setVip(p => ({ ...p, zones: p.zones.map(z => z.id === id ? { ...z, x, y, w: zw, h: zh } : z) }));
      setDirty(true);

    } else if (type === 'room-resize') {
      const MIN = 200;
      let x = startOX, y = startOY, rw = startOW, rh = startOH;
      if (corner === 'nw') { x = snap(startOX + dx); y = snap(startOY + dy); rw = snap(startOW - dx); rh = snap(startOH - dy); }
      else if (corner === 'ne') { rw = snap(startOW + dx); y = snap(startOY + dy); rh = snap(startOH - dy); }
      else if (corner === 'se') { rw = snap(startOW + dx); rh = snap(startOH + dy); }
      else if (corner === 'sw') { x = snap(startOX + dx); rw = snap(startOW - dx); rh = snap(startOH + dy); }
      if (rw < MIN) rw = MIN;
      if (rh < MIN) rh = MIN;
      setVip(p => ({ ...p, room: { x, y, w: rw, h: rh } }));
      setDirty(true);
    }
  }, [toWorld]);

  // ── Pointer up — commit history ──────────────────────────────
  const handlePointerUp = useCallback(() => {
    if (dragRef.current) {
      pushHistory();
      dragRef.current = null;
    }
  }, [pushHistory]);

  // ── Wheel zoom ───────────────────────────────────────────────
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    setZoom(z => Math.max(0.4, Math.min(2.8, z * (1 - e.deltaY * 0.0012))));
  }, []);

  // ── Add helpers ──────────────────────────────────────────────
  const addTable = useCallback((shape) => {
    pushHistory();
    // Find lowest unused table number (prevents duplicate-key on save)
    const used = new Set(tables.map(t => String(t.number)));
    let n = 1;
    while (used.has(String(n))) n++;
    const newT = {
      _localId:  `new-${localIdCtr++}`,
      number:    String(n),
      capacity:  4,
      shape,
      position:  { x: snap(220 + (tables.length % 4) * 120), y: snap(200 + Math.floor(tables.length / 4) * 130) },
    };
    setTables(p => [...p, newT]);
    setSelected({ type: 'table', id: newT._localId });
    setDirty(true);
  }, [tables, pushHistory]);

  const addZone = useCallback(() => {
    pushHistory();
    const rm   = vip.room ?? DEFAULT_ROOM;
    const col  = ZONE_COLORS[vip.zones.length % ZONE_COLORS.length];
    const newZ = {
      id:    genId(),
      label: `Zone ${vip.zones.length + 1}`,
      color: col,
      x:     snap(rm.x + 40),
      y:     snap(rm.y + 40),
      w:     160,
      h:     100,
    };
    setVip(p => ({ ...p, zones: [...p.zones, newZ] }));
    setSelected({ type: 'zone', id: newZ.id });
    setDirty(true);
  }, [vip, pushHistory]);

  // ── Update selected ──────────────────────────────────────────
  const updateSelectedTable = useCallback((key, value) => {
    if (!selected || selected.type !== 'table') return;
    pushHistory();
    setTables(p => p.map(t => (t._localId ?? t._id) === selected.id ? { ...t, [key]: value } : t));
    setDirty(true);
  }, [selected, pushHistory]);

  const updateSelectedZone = useCallback((key, value) => {
    if (!selected || selected.type !== 'zone') return;
    setVip(p => ({ ...p, zones: p.zones.map(z => z.id === selected.id ? { ...z, [key]: value } : z) }));
    setDirty(true);
  }, [selected]);

  // ── Delete selected ──────────────────────────────────────────
  const deleteSelected = useCallback(() => {
    if (!selected) return;
    pushHistory();
    if (selected.type === 'table') {
      const t = tables.find(t => (t._localId ?? t._id) === selected.id);
      if (t?._id && !String(t._id).startsWith('new-')) setDeletedIds(p => [...p, t._id]);
      setTables(p => p.filter(t => (t._localId ?? t._id) !== selected.id));
    } else if (selected.type === 'zone') {
      setVip(p => ({ ...p, zones: p.zones.filter(z => z.id !== selected.id) }));
    }
    setSelected(null);
    setDirty(true);
  }, [selected, tables, pushHistory]);

  // ── Save ─────────────────────────────────────────────────────
  const { mutate: saveAll, isPending: saving } = useMutation({
    mutationFn: async () => {
      await api.put('/restaurants/admin/mine', { vipService: vip });
      await Promise.all(deletedIds.map(id => api.delete(`/owner/tables/${id}`)));
      await Promise.all(tables.map(t => {
        const payload = { number: t.number, capacity: t.capacity, shape: t.shape, position: t.position };
        if (t._id && !String(t._id).startsWith('new-'))
          return api.patch(`/owner/tables/${t._id}`, payload);
        return api.post('/owner/tables', payload);
      }));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-tables'] });
      qc.invalidateQueries({ queryKey: ['my-restaurant'] });
      setDeletedIds([]);
      setDirty(false);
      toast.success('VIP setup saved!');
    },
    onError: () => toast.error('Save failed — please try again'),
  });

  // ── Keyboard shortcuts ────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
      if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, deleteSelected]);

  if (tablesLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <RefreshCw size={20} className="animate-spin text-orange-500"/>
      </div>
    );
  }

  const canUndo = historyRef.current.past.length > 0;
  const canRedo = historyRef.current.future.length > 0;

  return (
    <div className="p-5 sm:p-6 max-w-7xl space-y-5">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Crown size={18} className="text-orange-500"/> VIP Table Setup
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Design your floor plan and manage VIP booking service</p>
        </div>
        <button
          onClick={() => saveAll()}
          disabled={saving || !dirty}
          className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors shadow-sm shadow-orange-500/20 shrink-0"
        >
          <Save size={14}/>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* ── VIP Service toggle card ── */}
      <div className="bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/6 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">VIP Booking Service</p>
            <p className="text-xs text-gray-400 mt-0.5">Guests can pick and book a VIP table directly from your website</p>
          </div>
          <button
            onClick={() => { setVip(p => ({ ...p, enabled: !p.enabled })); setDirty(true); }}
            className="flex items-center gap-2 text-sm font-semibold transition-colors"
          >
            {vip.enabled
              ? <ToggleRight size={28} className="text-orange-500"/>
              : <ToggleLeft  size={28} className="text-gray-400"/>}
            <span className={vip.enabled ? 'text-orange-500' : 'text-gray-400'}>
              {vip.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </button>
        </div>

        {vip.enabled && (
          <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-white/8">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Min Spend (TND)</label>
              <input type="number" min={0} value={vip.minSpend}
                onChange={e => { setVip(p => ({ ...p, minSpend: Number(e.target.value) })); setDirty(true); }}
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-orange-400 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">VIP Description</label>
              <input type="text" value={vip.description} placeholder="e.g. Exclusive table with champagne"
                onChange={e => { setVip(p => ({ ...p, description: e.target.value })); setDirty(true); }}
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-orange-400 transition-colors"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Floor plan builder ── */}
      <div className="bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/6 rounded-2xl overflow-hidden">

        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-white/6 flex-wrap">

          {/* Add items */}
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mr-1">Add:</span>
          <button onClick={() => addTable('round')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 border border-blue-200 dark:border-blue-500/20 transition-colors">
            <Circle size={11}/> Round
          </button>
          <button onClick={() => addTable('square')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-500/20 border border-purple-200 dark:border-purple-500/20 transition-colors">
            <Square size={11}/> Square
          </button>
          <button onClick={() => addTable('rectangle')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-500/20 border border-teal-200 dark:border-teal-500/20 transition-colors">
            <span className="text-[11px] font-black">▬</span> Rect
          </button>
          <button onClick={addZone}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 border border-amber-200 dark:border-amber-500/20 transition-colors">
            <Tag size={11}/> Zone
          </button>

          <div className="flex-1"/>

          {/* Undo/Redo */}
          <div className="flex items-center gap-1 border border-gray-100 dark:border-white/8 rounded-xl p-0.5">
            <button onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)"
              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/8 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <Undo size={13}/>
            </button>
            <button onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)"
              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/8 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <Redo size={13}/>
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 border border-gray-100 dark:border-white/8 rounded-xl p-0.5">
            <button onClick={() => setZoom(z => Math.max(0.4, z - 0.15))} title="Zoom out"
              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/8 transition-colors">
              <ZoomOut size={13}/>
            </button>
            <button onClick={() => setZoom(1)}
              className="px-2 py-1 text-[11px] font-bold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white min-w-[44px] text-center transition-colors">
              {Math.round(zoom * 100)}%
            </button>
            <button onClick={() => setZoom(z => Math.min(2.8, z + 0.15))} title="Zoom in"
              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/8 transition-colors">
              <ZoomIn size={13}/>
            </button>
          </div>

          <button onClick={() => { setZoom(1); setSelected(null); }} title="Reset view"
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/8 border border-gray-100 dark:border-white/8 transition-colors">
            <RotateCcw size={13}/>
          </button>
        </div>

        {/* Canvas + Panel */}
        <div className="flex flex-col xl:flex-row">
          {/* Floor canvas */}
          <div className="flex-1 p-4 min-w-0">
            <FloorCanvas
              svgRef={svgRef}
              tables={tables}
              zones={vip.zones}
              room={vip.room}
              selected={selected}
              zoom={zoom}
              hoveredId={hoveredId}
              startTableDrag={startTableDrag}
              startZoneDrag={startZoneDrag}
              startZoneResize={startZoneResize}
              startRoomResize={startRoomResize}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onWheel={handleWheel}
              onBgClick={() => setSelected(null)}
            />
            <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-600">
              <span>{tables.length} table{tables.length !== 1 ? 's' : ''} · {vip.zones.length} zone{vip.zones.length !== 1 ? 's' : ''}</span>
              <span>Drag to position · Mouse wheel to zoom · Del to delete</span>
            </div>
          </div>

          {/* Edit panel */}
          <div className="w-full xl:w-64 border-t xl:border-t-0 xl:border-l border-gray-100 dark:border-white/6 min-h-[180px]">
            <EditPanel
              selected={selected}
              tables={tables}
              zones={vip.zones}
              onUpdateTable={updateSelectedTable}
              onUpdateZone={updateSelectedZone}
              onDelete={deleteSelected}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
