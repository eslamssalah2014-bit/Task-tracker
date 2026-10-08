'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, UserRole } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  switchDemoUser: (role: UserRole) => void;
  hasRole: (roles: UserRole[]) => boolean;
}

const DEMO_USERS: Record<UserRole, UserProfile> = {
  'Super Admin': {
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
  },
  Manager: {
    id: 'u0000002-0000-0000-0000-000000000002',
    email: 'walied@tasktracker.io',
    full_name: 'Walied Said',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    phone: '+20 100 234 5678',
    role_id: '22222222-2222-2222-2222-222222222222',
    role_name: 'Manager',
    department: 'Education & Tech',
    job_title: 'Education & Security Manager',
    status: 'active',
    timezone: 'Africa/Cairo',
    created_at: new Date().toISOString(),
  },
  'Team Member': {
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
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(DEMO_USERS['Super Admin']);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('tt_current_user');
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        localStorage.setItem('tt_current_user', JSON.stringify(DEMO_USERS['Super Admin']));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await api.login(email, pass);
      if (res.user) {
        setUser(res.user);
        localStorage.setItem('tt_current_user', JSON.stringify(res.user));
        return true;
      }
      return false;
    } catch (err) {
      // Fallback matching demo user for seamless UX
      const found = Object.values(DEMO_USERS).find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (found) {
        setUser(found);
        localStorage.setItem('tt_current_user', JSON.stringify(found));
        return true;
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('tt_current_user');
  };

  const switchDemoUser = (role: UserRole) => {
    const targetUser = DEMO_USERS[role];
    setUser(targetUser);
    localStorage.setItem('tt_current_user', JSON.stringify(targetUser));
  };

  const hasRole = (roles: UserRole[]): boolean => {
    if (!user || !user.role_name) return false;
    return roles.includes(user.role_name);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: (user?.role_name || 'Team Member') as UserRole,
        isLoading,
        login,
        logout,
        switchDemoUser,
        hasRole,
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
