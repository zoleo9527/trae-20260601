import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const parsedId = parseInt(params.id);
  const data = await request.json();

  const old = await prisma.medicationRecord.findUnique({ where: { id: parsedId }, include: { pond: true } });
  if (!old) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updateData: any = {};
  if (data.remarks !== undefined) updateData.remarks = data.remarks;

  if (data.action === "SUBMIT_FOLLOW_UP" && old.followUpStatus === "PENDING_FOLLOW_UP") {
    updateData.followUpStatus = "PENDING_CONFIRM";
    updateData.followUpSubmitter = { connect: { id: data.operatorId } };
    updateData.followUpSubmittedAt = new Date().toISOString();
    updateData.followUpSubmittedRemarks = data.followUpRemarks || null;

    await prisma.statusLog.create({
      data: {
        entityType: "MedicationRecord",
        entityId: parsedId,
        fromStatus: "PENDING_FOLLOW_UP",
        toStatus: "PENDING_CONFIRM",
        operatorId: data.operatorId,
        remarks: data.followUpRemarks || "技术员提交跟进",
      },
    });

    const pondWarnings = await prisma.warning.findMany({
      where: { pondId: old.pondId, status: { in: ["ACTIVE", "ACKNOWLEDGED"] } },
    });
    for (const w of pondWarnings) {
      await prisma.warningRemark.create({
        data: {
          warningId: w.id,
          sourceType: "MEDICATION",
          sourceId: parsedId,
          content: `[药品跟进] ${old.medicationName}(${old.purpose}) 技术员已跟进：${data.followUpRemarks || "无备注"}`,
          authorId: data.operatorId,
        },
      });
    }
  }

  if (data.action === "CONFIRM_FOLLOW_UP" && old.followUpStatus === "PENDING_CONFIRM") {
    updateData.followUpStatus = "CONFIRMED";
    updateData.needsFollowUp = false;
    updateData.followUpHandler = { connect: { id: data.operatorId } };
    updateData.followUpHandledAt = new Date().toISOString();
    updateData.followUpHandledRemarks = data.followUpRemarks || null;

    await prisma.statusLog.create({
      data: {
        entityType: "MedicationRecord",
        entityId: parsedId,
        fromStatus: "PENDING_CONFIRM",
        toStatus: "CONFIRMED",
        operatorId: data.operatorId,
        remarks: data.followUpRemarks || "场长确认跟进",
      },
    });

    const pondWarnings = await prisma.warning.findMany({
      where: { pondId: old.pondId, status: { in: ["ACTIVE", "ACKNOWLEDGED"] } },
    });
    for (const w of pondWarnings) {
      await prisma.warningRemark.create({
        data: {
          warningId: w.id,
          sourceType: "MEDICATION",
          sourceId: parsedId,
          content: `[药品跟进确认] ${old.medicationName}(${old.purpose}) 场长已确认：${data.followUpRemarks || "无备注"}`,
          authorId: data.operatorId,
        },
      });
    }
  }

  const record = await prisma.medicationRecord.update({
    where: { id: parsedId },
    data: updateData,
    include: { pond: true, administrator: true, followUpHandler: true, followUpSubmitter: true },
  });

  return NextResponse.json(record);
}
