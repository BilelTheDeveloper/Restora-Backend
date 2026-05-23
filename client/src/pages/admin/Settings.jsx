import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';
import {
  User, Shield, Bell, Store, Clock, CreditCard, Palette,
  Camera, Mail, Phone, Lock, Eye, EyeOff, Check, X,
  Loader2, Edit3, Save, MapPin, Globe, KeyRound,
  AlertTriangle, ShieldCheck, Smartphone,
} from 'lucide-react';

// ── Shared primitives ──────────────────────────────────────────────────────────

function FormField({ label, children, hint }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-gray-400 dark:text-gray-600">{hint}</p>}
    </div>
  );
}

function StyledInput({ icon: Icon, className = '', ...props }) {
  return (
    <div className={[
      'flex items-center gap-2.5 bg-gray-100 dark:bg-white/4 border border-gray-200 dark:border-white/8 rounded-xl px-3.5 py-2.5 transition-all duration-150',
      'focus-within:border-orange-500/50 focus-within:bg-orange-500/5 focus-within:shadow-[0_0_0_3px_rgba(249,115,22,0.08)]',
      className,
    ].join(' ')}>
      {Icon && <Icon size={14} className="text-gray-400 dark:text-gray-500 shrink-0" />}
      <input
        className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none min-w-0"
        {...props}
      />
    </div>
  );
}

function PasswordInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex items-center gap-2.5 bg-gray-100 dark:bg-white/4 border border-gray-200 dark:border-white/8 rounded-xl px-3.5 py-2.5 transition-all duration-150 focus-within:border-orange-500/50 focus-within:bg-orange-500/5 focus-within:shadow-[0_0_0_3px_rgba(249,115,22,0.08)]">
      <Lock size={14} className="text-gray-400 dark:text-gray-500 shrink-0" />
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder || '••••••••'}
        className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none min-w-0"
      />
      <button type="button" onClick={() => setShow(v => !v)} className="text-gray-600 hover:text-gray-300 transition-colors shrink-0">
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
}

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${checked ? 'bg-orange-500' : 'bg-gray-200 dark:bg-white/10'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

function Btn({ onClick, loading, children, disabled, variant = 'primary', size = 'md' }) {
  const base  = 'inline-flex items-center justify-center gap-1.5 font-semibold rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed';
  const sizes = { sm: 'text-xs px-4 py-2', md: 'text-sm px-5 py-2.5' };
  const variants = {
    primary: 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/20',
    ghost:   'bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/8 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white',
  };
  return (
    <button onClick={onClick} disabled={loading || disabled} className={`${base} ${sizes[size]} ${variants[variant]}`}>
      {loading ? <Loader2 size={13} className="animate-spin" /> : null}
      {children}
    </button>
  );
}

function ErrorBox({ msg }) {
  if (!msg) return null;
  return (
    <div className="flex items-center gap-2 text-xs text-red-400 px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
      <AlertTriangle size={13} className="shrink-0" /> {msg}
    </div>
  );
}

function Divider() { return <div className="border-t border-gray-100 dark:border-white/6" />; }

// ── OTP 6-box input ────────────────────────────────────────────────────────────

function OTPInput({ value, onChange }) {
  const r0 = useRef(null); const r1 = useRef(null); const r2 = useRef(null);
  const r3 = useRef(null); const r4 = useRef(null); const r5 = useRef(null);
  const refs = [r0, r1, r2, r3, r4, r5];

  const padded = (value || '').padEnd(6, ' ');

  const handleChange = (i, v) => {
    const digit = v.replace(/\D/g, '').slice(-1);
    const arr = padded.split('').slice(0, 6);
    arr[i] = digit || ' ';
    onChange(arr.join('').trimEnd());
    if (digit && i < 5) refs[i + 1].current?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      const arr = padded.split('').slice(0, 6);
      if (arr[i].trim()) { arr[i] = ' '; onChange(arr.join('').trimEnd()); }
      else if (i > 0) refs[i - 1].current?.focus();
    } else if (e.key === 'ArrowLeft'  && i > 0) refs[i - 1].current?.focus();
    else if   (e.key === 'ArrowRight' && i < 5) refs[i + 1].current?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted);
    refs[Math.min(pasted.length, 5)].current?.focus();
  };

  return (
    <div className="flex gap-2 justify-center">
      {padded.split('').slice(0, 6).map((d, i) => (
        <input
          key={i} ref={refs[i]} maxLength={1} inputMode="numeric"
          value={d.trim()}
          onChange={e  => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          className={[
            'w-11 h-12 text-center text-xl font-bold rounded-xl border transition-all duration-150 outline-none bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white',
            d.trim()
              ? 'border-orange-500/60 bg-orange-500/10 shadow-[0_0_10px_rgba(249,115,22,0.15)]'
              : 'border-gray-200 dark:border-white/10 focus:border-orange-500/40 focus:bg-orange-500/5',
          ].join(' ')}
        />
      ))}
    </div>
  );
}

// ── Password strength bar ──────────────────────────────────────────────────────

function PasswordStrength({ password }) {
  if (!password) return null;
  const checks = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)];
  const score = checks.filter(Boolean).length;
  const meta  = [null,
    { label: 'Weak',   bar: 'bg-red-500',     text: 'text-red-400'     },
    { label: 'Fair',   bar: 'bg-amber-500',   text: 'text-amber-400'   },
    { label: 'Good',   bar: 'bg-blue-500',    text: 'text-blue-400'    },
    { label: 'Strong', bar: 'bg-emerald-500', text: 'text-emerald-400' },
  ][score];
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1,2,3,4].map(n => (
          <div key={n} className={`h-1 flex-1 rounded-full transition-all ${n <= score ? meta?.bar : 'bg-gray-200 dark:bg-white/8'}`} />
        ))}
      </div>
      {meta && <p className={`text-[10px] font-semibold ${meta.text}`}>{meta.label}</p>}
    </div>
  );
}

// ── Contact change card (email / phone) ───────────────────────────────────────

function ContactCard({ icon: Icon, iconBg, iconColor, label, current, step, newValue, code,
  onNewChange, onCodeChange, onEdit, onCancel, onSendCode, onVerify,
  loading, placeholder, inputType, onResend }) {
  return (
    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/3 border border-gray-100 dark:border-white/6 transition-all hover:border-gray-200 dark:hover:border-white/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
            <Icon size={15} className={iconColor} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-900 dark:text-white">{label}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{current || 'Not set'}</p>
          </div>
        </div>
        {step === 'idle'
          ? <button onClick={onEdit} className="text-[11px] font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors">
              <Edit3 size={11} /> {current ? 'Change' : 'Add'}
            </button>
          : <button onClick={onCancel} className="text-gray-600 hover:text-gray-300 transition-colors"><X size={15} /></button>
        }
      </div>

      {step === 'input' && (
        <div className="mt-4 space-y-3">
          <StyledInput icon={Icon} type={inputType} value={newValue} onChange={e => onNewChange(e.target.value)} placeholder={placeholder} />
          <Btn size="sm" onClick={onSendCode} loading={loading} disabled={!newValue.trim()}>
            Send verification code
          </Btn>
        </div>
      )}

      {step === 'otp' && (
        <div className="mt-4 space-y-4">
          <p className="text-xs text-gray-500">6-digit code sent to <span className="text-gray-900 dark:text-white font-semibold">{newValue}</span></p>
          <OTPInput value={code} onChange={onCodeChange} />
          <div className="flex gap-2 flex-wrap">
            <Btn size="sm" onClick={onVerify} loading={loading} disabled={(code || '').replace(/ /g,'').length < 6}>
              <Check size={13} /> Verify & Save
            </Btn>
            <Btn size="sm" variant="ghost" onClick={onResend} loading={loading}>Resend</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ACCOUNT TAB ───────────────────────────────────────────────────────────────

function AccountTab({ user }) {
  const qc = useQueryClient();
  const [name,  setName]  = useState('');
  const [phone, setPhone] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarBase64,  setAvatarBase64]  = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (user) { setName(user.name || ''); setPhone(user.phone || ''); }
  }, [user?.name, user?.phone]);

  const [emailStep, setEmailStep] = useState('idle');
  const [newEmail,  setNewEmail]  = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [phoneStep, setPhoneStep] = useState('idle');
  const [newPhone,  setNewPhone]  = useState('');
  const [phoneCode, setPhoneCode] = useState('');

  const profileMut = useMutation({
    mutationFn: authService.updateProfile,
    onSuccess:  () => { toast.success('Profile saved'); qc.invalidateQueries({ queryKey: ['me'] }); },
    onError:    (e) => toast.error(e.response?.data?.message || 'Failed to save'),
  });

  const otpReq = useMutation({
    mutationFn: authService.requestOTP,
    onError:    (e) => toast.error(e.response?.data?.message || 'Failed to send code'),
  });

  const otpVerify = useMutation({
    mutationFn: authService.verifyOTP,
    onSuccess: (_, vars) => {
      toast.success(vars.type === 'email_change' ? 'Email updated!' : 'Phone updated!');
      qc.invalidateQueries({ queryKey: ['me'] });
      if (vars.type === 'email_change') { setEmailStep('idle'); setNewEmail(''); setEmailCode(''); }
      else                             { setPhoneStep('idle'); setNewPhone(''); setPhoneCode(''); }
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Invalid code'),
  });

  const handleAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setAvatarPreview(ev.target.result); setAvatarBase64(ev.target.result); };
    reader.readAsDataURL(file);
  };

  const displayAvatar = avatarPreview || user?.avatar;
  const initials = ((user?.name || 'U')[0] || 'U').toUpperCase();

  const handleSave = () => profileMut.mutate({
    name: name.trim(),
    phone: phone.trim() || undefined,
    ...(avatarBase64 ? { avatar: avatarBase64 } : {}),
  });

  return (
    <div className="space-y-8">

      {/* Avatar + name row */}
      <div className="flex items-center gap-5">
        <div className="relative group cursor-pointer shrink-0" onClick={() => fileRef.current?.click()}>
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center ring-2 ring-orange-500/20">
            {displayAvatar
              ? <img src={displayAvatar} className="w-full h-full object-cover" alt="" />
              : <span className="text-3xl font-black text-white">{initials}</span>
            }
          </div>
          <div className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
            <Camera size={20} className="text-white" />
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">{user?.name || '—'}</p>
          <p className="text-xs text-gray-500 capitalize mt-0.5">{user?.role || 'owner'}</p>
          <button onClick={() => fileRef.current?.click()} className="mt-2.5 text-[11px] text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 transition-colors">
            <Camera size={11} /> Change photo
          </button>
        </div>
      </div>

      {/* Name + phone */}
      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="Full Name">
          <StyledInput icon={User} value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
        </FormField>
        <FormField label="Phone">
          <StyledInput icon={Phone} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+216 XX XXX XXX" />
        </FormField>
      </div>

      <Btn onClick={handleSave} loading={profileMut.isPending} disabled={!name.trim()}>
        <Save size={14} /> Save Profile
      </Btn>

      <Divider />

      {/* Email + phone secure change */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-4">Secure Contact</p>
        <div className="space-y-3">
          <ContactCard
            icon={Mail} iconBg="bg-blue-500/15" iconColor="text-blue-400"
            label="Email Address" current={user?.email}
            step={emailStep} newValue={newEmail} code={emailCode}
            onNewChange={setNewEmail} onCodeChange={setEmailCode}
            onEdit={() => { setEmailStep('input'); setNewEmail(''); }}
            onCancel={() => { setEmailStep('idle'); setNewEmail(''); setEmailCode(''); }}
            onSendCode={() => otpReq.mutate({ type: 'email_change', newValue: newEmail }, {
              onSuccess: () => { toast.success('Code sent!'); setEmailStep('otp'); },
            })}
            onVerify={() => otpVerify.mutate({ type: 'email_change', code: emailCode.replace(/ /g,'') })}
            onResend={() => otpReq.mutate({ type: 'email_change', newValue: newEmail }, { onSuccess: () => toast.success('New code sent!') })}
            loading={otpReq.isPending || otpVerify.isPending}
            placeholder="new@email.com" inputType="email"
          />
          <ContactCard
            icon={Smartphone} iconBg="bg-emerald-500/15" iconColor="text-emerald-400"
            label="Phone Number" current={user?.phone}
            step={phoneStep} newValue={newPhone} code={phoneCode}
            onNewChange={setNewPhone} onCodeChange={setPhoneCode}
            onEdit={() => { setPhoneStep('input'); setNewPhone(''); }}
            onCancel={() => { setPhoneStep('idle'); setNewPhone(''); setPhoneCode(''); }}
            onSendCode={() => otpReq.mutate({ type: 'phone_change', newValue: newPhone }, {
              onSuccess: () => { toast.success('Code sent!'); setPhoneStep('otp'); },
            })}
            onVerify={() => otpVerify.mutate({ type: 'phone_change', code: phoneCode.replace(/ /g,'') })}
            onResend={() => otpReq.mutate({ type: 'phone_change', newValue: newPhone }, { onSuccess: () => toast.success('New code sent!') })}
            loading={otpReq.isPending || otpVerify.isPending}
            placeholder="+216 XX XXX XXX" inputType="tel"
          />
        </div>
      </div>
    </div>
  );
}

// ── SECURITY TAB ──────────────────────────────────────────────────────────────

function SecurityTab({ user }) {
  const [curPw,      setCurPw]      = useState('');
  const [newPw,      setNewPw]      = useState('');
  const [confirmPw,  setConfirmPw]  = useState('');
  const [pwErr,      setPwErr]      = useState('');

  const [resetStep,  setResetStep]  = useState('idle');
  const [resetCode,  setResetCode]  = useState('');
  const [rNewPw,     setRNewPw]     = useState('');
  const [rConfirm,   setRConfirm]   = useState('');
  const [rErr,       setRErr]       = useState('');

  const changeMut = useMutation({
    mutationFn: authService.changePassword,
    onSuccess:  () => { toast.success('Password changed!'); setCurPw(''); setNewPw(''); setConfirmPw(''); },
    onError:    (e) => toast.error(e.response?.data?.message || 'Failed to change password'),
  });

  const otpReq = useMutation({
    mutationFn: authService.requestOTP,
    onError:    (e) => toast.error(e.response?.data?.message || 'Failed to send code'),
  });

  const otpVerify = useMutation({
    mutationFn: authService.verifyOTP,
    onSuccess:  () => {
      toast.success('Password reset!');
      setResetStep('idle'); setResetCode(''); setRNewPw(''); setRConfirm('');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Invalid code'),
  });

  const handleChange = () => {
    setPwErr('');
    if (newPw !== confirmPw)    { setPwErr('Passwords do not match'); return; }
    if (newPw.length < 8)       { setPwErr('Minimum 8 characters');   return; }
    changeMut.mutate({ currentPassword: curPw, newPassword: newPw });
  };

  const handleReset = () => {
    setRErr('');
    if (rNewPw !== rConfirm)    { setRErr('Passwords do not match'); return; }
    if (rNewPw.length < 8)      { setRErr('Minimum 8 characters');   return; }
    otpVerify.mutate({ type: 'password_reset', code: resetCode.replace(/ /g,''), newPassword: rNewPw });
  };

  return (
    <div className="space-y-8">

      {/* Change password */}
      <div className="space-y-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Change Password</p>
        <FormField label="Current Password">
          <PasswordInput value={curPw} onChange={e => setCurPw(e.target.value)} placeholder="Enter current password" />
        </FormField>
        <FormField label="New Password">
          <PasswordInput value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Minimum 8 characters" />
          <PasswordStrength password={newPw} />
        </FormField>
        <FormField label="Confirm New Password">
          <PasswordInput value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Repeat new password" />
        </FormField>
        <ErrorBox msg={pwErr} />
        <Btn onClick={handleChange} loading={changeMut.isPending} disabled={!curPw || !newPw || !confirmPw}>
          <KeyRound size={14} /> Update Password
        </Btn>
      </div>

      <Divider />

      {/* Forgot password via OTP */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-4">Forgot Password?</p>

        {resetStep === 'idle' && (
          <div className="p-5 rounded-2xl bg-gray-50 dark:bg-white/3 border border-gray-100 dark:border-white/6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0">
                <ShieldCheck size={18} className="text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Reset via email code</p>
                <p className="text-xs text-gray-500">We'll send a 6-digit code to <span className="text-gray-700 dark:text-gray-300">{user?.email}</span></p>
              </div>
            </div>
            <Btn size="sm"
              onClick={() => otpReq.mutate({ type: 'password_reset' }, {
                onSuccess: () => { toast.success('Code sent!'); setResetStep('otp'); },
              })}
              loading={otpReq.isPending}
            >
              Send reset code
            </Btn>
          </div>
        )}

        {resetStep === 'otp' && (
          <div className="space-y-5">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">Code sent to</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{user?.email}</p>
            </div>

            <OTPInput value={resetCode} onChange={setResetCode} />

            {resetCode.replace(/ /g,'').length === 6 && (
              <div className="space-y-4 pt-2">
                <FormField label="New Password">
                  <PasswordInput value={rNewPw} onChange={e => setRNewPw(e.target.value)} placeholder="Minimum 8 characters" />
                  <PasswordStrength password={rNewPw} />
                </FormField>
                <FormField label="Confirm New Password">
                  <PasswordInput value={rConfirm} onChange={e => setRConfirm(e.target.value)} placeholder="Repeat new password" />
                </FormField>
              </div>
            )}

            <ErrorBox msg={rErr} />

            <div className="flex gap-2 flex-wrap">
              <Btn
                onClick={handleReset}
                loading={otpVerify.isPending}
                disabled={resetCode.replace(/ /g,'').length < 6 || !rNewPw || !rConfirm}
                size="sm"
              >
                <Check size={13} /> Reset Password
              </Btn>
              <Btn variant="ghost" size="sm"
                onClick={() => otpReq.mutate({ type: 'password_reset' }, { onSuccess: () => toast.success('New code sent!') })}
                loading={otpReq.isPending}
              >
                Resend
              </Btn>
              <Btn variant="ghost" size="sm" onClick={() => { setResetStep('idle'); setResetCode(''); setRNewPw(''); setRConfirm(''); }}>
                Cancel
              </Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── NOTIFICATIONS TAB ─────────────────────────────────────────────────────────

function NotificationsTab({ user }) {
  const qc = useQueryClient();
  const notifMut = useMutation({
    mutationFn: authService.updateNotifications,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['me'] }),
    onError:    (e) => toast.error(e.response?.data?.message || 'Failed to save'),
  });

  const notifs = user?.notifications ?? {};
  const items = [
    { key: 'email',       label: 'Email Notifications', desc: 'General updates and alerts via email',        icon: Mail,          bg: 'bg-blue-500/15',    tc: 'text-blue-400'    },
    { key: 'orders',      label: 'New Orders',           desc: 'Instant alert when a new order comes in',    icon: Store,         bg: 'bg-orange-500/15',  tc: 'text-orange-400'  },
    { key: 'lowStock',    label: 'Low Stock Alerts',     desc: 'Notify when menu items are running low',     icon: AlertTriangle, bg: 'bg-amber-500/15',   tc: 'text-amber-400'   },
    { key: 'dailyReport', label: 'Daily Report',         desc: 'End-of-day sales summary by email',          icon: ShieldCheck,   bg: 'bg-violet-500/15',  tc: 'text-violet-400'  },
    { key: 'marketing',   label: 'Product Updates',      desc: 'News, features and announcements',           icon: Bell,          bg: 'bg-pink-500/15',    tc: 'text-pink-400'    },
    { key: 'sms',         label: 'SMS Alerts',           desc: 'Critical alerts via text message',           icon: Smartphone,    bg: 'bg-emerald-500/15', tc: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-6">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Notification Preferences</p>
      <div className="space-y-2">
        {items.map(({ key, label, desc, icon: Icon, bg, tc }) => (
          <div key={key} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-white/3 border border-gray-100 dark:border-white/6 hover:border-gray-200 dark:hover:border-white/10 transition-colors">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon size={15} className={tc} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
            </div>
            <ToggleSwitch
              checked={notifs[key] ?? false}
              onChange={(val) => notifMut.mutate({ [key]: val })}
            />
          </div>
        ))}
      </div>
      {notifMut.isPending && (
        <p className="text-[11px] text-gray-600 flex items-center gap-1.5">
          <Loader2 size={11} className="animate-spin" /> Saving…
        </p>
      )}
    </div>
  );
}

// ── RESTAURANT TAB ────────────────────────────────────────────────────────────

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const INITIAL_HOURS = DAYS.reduce((acc, d, i) => { acc[d] = { open: i < 6, from: '11:00', to: '23:00' }; return acc; }, {});

function RestaurantTab() {
  return (
    <div className="space-y-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Restaurant Info</p>
      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="Restaurant Name">
          <StyledInput icon={Store} defaultValue="" placeholder="Restaurant name" />
        </FormField>
        <FormField label="Phone Number">
          <StyledInput icon={Phone} defaultValue="" placeholder="+216 XX XXX XXX" />
        </FormField>
        <FormField label="Email">
          <StyledInput icon={Mail} defaultValue="" placeholder="contact@restaurant.com" />
        </FormField>
        <FormField label="Website">
          <StyledInput icon={Globe} defaultValue="" placeholder="www.restaurant.com" />
        </FormField>
      </div>
      <FormField label="Address">
        <StyledInput icon={MapPin} defaultValue="" placeholder="Full address" />
      </FormField>
      <FormField label="Description">
        <textarea
          rows={3}
          placeholder="Describe your restaurant…"
          className="w-full bg-gray-100 dark:bg-white/4 border border-gray-200 dark:border-white/8 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:border-orange-500/50 focus:bg-orange-500/5 transition-all resize-none"
        />
      </FormField>
      <Btn><Save size={14} /> Save Changes</Btn>
    </div>
  );
}

function HoursTab() {
  const [hours, setHours] = useState(INITIAL_HOURS);
  const upd = (d, k, v) => setHours(p => ({ ...p, [d]: { ...p[d], [k]: v } }));

  return (
    <div className="space-y-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Opening Hours</p>
      <div className="divide-y divide-gray-100 dark:divide-white/4">
        {DAYS.map(day => (
          <div key={day} className="flex items-center gap-4 py-3.5">
            <p className="w-28 shrink-0 text-sm font-medium text-gray-800 dark:text-gray-200">{day}</p>
            <button
              onClick={() => upd(day, 'open', !hours[day].open)}
              className={`w-10 h-5 rounded-full relative shrink-0 transition-colors duration-200 ${hours[day].open ? 'bg-orange-500' : 'bg-white/10'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${hours[day].open ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
            {hours[day].open ? (
              <div className="flex items-center gap-2 flex-1">
                <input type="time" value={hours[day].from} onChange={e => upd(day, 'from', e.target.value)}
                  className="bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-900 dark:text-white outline-none focus:border-orange-500/50 transition-colors" />
                <span className="text-xs text-gray-400">to</span>
                <input type="time" value={hours[day].to} onChange={e => upd(day, 'to', e.target.value)}
                  className="bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-900 dark:text-white outline-none focus:border-orange-500/50 transition-colors" />
              </div>
            ) : (
              <span className="text-xs text-gray-600 flex-1">Closed</span>
            )}
          </div>
        ))}
      </div>
      <Btn><Save size={14} /> Save Hours</Btn>
    </div>
  );
}

function PaymentsTab() {
  const [v, setV] = useState({ cash: true, card: true, online: false, tva: true, tvaRate: '19', service: false });
  const tog = k => setV(p => ({ ...p, [k]: !p[k] }));

  const Row = ({ k, label, desc }) => (
    <div className="flex items-center justify-between py-3.5 border-b border-gray-100 dark:border-white/4 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
      </div>
      <ToggleSwitch checked={v[k]} onChange={() => tog(k)} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-4">Payment Methods</p>
        <div className="bg-gray-50 dark:bg-white/3 border border-gray-100 dark:border-white/6 rounded-2xl px-4">
          <Row k="cash"   label="Cash"               desc="Accept cash payments" />
          <Row k="card"   label="Card / POS Terminal" desc="Visa, Mastercard, etc." />
          <Row k="online" label="Online Payment"      desc="Flouci, Paymee & others" />
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-4">Taxes & Fees</p>
        <div className="bg-gray-50 dark:bg-white/3 border border-gray-100 dark:border-white/6 rounded-2xl px-4">
          <Row k="tva" label="Apply TVA" desc={`Currently ${v.tvaRate}%`} />
          {v.tva && (
            <div className="py-3.5 border-t border-gray-100 dark:border-white/4">
              <FormField label="TVA Rate (%)">
                <StyledInput defaultValue={v.tvaRate} placeholder="19" />
              </FormField>
            </div>
          )}
          <Row k="service" label="Service Charge" desc="Added to every bill" />
        </div>
      </div>
      <Btn><Save size={14} /> Save Payments</Btn>
    </div>
  );
}

function AppearanceTab() {
  const [theme, setTheme] = useState('system');
  const [lang,  setLang]  = useState('en');
  const [color, setColor] = useState('orange');

  const COLORS = [
    { k: 'orange', hex: '#f97316' }, { k: 'blue',   hex: '#3b82f6' },
    { k: 'green',  hex: '#22c55e' }, { k: 'purple',  hex: '#8b5cf6' },
  ];

  return (
    <div className="space-y-6">
      <FormField label="Theme">
        <div className="flex bg-gray-100 dark:bg-white/5 rounded-xl p-1 gap-1 w-fit border border-gray-200 dark:border-white/8">
          {['light','dark','system'].map(t => (
            <button key={t} onClick={() => setTheme(t)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${theme === t ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}>
              {t}
            </button>
          ))}
        </div>
      </FormField>

      <FormField label="Language">
        <div className="flex gap-2 flex-wrap">
          {[{ k:'en',label:'🇺🇸 English'},{ k:'fr',label:'🇫🇷 Français'},{ k:'ar',label:'🇹🇳 العربية'}].map(l => (
            <button key={l.k} onClick={() => setLang(l.k)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${lang === l.k ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-200 dark:border-white/10 text-gray-500 hover:border-orange-500/40 hover:text-gray-800 dark:hover:text-gray-300'}`}>
              {l.label}
            </button>
          ))}
        </div>
      </FormField>

      <FormField label="Accent Color">
        <div className="flex items-center gap-3">
          {COLORS.map(c => (
            <button key={c.k} onClick={() => setColor(c.k)} title={c.k}
              className={`w-8 h-8 rounded-full transition-all duration-150 ${color === c.k ? 'ring-2 ring-offset-2 ring-white/30 dark:ring-offset-[#141414] scale-110' : 'hover:scale-105 opacity-70 hover:opacity-100'}`}
              style={{ background: c.hex }}
            />
          ))}
        </div>
      </FormField>

      <Btn><Save size={14} /> Save Appearance</Btn>
    </div>
  );
}

// ── MAIN SETTINGS ─────────────────────────────────────────────────────────────

const TABS = [
  { key: 'account',       label: 'Account',       icon: User,       group: 'Personal'  },
  { key: 'security',      label: 'Security',       icon: Shield,     group: 'Personal'  },
  { key: 'notifications', label: 'Notifications',  icon: Bell,       group: 'Personal'  },
  { key: 'restaurant',    label: 'Restaurant',     icon: Store,      group: 'Business'  },
  { key: 'hours',         label: 'Hours',          icon: Clock,      group: 'Business'  },
  { key: 'payments',      label: 'Payments',       icon: CreditCard, group: 'Business'  },
  { key: 'appearance',    label: 'Appearance',     icon: Palette,    group: 'System'    },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('account');

  const { data, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn:  () => authService.getMe().then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });
  const user = data?.data ?? data;

  const panels = {
    account:       <AccountTab       user={user} />,
    security:      <SecurityTab      user={user} />,
    notifications: <NotificationsTab user={user} />,
    restaurant:    <RestaurantTab />,
    hours:         <HoursTab />,
    payments:      <PaymentsTab />,
    appearance:    <AppearanceTab />,
  };

  const groups = ['Personal', 'Business', 'System'];
  const activeTabMeta = TABS.find(t => t.key === activeTab);
  const ActiveIcon = activeTabMeta?.icon;

  return (
    <div className="p-5 sm:p-7 max-w-[1440px] mx-auto">

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Settings</h1>
        <p className="text-xs text-gray-400 mt-0.5">Manage your account and restaurant preferences</p>
      </div>

      <div className="flex gap-6 items-start">

        {/* Sidebar nav — desktop */}
        <nav className="hidden lg:block w-52 shrink-0 space-y-5">
          {groups.map(group => (
            <div key={group}>
              <p className="px-3 mb-1.5 text-[9px] font-bold uppercase tracking-widest text-gray-600">{group}</p>
              <div className="space-y-0.5">
                {TABS.filter(t => t.group === group).map(({ key, label, icon: Icon }) => (
                  <button key={key} onClick={() => setActiveTab(key)}
                    className={[
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left',
                      activeTab === key
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20'
                        : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-800 dark:hover:text-gray-200',
                    ].join(' ')}>
                    <Icon size={15} className="shrink-0" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Mobile tab bar */}
        <div className="lg:hidden flex gap-1.5 overflow-x-auto pb-2 w-full shrink-0">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={[
                'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0',
                activeTab === key
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400',
              ].join(' ')}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div className="flex-1 min-w-0 bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/6 rounded-2xl shadow-sm overflow-hidden">

          {/* Panel top bar */}
          <div className="px-6 py-4 border-b border-gray-100 dark:border-white/6 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-orange-500/15 flex items-center justify-center shrink-0">
              {ActiveIcon && <ActiveIcon size={15} className="text-orange-400" />}
            </div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">{activeTabMeta?.label}</h2>
          </div>

          {/* Panel body */}
          <div className="p-6">
            {isLoading && ['account','security','notifications'].includes(activeTab) ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-8 justify-center">
                <Loader2 size={16} className="animate-spin" /> Loading…
              </div>
            ) : (
              panels[activeTab]
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
