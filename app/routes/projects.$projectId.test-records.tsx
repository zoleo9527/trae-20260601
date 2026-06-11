import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, Form } from "@remix-run/react";
import { listTestRecords } from "~/services/test-record.service";
import { TEST_RECORD_STATUS_LABELS, ROLE_LABELS } from "~/models/types";
import type { TestRecordStatus, Role } from "~/models/types";

export async function loader({ params }: LoaderFunctionArgs) {
  const projectId = params.projectId!;
  const records = await listTestRecords(projectId);
  return json({ records, projectId });
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#6c757d",
  SUBMITTED: "#0d6efd",
  UNDER_REVIEW: "#fd7e14",
  ACCEPTED: "#198754",
  REJECTED: "#dc3545",
  ARCHIVED: "#495057",
};

export default function TestRecordList() {
  const { records, projectId } = useLoaderData<typeof loader>();

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 960, margin: "0 auto", padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>测试记录</h1>
        <Link to="/projects" style={{ color: "#0066cc" }}>← 返回项目列表</Link>
      </div>

      <div style={{ margin: "1rem 0", padding: "0.75rem", background: "#e8f4f8", borderRadius: 4, fontSize: 14 }}>
        <strong>角色筛选：</strong>
        {[["PROJECT_MANAGER", "项目负责人"], ["CONSTRUCTION_TEAM", "施工班组"], ["DOCUMENT_CLERK", "资料员"]].map(([role, label]) => (
          <Link
            key={role}
            to={`/projects/${projectId}/test-records?holderRole=${role}`}
            style={{ marginLeft: "0.5rem", color: "#0066cc" }}
          >
            {label}
          </Link>
        ))}
      </div>

      {records.length === 0 && (
        <div style={{ padding: "1rem", background: "#fff3cd", borderRadius: 4 }}>
          暂无测试记录
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {records.map((r) => (
          <Link
            key={r.id}
            to={`/projects/${projectId}/test-records/${r.id}`}
            style={{ padding: "1rem", border: "1px solid #ddd", borderRadius: 4, textDecoration: "none", color: "#333", display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <div>
              <strong>{r.code}</strong>
              <span style={{ marginLeft: "0.5rem" }}>{r.testItem}</span>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#888" }}>
                当前: {ROLE_LABELS[r.currentHolderRole as keyof typeof ROLE_LABELS] || r.currentHolderRole}
              </span>
              <span
                style={{
                  padding: "0.2rem 0.5rem",
                  borderRadius: 4,
                  color: "#fff",
                  fontSize: 12,
                  background: STATUS_COLORS[r.status] || "#6c757d",
                }}
              >
                {TEST_RECORD_STATUS_LABELS[r.status as keyof typeof TEST_RECORD_STATUS_LABELS] || r.status}
              </span>
              {r.reworkOrders.length > 0 && (
                <span style={{ padding: "0.2rem 0.5rem", borderRadius: 4, color: "#fff", fontSize: 12, background: "#dc3545" }}>
                  整改 {r.reworkOrders.length}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
