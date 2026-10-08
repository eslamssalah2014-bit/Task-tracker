const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class ApiClient {
  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (typeof window !== 'undefined') {
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
    return this.request<{ user: any; token: string }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
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

  // Users & Teams
  async getUsers(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<any[]>(`/api/v1/users${query ? `?${query}` : ''}`);
  }

  async createUser(data: any) {
    return this.request<any>('/api/v1/users', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateUserStatus(id: string, status: string) {
    return this.request<any>(`/api/v1/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
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
