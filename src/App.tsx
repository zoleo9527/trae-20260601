import React, { useState } from 'react';
import { Layout, Menu, theme, ConfigProvider } from 'antd';
import { 
  DashboardOutlined, 
  TeamOutlined, 
  ToolOutlined, 
  CustomerServiceOutlined,
  UserOutlined
} from '@ant-design/icons';
import zhCN from 'antd/locale/zh_CN';
import { OrderProvider } from './context/OrderContext';
import Dashboard from './components/Dashboard';
import MasterDispatch from './components/MasterDispatch';
import PartManagement from './components/PartManagement';
import AfterSaleService from './components/AfterSaleService';

const { Header, Sider, Content } = Layout;

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '安装调度看板',
    },
    {
      key: 'dispatch',
      icon: <TeamOutlined />,
      label: '师傅派工',
    },
    {
      key: 'parts',
      icon: <ToolOutlined />,
      label: '配件领用',
    },
    {
      key: 'afterSale',
      icon: <CustomerServiceOutlined />,
      label: '售后客服',
    },
  ];

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return <Dashboard />;
      case 'dispatch':
        return <MasterDispatch />;
      case 'parts':
        return <PartManagement />;
      case 'afterSale':
        return <AfterSaleService />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ConfigProvider locale={zhCN}>
      <OrderProvider>
        <Layout style={{ minHeight: '100vh' }}>
          <Sider 
            collapsible 
            collapsed={collapsed} 
            onCollapse={(value) => setCollapsed(value)}
            style={{
              overflow: 'auto',
              height: '100vh',
              position: 'fixed',
              left: 0,
              top: 0,
              bottom: 0,
            }}
          >
            <div style={{
              height: 32,
              margin: 16,
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 500
            }}>
              {collapsed ? '卫浴' : '卫浴安装队管理'}
            </div>
            <Menu
              theme="dark"
              mode="inline"
              defaultSelectedKeys={['dashboard']}
              items={menuItems}
              onClick={(e) => setActiveMenu(e.key)}
            />
          </Sider>
          <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'margin-left 0.2s' }}>
            <Header style={{
              padding: '0 24px',
              background: colorBgContainer,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #f0f0f0'
            }}>
              <div style={{ fontSize: 18, fontWeight: 500 }}>
                {menuItems.find(item => item.key === activeMenu)?.label}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserOutlined />
                <span>调度员小王</span>
              </div>
            </Header>
            <Content style={{
              overflow: 'initial',
            }}>
              <div style={{
                padding: 0,
                minHeight: 360,
                background: colorBgContainer,
                borderRadius: borderRadiusLG,
              }}>
                {renderContent()}
              </div>
            </Content>
          </Layout>
        </Layout>
      </OrderProvider>
    </ConfigProvider>
  );
};

export default App;
