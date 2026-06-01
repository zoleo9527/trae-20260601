import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Space, Tag, Typography, message } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const { Title, Text } = Typography;

const ROLE_DESC = [
  { role: '前台 (frontdesk)', desc: '患者管理、排期、耗材查看、提醒处理', color: 'blue' },
  { role: '医生 (doctor)', desc: '患者治疗、手术操作、耗材使用、提醒处理', color: 'green' },
  { role: '库管 (warehouse)', desc: '耗材入库、库存管理、过期处理', color: 'orange' },
];

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', values);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      message.success('登录成功');
      navigate('/');
    } catch (err) {
      message.error(err.response?.data?.error || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <Card style={{ width: 420, borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ marginBottom: 4 }}>种植牙排期追溯系统</Title>
          <Text type="secondary">Dental Implant Tracking System</Text>
        </div>
        <Form name="login" onFinish={onFinish} size="large" autoComplete="off">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>
        <div style={{ marginTop: 16 }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>角色说明：</Text>
          <Space direction="vertical" size={6} style={{ width: '100%' }}>
            {ROLE_DESC.map((item) => (
              <div key={item.role}>
                <Tag color={item.color}>{item.role}</Tag>
                <Text type="secondary" style={{ fontSize: 12 }}>{item.desc}</Text>
              </div>
            ))}
          </Space>
        </div>
      </Card>
    </div>
  );
}
