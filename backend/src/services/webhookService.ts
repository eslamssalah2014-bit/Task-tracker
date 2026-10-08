import { logger } from '../utils/logger';

export type WebhookEvent =
  | 'task.created'
  | 'task.updated'
  | 'task.completed'
  | 'task.overdue'
  | 'task.blocked'
  | 'comment.created';

export interface WebhookSubscription {
  id: string;
  url: string;
  events: WebhookEvent[];
  secret?: string;
  isActive: boolean;
}

export class WebhookService {
  private static subscriptions: WebhookSubscription[] = [];

  static registerSubscription(sub: WebhookSubscription) {
    this.subscriptions.push(sub);
  }

  static async dispatch(event: WebhookEvent, payload: Record<string, any>) {
    const matchingSubs = this.subscriptions.filter(
      (sub) => sub.isActive && (sub.events.includes(event) || sub.events.includes('*' as any))
    );

    if (matchingSubs.length === 0) {
      logger.debug(`[WebhookService] No listeners for event: ${event}`);
      return;
    }

    logger.info(`[WebhookService] Dispatching event ${event} to ${matchingSubs.length} endpoints`);

    for (const sub of matchingSubs) {
      try {
        fetch(sub.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-TaskTracker-Event': event,
            'X-TaskTracker-Delivery': `${Date.now()}`,
          },
          body: JSON.stringify({
            event,
            timestamp: new Date().toISOString(),
            data: payload,
          }),
        }).catch((err) => {
          logger.warn(`Failed to deliver webhook to ${sub.url}`, err.message);
        });
      } catch (err: any) {
        logger.error(`Error sending webhook to ${sub.url}`, err);
      }
    }
  }
}
