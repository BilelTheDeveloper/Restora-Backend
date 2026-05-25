import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ShoppingCart, Plus, Minus, Trash2, CreditCard, Search,
  X, Check, Printer, ChefHat, Truck, UtensilsCrossed,
  Loader2, AlertCircle,
} from 'lucide-react';
import { restaurantService } from '../../services/restaurantService';
import { orderService } from '../../services/orderService';
import { useAuthStore } from '../../store/authStore';

const ORDER_TYPES = [
  { key: 'dine-in',  label: 'Dine-in',  icon: UtensilsCrossed, color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/30' },
  { key: 'takeaway', label: 'Takeaway', icon: ShoppingCart,     color: 'text-blue-400',   bg: 'bg-blue-500/15 border-blue-500/30' },
  { key: 'delivery', label: 'Delivery', icon: Truck,            color: 'text-purple-400',  bg: 'bg-purple-500/15 border-purple-500/30' },
];

const PAYMENT_METHODS = [
  { key: 'cash',   label: 'Cash' },
  { key: 'card',   label: 'Card' },
  { key: 'online', label: 'Online' },
];

export default function POS() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const [orderType,    setOrderType]    = useState('dine-in');
  const [cart,         setCart]         = useState([]);
  const [search,       setSearch]       = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedTable, setSelectedTable] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone,setCustomerPhone]= useState('');
  const [payMethod,    setPayMethod]    = useState('cash');
  const [showCheckout, setShowCheckout] = useState(false);

  // Fetch restaurant (has embedded menu)
  const { data: restaurant, isLoading: loadingMenu } = useQuery({
    queryKey: ['my-restaurant'],
    queryFn:  () => restaurantService.getMine().then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch tables for dine-in
  const { data: tables = [] } = useQuery({
    queryKey: ['owner-tables'],
    queryFn:  () => restaurantService.getTables().then(r => r.data),
    enabled:  orderType === 'dine-in',
  });

  const menu = restaurant?.menu || [];
  const categories = useMemo(() => ['All', ...menu.map(c => c.category)], [menu]);
  const allItems = useMemo(() => {
    const items = [];
    for (const cat of menu) {
      for (const item of cat.items || []) {
        if (item.available !== false) items.push({ ...item, category: cat.category });
      }
    }
    return items;
  }, [menu]);

  const filtered = useMemo(() => {
    let items = activeCategory === 'All' ? allItems : allItems.filter(i => i.category === activeCategory);
    if (search) items = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
    return items;
  }, [allItems, activeCategory, search]);

  // Cart ops
  const addItem = useCallback((item) => {
    setCart(prev => {
      const found = prev.find(c => c._id?.toString() === item._id?.toString());
      if (found) return prev.map(c => c._id?.toString() === item._id?.toString() ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1 }];
    });
  }, []);

  const updateQty = useCallback((id, delta) => {
    setCart(prev => prev.map(c => c._id?.toString() === id ? { ...c, qty: Math.max(0, c.qty + delta) } : c).filter(c => c.qty > 0));
  }, []);

  const clearCart = () => { setCart([]); setSelectedTable(null); setCustomerName(''); setCustomerPhone(''); };

  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const taxRate  = restaurant?.settings?.taxRate || 0;
  const tax      = subtotal * (taxRate / 100);
  const total    = subtotal + tax;

  // Create order
  const { mutate: placeOrder, isPending: placing } = useMutation({
    mutationFn: () => orderService.create({
      type: orderType,
      items: cart.map(c => ({ menuItemId: c._id, name: c.name, quantity: c.qty })),
      tableId: orderType === 'dine-in' ? selectedTable : null,
      customerName, customerPhone,
      paymentMethod: payMethod,
    }),
    onSuccess: (data) => {
      toast.success(`Order ${data.data?.orderNumber || ''} created!`);
      qc.invalidateQueries(['orders']);
      qc.invalidateQueries(['owner-tables']);
      clearCart();
      setShowCheckout(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create order'),
  });

  const availableTables = tables.filter(t => t.status === 'available');

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-gray-50 dark:bg-[#0a0a0a]">

      {/* ── Left: Menu browser ─────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-gray-100 dark:border-white/6">

        {/* Header */}
        <div className="px-5 py-4 bg-white dark:bg-transparent border-b border-gray-100 dark:border-white/6 flex items-center gap-3">
          <ChefHat size={18} className="text-orange-400 shrink-0" />
          <h1 className="text-sm font-bold text-gray-900 dark:text-white">Point of Sale</h1>
          <div className="flex-1 relative ml-2">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search menu…"
              className="w-full bg-gray-100 dark:bg-white/6 border border-gray-200 dark:border-white/8 rounded-xl pl-8 pr-3 py-1.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:border-orange-500/50"
            />
          </div>
        </div>

        {/* Order type */}
        <div className="px-5 py-3 bg-white dark:bg-transparent flex gap-2 border-b border-gray-100 dark:border-white/6">
          {ORDER_TYPES.map(({ key, label, icon: Icon, color, bg }) => (
            <button
              key={key}
              onClick={() => setOrderType(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                orderType === key ? `${bg} ${color}` : 'border-transparent text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/70'
              }`}
            >
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>

        {/* Category pills */}
        <div className="px-5 py-2 bg-white dark:bg-transparent flex gap-2 overflow-x-auto scrollbar-none border-b border-gray-100 dark:border-white/6">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                activeCategory === cat
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 dark:bg-white/6 text-gray-500 dark:text-white/50 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {loadingMenu ? (
            <div className="flex items-center justify-center h-40 text-gray-300 dark:text-white/30">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-300 dark:text-white/30 gap-2">
              <AlertCircle size={24} />
              <p className="text-xs">No items found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map(item => {
                const inCart = cart.find(c => c._id?.toString() === item._id?.toString());
                return (
                  <motion.button
                    key={item._id}
                    onClick={() => addItem(item)}
                    whileTap={{ scale: 0.96 }}
                    className={`relative text-left p-3 rounded-2xl border transition-all ${
                      inCart
                        ? 'bg-orange-500/10 border-orange-500/40'
                        : 'bg-white dark:bg-white/4 border-gray-100 dark:border-white/8 hover:bg-gray-50 dark:hover:bg-white/8 hover:border-gray-200 dark:hover:border-white/15'
                    }`}
                  >
                    {inCart && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {inCart.qty}
                      </span>
                    )}
                    <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight mb-1">{item.name}</p>
                    <p className="text-[10px] text-gray-400 dark:text-white/40 mb-2 line-clamp-1">{item.category}</p>
                    <p className="text-sm font-bold text-orange-400">{item.price.toFixed(1)} <span className="text-[10px] font-normal text-gray-400 dark:text-white/30">TND</span></p>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Cart ───────────────────────────────────── */}
      <div className="w-80 flex flex-col bg-white dark:bg-[#0f0f0f]">
        <div className="px-4 py-4 border-b border-gray-100 dark:border-white/6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart size={15} className="text-orange-400" />
            <span className="text-sm font-bold text-gray-900 dark:text-white">Order</span>
            {cart.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center">
                {cart.reduce((s, c) => s + c.qty, 0)}
              </span>
            )}
          </div>
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-gray-400 dark:text-white/30 hover:text-gray-700 dark:hover:text-white/60 text-[10px]">Clear</button>
          )}
        </div>

        {/* Table selector for dine-in */}
        {orderType === 'dine-in' && (
          <div className="px-4 py-3 border-b border-gray-100 dark:border-white/6">
            <p className="text-[10px] font-bold text-gray-400 dark:text-white/40 uppercase tracking-wider mb-2">Table</p>
            <div className="flex flex-wrap gap-1.5">
              {availableTables.slice(0, 12).map(t => (
                <button
                  key={t._id}
                  onClick={() => setSelectedTable(selectedTable === t._id ? null : t._id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                    selectedTable === t._id
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : 'border-gray-200 dark:border-white/10 text-gray-400 dark:text-white/50 hover:border-orange-500/40 hover:text-orange-400'
                  }`}
                >
                  T-{t.number}
                </button>
              ))}
              {availableTables.length === 0 && <p className="text-[11px] text-gray-400 dark:text-white/30">No available tables</p>}
            </div>
          </div>
        )}

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          <AnimatePresence>
            {cart.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-32 text-gray-300 dark:text-white/20 gap-2">
                <ShoppingCart size={28} />
                <p className="text-xs">Cart is empty</p>
              </motion.div>
            ) : (
              cart.map(item => (
                <motion.div
                  key={item._id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-white/4 rounded-xl"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{item.name}</p>
                    <p className="text-[10px] text-orange-500 dark:text-orange-400">{(item.price * item.qty).toFixed(1)} TND</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => updateQty(item._id, -1)} className="w-5 h-5 rounded-full bg-gray-100 dark:bg-white/8 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/15 transition-colors">
                      <Minus size={10} className="text-gray-500 dark:text-white/60" />
                    </button>
                    <span className="text-xs font-bold text-gray-900 dark:text-white w-4 text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item._id, 1)} className="w-5 h-5 rounded-full bg-gray-100 dark:bg-white/8 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/15 transition-colors">
                      <Plus size={10} className="text-gray-500 dark:text-white/60" />
                    </button>
                    <button onClick={() => setCart(p => p.filter(c => c._id !== item._id))} className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center hover:bg-red-500/25 transition-colors ml-1">
                      <Trash2 size={10} className="text-red-400" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Totals + checkout */}
        {cart.length > 0 && (
          <div className="px-4 py-4 border-t border-gray-100 dark:border-white/6 space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-gray-400 dark:text-white/50">
                <span>Subtotal</span><span>{subtotal.toFixed(2)} TND</span>
              </div>
              {taxRate > 0 && (
                <div className="flex justify-between text-xs text-gray-400 dark:text-white/50">
                  <span>TVA ({taxRate}%)</span><span>{tax.toFixed(2)} TND</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-gray-900 dark:text-white pt-1 border-t border-gray-100 dark:border-white/6">
                <span>Total</span><span className="text-orange-500 dark:text-orange-400">{total.toFixed(2)} TND</span>
              </div>
            </div>

            {/* Payment method */}
            <div className="flex gap-1.5">
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.key}
                  onClick={() => setPayMethod(m.key)}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                    payMethod === m.key ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-200 dark:border-white/10 text-gray-400 dark:text-white/40 hover:border-gray-300 dark:hover:border-white/25'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowCheckout(true)}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <CreditCard size={14} /> Place Order
            </button>
          </div>
        )}
      </div>

      {/* ── Checkout confirmation modal ──────────────────── */}
      <AnimatePresence>
        {showCheckout && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={e => e.target === e.currentTarget && setShowCheckout(false)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-900 dark:text-white">Confirm Order</h2>
                <button onClick={() => setShowCheckout(false)} className="text-gray-400 dark:text-white/30 hover:text-gray-700 dark:hover:text-white"><X size={16} /></button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 dark:text-white/50">Type</span>
                  <span className="text-gray-900 dark:text-white font-semibold capitalize">{orderType}</span>
                </div>
                {orderType === 'dine-in' && selectedTable && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400 dark:text-white/50">Table</span>
                    <span className="text-gray-900 dark:text-white font-semibold">{tables.find(t => t._id === selectedTable)?.number || '—'}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 dark:text-white/50">Items</span>
                  <span className="text-gray-900 dark:text-white font-semibold">{cart.reduce((s, c) => s + c.qty, 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 dark:text-white/50">Total</span>
                  <span className="text-orange-500 dark:text-orange-400 font-bold">{total.toFixed(2)} TND</span>
                </div>
              </div>

              <div className="space-y-2">
                <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Customer name (optional)"
                  className="w-full bg-gray-50 dark:bg-white/6 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:border-orange-500/50" />
                <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Phone (optional)"
                  className="w-full bg-gray-50 dark:bg-white/6 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:border-orange-500/50" />
              </div>

              <button
                onClick={() => placeOrder()}
                disabled={placing}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {placing ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {placing ? 'Placing…' : 'Confirm Order'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
