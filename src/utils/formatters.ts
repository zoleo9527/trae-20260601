export function maskIdCard(idCard: string): string {
  if (!idCard || idCard.length < 14) return idCard;
  return `${idCard.substring(0, 6)}******${idCard.substring(12)}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return dateStr.split(' ')[0];
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '';
  return dateStr.replace('T', ' ').substring(0, 19);
}

export function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr.replace(' ', 'T'));
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;
  return formatDate(dateStr);
}

export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-600',
    PENDING_REVIEW: 'bg-primary-100 text-primary-700',
    REVIEW_PASSED: 'bg-primary-100 text-primary-700',
    PENDING_EXAM: 'bg-accent-100 text-accent-700',
    EXAM_PASSED: 'bg-success-100 text-success-700',
    ARCHIVED: 'bg-success-100 text-success-700',
    COACH_ASSIGNED: 'bg-primary-100 text-primary-700',
    TRAINING: 'bg-success-100 text-success-700',
    PENDING_EXAM_BOOKING: 'bg-accent-100 text-accent-700',
    EXAM_PASSED_FINAL: 'bg-success-100 text-success-700',
    COMPLETED: 'bg-gray-100 text-gray-600',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-600';
}

export function getOperationTypeColor(type: string): string {
  const colorMap: Record<string, string> = {
    CREATE: 'bg-success-100 text-success-700',
    UPDATE: 'bg-primary-100 text-primary-700',
    DELETE: 'bg-danger-100 text-danger-700',
    STATUS_CHANGE: 'bg-accent-100 text-accent-700',
    ARCHIVE_UPDATE: 'bg-primary-100 text-primary-700',
    TRAINING_UPDATE: 'bg-success-100 text-success-700',
    EXAM_SCHEDULE: 'bg-primary-100 text-primary-700',
    EXAM_RESULT: 'bg-accent-100 text-accent-700',
  };
  return colorMap[type] || 'bg-gray-100 text-gray-600';
}

export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
