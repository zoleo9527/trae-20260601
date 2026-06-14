import { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, CarOutlined } from '@ant-design/icons';
import { authApi } from '../api';
import { AuthTokenPayload } from '../types';
import { useNavigate } from 'react-router-dom';

const ACCOUNTS = [
  { username: 'admin', name: '系统管理员', role: 'admin' },
  { username: 'manager1', name: '张经理', role: '收车经理' },
  { username: 'manager2', name: '李经理', role: '收车经理' },
  { username: 'appraiser1', name: '王评估师', role: '评估师' },
  { username: 'finance1', name: '赵专员', role: '金融专员' }
];

export default function Login({ onLogin }: { onLogin: (u: AuthTokenPayload) => void }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(values: any) {
    setLoading(true);
    try {
      const { user } = await authApi.login(values.username);
      onLogin(user);
      message.success(`欢迎 ${user.name}`);
      navigate('/');
    } catch (e: any) {
      message.error(e.message || '登录失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1e3a8a 0%, #1677ff 100%)' }}>
      <Card style={{ width: 480, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <CarOutlined style={{ fontSize: 48, color: '#1677ff' }} />
          <Typography.Title level={3} style={{ margin: '12px 0 4px' }}>二手车商 · 车源收购与估价审批</Typography.Title>
          <Typography.Text type="secondary">交班可见 · 全程留痕 · 权责分明</Typography.Text>
        </div>
        <Form layout="vertical" onFinish={handleLogin} initialValues={{ username: 'manager1' }}>
          <Form.Item label="用户名" name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="输入用户名" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">登 录</Button>
          </Form.Item>
        </Form>
        <div style={{ borderTop: '1px dashed #e8e8e8', paddingTop: 16 }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>演示账号（直接输入用户名即可）：</Typography.Text>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {ACCOUNTS.map(a => (
              <Button key={a.username} size="small" onClick={() => handleLogin({ username: a.username })}>
                {a.name} · {a.role}
              </Button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
