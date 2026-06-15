import { ref, computed } from 'vue'
import type { Appointment, ExceptionRecord, ExceptionType } from '~/data/types'

const appointments = ref<Appointment[]>([])
const loading = ref(false)

export function useAppointments() {
  const fetchAppointments = async () => {
    loading.value = true
    try {
      const data = await $fetch<Appointment[]>('/api/appointments')
      appointments.value = data
    } catch (error) {
      console.error('Failed to fetch appointments:', error)
    } finally {
      loading.value = false
    }
  }

  const fetchAppointmentById = async (id: string) => {
    try {
      const data = await $fetch<Appointment>(`/api/appointments/${id}`)
      return data
    } catch (error) {
      console.error('Failed to fetch appointment:', error)
      return null
    }
  }

  const pendingAppointments = computed(() => 
    appointments.value.filter(a => a.status === 'pending')
  )

  const confirmedAppointments = computed(() => 
    appointments.value.filter(a => a.status === 'confirmed')
  )

  const inProgressAppointments = computed(() => 
    appointments.value.filter(a => a.status === 'in_progress')
  )

  const completedAppointments = computed(() => 
    appointments.value.filter(a => a.status === 'completed')
  )

  const canceledAppointments = computed(() => 
    appointments.value.filter(a => a.status === 'canceled')
  )

  const appointmentsWithExceptions = computed(() => 
    appointments.value.filter(a => a.exceptions.length > 0)
  )

  const getAppointmentById = (id: string) => 
    appointments.value.find(a => a.id === id)

  const confirmAppointment = async (id: string) => {
    try {
      const updated = await $fetch<Appointment>(`/api/appointments/${id}/confirm`, {
        method: 'POST'
      })
      const index = appointments.value.findIndex(a => a.id === id)
      if (index !== -1) {
        appointments.value[index] = updated
      }
      return true
    } catch (error) {
      console.error('Failed to confirm appointment:', error)
      return false
    }
  }

  const cancelAppointment = async (id: string, reason: string) => {
    try {
      const updated = await $fetch<Appointment>(`/api/appointments/${id}/cancel`, {
        method: 'POST',
        body: { reason }
      })
      const index = appointments.value.findIndex(a => a.id === id)
      if (index !== -1) {
        appointments.value[index] = updated
      }
      return true
    } catch (error) {
      console.error('Failed to cancel appointment:', error)
      return false
    }
  }

  const updateItemConclusion = async (appointmentId: string, itemId: string, conclusion: string) => {
    try {
      const updated = await $fetch<Appointment>(`/api/appointments/${appointmentId}/item-conclusion`, {
        method: 'POST',
        body: { itemId, conclusion }
      })
      const index = appointments.value.findIndex(a => a.id === appointmentId)
      if (index !== -1) {
        appointments.value[index] = updated
      }
      return true
    } catch (error) {
      console.error('Failed to update item conclusion:', error)
      return false
    }
  }

  const addException = async (appointmentId: string, type: ExceptionType, description: string, amount?: number) => {
    try {
      await $fetch('/api/exceptions/add', {
        method: 'POST',
        body: { appointmentId, type, description, amount }
      })
      await fetchAppointments()
      return true
    } catch (error) {
      console.error('Failed to add exception:', error)
      return false
    }
  }

  const startProcessingException = async (appointmentId: string, exceptionId: string, handledBy: string) => {
    try {
      await $fetch('/api/exceptions/process', {
        method: 'POST',
        body: { appointmentId, exceptionId, handledBy }
      })
      await fetchAppointments()
      return true
    } catch (error) {
      console.error('Failed to start processing exception:', error)
      return false
    }
  }

  const resolveException = async (appointmentId: string, exceptionId: string, resolution: string, handledBy: string) => {
    try {
      await $fetch('/api/exceptions/resolve', {
        method: 'POST',
        body: { appointmentId, exceptionId, resolution, handledBy }
      })
      await fetchAppointments()
      return true
    } catch (error) {
      console.error('Failed to resolve exception:', error)
      return false
    }
  }

  const getPendingExceptions = (type?: ExceptionType) => {
    let result: ExceptionRecord[] = []
    appointments.value.forEach(a => {
      const exceptions = a.exceptions.filter(e => e.status === 'pending')
      if (type) {
        result.push(...exceptions.filter(e => e.type === type))
      } else {
        result.push(...exceptions)
      }
    })
    return result
  }

  const getProcessingExceptions = () => {
    let result: ExceptionRecord[] = []
    appointments.value.forEach(a => {
      result.push(...a.exceptions.filter(e => e.status === 'processing'))
    })
    return result
  }

  return {
    appointments,
    loading,
    fetchAppointments,
    fetchAppointmentById,
    pendingAppointments,
    confirmedAppointments,
    inProgressAppointments,
    completedAppointments,
    canceledAppointments,
    appointmentsWithExceptions,
    getAppointmentById,
    confirmAppointment,
    cancelAppointment,
    updateItemConclusion,
    addException,
    startProcessingException,
    resolveException,
    getPendingExceptions,
    getProcessingExceptions
  }
}