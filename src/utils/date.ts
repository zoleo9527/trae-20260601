export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

export const formatRelativeTime = (dateStr: string): string => {
  const date = new Date(dateStr).getTime();
  const now = Date.now();
  const diff = now - date;

  if (diff < 0) {
    const futureDiff = Math.abs(diff);
    if (futureDiff < 3600000) {
      return `即将在 ${Math.ceil(futureDiff / 60000)} 分钟后`;
    } else if (futureDiff < 86400000) {
      return `即将在 ${Math.ceil(futureDiff / 3600000)} 小时后`;
    } else {
      return `即将在 ${Math.ceil(futureDiff / 86400000)} 天后`;
    }
  }

  if (diff < 60000) {
    return '刚刚';
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)} 分钟前`;
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)} 小时前`;
  } else if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)} 天前`;
  } else {
    return formatDate(dateStr);
  }
};

export const formatMoney = (amount: number): string => {
  return `¥${amount.toLocaleString('zh-CN')}`;
};

export const formatWorkHours = (hours: number): string => {
  return `${hours.toLocaleString('zh-CN')} 小时`;
};
