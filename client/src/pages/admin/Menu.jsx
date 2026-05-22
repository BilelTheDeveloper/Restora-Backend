import { useState } from 'react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Search } from 'lucide-react';

const INITIAL_ITEMS = [
  { id: 1,  name: 'Brick au Thon',    cat: 'Starters', price: 8.5,  available: true,  emoji: '🥟' },
  { id: 2,  name: 'Salade Mechouia',  cat: 'Starters', price: 7.0,  available: true,  emoji: '🥗' },
  { id: 3,  name: 'Soup Harissa',     cat: 'Starters', price: 6.5,  available: false, emoji: '🍲' },
  { id: 4,  name: 'Couscous Royal',   cat: 'Mains',    price: 24.0, available: true,  emoji: '🫕' },
  { id: 5,  name: 'Lamb Tagine',      cat: 'Mains',    price: 28.0, available: true,  emoji: '🍖' },
  { id: 6,  name: 'Grilled Fish',     cat: 'Mains',    price: 22.0, available: true,  emoji: '🐟' },
  { id: 7,  name: 'Pasta Arrabiata',  cat: 'Mains',    price: 18.0, available: false, emoji: '🍝' },
  { id: 8,  name: 'Baklava',          cat: 'Desserts', price: 9.0,  available: true,  emoji: '🍰' },
  { id: 9,  name: 'Crème Brûlée',    cat: 'Desserts', price: 10.0, available: true,  emoji: '🍮' },
  { id: 10, name: 'Fresh Juice',      cat: 'Drinks',   price: 5.5,  available: true,  emoji: '🍊' },
  { id: 11, name: 'Café Turc',        cat: 'Drinks',   price: 4.0,  available: true,  emoji: '☕' },
  { id: 12, name: 'Soft Drink',       cat: 'Drinks',   price: 3.5,  available: true,  emoji: '🥤' },
];

const CATEGORIES = ['All', 'Starters', 'Mains', 'Desserts', 'Drinks'];

const CAT_COLORS = {
  Starters: 'bg-orange-50 text-orange-500 dark:bg-orange-500/10',
  Mains:    'bg-blue-50   text-blue-500   dark:bg-blue-500/10',
  Desserts: 'bg-pink-50   text-pink-500   dark:bg-pink-500/10',
  Drinks:   'bg-teal-50   text-teal-500   dark:bg-teal-500/10',
};

export default function Menu() {
  const [items, setItems]         = useState(INITIAL_ITEMS);
  const [activeCategory, setActive] = useState('All');
  const [search, setSearch]       = useState('');

  const toggle = (id) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, available: !i.available } : i));

  const remove = (id) =>
    setItems(prev => prev.filter(i => i.id !== id));

  const catCounts = CATEGORIES.reduce((acc, c) => {
    acc[c] = c === 'All' ? items.length : items.filter(i => i.cat === c).length;
    return acc;
  }, {});

  const filtered = items.filter(i => {
    const matchCat = activeCategory === 'All' || i.cat === activeCategory;
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="p-5 sm:p-6 space-y-6 max-w-[1440px]">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Menu</h1>
          <p className="text-xs text-gray-400 mt-0.5">{items.length} items · {items.filter(i => i.available).length} available</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm shadow-orange-500/20">
          <Plus size={14} /> Add Item
        </button>
      </div>

      <div className="flex gap-5 items-start">

        {/* Category sidebar */}
        <div className="hidden lg:block w-48 shrink-0 space-y-1">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 px-3 mb-2">Categories</p>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={[
                'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                activeCategory === cat
                  ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/25'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-800 dark:hover:text-gray-200',
              ].join(' ')}
            >
              <span>{cat}</span>
              <span className={[
                'text-[10px] font-bold min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center',
                activeCategory === cat ? 'bg-white/25 text-white' : 'bg-gray-100 dark:bg-white/8 text-gray-400',
              ].join(' ')}>
                {catCounts[cat]}
              </span>
            </button>
          ))}
        </div>

        {/* Items table */}
        <div className="flex-1 min-w-0 bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/6 rounded-2xl shadow-sm overflow-hidden">

          {/* Search bar + mobile category */}
          <div className="px-5 py-4 border-b border-gray-100 dark:border-white/6 flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 flex-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2">
              <Search size={13} className="text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Search items..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-xs text-gray-700 dark:text-gray-300 placeholder-gray-400 outline-none"
              />
            </div>

            {/* Mobile category select */}
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 lg:hidden">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActive(cat)}
                  className={[
                    'px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all',
                    activeCategory === cat
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-500',
                  ].join(' ')}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Column headers */}
          <div className="hidden sm:grid grid-cols-[48px_1fr_80px_80px_96px_80px] gap-3 px-5 py-2.5 border-b border-gray-50 dark:border-white/4">
            {['', 'Name', 'Category', 'Price', 'Status', 'Actions'].map(h => (
              <span key={h} className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{h}</span>
            ))}
          </div>

          <div className="divide-y divide-gray-50 dark:divide-white/4">
            {filtered.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-gray-400">No items found</p>
              </div>
            ) : filtered.map(item => (
              <div
                key={item.id}
                className="grid sm:grid-cols-[48px_1fr_80px_80px_96px_80px] gap-3 items-center px-5 py-3.5 hover:bg-gray-50/60 dark:hover:bg-white/2 transition-colors"
              >
                <span className="text-2xl">{item.emoji}</span>

                <div className="min-w-0">
                  <p className={`text-sm font-semibold truncate ${item.available ? 'text-gray-900 dark:text-white' : 'text-gray-400 line-through'}`}>
                    {item.name}
                  </p>
                </div>

                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CAT_COLORS[item.cat] ?? ''} whitespace-nowrap`}>
                  {item.cat}
                </span>

                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {item.price.toFixed(1)}
                  <span className="text-gray-400 font-normal text-[10px] ml-0.5">TND</span>
                </span>

                <div>
                  <span className={[
                    'inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full',
                    item.available
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : 'bg-gray-100 text-gray-400 dark:bg-white/5',
                  ].join(' ')}>
                    <span className={`w-1 h-1 rounded-full ${item.available ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    {item.available ? 'Available' : 'Unavailable'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggle(item.id)}
                    className="text-gray-400 hover:text-orange-500 transition-colors"
                    title={item.available ? 'Mark unavailable' : 'Mark available'}
                  >
                    {item.available
                      ? <ToggleRight size={18} className="text-orange-500" />
                      : <ToggleLeft size={18} />
                    }
                  </button>
                  <button className="text-gray-400 hover:text-blue-500 transition-colors" title="Edit">
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => remove(item.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
