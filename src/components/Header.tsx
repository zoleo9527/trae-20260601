import { BellOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons'
import { Badge, Dropdown, Menu, Avatar, Button, Space } from 'antd'
import { UserRole } from '@/types'
import { roleLabels } from '@/data/mockData'

interface HeaderProps {
  user: { name: string; role: UserRole }
  notificationCount: number
  onSwitchRole: (role: UserRole) => void
  onOpenNotifications: () => void
}

export function Header({ user, notificationCount, onSwitchRole, onOpenNotifications }: HeaderProps) {
  const roleMenu = (
    <Menu
      items={[
        { key: 'project_manager', label: '项目经理', onClick: () => onSwitchRole('project_manager') },
        { key: 'reviewer', label: '审核员', onClick: () => onSwitchRole('reviewer') },
        { key: 'finance', label: '财务', onClick: () => onSwitchRole('finance') },
      ]}
    />
  )

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="title">标的入库与资料审核系统</h1>
      </div>
      <div className="header-right">
        <Space>
          <Dropdown overlay={roleMenu} trigger={['click']}>
            <Button type="text">
              当前角色：{roleLabels[user.role]}
            </Button>
          </Dropdown>
          <Badge count={notificationCount} onClick={onOpenNotifications}>
            <Button type="text" icon={<Bell />} />
          </Badge>
          <Dropdown
            overlay={
              <Menu
                items={[
                  { key: 'profile', label: `姓名：${user.name}` },
                  { key: 'role', label: `角色：${roleLabels[user.role]}` },
                  { key: 'logout', label: '退出', icon: <LogoutOutlined /> },
                ]}
              />
            }
          >
            <div className="user-info">
              <Avatar icon={<UserOutlined />} />
              <span>{user.name}</span>
            </div>
          </Dropdown>
        </Space>
      </div>
    </header>
  )
}