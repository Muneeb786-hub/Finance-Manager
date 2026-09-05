import { describe, it, expect } from 'vitest';
import { NotificationSchema } from '@/lib/validations';

describe('Notification Validation & Helper Logic', () => {
  it('validates a valid notification payload', () => {
    const valid = {
      type: 'BUDGET_ALERT',
      title: 'Groceries Approaching Limit',
      message: 'You have utilized 85% of your monthly Groceries budget.',
    };

    const result = NotificationSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects notification with missing title or message', () => {
    const missingTitle = {
      type: 'SYSTEM_INFO',
      title: '',
      message: 'System maintenance scheduled.',
    };

    const missingMessage = {
      type: 'SYSTEM_INFO',
      title: 'Maintenance',
      message: '',
    };

    expect(NotificationSchema.safeParse(missingTitle).success).toBe(false);
    expect(NotificationSchema.safeParse(missingMessage).success).toBe(false);
  });

  it('filters unread notifications and computes count correctly', () => {
    const list = [
      { id: '1', title: 'Recurring Bill Paid', isRead: false, type: 'RECURRING_PROCESSED' },
      { id: '2', title: 'Goal Milestone Reached', isRead: true, type: 'GOAL_MILESTONE' },
      { id: '3', title: 'Over Budget Warning', isRead: false, type: 'BUDGET_ALERT' },
    ];

    const unread = list.filter((n) => !n.isRead);
    expect(unread.length).toBe(2);
    expect(unread.map((n) => n.id)).toEqual(['1', '3']);
  });

  it('filters notifications by specific alert type', () => {
    const list = [
      { id: '1', title: 'Recurring Bill Paid', type: 'RECURRING_PROCESSED' },
      { id: '2', title: 'Goal Milestone Reached', type: 'GOAL_MILESTONE' },
      { id: '3', title: 'Weekly Rent Processed', type: 'RECURRING_PROCESSED' },
    ];

    const recurringOnly = list.filter((n) => n.type === 'RECURRING_PROCESSED');
    expect(recurringOnly.length).toBe(2);
  });
});
