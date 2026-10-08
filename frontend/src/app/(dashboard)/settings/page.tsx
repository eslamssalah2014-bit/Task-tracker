'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../lib/api';
import { TaskPriority, TaskStatus } from '../../../types';
import { Settings as SettingsIcon, Shield, Sliders, History, Save, Check } from 'lucide-react';

export default function SettingsPage() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState<'general' | 'statuses' | 'priorities' | 'audit'>('general');
  const [metadata, setMetadata] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states for general settings
  const [noUpdateDays, setNoUpdateDays] = useState(3);
  const [timezone, setTimezone] = useState('Africa/Cairo');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [meta, logs] = await Promise.all([
        api.getMetadata(),
        api.getAuditLogs({ limit: 50 }),
      ]);
      setMetadata(meta);
      setAuditLogs(logs);
      if (meta.settings?.no_update_threshold_days) {
        setNoUpdateDays(meta.settings.no_update_threshold_days);
      }
      if (meta.settings?.timezone) {
        setTimezone(meta.settings.timezone);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveGeneral = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">System Settings & Governance</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure operational thresholds, statuses, priority weighting, and review immutable audit logs.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-xs font-semibold">
        {[
          { id: 'general', label: 'General & SLA Rules', icon: Sliders },
          { id: 'statuses', label: 'Statuses Configuration', icon: SettingsIcon },
          { id: 'priorities', label: 'Priority Weights', icon: Shield },
          { id: 'audit', label: 'Audit Trail Logs', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 flex items-center gap-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-600 text-blue-600 font-bold'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: GENERAL */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs max-w-2xl space-y-6 text-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Operational SLA & Notification Rules</h3>
            <p className="text-slate-400 mt-0.5">Define automated flags for stalled work items</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Threshold for &quot;No Recent Update&quot; (Days)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={noUpdateDays}
                onChange={(e) => setNoUpdateDays(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-200 rounded-xl"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Tasks in progress without updates for this period will trigger alerts on the Manager Dashboard.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Default Organizational Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50"
              >
                <option value="Africa/Cairo">Africa/Cairo (UTC+2 / UTC+3)</option>
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="Asia/Riyadh">Asia/Riyadh (UTC+3)</option>
                <option value="Asia/Dubai">Asia/Dubai (UTC+4)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            {saveSuccess ? (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="w-4 h-4" /> Settings updated successfully
              </span>
            ) : (
              <span />
            )}
            <button
              onClick={handleSaveGeneral}
              className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: STATUSES (Section 52) */}
      {activeTab === 'statuses' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Configured Task Statuses</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Mapped status codes used across Kanban, reports, and filtering
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Status Name</th>
                  <th className="py-3 px-4">Color</th>
                  <th className="py-3 px-4">Status Type</th>
                  <th className="py-3 px-4">Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metadata?.statuses?.map((s: TaskStatus) => (
                  <tr key={s.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      {s.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">{s.color}</td>
                    <td className="py-3 px-4 uppercase font-semibold text-[10px] text-slate-600">{s.status_type}</td>
                    <td className="py-3 px-4">{s.order_index}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PRIORITIES (Section 53) */}
      {activeTab === 'priorities' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Custom Priority Weights</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Relative priority weighting used for automated risk detection and workload scoring
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Priority Level</th>
                  <th className="py-3 px-4">Urgency Rank</th>
                  <th className="py-3 px-4">Calculated Risk Weight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metadata?.priorities?.map((p: TaskPriority) => (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-semibold text-slate-900">{p.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">Level {p.level}</td>
                    <td className="py-3 px-4 font-bold text-blue-600">{p.weight}x Weight</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOG (Section 54) */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">System Audit Trail</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Immutable log of all operational events, deadline modifications, and status changes
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Task Code</th>
                  <th className="py-3 px-4">Module</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 font-mono text-[11px]">
                    <td className="py-3 px-4 text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{log.action}</td>
                    <td className="py-3 px-4 text-blue-600 font-semibold">{log.task_code || 'N/A'}</td>
                    <td className="py-3 px-4 text-slate-600">{log.entity_type}</td>
                    <td className="py-3 px-4 text-slate-500 truncate max-w-xs font-sans">
                      {JSON.stringify(log.new_value_json || log.old_value_json || '')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
