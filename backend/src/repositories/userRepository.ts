import { UserProfile, UserRole, UserStatus } from '../types';
import { normalizeRole, ROLE_PERMISSIONS } from '../config/permissions';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import crypto from 'crypto';

export class UserRepository {
  private static users: UserProfile[] = [
    {
      id: '00000000-0000-0000-0000-000000000001',
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
      id: '00000000-0000-0000-0000-000000000007',
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
      id: '00000000-0000-0000-0000-000000000002',
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
      id: '00000000-0000-0000-0000-000000000003',
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
      id: '00000000-0000-0000-0000-000000000004',
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
      id: '00000000-0000-0000-0000-000000000005',
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
      id: '00000000-0000-0000-0000-000000000006',
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

  static getRoleNameFromId(roleId: string): UserRole {
    switch (roleId) {
      case '11111111-1111-1111-1111-111111111111':
        return 'Super Admin';
      case '22222222-1111-2222-1111-222222222222':
        return 'Admin';
      case '22222222-2222-2222-2222-222222222222':
        return 'Education Manager';
      case '33333333-3333-3333-3333-333333333333':
      default:
        return 'Team Member';
    }
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

  private static enrichUser(user: Partial<UserProfile> & { role_id?: string; role_name?: string }): UserProfile {
    const rawRole = user.role_name || (user.role_id ? this.getRoleNameFromId(user.role_id) : 'Team Member');
    const role_name = normalizeRole(rawRole);
    const role_id = user.role_id || this.getRoleId(role_name);
    const permissions = [...(ROLE_PERMISSIONS[role_name] || [])];

    return {
      id: user.id || crypto.randomUUID(),
      email: (user.email || '').toLowerCase().trim(),
      full_name: user.full_name || 'Team Member',
      avatar_url: user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.full_name || 'User')}`,
      phone: user.phone || '',
      role_id,
      role_name,
      department: user.department || 'Education & Tech',
      job_title: user.job_title || 'Team Member',
      status: (user.status as UserStatus) || 'active',
      timezone: user.timezone || 'Africa/Cairo',
      created_at: user.created_at || new Date().toISOString(),
      updated_at: user.updated_at || new Date().toISOString(),
      last_login_at: user.last_login_at,
      permissions,
    };
  }

  /**
   * Retrieves all users from Supabase PostgreSQL (or fallback cache on connection failure)
   */
  static async getAll(filters?: {
    role?: string;
    department?: string;
    status?: string;
    search?: string;
  }): Promise<UserProfile[]> {
    try {
      let query = supabase.from('profiles').select('*').is('deleted_at', null);

      if (filters?.department) {
        query = query.ilike('department', filters.department);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        let results = data.map((row) => this.enrichUser(row));

        if (filters?.role) {
          const target = normalizeRole(filters.role);
          results = results.filter((u) => u.role_name?.toLowerCase() === target.toLowerCase());
        }

        // Keep local cache updated
        this.users = results;
        return results;
      }
    } catch (e) {
      logger.warn('[UserRepository] Supabase query failed, using in-memory cache:', e);
    }

    // Fallback filter over in-memory cache
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
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
      if (!error && data) {
        return this.enrichUser(data);
      }
    } catch (e) {
      logger.warn(`[UserRepository] getById failed in Supabase for ${id}:`, e);
    }

    const user = this.users.find((u) => u.id === id);
    return user ? this.enrichUser(user) : null;
  }

  static async getByEmail(email: string): Promise<UserProfile | null> {
    const clean = email.toLowerCase().trim();
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('email', clean).maybeSingle();
      if (!error && data) {
        return this.enrichUser(data);
      }
    } catch (e) {
      logger.warn(`[UserRepository] getByEmail failed in Supabase for ${clean}:`, e);
    }

    const user = this.users.find((u) => u.email.toLowerCase() === clean);
    return user ? this.enrichUser(user) : null;
  }

  static async create(data: Partial<UserProfile> & { email: string; full_name: string; role_name: UserRole }): Promise<UserProfile> {
    const normalizedRole = normalizeRole(data.role_name);
    const role_id = data.role_id || this.getRoleId(normalizedRole);
    const id = data.id || crypto.randomUUID();

    const newProfile = {
      id,
      email: data.email.trim().toLowerCase(),
      full_name: data.full_name.trim(),
      avatar_url: data.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.full_name)}`,
      phone: data.phone || '',
      role_id,
      department: data.department || 'Education & Tech',
      job_title: data.job_title || 'Team Member',
      status: (data.status as UserStatus) || 'active',
      timezone: data.timezone || 'Africa/Cairo',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save to Supabase PostgreSQL database
    try {
      const { data: dbData, error } = await supabase.from('profiles').insert(newProfile).select().single();
      if (error) {
        logger.error('[UserRepository] Failed to insert profile into Supabase:', error);
      } else if (dbData) {
        const enriched = this.enrichUser(dbData);
        this.users.unshift(enriched);
        return enriched;
      }
    } catch (err) {
      logger.error('[UserRepository] Network/db error during profile insert:', err);
    }

    // Keep cached in memory
    const enriched = this.enrichUser({ ...newProfile, role_name: normalizedRole });
    this.users.unshift(enriched);
    return enriched;
  }

  static async update(id: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const current = await this.getById(id);
    if (!current) return null;

    const newRole = updates.role_name ? normalizeRole(updates.role_name) : current.role_name;
    const role_id = updates.role_id || (updates.role_name ? this.getRoleId(newRole!) : current.role_id);

    const updatePayload: Record<string, any> = {
      ...updates,
      role_id,
      updated_at: new Date().toISOString(),
    };
    delete updatePayload.role_name;
    delete updatePayload.permissions;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        const enriched = this.enrichUser(data);
        const idx = this.users.findIndex((u) => u.id === id);
        if (idx !== -1) this.users[idx] = enriched;
        return enriched;
      }
    } catch (e) {
      logger.warn('[UserRepository] Update in Supabase failed:', e);
    }

    const idx = this.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      this.users[idx] = this.enrichUser({
        ...this.users[idx],
        ...updates,
        role_name: newRole,
        role_id,
        updated_at: new Date().toISOString(),
      });
      return this.users[idx];
    }

    return null;
  }

  static async updateStatus(id: string, status: UserStatus): Promise<UserProfile | null> {
    return this.update(id, { status });
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (!error) {
        this.users = this.users.filter((u) => u.id !== id);
        return true;
      }
    } catch (e) {
      logger.warn('[UserRepository] Delete in Supabase failed:', e);
    }

    const initialLen = this.users.length;
    this.users = this.users.filter((u) => u.id !== id);
    return this.users.length < initialLen;
  }

  static async recordLogin(id: string): Promise<void> {
    try {
      await supabase.from('profiles').update({ last_login_at: new Date().toISOString() }).eq('id', id);
    } catch (e) {
      // Non-fatal
    }

    const user = this.users.find((u) => u.id === id);
    if (user) {
      user.last_login_at = new Date().toISOString();
    }
  }
}
