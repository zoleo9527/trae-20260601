const BASE_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
};

export interface ApiUser {
  role: 'RECEPTIONIST' | 'PROCESSOR' | 'MANAGER';
  userId: string;
  userName: string;
}

export function setCurrentUser(user: ApiUser) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }
}

export function getCurrentUser(): ApiUser | null {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem('currentUser');
    return data ? JSON.parse(data) : null;
  }
  return null;
}

export function clearCurrentUser() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('currentUser');
  }
}

export function generateIdempotencyKey(): string {
  return `idem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export async function apiRequest<T = any>(
  path: string,
  options: {
    method?: string;
    body?: any;
    idempotencyKey?: string;
    user?: ApiUser | null;
  } = {}
): Promise<{ success: boolean; data: T; error?: string; idempotent?: boolean }> {
  const user = options.user || getCurrentUser();
  const headers: Record<string, string> = { ...BASE_HEADERS };

  if (user) {
    headers['X-Role'] = user.role;
    headers['X-User-Id'] = user.userId;
    headers['X-User-Name'] = user.userName;
  }

  if (options.method !== 'GET' && options.idempotencyKey) {
    headers['X-Idempotency-Key'] = options.idempotencyKey;
  }

  const response = await fetch(path, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json();
  return data;
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTimeAgo(iso: string): string {
  const now = new Date().getTime();
  const date = new Date(iso).getTime();
  const diff = now - date;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  return `${days}天前`;
}

export function formatPrice(price: number): string {
  return `¥${price.toLocaleString('zh-CN')}`;
}
