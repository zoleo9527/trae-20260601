import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const inspection = await prisma.inspection.findUnique({
    where: { id: parseInt(id) },
    include: {
      pond: true,
      inspector: true,
      warnings: { include: { handler: true } },
      statusLogs: { include: { operator: true }, orderBy: { createdAt: "asc" } },
      warningRemarks: { include: { author: true }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!inspection) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(inspection);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const parsedId = parseInt(id);
  const data = await request.json();

  const old = await prisma.inspection.findUnique({ where: { id: parsedId } });
  if (!old) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const operatorId = data.inspectorId || old.inspectorId;

  if (old.status !== data.status) {
    await prisma.statusLog.create({
      data: {
        entityType: "Inspection",
        entityId: parsedId,
        fromStatus: old.status,
        toStatus: data.status,
        operatorId,
        remarks: data.remarks || data.statusChangeRemarks || null,
      },
    });
  }

  if (data.status === "ABNORMAL") {
    const checks = [
      { key: "dissolvedOx", metric: "溶解氧", value: data.dissolvedOx, danger: data.dissolvedOx != null && data.dissolvedOx < 4, threshold: 4, level: "DANGER", msg: `溶解氧低于安全阈值：${data.dissolvedOx} < 4` },
      { key: "ammonia", metric: "氨氮", value: data.ammonia, danger: data.ammonia != null && data.ammonia > 1, threshold: 1, level: "WARNING", msg: `氨氮超过安全阈值：${data.ammonia} > 1` },
      { key: "pH", metric: "pH", value: data.pH, danger: data.pH != null && data.pH < 6.5, threshold: 6.5, level: "WARNING", msg: `pH低于安全阈值：${data.pH} < 6.5` },
      { key: "waterTemp", metric: "水温", value: data.waterTemp, danger: data.waterTemp != null && data.waterTemp > 30, threshold: 30, level: "WARNING", msg: `水温超过安全阈值：${data.waterTemp} > 30` },
    ];

    for (const c of checks) {
      if (c.danger) {
        const existing = await prisma.warning.findFirst({
          where: { pondId: old.pondId, metric: c.key, status: { in: ["ACTIVE", "ACKNOWLEDGED"] } },
        });
        if (existing) {
          await prisma.warning.update({
            where: { id: existing.id },
            data: { value: c.value, message: c.msg },
          });
          if (data.remarks) {
            await prisma.warningRemark.create({
              data: {
                warningId: existing.id,
                sourceType: "INSPECTION",
                sourceId: parsedId,
                content: `[巡检更新] ${data.remarks}`,
                authorId: operatorId,
              },
            });
          }
        } else {
          const warning = await prisma.warning.create({
            data: {
              pondId: old.pondId,
              inspectionId: parsedId,
              level: c.level as any,
              metric: c.key,
              value: c.value!,
              threshold: c.threshold,
              message: c.msg,
              status: "ACTIVE",
              sourceType: "INSPECTION",
              sourceId: parsedId,
            },
          });
          await prisma.statusLog.create({
            data: {
              entityType: "Warning",
              entityId: warning.id,
              fromStatus: "NONE",
              toStatus: "ACTIVE",
              operatorId,
              remarks: `由巡检#${parsedId}自动创建`,
            },
          });
          if (data.remarks) {
            await prisma.warningRemark.create({
              data: {
                warningId: warning.id,
                sourceType: "INSPECTION",
                sourceId: parsedId,
                content: data.remarks,
                authorId: operatorId,
              },
            });
          }
        }
      }
    }

    await prisma.pond.update({
      where: { id: old.pondId },
      data: { status: "danger" },
    });
  }

  if (data.status === "COMPLETED") {
    const linkedWarnings = await prisma.warning.findMany({
      where: { inspectionId: parsedId, status: { in: ["ACTIVE", "ACKNOWLEDGED"] } },
    });
    for (const w of linkedWarnings) {
      await prisma.warningRemark.create({
        data: {
          warningId: w.id,
          sourceType: "INSPECTION",
          sourceId: parsedId,
          content: `[巡检正常完成] ${data.remarks || "巡检已正常完成，关联预警待确认"}`,
          authorId: operatorId,
        },
      });
    }

    const otherActive = await prisma.warning.count({
      where: { pondId: old.pondId, status: { in: ["ACTIVE", "ACKNOWLEDGED"] }, id: { notIn: linkedWarnings.map(w => w.id) } },
    });
    if (otherActive === 0) {
      await prisma.pond.update({
        where: { id: old.pondId },
        data: { status: "normal" },
      });
    }
  }

  if (data.remarks && old.remarks !== data.remarks && data.status !== "ABNORMAL" && data.status !== "COMPLETED") {
    const linkedWarnings = await prisma.warning.findMany({
      where: { inspectionId: parsedId },
    });
    for (const w of linkedWarnings) {
      await prisma.warningRemark.create({
        data: {
          warningId: w.id,
          sourceType: "INSPECTION",
          sourceId: parsedId,
          content: `[巡检备注更新] ${data.remarks}`,
          authorId: operatorId,
        },
      });
    }
  }

  const updateData: any = { ...data };
  delete updateData.inspectorId;
  delete updateData.statusChangeRemarks;
  if (data.status === "COMPLETED" || data.status === "ABNORMAL") {
    updateData.completedAt = new Date().toISOString();
  }

  const inspection = await prisma.inspection.update({
    where: { id: parsedId },
    data: updateData,
    include: { pond: true, inspector: true, warnings: { include: { handler: true } } },
  });

  return NextResponse.json(inspection);
}
