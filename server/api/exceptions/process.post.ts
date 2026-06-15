import { updateExceptionInAppointment } from '~/server/utils/dataStore'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  if (!body.appointmentId || !body.exceptionId || !body.handledBy) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields'
    })
  }
  
  const success = updateExceptionInAppointment(body.appointmentId, body.exceptionId, {
    status: 'processing',
    handledBy: body.handledBy
  })
  
  if (!success) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Appointment or exception not found'
    })
  }
  
  return { success: true }
})