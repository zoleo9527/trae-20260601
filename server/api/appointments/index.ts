import type { Appointment } from '~/data/types'
import { mockAppointments } from '~/data/mockData'

const appointments: Appointment[] = [...mockAppointments]

export default defineEventHandler(() => {
  return appointments
})