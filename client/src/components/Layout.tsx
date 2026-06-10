import { Layout as AntLayout, Menu, Button, Dropdown, Avatar } from 'antd'
import { UserOutlined, FileTextOutlined, CalendarOutlined, LogoutOutlined, UserSwitchOutlined } from '@ant-design/icons'
import { useUserStore } from '../store/userStore'
import { getRoleText } from '../utils/format'
import { useState } from 'react'

const { Header, Sider, Content } = AntLayout

interface LayoutProps {
  children: React.ReactNode
  currentPage: string
  onPageChange: (page: string) => void
}

const menuItems = [
  { key: 'cattle', label: '牛只档案', icon: <FileTextOutlined /> },
  { key: 'breeding', label: '繁育记录', icon: <CalendarOutlined /> },
]

export default function Layout({ children, currentPage, onPageChange }: LayoutProps) {
  const { user, clearUser } = useUserStore()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = () => {
    clearUser()
  }

  const userMenu = (
    <Menu>
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        退出登录
      </Menu.Item>
    </Menu>
  )

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}>
              🐄 牧场运营管理系统
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Dropdown overlay={userMenu}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '8px 16px', borderRadius: '8px', hover: { background: '#f5f5f5' } }}>
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
                <span style={{ fontSize: '14px', fontWeight: 500 }}>{user?.name}</span>
                <span style={{ fontSize: '12px', color: '#999', background: '#f5f5f5', padding: '2px 8px', borderRadius: '4px' }}>
                  {getRoleText(user?.role || '')}
                </span>
              </div>
            </Dropdown>
          </div>
        </div>
      </Header>

      <AntLayout>
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          style={{ background: '#001529' }}
        >
          <Button
            type="text"
            icon={collapsed ? <UserSwitchOutlined /> : <UserSwitchOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              color: '#fff',
              fontSize: '16px',
              width: '100%',
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          />
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[currentPage]}
            onClick={({ key }) => onPageChange(key)}
            style={{ marginTop: 0 }}
          >
            {menuItems.map((item) => (
              <Menu.Item key={item.key} icon={item.icon}>
                {item.label}
              </Menu.Item>
            ))}
          </Menu>
        </Sider>

        <Content style={{ padding: '24px', background: '#f5f5f5' }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  )
}