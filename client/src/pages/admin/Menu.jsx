import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Plus, Pencil, Trash2, Search, Save, X, Upload,
  ToggleLeft, ToggleRight, ChevronRight, BookOpen,
  CheckCircle2, AlertCircle, Check, ImageIcon,
} from 'lucide-react';
import { restaurantService } from '../../services/restaurantService';

// ── Helpers ───────────────────────────────────────────────────
let _lid = 1;
const genLid = () => `lid-${_lid++}`;

const resizeToBase64 = (file, maxW = 600, quality = 0.82) =>
  new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(1, maxW / img.width);
        const canvas = document.createElement('canvas');
        canvas.width  = img.width  * ratio;
        canvas.height = img.height * ratio;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

const seedMenu = (raw) =>
  (raw ?? []).map(cat => ({
    ...cat,
    _lid: cat._id?.toString() ?? genLid(),
    items: (cat.items ?? []).map(item => ({
      ...item,
      _lid: item._id?.toString() ?? genLid(),
    })),
  }));

const stripLids = (menu) =>
  menu.map(({ _lid: _cl, ...cat }) => ({
    category: cat.category,
    items: (cat.items ?? []).map(({ _lid: _il, ...item }) => item),
  }));

// ── Color palette for categories ──────────────────────────────
const CAT_PALETTE = [
  { pill: 'bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400', accent: '#f97316' },
  { pill: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',         accent: '#3b82f6' },
  { pill: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',         accent: '#f43f5e' },
  { pill: 'bg-teal-100 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400',         accent: '#14b8a6' },
  { pill: 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400', accent: '#8b5cf6' },
  { pill: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',     accent: '#f59e0b' },
  { pill: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400', accent: '#10b981' },
  { pill: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-400',         accent: '#06b6d4' },
];
const catColor = (idx) => CAT_PALETTE[idx % CAT_PALETTE.length];

// ── Item Card ─────────────────────────────────────────────────
function ItemCard({ item, catIdx, catColor, onEdit, onDelete, onToggle }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className={`group relative bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-white/6 rounded-2xl overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-200 dark:hover:border-white/10 ${!item.available ? 'opacity-60' : ''}`}>

      {/* Image */}
      <div className="relative h-36 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-white/3 dark:to-white/6 overflow-hidden">
        {item.image ? (
          <img src={item.image} alt={item.name} className="w-full h-full object-cover"/>
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: `${catColor.accent}12` }}>
            <span className="text-4xl font-black select-none" style={{ color: catColor.accent + '60' }}>
              {item.name?.[0]?.toUpperCase() ?? '?'}
            </span>
          </div>
        )}
        {/* Availability badge */}
        <div className={`absolute top-2.5 right-2.5 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${item.available ? 'bg-emerald-500/90 text-white' : 'bg-gray-500/70 text-white'}`}>
          <span className={`w-1 h-1 rounded-full ${item.available ? 'bg-white/80' : 'bg-white/50'}`}/>
          {item.available ? 'On' : 'Off'}
        </div>
        {/* Hover actions */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button onClick={() => onEdit({ item, catIdx })}
            className="w-8 h-8 rounded-xl bg-white/90 hover:bg-white text-gray-800 flex items-center justify-center transition-all hover:scale-110 shadow-sm">
            <Pencil size={13}/>
          </button>
          {confirmDelete ? (
            <button onClick={() => { onDelete(catIdx, item._lid); setConfirmDelete(false); }}
              className="h-8 px-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-[10px] font-black flex items-center gap-1 transition-all shadow-sm">
              <Check size={11}/> Sure?
            </button>
          ) : (
            <button onClick={() => setConfirmDelete(true)}
              className="w-8 h-8 rounded-xl bg-white/90 hover:bg-red-50 text-gray-800 hover:text-red-500 flex items-center justify-center transition-all hover:scale-110 shadow-sm">
              <Trash2 size={13}/>
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight line-clamp-1">{item.name}</p>
          <span className="text-sm font-black text-gray-900 dark:text-white shrink-0">
            {Number(item.price).toFixed(2)}
            <span className="text-[10px] font-normal text-gray-400 ml-0.5">TND</span>
          </span>
        </div>
        {item.description && (
          <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mt-0.5">{item.description}</p>
        )}
        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100 dark:border-white/6">
          <button onClick={() => onToggle(catIdx, item._lid)}
            className="flex items-center gap-1 text-[10px] font-semibold text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
            {item.available
              ? <ToggleRight size={16} className="text-orange-500"/>
              : <ToggleLeft  size={16}/>
            }
            {item.available ? 'Available' : 'Unavailable'}
          </button>
          <button onClick={() => onEdit({ item, catIdx })}
            className="flex items-center gap-1 text-[10px] font-semibold text-gray-400 hover:text-orange-500 transition-colors">
            <Pencil size={11}/> Edit
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add-new card ───────────────────────────────────────────────
function AddItemCard({ catIdx, onClick }) {
  return (
    <button onClick={() => onClick(catIdx)}
      className="h-full min-h-[220px] w-full border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-orange-400 dark:hover:border-orange-500 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-300 dark:text-gray-600 hover:text-orange-400 dark:hover:text-orange-500 transition-all group">
      <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 group-hover:bg-orange-50 dark:group-hover:bg-orange-500/10 flex items-center justify-center transition-colors">
        <Plus size={20}/>
      </div>
      <span className="text-xs font-semibold">Add Item</span>
    </button>
  );
}

// ── Item Slide Panel ───────────────────────────────────────────
const EMPTY_FORM = { name: '', description: '', price: '', image: '', available: true };

function ItemSlidePanel({ open, editing, categories, catIdx, onSave, onClose }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedCatIdx, setSelectedCatIdx] = useState(0);
  const [uploading, setUploading]  = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    if (open) {
      if (editing) {
        setForm({
          name:        editing.name        ?? '',
          description: editing.description ?? '',
          price:       String(editing.price ?? ''),
          image:       editing.image       ?? '',
          available:   editing.available   ?? true,
        });
        setSelectedCatIdx(catIdx ?? 0);
      } else {
        setForm(EMPTY_FORM);
        setSelectedCatIdx(catIdx ?? 0);
      }
    }
  }, [open, editing, catIdx]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { toast.error('Image must be under 8MB'); return; }
    setUploading(true);
    try {
      const b64 = await resizeToBase64(file, 600, 0.82);
      setF('image', b64);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = () => {
    if (!form.name.trim())  { toast.error('Item name is required'); return; }
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0) {
      toast.error('Enter a valid price');
      return;
    }
    onSave({ ...form, price: Number(form.price) }, selectedCatIdx, editing?._lid ?? null);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      {/* Panel */}
      <div className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white dark:bg-[#111111] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-white/8 shrink-0">
          <div>
            <h2 className="text-base font-black text-gray-900 dark:text-white">
              {editing ? 'Edit Item' : 'New Item'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {editing ? 'Update the item details below' : 'Add a new item to your menu'}
            </p>
          </div>
          <button onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/8 transition-colors">
            <X size={18}/>
          </button>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Category selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat, idx) => (
                <button key={cat._lid} onClick={() => setSelectedCatIdx(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedCatIdx === idx ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/25' : 'bg-gray-100 dark:bg-white/8 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/12'}`}>
                  {cat.category}
                </button>
              ))}
            </div>
          </div>

          {/* Image */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Photo</label>
            <div className="relative h-40 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-orange-400 dark:hover:border-orange-500 transition-colors cursor-pointer group"
              onClick={() => fileRef.current?.click()}>
              {form.image ? (
                <>
                  <img src={form.image} alt="Preview" className="w-full h-full object-cover"/>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs font-bold flex items-center gap-1.5">
                      <Upload size={13}/> Change Photo
                    </span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setF('image', ''); }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 hover:bg-red-500 text-white flex items-center justify-center transition-colors">
                    <X size={12}/>
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-300 dark:text-gray-600 group-hover:text-orange-400 dark:group-hover:text-orange-500 transition-colors">
                  {uploading ? (
                    <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"/>
                  ) : (
                    <>
                      <ImageIcon size={24}/>
                      <span className="text-xs font-semibold">Click to upload photo</span>
                      <span className="text-[10px]">JPEG, PNG · max 8MB</span>
                    </>
                  )}
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload}/>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Item Name <span className="text-red-400">*</span></label>
            <input type="text" value={form.name} onChange={e => setF('name', e.target.value)}
              placeholder="e.g. Brick au Thon"
              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-orange-400 dark:focus:border-orange-500 transition-colors"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Description</label>
            <textarea value={form.description} onChange={e => setF('description', e.target.value)}
              placeholder="Describe the dish, ingredients, allergens…" rows={3}
              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-orange-400 dark:focus:border-orange-500 transition-colors resize-none"
            />
          </div>

          {/* Price */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Price <span className="text-red-400">*</span></label>
            <div className="relative">
              <input type="number" min="0" step="0.1" value={form.price} onChange={e => setF('price', e.target.value)}
                placeholder="0.00"
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-4 pr-14 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-orange-400 dark:focus:border-orange-500 transition-colors"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">TND</span>
            </div>
          </div>

          {/* Available toggle */}
          <button type="button" onClick={() => setF('available', !form.available)}
            className="flex items-center justify-between w-full p-4 rounded-2xl border border-gray-100 dark:border-white/8 bg-gray-50 dark:bg-white/3 hover:bg-gray-100 dark:hover:bg-white/6 transition-colors">
            <div className="text-left">
              <p className="text-sm font-bold text-gray-900 dark:text-white">Available to order</p>
              <p className="text-xs text-gray-400 mt-0.5">Guests can order this item</p>
            </div>
            {form.available
              ? <ToggleRight size={26} className="text-orange-500 shrink-0"/>
              : <ToggleLeft  size={26} className="text-gray-300 dark:text-gray-600 shrink-0"/>}
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-white/8 flex items-center gap-3 shrink-0">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/8 hover:bg-gray-200 dark:hover:bg-white/12 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave}
            className="flex-1 py-3 rounded-xl text-sm font-black text-white bg-orange-500 hover:bg-orange-600 transition-colors shadow-sm shadow-orange-500/25 flex items-center justify-center gap-2">
            <Check size={15}/>
            {editing ? 'Update Item' : 'Add Item'}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main Menu page ─────────────────────────────────────────────
export default function Menu() {
  const qc = useQueryClient();

  const { data: rd, isLoading } = useQuery({
    queryKey: ['my-restaurant'],
    queryFn:  restaurantService.getMine,
  });
  const restaurant = rd?.data;

  const [menu,            setMenu]          = useState([]);
  const [dirty,           setDirty]         = useState(false);
  const [activeCategory,  setActive]        = useState('All');
  const [search,          setSearch]        = useState('');
  const [panel,           setPanel]         = useState({ open: false, editing: null, catIdx: null });
  const [renamingIdx,     setRenamingIdx]   = useState(null);
  const [renameVal,       setRenameVal]     = useState('');
  const [addingCat,       setAddingCat]     = useState(false);
  const [newCatName,      setNewCatName]    = useState('');
  const renameRef = useRef();
  const newCatRef = useRef();

  // Seed from server
  useEffect(() => {
    if (restaurant?.menu) {
      setMenu(seedMenu(restaurant.menu));
      setDirty(false);
    }
  }, [restaurant]);

  // Focus inputs when they appear
  useEffect(() => { if (renamingIdx !== null) setTimeout(() => renameRef.current?.focus(), 50); }, [renamingIdx]);
  useEffect(() => { if (addingCat) setTimeout(() => newCatRef.current?.focus(), 50); }, [addingCat]);

  const { mutate: saveMenu, isPending: saving } = useMutation({
    mutationFn: () => restaurantService.update({ menu: stripLids(menu) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-restaurant'] });
      setDirty(false);
      toast.success('Menu saved!');
    },
    onError: () => toast.error('Save failed — please try again'),
  });

  // ── Category management ──────────────────────────────────────
  const addCategory = () => {
    const name = newCatName.trim();
    if (!name) { setAddingCat(false); return; }
    if (menu.find(c => c.category.toLowerCase() === name.toLowerCase())) {
      toast.error('Category already exists'); return;
    }
    setMenu(p => [...p, { _lid: genLid(), category: name, items: [] }]);
    setNewCatName('');
    setAddingCat(false);
    setActive(name);
    setDirty(true);
  };

  const startRename = (idx) => {
    setRenamingIdx(idx);
    setRenameVal(menu[idx].category);
  };

  const commitRename = () => {
    const name = renameVal.trim();
    if (!name || !menu[renamingIdx]) { setRenamingIdx(null); return; }
    setMenu(p => p.map((cat, i) => i === renamingIdx ? { ...cat, category: name } : cat));
    if (activeCategory === menu[renamingIdx].category) setActive(name);
    setRenamingIdx(null);
    setDirty(true);
  };

  const deleteCategory = (idx) => {
    const cat = menu[idx];
    if ((cat.items?.length ?? 0) > 0) {
      toast.error(`Move or delete all items in "${cat.category}" first`);
      return;
    }
    if (activeCategory === cat.category) setActive('All');
    setMenu(p => p.filter((_, i) => i !== idx));
    setDirty(true);
  };

  // ── Item management ──────────────────────────────────────────
  const openAdd = (catIdx) => setPanel({ open: true, editing: null, catIdx });
  const openEdit = ({ item, catIdx }) => setPanel({ open: true, editing: item, catIdx });
  const closePanel = () => setPanel(p => ({ ...p, open: false }));

  const handleSaveItem = (formData, targetCatIdx, editingLid) => {
    setMenu(prev => {
      const next = prev.map(cat => ({ ...cat, items: [...cat.items] }));
      if (editingLid) {
        // Edit: find the item (could be in a different cat if category changed)
        for (const cat of next) {
          const idx = cat.items.findIndex(i => i._lid === editingLid);
          if (idx !== -1) {
            cat.items.splice(idx, 1); // remove from old cat
            break;
          }
        }
      }
      // Insert into target category
      next[targetCatIdx].items.push({ ...formData, _lid: editingLid ?? genLid() });
      return next;
    });
    setDirty(true);
    closePanel();
    toast.success(editingLid ? 'Item updated' : 'Item added');
  };

  const deleteItem = (catIdx, lid) => {
    setMenu(p => p.map((cat, i) => i === catIdx
      ? { ...cat, items: cat.items.filter(item => item._lid !== lid) }
      : cat));
    setDirty(true);
  };

  const toggleItem = (catIdx, lid) => {
    setMenu(p => p.map((cat, i) => i === catIdx
      ? { ...cat, items: cat.items.map(item => item._lid === lid ? { ...item, available: !item.available } : item) }
      : cat));
    setDirty(true);
  };

  // ── Derived data ─────────────────────────────────────────────
  const allFlat = menu.flatMap((cat, catIdx) =>
    cat.items.map(item => ({ item, catIdx, catName: cat.category }))
  );
  const totalItems     = allFlat.length;
  const availableItems = allFlat.filter(({ item }) => item.available).length;
  const totalCats      = menu.length;

  const filtered = allFlat.filter(({ item, catName }) => {
    const matchCat    = activeCategory === 'All' || catName === activeCategory;
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase())
                                 || item.description?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // Group filtered items by category for display
  const displayGroups = menu
    .map((cat, catIdx) => ({
      cat, catIdx,
      items: filtered.filter(f => f.catIdx === catIdx),
      color: catColor(catIdx),
    }))
    .filter(g => {
      if (activeCategory !== 'All' && g.cat.category !== activeCategory) return false;
      // Hide categories with no results when actively searching
      if (search && g.items.length === 0) return false;
      return true;
    });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <BookOpen size={20} className="animate-pulse text-orange-500"/>
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden min-h-0">

      {/* ── Category sidebar ── */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-gray-100 dark:border-white/6 bg-white dark:bg-[#0f0f0f] overflow-y-auto">

        <div className="p-4 border-b border-gray-100 dark:border-white/6">
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3">Categories</p>

          {/* All */}
          <button onClick={() => setActive('All')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all mb-1 ${activeCategory === 'All' ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
            <span>All Items</span>
            <span className={`text-[10px] font-black px-1.5 h-4 rounded-full flex items-center ${activeCategory === 'All' ? 'bg-white/25 text-white' : 'bg-gray-100 dark:bg-white/8 text-gray-400'}`}>
              {totalItems}
            </span>
          </button>

          {/* Categories */}
          {menu.map((cat, idx) => (
            <div key={cat._lid} className="group/cat flex items-center gap-1 mb-0.5">
              {renamingIdx === idx ? (
                <input
                  ref={renameRef}
                  value={renameVal}
                  onChange={e => setRenameVal(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenamingIdx(null); }}
                  className="flex-1 bg-gray-50 dark:bg-white/8 border border-orange-400 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none"
                />
              ) : (
                <button onClick={() => setActive(cat.category)}
                  className={`flex-1 flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeCategory === cat.category ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
                  <span className="truncate">{cat.category}</span>
                  <span className={`text-[10px] font-black px-1.5 h-4 rounded-full flex items-center shrink-0 ${activeCategory === cat.category ? 'bg-white/25 text-white' : 'bg-gray-100 dark:bg-white/8 text-gray-400'}`}>
                    {cat.items.length}
                  </span>
                </button>
              )}

              {/* Rename/delete shown on hover */}
              {renamingIdx !== idx && (
                <div className="flex gap-0.5 opacity-0 group-hover/cat:opacity-100 transition-opacity">
                  <button onClick={() => startRename(idx)}
                    className="w-6 h-6 rounded-lg text-gray-300 dark:text-gray-600 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 flex items-center justify-center transition-colors">
                    <Pencil size={10}/>
                  </button>
                  <button onClick={() => deleteCategory(idx)}
                    className="w-6 h-6 rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center justify-center transition-colors">
                    <Trash2 size={10}/>
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Add category */}
          {addingCat ? (
            <div className="mt-2">
              <input
                ref={newCatRef}
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addCategory(); if (e.key === 'Escape') { setAddingCat(false); setNewCatName(''); } }}
                onBlur={addCategory}
                placeholder="Category name…"
                className="w-full bg-gray-50 dark:bg-white/8 border border-orange-400 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 outline-none"
              />
            </div>
          ) : (
            <button onClick={() => setAddingCat(true)}
              className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/8 transition-colors border border-dashed border-gray-200 dark:border-white/10 hover:border-orange-300 dark:hover:border-orange-500/30">
              <Plus size={12}/> Add Category
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="p-4 mt-auto space-y-2">
          <StatRow label="Total Items"  value={totalItems}/>
          <StatRow label="Available"    value={availableItems} accent/>
          <StatRow label="Unavailable"  value={totalItems - availableItems}/>
          <StatRow label="Categories"   value={totalCats}/>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-white/6 bg-white dark:bg-[#0f0f0f] shrink-0">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 max-w-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl px-3 h-9">
            <Search size={13} className="text-gray-400 shrink-0"/>
            <input
              type="text" placeholder="Search menu…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-xs text-gray-700 dark:text-gray-300 placeholder-gray-400 outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-gray-300 hover:text-gray-600 transition-colors">
                <X size={12}/>
              </button>
            )}
          </div>

          {/* Mobile category scroll */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 lg:hidden">
            {['All', ...menu.map(c => c.category)].map(cat => (
              <button key={cat} onClick={() => setActive(cat)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-white/8 text-gray-500'}`}>
                {cat}
              </button>
            ))}
          </div>

          <div className="flex-1"/>

          {/* Unsaved indicator */}
          {dirty && (
            <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1.5 rounded-xl border border-amber-200 dark:border-amber-500/20">
              <AlertCircle size={11}/> Unsaved changes
            </span>
          )}

          {/* Save */}
          <button
            onClick={() => saveMenu()}
            disabled={saving || !dirty}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black rounded-xl transition-colors shadow-sm shadow-orange-500/20">
            <Save size={13}/>
            {saving ? 'Saving…' : 'Save Menu'}
          </button>

          {/* Add item */}
          <button onClick={() => openAdd(Math.max(0, menu.findIndex(c => c.category === activeCategory)))}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-black rounded-xl hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors">
            <Plus size={13}/> Add Item
          </button>
        </div>

        {/* Items area */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* No categories empty state */}
          {menu.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center mb-4">
                <BookOpen size={28} className="text-orange-400"/>
              </div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">No categories yet</h3>
              <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
                Start by creating a category like "Starters" or "Mains" in the sidebar, then add items to it.
              </p>
              <button onClick={() => setAddingCat(true)}
                className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-colors shadow-sm shadow-orange-500/20">
                <Plus size={15}/> Add First Category
              </button>
            </div>
          )}

          {/* Category groups */}
          {displayGroups.map(({ cat, catIdx, items, color }) => (
            <div key={cat._lid} className="mb-8">
              {/* Group header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`px-3 py-1 rounded-xl text-xs font-black ${color.pill}`}>
                  {cat.category}
                </div>
                <span className="text-xs text-gray-400">{cat.items.length} item{cat.items.length !== 1 ? 's' : ''}</span>
                <div className="flex-1 h-px bg-gray-100 dark:bg-white/6"/>
                <button onClick={() => openAdd(catIdx)}
                  className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-orange-500 transition-colors">
                  <Plus size={12}/> Add
                </button>
              </div>

              {/* Items grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {items.map(({ item }) => (
                  <ItemCard
                    key={item._lid}
                    item={item}
                    catIdx={catIdx}
                    catColor={color}
                    onEdit={openEdit}
                    onDelete={deleteItem}
                    onToggle={toggleItem}
                  />
                ))}
                <AddItemCard catIdx={catIdx} onClick={openAdd}/>
              </div>

              {/* Empty category note */}
              {cat.items.length === 0 && (
                <p className="text-xs text-gray-300 dark:text-gray-700 mt-2 ml-1">
                  No items yet — click "Add" to get started.
                </p>
              )}
            </div>
          ))}

          {/* Search no results */}
          {menu.length > 0 && filtered.length === 0 && search && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search size={28} className="text-gray-200 dark:text-gray-700 mb-3"/>
              <p className="text-sm font-semibold text-gray-400">No results for "{search}"</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Slide panel ── */}
      <ItemSlidePanel
        open={panel.open}
        editing={panel.editing}
        catIdx={panel.catIdx}
        categories={menu}
        onSave={handleSaveItem}
        onClose={closePanel}
      />
    </div>
  );
}

function StatRow({ label, value, accent }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-400">{label}</span>
      <span className={`font-bold ${accent ? 'text-emerald-500' : 'text-gray-700 dark:text-gray-300'}`}>{value}</span>
    </div>
  );
}
