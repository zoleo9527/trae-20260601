import { json } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { createMaterialRequisition, approveMaterialRequisition, rejectMaterialRequisition, returnMaterialRequisition, listOverRequisitions } from "~/services/material.service";
import { prisma } from "~/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");
  const testRecordId = url.searchParams.get("testRecordId");
  const id = url.searchParams.get("id");

  if (id) {
    const requisition = await prisma.materialRequisition.findUnique({ where: { id } });
    if (!requisition) return json({ error: "材料领用单不存在" }, { status: 404 });
    return json({ requisition });
  }

  if (projectId) {
    const overOnly = url.searchParams.get("overOnly") === "true";
    if (overOnly) {
      const requisitions = await listOverRequisitions(projectId);
      return json({ requisitions });
    }
    const where: Record<string, unknown> = { projectId };
    if (testRecordId) where.testRecordId = testRecordId;
    const requisitions = await prisma.materialRequisition.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return json({ requisitions });
  }

  return json({ error: "projectId 或 id 必填" }, { status: 400 });
}

export async function action({ request }: ActionFunctionArgs) {
  const body = await request.json();
  const { action: op } = body;

  switch (op) {
    case "create": {
      const { projectId, testRecordId, materialName, unit, plannedQty, applicantId, applicantName } = body;
      if (!projectId || !materialName || !unit || plannedQty === undefined || !applicantId || !applicantName) {
        return json({ error: "projectId, materialName, unit, plannedQty, applicantId, applicantName 必填" }, { status: 400 });
      }
      const requisition = await createMaterialRequisition({
        projectId,
        testRecordId,
        materialName,
        unit,
        plannedQty,
        applicantId,
        applicantName,
      });
      return json({ requisition }, { status: 201 });
    }

    case "approve": {
      const { id, actualQty, approvedById, approvedByName } = body;
      if (!id || actualQty === undefined || !approvedById || !approvedByName) {
        return json({ error: "id, actualQty, approvedById, approvedByName 必填" }, { status: 400 });
      }
      const requisition = await approveMaterialRequisition(id, actualQty, approvedById, approvedByName);
      return json({ requisition });
    }

    case "reject": {
      const { id, approvedById, approvedByName } = body;
      if (!id || !approvedById || !approvedByName) {
        return json({ error: "id, approvedById, approvedByName 必填" }, { status: 400 });
      }
      const requisition = await rejectMaterialRequisition(id, approvedById, approvedByName);
      return json({ requisition });
    }

    case "return": {
      const { id, approvedById, approvedByName } = body;
      if (!id || !approvedById || !approvedByName) {
        return json({ error: "id, approvedById, approvedByName 必填" }, { status: 400 });
      }
      const requisition = await returnMaterialRequisition(id, approvedById, approvedByName);
      return json({ requisition });
    }

    default:
      return json({ error: `不支持的操作: ${op}` }, { status: 400 });
  }
}
