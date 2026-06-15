import { Routes, Route, Link } from 'react-router-dom'
import { Layout, Menu, Button, Space, Typography, Dropdown, Avatar } from 'antd'
import {
  DashboardOutlined, FileTextOutlined, UserOutlined, ReloadOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import Dashboard from './pages/Dashboard'
import DeviceDetail from './pages/DeviceDetail'
import OrderList from './pages/OrderList'
import { systemApi, userApi } from './api'
import { message } from 'antd'
import type { User, UserRole } from './types'
import { roleMap } from './types'

const { Header, Content, Sider } = Layout
const { Title } = Typography

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    userApi.getList().then((res) => {
      if (res.data.success) {
        setUsers(res.data.data || [])
        setCurrentUser(res.data.data?.[0] || null)
      }
    })
  }, [])

  const handleReset = async () => {
    try {
      await systemApi.reset()
      message.success('数据已重置')
      setTimeout(() => window.location.reload(), 500)
    } catch {
      message.error('重置失败')
    }
  }

  const roleToIcon = (role: UserRole) => {
    switch (role) {
      case 'receiver':
        return '📋'
      case 'designer':
        return '🎨'
      case 'installer':
        return '🔧'
    }
  }

  const userMenu = {
    items: users.map((u) => ({
      key: u.id,
      label: (
        <span>
          {roleToIcon(u.role)} {u.name} ({roleMap[u.role]})
        </span>
      ),
      onClick: () => setCurrentUser(u),
    })),
  }

  if (!currentUser) return null

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        }}
      >
        <Space>
          <Title level={4} style={{ margin: 0 }}>
            🖨️ 广告喷绘店 - 稿件接收与尺寸复核
          </Title>
          <span style={{ color: '#888', fontSize: '14px' }}>
            今日：{dayjs().format('YYYY年MM月DD日')}
          </span>
        </Space>
        <Space>
          <Dropdown menu={userMenu} trigger={['click']}>
            <Button type="text" icon={<UserOutlined />}>
              {roleToIcon(currentUser.role)} {currentUser.name} ({roleMap[currentUser.role]})
            </Button>
          </Dropdown>
          <Button icon={<ReloadOutlined />} onClick={handleReset} danger>
            重置数据
          </Button>
        </Space>
      </Header>
      <Layout>
        <Sider width={200} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            defaultSelectedKeys={['dashboard']}
            style={{ height: '100%', borderRight: 0 }}
            items={[
              {
                key: 'dashboard',
                icon: <DashboardOutlined />,
                label: <Link to="/">今日待办</Link>,
              },
              {
                key: 'orders',
                icon: <FileTextOutlined />,
                label: <Link to="/orders">全部订单</Link>,
              },
            ]}
          />
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content style={{ background: '#f0f2f5', minHeight: 280 }}>
            <Routes>
              <Route path="/" element={<Dashboard currentUser={currentUser} />} />
              <Route path="/orders" element={<OrderList currentUser={currentUser} />} />
              <Route path="/orders/:id" element={<DeviceDetail currentUser={currentUser} />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  )
}

export default App
