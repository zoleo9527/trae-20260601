import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

async function reseed() {
  await prisma.warningRemark.deleteMany();
  await prisma.statusLog.deleteMany();
  await prisma.medicationRecord.deleteMany();
  await prisma.feedRecord.deleteMany();
  await prisma.warning.deleteMany();
  await prisma.inspection.deleteMany();
  await prisma.pond.deleteMany();
  await prisma.user.deleteMany();

  const users = await Promise.all([
    prisma.user.create({ data: { name: "张海宁", role: "TECHNICIAN" } }),
    prisma.user.create({ data: { name: "李波", role: "TECHNICIAN" } }),
    prisma.user.create({ data: { name: "王仓管", role: "FEED_MANAGER" } }),
    prisma.user.create({ data: { name: "赵场长", role: "FARM_DIRECTOR" } }),
  ]);

  const ponds = await Promise.all([
    prisma.pond.create({ data: { name: "1号塘", area: 5.2, species: "南美白虾", status: "danger" } }),
    prisma.pond.create({ data: { name: "2号塘", area: 3.8, species: "罗非鱼", status: "normal" } }),
    prisma.pond.create({ data: { name: "3号塘", area: 4.5, species: "黄颡鱼", status: "warning" } }),
    prisma.pond.create({ data: { name: "4号塘", area: 2.1, species: "河鲀", status: "danger" } }),
    prisma.pond.create({ data: { name: "5号塘", area: 6.0, species: "南美白虾", status: "normal" } }),
    prisma.pond.create({ data: { name: "6号塘", area: 3.2, species: "草鱼", status: "normal" } }),
  ]);

  const today = new Date("2026-06-09T08:00:00.000Z");
  const yesterday = new Date("2026-06-08T08:00:00.000Z");
  const twoDaysAgo = new Date("2026-06-07T08:00:00.000Z");

  const inspections = await Promise.all([
    prisma.inspection.create({ data: { pondId: ponds[0].id, inspectorId: users[0].id, status: "PENDING", scheduledAt: today } }),
    prisma.inspection.create({ data: { pondId: ponds[2].id, inspectorId: users[1].id, status: "PENDING", scheduledAt: today } }),
    prisma.inspection.create({ data: { pondId: ponds[5].id, inspectorId: users[0].id, status: "PENDING", scheduledAt: today } }),
    prisma.inspection.create({ data: { pondId: ponds[1].id, inspectorId: users[0].id, status: "IN_PROGRESS", scheduledAt: today, waterTemp: 28.5, dissolvedOx: 6.2, pH: 7.8, ammonia: 0.3, remarks: "水质正常，继续观察" } }),
    prisma.inspection.create({ data: { pondId: ponds[3].id, inspectorId: users[1].id, status: "IN_PROGRESS", scheduledAt: today, waterTemp: 26.0, dissolvedOx: 3.2, pH: 6.8, ammonia: 0.8, remarks: "溶解氧持续偏低，需增氧" } }),
    prisma.inspection.create({ data: { pondId: ponds[4].id, inspectorId: users[0].id, status: "COMPLETED", scheduledAt: yesterday, completedAt: yesterday, waterTemp: 27.3, dissolvedOx: 7.1, pH: 7.5, ammonia: 0.2, remarks: "5号塘常规巡检，各项指标正常" } }),
    prisma.inspection.create({ data: { pondId: ponds[0].id, inspectorId: users[0].id, status: "ABNORMAL", scheduledAt: twoDaysAgo, completedAt: twoDaysAgo, waterTemp: 32.1, dissolvedOx: 3.8, pH: 6.2, ammonia: 1.5, remarks: "溶解氧低，氨氮超标，已开启增氧机并加注新水" } }),
    prisma.inspection.create({ data: { pondId: ponds[3].id, inspectorId: users[1].id, status: "ABNORMAL", scheduledAt: yesterday, completedAt: yesterday, waterTemp: 25.1, dissolvedOx: 2.5, pH: 6.9, ammonia: 0.6, remarks: "4号塘溶解氧极低，疑似底质恶化" } }),
    prisma.inspection.create({ data: { pondId: ponds[2].id, inspectorId: users[1].id, status: "ABNORMAL", scheduledAt: yesterday, completedAt: yesterday, waterTemp: 29.8, dissolvedOx: 4.5, pH: 7.0, ammonia: 1.2, remarks: "3号塘氨氮偏高，需换水处理" } }),
  ]);

  const warnings = await Promise.all([
    prisma.warning.create({ data: { pondId: ponds[0].id, inspectionId: inspections[6].id, level: "DANGER", status: "ACTIVE", metric: "dissolvedOx", value: 3.8, threshold: 4.0, message: "1号塘溶解氧严重偏低", sourceType: "INSPECTION", sourceId: inspections[6].id } }),
    prisma.warning.create({ data: { pondId: ponds[0].id, inspectionId: inspections[6].id, level: "WARNING", status: "ACTIVE", metric: "ammonia", value: 1.5, threshold: 1.0, message: "1号塘氨氮超标", sourceType: "INSPECTION", sourceId: inspections[6].id } }),
    prisma.warning.create({ data: { pondId: ponds[0].id, inspectionId: inspections[6].id, level: "WARNING", status: "ACTIVE", metric: "waterTemp", value: 32.1, threshold: 30.0, message: "1号塘水温偏高", sourceType: "INSPECTION", sourceId: inspections[6].id } }),
    prisma.warning.create({ data: { pondId: ponds[3].id, inspectionId: inspections[7].id, level: "DANGER", status: "ACTIVE", metric: "dissolvedOx", value: 2.5, threshold: 4.0, message: "4号塘溶解氧极低", sourceType: "INSPECTION", sourceId: inspections[7].id } }),
    prisma.warning.create({ data: { pondId: ponds[2].id, inspectionId: inspections[8].id, level: "WARNING", status: "ACTIVE", metric: "ammonia", value: 1.2, threshold: 1.0, message: "3号塘氨氮偏高", sourceType: "INSPECTION", sourceId: inspections[8].id } }),
    prisma.warning.create({ data: { pondId: ponds[0].id, inspectionId: inspections[6].id, level: "INFO", status: "ACKNOWLEDGED", metric: "pH", value: 6.2, threshold: 6.5, message: "1号塘pH偏低", sourceType: "INSPECTION", sourceId: inspections[6].id, handlerId: users[0].id, handledAt: new Date("2026-06-08T06:00:00.000Z"), handleRemarks: "已加注新水调节pH" } }),
    prisma.warning.create({ data: { pondId: ponds[3].id, level: "DANGER", status: "ACTIVE", metric: "dissolvedOx", value: 2.5, threshold: 4.0, message: "4号塘溶解氧极低（传感器数据）", sourceType: "SENSOR" } }),
    prisma.warning.create({ data: { pondId: ponds[4].id, level: "INFO", status: "RESOLVED", metric: "waterTemp", value: 31.0, threshold: 30.0, message: "5号塘水温偏高已恢复", sourceType: "SENSOR", handlerId: users[3].id, handledAt: new Date("2026-06-08T10:00:00.000Z"), handleRemarks: "气温回落，水温已恢复正常" } }),
  ]);

  const warningRemarks = await Promise.all([
    prisma.warningRemark.create({ data: { warningId: warnings[0].id, sourceType: "INSPECTION", sourceId: inspections[6].id, content: "溶解氧低，氨氮超标，已开启增氧机并加注新水", authorId: users[0].id, createdAt: twoDaysAgo } }),
    prisma.warningRemark.create({ data: { warningId: warnings[1].id, sourceType: "INSPECTION", sourceId: inspections[6].id, content: "溶解氧低，氨氮超标，已开启增氧机并加注新水", authorId: users[0].id, createdAt: twoDaysAgo } }),
    prisma.warningRemark.create({ data: { warningId: warnings[0].id, sourceType: "HANDLER", content: "已加注新水，持续监测溶解氧变化", authorId: users[0].id, createdAt: new Date("2026-06-08T07:00:00.000Z") } }),
    prisma.warningRemark.create({ data: { warningId: warnings[3].id, sourceType: "INSPECTION", sourceId: inspections[7].id, content: "4号塘溶解氧极低，疑似底质恶化", authorId: users[1].id, createdAt: yesterday } }),
    prisma.warningRemark.create({ data: { warningId: warnings[3].id, sourceType: "HANDLER", content: "已通知场长，建议紧急换水并投放底质改良剂", authorId: users[1].id, createdAt: new Date("2026-06-08T09:00:00.000Z") } }),
    prisma.warningRemark.create({ data: { warningId: warnings[4].id, sourceType: "INSPECTION", sourceId: inspections[8].id, content: "3号塘氨氮偏高，需换水处理", authorId: users[1].id, createdAt: yesterday } }),
    prisma.warningRemark.create({ data: { warningId: warnings[5].id, sourceType: "HANDLER", content: "已加注新水调节pH", authorId: users[0].id, createdAt: new Date("2026-06-08T06:00:00.000Z") } }),
    prisma.warningRemark.create({ data: { warningId: warnings[7].id, sourceType: "HANDLER", content: "气温回落，水温已恢复正常", authorId: users[3].id, createdAt: new Date("2026-06-08T10:00:00.000Z") } }),
  ]);

  const feedRecords = await Promise.all([
    prisma.feedRecord.create({ data: { pondId: ponds[0].id, operatorId: users[2].id, feedType: "配合饲料", amount: 12, unit: "kg", fedAt: new Date("2026-06-09T07:00:00.000Z"), remarks: "因水质异常减半投喂" } }),
    prisma.feedRecord.create({ data: { pondId: ponds[1].id, operatorId: users[2].id, feedType: "颗粒饲料", amount: 18, unit: "kg", fedAt: new Date("2026-06-09T07:30:00.000Z") } }),
    prisma.feedRecord.create({ data: { pondId: ponds[2].id, operatorId: users[2].id, feedType: "配合饲料", amount: 15, unit: "kg", fedAt: new Date("2026-06-09T08:00:00.000Z"), remarks: "氨氮偏高，减量投喂" } }),
    prisma.feedRecord.create({ data: { pondId: ponds[3].id, operatorId: users[2].id, feedType: "鲜活饵料", amount: 4, unit: "kg", fedAt: new Date("2026-06-09T07:00:00.000Z"), remarks: "溶解氧极低，大幅减量" } }),
    prisma.feedRecord.create({ data: { pondId: ponds[4].id, operatorId: users[2].id, feedType: "配合饲料", amount: 30, unit: "kg", fedAt: new Date("2026-06-09T08:30:00.000Z") } }),
    prisma.feedRecord.create({ data: { pondId: ponds[5].id, operatorId: users[2].id, feedType: "草料", amount: 25, unit: "kg", fedAt: new Date("2026-06-09T08:00:00.000Z") } }),
  ]);

  const medicationRecords = await Promise.all([
    prisma.medicationRecord.create({ data: { pondId: ponds[0].id, medicationName: "二氧化氯", dosage: 0.5, unit: "kg", purpose: "水体消毒", administeredBy: users[0].id, administeredAt: new Date("2026-06-08T09:00:00.000Z"), remarks: "1号塘紧急消毒", needsFollowUp: true } }),
    prisma.medicationRecord.create({ data: { pondId: ponds[3].id, medicationName: "底质改良剂", dosage: 2.0, unit: "kg", purpose: "改善底质", administeredBy: users[1].id, administeredAt: new Date("2026-06-08T10:00:00.000Z"), remarks: "4号塘底质恶化处理", needsFollowUp: true } }),
    prisma.medicationRecord.create({ data: { pondId: ponds[3].id, medicationName: "维生素C", dosage: 200, unit: "g", purpose: "增强免疫力", administeredBy: users[1].id, administeredAt: new Date("2026-06-07T10:00:00.000Z"), needsFollowUp: true } }),
    prisma.medicationRecord.create({ data: { pondId: ponds[2].id, medicationName: "水质净化剂", dosage: 1.0, unit: "kg", purpose: "降低氨氮", administeredBy: users[1].id, administeredAt: new Date("2026-06-08T14:00:00.000Z"), remarks: "3号塘氨氮处理", needsFollowUp: true } }),
    prisma.medicationRecord.create({ data: { pondId: ponds[4].id, medicationName: "二氧化氯", dosage: 0.3, unit: "kg", purpose: "水体消毒", administeredBy: users[0].id, administeredAt: new Date("2026-06-06T09:00:00.000Z"), needsFollowUp: false, followUpHandledBy: users[3].id, followUpHandledAt: new Date("2026-06-07T09:00:00.000Z"), followUpRemarks: "消毒效果良好，水质已恢复" } }),
  ]);

  const statusLogs = await Promise.all([
    prisma.statusLog.create({ data: { entityType: "Inspection", entityId: inspections[6].id, fromStatus: "PENDING", toStatus: "IN_PROGRESS", operatorId: users[0].id, remarks: "开始巡检1号塘" } }),
    prisma.statusLog.create({ data: { entityType: "Inspection", entityId: inspections[6].id, fromStatus: "IN_PROGRESS", toStatus: "ABNORMAL", operatorId: users[0].id, remarks: "水质异常" } }),
    prisma.statusLog.create({ data: { entityType: "Inspection", entityId: inspections[7].id, fromStatus: "PENDING", toStatus: "IN_PROGRESS", operatorId: users[1].id, remarks: "开始巡检4号塘" } }),
    prisma.statusLog.create({ data: { entityType: "Inspection", entityId: inspections[7].id, fromStatus: "IN_PROGRESS", toStatus: "ABNORMAL", operatorId: users[1].id, remarks: "溶解氧极低" } }),
    prisma.statusLog.create({ data: { entityType: "Inspection", entityId: inspections[8].id, fromStatus: "PENDING", toStatus: "IN_PROGRESS", operatorId: users[1].id, remarks: "开始巡检3号塘" } }),
    prisma.statusLog.create({ data: { entityType: "Inspection", entityId: inspections[8].id, fromStatus: "IN_PROGRESS", toStatus: "ABNORMAL", operatorId: users[1].id, remarks: "氨氮偏高" } }),
    prisma.statusLog.create({ data: { entityType: "Warning", entityId: warnings[5].id, fromStatus: "ACTIVE", toStatus: "ACKNOWLEDGED", operatorId: users[0].id, remarks: "已加注新水" } }),
    prisma.statusLog.create({ data: { entityType: "Warning", entityId: warnings[7].id, fromStatus: "ACTIVE", toStatus: "RESOLVED", operatorId: users[3].id, remarks: "气温回落，水温已恢复" } }),
    prisma.statusLog.create({ data: { entityType: "Pond", entityId: ponds[0].id, fromStatus: "normal", toStatus: "warning", operatorId: users[0].id, remarks: "水质异常标记预警" } }),
    prisma.statusLog.create({ data: { entityType: "Pond", entityId: ponds[0].id, fromStatus: "warning", toStatus: "danger", operatorId: users[0].id, remarks: "溶解氧持续下降，升级为危险" } }),
    prisma.statusLog.create({ data: { entityType: "Pond", entityId: ponds[3].id, fromStatus: "normal", toStatus: "danger", operatorId: users[1].id, remarks: "溶解氧极低标记危险" } }),
    prisma.statusLog.create({ data: { entityType: "Pond", entityId: ponds[2].id, fromStatus: "normal", toStatus: "warning", operatorId: users[1].id, remarks: "氨氮偏高标记预警" } }),
    prisma.statusLog.create({ data: { entityType: "MedicationRecord", entityId: medicationRecords[4].id, fromStatus: "FOLLOW_UP_NEEDED", toStatus: "FOLLOW_UP_COMPLETED", operatorId: users[3].id, remarks: "消毒效果良好，水质已恢复" } }),
  ]);

  return { users, ponds, inspections, warnings, warningRemarks, feedRecords, medicationRecords, statusLogs };
}

export async function POST() {
  try {
    const result = await reseed();
    return NextResponse.json({ success: true, counts: { users: result.users.length, ponds: result.ponds.length, inspections: result.inspections.length, warnings: result.warnings.length } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
