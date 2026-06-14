import { Layout as AntLayout, Menu, Typography, Button } from 'antd';
import BookOutlined from '@ant-design/icons/lib/icons/BookOutlined';
import BellOutlined from '@ant-design/icons/lib/icons/BellOutlined';
import AlertOutlined from '@ant-design/icons/lib/icons/AlertOutlined';
import FileTextOutlined from '@ant-design/icons/lib/icons/FileTextOutlined';
import UserOutlined from '@ant-design/icons/lib/icons/UserOutlined';
import QuestionCircleOutlined from '@ant-design/icons/lib/icons/QuestionCircleOutlined';

const { Header, Sider, Content } = AntLayout;
const { Title } = Typography;

interface LayoutProps {
  currentTab: string;
  onTabChange: (key: string) => void;
  userName: string;
  userRole: string;
}

const roleMap: Record<string, string> = {
  registrar: '报名员',
  trainer: '场地教练',
  safety_officer: '安全员',
};

export default function Layout({ currentTab, onTabChange, userName, userRole }: LayoutProps) {
  const menuItems = [
    { key: 'batches', icon: <BookOutlined />, label: '考试批次' },
    { key: 'notifications', icon: <BellOutlined />, label: '学员通知' },
    { key: 'exceptions', icon: <AlertOutlined />, label: '异常处理' },
    { key: 'logs', icon: <FileTextOutlined />, label: '操作日志' },
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#1890ff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Title level={3} style={{ color: 'white', margin: 0 }}>
          摩托车驾培管理系统
        </Title>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button 
            type="text" 
            icon={<QuestionCircleOutlined />} 
            style={{ color: 'white' }}
            onClick={() => onTabChange('docs')}
          >
            系统说明
          </Button>
          <UserOutlined style={{ color: 'white' }} />
          <span style={{ color: 'white' }}>{userName}</span>
          <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px', color: 'white' }}>
            {roleMap[userRole]}
          </span>
        </div>
      </Header>
      <AntLayout>
        <Sider width={200} theme="light">
          <Menu
            mode="inline"
            selectedKeys={[currentTab]}
            items={menuItems}
            onClick={({ key }) => onTabChange(key)}
            style={{ height: '100%', borderRight: 0 }}
          />
        </Sider>
        <Content style={{ padding: '24px', background: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
          {currentTab === 'batches' && <BatchList />}
          {currentTab === 'notifications' && <NotificationList />}
          {currentTab === 'exceptions' && <ExceptionList />}
          {currentTab === 'logs' && <LogList />}
          {currentTab === 'docs' && <WorkflowDocumentation />}
        </Content>
      </AntLayout>
    </AntLayout>
  );
}

import BatchList from './BatchList';
import NotificationList from './NotificationList';
import ExceptionList from './ExceptionList';
import LogList from './LogList';
import { WorkflowDocumentation } from './WorkflowDocumentation';
