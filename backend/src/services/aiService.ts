import { logger } from '../utils/logger';
import { env } from '../config/env';
import { Task, UserProfile } from '../types';

export interface TaskSummaryResult {
  summary: string;
  keyBlockers: string[];
  recommendedAction: string;
}

export interface IAIService {
  generateTaskSummary(task: Task): Promise<TaskSummaryResult>;
  detectTaskRisks(task: Task): Promise<string[]>;
  suggestWeeklyReport(tasks: Task[]): Promise<string>;
}

/**
 * Intelligent Rule-based & Extensible Mock AI Provider
 */
class RuleBasedAIService implements IAIService {
  async generateTaskSummary(task: Task): Promise<TaskSummaryResult> {
    const statusName = task.status?.name || 'In Progress';
    const progress = task.progress_percentage || 0;
    const isOverdue = task.is_overdue;

    let summary = `Task "${task.title}" is currently ${statusName} at ${progress}% progress.`;
    const keyBlockers: string[] = [];

    if (task.blocker) {
      keyBlockers.push(`${task.blocker.blocker_type}: ${task.blocker.blocker_description}`);
    }

    if (isOverdue) {
      keyBlockers.push(`Deadline passed by ${task.overdue_days || 1} days`);
    }

    let recommendedAction = 'Continue daily updates and maintain task momentum.';
    if (keyBlockers.length > 0) {
      recommendedAction = `Escalate blockers: ${keyBlockers[0]} to avoid further delays.`;
    } else if (progress > 80) {
      recommendedAction = 'Prepare deliverables for final review and verification.';
    }

    return {
      summary,
      keyBlockers,
      recommendedAction,
    };
  }

  async detectTaskRisks(task: Task): Promise<string[]> {
    const risks: string[] = [];
    if (task.is_overdue) {
      risks.push(`Task is overdue by ${task.overdue_days} days.`);
    }
    if (!task.has_recent_update && task.status?.status_type === 'in_progress') {
      risks.push(`No updates recorded for ${task.days_since_last_update} days.`);
    }
    if (task.blocker) {
      risks.push(`Active blocker: ${task.blocker.blocker_type}`);
    }
    return risks;
  }

  async suggestWeeklyReport(tasks: Task[]): Promise<string> {
    const completed = tasks.filter((t) => t.status?.status_type === 'completed').length;
    const overdue = tasks.filter((t) => t.is_overdue).length;
    const blocked = tasks.filter((t) => t.blocker || t.status?.name === 'Blocked').length;

    return `Executive Weekly Progress:
- Total Monitored Tasks: ${tasks.length}
- Completed This Period: ${completed} (${Math.round((completed / (tasks.length || 1)) * 100)}%)
- Overdue Requiring Attention: ${overdue}
- Currently Blocked: ${blocked}
Operational Summary: Overall team execution is advancing. Key focus for next cycle is clearing blocked items and accelerating overdue items.`;
  }
}

/**
 * Gemini / OpenAI Future Integration Provider Stub
 */
class GeminiAIService implements IAIService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateTaskSummary(task: Task): Promise<TaskSummaryResult> {
    logger.info(`[AIService:Gemini] Generating summary for ${task.task_code}`);
    // Future call to Google Gemini Generative AI SDK / REST API
    return new RuleBasedAIService().generateTaskSummary(task);
  }

  async detectTaskRisks(task: Task): Promise<string[]> {
    return new RuleBasedAIService().detectTaskRisks(task);
  }

  async suggestWeeklyReport(tasks: Task[]): Promise<string> {
    return new RuleBasedAIService().suggestWeeklyReport(tasks);
  }
}

export class AIService {
  private static provider: IAIService = env.GEMINI_API_KEY
    ? new GeminiAIService(env.GEMINI_API_KEY)
    : new RuleBasedAIService();

  static setProvider(provider: IAIService) {
    this.provider = provider;
  }

  static async generateTaskSummary(task: Task): Promise<TaskSummaryResult> {
    return this.provider.generateTaskSummary(task);
  }

  static async detectTaskRisks(task: Task): Promise<string[]> {
    return this.provider.detectTaskRisks(task);
  }

  static async suggestWeeklyReport(tasks: Task[]): Promise<string> {
    return this.provider.suggestWeeklyReport(tasks);
  }
}
