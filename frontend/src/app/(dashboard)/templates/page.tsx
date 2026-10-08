'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../lib/api';
import { TaskTemplate } from '../../../types';
import { FileCode, Plus, CheckSquare, Layers, Clock, ArrowRight } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { useRouter } from 'next/navigation';

export default function TemplatesPage() {
  const router = useRouter();
  const { role } = useAuth();
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [effort, setEffort] = useState(8);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const data = await api.getTemplates();
      setTemplates(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleUseTemplate = async (tmpl: TaskTemplate) => {
    try {
      const newTask = await api.createTask({
        title: tmpl.title,
        description: tmpl.description,
        estimated_effort_hours: tmpl.estimated_effort_hours,
        priority_id: tmpl.priority_id || 'p2',
        category_id: tmpl.category_id || undefined,
        subtasks: tmpl.template_subtasks_json?.map((st: any) => ({
          title: st.title,
          priority: st.priority,
        })),
        checklists: tmpl.template_checklist_json?.map((cl: any) => ({
          title: cl.title,
        })),
      });

      router.push(`/tasks/${newTask.task_code}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTemplate({
        title,
        description,
        estimated_effort_hours: Number(effort),
        template_subtasks_json: [{ title: 'Initial preparation', priority: 'Medium' }],
        template_checklist_json: [{ title: 'Initial verification' }],
      });
      setIsCreateOpen(false);
      setTitle('');
      setDescription('');
      loadTemplates();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Task Templates</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Standard operating procedures and reusable task structures for rapid track launching.
          </p>
        </div>

        {role !== 'Team Member' && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Create Template
          </button>
        )}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((tmpl) => (
          <div
            key={tmpl.id}
            className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-bold text-slate-900">{tmpl.title}</h3>
                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[11px] font-semibold rounded-full border border-blue-200">
                  {tmpl.estimated_effort_hours}h Estimated
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{tmpl.description}</p>

              {/* Subtasks Preview */}
              {tmpl.template_subtasks_json && tmpl.template_subtasks_json.length > 0 && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Predefined Subtasks ({tmpl.template_subtasks_json.length})
                  </span>
                  <div className="space-y-1">
                    {tmpl.template_subtasks_json.map((st: any, i: number) => (
                      <div key={i} className="text-slate-700 font-medium">
                        • {st.title}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => handleUseTemplate(tmpl)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
              >
                Use Template to Create Task <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Task Template"
        subtitle="Save standard operating workflow for future reuse"
      >
        <form onSubmit={handleCreateTemplate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Template Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Offensive Cyber Lab Verification"
              className="w-full p-2.5 border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Standard checklist instructions and requirements..."
              className="w-full p-2.5 border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Estimated Hours</label>
            <input
              type="number"
              value={effort}
              onChange={(e) => setEffort(Number(e.target.value))}
              className="w-full p-2.5 border border-slate-200 rounded-xl"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
            >
              Save Template
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
