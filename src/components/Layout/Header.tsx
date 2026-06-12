import { Layout, Dropdown, Avatar, Button } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import type { User, UserRole } from '@/types';
import { getRoleName } from '@/utils/auth';

interface HeaderProps {
  currentUser: User;
  onRoleChange: (role: UserRole) => void;
}

export default function Header({ currentUser, onRoleChange }: HeaderProps) {
  const roleMenuItems = [
    { key: 'project_manager', label: '项目经理' },
    { key: 'reviewer', label: '审核员' },
    { key: 'finance', label: '财务' },
    { key: 'admin', label: '管理员' },
  ];

  return (
    <Layout.Header style={{ padding: 0, background: '#fff', boxShadow: '0 1px 4px rgba(0,21,41,.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%', padding: '0 24px' }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#1890ff' }}>
          资产拍卖公司 - 成交确认与尾款催收系统
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Dropdown 
            menu={{ 
              items: roleMenuItems,
              onClick: ({ key }) => onRoleChange(key as UserRole)
            }}
          >
            <Button size="small">
              切换角色: {getRoleName(currentUser.role)}
            </Button>
          </Dropdown>
          <Dropdown 
            menu={{ 
              items: [
                { key: 'settings', icon: <SettingOutlined />, label: '设置' },
                { key: 'logout', icon: <LogoutOutlined />, label: '退出登录' },
              ]
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '8px' }}>
              <Avatar icon={<UserOutlined />} />
              <span>{currentUser.name}</span>
            </div>
          </Dropdown>
        </div>
      </div>
    </Layout.Header>
  );
}