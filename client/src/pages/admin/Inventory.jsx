import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Package, Plus, X, Edit3, AlertTriangle, TrendingDown, ChefHat,
  DollarSign, BarChart2, Loader2, Check, Trash2, RefreshCw, BookOpen,
} from 'lucide-react';
import { inventoryService } from '../../services/inventoryService';

const UNITS = ['g', 'kg', 'ml', 'L', 'pcs', 'dozen', 'bottle', 'box'];
const CATEGORIES = ['Meat', 'Fish', 'Vegetables', 'Dairy', 'Grains', 'Spices', 'Beverages', 'Other'];

const STATUS_CONFIG = {
  ok:       { label: 'OK',       bar: 'bg-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  low:      { label: 'Low',      bar: 'bg-amber-500',   text: 'text-amber-400',   bg: 'bg-amber-500/10'   },
  critical: { label: 'Critical', bar: 'bg-red-500',     text: 'text-red-400',     bg: 'bg-red-500/10'     },
};

function getStockStatus(ing) {
  if (ing.currentStock <= 0) return 'critical';
  if (ing.currentStock <= ing.minStock) return 'low';
  return 'ok';
}

function IngredientModal({ ingredient, onClose, onSave }) {
  const [form, setForm] = useState(ingredient || {
    name: '', unit: 'kg', currentStock: '', minStock: '', costPerUnit: '', category: 'Other', supplier: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95 }}
        className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-md"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/8">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">{ingredient ? 'Edit Ingredient' : 'New Ingredient'}</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/6 flex items-center justify-center hover:bg-white/12 text-gray-400 dark:text-white/50 transition-all">
            <X size={13} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-400 dark:text-white/30 mb-1.5">Name</label>
              <input value={form.name} onChange={e => set('name', e.target.value)}
                className="w-full bg-gray-50 dark:bg-white/6 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20 focus:outline-none focus:border-orange-500/50"
                placeholder="e.g. Chicken Breast" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-400 dark:text-white/30 mb-1.5">Unit</label>
              <select value={form.unit} onChange={e => set('unit', e.target.value)}
                className="w-full bg-gray-50 dark:bg-white/6 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-orange-500/50">
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-400 dark:text-white/30 mb-1.5">Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full bg-gray-50 dark:bg-white/6 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-orange-500/50">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-400 dark:text-white/30 mb-1.5">Current Stock</label>
              <input type="number" min="0" value={form.currentStock} onChange={e => set('currentStock', e.target.value)}
                className="w-full bg-gray-50 dark:bg-white/6 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-orange-500/50"
                placeholder="0" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-400 dark:text-white/30 mb-1.5">Min Stock</label>
              <input type="number" min="0" value={form.minStock} onChange={e => set('minStock', e.target.value)}
                className="w-full bg-gray-50 dark:bg-white/6 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-orange-500/50"
                placeholder="0" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-400 dark:text-white/30 mb-1.5">Cost / Unit (TND)</label>
              <input type="number" min="0" step="0.001" value={form.costPerUnit} onChange={e => set('costPerUnit', e.target.value)}
                className="w-full bg-gray-50 dark:bg-white/6 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-orange-500/50"
                placeholder="0.000" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-400 dark:text-white/30 mb-1.5">Supplier</label>
              <input value={form.supplier} onChange={e => set('supplier', e.target.value)}
                className="w-full bg-gray-50 dark:bg-white/6 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20 focus:outline-none focus:border-orange-500/50"
                placeholder="Optional" />
            </div>
          </div>
        </div>

        <div className="flex gap-2 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 bg-white/6 hover:bg-white/10 text-white/60 text-sm font-semibold rounded-xl transition-colors">
            Cancel
          </button>
          <button onClick={() => onSave(form)}
            disabled={!form.name.trim()}
            className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-40"
          >
            {ingredient ? 'Save Changes' : 'Add Ingredient'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function AddStockModal({ ingredient, onClose, onSave }) {
  const [qty, setQty] = useState('');
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-sm p-5"
      >
        <h2 className="text-sm font-bold text-white mb-1">Add Stock</h2>
        <p className="text-xs text-white/40 mb-4">{ingredient.name} · current: {ingredient.currentStock} {ingredient.unit}</p>
        <input type="number" min="0" value={qty} onChange={e => setQty(e.target.value)}
          placeholder={`Amount in ${ingredient.unit}`}
          className="w-full bg-white/6 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500/50 mb-3"
          autoFocus />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 bg-white/6 text-white/60 text-sm font-semibold rounded-xl">Cancel</button>
          <button onClick={() => qty > 0 && onSave(Number(qty))} disabled={!qty || qty <= 0}
            className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-40">
            Add Stock
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function RecipePanel({ ingredients }) {
  const qc = useQueryClient();
  const [menuItem, setMenuItem] = useState('');
  const [lines, setLines] = useState([{ ingredientId: '', quantity: '' }]);

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => inventoryService.getRecipes().then(r => r.data),
  });

  const { data: margins = [], isLoading: loadingMargins } = useQuery({
    queryKey: ['dish-margins'],
    queryFn: () => inventoryService.getDishMargins().then(r => r.data),
  });

  const { mutate: saveRecipe, isPending } = useMutation({
    mutationFn: () => inventoryService.upsertRecipe({
      menuItemName: menuItem,
      ingredients: lines.filter(l => l.ingredientId && l.quantity).map(l => ({ ingredient: l.ingredientId, quantity: Number(l.quantity) })),
    }),
    onSuccess: () => {
      toast.success('Recipe saved');
      setMenuItem('');
      setLines([{ ingredientId: '', quantity: '' }]);
      qc.invalidateQueries(['recipes']);
      qc.invalidateQueries(['dish-margins']);
    },
    onError: () => toast.error('Failed to save recipe'),
  });

  const addLine = () => setLines(l => [...l, { ingredientId: '', quantity: '' }]);
  const removeLine = (i) => setLines(l => l.filter((_, idx) => idx !== i));
  const setLine = (i, k, v) => setLines(l => l.map((line, idx) => idx === i ? { ...line, [k]: v } : line));

  const recipeCost = lines.reduce((sum, l) => {
    if (!l.ingredientId || !l.quantity) return sum;
    const ing = ingredients.find(i => i._id === l.ingredientId);
    return sum + (ing ? ing.costPerUnit * Number(l.quantity) : 0);
  }, 0);

  return (
    <div className="space-y-5">
      {/* Recipe builder */}
      <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100 dark:border-white/6">
          <BookOpen size={14} className="text-orange-400" />
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Recipe Builder</h2>
        </div>
        <div className="p-5 space-y-3">
          <input value={menuItem} onChange={e => setMenuItem(e.target.value)}
            placeholder="Menu item name (must match exactly)"
            className="w-full bg-gray-50 dark:bg-white/6 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20 focus:outline-none focus:border-orange-500/50"
          />
          {lines.map((line, i) => (
            <div key={i} className="flex gap-2">
              <select value={line.ingredientId} onChange={e => setLine(i, 'ingredientId', e.target.value)}
                className="flex-1 bg-gray-50 dark:bg-white/6 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-orange-500/50">
                <option value="">Select ingredient…</option>
                {ingredients.map(ing => <option key={ing._id} value={ing._id}>{ing.name} ({ing.unit})</option>)}
              </select>
              <input type="number" min="0" value={line.quantity} onChange={e => setLine(i, 'quantity', e.target.value)}
                placeholder="Qty"
                className="w-20 bg-gray-50 dark:bg-white/6 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-orange-500/50" />
              {lines.length > 1 && (
                <button onClick={() => removeLine(i)} className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-colors">
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
          <div className="flex items-center justify-between">
            <button onClick={addLine} className="text-xs text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/70 flex items-center gap-1 transition-colors">
              <Plus size={12} /> Add ingredient
            </button>
            {recipeCost > 0 && (
              <p className="text-xs text-emerald-400 font-bold">Cost: {recipeCost.toFixed(3)} TND</p>
            )}
          </div>
          <button onClick={() => menuItem.trim() && saveRecipe()} disabled={!menuItem.trim() || isPending}
            className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Save Recipe
          </button>
        </div>
      </div>

      {/* Dish Margins */}
      {margins.length > 0 && (
        <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100 dark:border-white/6">
            <DollarSign size={14} className="text-orange-400" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Dish Margins</h2>
          </div>
          <div className="p-5">
            {loadingMargins ? (
              <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-gray-400 dark:text-white/30" /></div>
            ) : (
              <div className="space-y-2">
                {margins.map((m, i) => {
                  const marginPct = m.revenue > 0 ? ((m.revenue - m.cost) / m.revenue * 100) : 0;
                  return (
                    <div key={i} className="flex items-center gap-3 bg-white/3 rounded-xl p-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{m.name}</p>
                        <p className="text-[10px] text-gray-400 dark:text-white/30 mt-0.5">{m.orders} orders · Revenue: {Math.round(m.revenue)} TND</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-black tabular-nums ${marginPct >= 60 ? 'text-emerald-400' : marginPct >= 30 ? 'text-amber-400' : 'text-red-400'}`}>
                          {marginPct.toFixed(0)}%
                        </p>
                        <p className="text-[9px] text-gray-400 dark:text-white/30">margin</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Inventory() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('stock');
  const [editIng, setEditIng] = useState(null);
  const [addStockIng, setAddStockIng] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [catFilter, setCatFilter] = useState('All');

  const { data: ingredients = [], isLoading, refetch } = useQuery({
    queryKey: ['ingredients'],
    queryFn: () => inventoryService.getIngredients().then(r => r.data),
  });

  const { mutate: createIng } = useMutation({
    mutationFn: (data) => inventoryService.createIngredient(data),
    onSuccess: () => { toast.success('Ingredient added'); qc.invalidateQueries(['ingredients']); setShowCreate(false); },
    onError: () => toast.error('Failed to add'),
  });

  const { mutate: updateIng } = useMutation({
    mutationFn: ({ id, data }) => inventoryService.updateIngredient(id, data),
    onSuccess: () => { toast.success('Updated'); qc.invalidateQueries(['ingredients']); setEditIng(null); },
    onError: () => toast.error('Failed to update'),
  });

  const { mutate: addStock } = useMutation({
    mutationFn: ({ id, qty }) => inventoryService.addStock(id, qty),
    onSuccess: () => { toast.success('Stock updated'); qc.invalidateQueries(['ingredients']); setAddStockIng(null); },
    onError: () => toast.error('Failed'),
  });

  const { mutate: deleteIng } = useMutation({
    mutationFn: (id) => inventoryService.deleteIngredient(id),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries(['ingredients']); },
    onError: () => toast.error('Failed to delete'),
  });

  const cats = ['All', ...new Set(ingredients.map(i => i.category || 'Other'))];
  const filtered = catFilter === 'All' ? ingredients : ingredients.filter(i => (i.category || 'Other') === catFilter);

  const lowCount = ingredients.filter(i => getStockStatus(i) !== 'ok').length;

  return (
    <div className="p-5 sm:p-6 space-y-5 max-w-[1440px] bg-gray-50 dark:bg-[#0a0a0a] min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">Inventory</h1>
          <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">Stock tracking & recipe costing</p>
        </div>
        <div className="flex items-center gap-2">
          {lowCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/15 border border-red-500/25 rounded-xl">
              <AlertTriangle size={12} className="text-red-400" />
              <span className="text-xs font-bold text-red-400">{lowCount} low stock</span>
            </div>
          )}
          <button onClick={() => refetch()} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/6 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/12 text-gray-400 dark:text-white/40 hover:text-gray-900 dark:hover:text-white transition-all">
            <RefreshCw size={13} />
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-colors">
            <Plus size={13} /> Add Ingredient
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5">
        {[{ key: 'stock', label: 'Stock', icon: Package }, { key: 'recipes', label: 'Recipes & Margins', icon: ChefHat }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === t.key ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-white/6 text-gray-400 dark:text-white/50 hover:bg-gray-200 dark:hover:bg-white/10'
            }`}
          >
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'stock' ? (
        <>
          {/* Category filter */}
          {cats.length > 2 && (
            <div className="flex gap-1.5 flex-wrap">
              {cats.map(cat => (
                <button key={cat} onClick={() => setCatFilter(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    catFilter === cat ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-white/6 text-gray-400 dark:text-white/50 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-gray-400 dark:text-white/30"><Loader2 size={22} className="animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-300 dark:text-white/20 gap-2">
              <Package size={28} /><p className="text-xs">No ingredients yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filtered.map(ing => {
                const status = getStockStatus(ing);
                const cfg = STATUS_CONFIG[status];
                const pct = ing.minStock > 0 ? Math.min(100, (ing.currentStock / (ing.minStock * 3)) * 100) : 50;

                return (
                  <div key={ing._id} className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{ing.name}</p>
                        <p className="text-[10px] text-gray-400 dark:text-white/30 mt-0.5">{ing.category || 'Other'} · {ing.supplier || '—'}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.text} ${cfg.bg}`}>{cfg.label}</span>
                    </div>

                    {/* Stock bar */}
                    <div>
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="text-gray-500 dark:text-white/40">{ing.currentStock} {ing.unit}</span>
                        <span className="text-gray-400 dark:text-white/25">min: {ing.minStock} {ing.unit}</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 dark:bg-white/6 rounded-full overflow-hidden">
                        <div className={`h-full ${cfg.bar} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400 dark:text-white/40">{ing.costPerUnit?.toFixed(3)} TND/{ing.unit}</p>
                      <div className="flex gap-1.5">
                        <button onClick={() => setAddStockIng(ing)}
                          className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/25 transition-colors"
                          title="Add stock">
                          <Plus size={11} />
                        </button>
                        <button onClick={() => setEditIng(ing)}
                          className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/6 text-gray-400 dark:text-white/40 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/12 transition-colors"
                          title="Edit">
                          <Edit3 size={11} />
                        </button>
                        <button onClick={() => window.confirm('Delete this ingredient?') && deleteIng(ing._id)}
                          className="w-7 h-7 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                          title="Delete">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <RecipePanel ingredients={ingredients} />
      )}

      <AnimatePresence>
        {(showCreate || editIng) && (
          <IngredientModal
            ingredient={editIng}
            onClose={() => { setShowCreate(false); setEditIng(null); }}
            onSave={(data) => editIng ? updateIng({ id: editIng._id, data }) : createIng(data)}
          />
        )}
        {addStockIng && (
          <AddStockModal
            ingredient={addStockIng}
            onClose={() => setAddStockIng(null)}
            onSave={(qty) => addStock({ id: addStockIng._id, qty })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
