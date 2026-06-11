import { json } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { listTestRecords, getTestRecord, createTestRecord, transitionTestRecord, supplementMaterial } from "~/services/test-record.service";
import { getAvailableTransitions } from "~/models/state-machine";
import { TEST_RECORD_MACHINE } from "~/models/state-machine";
import { checkIdempotency } from "~/services/handover.service";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");
  if (!projectId) {
    return json({ error: "projectId 必填" }, { status: 400 });
  }

  const id = url.searchParams.get("id");
  if (id) {
    const record = await getTestRecord(id);
    if (!record) return json({ error: "测试记录不存在" }, { status: 404 });

    const operatorRole = url.searchParams.get("role") as "PROJECT_MANAGER" | "CONSTRUCTION_TEAM" | "DOCUMENT_CLERK" | null;
    const availableTransitions = operatorRole
      ? getAvailableTransitions(TEST_RECORD_MACHINE, record.status, operatorRole)
      : [];

    return json({ record, availableTransitions });
  }

  const status = url.searchParams.get("status") as "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "ACCEPTED" | "REJECTED" | "ARCHIVED" | null;
  const holderRole = url.searchParams.get("holderRole") as "PROJECT_MANAGER" | "CONSTRUCTION_TEAM" | "DOCUMENT_CLERK" | null;

  const records = await listTestRecords(projectId, {
    status: status || undefined,
    holderRole: holderRole || undefined,
  } as Parameters<typeof listTestRecords>[1]);

  return json({ records });
}

export async function action({ request }: ActionFunctionArgs) {
  const body = await request.json();
  const { action: op } = body;

  switch (op) {
    case "create": {
      const { projectId, testItem, testMethod, testResult, conclusion, holderId } = body;
      if (!projectId || !testItem || !holderId) {
        return json({ error: "projectId, testItem, holderId 必填" }, { status: 400 });
      }
      const record = await createTestRecord({
        projectId,
        testItem,
        testMethod: testMethod || "",
        testResult: testResult || "",
        conclusion: conclusion || "",
        holderId,
      });
      return json({ record }, { status: 201 });
    }

    case "transition": {
      const { testRecordId, fromStatus, toStatus, operatorRole, operatorId, operatorName, remark, idempotencyKey } = body;
      if (!testRecordId || !fromStatus || !toStatus || !operatorRole || !operatorId) {
        return json({ error: "testRecordId, fromStatus, toStatus, operatorRole, operatorId 必填" }, { status: 400 });
      }

      if (idempotencyKey) {
        const isDuplicate = await checkIdempotency(idempotencyKey);
        if (isDuplicate) {
          const existing = await getTestRecord(testRecordId);
          return json({ record: existing, idempotent: true });
        }
      }

      try {
        const record = await transitionTestRecord({
          testRecordId,
          fromStatus,
          toStatus,
          operatorRole,
          operatorId,
          operatorName: operatorName || "",
          remark,
          idempotencyKey,
        });
        return json({ record });
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "状态流转失败";
        return json({ error: message }, { status: 422 });
      }
    }

    case "supplement": {
      const { testRecordId, operatorRole, operatorId, operatorName, category, files, remark } = body;
      if (!testRecordId || !operatorRole || !operatorId || !category || !files?.length) {
        return json({ error: "testRecordId, operatorRole, operatorId, category, files 必填" }, { status: 400 });
      }
      const record = await supplementMaterial({
        testRecordId,
        operatorRole,
        operatorId,
        operatorName: operatorName || "",
        category,
        files,
        remark,
      });
      return json({ record });
    }

    default:
      return json({ error: `不支持的操作: ${op}` }, { status: 400 });
  }
}
