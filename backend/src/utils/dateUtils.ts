import { differenceInCalendarDays, isAfter, isBefore, isSameDay, parseISO, startOfDay } from 'date-fns';

export const dateUtils = {
  getNow(): Date {
    return new Date();
  },

  isOverdue(dueDate?: string, statusType?: string): boolean {
    if (!dueDate || statusType === 'completed' || statusType === 'cancelled') {
      return false;
    }
    const today = startOfDay(new Date());
    const due = startOfDay(parseISO(dueDate));
    return isBefore(due, today);
  },

  overdueDays(dueDate?: string): number {
    if (!dueDate) return 0;
    const today = startOfDay(new Date());
    const due = startOfDay(parseISO(dueDate));
    const diff = differenceInCalendarDays(today, due);
    return diff > 0 ? diff : 0;
  },

  daysRemaining(dueDate?: string): number {
    if (!dueDate) return 0;
    const today = startOfDay(new Date());
    const due = startOfDay(parseISO(dueDate));
    return differenceInCalendarDays(due, today);
  },

  isDueToday(dueDate?: string): boolean {
    if (!dueDate) return false;
    const today = startOfDay(new Date());
    const due = startOfDay(parseISO(dueDate));
    return isSameDay(today, due);
  },

  isDueThisWeek(dueDate?: string): boolean {
    if (!dueDate) return false;
    const today = startOfDay(new Date());
    const due = startOfDay(parseISO(dueDate));
    const diff = differenceInCalendarDays(due, today);
    return diff >= 0 && diff <= 7;
  },

  daysSince(dateString?: string): number {
    if (!dateString) return 999;
    const today = startOfDay(new Date());
    const date = startOfDay(parseISO(dateString));
    return Math.max(0, differenceInCalendarDays(today, date));
  },

  formatDeadlineBadge(dueDate?: string, statusType?: string, completionDate?: string) {
    if (statusType === 'completed') {
      if (dueDate && completionDate) {
        const due = startOfDay(parseISO(dueDate));
        const completed = startOfDay(parseISO(completionDate));
        const diff = differenceInCalendarDays(completed, due);
        if (diff > 0) {
          return { label: `Completed ${diff} ${diff === 1 ? 'Day' : 'Days'} Late`, variant: 'warning' };
        }
        return { label: 'Completed On Time', variant: 'success' };
      }
      return { label: 'Completed', variant: 'success' };
    }

    if (!dueDate) {
      return { label: 'No Deadline', variant: 'neutral' };
    }

    if (this.isOverdue(dueDate, statusType)) {
      const days = this.overdueDays(dueDate);
      return { label: `${days} ${days === 1 ? 'Day' : 'Days'} Overdue`, variant: 'danger' };
    }

    if (this.isDueToday(dueDate)) {
      return { label: 'Due Today', variant: 'urgent' };
    }

    const remaining = this.daysRemaining(dueDate);
    if (remaining === 1) {
      return { label: 'Due Tomorrow', variant: 'warning' };
    }
    return { label: `${remaining} Days Remaining`, variant: 'info' };
  },
};
