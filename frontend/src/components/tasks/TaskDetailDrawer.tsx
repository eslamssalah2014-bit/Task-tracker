import React, { useState } from 'react';
import { Drawer } from '../ui/Drawer';
import { Task, TaskStatus } from '../../types';
import { PriorityBadge, StatusBadge, TaskHealthBadge } from '../ui/Badge';
import { ExternalLink, Clock, User, Calendar, CheckSquare, MessageSquare, AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { QuickUpdateModal } from './QuickUpdateModal';
import { BlockerModal } from './BlockerModal';

interface TaskDetailDrawerProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated: (task: Task) => void;
  statuses: TaskStatus[];
}

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  task,
  isOpen,
  onClose,
  onTaskUpdated,
  statuses,
}) => {
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isBlockerModalOpen, setIsBlockerModalOpen] = useState(false);

  if (!task) return null;

  const handleToggleChecklist = async (itemId: string, currentStatus: boolean) => {
    try {
      await api.toggleChecklist(itemId, !currentStatus);
      if (task.checklists) {
        const updatedChecklists = task.checklists.map((c) =>
          c.id === itemId ? { ...c, is_completed: !currentStatus } : c
        );
        onTaskUpdated({ ...task, checklists: updatedChecklists });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolveBlocker = async () => {
    try {
      const res = await api.resolveBlocker(task.id);
      onTaskUpdated(res);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title={`${task.task_code} - ${task.title}`}
      >
        <div className="space-y-6">
          {/* Header Badges */}
          <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-slate-100">
            <StatusBadge status={task.status?.name} />
            <PriorityBadge priority={task.priority?.name} />
            <TaskHealthBadge health={task.health} score={task.health_score} />
            {task.is_overdue && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                {task.overdue_days}d Overdue
              </span>
            )}
            {task.is_due_today && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                Due Today
              </span>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsUpdateModalOpen(true)}
              className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Clock className="w-3.5 h-3.5" /> Add Update
            </button>
            {task.blocker ? (
              <button
                onClick={handleResolveBlocker}
                className="py-2 px-3 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
              >
                Resolve Blocker
              </button>
            ) : (
              <button
                onClick={() => setIsBlockerModalOpen(true)}
                className="py-2 px-3 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
              >
                Mark Blocked
              </button>
            )}
            <Link
              href={`/tasks/${task.task_code}`}
              className="py-2 px-3 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
            >
              Full Page <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Blocker Alert Banner if present */}
          {task.blocker && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl">
              <div className="flex items-center gap-2 text-rose-800 font-semibold text-xs mb-1">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Active Blocker: {task.blocker.blocker_type}
              </div>
              <p className="text-xs text-rose-700">{task.blocker.blocker_description}</p>
            </div>
          )}

          {/* Progress bar */}
          <div>
            <div className="flex justify-between items-center text-xs text-slate-600 mb-1.5">
              <span className="font-medium">Task Progress</span>
              <span className="font-bold text-slate-900">{task.progress_percentage}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  task.progress_percentage === 100
                    ? 'bg-emerald-500'
                    : task.health === 'Critical'
                    ? 'bg-rose-500'
                    : 'bg-blue-600'
                }`}
                style={{ width: `${task.progress_percentage}%` }}
              />
            </div>
          </div>

          {/* Key Properties Grid */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Team</span>
              <span className="font-semibold text-slate-800">{task.team?.name || 'Unassigned'}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Category</span>
              <span className="font-semibold text-slate-800">{task.category?.name || 'General'}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Due Date</span>
              <span className="font-semibold text-slate-800">
                {task.due_date ? `${task.due_date} (${task.days_remaining}d left)` : 'No deadline'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Estimated Effort</span>
              <span className="font-semibold text-slate-800">{task.estimated_effort_hours || 0} Hours</span>
            </div>
          </div>

          {/* Assignees */}
          <div>
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Assigned Members</h4>
            <div className="flex flex-wrap gap-2">
              {(task.assignees || []).length > 0 ? (
                task.assignees?.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 p-1.5 pr-3 bg-white border border-slate-200 rounded-full text-xs">
                    <img src={a.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50'} alt={a.full_name} className="w-5 h-5 rounded-full object-cover" />
                    <span className="font-medium text-slate-800">{a.full_name}</span>
                  </div>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">No assigned members</span>
              )}
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Description</h4>
              <div
                className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-100 prose prose-xs max-w-none"
                dangerouslySetInnerHTML={{ __html: task.description }}
              />
            </div>
          )}

          {/* Checklists */}
          {task.checklists && task.checklists.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-blue-600" /> Checklist
              </h4>
              <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                {task.checklists.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={c.is_completed}
                      onChange={() => handleToggleChecklist(c.id, c.is_completed)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={c.is_completed ? 'line-through text-slate-400' : ''}>{c.title}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Latest Updates */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Latest Update</h4>
              <button
                onClick={() => setIsUpdateModalOpen(true)}
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                + Add Update
              </button>
            </div>
            {task.updates && task.updates.length > 0 ? (
              <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-xs space-y-1">
                <div className="flex justify-between items-center text-slate-500 text-[11px]">
                  <span>By {task.updates[0].user?.full_name || 'Team Member'}</span>
                  <span>{new Date(task.updates[0].created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-slate-800 font-medium">{task.updates[0].update_text}</p>
                {task.updates[0].next_step && (
                  <p className="text-blue-700 text-[11px]">Next: {task.updates[0].next_step}</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No updates recorded yet.</p>
            )}
          </div>
        </div>
      </Drawer>

      <QuickUpdateModal
        task={task}
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        onSuccess={onTaskUpdated}
        statuses={statuses}
      />

      <BlockerModal
        task={task}
        isOpen={isBlockerModalOpen}
        onClose={() => setIsBlockerModalOpen(false)}
        onSuccess={onTaskUpdated}
      />
    </>
  );
};
