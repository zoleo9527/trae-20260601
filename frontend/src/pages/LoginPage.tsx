import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Alert, Spin } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store/useAuthStore';
import { authAPI } from '../services/api';
import { DemoAccount } from '../types';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loading, error, isAuthenticated, clearError } = useAuthStore();
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const fetchDemoAccounts = async () => {
      try {
        const response = await authAPI.getDemoAccounts();
        setDemoAccounts(response.data);
      } catch (error) {
        console.error('Failed to fetch demo accounts:', error);
      } finally {
        setLoadingAccounts(false);
      }
    };
    fetchDemoAccounts();
  }, []);

  const onFinish = async (values: { username: string; password: string }) => {
    try {
      await login(values.username, values.password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleDemoLogin = async (account: DemoAccount) => {
    try {
      await login(account.username, account.password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Demo login failed:', error);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>写字楼租赁管理系统</h1>
          <p>租赁报价与合同流转平台</p>
        </div>
        <div className="login-form">
          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              closable
              onClose={clearError}
              style={{ marginBottom: 20 }}
            />
          )}

          <Form
            name="login"
            onFinish={onFinish}
            autoComplete="off"
            size="large"
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="用户名"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密码"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                icon={<LoginOutlined />}
              >
                登 录
              </Button>
            </Form.Item>
          </Form>

          {loadingAccounts ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Spin size="small" /> 加载演示账号...
            </div>
          ) : (
            <div className="demo-accounts">
              <h4>快速登录 - 演示账号</h4>
              {demoAccounts.map((account) => (
                <div
                  key={account.username}
                  className="demo-account-item"
                  onClick={() => handleDemoLogin(account)}
                >
                  <span className="role">{account.roleName}</span>
                  <span className="account">
                    {account.username} / 123456
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
