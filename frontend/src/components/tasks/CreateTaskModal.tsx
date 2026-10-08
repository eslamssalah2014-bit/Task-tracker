import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Task, TaskCategory, TaskPriority, TaskStatus, Team, UserProfile } from '../../types';
import { api } from '../../lib/api';
import { Plus, Trash2 } from 'lucide-react';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newTask: Task) => void;
  users: UserProfile[];
  teams: Team[];
  statuses: TaskStatus[];
  priorities: TaskPriority[];
  categories: TaskCategory[];
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  users,
  teams,
  statuses,
  priorities,
  categories,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [teamId, setTeamId] = useState('');
  const [priorityId, setPriorityId] = useState(priorities[1]?.id || 'p2'); // Medium
  const [statusId, setStatusId] = useState(statuses[0]?.id || 's1'); // Not Started
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'c1');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [estimatedEffort, setEstimatedEffort] = useState<number>(6);
  const [requiresApproval, setRequiresApproval] = useState(false);

  // Subtasks & Checklists
  const [subtasks, setSubtasks] = useState<Array<{ title: string; priority: string }>>([]);
  const [checklists, setChecklists] = useState<Array<{ title: string }>>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newChecklistTitle, setNewChecklistTitle] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([...subtasks, { title: newSubtaskTitle.trim(), priority: 'Medium' }]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const handleAddChecklist = () => {
    if (!newChecklistTitle.trim()) return;
    setChecklists([...checklists, { title: newChecklistTitle.trim() }]);
    setNewChecklistTitle('');
  };

  const handleRemoveChecklist = (index: number) => {
    setChecklists(checklists.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task Title is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const newTask = await api.createTask({
        title,
        description,
        team_id: teamId || undefined,
        priority_id: priorityId,
        status_id: statusId,
        category_id: categoryId || undefined,
        assignee_ids: assigneeIds,
        due_date: dueDate || undefined,
        due_time: dueTime || undefined,
        estimated_effort_hours: Number(estimatedEffort),
        requires_approval: requiresApproval,
        subtasks,
        checklists,
      });

      onSuccess(newTask);
      onClose();
      // Reset form
      setTitle('');
      setDescription('');
      setSubtasks([]);
      setChecklists([]);
    } catch (err: any) {
      setError(err.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAssignee = (userId: string) => {
    if (assigneeIds.includes(userId)) {
      setAssigneeIds(assigneeIds.filter((id) => id !== userId));
    } else {
      setAssigneeIds([...assigneeIds, userId]);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Task"
      subtitle="Define operational requirements, assign team members, and configure deadlines"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        {/* Task Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Task Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Finalize Penetration Testing Course Outline"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-sm font-medium border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Task Description & Deliverables
          </label>
          <textarea
            rows={3}
            placeholder="Detailed description, learning objectives, acceptance criteria..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Priority, Status, Category grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
            <select
              value={priorityId}
              onChange={(e) => setPriorityId(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {priorities.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
            <select
              value={statusId}
              onChange={(e) => setStatusId(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Team & Deadline grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Team</label>
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No Team Assigned</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Hours</label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={estimatedEffort}
              onChange={(e) => setEstimatedEffort(Number(e.target.value))}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Assignees selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Assign To Team Members</label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-lg">
            {users.map((u) => {
              const isSelected = assigneeIds.includes(u.id);
              return (
                <button
                  type="button"
                  key={u.id}
                  onClick={() => toggleAssignee(u.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white font-medium shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{u.full_name}</span>
                  <span className="text-[10px] opacity-75">({u.job_title || u.role_name})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Subtasks Section */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Subtasks</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Add subtask title..."
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSubtask();
                }
              }}
              className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleAddSubtask}
              className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
          {subtasks.length > 0 && (
            <div className="space-y-1.5 max-h-28 overflow-y-auto">
              {subtasks.map((st, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-1.5 bg-slate-50 rounded-lg text-xs">
                  <span className="text-slate-800">{st.title}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(i)}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Checklists Section */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Checklist Items</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Add checklist item..."
              value={newChecklistTitle}
              onChange={(e) => setNewChecklistTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddChecklist();
                }
              }}
              className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleAddChecklist}
              className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
          {checklists.length > 0 && (
            <div className="space-y-1.5 max-h-24 overflow-y-auto">
              {checklists.map((cl, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-1.5 bg-slate-50 rounded-lg text-xs">
                  <span className="text-slate-800">☐ {cl.title}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChecklist(i)}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Requires Approval */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="req_approval"
            checked={requiresApproval}
            onChange={(e) => setRequiresApproval(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
          />
          <label htmlFor="req_approval" className="text-xs text-slate-700">
            <strong>Requires Manager Approval:</strong> Team member must submit for review before finalizing
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? 'Creating Task...' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
