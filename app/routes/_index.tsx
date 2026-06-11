import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [{ title: "弱电施工队 - 测试记录与返工整改" }];
};

export default function Index() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: 1.6, maxWidth: 960, margin: "0 auto", padding: "2rem" }}>
      <h1>弱电施工队 - 测试记录与返工整改</h1>
      <p>项目负责人 → 施工班组 → 资料员 三方接力</p>
      <nav style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
        <Link to="/projects" style={{ padding: "0.5rem 1rem", border: "1px solid #333", borderRadius: 4, textDecoration: "none", color: "#333" }}>
          项目列表
        </Link>
        <Link to="/api-docs" style={{ padding: "0.5rem 1rem", border: "1px solid #333", borderRadius: 4, textDecoration: "none", color: "#333" }}>
          接口文档
        </Link>
      </nav>
      <div style={{ marginTop: "2rem", padding: "1rem", background: "#f5f5f5", borderRadius: 4 }}>
        <h2>状态流转说明</h2>
        <h3>测试记录</h3>
        <pre style={{ fontSize: 14, overflow: "auto" }}>{`
草稿(DRAFT) → 已提交(SUBMITTED) → 审核中(UNDER_REVIEW) → 已通过(ACCEPTED) → 已归档(ARCHIVED)
                                      ↓
                                  已退回(REJECTED) → 已提交(SUBMITTED) [整改后重新提交]
                                      ↓
                                  草稿(DRAFT) [补充材料]

施工班组: 创建/提交/整改/补充材料
项目负责人: 审核/退回/分配整改/验证
资料员: 归档/关闭整改单
        `}</pre>
        <h3>返工整改（嵌入测试记录详情，非独立菜单）</h3>
        <pre style={{ fontSize: 14, overflow: "auto" }}>{`
已生成(GENERATED) → 已分配(ASSIGNED) → 整改中(RECTIFYING) → 已重新提交(RESUBMITTED)
                                                             ↓
                                                        已验证(VERIFIED) → 已关闭(CLOSED)
                                                             ↓
                                                        整改中(RECTIFYING) [验证不通过退回]

全部整改单关闭后，测试记录自动从 REJECTED → DRAFT
        `}</pre>
      </div>
    </div>
  );
}
