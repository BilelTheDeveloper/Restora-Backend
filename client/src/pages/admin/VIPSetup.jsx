import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Crown, Plus, Trash2, Save, ToggleLeft, ToggleRight,
  Circle, Square, RefreshCw, Undo, Redo,
  ZoomIn, ZoomOut, Tag, RotateCcw,
  Layers, DoorOpen, X, Minus, ArrowLeft,
  MousePointer2, Sun, Moon,
} from 'lucide-react';
import api from '../../services/api';

// ── Theme ──────────────────────────────────────────────────────
const THEMES = {
  dark: {
    bg:         '#0c0a07', surface:   '#111009', surface2:  '#1a1208',
    border:     '#2a1e0e', border2:   '#3a2a14',
    text:       '#e8c97a', textMuted: '#6b5c40', textFaint: '#3a2a14',
    accent:     '#f97316',
    extWall:    '#2c221a', intWall:   '#2e241a', intWallSel:'#5c3820',
    floorFill1: '#1b1208', floorFill2:'#1d1309', floorLine: '#0b0804',
    canvasBg:   '#0c0a07',
    tblG0:'#a07820', tblG50:'#6a4c14', tblG100:'#3b2708', tblBot:'#3a1f08', tblStr:'#7a5514',
    chairFill:  '#2c1c09', chairStr:  'rgba(180,130,50,0.38)',
    doorGap:    '#0c0a07',
    thumbBg:    '#0c0a07', thumbWall: '#2c221a', thumbFloor:'#1d1309',
    inputBg:    '#1a1208', inputText: '#e8c97a', inputPlh:  '#3a2a14',
  },
  light: {
    bg:         '#ede3d0', surface:   '#f7f0e4', surface2:  '#fff9f0',
    border:     '#c8b090', border2:   '#b09070',
    text:       '#3a2810', textMuted: '#7a6040', textFaint: '#b09060',
    accent:     '#f97316',
    extWall:    '#8a6840', intWall:   '#7a5c34', intWallSel:'#5c3820',
    floorFill1: '#d8caa8', floorFill2:'#d0c2a0', floorLine: '#b8a880',
    canvasBg:   '#ede3d0',
    tblG0:'#c89840', tblG50:'#9a7020', tblG100:'#6a4e10', tblBot:'#5a3c10', tblStr:'#9a7020',
    chairFill:  '#b89860', chairStr:  'rgba(100,70,20,0.5)',
    doorGap:    '#ede3d0',
    thumbBg:    '#d4c8b0', thumbWall: '#8a6840', thumbFloor:'#d0c2a0',
    inputBg:    '#fff9f0', inputText: '#3a2810', inputPlh:  '#c0a870',
  },
};

// ── Constants ──────────────────────────────────────────────────
const CANVAS_W  = 1000;
const CANVAS_H  = 680;
const CX        = CANVAS_W / 2;
const CY        = CANVAS_H / 2;
const GRID      = 20;
const WALL_T    = 14;
const CHAIR_R   = 7;
const CHAIR_GAP = 6;
const HANDLE_PX = 6;
const DRAG_THRESHOLD = 5; // px — below this, pointer-down is just a click
const DEFAULT_ROOM = { x: 100, y: 80, w: 800, h: 520 };
const ZONE_COLORS  = ['#f59e0b','#14b8a6','#f43f5e','#8b5cf6','#0ea5e9','#84cc16','#f97316','#ec4899'];
const DEFAULT_FLOOR = () => ({
  id: 'floor-main', name: 'Ground Floor', order: 0,
  room: { ...DEFAULT_ROOM }, zones: [], walls: [], doors: [], windows: [],
});

const snap  = v => Math.round(v / GRID) * GRID;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const genId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
let localIdCtr = 1;

// ── Capacity-aware table dimensions ───────────────────────────
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
  return cap <= 2 ? { hw: 22, hh: 22 } : { hw: 30, hh: 30 };
}

function computeChairs(cx, cy, shape, capacity) {
  const cap = Math.min(capacity, 12);
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
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1) return '';
  const nx = (-dy / len) * t / 2;
  const ny = (dx  / len) * t / 2;
  return `${x1+nx},${y1+ny} ${x2+nx},${y2+ny} ${x2-nx},${y2-ny} ${x1-nx},${y1-ny}`;
}

// ── Table presets ─────────────────────────────────────────────
const TABLE_PRESETS = [
  { shape: 'round',     cap: 2,  label: 'Round 2p'  },
  { shape: 'round',     cap: 4,  label: 'Round 4p'  },
  { shape: 'round',     cap: 6,  label: 'Round 6p'  },
  { shape: 'round',     cap: 8,  label: 'Round 8p'  },
  { shape: 'square',    cap: 2,  label: 'Square 2p' },
  { shape: 'square',    cap: 4,  label: 'Square 4p' },
  { shape: 'rectangle', cap: 4,  label: 'Rect 4p'   },
  { shape: 'rectangle', cap: 6,  label: 'Rect 6p'   },
  { shape: 'rectangle', cap: 8,  label: 'Rect 8p'   },
  { shape: 'rectangle', cap: 12, label: 'Banquet 12p'},
];

// ── Mini table preview ─────────────────────────────────────────
function TablePreviewSvg({ shape, cap, th }) {
  const { hw, hh } = tblHalf(shape, cap);
  const chairReach = Math.max(hw, hh) + CHAIR_GAP + CHAIR_R + 2;
  const vb = chairReach * 2 + 4;
  const C  = vb / 2;
  const chs = computeChairs(C, C, shape, cap);
  return (
    <svg viewBox={`0 0 ${vb} ${vb}`} width={52} height={52} style={{ display: 'block' }}>
      {chs.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={CHAIR_R * 0.75}
          fill={th.chairFill} stroke={th.chairStr} strokeWidth="0.8"/>
      ))}
      {shape === 'round' ? (
        <>
          <circle cx={C + 2} cy={C + 2} r={hw} fill={th.tblBot}/>
          <circle cx={C} cy={C} r={hw} fill={th.tblG50} stroke={th.tblStr} strokeWidth="1.2"/>
          <circle cx={C - hw*.3} cy={C - hw*.3} r={hw * 0.35} fill="rgba(255,255,255,0.07)"/>
        </>
      ) : (
        <>
          <rect x={C-hw+2} y={C-hh+2} width={hw*2} height={hh*2} rx={shape==='square'?5:4} fill={th.tblBot}/>
          <rect x={C-hw} y={C-hh} width={hw*2} height={hh*2} rx={shape==='square'?5:4}
            fill={th.tblG50} stroke={th.tblStr} strokeWidth="1.2"/>
        </>
      )}
    </svg>
  );
}

// ── Floor thumbnail (sidebar) ─────────────────────────────────
function FloorThumb({ floor, tables, th }) {
  const r = floor?.room ?? DEFAULT_ROOM;
  const pad = 6;
  const vw = r.w + pad*2, vh = r.h + pad*2;
  const ox = r.x - pad, oy = r.y - pad;
  return (
    <svg viewBox={`${ox} ${oy} ${vw} ${vh}`} width="100%" height={72} style={{ display: 'block' }}>
      <rect x={r.x - WALL_T} y={r.y - WALL_T} width={r.w + WALL_T*2} height={r.h + WALL_T*2}
        rx={WALL_T+4} fill={th.thumbWall}/>
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={th.thumbFloor}/>
      {(floor?.zones ?? []).map(z => (
        <rect key={z.id} x={z.x} y={z.y} width={z.w} height={z.h} rx={3}
          fill={z.color ?? '#f59e0b'} fillOpacity={0.3} stroke={z.color ?? '#f59e0b'} strokeOpacity={0.6} strokeWidth={1}/>
      ))}
      {tables.map(t => {
        const tx = t.position?.x ?? 200, ty = t.position?.y ?? 200;
        const { hw, hh } = tblHalf(t.shape, t.capacity);
        return t.shape === 'round'
          ? <circle key={t._localId ?? t._id} cx={tx} cy={ty} r={hw * 0.8} fill={th.tblStr}/>
          : <rect key={t._localId ?? t._id} x={tx - hw*.8} y={ty - hh*.8} width={hw*1.6} height={hh*1.6} rx={3} fill={th.tblStr}/>;
      })}
    </svg>
  );
}

// ── SVG sub-elements ──────────────────────────────────────────
function WallSeg({ w, sel, zoom, th, onPD, onSelect }) {
  const pts    = wallPoly(w.x1, w.y1, w.x2, w.y2, w.thickness ?? WALL_T);
  const hitPts = wallPoly(w.x1, w.y1, w.x2, w.y2, Math.max((w.thickness ?? WALL_T), 24));
  if (!pts) return null;
  return (
    <g>
      <polygon points={hitPts} fill="transparent" style={{ cursor: 'grab' }}
        onPointerDown={onPD} onClick={e => { e.stopPropagation(); onSelect(); }}/>
      <polygon points={pts}
        fill={sel ? th.intWallSel : th.intWall}
        stroke={sel ? '#f97316' : 'rgba(0,0,0,0.3)'}
        strokeWidth={sel ? 1.5 / zoom : 0.8 / zoom}
        style={{ pointerEvents: 'none' }}/>
    </g>
  );
}

function DoorEl({ d, sel, zoom, th, onPD, onSelect }) {
  const w   = d.width    ?? 70;
  const oa  = (d.openAngle ?? 75) * Math.PI / 180;
  const sd  = d.swingDir ?? 1;
  const pex = -w/2 + w * Math.cos(oa);
  const pey = w * Math.sin(oa) * sd;
  const col = sel ? '#f97316' : '#9b7a40';
  return (
    <g transform={`translate(${d.x} ${d.y}) rotate(${d.rotation ?? 0})`}
       style={{ cursor: 'grab' }} onPointerDown={onPD} onClick={e => { e.stopPropagation(); onSelect(); }}>
      <rect x={-w/2-10} y={-w-10} width={w+20} height={w+20} fill="transparent" style={{ pointerEvents: 'all' }}/>
      <rect x={-w/2-1} y={-WALL_T-3} width={w+2} height={WALL_T*2+6} fill={th.doorGap} style={{ pointerEvents: 'none' }}/>
      <line x1={-w/2} y1={-WALL_T} x2={-w/2} y2={WALL_T} stroke={col} strokeWidth={2/zoom} style={{ pointerEvents: 'none' }}/>
      <line x1={ w/2} y1={-WALL_T} x2={ w/2} y2={WALL_T} stroke={col} strokeWidth={2/zoom} style={{ pointerEvents: 'none' }}/>
      <path d={`M ${w/2} 0 A ${w} ${w} 0 0 ${sd>0?1:0} ${pex} ${pey}`}
        fill="none" stroke={col} strokeWidth={1/zoom} strokeDasharray={`${6/zoom} ${3/zoom}`} opacity={0.65}
        style={{ pointerEvents: 'none' }}/>
      <line x1={-w/2} y1={0} x2={pex} y2={pey}
        stroke={col} strokeWidth={sel ? 3.5/zoom : 2.5/zoom} strokeLinecap="round"
        style={{ pointerEvents: 'none' }}/>
      <circle cx={-w/2} cy={0} r={3.5/zoom} fill={col} style={{ pointerEvents: 'none' }}/>
    </g>
  );
}

function WindowEl({ w, sel, zoom, th, onPD, onSelect }) {
  const ww  = w.width ?? 80;
  const col = sel ? '#f97316' : '#2a5a9b';
  return (
    <g transform={`translate(${w.x} ${w.y}) rotate(${w.rotation ?? 0})`}
       style={{ cursor: 'grab' }} onPointerDown={onPD} onClick={e => { e.stopPropagation(); onSelect(); }}>
      <rect x={-ww/2-10} y={-14} width={ww+20} height={28} fill="transparent" style={{ pointerEvents: 'all' }}/>
      <rect x={-ww/2-1} y={-WALL_T-3} width={ww+2} height={WALL_T*2+6} fill={th.doorGap} style={{ pointerEvents: 'none' }}/>
      <line x1={-ww/2} y1={-WALL_T} x2={-ww/2} y2={WALL_T} stroke={sel?'#f97316':'#7a5c28'} strokeWidth={1.5/zoom} style={{ pointerEvents: 'none' }}/>
      <line x1={ ww/2} y1={-WALL_T} x2={ ww/2} y2={WALL_T} stroke={sel?'#f97316':'#7a5c28'} strokeWidth={1.5/zoom} style={{ pointerEvents: 'none' }}/>
      <rect x={-ww/2} y={-5} width={ww} height={10}
        fill="#1a3d6b" fillOpacity={0.9} stroke={col} strokeWidth={sel?1.5/zoom:1/zoom}
        style={{ pointerEvents: 'none' }}/>
      {[0, -ww*0.28, ww*0.28].map((gx, i) => (
        <line key={i} x1={gx} y1={-4} x2={gx} y2={4}
          stroke="#4a90d4" strokeWidth={0.8/zoom} opacity={0.8}
          style={{ pointerEvents: 'none' }}/>
      ))}
    </g>
  );
}

// ── Zone with 8-point handles ─────────────────────────────────
function ZoneEl({ z, sel, zoom, th, onMove, onResize, onClick }) {
  const HS  = HANDLE_PX / zoom;
  const col = z.color ?? '#f59e0b';
  const mx  = z.x + z.w / 2;
  const my  = z.y + z.h / 2;

  // 8 handles: 4 corners + 4 edge midpoints
  const handles = [
    { id: 'nw', x: z.x,       y: z.y,       cur: 'nw-resize' },
    { id: 'n',  x: mx,        y: z.y,        cur: 'n-resize'  },
    { id: 'ne', x: z.x + z.w, y: z.y,        cur: 'ne-resize' },
    { id: 'e',  x: z.x + z.w, y: my,         cur: 'e-resize'  },
    { id: 'se', x: z.x + z.w, y: z.y + z.h,  cur: 'se-resize' },
    { id: 's',  x: mx,        y: z.y + z.h,  cur: 's-resize'  },
    { id: 'sw', x: z.x,       y: z.y + z.h,  cur: 'sw-resize' },
    { id: 'w',  x: z.x,       y: my,         cur: 'w-resize'  },
  ];

  return (
    <g>
      {/* Main zone rect — drag to move */}
      <rect x={z.x} y={z.y} width={z.w} height={z.h} rx={6}
        fill={col} fillOpacity={sel ? 0.25 : 0.14}
        stroke={col} strokeOpacity={sel ? 1 : 0.45}
        strokeWidth={sel ? 2 / zoom : 1 / zoom}
        strokeDasharray={sel ? 'none' : `${6/zoom} ${3/zoom}`}
        style={{ cursor: 'move' }}
        onPointerDown={e => { e.stopPropagation(); onMove(e); }}
        onClick={e => { e.stopPropagation(); onClick(); }}
      />

      {/* Label */}
      {z.label && (
        <text x={z.x + 8} y={z.y + 14} fontSize={10 / zoom} fontWeight="700"
          fill={col} fillOpacity={0.9} style={{ userSelect: 'none', pointerEvents: 'none' }}>
          {z.label}
        </text>
      )}

      {/* Dimensions when selected */}
      {sel && (
        <text x={mx} y={my} textAnchor="middle" dominantBaseline="middle"
          fontSize={9 / zoom} fill={col} fillOpacity={0.6}
          style={{ userSelect: 'none', pointerEvents: 'none' }}>
          {Math.round(z.w)} × {Math.round(z.h)}
        </text>
      )}

      {/* 8-point handles — only when selected */}
      {sel && handles.map(h => (
        <rect key={h.id} x={h.x - HS} y={h.y - HS} width={HS*2} height={HS*2} rx={HS*0.35}
          fill="white" fillOpacity={0.9} stroke={col} strokeWidth={0.8 / zoom}
          style={{ cursor: h.cur }}
          onPointerDown={e => { e.stopPropagation(); onResize(e, h.id); }}
          onClick={e => e.stopPropagation()}
        />
      ))}
    </g>
  );
}

// ── Floor Canvas ──────────────────────────────────────────────
function FloorCanvas({
  svgRef, floor, tables, selected, zoom, toolMode, wallFirst, wallPreview, th,
  startTableDrag, startZoneDrag, startZoneResize, startRoomResize,
  startWallDrag, startDoorDrag, startWindowDrag,
  onPointerMove, onPointerUp, onWheel, onCanvasClick, onSelect,
}) {
  const HS  = HANDLE_PX / zoom;
  const r   = floor?.room ?? DEFAULT_ROOM;
  const walls   = floor?.walls   ?? [];
  const doors   = floor?.doors   ?? [];
  const windows = floor?.windows ?? [];
  const zones   = floor?.zones   ?? [];

  const ROOM_CORNERS = [
    ['nw', r.x,       r.y,       'nw-resize'],
    ['ne', r.x + r.w, r.y,       'ne-resize'],
    ['se', r.x + r.w, r.y + r.h, 'se-resize'],
    ['sw', r.x,       r.y + r.h, 'sw-resize'],
  ];

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
      className="w-full h-full touch-none select-none"
      style={{ background: th.canvasBg, cursor: toolMode === 'wall' ? 'crosshair' : 'default' }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onWheel={onWheel}
      onClick={onCanvasClick}
    >
      <defs>
        <pattern id="fp-planks" width="90" height="18" patternUnits="userSpaceOnUse">
          <rect width="90" height="18" fill={th.floorFill1}/>
          <rect y="1" width="90" height="17" fill={th.floorFill2}/>
          <line x1="0" y1="0" x2="90" y2="0" stroke={th.floorLine} strokeWidth="1.5"/>
          <line x1="10" y1="5" x2="68" y2="5" stroke="rgba(255,200,80,0.04)" strokeWidth="0.8"/>
        </pattern>
        <pattern id="fp-dot" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
          <circle cx={GRID/2} cy={GRID/2} r="0.7" fill="rgba(128,100,50,0.1)"/>
        </pattern>
        <pattern id="fp-hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(0,0,0,0.06)" strokeWidth="4"/>
        </pattern>
        {tables.map(t => {
          const id = t._localId ?? t._id;
          return (
            <radialGradient key={`g-${id}`} id={`tbl-${id}`} cx="38%" cy="32%" r="68%" gradientUnits="objectBoundingBox">
              <stop offset="0%"   stopColor={th.tblG0}/>
              <stop offset="50%"  stopColor={th.tblG50}/>
              <stop offset="100%" stopColor={th.tblG100}/>
            </radialGradient>
          );
        })}
        <filter id="fp-sel" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feFlood floodColor="#f97316" floodOpacity="0.7" result="c"/>
          <feComposite in="c" in2="b" operator="in" result="g"/>
          <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="tbl-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="3" dy="5" stdDeviation="4" floodColor="rgba(0,0,0,0.6)"/>
        </filter>
      </defs>

      <rect width={CANVAS_W} height={CANVAS_H} fill={th.canvasBg}/>

      <g transform={`translate(${CX} ${CY}) scale(${zoom}) translate(${-CX} ${-CY})`}>

        {/* Exterior wall */}
        <rect x={r.x - WALL_T} y={r.y - WALL_T} width={r.w + WALL_T*2} height={r.h + WALL_T*2}
          rx={WALL_T + 8} fill={th.extWall}/>
        <rect x={r.x - WALL_T} y={r.y - WALL_T} width={r.w + WALL_T*2} height={r.h + WALL_T*2}
          rx={WALL_T + 8} fill="url(#fp-hatch)" style={{ pointerEvents: 'none' }}/>
        <rect x={r.x - WALL_T - 2} y={r.y - WALL_T - 2} width={r.w + WALL_T*2 + 4} height={r.h + WALL_T*2 + 4}
          rx={WALL_T + 10} fill="none" stroke="rgba(255,255,255,0.04)"
          strokeWidth={3 / zoom} style={{ pointerEvents: 'none' }}/>

        {/* Door + window gaps */}
        {doors.map(d => (
          <g key={`dg-${d.id}`} transform={`translate(${d.x} ${d.y}) rotate(${d.rotation ?? 0})`} style={{ pointerEvents: 'none' }}>
            <rect x={-(d.width??70)/2-1} y={-WALL_T-3} width={(d.width??70)+2} height={WALL_T*2+6} fill={th.doorGap}/>
          </g>
        ))}
        {windows.map(w => (
          <g key={`wg-${w.id}`} transform={`translate(${w.x} ${w.y}) rotate(${w.rotation ?? 0})`} style={{ pointerEvents: 'none' }}>
            <rect x={-(w.width??80)/2-1} y={-WALL_T-3} width={(w.width??80)+2} height={WALL_T*2+6} fill={th.doorGap}/>
          </g>
        ))}

        {/* Floor */}
        <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="url(#fp-planks)"/>
        <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="url(#fp-dot)" style={{ pointerEvents: 'none' }}/>

        {/* Windows */}
        {windows.map(w => (
          <WindowEl key={w.id} w={w} th={th}
            sel={selected?.type === 'window' && selected?.id === w.id}
            zoom={zoom}
            onPD={e => { e.stopPropagation(); if (toolMode === 'select') startWindowDrag(e, w.id); }}
            onSelect={() => { if (toolMode === 'select') onSelect('window', w.id); }}
          />
        ))}

        {/* Doors */}
        {doors.map(d => (
          <DoorEl key={d.id} d={d} th={th}
            sel={selected?.type === 'door' && selected?.id === d.id}
            zoom={zoom}
            onPD={e => { e.stopPropagation(); if (toolMode === 'select') startDoorDrag(e, d.id); }}
            onSelect={() => { if (toolMode === 'select') onSelect('door', d.id); }}
          />
        ))}

        {/* Interior walls */}
        {walls.map(w => (
          <WallSeg key={w.id} w={w} th={th}
            sel={selected?.type === 'wall' && selected?.id === w.id}
            zoom={zoom}
            onPD={e => { e.stopPropagation(); if (toolMode === 'select') startWallDrag(e, w.id); }}
            onSelect={() => { if (toolMode === 'select') onSelect('wall', w.id); }}
          />
        ))}

        {/* Wall draw preview */}
        {toolMode === 'wall' && wallFirst && wallPreview && (
          <line x1={wallFirst.x} y1={wallFirst.y} x2={wallPreview.x} y2={wallPreview.y}
            stroke="#f97316" strokeWidth={WALL_T / zoom} strokeLinecap="round" opacity={0.5}
            style={{ pointerEvents: 'none' }}/>
        )}
        {toolMode === 'wall' && wallFirst && (
          <>
            <circle cx={wallFirst.x} cy={wallFirst.y} r={WALL_T * 0.65 / zoom}
              fill="#f97316" opacity={0.9} style={{ pointerEvents: 'none' }}/>
            <circle cx={wallFirst.x} cy={wallFirst.y} r={WALL_T * 1.4 / zoom}
              fill="none" stroke="#f97316" strokeWidth={1 / zoom} opacity={0.35}
              style={{ pointerEvents: 'none' }}/>
          </>
        )}

        {/* Zones */}
        {zones.map(z => (
          <ZoneEl key={z.id} z={z} zoom={zoom} th={th}
            sel={selected?.type === 'zone' && selected?.id === z.id}
            onMove={e => { if (toolMode === 'select') startZoneDrag(e, z.id); }}
            onResize={(e, corner) => { if (toolMode === 'select') startZoneResize(e, z.id, corner); }}
            onClick={() => { if (toolMode === 'select') onSelect('zone', z.id); }}
          />
        ))}

        {/* Tables — 2.5D */}
        {tables.map(t => {
          const id    = t._localId ?? t._id;
          const tx    = t.position?.x ?? 200;
          const ty    = t.position?.y ?? 200;
          const rot   = t.rotation ?? 0;
          const isSel = selected?.type === 'table' && selected?.id === id;
          const chs   = computeChairs(tx, ty, t.shape, t.capacity);
          const { hw, hh } = tblHalf(t.shape, t.capacity);
          const filt  = isSel ? 'url(#fp-sel)' : 'url(#tbl-shadow)';
          const EX    = 4;
          return (
            <g key={id}
              transform={`rotate(${rot}, ${tx}, ${ty})`}
              style={{ cursor: toolMode === 'select' ? 'grab' : 'crosshair' }}
              onPointerDown={e => { e.stopPropagation(); if (toolMode === 'select') startTableDrag(e, id); }}
              onClick={e => e.stopPropagation()}
            >
              {chs.map((c, i) => (
                <circle key={i} cx={c.x} cy={c.y} r={CHAIR_R}
                  fill={th.chairFill} stroke={th.chairStr} strokeWidth="1"
                  style={{ pointerEvents: 'none' }}/>
              ))}
              {t.shape === 'round' ? (
                <>
                  <ellipse cx={tx + EX} cy={ty + EX + hw * 0.2} rx={hw} ry={hw * 0.22}
                    fill="rgba(0,0,0,0.45)" style={{ pointerEvents: 'none' }}/>
                  <circle cx={tx + EX} cy={ty + EX} r={hw} fill={th.tblBot} style={{ pointerEvents: 'none' }}/>
                  <g filter={filt}>
                    <circle cx={tx} cy={ty} r={hw} fill={`url(#tbl-${id})`}
                      stroke={isSel ? '#f97316' : th.tblStr} strokeWidth={isSel ? 2.5 : 1.5}/>
                    <circle cx={tx - hw*.3} cy={ty - hw*.3} r={hw * 0.38}
                      fill="rgba(255,255,255,0.07)" style={{ pointerEvents: 'none' }}/>
                  </g>
                </>
              ) : (
                <>
                  <ellipse cx={tx + EX} cy={ty + hh + EX * 1.2} rx={hw * 1.05} ry={EX * 0.9}
                    fill="rgba(0,0,0,0.4)" style={{ pointerEvents: 'none' }}/>
                  <rect x={tx-hw+EX} y={ty-hh+EX} width={hw*2} height={hh*2}
                    rx={t.shape==='square'?6:4} fill={th.tblBot} style={{ pointerEvents: 'none' }}/>
                  <g filter={filt}>
                    <rect x={tx-hw} y={ty-hh} width={hw*2} height={hh*2}
                      rx={t.shape==='square'?6:4}
                      fill={`url(#tbl-${id})`} stroke={isSel?'#f97316':th.tblStr} strokeWidth={isSel?2.5:1.5}/>
                    <rect x={tx-hw*.6} y={ty-hh*.6} width={hw*1.2} height={hh*1.2}
                      rx={3} fill="rgba(255,255,255,0.055)" style={{ pointerEvents: 'none' }}/>
                  </g>
                </>
              )}
              <text x={tx} y={ty - 4} textAnchor="middle"
                fill="rgba(255,238,190,0.92)" fontSize={11} fontWeight="800"
                style={{ userSelect: 'none', pointerEvents: 'none' }}>
                {t.number || '?'}
              </text>
              <text x={tx} y={ty + 9} textAnchor="middle"
                fill="rgba(255,238,190,0.45)" fontSize={8.5}
                style={{ userSelect: 'none', pointerEvents: 'none' }}>
                {t.capacity}p
              </text>
            </g>
          );
        })}

        {/* Room resize handles (corners) */}
        {ROOM_CORNERS.map(([corner, hx, hy, cur]) => (
          <rect key={corner} x={hx - HS} y={hy - HS} width={HS*2} height={HS*2} rx={HS*0.3}
            fill="white" fillOpacity={0.7} stroke="rgba(255,255,255,0.25)" strokeWidth={0.5 / zoom}
            style={{ cursor: cur }}
            onPointerDown={e => { e.stopPropagation(); startRoomResize(e, corner); }}
            onClick={e => e.stopPropagation()}
          />
        ))}

        <rect x={r.x} y={r.y} width={r.w} height={r.h}
          fill="none" stroke="rgba(180,130,50,.15)" strokeWidth={1.5 / zoom}
          style={{ pointerEvents: 'none' }}/>

        {tables.length === 0 && (
          <text x={CX} y={CY} textAnchor="middle" dominantBaseline="middle"
            fill="rgba(128,100,50,0.25)" fontSize={14}>
            Pick a table from the right panel →
          </text>
        )}
      </g>
    </svg>
  );
}

// ── Properties panel ──────────────────────────────────────────
function PropertiesPanel({ selected, tables, floor, th, onUpdateTable, onUpdateZone, onUpdateWall, onUpdateDoor, onUpdateWindow, onDelete }) {
  const FLabel = ({ children }) => (
    <label style={{ color: th.textMuted }} className="text-[9px] font-bold uppercase tracking-widest">{children}</label>
  );

  const inp = `w-full rounded-lg px-3 py-2 text-sm font-semibold outline-none transition-colors`;

  if (!selected) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center px-4">
        <Crown size={24} style={{ color: th.border2 }} className="mb-2"/>
        <p style={{ color: th.textFaint }} className="text-xs">Select an element<br/>to edit properties</p>
      </div>
    );
  }

  if (selected.type === 'table') {
    const t = tables.find(t => (t._localId ?? t._id) === selected.id);
    if (!t) return null;
    const rot = t.rotation ?? 0;
    return (
      <div className="p-4 space-y-4">
        <p style={{ color: th.textMuted }} className="text-[9px] font-bold uppercase tracking-widest">Table</p>

        <div className="space-y-1">
          <FLabel>Number</FLabel>
          <input type="text" value={t.number ?? ''}
            onChange={e => onUpdateTable('number', e.target.value)}
            className={inp} style={{ background: th.inputBg, border: `1px solid ${th.border}`, color: th.inputText }}/>
        </div>

        <div className="space-y-1">
          <FLabel>Capacity</FLabel>
          <div className="flex items-center gap-2">
            <button onClick={() => onUpdateTable('capacity', Math.max(1, (t.capacity??4) - 1))}
              style={{ background: th.inputBg, border: `1px solid ${th.border}`, color: th.text }}
              className="w-8 h-8 rounded-lg font-bold flex items-center justify-center hover:opacity-80 transition-opacity">−</button>
            <span style={{ color: th.text }} className="flex-1 text-center text-sm font-bold">{t.capacity ?? 4} seats</span>
            <button onClick={() => onUpdateTable('capacity', (t.capacity??4) + 1)}
              style={{ background: th.inputBg, border: `1px solid ${th.border}`, color: th.text }}
              className="w-8 h-8 rounded-lg font-bold flex items-center justify-center hover:opacity-80 transition-opacity">+</button>
          </div>
        </div>

        <div className="space-y-1">
          <FLabel>Shape</FLabel>
          <div className="grid grid-cols-3 gap-1">
            {[
              { val: 'round',     icon: <Circle size={10}/>,  label: 'Round' },
              { val: 'square',    icon: <Square size={10}/>,  label: 'Square' },
              { val: 'rectangle', icon: <span className="text-[9px] font-black">▬</span>, label: 'Rect' },
            ].map(({ val, icon, label }) => (
              <button key={val} onClick={() => onUpdateTable('shape', val)}
                style={t.shape === val
                  ? { background: th.accent, color: '#fff', border: `1px solid ${th.accent}` }
                  : { background: 'transparent', color: th.textMuted, border: `1px solid ${th.border}` }}
                className="flex flex-col items-center gap-0.5 py-2 rounded-lg text-[9px] font-bold transition-all hover:opacity-80">
                {icon} {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <FLabel>Rotation</FLabel>
          <div className="flex items-center gap-1">
            <button onClick={() => onUpdateTable('rotation', ((rot - 15) + 360) % 360)}
              style={{ background: th.inputBg, border: `1px solid ${th.border}`, color: th.text }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-base hover:opacity-80">↺</button>
            <input type="number" min={0} max={359} value={rot}
              onChange={e => onUpdateTable('rotation', ((Number(e.target.value) % 360) + 360) % 360)}
              className="flex-1 text-center rounded-lg px-2 py-2 text-sm font-bold outline-none"
              style={{ background: th.inputBg, border: `1px solid ${th.border}`, color: th.text }}/>
            <button onClick={() => onUpdateTable('rotation', (rot + 15) % 360)}
              style={{ background: th.inputBg, border: `1px solid ${th.border}`, color: th.text }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-base hover:opacity-80">↻</button>
          </div>
          <div className="flex gap-1 pt-0.5">
            {[0, 45, 90, 135].map(a => (
              <button key={a} onClick={() => onUpdateTable('rotation', a)}
                style={rot === a
                  ? { background: th.accent, color: '#fff', border: `1px solid ${th.accent}` }
                  : { background: 'transparent', color: th.textMuted, border: `1px solid ${th.border}` }}
                className="flex-1 py-1 rounded-md text-[9px] font-bold transition-all hover:opacity-80">
                {a}°
              </button>
            ))}
          </div>
        </div>

        <button onClick={onDelete}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors">
          <Trash2 size={11}/> Delete Table
        </button>
      </div>
    );
  }

  if (selected.type === 'zone') {
    const z = floor?.zones?.find(z => z.id === selected.id);
    if (!z) return null;
    return (
      <div className="p-4 space-y-4">
        <p style={{ color: th.textMuted }} className="text-[9px] font-bold uppercase tracking-widest">Zone</p>
        <div className="space-y-1">
          <FLabel>Label</FLabel>
          <input type="text" value={z.label ?? ''} placeholder="e.g. VIP Section"
            onChange={e => onUpdateZone('label', e.target.value)}
            className={inp} style={{ background: th.inputBg, border: `1px solid ${th.border}`, color: th.inputText }}/>
        </div>
        <div className="space-y-1">
          <FLabel>Size</FLabel>
          <div className="grid grid-cols-2 gap-2">
            {[['W', 'w'], ['H', 'h']].map(([lbl, key]) => (
              <div key={key} className="space-y-0.5">
                <span style={{ color: th.textFaint }} className="text-[8px]">{lbl}</span>
                <input type="number" min={60} step={20} value={Math.round(z[key])}
                  onChange={e => onUpdateZone(key, Number(e.target.value))}
                  className="w-full rounded-lg px-2 py-1.5 text-xs font-bold outline-none"
                  style={{ background: th.inputBg, border: `1px solid ${th.border}`, color: th.text }}/>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <FLabel>Color</FLabel>
          <div className="flex flex-wrap gap-2">
            {ZONE_COLORS.map(col => (
              <button key={col} onClick={() => onUpdateZone('color', col)}
                className="w-6 h-6 rounded-md transition-all hover:scale-110"
                style={{ backgroundColor: col, boxShadow: z.color === col ? `0 0 0 2px ${th.bg}, 0 0 0 4px ${col}` : 'none' }}/>
            ))}
          </div>
        </div>
        <button onClick={onDelete}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors">
          <Trash2 size={11}/> Delete Zone
        </button>
      </div>
    );
  }

  if (selected.type === 'wall') {
    const w = floor?.walls?.find(w => w.id === selected.id);
    if (!w) return null;
    return (
      <div className="p-4 space-y-4">
        <p style={{ color: th.textMuted }} className="text-[9px] font-bold uppercase tracking-widest">Wall</p>
        <div className="space-y-1">
          <FLabel>Thickness ({w.thickness ?? WALL_T}px)</FLabel>
          <input type="range" min={8} max={28} step={2} value={w.thickness ?? WALL_T}
            onChange={e => onUpdateWall('thickness', Number(e.target.value))}
            className="w-full accent-orange-500"/>
        </div>
        <p style={{ color: th.textFaint }} className="text-[10px]">Length: {Math.round(Math.hypot(w.x2-w.x1, w.y2-w.y1))}px</p>
        <button onClick={onDelete}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors">
          <Trash2 size={11}/> Delete Wall
        </button>
      </div>
    );
  }

  if (selected.type === 'door') {
    const d = floor?.doors?.find(d => d.id === selected.id);
    if (!d) return null;
    return (
      <div className="p-4 space-y-4">
        <p style={{ color: th.textMuted }} className="text-[9px] font-bold uppercase tracking-widest">Door</p>
        <div className="space-y-1">
          <FLabel>Width ({d.width ?? 70}px)</FLabel>
          <input type="range" min={40} max={120} step={5} value={d.width ?? 70}
            onChange={e => onUpdateDoor('width', Number(e.target.value))} className="w-full accent-orange-500"/>
        </div>
        <div className="space-y-1">
          <FLabel>Open angle ({d.openAngle ?? 75}°)</FLabel>
          <input type="range" min={15} max={90} step={5} value={d.openAngle ?? 75}
            onChange={e => onUpdateDoor('openAngle', Number(e.target.value))} className="w-full accent-orange-500"/>
        </div>
        <div className="space-y-1">
          <FLabel>Rotation</FLabel>
          <div className="flex items-center gap-1">
            <button onClick={() => onUpdateDoor('rotation', (((d.rotation??0)-15)+360)%360)}
              style={{ background: th.inputBg, border: `1px solid ${th.border}`, color: th.text }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-base hover:opacity-80">↺</button>
            <span style={{ color: th.text }} className="flex-1 text-center text-sm font-bold">{d.rotation ?? 0}°</span>
            <button onClick={() => onUpdateDoor('rotation', ((d.rotation??0)+15)%360)}
              style={{ background: th.inputBg, border: `1px solid ${th.border}`, color: th.text }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-base hover:opacity-80">↻</button>
          </div>
        </div>
        <div className="space-y-1">
          <FLabel>Swing</FLabel>
          <div className="flex gap-1">
            {[1, -1].map(dir => (
              <button key={dir} onClick={() => onUpdateDoor('swingDir', dir)}
                style={(d.swingDir??1)===dir
                  ? { background: th.accent, color: '#fff', border: `1px solid ${th.accent}` }
                  : { background: 'transparent', color: th.textMuted, border: `1px solid ${th.border}` }}
                className="flex-1 py-1.5 rounded-lg text-[9px] font-bold transition-all hover:opacity-80">
                {dir === 1 ? 'Inward' : 'Outward'}
              </button>
            ))}
          </div>
        </div>
        <button onClick={onDelete}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors">
          <Trash2 size={11}/> Delete Door
        </button>
      </div>
    );
  }

  if (selected.type === 'window') {
    const w = floor?.windows?.find(w => w.id === selected.id);
    if (!w) return null;
    return (
      <div className="p-4 space-y-4">
        <p style={{ color: th.textMuted }} className="text-[9px] font-bold uppercase tracking-widest">Window</p>
        <div className="space-y-1">
          <FLabel>Width ({w.width ?? 80}px)</FLabel>
          <input type="range" min={40} max={160} step={10} value={w.width ?? 80}
            onChange={e => onUpdateWindow('width', Number(e.target.value))} className="w-full accent-orange-500"/>
        </div>
        <div className="space-y-1">
          <FLabel>Rotation</FLabel>
          <div className="flex items-center gap-1">
            <button onClick={() => onUpdateWindow('rotation', (((w.rotation??0)-15)+360)%360)}
              style={{ background: th.inputBg, border: `1px solid ${th.border}`, color: th.text }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-base hover:opacity-80">↺</button>
            <span style={{ color: th.text }} className="flex-1 text-center text-sm font-bold">{w.rotation ?? 0}°</span>
            <button onClick={() => onUpdateWindow('rotation', ((w.rotation??0)+15)%360)}
              style={{ background: th.inputBg, border: `1px solid ${th.border}`, color: th.text }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-base hover:opacity-80">↻</button>
          </div>
        </div>
        <button onClick={onDelete}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors">
          <Trash2 size={11}/> Delete Window
        </button>
      </div>
    );
  }

  return null;
}

// ── Main VIPSetup ─────────────────────────────────────────────
export default function VIPSetup() {
  const qc       = useQueryClient();
  const navigate = useNavigate();

  const { data: rd } = useQuery({
    queryKey: ['my-restaurant'],
    queryFn: () => api.get('/restaurants/admin/mine'),
  });
  const restaurant = rd?.data;

  const { data: tablesData, isLoading: tablesLoading } = useQuery({
    queryKey: ['my-tables'],
    queryFn: () => api.get('/owner/tables').then(r => r.data ?? []),
    enabled: !!restaurant,
  });

  // ── State ────────────────────────────────────────────────────
  const [darkMode,       setDarkMode]       = useState(true);
  const [floors,         setFloors]         = useState([DEFAULT_FLOOR()]);
  const [activeFloorId,  setActiveFloorId]  = useState('floor-main');
  const [tables,         setTables]         = useState([]);
  const [deletedIds,     setDeletedIds]     = useState([]);
  const [vipMeta,        setVipMeta]        = useState({ enabled: false, description: '', minSpend: 0 });
  const [selected,       setSelected]       = useState(null);
  const [toolMode,       setToolMode]       = useState('select');
  const [wallFirst,      setWallFirst]      = useState(null);
  const [wallPreview,    setWallPreview]    = useState(null);
  const [zoom,           setZoom]           = useState(1);
  const [dirty,          setDirty]          = useState(false);
  const [renamingFloor,  setRenamingFloor]  = useState(null);
  const [renameVal,      setRenameVal]      = useState('');

  const th = THEMES[darkMode ? 'dark' : 'light'];

  // ── Refs ─────────────────────────────────────────────────────
  const svgRef           = useRef();
  const dragRef          = useRef(null);
  const zoomRef          = useRef(1);
  const activeFloorIdRef = useRef(activeFloorId);
  const historyRef       = useRef({ past: [], future: [] });

  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { activeFloorIdRef.current = activeFloorId; }, [activeFloorId]);

  // ── Derived ──────────────────────────────────────────────────
  const activeFloor = useMemo(
    () => floors.find(f => f.id === activeFloorId) ?? floors[0],
    [floors, activeFloorId],
  );
  const floorTables = useMemo(
    () => tables.filter(t => (t.floorId ?? 'floor-main') === activeFloorId),
    [tables, activeFloorId],
  );

  const patchFloor = useCallback((updates) => {
    const afId = activeFloorIdRef.current;
    setFloors(p => p.map(f => f.id === afId ? { ...f, ...updates } : f));
    setDirty(true);
  }, []);

  // ── Seed from server ─────────────────────────────────────────
  useEffect(() => {
    if (tablesData) setTables(tablesData.map(t => ({ ...t, _localId: String(t._id) })));
  }, [tablesData]);

  useEffect(() => {
    if (!restaurant?.vipService) return;
    const vs = restaurant.vipService;
    setVipMeta({ enabled: vs.enabled ?? false, description: vs.description ?? '', minSpend: vs.minSpend ?? 0 });
    if (vs.floors?.length) {
      setFloors(vs.floors); setActiveFloorId(vs.floors[0].id);
    } else {
      const f = DEFAULT_FLOOR();
      if (vs.room)  f.room  = vs.room;
      if (vs.zones) f.zones = vs.zones;
      setFloors([f]); setActiveFloorId(f.id);
    }
  }, [restaurant]);

  // ── History ──────────────────────────────────────────────────
  const snapshot = useCallback(() => ({
    tables: tables.map(t => ({ ...t, position: { ...t.position } })),
    floors: floors.map(f => ({ ...f, zones: (f.zones??[]).map(z=>({...z})), walls: (f.walls??[]).map(w=>({...w})), doors: (f.doors??[]).map(d=>({...d})), windows: (f.windows??[]).map(w=>({...w})) })),
  }), [tables, floors]);

  const pushHistory = useCallback(() => {
    const h = historyRef.current;
    h.past.push(snapshot()); h.future = [];
    if (h.past.length > 60) h.past.shift();
  }, [snapshot]);

  const undo = useCallback(() => {
    const h = historyRef.current;
    if (!h.past.length) return;
    h.future.push(snapshot());
    const prev = h.past.pop();
    setTables(prev.tables); setFloors(prev.floors); setDirty(true); setSelected(null);
  }, [snapshot]);

  const redo = useCallback(() => {
    const h = historyRef.current;
    if (!h.future.length) return;
    h.past.push(snapshot());
    const next = h.future.pop();
    setTables(next.tables); setFloors(next.floors); setDirty(true); setSelected(null);
  }, [snapshot]);

  // ── SVG coord ────────────────────────────────────────────────
  const toWorld = useCallback((clientX, clientY) => {
    const rect = svgRef.current.getBoundingClientRect();
    const svgX  = (clientX - rect.left) * (CANVAS_W / rect.width);
    const svgY  = (clientY - rect.top)  * (CANVAS_H / rect.height);
    const z     = zoomRef.current;
    return { x: (svgX - CX) / z + CX, y: (svgY - CY) / z + CY };
  }, []);

  // ── Generic drag start — pointer capture deferred until threshold ─
  // DO NOT call setPointerCapture here. If we capture on pointer-down,
  // the subsequent click event fires on the SVG (not the element), which
  // triggers handleCanvasClick → setSelected(null), wiping the selection.
  // Capture is set the first time the pointer actually moves > DRAG_THRESHOLD.
  const startDrag = useCallback((e, data) => {
    dragRef.current = { ...data, pointerId: e.pointerId, startClientX: e.clientX, startClientY: e.clientY, moved: false };
  }, []);

  const startTableDrag = useCallback((e, id) => {
    const t = tables.find(t => (t._localId ?? t._id) === id);
    const w = toWorld(e.clientX, e.clientY);
    setSelected({ type: 'table', id });
    startDrag(e, { type: 'table', id, startMX: w.x, startMY: w.y, startOX: t?.position?.x ?? 0, startOY: t?.position?.y ?? 0 });
  }, [tables, toWorld, startDrag]);

  const startZoneDrag = useCallback((e, id) => {
    const z = floors.find(f => f.id === activeFloorIdRef.current)?.zones?.find(z => z.id === id);
    const w = toWorld(e.clientX, e.clientY);
    setSelected({ type: 'zone', id }); // select immediately on pointer-down
    startDrag(e, { type: 'zone-move', id, startMX: w.x, startMY: w.y, startOX: z?.x ?? 0, startOY: z?.y ?? 0 });
  }, [floors, toWorld, startDrag]);

  const startZoneResize = useCallback((e, id, corner) => {
    const z = floors.find(f => f.id === activeFloorIdRef.current)?.zones?.find(z => z.id === id);
    const w = toWorld(e.clientX, e.clientY);
    setSelected({ type: 'zone', id });
    startDrag(e, { type: 'zone-resize', id, corner, startMX: w.x, startMY: w.y, startOX: z?.x ?? 0, startOY: z?.y ?? 0, startOW: z?.w ?? 160, startOH: z?.h ?? 100 });
  }, [floors, toWorld, startDrag]);

  const startRoomResize = useCallback((e, corner) => {
    const af = floors.find(f => f.id === activeFloorIdRef.current);
    const rm = af?.room ?? DEFAULT_ROOM;
    const w  = toWorld(e.clientX, e.clientY);
    startDrag(e, { type: 'room-resize', corner, startMX: w.x, startMY: w.y, startOX: rm.x, startOY: rm.y, startOW: rm.w, startOH: rm.h });
  }, [floors, toWorld, startDrag]);

  const startWallDrag = useCallback((e, id) => {
    const af   = floors.find(f => f.id === activeFloorIdRef.current);
    const wall = af?.walls?.find(w => w.id === id);
    const w    = toWorld(e.clientX, e.clientY);
    setSelected({ type: 'wall', id });
    startDrag(e, { type: 'wall-move', id, startMX: w.x, startMY: w.y, startOX: wall?.x1??0, startOY: wall?.y1??0, startOX2: wall?.x2??100, startOY2: wall?.y2??0 });
  }, [floors, toWorld, startDrag]);

  const startDoorDrag = useCallback((e, id) => {
    const af   = floors.find(f => f.id === activeFloorIdRef.current);
    const door = af?.doors?.find(d => d.id === id);
    const w    = toWorld(e.clientX, e.clientY);
    setSelected({ type: 'door', id });
    startDrag(e, { type: 'door-move', id, startMX: w.x, startMY: w.y, startOX: door?.x??0, startOY: door?.y??0 });
  }, [floors, toWorld, startDrag]);

  const startWindowDrag = useCallback((e, id) => {
    const af  = floors.find(f => f.id === activeFloorIdRef.current);
    const win = af?.windows?.find(w => w.id === id);
    const w   = toWorld(e.clientX, e.clientY);
    setSelected({ type: 'window', id });
    startDrag(e, { type: 'window-move', id, startMX: w.x, startMY: w.y, startOX: win?.x??0, startOY: win?.y??0 });
  }, [floors, toWorld, startDrag]);

  // ── Pointer move ─────────────────────────────────────────────
  const handlePointerMove = useCallback((e) => {
    if (toolMode === 'wall' && wallFirst) {
      const w = toWorld(e.clientX, e.clientY);
      setWallPreview({ x: snap(w.x), y: snap(w.y) });
    }
    if (!dragRef.current) return;
    const drag = dragRef.current;

    // Enforce drag threshold — capture pointer only once movement is real
    if (!drag.moved) {
      const dist = Math.hypot(e.clientX - drag.startClientX, e.clientY - drag.startClientY);
      if (dist < DRAG_THRESHOLD) return;
      drag.moved = true;
      // Capture here (not on pointer-down) so click events still fire on elements
      svgRef.current.setPointerCapture(drag.pointerId);
      pushHistory();
    }

    const { type, id, corner, startMX, startMY, startOX, startOY, startOW, startOH, startOX2, startOY2 } = drag;
    const w  = toWorld(e.clientX, e.clientY);
    const dx = w.x - startMX;
    const dy = w.y - startMY;
    const afId = activeFloorIdRef.current;

    if (type === 'table') {
      const nx = snap(clamp(startOX + dx, 30, CANVAS_W - 30));
      const ny = snap(clamp(startOY + dy, 30, CANVAS_H - 30));
      setTables(p => p.map(t => (t._localId ?? t._id) === id ? { ...t, position: { x: nx, y: ny } } : t));
      setDirty(true);

    } else if (type === 'zone-move') {
      setFloors(p => p.map(f => f.id === afId ? { ...f, zones: f.zones.map(z => z.id === id ? { ...z, x: snap(startOX + dx), y: snap(startOY + dy) } : z) } : f));
      setDirty(true);

    } else if (type === 'zone-resize') {
      // 8-point handles
      let x = startOX, y = startOY, zw = startOW, zh = startOH;
      const c = corner;
      if (c === 'nw' || c === 'sw' || c === 'w') { x = snap(startOX + dx); zw = snap(startOW - dx); }
      else if (c === 'ne' || c === 'se' || c === 'e') { zw = snap(startOW + dx); }
      if (c === 'nw' || c === 'n' || c === 'ne') { y = snap(startOY + dy); zh = snap(startOH - dy); }
      else if (c === 'sw' || c === 's' || c === 'se') { zh = snap(startOH + dy); }
      if (zw < 60) zw = 60;
      if (zh < 40) zh = 40;
      setFloors(p => p.map(f => f.id === afId ? { ...f, zones: f.zones.map(z => z.id === id ? { ...z, x, y, w: zw, h: zh } : z) } : f));
      setDirty(true);

    } else if (type === 'room-resize') {
      const MIN = 200;
      let x = startOX, y = startOY, rw = startOW, rh = startOH;
      if (corner === 'nw') { x = snap(startOX + dx); y = snap(startOY + dy); rw = snap(startOW - dx); rh = snap(startOH - dy); }
      else if (corner === 'ne') { rw = snap(startOW + dx); y = snap(startOY + dy); rh = snap(startOH - dy); }
      else if (corner === 'se') { rw = snap(startOW + dx); rh = snap(startOH + dy); }
      else if (corner === 'sw') { x = snap(startOX + dx); rw = snap(startOW - dx); rh = snap(startOH + dy); }
      if (rw < MIN) rw = MIN; if (rh < MIN) rh = MIN;
      setFloors(p => p.map(f => f.id === afId ? { ...f, room: { x, y, w: rw, h: rh } } : f));
      setDirty(true);

    } else if (type === 'wall-move') {
      setFloors(p => p.map(f => f.id === afId ? { ...f, walls: f.walls.map(wall => wall.id === id ? { ...wall, x1: snap(startOX+dx), y1: snap(startOY+dy), x2: snap(startOX2+dx), y2: snap(startOY2+dy) } : wall) } : f));
      setDirty(true);
    } else if (type === 'door-move') {
      setFloors(p => p.map(f => f.id === afId ? { ...f, doors: f.doors.map(d => d.id === id ? { ...d, x: snap(startOX+dx), y: snap(startOY+dy) } : d) } : f));
      setDirty(true);
    } else if (type === 'window-move') {
      setFloors(p => p.map(f => f.id === afId ? { ...f, windows: f.windows.map(win => win.id === id ? { ...win, x: snap(startOX+dx), y: snap(startOY+dy) } : win) } : f));
      setDirty(true);
    }
  }, [toolMode, wallFirst, toWorld, pushHistory]);

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    setZoom(z => Math.max(0.3, Math.min(3, z * (1 - e.deltaY * 0.001))));
  }, []);

  const handleCanvasClick = useCallback((e) => {
    if (toolMode === 'wall') {
      const w  = toWorld(e.clientX, e.clientY);
      const pt = { x: snap(w.x), y: snap(w.y) };
      if (!wallFirst) {
        setWallFirst(pt);
      } else {
        if (Math.hypot(pt.x - wallFirst.x, pt.y - wallFirst.y) > 10) {
          pushHistory();
          const nw = { id: genId(), x1: wallFirst.x, y1: wallFirst.y, x2: pt.x, y2: pt.y, thickness: WALL_T };
          setFloors(p => p.map(f => f.id === activeFloorIdRef.current ? { ...f, walls: [...(f.walls ?? []), nw] } : f));
          setDirty(true);
        }
        setWallFirst(null); setWallPreview(null);
      }
    } else {
      setSelected(null);
    }
  }, [toolMode, wallFirst, toWorld, pushHistory]);

  // ── Add helpers ──────────────────────────────────────────────
  const addTable = useCallback((shape, cap) => {
    pushHistory();
    const used = new Set(tables.map(t => String(t.number)));
    let n = 1;
    while (used.has(String(n))) n++;
    const newT = {
      _localId: `new-${localIdCtr++}`,
      number:   String(n),
      capacity: cap, shape, rotation: 0,
      floorId:  activeFloorIdRef.current,
      position: { x: snap(220 + (floorTables.length % 4) * 130), y: snap(200 + Math.floor(floorTables.length / 4) * 140) },
    };
    setTables(p => [...p, newT]);
    setSelected({ type: 'table', id: newT._localId });
    setDirty(true);
  }, [tables, floorTables.length, pushHistory]);

  const addZone = useCallback(() => {
    pushHistory();
    const r   = activeFloor?.room ?? DEFAULT_ROOM;
    const col = ZONE_COLORS[(activeFloor?.zones?.length ?? 0) % ZONE_COLORS.length];
    const nz  = { id: genId(), label: `Zone ${(activeFloor?.zones?.length ?? 0) + 1}`, color: col, x: snap(r.x + 40), y: snap(r.y + 40), w: 180, h: 120 };
    patchFloor({ zones: [...(activeFloor?.zones ?? []), nz] });
    setSelected({ type: 'zone', id: nz.id });
  }, [activeFloor, patchFloor, pushHistory]);

  const addDoor = useCallback(() => {
    pushHistory();
    const r  = activeFloor?.room ?? DEFAULT_ROOM;
    const nd = { id: genId(), x: snap(r.x + r.w / 2), y: r.y, rotation: 0, width: 70, openAngle: 75, swingDir: 1 };
    patchFloor({ doors: [...(activeFloor?.doors ?? []), nd] });
    setSelected({ type: 'door', id: nd.id });
  }, [activeFloor, patchFloor, pushHistory]);

  const addWindow = useCallback(() => {
    pushHistory();
    const r  = activeFloor?.room ?? DEFAULT_ROOM;
    const nw = { id: genId(), x: snap(r.x + r.w / 3), y: r.y, rotation: 0, width: 80 };
    patchFloor({ windows: [...(activeFloor?.windows ?? []), nw] });
    setSelected({ type: 'window', id: nw.id });
  }, [activeFloor, patchFloor, pushHistory]);

  // ── Update ───────────────────────────────────────────────────
  const updateSelectedTable = useCallback((key, value) => {
    if (!selected || selected.type !== 'table') return;
    pushHistory();
    setTables(p => p.map(t => (t._localId ?? t._id) === selected.id ? { ...t, [key]: value } : t));
    setDirty(true);
  }, [selected, pushHistory]);

  const updateSelectedZone = useCallback((key, value) => {
    if (!selected || selected.type !== 'zone') return;
    setFloors(p => p.map(f => f.id === activeFloorIdRef.current ? { ...f, zones: f.zones.map(z => z.id === selected.id ? { ...z, [key]: value } : z) } : f));
    setDirty(true);
  }, [selected]);

  const updateSelectedWall = useCallback((key, value) => {
    if (!selected || selected.type !== 'wall') return;
    setFloors(p => p.map(f => f.id === activeFloorIdRef.current ? { ...f, walls: f.walls.map(w => w.id === selected.id ? { ...w, [key]: value } : w) } : f));
    setDirty(true);
  }, [selected]);

  const updateSelectedDoor = useCallback((key, value) => {
    if (!selected || selected.type !== 'door') return;
    setFloors(p => p.map(f => f.id === activeFloorIdRef.current ? { ...f, doors: f.doors.map(d => d.id === selected.id ? { ...d, [key]: value } : d) } : f));
    setDirty(true);
  }, [selected]);

  const updateSelectedWindow = useCallback((key, value) => {
    if (!selected || selected.type !== 'window') return;
    setFloors(p => p.map(f => f.id === activeFloorIdRef.current ? { ...f, windows: f.windows.map(w => w.id === selected.id ? { ...w, [key]: value } : w) } : f));
    setDirty(true);
  }, [selected]);

  // ── Delete ───────────────────────────────────────────────────
  const deleteSelected = useCallback(() => {
    if (!selected) return;
    pushHistory();
    const afId = activeFloorIdRef.current;
    if (selected.type === 'table') {
      const t = tables.find(t => (t._localId ?? t._id) === selected.id);
      if (t?._id && !String(t._id).startsWith('new-')) setDeletedIds(p => [...p, t._id]);
      setTables(p => p.filter(t => (t._localId ?? t._id) !== selected.id));
    } else if (selected.type === 'zone') {
      setFloors(p => p.map(f => f.id === afId ? { ...f, zones: f.zones.filter(z => z.id !== selected.id) } : f));
    } else if (selected.type === 'wall') {
      setFloors(p => p.map(f => f.id === afId ? { ...f, walls: f.walls.filter(w => w.id !== selected.id) } : f));
    } else if (selected.type === 'door') {
      setFloors(p => p.map(f => f.id === afId ? { ...f, doors: f.doors.filter(d => d.id !== selected.id) } : f));
    } else if (selected.type === 'window') {
      setFloors(p => p.map(f => f.id === afId ? { ...f, windows: f.windows.filter(w => w.id !== selected.id) } : f));
    }
    setSelected(null); setDirty(true);
  }, [selected, tables, pushHistory]);

  // ── Floor management ─────────────────────────────────────────
  const addFloor = useCallback(() => {
    pushHistory();
    const f = { id: genId(), name: `Floor ${floors.length + 1}`, order: floors.length, room: { ...DEFAULT_ROOM }, zones: [], walls: [], doors: [], windows: [] };
    setFloors(p => [...p, f]);
    setActiveFloorId(f.id);
    setSelected(null); setDirty(true);
  }, [floors, pushHistory]);

  const deleteFloor = useCallback((id) => {
    if (floors.length <= 1) return;
    pushHistory();
    const fTables = tables.filter(t => (t.floorId ?? 'floor-main') === id);
    setDeletedIds(p => [...p, ...fTables.filter(t => t._id && !String(t._id).startsWith('new-')).map(t => t._id)]);
    setTables(p => p.filter(t => (t.floorId ?? 'floor-main') !== id));
    setFloors(p => p.filter(f => f.id !== id));
    setActiveFloorId(p => p === id ? floors.find(f => f.id !== id)?.id ?? floors[0].id : p);
    setSelected(null); setDirty(true);
  }, [floors, tables, pushHistory]);

  const renameFloor = useCallback((id, name) => {
    setFloors(p => p.map(f => f.id === id ? { ...f, name } : f));
    setDirty(true);
  }, []);

  // ── Save ─────────────────────────────────────────────────────
  const { mutate: saveAll, isPending: saving } = useMutation({
    mutationFn: async () => {
      await api.put('/restaurants/admin/mine', {
        vipService: { ...vipMeta, floors, room: floors[0]?.room ?? DEFAULT_ROOM, zones: floors[0]?.zones ?? [] },
      });
      await Promise.all(deletedIds.map(id => api.delete(`/owner/tables/${id}`)));
      for (const t of tables) {
        const payload = { number: t.number, capacity: t.capacity, shape: t.shape, position: t.position, rotation: t.rotation ?? 0, floorId: t.floorId ?? 'floor-main' };
        if (t._id && !String(t._id).startsWith('new-'))
          await api.patch(`/owner/tables/${t._id}`, payload);
        else
          await api.post('/owner/tables', payload);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-tables'] });
      qc.invalidateQueries({ queryKey: ['my-restaurant'] });
      setDeletedIds([]); setDirty(false); setSelected(null);
      historyRef.current = { past: [], future: [] };
      toast.success('VIP setup saved!');
    },
    onError: err => toast.error(err?.response?.data?.message ?? 'Save failed'),
  });

  // ── Keyboard ─────────────────────────────────────────────────
  useEffect(() => {
    const h = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
      if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected();
      if (e.key === 'Escape') { setToolMode('select'); setWallFirst(null); setWallPreview(null); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [undo, redo, deleteSelected]);

  if (tablesLoading) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: th.bg }}
        className="flex items-center justify-center">
        <RefreshCw size={24} style={{ color: th.accent }} className="animate-spin"/>
      </div>
    );
  }

  const canUndo = historyRef.current.past.length > 0;
  const canRedo = historyRef.current.future.length > 0;

  const iconBtn = `p-1.5 rounded-lg transition-colors`;

  // ── Render ───────────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: th.bg, display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <div style={{ background: th.surface, borderBottom: `1px solid ${th.border}`, height: 52, flexShrink: 0 }}
        className="flex items-center gap-3 px-4">
        <button onClick={() => navigate('/admin')}
          style={{ color: th.textMuted, border: `1px solid ${th.border}` }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-70 transition-opacity">
          <ArrowLeft size={13}/> Back
        </button>

        <div style={{ width: 1, height: 20, background: th.border }}/>

        <div className="flex items-center gap-2">
          <Crown size={15} style={{ color: th.accent }}/>
          <span style={{ color: th.text }} className="text-sm font-bold">Floor Plan Builder</span>
          {dirty && <span style={{ background: th.accent }} className="w-1.5 h-1.5 rounded-full"/>}
        </div>

        <div style={{ flex: 1 }}/>

        {/* Theme toggle */}
        <button onClick={() => setDarkMode(d => !d)}
          style={{ border: `1px solid ${th.border}`, color: th.textMuted }}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity">
          {darkMode ? <Sun size={14}/> : <Moon size={14}/>}
        </button>

        {/* VIP toggle */}
        <button onClick={() => { setVipMeta(p => ({ ...p, enabled: !p.enabled })); setDirty(true); }}
          style={{ border: `1px solid ${th.border}` }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:opacity-80">
          {vipMeta.enabled
            ? <><ToggleRight size={18} style={{ color: th.accent }}/><span style={{ color: th.accent }}>VIP On</span></>
            : <><ToggleLeft size={18} style={{ color: th.textFaint }}/><span style={{ color: th.textFaint }}>VIP Off</span></>}
        </button>

        {vipMeta.enabled && (
          <input type="number" min={0} value={vipMeta.minSpend} placeholder="Min spend"
            onChange={e => { setVipMeta(p => ({ ...p, minSpend: Number(e.target.value) })); setDirty(true); }}
            style={{ background: th.inputBg, border: `1px solid ${th.border}`, color: th.text }}
            className="w-24 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-orange-400 transition-colors"/>
        )}

        <button onClick={() => saveAll()} disabled={saving || !dirty}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: saving || !dirty ? th.border2 : th.accent }}>
          <Save size={12}/>{saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── LEFT SIDEBAR ── */}
        <div style={{ width: 200, background: th.surface, borderRight: `1px solid ${th.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ borderBottom: `1px solid ${th.border}` }} className="flex items-center justify-between px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <Layers size={11} style={{ color: th.textMuted }}/>
              <span style={{ color: th.textMuted }} className="text-[9px] font-bold uppercase tracking-widest">Floors</span>
            </div>
            <button onClick={addFloor}
              style={{ background: th.surface2, border: `1px solid ${th.border}`, color: th.textMuted }}
              className="w-6 h-6 rounded-md flex items-center justify-center hover:opacity-70 transition-opacity">
              <Plus size={11}/>
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }} className="py-2 px-2 space-y-1.5">
            {floors.map(f => {
              const isActive = f.id === activeFloorId;
              const fTbls    = tables.filter(t => (t.floorId ?? 'floor-main') === f.id);
              return (
                <div key={f.id}
                  onClick={() => { setActiveFloorId(f.id); setSelected(null); setWallFirst(null); }}
                  style={{
                    border: isActive ? `1.5px solid ${th.accent}` : `1px solid ${th.border}`,
                    background: isActive ? th.surface2 : 'transparent',
                    cursor: 'pointer',
                    transition: 'all .15s',
                  }}
                  className="rounded-xl overflow-hidden group hover:opacity-90">
                  <div style={{ background: th.thumbBg, borderBottom: `1px solid ${th.border}` }}>
                    <FloorThumb floor={f} tables={fTbls} th={th}/>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1.5">
                    {renamingFloor === f.id ? (
                      <input autoFocus value={renameVal}
                        onChange={e => setRenameVal(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') { if (renameVal.trim()) renameFloor(f.id, renameVal.trim()); setRenamingFloor(null); }
                          if (e.key === 'Escape') setRenamingFloor(null);
                        }}
                        onBlur={() => { if (renameVal.trim()) renameFloor(f.id, renameVal.trim()); setRenamingFloor(null); }}
                        onClick={e => e.stopPropagation()}
                        style={{ color: th.text, borderBottom: `1px solid ${th.accent}` }}
                        className="flex-1 bg-transparent text-[10px] font-bold outline-none"/>
                    ) : (
                      <span
                        style={{ color: isActive ? th.text : th.textFaint }}
                        className="flex-1 text-[10px] font-bold truncate"
                        onDoubleClick={e => { e.stopPropagation(); setRenamingFloor(f.id); setRenameVal(f.name); }}>
                        {f.name}
                      </span>
                    )}
                    <span style={{ color: th.textFaint }} className="text-[9px] shrink-0">{fTbls.length}t</span>
                    {floors.length > 1 && (
                      <button
                        onClick={e => { e.stopPropagation(); deleteFloor(f.id); }}
                        className="opacity-0 group-hover:opacity-100 w-4 h-4 rounded flex items-center justify-center text-red-500 hover:text-red-400 transition-all shrink-0">
                        <X size={9}/>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── CENTER ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Toolbar */}
          <div style={{ borderBottom: `1px solid ${th.border}`, background: th.surface, flexShrink: 0 }}
            className="flex items-center gap-1.5 px-3 py-2 flex-wrap">

            {[
              { mode: 'select', icon: <MousePointer2 size={11}/>, label: 'Select' },
              { mode: 'wall',   icon: <Minus size={11}/>,         label: toolMode === 'wall' && wallFirst ? 'Click 2nd…' : 'Wall' },
            ].map(({ mode, icon, label }) => (
              <button key={mode}
                onClick={() => { setToolMode(mode); if (mode !== 'wall') { setWallFirst(null); setWallPreview(null); } }}
                style={toolMode === mode
                  ? { background: th.accent, color: '#fff', border: `1px solid ${th.accent}` }
                  : { background: 'transparent', color: th.textMuted, border: `1px solid ${th.border}` }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all hover:opacity-80">
                {icon} {label}
              </button>
            ))}

            <div style={{ width: 1, height: 16, background: th.border }} className="mx-1"/>

            <span style={{ color: th.textFaint }} className="text-[9px] font-bold uppercase tracking-widest">Add:</span>

            {[
              { onClick: addZone,   icon: <Tag size={10}/>,          label: 'Zone' },
              { onClick: addDoor,   icon: <DoorOpen size={10}/>,     label: 'Door' },
              { onClick: addWindow, icon: <span className="text-[10px] font-black">⊟</span>, label: 'Window' },
            ].map(({ onClick, icon, label }) => (
              <button key={label} onClick={onClick}
                style={{ background: 'transparent', color: th.textMuted, border: `1px solid ${th.border}` }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold hover:opacity-70 transition-opacity">
                {icon} {label}
              </button>
            ))}

            <div style={{ flex: 1 }}/>

            <span style={{ color: th.textFaint }} className="text-[9px]">
              {floorTables.length}t · {activeFloor?.walls?.length ?? 0}w · {activeFloor?.doors?.length ?? 0}d
            </span>

            <div style={{ width: 1, height: 16, background: th.border }} className="mx-1"/>

            <button onClick={undo} disabled={!canUndo} title="Ctrl+Z"
              style={{ color: th.textMuted }} className={iconBtn + ' disabled:opacity-20 hover:opacity-60 disabled:cursor-not-allowed'}>
              <Undo size={12}/>
            </button>
            <button onClick={redo} disabled={!canRedo} title="Ctrl+Y"
              style={{ color: th.textMuted }} className={iconBtn + ' disabled:opacity-20 hover:opacity-60 disabled:cursor-not-allowed'}>
              <Redo size={12}/>
            </button>

            <div style={{ width: 1, height: 16, background: th.border }} className="mx-1"/>

            <button onClick={() => setZoom(z => Math.max(0.3, z - 0.15))} style={{ color: th.textMuted }} className={iconBtn + ' hover:opacity-60'}><ZoomOut size={12}/></button>
            <button onClick={() => setZoom(1)} style={{ color: th.textMuted }} className="px-2 py-1 text-[10px] font-bold hover:opacity-60 min-w-[40px] text-center">
              {Math.round(zoom * 100)}%
            </button>
            <button onClick={() => setZoom(z => Math.min(3, z + 0.15))} style={{ color: th.textMuted }} className={iconBtn + ' hover:opacity-60'}><ZoomIn size={12}/></button>
            <button onClick={() => { setZoom(1); setSelected(null); }} title="Reset" style={{ color: th.textMuted }} className={iconBtn + ' hover:opacity-60'}><RotateCcw size={12}/></button>
          </div>

          {/* Canvas */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <FloorCanvas
              svgRef={svgRef} floor={activeFloor} tables={floorTables} selected={selected}
              zoom={zoom} toolMode={toolMode} wallFirst={wallFirst} wallPreview={wallPreview} th={th}
              startTableDrag={startTableDrag} startZoneDrag={startZoneDrag}
              startZoneResize={startZoneResize} startRoomResize={startRoomResize}
              startWallDrag={startWallDrag} startDoorDrag={startDoorDrag} startWindowDrag={startWindowDrag}
              onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}
              onWheel={handleWheel} onCanvasClick={handleCanvasClick}
              onSelect={(type, id) => setSelected({ type, id })}
            />
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{ width: 220, background: th.surface, borderLeft: `1px solid ${th.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Table palette */}
          <div style={{ borderBottom: `1px solid ${th.border}`, flexShrink: 0 }} className="px-3 py-2.5">
            <p style={{ color: th.textMuted }} className="text-[9px] font-bold uppercase tracking-widest mb-2">Place Table</p>
            <div className="grid grid-cols-2 gap-1.5">
              {TABLE_PRESETS.map(({ shape, cap, label }) => (
                <button key={`${shape}-${cap}`} onClick={() => addTable(shape, cap)}
                  style={{ border: `1px solid ${th.border}`, background: 'transparent' }}
                  className="flex flex-col items-center gap-1 py-2 rounded-xl hover:opacity-70 transition-opacity group">
                  <TablePreviewSvg shape={shape} cap={cap} th={th}/>
                  <span style={{ color: th.textMuted }} className="text-[8px] font-bold">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Properties */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <PropertiesPanel
              selected={selected} tables={tables} floor={activeFloor} th={th}
              onUpdateTable={updateSelectedTable} onUpdateZone={updateSelectedZone}
              onUpdateWall={updateSelectedWall} onUpdateDoor={updateSelectedDoor}
              onUpdateWindow={updateSelectedWindow} onDelete={deleteSelected}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
