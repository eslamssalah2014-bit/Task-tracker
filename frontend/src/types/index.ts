export type UserRole = 'Super Admin' | 'Manager' | 'Team Member';
export type UserStatus = 'active' | 'disabled' | 'pending';
export type TaskStatusType = 'open' | 'in_progress' | 'waiting' | 'completed' | 'cancelled';

export type BlockerType =
  | 'Waiting for Approval'
  | 'Waiting for Another Team'
  | 'Technical Issue'
  | 'Missing Information'
  | 'Missing Resources'
  | 'Client Dependency'
  | 'Management Decision'
  | 'Other';

export type TaskHealth = 'Healthy' | 'At Risk' | 'Critical' | 'Blocked' | 'Completed';
export type WorkloadLevel = 'Low' | 'Normal' | 'High' | 'Overloaded';
export type ApprovalStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  role_id: string;
  role_name?: UserRole;
  department?: string;
  job_title?: string;
  status: UserStatus;
  timezone: string;
  last_login_at?: string;
  created_at: string;
  active_tasks_count?: number;
  completed_tasks_count?: number;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  manager_id?: string;
  manager_name?: string;
  department?: string;
  status: 'active' | 'archived';
  members?: Array<{ team_id: string; user_id: string; role_in_team: string; user?: UserProfile }>;
  active_tasks_count?: number;
  completed_tasks_count?: number;
  overdue_tasks_count?: number;
  created_at: string;
}

export interface TaskStatus {
  id: string;
  name: string;
  color: string;
  order_index: number;
  status_type: TaskStatusType;
  is_default: boolean;
}

export interface TaskPriority {
  id: string;
  name: string;
  level: number;
  order_index: number;
  icon: string;
  color: string;
  weight: number;
}

export interface TaskCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  task_code: string;
  title: string;
  description?: string;
  created_by: string;
  creator?: UserProfile;
  team_id?: string;
  team?: Team;
  department?: string;
  category_id?: string;
  category?: TaskCategory;
  priority_id: string;
  priority?: TaskPriority;
  status_id: string;
  status?: TaskStatus;
  start_date?: string;
  due_date?: string;
  due_time?: string;
  estimated_effort_hours: number;
  progress_percentage: number;
  requires_approval: boolean;
  approval_status: ApprovalStatus;
  approval_notes?: string;
  approved_by?: string;
  completion_date?: string;
  is_archived: boolean;
  is_pinned: boolean;
  is_favorite: boolean;
  recurrence_rule?: string;
  created_at: string;
  updated_at: string;

  assignees?: UserProfile[];
  subtasks?: Subtask[];
  checklists?: ChecklistItem[];
  dependencies?: TaskDependency[];
  updates?: TaskUpdate[];
  comments?: TaskComment[];
  blocker?: TaskBlocker;

  // Computed
  days_remaining?: number;
  is_overdue?: boolean;
  overdue_days?: number;
  is_due_today?: boolean;
  is_due_this_week?: boolean;
  health?: TaskHealth;
  health_score?: number;
  has_recent_update?: boolean;
  days_since_last_update?: number;
  risk_reason?: string;
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  assigned_to?: string;
  assignee?: UserProfile;
  status: string;
  priority: string;
  due_date?: string;
  progress_percentage: number;
  notes?: string;
  order_index: number;
}

export interface ChecklistItem {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  order_index: number;
}

export interface TaskDependency {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  depends_on_task_code?: string;
  depends_on_task_title?: string;
  depends_on_task_status?: string;
  depends_on_is_completed?: boolean;
  dependency_type: string;
}

export interface TaskUpdate {
  id: string;
  task_id: string;
  user_id: string;
  user?: UserProfile;
  update_text: string;
  progress_percentage: number;
  status_id?: string;
  next_step?: string;
  blocker_text?: string;
  created_at: string;
}

export interface TaskBlocker {
  id: string;
  task_id: string;
  blocker_type: BlockerType;
  blocker_description: string;
  expected_resolution_date?: string;
  created_by?: string;
  created_at: string;
  duration_days?: number;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  user?: UserProfile;
  comment_text: string;
  mentions?: string[];
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface DashboardSummary {
  total_tasks: number;
  active_tasks: number;
  not_started: number;
  in_progress: number;
  waiting: number;
  blocked: number;
  under_review: number;
  completed: number;
  cancelled: number;
  overdue: number;
  due_today: number;
  due_this_week: number;
  tasks_without_recent_updates: number;
  high_risk_tasks: number;
}

export interface WorkloadItem {
  user: UserProfile;
  active_tasks: number;
  urgent_tasks: number;
  overdue_tasks: number;
  blocked_tasks: number;
  estimated_remaining_hours: number;
  workload_level: WorkloadLevel;
}

export interface OperationalInsight {
  id: string;
  type: 'danger' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  count?: number;
  filterParams?: Record<string, any>;
}

export interface TaskTemplate {
  id: string;
  title: string;
  description?: string;
  category_id?: string;
  priority_id?: string;
  estimated_effort_hours: number;
  template_subtasks_json?: any[];
  template_checklist_json?: any[];
}
