import type { OrderStatus, StuckType, RoleType, ShelterStatus, HarvestPlanStatus } from '@/types';

export const orderStatusText: Record<OrderStatus, string> = {
  PENDING_CONFIRM: '待确认',
  CONFIRMED: '已确认',
  HARVESTING: '采切中',
  PACKING: '包装中',
  COMPLETED: '已完成',
  STUCK: '卡住',
};

export const orderStatusColor: Record<OrderStatus, string> = {
  PENDING_CONFIRM: '#C89B3C',
  CONFIRMED: '#7BB173',
  HARVESTING: '#4F9744',
  PACKING: '#2D5A27',
  COMPLETED: '#4A7C59',
  STUCK: '#D64545',
};

export const orderStatusBg: Record<OrderStatus, string> = {
  PENDING_CONFIRM: 'bg-gold-50 text-gold-600 border-gold-200',
  CONFIRMED: 'bg-base-50 text-base-600 border-base-200',
  HARVESTING: 'bg-base-100 text-base-700 border-base-300',
  PACKING: 'bg-base-200 text-base-800 border-base-400',
  COMPLETED: 'bg-success-50 text-success-600 border-success-200',
  STUCK: 'bg-alert-50 text-alert-600 border-alert-200',
};

export const stuckTypeText: Record<StuckType, string> = {
  FORECAST_DEVIATION: '花期预测不准',
  PACKAGE_DAMAGE: '包装破损',
  CUSTOMER_CHANGE: '客户改规格',
  OTHER: '其他异常',
};

export const stuckTypeColor: Record<StuckType, string> = {
  FORECAST_DEVIATION: '#E4C26E',
  PACKAGE_DAMAGE: '#D64545',
  CUSTOMER_CHANGE: '#C89B3C',
  OTHER: '#9A9485',
};

export const roleText: Record<RoleType | 'SYSTEM', string> = {
  SALES: '销售内勤',
  GROWER: '种植员',
  PACKER: '包装主管',
  SYSTEM: '系统',
};

export const roleColor: Record<RoleType | 'SYSTEM', string> = {
  SALES: 'text-gold-600 bg-gold-50',
  GROWER: 'text-base-600 bg-base-50',
  PACKER: 'text-success-600 bg-success-50',
  SYSTEM: 'text-neutral-600 bg-neutral-200',
};

export const shelterStatusText: Record<ShelterStatus, string> = {
  IMMATURE: '待成熟',
  READY: '可采切',
  HARVESTED: '已采切',
  ABNORMAL: '异常',
};

export const shelterStatusColor: Record<ShelterStatus, string> = {
  IMMATURE: 'bg-neutral-200 text-neutral-600',
  READY: 'bg-base-100 text-base-700',
  HARVESTED: 'bg-success-50 text-success-600',
  ABNORMAL: 'bg-alert-50 text-alert-600',
};

export const harvestStatusText: Record<HarvestPlanStatus, string> = {
  PENDING: '待采切',
  HARVESTING: '采切中',
  DONE: '已完成',
  ABNORMAL: '异常',
};

export function formatDateTime(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input.replace(' ', 'T')) : new Date(input);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDate(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input.replace(' ', 'T')) : new Date(input);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatTime(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input.replace(' ', 'T')) : new Date(input);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function getDurationHours(fromStr: string, toStr?: string): string {
  const from = new Date(fromStr.replace(' ', 'T')).getTime();
  const to = toStr ? new Date(toStr.replace(' ', 'T')).getTime() : Date.now();
  const diffMs = to - from;
  const hours = Math.floor(diffMs / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);
  if (hours < 1) return `${mins}分钟`;
  if (hours < 24) return `${hours}小时${mins}分`;
  const days = Math.floor(hours / 24);
  const h = hours % 24;
  return `${days}天${h}小时`;
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
