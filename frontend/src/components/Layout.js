import React from 'react';
import { Layout as AntLayout, Menu, Select, Avatar, Dropdown, Badge } from 'antd';
import {
  DashboardOutlined,
  BookOutlined,
  TrophyOutlined,
  BarChartOutlined,
  WarningOutlined,
  UserOutlined,
  SwapOutlined
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { Header, Sider, Content } = AntLayout;

const roleOptions = [
  { value: 'training_manager', label: '培训经理' },
  { value: 'department_head', label: '部门负责人' },
  { value: 'instructor', label: '讲师' }
];

function Layout({ children }) {
  const { user, currentRole, switchRole, permissions } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: '工作台' },
    { key: '/training', icon: <BookOutlined />, label: '培训管理' },
    { key: '/certificates', icon: <TrophyOutlined />, label: '证书管理' },
    { key: '/evaluations', icon: <BarChartOutlined />, label: '效果评估' },
    { key: '/exceptions', icon: <WarningOutlined />, label: '异常处理' }
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (item.key === '/certificates') {
      return permissions.certificates && permissions.certificates.length > 0;
    }
    if (item.key === '/exceptions') {
      return permissions.exceptions && permissions.exceptions.length > 0;
    }
    return true;
  });

  const handleRoleChange = async (newRole) => {
    try {
      await switchRole(newRole);
    } catch (error) {
      console.error('切换角色失败:', error);
    }
  };

  const userMenuItems = [
    { key: 'profile', label: '个人中心' },
    { key: 'settings', label: '设置' },
    { type: 'divider' },
    { key: 'logout', label: '退出登录' }
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#001529',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>
            企业内训部
          </div>
          <Select
            value={currentRole}
            onChange={handleRoleChange}
            options={roleOptions}
            style={{ width: 140, marginLeft: 24 }}
            size="middle"
            suffixIcon={<SwapOutlined />}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Badge count={3} size="small">
            <span style={{ color: '#fff', fontSize: 18, cursor: 'pointer' }}>🔔</span>
          </Badge>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Avatar style={{ cursor: 'pointer' }} icon={<UserOutlined />} />
          </Dropdown>
          <span style={{ color: '#fff' }}>
            {user?.name || '用户'}
          </span>
        </div>
      </Header>

      <AntLayout>
        <Sider
          width={200}
          style={{
            background: '#fff',
            boxShadow: '2px 0 8px rgba(0,0,0,0.05)'
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={filteredMenuItems}
            onClick={({ key }) => navigate(key)}
            style={{ height: '100%', borderRight: 0 }}
          />
        </Sider>

        <Content style={{
          padding: 24,
          background: '#f0f2f5',
          minHeight: 'calc(100vh - 64px)'
        }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
}

export default Layout;
