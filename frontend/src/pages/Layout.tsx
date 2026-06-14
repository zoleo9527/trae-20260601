import { Layout as AntdLayout, Menu, Avatar, Dropdown, Typography, Badge } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { DashboardOutlined, CarOutlined, UnorderedListOutlined, LogoutOutlined, UserOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { AuthTokenPayload, ROLE_LABEL } from '../types';

const { Header, Sider, Content } = AntdLayout;

export default function Layout({ user, onLogout }: { user: AuthTokenPayload; onLogout: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();

  const roleClass = `role-${user.role}`;

  const baseItems = [
    { key: '/', icon: <DashboardOutlined />, label: '工作台' }
  ];
  const carItems = [
    { key: '/cars', icon: <CarOutlined />, label: '车源与审批' }
  ];
  const logItems = [
    { key: '/logs', icon: <UnorderedListOutlined />, label: '操作日志' }
  ];

  const items = [...baseItems, ...carItems, ...logItems];

  const selectedKey = location.pathname.startsWith('/cars') ? '/cars' : location.pathname;

  return (
    <AntdLayout style={{ minHeight: '100vh' }}>
      <Sider width={220} theme="dark" style={{ position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #1f1f1f', display: 'flex', alignItems: 'center', gap: 8 }}>
          <SafetyCertificateOutlined style={{ fontSize: 24, color: '#1677ff' }} />
          <div>
            <Typography.Text strong style={{ color: '#fff', fontSize: 15 }}>二手车商审批</Typography.Text>
            <div style={{ fontSize: 11, color: '#888' }}>车源收购 · 估价流转</div>
          </div>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={items}
          onClick={({ key }) => navigate(key)}
          style={{ border: 0, paddingTop: 8 }}
        />
        <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, fontSize: 11, color: '#666', textAlign: 'center' }}>
          v1.0 · 数据内存存储
        </div>
      </Sider>
      <AntdLayout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 10 }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {location.pathname === '/' && '工作台'}
            {location.pathname === '/cars' && '车源收购与估价审批'}
            {location.pathname.startsWith('/cars/') && '车源详情与审批'}
            {location.pathname === '/logs' && '操作日志'}
          </Typography.Title>
          <Dropdown menu={{
            items: [
              { key: 'info', label: <div>{user.name}<span className={`role-badge ${roleClass}`}>{ROLE_LABEL[user.role]}</span></div>, disabled: true },
              { type: 'divider' },
              { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: onLogout }
            ]
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Badge dot color={user.role === 'admin' ? '#faad14' : user.role === 'manager' ? '#1677ff' : user.role === 'appraiser' ? '#52c41a' : '#eb2f96'}>
                <Avatar style={{ backgroundColor: '#1677ff' }} icon={<UserOutlined />} />
              </Badge>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{user.name}</div>
                <div style={{ fontSize: 11, color: '#999' }}>{ROLE_LABEL[user.role]}</div>
              </div>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ padding: 24, minHeight: 'calc(100vh - 64px)' }}>
          <Outlet />
        </Content>
      </AntdLayout>
    </AntdLayout>
  );
}
