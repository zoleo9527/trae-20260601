import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space } from 'antd';
import {
  AppstoreOutlined,
  CheckSquareOutlined,
  ScheduleOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/auth';
import { RoleTextMap } from '../../types';
import PendingReview from './PendingReview';
import DockAssignment from './DockAssignment';
import AppointmentList from './AppointmentList';

const { Header, Sider, Content } = Layout;

const DispatcherLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      key: '/dispatcher/pending',
      icon: <CheckSquareOutlined />,
      label: '预约审核',
    },
    {
      key: '/dispatcher/dock-assign',
      icon: <AppstoreOutlined />,
      label: '月台分配',
    },
    {
      key: '/dispatcher/appointments',
      icon: <ScheduleOutlined />,
      label: '预约列表',
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
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: collapsed ? 12 : 16,
          fontWeight: 600,
        }}>
          {collapsed ? '月台' : '月台管理系统'}
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
          <h3 style={{ margin: 0 }}>调度员工作台</h3>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <span>
                {user?.name}（{RoleTextMap[user?.role || 'dispatcher']}）
              </span>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: '24px' }}>
          <Routes>
            <Route path="/" element={<PendingReview />} />
            <Route path="pending" element={<PendingReview />} />
            <Route path="dock-assign" element={<DockAssignment />} />
            <Route path="appointments" element={<AppointmentList />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default DispatcherLayout;
