import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ShieldCheck, ShieldX, CheckCircle2, XCircle, Clock,
  ChevronRight, X, User, MapPin, Calendar, Eye,
} from 'lucide-react';
import { adminService } from '../../services/adminService';

const STATUS_TABS = [
  { key: 'under_review', label: 'Pending',  icon: Clock },
  { key: 'approved',     label: 'Approved', icon: CheckCircle2 },
  { key: 'rejected',     label: 'Rejected', icon: XCircle },
];

const DOC_LABELS = { national_id: 'National ID (CIN)', passport: 'Passport', drivers_license: "Driver's License" };
const SELFIE_LABELS = ['Front', 'Left profile', 'Right profile'];

function StatusBadge({ status }) {
  const map = {
    under_review: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
    approved:     'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
    rejected:     'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20',
  };
  const labels = { under_review: 'Pending', approved: 'Approved', rejected: 'Rejected' };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${map[status] ?? ''}`}>
      {labels[status] ?? status}
    </span>
  );
}

function ReviewModal({ user, onClose }) {
  const qc = useQueryClient();
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);

  const { mutate: review, isPending } = useMutation({
    mutationFn: ({ action, rejectionReason }) => adminService.reviewKYC(user._id, { action, rejectionReason }),
    onSuccess: (_, { action }) => {
      toast.success(`KYC ${action}d successfully`);
      qc.invalidateQueries({ queryKey: ['kyc-queue'] });
      qc.invalidateQueries({ queryKey: ['platform-stats'] });
      onClose();
    },
    onError: () => toast.error('Action failed — please try again'),
  });

  const kyc = user.kycData ?? {};
  const restaurant = user.restaurant;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
           onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/8 sticky top-0 bg-white dark:bg-[#1a1a1a] z-10">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">KYC Review</h2>
            <p className="text-xs text-gray-400 mt-0.5">{user.name} · {user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={user.verificationStatus} />
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/8 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">

          {/* Identity info */}
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { label: 'Full Name',    value: kyc.fullName },
              { label: 'Document',     value: DOC_LABELS[kyc.documentType] },
              { label: 'National ID',  value: kyc.nationalId },
              { label: 'Tax Number',   value: kyc.taxNumber },
              { label: 'Business Reg', value: kyc.businessReg },
            ].filter(f => f.value).map(({ label, value }) => (
              <div key={label} className="bg-gray-50 dark:bg-white/4 rounded-xl px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5">{label}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{value}</p>
              </div>
            ))}
          </div>

          {/* Restaurant info */}
          {restaurant && (
            <div className="bg-violet-50 dark:bg-violet-500/8 border border-violet-200 dark:border-violet-500/20 rounded-xl px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-violet-500 mb-1">Restaurant</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{restaurant.name}</p>
              {restaurant.address?.city && (
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                  <MapPin size={10} /> {restaurant.address.street && `${restaurant.address.street}, `}{restaurant.address.city}
                </p>
              )}
            </div>
          )}

          {/* Selfies */}
          {kyc.selfies?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">Live Selfies</p>
              <div className="grid grid-cols-3 gap-3">
                {kyc.selfies.map((src, i) => (
                  <div key={i} className="space-y-1">
                    <div className="aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 dark:bg-white/8 border border-gray-200 dark:border-white/10">
                      <img src={src} alt={SELFIE_LABELS[i]} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-[10px] text-center text-gray-400 font-medium">{SELFIE_LABELS[i] ?? `Selfie ${i + 1}`}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ID documents */}
          {(kyc.documentFront || kyc.documentBack) && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">
                ID Document — {DOC_LABELS[kyc.documentType] ?? 'Document'}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {kyc.documentFront && (
                  <div className="space-y-1">
                    <div className="aspect-[3/2] rounded-xl overflow-hidden bg-gray-100 dark:bg-white/8 border border-gray-200 dark:border-white/10">
                      <img src={kyc.documentFront} alt="Front" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-[10px] text-center text-gray-400 font-medium">Front</p>
                  </div>
                )}
                {kyc.documentBack && (
                  <div className="space-y-1">
                    <div className="aspect-[3/2] rounded-xl overflow-hidden bg-gray-100 dark:bg-white/8 border border-gray-200 dark:border-white/10">
                      <img src={kyc.documentBack} alt="Back" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-[10px] text-center text-gray-400 font-medium">Back</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reject reason box */}
          {showRejectBox && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-red-500">Rejection Reason</p>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Explain why the KYC is being rejected…"
                className="w-full bg-gray-50 dark:bg-white/5 border border-red-200 dark:border-red-500/30 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none resize-none focus:border-red-400 transition-colors"
              />
            </div>
          )}

          {/* Action buttons — only show for pending */}
          {user.verificationStatus === 'under_review' && (
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => review({ action: 'approve' })}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors"
              >
                <ShieldCheck size={16} /> Approve
              </button>

              {showRejectBox ? (
                <button
                  onClick={() => review({ action: 'reject', rejectionReason: rejectReason })}
                  disabled={isPending || !rejectReason.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors"
                >
                  <ShieldX size={16} /> Confirm Reject
                </button>
              ) : (
                <button
                  onClick={() => setShowRejectBox(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-500 text-sm font-bold rounded-xl border border-red-200 dark:border-red-500/20 transition-colors"
                >
                  <ShieldX size={16} /> Reject
                </button>
              )}
            </div>
          )}

          {/* Rejection reason display */}
          {user.verificationStatus === 'rejected' && user.rejectionReason && (
            <div className="p-4 bg-red-50 dark:bg-red-500/8 border border-red-200 dark:border-red-500/20 rounded-xl">
              <p className="text-[10px] font-bold uppercase tracking-wider text-red-500 mb-1">Rejection Reason</p>
              <p className="text-sm text-red-700 dark:text-red-300">{user.rejectionReason}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function KYCQueue() {
  const [activeTab, setActiveTab] = useState('under_review');
  const [selected, setSelected]   = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['kyc-queue', activeTab],
    queryFn:  () => adminService.getKYCQueue(activeTab),
  });
  const users = data?.data ?? [];

  return (
    <div className="p-5 sm:p-6 space-y-5 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">KYC Review Queue</h1>
        <p className="text-xs text-gray-400 mt-0.5">Review and approve restaurant owner identities</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-xl w-fit">
        {STATUS_TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={[
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all',
              activeTab === key
                ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
            ].join(' ')}
          >
            <Icon size={12} /> {label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="py-16 text-center">
          <ShieldCheck size={32} className="mx-auto text-gray-300 dark:text-white/10 mb-3" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {activeTab === 'under_review' ? 'No pending KYC submissions' : `No ${activeTab} submissions`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map(user => (
            <button
              key={user._id}
              onClick={() => setSelected(user)}
              className="w-full flex items-center gap-4 p-4 bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/6 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-left group"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center shrink-0 text-violet-500 font-black text-sm">
                {user.name?.charAt(0)?.toUpperCase() ?? <User size={16} />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                  <StatusBadge status={user.verificationStatus} />
                </div>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
                {user.restaurant?.name && (
                  <p className="text-xs text-violet-500 font-medium mt-0.5 flex items-center gap-1">
                    <MapPin size={10} /> {user.restaurant.name}{user.restaurant.address?.city && ` · ${user.restaurant.address.city}`}
                  </p>
                )}
              </div>

              <div className="text-right shrink-0">
                <p className="text-[10px] text-gray-400 flex items-center gap-1 justify-end mb-1">
                  <Calendar size={10} />
                  {new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
                <div className="flex items-center gap-1 text-xs text-gray-400 group-hover:text-violet-500 transition-colors">
                  <Eye size={12} /> Review
                </div>
              </div>

              <ChevronRight size={16} className="text-gray-300 dark:text-white/15 group-hover:text-violet-500 transition-colors shrink-0" />
            </button>
          ))}
        </div>
      )}

      {selected && <ReviewModal user={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
