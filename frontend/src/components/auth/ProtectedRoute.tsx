'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Permission, getRedirectPathForRole, roleHasPermission } from '../../lib/permissions';
import { ShieldAlert, Sparkles, ArrowLeft, Lock } from 'lucide-react';
import Link from 'next/link';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Route to required permissions mapping
const ROUTE_PERMISSIONS: Record<string, Permission> = {
  '/users': 'users.view',
  '/settings': 'settings.manage',
  '/teams': 'teams.view',
  '/reports': 'reports.view',
  '/manager': 'tasks.view_all',
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, role, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  // Loading state during auth initialization
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white mb-4 animate-pulse shadow-lg shadow-blue-500/30">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="text-white font-bold text-lg tracking-tight">Task Tracker</div>
        <p className="text-slate-400 text-xs mt-1 animate-pulse">Verifying secure authorization...</p>
        <div className="w-48 h-1 bg-slate-800 rounded-full mt-6 overflow-hidden">
          <div className="w-1/2 h-full bg-blue-500 rounded-full animate-indeterminate" />
        </div>
      </div>
    );
  }

  // Unauthenticated: render nothing while redirect occurs
  if (!user) {
    return null;
  }

  // Determine required permission for the current pathname
  const requiredPermission = Object.entries(ROUTE_PERMISSIONS).find(([route]) =>
    pathname.startsWith(route)
  )?.[1];

  // RBAC Permission Check
  if (requiredPermission && !roleHasPermission(role, requiredPermission)) {
    const fallbackPath = getRedirectPathForRole(role);

    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-3xl border border-rose-100 shadow-xl p-8 sm:p-10 text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto mb-5 shadow-xs">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 uppercase tracking-wider">
            403 • Access Restricted
          </span>

          <h2 className="text-xl font-bold text-slate-900 mt-3">Permission Denied</h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Your current account role <span className="font-bold text-slate-900">({role})</span> is not authorized to access this module.
            This section requires the <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono text-[11px]">{requiredPermission}</code> permission.
          </p>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={fallbackPath}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Authorized Dashboard
            </Link>

            <button
              onClick={logout}
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
            >
              Sign In as Different User
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
