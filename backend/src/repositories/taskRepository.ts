import {
  ApprovalStatus,
  BlockerType,
  ChecklistItem,
  DependencyType,
  Subtask,
  Task,
  TaskBlocker,
  TaskComment,
  TaskDependency,
  TaskUpdate,
  UserProfile,
} from '../types';
import { UserRepository } from './userRepository';
import { TeamRepository } from './teamRepository';
import { SystemRepository } from './systemRepository';
import { TaskHealthService } from '../services/taskHealthService';
import { dateUtils } from '../utils/dateUtils';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import crypto from 'crypto';

let taskSequence = 106;

function toCanonicalStatusId(id?: string): string {
  if (!id) return '10000000-0000-0000-0000-000000000001';
  const map: Record<string, string> = {
    s1: '10000000-0000-0000-0000-000000000001',
    s2: '10000000-0000-0000-0000-000000000002',
    s3: '10000000-0000-0000-0000-000000000003',
    s4: '10000000-0000-0000-0000-000000000004',
    s5: '10000000-0000-0000-0000-000000000005',
    s6: '10000000-0000-0000-0000-000000000006',
    s7: '10000000-0000-0000-0000-000000000007',
  };
  return map[id] || id;
}

function toCanonicalPriorityId(id?: string): string {
  if (!id) return '20000000-0000-0000-0000-000000000002';
  const map: Record<string, string> = {
    p1: '20000000-0000-0000-0000-000000000001',
    p2: '20000000-0000-0000-0000-000000000002',
    p3: '20000000-0000-0000-0000-000000000003',
    p4: '20000000-0000-0000-0000-000000000004',
    p5: '20000000-0000-0000-0000-000000000005',
  };
  return map[id] || id;
}

function toCanonicalCategoryId(id?: string): string | undefined {
  if (!id) return undefined;
  const map: Record<string, string> = {
    c1: '30000000-0000-0000-0000-000000000001',
    c2: '30000000-0000-0000-0000-000000000002',
    c3: '30000000-0000-0000-0000-000000000003',
    c4: '30000000-0000-0000-0000-000000000004',
    c5: '30000000-0000-0000-0000-000000000005',
    c6: '30000000-0000-0000-0000-000000000006',
  };
  return map[id] || id;
}

export class TaskRepository {
  private static tasks: Task[] = [
    {
      id: '40000000-0000-0000-0000-000000000101',
      task_code: 'TASK-000101',
      title: 'Finalize Penetration Testing Course Outline',
      description: `<h3>Objective</h3><p>Complete curriculum outline, integrate SOC & Offensive security labs, and acquire instructor consensus.</p><ul><li>Standardize syllabus modules</li><li>Coordinate with lab engineers</li><li>Submit final outline for managerial sign-off</li></ul>`,
      created_by: '00000000-0000-0000-0000-000000000001',
      team_id: '50000000-0000-0000-0000-000000000001',
      department: 'Education & Tech',
      category_id: '30000000-0000-0000-0000-000000000002',
      priority_id: '20000000-0000-0000-0000-000000000004', // Urgent
      status_id: '10000000-0000-0000-0000-000000000002',   // In Progress
      start_date: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
      due_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      due_time: '17:00',
      estimated_effort_hours: 24,
      progress_percentage: 70,
      requires_approval: true,
      approval_status: 'none',
      is_archived: false,
      is_pinned: true,
      is_favorite: true,
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      subtasks: [
        {
          id: 'st-1',
          task_id: '40000000-0000-0000-0000-000000000101',
          title: 'Collect current course outlines',
          assigned_to: '00000000-0000-0000-0000-000000000003',
          status: 'Completed',
          priority: 'High',
          progress_percentage: 100,
          order_index: 1,
        },
        {
          id: 'st-2',
          task_id: '40000000-0000-0000-0000-000000000101',
          title: 'Meet instructors & compare feedback',
          assigned_to: '00000000-0000-0000-0000-000000000003',
          status: 'In Progress',
          priority: 'Urgent',
          progress_percentage: 80,
          order_index: 2,
        },
      ],
      checklists: [
        { id: 'cl-1', task_id: '40000000-0000-0000-0000-000000000101', title: 'Send invitation to instructors', is_completed: true, order_index: 1 },
        { id: 'cl-2', task_id: '40000000-0000-0000-0000-000000000101', title: 'Prepare review agenda', is_completed: true, order_index: 2 },
      ],
      updates: [
        {
          id: 'up-1',
          task_id: '40000000-0000-0000-0000-000000000101',
          user_id: '00000000-0000-0000-0000-000000000003',
          update_text: 'Meeting completed with Pen Testing instructors and agreed on 80% of curriculum.',
          progress_percentage: 70,
          next_step: 'Finalize remaining modules with QA coordinator tomorrow.',
          created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
        },
      ],
      comments: [],
    },
    {
      id: '40000000-0000-0000-0000-000000000102',
      task_code: 'TASK-000102',
      title: 'Deploy Dedicated SOC Attack Simulation Lab',
      description: 'Setup isolated virtual environments with automated telemetry collection and monitoring dashboards.',
      created_by: '00000000-0000-0000-0000-000000000002',
      team_id: '50000000-0000-0000-0000-000000000002',
      department: 'Infrastructure',
      category_id: '30000000-0000-0000-0000-000000000001',
      priority_id: '20000000-0000-0000-0000-000000000005', // Critical
      status_id: '10000000-0000-0000-0000-000000000004',   // Blocked
      start_date: new Date(Date.now() - 8 * 86400000).toISOString().split('T')[0],
      due_date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
      estimated_effort_hours: 40,
      progress_percentage: 35,
      requires_approval: false,
      approval_status: 'none',
      is_archived: false,
      is_pinned: true,
      is_favorite: false,
      created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      blocker: {
        id: 'blk-1',
        task_id: '40000000-0000-0000-0000-000000000102',
        blocker_type: 'Waiting for Approval',
        blocker_description: 'Awaiting cloud quota upgrade approval from executive finance for additional RAM allocations.',
        expected_resolution_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
        created_by: '00000000-0000-0000-0000-000000000004',
        created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
        duration_days: 4,
      },
    },
    {
      id: '40000000-0000-0000-0000-000000000103',
      task_code: 'TASK-000103',
      title: 'Educational Curriculum QA Audit - Q3 Modules',
      description: 'Systematic pedagogical and technical accuracy audit across 12 recently uploaded course modules.',
      created_by: '00000000-0000-0000-0000-000000000002',
      team_id: '50000000-0000-0000-0000-000000000003',
      department: 'Quality Assurance',
      category_id: '30000000-0000-0000-0000-000000000004',
      priority_id: '20000000-0000-0000-0000-000000000003', // High
      status_id: '10000000-0000-0000-0000-000000000005',   // Under Review
      start_date: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0],
      due_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      estimated_effort_hours: 18,
      progress_percentage: 90,
      requires_approval: true,
      approval_status: 'pending',
      is_archived: false,
      is_pinned: false,
      is_favorite: true,
      created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: '40000000-0000-0000-0000-000000000104',
      task_code: 'TASK-000104',
      title: 'Quarterly Compliance Audit & Penetration Report',
      description: 'Finalize external accreditation security reports and client-facing pen test summaries.',
      created_by: '00000000-0000-0000-0000-000000000001',
      team_id: '50000000-0000-0000-0000-000000000001',
      department: 'Executive',
      category_id: '30000000-0000-0000-0000-000000000005',
      priority_id: '20000000-0000-0000-0000-000000000002', // Medium
      status_id: '10000000-0000-0000-0000-000000000006',   // Completed
      start_date: new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0],
      due_date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
      completion_date: new Date(Date.now() - 5 * 86400000).toISOString(),
      estimated_effort_hours: 14,
      progress_percentage: 100,
      requires_approval: false,
      approval_status: 'approved',
      is_archived: false,
      is_pinned: false,
      is_favorite: false,
      created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: '40000000-0000-0000-0000-000000000105',
      task_code: 'TASK-000105',
      title: 'DevSecOps Pipeline Security Scanning Integration',
      description: 'Incorporate SAST and DAST scanners into GitLab CI pipeline with automatic vulnerability gating.',
      created_by: '00000000-0000-0000-0000-000000000002',
      team_id: '50000000-0000-0000-0000-000000000002',
      department: 'Infrastructure',
      category_id: '30000000-0000-0000-0000-000000000001',
      priority_id: '20000000-0000-0000-0000-000000000004', // Urgent
      status_id: '10000000-0000-0000-0000-000000000002',   // In Progress
      start_date: new Date(Date.now() - 9 * 86400000).toISOString().split('T')[0],
      due_date: new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0],
      estimated_effort_hours: 20,
      progress_percentage: 20,
      requires_approval: false,
      approval_status: 'none',
      is_archived: false,
      is_pinned: false,
      is_favorite: false,
      created_at: new Date(Date.now() - 9 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    },
  ];

  private static taskAssigneesMap: Record<string, string[]> = {
    '40000000-0000-0000-0000-000000000101': ['00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000005'],
    '40000000-0000-0000-0000-000000000102': ['00000000-0000-0000-0000-000000000004'],
    '40000000-0000-0000-0000-000000000103': ['00000000-0000-0000-0000-000000000005'],
    '40000000-0000-0000-0000-000000000104': ['00000000-0000-0000-0000-000000000006'],
    '40000000-0000-0000-0000-000000000105': ['00000000-0000-0000-0000-000000000004'],
  };

  private static taskDependenciesList: TaskDependency[] = [];

  private static async enrichTask(task: Task): Promise<Task> {
    const creator = await UserRepository.getById(task.created_by);
    const team = task.team_id ? await TeamRepository.getById(task.team_id) : undefined;
    const category = task.category_id ? await SystemRepository.getCategoryById(task.category_id) : undefined;
    const priority = await SystemRepository.getPriorityById(task.priority_id);
    const status = await SystemRepository.getStatusById(task.status_id);

    const assigneeIds = this.taskAssigneesMap[task.id] || [];
    const assignees = (
      await Promise.all(assigneeIds.map((uid) => UserRepository.getById(uid)))
    ).filter((u): u is UserProfile => u !== null);

    const populated: Task = {
      ...task,
      creator: creator || undefined,
      team: team || undefined,
      category: category || undefined,
      priority: priority || undefined,
      status: status || undefined,
      assignees,
      dependencies: [],
    };

    const healthEvaluation = TaskHealthService.evaluateTaskHealth(populated, 3);
    populated.health = healthEvaluation.health;
    populated.health_score = healthEvaluation.score;
    populated.risk_reason = healthEvaluation.riskReason;
    populated.has_recent_update = healthEvaluation.hasRecentUpdate;
    populated.days_since_last_update = healthEvaluation.daysSinceLastUpdate;
    populated.is_overdue = healthEvaluation.isOverdue;
    populated.overdue_days = healthEvaluation.overdueDays;
    populated.days_remaining = healthEvaluation.daysRemaining;
    populated.is_due_today = dateUtils.isDueToday(populated.due_date);
    populated.is_due_this_week = dateUtils.isDueThisWeek(populated.due_date);

    return populated;
  }

  static async getAll(filters?: {
    team_id?: string;
    user_id?: string;
    created_by?: string;
    status_id?: string;
    priority_id?: string;
    category_id?: string;
    department?: string;
    is_overdue?: boolean;
    is_blocked?: boolean;
    no_recent_update?: boolean;
    needs_approval?: boolean;
    is_archived?: boolean;
    is_pinned?: boolean;
    search?: string;
  }): Promise<Task[]> {
    try {
      let query = supabase.from('tasks').select('*').is('deleted_at', null);

      if (filters?.is_archived !== undefined) {
        query = query.eq('is_archived', filters.is_archived);
      } else {
        query = query.eq('is_archived', false);
      }

      if (filters?.team_id) query = query.eq('team_id', filters.team_id);
      if (filters?.status_id) query = query.eq('status_id', toCanonicalStatusId(filters.status_id));
      if (filters?.priority_id) query = query.eq('priority_id', toCanonicalPriorityId(filters.priority_id));
      if (filters?.category_id) query = query.eq('category_id', toCanonicalCategoryId(filters.category_id));
      if (filters?.created_by) query = query.eq('created_by', filters.created_by);
      if (filters?.department) query = query.ilike('department', filters.department);
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,task_code.ilike.%${filters.search}%`);
      }

      const { data: dbTasks, error } = await query.order('created_at', { ascending: false });

      if (!error && Array.isArray(dbTasks) && dbTasks.length > 0) {
        const { data: dbAssignees } = await supabase.from('task_assignees').select('*');
        if (dbAssignees) {
          for (const a of dbAssignees) {
            if (!this.taskAssigneesMap[a.task_id]) this.taskAssigneesMap[a.task_id] = [];
            if (!this.taskAssigneesMap[a.task_id].includes(a.user_id)) {
              this.taskAssigneesMap[a.task_id].push(a.user_id);
            }
          }
        }

        const enrichedList = await Promise.all(
          dbTasks.map((t) =>
            this.enrichTask({
              ...t,
              subtasks: [],
              checklists: [],
              updates: [],
              comments: [],
            })
          )
        );

        let filtered = enrichedList;
        if (filters?.user_id) {
          filtered = filtered.filter((t) => (t.assignees || []).some((a) => a.id === filters.user_id));
        }
        if (filters?.is_overdue) {
          filtered = filtered.filter((t) => t.is_overdue);
        }
        if (filters?.is_blocked) {
          filtered = filtered.filter((t) => t.status?.name === 'Blocked' || !!t.blocker);
        }

        this.tasks = enrichedList;
        return filtered;
      }
    } catch (e) {
      logger.warn('[TaskRepository] Supabase query failed, falling back to cache:', e);
    }

    // In-memory fallback
    let list = this.tasks.filter((t) => !t.deleted_at);

    if (filters?.is_archived !== undefined) {
      list = list.filter((t) => t.is_archived === filters.is_archived);
    } else {
      list = list.filter((t) => !t.is_archived);
    }

    if (filters?.team_id) list = list.filter((t) => t.team_id === filters.team_id);
    if (filters?.created_by) list = list.filter((t) => t.created_by === filters.created_by);
    if (filters?.status_id) {
      const canonical = toCanonicalStatusId(filters.status_id);
      list = list.filter((t) => t.status_id === canonical || t.status_id === filters.status_id);
    }
    if (filters?.priority_id) {
      const canonical = toCanonicalPriorityId(filters.priority_id);
      list = list.filter((t) => t.priority_id === canonical || t.priority_id === filters.priority_id);
    }
    if (filters?.category_id) {
      const canonical = toCanonicalCategoryId(filters.category_id);
      list = list.filter((t) => t.category_id === canonical || t.category_id === filters.category_id);
    }
    if (filters?.department) {
      list = list.filter((t) => t.department?.toLowerCase() === filters.department?.toLowerCase());
    }
    if (filters?.user_id) {
      list = list.filter((t) => {
        const uids = this.taskAssigneesMap[t.id] || [];
        return uids.includes(filters.user_id!);
      });
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.task_code.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }

    const enriched = await Promise.all(list.map((t) => this.enrichTask(t)));
    let filtered = enriched;
    if (filters?.is_overdue) filtered = filtered.filter((t) => t.is_overdue);
    if (filters?.is_blocked) filtered = filtered.filter((t) => t.status?.name === 'Blocked' || !!t.blocker);
    if (filters?.no_recent_update) filtered = filtered.filter((t) => !t.has_recent_update && t.status?.status_type === 'in_progress');
    if (filters?.needs_approval) filtered = filtered.filter((t) => t.requires_approval && t.approval_status === 'pending');

    return filtered.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }

  static async getById(idOrCode: string): Promise<Task | null> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .or(`id.eq.${idOrCode},task_code.eq.${idOrCode}`)
        .is('deleted_at', null)
        .maybeSingle();

      if (!error && data) {
        return this.enrichTask({
          ...data,
          subtasks: [],
          checklists: [],
          updates: [],
          comments: [],
        });
      }
    } catch (e) {
      logger.warn(`[TaskRepository] getById failed in Supabase for ${idOrCode}:`, e);
    }

    const raw = this.tasks.find(
      (t) => (t.id === idOrCode || t.task_code === idOrCode) && !t.deleted_at
    );
    if (!raw) return null;
    return this.enrichTask(raw);
  }

  static async create(data: {
    title: string;
    description?: string;
    created_by: string;
    team_id?: string;
    department?: string;
    category_id?: string;
    priority_id: string;
    status_id?: string;
    start_date?: string;
    due_date?: string;
    due_time?: string;
    estimated_effort_hours?: number;
    progress_percentage?: number;
    requires_approval?: boolean;
    assignee_ids?: string[];
    subtasks?: Array<{ title: string; assigned_to?: string; priority?: string }>;
    checklists?: Array<{ title: string }>;
  }): Promise<Task> {
    const seqNum = Date.now().toString().slice(-4) + Math.floor(10 + Math.random() * 90);
    const taskCode = `TASK-${seqNum}`;
    const newId = crypto.randomUUID();

    const statusId = toCanonicalStatusId(data.status_id);
    const priorityId = toCanonicalPriorityId(data.priority_id);
    const categoryId = toCanonicalCategoryId(data.category_id);

    const dbRecord = {
      id: newId,
      task_code: taskCode,
      title: data.title,
      description: data.description || '',
      created_by: data.created_by,
      team_id: data.team_id || null,
      department: data.department || null,
      category_id: categoryId || null,
      priority_id: priorityId,
      status_id: statusId,
      start_date: data.start_date || null,
      due_date: data.due_date || null,
      due_time: data.due_time || null,
      estimated_effort_hours: data.estimated_effort_hours || 0,
      progress_percentage: data.progress_percentage || 0,
      requires_approval: data.requires_approval || false,
      approval_status: 'none' as ApprovalStatus,
      is_archived: false,
      is_pinned: false,
      is_favorite: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { error: insErr } = await supabase.from('tasks').insert(dbRecord);
      if (insErr) {
        logger.error('[TaskRepository] Supabase task insert error:', insErr);
      } else {
        if (data.assignee_ids && data.assignee_ids.length > 0) {
          const assigneesToInsert = data.assignee_ids.map((uid) => ({
            task_id: newId,
            user_id: uid,
          }));
          await supabase.from('task_assignees').insert(assigneesToInsert);
        }
      }
    } catch (err) {
      logger.error('[TaskRepository] Exception saving task to Supabase:', err);
    }

    if (data.assignee_ids && data.assignee_ids.length > 0) {
      this.taskAssigneesMap[newId] = data.assignee_ids;
    }

    const newTask: Task = {
      ...dbRecord,
      team_id: data.team_id || undefined,
      department: data.department || undefined,
      category_id: data.category_id || undefined,
      start_date: data.start_date || undefined,
      due_date: data.due_date || undefined,
      due_time: data.due_time || undefined,
      priority_id: data.priority_id,
      status_id: data.status_id || statusId,
      subtasks: (data.subtasks || []).map((st, i) => ({
        id: `st-${newId}-${i + 1}`,
        task_id: newId,
        title: st.title,
        assigned_to: st.assigned_to,
        status: 'Not Started',
        priority: st.priority || 'Medium',
        progress_percentage: 0,
        order_index: i + 1,
      })),
      checklists: (data.checklists || []).map((cl, i) => ({
        id: `cl-${newId}-${i + 1}`,
        task_id: newId,
        title: cl.title,
        is_completed: false,
        order_index: i + 1,
      })),
      updates: [],
      comments: [],
    };

    this.tasks.unshift(newTask);

    await SystemRepository.recordAuditLog({
      task_id: newId,
      task_code: taskCode,
      user_id: data.created_by,
      action: 'CREATED_TASK',
      entity_type: 'Task',
      entity_id: newId,
      new_value_json: { title: data.title, priority_id: data.priority_id },
    });

    return this.enrichTask(newTask);
  }

  static async update(
    id: string,
    updates: Partial<Task> & { assignee_ids?: string[] },
    userId?: string
  ): Promise<Task | null> {
    const idx = this.tasks.findIndex((t) => t.id === id && !t.deleted_at);
    if (idx === -1) return null;

    const oldTask = { ...this.tasks[idx] };

    if (updates.assignee_ids) {
      this.taskAssigneesMap[id] = updates.assignee_ids;
    }

    let completionDate = this.tasks[idx].completion_date;
    if (updates.status_id) {
      const statusObj = await SystemRepository.getStatusById(updates.status_id);
      if (statusObj?.status_type === 'completed' && !completionDate) {
        completionDate = new Date().toISOString();
      } else if (statusObj?.status_type !== 'completed') {
        completionDate = undefined;
      }
    }

    const dbUpdates: Record<string, any> = {
      ...updates,
      updated_at: new Date().toISOString(),
    };
    if (updates.status_id) dbUpdates.status_id = toCanonicalStatusId(updates.status_id);
    if (updates.priority_id) dbUpdates.priority_id = toCanonicalPriorityId(updates.priority_id);
    if (updates.category_id) dbUpdates.category_id = toCanonicalCategoryId(updates.category_id);
    delete dbUpdates.assignee_ids;
    delete dbUpdates.creator;
    delete dbUpdates.team;
    delete dbUpdates.category;
    delete dbUpdates.priority;
    delete dbUpdates.status;
    delete dbUpdates.assignees;
    delete dbUpdates.subtasks;
    delete dbUpdates.checklists;
    delete dbUpdates.updates;
    delete dbUpdates.comments;
    delete dbUpdates.blocker;

    try {
      await supabase.from('tasks').update(dbUpdates).eq('id', id);

      if (updates.assignee_ids) {
        await supabase.from('task_assignees').delete().eq('task_id', id);
        if (updates.assignee_ids.length > 0) {
          const rows = updates.assignee_ids.map((uid) => ({ task_id: id, user_id: uid }));
          await supabase.from('task_assignees').insert(rows);
        }
      }
    } catch (e) {
      logger.warn('[TaskRepository] Supabase update task error:', e);
    }

    this.tasks[idx] = {
      ...this.tasks[idx],
      ...updates,
      completion_date: completionDate,
      updated_at: new Date().toISOString(),
    };

    if (userId) {
      await SystemRepository.recordAuditLog({
        task_id: id,
        task_code: this.tasks[idx].task_code,
        user_id: userId,
        action: 'UPDATED_TASK',
        entity_type: 'Task',
        entity_id: id,
        old_value_json: oldTask,
        new_value_json: this.tasks[idx],
      });
    }

    return this.enrichTask(this.tasks[idx]);
  }

  static async addUpdate(
    taskId: string,
    data: {
      userId: string;
      updateText: string;
      progressPercentage: number;
      statusId?: string;
      nextStep?: string;
      blockerText?: string;
    }
  ): Promise<Task | null> {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return null;

    const newUpdate: TaskUpdate = {
      id: `up-${Date.now()}`,
      task_id: taskId,
      user_id: data.userId,
      update_text: data.updateText,
      progress_percentage: data.progressPercentage,
      status_id: data.statusId || task.status_id,
      next_step: data.nextStep,
      blocker_text: data.blockerText,
      created_at: new Date().toISOString(),
    };

    if (!task.updates) task.updates = [];
    task.updates.unshift(newUpdate);

    task.progress_percentage = data.progressPercentage;
    if (data.statusId) {
      task.status_id = data.statusId;
    }
    task.updated_at = new Date().toISOString();

    try {
      await supabase.from('tasks').update({
        progress_percentage: data.progressPercentage,
        status_id: toCanonicalStatusId(data.statusId || task.status_id),
        updated_at: new Date().toISOString(),
      }).eq('id', taskId);
    } catch (e) {}

    await SystemRepository.recordAuditLog({
      task_id: taskId,
      task_code: task.task_code,
      user_id: data.userId,
      action: 'ADDED_UPDATE',
      entity_type: 'TaskUpdate',
      entity_id: newUpdate.id,
      new_value_json: { progress: data.progressPercentage, text: data.updateText },
    });

    return this.enrichTask(task);
  }

  static async setBlocked(
    taskId: string,
    data: {
      blockerType: BlockerType;
      blockerDescription: string;
      expectedResolutionDate?: string;
      userId: string;
    }
  ): Promise<Task | null> {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return null;

    const blockedStatus = await SystemRepository.getStatusByName('Blocked');
    if (blockedStatus) {
      task.status_id = blockedStatus.id;
    }

    task.blocker = {
      id: `blk-${Date.now()}`,
      task_id: taskId,
      blocker_type: data.blockerType,
      blocker_description: data.blockerDescription,
      expected_resolution_date: data.expectedResolutionDate,
      created_by: data.userId,
      created_at: new Date().toISOString(),
      duration_days: 0,
    };
    task.updated_at = new Date().toISOString();

    try {
      await supabase.from('tasks').update({
        status_id: toCanonicalStatusId(blockedStatus?.id),
        updated_at: new Date().toISOString(),
      }).eq('id', taskId);
    } catch (e) {}

    await SystemRepository.recordAuditLog({
      task_id: taskId,
      task_code: task.task_code,
      user_id: data.userId,
      action: 'MARKED_BLOCKED',
      entity_type: 'TaskBlocker',
      new_value_json: task.blocker,
    });

    return this.enrichTask(task);
  }

  static async resolveBlocker(taskId: string, userId: string): Promise<Task | null> {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task || !task.blocker) return null;

    task.blocker.resolved_at = new Date().toISOString();
    task.blocker.resolved_by = userId;

    const inProgressStatus = await SystemRepository.getStatusByName('In Progress');
    if (inProgressStatus) {
      task.status_id = inProgressStatus.id;
    }
    task.blocker = undefined;
    task.updated_at = new Date().toISOString();

    try {
      await supabase.from('tasks').update({
        status_id: toCanonicalStatusId(inProgressStatus?.id),
        updated_at: new Date().toISOString(),
      }).eq('id', taskId);
    } catch (e) {}

    await SystemRepository.recordAuditLog({
      task_id: taskId,
      task_code: task.task_code,
      user_id: userId,
      action: 'RESOLVED_BLOCKER',
      entity_type: 'TaskBlocker',
    });

    return this.enrichTask(task);
  }

  static async addSubtask(
    taskId: string,
    data: { title: string; assignedTo?: string; priority?: string; dueDate?: string }
  ): Promise<Subtask | null> {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return null;

    if (!task.subtasks) task.subtasks = [];
    const newSubtask: Subtask = {
      id: `st-${Date.now()}`,
      task_id: taskId,
      title: data.title,
      assigned_to: data.assignedTo,
      status: 'Not Started',
      priority: data.priority || 'Medium',
      due_date: data.dueDate,
      progress_percentage: 0,
      order_index: task.subtasks.length + 1,
      created_at: new Date().toISOString(),
    };
    task.subtasks.push(newSubtask);
    task.updated_at = new Date().toISOString();

    return newSubtask;
  }

  static async updateSubtask(
    subtaskId: string,
    updates: Partial<Subtask>,
    autoCalcParent = true
  ): Promise<Subtask | null> {
    for (const task of this.tasks) {
      if (task.subtasks) {
        const st = task.subtasks.find((s) => s.id === subtaskId);
        if (st) {
          Object.assign(st, updates, { updated_at: new Date().toISOString() });

          if (autoCalcParent && task.subtasks.length > 0) {
            const completedCount = task.subtasks.filter((s) => s.status === 'Completed').length;
            task.progress_percentage = Math.round((completedCount / task.subtasks.length) * 100);
            task.updated_at = new Date().toISOString();
          }

          return st;
        }
      }
    }
    return null;
  }

  static async toggleChecklistItem(itemId: string, isCompleted: boolean, userId?: string): Promise<boolean> {
    for (const task of this.tasks) {
      if (task.checklists) {
        const item = task.checklists.find((c) => c.id === itemId);
        if (item) {
          item.is_completed = isCompleted;
          item.completed_by = isCompleted ? userId : undefined;
          item.completed_at = isCompleted ? new Date().toISOString() : undefined;
          task.updated_at = new Date().toISOString();
          return true;
        }
      }
    }
    return false;
  }

  static async addComment(
    taskId: string,
    data: { userId: string; text: string; mentions?: string[]; attachmentUrl?: string }
  ): Promise<TaskComment | null> {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return null;

    if (!task.comments) task.comments = [];
    const newComment: TaskComment = {
      id: `cm-${Date.now()}`,
      task_id: taskId,
      user_id: data.userId,
      comment_text: data.text,
      mentions: data.mentions || [],
      attachment_url: data.attachmentUrl,
      is_edited: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    task.comments.unshift(newComment);
    task.updated_at = new Date().toISOString();

    return newComment;
  }

  static async submitForApproval(taskId: string, userId: string): Promise<Task | null> {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return null;

    const underReviewStatus = await SystemRepository.getStatusByName('Under Review');
    if (underReviewStatus) {
      task.status_id = underReviewStatus.id;
    }
    task.approval_status = 'pending';
    task.updated_at = new Date().toISOString();

    try {
      await supabase.from('tasks').update({
        status_id: toCanonicalStatusId(underReviewStatus?.id),
        approval_status: 'pending',
        updated_at: new Date().toISOString(),
      }).eq('id', taskId);
    } catch (e) {}

    await SystemRepository.recordAuditLog({
      task_id: taskId,
      task_code: task.task_code,
      user_id: userId,
      action: 'SUBMITTED_FOR_REVIEW',
      entity_type: 'Task',
    });

    return this.enrichTask(task);
  }

  static async approveTask(taskId: string, managerId: string, notes?: string): Promise<Task | null> {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return null;

    const completedStatus = await SystemRepository.getStatusByName('Completed');
    if (completedStatus) {
      task.status_id = completedStatus.id;
    }
    task.approval_status = 'approved';
    task.approval_notes = notes;
    task.approved_by = managerId;
    task.progress_percentage = 100;
    task.completion_date = new Date().toISOString();
    task.updated_at = new Date().toISOString();

    try {
      await supabase.from('tasks').update({
        status_id: toCanonicalStatusId(completedStatus?.id),
        approval_status: 'approved',
        approval_notes: notes || null,
        approved_by: managerId,
        progress_percentage: 100,
        completion_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', taskId);
    } catch (e) {}

    await SystemRepository.recordAuditLog({
      task_id: taskId,
      task_code: task.task_code,
      user_id: managerId,
      action: 'APPROVED_TASK',
      entity_type: 'Task',
      new_value_json: { notes },
    });

    return this.enrichTask(task);
  }

  static async rejectTask(taskId: string, managerId: string, rejectionNotes: string): Promise<Task | null> {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return null;

    const inProgressStatus = await SystemRepository.getStatusByName('In Progress');
    if (inProgressStatus) {
      task.status_id = inProgressStatus.id;
    }
    task.approval_status = 'rejected';
    task.approval_notes = rejectionNotes;
    task.updated_at = new Date().toISOString();

    try {
      await supabase.from('tasks').update({
        status_id: toCanonicalStatusId(inProgressStatus?.id),
        approval_status: 'rejected',
        approval_notes: rejectionNotes,
        updated_at: new Date().toISOString(),
      }).eq('id', taskId);
    } catch (e) {}

    await SystemRepository.recordAuditLog({
      task_id: taskId,
      task_code: task.task_code,
      user_id: managerId,
      action: 'REJECTED_TASK',
      entity_type: 'Task',
      new_value_json: { notes: rejectionNotes },
    });

    return this.enrichTask(task);
  }

  static async delete(id: string, userId?: string): Promise<boolean> {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return false;
    task.deleted_at = new Date().toISOString();

    try {
      await supabase.from('tasks').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    } catch (e) {}

    if (userId) {
      await SystemRepository.recordAuditLog({
        task_id: id,
        task_code: task.task_code,
        user_id: userId,
        action: 'DELETED_TASK',
        entity_type: 'Task',
        entity_id: id,
      });
    }
    return true;
  }

  // Circular Dependency Prevention
  static async addDependency(
    taskId: string,
    dependsOnTaskId: string,
    type: DependencyType = 'finish_to_start'
  ): Promise<{ success: boolean; message?: string }> {
    if (taskId === dependsOnTaskId) {
      return { success: false, message: 'A task cannot depend on itself.' };
    }

    // Check if reverse exists (circular)
    const reverse = this.taskDependenciesList.find(
      (d) => d.task_id === dependsOnTaskId && d.depends_on_task_id === taskId
    );
    if (reverse) {
      return {
        success: false,
        message: 'Circular dependency detected. This relationship would cause an infinite loop.',
      };
    }

    const existing = this.taskDependenciesList.find(
      (d) => d.task_id === taskId && d.depends_on_task_id === dependsOnTaskId
    );
    if (existing) {
      return { success: true };
    }

    this.taskDependenciesList.push({
      id: `dep-${Date.now()}`,
      task_id: taskId,
      depends_on_task_id: dependsOnTaskId,
      dependency_type: type,
      created_at: new Date().toISOString(),
    });

    return { success: true };
  }

  static async duplicate(
    taskId: string,
    options: { duplicateAssignees?: boolean; duplicateDates?: boolean; userId: string }
  ): Promise<Task | null> {
    const original = await this.getById(taskId);
    if (!original) return null;

    const duplicated = await this.create({
      title: `${original.title} (Copy)`,
      description: original.description,
      created_by: options.userId,
      team_id: original.team_id,
      department: original.department,
      category_id: original.category_id,
      priority_id: original.priority_id,
      status_id: '10000000-0000-0000-0000-000000000001',
      start_date: options.duplicateDates ? original.start_date : undefined,
      due_date: options.duplicateDates ? original.due_date : undefined,
      estimated_effort_hours: original.estimated_effort_hours,
      progress_percentage: 0,
      requires_approval: original.requires_approval,
      assignee_ids: options.duplicateAssignees ? (this.taskAssigneesMap[taskId] || []) : [],
      subtasks: original.subtasks?.map((s) => ({ title: s.title, priority: s.priority })),
      checklists: original.checklists?.map((c) => ({ title: c.title })),
    });

    return duplicated;
  }
}
