import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Task } from '../../types';
import { api } from '../../lib/api';
import { Search, ArrowRight, Tag } from 'lucide-react';
import Link from 'next/link';
import { StatusBadge, PriorityBadge } from '../ui/Badge';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Task[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const tasks = await api.getTasks({ search: query.trim() });
        setResults(tasks);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Global Search" maxWidth="xl">
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            autoFocus
            placeholder="Search tasks by ID (TASK-101), title, tags, or team..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
          />
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto space-y-2">
          {isSearching && (
            <p className="text-center text-xs text-slate-400 py-6">Searching tasks...</p>
          )}

          {!isSearching && query && results.length === 0 && (
            <p className="text-center text-xs text-slate-400 py-6">
              No tasks matched &quot;{query}&quot;
            </p>
          )}

          {!isSearching &&
            results.map((task) => (
              <Link
                key={task.id}
                href={`/tasks/${task.task_code}`}
                onClick={onClose}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-colors group text-xs"
              >
                <div className="space-y-1 flex-1 min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-600">{task.task_code}</span>
                    <StatusBadge status={task.status?.name} />
                    <PriorityBadge priority={task.priority?.name} />
                  </div>
                  <h4 className="font-medium text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                    {task.title}
                  </h4>
                  <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                    <span>{task.team?.name || 'General Team'}</span>
                    <span>•</span>
                    <span>{task.due_date ? `Due ${task.due_date}` : 'No deadline'}</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            ))}
        </div>
      </div>
    </Modal>
  );
};
