import type { OrderStatus, CustomsStatus, UserRole, ResponsibilityFlag } from '../types'

export function useFormat() {
  const formatDate = (date: string): string => {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
  }

  const formatMoney = (amount: number, currency: string): string => {
    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      CNY: '¥'
    }
    const symbol = symbols[currency] || currency
    return `${symbol}${amount.toFixed(2)}`
  }

  const orderStatusText: Record<OrderStatus, string> = {
    pending_sync: '待同步',
    syncing: '同步中',
    synced: '已同步',
    sync_failed: '同步失败',
    pending_customs: '待报关',
    customs_processing: '报关中',
    completed: '已完成',
    exception: '异常'
  }

  const customsStatusText: Record<CustomsStatus, string> = {
    draft: '草稿',
    pending_review: '待审核',
    reviewed: '已审核',
    rejected: '已驳回',
    completed: '已完成'
  }

  const getStatusText = (status: OrderStatus | CustomsStatus): string => {
    return orderStatusText[status as OrderStatus] || customsStatusText[status as CustomsStatus] || status
  }

  const orderStatusColor: Record<OrderStatus, string> = {
    pending_sync: 'bg-gray-100 text-gray-800',
    syncing: 'bg-blue-100 text-blue-800',
    synced: 'bg-green-100 text-green-800',
    sync_failed: 'bg-red-100 text-red-800',
    pending_customs: 'bg-yellow-100 text-yellow-800',
    customs_processing: 'bg-purple-100 text-purple-800',
    completed: 'bg-emerald-100 text-emerald-800',
    exception: 'bg-red-100 text-red-800'
  }

  const customsStatusColor: Record<CustomsStatus, string> = {
    draft: 'bg-gray-100 text-gray-800',
    pending_review: 'bg-yellow-100 text-yellow-800',
    reviewed: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
    completed: 'bg-green-100 text-green-800'
  }

  const getStatusColor = (status: OrderStatus | CustomsStatus): string => {
    return orderStatusColor[status as OrderStatus] || customsStatusColor[status as CustomsStatus] || 'bg-gray-100 text-gray-800'
  }

  const roleText: Record<UserRole, string> = {
    operation: '运营',
    customs: '报关',
    warehouse: '仓储'
  }

  const getRoleText = (role: UserRole): string => {
    return roleText[role] || role
  }

  const platformText: Record<string, string> = {
    amazon: 'Amazon',
    ebay: 'eBay',
    shopify: 'Shopify',
    wish: 'Wish',
    aliexpress: 'AliExpress'
  }

  const getPlatformText = (platform: string): string => {
    return platformText[platform] || platform
  }

  const responsibilityText: Record<ResponsibilityFlag, string> = {
    none: '无',
    pending_confirm: '待确认',
    operation: '运营责任',
    customs: '报关责任'
  }

  const getResponsibilityText = (flag: ResponsibilityFlag): string => {
    return responsibilityText[flag] || flag
  }

  return {
    formatDate,
    formatMoney,
    getStatusText,
    getStatusColor,
    getRoleText,
    getPlatformText,
    getResponsibilityText
  }
}
