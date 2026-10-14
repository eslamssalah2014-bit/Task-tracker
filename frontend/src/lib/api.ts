const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class ApiClient {
  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('tt_auth_token');
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      } else {
        const storedUser = localStorage.getItem('tt_current_user');
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);
            if (user.id) {
              headers['Authorization'] = `Bearer ${user.id}`;
              headers['X-User-Id'] = user.id;
            }
          } catch (e) {
            // ignore
          }
        }
      }
    }
    return headers;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...(options.headers || {}),
        },
      });

      if (res.status === 401) {
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          localStorage.removeItem('tt_auth_token');
          localStorage.removeItem('tt_current_user');
          window.location.href = '/login?expired=1';
        }
      }

      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.message || `Request failed with status ${res.status}`);
      }

      return json.data as T;
    } catch (err: any) {
      console.error(`[API Error] ${endpoint}:`, err);
      throw err;
    }
  }

  // Auth
  async login(email: string, password: string) {
    const res = await this.request<{ user: any; token: string }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res?.token && typeof window !== 'undefined') {
      localStorage.setItem('tt_auth_token', res.token);
    }
    return res;
  }

  async logout() {
    try {
      await this.request('/api/v1/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('tt_auth_token');
        localStorage.removeItem('tt_current_user');
      }
    }
  }

  async getMe() {
    return this.request<any>('/api/v1/auth/me');
  }

  // Tasks
  async getTasks(params: Record<string, any> = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
    });
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<any[]>(`/api/v1/tasks${qs}`);
  }

  async getTask(idOrCode: string) {
    return this.request<any>(`/api/v1/tasks/${idOrCode}`);
  }

  async createTask(data: any) {
    return this.request<any>('/api/v1/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTask(id: string, data: any) {
    return this.request<any>(`/api/v1/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteTask(id: string) {
    return this.request<any>(`/api/v1/tasks/${id}`, { method: 'DELETE' });
  }

  async addTaskUpdate(id: string, data: { updateText: string; progressPercentage: number; nextStep?: string; blockerText?: string; statusId?: string }) {
    return this.request<any>(`/api/v1/tasks/${id}/updates`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async markTaskBlocked(id: string, data: { blockerType: string; blockerDescription: string; expectedResolutionDate?: string }) {
    return this.request<any>(`/api/v1/tasks/${id}/blocked`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resolveBlocker(id: string) {
    return this.request<any>(`/api/v1/tasks/${id}/unblock`, { method: 'POST' });
  }

  async addSubtask(taskId: string, data: any) {
    return this.request<any>(`/api/v1/tasks/${taskId}/subtasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSubtask(subtaskId: string, data: any) {
    return this.request<any>(`/api/v1/tasks/subtasks/${subtaskId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async toggleChecklist(itemId: string, isCompleted: boolean) {
    return this.request<any>(`/api/v1/tasks/checklists/${itemId}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ isCompleted }),
    });
  }

  async addComment(taskId: string, text: string, mentions?: string[]) {
    return this.request<any>(`/api/v1/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text, mentions }),
    });
  }

  async submitForApproval(taskId: string) {
    return this.request<any>(`/api/v1/tasks/${taskId}/submit-approval`, { method: 'POST' });
  }

  async approveTask(taskId: string, notes?: string) {
    return this.request<any>(`/api/v1/tasks/${taskId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  async rejectTask(taskId: string, notes: string) {
    return this.request<any>(`/api/v1/tasks/${taskId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  async duplicateTask(taskId: string) {
    return this.request<any>(`/api/v1/tasks/${taskId}/duplicate`, { method: 'POST', body: JSON.stringify({}) });
  }

  async getAISummary(taskId: string) {
    return this.request<any>(`/api/v1/tasks/${taskId}/ai-summary`);
  }

  // Dashboard & Insights
  async getDashboardSummary(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<any>(`/api/v1/dashboard/summary${query ? `?${query}` : ''}`);
  }

  async getDashboardCharts(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<any>(`/api/v1/dashboard/charts${query ? `?${query}` : ''}`);
  }

  async getManagerInsights() {
    return this.request<any>('/api/v1/dashboard/manager-insights');
  }

  // Users & Teams with offline/network resilience
  private getFallbackUsers(): any[] {
    return [
      {
        id: 'u0000001-0000-0000-0000-000000000001',
        email: 'eslam@tasktracker.io',
        full_name: 'Eslam Salah',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        phone: '+20 100 123 4567',
        role_id: '11111111-1111-1111-1111-111111111111',
        role_name: 'Super Admin',
        department: 'Executive',
        job_title: 'Head of Operations & Systems',
        status: 'active',
        timezone: 'Africa/Cairo',
        active_tasks_count: 5,
        completed_tasks_count: 14,
      },
      {
        id: 'u0000007-0000-0000-0000-000000000007',
        email: 'admin@tasktracker.io',
        full_name: 'Tarek Nabil',
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        phone: '+20 100 888 9999',
        role_id: '22222222-1111-2222-1111-222222222222',
        role_name: 'Admin',
        department: 'Operations & Administration',
        job_title: 'Operations Administrator',
        status: 'active',
        timezone: 'Africa/Cairo',
        active_tasks_count: 3,
        completed_tasks_count: 9,
      },
      {
        id: 'u0000002-0000-0000-0000-000000000002',
        email: 'walied@tasktracker.io',
        full_name: 'Walied Said',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        phone: '+20 100 234 5678',
        role_id: '22222222-2222-2222-2222-222222222222',
        role_name: 'Education Manager',
        department: 'Education & Tech',
        job_title: 'Education & Security Manager',
        status: 'active',
        timezone: 'Africa/Cairo',
        active_tasks_count: 8,
        completed_tasks_count: 22,
      },
      {
        id: 'u0000003-0000-0000-0000-000000000003',
        email: 'sarah@tasktracker.io',
        full_name: 'Sarah Ahmed',
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        phone: '+20 100 345 6789',
        role_id: '33333333-3333-3333-3333-333333333333',
        role_name: 'Team Member',
        department: 'Education & Tech',
        job_title: 'Senior Penetration Testing Lead',
        status: 'active',
        timezone: 'Africa/Cairo',
        active_tasks_count: 4,
        completed_tasks_count: 18,
      },
      {
        id: 'u0000004-0000-0000-0000-000000000004',
        email: 'mohamed@tasktracker.io',
        full_name: 'Mohamed Mostafa',
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        phone: '+20 100 456 7890',
        role_id: '33333333-3333-3333-3333-333333333333',
        role_name: 'Team Member',
        department: 'Infrastructure',
        job_title: 'DevOps & Cloud Engineer',
        status: 'active',
        timezone: 'Africa/Cairo',
        active_tasks_count: 3,
        completed_tasks_count: 12,
      },
      {
        id: 'u0000005-0000-0000-0000-000000000005',
        email: 'nourhan@tasktracker.io',
        full_name: 'Nourhan Ali',
        avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
        phone: '+20 100 567 8901',
        role_id: '33333333-3333-3333-3333-333333333333',
        role_name: 'Team Member',
        department: 'Quality Assurance',
        job_title: 'QA & Content Coordinator',
        status: 'active',
        timezone: 'Africa/Cairo',
        active_tasks_count: 6,
        completed_tasks_count: 27,
      },
      {
        id: 'u0000006-0000-0000-0000-000000000006',
        email: 'kareem@tasktracker.io',
        full_name: 'Kareem Hassan',
        avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        phone: '+20 100 678 9012',
        role_id: '33333333-3333-3333-3333-333333333333',
        role_name: 'Team Member',
        department: 'Security Operations',
        job_title: 'SOC Analyst Tier II',
        status: 'active',
        timezone: 'Africa/Cairo',
        active_tasks_count: 2,
        completed_tasks_count: 8,
      },
    ];
  }

  private getStoredUsers(): any[] {
    if (typeof window === 'undefined') return this.getFallbackUsers();
    try {
      const stored = localStorage.getItem('tt_cached_users');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    const initial = this.getFallbackUsers();
    localStorage.setItem('tt_cached_users', JSON.stringify(initial));
    return initial;
  }

  async getUsers(params: Record<string, any> = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
    });
    const qs = query.toString() ? `?${query.toString()}` : '';

    try {
      const users = await this.request<any[]>(`/api/v1/users${qs}`);
      if (Array.isArray(users) && users.length > 0 && typeof window !== 'undefined') {
        localStorage.setItem('tt_cached_users', JSON.stringify(users));
      }
      return users;
    } catch (err: any) {
      // Fallback to local store if backend server is unreachable
      let list = this.getStoredUsers();
      if (params.role) {
        list = list.filter((u) => u.role_name?.toLowerCase() === params.role.toLowerCase());
      }
      if (params.status) {
        list = list.filter((u) => u.status === params.status);
      }
      if (params.search) {
        const q = params.search.toLowerCase();
        list = list.filter(
          (u) =>
            u.full_name?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.phone?.includes(q)
        );
      }
      return list;
    }
  }

  async createUser(data: any) {
    try {
      const res = await this.request<any>('/api/v1/users', { method: 'POST', body: JSON.stringify(data) });
      if (typeof window !== 'undefined') {
        const current = this.getStoredUsers();
        current.push(res);
        localStorage.setItem('tt_cached_users', JSON.stringify(current));
      }
      return res;
    } catch (err: any) {
      // If network connection failed (backend offline or unreachable), persist locally to ensure continuity
      if (err.name === 'TypeError' || err.message === 'Failed to fetch' || err.message?.includes('fetch')) {
        const localUser = {
          id: `u-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          email: data.email.trim().toLowerCase(),
          full_name: data.full_name.trim(),
          avatar_url: data.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.full_name)}`,
          phone: data.phone || '',
          role_name: data.role_name || 'Team Member',
          role_id: data.role_name === 'Super Admin' ? '11111111-1111-1111-1111-111111111111' : '22222222-1111-2222-1111-222222222222',
          department: data.department || 'General',
          job_title: data.job_title || 'Team Member',
          status: 'active',
          timezone: 'Africa/Cairo',
          created_at: new Date().toISOString(),
          active_tasks_count: 0,
          completed_tasks_count: 0,
        };

        if (typeof window !== 'undefined') {
          const current = this.getStoredUsers();
          current.push(localUser);
          localStorage.setItem('tt_cached_users', JSON.stringify(current));
        }

        return localUser;
      }
      throw err;
    }
  }

  async updateUserStatus(id: string, status: string) {
    try {
      const res = await this.request<any>(`/api/v1/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      if (typeof window !== 'undefined') {
        const current = this.getStoredUsers();
        const index = current.findIndex((u) => u.id === id);
        if (index !== -1) {
          current[index].status = status;
          localStorage.setItem('tt_cached_users', JSON.stringify(current));
        }
      }
      return res;
    } catch (err: any) {
      if (err.name === 'TypeError' || err.message === 'Failed to fetch' || err.message?.includes('fetch')) {
        if (typeof window !== 'undefined') {
          const current = this.getStoredUsers();
          const index = current.findIndex((u) => u.id === id);
          if (index !== -1) {
            current[index].status = status;
            localStorage.setItem('tt_cached_users', JSON.stringify(current));
            return current[index];
          }
        }
      }
      throw err;
    }
  }

  async getTeams() {
    return this.request<any[]>('/api/v1/teams');
  }

  async createTeam(data: any) {
    return this.request<any>('/api/v1/teams', { method: 'POST', body: JSON.stringify(data) });
  }

  // Reports
  async getReportsSummary(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<any>(`/api/v1/reports/summary${query ? `?${query}` : ''}`);
  }

  getExportCsvUrl(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return `${API_BASE}/api/v1/reports/export-csv${query ? `?${query}` : ''}`;
  }

  // Settings & Metadata
  async getMetadata() {
    return this.request<any>('/api/v1/settings/metadata');
  }

  async getAuditLogs(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<any[]>(`/api/v1/settings/audit-logs${query ? `?${query}` : ''}`);
  }

  async getTemplates() {
    return this.request<any[]>('/api/v1/settings/templates');
  }

  async createTemplate(data: any) {
    return this.request<any>('/api/v1/settings/templates', { method: 'POST', body: JSON.stringify(data) });
  }

  // Notifications
  async getNotifications() {
    return this.request<{ notifications: any[]; unreadCount: number }>('/api/v1/notifications');
  }

  async markNotificationRead(id: string) {
    return this.request<any>(`/api/v1/notifications/${id}/read`, { method: 'PATCH' });
  }

  async markAllNotificationsRead() {
    return this.request<any>('/api/v1/notifications/read-all', { method: 'POST' });
  }
}

export const api = new ApiClient();
