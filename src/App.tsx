import { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Badge, Button, Space, Alert, Typography } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  EditOutlined,
  ToolOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  BellOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useAuth } from './store/auth';
import { ROLE_LABELS } from './types';
import type { UserRole, User } from './types';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import OrderList from './pages/OrderList';
import OrderDetail from './pages/OrderDetail';
import OrderCreate from './pages/OrderCreate';
import CustomerConfirm from './pages/CustomerConfirm';
import { orderApi } from './services/api';
import type { Statistics } from './types';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

interface AppContextType {
  currentUser: User | null;
  switchRole: (role: UserRole) => void;
  refreshStats: () => void;
  stats: Statistics | null;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};

function App() {
  const { currentUser, login, logout, switchRole } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [stats, setStats] = useState<Statistics | null>(null);

  const refreshStats = async () => {
    try {
      const data = await orderApi.getStatistics();
      setStats(data);
    } catch (e) {
      console.error('Failed to load stats', e);
    }
  };

  useEffect(() => {
    if (currentUser) {
      refreshStats();
      const interval = setInterval(refreshStats, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  if (!currentUser) {
    return <LoginPage onLogin={login} />;
  }

  return (
    <AppContext.Provider value={{ currentUser, switchRole, refreshStats, stats }}>
      <Layout style={{ minHeight: '100vh' }}>
        <AppHeader currentUser={currentUser} logout={logout} switchRole={switchRole} stats={stats} refreshStats={refreshStats} />
        <Layout>
          <AppSider currentUser={currentUser} collapsed={collapsed} setCollapsed={setCollapsed} />
          <Layout style={{ padding: '16px' }}>
            <Content
              style={{
                padding: 16,
                margin: 0,
                minHeight: 280,
                background: '#fff',
                borderRadius: 8,
              }}
            >
              <AppRoutes />
            </Content>
          </Layout>
        </Layout>
      </Layout>
    </AppContext.Provider>
  );
}

function AppHeader({ currentUser, logout, switchRole, stats, refreshStats }: {
  currentUser: User;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  stats: Statistics | null;
  refreshStats: () => void;
}) {
  const dangerAlerts = stats?.alerts?.filter(a => a.type === 'danger').length || 0;
  const warningAlerts = stats?.alerts?.filter(a => a.type === 'warning').length || 0;

  const roleMenuItems = [
    { key: 'receptionist', label: '切换到接单员', icon: '👩' },
    { key: 'designer', label: '切换到设计师', icon: '👨‍🎨' },
    { key: 'installer', label: '切换到安装队长', icon: '👷' },
    { key: 'production', label: '切换到喷绘员', icon: '👨‍🔧' },
    { key: 'quality', label: '切换到质检员', icon: '🔍' },
    { key: 'admin', label: '切换到管理员', icon: '👨‍💼' },
    { type: 'divider' as const },
    { key: 'logout', label: '退出登录', icon: <LogoutOutlined /> },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout();
    } else {
      switchRole(key as UserRole);
    }
  };

  const handleResetData = async () => {
    if (window.confirm('确定要重置所有数据吗？这将恢复到初始样例数据。')) {
      await orderApi.resetData();
      refreshStats();
    }
  };

  return (
    <Header style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      background: '#001529',
      padding: '0 16px',
      height: 64
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Title level={4} style={{ color: '#fff', margin: 0 }}>
          🏭 广告喷绘店管理系统
        </Title>
        <Space>
          <Badge count={dangerAlerts} color="red" offset={[0, 2]}>
            <Badge count={warningAlerts} color="gold" offset={[15, 0]}>
              <Button 
                icon={<BellOutlined />} 
                type="primary" 
                ghost
                onClick={refreshStats}
              >
                刷新状态
              </Button>
            </Badge>
          </Badge>
          <Button 
            icon={<ReloadOutlined />} 
            danger
            ghost
            onClick={handleResetData}
          >
            重置数据
          </Button>
        </Space>
      </div>
      
      <Space size="large">
        {stats?.alerts && stats.alerts.length > 0 && (
          <Alert
            message={
              <Space>
                <span className="alert-flash" style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                  ⚠️ {stats.alerts[0].message}
                </span>
                {stats.alerts.length > 1 && (
                  <span style={{ color: '#faad14' }}>
                    还有 {stats.alerts.length - 1} 个告警
                  </span>
                )}
              </Space>
            }
            type={stats.alerts[0].type === 'danger' ? 'error' : 'warning'}
            showIcon
            style={{ margin: 0, border: 'none', background: 'transparent', padding: 0 }}
          />
        )}
        
        <Dropdown menu={{ items: roleMenuItems, onClick: handleMenuClick }}>
          <Space style={{ cursor: 'pointer', color: '#fff' }}>
            <Avatar size="small" style={{ fontSize: 18 }}>
              {currentUser.avatar}
            </Avatar>
            <span>{currentUser.name}</span>
            <span style={{ color: '#1890ff' }}>({ROLE_LABELS[currentUser.role]})</span>
          </Space>
        </Dropdown>
      </Space>
    </Header>
  );
}

function AppSider({ currentUser, collapsed, setCollapsed }: {
  currentUser: User;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const getMenuItems = () => {
    const baseItems = [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: '工作台',
      }
    ];

    const roleItems: Record<UserRole, any[]> = {
      receptionist: [
        { key: '/orders?role=receptionist', icon: <FileTextOutlined />, label: '订单管理' },
        { key: '/orders/create', icon: <EditOutlined />, label: '录入订单' },
      ],
      designer: [
        { key: '/orders?role=designer', icon: <EditOutlined />, label: '设计改稿' },
        { key: '/orders?view=revisions', icon: <ToolOutlined />, label: '待改稿' },
      ],
      installer: [
        { key: '/orders?role=installer', icon: <ToolOutlined />, label: '安装任务' },
      ],
      production: [
        { key: '/orders?role=production', icon: <FileTextOutlined />, label: '喷绘任务' },
      ],
      quality: [
        { key: '/orders?role=quality', icon: <FileTextOutlined />, label: '质检任务' },
      ],
      customer: [
        { key: '/orders?role=customer', icon: <FileTextOutlined />, label: '我的订单' },
      ],
      admin: [
        { key: '/orders', icon: <FileTextOutlined />, label: '全部订单' },
        { key: '/orders/create', icon: <EditOutlined />, label: '新增订单' },
        { key: '/settings', icon: <SettingOutlined />, label: '系统设置' },
      ]
    };

    return [...baseItems, ...(roleItems[currentUser.role] || roleItems.admin)];
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}
      width={200}
    >
      <Menu
        mode="inline"
        selectedKeys={[location.pathname + location.search]}
        items={getMenuItems()}
        onClick={({ key }) => navigate(key)}
        style={{ height: '100%', borderRight: 0 }}
      />
    </Sider>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/orders" element={<OrderList />} />
      <Route path="/orders/create" element={<OrderCreate />} />
      <Route path="/orders/:id" element={<OrderDetail />} />
      <Route path="/confirm/:id" element={<CustomerConfirm />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
