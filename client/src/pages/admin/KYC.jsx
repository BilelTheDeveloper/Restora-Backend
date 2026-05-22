import { useState, useRef, useEffect, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ShieldCheck, ShieldAlert, ShieldX, Clock, CheckCircle2,
  User, Hash, Building2, RefreshCw, ArrowRight,
  Camera, CreditCard, BookOpen, Car,
  ChevronLeft, ChevronRight, RotateCcw, Upload,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';

// ─── Helpers ───────────────────────────────────────────────
const resizeToBase64 = (file, maxW = 1000, quality = 0.82) =>
  new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio = Math.min(maxW / img.width, 1);
      const canvas = document.createElement('canvas');
      canvas.width  = img.width  * ratio;
      canvas.height = img.height * ratio;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = url;
  });

// ─── Constants ─────────────────────────────────────────────
const DOC_TYPES = [
  { id: 'national_id',     icon: CreditCard, label: 'National ID (CIN)',  sublabel: 'Front & back photo required', sides: 2 },
  { id: 'passport',        icon: BookOpen,   label: 'Passport',           sublabel: 'Photo page required',         sides: 1 },
  { id: 'drivers_license', icon: Car,        label: "Driver's License",   sublabel: 'Permis — front & back',       sides: 2 },
];

const SELFIE_POSITIONS = [
  { label: 'Look straight at the camera', hint: 'Keep your face centred in the oval' },
  { label: 'Slowly turn your head left',  hint: 'Show your left profile clearly' },
  { label: 'Now turn your head right',    hint: 'Show your right profile clearly' },
];

const STEPS = ['Document Type', 'Upload ID', 'Live Selfie', 'Personal Info'];

// ─── Step progress bar ─────────────────────────────────────
function StepBar({ current }) {
  return (
    <div className="flex items-center justify-between mb-6">
      {STEPS.map((label, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={[
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                done   ? 'bg-orange-500 text-white'
                       : active ? 'bg-orange-500 text-white ring-4 ring-orange-500/20'
                                : 'bg-gray-100 dark:bg-white/8 text-gray-400',
              ].join(' ')}>
                {done ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              <span className={`text-[9px] mt-1 whitespace-nowrap font-medium ${active || done ? 'text-orange-500' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-5 rounded transition-colors ${done ? 'bg-orange-500' : 'bg-gray-100 dark:bg-white/8'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Document upload slot ──────────────────────────────────
function UploadSlot({ label, required = true, value, onChange }) {
  const ref = useRef();
  const handle = async (file) => {
    if (!file) return;
    onChange(await resizeToBase64(file));
  };
  return (
    <div>
      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </p>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className={[
          'w-full border-2 border-dashed rounded-xl overflow-hidden transition-all duration-150',
          value
            ? 'border-orange-300 dark:border-orange-500/40'
            : 'border-gray-200 dark:border-white/10 hover:border-orange-300 dark:hover:border-orange-500/30',
        ].join(' ')}
      >
        <input ref={ref} type="file" accept="image/*,.pdf" className="hidden" onChange={e => handle(e.target.files?.[0])} />
        {value ? (
          <div className="relative">
            <img src={value} alt={label} className="w-full h-36 object-cover" />
            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow">
              <CheckCircle2 size={13} className="text-white" />
            </div>
            <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
              Click to change
            </span>
          </div>
        ) : (
          <div className="p-6 flex flex-col items-center gap-2 bg-gray-50 dark:bg-white/3">
            <Upload size={20} className="text-gray-400" />
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Click to upload</p>
            <p className="text-[10px] text-gray-400">JPG, PNG · max 5 MB</p>
          </div>
        )}
      </button>
    </div>
  );
}

// ─── Live selfie capture ───────────────────────────────────
function SelfieStep({ value, onChange }) {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [active,   setActive]   = useState(false);
  const [idx,      setIdx]      = useState(0);
  const [captured, setCaptured] = useState(value || [null, null, null]);
  const [err,      setErr]      = useState('');

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setActive(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const startCamera = async () => {
    try {
      setErr('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      const firstEmpty = captured.findIndex(s => !s);
      setIdx(firstEmpty === -1 ? 0 : firstEmpty);
      setActive(true);
    } catch {
      setErr('Camera access denied. Allow camera permission in your browser and try again.');
    }
  };

  const capture = () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const b64  = canvas.toDataURL('image/jpeg', 0.75);
    const next = [...captured];
    next[idx] = b64;
    setCaptured(next);
    if (next.every(Boolean)) {
      stopCamera();
      onChange(next);
    } else {
      setIdx(next.findIndex(s => !s));
    }
  };

  const retake = (i) => {
    const next = [...captured];
    next[i] = null;
    setCaptured(next);
    onChange(next.every(Boolean) ? next : next.map(() => null));
    setIdx(i);
    if (!active) startCamera();
  };

  const allDone = captured.every(Boolean);
  const pos     = SELFIE_POSITIONS[idx] ?? SELFIE_POSITIONS[0];

  return (
    <div className="space-y-4">
      {err && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-xs text-red-600 dark:text-red-400">
          {err}
        </div>
      )}

      {allDone ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
          <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">All 3 photos taken!</p>
            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/60">Click a thumbnail to retake if needed.</p>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
            Position {idx + 1} of 3 — {pos.label}
          </p>
          <p className="text-xs text-blue-500/70 dark:text-blue-400/60 mt-0.5">{pos.hint}</p>
        </div>
      )}

      {/* Camera viewport */}
      {!allDone && (
        <div className="relative bg-black rounded-2xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${active ? '' : 'hidden'}`}
          />
          <canvas ref={canvasRef} className="hidden" />

          {!active && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
                <Camera size={28} className="text-gray-400" />
              </div>
              <button
                type="button"
                onClick={startCamera}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Enable Camera
              </button>
            </div>
          )}

          {/* Oval guide */}
          {active && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-44 h-56 border-[3px] border-white/70 rounded-full shadow-[0_0_0_9999px_rgba(0,0,0,0.38)]" />
            </div>
          )}
        </div>
      )}

      {/* Thumbnails */}
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={[
              'relative rounded-xl overflow-hidden border-2 transition-all',
              'aspect-video',
              captured[i]
                ? 'border-emerald-400'
                : i === idx && active
                  ? 'border-orange-500 ring-2 ring-orange-500/20'
                  : 'border-dashed border-gray-200 dark:border-white/10',
            ].join(' ')}
          >
            {captured[i] ? (
              <>
                <img src={captured[i]} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => retake(i)}
                  title="Retake"
                  className="absolute bottom-1 right-1 w-5 h-5 bg-black/70 hover:bg-orange-500 rounded-full flex items-center justify-center transition-colors"
                >
                  <RotateCcw size={9} className="text-white" />
                </button>
                <span className="absolute top-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                  {['Front', 'Left', 'Right'][i]}
                </span>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-white/3">
                <span className="text-lg font-bold text-gray-200 dark:text-white/10">{i + 1}</span>
                <span className="text-[9px] text-gray-400">{['Front', 'Left', 'Right'][i]}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {active && !allDone && (
        <button
          type="button"
          onClick={capture}
          className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm shadow-orange-500/20"
        >
          <Camera size={16} />
          Take Photo — {['Front', 'Left', 'Right'][idx]} ({idx + 1}/3)
        </button>
      )}
    </div>
  );
}

// ─── Non-form status views ─────────────────────────────────
const STATUS_UI = {
  under_review: {
    Icon: Clock, color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20',
    label: 'Under Review',
    desc: "Your application has been submitted. We'll review it within 2–3 business days.",
  },
  approved: {
    Icon: ShieldCheck, color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20',
    label: 'Verified', desc: 'Your account is verified. You have full dashboard access.',
  },
};

// ─── Main KYC page ─────────────────────────────────────────
export default function KYC() {
  const { user, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const verStatus = user?.verificationStatus ?? 'pending';

  const [step,     setStep]     = useState(0);
  const [docType,  setDocType]  = useState(null);
  const [docFront, setDocFront] = useState(null);
  const [docBack,  setDocBack]  = useState(null);
  const [selfies,  setSelfies]  = useState([null, null, null]);
  const [form,     setForm]     = useState({
    fullName:    user?.name ?? '',
    nationalId:  '',
    taxNumber:   '',
    businessReg: '',
  });

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const needsSides = docType && DOC_TYPES.find(d => d.id === docType)?.sides === 2;

  const canNext = [
    !!docType,
    !!(docFront && (!needsSides || docBack)),
    selfies.every(Boolean),
  ];

  const { mutate: submitKYC, isPending: submitting } = useMutation({
    mutationFn: authService.submitKYC,
    onSuccess: () => {
      updateUser({ ...user, verificationStatus: 'under_review' });
      toast.success('Application submitted! Setting up your restaurant next…');
      setTimeout(() => navigate('/admin/setup'), 1400);
    },
    onError: () => toast.error('Submission failed. Please try again.'),
  });

  const { mutate: refreshStatus, isPending: refreshing } = useMutation({
    mutationFn: authService.getKYCStatus,
    onSuccess: ({ data }) => {
      updateUser({ ...user, verificationStatus: data.verificationStatus });
      if (data.verificationStatus === 'approved') {
        toast.success('🎉 Verified! Redirecting…');
        setTimeout(() => window.location.replace('/admin'), 1500);
      } else {
        toast('Status refreshed');
      }
    },
    onError: () => toast.error('Could not refresh status'),
  });

  const handleSubmit = () => {
    if (!form.fullName.trim() || !form.nationalId.trim() || !form.taxNumber.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    submitKYC({
      documentType:  docType,
      documentFront: docFront,
      documentBack:  docBack,
      selfies,
      ...form,
    });
  };

  const showForm = verStatus === 'pending' || verStatus === 'rejected';

  // ── Non-form state ──
  if (!showForm) {
    const ui = STATUS_UI[verStatus] ?? STATUS_UI.under_review;
    return (
      <div className="p-5 sm:p-6 max-w-2xl space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">KYC Verification</h1>
          <p className="text-xs text-gray-400 mt-0.5">Identity & business verification</p>
        </div>

        <div className={`flex items-start gap-4 p-4 rounded-2xl border ${ui.bg} ${ui.border}`}>
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-black/20 flex items-center justify-center shrink-0 shadow-sm">
            <ui.Icon size={20} className={ui.color} />
          </div>
          <div className="flex-1">
            <p className={`text-sm font-bold ${ui.color}`}>{ui.label}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{ui.desc}</p>
          </div>
          {verStatus === 'under_review' && (
            <button
              onClick={() => refreshStatus()}
              disabled={refreshing}
              className="shrink-0 flex items-center gap-1.5 text-[10px] font-semibold px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-500/20 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          )}
        </div>

        {verStatus === 'under_review' && (
          <div className="bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/6 rounded-2xl p-5 shadow-sm space-y-3">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">What happens next?</p>
            {[
              { label: 'Application submitted',         done: true  },
              { label: 'Identity check',                done: false },
              { label: 'Business license verification', done: false },
              { label: 'Final approval',                done: false },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${s.done ? 'bg-orange-500' : 'bg-gray-100 dark:bg-white/8 border-2 border-gray-200 dark:border-white/10'}`}>
                  {s.done && <CheckCircle2 size={11} className="text-white" />}
                </div>
                <p className={`text-xs font-medium ${s.done ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Multi-step form ──
  return (
    <div className="p-5 sm:p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">KYC Verification</h1>
        <p className="text-xs text-gray-400 mt-0.5">Complete all steps to unlock your dashboard</p>
      </div>

      {verStatus === 'rejected' && user?.rejectionReason && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
          <ShieldX size={16} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-red-600 dark:text-red-400">Previous application rejected</p>
            <p className="text-xs text-red-500/80 mt-0.5">Reason: {user.rejectionReason}</p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/6 rounded-2xl p-5 shadow-sm">
        <StepBar current={step} />

        {/* ── Step 0: Document Type ── */}
        {step === 0 && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Choose your ID document type</p>
            <div className="space-y-3">
              {DOC_TYPES.map(doc => {
                const Icon = doc.icon;
                const sel  = docType === doc.id;
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => setDocType(doc.id)}
                    className={[
                      'w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all',
                      sel
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/8'
                        : 'border-gray-200 dark:border-white/10 hover:border-orange-300 dark:hover:border-orange-500/30 bg-gray-50 dark:bg-white/3',
                    ].join(' ')}
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${sel ? 'bg-orange-500 text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400'}`}>
                      <Icon size={21} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${sel ? 'text-orange-600 dark:text-orange-400' : 'text-gray-800 dark:text-white'}`}>
                        {doc.label}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{doc.sublabel}</p>
                    </div>
                    {sel && <CheckCircle2 size={18} className="text-orange-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Step 1: Document Upload ── */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Upload {DOC_TYPES.find(d => d.id === docType)?.label} photo{needsSides ? 's' : ''}
            </p>
            <div className={`grid ${needsSides ? 'sm:grid-cols-2' : 'grid-cols-1'} gap-4`}>
              <UploadSlot
                label={needsSides ? 'Front Side' : 'Photo Page'}
                value={docFront}
                onChange={setDocFront}
              />
              {needsSides && (
                <UploadSlot label="Back Side" value={docBack} onChange={setDocBack} />
              )}
            </div>
            <p className="text-[10px] text-gray-400 flex items-center gap-1.5">
              <ShieldCheck size={11} className="text-gray-400" />
              Documents are encrypted and only accessible to our verification team.
            </p>
          </div>
        )}

        {/* ── Step 2: Live Selfie ── */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Take 3 live selfie photos</p>
            <SelfieStep value={selfies} onChange={setSelfies} />
          </div>
        )}

        {/* ── Step 3: Personal Info ── */}
        {step === 3 && (
          <div className="space-y-5">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Personal & business information</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { k: 'fullName',    label: 'Full Legal Name',      Icon: User,      ph: 'As on your ID',         req: true  },
                { k: 'nationalId',  label: 'Document Number',      Icon: Hash,      ph: 'e.g. 12345678',         req: true  },
                { k: 'taxNumber',   label: 'Tax Number (MF)',      Icon: Hash,      ph: 'e.g. 1234567A/P/M/000', req: true  },
                { k: 'businessReg', label: 'Business Reg. (RNE)',  Icon: Building2, ph: 'e.g. J1234567',         req: false },
              ].map(({ k, label, Icon, ph, req }) => (
                <div key={k}>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {label}{req && <span className="text-red-400 ml-0.5">*</span>}
                  </label>
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 focus-within:border-orange-400 transition-colors">
                    <Icon size={13} className="text-gray-400 shrink-0" />
                    <input
                      type="text"
                      value={form[k]}
                      onChange={set(k)}
                      placeholder={ph}
                      className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Navigation ── */}
        <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-100 dark:border-white/6">
          <button
            type="button"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} /> Back
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={() => { if (canNext[step]) setStep(s => s + 1); else toast.error('Please complete this step first'); }}
              disabled={!canNext[step]}
              className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-orange-500/20"
            >
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-orange-500/20"
            >
              {submitting ? 'Submitting…' : <><span>Submit for Review</span><ArrowRight size={15} /></>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
