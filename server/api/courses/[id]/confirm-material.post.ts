import { courses, users } from '../../../../server/data/mockData'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  
  const courseIndex = courses.findIndex(c => c.id === id)
  if (courseIndex === -1) {
    throw createError({ statusCode: 404, message: '课程不存在' })
  }
  
  const actor = users.find(u => u.id === body.actorId)
  if (!actor) {
    throw createError({ statusCode: 403, message: '无效的操作人' })
  }
  
  if (actor.role !== 'volunteer' && actor.role !== 'manager') {
    throw createError({ statusCode: 403, message: '只有志愿者或主管可以确认物料' })
  }
  
  const course = courses[courseIndex]
  const materialIndex = course.materials.findIndex(m => m.id === body.materialId)
  
  if (materialIndex === -1) {
    throw createError({ statusCode: 404, message: '物料不存在' })
  }
  
  const material = course.materials[materialIndex]
  
  if (material.confirmedBy) {
    throw createError({ statusCode: 400, message: '该物料已被确认' })
  }
  
  courses[courseIndex].materials[materialIndex].confirmedBy = body.actorId
  courses[courseIndex].materials[materialIndex].confirmedAt = new Date().toISOString()
  courses[courseIndex].updatedAt = new Date().toISOString()
  
  const newTimelineItem = {
    id: `t${Date.now()}`,
    action: 'material_confirm',
    actorId: body.actorId,
    actorName: actor.name,
    timestamp: new Date().toISOString(),
    description: `确认物料「${material.name}」`,
    result: '已确认'
  }
  courses[courseIndex].timeline.push(newTimelineItem)
  
  const confirmedCount = courses[courseIndex].materials.filter(m => m.confirmedBy).length
  const totalCount = courses[courseIndex].materials.length
  const confirmationRate = Math.round((confirmedCount / totalCount) * 100)
  
  return {
    success: true,
    message: `已确认物料「${material.name}」`,
    material: courses[courseIndex].materials[materialIndex],
    confirmedBy: actor.name,
    confirmedAt: new Date().toISOString(),
    confirmationRate,
    confirmedCount,
    totalCount
  }
})
