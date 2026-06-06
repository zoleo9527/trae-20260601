import React from 'react';
import { Layout, Menu, Avatar, Dropdown, Space } from 'antd';
import {
  PlusOutlined,
  UnorderedListOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/auth';
import { RoleTextMap } from '../../types';
import CreateAppointment from './CreateAppointment';
import ClerkAppointments from './ClerkAppointments';

const { Header, Sider, Content } = Layout;

const ClerkLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      key: '/clerk/create',
      icon: <PlusOutlined />,
      label: '新建预约',
    },
    {
      key: '/clerk/appointments',
      icon: <UnorderedListOutlined />,
      label: '预约管理',
    },
  ];

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider>
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 16,
          fontWeight: 600,
        }}>
          仓库文员工作台
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>仓库文员工作台</h3>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <span>
                {user?.name}（{RoleTextMap[user?.role || 'clerk']}）
              </span>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: '24px' }}>
          <Routes>
            <Route path="/" element={<ClerkAppointments />} />
            <Route path="create" element={<CreateAppointment />} />
            <Route path="appointments" element={<ClerkAppointments />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default ClerkLayout;
