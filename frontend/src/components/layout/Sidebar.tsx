'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  CheckCircle2,
  Layers,
  ShieldAlert,
  Users,
  Briefcase,
  BarChart3,
  FileCode,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (c: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const pathname = usePathname();
  const { user, role } = useAuth();

  const navItems = [
    {
      label: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      roles: ['Super Admin', 'Manager', 'Team Member'],
    },
    {
      label: 'My Tasks',
      href: '/my-tasks',
      icon: CheckCircle2,
      roles: ['Super Admin', 'Manager', 'Team Member'],
    },
    {
      label: 'All Tasks',
      href: '/tasks',
      icon: Layers,
      roles: ['Super Admin', 'Manager', 'Team Member'],
    },
    {
      label: 'Manager Command',
      href: '/manager',
      icon: ShieldAlert,
      badge: 'Insights',
      roles: ['Super Admin', 'Manager'],
    },
    {
      label: 'Teams',
      href: '/teams',
      icon: Briefcase,
      roles: ['Super Admin', 'Manager'],
    },
    {
      label: 'Users',
      href: '/users',
      icon: Users,
      roles: ['Super Admin', 'Manager'],
    },
    {
      label: 'Reports & Analytics',
      href: '/reports',
      icon: BarChart3,
      roles: ['Super Admin', 'Manager'],
    },
    {
      label: 'Templates',
      href: '/templates',
      icon: FileCode,
      roles: ['Super Admin', 'Manager'],
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: Settings,
      roles: ['Super Admin'],
    },
  ];

  const allowedNavItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 bg-slate-900 text-white flex flex-col border-r border-slate-800 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800/80">
        {!isCollapsed && (
          <Link href="/" className="flex items-center gap-2.5 font-bold text-base tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-white">Task</span>
              <span className="text-blue-400">Tracker</span>
            </div>
          </Link>
        )}

        {isCollapsed && (
          <div className="w-8 h-8 mx-auto rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${
            isCollapsed ? 'hidden' : 'block'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Nav links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {allowedNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              } ${isCollapsed ? 'justify-center px-2' : ''}`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between">
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer Profile Mini Pill */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/60">
        <Link
          href="/profile"
          className={`flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800 transition-colors ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <img
            src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
            alt={user?.full_name || 'User'}
            className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
          />
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.full_name}</p>
              <p className="text-[11px] text-blue-400 truncate">{user?.role_name}</p>
            </div>
          )}
        </Link>
      </div>
    </aside>
  );
};
