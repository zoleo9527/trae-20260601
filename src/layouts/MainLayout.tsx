import { useState, createContext, useContext, useMemo } from 'react'
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, Space, Tag } from 'antd'
import {
  AppstoreOutlined,
  RollbackOutlined,
  UserOutlined,
  SwapOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { USERS, type UserInfo, type Role } from '@/types'

const { Header, Sider, Content } = Layout

interface UserContextValue {
  currentUser: UserInfo
  setCurrentUser: (u: UserInfo) => void
}

const UserContext = createContext<UserContextValue | null>(null)

export function useCurrentUser(): UserContextValue {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useCurrentUser must be used inside UserProvider')
  return ctx
}

export default function MainLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [currentUser, setCurrentUser] = useState<UserInfo>(USERS[0])

  const ctxValue = useMemo(
    () => ({ currentUser, setCurrentUser }),
    [currentUser]
  )

  const selectedKey = useMemo(() => {
    if (location.pathname.startsWith('/supplements')) return 'supplements'
    if (location.pathname.startsWith('/returns')) return 'returns'
    return 'supplements'
  }, [location.pathname])

  const menuItems: MenuProps['items'] = [
    {
      key: 'supplements',
      icon: <AppstoreOutlined />,
      label: <Link to="/supplements">补砖申请</Link>,
    },
    {
      key: 'returns',
      icon: <RollbackOutlined />,
      label: <Link to="/returns">退货复核</Link>,
    },
  ]

  const roleColor: Record<Role, string> = {
    guide: 'blue',
    designer: 'purple',
    warehouse: 'orange',
  }

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'switch',
      label: (
        <Space>
          <SwapOutlined />
          <span>切换角色</span>
        </Space>
      ),
      children: USERS.map(u => ({
        key: u.id,
        label: (
          <Space>
            <Avatar size="small" icon={<UserOutlined />} />
            <span>{u.name}</span>
            <Tag color={roleColor[u.role]} style={{ margin: 0 }}>
              {u.roleName}
            </Tag>
          </Space>
        ),
        onClick: () => setCurrentUser(u),
      })),
    },
  ]

  return (
    <UserContext.Provider value={ctxValue}>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          theme="dark"
          width={220}
        >
          <div
            style={{
              height: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: collapsed ? 14 : 16,
              fontWeight: 600,
              background: 'rgba(255,255,255,0.06)',
              margin: 8,
              borderRadius: 6,
            }}
          >
            {collapsed ? '瓷砖' : '瓷砖门店管理'}
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
          />
        </Sider>
        <Layout>
          <Header
            style={{
              background: '#fff',
              padding: '0 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 500, color: '#1f1f1f' }}>
              补砖申请与退货复核系统
            </div>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <Space direction="vertical" size={0} style={{ lineHeight: 1.2 }}>
                  <span style={{ fontWeight: 500 }}>{currentUser.name}</span>
                  <Tag
                    color={roleColor[currentUser.role]}
                    style={{ margin: 0, fontSize: 12, padding: '0 6px' }}
                  >
                    {currentUser.roleName}
                  </Tag>
                </Space>
              </Space>
            </Dropdown>
          </Header>
          <Content style={{ margin: 0, overflow: 'auto' }}>
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </UserContext.Provider>
  )
}
