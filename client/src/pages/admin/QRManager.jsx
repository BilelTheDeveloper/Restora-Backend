import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { QrCode, Download, Printer, Loader2, Table2, ExternalLink } from 'lucide-react';
import { restaurantService } from '../../services/restaurantService';
import { useAuthStore } from '../../store/authStore';

function QRCodeSVG({ value, size = 160 }) {
  // Simple QR code visual placeholder — real QR is rendered via URL to a QR API
  // We use a data URI image from the google charts QR API (already available, no key needed)
  const encoded = encodeURIComponent(value);
  return (
    <img
      src={`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&bgcolor=111111&color=ffffff&qzone=1&format=svg`}
      alt={`QR for ${value}`}
      className="w-full h-full object-contain rounded-xl"
      style={{ imageRendering: 'pixelated' }}
      crossOrigin="anonymous"
    />
  );
}

function TableQRCard({ table, restaurantSlug }) {
  const ref = useRef(null);
  const qrUrl = `${window.location.origin}/qr/${restaurantSlug}/${table._id}`;

  const handleDownload = () => {
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(qrUrl)}&bgcolor=111111&color=ffffff&qzone=2&format=png`;
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR-Table-${table.number}.png`;
    a.click();
  };

  const handlePrint = () => {
    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>QR Table ${table.number}</title>
      <style>
        body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background: #fff; margin: 0; }
        h1 { font-size: 24px; font-weight: 900; margin-bottom: 4px; }
        p { font-size: 12px; color: #666; margin-top: 0; }
        img { border-radius: 12px; }
      </style>
      </head><body>
      <h1>Table ${table.number}</h1>
      <p>${table.floor || 'Main Floor'} · Capacity: ${table.capacity}</p>
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrUrl)}&bgcolor=ffffff&color=000000&qzone=2&format=png" />
      <p style="margin-top:12px; font-size:10px; color:#999">Scan to view menu & order</p>
      </body></html>
    `);
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl overflow-hidden"
    >
      {/* QR image — always dark background for scan consistency */}
      <div className="bg-[#0d0d0d] p-5 flex items-center justify-center">
        <div className="w-36 h-36">
          <QRCodeSVG value={qrUrl} size={160} />
        </div>
      </div>

      {/* Table info */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-base font-black text-gray-900 dark:text-white">Table {table.number}</p>
          {table.capacity && (
            <span className="text-[10px] text-gray-400 dark:text-white/40 bg-gray-100 dark:bg-white/6 px-2 py-0.5 rounded-full">{table.capacity} seats</span>
          )}
        </div>
        <p className="text-[11px] text-gray-400 dark:text-white/30 mb-3">{table.floor || 'Main Floor'}</p>

        <div className="flex gap-1.5">
          <button
            onClick={handleDownload}
            className="flex-1 py-2 bg-gray-100 dark:bg-white/6 hover:bg-gray-200 dark:hover:bg-white/12 text-gray-500 dark:text-white/60 hover:text-gray-900 dark:hover:text-white text-[11px] font-semibold rounded-xl transition-all flex items-center justify-center gap-1"
          >
            <Download size={11} /> PNG
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2 bg-gray-100 dark:bg-white/6 hover:bg-gray-200 dark:hover:bg-white/12 text-gray-500 dark:text-white/60 hover:text-gray-900 dark:hover:text-white text-[11px] font-semibold rounded-xl transition-all flex items-center justify-center gap-1"
          >
            <Printer size={11} /> Print
          </button>
          <a
            href={qrUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-8 rounded-xl bg-orange-500/15 border border-orange-500/25 text-orange-400 flex items-center justify-center hover:bg-orange-500/25 transition-colors"
          >
            <ExternalLink size={11} />
          </a>
        </div>
      </div>
    </motion.div>
  );
}

export default function QRManager() {
  const { user } = useAuthStore();

  const { data: restaurant, isLoading: loadingRestaurant } = useQuery({
    queryKey: ['my-restaurant'],
    queryFn: () => restaurantService.getMine().then(r => r.data),
  });

  const { data: tables = [], isLoading: loadingTables } = useQuery({
    queryKey: ['owner-tables'],
    queryFn: () => restaurantService.getTables().then(r => r.data),
  });

  const isLoading = loadingRestaurant || loadingTables;
  const slug = restaurant?.slug || user?.restaurant || '';

  const handlePrintAll = () => {
    const w = window.open('', '_blank');
    const cards = tables.map(t => {
      const qrUrl = `${window.location.origin}/qr/${slug}/${t._id}`;
      return `
        <div style="display:inline-block; text-align:center; margin:20px; break-inside:avoid;">
          <h2 style="font-size:18px; margin-bottom:4px;">Table ${t.number}</h2>
          <p style="font-size:10px; color:#666; margin:0 0 8px;">${t.floor || 'Main Floor'}</p>
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(qrUrl)}&bgcolor=ffffff&color=000000&qzone=2&format=png" />
        </div>
      `;
    }).join('');
    w.document.write(`<html><head><title>All QR Codes</title><style>body{font-family:sans-serif;background:#fff;}</style></head><body>${cards}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <div className="p-5 sm:p-6 space-y-5 max-w-[1440px] bg-gray-50 dark:bg-[#0a0a0a] min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">QR Manager</h1>
          <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">Generate and download QR codes for every table</p>
        </div>
        {tables.length > 0 && (
          <button
            onClick={handlePrintAll}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 dark:bg-white/8 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-500 dark:text-white/70 hover:text-gray-900 dark:hover:text-white text-xs font-bold rounded-xl transition-all border border-gray-200 dark:border-white/8"
          >
            <Printer size={13} /> Print All
          </button>
        )}
      </div>

      {/* Info banner */}
      {slug && (
        <div className="bg-orange-50 dark:bg-orange-500/8 border border-orange-200 dark:border-orange-500/20 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <QrCode size={16} className="text-orange-500 dark:text-orange-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">Your QR Menu URL</p>
              <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5 font-mono break-all">{window.location.origin}/qr/{slug}/[tableId]</p>
              <p className="text-[11px] text-gray-400 dark:text-white/30 mt-1">Guests scan the QR code → browse menu → place orders → track status in real time.</p>
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48 text-gray-300 dark:text-white/30">
          <Loader2 size={22} className="animate-spin" />
        </div>
      ) : tables.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-300 dark:text-white/20 gap-2">
          <Table2 size={28} />
          <p className="text-xs">No tables configured</p>
          <p className="text-[11px] text-gray-300 dark:text-white/15">Add tables in Restaurant Setup first</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {tables.map(table => (
            <TableQRCard key={table._id} table={table} restaurantSlug={slug} />
          ))}
        </div>
      )}
    </div>
  );
}
