import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const warning = await prisma.warning.findUnique({
    where: { id: parseInt(id) },
    include: {
      pond: true,
      inspection: { include: { inspector: true } },
      handler: true,
      remarks: { include: { author: true }, orderBy: { createdAt: "asc" } },
      statusLogs: { include: { operator: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!warning) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(warning);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const parsedId = parseInt(id);
  const data = await request.json();
  const old = await prisma.warning.findUnique({ where: { id: parsedId } });
  if (!old) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (old.status !== data.status) {
    await prisma.statusLog.create({
      data: {
        entityType: "Warning",
        entityId: parsedId,
        fromStatus: old.status,
        toStatus: data.status,
        operatorId: data.handlerId || 1,
        remarks: data.handleRemarks || null,
      },
    });
  }

  if (data.handleRemarks) {
    await prisma.warningRemark.create({
      data: {
        warningId: parsedId,
        sourceType: "HANDLER",
        content: data.handleRemarks,
        authorId: data.handlerId || 1,
      },
    });
  }

  const warning = await prisma.warning.update({
    where: { id: parsedId },
    data,
    include: {
      pond: true,
      inspection: { include: { inspector: true } },
      handler: true,
      remarks: { include: { author: true }, orderBy: { createdAt: "asc" } },
    },
  });

  if (data.status === "RESOLVED") {
    const otherActive = await prisma.warning.count({
      where: { pondId: old.pondId, status: { in: ["ACTIVE", "ACKNOWLEDGED"] }, id: { not: parsedId } },
    });
    if (otherActive === 0) {
      const hasWarningLevel = await prisma.warning.count({
        where: { pondId: old.pondId, status: { in: ["ACTIVE", "ACKNOWLEDGED"] } },
      });
      await prisma.pond.update({
        where: { id: old.pondId },
        data: { status: hasWarningLevel > 0 ? "warning" : "normal" },
      });
    }
  }

  return NextResponse.json(warning);
}
