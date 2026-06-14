import { useVehicleStore } from '@/stores/vehicleStore'
import { useAuth } from './useAuth'
import type { Vehicle, VehicleStatus, User, TimelineEvent } from '@/types'

export function useHandover() {
  const vehicleStore = useVehicleStore()
  const { currentUser, getUsersByRole } = useAuth()

  const generateId = () => {
    return `TL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  const createHandover = async (
    vehicleId: string,
    toUser: User,
    remark: string,
    vehicleStatus: VehicleStatus
  ) => {
    const vehicle = vehicleStore.getVehicleById(vehicleId)
    if (!vehicle) return

    const handoverEvent: TimelineEvent = {
      id: generateId(),
      status: vehicleStatus,
      operator: currentUser.value,
      toUser,
      time: new Date().toISOString(),
      remark,
      type: 'handover'
    }

    const updatedTimeline = [...vehicle.timeline, handoverEvent]
    const updatedVehicle: Partial<Vehicle> = {
      timeline: updatedTimeline
    }

    if (toUser.role === 'evaluator') {
      updatedVehicle.evaluator = toUser
    } else if (toUser.role === 'finance') {
      updatedVehicle.financeStaff = toUser
    } else if (toUser.role === 'sales') {
      updatedVehicle.salesRep = toUser
    }

    vehicleStore.updateVehicle(vehicleId, updatedVehicle)
  }

  const getNextRole = (currentStatus: VehicleStatus): string | null => {
    switch (currentStatus) {
      case 'pending_evaluation':
        return 'evaluator'
      case 'evaluating':
        return 'collector'
      case 'pending_pricing':
        return 'finance'
      case 'pricing_pending':
        return 'sales'
      case 'listed':
        return 'sales'
      default:
        return null
    }
  }

  const getAvailableReceivers = (vehicle: Vehicle) => {
    const nextRole = getNextRole(vehicle.status)
    if (!nextRole) return []
    return getUsersByRole(nextRole as any)
  }

  const shouldTriggerHandover = (currentStatus: VehicleStatus, nextStatus: VehicleStatus): boolean => {
    const handoverTriggers: Record<VehicleStatus, VehicleStatus[]> = {
      pending_evaluation: ['evaluating'],
      evaluating: ['pending_pricing'],
      pending_pricing: ['pricing_pending'],
      pricing_pending: [],
      listed: [],
      following: [],
      sold: [],
      unlisted: []
    }
    return handoverTriggers[currentStatus]?.includes(nextStatus) || false
  }

  return {
    createHandover,
    getNextRole,
    getAvailableReceivers,
    shouldTriggerHandover
  }
}
