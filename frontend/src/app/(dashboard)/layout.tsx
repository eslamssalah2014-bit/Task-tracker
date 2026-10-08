'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { TopNavbar } from '../../components/layout/TopNavbar';
import { CreateTaskModal } from '../../components/tasks/CreateTaskModal';
import { api } from '../../lib/api';
import { Task, TaskCategory, TaskPriority, TaskStatus, Team, UserProfile } from '../../types';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // App Metadata Cache
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [statuses, setStatuses] = useState<TaskStatus[]>([]);
  const [priorities, setPriorities] = useState<TaskPriority[]>([]);
  const [categories, setCategories] = useState<TaskCategory[]>([]);

  useEffect(() => {
    // Load metadata asynchronously
    Promise.all([
      api.getUsers().catch(() => []),
      api.getTeams().catch(() => []),
      api.getMetadata().catch(() => ({})),
    ]).then(([u, t, meta]) => {
      setUsers(u);
      setTeams(t);
      if (meta.statuses) setStatuses(meta.statuses);
      if (meta.priorities) setPriorities(meta.priorities);
      if (meta.categories) setCategories(meta.categories);
    });
  }, []);

  const handleTaskCreated = (newTask: Task) => {
    // Broadcast reload event to views
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('task-tracker-refresh'));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar for Desktop */}
      <div className="hidden md:block">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </div>

      {/* Mobile Drawer Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative z-10 w-64 bg-slate-900 h-full">
            <Sidebar isCollapsed={false} setIsCollapsed={() => setIsMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        <TopNavbar
          onOpenCreateTask={() => setIsCreateOpen(true)}
          onToggleMobileSidebar={() => setIsMobileOpen(!isMobileOpen)}
          isCollapsed={isCollapsed}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Global Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleTaskCreated}
        users={users}
        teams={teams}
        statuses={statuses}
        priorities={priorities}
        categories={categories}
      />
    </div>
  );
}
