import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Badge, Button, List, Typography, Space, Popover } from 'antd';
import {
  DashboardOutlined, SearchOutlined, AppstoreOutlined as EggOutlined, WarningOutlined,
  UserOutlined, LogoutOutlined, BellOutlined, SwapOutlined, HistoryOutlined,
} from '@ant-design/icons';
import { useAuth, ROLE_LABELS, ROLE_COLORS } from '../contexts/AuthContext';
import { api } from '../api';
import PressureBar from './PressureBar';

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '压力看板' },
  { key: '/inspections', icon: <SearchOutlined />, label: '巡检卡' },
  { key: '/egg-records', icon: <EggOutlined />, label: '产蛋记录' },
  { key: '/egg-records/history', icon: <HistoryOutlined />, label: '产蛋回看' },
  { key: '/exceptions', icon: <WarningOutlined />, label: '异常处理' },
];

export default function MainLayout() {
  const { user, logout, switchUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [demoAccounts, setDemoAccounts] = useState([]);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (user) {
      api.auth.getDemoAccounts().then(d => setDemoAccounts(d.accounts)).catch(() => {});
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await api.notifications.list(user.id);
      setNotifications(data.notifications || []);
      const countData = await api.notifications.unreadCount(user.id);
      setUnreadCount(countData.count);
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleReadNotif = async (id) => {
    await api.notifications.read(id);
    fetchNotifications();
  };

  const handleReadAll = async () => {
    await api.notifications.readAll(user.id);
    fetchNotifications();
  };

  const handleSwitchUser = async (account) => {
    try {
      await switchUser(account.username, '123456');
      setNotifOpen(false);
      navigate('/');
    } catch {}
  };

  const userMenuItems = [
    ...demoAccounts.filter(a => a.id !== user?.id).map(a => ({
      key: `switch_${a.id}`,
      icon: <SwapOutlined />,
      label: `${a.name}（${ROLE_LABELS[a.role]}）`,
      onClick: () => handleSwitchUser(a),
    })),
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
      onClick: () => { logout(); navigate('/login'); },
    },
  ];

  const notifContent = (
    <div style={{ width: 360, maxHeight: 400, overflow: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text strong>消息通知</Text>
        {unreadCount > 0 && <Button type="link" size="small" onClick={handleReadAll}>全部已读</Button>}
      </div>
      <List
        size="small"
        dataSource={notifications}
        renderItem={item => (
          <List.Item
            style={{ background: item.read ? 'transparent' : 'rgba(244,162,97,0.1)', cursor: 'pointer', padding: '8px 12px' }}
            onClick={() => { handleReadNotif(item.id); if (item.link) navigate(item.link); setNotifOpen(false); }}
          >
            <List.Item.Meta
              title={<Text style={{ fontWeight: item.read ? 400 : 600, color: '#e0e0e0' }}>{item.title}</Text>}
              description={<Text type="secondary" style={{ fontSize: 12 }}>{item.content}</Text>}
            />
          </List.Item>
        )}
        locale={{ emptyText: '暂无消息' }}
      />
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh', background: '#0f0f1e' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={200}
        style={{ background: '#1a1a2e' }}
        theme="dark"
      >
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(255,107,53,0.15)' }}>
          <EggOutlined style={{ fontSize: 24, color: '#ff6b35', marginRight: collapsed ? 0 : 8 }} />
          {!collapsed && <Text style={{ color: '#e0e0e0', fontSize: 16, fontWeight: 700, whiteSpace: 'nowrap' }}>蛋鸡巡检</Text>}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ background: 'transparent', borderRight: 'none', marginTop: 8 }}
          theme="dark"
        />
      </Sider>
      <Layout style={{ background: '#0f0f1e' }}>
        <PressureBar />
        <Header className="site-header" style={{ height: 48, lineHeight: '48px', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Text style={{ fontSize: 15, fontWeight: 600, color: '#e0e0e0' }}>
              鸡舍巡检与产蛋记录
            </Text>
            {user && (
              <span className={`pressure-badge ${user.role === 'manager' ? 'urgent' : user.role === 'feeder' ? 'info' : 'normal'}`}>
                {ROLE_LABELS[user.role]}在线
              </span>
            )}
          </div>
          <Space size={16}>
            <Popover
              content={notifContent}
              trigger="click"
              open={notifOpen}
              onOpenChange={setNotifOpen}
              placement="bottomRight"
            >
              <Badge count={unreadCount} size="small">
                <Button type="text" icon={<BellOutlined style={{ fontSize: 18, color: '#e0e0e0' }} />} />
              </Badge>
            </Popover>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar size={30} style={{ background: ROLE_COLORS[user?.role] || '#666' }}>
                  {user?.name?.[0]}
                </Avatar>
                <div style={{ lineHeight: 1.3 }}>
                  <Text strong style={{ fontSize: 13, color: '#e0e0e0' }}>{user?.name}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 11 }}>{ROLE_LABELS[user?.role]}</Text>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: 12, padding: 16, background: '#0f0f1e', borderRadius: 8, overflow: 'auto', minHeight: 'calc(100vh - 40px - 48px - 24px - 32px)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
