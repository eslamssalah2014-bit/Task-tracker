import {
  ActivityLog,
  SavedFilter,
  SystemSetting,
  Tag,
  TaskCategory,
  TaskPriority,
  TaskStatus,
  TaskTemplate,
} from '../types';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import crypto from 'crypto';

export class SystemRepository {
  private static statuses: TaskStatus[] = [
    { id: '10000000-0000-0000-0000-000000000001', name: 'Not Started', color: '#94a3b8', order_index: 1, status_type: 'open', is_default: true },
    { id: '10000000-0000-0000-0000-000000000002', name: 'In Progress', color: '#3b82f6', order_index: 2, status_type: 'in_progress', is_default: false },
    { id: '10000000-0000-0000-0000-000000000003', name: 'Waiting', color: '#f59e0b', order_index: 3, status_type: 'waiting', is_default: false },
    { id: '10000000-0000-0000-0000-000000000004', name: 'Blocked', color: '#ef4444', order_index: 4, status_type: 'in_progress', is_default: false },
    { id: '10000000-0000-0000-0000-000000000005', name: 'Under Review', color: '#8b5cf6', order_index: 5, status_type: 'waiting', is_default: false },
    { id: '10000000-0000-0000-0000-000000000006', name: 'Completed', color: '#10b981', order_index: 6, status_type: 'completed', is_default: false },
    { id: '10000000-0000-0000-0000-000000000007', name: 'Cancelled', color: '#64748b', order_index: 7, status_type: 'cancelled', is_default: false },
  ];

  private static priorities: TaskPriority[] = [
    { id: '20000000-0000-0000-0000-000000000001', name: 'Low', level: 1, order_index: 1, icon: 'arrow-down', color: '#94a3b8', weight: 1 },
    { id: '20000000-0000-0000-0000-000000000002', name: 'Medium', level: 2, order_index: 2, icon: 'minus', color: '#3b82f6', weight: 2 },
    { id: '20000000-0000-0000-0000-000000000003', name: 'High', level: 3, order_index: 3, icon: 'arrow-up', color: '#f59e0b', weight: 3 },
    { id: '20000000-0000-0000-0000-000000000004', name: 'Urgent', level: 4, order_index: 4, icon: 'alert-triangle', color: '#f97316', weight: 4 },
    { id: '20000000-0000-0000-0000-000000000005', name: 'Critical', level: 5, order_index: 5, icon: 'flame', color: '#ef4444', weight: 5 },
  ];

  private static categories: TaskCategory[] = [
    { id: '30000000-0000-0000-0000-000000000001', name: 'Technical', description: 'Technical development & lab engineering', color: '#2563eb' },
    { id: '30000000-0000-0000-0000-000000000002', name: 'Content', description: 'Curriculum & instructional material', color: '#7c3aed' },
    { id: '30000000-0000-0000-0000-000000000003', name: 'Operations', description: 'Daily operations & logistics', color: '#059669' },
    { id: '30000000-0000-0000-0000-000000000004', name: 'Quality', description: 'Quality assurance & benchmarking', color: '#d97706' },
    { id: '30000000-0000-0000-0000-000000000005', name: 'Security', description: 'Penetration testing & SOC audits', color: '#dc2626' },
    { id: '30000000-0000-0000-0000-000000000006', name: 'Meeting', description: 'Internal & client meetings', color: '#4b5563' },
  ];

  private static tags: Tag[] = [
    { id: 't1', name: '#PenTest', color: '#ef4444' },
    { id: 't2', name: '#Content', color: '#8b5cf6' },
    { id: 't3', name: '#Urgent', color: '#f97316' },
    { id: 't4', name: '#Instructor', color: '#06b6d4' },
    { id: 't5', name: '#DevOps', color: '#3b82f6' },
    { id: 't6', name: '#SOC', color: '#10b981' },
  ];

  private static settings: Record<string, any> = {
    no_update_threshold_days: 3,
    sla_urgent_hours: 4,
    sla_high_hours: 24,
    timezone: 'Africa/Cairo',
    workload_thresholds: { low: 3, normal: 6, high: 10 },
  };

  private static templates: TaskTemplate[] = [
    {
      id: 'tmpl-1',
      title: 'Course Outline Review & Verification',
      description: 'Standard procedure for reviewing, cross-checking, and validating track course outlines.',
      category_id: '30000000-0000-0000-0000-000000000002',
      priority_id: '20000000-0000-0000-0000-000000000003',
      estimated_effort_hours: 12,
      template_subtasks_json: [
        { title: 'Collect existing syllabus draft', priority: 'Medium', status: 'Not Started' },
        { title: 'Schedule instructor alignment session', priority: 'High', status: 'Not Started' },
        { title: 'Review lab exercise coverage', priority: 'High', status: 'Not Started' },
        { title: 'Finalize document and submit for approval', priority: 'Urgent', status: 'Not Started' },
      ],
      template_checklist_json: [
        { title: 'Verify prerequisite prerequisites match' },
        { title: 'Ensure learning objectives are measurable' },
        { title: 'Confirm required lab environments' },
      ],
      created_by: '00000000-0000-0000-0000-000000000001',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 'tmpl-2',
      title: 'Security Lab Vulnerability Assessment',
      description: 'End-to-end vulnerability assessment and environment hardening for cyber labs.',
      category_id: '30000000-0000-0000-0000-000000000005',
      priority_id: '20000000-0000-0000-0000-000000000004',
      estimated_effort_hours: 16,
      template_subtasks_json: [
        { title: 'Perform automated vulnerability scan', priority: 'High', status: 'Not Started' },
        { title: 'Manually verify flagged exploitable vectors', priority: 'Critical', status: 'Not Started' },
        { title: 'Compile mitigation report', priority: 'High', status: 'Not Started' },
      ],
      template_checklist_json: [
        { title: 'Firewall rules verified' },
        { title: 'Isolated VLAN confirmed' },
        { title: 'Credential rotation executed' },
      ],
      created_by: '00000000-0000-0000-0000-000000000002',
      created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
  ];

  private static savedFilters: SavedFilter[] = [
    {
      id: 'fltr-1',
      user_id: '00000000-0000-0000-0000-000000000002',
      name: 'My Overdue Tasks',
      filters_json: { isOverdue: true },
      is_shared: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'fltr-2',
      user_id: '00000000-0000-0000-0000-000000000002',
      name: 'Blocked Technical Tasks',
      filters_json: { status: 'Blocked', category: 'Technical' },
      is_shared: true,
      created_at: new Date().toISOString(),
    },
  ];

  private static auditLogs: ActivityLog[] = [
    {
      id: 'log-1',
      task_id: 't-101',
      task_code: 'TASK-000101',
      user_id: '00000000-0000-0000-0000-000000000001',
      action: 'CREATED_TASK',
      entity_type: 'Task',
      old_value_json: null,
      new_value_json: { title: 'Finalize Penetration Testing Course Outline' },
      ip_address: '197.38.12.89',
      created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
    {
      id: 'log-2',
      task_id: 't-101',
      task_code: 'TASK-000101',
      user_id: '00000000-0000-0000-0000-000000000002',
      action: 'STATUS_CHANGED',
      entity_type: 'Task',
      old_value_json: { status: 'Not Started' },
      new_value_json: { status: 'In Progress' },
      ip_address: '197.38.12.89',
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
  ];

  // Helper alias maps for backwards compatibility with 's1', 'p1', etc.
  private static statusAliasMap: Record<string, string> = {
    s1: '10000000-0000-0000-0000-000000000001',
    s2: '10000000-0000-0000-0000-000000000002',
    s3: '10000000-0000-0000-0000-000000000003',
    s4: '10000000-0000-0000-0000-000000000004',
    s5: '10000000-0000-0000-0000-000000000005',
    s6: '10000000-0000-0000-0000-000000000006',
    s7: '10000000-0000-0000-0000-000000000007',
  };

  private static priorityAliasMap: Record<string, string> = {
    p1: '20000000-0000-0000-0000-000000000001',
    p2: '20000000-0000-0000-0000-000000000002',
    p3: '20000000-0000-0000-0000-000000000003',
    p4: '20000000-0000-0000-0000-000000000004',
    p5: '20000000-0000-0000-0000-000000000005',
  };

  private static categoryAliasMap: Record<string, string> = {
    c1: '30000000-0000-0000-0000-000000000001',
    c2: '30000000-0000-0000-0000-000000000002',
    c3: '30000000-0000-0000-0000-000000000003',
    c4: '30000000-0000-0000-0000-000000000004',
    c5: '30000000-0000-0000-0000-000000000005',
    c6: '30000000-0000-0000-0000-000000000006',
  };

  // Statuses
  static async getStatuses(): Promise<TaskStatus[]> {
    try {
      const { data, error } = await supabase.from('task_statuses').select('*').order('order_index', { ascending: true });
      if (!error && Array.isArray(data) && data.length > 0) {
        this.statuses = data as TaskStatus[];
        return this.statuses;
      }
    } catch (e) {
      logger.warn('[SystemRepository] Supabase getStatuses failed, using cache:', e);
    }
    return [...this.statuses].sort((a, b) => a.order_index - b.order_index);
  }

  static async getStatusById(id: string): Promise<TaskStatus | null> {
    const canonicalId = this.statusAliasMap[id] || id;
    const all = await this.getStatuses();
    return all.find((s) => s.id === canonicalId || s.id === id) || null;
  }

  static async getStatusByName(name: string): Promise<TaskStatus | null> {
    const all = await this.getStatuses();
    return all.find((s) => s.name.toLowerCase() === name.toLowerCase()) || null;
  }

  static async createStatus(data: Omit<TaskStatus, 'id'>): Promise<TaskStatus> {
    const newId = crypto.randomUUID();
    const newStatus: TaskStatus = {
      id: newId,
      ...data,
    };
    try {
      await supabase.from('task_statuses').insert(newStatus);
    } catch (e) {
      logger.warn('[SystemRepository] Supabase createStatus failed:', e);
    }
    this.statuses.push(newStatus);
    return newStatus;
  }

  static async updateStatus(id: string, data: Partial<TaskStatus>): Promise<TaskStatus | null> {
    const canonicalId = this.statusAliasMap[id] || id;
    try {
      await supabase.from('task_statuses').update(data).eq('id', canonicalId);
    } catch (e) {
      logger.warn('[SystemRepository] Supabase updateStatus failed:', e);
    }
    const idx = this.statuses.findIndex((s) => s.id === canonicalId || s.id === id);
    if (idx !== -1) {
      this.statuses[idx] = { ...this.statuses[idx], ...data };
      return this.statuses[idx];
    }
    return null;
  }

  // Priorities
  static async getPriorities(): Promise<TaskPriority[]> {
    try {
      const { data, error } = await supabase.from('task_priorities').select('*').order('order_index', { ascending: true });
      if (!error && Array.isArray(data) && data.length > 0) {
        this.priorities = data as TaskPriority[];
        return this.priorities;
      }
    } catch (e) {
      logger.warn('[SystemRepository] Supabase getPriorities failed, using cache:', e);
    }
    return [...this.priorities].sort((a, b) => a.order_index - b.order_index);
  }

  static async getPriorityById(id: string): Promise<TaskPriority | null> {
    const canonicalId = this.priorityAliasMap[id] || id;
    const all = await this.getPriorities();
    return all.find((p) => p.id === canonicalId || p.id === id) || null;
  }

  // Categories & Tags
  static async getCategories(): Promise<TaskCategory[]> {
    try {
      const { data, error } = await supabase.from('task_categories').select('*');
      if (!error && Array.isArray(data) && data.length > 0) {
        this.categories = data as TaskCategory[];
        return this.categories;
      }
    } catch (e) {
      logger.warn('[SystemRepository] Supabase getCategories failed, using cache:', e);
    }
    return [...this.categories];
  }

  static async getCategoryById(id: string): Promise<TaskCategory | null> {
    const canonicalId = this.categoryAliasMap[id] || id;
    const all = await this.getCategories();
    return all.find((c) => c.id === canonicalId || c.id === id) || null;
  }

  static async createCategory(data: Omit<TaskCategory, 'id'>): Promise<TaskCategory> {
    const newId = crypto.randomUUID();
    const newCat = { id: newId, ...data };
    try {
      await supabase.from('task_categories').insert(newCat);
    } catch (e) {
      logger.warn('[SystemRepository] Supabase createCategory failed:', e);
    }
    this.categories.push(newCat);
    return newCat;
  }

  static async getTags(): Promise<Tag[]> {
    return [...this.tags];
  }

  static async createTag(name: string, color?: string): Promise<Tag> {
    const existing = this.tags.find((t) => t.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing;
    const newTag = { id: `tag-${Date.now()}`, name, color: color || '#3b82f6' };
    this.tags.push(newTag);
    return newTag;
  }

  // Settings
  static async getSettings(): Promise<Record<string, any>> {
    return { ...this.settings };
  }

  static async updateSetting(key: string, value: any): Promise<void> {
    this.settings[key] = value;
  }

  // Templates
  static async getTemplates(): Promise<TaskTemplate[]> {
    return [...this.templates];
  }

  static async createTemplate(tmpl: Omit<TaskTemplate, 'id' | 'created_at'>): Promise<TaskTemplate> {
    const newTmpl: TaskTemplate = {
      id: crypto.randomUUID(),
      ...tmpl,
      created_at: new Date().toISOString(),
    };
    this.templates.push(newTmpl);
    return newTmpl;
  }

  // Saved Filters
  static async getSavedFilters(userId: string): Promise<SavedFilter[]> {
    return this.savedFilters.filter((f) => f.user_id === userId || f.is_shared);
  }

  static async createSavedFilter(data: Omit<SavedFilter, 'id' | 'created_at'>): Promise<SavedFilter> {
    const item: SavedFilter = {
      id: crypto.randomUUID(),
      ...data,
      created_at: new Date().toISOString(),
    };
    this.savedFilters.push(item);
    return item;
  }

  // Audit Logs
  static async getAuditLogs(filters?: {
    userId?: string;
    taskId?: string;
    module?: string;
    limit?: number;
  }): Promise<ActivityLog[]> {
    let result = [...this.auditLogs];
    if (filters?.userId) result = result.filter((l) => l.user_id === filters.userId);
    if (filters?.taskId) result = result.filter((l) => l.task_id === filters.taskId);
    if (filters?.module) result = result.filter((l) => l.entity_type.toLowerCase() === filters.module?.toLowerCase());
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (filters?.limit) result = result.slice(0, filters.limit);
    return result;
  }

  static async recordAuditLog(log: Omit<ActivityLog, 'id' | 'created_at'>): Promise<ActivityLog> {
    const entry: ActivityLog = {
      id: crypto.randomUUID(),
      ...log,
      created_at: new Date().toISOString(),
    };
    this.auditLogs.unshift(entry);
    return entry;
  }
}
