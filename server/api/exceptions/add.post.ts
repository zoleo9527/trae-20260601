import { addExceptionToAppointment } from '~/server/utils/dataStore'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  if (!body.appointmentId || !body.type || !body.description) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields'
    })
  }
  
  const success = addExceptionToAppointment(body.appointmentId, {
    type: body.type,
    description: body.description,
    amount: body.amount
  })
  
  if (!success) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Appointment not found'
    })
  }
  
  return { success: true }
})