import React, { useState } from 'react'
import { Layout, Menu, theme, Badge, Space, Avatar, Dropdown } from 'antd'
import {
  CoffeeOutlined,
  FireOutlined,
  DollarOutlined,
  HistoryOutlined,
  WarningOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { AppProvider, useAppContext } from './context/AppContext'
import BanquetList from './pages/BanquetList'
import KitchenConfirm from './pages/KitchenConfirm'
import FeeConfirm from './pages/FeeConfirm'
import TableChangeHistory from './pages/TableChangeHistory'
import ShortageHistory from './pages/ShortageHistory'

const { Header, Content, Sider } = Layout

const menuItems = [
  {
    key: '/',
    icon: <CoffeeOutlined />,
    label: '宴会管理',
  },
  {
    key: '/kitchen-confirm',
    icon: <FireOutlined />,
    label: '厨房确认',
    badge: true,
  },
  {
    key: '/fee-confirm',
    icon: <DollarOutlined />,
    label: '费用确认',
    badge: true,
  },
  {
    key: '/change-history',
    icon: <HistoryOutlined />,
    label: '变更历史',
  },
  {
    key: '/shortage',
    icon: <WarningOutlined />,
    label: '缺货记录',
    badge: true,
  },
]

const AppContent: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  const { changeRequests, shortages } = useAppContext()

  const pendingKitchenCount = changeRequests.filter(r => r.status === 'pending_kitchen').length
  const pendingFeeCount = changeRequests.filter(r => r.status === 'pending_fee').length
  const pendingShortageCount = shortages.filter(s => s.status === 'pending').length

  const getBadgeCount = (key: string) => {
    if (key === '/kitchen-confirm') return pendingKitchenCount
    if (key === '/fee-confirm') return pendingFeeCount
    if (key === '/shortage') return pendingShortageCount
    return 0
  }

  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: '个人中心',
      },
      {
        key: 'settings',
        icon: <SettingOutlined />,
        label: '系统设置',
      },
      {
        type: 'divider' as const,
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
      },
    ],
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        width={240}
      >
        <div
          style={{
            height: 64,
            margin: 16,
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: collapsed ? 14 : 18,
            fontWeight: 600,
          }}
        >
          {collapsed ? '厨房' : '中央厨房联动系统'}
        </div>
        <Menu
          theme="dark"
          selectedKeys={[location.pathname]}
          mode="inline"
          items={menuItems.map(item => ({
            key: item.key,
            icon: item.badge && getBadgeCount(item.key) > 0 ? (
              <Badge count={getBadgeCount(item.key)} size="small">
                {item.icon}
              </Badge>
            ) : item.icon,
            label: item.label,
            onClick: () => navigate(item.key),
          }))}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 500 }}>
            {menuItems.find(m => m.key === location.pathname)?.label || '中央厨房联动系统'}
          </div>
          <Dropdown menu={userMenu} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <span>厅面主管 - 张伟</span>
            </Space>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: 0,
            minHeight: 280,
            background: '#f0f2f5',
            overflow: 'auto',
          }}
        >
          <Routes>
            <Route path="/" element={<BanquetList />} />
            <Route path="/kitchen-confirm" element={<KitchenConfirm />} />
            <Route path="/fee-confirm" element={<FeeConfirm />} />
            <Route path="/change-history" element={<TableChangeHistory />} />
            <Route path="/shortage" element={<ShortageHistory />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}

export default App
