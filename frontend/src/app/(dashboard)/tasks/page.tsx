'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../lib/api';
import { Task, TaskCategory, TaskPriority, TaskStatus, Team, UserProfile } from '../../../types';
import {
  Layers,
  Table as TableIcon,
  Kanban,
  Calendar as CalendarIcon,
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  Download,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { PriorityBadge, StatusBadge, TaskHealthBadge } from '../../../components/ui/Badge';
import { TaskDetailDrawer } from '../../../components/tasks/TaskDetailDrawer';
import { QuickUpdateModal } from '../../../components/tasks/QuickUpdateModal';

type ViewMode = 'table' | 'kanban' | 'calendar';

function TasksPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, role } = useAuth();

  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Metadata
  const [statuses, setStatuses] = useState<TaskStatus[]>([]);
  const [priorities, setPriorities] = useState<TaskPriority[]>([]);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || '');
  const [teamFilter, setTeamFilter] = useState(searchParams.get('team') || '');
  const [assigneeFilter, setAssigneeFilter] = useState(searchParams.get('user_id') || '');
  const isOverdueFilter = searchParams.get('is_overdue') === 'true';
  const isBlockedFilter = searchParams.get('is_blocked') === 'true';
  const noRecentUpdateFilter = searchParams.get('no_recent_update') === 'true';
  const needsApprovalFilter = searchParams.get('needs_approval') === 'true';

  // Selection for bulk actions (Section 45)
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  // Drawer & Quick Update
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [updateModalTask, setUpdateModalTask] = useState<Task | null>(null);

  // Calendar month state
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const data = await api.getTasks({
        search,
        status_id: statusFilter || undefined,
        priority_id: priorityFilter || undefined,
        team_id: teamFilter || undefined,
        user_id: assigneeFilter || undefined,
        is_overdue: isOverdueFilter || undefined,
        is_blocked: isBlockedFilter || undefined,
        no_recent_update: noRecentUpdateFilter || undefined,
        needs_approval: needsApprovalFilter || undefined,
      });
      setTasks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      api.getMetadata().catch(() => ({})),
      api.getTeams().catch(() => []),
      api.getUsers().catch(() => []),
    ]).then(([meta, tm, u]) => {
      if (meta.statuses) setStatuses(meta.statuses);
      if (meta.priorities) setPriorities(meta.priorities);
      if (meta.categories) setCategories(meta.categories);
      setTeams(tm);
      setUsers(u);
    });
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [
    search,
    statusFilter,
    priorityFilter,
    teamFilter,
    assigneeFilter,
    isOverdueFilter,
    isBlockedFilter,
    noRecentUpdateFilter,
    needsApprovalFilter,
  ]);

  // Bulk actions handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedTaskIds(tasks.map((t) => t.id));
    } else {
      setSelectedTaskIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedTaskIds.includes(id)) {
      setSelectedTaskIds(selectedTaskIds.filter((tId) => tId !== id));
    } else {
      setSelectedTaskIds([...selectedTaskIds, id]);
    }
  };

  const handleBulkStatusChange = async (targetStatusId: string) => {
    if (!targetStatusId) return;
    try {
      await Promise.all(selectedTaskIds.map((id) => api.updateTask(id, { status_id: targetStatusId })));
      setSelectedTaskIds([]);
      fetchTasks();
    } catch (e) {
      console.error(e);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedTaskIds.length} tasks?`)) return;
    try {
      await Promise.all(selectedTaskIds.map((id) => api.deleteTask(id)));
      setSelectedTaskIds([]);
      fetchTasks();
    } catch (e) {
      console.error(e);
    }
  };

  // Kanban status move
  const handleMoveKanban = async (taskId: string, targetStatusId: string) => {
    try {
      await api.updateTask(taskId, { status_id: targetStatusId });
      fetchTasks();
    } catch (e) {
      console.error(e);
    }
  };

  // Calendar days generation
  const calendarDays = useMemo(() => {
    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const days = [];

    // Empty lead cells
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, dateStr: null });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, dateStr });
    }

    return days;
  }, [calendarMonth, calendarYear]);

  return (
    <div className="space-y-6">
      {/* Header and View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Task Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor, update, and manage track assignments across teams and deliverables.
          </p>
        </div>

        {/* View Switchers */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" /> Table
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
                viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" /> Kanban
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
                viewMode === 'calendar' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" /> Calendar
            </button>
          </div>

          <a
            href={api.getExportCsvUrl({ team_id: teamFilter, status_id: statusFilter })}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" /> Export CSV
          </a>
        </div>
      </div>

      {/* Filter Toolbar (Section 94) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Priorities</option>
            {priorities.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Team Filter */}
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Teams</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          {/* Assignee Filter */}
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Assignees</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.full_name}</option>
            ))}
          </select>
        </div>

        {/* Quick condition badges */}
        {(isOverdueFilter || isBlockedFilter || noRecentUpdateFilter || needsApprovalFilter) && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-400 font-semibold">Active Filter:</span>
            {isOverdueFilter && (
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-medium">Overdue Only</span>
            )}
            {isBlockedFilter && (
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-medium">Blocked Only</span>
            )}
            {noRecentUpdateFilter && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">No Recent Updates</span>
            )}
            {needsApprovalFilter && (
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-medium">Waiting Approval</span>
            )}
            <Link href="/tasks" className="text-blue-600 hover:underline font-medium text-xs ml-2">
              Clear All Filters
            </Link>
          </div>
        )}
      </div>

      {/* Bulk Actions Floating Bar (Section 45) */}
      {selectedTaskIds.length > 0 && (
        <div className="bg-slate-900 text-white p-3 rounded-2xl flex items-center justify-between text-xs shadow-xl animate-in fade-in duration-150">
          <div className="flex items-center gap-3">
            <span className="font-semibold bg-blue-600 px-2 py-0.5 rounded-full">
              {selectedTaskIds.length} Selected
            </span>
            <span className="text-slate-300">Apply action to selected items:</span>
          </div>

          <div className="flex items-center gap-2">
            <select
              onChange={(e) => handleBulkStatusChange(e.target.value)}
              className="bg-slate-800 text-white border border-slate-700 rounded-xl px-2.5 py-1 text-xs"
            >
              <option value="">Change Status...</option>
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            {role !== 'Team Member' && (
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            )}

            <button
              onClick={() => setSelectedTaskIds([])}
              className="text-slate-400 hover:text-white px-2 py-1"
            >
              Deselect
            </button>
          </div>
        </div>
      )}

      {/* VIEW 1: TABLE VIEW (Section 20) */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={selectedTaskIds.length === tasks.length && tasks.length > 0}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="py-3 px-4">Task ID</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Assignees</th>
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4">Deadline</th>
                  <th className="py-3 px-4">Health</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400">
                      No tasks matched your selected criteria.
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => (
                    <tr
                      key={task.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        task.is_pinned ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={selectedTaskIds.includes(task.id)}
                          onChange={() => handleToggleSelect(task.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                        <button
                          onClick={() => setActiveTask(task)}
                          className="hover:underline text-left"
                        >
                          {task.task_code}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <button
                          onClick={() => setActiveTask(task)}
                          className="font-medium text-slate-900 hover:text-blue-600 text-left line-clamp-1"
                        >
                          {task.title}
                        </button>
                        {task.blocker && (
                          <div className="text-[10px] text-rose-600 font-semibold flex items-center gap-1 mt-0.5">
                            <AlertTriangle className="w-3 h-3" /> Blocked: {task.blocker.blocker_type}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex -space-x-1.5 overflow-hidden">
                          {(task.assignees || []).map((a) => (
                            <img
                              key={a.id}
                              src={a.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50'}
                              alt={a.full_name}
                              title={a.full_name}
                              className="w-6 h-6 rounded-full border-2 border-white object-cover"
                            />
                          ))}
                          {(task.assignees || []).length === 0 && (
                            <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">{task.team?.name || 'General'}</td>

                      <td className="py-3.5 px-4">
                        <PriorityBadge priority={task.priority?.name} />
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={task.status?.name} />
                      </td>

                      <td className="py-3.5 px-4 w-28">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${task.progress_percentage}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] text-slate-500 font-medium">
                            {task.progress_percentage}%
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {task.is_overdue ? (
                          <span className="text-rose-600 font-semibold flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5" /> {task.overdue_days}d Overdue
                          </span>
                        ) : task.is_due_today ? (
                          <span className="text-amber-600 font-semibold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Due Today
                          </span>
                        ) : task.due_date ? (
                          <span className="text-slate-600">{task.days_remaining}d left</span>
                        ) : (
                          <span className="text-slate-400">None</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <TaskHealthBadge health={task.health} score={task.health_score} />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setUpdateModalTask(task)}
                            className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Quick Update"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setActiveTask(task)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Side Drawer"
                          >
                            <Layers className="w-4 h-4" />
                          </button>
                          <Link
                            href={`/tasks/${task.task_code}`}
                            className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Full Page"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: KANBAN BOARD (Section 21) */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-6">
          {statuses.map((statusCol) => {
            const colTasks = tasks.filter((t) => t.status_id === statusCol.id);

            return (
              <div
                key={statusCol.id}
                className="bg-slate-100/70 rounded-2xl p-3 border border-slate-200/60 flex flex-col min-w-[240px] max-h-[75vh]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: statusCol.color }}
                    />
                    <h3 className="font-bold text-xs text-slate-800">{statusCol.name}</h3>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                    {colTasks.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
                  {colTasks.map((t) => (
                    <div
                      key={t.id}
                      className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group text-xs space-y-2"
                      onClick={() => setActiveTask(t)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-blue-600">{t.task_code}</span>
                        <PriorityBadge priority={t.priority?.name} />
                      </div>

                      <h4 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {t.title}
                      </h4>

                      {/* Blocker Pill */}
                      {t.blocker && (
                        <div className="text-[10px] text-rose-700 font-semibold bg-rose-50 border border-rose-200 p-1.5 rounded-lg">
                          🚨 {t.blocker.blocker_type}
                        </div>
                      )}

                      {/* Progress bar */}
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full" style={{ width: `${t.progress_percentage}%` }} />
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                        <span>{t.due_date ? `${t.days_remaining}d left` : 'No date'}</span>
                        <div className="flex -space-x-1">
                          {(t.assignees || []).map((a) => (
                            <img
                              key={a.id}
                              src={a.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50'}
                              alt={a.full_name}
                              className="w-5 h-5 rounded-full border border-white object-cover"
                            />
                          ))}
                        </div>
                      </div>

                      {/* Quick Move Dropdown */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="pt-1 flex items-center justify-between"
                      >
                        <select
                          value={t.status_id}
                          onChange={(e) => handleMoveKanban(t.id, e.target.value)}
                          className="w-full text-[10px] bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 text-slate-600 hover:bg-white"
                        >
                          {statuses.map((s) => (
                            <option key={s.id} value={s.id}>
                              Move to: {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}

                  {colTasks.length === 0 && (
                    <div className="py-8 text-center text-slate-400 text-[11px] italic">
                      No tasks in this lane
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 3: CALENDAR VIEW (Section 22) */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">
              {new Date(calendarYear, calendarMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (calendarMonth === 0) {
                    setCalendarMonth(11);
                    setCalendarYear(calendarYear - 1);
                  } else {
                    setCalendarMonth(calendarMonth - 1);
                  }
                }}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (calendarMonth === 11) {
                    setCalendarMonth(0);
                    setCalendarYear(calendarYear + 1);
                  } else {
                    setCalendarMonth(calendarMonth + 1);
                  }
                }}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-2xl overflow-hidden border border-slate-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="bg-slate-50 p-2 text-center text-xs font-semibold text-slate-500 uppercase">
                {d}
              </div>
            ))}
            {calendarDays.map((cell, idx) => {
              const dayTasks = cell.dateStr ? tasks.filter((t) => t.due_date === cell.dateStr) : [];

              return (
                <div key={idx} className="bg-white min-h-[110px] p-2 flex flex-col justify-between">
                  {cell.day && (
                    <>
                      <span className="text-xs font-semibold text-slate-500">{cell.day}</span>
                      <div className="space-y-1 my-1 overflow-y-auto max-h-20">
                        {dayTasks.map((t) => (
                          <div
                            key={t.id}
                            onClick={() => setActiveTask(t)}
                            className="p-1 rounded bg-blue-50 border border-blue-200 text-[10px] font-medium text-blue-800 truncate cursor-pointer hover:bg-blue-100"
                            title={t.title}
                          >
                            {t.task_code}: {t.title}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Task Drawer */}
      <TaskDetailDrawer
        task={activeTask}
        isOpen={!!activeTask}
        onClose={() => setActiveTask(null)}
        onTaskUpdated={(t) => {
          setActiveTask(t);
          fetchTasks();
        }}
        statuses={statuses}
      />

      {/* Quick Update Modal */}
      <QuickUpdateModal
        task={updateModalTask}
        isOpen={!!updateModalTask}
        onClose={() => setUpdateModalTask(null)}
        onSuccess={() => {
          setUpdateModalTask(null);
          fetchTasks();
        }}
        statuses={statuses}
      />
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-slate-400 text-xs">Loading operational tasks board...</div>}>
      <TasksPageContent />
    </Suspense>
  );
}

