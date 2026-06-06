import { Layout, Menu, Avatar, Dropdown, Typography } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  CalendarOutlined,
  ShoppingOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useStore } from '@/store';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useStore((state) => state.currentUser);

  const menuItems = [
    {
      key: '/schedules',
      icon: <CalendarOutlined />,
      label: '直播排期',
      onClick: () => navigate('/schedules'),
    },
    {
      key: '/products',
      icon: <ShoppingOutlined />,
      label: '商品池',
      onClick: () => navigate('/products'),
    },
  ];

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
    },
  ];

  const getSelectedKey = () => {
    if (location.pathname.startsWith('/schedules')) return '/schedules';
    if (location.pathname.startsWith('/products')) return '/products';
    return '/schedules';
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)',
        }}
      >
        <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
          📺 直播电商管理系统
        </Title>
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar icon={<UserOutlined />} />
            <span>{currentUser.name}</span>
          </div>
        </Dropdown>
      </Header>
      <Layout>
        <Sider width={200} style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}>
          <Menu
            mode="inline"
            selectedKeys={[getSelectedKey()]}
            style={{ height: '100%', borderRight: 0, marginTop: 16 }}
            items={menuItems}
          />
        </Sider>
        <Content style={{ margin: '24px', background: '#fff', borderRadius: 8, padding: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
