import { json } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { createUrgency, listUrgencyLogs } from "~/services/handover.service";
import { getHandoverTimeline } from "~/services/handover.service";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const entityType = url.searchParams.get("entityType");
  const entityId = url.searchParams.get("entityId");

  if (entityType && entityId) {
    const logs = await listUrgencyLogs(entityType, entityId);
    return json({ urgencyLogs: logs });
  }

  const testRecordId = url.searchParams.get("testRecordId");
  const reworkOrderId = url.searchParams.get("reworkOrderId");

  if (testRecordId || reworkOrderId) {
    const timeline = await getHandoverTimeline(testRecordId || undefined, reworkOrderId || undefined);
    return json({ timeline });
  }

  return json({ error: "entityType+entityId 或 testRecordId/reworkOrderId 必填" }, { status: 400 });
}

export async function action({ request }: ActionFunctionArgs) {
  const body = await request.json();
  const { urgentByRole, urgentById, urgentByName, urgentToRole, urgentToId, urgentToName, reason, entityType, entityId } = body;

  if (!entityType || !entityId || !urgentByRole || !urgentById || !urgentToRole || !urgentToId || !reason) {
    return json({ error: "entityType, entityId, urgentByRole, urgentById, urgentToRole, urgentToId, reason 必填" }, { status: 400 });
  }

  const log = await createUrgency({
    entityType,
    entityId,
    urgentByRole,
    urgentById,
    urgentByName: urgentByName || "",
    urgentToRole,
    urgentToId,
    urgentToName: urgentToName || "",
    reason,
  });

  return json({ urgencyLog: log }, { status: 201 });
}
