export async function callApi(method, ...args) {
  if (!window.api) {
    console.warn('Electron API not available, running in browser mode')
    return { success: true, data: [] }
  }
  const result = await method(...args)
  if (result && !result.success) {
    throw new Error(result.error || '操作失败')
  }
  return result.data
}

export function formatMoney(value) {
  if (value === null || value === undefined) return '0.00'
  return Number(value).toFixed(2)
}

export function formatDate(dateStr) {
  if (!dateStr) return '-'
  return dateStr
}

export function getRentStatusText(status) {
  const map = {
    'paid': '已缴清',
    'partial': '部分缴纳',
    'unpaid': '未缴'
  }
  return map[status] || status
}

export function getRentStatusClass(status) {
  return 'status-' + (status || 'unpaid')
}

export function getRectifyStatusText(isRectified) {
  return isRectified ? '已整改' : '未整改'
}

export function getRectifyStatusClass(isRectified) {
  return isRectified ? 'status-rectified' : 'status-unrectified'
}

export function getUtilityTypeText(type) {
  const map = {
    'water': '水费',
    'electric': '电费'
  }
  return map[type] || type
}

export function getStallTypeText(type) {
  const map = {
    'standard': '标准摊位',
    'premium': '精品摊位',
    'restaurant': '餐饮档口'
  }
  return map[type] || type
}

export function getStallStatusText(status) {
  const map = {
    'active': '营业中',
    'inactive': '待出租',
    'closed': '已关闭'
  }
  return map[status] || status
}
