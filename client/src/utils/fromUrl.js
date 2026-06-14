export const TAX_STATUS_MAP = {
  pending: '待处理',
  in_progress: '处理中',
  submitted: '已提交',
  rejected: '被退回',
  approved: '审核通过',
  completed: '已完成',
}

export const TAX_TYPE_MAP = {
  vat: '增值税',
  income: '企业所得税',
  individual: '个税',
  stamp: '印花税',
  additional: '附加税',
}

export const EXCEPTION_STATUS_MAP = {
  open: '待处理',
  processing: '处理中',
  resolved: '已解决',
  closed: '已关闭',
}

export const EXCEPTION_TYPE_MAP = {
  urge: '催收提醒',
  reject: '退回异常',
  supplement: '补材料',
}

export const EXCEPTION_PRIORITY_MAP = {
  low: '低',
  normal: '普通',
  high: '高',
  urgent: '紧急',
}

export function parseTaxFilingFromUrl(fromUrl) {
  if (!fromUrl) return null
  const result = {
    path: fromUrl,
    isFromList: fromUrl.startsWith('/tax-filings'),
    isFromDashboard: fromUrl === '/dashboard',
    labels: [],
  }

  if (!result.isFromList) return result

  try {
    const searchPart = fromUrl.includes('?') ? fromUrl.split('?')[1] : ''
    const params = new URLSearchParams(searchPart)

    const status = params.get('status')
    const taxType = params.get('tax_type')
    const keyword = params.get('keyword')
    const page = params.get('page')
    const pageSize = params.get('pageSize')

    if (status) {
      const statusList = status.split(',').filter(Boolean)
      const statusLabel = statusList.length > 1
        ? statusList.map(s => TAX_STATUS_MAP[s] || s).join('/')
        : TAX_STATUS_MAP[status] || status
      result.labels.push({ key: 'status', label: `状态：${statusLabel}` })
    }

    if (taxType) {
      result.labels.push({ key: 'tax_type', label: `税种：${TAX_TYPE_MAP[taxType] || taxType}` })
    }

    if (keyword) {
      result.labels.push({ key: 'keyword', label: `关键词：${keyword}` })
    }

    if (page && page !== '1') {
      result.labels.push({ key: 'page', label: `第 ${page} 页` })
    }

    result.hasFilter = result.labels.length > 0
    result.cleanUrl = '/tax-filings'
  } catch (e) {
    // ignore
  }

  return result
}

export function parseExceptionFromUrl(fromUrl) {
  if (!fromUrl) return null
  const result = {
    path: fromUrl,
    isFromList: fromUrl.startsWith('/exceptions'),
    isFromDashboard: fromUrl === '/dashboard',
    labels: [],
  }

  if (!result.isFromList) return result

  try {
    const searchPart = fromUrl.includes('?') ? fromUrl.split('?')[1] : ''
    const params = new URLSearchParams(searchPart)

    const status = params.get('status')
    const type = params.get('type')
    const priority = params.get('priority')
    const keyword = params.get('keyword')
    const page = params.get('page')
    const pageSize = params.get('pageSize')

    if (status) {
      let statusLabel
      if (status === 'open') {
        statusLabel = '待处理'
      } else if (status === 'open,processing') {
        statusLabel = '待处理'
      } else if (EXCEPTION_STATUS_MAP[status]) {
        statusLabel = EXCEPTION_STATUS_MAP[status]
      } else {
        const statusList = status.split(',').filter(Boolean)
        statusLabel = statusList.map(s => EXCEPTION_STATUS_MAP[s] || s).join('/')
      }
      result.labels.push({ key: 'status', label: `状态：${statusLabel}` })
    }

    if (type) {
      const typeList = type.split(',').filter(Boolean)
      const typeLabel = typeList.length > 1
        ? typeList.map(t => EXCEPTION_TYPE_MAP[t] || t).join('/')
        : EXCEPTION_TYPE_MAP[type] || type
      result.labels.push({ key: 'type', label: `类型：${typeLabel}` })
    }

    if (priority) {
      result.labels.push({ key: 'priority', label: `优先级：${EXCEPTION_PRIORITY_MAP[priority] || priority}` })
    }

    if (keyword) {
      result.labels.push({ key: 'keyword', label: `关键词：${keyword}` })
    }

    if (page && page !== '1') {
      result.labels.push({ key: 'page', label: `第 ${page} 页` })
    }

    result.hasFilter = result.labels.length > 0
    result.cleanUrl = '/exceptions'
  } catch (e) {
    // ignore
  }

  return result
}
