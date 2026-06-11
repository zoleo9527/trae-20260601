import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { prisma } from "~/db.server";

export async function loader() {
  const projects = await prisma.project.findMany({
    include: {
      _count: { select: { testRecords: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return json({ projects });
}

export default function ProjectList() {
  const { projects } = useLoaderData<typeof loader>();

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 960, margin: "0 auto", padding: "2rem" }}>
      <h1>项目列表</h1>
      <Link to="/" style={{ color: "#0066cc" }}>← 返回首页</Link>

      {projects.length === 0 && (
        <div style={{ marginTop: "1rem", padding: "1rem", background: "#fff3cd", borderRadius: 4 }}>
          暂无项目，请先通过 API 创建项目
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem" }}>
        {projects.map((p) => (
          <Link
            key={p.id}
            to={`/projects/${p.id}/test-records`}
            style={{ padding: "1rem", border: "1px solid #ddd", borderRadius: 4, textDecoration: "none", color: "#333", display: "block" }}
          >
            <strong>{p.name}</strong> <span style={{ color: "#666" }}>({p.code})</span>
            <span style={{ marginLeft: "1rem", color: "#888", fontSize: 14 }}>测试记录: {p._count.testRecords}</span>
            {p.address && <span style={{ marginLeft: "1rem", color: "#888", fontSize: 14 }}>地址: {p.address}</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}
