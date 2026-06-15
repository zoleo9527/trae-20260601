import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, Form, Input, Button, App, Typography, Space } from "antd"
import { CarOutlined, TeamOutlined, CustomerServiceOutlined } from "@ant-design/icons"
import type { Role } from "@/types"
import { useAuthStore } from "@/store/auth"
import * as api from "@/services/api"

const { Title } = Typography

export default function Login() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { login } = useAuthStore()
  const [form] = Form.useForm()
  const [role, setRole] = useState<Role>("dispatcher")
  const [loading, setLoading] = useState(false)

  const roleList: { value: Role; label: string; icon: any; color: string }[] = [
    { value: "dispatcher", label: "调度员", icon: CarOutlined, color: "#1677ff" },
    { value: "leader", label: "组长", icon: TeamOutlined, color: "#52c41a" },
    { value: "customer_service", label: "客服", icon: CustomerServiceOutlined, color: "#fa8c16" },
  ];

  const handleLogin = async (values: any) => {
    setLoading(true);
    try {
      await api.login({ username: values.username, password: values.password, role });
    } catch {}
    const roleUserMap: Record<Role, any> = {
      dispatcher: { id: "u1", name: "调度小李", role: "dispatcher", token: "mock-token-dispatcher" },
      leader: { id: "u2", name: "组长A", role: "leader", token: "mock-token-leader" },
      customer_service: { id: "u3", name: "客服小王", role: "customer_service", token: "mock-token-cs" },
    };
    login(roleUserMap[role]);
    message.success("登录成功！正在跳转...");
    setLoading(false);
    setTimeout(() => navigate("/entry"), 500);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", display: "flex", justifyContent: "center", alignItems: "center", padding: 24 }}>
      <Card style={{ width: 420, boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0 }}>搬家管理系统</Title>
          <p style={{ color: "#666", marginTop: 8 }}>Moving Management System</p>
        </div>
        <Space style={{ width: "100%", marginBottom: 20, display: "flex" }}>
          {roleList.map(r => {
            const Icon = r.icon; const active = role === r.value;
            return (
              <Button key={r.value} type={active ? "primary" : "default"} icon={<Icon />} style={{ flex: 1, ...(active ? { background: r.color, borderColor: r.color } : {}) }} onClick={() => setRole(r.value)}>{r.label}</Button>
            );
          })}
        </Space>
        <Form form={form} layout="vertical" onFinish={handleLogin} initialValues={{ username: "admin", password: "123456" }}>
          <Form.Item label="用户名" name="username" rules={[{ required: true, message: "请输入用户名" }]}><Input size="large" placeholder="请输入用户名" /></Form.Item>
          <Form.Item label="密码" name="password" rules={[{ required: true, message: "请输入密码" }]}><Input.Password size="large" placeholder="请输入密码" /></Form.Item>
          <Form.Item><Button type="primary" size="large" block loading={loading} htmlType="submit" style={{ height: 44 }}>登 录</Button></Form.Item>
        </Form>
        <p style={{ textAlign: "center", color: "#999", fontSize: 12 }}>💡 选择角色后直接点击登录即可（演示模式）</p>
      </Card>
    </div>
  );
}
