import { prisma } from "~/db.server";

export async function createMaterialRequisition(data: {
  projectId: string;
  testRecordId?: string;
  materialName: string;
  unit: string;
  plannedQty: number;
  applicantId: string;
  applicantName: string;
}) {
  return prisma.materialRequisition.create({
    data: {
      projectId: data.projectId,
      testRecordId: data.testRecordId,
      materialName: data.materialName,
      unit: data.unit,
      plannedQty: data.plannedQty,
      status: "PENDING",
      applicantId: data.applicantId,
      applicantName: data.applicantName,
    },
  });
}

export async function approveMaterialRequisition(
  id: string,
  actualQty: number,
  approvedById: string,
  approvedByName: string
) {
  const requisition = await prisma.materialRequisition.findUnique({ where: { id } });
  if (!requisition) throw new Error("材料领用单不存在");

  const overQty = Math.max(0, actualQty - requisition.plannedQty);

  return prisma.materialRequisition.update({
    where: { id },
    data: {
      actualQty,
      overQty,
      status: "APPROVED",
      approvedById,
      approvedByName,
    },
  });
}

export async function rejectMaterialRequisition(
  id: string,
  approvedById: string,
  approvedByName: string
) {
  return prisma.materialRequisition.update({
    where: { id },
    data: {
      status: "REJECTED",
      approvedById,
      approvedByName,
    },
  });
}

export async function returnMaterialRequisition(
  id: string,
  approvedById: string,
  approvedByName: string
) {
  return prisma.materialRequisition.update({
    where: { id },
    data: {
      status: "RETURNED",
      approvedById,
      approvedByName,
    },
  });
}

export async function listOverRequisitions(projectId: string) {
  return prisma.materialRequisition.findMany({
    where: { projectId, overQty: { gt: 0 } },
    orderBy: { overQty: "desc" },
  });
}
