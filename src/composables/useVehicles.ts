import { useVehicleStore } from '@/stores/vehicleStore'
import { useStatusTransition } from './useStatusTransition'
import { useHandover } from './useHandover'
import type { Vehicle, VehicleStatus, TimelineEvent } from '@/types'

export function useVehicles() {
  const vehicleStore = useVehicleStore()
  const { getStatusLabel, getStatusColor } = useStatusTransition()
  const { createHandover, shouldTriggerHandover } = useHandover()

  const generateId = () => {
    return `TL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  const changeStatus = async (
    vehicleId: string,
    newStatus: VehicleStatus,
    remark: string,
    handoverTo?: any,
    pricingData?: any
  ) => {
    const vehicle = vehicleStore.getVehicleById(vehicleId)
    if (!vehicle) return

    const event: TimelineEvent = {
      id: generateId(),
      status: newStatus,
      operator: { id: 'U001', name: '张伟', role: 'collector' },
      time: new Date().toISOString(),
      remark,
      type: pricingData ? 'pricing' : 'status_change',
      data: pricingData
    }

    const updatedTimeline = [...vehicle.timeline, event]
    const updatedVehicle: Partial<Vehicle> = {
      status: newStatus,
      timeline: updatedTimeline
    }

    if (pricingData?.finalPrice) {
      updatedVehicle.listedPrice = pricingData.finalPrice
    }

    if (shouldTriggerHandover(vehicle.status, newStatus) && handoverTo) {
      await createHandover(vehicleId, handoverTo, remark, newStatus)
    }

    vehicleStore.updateVehicle(vehicleId, updatedVehicle)
  }

  const getVehicleDisplay = (vehicle: Vehicle) => {
    return {
      id: vehicle.id,
      plate: vehicle.plate,
      model: vehicle.model,
      brand: vehicle.brand,
      status: vehicle.status,
      statusLabel: getStatusLabel(vehicle.status),
      statusColor: getStatusColor(vehicle.status),
      purchasePrice: vehicle.purchasePrice,
      listedPrice: vehicle.listedPrice,
      collector: vehicle.collector,
      currentAssignee: vehicle.salesRep || vehicle.financeStaff || vehicle.evaluator || vehicle.collector,
      followupCount: vehicle.followups.length,
      lastFollowup: vehicle.followups[vehicle.followups.length - 1] || null,
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt
    }
  }

  return {
    vehicles: vehicleStore.vehicles,
    filteredVehicles: vehicleStore.filteredVehicles,
    getVehicleById: vehicleStore.getVehicleById,
    changeStatus,
    getVehicleDisplay,
    filters: vehicleStore.filters,
    setFilters: vehicleStore.setFilters,
    clearFilters: vehicleStore.clearFilters,
    setSort: vehicleStore.setSort,
    sortBy: vehicleStore.sortBy,
    sortOrder: vehicleStore.sortOrder,
    getBrands: vehicleStore.getBrands
  }
}
