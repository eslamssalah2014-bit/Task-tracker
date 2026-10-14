import { UserProfile, UserRole, UserStatus } from '../types';
import { normalizeRole, ROLE_PERMISSIONS } from '../config/permissions';

export class UserRepository {
  private static users: UserProfile[] = [
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
      created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      last_login_at: new Date(Date.now() - 3600000).toISOString(),
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
      created_at: new Date(Date.now() - 80 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      last_login_at: new Date(Date.now() - 5400000).toISOString(),
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
      created_at: new Date(Date.now() - 75 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      last_login_at: new Date(Date.now() - 7200000).toISOString(),
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
      created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      last_login_at: new Date(Date.now() - 14400000).toISOString(),
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
      created_at: new Date(Date.now() - 50 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      last_login_at: new Date(Date.now() - 86400000).toISOString(),
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
      created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      last_login_at: new Date(Date.now() - 2 * 86400000).toISOString(),
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
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      last_login_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
  ];

  /**
   * Helper to format and enrich profile with normalized role and RBAC permissions
   */
  private static enrichUser(user: UserProfile): UserProfile {
    const role_name = normalizeRole(user.role_name);
    const permissions = [...(ROLE_PERMISSIONS[role_name] || [])];
    return {
      ...user,
      role_name,
      permissions,
    };
  }

  static async getAll(filters?: {
    role?: string;
    department?: string;
    status?: string;
    search?: string;
  }): Promise<UserProfile[]> {
    let result = this.users.map((u) => this.enrichUser(u));

    if (filters?.role) {
      const targetRole = normalizeRole(filters.role);
      result = result.filter((u) => u.role_name?.toLowerCase() === targetRole.toLowerCase());
    }

    if (filters?.department) {
      result = result.filter((u) => u.department?.toLowerCase() === filters.department?.toLowerCase());
    }

    if (filters?.status) {
      result = result.filter((u) => u.status === filters.status);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (u) =>
          u.full_name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.phone && u.phone.includes(q))
      );
    }

    return result;
  }

  static async getById(id: string): Promise<UserProfile | null> {
    const user = this.users.find((u) => u.id === id);
    return user ? this.enrichUser(user) : null;
  }

  static async getByEmail(email: string): Promise<UserProfile | null> {
    const user = this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    return user ? this.enrichUser(user) : null;
  }

  static getRoleId(roleName: UserRole): string {
    switch (roleName) {
      case 'Super Admin':
        return '11111111-1111-1111-1111-111111111111';
      case 'Admin':
        return '22222222-1111-2222-1111-222222222222';
      case 'Education Manager':
      case 'Manager':
        return '22222222-2222-2222-2222-222222222222';
      case 'Team Member':
      default:
        return '33333333-3333-3333-3333-333333333333';
    }
  }

  static async create(data: Partial<UserProfile> & { email: string; full_name: string; role_name: UserRole }): Promise<UserProfile> {
    const normalizedRole = normalizeRole(data.role_name);
    const newUser: UserProfile = {
      id: `u-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      email: data.email.trim().toLowerCase(),
      full_name: data.full_name.trim(),
      avatar_url: data.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.full_name)}`,
      phone: data.phone || '',
      role_id: data.role_id || this.getRoleId(normalizedRole),
      role_name: normalizedRole,
      department: data.department || 'General',
      job_title: data.job_title || 'Team Member',
      status: data.status || 'active',
      timezone: data.timezone || 'Africa/Cairo',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.users.push(newUser);
    return this.enrichUser(newUser);
  }

  static async update(id: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) return null;

    const current = this.users[index];
    const newRole = updates.role_name ? normalizeRole(updates.role_name) : current.role_name;

    this.users[index] = {
      ...current,
      ...updates,
      role_name: newRole,
      role_id: updates.role_name ? this.getRoleId(newRole!) : current.role_id,
      updated_at: new Date().toISOString(),
    };

    return this.enrichUser(this.users[index]);
  }

  static async updateStatus(id: string, status: UserStatus): Promise<UserProfile | null> {
    return this.update(id, { status });
  }

  static async delete(id: string): Promise<boolean> {
    const initialLen = this.users.length;
    this.users = this.users.filter((u) => u.id !== id);
    return this.users.length < initialLen;
  }

  static async recordLogin(id: string): Promise<void> {
    const user = this.users.find((u) => u.id === id);
    if (user) {
      user.last_login_at = new Date().toISOString();
    }
  }
}
