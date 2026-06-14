import { Layout as AntLayout, Menu, Typography } from 'antd';
import { 
  CalendarOutlined, 
  UsersOutlined, 
  AlertTriangleOutlined, 
  BarChartOutlined,
  UserSwitchOutlined
} from '@ant-design/icons';
import { useStore } from '../store';

const { Header, Sider, Content } = AntLayout;
const { Title } = Typography;

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

export default function Layout({ children, currentPage, onPageChange }: LayoutProps) {
  const { userRole, setUserRole } = useStore();

  const menuItems = [
    { key: 'programs', label: '演出节目', icon: <CalendarOutlined /> },
    { key: 'attendance', label: '排练签到', icon: <UsersOutlined /> },
    { key: 'makeup', label: '缺勤补训', icon: <AlertTriangleOutlined /> },
    { key: 'dashboard', label: '风险监控', icon: <BarChartOutlined /> },
  ];

  const roleOptions = [
    { value: 'admin', label: '教务' },
    { value: 'teacher', label: '老师' },
    { value: 'principal', label: '校长' },
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header style={{ padding: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px', height: '100%' }}>
          <Title level={3} style={{ color: '#fff', margin: 0 }}>
            舞蹈培训机构 - 舞台排练管理系统
          </Title>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: '#fff', fontSize: '14px' }}>当前角色:</span>
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as 'admin' | 'teacher' | 'principal')}
              style={{ 
                padding: '4px 8px', 
                borderRadius: '4px', 
                backgroundColor: 'rgba(255,255,255,0.2)', 
                color: '#fff',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <UserSwitchOutlined style={{ color: '#fff', fontSize: '16px' }} />
          </div>
        </div>
      </Header>
      <AntLayout>
        <Sider width={200} theme="light">
          <Menu
            mode="inline"
            selectedKeys={[currentPage]}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
            onClick={({ key }) => onPageChange(key)}
          />
        </Sider>
        <Content style={{ padding: '24px' }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
}
