import { updateAppointment } from '~/server/utils/dataStore'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing appointment id'
    })
  }
  
  const body = await readBody(event)
  if (!body.reason) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing cancel reason'
    })
  }
  
  const updated = updateAppointment(id, { 
    status: 'canceled', 
    rejectReason: body.reason 
  })
  
  if (!updated) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Appointment not found'
    })
  }
  
  return updated
})