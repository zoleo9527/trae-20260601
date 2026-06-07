export function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getRoleLabel(role, roleLabels) {
  if (!role) return '-';
  if (role === 'customer') return '客户';
  if (role === 'system') return '系统';
  return roleLabels?.[role] || role;
}

export function getInitials(name) {
  if (!name) return '?';
  return name.charAt(0);
}

export function formatMoney(amount) {
  if (amount === undefined || amount === null) return '-';
  return `¥${Number(amount).toFixed(2)}`;
}
