import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { BlockerType, Task } from '../../types';
import { api } from '../../lib/api';
import { AlertCircle } from 'lucide-react';

interface BlockerModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedTask: Task) => void;
}

const BLOCKER_TYPES: BlockerType[] = [
  'Waiting for Approval',
  'Waiting for Another Team',
  'Technical Issue',
  'Missing Information',
  'Missing Resources',
  'Client Dependency',
  'Management Decision',
  'Other',
];

export const BlockerModal: React.FC<BlockerModalProps> = ({
  task,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [blockerType, setBlockerType] = useState<BlockerType>('Waiting for Approval');
  const [description, setDescription] = useState('');
  const [resolutionDate, setResolutionDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!task) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim().length < 5) {
      setError('Please provide a specific description of the impediment.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.markTaskBlocked(task.id, {
        blockerType,
        blockerDescription: description,
        expectedResolutionDate: resolutionDate || undefined,
      });
      onSuccess(res);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to flag task as blocked');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Flag Task as Blocked"
      subtitle={`[${task.task_code}] ${task.title}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
          <p>
            Marking this task as Blocked immediately alerts managers and track coordinators.
            The system tracks how long this task stays blocked to analyze operational friction.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Blocker Category <span className="text-rose-500">*</span>
          </label>
          <select
            value={blockerType}
            onChange={(e) => setBlockerType(e.target.value as BlockerType)}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            {BLOCKER_TYPES.map((bt) => (
              <option key={bt} value={bt}>
                {bt}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Blocker Explanation & Root Cause <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={3}
            placeholder="Describe what is preventing progress, who is involved, and what action is needed..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Expected Resolution Date (Optional)
          </label>
          <input
            type="date"
            value={resolutionDate}
            onChange={(e) => setResolutionDate(e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500"
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
            className="px-4 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? 'Flagging...' : 'Confirm Blocker'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
