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
  if (!body.itemId || !body.conclusion) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing itemId or conclusion'
    })
  }
  
  const appointment = updateAppointment(id, {})
  if (!appointment) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Appointment not found'
    })
  }
  
  const item = appointment.items.find(i => i.id === body.itemId)
  if (!item) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Item not found'
    })
  }
  
  item.lastConclusion = body.conclusion
  appointment.updatedAt = new Date().toLocaleString('zh-CN')
  
  return appointment
})