import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Tabs } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuth, getRoleHomePath } from '../store/auth';
import { UserRole } from '../types';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [activeRole, setActiveRole] = useState<UserRole>(UserRole.DISPATCHER);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const roleAccounts = {
    [UserRole.DISPATCHER]: { username: 'dispatcher', password: '123456', label: '调度员' },
    [UserRole.FORKMAN]: { username: 'forkman', password: '123456', label: '叉车班长' },
    [UserRole.CLERK]: { username: 'clerk', password: '123456', label: '仓库文员' },
  };

  const handleQuickLogin = async (role: UserRole) => {
    setLoading(true);
    try {
      const account = roleAccounts[role];
      const user = await authApi.login(account.username, account.password);
      setUser(user);
      message.success(`登录成功，欢迎 ${user.name}`);
      navigate(getRoleHomePath(user.role));
    } catch (error: any) {
      message.error(error.response?.data?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const user = await authApi.login(values.username, values.password);
      setUser(user);
      message.success(`登录成功，欢迎 ${user.name}`);
      navigate(getRoleHomePath(user.role));
    } catch (error: any) {
      message.error(error.response?.data?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const tabItems = [
    { key: UserRole.DISPATCHER, label: '调度员入口' },
    { key: UserRole.FORKMAN, label: '叉车班长入口' },
    { key: UserRole.CLERK, label: '仓库文员入口' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <Card style={{ width: 420, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>物流园月台管理系统</h1>
          <p style={{ color: '#888' }}>到车预约 · 月台分配 · 作业跟踪</p>
        </div>

        <Tabs
          activeKey={activeRole}
          onChange={(key) => setActiveRole(key as UserRole)}
          items={tabItems}
          centered
        />

        <div style={{ marginBottom: 16 }}>
          <Button
            type="dashed"
            block
            size="large"
            loading={loading}
            onClick={() => handleQuickLogin(activeRole)}
          >
            快速登录（{roleAccounts[activeRole].label}）
          </Button>
        </div>

        <div style={{ textAlign: 'center', color: '#aaa', margin: '16px 0', position: 'relative' }}>
          <span style={{ background: '#fff', padding: '0 12px' }}>或手动登录</span>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: 1,
            background: '#eee',
            zIndex: -1,
          }} />
        </div>

        <Form
          name="login"
          onFinish={handleLogin}
          initialValues={{ username: 'dispatcher', password: '123456' }}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
