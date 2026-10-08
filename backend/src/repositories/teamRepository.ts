import { Team, TeamMember } from '../types';
import { UserRepository } from './userRepository';

export class TeamRepository {
  private static teams: Team[] = [
    {
      id: 't0000001-0000-0000-0000-000000000001',
      name: 'Penetration Testing & Offensive Sec',
      description: 'Responsible for curriculum, lab environments, and pen testing courses',
      manager_id: 'u0000002-0000-0000-0000-000000000002',
      manager_name: 'Walied Said',
      department: 'Education & Tech',
      status: 'active',
      created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      members: [
        {
          team_id: 't0000001-0000-0000-0000-000000000001',
          user_id: 'u0000003-0000-0000-0000-000000000003',
          role_in_team: 'Track Lead',
        },
        {
          team_id: 't0000001-0000-0000-0000-000000000001',
          user_id: 'u0000005-0000-0000-0000-000000000005',
          role_in_team: 'QA Coordinator',
        },
        {
          team_id: 't0000001-0000-0000-0000-000000000001',
          user_id: 'u0000006-0000-0000-0000-000000000006',
          role_in_team: 'Security Specialist',
        },
      ],
    },
    {
      id: 't0000002-0000-0000-0000-000000000002',
      name: 'DevOps & Cloud Infrastructure',
      description: 'Manages cloud labs, deployment pipelines, and server reliability',
      manager_id: 'u0000002-0000-0000-0000-000000000002',
      manager_name: 'Walied Said',
      department: 'Infrastructure',
      status: 'active',
      created_at: new Date(Date.now() - 50 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      members: [
        {
          team_id: 't0000002-0000-0000-0000-000000000002',
          user_id: 'u0000004-0000-0000-0000-000000000004',
          role_in_team: 'Lead Engineer',
        },
      ],
    },
    {
      id: 't0000003-0000-0000-0000-000000000003',
      name: 'Operations & Quality Assurance',
      description: 'Manages course QA, student feedback loops, and instructional quality',
      manager_id: 'u0000001-0000-0000-0000-000000000001',
      manager_name: 'Eslam Salah',
      department: 'Executive',
      status: 'active',
      created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      members: [
        {
          team_id: 't0000003-0000-0000-0000-000000000003',
          user_id: 'u0000005-0000-0000-0000-000000000005',
          role_in_team: 'QA Lead',
        },
      ],
    },
  ];

  static async getAll(): Promise<Team[]> {
    // Populate member user details
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

    const newTeamId = `t-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const members: TeamMember[] = (data.member_ids || []).map((uid) => ({
      team_id: newTeamId,
      user_id: uid,
      role_in_team: 'Member',
    }));

    const newTeam: Team = {
      id: newTeamId,
      name: data.name,
      description: data.description,
      manager_id: data.manager_id,
      manager_name: managerName,
      department: data.department || 'General',
      status: 'active',
      members,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.teams.push(newTeam);
    return newTeam;
  }

  static async update(
    id: string,
    updates: Partial<Team> & { member_ids?: string[] }
  ): Promise<Team | null> {
    const index = this.teams.findIndex((t) => t.id === id);
    if (index === -1) return null;

    let managerName = this.teams[index].manager_name;
    if (updates.manager_id && updates.manager_id !== this.teams[index].manager_id) {
      const manager = await UserRepository.getById(updates.manager_id);
      if (manager) managerName = manager.full_name;
    }

    let members = this.teams[index].members || [];
    if (updates.member_ids) {
      members = updates.member_ids.map((uid) => ({
        team_id: id,
        user_id: uid,
        role_in_team: 'Member',
      }));
    }

    this.teams[index] = {
      ...this.teams[index],
      ...updates,
      manager_name: managerName,
      members,
      updated_at: new Date().toISOString(),
    };

    return this.teams[index];
  }

  static async delete(id: string): Promise<boolean> {
    const initialLen = this.teams.length;
    this.teams = this.teams.filter((t) => t.id !== id);
    return this.teams.length < initialLen;
  }
}
