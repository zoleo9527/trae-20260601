export const formatMoney = (amount: number): string => {
  return `¥${amount.toFixed(2)}`;
};

export const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '-';
  return dateStr;
};

export const formatPhone = (phone: string): string => {
  return phone;
};

export const generateId = (prefix = 'id'): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
};

export const roleColors: Record<string, string> = {
  '客服': 'bg-blue-100 text-blue-700 border-blue-200',
  '工程师': 'bg-green-100 text-green-700 border-green-200',
  '配件管理员': 'bg-amber-100 text-amber-700 border-amber-200',
};
