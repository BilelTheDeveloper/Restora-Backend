import { useState, useRef, useEffect, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ShieldCheck, ShieldX, Clock, CheckCircle2,
  Camera, CreditCard, BookOpen, Car,
  ChevronLeft, ChevronRight, RotateCcw, Upload, ArrowRight, RefreshCw,
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

const STEPS = ['Document Type', 'Upload ID', 'Live Selfie'];

// ─── Step progress bar ─────────────────────────────────────
function StepBar({ current }) {
  return (
    <div className="flex items-center justify-center mb-8 px-2">
      {STEPS.map((label, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className={[
                'w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold transition-all duration-300',
                done
                  ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/40'
                  : active
                    ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-xl shadow-orange-500/50 scale-110'
                    : 'bg-gray-100 dark:bg-white/8 text-gray-400',
              ].join(' ')}>
                {done ? <CheckCircle2 size={16} /> : <span>{i + 1}</span>}
              </div>
              <span className={`text-[10px] whitespace-nowrap font-semibold tracking-wide transition-colors ${active || done ? 'text-orange-500' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-[2px] mx-3 mb-6 rounded-full transition-all duration-500 ${done ? 'bg-gradient-to-r from-orange-500 to-amber-400' : 'bg-gray-100 dark:bg-white/8'}`} />
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
      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </p>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className={[
          'w-full border-2 border-dashed rounded-2xl overflow-hidden transition-all duration-200',
          value
            ? 'border-orange-400 dark:border-orange-500/50 shadow-md shadow-orange-500/10'
            : 'border-gray-200 dark:border-white/10 hover:border-orange-300 dark:hover:border-orange-500/30 hover:shadow-md hover:shadow-orange-500/5',
        ].join(' ')}
      >
        <input ref={ref} type="file" accept="image/*,.pdf" className="hidden" onChange={e => handle(e.target.files?.[0])} />
        {value ? (
          <div className="relative">
            <img src={value} alt={label} className="w-full h-36 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
              <CheckCircle2 size={14} className="text-white" />
            </div>
            <span className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2.5 py-1 rounded-full font-medium">
              Click to change
            </span>
          </div>
        ) : (
          <div className="p-8 flex flex-col items-center gap-3 bg-gray-50/80 dark:bg-white/3">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center">
              <Upload size={18} className="text-orange-400" />
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Click to upload</p>
              <p className="text-[10px] text-gray-400 mt-0.5">JPG, PNG · max 5 MB</p>
            </div>
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
        <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-xs text-red-600 dark:text-red-400 flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center shrink-0 font-bold">!</div>
          {err}
        </div>
      )}

      {allDone ? (
        <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/5 border border-emerald-200 dark:border-emerald-500/20">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30">
            <CheckCircle2 size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">All 3 photos captured!</p>
            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/60">Click a thumbnail to retake if needed.</p>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/5 border border-blue-200 dark:border-blue-500/20">
          <p className="text-sm font-bold text-blue-700 dark:text-blue-400">
            Position {idx + 1} of 3 — {pos.label}
          </p>
          <p className="text-xs text-blue-500/70 dark:text-blue-400/60 mt-0.5">{pos.hint}</p>
        </div>
      )}

      {/* Camera viewport */}
      {!allDone && (
        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden shadow-xl" style={{ aspectRatio: '4/3' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${active ? '' : 'hidden'}`}
          />
          <canvas ref={canvasRef} className="hidden" />

          {!active && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
              <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <Camera size={32} className="text-white/70" />
              </div>
              <button
                type="button"
                onClick={startCamera}
                className="px-7 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-2xl text-sm font-bold transition-all shadow-xl shadow-orange-500/40 hover:shadow-orange-500/60 hover:-translate-y-0.5"
              >
                Enable Camera
              </button>
            </div>
          )}

          {/* Oval guide */}
          {active && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-44 h-56 border-[3px] border-white/80 rounded-full shadow-[0_0_0_9999px_rgba(0,0,0,0.42)]" />
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
              'relative rounded-2xl overflow-hidden border-2 transition-all duration-200',
              'aspect-video',
              captured[i]
                ? 'border-emerald-400 shadow-md shadow-emerald-500/20'
                : i === idx && active
                  ? 'border-orange-500 ring-2 ring-orange-500/20 shadow-lg shadow-orange-500/20'
                  : 'border-dashed border-gray-200 dark:border-white/10',
            ].join(' ')}
          >
            {captured[i] ? (
              <>
                <img src={captured[i]} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <button
                  type="button"
                  onClick={() => retake(i)}
                  title="Retake"
                  className="absolute bottom-1 right-1 w-6 h-6 bg-black/70 hover:bg-orange-500 rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
                >
                  <RotateCcw size={10} className="text-white" />
                </button>
                <span className="absolute top-1 left-1 bg-black/60 backdrop-blur-sm text-white text-[9px] px-1.5 py-0.5 rounded-full font-medium">
                  {['Front', 'Left', 'Right'][i]}
                </span>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-white/3">
                <span className="text-xl font-bold text-gray-300 dark:text-white/15">{i + 1}</span>
                <span className="text-[9px] text-gray-400 dark:text-gray-500 font-medium">{['Front', 'Left', 'Right'][i]}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {active && !allDone && (
        <button
          type="button"
          onClick={capture}
          className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-0.5"
        >
          <Camera size={16} />
          Take Photo — {['Front', 'Left', 'Right'][idx]} ({idx + 1}/3)
        </button>
      )}
    </div>
  );
}

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
    submitKYC({
      documentType:  docType,
      documentFront: docFront,
      documentBack:  docBack,
      selfies,
    });
  };

  const showForm = verStatus === 'pending' || verStatus === 'rejected';

  // ── Non-form state ──
  if (!showForm) {
    const isApproved = verStatus === 'approved';
    return (
      <div className="flex min-h-[calc(100vh-80px)] items-start justify-center p-4 sm:p-8 pt-10">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-xl mb-4 ${isApproved ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-500/30' : 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-blue-500/30'}`}>
              {isApproved ? <ShieldCheck size={28} className="text-white" /> : <Clock size={28} className="text-white" />}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">KYC Verification</h1>
            <p className="text-sm text-gray-400 mt-1">Identity & business verification</p>
          </div>

          {/* Status card */}
          <div className="relative">
            <div className={`absolute inset-0 rounded-3xl blur-2xl opacity-20 ${isApproved ? 'bg-emerald-400' : 'bg-blue-400'}`} />
            <div className="relative bg-white/90 dark:bg-[#0f0f0f]/90 backdrop-blur-2xl border border-white/60 dark:border-white/8 rounded-3xl shadow-2xl p-6 space-y-5">
              <div className={`flex items-start gap-4 p-4 rounded-2xl ${isApproved ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20' : 'bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md ${isApproved ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-blue-500 shadow-blue-500/30'}`}>
                  {isApproved ? <ShieldCheck size={18} className="text-white" /> : <Clock size={18} className="text-white" />}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-bold ${isApproved ? 'text-emerald-700 dark:text-emerald-400' : 'text-blue-700 dark:text-blue-400'}`}>
                    {isApproved ? 'Verified' : 'Under Review'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {isApproved
                      ? 'Your account is verified. You have full dashboard access.'
                      : "Your application has been submitted. We'll review it within 2–3 business days."}
                  </p>
                </div>
                {!isApproved && (
                  <button
                    onClick={() => refreshStatus()}
                    disabled={refreshing}
                    className="shrink-0 flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-500/20 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} />
                    Refresh
                  </button>
                )}
              </div>

              {!isApproved && (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">What happens next?</p>
                  {[
                    { label: 'Application submitted',         done: true  },
                    { label: 'Identity check',                done: false },
                    { label: 'Business license verification', done: false },
                    { label: 'Final approval',                done: false },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-xl flex items-center justify-center shrink-0 transition-all ${s.done ? 'bg-gradient-to-br from-orange-500 to-amber-500 shadow-md shadow-orange-500/30' : 'bg-gray-100 dark:bg-white/8 border-2 border-gray-200 dark:border-white/10'}`}>
                        {s.done && <CheckCircle2 size={12} className="text-white" />}
                      </div>
                      <p className={`text-xs font-medium ${s.done ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{s.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Multi-step form ──
  return (
    <div className="flex min-h-[calc(100vh-80px)] items-start justify-center p-4 sm:p-6 pt-10">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-xl shadow-orange-500/30 mb-4">
            <ShieldCheck size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">KYC Verification</h1>
          <p className="text-sm text-gray-400 mt-1">Complete all steps to unlock your dashboard</p>
        </div>

        {verStatus === 'rejected' && user?.rejectionReason && (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 mb-5">
            <ShieldX size={16} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-red-600 dark:text-red-400">Previous application rejected</p>
              <p className="text-xs text-red-500/80 mt-0.5">Reason: {user.rejectionReason}</p>
            </div>
          </div>
        )}

        {/* Card */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/15 via-transparent to-amber-500/10 rounded-3xl blur-2xl" />
          <div className="relative bg-white/90 dark:bg-[#0f0f0f]/90 backdrop-blur-2xl border border-white/60 dark:border-white/8 rounded-3xl shadow-2xl shadow-black/10 p-6 sm:p-8">
            <StepBar current={step} />

            {/* ── Step 0: Document Type ── */}
            {step === 0 && (
              <div className="space-y-4">
                <div className="text-center mb-5">
                  <p className="text-base font-bold text-gray-900 dark:text-white">Choose your ID document type</p>
                  <p className="text-xs text-gray-400 mt-1">Select the document you'll use for verification</p>
                </div>
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
                          'w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200',
                          sel
                            ? 'border-orange-500 bg-gradient-to-r from-orange-50 to-amber-50/50 dark:from-orange-500/10 dark:to-amber-500/5 shadow-lg shadow-orange-500/15'
                            : 'border-gray-100 dark:border-white/8 hover:border-orange-200 dark:hover:border-orange-500/20 bg-gray-50/60 dark:bg-white/2 hover:bg-orange-50/40 dark:hover:bg-orange-500/5',
                        ].join(' ')}
                      >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all ${sel ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30' : 'bg-gray-100 dark:bg-white/8 text-gray-500 dark:text-gray-400'}`}>
                          <Icon size={22} />
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-bold ${sel ? 'text-orange-600 dark:text-orange-400' : 'text-gray-800 dark:text-white'}`}>
                            {doc.label}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{doc.sublabel}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${sel ? 'border-orange-500 bg-orange-500' : 'border-gray-200 dark:border-white/20'}`}>
                          {sel && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Step 1: Document Upload ── */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="text-center mb-5">
                  <p className="text-base font-bold text-gray-900 dark:text-white">
                    Upload {DOC_TYPES.find(d => d.id === docType)?.label} photo{needsSides ? 's' : ''}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Clear, well-lit photos for faster verification</p>
                </div>
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
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-gray-50 dark:bg-white/3 border border-gray-100 dark:border-white/6">
                  <ShieldCheck size={13} className="text-orange-400 shrink-0" />
                  <p className="text-[11px] text-gray-400">Documents are encrypted and only accessible to our verification team.</p>
                </div>
              </div>
            )}

            {/* ── Step 2: Live Selfie ── */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-base font-bold text-gray-900 dark:text-white">Take 3 live selfie photos</p>
                  <p className="text-xs text-gray-400 mt-1">We need front and both profile views</p>
                </div>
                <SelfieStep value={selfies} onChange={setSelfies} />
              </div>
            )}

            {/* ── Navigation ── */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100 dark:border-white/6">
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                disabled={step === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-0 disabled:pointer-events-none transition-all"
              >
                <ChevronLeft size={16} /> Back
              </button>

              {step < 2 ? (
                <button
                  type="button"
                  onClick={() => { if (canNext[step]) setStep(s => s + 1); else toast.error('Please complete this step first'); }}
                  disabled={!canNext[step]}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-2xl transition-all shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-0.5"
                >
                  Continue <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || !canNext[2]}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-2xl transition-all shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-0.5"
                >
                  {submitting ? 'Submitting…' : <><span>Submit for Review</span><ArrowRight size={15} /></>}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
