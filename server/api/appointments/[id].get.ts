import { getAppointmentById } from '~/server/utils/dataStore'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing appointment id'
    })
  }
  
  const appointment = getAppointmentById(id)
  if (!appointment) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Appointment not found'
    })
  }
  
  return appointment
})