import { json } from "@remix-run/node";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form, useSubmit } from "@remix-run/react";
import { getTestRecord, transitionTestRecord, supplementMaterial } from "~/services/test-record.service";
import { getAvailableTransitions as getStateTransitions } from "~/models/state-machine";
import { TEST_RECORD_MACHINE, REWORK_ORDER_MACHINE } from "~/models/state-machine";
import { listReworkOrders, getReworkOrder, transitionReworkOrder } from "~/services/rework.service";
import { createUrgency, getHandoverTimeline } from "~/services/handover.service";
import {
  TEST_RECORD_STATUS_LABELS,
  REWORK_ORDER_STATUS_LABELS,
  ROLE_LABELS,
  HANDOVER_TYPE_LABELS,
  ATTACHMENT_CATEGORY_LABELS,
} from "~/models/types";
import type { Role, ReworkOrderStatus } from "~/models/types";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const recordId = params.recordId!;
  const record = await getTestRecord(recordId);
  if (!record) throw new Response("Not Found", { status: 404 });

  const url = new URL(request.url);
  const currentRole = (url.searchParams.get("role") || "CONSTRUCTION_TEAM") as Role;

  const availableTransitions = getStateTransitions(TEST_RECORD_MACHINE, record.status, currentRole);

  const timeline = await getHandoverTimeline(recordId);

  return json({ record, availableTransitions, currentRole, timeline });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const recordId = params.recordId!;
  const formData = await request.formData();
  const op = formData.get("_action");

  switch (op) {
    case "transition": {
      const fromStatus = formData.get("fromStatus") as string;
      const toStatus = formData.get("toStatus") as string;
      const operatorRole = formData.get("operatorRole") as Role;
      const operatorId = formData.get("operatorId") as string;
      const operatorName = formData.get("operatorName") as string;
      const remark = formData.get("remark") as string;
      const idempotencyKey = formData.get("idempotencyKey") as string;

      await transitionTestRecord({
        testRecordId: recordId,
        fromStatus: fromStatus as Parameters<typeof transitionTestRecord>[0]["fromStatus"],
        toStatus: toStatus as Parameters<typeof transitionTestRecord>[0]["toStatus"],
        operatorRole,
        operatorId,
        operatorName: operatorName || "",
        remark: remark || undefined,
        idempotencyKey: idempotencyKey || undefined,
      });
      break;
    }

    case "supplement": {
      const operatorRole = formData.get("operatorRole") as Role;
      const operatorId = formData.get("operatorId") as string;
      const operatorName = formData.get("operatorName") as string;
      const category = formData.get("category") as string;
      const remark = formData.get("remark") as string;
      const fileName = formData.get("fileName") as string;

      await supplementMaterial({
        testRecordId: recordId,
        operatorRole,
        operatorId,
        operatorName: operatorName || "",
        category,
        files: [{ fileName, filePath: `/uploads/${fileName}`, fileSize: 0, mimeType: "application/octet-stream" }],
        remark: remark || undefined,
      });
      break;
    }

    case "rework-transition": {
      const reworkOrderId = formData.get("reworkOrderId") as string;
      const fromStatus = formData.get("fromStatus") as ReworkOrderStatus;
      const toStatus = formData.get("toStatus") as ReworkOrderStatus;
      const operatorRole = formData.get("operatorRole") as Role;
      const operatorId = formData.get("operatorId") as string;
      const operatorName = formData.get("operatorName") as string;
      const rectifyMethod = formData.get("rectifyMethod") as string;
      const remark = formData.get("remark") as string;

      await transitionReworkOrder({
        reworkOrderId,
        fromStatus,
        toStatus,
        operatorRole,
        operatorId,
        operatorName: operatorName || "",
        rectifyMethod: rectifyMethod || undefined,
        remark: remark || undefined,
      });
      break;
    }

    case "urge": {
      const urgentByRole = formData.get("urgentByRole") as Role;
      const urgentById = formData.get("urgentById") as string;
      const urgentByName = formData.get("urgentByName") as string;
      const urgentToRole = formData.get("urgentToRole") as Role;
      const urgentToId = formData.get("urgentToId") as string;
      const urgentToName = formData.get("urgentToName") as string;
      const reason = formData.get("reason") as string;

      await createUrgency({
        entityType: "TEST_RECORD",
        entityId: recordId,
        urgentByRole,
        urgentById,
        urgentByName: urgentByName || "",
        urgentToRole,
        urgentToId,
        urgentToName: urgentToName || "",
        reason,
      });
      break;
    }
  }

  return json({ ok: true });
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#6c757d",
  SUBMITTED: "#0d6efd",
  UNDER_REVIEW: "#fd7e14",
  ACCEPTED: "#198754",
  REJECTED: "#dc3545",
  ARCHIVED: "#495057",
  GENERATED: "#dc3545",
  ASSIGNED: "#fd7e14",
  RECTIFYING: "#0d6efd",
  RESUBMITTED: "#6f42c1",
  VERIFIED: "#198754",
  CLOSED: "#495057",
};

export default function TestRecordDetail() {
  const { record, availableTransitions, currentRole, timeline } = useLoaderData<typeof loader>();

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 1100, margin: "0 auto", padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>{record.code} - 测试记录详情</h1>
        <span
          style={{ padding: "0.3rem 0.8rem", borderRadius: 4, color: "#fff", background: STATUS_COLORS[record.status] || "#6c757d", fontSize: 14, fontWeight: 600 }}
        >
          {TEST_RECORD_STATUS_LABELS[record.status as keyof typeof TEST_RECORD_STATUS_LABELS] || record.status}
        </span>
      </div>

      <div style={{ margin: "0.5rem 0", fontSize: 14, color: "#666" }}>
        当前持有人角色: <strong>{ROLE_LABELS[record.currentHolderRole as keyof typeof ROLE_LABELS]}</strong>
      </div>

      <section style={{ marginTop: "1rem", padding: "1rem", border: "1px solid #ddd", borderRadius: 4 }}>
        <h2>基本信息</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr><td style={{ padding: "0.3rem 0", fontWeight: 600, width: 120 }}>测试项目</td><td>{record.testItem}</td></tr>
            <tr><td style={{ padding: "0.3rem 0", fontWeight: 600 }}>测试方法</td><td>{record.testMethod}</td></tr>
            <tr><td style={{ padding: "0.3rem 0", fontWeight: 600 }}>测试结果</td><td>{record.testResult}</td></tr>
            <tr><td style={{ padding: "0.3rem 0", fontWeight: 600 }}>结论</td><td>{record.conclusion}</td></tr>
            <tr><td style={{ padding: "0.3rem 0", fontWeight: 600 }}>创建时间</td><td>{new Date(record.createdAt).toLocaleString("zh-CN")}</td></tr>
          </tbody>
        </table>
      </section>

      <section style={{ marginTop: "1rem", padding: "1rem", border: "1px solid #0d6efd", borderRadius: 4, background: "#f0f7ff" }}>
        <h2>操作面板（当前角色: {ROLE_LABELS[currentRole as keyof typeof ROLE_LABELS]}）</h2>

        <div style={{ marginBottom: "0.5rem" }}>
          <label style={{ fontSize: 13 }}>切换角色: </label>
          {(["PROJECT_MANAGER", "CONSTRUCTION_TEAM", "DOCUMENT_CLERK"] as const).map((role) => (
            <a
              key={role}
              href={`?role=${role}`}
              style={{
                marginLeft: "0.5rem",
                padding: "0.2rem 0.5rem",
                borderRadius: 4,
                textDecoration: "none",
                color: currentRole === role ? "#fff" : "#0d6efd",
                background: currentRole === role ? "#0d6efd" : "transparent",
                border: "1px solid #0d6efd",
                fontSize: 13,
              }}
            >
              {ROLE_LABELS[role]}
            </a>
          ))}
        </div>

        {availableTransitions.length === 0 && (
          <div style={{ fontSize: 14, color: "#888" }}>当前角色无可用操作</div>
        )}

        {availableTransitions.map((t) => (
          <Form key={`${t.from}-${t.to}`} method="post" style={{ margin: "0.5rem 0", display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            <input type="hidden" name="_action" value="transition" />
            <input type="hidden" name="fromStatus" value={t.from} />
            <input type="hidden" name="toStatus" value={t.to} />
            <input type="hidden" name="operatorRole" value={currentRole} />
            <input type="hidden" name="operatorId" value={`${currentRole}-001`} />
            <input type="hidden" name="operatorName" value={ROLE_LABELS[currentRole as keyof typeof ROLE_LABELS]} />
            <input type="hidden" name="idempotencyKey" value={`${record.id}-${t.from}-${t.to}-${Date.now()}`} />
            <button
              type="submit"
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: 4,
                border: "none",
                color: "#fff",
                background: STATUS_COLORS[t.to] || "#0d6efd",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              {t.action}
            </button>
            <span style={{ fontSize: 12, color: "#888" }}>
              {TEST_RECORD_STATUS_LABELS[t.from as keyof typeof TEST_RECORD_STATUS_LABELS]} → {TEST_RECORD_STATUS_LABELS[t.to as keyof typeof TEST_RECORD_STATUS_LABELS]}
            </span>
            <input name="remark" placeholder="备注（选填）" style={{ fontSize: 13, padding: "0.2rem 0.5rem", border: "1px solid #ccc", borderRadius: 4 }} />
          </Form>
        ))}

        {currentRole === "CONSTRUCTION_TEAM" && (record.status === "DRAFT" || record.status === "REJECTED") && (
          <Form method="post" style={{ margin: "0.5rem 0", display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap", borderTop: "1px solid #ccc", paddingTop: "0.5rem" }}>
            <input type="hidden" name="_action" value="supplement" />
            <input type="hidden" name="operatorRole" value={currentRole} />
            <input type="hidden" name="operatorId" value={`${currentRole}-001`} />
            <input type="hidden" name="operatorName" value={ROLE_LABELS[currentRole as keyof typeof ROLE_LABELS]} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>补充材料:</span>
            <select name="category" style={{ fontSize: 13, padding: "0.2rem" }}>
              {Object.entries(ATTACHMENT_CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <input name="fileName" placeholder="文件名" required style={{ fontSize: 13, padding: "0.2rem 0.5rem", border: "1px solid #ccc", borderRadius: 4 }} />
            <input name="remark" placeholder="补充说明" style={{ fontSize: 13, padding: "0.2rem 0.5rem", border: "1px solid #ccc", borderRadius: 4 }} />
            <button type="submit" style={{ padding: "0.4rem 0.8rem", borderRadius: 4, border: "none", color: "#fff", background: "#198754", cursor: "pointer", fontSize: 13 }}>
              提交补充
            </button>
          </Form>
        )}

        {(currentRole === "PROJECT_MANAGER" || currentRole === "DOCUMENT_CLERK") && (
          <Form method="post" style={{ margin: "0.5rem 0", display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap", borderTop: "1px solid #ccc", paddingTop: "0.5rem" }}>
            <input type="hidden" name="_action" value="urge" />
            <input type="hidden" name="urgentByRole" value={currentRole} />
            <input type="hidden" name="urgentById" value={`${currentRole}-001`} />
            <input type="hidden" name="urgentByName" value={ROLE_LABELS[currentRole as keyof typeof ROLE_LABELS]} />
            <input type="hidden" name="urgentToRole" value="CONSTRUCTION_TEAM" />
            <input type="hidden" name="urgentToId" value="CONSTRUCTION_TEAM-001" />
            <input type="hidden" name="urgentToName" value="施工班组" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#dc3545" }}>催办:</span>
            <input name="reason" placeholder="催办原因" required style={{ fontSize: 13, padding: "0.2rem 0.5rem", border: "1px solid #dc3545", borderRadius: 4 }} />
            <button type="submit" style={{ padding: "0.4rem 0.8rem", borderRadius: 4, border: "1px solid #dc3545", background: "#fff", color: "#dc3545", cursor: "pointer", fontSize: 13 }}>
              催办
            </button>
          </Form>
        )}
      </section>

      {record.reworkOrders.length > 0 && (
        <section style={{ marginTop: "1rem", padding: "1rem", border: "1px solid #dc3545", borderRadius: 4, background: "#fff5f5" }}>
          <h2>返工整改记录（嵌入详情，非独立菜单）</h2>
          {record.reworkOrders.map((ro) => {
            const reworkTransitions = getAvailableTransitions(REWORK_ORDER_MACHINE, ro.status, currentRole);
            return (
              <div key={ro.id} style={{ margin: "0.5rem 0", padding: "0.75rem", border: "1px solid #e0a0a0", borderRadius: 4, background: "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong>{ro.code}</strong>
                  <span style={{ padding: "0.2rem 0.5rem", borderRadius: 4, color: "#fff", fontSize: 12, background: STATUS_COLORS[ro.status] || "#6c757d" }}>
                    {REWORK_ORDER_STATUS_LABELS[ro.status as keyof typeof REWORK_ORDER_STATUS_LABELS] || ro.status}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: "#666", marginTop: "0.3rem" }}>
                  缺陷描述: {ro.defectDesc} | 当前持有人: {ROLE_LABELS[ro.currentHolderRole as keyof typeof ROLE_LABELS]}
                </div>
                {ro.rectifyMethod && <div style={{ fontSize: 13, color: "#666" }}>整改方法: {ro.rectifyMethod}</div>}
                <div style={{ fontSize: 13, color: "#888", marginTop: "0.2rem" }}>
                  截止: {new Date(ro.deadline).toLocaleDateString("zh-CN")} | 创建: {new Date(ro.createdAt).toLocaleString("zh-CN")}
                </div>

                {ro.stateTransitions.length > 0 && (
                  <div style={{ marginTop: "0.5rem", fontSize: 12, color: "#888" }}>
                    <strong>状态变更:</strong>
                    {ro.stateTransitions.map((st) => (
                      <div key={st.id} style={{ marginLeft: "0.5rem" }}>
                        {REWORK_ORDER_STATUS_LABELS[st.fromStatus as keyof typeof REWORK_ORDER_STATUS_LABELS]} → {REWORK_ORDER_STATUS_LABELS[st.toStatus as keyof typeof REWORK_ORDER_STATUS_LABELS]}
                        {" "}({ROLE_LABELS[st.operatorRole as keyof typeof ROLE_LABELS]}: {st.operatorName} {st.remark ? `备注: ${st.remark}` : ""})
                      </div>
                    ))}
                  </div>
                )}

                {reworkTransitions.length > 0 && (
                  <div style={{ marginTop: "0.5rem" }}>
                    {reworkTransitions.map((rt) => (
                      <Form key={`${rt.from}-${rt.to}`} method="post" style={{ display: "inline-flex", gap: "0.3rem", alignItems: "center", marginRight: "0.5rem" }}>
                        <input type="hidden" name="_action" value="rework-transition" />
                        <input type="hidden" name="reworkOrderId" value={ro.id} />
                        <input type="hidden" name="fromStatus" value={rt.from} />
                        <input type="hidden" name="toStatus" value={rt.to} />
                        <input type="hidden" name="operatorRole" value={currentRole} />
                        <input type="hidden" name="operatorId" value={`${currentRole}-001`} />
                        <input type="hidden" name="operatorName" value={ROLE_LABELS[currentRole as keyof typeof ROLE_LABELS]} />
                        {rt.to === "RESUBMITTED" && (
                          <input name="rectifyMethod" placeholder="整改方法" style={{ fontSize: 12, padding: "0.2rem 0.4rem", border: "1px solid #ccc", borderRadius: 4 }} />
                        )}
                        <input name="remark" placeholder="备注" style={{ fontSize: 12, padding: "0.2rem 0.4rem", border: "1px solid #ccc", borderRadius: 4 }} />
                        <button
                          type="submit"
                          style={{ padding: "0.2rem 0.5rem", borderRadius: 4, border: "none", color: "#fff", background: STATUS_COLORS[rt.to] || "#0d6efd", cursor: "pointer", fontSize: 12 }}
                        >
                          {rt.action}
                        </button>
                      </Form>
                    ))}
                  </div>
                )}

                {ro.attachments.length > 0 && (
                  <div style={{ marginTop: "0.5rem", fontSize: 12 }}>
                    <strong>附件:</strong>
                    {ro.attachments.map((a) => (
                      <span key={a.id} style={{ marginLeft: "0.5rem", color: "#0066cc" }}>
                        [{ATTACHMENT_CATEGORY_LABELS[a.category as keyof typeof ATTACHMENT_CATEGORY_LABELS]}] {a.fileName}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      {record.stateTransitions.length > 0 && (
        <section style={{ marginTop: "1rem", padding: "1rem", border: "1px solid #ddd", borderRadius: 4 }}>
          <h2>状态变更记录（数据驱动，非页面写死）</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #ddd" }}>
                <th style={{ textAlign: "left", padding: "0.3rem" }}>时间</th>
                <th style={{ textAlign: "left", padding: "0.3rem" }}>操作</th>
                <th style={{ textAlign: "left", padding: "0.3rem" }}>状态变更</th>
                <th style={{ textAlign: "left", padding: "0.3rem" }}>操作人</th>
                <th style={{ textAlign: "left", padding: "0.3rem" }}>备注</th>
              </tr>
            </thead>
            <tbody>
              {record.stateTransitions.map((st) => (
                <tr key={st.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "0.3rem" }}>{new Date(st.createdAt).toLocaleString("zh-CN")}</td>
                  <td style={{ padding: "0.3rem" }}>{st.action}</td>
                  <td style={{ padding: "0.3rem" }}>
                    {TEST_RECORD_STATUS_LABELS[st.fromStatus as keyof typeof TEST_RECORD_STATUS_LABELS] || st.fromStatus} → {TEST_RECORD_STATUS_LABELS[st.toStatus as keyof typeof TEST_RECORD_STATUS_LABELS] || st.toStatus}
                  </td>
                  <td style={{ padding: "0.3rem" }}>
                    {ROLE_LABELS[st.operatorRole as keyof typeof ROLE_LABELS]}: {st.operatorName}
                  </td>
                  <td style={{ padding: "0.3rem", color: "#888" }}>{st.remark || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {(record.attachments.length > 0 || record.materialRequisitions.length > 0 || record.cableRoutes.length > 0) && (
        <section style={{ marginTop: "1rem", padding: "1rem", border: "1px solid #ddd", borderRadius: 4 }}>
          <h2>交接材料</h2>

          {record.attachments.length > 0 && (
            <div style={{ marginBottom: "0.5rem" }}>
              <strong>附件:</strong>
              {record.attachments.map((a) => (
                <div key={a.id} style={{ marginLeft: "1rem", fontSize: 13 }}>
                  <span style={{ color: "#0066cc" }}>[{ATTACHMENT_CATEGORY_LABELS[a.category as keyof typeof ATTACHMENT_CATEGORY_LABELS]}]</span>
                  {" "}{a.fileName} - {a.uploadedByName} ({new Date(a.uploadedAt).toLocaleString("zh-CN")})
                </div>
              ))}
            </div>
          )}

          {record.cableRoutes.length > 0 && (
            <div style={{ marginBottom: "0.5rem" }}>
              <strong>线缆走向:</strong>
              {record.cableRoutes.map((cr) => (
                <div key={cr.id} style={{ marginLeft: "1rem", fontSize: 13 }}>
                  {cr.routeName}: {cr.startPoint} → {cr.endPoint} ({cr.cableType}, {cr.length}m)
                </div>
              ))}
            </div>
          )}

          {record.materialRequisitions.length > 0 && (
            <div>
              <strong>材料领用:</strong>
              {record.materialRequisitions.map((mr) => (
                <div key={mr.id} style={{ marginLeft: "1rem", fontSize: 13 }}>
                  {mr.materialName}: 计划 {mr.plannedQty}{mr.unit} / 实际 {mr.actualQty}{mr.unit}
                  {mr.overQty > 0 && <span style={{ color: "#dc3545" }}> (超领 {mr.overQty}{mr.unit})</span>}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {timeline.length > 0 && (
        <section style={{ marginTop: "1rem", padding: "1rem", border: "1px solid #ddd", borderRadius: 4 }}>
          <h2>交接时间线</h2>
          {timeline.map((log, idx) => (
            <div key={idx} style={{ display: "flex", gap: "0.5rem", alignItems: "baseline", fontSize: 13, margin: "0.3rem 0" }}>
              <span style={{ color: "#888", whiteSpace: "nowrap" }}>{new Date(log.createdAt as string).toLocaleString("zh-CN")}</span>
              <span style={{ padding: "0.1rem 0.3rem", borderRadius: 3, background: "#e9ecef", fontSize: 12 }}>
                {log.source === "REWORK_ORDER" ? "整改" : "测试"}
              </span>
              <span>
                {ROLE_LABELS[log.fromRole as keyof typeof ROLE_LABELS]}({String(log.fromUserName)})
                → {ROLE_LABELS[log.toRole as keyof typeof ROLE_LABELS]}({String(log.toUserName)})
              </span>
              <span style={{ color: "#0066cc" }}>
                {HANDOVER_TYPE_LABELS[log.handoverType as keyof typeof HANDOVER_TYPE_LABELS]}
              </span>
              {Boolean(log.remark) && <span style={{ color: "#888" }}>- {String(log.remark)}</span>}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

function getAvailableTransitions(machine: typeof REWORK_ORDER_MACHINE, status: string, role: string) {
  return machine.transitions.filter(
    (t) => t.from === status && t.allowedRoles.includes(role as typeof t.allowedRoles[number])
  );
}
