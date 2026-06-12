import { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge } from 'antd';
import {
  DashboardOutlined,
  HomeOutlined,
  EyeOutlined,
  FileTextOutlined,
  FileSearchOutlined,
  SwapOutlined,
  DollarOutlined,
  HistoryOutlined,
  UserOutlined,
  LogoutOutlined,
  KeyOutlined,
  BuildingOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { roleNames } from '../types';

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '工作台',
    },
    {
      key: '/properties',
      icon: <BuildingOutlined />,
      label: '房源台账',
    },
    {
      key: '/viewings',
      icon: <EyeOutlined />,
      label: '看房记录',
    },
    {
      key: '/quotations',
      icon: <FileTextOutlined />,
      label: '租赁报价',
    },
    {
      key: '/contracts',
      icon: <FileSearchOutlined />,
      label: '合同管理',
    },
    {
      key: '/handover',
      icon: <SwapOutlined />,
      label: '物业交接',
    },
    {
      key: '/deposits',
      icon: <DollarOutlined />,
      label: '押金结算',
    },
    {
      key: '/logs',
      icon: <HistoryOutlined />,
      label: '操作日志',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'info',
      icon: <UserOutlined />,
      label: (
        <div>
          <div style={{ fontWeight: 500 }}>{user?.name}</div>
          <div style={{ fontSize: 12, color: '#666' }}>
            {user ? roleNames[user.role] : ''}
          </div>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout className="app-layout">
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={220}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            color: '#fff',
            fontSize: collapsed ? 12 : 16,
            fontWeight: 600,
            borderBottom: '1px solid #1f1f1f',
          }}
        >
          <HomeOutlined style={{ fontSize: 20 }} />
          {!collapsed && <span>租赁管理系统</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header className="app-header">
          <div className="app-logo">
            <BuildingOutlined />
            <span>写字楼租赁-租赁报价与合同流转</span>
          </div>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div className="app-user">
              <Avatar icon={<UserOutlined />} />
              <span>{user?.name}</span>
            </div>
          </Dropdown>
        </Header>
        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;