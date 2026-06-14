import { BellOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons'
import { Badge, Dropdown, Avatar, Button, Space, Typography } from 'antd'
import type { MenuProps } from 'antd'
import type { User as UserType, Role } from '@/types'
import { mockUsers } from '@/data/mockData'
import { roleMap } from '@/utils/statusMap'

interface HeaderProps {
  currentUser: UserType
  notifications: { id: string; message: string; time: string }[]
  onSwitchUser: (user: UserType) => void
  onDismissNotification: (id: string) => void
}

export function Header({ currentUser, notifications, onSwitchUser, onDismissNotification }: HeaderProps) {
  const userMenuItems: MenuProps['items'] = mockUsers.map(user => ({
    key: user.id,
    label: (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Avatar>{user.name.charAt(0)}</Avatar>
        <span>{user.name} - {roleMap[user.role as Role].label}</span>
      </div>
    ),
    onClick: () => onSwitchUser(user),
  }))

  const notificationMenuItems: MenuProps['items'] = notifications.map(notif => ({
    key: notif.id,
    label: (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: 280 }}>
        <span>{notif.message}</span>
        <span style={{ color: '#999', fontSize: 12 }}>{notif.time}</span>
      </div>
    ),
    onClick: () => onDismissNotification(notif.id),
  }))

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px', height: 64, background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 32, height: 32, background: '#1890ff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>贷</span>
        </div>
        <Typography.Title level={3} style={{ margin: 0 }}>
          小贷公司风控审批与额度建议系统
        </Typography.Title>
      </div>
      
      <Space size="large">
        <Dropdown menu={{ items: notificationMenuItems }} placement="bottomRight">
          <Button type="text" icon={<Badge count={notifications.length}><BellOutlined /></Badge>} />
        </Dropdown>
        
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: 'pointer' }}>
            <Avatar>{currentUser.name.charAt(0)}</Avatar>
            <span>{currentUser.name}</span>
            <span style={{ color: '#1890ff', fontSize: 12 }}>{roleMap[currentUser.role as Role].label}</span>
          </div>
        </Dropdown>
        
        <Button type="text" icon={<LogoutOutlined />}>退出</Button>
      </Space>
    </div>
  )
}
