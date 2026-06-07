import { Layout, Menu, Avatar, Dropdown, Space } from 'antd';
import {
  InboxOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '@/store';

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = useStore((state) => state.currentUser);

  const menuItems = [
    {
      key: '/storage',
      icon: <InboxOutlined />,
      label: '冷库入库管理',
    },
    {
      key: '/temperature',
      icon: <DashboardOutlined />,
      label: '温度记录回看',
    },
    {
      key: '/backup',
      icon: <DatabaseOutlined />,
      label: '备份与恢复',
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#001529',
          padding: '0 24px',
        }}
      >
        <div className="flex items-center">
          <div
            style={{
              color: 'white',
              fontSize: '20px',
              fontWeight: 'bold',
              marginRight: '48px',
            }}
          >
            ❄️ 冷库管理系统
          </div>
        </div>
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Space style={{ color: 'white', cursor: 'pointer' }}>
            <Avatar icon={<UserOutlined />} />
            <span>{currentUser}</span>
          </Space>
        </Dropdown>
      </Header>
      <Layout>
        <Sider width={220} style={{ background: '#fff', borderRight: '1px solid #e8e8e8' }}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            style={{ height: '100%', borderRight: 0 }}
            onClick={({ key }) => navigate(key)}
          />
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content
            style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '8px',
              minHeight: 'calc(100vh - 112px)',
            }}
          >
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
