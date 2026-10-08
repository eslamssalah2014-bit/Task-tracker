import { Notification, NotificationPreference } from '../types';
import { logger } from '../utils/logger';
import { EmailService } from './emailService';

export class NotificationService {
  private static notifications: Notification[] = [];

  static async createNotification(params: {
    userId: string;
    actorId?: string;
    taskId?: string;
    taskCode?: string;
    title: string;
    message: string;
    type: string;
    link?: string;
  }): Promise<Notification> {
    const newNotif: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: params.userId,
      actor_id: params.actorId,
      task_id: params.taskId,
      task_code: params.taskCode,
      title: params.title,
      message: params.message,
      type: params.type,
      link: params.link || (params.taskCode ? `/tasks/${params.taskCode}` : undefined),
      is_read: false,
      created_at: new Date().toISOString(),
    };

    this.notifications.unshift(newNotif);
    logger.info(`[Notification] Created: "${params.title}" for user ${params.userId}`);

    // Here we can also asynchronously trigger EmailService if preference is enabled
    return newNotif;
  }

  static async getUserNotifications(userId: string): Promise<Notification[]> {
    return this.notifications.filter((n) => n.user_id === userId);
  }

  static async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const notif = this.notifications.find((n) => n.id === notificationId && n.user_id === userId);
    if (notif) {
      notif.is_read = true;
      notif.read_at = new Date().toISOString();
      return true;
    }
    return false;
  }

  static async markAllAsRead(userId: string): Promise<number> {
    let count = 0;
    for (const notif of this.notifications) {
      if (notif.user_id === userId && !notif.is_read) {
        notif.is_read = true;
        notif.read_at = new Date().toISOString();
        count++;
      }
    }
    return count;
  }

  static async getUnreadCount(userId: string): Promise<number> {
    return this.notifications.filter((n) => n.user_id === userId && !n.is_read).length;
  }
}
