export const roleLabels: Record<string, string> = {
  service: '园区客服',
  guide: '采摘向导',
  warehouse: '仓库员'
}

export const receptionStatusLabels: Record<string, string> = {
  pending: '待分配',
  assigned: '已分配',
  picking: '采摘中',
  completed: '已完成',
  cancelled: '已取消'
}

export const receptionStatusColors: Record<string, string> = {
  pending: '#faad14',
  assigned: '#1890ff',
  picking: '#722ed1',
  completed: '#52c41a',
  cancelled: '#8c8c8c'
}

export const guideTaskStatusLabels: Record<string, string> = {
  assigned: '待开始',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消'
}

export const guideTaskStatusColors: Record<string, string> = {
  assigned: '#1890ff',
  in_progress: '#722ed1',
  completed: '#52c41a',
  cancelled: '#8c8c8c'
}

export const warehouseStatusLabels: Record<string, string> = {
  pending: '待接收',
  received: '待入库',
  stored: '已入库'
}

export const warehouseStatusColors: Record<string, string> = {
  pending: '#faad14',
  received: '#1890ff',
  stored: '#52c41a'
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}
