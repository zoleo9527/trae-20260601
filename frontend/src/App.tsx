import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, Typography, Badge, Button } from 'antd';
import { 
  UserOutlined, 
  ShoppingCartOutlined, 
  ControlOutlined, 
  CustomerServiceOutlined,
  BellOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import { useAppStore } from './store';
import { Role, RoleNames } from './types';
import AssistantPage from './pages/AssistantPage';
import StageControlPage from './pages/StageControlPage';
import AfterSalesPage from './pages/AfterSalesPage';
import DemoGuide from './components/DemoGuide';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const roleMenuItems = [
  { key: 'ASSISTANT', icon: <ShoppingCartOutlined />, label: '主播助理' },
  { key: 'STAGE_CONTROL', icon: <ControlOutlined />, label: '场控' },
  { key: 'AFTER_SALES_LEAD', icon: <CustomerServiceOutlined />, label: '售后组长' },
];

const App: React.FC = () => {
  const { currentRole, setRole, currentUser } = useAppStore();
  const [collapsed, setCollapsed] = useState(false);
  const [demoGuideVisible, setDemoGuideVisible] = useState(true);

  const userDropdownItems = [
    { key: '1', label: `当前用户: ${currentUser}` },
    { type: 'divider' as const },
    { key: '2', label: '退出登录' },
  ];

  const renderContent = () => {
    switch (currentRole) {
      case 'ASSISTANT':
        return <AssistantPage />;
      case 'STAGE_CONTROL':
        return <StageControlPage />;
      case 'AFTER_SALES_LEAD':
        return <AfterSalesPage />;
      default:
        return <AssistantPage />;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          background: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}
      >
        <Space>
          <ShoppingCartOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />
          <Title level={4} style={{ margin: 0 }}>直播电商库存锁定系统</Title>
        </Space>
        <Space size="large">
          <Button 
            icon={<PlayCircleOutlined />}
            onClick={() => setDemoGuideVisible(true)}
          >
            演示引导
          </Button>
          <Badge count={3} size="small">
            <BellOutlined style={{ fontSize: 20, cursor: 'pointer' }} />
          </Badge>
          <Dropdown menu={{ items: userDropdownItems }}>
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <span>{currentUser} ({RoleNames[currentRole]})</span>
            </Space>
          </Dropdown>
        </Space>
      </Header>
      <Layout>
        <Sider 
          width={200} 
          collapsed={collapsed} 
          onCollapse={setCollapsed}
          theme="light"
          style={{ borderRight: '1px solid #f0f0f0' }}
        >
          <Menu
            mode="inline"
            selectedKeys={[currentRole]}
            onClick={({ key }) => setRole(key as Role)}
            items={roleMenuItems}
            style={{ height: '100%', borderRight: 0 }}
          />
        </Sider>
        <Layout style={{ padding: '24px', background: '#f0f2f5' }}>
          <Content>{renderContent()}</Content>
        </Layout>
      </Layout>

      <DemoGuide 
        visible={demoGuideVisible} 
        onClose={() => setDemoGuideVisible(false)} 
      />
    </Layout>
  );
};

export default App;
