import { addExceptionToAppointment } from '~/server/utils/dataStore'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  if (!body.appointmentId || !body.type || !body.description) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields'
    })
  }
  
  const exceptionData: any = {
    type: body.type,
    description: body.description,
    amount: body.amount
  }
  
  if (body.responsibleRole) {
    exceptionData.responsibleRole = body.responsibleRole
  }
  
  if (body.dueTime) {
    exceptionData.dueTime = body.dueTime
  }
  
  if (body.isOverdue) {
    exceptionData.isOverdue = body.isOverdue
  }
  
  if (body.timeNote) {
    exceptionData.timeNote = body.timeNote
  }
  
  const success = addExceptionToAppointment(body.appointmentId, exceptionData)
  
  if (!success) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Appointment not found'
    })
  }
  
  return { success: true }
})