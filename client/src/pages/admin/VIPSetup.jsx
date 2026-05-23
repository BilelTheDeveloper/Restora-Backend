import { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Crown, Plus, Trash2, Save, ToggleLeft, ToggleRight,
  Circle, Square, RefreshCw, Info,
} from 'lucide-react';
import api from '../../services/api';

const CANVAS_W = 800;
const CANVAS_H = 520;
const GRID     = 20;
const ROUND_R  = 26;
const SQ_HALF  = 28;

const snap = v => Math.round(v / GRID) * GRID;

// ── Floor plan canvas ──────────────────────────────────────
function FloorCanvas({ tables, selected, onSelect, onMove }) {
  const svgRef = useRef();
  const dragRef = useRef(null);

  const startDrag = useCallback((e, id) => {
    e.stopPropagation();
    e.preventDefault();
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const t = tables.find(t => t._localId === id || t._id === id);
    dragRef.current = {
      id,
      startMX: (e.clientX - rect.left) * scaleX,
      startMY: (e.clientY - rect.top)  * scaleY,
      startTX: t?.position?.x ?? 100,
      startTY: t?.position?.y ?? 100,
    };
    onSelect(id);
    svg.setPointerCapture(e.pointerId);
  }, [tables, onSelect]);

  const onPointerMove = useCallback((e) => {
    if (!dragRef.current) return;
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top)  * scaleY;
    const nx = snap(dragRef.current.startTX + (mx - dragRef.current.startMX));
    const ny = snap(dragRef.current.startTY + (my - dragRef.current.startMY));
    onMove(dragRef.current.id, {
      x: Math.max(ROUND_R, Math.min(CANVAS_W - ROUND_R, nx)),
      y: Math.max(ROUND_R, Math.min(CANVAS_H - ROUND_R, ny)),
    });
  }, [onMove]);

  const onPointerUp = useCallback(() => { dragRef.current = null; }, []);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
      className="w-full rounded-2xl touch-none"
      style={{ background: 'radial-gradient(ellipse at 50% 50%, #1a1a2e 0%, #0a0a0f 100%)', maxHeight: 480 }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onClick={() => onSelect(null)}
    >
      {/* Grid */}
      <defs>
        <pattern id="canvas-grid" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
          <path d={`M ${GRID} 0 L 0 0 0 ${GRID}`} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
        </pattern>
        <filter id="glow-sel"><feGaussianBlur stdDeviation="6" result="b" /><feFlood floodColor="#f97316" floodOpacity="0.6" result="c" /><feComposite in="c" in2="b" operator="in" result="g" /><feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <filter id="glow-nor"><feGaussianBlur stdDeviation="3" result="b" /><feFlood floodColor="#60a5fa" floodOpacity="0.4" result="c" /><feComposite in="c" in2="b" operator="in" result="g" /><feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width={CANVAS_W} height={CANVAS_H} fill="url(#canvas-grid)" />

      {/* Tables */}
      {tables.map(t => {
        const id  = t._localId ?? t._id;
        const cx  = t.position?.x ?? 100;
        const cy  = t.position?.y ?? 100;
        const sel = selected === id;
        const filt = sel ? 'url(#glow-sel)' : 'url(#glow-nor)';
        const fill = sel ? '#431407' : '#1e1b4b';
        const stroke = sel ? '#f97316' : '#60a5fa';

        return (
          <g key={id} style={{ cursor: 'grab' }}
             onPointerDown={e => startDrag(e, id)}>
            {t.shape === 'round' ? (
              <circle cx={cx} cy={cy} r={ROUND_R} fill={fill} stroke={stroke} strokeWidth={sel ? 2 : 1.5} filter={filt} />
            ) : (
              <rect x={cx - SQ_HALF} y={cy - SQ_HALF} width={SQ_HALF*2} height={SQ_HALF*2} rx={8} fill={fill} stroke={stroke} strokeWidth={sel ? 2 : 1.5} filter={filt} />
            )}
            <text x={cx} y={cy - 6} textAnchor="middle" fill="white" fontSize={12} fontWeight="700" style={{ userSelect:'none', pointerEvents:'none' }}>
              {t.number || '?'}
            </text>
            <text x={cx} y={cy + 10} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize={9} style={{ userSelect:'none', pointerEvents:'none' }}>
              {t.capacity}p
            </text>
          </g>
        );
      })}

      {tables.length === 0 && (
        <text x={CANVAS_W/2} y={CANVAS_H/2} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize={14}>
          Add tables using the toolbar above
        </text>
      )}
    </svg>
  );
}

// ── Main VIPSetup page ─────────────────────────────────────
let localIdCounter = 1;

export default function VIPSetup() {
  const qc = useQueryClient();

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

  // Local state for floor plan editing
  const [tables,     setTables]     = useState([]);
  const [deletedIds, setDeletedIds] = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [vip, setVip] = useState({ enabled: false, description: '', minSpend: 0 });
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (tablesData) setTables(tablesData.map(t => ({ ...t, _localId: t._id })));
  }, [tablesData]);

  useEffect(() => {
    if (restaurant?.vipService) {
      setVip({
        enabled:     restaurant.vipService.enabled     ?? false,
        description: restaurant.vipService.description ?? '',
        minSpend:    restaurant.vipService.minSpend    ?? 0,
      });
    }
  }, [restaurant]);

  const selectedTable = tables.find(t => (t._localId ?? t._id) === selected);

  const addTable = (shape) => {
    const newTable = {
      _localId: `new-${localIdCounter++}`,
      number: String(tables.length + 1),
      capacity: 4,
      shape,
      position: { x: 200 + (tables.length % 5) * 100, y: 100 + Math.floor(tables.length / 5) * 120 },
    };
    setTables(p => [...p, newTable]);
    setSelected(newTable._localId);
    setDirty(true);
  };

  const moveTable = useCallback((id, pos) => {
    setTables(p => p.map(t => (t._localId ?? t._id) === id ? { ...t, position: pos } : t));
    setDirty(true);
  }, []);

  const updateSelected = (key, value) => {
    if (!selected) return;
    setTables(p => p.map(t => (t._localId ?? t._id) === selected ? { ...t, [key]: value } : t));
    setDirty(true);
  };

  const deleteSelected = () => {
    if (!selected) return;
    const t = tables.find(t => (t._localId ?? t._id) === selected);
    if (t?._id && !String(t._id).startsWith('new-')) setDeletedIds(p => [...p, t._id]);
    setTables(p => p.filter(t => (t._localId ?? t._id) !== selected));
    setSelected(null);
    setDirty(true);
  };

  const { mutate: saveAll, isPending: saving } = useMutation({
    mutationFn: async () => {
      // 1. Save VIP settings
      await api.put('/restaurants/admin/mine', { vipService: vip });

      // 2. Delete removed tables
      await Promise.all(deletedIds.map(id => api.delete(`/owner/tables/${id}`)));

      // 3. Upsert tables
      await Promise.all(tables.map(t => {
        const payload = { number: t.number, capacity: t.capacity, shape: t.shape, position: t.position };
        if (t._id && !String(t._id).startsWith('new-')) {
          return api.patch(`/owner/tables/${t._id}`, payload);
        }
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

  if (tablesLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <RefreshCw size={20} className="animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6 max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Crown size={18} className="text-orange-500" /> VIP Table Setup
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Design your floor plan and manage VIP booking service</p>
        </div>
        <button
          onClick={() => saveAll()}
          disabled={saving || !dirty}
          className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors shadow-sm shadow-orange-500/20"
        >
          <Save size={14} />
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* VIP Service toggle */}
      <div className="bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/6 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">VIP Booking Service</p>
            <p className="text-xs text-gray-400 mt-0.5">Guests can book VIP tables directly from your website</p>
          </div>
          <button
            type="button"
            onClick={() => { setVip(p => ({ ...p, enabled: !p.enabled })); setDirty(true); }}
            className="flex items-center gap-2 text-sm font-semibold transition-colors"
          >
            {vip.enabled
              ? <ToggleRight size={26} className="text-orange-500" />
              : <ToggleLeft  size={26} className="text-gray-400" />
            }
            <span className={vip.enabled ? 'text-orange-500' : 'text-gray-400'}>
              {vip.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </button>
        </div>

        {vip.enabled && (
          <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-white/8">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Minimum Spend (TND)</label>
              <input
                type="number" min={0} value={vip.minSpend}
                onChange={e => { setVip(p => ({ ...p, minSpend: Number(e.target.value) })); setDirty(true); }}
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-orange-400 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">VIP Description</label>
              <input
                type="text" value={vip.description} placeholder="e.g. Exclusive table with complimentary champagne"
                onChange={e => { setVip(p => ({ ...p, description: e.target.value })); setDirty(true); }}
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-orange-400 transition-colors"
              />
            </div>
          </div>
        )}
      </div>

      {/* Floor plan builder */}
      <div className="bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/6 rounded-2xl overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-white/6 flex-wrap">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mr-1">Add:</p>
          <button onClick={() => addTable('round')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors border border-blue-200 dark:border-blue-500/20">
            <Circle size={12} /> Round Table
          </button>
          <button onClick={() => addTable('square')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-colors border border-purple-200 dark:border-purple-500/20">
            <Square size={12} /> Square Table
          </button>
          <div className="flex-1" />
          {selected && (
            <button onClick={deleteSelected}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors border border-red-200 dark:border-red-500/20">
              <Trash2 size={12} /> Delete Table
            </button>
          )}
          <div className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
            <Info size={10} /> Drag to position
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Canvas */}
          <div className="flex-1 p-4">
            <FloorCanvas
              tables={tables}
              selected={selected}
              onSelect={setSelected}
              onMove={moveTable}
            />
            <p className="text-center text-[10px] text-gray-400 mt-2">{tables.length} table{tables.length !== 1 ? 's' : ''} · Click empty area to deselect</p>
          </div>

          {/* Edit panel */}
          <div className="w-full lg:w-60 border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-white/6 p-4 space-y-4">
            {selectedTable ? (
              <>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Edit Table</p>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Table Number</label>
                  <input
                    type="text" value={selectedTable.number ?? ''}
                    onChange={e => updateSelected('number', e.target.value)}
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-orange-400 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Capacity (seats)</label>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => updateSelected('capacity', Math.max(1, (selectedTable.capacity ?? 4) - 1))}
                            className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/8 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/15 transition-colors font-bold text-sm flex items-center justify-center">−</button>
                    <span className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-white">{selectedTable.capacity ?? 4}</span>
                    <button type="button" onClick={() => updateSelected('capacity', (selectedTable.capacity ?? 4) + 1)}
                            className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/8 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/15 transition-colors font-bold text-sm flex items-center justify-center">+</button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Shape</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['round','square'].map(s => (
                      <button key={s} onClick={() => updateSelected('shape', s)}
                              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all border ${selectedTable.shape === s ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-orange-300'}`}>
                        {s === 'round' ? <Circle size={11} /> : <Square size={11} />} {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-white/8 text-[10px] text-gray-400">
                  Position: ({Math.round(selectedTable.position?.x ?? 0)}, {Math.round(selectedTable.position?.y ?? 0)})
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400">
                <Crown size={24} className="opacity-20 mb-2" />
                <p className="text-xs">Select a table to edit its properties</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
