import { Layout, Menu, Avatar, Dropdown, Button, Space } from 'antd';
import {
  FileTextOutlined,
  ScheduleOutlined,
  ShoppingCartOutlined,
  ToolOutlined,
  HistoryOutlined,
  WarningOutlined,
  PlayCircleOutlined,
  AppstoreOutlined,
  ReloadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useApi } from '@/services/api';
import { roleDisplayMap } from '@/utils/stateMachine';
import { useState } from 'react';
import { message, Modal } from 'antd';

const { Header, Sider, Content } = Layout;

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const api = useApi();
  const currentUser = api.getCurrentUser();
  const [resetModal, setResetModal] = useState(false);

  const menuItems = [
    {
      key: '/schedules',
      icon: <ScheduleOutlined />,
      label: <Link to="/schedules">喷绘排产</Link>,
    },
    {
      key: '/drafts',
      icon: <FileTextOutlined />,
      label: <Link to="/drafts">客户稿件</Link>,
    },
    {
      key: '/materials',
      icon: <ShoppingCartOutlined />,
      label: <Link to="/materials">材料领用</Link>,
    },
    {
      key: '/installations',
      icon: <ToolOutlined />,
      label: <Link to="/installations">安装记录</Link>,
    },
    {
      key: '/audit-logs',
      icon: <HistoryOutlined />,
      label: <Link to="/audit-logs">审计日志</Link>,
    },
    {
      key: '/exceptions',
      icon: <WarningOutlined />,
      label: <Link to="/exceptions">异常记录</Link>,
    },
    {
      key: '/model',
      icon: <AppstoreOutlined />,
      label: <Link to="/model">模型关系</Link>,
    },
    {
      key: '/demo',
      icon: <PlayCircleOutlined />,
      label: <Link to="/demo">流程演示</Link>,
    },
  ];

  const handleSwitchUser = (userId: string) => {
    api.switchUser(userId);
    message.success(`已切换到用户: ${api.getAllUsers().find((u) => u.id === userId)?.name}`);
  };

  const handleReset = () => {
    setResetModal(false);
    api.resetDemoData();
    message.success('演示数据已重置');
    navigate('/');
  };

  const userMenu = {
    items: api.getAllUsers().map((user) => ({
      key: user.id,
      label: (
        <div>
          <strong>{user.name}</strong>
          <div style={{ fontSize: '12px', color: '#999' }}>
            {roleDisplayMap[user.role]}
          </div>
        </div>
      ),
      onClick: () => handleSwitchUser(user.id),
      disabled: user.id === currentUser.id,
    })),
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#001529',
          padding: '0 24px',
        }}
      >
        <div style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold' }}>
          广告喷绘店 - 喷绘排产与材料领用系统
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => setResetModal(true)}
            danger
          >
            重置演示数据
          </Button>
          <Dropdown menu={userMenu} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} />
              <div style={{ color: '#fff' }}>
                <div>{currentUser.name}</div>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  {roleDisplayMap[currentUser.role]}
                </div>
              </div>
            </div>
          </Dropdown>
        </Space>
      </Header>
      <Layout>
        <Sider width={200} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
          />
        </Sider>
        <Layout style={{ padding: '16px' }}>
          <Content
            style={{
              background: '#fff',
              padding: 16,
              borderRadius: 8,
              minHeight: 'calc(100vh - 112px)',
            }}
          >
            <Outlet />
          </Content>
        </Layout>
      </Layout>

      <Modal
        title="确认重置"
        open={resetModal}
        onOk={handleReset}
        onCancel={() => setResetModal(false)}
        okText="确认重置"
        cancelText="取消"
      >
        <p>确定要重置所有演示数据吗？此操作不可撤销。</p>
      </Modal>
    </Layout>
  );
}
