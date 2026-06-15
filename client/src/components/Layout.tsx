import { Layout, Menu, Select, Space, Typography, Avatar } from 'antd';
import { 
  InboxOutlined, 
  SyncOutlined, 
  UserOutlined,
  HomeOutlined
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import useAppStore from '../store/appStore';
import { USER_ROLE_MAP, type UserRole } from '../types';
import { useState } from 'react';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const roleOptions: { value: UserRole; label: string }[] = [
  { value: 'customer_service', label: '客服' },
  { value: 'warehouse_manager', label: '仓库主管' },
  { value: 'driver', label: '司机' },
];

const nameOptions: Record<UserRole, { value: string; label: string }[]> = {
  customer_service: [
    { value: '陈客服', label: '陈客服' },
    { value: '林客服', label: '林客服' },
    { value: '黄客服', label: '黄客服' },
    { value: '周客服', label: '周客服' },
    { value: '吴客服', label: '吴客服' },
  ],
  warehouse_manager: [
    { value: '王主管', label: '王主管' },
    { value: '张主管', label: '张主管' },
    { value: '李仓管', label: '李仓管' },
    { value: '赵仓管', label: '赵仓管' },
  ],
  driver: [
    { value: '张建国', label: '张建国' },
    { value: '王卫东', label: '王卫东' },
    { value: '李明辉', label: '李明辉' },
  ],
};

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, setCurrentUser } = useAppStore();
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentUser.role);

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    const defaultName = nameOptions[role][0].value;
    setCurrentUser({ name: defaultName, role });
  };

  const handleNameChange = (name: string) => {
    setCurrentUser({ name, role: selectedRole });
  };

  const menuItems = [
    {
      key: '/returns',
      icon: <InboxOutlined />,
      label: '退换货管理',
    },
    {
      key: '/reissues',
      icon: <SyncOutlined />,
      label: '补发跟踪',
    },
  ];

  const getSelectedKey = () => {
    if (location.pathname.startsWith('/returns')) return '/returns';
    if (location.pathname.startsWith('/reissues')) return '/reissues';
    return '/returns';
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        background: '#001529',
        padding: '0 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <HomeOutlined style={{ color: '#fff', fontSize: 24, marginRight: 12 }} />
          <Title level={4} style={{ color: '#fff', margin: 0 }}>
            建材仓配-退换货与补发跟踪系统
          </Title>
        </div>
        <Space size="middle">
          <span style={{ color: '#fff' }}>角色切换：</span>
          <Select
            value={selectedRole}
            onChange={handleRoleChange}
            style={{ width: 120 }}
            options={roleOptions}
          />
          <Select
            value={currentUser.name}
            onChange={handleNameChange}
            style={{ width: 120 }}
            options={nameOptions[selectedRole]}
          />
          <Avatar icon={<UserOutlined />} />
          <span style={{ color: '#fff' }}>
            {currentUser.name}（{USER_ROLE_MAP[currentUser.role]}）
          </span>
        </Space>
      </Header>
      <Layout>
        <Sider width={200} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[getSelectedKey()]}
            items={menuItems}
            style={{ height: '100%', borderRight: 0 }}
            onClick={({ key }) => navigate(key as string)}
          />
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
              background: '#fff',
              borderRadius: 8,
            }}
          >
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}
