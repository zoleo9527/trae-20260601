import { urgencyLabels, urgencyColors } from '@/data/mockData';
import type { SigningReminder, Subscription } from '@/types';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
}

function getDaysLeft(deadline: string): { days: number; label: string; color: string } {
  const now = new Date().getTime();
  const dead = new Date(deadline).getTime();
  const days = Math.ceil((dead - now) / (24 * 60 * 60 * 1000));

  if (days < 0) {
    return { days, label: `已逾期${Math.abs(days)}天`, color: 'text-danger-600' };
  }
  if (days === 0) {
    return { days, label: '今天到期', color: 'text-danger-600' };
  }
  if (days <= 1) {
    return { days, label: `剩余${days}天`, color: 'text-danger-600' };
  }
  if (days <= 3) {
    return { days, label: `剩余${days}天`, color: 'text-warning-600' };
  }
  return { days, label: `剩余${days}天`, color: 'text-gray-500' };
}

interface ReminderItemProps {
  reminder: SigningReminder;
  onAction?: (id: string) => void;
}

export function ReminderItem({ reminder, onAction }: ReminderItemProps) {
  const daysInfo = getDaysLeft(reminder.signDeadline);

  return (
    <div
      className={`p-3 rounded-lg border mb-2 transition-all hover:shadow-sm ${
        reminder.urgency === 'critical'
          ? 'border-danger-300 bg-danger-50'
          : reminder.urgency === 'urgent'
          ? 'border-warning-300 bg-warning-50'
          : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-800">
              {reminder.customerName}
            </span>
            <span className="text-xs text-gray-500">{reminder.unitNo}</span>
            {reminder.materialModified && (
              <span className="text-xs px-1.5 py-0.5 bg-danger-100 text-danger-600 rounded animate-blink">
                资料已变
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {reminder.subscriptionNo}
          </div>
        </div>
        <div className="text-right">
          <div className={`text-sm font-medium ${daysInfo.color}`}>
            {daysInfo.label}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            已提醒 {reminder.reminderCount} 次
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2 py-0.5 rounded ${urgencyColors[reminder.urgency]}`}
          >
            {urgencyLabels[reminder.urgency]}
          </span>
          {reminder.materialReady ? (
            <span className="text-xs text-success-600">✓ 资料齐全</span>
          ) : (
            <span className="text-xs text-danger-600">✗ 资料不齐</span>
          )}
        </div>
        {onAction && (
          <button
            onClick={() => onAction(reminder.id)}
            className="text-xs px-2 py-1 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors"
          >
            去处理
          </button>
        )}
      </div>
    </div>
  );
}

interface SubscriptionItemProps {
  subscription: Subscription;
  onAction?: (id: string) => void;
}

const materialStatusLabels: Record<string, { label: string; color: string }> = {
  incomplete: { label: '资料不全', color: 'text-gray-500 bg-gray-100' },
  submitted: { label: '待审核', color: 'text-primary-600 bg-primary-100' },
  verified: { label: '已通过', color: 'text-success-600 bg-success-100' },
  returned: { label: '被退回', color: 'text-danger-600 bg-danger-100' },
};

export function SubscriptionItem({ subscription, onAction }: SubscriptionItemProps) {
  const materialInfo = materialStatusLabels[subscription.materialStatus];
  const daysInfo = getDaysLeft(subscription.signDeadline);

  return (
    <div className="p-3 rounded-lg border border-gray-200 bg-white mb-2 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-800">
              {subscription.customerName}
            </span>
            {subscription.modifiedCount > 0 && (
              <span className="text-xs px-1.5 py-0.5 bg-warning-100 text-warning-600 rounded">
                改{subscription.modifiedCount}次
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {subscription.subscriptionNo} · {subscription.unitNo}
          </div>
        </div>
        <div className={`text-sm font-medium ${daysInfo.color}`}>
          {daysInfo.label}
        </div>
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded ${materialInfo.color}`}>
            {materialInfo.label}
          </span>
          <span className="text-xs text-gray-500">
            置业顾问: {subscription.consultantName}
          </span>
        </div>
        {onAction && (
          <button
            onClick={() => onAction(subscription.id)}
            className="text-xs px-2 py-1 text-primary-600 bg-primary-50 rounded hover:bg-primary-100 transition-colors"
          >
            查看
          </button>
        )}
      </div>
    </div>
  );
}

export { formatDate, getDaysLeft };
