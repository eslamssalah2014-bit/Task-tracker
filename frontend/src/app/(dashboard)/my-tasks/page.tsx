'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../lib/api';
import { Task, TaskStatus } from '../../../types';
import {
  CheckCircle2,
  Clock,
  Flame,
  AlertTriangle,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { PriorityBadge, StatusBadge, TaskHealthBadge } from '../../../components/ui/Badge';
import { TaskDetailDrawer } from '../../../components/tasks/TaskDetailDrawer';
import { QuickUpdateModal } from '../../../components/tasks/QuickUpdateModal';

export default function MyTasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statuses, setStatuses] = useState<TaskStatus[]>([]);
  const [activeSection, setActiveSection] = useState<'all' | 'today' | 'overdue' | 'in_progress' | 'blocked' | 'completed'>('all');
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [updateModalTask, setUpdateModalTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadTasks = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [allTasks, meta] = await Promise.all([
        api.getTasks({ user_id: user.id }),
        api.getMetadata().catch(() => ({})),
      ]);
      setTasks(allTasks);
      if (meta.statuses) setStatuses(meta.statuses);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [user]);

  const filteredTasks = tasks.filter((t) => {
    if (activeSection === 'today') return t.is_due_today;
    if (activeSection === 'overdue') return t.is_overdue;
    if (activeSection === 'in_progress') return t.status?.status_type === 'in_progress';
    if (activeSection === 'blocked') return t.status?.name === 'Blocked' || !!t.blocker;
    if (activeSection === 'completed') return t.status?.status_type === 'completed';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">My Assigned Tasks</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Your personal task workload for <span className="font-semibold text-slate-700">{user?.full_name}</span>
        </p>
      </div>

      {/* Quick Section Tabs */}
      <div className="flex flex-wrap gap-2 text-xs">
        {[
          { id: 'all', label: `All Tasks (${tasks.length})` },
          { id: 'today', label: `Due Today (${tasks.filter((t) => t.is_due_today).length})` },
          { id: 'overdue', label: `Overdue (${tasks.filter((t) => t.is_overdue).length})` },
          { id: 'in_progress', label: `In Progress (${tasks.filter((t) => t.status?.status_type === 'in_progress').length})` },
          { id: 'blocked', label: `Blocked (${tasks.filter((t) => t.status?.name === 'Blocked' || !!t.blocker).length})` },
          { id: 'completed', label: `Completed (${tasks.filter((t) => t.status?.status_type === 'completed').length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all ${
              activeSection === tab.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200 text-xs">
            No tasks in this category.
          </div>
        ) : (
          filteredTasks.map((t) => (
            <div
              key={t.id}
              className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-600">{t.task_code}</span>
                  <StatusBadge status={t.status?.name} />
                  <PriorityBadge priority={t.priority?.name} />
                  <TaskHealthBadge health={t.health} score={t.health_score} />
                  {t.is_overdue && (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Flame className="w-3 h-3" /> {t.overdue_days}d Overdue
                    </span>
                  )}
                </div>

                <h3
                  onClick={() => setActiveTask(t)}
                  className="font-bold text-slate-900 text-sm hover:text-blue-600 cursor-pointer truncate"
                >
                  {t.title}
                </h3>

                <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                  <span>Team: {t.team?.name || 'General'}</span>
                  <span>•</span>
                  <span>Due: {t.due_date || 'No deadline'}</span>
                  <span>•</span>
                  <span>Progress: {t.progress_percentage}%</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setUpdateModalTask(t)}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold rounded-xl transition-colors flex items-center gap-1"
                >
                  <Clock className="w-3.5 h-3.5" /> Quick Update
                </button>
                <button
                  onClick={() => setActiveTask(t)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
                >
                  View Details
                </button>
                <Link
                  href={`/tasks/${t.task_code}`}
                  className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      <TaskDetailDrawer
        task={activeTask}
        isOpen={!!activeTask}
        onClose={() => setActiveTask(null)}
        onTaskUpdated={() => loadTasks()}
        statuses={statuses}
      />

      <QuickUpdateModal
        task={updateModalTask}
        isOpen={!!updateModalTask}
        onClose={() => setUpdateModalTask(null)}
        onSuccess={() => loadTasks()}
        statuses={statuses}
      />
    </div>
  );
}
