import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Task, TaskStatus } from '../../types';
import { api } from '../../lib/api';

interface QuickUpdateModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedTask: Task) => void;
  statuses: TaskStatus[];
}

export const QuickUpdateModal: React.FC<QuickUpdateModalProps> = ({
  task,
  isOpen,
  onClose,
  onSuccess,
  statuses,
}) => {
  const [updateText, setUpdateText] = useState('');
  const [progress, setProgress] = useState(task?.progress_percentage || 0);
  const [statusId, setStatusId] = useState(task?.status_id || '');
  const [nextStep, setNextStep] = useState('');
  const [blockerText, setBlockerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (task) {
      setProgress(task.progress_percentage || 0);
      setStatusId(task.status_id || '');
      setUpdateText('');
      setNextStep('');
      setBlockerText('');
      setError(null);
    }
  }, [task]);

  if (!task) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateText.trim()) {
      setError('Please provide a brief description of work accomplished.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.addTaskUpdate(task.id, {
        updateText,
        progressPercentage: progress,
        statusId: statusId || undefined,
        nextStep: nextStep || undefined,
        blockerText: blockerText || undefined,
      });
      onSuccess(res);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit update');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Task Progress Update"
      subtitle={`[${task.task_code}] ${task.title}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        {/* Progress % */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-slate-700">Progress Percentage</label>
            <span className="text-xs font-bold text-blue-600">{progress}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Current Status</label>
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

        {/* Update Text */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            What was completed today? <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={3}
            placeholder="e.g. Conducted review with track coordinators and locked 80% of lab content..."
            value={updateText}
            onChange={(e) => setUpdateText(e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Next Step */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Next Step</label>
          <input
            type="text"
            placeholder="e.g. Review remaining chapters with QA lead tomorrow..."
            value={nextStep}
            onChange={(e) => setNextStep(e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Blocker note (optional) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Any Blockers or Impairments? (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Waiting for cloud server resource expansion..."
            value={blockerText}
            onChange={(e) => setBlockerText(e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-rose-800 bg-rose-50/50 border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
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
            className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Post Update'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
