'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, UserRole } from '../types';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import {
  Permission,
  ROLE_PERMISSIONS,
  normalizeRole,
  roleHasPermission,
  roleHasAnyPermission,
} from '../lib/permissions';

export interface LoginResult {
  success: boolean;
  error?: string;
  user?: UserProfile;
}

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isLoading: boolean;
  login: (email: string, pass: string, rememberMe?: boolean) => Promise<LoginResult>;
  logout: () => void;
  switchDemoUser: (role: UserRole) => void;
  hasRole: (roles: (UserRole | string)[]) => boolean;
  hasPermission: (permission: Permission | Permission[]) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
}

export const DEMO_CREDENTIALS: Record<UserRole, { email: string; password: string; profile: UserProfile }> = {
  'Super Admin': {
    email: 'eslam@tasktracker.io',
    password: 'Admin@123',
    profile: {
      id: 'u0000001-0000-0000-0000-000000000001',
      email: 'eslam@tasktracker.io',
      full_name: 'Eslam Salah',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      phone: '+20 100 123 4567',
      role_id: '11111111-1111-1111-1111-111111111111',
      role_name: 'Super Admin',
      department: 'Executive',
      job_title: 'Head of Operations & Systems',
      status: 'active',
      timezone: 'Africa/Cairo',
      created_at: new Date().toISOString(),
      permissions: [...ROLE_PERMISSIONS['Super Admin']],
    },
  },
  Admin: {
    email: 'admin@tasktracker.io',
    password: 'Admin@123',
    profile: {
      id: 'u0000007-0000-0000-0000-000000000007',
      email: 'admin@tasktracker.io',
      full_name: 'Tarek Nabil',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      phone: '+20 100 888 9999',
      role_id: '22222222-1111-2222-1111-222222222222',
      role_name: 'Admin',
      department: 'Operations & Administration',
      job_title: 'Operations Administrator',
      status: 'active',
      timezone: 'Africa/Cairo',
      created_at: new Date().toISOString(),
      permissions: [...ROLE_PERMISSIONS['Admin']],
    },
  },
  'Education Manager': {
    email: 'walied@tasktracker.io',
    password: 'Admin@123',
    profile: {
      id: 'u0000002-0000-0000-0000-000000000002',
      email: 'walied@tasktracker.io',
      full_name: 'Walied Said',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      phone: '+20 100 234 5678',
      role_id: '22222222-2222-2222-2222-222222222222',
      role_name: 'Education Manager',
      department: 'Education & Tech',
      job_title: 'Education & Security Manager',
      status: 'active',
      timezone: 'Africa/Cairo',
      created_at: new Date().toISOString(),
      permissions: [...ROLE_PERMISSIONS['Education Manager']],
    },
  },
  'Team Member': {
    email: 'sarah@tasktracker.io',
    password: 'Admin@123',
    profile: {
      id: 'u0000003-0000-0000-0000-000000000003',
      email: 'sarah@tasktracker.io',
      full_name: 'Sarah Ahmed',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      phone: '+20 100 345 6789',
      role_id: '33333333-3333-3333-3333-333333333333',
      role_name: 'Team Member',
      department: 'Education & Tech',
      job_title: 'Senior Penetration Testing Lead',
      status: 'active',
      timezone: 'Africa/Cairo',
      created_at: new Date().toISOString(),
      permissions: [...ROLE_PERMISSIONS['Team Member']],
    },
  },
  Manager: {
    email: 'walied@tasktracker.io',
    password: 'Admin@123',
    profile: {
      id: 'u0000002-0000-0000-0000-000000000002',
      email: 'walied@tasktracker.io',
      full_name: 'Walied Said',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      phone: '+20 100 234 5678',
      role_id: '22222222-2222-2222-2222-222222222222',
      role_name: 'Education Manager',
      department: 'Education & Tech',
      job_title: 'Education & Security Manager',
      status: 'active',
      timezone: 'Africa/Cairo',
      created_at: new Date().toISOString(),
      permissions: [...ROLE_PERMISSIONS['Education Manager']],
    },
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore authenticated session on mount
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const storedToken = localStorage.getItem('tt_auth_token');
        const storedUser = localStorage.getItem('tt_current_user');

        if (storedToken || storedUser) {
          // Attempt verifying with backend /me endpoint
          try {
            const me = await api.getMe();
            if (isMounted && me && me.status !== 'disabled') {
              const normalized = {
                ...me,
                role_name: normalizeRole(me.role_name),
                permissions: me.permissions || ROLE_PERMISSIONS[normalizeRole(me.role_name)],
              };
              setUser(normalized);
              localStorage.setItem('tt_current_user', JSON.stringify(normalized));
              setIsLoading(false);
              return;
            }
          } catch (e) {
            // If offline or backend fetch fails, check storedUser fallback
            if (storedUser) {
              const parsed = JSON.parse(storedUser);
              if (parsed?.status === 'active') {
                const normalized = {
                  ...parsed,
                  role_name: normalizeRole(parsed.role_name),
                  permissions: parsed.permissions || ROLE_PERMISSIONS[normalizeRole(parsed.role_name)],
                };
                if (isMounted) setUser(normalized);
              } else {
                localStorage.removeItem('tt_current_user');
                localStorage.removeItem('tt_auth_token');
              }
            }
          }
        }
      } catch (err) {
        console.error('Session restoration error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (
    email: string,
    pass: string,
    rememberMe: boolean = true
  ): Promise<LoginResult> => {
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      // 1. Try Supabase Auth signIn if credentials exist
      let supabaseAccessToken: string | null = null;
      try {
        const { data: supaData, error: supaErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: pass,
        });
        if (!supaErr && supaData?.session?.access_token) {
          supabaseAccessToken = supaData.session.access_token;
        }
      } catch (e) {
        // Continue to API login
      }

      // 2. Call backend login API
      const res = await api.login(cleanEmail, pass);
      if (res?.user) {
        if (res.user.status === 'disabled') {
          return {
            success: false,
            error: 'This account has been deactivated. Please contact your system administrator.',
          };
        }

        const normalizedUser: UserProfile = {
          ...res.user,
          role_name: normalizeRole(res.user.role_name),
          permissions: res.user.permissions || ROLE_PERMISSIONS[normalizeRole(res.user.role_name)],
        };

        const tokenToStore = supabaseAccessToken || res.token || normalizedUser.id;

        setUser(normalizedUser);
        localStorage.setItem('tt_auth_token', tokenToStore);
        localStorage.setItem('tt_current_user', JSON.stringify(normalizedUser));

        if (rememberMe) {
          localStorage.setItem('tt_remember_email', cleanEmail);
        } else {
          localStorage.removeItem('tt_remember_email');
        }

        return { success: true, user: normalizedUser };
      }

      return { success: false, error: 'Invalid email address or password.' };
    } catch (err: any) {
      // Check demo credentials fallback if backend is unreachable or demo testing
      const matchedDemo = Object.values(DEMO_CREDENTIALS).find(
        (c) => c.email.toLowerCase() === cleanEmail && c.password === pass
      );

      if (matchedDemo) {
        const demoProfile = matchedDemo.profile;
        setUser(demoProfile);
        localStorage.setItem('tt_auth_token', demoProfile.id);
        localStorage.setItem('tt_current_user', JSON.stringify(demoProfile));

        if (rememberMe) {
          localStorage.setItem('tt_remember_email', cleanEmail);
        }

        return { success: true, user: demoProfile };
      }

      const errorMessage =
        err?.message?.includes('disabled') || err?.message?.includes('ACCOUNT_DISABLED')
          ? 'This account has been deactivated. Please contact your system administrator.'
          : 'Invalid email address or password. Please verify your credentials.';

      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    api.logout();
    try {
      supabase.auth.signOut();
    } catch (e) {}
    localStorage.removeItem('tt_auth_token');
    localStorage.removeItem('tt_current_user');
  };

  const switchDemoUser = (targetRole: UserRole) => {
    const demo = DEMO_CREDENTIALS[targetRole] || DEMO_CREDENTIALS['Super Admin'];
    const profile = demo.profile;
    setUser(profile);
    localStorage.setItem('tt_auth_token', profile.id);
    localStorage.setItem('tt_current_user', JSON.stringify(profile));
  };

  const hasRole = (roles: (UserRole | string)[]): boolean => {
    if (!user || !user.role_name) return false;
    const current = normalizeRole(user.role_name);
    const normalizedTargets = roles.map((r) => normalizeRole(r));
    return normalizedTargets.includes(current);
  };

  const hasPermission = (permission: Permission | Permission[]): boolean => {
    if (!user || !user.role_name) return false;
    const userRole = normalizeRole(user.role_name);
    const perms = Array.isArray(permission) ? permission : [permission];
    return perms.every((p) => roleHasPermission(userRole, p));
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (!user || !user.role_name) return false;
    const userRole = normalizeRole(user.role_name);
    return roleHasAnyPermission(userRole, permissions);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: normalizeRole(user?.role_name),
        isLoading,
        login,
        logout,
        switchDemoUser,
        hasRole,
        hasPermission,
        hasAnyPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
