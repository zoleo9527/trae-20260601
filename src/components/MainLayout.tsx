
import { Layout, Menu, Avatar, Dropdown, Button, message } from 'antd';
import {
  Home,
  ShoppingBag,
  ClipboardList,
  Settings,
  LogOut,
  User,
} from 'lucide-react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import type { UserRole } from '../../shared/types';

const { Header, Sider, Content } = Layout;

const roleNames: Record<UserRole, string> = {
  store_manager: '店长',
  supervisor: '督导',
  product_specialist: '商品专员',
};

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useUserStore((s) => s.user);
  const logout = useUserStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    message.success('已退出登录');
    navigate('/login');
  };

  const getMenuItems = () => {
    const items = [
      {
        key: '/dashboard',
        icon: <Home size={18} />,
        label: '工作台',
      },
      {
        key: '/promotion',
        icon: <ShoppingBag size={18} />,
        label: '促销陈列',
      },
      {
        key: '/inspection',
        icon: <ClipboardList size={18} />,
        label: '巡店整改',
      },
    ];

    if (user?.role === 'supervisor' || user?.role === 'product_specialist') {
      items.push({
        key: '/settings',
        icon: <Settings size={18} />,
        label: '系统设置',
      });
    }

    return items;
  };

  const userDropdownItems = [
    {
      key: 'logout',
      icon: <LogOut size={16} />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout className="min-h-screen">
      <Sider theme="dark" width={240} className="!bg-slate-900">
        <div className="h-16 flex items-center justify-center border-b border-slate-700">
          <h2 className="text-white font-bold text-lg">便利店管理系统</h2>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getMenuItems()}
          onClick={({ key }) => navigate(key)}
          className="!bg-slate-900 border-r-0 mt-4"
        />
      </Sider>
      <Layout>
        <Header className="!bg-white !px-6 flex items-center justify-between shadow-sm border-b">
          <div className="text-gray-600">
            {user?.storeName && <span className="mr-4">{user.storeName}</span>}
          </div>
          <Dropdown menu={{ items: userDropdownItems }} placement="bottomRight">
            <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
              <Avatar className="!bg-blue-600">
                <User size={18} />
              </Avatar>
              <div className="text-left">
                <div className="font-medium text-gray-800">{user?.name}</div>
                <div className="text-xs text-gray-500">{user && roleNames[user.role]}</div>
              </div>
            </div>
          </Dropdown>
        </Header>
        <Content className="m-6">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
