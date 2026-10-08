'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../lib/api';
import { Task, WorkloadItem, OperationalInsight } from '../../../types';
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Flame,
  ArrowRight,
  TrendingUp,
  User,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { PriorityBadge, StatusBadge, TaskHealthBadge } from '../../../components/ui/Badge';
import { TaskDetailDrawer } from '../../../components/tasks/TaskDetailDrawer';

export default function ManagerCommandCenterPage() {
  const { user, role } = useAuth();
  const [data, setData] = useState<{
    attention?: {
      overdue: Task[];
      blocked: Task[];
      waiting_approval: Task[];
      no_recent_updates: Task[];
      critical_risk: Task[];
      due_today: Task[];
    };
    workloads?: WorkloadItem[];
    insights?: OperationalInsight[];
    weeklySummary?: any;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [statuses, setStatuses] = useState<any[]>([]);

  // Approval modal state
  const [approvalNotes, setApprovalNotes] = useState('');
  const [activeApprovalTaskId, setActiveApprovalTaskId] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [insightsData, meta] = await Promise.all([
        api.getManagerInsights(),
        api.getMetadata().catch(() => ({})),
      ]);
      setData(insightsData);
      if (meta.statuses) setStatuses(meta.statuses);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (taskId: string) => {
    setIsApproving(true);
    try {
      await api.approveTask(taskId, approvalNotes);
      setActiveApprovalTaskId(null);
      setApprovalNotes('');
      loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async (taskId: string) => {
    if (!approvalNotes.trim()) {
      alert('Please provide notes explaining what changes are required before rejecting.');
      return;
    }
    setIsApproving(true);
    try {
      await api.rejectTask(taskId, approvalNotes);
      setActiveApprovalTaskId(null);
      setApprovalNotes('');
      loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-xs tracking-wider uppercase">
            <ShieldAlert className="w-4 h-4" /> Manager Operations & Accountability Center
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Command Center & Insights</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Identify operational friction, unblock stalled tasks, and balance team workloads.
          </p>
        </div>

        {/* Weekly Stats mini summary */}
        {data?.weeklySummary && (
          <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Weekly Completion</span>
              <span className="font-bold text-slate-900 text-sm">{data.weeklySummary.completion_rate_percentage}%</span>
              <span className="text-emerald-600 text-[10px] font-semibold ml-1">+{data.weeklySummary.completion_delta_percentage}%</span>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Overdue Tasks</span>
              <span className="font-bold text-rose-600 text-sm">{data.weeklySummary.tasks_overdue}</span>
              <span className="text-emerald-600 text-[10px] font-semibold ml-1">{data.weeklySummary.overdue_delta_percentage}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Automated Smart Insights Banners (Section 40) */}
      {data?.insights && data.insights.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Automated Operational Insights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.insights.map((ins) => (
              <div
                key={ins.id}
                className={`p-4 rounded-2xl border text-xs space-y-1 transition-all ${
                  ins.type === 'danger'
                    ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                    : ins.type === 'warning'
                    ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                    : 'bg-blue-50/70 border-blue-200 text-blue-900'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span>{ins.title}</span>
                  {ins.count !== undefined && (
                    <span className="px-2 py-0.5 rounded-full bg-white/80 font-mono text-[10px]">
                      {ins.count}
                    </span>
                  )}
                </div>
                <p className="leading-relaxed opacity-90">{ins.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 27: "Needs Your Attention" Grid */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Tasks Needing Immediate Attention
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overdue Tasks List */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900">Overdue Tasks ({data?.attention?.overdue.length || 0})</h3>
              </div>
              <Link href="/tasks?is_overdue=true" className="text-xs text-blue-600 hover:underline">
                View All
              </Link>
            </div>

            {data?.attention?.overdue && data.attention.overdue.length > 0 ? (
              <div className="space-y-2">
                {data.attention.overdue.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTask(t)}
                    className="p-3 rounded-xl border border-rose-100 bg-rose-50/30 hover:bg-rose-50 hover:border-rose-300 transition-all cursor-pointer text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800">{t.task_code}</span>
                        <PriorityBadge priority={t.priority?.name} />
                        <span className="text-[11px] font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                          {t.overdue_days}d Overdue
                        </span>
                      </div>
                      <h4 className="font-semibold text-slate-900 mt-1">{t.title}</h4>
                      <p className="text-slate-500 text-[11px]">
                        Assignee: {(t.assignees || []).map((a) => a.full_name).join(', ') || 'Unassigned'}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center italic">No overdue tasks. All deadlines on track!</p>
            )}
          </div>

          {/* Blocked Tasks List */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900">Active Blockers ({data?.attention?.blocked.length || 0})</h3>
              </div>
              <Link href="/tasks?is_blocked=true" className="text-xs text-blue-600 hover:underline">
                View All
              </Link>
            </div>

            {data?.attention?.blocked && data.attention.blocked.length > 0 ? (
              <div className="space-y-2">
                {data.attention.blocked.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTask(t)}
                    className="p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-slate-50 transition-all cursor-pointer text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-800">{t.task_code}</span>
                      <span className="text-[11px] font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                        {t.blocker?.blocker_type || 'Blocked'}
                      </span>
                    </div>
                    <h4 className="font-semibold text-slate-900">{t.title}</h4>
                    <p className="text-slate-600 text-[11px] line-clamp-1">
                      {t.blocker?.blocker_description}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center italic">No blocked tasks currently.</p>
            )}
          </div>

          {/* Tasks Waiting for Manager Approval (Section 30) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Waiting for Your Review ({data?.attention?.waiting_approval.length || 0})
                </h3>
              </div>
            </div>

            {data?.attention?.waiting_approval && data.attention.waiting_approval.length > 0 ? (
              <div className="space-y-3">
                {data.attention.waiting_approval.map((t) => (
                  <div key={t.id} className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/20 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-purple-900">{t.task_code}</span>
                      <StatusBadge status="Under Review" />
                    </div>
                    <h4 className="font-semibold text-slate-900">{t.title}</h4>
                    <p className="text-slate-500 text-[11px]">
                      Submitted by: {(t.assignees || []).map((a) => a.full_name).join(', ') || 'Team Member'}
                    </p>

                    {/* Quick review action inputs */}
                    {activeApprovalTaskId === t.id ? (
                      <div className="pt-2 border-t border-purple-100 space-y-2">
                        <textarea
                          rows={2}
                          placeholder="Feedback or reason for approval / changes..."
                          value={approvalNotes}
                          onChange={(e) => setApprovalNotes(e.target.value)}
                          className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setActiveApprovalTaskId(null)}
                            className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleReject(t.id)}
                            disabled={isApproving}
                            className="px-3 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                          >
                            Request Changes
                          </button>
                          <button
                            onClick={() => handleApprove(t.id)}
                            disabled={isApproving}
                            className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                          >
                            Approve
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          onClick={() => setSelectedTask(t)}
                          className="px-3 py-1 text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-[11px] font-medium"
                        >
                          Inspect Deliverables
                        </button>
                        <button
                          onClick={() => setActiveApprovalTaskId(t.id)}
                          className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-[11px] font-semibold"
                        >
                          Review & Decide
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center italic">No tasks currently waiting for sign-off.</p>
            )}
          </div>

          {/* Stalled Updates (>3 days) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  No Updates in &gt; 3 Days ({data?.attention?.no_recent_updates.length || 0})
                </h3>
              </div>
            </div>

            {data?.attention?.no_recent_updates && data.attention.no_recent_updates.length > 0 ? (
              <div className="space-y-2">
                {data.attention.no_recent_updates.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTask(t)}
                    className="p-3 rounded-xl border border-amber-200 bg-amber-50/20 hover:bg-amber-50 transition-all cursor-pointer text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800">{t.task_code}</span>
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          {t.days_since_last_update}d without update
                        </span>
                      </div>
                      <h4 className="font-semibold text-slate-900 mt-1">{t.title}</h4>
                      <p className="text-slate-500 text-[11px]">
                        {(t.assignees || []).map((a) => a.full_name).join(', ') || 'Unassigned'}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center italic">All tasks have received fresh updates.</p>
            )}
          </div>
        </div>
      </div>

      {/* Section 28: Workload Analysis Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Team Workload & Capacity Analysis</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational indicators based on active task count, priority weighting, and remaining effort hours
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Team Member</th>
                <th className="py-3 px-4">Active Tasks</th>
                <th className="py-3 px-4">Urgent Tasks</th>
                <th className="py-3 px-4">Overdue Tasks</th>
                <th className="py-3 px-4">Blocked Tasks</th>
                <th className="py-3 px-4">Estimated Remaining</th>
                <th className="py-3 px-4">Workload Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.workloads?.map((w) => (
                <tr key={w.user.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-900 flex items-center gap-2.5">
                    <img
                      src={w.user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50'}
                      alt={w.user.full_name}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-semibold">{w.user.full_name}</div>
                      <div className="text-[10px] text-slate-400">{w.user.job_title || w.user.department}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-800">{w.active_tasks}</td>
                  <td className="py-3 px-4 text-orange-600 font-semibold">{w.urgent_tasks}</td>
                  <td className="py-3 px-4 text-rose-600 font-semibold">{w.overdue_tasks}</td>
                  <td className="py-3 px-4 text-slate-600">{w.blocked_tasks}</td>
                  <td className="py-3 px-4 font-mono text-slate-700">{w.estimated_remaining_hours} hrs</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        w.workload_level === 'Overloaded'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : w.workload_level === 'High'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : w.workload_level === 'Normal'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {w.workload_level}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Drawer */}
      <TaskDetailDrawer
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onTaskUpdated={(t) => {
          setSelectedTask(t);
          loadData();
        }}
        statuses={statuses}
      />
    </div>
  );
}
