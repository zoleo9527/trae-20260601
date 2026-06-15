import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  ToolOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CarOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import EquipmentList from './pages/EquipmentList';
import ContractList from './pages/ContractList';
import ReturnList from './pages/ReturnList';
import ReturnForm from './pages/ReturnForm';
import ReturnDetail from './pages/ReturnDetail';

const { Header, Sider, Content } = Layout;

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const selectedKey = location.pathname.split('/')[1] || 'dashboard';

  const menuItems = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: '工作台' },
    { key: 'equipment', icon: <ToolOutlined />, label: '设备管理' },
    { key: 'contract', icon: <FileTextOutlined />, label: '租赁合同' },
    { key: 'return', icon: <CheckCircleOutlined />, label: '回场结算' },
  ];

  return (
    <Layout className="app-layout">
      <Header className="app-header">
        <h1>
          <CarOutlined className="header-icon" />
          工程机械租赁回场结算系统
        </h1>
        <div className="user-info">
          <SettingOutlined />
          <span>租赁管理系统 v1.0</span>
        </div>
      </Header>
      <Layout>
        <Sider
          className="app-sider"
          width={200}
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          theme="light"
        >
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            style={{ height: '100%', borderRight: 0, paddingTop: 12 }}
            onClick={({ key }) => navigate(`/${key}`)}
            items={menuItems}
          />
        </Sider>
        <Content className="app-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/equipment" element={<EquipmentList />} />
            <Route path="/contract" element={<ContractList />} />
            <Route path="/return" element={<ReturnList />} />
            <Route path="/return/new" element={<ReturnForm />} />
            <Route path="/return/:id" element={<ReturnDetail />} />
            <Route path="/return/:id/edit" element={<ReturnForm />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
