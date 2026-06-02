export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 0) {
    return `${diffDays} 天前`;
  } else if (diffHours > 0) {
    return `${diffHours} 小时前`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes} 分钟前`;
  } else {
    return '刚刚';
  }
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

export const maskPhone = (phone: string): string => {
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
};

export const maskIdCard = (idCard?: string): string => {
  if (!idCard) return '';
  return idCard.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2');
};

export const getDaysBetween = (start: string, end: string): number => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
