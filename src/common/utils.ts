export function generateOrderNo(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `WX${year}${month}${day}${random}`;
}

export function getStatusDisplayName(status: string): string {
  const statusMap: Record<string, string> = {
    CREATED: '待派单',
    ASSIGNED: '待维修',
    MATERIAL_REGISTERED: '材料已登记',
    FEE_REGISTERED: '费用已登记',
    RETURNED: '已退回',
    COMPLETED: '已完成',
  };
  return statusMap[status] || status;
}

export function getRoleDisplayName(role: string): string {
  const roleMap: Record<string, string> = {
    DORM_MANAGER: '宿管',
    REPAIR_WORKER: '维修师傅',
    LOGISTICS_SUPERVISOR: '后勤主管',
  };
  return roleMap[role] || role;
}
