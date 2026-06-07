import { BrowserRouter } from 'react-router-dom';
import { Layout, Menu, Dropdown, Avatar, Space, Badge } from 'antd';
import { UserOutlined, BellOutlined } from '@ant-design/icons';
import { useStore } from './store';
import { Role } from './store/types';
import ReceptionPage from './pages/Reception';
import HandlerPage from './pages/Handler';
import ManagerPage from './pages/Manager';
import { useState } from 'react';

const { Header, Content, Sider } = Layout;

const roleMenus: Record<Role, { key: string; label: string }[]> = {
  reception: [
    { key: 'checkin', label: '开单入场' },
    { key: 'orders', label: '消费中订单' },
    { key: 'checkout', label: '结账离场' },
    { key: 'abnormal', label: '异常上报' },
  ],
  handler: [
    { key: 'pending', label: '待处理异常' },
    { key: 'processing', label: '处理中' },
    { key: 'refund-apply', label: '退款申请' },
    { key: 'history', label: '处理记录' },
  ],
  manager: [
    { key: 'todo', label: '待办' },
    { key: 'review', label: '数据回看' },
    { key: 'members', label: '会员管理' },
    { key: 'statistics', label: '经营统计' },
  ],
};

const roleNames: Record<Role, string> = {
  reception: '前台',
  handler: '处理人员',
  manager: '店长',
};

function App() {
  const { currentRole, currentUser, setRole, orders } = useStore();
  const [activeKey, setActiveKey] = useState(roleMenus[currentRole][0].key);

  const pendingAbnormalCount = orders.filter(o => o.status === 'abnormal').length;
  const pendingRefundCount = orders.filter(o => o.status === 'refunding').length;
  const rejectedRefundCount = orders.filter(o => o.status === 'refund_rejected').length;

  const handleRoleSwitch = (role: Role) => {
    setRole(role);
    setActiveKey(roleMenus[role][0].key);
  };

  const roleDropdownItems = [
    { key: 'reception', label: '切换到前台', onClick: () => handleRoleSwitch('reception') },
    { key: 'handler', label: '切换到处理人员', onClick: () => handleRoleSwitch('handler') },
    { key: 'manager', label: '切换到店长', onClick: () => handleRoleSwitch('manager') },
  ];

  const getNotificationCount = () => {
    if (currentRole === 'reception') return pendingAbnormalCount;
    if (currentRole === 'handler') return pendingAbnormalCount + rejectedRefundCount;
    if (currentRole === 'manager') return pendingRefundCount;
    return 0;
  };

  const renderContent = () => {
    if (currentRole === 'reception') {
      return <ReceptionPage activeTab={activeKey} onTabChange={setActiveKey} />;
    }
    if (currentRole === 'handler') {
      return <HandlerPage activeTab={activeKey} onTabChange={setActiveKey} />;
    }
    if (currentRole === 'manager') {
      return <ManagerPage activeTab={activeKey} onTabChange={setActiveKey} />;
    }
    return null;
  };

  return (
    <BrowserRouter>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ 
          background: '#001529', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '0 24px'
        }}>
          <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
            KTV门店管理系统 - 储值消费与退款审核
          </div>
          <Space size="large">
            <Badge count={getNotificationCount()}>
              <BellOutlined style={{ color: 'white', fontSize: '18px', cursor: 'pointer' }} />
            </Badge>
            <Dropdown menu={{ items: roleDropdownItems }}>
              <Space style={{ color: 'white', cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} size="small" />
                <span>{currentUser} ({roleNames[currentRole]})</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Layout>
          <Sider width={200} style={{ background: '#fff' }}>
            <Menu
              mode="inline"
              selectedKeys={[activeKey]}
              onClick={({ key }) => setActiveKey(key)}
              style={{ height: '100%', borderRight: 0 }}
              items={roleMenus[currentRole].map(item => {
                let badgeCount = 0;
                if (currentRole === 'reception' && item.key === 'abnormal') {
                  badgeCount = pendingAbnormalCount;
                }
                if (currentRole === 'handler' && item.key === 'pending') {
                  badgeCount = pendingAbnormalCount + rejectedRefundCount;
                }
                if (currentRole === 'manager' && item.key === 'todo') {
                  badgeCount = pendingRefundCount;
                }
                return {
                  ...item,
                  label: badgeCount > 0 ? (
                    <Space>
                      {item.label}
                      <Badge count={badgeCount} size="small" />
                    </Space>
                  ) : item.label,
                };
              })}
            />
          </Sider>
          <Layout style={{ padding: '24px' }}>
            <Content
              style={{
                padding: 24,
                margin: 0,
                minHeight: 280,
                background: '#fff',
                borderRadius: '8px',
              }}
            >
              {renderContent()}
            </Content>
          </Layout>
        </Layout>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
