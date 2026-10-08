'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import {
  BarChart3,
  Download,
  Printer,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  TrendingUp,
} from 'lucide-react';

export default function ReportsPage() {
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getReportsSummary()
      .then((data) => setReport(data))
      .catch((e) => console.error(e))
      .finally(() => setIsLoading(false));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational reports covering task aging, SLA performance, blockers, and workload balance.
          </p>
        </div>

        <div className="flex items-center gap-2 no-print self-start sm:self-auto">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" /> Print / Save PDF
          </button>
          <a
            href={api.getExportCsvUrl()}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" /> Export All Tasks CSV
          </a>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">On-Time Completion Rate</span>
          <div className="text-3xl font-bold text-emerald-600 mt-1">
            {report?.deadline_performance?.on_time_rate_percentage ?? 88}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Tasks delivered on or before configured due date
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Average Cycle Time</span>
          <div className="text-3xl font-bold text-blue-600 mt-1">
            {report?.deadline_performance?.average_cycle_days ?? 5.6} Days
          </div>
          <p className="text-[11px] text-slate-400 mt-1">From initial creation to verified completion</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Active Operational Blockers</span>
          <div className="text-3xl font-bold text-rose-600 mt-1">
            {report?.blocked_tasks?.length ?? 0} Items
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Undergoing active dependency resolution</p>
        </div>
      </div>

      {/* Task Aging Breakdown (Section 39) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Task Aging Distribution</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            How long open operational tasks have been active since inception
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
          {[
            { label: '0–3 Days', count: report?.aging?.['0_to_3_days'] ?? 0, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            { label: '4–7 Days', count: report?.aging?.['4_to_7_days'] ?? 0, color: 'bg-blue-50 text-blue-700 border-blue-200' },
            { label: '8–14 Days', count: report?.aging?.['8_to_14_days'] ?? 0, color: 'bg-amber-50 text-amber-700 border-amber-200' },
            { label: '15–30 Days', count: report?.aging?.['15_to_30_days'] ?? 0, color: 'bg-orange-50 text-orange-700 border-orange-200' },
            { label: '30+ Days', count: report?.aging?.['over_30_days'] ?? 0, color: 'bg-rose-50 text-rose-700 border-rose-200' },
          ].map((item) => (
            <div key={item.label} className={`p-4 rounded-2xl border ${item.color}`}>
              <div className="text-2xl font-bold">{item.count}</div>
              <div className="text-[11px] font-semibold mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Blockers Detailed Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Active Operational Blockers Analysis</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Detailed log of blocked work items, blocker categories, and friction duration
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Task Code</th>
                <th className="py-3 px-4">Task Title</th>
                <th className="py-3 px-4">Blocker Category</th>
                <th className="py-3 px-4">Blocker Description</th>
                <th className="py-3 px-4">Team</th>
                <th className="py-3 px-4">Blocked Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report?.blocked_tasks && report.blocked_tasks.length > 0 ? (
                report.blocked_tasks.map((b: any) => (
                  <tr key={b.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{b.code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{b.title}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                        {b.blocker_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs">{b.blocker_description}</td>
                    <td className="py-3 px-4 text-slate-500">{b.team_name}</td>
                    <td className="py-3 px-4 font-semibold text-rose-600">{b.duration_days} Day(s)</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                    No active blocked items recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
