import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Vehicle, FilterOptions } from '@/types'
import vehiclesData from '@/data/vehicles.json'

export const useVehicleStore = defineStore('vehicles', () => {
  const vehicles = ref<Vehicle[]>(vehiclesData as Vehicle[])
  const filters = ref<FilterOptions>({
    status: [],
    collector: null,
    evaluator: null,
    financeStaff: null,
    brand: [],
    dateRange: {
      start: null,
      end: null
    }
  })
  const sortBy = ref<'createdAt' | 'updatedAt' | 'purchasePrice'>('createdAt')
  const sortOrder = ref<'asc' | 'desc'>('desc')

  const filteredVehicles = computed(() => {
    let result = [...vehicles.value]

    if (filters.value.status.length > 0) {
      result = result.filter(v => filters.value.status.includes(v.status))
    }

    if (filters.value.collector) {
      result = result.filter(v => v.collector.id === filters.value.collector)
    }

    if (filters.value.evaluator) {
      result = result.filter(v => v.evaluator?.id === filters.value.evaluator)
    }

    if (filters.value.financeStaff) {
      result = result.filter(v => v.financeStaff?.id === filters.value.financeStaff)
    }

    if (filters.value.brand.length > 0) {
      result = result.filter(v => filters.value.brand.includes(v.brand))
    }

    if (filters.value.dateRange.start) {
      result = result.filter(v => v.createdAt >= filters.value.dateRange.start!)
    }

    if (filters.value.dateRange.end) {
      result = result.filter(v => v.createdAt <= filters.value.dateRange.end!)
    }

    result.sort((a, b) => {
      const aVal = a[sortBy.value]
      const bVal = b[sortBy.value]
      const order = sortOrder.value === 'asc' ? 1 : -1
      return aVal > bVal ? order : -order
    })

    return result
  })

  const getVehicleById = (id: string) => {
    return vehicles.value.find(v => v.id === id)
  }

  const updateVehicle = (id: string, updates: Partial<Vehicle>) => {
    const index = vehicles.value.findIndex(v => v.id === id)
    if (index !== -1) {
      vehicles.value[index] = { ...vehicles.value[index], ...updates, updatedAt: new Date().toISOString() }
    }
  }

  const setFilters = (newFilters: Partial<FilterOptions>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  const clearFilters = () => {
    filters.value = {
      status: [],
      collector: null,
      evaluator: null,
      financeStaff: null,
      brand: [],
      dateRange: {
        start: null,
        end: null
      }
    }
  }

  const setSort = (field: 'createdAt' | 'updatedAt' | 'purchasePrice', order: 'asc' | 'desc') => {
    sortBy.value = field
    sortOrder.value = order
  }

  const getBrands = computed(() => {
    const brands = new Set(vehicles.value.map(v => v.brand))
    return Array.from(brands).sort()
  })

  return {
    vehicles,
    filters,
    filteredVehicles,
    getVehicleById,
    updateVehicle,
    setFilters,
    clearFilters,
    setSort,
    sortBy,
    sortOrder,
    getBrands
  }
})
