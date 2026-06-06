import React from 'react';
import { Layout, Menu, Avatar, Dropdown, Space } from 'antd';
import {
  UnorderedListOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/auth';
import { RoleTextMap } from '../../types';
import TaskList from './TaskList';

const { Header, Sider, Content } = Layout;

const ForkmanLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      key: '/forkman/tasks',
      icon: <UnorderedListOutlined />,
      label: '我的任务',
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
          叉车班长工作台
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
          <h3 style={{ margin: 0 }}>叉车班长工作台</h3>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <span>
                {user?.name}（{RoleTextMap[user?.role || 'forkman']}）
              </span>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: '24px' }}>
          <Routes>
            <Route path="/" element={<TaskList />} />
            <Route path="tasks" element={<TaskList />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default ForkmanLayout;
