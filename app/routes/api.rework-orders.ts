import { json } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { listReworkOrders, getReworkOrder, transitionReworkOrder, supplementReworkAttachment } from "~/services/rework.service";
import { getAvailableTransitions } from "~/models/state-machine";
import { REWORK_ORDER_MACHINE } from "~/models/state-machine";
import { checkIdempotency, getHandoverTimeline, listUrgencyLogs } from "~/services/handover.service";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const testRecordId = url.searchParams.get("testRecordId");

  if (id) {
    const order = await getReworkOrder(id);
    if (!order) return json({ error: "返工整改单不存在" }, { status: 404 });

    const operatorRole = url.searchParams.get("role") as "PROJECT_MANAGER" | "CONSTRUCTION_TEAM" | "DOCUMENT_CLERK" | null;
    const availableTransitions = operatorRole
      ? getAvailableTransitions(REWORK_ORDER_MACHINE, order.status, operatorRole)
      : [];

    const timeline = await getHandoverTimeline(undefined, id);
    const urgencyLogs = await listUrgencyLogs("REWORK_ORDER", id);

    return json({
      order,
      availableTransitions,
      reworkDetail: {
        id: order.id,
        code: order.code,
        status: order.status,
        defectDesc: order.defectDesc,
        rectifyMethod: order.rectifyMethod,
        deadline: order.deadline,
        currentHolderRole: order.currentHolderRole,
        currentHolderId: order.currentHolderId,
        stateTransitions: order.stateTransitions.map((st) => ({
          id: st.id,
          fromStatus: st.fromStatus,
          toStatus: st.toStatus,
          operatorRole: st.operatorRole,
          operatorId: st.operatorId,
          operatorName: st.operatorName,
          action: st.action,
          remark: st.remark,
          createdAt: st.createdAt,
        })),
        handoverLogs: order.handoverLogs.map((hl) => ({
          id: hl.id,
          fromRole: hl.fromRole,
          fromUserId: hl.fromUserId,
          fromUserName: hl.fromUserName,
          toRole: hl.toRole,
          toUserId: hl.toUserId,
          toUserName: hl.toUserName,
          handoverType: hl.handoverType,
          remark: hl.remark,
          createdAt: hl.createdAt,
        })),
        attachments: order.attachments,
      },
      urgencyLogs,
      timeline,
    });
  }

  if (testRecordId) {
    const orders = await listReworkOrders(testRecordId);
    return json({ orders });
  }

  return json({ error: "id 或 testRecordId 必填" }, { status: 400 });
}

export async function action({ request }: ActionFunctionArgs) {
  const body = await request.json();
  const { action: op } = body;

  switch (op) {
    case "transition": {
      const { reworkOrderId, fromStatus, toStatus, operatorRole, operatorId, operatorName, receiverId, receiverName, rectifyMethod, remark, idempotencyKey } = body;
      if (!reworkOrderId || !fromStatus || !toStatus || !operatorRole || !operatorId) {
        return json({ error: "reworkOrderId, fromStatus, toStatus, operatorRole, operatorId 必填" }, { status: 400 });
      }

      if (idempotencyKey) {
        const isDuplicate = await checkIdempotency(idempotencyKey);
        if (isDuplicate) {
          const existing = await getReworkOrder(reworkOrderId);
          const timeline = await getHandoverTimeline(undefined, reworkOrderId);
          const urgencyLogs = await listUrgencyLogs("REWORK_ORDER", reworkOrderId);
          return json({ order: existing, timeline, urgencyLogs, idempotent: true });
        }
      }

      try {
        const order = await transitionReworkOrder({
          reworkOrderId,
          fromStatus,
          toStatus,
          operatorRole,
          operatorId,
          operatorName: operatorName || "",
          receiverId: receiverId || undefined,
          receiverName: receiverName || undefined,
          rectifyMethod,
          remark,
          idempotencyKey,
        });
        const timeline = await getHandoverTimeline(undefined, reworkOrderId);
        const urgencyLogs = await listUrgencyLogs("REWORK_ORDER", reworkOrderId);
        return json({ order, timeline, urgencyLogs });
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "状态流转失败";
        return json({ error: message }, { status: 422 });
      }
    }

    case "supplement": {
      const { reworkOrderId, operatorRole, operatorId, operatorName, category, files, remark } = body;
      if (!reworkOrderId || !operatorRole || !operatorId || !category || !files?.length) {
        return json({ error: "reworkOrderId, operatorRole, operatorId, category, files 必填" }, { status: 400 });
      }
      const order = await supplementReworkAttachment({
        reworkOrderId,
        operatorRole,
        operatorId,
        operatorName: operatorName || "",
        category,
        files,
        remark,
      });
      const timeline = await getHandoverTimeline(undefined, reworkOrderId);
      const urgencyLogs = await listUrgencyLogs("REWORK_ORDER", reworkOrderId);
      return json({ order, timeline, urgencyLogs });
    }

    default:
      return json({ error: `不支持的操作: ${op}` }, { status: 400 });
  }
}
