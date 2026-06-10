import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, Row, Col, Avatar, Divider, message, Space, Tag } from 'antd';
import { UserOutlined, LockOutlined, AppstoreOutlined as EggOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useAuth, ROLE_LABELS, ROLE_COLORS } from '../contexts/AuthContext';
import { api } from '../api';

const { Title, Text, Paragraph } = Typography;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [demoAccounts, setDemoAccounts] = useState([]);

  useEffect(() => {
    api.auth.getDemoAccounts().then(d => setDemoAccounts(d.accounts)).catch(() => {});
  }, []);

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      await login(values.username, values.password);
      message.success('登录成功');
      navigate('/');
    } catch (e) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (account) => {
    setLoading(true);
    try {
      await login(account.username, '123456');
      message.success(`已切换为 ${account.name}（${ROLE_LABELS[account.role]}）`);
      navigate('/');
    } catch (e) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 40%, #16213e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Row gutter={48} align="middle" style={{ maxWidth: 960, width: '100%' }}>
        <Col xs={0} md={12}>
          <div style={{ color: '#e0e0e0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
              <EggOutlined style={{ fontSize: 48, color: '#ff6b35' }} />
              <Title level={2} style={{ color: '#e0e0e0', margin: 0 }}>蛋鸡养殖场</Title>
            </div>
            <Title level={3} style={{ color: '#b0b0b0', marginTop: 0 }}>鸡舍巡检与产蛋记录</Title>
            <Paragraph style={{ color: '#8c8c8c', fontSize: 16, lineHeight: 2 }}>
              巡检卡在哪里？产蛋记录为什么还没完成？<br />
              谁在处理？责任追踪不再模糊。<br /><br />
              <Text style={{ color: '#e63946', fontWeight: 600 }}>不是日报表能解决的事——</Text><br />
              鸡舍巡检与产蛋记录之间的责任链，<br />
              用系统说清楚。
            </Paragraph>

            <div style={{ marginTop: 32, padding: 16, background: 'rgba(230,57,70,0.08)', border: '1px solid rgba(230,57,70,0.2)', borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <ThunderboltOutlined style={{ color: '#e63946', fontSize: 18 }} />
                <Text strong style={{ color: '#e63946', fontSize: 15 }}>三个核心问题</Text>
              </div>
              <div style={{ color: '#b0b0b0', fontSize: 14, lineHeight: 2 }}>
                <div>1. <Text style={{ color: '#ff6b35' }}>谁在处理</Text> —— 饲养员、分拣员、场长</div>
                <div>2. <Text style={{ color: '#e63946' }}>巡检卡卡在哪里</Text> —— 超时追踪与升级</div>
                <div>3. <Text style={{ color: '#f4a261' }}>产蛋记录为何未完成</Text> —— 原因追溯到底</div>
              </div>
            </div>
          </div>
        </Col>
        <Col xs={24} md={12}>
          <Card style={{ borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', background: '#16213e', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Title level={4} style={{ textAlign: 'center', marginBottom: 8, color: '#e0e0e0' }}>登录系统</Title>
            <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 24, color: '#8c8c8c' }}>
              选择演示账号快速进入，或手动输入
            </Text>

            <Form onFinish={handleLogin} size="large">
              <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
                <Input prefix={<UserOutlined style={{ color: '#666' }} />} placeholder="用户名" style={{ background: 'rgba(22,33,62,0.6)', borderColor: 'rgba(255,255,255,0.1)', color: '#e0e0e0' }} />
              </Form.Item>
              <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
                <Input.Password prefix={<LockOutlined style={{ color: '#666' }} />} placeholder="密码" style={{ background: 'rgba(22,33,62,0.6)', borderColor: 'rgba(255,255,255,0.1)', color: '#e0e0e0' }} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block style={{ height: 44, background: '#e63946', borderColor: '#e63946' }}>
                  登录
                </Button>
              </Form.Item>
            </Form>

            <Divider style={{ borderColor: 'rgba(255,255,255,0.06)', color: '#8c8c8c' }}>演示账号</Divider>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {demoAccounts.map(a => (
                <Button
                  key={a.id}
                  onClick={() => handleDemoLogin(a)}
                  loading={loading}
                  style={{
                    textAlign: 'left', height: 'auto', padding: '10px 16px',
                    borderRadius: 8, background: 'rgba(22,33,62,0.6)', borderColor: 'rgba(255,255,255,0.08)', color: '#e0e0e0',
                  }}
                >
                  <Space>
                    <Avatar size={28} style={{ background: ROLE_COLORS[a.role] }}>
                      {a.name[0]}
                    </Avatar>
                    <div>
                      <Text strong style={{ color: '#e0e0e0' }}>{a.name}</Text>
                      <Tag color={ROLE_COLORS[a.role]} style={{ marginLeft: 8, fontSize: 11 }}>
                        {ROLE_LABELS[a.role]}
                      </Tag>
                      <br />
                      <Text type="secondary" style={{ fontSize: 11, color: '#666' }}>
                        {a.username} / 123456
                      </Text>
                    </div>
                  </Space>
                </Button>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
