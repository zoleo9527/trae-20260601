/**
 * 格式化日期时间
 * @param date 日期对象或日期字符串
 * @returns 格式化后的日期时间字符串 (YYYY-MM-DD HH:mm:ss)
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 格式化日期
 * @param date 日期对象或日期字符串
 * @returns 格式化后的日期字符串 (YYYY-MM-DD)
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 给日期增加指定小时数
 * @param date 日期对象或日期字符串
 * @param hours 要增加的小时数
 * @returns 增加小时后的日期对象
 */
export function addHours(date: Date | string, hours: number): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date.getTime());
  d.setTime(d.getTime() + hours * 60 * 60 * 1000);
  return d;
}

/**
 * 判断是否过期
 * @param expireAt 过期时间字符串
 * @returns 是否已过期
 */
export function isExpired(expireAt: string): boolean {
  return new Date(expireAt).getTime() < Date.now();
}
