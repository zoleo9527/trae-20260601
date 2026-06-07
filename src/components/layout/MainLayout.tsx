import { Layout, Menu, Badge, Dropdown, Avatar, Space } from 'antd';
import {
  DashboardOutlined,
  AlertOutlined,
  FileTextOutlined,
  BarChartOutlined,
  UserOutlined,
  CaretDownOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useStore } from '@/store';
import { UserRole } from '@/types';

const { Header, Sider, Content } = Layout;

const roleNameMap: Record<UserRole, string> = {
  store_manager: '店长',
  supervisor: '督导',
  product_specialist: '商品专员',
};

const getMenuItems = (role: UserRole) => {
  const baseItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '预警看板',
    },
  ];

  if (role === 'store_manager' || role === 'supervisor') {
    baseItems.push({
      key: '/differences',
      icon: <FileTextOutlined />,
      label: '盘点差异',
    });
  }

  baseItems.push({
    key: '/loss',
    icon: <BarChartOutlined />,
    label: '损耗分析',
  });

  return baseItems;
};

export const MainLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, switchRole, getActiveAlerts } = useStore();
  const activeAlerts = getActiveAlerts();

  const roleItems = [
    { key: 'store_manager', label: '切换为店长' },
    { key: 'supervisor', label: '切换为督导' },
    { key: 'product_specialist', label: '切换为商品专员' },
  ];

  const handleRoleSwitch = ({ key }: { key: string }) => {
    switchRole(key as UserRole);
  };

  return (
    <Layout className="min-h-screen">
      <Sider width={220} theme="dark">
        <div className="h-16 flex items-center justify-center text-white text-lg font-bold">
          便利店盘点系统
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getMenuItems(currentUser.role)}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header className="bg-white px-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-800 m-0">
              {location.pathname === '/' && '预警看板'}
              {location.pathname === '/differences' && '盘点差异管理'}
              {location.pathname.startsWith('/differences/') && '盘点差异详情'}
              {location.pathname === '/loss' && '损耗分析管理'}
              {location.pathname.startsWith('/loss/') && '损耗分析详情'}
            </h2>
          </div>
          <Space size="large">
            <Badge count={activeAlerts.length} offset={[-5, 5]}>
              <AlertOutlined
                className="text-xl cursor-pointer text-gray-600 hover:text-blue-500"
                onClick={() => navigate('/')}
              />
            </Badge>
            <Dropdown menu={{ items: roleItems, onClick: handleRoleSwitch }}>
              <Space className="cursor-pointer">
                <Avatar icon={<UserOutlined />} />
                <span>
                  {currentUser.name} ({roleNameMap[currentUser.role]})
                </span>
                <CaretDownOutlined />
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content className="p-6 bg-gray-50">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};
