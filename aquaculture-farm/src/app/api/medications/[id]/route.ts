import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const parsedId = parseInt(params.id);
  const data = await request.json();

  const old = await prisma.medicationRecord.findUnique({ where: { id: parsedId } });
  if (!old) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (old.needsFollowUp && data.needsFollowUp === false) {
    await prisma.statusLog.create({
      data: {
        entityType: "MedicationRecord",
        entityId: parsedId,
        fromStatus: "FOLLOW_UP_NEEDED",
        toStatus: "FOLLOW_UP_COMPLETED",
        operatorId: data.followUpHandledBy || data.operatorId || 1,
        remarks: data.followUpRemarks || null,
      },
    });
  }

  const updateData: any = {};
  if (data.needsFollowUp !== undefined) updateData.needsFollowUp = data.needsFollowUp;
  if (data.followUpHandledBy !== undefined) {
    updateData.followUpHandler = { connect: { id: data.followUpHandledBy } };
  }
  if (data.followUpHandledAt !== undefined) updateData.followUpHandledAt = data.followUpHandledAt;
  if (data.followUpRemarks !== undefined) updateData.followUpRemarks = data.followUpRemarks;
  if (data.remarks !== undefined) updateData.remarks = data.remarks;

  const record = await prisma.medicationRecord.update({
    where: { id: parsedId },
    data: updateData,
    include: { pond: true, administrator: true, followUpHandler: true },
  });

  return NextResponse.json(record);
}
