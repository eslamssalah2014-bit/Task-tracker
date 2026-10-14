'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, DEMO_CREDENTIALS } from '../../../context/AuthContext';
import { UserRole } from '../../../types';
import { getRedirectPathForRole } from '../../../lib/permissions';
import {
  Sparkles,
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);

  // Forgot Password Modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [isSendingForgot, setIsSendingForgot] = useState(false);

  // If already logged in, redirect to appropriate landing page
  useEffect(() => {
    if (user) {
      router.replace(getRedirectPathForRole(user.role_name));
    }
  }, [user, router]);

  // Load remembered email and notices from query params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const remembered = localStorage.getItem('tt_remember_email');
      if (remembered) {
        setEmail(remembered);
        setRememberMe(true);
      } else {
        // Default demo email for convenience
        setEmail('eslam@tasktracker.io');
        setPassword('Admin@123');
      }
    }

    if (searchParams.get('expired')) {
      setInfoNotice('Your session has expired. Please sign in again to continue.');
    } else if (searchParams.get('notice') === 'registration_disabled') {
      setInfoNotice('Public registration is disabled. User accounts are created only by administrators.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoNotice(null);

    if (!email || !password) {
      setError('Please provide both email address and password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login(email, password, rememberMe);
      if (result.success && result.user) {
        const dest = getRedirectPathForRole(result.user.role_name);
        router.push(dest);
      } else {
        setError(result.error || 'Authentication failed. Please verify your credentials.');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during authentication.');
      setIsSubmitting(false);
    }
  };

  const handleSelectDemo = (role: UserRole) => {
    const creds = DEMO_CREDENTIALS[role];
    if (creds) {
      setEmail(creds.email);
      setPassword(creds.password);
      setError(null);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingForgot(true);
    setTimeout(() => {
      setIsSendingForgot(false);
      setForgotSent(true);
    }, 700);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-radial from-slate-900 via-slate-950 to-black selection:bg-blue-500 selection:text-white relative overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 sm:p-10 relative z-10">
        {/* Security badge & Brand Header */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold mb-4 border border-slate-200/80">
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            Internal Platform • Authorized Access Only
          </div>

          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-blue-500/30">
            <Sparkles className="w-7 h-7" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Task Tracker</h1>
          <p className="text-xs text-slate-500 mt-1">Sign in to access your organization dashboard</p>
        </div>

        {/* Informational Notice */}
        {infoNotice && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{infoNotice}</div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed font-medium">{error}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Work Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@tasktracker.io"
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/70 focus:bg-white transition-all text-slate-900"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">Password</label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-medium"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-11 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/70 focus:bg-white transition-all text-slate-900"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me Option */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <span className="ml-2 text-xs text-slate-600 font-medium">
                Remember credentials on this device
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-blue-500/25 active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating Session...</span>
              </>
            ) : (
              <>
                <span>Sign In to System</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Roles Quick Fill Selector */}
        <div className="mt-7 pt-5 border-t border-slate-100 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
            Fast Role Credentials Fill
          </p>
          <div className="grid grid-cols-2 gap-2 text-left">
            <button
              type="button"
              onClick={() => handleSelectDemo('Super Admin')}
              className={`p-2 rounded-xl border text-xs transition-all ${
                email === DEMO_CREDENTIALS['Super Admin'].email
                  ? 'border-blue-500 bg-blue-50/70 text-blue-900 shadow-xs'
                  : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/70 text-slate-700'
              }`}
            >
              <div className="font-bold text-[11px] truncate">Eslam Salah</div>
              <div className="text-[10px] text-purple-600 font-semibold truncate">Super Admin</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectDemo('Admin')}
              className={`p-2 rounded-xl border text-xs transition-all ${
                email === DEMO_CREDENTIALS['Admin'].email
                  ? 'border-blue-500 bg-blue-50/70 text-blue-900 shadow-xs'
                  : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/70 text-slate-700'
              }`}
            >
              <div className="font-bold text-[11px] truncate">Tarek Nabil</div>
              <div className="text-[10px] text-indigo-600 font-semibold truncate">Admin</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectDemo('Education Manager')}
              className={`p-2 rounded-xl border text-xs transition-all ${
                email === DEMO_CREDENTIALS['Education Manager'].email
                  ? 'border-blue-500 bg-blue-50/70 text-blue-900 shadow-xs'
                  : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/70 text-slate-700'
              }`}
            >
              <div className="font-bold text-[11px] truncate">Walied Said</div>
              <div className="text-[10px] text-blue-600 font-semibold truncate">Education Manager</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectDemo('Team Member')}
              className={`p-2 rounded-xl border text-xs transition-all ${
                email === DEMO_CREDENTIALS['Team Member'].email
                  ? 'border-blue-500 bg-blue-50/70 text-blue-900 shadow-xs'
                  : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/70 text-slate-700'
              }`}
            >
              <div className="font-bold text-[11px] truncate">Sarah Ahmed</div>
              <div className="text-[10px] text-emerald-600 font-semibold truncate">Team Member</div>
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-7 space-y-4 shadow-2xl border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>

            <h3 className="text-base font-bold text-slate-900">Reset System Password</h3>

            {forgotSent ? (
              <div className="p-4 bg-emerald-50 text-emerald-900 rounded-2xl text-xs space-y-2 border border-emerald-100">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <p className="font-semibold text-emerald-800">Dispatch Instructions Sent</p>
                <p className="text-emerald-700 text-[11px] leading-relaxed">
                  If an authorized account is associated with {forgotEmail || email}, password recovery instructions have been sent.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotSent(false);
                  }}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs mt-3 transition-colors"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Enter your company email to request secure credentials reset instructions from the administrator.
                </p>
                <input
                  type="email"
                  required
                  placeholder="name@tasktracker.io"
                  value={forgotEmail || email}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
                />
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingForgot}
                    className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-all disabled:opacity-50"
                  >
                    {isSendingForgot ? 'Sending...' : 'Request Instructions'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
