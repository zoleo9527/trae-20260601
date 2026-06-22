import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, theme } from 'antd';
import {
  DashboardOutlined,
  CalendarOutlined,
  AlertOutlined,
  FileTextOutlined,
  ScheduleOutlined,
  AuditOutlined,
  CustomerServiceOutlined,
  UserOutlined,
  TeamOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import Plans from './pages/Plans.jsx';
import PlanDetail from './pages/PlanDetail.jsx';
import Hazards from './pages/Hazards.jsx';
import Notices from './pages/Notices.jsx';
import Appointments from './pages/Appointments.jsx';
import Revisits from './pages/Revisits.jsx';
import Visits from './pages/Visits.jsx';
import Customers from './pages/Customers.jsx';
import CustomerDetail from './pages/CustomerDetail.jsx';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '数据总览' },
  { key: '/plans', icon: <CalendarOutlined />, label: '入户计划' },
  { key: '/hazards', icon: <AlertOutlined />, label: '隐患记录' },
  { key: '/notices', icon: <FileTextOutlined />, label: '整改通知' },
  { key: '/appointments', icon: <ScheduleOutlined />, label: '复查预约' },
  { key: '/revisits', icon: <AuditOutlined />, label: '复查记录' },
  { key: '/visits', icon: <CustomerServiceOutlined />, label: '客户回访' },
  { key: '/customers', icon: <TeamOutlined />, label: '客户档案' }
];

const validRoutes = ['/', '/plans', '/hazards', '/notices', '/appointments', '/revisits', '/visits', '/customers'];

const App = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const {
    token: { colorBgContainer, borderRadiusLG }
  } = theme.useToken();

  useEffect(() => {
    const hash = window.location.hash;
    const pathname = window.location.pathname;
    if (!hash && pathname !== '/' && validRoutes.some(r => pathname === r || pathname.startsWith(r + '/'))) {
      window.location.replace(`/#${pathname}${window.location.search}`);
    }
  }, []);

  const pathSegments = (location.pathname || '/').split('/').filter(Boolean);
  const selectedKey = pathSegments.length > 0 ? '/' + pathSegments[0] : '/';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        width={220}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 600,
          fontSize: collapsed ? 16 : 16,
          letterSpacing: 1,
          background: 'linear-gradient(90deg, #0958d9, #1677ff)',
          overflow: 'hidden'
        }}>
          <span style={{
            display: 'inline-block',
            width: 32, height: 32,
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 6,
            textAlign: 'center',
            lineHeight: '32px',
            marginRight: collapsed ? 0 : 10
          }}>🔥</span>
          {!collapsed && <span>燃气安检站</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems.map(m => ({
            key: m.key,
            icon: m.icon,
            label: <Link to={m.key}>{m.label}</Link>
          }))}
          style={{
            borderInlineEnd: 0,
            marginTop: 10
          }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 20px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #e8e8e8',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
          }}
        >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {collapsed ? (
                <MenuUnfoldOutlined
                  style={{ fontSize: 18, cursor: 'pointer', color: '#555' }}
                  onClick={() => setCollapsed(!collapsed)}
                />
              ) : (
                <MenuFoldOutlined
                  style={{ fontSize: 18, cursor: 'pointer', color: '#555' }}
                  onClick={() => setCollapsed(!collapsed)}
                />
              )}
              <span style={{ marginLeft: 20, fontSize: 16, color: '#333', fontWeight: 500 }}>
                入户排查与整改跟踪系统
              </span>
            </div>
            <Dropdown
              menu={{
                items: [
                  { key: '1', label: '个人中心', icon: <UserOutlined /> },
                  { type: 'divider' },
                  { key: '2', label: '退出登录', icon: <LogoutOutlined /> }
                ]
              }}
            >
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <Avatar style={{ backgroundColor: '#1677ff' }} icon={<UserOutlined />} />
                <span style={{ marginLeft: 10, color: '#555' }}>管理员</span>
              </div>
            </Dropdown>
        </Header>
        <Content className="layout-main">
          <div
            style={{
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
              minHeight: '100%'
            }}
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/plans" element={<Plans />} />
              <Route path="/plans/:id" element={<PlanDetail />} />
              <Route path="/hazards" element={<Hazards />} />
              <Route path="/notices" element={<Notices />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/revisits" element={<Revisits />} />
              <Route path="/visits" element={<Visits />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/customers/:id" element={<CustomerDetail />} />
            </Routes>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
