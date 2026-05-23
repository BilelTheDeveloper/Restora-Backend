import { useEffect, useState } from 'react';
import { Settings, Wrench, Zap, Clock, ArrowRight } from 'lucide-react';

function Countdown({ until }) {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (!until) return;
    const end = new Date(until).getTime();
    const tick = () => {
      const diff = end - Date.now();
      if (diff <= 0) { setRemaining(null); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining({ h, m, s });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [until]);

  if (!remaining) return null;

  return (
    <div className="flex items-center justify-center gap-3 mt-6">
      {[
        { label: 'Hours',   val: remaining.h },
        { label: 'Minutes', val: remaining.m },
        { label: 'Seconds', val: remaining.s },
      ].map(({ label, val }, i) => (
        <div key={label} className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center">
              <span className="text-2xl font-black text-white tabular-nums">
                {String(val).padStart(2, '0')}
              </span>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/30 mt-1.5">{label}</span>
          </div>
          {i < 2 && <span className="text-white/30 text-xl font-bold mb-4">:</span>}
        </div>
      ))}
    </div>
  );
}

export default function Maintenance({ message, scheduledUntil }) {
  return (
    <>
      <style>{`
        @keyframes slowspin    { from { transform: rotate(0deg);   } to { transform: rotate(360deg);  } }
        @keyframes slowspin-r  { from { transform: rotate(360deg); } to { transform: rotate(0deg);    } }
        @keyframes floatup     { 0%,100% { transform: translateY(0px);    } 50% { transform: translateY(-14px); } }
        @keyframes gridmove    { 0% { transform: translateY(0);   } 100% { transform: translateY(48px); } }
        @keyframes glow-pulse  { 0%,100% { opacity: .25; } 50% { opacity: .55; } }
        @keyframes scanline    { 0% { transform: translateY(-100%); } 100% { transform: translateY(100vh); } }
        .spin-slow    { animation: slowspin   12s linear infinite; }
        .spin-slow-r  { animation: slowspin-r  8s linear infinite; }
        .float-anim   { animation: floatup     4s ease-in-out infinite; }
        .glow-pulse   { animation: glow-pulse  3s ease-in-out infinite; }
        .grid-move    { animation: gridmove   16s linear infinite; }
        .scanline     { animation: scanline    6s linear infinite; }
      `}</style>

      <div className="min-h-screen bg-[#050508] flex items-center justify-center overflow-hidden relative">

        {/* Animated grid background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute inset-0 opacity-[0.04] grid-move"
            style={{
              backgroundImage: 'linear-gradient(rgba(139,92,246,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,.8) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
              height: '200%',
            }}
          />
        </div>

        {/* Radial glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[120px] glow-pulse pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/15 rounded-full blur-[100px] glow-pulse pointer-events-none" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-900/10 rounded-full blur-[160px] pointer-events-none" />

        {/* Scanline effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.02]">
          <div className="w-full h-32 bg-gradient-to-b from-transparent via-white to-transparent scanline" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg">

          {/* Gear assembly */}
          <div className="relative w-32 h-32 mb-8 float-anim">
            {/* Outer ring */}
            <div className="absolute inset-0 spin-slow">
              <Settings size={128} className="text-violet-500/20" strokeWidth={1} />
            </div>
            {/* Inner gear */}
            <div className="absolute inset-6 spin-slow-r">
              <Settings size={80} className="text-violet-400/40" strokeWidth={1.5} />
            </div>
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-violet-500/50">
                <Wrench size={22} className="text-white" />
              </div>
            </div>
          </div>

          {/* Label pill */}
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/25 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-violet-400">Maintenance Mode</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
            We're{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
              upgrading
            </span>
          </h1>

          {/* Message */}
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-sm">
            {message || "We're performing scheduled maintenance to improve your experience. We'll be back shortly!"}
          </p>

          {/* Countdown */}
          {scheduledUntil && <Countdown until={scheduledUntil} />}

          {/* Status items */}
          <div className="w-full mt-8 space-y-2">
            {[
              { label: 'System backup',       done: true  },
              { label: 'Database migration',  done: true  },
              { label: 'Performance upgrade', done: false },
              { label: 'Security patches',    done: false },
            ].map(({ label, done }, i) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/6">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${done ? 'bg-emerald-500' : 'bg-white/10 border border-white/15'}`}>
                  {done
                    ? <Zap size={11} className="text-white" />
                    : <div className="w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />}
                </div>
                <span className={`text-xs font-medium ${done ? 'text-gray-300' : 'text-gray-500'}`}>{label}</span>
                <div className="flex-1" />
                <span className={`text-[10px] font-bold uppercase ${done ? 'text-emerald-400' : 'text-gray-600'}`}>
                  {done ? 'Done' : 'In progress'}
                </span>
              </div>
            ))}
          </div>

          {/* Estimated time footer */}
          <div className="flex items-center gap-2 mt-8 text-xs text-gray-500">
            <Clock size={12} />
            {scheduledUntil
              ? `Estimated completion: ${new Date(scheduledUntil).toLocaleString()}`
              : 'Estimated completion: very soon'}
          </div>

          {/* Back when done message */}
          <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-violet-400/70">
            <ArrowRight size={12} />
            <span>Restora will be back online shortly. Thank you for your patience.</span>
          </div>
        </div>

        {/* Corner decorations */}
        <div className="absolute top-6 left-6 w-16 h-16 border-l-2 border-t-2 border-violet-500/20 rounded-tl-2xl pointer-events-none" />
        <div className="absolute top-6 right-6 w-16 h-16 border-r-2 border-t-2 border-violet-500/20 rounded-tr-2xl pointer-events-none" />
        <div className="absolute bottom-6 left-6 w-16 h-16 border-l-2 border-b-2 border-violet-500/20 rounded-bl-2xl pointer-events-none" />
        <div className="absolute bottom-6 right-6 w-16 h-16 border-r-2 border-b-2 border-violet-500/20 rounded-br-2xl pointer-events-none" />
      </div>
    </>
  );
}
