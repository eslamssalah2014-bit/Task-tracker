'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { DashboardSummary, Task } from '../../types';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Flame,
  ArrowUpRight,
  Filter,
  RefreshCw,
  Layers,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';

export default function DashboardPage() {
  const { user, role } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [charts, setCharts] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [teams, setTeams] = useState<any[]>([]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sum, ch, tList, tmList] = await Promise.all([
        api.getDashboardSummary({ team_id: selectedTeam || undefined }),
        api.getDashboardCharts({ team_id: selectedTeam || undefined }),
        api.getTasks({ team_id: selectedTeam || undefined }),
        api.getTeams().catch(() => []),
      ]);
      setSummary(sum);
      setCharts(ch);
      setTasks(tList);
      setTeams(tmList);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleRefresh = () => loadData();
    window.addEventListener('task-tracker-refresh', handleRefresh);
    return () => window.removeEventListener('task-tracker-refresh', handleRefresh);
  }, [selectedTeam]);

  // Chart color palletes
  const STATUS_COLORS: Record<string, string> = {
    'Not Started': '#94a3b8',
    'In Progress': '#3b82f6',
    Waiting: '#f59e0b',
    Blocked: '#ef4444',
    'Under Review': '#8b5cf6',
    Completed: '#10b981',
  };

  const PRIORITY_COLORS: Record<string, string> = {
    Low: '#94a3b8',
    Medium: '#3b82f6',
    High: '#f59e0b',
    Urgent: '#f97316',
    Critical: '#ef4444',
  };

  return (
    <div className="space-y-6">
      {/* Smart Daily Greeting (Section 72) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
            Daily Operational Overview • Africa/Cairo
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">
            Good day, {user?.full_name || 'Team Lead'}
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/90 mt-1.5 max-w-2xl leading-relaxed">
            {role === 'Team Member'
              ? 'Here is the current state of your active tasks and team deliverables.'
              : 'Here is what needs managerial attention today: overdue tasks, active blockers, and high-risk milestones.'}
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20">
          <Filter className="w-4 h-4 text-blue-200 ml-2" />
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="text-xs bg-transparent text-white font-medium focus:outline-none pr-3 py-1 cursor-pointer"
          >
            <option value="" className="text-slate-900">All Teams</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id} className="text-slate-900">
                {t.name}
              </option>
            ))}
          </select>
          <button
            onClick={loadData}
            title="Refresh Data"
            className="p-1.5 hover:bg-white/20 rounded-xl transition-colors text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Top KPI Cards Grid (Clickable Drill-down, Section 16 & 106) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Tasks */}
        <Link
          href="/tasks"
          className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-400 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Tasks</span>
            <Layers className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{summary?.total_tasks ?? 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Across all tracks</div>
        </Link>

        {/* In Progress */}
        <Link
          href="/tasks?status=In+Progress"
          className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-400 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">In Progress</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600">{summary?.in_progress ?? 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Active execution</div>
        </Link>

        {/* Blocked Tasks */}
        <Link
          href="/tasks?is_blocked=true"
          className="p-4 bg-white rounded-2xl border border-rose-200/80 bg-rose-50/20 shadow-xs hover:border-rose-400 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between text-rose-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Blocked</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600">{summary?.blocked ?? 0}</div>
          <div className="text-[11px] text-rose-600/80 mt-1 font-medium">Requires resolution</div>
        </Link>

        {/* Overdue */}
        <Link
          href="/tasks?is_overdue=true"
          className="p-4 bg-white rounded-2xl border border-rose-200/80 bg-rose-50/20 shadow-xs hover:border-rose-400 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between text-rose-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Overdue</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600">{summary?.overdue ?? 0}</div>
          <div className="text-[11px] text-rose-600/80 mt-1 font-medium">Passed deadline</div>
        </Link>

        {/* Due Today */}
        <Link
          href="/tasks?is_due_today=true"
          className="p-4 bg-white rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-xs hover:border-amber-400 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between text-amber-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Due Today</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{summary?.due_today ?? 0}</div>
          <div className="text-[11px] text-amber-600/80 mt-1 font-medium">Target today</div>
        </Link>

        {/* Completed */}
        <Link
          href="/tasks?status=Completed"
          className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{summary?.completed ?? 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Verified on-time</div>
        </Link>
      </div>

      {/* Secondary Quick Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/tasks?no_recent_update=true"
          className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between hover:border-slate-300 transition-all"
        >
          <div>
            <span className="text-xs text-slate-500 font-medium">No Recent Updates (&gt; 3 days)</span>
            <div className="text-xl font-bold text-amber-600 mt-0.5">
              {summary?.tasks_without_recent_updates ?? 0} Tasks
            </div>
          </div>
          <Clock className="w-5 h-5 text-amber-500" />
        </Link>

        <Link
          href="/tasks?needs_approval=true"
          className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between hover:border-slate-300 transition-all"
        >
          <div>
            <span className="text-xs text-slate-500 font-medium">Waiting for Manager Approval</span>
            <div className="text-xl font-bold text-purple-600 mt-0.5">
              {summary?.under_review ?? 0} Deliverables
            </div>
          </div>
          <CheckCircle2 className="w-5 h-5 text-purple-500" />
        </Link>

        <Link
          href="/tasks?health=Critical"
          className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between hover:border-slate-300 transition-all"
        >
          <div>
            <span className="text-xs text-slate-500 font-medium">High / Critical Risk Flags</span>
            <div className="text-xl font-bold text-rose-600 mt-0.5">
              {summary?.high_risk_tasks ?? 0} Flagged
            </div>
          </div>
          <AlertCircle className="w-5 h-5 text-rose-500" />
        </Link>
      </div>

      {/* Charts Section (Section 17) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Donut Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Task Status Distribution</h3>
              <p className="text-xs text-slate-400 mt-0.5">Current operational breakdown</p>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center">
            {charts?.statusChart ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.statusChart}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {charts.statusChart.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.name] || '#64748b'}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400">Loading chart data...</div>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-2 border-t border-slate-100 text-xs">
            {charts?.statusChart?.map((entry: any) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[entry.name] || '#64748b' }}
                />
                <span className="text-slate-600">{entry.name} ({entry.count})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Bar Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Tasks by Priority Level</h3>
              <p className="text-xs text-slate-400 mt-0.5">Weighting and urgency levels</p>
            </div>
          </div>
          <div className="h-64">
            {charts?.priorityChart ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.priorityChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {charts.priorityChart.map((entry: any, index: number) => (
                      <Cell key={`bar-${index}`} fill={PRIORITY_COLORS[entry.name] || '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400 flex items-center justify-center h-full">Loading chart...</div>
            )}
          </div>
        </div>
      </div>

      {/* Completion Trend Line Chart (Section 17) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Weekly Task Creation vs Completion Trend</h3>
            <p className="text-xs text-slate-400 mt-0.5">Tracking velocity and overdue reduction across 4 weeks</p>
          </div>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            +12% Velocity
          </span>
        </div>
        <div className="h-64">
          {charts?.completionTrend ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.completionTrend} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={3} name="Completed Tasks" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="created" stroke="#3b82f6" strokeWidth={2} name="Created Tasks" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="overdue" stroke="#ef4444" strokeWidth={2} name="Overdue Tasks" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-xs text-slate-400 flex items-center justify-center h-full">Loading trend data...</div>
          )}
        </div>
      </div>

      {/* Executive Command Center Preview (Section 71) */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Manager Command Center</span>
          <h2 className="text-xl font-bold mt-1 text-white">Need an immediate operational breakdown?</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Access the Manager Insights dashboard to review blocked tasks, evaluate team workload capacity, approve pending deliverables, and inspect automated risk alerts.
          </p>
        </div>
        <Link
          href="/manager"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/30 shrink-0 inline-flex items-center gap-2"
        >
          Open Command Center <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
