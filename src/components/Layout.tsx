import { useState } from 'react';
import { Layout as AntLayout, Menu, Button, Tag } from 'antd';
import { DashboardOutlined, FileTextOutlined, InboxOutlined, TruckOutlined, TeamOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons';

const { Header, Content, Sider } = AntLayout;

interface LayoutProps {
  children: React.ReactNode;
  currentMenu: string;
  onMenuChange: (key: string) => void;
}

export function Layout({ children, currentMenu, onMenuChange }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
    { key: 'workflow', icon: <DashboardOutlined />, label: '订单流程' },
    { key: 'orders', icon: <FileTextOutlined />, label: '销售订单' },
    { key: 'locations', icon: <InboxOutlined />, label: '库位管理' },
    { key: 'delivery', icon: <TruckOutlined />, label: '送货回单' },
    { key: 'team', icon: <TeamOutlined />, label: '团队管理' },
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header className="bg-gradient-to-r from-blue-600 to-blue-800 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <InboxOutlined className="text-white text-xl" />
          <h1 className="text-white text-lg font-bold">建材仓配管理系统</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-white">
            <UserOutlined size={18} />
            <span>张主管</span>
            <Tag color="green">仓库主管</Tag>
          </div>
          <Button type="text" icon={<LogoutOutlined />} className="text-white">
            退出
          </Button>
        </div>
      </Header>
      <AntLayout>
        <Sider 
          width={200} 
          className="bg-white border-r"
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
        >
          <Menu
            mode="inline"
            selectedKeys={[currentMenu]}
            items={menuItems}
            onClick={({ key }) => onMenuChange(key)}
            className="h-full"
          />
        </Sider>
        <Content className="p-6 bg-gray-50">
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
}