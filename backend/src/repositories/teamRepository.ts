import { Team, TeamMember } from '../types';
import { UserRepository } from './userRepository';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import crypto from 'crypto';

export class TeamRepository {
  private static teams: Team[] = [
    {
      id: '50000000-0000-0000-0000-000000000001',
      name: 'Penetration Testing & Offensive Sec',
      description: 'Responsible for curriculum, lab environments, and pen testing courses',
      manager_id: '00000000-0000-0000-0000-000000000002',
      manager_name: 'Walied Said',
      department: 'Education & Tech',
      status: 'active',
      created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      members: [
        {
          team_id: '50000000-0000-0000-0000-000000000001',
          user_id: '00000000-0000-0000-0000-000000000003',
          role_in_team: 'Track Lead',
        },
        {
          team_id: '50000000-0000-0000-0000-000000000001',
          user_id: '00000000-0000-0000-0000-000000000005',
          role_in_team: 'QA Coordinator',
        },
        {
          team_id: '50000000-0000-0000-0000-000000000001',
          user_id: '00000000-0000-0000-0000-000000000006',
          role_in_team: 'Security Specialist',
        },
      ],
    },
    {
      id: '50000000-0000-0000-0000-000000000002',
      name: 'DevOps & Cloud Infrastructure',
      description: 'Manages cloud labs, deployment pipelines, and server reliability',
      manager_id: '00000000-0000-0000-0000-000000000002',
      manager_name: 'Walied Said',
      department: 'Infrastructure',
      status: 'active',
      created_at: new Date(Date.now() - 50 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      members: [
        {
          team_id: '50000000-0000-0000-0000-000000000002',
          user_id: '00000000-0000-0000-0000-000000000004',
          role_in_team: 'Lead Engineer',
        },
      ],
    },
    {
      id: '50000000-0000-0000-0000-000000000003',
      name: 'Operations & Quality Assurance',
      description: 'Manages course QA, student feedback loops, and instructional quality',
      manager_id: '00000000-0000-0000-0000-000000000001',
      manager_name: 'Eslam Salah',
      department: 'Executive',
      status: 'active',
      created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      members: [
        {
          team_id: '50000000-0000-0000-0000-000000000003',
          user_id: '00000000-0000-0000-0000-000000000005',
          role_in_team: 'QA Lead',
        },
      ],
    },
  ];

  static async getAll(): Promise<Team[]> {
    try {
      const { data: dbTeams, error: teamErr } = await supabase
        .from('teams')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (!teamErr && Array.isArray(dbTeams) && dbTeams.length > 0) {
        const { data: allMembers } = await supabase.from('team_members').select('*');

        const populated = await Promise.all(
          dbTeams.map(async (t) => {
            let managerName: string | undefined;
            if (t.manager_id) {
              const manager = await UserRepository.getById(t.manager_id);
              if (manager) managerName = manager.full_name;
            }

            const teamMembers = (allMembers || []).filter((m) => m.team_id === t.id);
            const members = await Promise.all(
              teamMembers.map(async (m) => {
                const user = await UserRepository.getById(m.user_id);
                return {
                  team_id: t.id,
                  user_id: m.user_id,
                  role_in_team: m.role_in_team || 'Member',
                  user: user || undefined,
                };
              })
            );

            return {
              id: t.id,
              name: t.name,
              description: t.description || undefined,
              manager_id: t.manager_id || undefined,
              manager_name: managerName,
              department: t.department || 'Education & Tech',
              status: t.status || 'active',
              members,
              created_at: t.created_at,
              updated_at: t.updated_at,
            } as Team;
          })
        );

        this.teams = populated;
        return populated;
      }
    } catch (e) {
      logger.warn('[TeamRepository] Supabase query failed, using in-memory cache:', e);
    }

    // Populate in-memory members
    const populated = await Promise.all(
      this.teams.map(async (t) => {
        const members = await Promise.all(
          (t.members || []).map(async (m) => {
            const user = await UserRepository.getById(m.user_id);
            return { ...m, user: user || undefined };
          })
        );
        return { ...t, members };
      })
    );
    return populated;
  }

  static async getById(id: string): Promise<Team | null> {
    try {
      const { data: t, error } = await supabase.from('teams').select('*').eq('id', id).maybeSingle();
      if (!error && t) {
        let managerName: string | undefined;
        if (t.manager_id) {
          const manager = await UserRepository.getById(t.manager_id);
          if (manager) managerName = manager.full_name;
        }

        const { data: membersData } = await supabase.from('team_members').select('*').eq('team_id', id);
        const members = await Promise.all(
          (membersData || []).map(async (m) => {
            const user = await UserRepository.getById(m.user_id);
            return {
              team_id: id,
              user_id: m.user_id,
              role_in_team: m.role_in_team || 'Member',
              user: user || undefined,
            };
          })
        );

        return {
          id: t.id,
          name: t.name,
          description: t.description || undefined,
          manager_id: t.manager_id || undefined,
          manager_name: managerName,
          department: t.department || 'Education & Tech',
          status: t.status || 'active',
          members,
          created_at: t.created_at,
          updated_at: t.updated_at,
        } as Team;
      }
    } catch (e) {
      logger.warn(`[TeamRepository] getById failed in Supabase for ${id}:`, e);
    }

    const team = this.teams.find((t) => t.id === id);
    if (!team) return null;
    const members = await Promise.all(
      (team.members || []).map(async (m) => {
        const user = await UserRepository.getById(m.user_id);
        return { ...m, user: user || undefined };
      })
    );
    return { ...team, members };
  }

  static async create(data: {
    name: string;
    description?: string;
    manager_id?: string;
    department?: string;
    member_ids?: string[];
  }): Promise<Team> {
    let managerName: string | undefined;
    if (data.manager_id) {
      const manager = await UserRepository.getById(data.manager_id);
      if (manager) managerName = manager.full_name;
    }

    const newTeamId = crypto.randomUUID();
    const newTeamDb = {
      id: newTeamId,
      name: data.name,
      description: data.description || null,
      manager_id: data.manager_id || null,
      department: data.department || 'Education & Tech',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { error: insertErr } = await supabase.from('teams').insert(newTeamDb);
      if (insertErr) {
        logger.error('[TeamRepository] Failed to insert team into Supabase:', insertErr);
      } else {
        if (data.member_ids && data.member_ids.length > 0) {
          const membersToInsert = data.member_ids.map((uid) => ({
            team_id: newTeamId,
            user_id: uid,
            role_in_team: 'Member',
          }));
          await supabase.from('team_members').insert(membersToInsert);
        }
      }
    } catch (err) {
      logger.error('[TeamRepository] Network/db error during team insert:', err);
    }

    const members: TeamMember[] = await Promise.all(
      (data.member_ids || []).map(async (uid) => {
        const user = await UserRepository.getById(uid);
        return {
          team_id: newTeamId,
          user_id: uid,
          user: user || undefined,
          role_in_team: 'Member',
        };
      })
    );

    const createdTeam: Team = {
      id: newTeamId,
      name: data.name,
      description: data.description,
      manager_id: data.manager_id,
      manager_name: managerName,
      department: data.department || 'Education & Tech',
      status: 'active',
      members,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.teams.push(createdTeam);
    return createdTeam;
  }

  static async update(
    id: string,
    updates: Partial<Team> & { member_ids?: string[] }
  ): Promise<Team | null> {
    const current = await this.getById(id);
    if (!current) return null;

    let managerName = current.manager_name;
    if (updates.manager_id && updates.manager_id !== current.manager_id) {
      const manager = await UserRepository.getById(updates.manager_id);
      if (manager) managerName = manager.full_name;
    }

    const dbPayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.name !== undefined) dbPayload.name = updates.name;
    if (updates.description !== undefined) dbPayload.description = updates.description;
    if (updates.manager_id !== undefined) dbPayload.manager_id = updates.manager_id;
    if (updates.department !== undefined) dbPayload.department = updates.department;
    if (updates.status !== undefined) dbPayload.status = updates.status;

    try {
      await supabase.from('teams').update(dbPayload).eq('id', id);

      if (updates.member_ids) {
        await supabase.from('team_members').delete().eq('team_id', id);
        if (updates.member_ids.length > 0) {
          const newMembers = updates.member_ids.map((uid) => ({
            team_id: id,
            user_id: uid,
            role_in_team: 'Member',
          }));
          await supabase.from('team_members').insert(newMembers);
        }
      }
    } catch (e) {
      logger.warn('[TeamRepository] Update in Supabase failed:', e);
    }

    return this.getById(id);
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('teams').delete().eq('id', id);
      if (!error) {
        this.teams = this.teams.filter((t) => t.id !== id);
        return true;
      }
    } catch (e) {
      logger.warn('[TeamRepository] Delete in Supabase failed:', e);
    }

    const initialLen = this.teams.length;
    this.teams = this.teams.filter((t) => t.id !== id);
    return this.teams.length < initialLen;
  }
}
