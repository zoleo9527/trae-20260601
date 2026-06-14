import { ReactNode, useState, useEffect, useMemo } from 'react';
import { Layout, Menu, Avatar, Button, Dropdown, Badge, Drawer, List, Tag, Empty, Tooltip, App, Space, Divider } from 'antd';
import {
  UserOutlined,
  BellOutlined,
  ReloadOutlined,
  SwitcherOutlined,
  LogoutOutlined,
  DashboardOutlined,
  SwapOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  CarOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import type { Role, TransferOrder, StatusChangeLog } from 'shared';
import { useUserStore, ROLE_USERS } from '../store/user';
import { roleMap, stageMap, urgencyMap, formatDateTime } from '../utils/constants';
import { getOrders, resetAllData, getStatusLogs } from '../api';

const { Header, Sider, Content } = Layout;

interface Props {
  role: Role;
}

export default function AppLayout({ role }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = useUserStore((s) => s.currentUser);
  const setRole = useUserStore((s) => s.setRole);
  const { message, modal } = App.useApp();

  const [myOrders, setMyOrders] = useState<TransferOrder[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [recentLogs, setRecentLogs] = useState<StatusChangeLog[]>([]);

  useEffect(() => { loadData(); }, [role]);

  const loadData = async () => {
    try {
      setDrawerLoading(true);
      const [orders, logs] = await Promise.all([
        getOrders({ role }),
        getStatusLogs({ role }),
      ]);
      setMyOrders(orders.filter(o => o.stage !== 'completed').slice(0, 10));
      setRecentLogs(logs.slice(0, 10));
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleReset = () => {
    modal.confirm({
      title: '确认重置所有数据？',
      content: '此操作将清空所有操作痕迹，恢复到初始默认演示数据，不可撤销。',
      okText: '确认重置',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        try {
          await resetAllData();
          message.success('数据已重置为默认演示状态');
          loadData();
          setTimeout(() => window.location.reload(), 600);
        } catch (e: any) {
          message.error(e.message || '重置失败');
        }
      },
    });
  };

  const switchRole = (target: Role) => {
    setRole(target, ROLE_USERS[target].user);
    navigate(`/${target}`);
    message.success(`已切换到${roleMap[target].label}入口`);
  };

  const menuItemsByRole: Record<Role, { key: string; icon: ReactNode; label: ReactNode }[]> = {
    purchaseManager: [
      { key: `/${role}`, icon: <DashboardOutlined />, label: <Link to={`/${role}`}>工作台</Link> },
      { key: `/${role}/transfer`, icon: <SwapOutlined />, label: <Link to={`/${role}/transfer`}>成交过户与贷款放款</Link> },
    ],
    appraiser: [
      { key: `/${role}`, icon: <DashboardOutlined />, label: <Link to={`/${role}`}>工作台</Link> },
      { key: `/${role}/transfer`, icon: <CarOutlined />, label: <Link to={`/${role}/transfer`}>成交过户与贷款放款</Link> },
    ],
    financeSpecialist: [
      { key: `/${role}`, icon: <DashboardOutlined />, label: <Link to={`/${role}`}>工作台</Link> },
      { key: `/${role}/transfer`, icon: <BankOutlined />, label: <Link to={`/${role}/transfer`}>成交过户与贷款放款</Link> },
    ],
  };

  const roleSwitchItems = (Object.keys(roleMap) as Role[])
    .filter((r) => r !== role)
    .map((r) => ({
      key: r,
      icon: <SwitcherOutlined />,
      label: `切换到${roleMap[r].label}`,
      onClick: () => switchRole(r),
    }));

  const userMenuItems = [
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出并返回入口', onClick: () => navigate('/') },
  ];

  const selectedKey = '/' + location.pathname.split('/').slice(0, 2).join('/');

  const pendingUrgent = useMemo(() => myOrders.filter(o => o.urgencyAction !== 'none'), [myOrders]);

  return (
    <Layout className="app-layout">
      <Sider
        width={220}
        style={{ background: '#001529', position: 'sticky', top: 0, height: '100vh', overflow: 'auto' }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 15,
            fontWeight: 600,
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          🚗 二手车商业务系统
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          style={{ border: 'none', paddingTop: 12 }}
          items={menuItemsByRole[role]}
        />
        <div style={{ padding: 16, marginTop: 24 }}>
          <Button
            block
            danger
            ghost
            icon={<ReloadOutlined />}
            onClick={handleReset}
          >
            重置演示数据
          </Button>
        </div>
      </Sider>

      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f0f0f0',
            boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span className={`role-badge ${role}`}>
              {roleMap[role].icon} {roleMap[role].label}入口
            </span>
            <span style={{ color: '#8c8c8c', fontSize: 13 }}>
              欢迎，<strong style={{ color: '#1f1f1f' }}>{currentUser}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Tooltip title="待办与提醒">
              <Badge count={myOrders.length} size="small">
                <Button
                  type="text"
                  icon={<BellOutlined style={{ fontSize: 18 }} />}
                  onClick={() => { setDrawerOpen(true); loadData(); }}
                />
              </Badge>
            </Tooltip>

            <Dropdown
              menu={{ items: roleSwitchItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Button icon={<SwitcherOutlined />}>切换角色</Button>
            </Dropdown>

            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Avatar icon={<UserOutlined />} style={{ cursor: 'pointer', background: roleMap[role].color }} />
            </Dropdown>
          </div>
        </Header>

        <Content style={{ padding: 16, overflow: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>

      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <BellOutlined /> 待办与状态提醒
            <Tag color="blue">{myOrders.length} 项待办</Tag>
            {pendingUrgent.length > 0 && <Tag color="red" icon={<ExclamationCircleOutlined />}>{pendingUrgent.length} 异常</Tag>}
          </div>
        }
        placement="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={500}
        extra={
          <Space>
            <Button size="small" onClick={loadData}>
              <ReloadOutlined /> 刷新
            </Button>
            <Link to={`/${role}/transfer`}>
              <Button size="small" type="primary">
                进入处理 →
              </Button>
            </Link>
          </Space>
        }
      >
        <div style={{ marginBottom: 24 }}>
          <h3 className="section-title">📋 我的待办（需要处理的单子）</h3>
          {myOrders.length === 0 ? (
            <Empty description="暂无待办 🎉" />
          ) : (
            myOrders.map(o => (
              <div key={o.id} className="sidebar-bg-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, flexWrap: 'wrap', gap: 4 }}>
                  <Space size="small" wrap>
                    <strong>{o.brand} {o.model}</strong>
                    <span style={{ color: '#8c8c8c', fontSize: 12 }}>{o.plateNumber}</span>
                  </Space>
                  <Space size="small" wrap>
                    <Tag color={stageMap[o.stage].color}>{stageMap[o.stage].label}</Tag>
                    {o.urgencyAction !== 'none' && (
                      <Tag color={urgencyMap[o.urgencyAction].color}>
                        {urgencyMap[o.urgencyAction].icon} {urgencyMap[o.urgencyAction].label}
                      </Tag>
                    )}
                  </Space>
                </div>
                <div style={{ fontSize: 12, color: '#595959', marginBottom: 4 }}>
                  👤 买家：{o.buyerName} · 💰 {o.dealPrice.toLocaleString()}元
                </div>
                {o.urgencyNote && (
                  <div style={{ fontSize: 12, color: '#cf1322', padding: '4px 8px', background: '#fff1f0', borderRadius: 4 }}>
                    ⚠️ {o.urgencyNote}
                  </div>
                )}
                <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 4 }}>
                  更新：{formatDateTime(o.updatedAt)}
                </div>
              </div>
            ))
          )}
        </div>

        <Divider style={{ margin: '8px 0 16px' }} />

        <div>
          <h3 className="section-title">🕐 最近状态变化</h3>
          {recentLogs.length === 0 ? (
            <Empty description="暂无记录" />
          ) : (
            recentLogs.map(l => (
              <div key={l.id} className="sidebar-bg-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Space size="small" wrap>
                    <Tag color={stageMap[l.stage].color}>{stageMap[l.stage].label}</Tag>
                    <FileTextOutlined style={{ color: '#8c8c8c' }} />
                    <span style={{ fontSize: 12 }}>{l.orderId}</span>
                  </Space>
                  <span style={{ fontSize: 11, color: '#8c8c8c' }}>{formatDateTime(l.operatedAt)}</span>
                </div>
                <div style={{ fontSize: 13, color: '#1f1f1f' }}>
                  <strong>{l.operator}</strong>
                  <Tag color="default" style={{ margin: '0 6px' }}>{roleMap[l.operatorRole].label}</Tag>
                  {l.remark || l.action}
                </div>
              </div>
            ))
          )}
        </div>
      </Drawer>
    </Layout>
  );
}
