import type { Appointment } from '~/data/types'
import { mockAppointments } from '~/data/mockData'

let appointments: Appointment[] = [...mockAppointments]

export const getAppointments = () => appointments

export const getAppointmentById = (id: string) => 
  appointments.find(a => a.id === id)

export const updateAppointment = (id: string, updates: Partial<Appointment>) => {
  const index = appointments.findIndex(a => a.id === id)
  if (index !== -1) {
    appointments[index] = {
      ...appointments[index],
      ...updates,
      updatedAt: new Date().toLocaleString('zh-CN')
    }
  }
  return appointments[index]
}

export const confirmAppointment = (id: string) => 
  updateAppointment(id, { status: 'confirmed' })

export const cancelAppointment = (id: string, reason: string) => 
  updateAppointment(id, { status: 'canceled', rejectReason: reason })

export const completeAppointment = (id: string, actualPrice: number) => 
  updateAppointment(id, { status: 'completed', actualPrice })
