import { logger } from '../utils/logger';
import { env } from '../config/env';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface IEmailProvider {
  sendEmail(payload: EmailPayload): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

/**
 * Mock Email Provider for development & testing
 */
class MockEmailProvider implements IEmailProvider {
  async sendEmail(payload: EmailPayload) {
    logger.info(`[EmailService:Mock] Email sent to ${payload.to}: "${payload.subject}"`);
    return { success: true, messageId: `mock-${Date.now()}` };
  }
}

/**
 * Resend Provider (Production ready when RESEND_API_KEY is supplied)
 */
class ResendEmailProvider implements IEmailProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendEmail(payload: EmailPayload) {
    try {
      // In production with Resend SDK or REST API
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: env.EMAIL_FROM,
          to: payload.to,
          subject: payload.subject,
          html: payload.html,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        return { success: false, error: errText };
      }

      const data = (await res.json()) as { id: string };
      return { success: true, messageId: data.id };
    } catch (err: any) {
      logger.error('Failed to send email via Resend', err);
      return { success: false, error: err.message };
    }
  }
}

/**
 * Email Service Dispatcher
 */
export class EmailService {
  private static provider: IEmailProvider = env.RESEND_API_KEY
    ? new ResendEmailProvider(env.RESEND_API_KEY)
    : new MockEmailProvider();

  static setProvider(provider: IEmailProvider) {
    this.provider = provider;
  }

  static async send(payload: EmailPayload) {
    return this.provider.sendEmail(payload);
  }

  static async sendTaskAssignedEmail(userEmail: string, userName: string, taskTitle: string, taskCode: string) {
    return this.send({
      to: userEmail,
      subject: `New Task Assigned: [${taskCode}] ${taskTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #2563eb;">Task Assigned to You</h2>
          <p>Hi <strong>${userName}</strong>,</p>
          <p>You have been assigned to task <strong>[${taskCode}] ${taskTitle}</strong>.</p>
          <p style="margin-top: 24px;">
            <a href="${env.FRONTEND_URL}/tasks/${taskCode}" style="background-color: #2563eb; color: #fff; padding: 10px 18px; text-decoration: none; border-radius: 6px;">View Task in Task Tracker</a>
          </p>
        </div>
      `,
    });
  }

  static async sendOverdueNotice(userEmail: string, userName: string, taskTitle: string, taskCode: string, daysOverdue: number) {
    return this.send({
      to: userEmail,
      subject: `⚠️ Overdue Task Alert: [${taskCode}] ${taskTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #dc2626;">Task Overdue Notice</h2>
          <p>Hi <strong>${userName}</strong>,</p>
          <p>Task <strong>[${taskCode}] ${taskTitle}</strong> is currently <strong>${daysOverdue} days overdue</strong>.</p>
          <p>Please update your progress or flag any blockers hindering completion.</p>
        </div>
      `,
    });
  }
}
