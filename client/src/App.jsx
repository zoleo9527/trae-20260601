import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, Space } from 'antd'
import {
  FileTextOutlined,
  WarningOutlined,
  TeamOutlined,
  UserOutlined,
  SettingOutlined,
  DashboardOutlined,
} from '@ant-design/icons'
import TaxFilings from './pages/TaxFilings'
import TaxFilingDetail from './pages/TaxFilingDetail'
import Exceptions from './pages/Exceptions'
import ExceptionDetail from './pages/ExceptionDetail'
import Dashboard from './pages/Dashboard'
import { api } from './api'

const { Header, Sider, Content } = Layout

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [currentUser, setCurrentUser] = useState(null)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    api.getCurrentUser().then(setCurrentUser)
  }, [])

  const roleLabels = {
    accountant: '会计',
    manager: '客户经理',
    supervisor: '主管',
  }

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '工作台' },
    { key: '/tax-filings', icon: <FileTextOutlined />, label: '税期申报' },
    { key: '/exceptions', icon: <WarningOutlined />, label: '异常提醒' },
    { key: '/customers', icon: <TeamOutlined />, label: '客户管理' },
  ]

  const handleMenuClick = ({ key }) => {
    navigate(key)
  }

  const getSelectedKey = () => {
    if (location.pathname.startsWith('/tax-filings/')) return '/tax-filings'
    if (location.pathname.startsWith('/exceptions/')) return '/exceptions'
    return location.pathname
  }

  return (
    <Layout className="app-layout">
      <Sider
        theme="dark"
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={220}
      >
        <div className="app-logo" style={{ padding: collapsed ? '16px 8px' : '16px 20px', color: '#fff', fontSize: collapsed ? 12 : 16, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          📊 {collapsed ? '' : '代账管理系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header className="app-header" style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#333' }}>
            {location.pathname.startsWith('/tax-filings/') ? '税期申报详情' :
             location.pathname.startsWith('/exceptions/') ? '异常提醒详情' :
             location.pathname === '/tax-filings' ? '税期申报' :
             location.pathname === '/exceptions' ? '异常提醒' :
             location.pathname === '/dashboard' ? '工作台' :
             location.pathname === '/customers' ? '客户管理' : ''}
          </div>
          <div className="app-user" style={{ color: '#333' }}>
            <Space>
              <Avatar style={{ backgroundColor: '#1677ff' }} icon={<UserOutlined />} />
              <span>
                {currentUser?.name || '加载中...'}
                <span style={{ color: '#999', marginLeft: 8, fontSize: 12 }}>
                  [{roleLabels[currentUser?.role] || ''}]
                </span>
              </span>
            </Space>
          </div>
        </Header>
        <Content className="app-content" style={{ background: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tax-filings" element={<TaxFilings />} />
            <Route path="/tax-filings/:id" element={<TaxFilingDetail />} />
            <Route path="/exceptions" element={<Exceptions />} />
            <Route path="/exceptions/:id" element={<ExceptionDetail />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

export default App
