import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

dayjs.locale('zh-cn');

export const formatDate = (date: string | Date, format: string = 'YYYY-MM-DD') => {
  return dayjs(date).format(format);
};

export const formatDateTime = (date: string | Date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

export const formatTime = (date: string | Date) => {
  return dayjs(date).format('HH:mm:ss');
};

export const formatRelativeTime = (date: string | Date) => {
  const now = dayjs();
  const target = dayjs(date);
  const diffMinutes = now.diff(target, 'minute');

  if (diffMinutes < 1) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;

  const diffHours = now.diff(target, 'hour');
  if (diffHours < 24) return `${diffHours}小时前`;

  const diffDays = now.diff(target, 'day');
  if (diffDays < 7) return `${diffDays}天前`;

  return target.format('YYYY-MM-DD');
};

export const getWeekday = (date: string | Date) => {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return weekdays[dayjs(date).day()];
};

export const isToday = (date: string | Date) => {
  return dayjs(date).isSame(dayjs(), 'day');
};

export const isBefore = (date1: string | Date, date2: string | Date) => {
  return dayjs(date1).isBefore(dayjs(date2));
};

export const isAfter = (date1: string | Date, date2: string | Date) => {
  return dayjs(date1).isAfter(dayjs(date2));
};
