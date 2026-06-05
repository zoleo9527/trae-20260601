const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  const rentals = [];
  const r1 = await prisma.rentalOrder.create({ data: { orderNo: 'SK-20260601-001', guestName: '张伟', guestPhone: '13800138001', idCardNo: '110101199001011234', equipmentType: '双板', equipmentCode: 'DB-A001', size: '170cm', depositAmount: 500, operatorName: '李前台', notes: '客人有初级滑雪经验' } });
  rentals.push(r1);
  const r2 = await prisma.rentalOrder.create({ data: { orderNo: 'SK-20260601-002', guestName: '王芳', guestPhone: '13900139002', idCardNo: '310101199202022345', equipmentType: '单板', equipmentCode: 'SB-B003', size: '155cm', depositAmount: 600, operatorName: '李前台' } });
  rentals.push(r2);
  const r3 = await prisma.rentalOrder.create({ data: { orderNo: 'SK-20260601-003', guestName: '陈刚', guestPhone: '13700137003', idCardNo: '440101198803033456', equipmentType: '雪鞋', equipmentCode: 'SH-C042', size: '42码', depositAmount: 300, operatorName: '赵前台' } });
  rentals.push(r3);
  const r4 = await prisma.rentalOrder.create({ data: { orderNo: 'SK-20260601-004', guestName: '刘洋', guestPhone: '13600136004', equipmentType: '双板', equipmentCode: 'DB-A015', size: '165cm', depositAmount: 500, status: 'returned', depositStatus: 'refunded', operatorName: '李前台', returnedAt: new Date('2026-06-01T14:30:00'), notes: '正常归还' } });
  rentals.push(r4);
  const r5 = await prisma.rentalOrder.create({ data: { orderNo: 'SK-20260601-005', guestName: '赵敏', guestPhone: '13500135005', equipmentType: '头盔', equipmentCode: 'HM-D008', size: 'M', depositAmount: 200, status: 'damaged', depositStatus: 'forfeited', operatorName: '赵前台', returnedAt: new Date('2026-06-01T16:00:00'), notes: '头盔外壳有明显裂纹' } });
  rentals.push(r5);
  const r6 = await prisma.rentalOrder.create({ data: { orderNo: 'SK-20260601-006', guestName: '孙丽', guestPhone: '13400134006', equipmentType: '雪杖', equipmentCode: 'PZ-E020', size: '120cm', depositAmount: 200, operatorName: '李前台' } });
  rentals.push(r6);
  const r7 = await prisma.rentalOrder.create({ data: { orderNo: 'SK-20260601-007', guestName: '周杰', guestPhone: '13300133007', equipmentType: '单板', equipmentCode: 'SB-B011', size: '160cm', depositAmount: 600, operatorName: '赵前台' } });
  rentals.push(r7);

  for (const r of rentals) {
    await prisma.auditLog.create({ data: { entityType: 'RentalOrder', entityId: r.id, action: 'create', fromStatus: '', toStatus: r.status, operatorName: r.operatorName, notes: '创建租赁单', rentalOrderId: r.id } });
  }

  const c1 = await prisma.coachSchedule.create({ data: { coachName: '马教练', guestName: '张伟', guestPhone: '13800138001', scheduleDate: '2026-06-01', timeSlot: '09:00-11:00', courseType: '初级', rentalOrderId: r1.id, operatorName: '排班员小王' } });
  const c2 = await prisma.coachSchedule.create({ data: { coachName: '林教练', guestName: '王芳', guestPhone: '13900139002', scheduleDate: '2026-06-01', timeSlot: '11:00-13:00', courseType: '中级', rentalOrderId: r2.id, operatorName: '排班员小王' } });
  const c3 = await prisma.coachSchedule.create({ data: { coachName: '马教练', guestName: '陈刚', guestPhone: '13700137003', scheduleDate: '2026-06-01', timeSlot: '13:00-15:00', courseType: '初级', rentalOrderId: r3.id, status: 'completed', operatorName: '排班员小王', completedAt: new Date('2026-06-01T15:00:00') } });
  const c4 = await prisma.coachSchedule.create({ data: { coachName: '林教练', guestName: '周杰', guestPhone: '13300133007', scheduleDate: '2026-06-01', timeSlot: '15:00-17:00', courseType: '高级', rentalOrderId: r7.id, status: 'no_show', operatorName: '排班员小王', completedAt: new Date('2026-06-01T15:30:00'), notes: '客人未到场，电话无法接通' } });
  const c5 = await prisma.coachSchedule.create({ data: { coachName: '郑教练', guestName: '孙丽', guestPhone: '13400134006', scheduleDate: '2026-06-02', timeSlot: '09:00-11:00', courseType: '自由式', rentalOrderId: r6.id, operatorName: '排班员小王' } });

  for (const c of [c1, c2, c3, c4, c5]) {
    await prisma.auditLog.create({ data: { entityType: 'CoachSchedule', entityId: c.id, action: 'create', fromStatus: '', toStatus: c.status === 'completed' ? 'completed' : c.status === 'no_show' ? 'no_show' : 'scheduled', operatorName: c.operatorName, notes: '创建教练排班', coachScheduleId: c.id } });
  }
  await prisma.auditLog.create({ data: { entityType: 'CoachSchedule', entityId: c3.id, action: 'status_change', fromStatus: 'scheduled', toStatus: 'in_progress', operatorName: '马教练', notes: '课程开始', coachScheduleId: c3.id } });
  await prisma.auditLog.create({ data: { entityType: 'CoachSchedule', entityId: c3.id, action: 'status_change', fromStatus: 'in_progress', toStatus: 'completed', operatorName: '马教练', notes: '课程正常完成', coachScheduleId: c3.id } });
  await prisma.auditLog.create({ data: { entityType: 'CoachSchedule', entityId: c4.id, action: 'status_change', fromStatus: 'scheduled', toStatus: 'no_show', operatorName: '林教练', notes: '客人未到场，电话无法接通', coachScheduleId: c4.id } });

  const res1 = await prisma.rescueRecord.create({ data: { guestName: '王芳', guestPhone: '13900139002', incidentType: '摔伤', incidentTime: new Date('2026-06-01T12:15:00'), location: '中级道3号弯', description: '客人在中级道3号弯处摔倒，右腕着地，疑似扭伤', severity: 'moderate', status: 'in_treatment', rentalOrderId: r2.id, coachScheduleId: c2.id, operatorName: '巡逻员小刘', evidenceNotes: '现场监控编号: CAM-3-12, 目击者: 游客李某 139xxxx8888' } });
  const res2 = await prisma.rescueRecord.create({ data: { guestName: '赵敏', guestPhone: '13500135005', incidentType: '碰撞', incidentTime: new Date('2026-06-01T15:30:00'), location: '初级道下段', description: '与另一名游客发生碰撞，头盔外壳破裂', severity: 'minor', status: 'resolved', rentalOrderId: r5.id, operatorName: '巡逻员小张', resolvedAt: new Date('2026-06-01T16:00:00'), evidenceNotes: '碰撞对方: 游客钱某 138xxxx6666, 已协商赔偿' } });
  const res3 = await prisma.rescueRecord.create({ data: { guestName: '张伟', guestPhone: '13800138001', incidentType: '摔伤', incidentTime: new Date('2026-06-01T10:30:00'), location: '初级道1号', description: '初级课间休息时轻微摔倒，膝盖擦伤', severity: 'minor', status: 'resolved', rentalOrderId: r1.id, coachScheduleId: c1.id, operatorName: '马教练', resolvedAt: new Date('2026-06-01T10:45:00'), evidenceNotes: '教练现场处理，冰敷后客人确认无碍' } });

  for (const r of [res1, res2, res3]) {
    await prisma.auditLog.create({ data: { entityType: 'RescueRecord', entityId: r.id, action: 'create', fromStatus: '', toStatus: r.status === 'resolved' ? 'resolved' : r.status, operatorName: r.operatorName, notes: '创建救援记录', rescueRecordId: r.id } });
  }

  const d1 = await prisma.depositVerification.create({ data: { rentalOrderId: r4.id, verificationType: 'return_check', depositAmount: 500, actualRefund: 500, damageDeducted: 0, status: 'refunded', verifierName: '李前台', notes: '雪具完好，全额退还', verifiedAt: new Date('2026-06-01T14:30:00') } });
  const d2 = await prisma.depositVerification.create({ data: { rentalOrderId: r5.id, verificationType: 'damage_assessment', depositAmount: 200, actualRefund: 0, damageDeducted: 200, damageNotes: '头盔外壳明显裂纹，无法继续使用', status: 'forfeited', verifierName: '赵前台', evidencePhotos: '照片存储: /evidence/helmet-d008-crack.jpg', notes: '全扣押金', verifiedAt: new Date('2026-06-01T16:10:00') } });
  const d3 = await prisma.depositVerification.create({ data: { rentalOrderId: r1.id, verificationType: 'return_check', depositAmount: 500, status: 'pending', verifierName: '李前台', notes: '等待客人归还' } });

  for (const d of [d1, d2, d3]) {
    await prisma.auditLog.create({ data: { entityType: 'DepositVerification', entityId: d.id, action: 'create', fromStatus: '', toStatus: d.status, operatorName: d.verifierName, notes: '创建核验记录', depositVerificationId: d.id } });
  }
  await prisma.auditLog.create({ data: { entityType: 'DepositVerification', entityId: d1.id, action: 'verify', fromStatus: 'pending', toStatus: 'refunded', operatorName: '李前台', notes: '雪具完好，全额退还', depositVerificationId: d1.id } });
  await prisma.auditLog.create({ data: { entityType: 'DepositVerification', entityId: d2.id, action: 'verify', fromStatus: 'pending', toStatus: 'forfeited', operatorName: '赵前台', notes: '全扣押金', depositVerificationId: d2.id } });

  console.log('✅ 种子数据创建完成:');
  console.log(`  - 租赁单: ${rentals.length} 条`);
  console.log(`  - 教练排班: 5 条`);
  console.log(`  - 救援记录: 3 条`);
  console.log(`  - 押金核验: 3 条`);
}

seed().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
