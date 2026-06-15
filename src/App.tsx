import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Space, Typography, Badge, Dropdown } from 'antd';
import {
  UserOutlined,
  ToolOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  DashboardOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';
import { useState, useEffect } from 'react';
import CustomerServicePage from './pages/CustomerServicePage';
import EngineerPage from './pages/EngineerPage';
import PartsAdminPage from './pages/PartsAdminPage';
import TicketDetailPage from './pages/TicketDetailPage';
import DemoPage from './pages/DemoPage';
import { TicketService } from './services/TicketService';
import type { Role } from './types';
import { RoleLabel } from './types';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

const CURRENT_USER_KEY = 'after_sales_current_user';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>(() => {
    return (localStorage.getItem(CURRENT_USER_KEY) as Role) || 'customer_service';
  });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    localStorage.setItem(CURRENT_USER_KEY, role);
  }, [role]);

  const dashboard = TicketService.getDashboard();

  const roleMenu = {
    items: [
      {
        key: 'switch',
        label: '切换当前角色（模拟多用户）',
        type: 'group' as const,
      },
      { key: 'customer_service', label: '客服工作台' },
      { key: 'engineer', label: '维修工程师工作台' },
      { key: 'parts_admin', label: '配件管理员工作台' },
    ],
    onClick: ({ key }: { key: string }) => {
      setRole(key as Role);
      navigate('/');
    },
  };

  const selectedKey =
    location.pathname.startsWith('/cs') || location.pathname === '/'
      ? 'cs'
      : location.pathname.startsWith('/engineer')
      ? 'engineer'
      : location.pathname.startsWith('/parts')
      ? 'parts'
      : location.pathname.startsWith('/demo')
      ? 'demo'
      : 'dashboard';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#001529',
          padding: '0 24px',
        }}
      >
        <div style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
          <ThunderboltOutlined style={{ fontSize: 22 }} />
          <Title level={4} style={{ color: '#fff', margin: 0 }}>
            家电售后 · 故障诊断与配件申请
          </Title>
          <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginLeft: 8 }}>
            客服 → 工程师 → 配件管理员 · 接力流转
          </span>
        </div>
        <Space>
          <Dropdown menu={roleMenu} placement="bottomRight">
            <Button type="primary" icon={<UserOutlined />}>
              当前角色：{RoleLabel[role]}
            </Button>
          </Dropdown>
        </Space>
      </Header>

      <Layout>
        <Sider width={220} style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            style={{ borderRight: 0, paddingTop: 12 }}
            items={[
              {
                key: 'cs',
                icon: <DashboardOutlined />,
                label: (
                  <span onClick={() => navigate('/cs')}>
                    <Space>
                      <span>客服工作台</span>
                      <Badge count={dashboard.total} size="small" />
                    </Space>
                  </span>
                ),
              },
              {
                key: 'engineer',
                icon: <ToolOutlined />,
                label: (
                  <span onClick={() => navigate('/engineer')}>
                    <Space>
                      <span>维修工程师工作台</span>
                      <Badge count={dashboard.inDiagnosis} size="small" color="orange" />
                    </Space>
                  </span>
                ),
              },
              {
                key: 'parts',
                icon: <SettingOutlined />,
                label: (
                  <span onClick={() => navigate('/parts')}>
                    <Space>
                      <span>配件管理员工作台</span>
                      <Badge count={dashboard.pendingParts} size="small" color="red" />
                    </Space>
                  </span>
                ),
              },
              { type: 'divider' as const, key: 'd1' },
              {
                key: 'demo',
                icon: <ExperimentOutlined />,
                label: <span onClick={() => navigate('/demo')}>请求示例 / 一键跑通</span>,
              },
            ]}
          />
        </Sider>

        <Content style={{ padding: 24, background: '#f5f7fa' }}>
          <div key={refreshKey}>
            <Routes>
              <Route path="/" element={<Navigate to={`/${role === 'customer_service' ? 'cs' : role === 'engineer' ? 'engineer' : 'parts'}`} replace />} />
              <Route path="/cs" element={<CustomerServicePage role={role} onUpdated={() => setRefreshKey((k) => k + 1)} />} />
              <Route path="/engineer" element={<EngineerPage role={role} onUpdated={() => setRefreshKey((k) => k + 1)} />} />
              <Route path="/parts" element={<PartsAdminPage role={role} onUpdated={() => setRefreshKey((k) => k + 1)} />} />
              <Route path="/ticket/:id" element={<TicketDetailPage onUpdated={() => setRefreshKey((k) => k + 1)} />} />
              <Route path="/demo" element={<DemoPage onUpdated={() => setRefreshKey((k) => k + 1)} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
