import { getAppointments } from '~/server/utils/dataStore'

export default defineEventHandler(() => {
  const appointments = getAppointments()
  const exceptions: any[] = []
  
  appointments.forEach(a => {
    a.exceptions.forEach(e => {
      exceptions.push({
        ...e,
        appointmentId: a.id,
        orderNo: a.orderNo,
        customerName: a.customer.name
      })
    })
  })
  
  return exceptions
})