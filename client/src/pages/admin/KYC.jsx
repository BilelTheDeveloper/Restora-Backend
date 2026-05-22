import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ShieldCheck, ShieldAlert, ShieldX, Clock, CheckCircle2,
  Upload, FileText, User, Hash, Building2, RefreshCw, ArrowRight,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';

// ─── Status config ─────────────────────────────────────────
const STATUS_UI = {
  pending: {
    icon:  ShieldAlert,
    color: 'text-amber-500',
    bg:    'bg-amber-50 dark:bg-amber-500/10',
    border:'border-amber-200 dark:border-amber-500/20',
    label: 'Verification Required',
    desc:  'Submit your documents to unlock the full dashboard.',
  },
  under_review: {
    icon:  Clock,
    color: 'text-blue-500',
    bg:    'bg-blue-50 dark:bg-blue-500/10',
    border:'border-blue-200 dark:border-blue-500/20',
    label: 'Under Review',
    desc:  'Your application has been submitted. We\'ll review it within 2–3 business days.',
  },
  approved: {
    icon:  ShieldCheck,
    color: 'text-emerald-500',
    bg:    'bg-emerald-50 dark:bg-emerald-500/10',
    border:'border-emerald-200 dark:border-emerald-500/20',
    label: 'Verified',
    desc:  'Your account is verified. You have full access to the dashboard.',
  },
  rejected: {
    icon:  ShieldX,
    color: 'text-red-500',
    bg:    'bg-red-50 dark:bg-red-500/10',
    border:'border-red-200 dark:border-red-500/20',
    label: 'Application Rejected',
    desc:  'Your application was rejected. Please review the reason below and resubmit.',
  },
};

// ─── File upload slot ──────────────────────────────────────
function UploadSlot({ label, hint, required = true }) {
  const [file, setFile] = useState(null);
  const ref = useRef();

  return (
    <div>
      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </p>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className={[
          'w-full border-2 border-dashed rounded-xl p-4 text-center transition-all duration-150',
          file
            ? 'border-orange-300 dark:border-orange-500/40 bg-orange-50 dark:bg-orange-500/5'
            : 'border-gray-200 dark:border-white/10 hover:border-orange-300 dark:hover:border-orange-500/30 bg-gray-50 dark:bg-white/3',
        ].join(' ')}
      >
        <input
          ref={ref}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          className="hidden"
          onChange={e => setFile(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <div className="flex items-center justify-center gap-2">
            <FileText size={16} className="text-orange-500 shrink-0" />
            <span className="text-xs font-medium text-orange-600 dark:text-orange-400 truncate max-w-[180px]">
              {file.name}
            </span>
            <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
          </div>
        ) : (
          <div>
            <Upload size={18} className="mx-auto text-gray-400 mb-1.5" />
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Click to upload</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{hint}</p>
          </div>
        )}
      </button>
    </div>
  );
}

// ─── Progress steps ────────────────────────────────────────
function ProgressSteps({ status }) {
  const steps = [
    { key: 'fill',   label: 'Fill Form',    done: status !== 'pending' },
    { key: 'review', label: 'Under Review', done: status === 'approved' || status === 'rejected' },
    { key: 'done',   label: 'Decision',     done: status === 'approved' },
  ];

  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => (
        <div key={step.key} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={[
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
              step.done
                ? 'bg-orange-500 text-white'
                : status !== 'pending' && i === 1
                  ? 'bg-blue-500 text-white animate-pulse'
                  : 'bg-gray-100 dark:bg-white/8 text-gray-400',
            ].join(' ')}>
              {step.done ? <CheckCircle2 size={13} /> : i + 1}
            </div>
            <span className="text-[9px] text-gray-400 mt-1 whitespace-nowrap">{step.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={[
              'h-0.5 w-12 sm:w-20 mx-1 mb-4 rounded transition-colors',
              step.done ? 'bg-orange-500' : 'bg-gray-100 dark:bg-white/8',
            ].join(' ')} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── KYC Page ──────────────────────────────────────────────
export default function KYC() {
  const { user, updateUser } = useAuthStore();
  const verificationStatus   = user?.verificationStatus ?? 'pending';
  const statusUI             = STATUS_UI[verificationStatus] ?? STATUS_UI.pending;
  const StatusIcon           = statusUI.icon;

  const [form, setForm] = useState({
    fullName:    user?.name ?? '',
    nationalId:  '',
    taxNumber:   '',
    businessReg: '',
  });

  const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  // Submit KYC mutation
  const { mutate: submitKYC, isPending: submitting } = useMutation({
    mutationFn: authService.submitKYC,
    onSuccess: () => {
      updateUser({ ...user, verificationStatus: 'under_review' });
      toast.success('Application submitted! We\'ll review it within 2–3 business days.');
    },
    onError: () => toast.error('Submission failed. Please try again.'),
  });

  // Refresh status mutation
  const { mutate: refreshStatus, isPending: refreshing } = useMutation({
    mutationFn: authService.getKYCStatus,
    onSuccess: ({ data }) => {
      updateUser({ ...user, verificationStatus: data.verificationStatus });
      if (data.verificationStatus === 'approved') {
        toast.success('🎉 Your account is verified! Redirecting...');
        setTimeout(() => window.location.replace('/admin'), 1500);
      } else {
        toast.success('Status refreshed');
      }
    },
    onError: () => toast.error('Could not refresh status'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nationalId.trim() || !form.taxNumber.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    submitKYC(form);
  };

  const canResubmit = verificationStatus === 'rejected';
  const showForm    = verificationStatus === 'pending' || canResubmit;

  return (
    <div className="p-5 sm:p-6 max-w-2xl space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">KYC Verification</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Identity & business verification required to activate your dashboard
        </p>
      </div>

      {/* Status card */}
      <div className={`flex items-start gap-4 p-4 rounded-2xl border ${statusUI.bg} ${statusUI.border}`}>
        <div className="w-10 h-10 rounded-xl bg-white dark:bg-black/20 flex items-center justify-center shrink-0 shadow-sm">
          <StatusIcon size={20} className={statusUI.color} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${statusUI.color}`}>{statusUI.label}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{statusUI.desc}</p>
          {user?.rejectionReason && verificationStatus === 'rejected' && (
            <p className="text-xs text-red-500 mt-2 font-medium">
              Reason: {user.rejectionReason}
            </p>
          )}
        </div>
        {(verificationStatus === 'under_review') && (
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

      {/* Progress tracker */}
      <div className="bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/6 rounded-2xl p-5 shadow-sm flex justify-center">
        <ProgressSteps status={verificationStatus} />
      </div>

      {/* Form — shown when pending or rejected */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/6 rounded-2xl shadow-sm overflow-hidden">

          <div className="px-5 py-4 border-b border-gray-100 dark:border-white/6">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {canResubmit ? 'Resubmit Application' : 'Submit Your Application'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">All fields marked * are required</p>
          </div>

          <div className="p-5 space-y-5">

            {/* Identity info */}
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
                Personal Information
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Full Legal Name <span className="text-red-400">*</span>
                  </label>
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 focus-within:border-orange-400 transition-colors">
                    <User size={13} className="text-gray-400 shrink-0" />
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={set('fullName')}
                      placeholder="As on your ID"
                      required
                      className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    National ID / CIN <span className="text-red-400">*</span>
                  </label>
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 focus-within:border-orange-400 transition-colors">
                    <Hash size={13} className="text-gray-400 shrink-0" />
                    <input
                      type="text"
                      value={form.nationalId}
                      onChange={set('nationalId')}
                      placeholder="e.g. 12345678"
                      required
                      className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Business info */}
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
                Business Information
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Tax Number (MF) <span className="text-red-400">*</span>
                  </label>
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 focus-within:border-orange-400 transition-colors">
                    <Hash size={13} className="text-gray-400 shrink-0" />
                    <input
                      type="text"
                      value={form.taxNumber}
                      onChange={set('taxNumber')}
                      placeholder="e.g. 1234567A/P/M/000"
                      required
                      className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Business Reg. (RNE)
                  </label>
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 focus-within:border-orange-400 transition-colors">
                    <Building2 size={13} className="text-gray-400 shrink-0" />
                    <input
                      type="text"
                      value={form.businessReg}
                      onChange={set('businessReg')}
                      placeholder="e.g. J1234567"
                      className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
                Supporting Documents
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <UploadSlot
                  label="National ID / Passport"
                  hint="JPG, PNG or PDF · Max 5 MB"
                />
                <UploadSlot
                  label="Restaurant License"
                  hint="JPG, PNG or PDF · Max 5 MB"
                />
                <UploadSlot
                  label="Tax Registration (MF)"
                  hint="JPG, PNG or PDF · Max 5 MB"
                />
                <UploadSlot
                  label="Business Registration (RNE)"
                  hint="JPG, PNG or PDF · Max 5 MB"
                  required={false}
                />
              </div>
            </div>

            {/* Note */}
            <p className="text-[10px] text-gray-400 flex items-start gap-1.5">
              <ShieldCheck size={12} className="shrink-0 mt-0.5 text-gray-400" />
              Your documents are encrypted and only accessible to our verification team.
              Expected review time: 2–3 business days.
            </p>
          </div>

          <div className="px-5 py-4 border-t border-gray-100 dark:border-white/6 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors shadow-sm shadow-orange-500/20"
            >
              {submitting ? 'Submitting…' : 'Submit for Review'}
              {!submitting && <ArrowRight size={15} />}
            </button>
          </div>
        </form>
      )}

      {/* Under review state — timeline */}
      {verificationStatus === 'under_review' && (
        <div className="bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/6 rounded-2xl p-5 shadow-sm space-y-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">What happens next?</p>
          <div className="space-y-3">
            {[
              { label: 'Application submitted',         done: true,  desc: 'We received your documents' },
              { label: 'Identity check',                done: false, desc: 'Our team verifies your ID' },
              { label: 'Business license verification', done: false, desc: 'We validate your restaurant license' },
              { label: 'Final approval',                done: false, desc: 'You get full dashboard access' },
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={[
                  'w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                  step.done
                    ? 'bg-orange-500'
                    : 'bg-gray-100 dark:bg-white/8 border-2 border-gray-200 dark:border-white/10',
                ].join(' ')}>
                  {step.done && <CheckCircle2 size={12} className="text-white" />}
                </div>
                <div>
                  <p className={`text-xs font-semibold ${step.done ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                    {step.label}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
