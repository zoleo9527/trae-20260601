/**
 * 生成唯一ID
 * 基于时间戳和随机数，确保全局唯一性
 */
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}`;
}
