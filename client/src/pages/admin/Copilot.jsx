import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Loader2, TrendingUp, Users, BarChart2, DollarSign, Clock, Lightbulb, Zap, ChevronRight } from 'lucide-react';
import { copilotService } from '../../services/copilotService';

const QUICK_QUESTIONS = [
  { icon: TrendingUp, label: 'Revenue today',       q: 'How was revenue today?' },
  { icon: DollarSign, label: 'Increase profit',     q: 'How can I increase profit?' },
  { icon: BarChart2,  label: 'Best performers',     q: 'What are my best performing menu items?' },
  { icon: Users,      label: 'Staffing tonight',    q: 'Am I overstaffed or understaffed tonight?' },
  { icon: Clock,      label: 'Peak hours',          q: 'When are my peak hours?' },
  { icon: Zap,        label: 'Quick wins',          q: 'What quick wins can I implement this week?' },
];

function DataPoint({ label, value, color = 'text-orange-500 dark:text-orange-400' }) {
  return (
    <div className="bg-gray-50 dark:bg-white/4 rounded-xl p-3 text-center">
      <p className={`text-lg font-black tabular-nums ${color}`}>{value}</p>
      <p className="text-[10px] text-gray-400 dark:text-white/40 mt-0.5">{label}</p>
    </div>
  );
}

function InsightCard({ insight }) {
  if (!insight) return null;
  const { answer, dataPoints = [], insights = [], recommendations = [] } = insight;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/8 rounded-2xl overflow-hidden"
    >
      {/* Answer */}
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <Bot size={15} className="text-orange-400" />
          </div>
          <p className="text-sm text-gray-700 dark:text-white/80 leading-relaxed">{answer}</p>
        </div>
      </div>

      {/* Data Points */}
      {dataPoints.length > 0 && (
        <div className="px-5 pb-5">
          <p className="text-[10px] font-bold text-gray-400 dark:text-white/30 uppercase tracking-wider mb-3">Data</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {dataPoints.map((dp, i) => (
              <DataPoint
                key={i}
                label={dp.label}
                value={dp.value}
                color={dp.trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : dp.trend === 'down' ? 'text-red-500 dark:text-red-400' : 'text-orange-500 dark:text-orange-400'}
              />
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <div className="px-5 pb-5 border-t border-gray-100 dark:border-white/6 pt-4">
          <p className="text-[10px] font-bold text-gray-400 dark:text-white/30 uppercase tracking-wider mb-3">Key Insights</p>
          <div className="space-y-2">
            {insights.map((ins, i) => (
              <div key={i} className="flex items-start gap-2.5 bg-gray-50 dark:bg-white/3 rounded-xl p-3">
                <Lightbulb size={12} className="text-amber-500 dark:text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-gray-600 dark:text-white/60 leading-relaxed">{ins}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="px-5 pb-5 border-t border-gray-100 dark:border-white/6 pt-4">
          <p className="text-[10px] font-bold text-gray-400 dark:text-white/30 uppercase tracking-wider mb-3">Recommendations</p>
          <div className="space-y-2">
            {recommendations.map((rec, i) => (
              <div key={i} className="flex items-center gap-2.5 bg-orange-50 dark:bg-orange-500/5 border border-orange-200 dark:border-orange-500/15 rounded-xl p-3">
                <ChevronRight size={12} className="text-orange-500 dark:text-orange-400 shrink-0" />
                <p className="text-xs text-gray-700 dark:text-white/70">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function UserMessage({ text }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex justify-end"
    >
      <div className="max-w-[80%] bg-orange-500/20 border border-orange-500/25 rounded-2xl rounded-tr-md px-4 py-3">
        <p className="text-sm text-gray-900 dark:text-white">{text}</p>
      </div>
    </motion.div>
  );
}

export default function Copilot() {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const bottomRef = useRef(null);

  const { mutate: ask, isPending } = useMutation({
    mutationFn: (q) => copilotService.ask(q).then(r => r.data),
    onSuccess: (data, question) => {
      setHistory(h => [...h, { type: 'user', text: question }, { type: 'insight', data }]);
    },
    onError: (e, question) => {
      setHistory(h => [...h, { type: 'user', text: question }, {
        type: 'insight',
        data: { answer: "I couldn't analyze that right now. Please try again.", dataPoints: [], insights: [], recommendations: [] }
      }]);
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isPending]);

  const submit = (q) => {
    const question = q || input.trim();
    if (!question || isPending) return;
    setInput('');
    ask(question);
  };

  const isEmpty = history.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50 dark:bg-[#0a0a0a]">
      {/* Header */}
      <div className="px-5 py-4 bg-white dark:bg-transparent border-b border-gray-100 dark:border-white/6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-orange-500/20 flex items-center justify-center">
          <Bot size={17} className="text-orange-400" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-gray-900 dark:text-white">Restaurant Copilot</h1>
          <p className="text-xs text-gray-400 dark:text-white/30">Powered by your real data · Rule-based intelligence</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-400">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {isEmpty && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full gap-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-orange-500/15 flex items-center justify-center mx-auto mb-4">
                <Bot size={28} className="text-orange-400" />
              </div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white mb-1">How can I help?</h2>
              <p className="text-xs text-gray-400 dark:text-white/30 max-w-xs">Ask me anything about your restaurant — revenue, menu performance, staffing, and more.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full max-w-xl">
              {QUICK_QUESTIONS.map((qq) => {
                const Icon = qq.icon;
                return (
                  <button
                    key={qq.q}
                    onClick={() => submit(qq.q)}
                    className="flex items-center gap-2.5 bg-white dark:bg-white/4 hover:bg-gray-50 dark:hover:bg-white/8 border border-gray-100 dark:border-white/6 hover:border-gray-200 dark:hover:border-white/15 rounded-xl p-3 text-left transition-all group"
                  >
                    <Icon size={14} className="text-orange-500 dark:text-orange-400 shrink-0" />
                    <span className="text-xs text-gray-500 dark:text-white/60 group-hover:text-gray-900 dark:group-hover:text-white/90 transition-colors">{qq.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {history.map((item, i) => (
            item.type === 'user'
              ? <UserMessage key={i} text={item.text} />
              : <InsightCard key={i} insight={item.data} />
          ))}
        </AnimatePresence>

        {isPending && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/8 rounded-2xl px-5 py-4"
          >
            <Loader2 size={15} className="text-orange-400 animate-spin shrink-0" />
            <p className="text-xs text-gray-400 dark:text-white/40">Analyzing your data…</p>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick questions (when history exists) */}
      {!isEmpty && (
        <div className="px-5 py-2 flex gap-2 overflow-x-auto scrollbar-none border-t border-gray-100 dark:border-white/6">
          {QUICK_QUESTIONS.slice(0, 4).map(qq => (
            <button
              key={qq.q}
              onClick={() => submit(qq.q)}
              disabled={isPending}
              className="shrink-0 px-3 py-1.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/8 rounded-full text-[11px] text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white/80 transition-all disabled:opacity-40"
            >
              {qq.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-5 py-4 bg-white dark:bg-transparent border-t border-gray-100 dark:border-white/6">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
              }}
              placeholder="Ask about revenue, menu, staffing, tables…"
              rows={1}
              className="w-full bg-gray-50 dark:bg-white/6 border border-gray-200 dark:border-white/8 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20 focus:outline-none focus:border-orange-500/40 resize-none leading-relaxed"
              style={{ maxHeight: 120 }}
            />
          </div>
          <button
            onClick={() => submit()}
            disabled={!input.trim() || isPending}
            className="w-11 h-11 rounded-xl bg-orange-500 hover:bg-orange-600 flex items-center justify-center text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            {isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          </button>
        </div>
        <p className="text-[10px] text-gray-300 dark:text-white/20 mt-2 text-center">Responses are based on your real restaurant data — no external AI used.</p>
      </div>
    </div>
  );
}
