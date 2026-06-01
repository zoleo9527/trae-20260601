import {
    BellOutlined,
    CalendarOutlined,
    FileTextOutlined,
    HomeOutlined,
    LogoutOutlined,
    TeamOutlined,
    ToolOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { Avatar, Dropdown, Layout, Menu, Typography } from 'antd';
import { useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Alerts from './pages/Alerts';
import Consumables from './pages/Consumables';
import DailySchedule from './pages/DailySchedule';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Logs from './pages/Logs';
import PatientDetail from './pages/PatientDetail';
import PatientList from './pages/PatientList';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const NODE_ENV = import.meta.env.NODE_ENV;

const ROLE_LABELS = { frontdesk: '前台', doctor: '医生', warehouse: '库管' };

const ALL_MENU_ITEMS = [
  { key: '/', icon: <HomeOutlined />, label: '首页' },
  { key: '/patients', icon: <TeamOutlined />, label: '患者管理' },
  { key: '/schedule', icon: <CalendarOutlined />, label: '每日手术' },
  { key: '/consumables', icon: <ToolOutlined />, label: '耗材管理' },
  { key: '/alerts', icon: <BellOutlined />, label: '提醒中心' },
  { key: '/logs', icon: <FileTextOutlined />, label: '操作日志' },
];

const ROLE_MENU_MAP = {
  frontdesk: ['/', '/patients', '/schedule', '/consumables', '/alerts', '/logs'],
  doctor: ['/', '/patients', '/schedule', '/consumables', '/alerts', '/logs'],
  warehouse: ['/', '/consumables', '/logs'],
};

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const role = user?.role || '';
  const isLoggedIn = !!token;

  const allowedKeys = ROLE_MENU_MAP[role] || [];
  const menuItems = ALL_MENU_ITEMS.filter((item) => allowedKeys.includes(item.key));

  if (!isLoggedIn && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }
  if (isLoggedIn && location.pathname === '/login') {
    return <Navigate to="/" replace />;
  }
  if (!isLoggedIn) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }

  const consumablesLabel = role === 'warehouse' ? '耗材管理' : '耗材查看';

  const dropdownItems = {
    items: [
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: () => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        },
      },
    ],
  };

  const selectedKey = menuItems.find((item) => {
    if (item.key === '/') return location.pathname === '/';
    return location.pathname.startsWith(item.key);
  })?.key || '/';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={200}
      >
        <div className="logo">
          {collapsed ? '种植' : '种植牙排期追溯系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems.map((item) =>
            item.key === '/consumables'
              ? { ...item, label: consumablesLabel }
              : item
          )}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header className="app-header">
          <div />
          <Dropdown menu={dropdownItems} placement="bottomRight">
            <div className="user-info">
              <Avatar icon={<UserOutlined />} size="small" />
              <Text style={{ color: '#fff', marginLeft: 8 }}>
                {user?.name || '用户'}（{ROLE_LABELS[role] || role}）
              </Text>
            </div>
          </Dropdown>
        </Header>
        <Content className="app-content">
          <Routes>
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/patients" element={<ProtectedRoute><PatientList /></ProtectedRoute>} />
            <Route path="/patient/:id" element={<ProtectedRoute><PatientDetail /></ProtectedRoute>} />
            <Route path="/schedule" element={<ProtectedRoute><DailySchedule /></ProtectedRoute>} />
            <Route path="/consumables" element={<ProtectedRoute><Consumables /></ProtectedRoute>} />
            <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
            <Route path="/logs" element={<ProtectedRoute><Logs /></ProtectedRoute>} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}
