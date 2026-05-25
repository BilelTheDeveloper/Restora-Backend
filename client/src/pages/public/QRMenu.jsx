import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import {
  ShoppingCart, Plus, Minus, X, ChefHat, Bell, Receipt,
  CheckCircle2, Clock, Loader2, ArrowLeft, Utensils,
} from 'lucide-react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function getQRMenu(slug, tableId) {
  const res = await axios.get(`${API}/qr/${slug}/${tableId}`);
  return res.data.data;
}

async function placeQROrder(slug, tableId, payload) {
  const res = await axios.post(`${API}/qr/${slug}/${tableId}/order`, payload);
  return res.data.data;
}

async function sendTableRequest(slug, tableId, type) {
  const res = await axios.post(`${API}/qr/${slug}/${tableId}/request`, { type });
  return res.data;
}

function CartBadge({ count }) {
  if (!count) return null;
  return (
    <motion.span
      key={count}
      initial={{ scale: 0.5 }}
      animate={{ scale: 1 }}
      className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-orange-500 text-[9px] font-black text-white flex items-center justify-center"
    >
      {count}
    </motion.span>
  );
}

function MenuItem({ item, onAdd }) {
  return (
    <div className="bg-white/[0.06] border border-white/10 rounded-2xl overflow-hidden">
      {item.image && (
        <div className="h-32 overflow-hidden">
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white leading-tight">{item.name}</p>
            {item.description && <p className="text-[11px] text-white/40 mt-0.5 line-clamp-2">{item.description}</p>}
          </div>
          <button
            onClick={() => onAdd(item)}
            className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center text-white shrink-0 hover:bg-orange-600 active:scale-95 transition-all"
          >
            <Plus size={14} />
          </button>
        </div>
        <p className="text-base font-black text-orange-400 tabular-nums mt-2">{item.price?.toFixed(3)} <span className="text-[11px] font-normal text-white/30">TND</span></p>
        {item.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {item.tags.map(t => <span key={t} className="text-[9px] bg-white/8 text-white/40 px-1.5 py-0.5 rounded-full">{t}</span>)}
          </div>
        )}
      </div>
    </div>
  );
}

function CartSheet({ cart, onUpdate, onClose, onCheckout, isPlacing }) {
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-x-0 bottom-0 bg-[#0f0f0f] border-t border-white/10 rounded-t-3xl z-50 max-h-[80vh] flex flex-col"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
        <h2 className="text-base font-bold text-white">Your Order</h2>
        <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/8 flex items-center justify-center text-white/60">
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{item.name}</p>
              <p className="text-xs text-orange-400">{(item.price * item.quantity).toFixed(3)} TND</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => onUpdate(i, -1)}
                className="w-7 h-7 rounded-lg bg-white/8 flex items-center justify-center text-white/60 hover:bg-white/15 transition-colors">
                <Minus size={11} />
              </button>
              <span className="text-sm font-bold text-white tabular-nums w-4 text-center">{item.quantity}</span>
              <button onClick={() => onUpdate(i, 1)}
                className="w-7 h-7 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400 hover:bg-orange-500/30 transition-colors">
                <Plus size={11} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-white/6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/60">Total</span>
          <span className="text-xl font-black text-orange-400 tabular-nums">{total.toFixed(3)} TND</span>
        </div>
        <button
          onClick={onCheckout}
          disabled={isPlacing}
          className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-2xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isPlacing ? <Loader2 size={16} className="animate-spin" /> : <ChefHat size={16} />}
          {isPlacing ? 'Placing Order…' : 'Place Order'}
        </button>
      </div>
    </motion.div>
  );
}

function OrderConfirmed({ order, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-[#0a0a0a] z-50 flex flex-col items-center justify-center p-6 text-center"
    >
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring' }}>
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 size={36} className="text-emerald-400" />
        </div>
      </motion.div>
      <h1 className="text-2xl font-black text-white mb-2">Order Placed!</h1>
      <p className="text-white/40 text-sm mb-1">Order #{order?.orderNumber}</p>
      <p className="text-white/30 text-xs mb-8">The kitchen is on it. We'll have your food ready soon.</p>
      <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-2xl px-4 py-3 mb-8">
        <Clock size={14} className="text-amber-400" />
        <span className="text-sm text-white/60">Estimated: <span className="text-white font-bold">15–25 min</span></span>
      </div>
      <button onClick={onClose}
        className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl transition-colors">
        Back to Menu
      </button>
    </motion.div>
  );
}

export default function QRMenu() {
  const { slug, tableId } = useParams();
  const [activeCategory, setActiveCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['qr-menu', slug, tableId],
    queryFn: () => getQRMenu(slug, tableId),
    retry: 1,
  });

  const restaurant = data?.restaurant;
  const table = data?.table;
  const categories = restaurant?.menu?.filter(cat => cat.items?.length > 0) || [];

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]._id || categories[0].name);
    }
  }, [categories.length]);

  const { mutate: placeOrder, isPending } = useMutation({
    mutationFn: () => placeQROrder(slug, tableId, {
      items: cart.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
    }),
    onSuccess: (order) => {
      setCart([]);
      setShowCart(false);
      setConfirmedOrder(order);
    },
    onError: () => toast.error('Failed to place order. Please try again.'),
  });

  const { mutate: sendRequest } = useMutation({
    mutationFn: (type) => sendTableRequest(slug, tableId, type),
    onSuccess: (_, type) => toast.success(type === 'waiter' ? 'Waiter called!' : 'Bill requested!', { icon: type === 'waiter' ? '🔔' : '💳' }),
    onError: () => toast.error('Request failed. Please try again.'),
  });

  const addToCart = (item) => {
    setCart(c => {
      const existing = c.findIndex(i => i.name === item.name);
      if (existing >= 0) {
        return c.map((i, idx) => idx === existing ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...c, { name: item.name, price: item.price || 0, quantity: 1 }];
    });
    toast.success(`${item.name} added`, { duration: 1200 });
  };

  const updateCart = (idx, delta) => {
    setCart(c => c.map((item, i) => i === idx ? { ...item, quantity: item.quantity + delta } : item).filter(i => i.quantity > 0));
  };

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const activeItems = categories.find(c => (c._id || c.name) === activeCategory)?.items || [];

  if (isLoading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <Loader2 size={28} className="animate-spin text-orange-400" />
    </div>
  );

  if (isError || !restaurant) return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
      <Utensils size={40} className="text-white/20 mb-4" />
      <h1 className="text-lg font-bold text-white mb-2">Menu not found</h1>
      <p className="text-sm text-white/40">This QR code may be invalid or expired.</p>
    </div>
  );

  if (confirmedOrder) return <OrderConfirmed order={confirmedOrder} onClose={() => setConfirmedOrder(null)} />;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col max-w-lg mx-auto">
      <Toaster position="top-center" toastOptions={{ style: { background: '#1a1a1a', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />

      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/6 px-4 py-3">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-base font-black text-white">{restaurant.name}</h1>
            {table && <p className="text-xs text-white/30">Table {table.number} · {table.floor || 'Main'}</p>}
          </div>
          <button
            onClick={() => setShowCart(true)}
            className="relative w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/25 flex items-center justify-center text-orange-400"
          >
            <ShoppingCart size={18} />
            <CartBadge count={cartCount} />
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none mt-2 -mx-1 px-1 pb-0.5">
          {categories.map(cat => (
            <button
              key={cat._id || cat.name}
              onClick={() => setActiveCategory(cat._id || cat.name)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeCategory === (cat._id || cat.name)
                  ? 'bg-orange-500 text-white'
                  : 'bg-white/6 text-white/50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu items */}
      <div className="flex-1 p-4 space-y-3 pb-36">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.15 }}
            className="space-y-3"
          >
            {activeItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-white/20 gap-2">
                <Utensils size={24} /><p className="text-xs">No items in this category</p>
              </div>
            ) : (
              activeItems
                .filter(item => item.available !== false)
                .map((item, i) => <MenuItem key={i} item={item} onAdd={addToCart} />)
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 inset-x-0 max-w-lg mx-auto bg-[#0f0f0f]/95 backdrop-blur-xl border-t border-white/8 p-4 z-20">
        <div className="flex gap-2">
          <button
            onClick={() => sendRequest('waiter')}
            className="flex-1 py-3 bg-white/6 hover:bg-white/12 border border-white/8 text-white/70 text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-1.5"
          >
            <Bell size={14} /> Call Waiter
          </button>
          <button
            onClick={() => sendRequest('bill')}
            className="flex-1 py-3 bg-white/6 hover:bg-white/12 border border-white/8 text-white/70 text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-1.5"
          >
            <Receipt size={14} /> Request Bill
          </button>
          {cartCount > 0 && (
            <button
              onClick={() => setShowCart(true)}
              className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-1.5"
            >
              <ShoppingCart size={14} /> Order ({cartCount})
            </button>
          )}
        </div>
      </div>

      {/* Cart Sheet */}
      <AnimatePresence>
        {showCart && cart.length > 0 && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40"
              onClick={() => setShowCart(false)}
            />
            <CartSheet
              cart={cart}
              onUpdate={updateCart}
              onClose={() => setShowCart(false)}
              onCheckout={placeOrder}
              isPlacing={isPending}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
