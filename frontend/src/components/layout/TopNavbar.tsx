'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import {
  Search,
  Plus,
  Bell,
  Menu,
  User as UserIcon,
  LogOut,
  Settings as SettingsIcon,
  CheckCircle,
  Shield,
  Layers,
} from 'lucide-react';
import Link from 'next/link';
import { GlobalSearchModal } from './GlobalSearchModal';
import { NotificationDrawer } from './NotificationDrawer';
import { api } from '../../lib/api';

interface TopNavbarProps {
  onOpenCreateTask: () => void;
  onToggleMobileSidebar: () => void;
  isCollapsed: boolean;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onOpenCreateTask,
  onToggleMobileSidebar,
  isCollapsed,
}) => {
  const { user, role, switchDemoUser, logout } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Keyboard shortcut Cmd/Ctrl + K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    api.getNotifications()
      .then((res) => setUnreadCount(res.unreadCount || 0))
      .catch(() => {});
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 right-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 transition-all duration-300 flex items-center justify-between px-4 sm:px-6 ${
          isCollapsed ? 'left-20' : 'left-64'
        }`}
      >
        {/* Left: Mobile hamburger & Search bar */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 md:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 rounded-xl text-slate-500 text-xs transition-colors w-48 sm:w-72 border border-slate-200/60"
          >
            <Search className="w-4 h-4 text-slate-400" />
            <span className="flex-1 text-left truncate">Search tasks, users, teams...</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-white border border-slate-200 rounded font-mono text-slate-400 shadow-xs">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Right Actions: Role quick switcher, Create button, Notifications, Profile */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Role quick switch pill for testing */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <span className="text-[11px] font-semibold text-slate-400 px-2 uppercase">Role:</span>
            {(['Super Admin', 'Manager', 'Team Member'] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => switchDemoUser(r)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  role === r
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {r === 'Super Admin' ? 'Admin' : r}
              </button>
            ))}
          </div>

          {/* Quick Create Task button (Visible for Super Admin & Manager) */}
          {role !== 'Team Member' && (
            <button
              onClick={onOpenCreateTask}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm shadow-blue-500/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create Task</span>
            </button>
          )}

          {/* Notification Bell */}
          <button
            onClick={() => setIsNotificationOpen(true)}
            className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Profile Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-blue-500/20 transition-all"
            >
              <img
                src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                alt={user?.full_name}
                className="w-8 h-8 rounded-full object-cover border border-slate-200"
              />
            </button>

            {isProfileMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 text-xs animate-in fade-in duration-100"
                onClick={() => setIsProfileMenuOpen(false)}
              >
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="font-semibold text-slate-900 truncate">{user?.full_name}</p>
                  <p className="text-slate-400 text-[11px] truncate">{user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    {user?.role_name}
                  </span>
                </div>

                <Link
                  href="/profile"
                  className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-slate-400" /> My Profile
                </Link>
                {role === 'Super Admin' && (
                  <Link
                    href="/settings"
                    className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <SettingsIcon className="w-4 h-4 text-slate-400" /> Admin Settings
                  </Link>
                )}
                <div className="border-t border-slate-100 my-1" />
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-600 hover:bg-rose-50 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onNotificationRead={() => setUnreadCount((c) => Math.max(0, c - 1))}
      />
    </>
  );
};
