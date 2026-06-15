import type { Appointment } from '~/data/types'
import { mockAppointments } from '~/data/mockData'

let appointments: Appointment[] = [...mockAppointments]

export function getAppointments(): Appointment[] {
  return appointments
}

export function getAppointmentById(id: string): Appointment | undefined {
  return appointments.find(a => a.id === id)
}

export function updateAppointment(id: string, updates: Partial<Appointment>): Appointment | null {
  const index = appointments.findIndex(a => a.id === id)
  if (index !== -1) {
    appointments[index] = {
      ...appointments[index],
      ...updates,
      updatedAt: new Date().toLocaleString('zh-CN')
    }
    return appointments[index]
  }
  return null
}

export function addExceptionToAppointment(appointmentId: string, exception: any): boolean {
  const appointment = getAppointmentById(appointmentId)
  if (appointment) {
    const newException = {
      ...exception,
      id: `e${Date.now()}`,
      createdAt: new Date().toLocaleString('zh-CN'),
      status: 'pending'
    }
    appointment.exceptions.push(newException)
    appointment.updatedAt = new Date().toLocaleString('zh-CN')
    return true
  }
  return false
}

export function updateExceptionInAppointment(appointmentId: string, exceptionId: string, updates: any): boolean {
  const appointment = getAppointmentById(appointmentId)
  if (appointment) {
    const exception = appointment.exceptions.find(e => e.id === exceptionId)
    if (exception) {
      Object.assign(exception, updates)
      appointment.updatedAt = new Date().toLocaleString('zh-CN')
      return true
    }
  }
  return false
}

export { appointments }