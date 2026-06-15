import { updateExceptionInAppointment } from '~/server/utils/dataStore'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  if (!body.appointmentId || !body.exceptionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields'
    })
  }
  
  const updates: any = {}
  
  if (body.responsibleRole !== undefined) {
    updates.responsibleRole = body.responsibleRole
  }
  
  if (body.dueTime !== undefined) {
    updates.dueTime = body.dueTime
  }
  
  if (body.isOverdue !== undefined) {
    updates.isOverdue = body.isOverdue
  }
  
  if (body.timeNote !== undefined) {
    updates.timeNote = body.timeNote
  }
  
  const success = updateExceptionInAppointment(body.appointmentId, body.exceptionId, updates)
  
  if (!success) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Appointment or exception not found'
    })
  }
  
  return { success: true }
})