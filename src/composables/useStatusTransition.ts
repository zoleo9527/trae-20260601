import type { VehicleStatus, StatusConfig } from '@/types'
import statusesData from '@/data/statuses.json'

export function useStatusTransition() {
  const statusConfig = statusesData as Record<VehicleStatus, StatusConfig & { color: string }>

  const getStatusLabel = (status: VehicleStatus): string => {
    return statusConfig[status]?.label || status
  }

  const getStatusColor = (status: VehicleStatus): string => {
    return statusConfig[status]?.color || 'gray'
  }

  const canTransition = (
    currentStatus: VehicleStatus,
    targetStatus: VehicleStatus,
    userRole: string
  ): boolean => {
    const config = statusConfig[currentStatus]
    if (!config) return false
    return config.canTransitionTo.includes(targetStatus) && config.requiredRole === userRole
  }

  const getAvailableTransitions = (currentStatus: VehicleStatus, userRole: string) => {
    const config = statusConfig[currentStatus]
    if (!config) return []
    return config.canTransitionTo
      .filter(status => statusConfig[status].requiredRole === userRole)
      .map(status => ({
        status,
        label: statusConfig[status].label,
        action: statusConfig[status].action
      }))
  }

  const getRequiredRole = (status: VehicleStatus): string => {
    return statusConfig[status]?.requiredRole || ''
  }

  const getAction = (status: VehicleStatus): string => {
    return statusConfig[status]?.action || ''
  }

  const getStatusType = (status: VehicleStatus): 'pending' | 'active' | 'completed' | 'final' => {
    if (['sold', 'unlisted'].includes(status)) return 'final'
    if (status === 'pending_evaluation') return 'pending'
    if (['evaluating', 'pricing_pending', 'following'].includes(status)) return 'active'
    return 'completed'
  }

  return {
    statusConfig,
    getStatusLabel,
    getStatusColor,
    canTransition,
    getAvailableTransitions,
    getRequiredRole,
    getAction,
    getStatusType
  }
}
