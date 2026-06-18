import { useEffect } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { Card, Button, Row, Col, Typography } from "antd"
import { CarOutlined, TeamOutlined, CustomerServiceOutlined, LogoutOutlined, ArrowRightOutlined } from "@ant-design/icons"
import { useAuthStore } from "@/store/auth"
import type { Role } from "@/types"

const { Title, Paragraph } = Typography

const entryConfigMap: Record<Role, { title: string; desc: string; route: string; icon: any; color: string; bg: string }> = {
  dispatcher: { title: "调度面板", desc: "预约单池、车辆排班、今日看板、异常中心", route: "/dispatcher", icon: CarOutlined, color: "#1677ff", bg: "#e6f4ff" },
  leader: { title: "组长面板", desc: "今日派工状态流转、异常上报一步提交", route: "/leader", icon: TeamOutlined, color: "#52c41a", bg: "#f6ffed" },
  customer: { title: "客服面板", desc: "预约单改价、异常退款处理、物损查看", route: "/customer", icon: CustomerServiceOutlined, color: "#fa8c16", bg: "#fff7e6" },
};

export default function RoleBasedEntry() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const entries = [entryConfigMap[user.role]];

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #e0ebff 0%, #f0e5ff 100%)", padding: 40, display: "flex", justifyContent: "center", alignItems: "center" }}>
      <Card style={{ width: 680, boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }}>
        <Button icon={<LogoutOutlined />} onClick={() => { logout(); navigate("/login"); }} style={{ position: "absolute", top: 16, right: 16 }}>退出登录</Button>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Title level={2} style={{ margin: 0 }}>欢迎回来，{user.name}！</Title>
          <Paragraph type="secondary" style={{ marginTop: 8 }}>角色：{user.role} · 请选择您要进入的系统入口</Paragraph>
        </div>
        <Row gutter={[16, 16]}>
          {entries.map((entry, idx) => {
            const Icon = entry.icon;
            return (
              <Col span={24} key={idx}>
                <Card hoverable style={{ background: entry.bg, border: `1px solid ${entry.color}33` }} bodyStyle={{ padding: 24 }} onClick={() => navigate(entry.route)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 64, height: 64, borderRadius: 16, background: entry.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon style={{ fontSize: 32 }} /></div>
                    <div style={{ flex: 1 }}>
                      <Title level={4} style={{ margin: 0, color: entry.color }}>{entry.title}</Title>
                      <Paragraph style={{ margin: "8px 0 0 0", color: "#666" }}>{entry.desc}</Paragraph>
                    </div>
                    <Button type="primary" style={{ background: entry.color, borderColor: entry.color }} icon={<ArrowRightOutlined />}>进入</Button>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Card>
    </div>
  );
}
