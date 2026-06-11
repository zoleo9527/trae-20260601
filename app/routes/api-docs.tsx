import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { API_DOCUMENTATION } from "~/models/api-docs";

export async function loader() {
  return json({ docs: API_DOCUMENTATION });
}

export default function ApiDocs() {
  const { docs } = useLoaderData<typeof loader>();

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 1100, margin: "0 auto", padding: "2rem" }}>
      <h1>接口文档</h1>

      <section style={{ marginBottom: "2rem" }}>
        <h2>角色定义</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #333" }}>
              <th style={{ textAlign: "left", padding: "0.3rem" }}>角色</th>
              <th style={{ textAlign: "left", padding: "0.3rem" }}>标签</th>
              <th style={{ textAlign: "left", padding: "0.3rem" }}>职责</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(docs.roles).map(([key, val]) => (
              <tr key={key} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "0.3rem" }}><code>{key}</code></td>
                <td style={{ padding: "0.3rem" }}>{val.label}</td>
                <td style={{ padding: "0.3rem" }}>{val.responsibilities}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>接口列表</h2>
        {Object.entries(docs.endpoints).map(([path, spec]) => (
          <div key={path} style={{ margin: "1rem 0", padding: "1rem", border: "1px solid #ddd", borderRadius: 4 }}>
            <h3><code>{path}</code></h3>
            <p style={{ fontSize: 14, color: "#666" }}>{spec.description}</p>
            {"params" in spec && spec.params && (
              <div style={{ fontSize: 13 }}>
                <strong>参数:</strong>
                <ul style={{ margin: "0.3rem 0" }}>
                  {Object.entries(spec.params).map(([k, v]) => (
                    <li key={k}><code>{k}</code> ({(v as Record<string, unknown>).type as string}{(v as Record<string, unknown>).required ? ", 必填" : ""}): {(v as Record<string, unknown>).description as string}</li>
                  ))}
                </ul>
              </div>
            )}
            {"response" in spec && spec.response && (
              <div style={{ fontSize: 13 }}>
                <strong>响应:</strong>
                <ul style={{ margin: "0.3rem 0" }}>
                  {Object.entries(spec.response).map(([k, v]) => (
                    <li key={k}><code>{k}</code>: {v as string}</li>
                  ))}
                </ul>
              </div>
            )}
            {"idempotent" in spec && spec.idempotent && (
              <div style={{ fontSize: 13, color: "#198754", marginTop: "0.3rem" }}>
                <strong>幂等:</strong> {spec.idempotent as string}
              </div>
            )}
          </div>
        ))}
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>状态机</h2>
        {Object.entries(docs.stateMachine).map(([key, machine]) => (
          <div key={key} style={{ margin: "1rem 0", padding: "1rem", border: "1px solid #ddd", borderRadius: 4 }}>
            <h3>{machine.description}</h3>
            <ul style={{ fontSize: 13 }}>
              {(machine.flow as string[]).map((step, i) => (
                <li key={i}><code>{step}</code></li>
              ))}
            </ul>
            <p style={{ fontSize: 13, color: "#dc3545" }}><strong>约束:</strong> {machine.constraint as string}</p>
          </div>
        ))}
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>幂等提交机制</h2>
        <div style={{ fontSize: 14 }}>
          <p>{docs.idempotency.description as string}</p>
          <p><strong>机制:</strong> {docs.idempotency.mechanism as string}</p>
          <p><strong>TTL:</strong> {docs.idempotency.ttl as string}</p>
        </div>
      </section>
    </div>
  );
}
