'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../lib/api';
import { Team, UserProfile } from '../../../types';
import { Briefcase, Plus, Users, Shield, CheckCircle2, Flame, Layers } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import Link from 'next/link';

export default function TeamsPage() {
  const { role } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add Team Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [managerId, setManagerId] = useState('');
  const [department, setDepartment] = useState('Education & Tech');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadTeams = async () => {
    setIsLoading(true);
    try {
      const [tList, uList] = await Promise.all([
        api.getTeams(),
        api.getUsers().catch(() => []),
      ]);
      setTeams(tList);
      setUsers(uList);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await api.createTeam({
        name,
        description,
        manager_id: managerId || undefined,
        department,
        member_ids: selectedMemberIds,
      });
      setIsAddOpen(false);
      setName('');
      setDescription('');
      setSelectedMemberIds([]);
      loadTeams();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMember = (uid: string) => {
    if (selectedMemberIds.includes(uid)) {
      setSelectedMemberIds(selectedMemberIds.filter((id) => id !== uid));
    } else {
      setSelectedMemberIds([...selectedMemberIds, uid]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Teams Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize personnel into functional tracks, lab squads, and operational units.
          </p>
        </div>

        {role !== 'Team Member' && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Create Team
          </button>
        )}
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((t) => (
          <div
            key={t.id}
            className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                    {t.department || 'Operations'}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">{t.name}</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                  {t.status}
                </span>
              </div>

              {t.description && (
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                  {t.description}
                </p>
              )}

              {/* Manager */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-2.5 text-xs">
                <Shield className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Manager</span>
                  <span className="font-bold text-slate-800">{t.manager_name || 'Unassigned'}</span>
                </div>
              </div>

              {/* Members */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Team Members ({t.members?.length || 0})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(t.members || []).map((m) => (
                    <span
                      key={m.user_id}
                      className="px-2.5 py-1 bg-white border border-slate-200 rounded-full text-[11px] font-medium text-slate-700 shadow-2xs"
                    >
                      {m.user?.full_name || 'Member'}
                    </span>
                  ))}
                  {(t.members || []).length === 0 && (
                    <span className="text-xs text-slate-400 italic">No assigned members</span>
                  )}
                </div>
              </div>
            </div>

            {/* Task Stats Bar */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="text-slate-600 font-medium">
                  <strong>{t.active_tasks_count ?? 0}</strong> Active
                </span>
                <span className="text-rose-600 font-medium">
                  <strong>{t.overdue_tasks_count ?? 0}</strong> Overdue
                </span>
              </div>

              <Link
                href={`/tasks?team=${t.id}`}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                View Tasks →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Add Team Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Create Team"
        subtitle="Establish a new collaborative operational unit"
      >
        <form onSubmit={handleCreateTeam} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Team Name</label>
            <input
              type="text"
              required
              placeholder="e.g. SOC Automation Team"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="Primary responsibilities and objectives..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Team Manager</label>
              <select
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50"
              >
                <option value="">Select Manager</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.full_name} ({u.role_name})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department</label>
              <input
                type="text"
                placeholder="e.g. Education & Tech"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          {/* Members Multi-select */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Select Members</label>
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
              {users.map((u) => {
                const isSelected = selectedMemberIds.includes(u.id);
                return (
                  <button
                    type="button"
                    key={u.id}
                    onClick={() => toggleMember(u.id)}
                    className={`px-3 py-1 rounded-full text-xs transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {u.full_name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
            >
              {isSubmitting ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
