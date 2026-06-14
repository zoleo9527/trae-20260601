export function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}分钟`;
  if (hours < 24) return `${Math.floor(hours)}小时${Math.round((hours % 1) * 60)}分`;
  const days = Math.floor(hours / 24);
  const remainHours = Math.round(hours % 24);
  return `${days}天${remainHours > 0 ? remainHours + '小时' : ''}`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${hh}:${mm}`;
}

export function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = diff / (1000 * 60 * 60);
  if (hours < 0) return `还有 ${formatDuration(-hours)}`;
  return `${formatDuration(hours)}前`;
}

export function isOverdue(deadlineStr: string): boolean {
  return Date.now() > new Date(deadlineStr).getTime();
}

export function uid(prefix = ''): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
