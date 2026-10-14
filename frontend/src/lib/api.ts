/**
 * Task Tracker - Centralized API Client
 * Enterprise-grade HTTP client with environment resolution, request timeouts,
 * safe retries for idempotent requests, and structured error reporting.
 */

export class ApiError extends Error {
  statusCode: number;
  code?: string;
  details?: any;

  constructor(message: string, statusCode: number, code?: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class NetworkError extends Error {
  isNetworkError = true;
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ApiConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiConfigurationError';
  }
}

/**
 * Resolves and validates the API base URL according to current environment
 */
export function getApiBaseUrl(): string {
  const isBrowser = typeof window !== 'undefined';

  // Server-side: read bound service URL injected by Vercel Services
  if (!isBrowser && process.env.BACKEND_URL) {
    return process.env.BACKEND_URL.trim().replace(/\/+$/, '');
  }

  const configured = (process.env.NEXT_PUBLIC_API_URL || '').trim();
  const isLocalHost = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const isDev = process.env.NODE_ENV === 'development';

  if (configured) {
    const sanitized = configured.replace(/\/+$/, '');

    // Allow localhost when accessed locally on developer machine (dev or local production preview)
    if (isLocalHost || isDev) {
      return sanitized;
    }

    // On a remote deployed domain (e.g. Vercel), if NEXT_PUBLIC_API_URL points to localhost:
    if (!isLocalHost && (sanitized.includes('localhost') || sanitized.includes('127.0.0.1'))) {
      console.warn(
        '[API Client] NEXT_PUBLIC_API_URL points to localhost on a remote deployment (' +
          (isBrowser ? window.location.hostname : 'server') +
          '). Defaulting to relative proxy paths.'
      );
      return '';
    }

    return sanitized;
  }

  // If in browser on a deployed domain and NEXT_PUBLIC_API_URL is not set:
  if (isBrowser && !isLocalHost) {
    return ''; // Relative path, handled by Next.js rewrites
  }

  // Development / local fallback
  return 'http://localhost:5000';
}

class ApiClient {
  private timeoutMs = 25000; // 25s timeout for cold starts

  /**
   * Normalizes the API endpoint path and avoids double /api/v1 prefixes
   */
  private buildUrl(endpoint: string): string {
    const base = getApiBaseUrl();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    if (!base) {
      return cleanEndpoint;
    }

    return `${base}${cleanEndpoint}`;
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
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
            if (user?.id) {
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

  /**
   * Executes a fetch request with timeout and safe retries for idempotent GET requests
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    const url = this.buildUrl(endpoint);
    const method = (options.method || 'GET').toUpperCase();
    const isIdempotent = method === 'GET';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...this.getHeaders(),
          ...(options.headers || {}),
        },
      });

      clearTimeout(timeoutId);

      // Handle 401 Unauthorized
      if (res.status === 401) {
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          localStorage.removeItem('tt_auth_token');
          localStorage.removeItem('tt_current_user');
          window.location.href = '/login?expired=1';
        }
      }

      let json: any = null;
      const text = await res.text();
      if (text) {
        try {
          json = JSON.parse(text);
        } catch {
          // Non-JSON response
          if (!res.ok) {
            throw new ApiError(
              `Server returned error ${res.status}: ${res.statusText}`,
              res.status
            );
          }
          return text as unknown as T;
        }
      }

      if (!res.ok || json?.success === false) {
        const message =
          json?.message ||
          (json?.errors && Array.isArray(json.errors) ? json.errors.join(', ') : null) ||
          `Request failed with status ${res.status}`;
        throw new ApiError(message, res.status, json?.code, json?.errors || json?.data);
      }

      return (json?.data !== undefined ? json.data : json) as T;
    } catch (err: any) {
      clearTimeout(timeoutId);

      // Distinguish Abort / Timeout
      if (err.name === 'AbortError') {
        throw new NetworkError(
          'Request timed out. The server took too long to respond. Please verify your connection or try again.'
        );
      }

      // Distinguish Network errors
      if (
        err.name === 'TypeError' ||
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('fetch failed') ||
        err.message?.includes('NetworkError')
      ) {
        // Safe retry for idempotent GET requests only
        if (isIdempotent && retryCount < 2) {
          const delay = (retryCount + 1) * 800;
          await new Promise((r) => setTimeout(r, delay));
          return this.request<T>(endpoint, options, retryCount + 1);
        }

        throw new NetworkError(
          'Unable to communicate with the backend server. Please verify your internet connection or backend server status.'
        );
      }

      // Re-throw structured API errors
      throw err;
    }
  }

  // --- Auth Endpoints ---
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
      // Ignore network errors on logout
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

  // --- Task Endpoints ---
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

  async addTaskUpdate(
    id: string,
    data: {
      updateText: string;
      progressPercentage: number;
      nextStep?: string;
      blockerText?: string;
      statusId?: string;
    }
  ) {
    return this.request<any>(`/api/v1/tasks/${id}/updates`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async markTaskBlocked(
    id: string,
    data: {
      blockerType: string;
      blockerDescription: string;
      expectedResolutionDate?: string;
    }
  ) {
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
    return this.request<any>(`/api/v1/tasks/${taskId}/duplicate`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async getAISummary(taskId: string) {
    return this.request<any>(`/api/v1/tasks/${taskId}/ai-summary`);
  }

  // --- Dashboard & Insights ---
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

  // --- User Management (No dangerous localStorage fakes) ---
  async getUsers(params: Record<string, any> = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
    });
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<any[]>(`/api/v1/users${qs}`);
  }

  async getUserById(id: string) {
    return this.request<any>(`/api/v1/users/${id}`);
  }

  async createUser(data: any) {
    return this.request<any>('/api/v1/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: string, data: any) {
    return this.request<any>(`/api/v1/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updateUserStatus(id: string, status: string) {
    return this.request<any>(`/api/v1/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // --- Teams ---
  async getTeams() {
    return this.request<any[]>('/api/v1/teams');
  }

  async getTeamById(id: string) {
    return this.request<any>(`/api/v1/teams/${id}`);
  }

  async createTeam(data: any) {
    return this.request<any>('/api/v1/teams', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTeam(id: string, data: any) {
    return this.request<any>(`/api/v1/teams/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // --- Reports & Exports ---
  async getReportsSummary(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<any>(`/api/v1/reports/summary${query ? `?${query}` : ''}`);
  }

  getExportCsvUrl(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    const base = getApiBaseUrl();
    const endpoint = `/api/v1/reports/export-csv${query ? `?${query}` : ''}`;
    return base ? `${base}${endpoint}` : endpoint;
  }

  // --- Settings & Metadata ---
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
    return this.request<any>('/api/v1/settings/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- Notifications ---
  async getNotifications() {
    return this.request<{ notifications: any[]; unreadCount: number }>('/api/v1/notifications');
  }

  async markNotificationRead(id: string) {
    return this.request<any>(`/api/v1/notifications/${id}/read`, { method: 'PATCH' });
  }

  async markAllNotificationsRead() {
    return this.request<any>('/api/v1/notifications/read-all', { method: 'POST' });
  }

  // --- System Diagnostics ---
  async getHealth() {
    return this.request<any>('/api/v1/health');
  }

  async getDiagnostics() {
    return this.request<any>('/api/v1/health/diagnostics');
  }
}

export const api = new ApiClient();
