'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import { api } from '../../../../lib/api';
import { Task, TaskStatus, TaskComment } from '../../../../types';
import {
  ArrowLeft,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  MessageSquare,
  FileText,
  Activity,
  CheckSquare,
  Share2,
  Trash2,
  Copy,
  Flame,
  Plus,
  Send,
  Link as LinkIcon,
  User,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { PriorityBadge, StatusBadge, TaskHealthBadge } from '../../../../components/ui/Badge';
import { QuickUpdateModal } from '../../../../components/tasks/QuickUpdateModal';
import { BlockerModal } from '../../../../components/tasks/BlockerModal';

export default function TaskDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, role } = useAuth();

  const [task, setTask] = useState<Task | null>(null);
  const [statuses, setStatuses] = useState<TaskStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'updates' | 'comments' | 'subtasks' | 'checklists' | 'activity'>('updates');

  // Modals
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isBlockerModalOpen, setIsBlockerModalOpen] = useState(false);

  // New Comment State
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // AI Summary State
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Approval state
  const [approvalNotes, setApprovalNotes] = useState('');
  const [showApprovalBox, setShowApprovalBox] = useState(false);

  const fetchTask = async () => {
    setIsLoading(true);
    try {
      const [taskData, meta] = await Promise.all([
        api.getTask(id as string),
        api.getMetadata().catch(() => ({})),
      ]);
      setTask(taskData);
      if (meta.statuses) setStatuses(meta.statuses);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
  }, [id]);

  const handleToggleChecklist = async (itemId: string, current: boolean) => {
    if (!task) return;
    try {
      await api.toggleChecklist(itemId, !current);
      fetchTask();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      await api.addComment(task.id, newComment);
      setNewComment('');
      fetchTask();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleResolveBlocker = async () => {
    if (!task) return;
    try {
      await api.resolveBlocker(task.id);
      fetchTask();
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateAiSummary = async () => {
    if (!task) return;
    setIsLoadingAi(true);
    try {
      const summary = await api.getAISummary(task.id);
      setAiSummary(summary);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!task) return;
    try {
      await api.submitForApproval(task.id);
      fetchTask();
    } catch (e) {
      console.error(e);
    }
  };

  const handleApprove = async () => {
    if (!task) return;
    try {
      await api.approveTask(task.id, approvalNotes);
      setShowApprovalBox(false);
      fetchTask();
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async () => {
    if (!task || !approvalNotes.trim()) {
      alert('Please specify the required adjustments before requesting revisions.');
      return;
    }
    try {
      await api.rejectTask(task.id, approvalNotes);
      setShowApprovalBox(false);
      fetchTask();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDuplicate = async () => {
    if (!task) return;
    try {
      const copy = await api.duplicateTask(task.id);
      router.push(`/tasks/${copy.task_code}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    if (!task || !confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.deleteTask(task.id);
      router.push('/tasks');
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-slate-400 text-xs">
        Loading task operational details...
      </div>
    );
  }

  if (!task) {
    return (
      <div className="py-24 text-center space-y-3">
        <h2 className="text-base font-bold text-slate-800">Task Not Found</h2>
        <Link href="/tasks" className="text-xs text-blue-600 hover:underline">
          Return to All Tasks
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/tasks"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Tasks List
        </Link>

        {/* Actions bar */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateAiSummary}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" /> {isLoadingAi ? 'Analyzing...' : 'AI Operational Summary'}
          </button>
          <button
            onClick={handleDuplicate}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            title="Duplicate Task"
          >
            <Copy className="w-4 h-4" />
          </button>
          {role !== 'Team Member' && (
            <button
              onClick={handleDelete}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              title="Delete Task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* AI Summary Banner if generated */}
      {aiSummary && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl text-xs space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2 font-bold text-purple-900">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>AI Operational Synthesis</span>
          </div>
          <p className="text-purple-800 leading-relaxed">{aiSummary.summary}</p>
          <p className="text-purple-900 font-semibold pt-1">
            Recommended Next Action: <span className="font-normal text-purple-800">{aiSummary.recommendedAction}</span>
          </p>
        </div>
      )}

      {/* Main Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
        {/* Code & Badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-mono text-sm font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
            {task.task_code}
          </span>
          <StatusBadge status={task.status?.name} />
          <PriorityBadge priority={task.priority?.name} />
          <TaskHealthBadge health={task.health} score={task.health_score} />

          {task.is_overdue && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" /> {task.overdue_days} Days Overdue
            </span>
          )}
          {task.is_due_today && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Due Today
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
          {task.title}
        </h1>

        {/* Quick Action Ribbon */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          <button
            onClick={() => setIsUpdateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
          >
            <Clock className="w-3.5 h-3.5" /> Add Daily Update
          </button>

          {task.blocker ? (
            <button
              onClick={handleResolveBlocker}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Resolve Blocker
            </button>
          ) : (
            <button
              onClick={() => setIsBlockerModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5" /> Flag as Blocked
            </button>
          )}

          {/* Approval Action */}
          {task.requires_approval && (
            <>
              {task.approval_status === 'none' && (
                <button
                  onClick={handleSubmitForApproval}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors"
                >
                  Submit for Approval
                </button>
              )}
              {task.approval_status === 'pending' && role !== 'Team Member' && (
                <button
                  onClick={() => setShowApprovalBox(!showApprovalBox)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors"
                >
                  Review & Approve Deliverable
                </button>
              )}
            </>
          )}
        </div>

        {/* Blocker Alert Banner */}
        {task.blocker && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs space-y-1 mt-3">
            <div className="flex items-center justify-between font-bold text-rose-900">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Active Blocker: {task.blocker.blocker_type}
              </span>
              <span className="text-rose-600 text-[11px]">
                Reported {new Date(task.blocker.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-rose-800 leading-relaxed">{task.blocker.blocker_description}</p>
          </div>
        )}

        {/* Manager Review Decision Box */}
        {showApprovalBox && (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl text-xs space-y-3 mt-3 animate-in fade-in">
            <h4 className="font-bold text-purple-900">Manager Deliverable Review</h4>
            <textarea
              rows={2}
              placeholder="Enter review feedback, notes, or required revisions..."
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              className="w-full text-xs p-2.5 border border-purple-200 rounded-xl bg-white focus:ring-2 focus:ring-purple-500"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowApprovalBox(false)}
                className="px-3 py-1.5 text-slate-600 hover:bg-purple-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-1.5 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
              >
                Request Revisions
              </button>
              <button
                onClick={handleApprove}
                className="px-4 py-1.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
              >
                Approve as Completed
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Description, Subtasks, Checklists, Dependencies */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Operational Scope & Description
            </h3>
            <div
              className="text-xs text-slate-700 leading-relaxed prose prose-xs max-w-none"
              dangerouslySetInnerHTML={{
                __html: task.description || '<p className="italic text-slate-400">No description provided.</p>',
              }}
            />
          </div>

          {/* Dependencies Alert Banner (Section 13) */}
          {task.dependencies && task.dependencies.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-blue-600" /> Predecessor Dependencies
              </h3>
              <div className="space-y-2">
                {task.dependencies.map((dep) => (
                  <div
                    key={dep.id}
                    className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                      dep.depends_on_is_completed
                        ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                        : 'bg-amber-50/50 border-amber-200 text-amber-900'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">
                        Depends on: [{dep.depends_on_task_code}] {dep.depends_on_task_title}
                      </div>
                      <div className="text-[11px] opacity-75">
                        Status: {dep.depends_on_task_status}
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        dep.depends_on_is_completed
                          ? 'bg-emerald-200 text-emerald-800'
                          : 'bg-amber-200 text-amber-800'
                      }`}
                    >
                      {dep.depends_on_is_completed ? 'Predecessor Resolved' : 'Waiting for Dependency'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabs: Updates, Comments, Subtasks, Activity History */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex border-b border-slate-100 gap-4 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('updates')}
                className={`pb-3 transition-colors ${
                  activeTab === 'updates' ? 'border-b-2 border-blue-600 text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                Updates ({task.updates?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`pb-3 transition-colors ${
                  activeTab === 'comments' ? 'border-b-2 border-blue-600 text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                Comments ({task.comments?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('subtasks')}
                className={`pb-3 transition-colors ${
                  activeTab === 'subtasks' ? 'border-b-2 border-blue-600 text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                Subtasks ({task.subtasks?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('checklists')}
                className={`pb-3 transition-colors ${
                  activeTab === 'checklists' ? 'border-b-2 border-blue-600 text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                Checklists ({task.checklists?.length || 0})
              </button>
            </div>

            {/* TAB 1: UPDATES */}
            {activeTab === 'updates' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2">
                  <span className="text-xs text-slate-500">Progress log and blocker reports</span>
                  <button
                    onClick={() => setIsUpdateModalOpen(true)}
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    + Add New Update
                  </button>
                </div>

                {task.updates && task.updates.length > 0 ? (
                  task.updates.map((up) => (
                    <div key={up.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 text-xs space-y-1.5">
                      <div className="flex justify-between items-center text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-800">
                          {up.user?.full_name || 'Team Member'}
                        </span>
                        <span>{new Date(up.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-800 leading-relaxed font-medium">{up.update_text}</p>
                      <div className="flex flex-wrap gap-3 pt-1 text-[11px]">
                        <span className="font-bold text-blue-600">Progress: {up.progress_percentage}%</span>
                        {up.next_step && <span className="text-slate-600">Next: {up.next_step}</span>}
                        {up.blocker_text && <span className="text-rose-600 font-semibold">Blocker: {up.blocker_text}</span>}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-6 text-center italic">No updates recorded yet.</p>
                )}
              </div>
            )}

            {/* TAB 2: COMMENTS */}
            {activeTab === 'comments' && (
              <div className="space-y-4">
                <form onSubmit={handleAddComment} className="space-y-2">
                  <textarea
                    rows={2}
                    placeholder="Write a comment or mention @team_member..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingComment}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" /> Post Comment
                    </button>
                  </div>
                </form>

                <div className="space-y-3 pt-2">
                  {task.comments && task.comments.length > 0 ? (
                    task.comments.map((cm) => (
                      <div key={cm.id} className="p-3.5 rounded-2xl border border-slate-100 bg-white text-xs space-y-1">
                        <div className="flex justify-between items-center text-[11px] text-slate-400">
                          <span className="font-semibold text-slate-800">{cm.user?.full_name || 'Contributor'}</span>
                          <span>{new Date(cm.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed">{cm.comment_text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-6 text-center italic">No comments posted yet.</p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: SUBTASKS */}
            {activeTab === 'subtasks' && (
              <div className="space-y-2">
                {task.subtasks && task.subtasks.length > 0 ? (
                  task.subtasks.map((st) => (
                    <div key={st.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <div>
                        <div className="font-semibold text-slate-800">{st.title}</div>
                        <div className="text-[11px] text-slate-400">
                          Priority: {st.priority} • Progress: {st.progress_percentage}%
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${st.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                        {st.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-6 text-center italic">No subtasks defined.</p>
                )}
              </div>
            )}

            {/* TAB 4: CHECKLISTS */}
            {activeTab === 'checklists' && (
              <div className="space-y-2">
                {task.checklists && task.checklists.length > 0 ? (
                  task.checklists.map((cl) => (
                    <label key={cl.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cl.is_completed}
                        onChange={() => handleToggleChecklist(cl.id, cl.is_completed)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span className={cl.is_completed ? 'line-through text-slate-400' : 'font-medium text-slate-800'}>
                        {cl.title}
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-6 text-center italic">No checklist items defined.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Metadata Sidebar */}
        <div className="space-y-6">
          {/* Progress Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 uppercase tracking-wider">Progress</span>
              <span className="font-bold text-blue-600 text-sm">{task.progress_percentage}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  task.progress_percentage === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                }`}
                style={{ width: `${task.progress_percentage}%` }}
              />
            </div>
          </div>

          {/* Key Properties Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4 text-xs">
            <h3 className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">
              Task Attributes
            </h3>

            <div>
              <span className="text-slate-400 block mb-0.5">Assigned Team</span>
              <span className="font-semibold text-slate-900">{task.team?.name || 'Unassigned'}</span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Department</span>
              <span className="font-semibold text-slate-900">{task.department || 'Education & Operations'}</span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Category</span>
              <span className="font-semibold text-slate-900">{task.category?.name || 'Technical'}</span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Due Date & Time</span>
              <span className="font-semibold text-slate-900">
                {task.due_date ? `${task.due_date} ${task.due_time || ''}` : 'No deadline'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Estimated Effort</span>
              <span className="font-semibold text-slate-900">{task.estimated_effort_hours || 0} Hours</span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Created By</span>
              <span className="font-semibold text-slate-900">{task.creator?.full_name || 'System'}</span>
            </div>
          </div>

          {/* Assignees Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">
              Assigned Personnel
            </h3>
            <div className="space-y-2">
              {(task.assignees || []).map((a) => (
                <div key={a.id} className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <img
                    src={a.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50'}
                    alt={a.full_name}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold text-slate-900">{a.full_name}</div>
                    <div className="text-[10px] text-slate-400">{a.job_title || a.role_name}</div>
                  </div>
                </div>
              ))}
              {(task.assignees || []).length === 0 && (
                <p className="text-xs text-slate-400 italic">No assigned personnel</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <QuickUpdateModal
        task={task}
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        onSuccess={() => fetchTask()}
        statuses={statuses}
      />

      <BlockerModal
        task={task}
        isOpen={isBlockerModalOpen}
        onClose={() => setIsBlockerModalOpen(false)}
        onSuccess={() => fetchTask()}
      />
    </div>
  );
}
