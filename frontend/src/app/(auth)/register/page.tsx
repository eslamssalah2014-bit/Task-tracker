'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';

export default function RegisterBlockedPage() {
  const router = useRouter();

  useEffect(() => {
    // Optionally auto-redirect after a short delay
    const timer = setTimeout(() => {
      router.replace('/login?notice=registration_disabled');
    }, 4000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 text-white selection:bg-blue-500">
      <div className="w-full max-w-md bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-100 p-8 sm:p-10 text-center relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">
          Internal System Notice
        </span>

        <h1 className="text-xl font-bold text-slate-900 mt-3">Public Registration Disabled</h1>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          Task Tracker is a restricted internal organization platform. Self-registration is strictly disabled.
          Accounts can only be created and provisioned by authorized system administrators.
        </p>

        <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
          <Link
            href="/login?notice=registration_disabled"
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Proceed to Secure Sign In
          </Link>
          <p className="text-[11px] text-slate-400">
            Automatically redirecting to login in a few seconds...
          </p>
        </div>
      </div>
    </div>
  );
}
