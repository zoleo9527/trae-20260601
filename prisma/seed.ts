import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const today = new Date().toISOString().split('T')[0]

  await prisma.user.createMany({
    data: [
      { id: 'u1', name: '张康复', role: 'THERAPIST', avatar: '' },
      { id: 'u2', name: '李治疗', role: 'THERAPIST', avatar: '' },
      { id: 'u3', name: '王前台', role: 'RECEPTION', avatar: '' },
      { id: 'u4', name: '赵主任', role: 'DIRECTOR', avatar: '' },
    ],
  })

  await prisma.therapist.createMany({
    data: [
      { id: 't1', userId: 'u1', specialty: '骨科康复' },
      { id: 't2', userId: 'u2', specialty: '神经康复' },
    ],
  })

  await prisma.patient.createMany({
    data: [
      { id: 'p1', name: '陈明', phone: '13800001001', age: 45, diagnosis: '腰椎间盘突出' },
      { id: 'p2', name: '刘芳', phone: '13800001002', age: 62, diagnosis: '脑卒中后遗症' },
      { id: 'p3', name: '黄强', phone: '13800001003', age: 35, diagnosis: '膝关节术后' },
      { id: 'p4', name: '周丽', phone: '13800001004', age: 58, diagnosis: '肩周炎' },
      { id: 'p5', name: '吴刚', phone: '13800001005', age: 70, diagnosis: '脑卒中后遗症' },
      { id: 'p6', name: '孙萍', phone: '13800001006', age: 40, diagnosis: '颈椎病' },
    ],
  })

  await prisma.equipment.createMany({
    data: [
      { id: 'eq1', name: '牵引机A', location: '治疗室1', status: 'AVAILABLE' },
      { id: 'eq2', name: '电动踏车B', location: '治疗室2', status: 'AVAILABLE' },
      { id: 'eq3', name: '超声波治疗仪C', location: '治疗室1', status: 'IN_USE' },
      { id: 'eq4', name: '平衡训练台D', location: '治疗室3', status: 'AVAILABLE' },
    ],
  })

  await prisma.assessment.createMany({
    data: [
      { id: 'a1', patientId: 'p1', therapistId: 't1', content: '腰椎活动度评估', result: 'L4-L5活动受限，屈曲40°', status: 'COMPLETED', assessedAt: new Date(today + 'T09:00:00') },
      { id: 'a2', patientId: 'p2', therapistId: 't2', content: '偏瘫肢体运动功能评估', result: '上肢Brunnstrom III期，下肢IV期', status: 'COMPLETED', assessedAt: new Date(today + 'T10:00:00') },
      { id: 'a3', patientId: 'p3', therapistId: 't1', content: '膝关节ROM评估', result: '屈曲90°，伸直-10°', status: 'COMPLETED', assessedAt: new Date(today + 'T11:00:00') },
      { id: 'a4', patientId: 'p5', therapistId: 't2', content: '吞咽功能评估', result: '洼田饮水试验III级', status: 'COMPLETED', assessedAt: new Date(Date.now() - 3 * 86400000).toISOString() },
      { id: 'a5', patientId: 'p6', therapistId: 't1', content: '颈椎功能评估', result: '待排班跟进', status: 'PENDING', assessedAt: new Date(Date.now() - 4 * 86400000).toISOString() },
    ],
  })

  await prisma.schedule.createMany({
    data: [
      { id: 's1', patientId: 'p1', therapistId: 't1', treatmentType: '腰椎牵引', scheduledDate: today, scheduledTime: '09:00', duration: 30, status: 'URGED', equipmentId: 'eq1', assessmentId: 'a1', remark: '患者催促尽快安排' },
      { id: 's2', patientId: 'p2', therapistId: 't2', treatmentType: '偏瘫肢体训练', scheduledDate: today, scheduledTime: '09:30', duration: 45, status: 'PENDING', equipmentId: 'eq2', assessmentId: 'a2' },
      { id: 's3', patientId: 'p3', therapistId: 't1', treatmentType: '膝关节活动度训练', scheduledDate: today, scheduledTime: '10:00', duration: 30, status: 'RETURNED', assessmentId: 'a3', remark: '材料不全，退回补充' },
      { id: 's4', patientId: 'p4', therapistId: 't2', treatmentType: '肩关节松动术', scheduledDate: today, scheduledTime: '10:30', duration: 30, status: 'SUPPLEMENTING', remark: '等待补充评估材料' },
      { id: 's5', patientId: 'p5', therapistId: 't2', treatmentType: '吞咽功能训练', scheduledDate: today, scheduledTime: '11:00', duration: 30, status: 'CONFIRMED', assessmentId: 'a4' },
      { id: 's6', patientId: 'p6', therapistId: 't1', treatmentType: '颈椎牵引', scheduledDate: today, scheduledTime: '09:00', duration: 30, status: 'PENDING', equipmentId: 'eq1', assessmentId: 'a5' },
      { id: 's7', patientId: 'p1', therapistId: 't1', treatmentType: '核心稳定性训练', scheduledDate: today, scheduledTime: '14:00', duration: 30, status: 'CONFIRMED' },
      { id: 's8', patientId: 'p2', therapistId: 't2', treatmentType: '步态训练', scheduledDate: today, scheduledTime: '14:30', duration: 45, status: 'IN_TREATMENT', equipmentId: 'eq4' },
    ],
  })

  await prisma.statusLog.createMany({
    data: [
      { id: 'sl1', scheduleId: 's1', fromStatus: null, toStatus: 'PENDING', operatorId: 'u3', operatorRole: 'RECEPTION', remark: '创建排班', createdAt: new Date(today + 'T08:00:00') },
      { id: 'sl2', scheduleId: 's1', fromStatus: 'PENDING', toStatus: 'URGED', operatorId: 'u3', operatorRole: 'RECEPTION', remark: '患者催促安排', createdAt: new Date(today + 'T08:30:00') },
      { id: 'sl3', scheduleId: 's3', fromStatus: 'PENDING', toStatus: 'RETURNED', operatorId: 'u4', operatorRole: 'DIRECTOR', remark: '缺少术后影像资料，退回补充', createdAt: new Date(today + 'T08:15:00') },
      { id: 'sl4', scheduleId: 's4', fromStatus: 'RETURNED', toStatus: 'SUPPLEMENTING', operatorId: 'u3', operatorRole: 'RECEPTION', remark: '已通知患者补材料', createdAt: new Date(today + 'T08:45:00') },
      { id: 'sl5', scheduleId: 's5', fromStatus: 'PENDING', toStatus: 'CONFIRMED', operatorId: 'u1', operatorRole: 'THERAPIST', remark: '确认排班', createdAt: new Date(today + 'T08:20:00') },
      { id: 'sl6', scheduleId: 's8', fromStatus: 'CONFIRMED', toStatus: 'IN_TREATMENT', operatorId: 'u2', operatorRole: 'THERAPIST', remark: '开始治疗', createdAt: new Date(today + 'T14:30:00') },
    ],
  })

  await prisma.checkin.createMany({
    data: [
      { id: 'c1', scheduleId: 's1', patientId: 'p1', checkinTime: new Date(today + 'T08:55:00'), status: 'CHECKED_IN', remark: '已签到等待治疗' },
      { id: 'c2', scheduleId: 's2', patientId: 'p2', status: 'WAITING' },
      { id: 'c3', scheduleId: 's5', patientId: 'p5', checkinTime: new Date(today + 'T10:50:00'), status: 'CHECKED_IN' },
      { id: 'c4', scheduleId: 's7', patientId: 'p1', status: 'WAITING' },
      { id: 'c5', scheduleId: 's8', patientId: 'p2', checkinTime: new Date(today + 'T14:25:00'), status: 'IN_TREATMENT', equipmentUsed: 'eq4' },
    ],
  })

  await prisma.checkinLog.createMany({
    data: [
      { id: 'cl1', checkinId: 'c1', fromStatus: null, toStatus: 'WAITING', operatorId: 'u3', remark: '创建签到记录', createdAt: new Date(today + 'T08:00:00') },
      { id: 'cl2', checkinId: 'c1', fromStatus: 'WAITING', toStatus: 'CHECKED_IN', operatorId: 'u3', remark: '患者已到，办理签到', createdAt: new Date(today + 'T08:55:00') },
      { id: 'cl3', checkinId: 'c5', fromStatus: null, toStatus: 'WAITING', operatorId: 'u3', remark: '创建签到记录', createdAt: new Date(today + 'T14:00:00') },
      { id: 'cl4', checkinId: 'c5', fromStatus: 'WAITING', toStatus: 'CHECKED_IN', operatorId: 'u3', remark: '患者签到', createdAt: new Date(today + 'T14:25:00') },
      { id: 'cl5', checkinId: 'c5', fromStatus: 'CHECKED_IN', toStatus: 'IN_TREATMENT', operatorId: 'u2', remark: '开始治疗', createdAt: new Date(today + 'T14:30:00') },
    ],
  })

  await prisma.attachment.createMany({
    data: [
      { id: 'at1', scheduleId: 's3', fileName: '膝关节术后影像.pdf', fileType: 'application/pdf', fileUrl: '/placeholder/knee-xray.pdf', uploadedAt: new Date(today + 'T08:10:00'), uploaderId: 'u3' },
      { id: 'at2', scheduleId: 's1', fileName: '腰椎MRI报告.jpg', fileType: 'image/jpeg', fileUrl: '/placeholder/lumbar-mri.jpg', uploadedAt: new Date(today + 'T08:05:00'), uploaderId: 'u3' },
    ],
  })

  await prisma.alert.createMany({
    data: [
      { id: 'al1', type: 'PLAN_DISRUPTED', level: 'HIGH', relatedScheduleId: 's1', message: '陈明的腰椎牵引排班被催促，原计划时间可能与颈椎牵引冲突', createdAt: new Date(today + 'T08:35:00') },
      { id: 'al2', type: 'EQUIPMENT_CONFLICT', level: 'HIGH', relatedScheduleId: 's1', relatedEquipmentId: 'eq1', message: '牵引机A在09:00同时被陈明和孙萍预约', createdAt: new Date(today + 'T08:30:00') },
      { id: 'al3', type: 'ASSESSMENT_NOT_FOLLOWED', level: 'MEDIUM', relatedAssessmentId: 'a5', message: '孙萍的颈椎功能评估已超过48小时，尚未安排排班跟进', createdAt: new Date(today + 'T09:00:00') },
      { id: 'al4', type: 'PLAN_DISRUPTED', level: 'MEDIUM', relatedScheduleId: 's3', message: '黄强的膝关节训练因材料不全被退回，治疗计划被打断', createdAt: new Date(today + 'T08:20:00') },
      { id: 'al5', type: 'ASSESSMENT_NOT_FOLLOWED', level: 'LOW', relatedAssessmentId: 'a4', message: '吴刚的吞咽功能评估已完成，但排班确认较晚', createdAt: new Date(today + 'T09:30:00') },
    ],
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
