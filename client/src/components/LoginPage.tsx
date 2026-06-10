import { useState } from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { authApi } from '../api'
import { useUserStore } from '../store/userStore'

const mockUsers = [
  { username: 'manager', password: '123456', name: '张主管', role: 'manager' },
  { username: 'milker', password: '123456', name: '李挤奶员', role: 'milker' },
  { username: 'vet', password: '123456', name: '王兽医', role: 'vet' },
]

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const setUser = useUserStore((state) => state.setUser)
  const [form] = Form.useForm()

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true)
    try {
      const response = await authApi.login(values.username, values.password)
      setUser(response.data)
      message.success(`欢迎, ${response.data.name}`)
    } catch (error) {
      message.error('用户名或密码错误')
    } finally {
      setLoading(false)
    }
  }

  const selectUser = (username: string) => {
    const user = mockUsers.find((u) => u.username === username)
    if (user) {
      form.setFieldsValue({ username: user.username, password: user.password })
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Card
        style={{
          width: 400,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          borderRadius: '12px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
            牧场运营管理系统
          </h2>
          <p style={{ color: '#666', marginTop: 8 }}>牛只档案与繁育记录管理</p>
        </div>

        <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: '8px' }}>
          <p style={{ fontSize: '12px', color: '#666', marginBottom: 8 }}>演示账号（点击快速登录）：</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              size="small"
              onClick={() => selectUser('manager')}
              style={{ flex: 1 }}
            >
              主管
            </Button>
            <Button
              size="small"
              onClick={() => selectUser('milker')}
              style={{ flex: 1 }}
            >
              挤奶员
            </Button>
            <Button
              size="small"
              onClick={() => selectUser('vet')}
              style={{ flex: 1 }}
            >
              兽医
            </Button>
          </div>
        </div>

        <Form form={form} onFinish={handleLogin} layout="vertical">
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入用户名"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{ width: '100%', height: 40 }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <p style={{ textAlign: 'center', color: '#999', fontSize: '12px', marginTop: 16 }}>
          默认密码：123456
        </p>
      </Card>
    </div>
  )
}