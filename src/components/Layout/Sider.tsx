import { Layout, Menu } from 'antd';
import type { MenuProps } from 'antd';
import { FileTextOutlined, BellOutlined, HistoryOutlined, UserSwitchOutlined } from '@ant-design/icons';
import type { UserRole } from '@/types';
import { hasPermission } from '@/utils/auth';

interface SiderProps {
  currentUserRole: UserRole;
  currentPath: string;
  onMenuClick: (key: string) => void;
}

export default function Sider({ currentUserRole, currentPath, onMenuClick }: SiderProps) {
  const items: MenuProps['items'] = [];

  if (hasPermission(currentUserRole, 'confirmation_view')) {
    items.push({
      key: '/confirmation',
      icon: <FileTextOutlined />,
      label: '成交确认',
    });
  }

  if (hasPermission(currentUserRole, 'collection_view')) {
    items.push({
      key: '/collection',
      icon: <BellOutlined />,
      label: '尾款催收',
    });
  }

  if (hasPermission(currentUserRole, 'history_view')) {
    items.push({
      key: '/history',
      icon: <HistoryOutlined />,
      label: '历史记录',
    });
  }

  return (
    <Layout.Sider width={200} theme="light" className="site-layout-background">
      <div className="logo" style={{ padding: 16, fontSize: 18, fontWeight: 'bold', color: '#1890ff', textAlign: 'center' }}>
        拍卖管理系统
      </div>
      <Menu
        mode="inline"
        selectedKeys={[currentPath]}
        items={items}
        onClick={({ key }) => onMenuClick(key)}
      />
      <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, padding: 16, borderTop: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserSwitchOutlined />
          <span style={{ fontSize: 12 }}>{currentUserRole === 'project_manager' ? '项目经理' : 
            currentUserRole === 'reviewer' ? '审核员' : 
            currentUserRole === 'finance' ? '财务' : '管理员'}</span>
        </div>
      </div>
    </Layout.Sider>
  );
}