import { useState, useMemo } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, X } from 'lucide-react';

const CATEGORIES = ['All', 'Starters', 'Mains', 'Desserts', 'Drinks'];
const ORDER_TYPES = ['Dine-in', 'Takeaway', 'Delivery'];

const MENU_ITEMS = [
  { id: 1,  name: 'Brick au Thon',    cat: 'Starters', price: 8.5,  emoji: '🥟' },
  { id: 2,  name: 'Salade Mechouia',  cat: 'Starters', price: 7.0,  emoji: '🥗' },
  { id: 3,  name: 'Soup Harissa',     cat: 'Starters', price: 6.5,  emoji: '🍲' },
  { id: 4,  name: 'Couscous Royal',   cat: 'Mains',    price: 24.0, emoji: '🫕' },
  { id: 5,  name: 'Lamb Tagine',      cat: 'Mains',    price: 28.0, emoji: '🍖' },
  { id: 6,  name: 'Grilled Fish',     cat: 'Mains',    price: 22.0, emoji: '🐟' },
  { id: 7,  name: 'Pasta Arrabiata',  cat: 'Mains',    price: 18.0, emoji: '🍝' },
  { id: 8,  name: 'Baklava',          cat: 'Desserts', price: 9.0,  emoji: '🍰' },
  { id: 9,  name: 'Crème Brûlée',    cat: 'Desserts', price: 10.0, emoji: '🍮' },
  { id: 10, name: 'Fresh Juice',      cat: 'Drinks',   price: 5.5,  emoji: '🍊' },
  { id: 11, name: 'Café Turc',        cat: 'Drinks',   price: 4.0,  emoji: '☕' },
  { id: 12, name: 'Soft Drink',       cat: 'Drinks',   price: 3.5,  emoji: '🥤' },
];

export default function POS() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [orderType, setOrderType] = useState('Dine-in');
  const [cart, setCart] = useState([]);

  const filtered = useMemo(
    () => activeCategory === 'All' ? MENU_ITEMS : MENU_ITEMS.filter(i => i.cat === activeCategory),
    [activeCategory],
  );

  const addItem = (item) =>
    setCart(prev => {
      const found = prev.find(c => c.id === item.id);
      if (found) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1 }];
    });

  const updateQty = (id, delta) =>
    setCart(prev =>
      prev.map(c => c.id === id ? { ...c, qty: c.qty + delta } : c).filter(c => c.qty > 0),
    );

  const subtotal  = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const tax       = subtotal * 0.19;
  const total     = subtotal + tax;
  const itemCount = cart.reduce((s, c) => s + c.qty, 0);

  return (
    <div className="p-5 sm:p-6 flex gap-5 items-start max-w-[1440px]">

      {/* ── Menu browser ─────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-5">

        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Point of Sale</h1>
          <p className="text-xs text-gray-400 mt-0.5">Tap items to add to the order</p>
        </div>

        {/* Order type + category filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex bg-gray-100 dark:bg-white/5 rounded-xl p-1 gap-1 shrink-0">
            {ORDER_TYPES.map(t => (
              <button
                key={t}
                onClick={() => setOrderType(t)}
                className={[
                  'px-4 py-1.5 text-xs font-semibold rounded-lg transition-all',
                  orderType === t
                    ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
                ].join(' ')}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={[
                  'px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all',
                  activeCategory === cat
                    ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/25'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10',
                ].join(' ')}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Items grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map(item => {
            const inCart = cart.find(c => c.id === item.id);
            return (
              <button
                key={item.id}
                onClick={() => addItem(item)}
                className={[
                  'relative bg-white dark:bg-[#141414] border rounded-2xl p-4 text-left',
                  'transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.97]',
                  inCart
                    ? 'border-orange-300 dark:border-orange-500/40 shadow-sm'
                    : 'border-gray-100 dark:border-white/6 shadow-sm',
                ].join(' ')}
              >
                {inCart && (
                  <span className="absolute top-2.5 right-2.5 bg-orange-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                    {inCart.qty}
                  </span>
                )}
                <span className="text-3xl block mb-3">{item.emoji}</span>
                <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{item.name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{item.cat}</p>
                <p className="text-sm font-bold text-orange-500 mt-2">{item.price.toFixed(1)} TND</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Cart panel ───────────────────────────────────── */}
      <div className="w-[300px] xl:w-[320px] shrink-0 sticky top-5">
        <div className="bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/6 rounded-2xl shadow-sm overflow-hidden">

          {/* Cart header */}
          <div className="px-5 py-4 border-b border-gray-100 dark:border-white/6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart size={15} className="text-orange-500" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Order</span>
              {itemCount > 0 && (
                <span className="bg-orange-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium text-gray-400 bg-gray-50 dark:bg-white/5 px-2.5 py-1 rounded-full border border-gray-100 dark:border-white/8">
              {orderType}
            </span>
          </div>

          {/* Items */}
          <div className="min-h-[120px] max-h-[48vh] overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <span className="text-4xl mb-3">🛒</span>
                <p className="text-sm font-medium text-gray-400">Cart is empty</p>
                <p className="text-xs text-gray-400 mt-1">Tap menu items to add them</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-white/4">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-xl shrink-0">{item.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{item.name}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{(item.price * item.qty).toFixed(2)} TND</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-white/8 flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-white/15 transition-colors"
                      >
                        {item.qty === 1 ? <Trash2 size={10} /> : <Minus size={10} />}
                      </button>
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200 w-5 text-center">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-white/8 flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-white/15 transition-colors"
                      >
                        <Plus size={10} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals + actions */}
          {cart.length > 0 && (
            <>
              <div className="px-5 py-3.5 border-t border-gray-100 dark:border-white/6 space-y-1.5">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Subtotal</span>
                  <span>{subtotal.toFixed(2)} TND</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>TVA (19%)</span>
                  <span>{tax.toFixed(2)} TND</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-gray-900 dark:text-white pt-1.5 border-t border-gray-100 dark:border-white/6 mt-1">
                  <span>Total</span>
                  <span className="text-orange-500">{total.toFixed(2)} TND</span>
                </div>
              </div>

              <div className="p-4 flex gap-2">
                <button
                  onClick={() => setCart([])}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <X size={13} />
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-colors shadow-sm shadow-orange-500/30">
                  <CreditCard size={14} />
                  Charge {total.toFixed(0)} TND
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
