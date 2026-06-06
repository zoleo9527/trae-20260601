import React, { useState } from 'react';
import {
  Layout,
  Menu,
  Avatar,
  Space,
  Typography,
  Tag,
  Button,
  Modal
} from 'antd';
import {
  UserOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  ControlOutlined,
  CustomerServiceOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import { useAppStore, RoleUserMap } from './store';
import { Role, RoleNames } from './types';
import AssistantPage from './pages/AssistantPage';
import StageControlPage from './pages/StageControlPage';
import AfterSalesPage from './pages/AfterSalesPage';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const App: React.FC = () => {
  const { currentRole, currentUser, setRole } = useAppStore();
  const [demoGuideVisible, setDemoGuideVisible] = useState(false);

  const roleMenuItems = [
    {
      key: 'ASSISTANT',
      icon: <ShoppingCartOutlined />,
      label: '主播助理'
    },
    {
      key: 'STAGE_CONTROL',
      icon: <ControlOutlined />,
      label: '场控'
    },
    {
      key: 'AFTER_SALES_LEAD',
      icon: <CustomerServiceOutlined />,
      label: '售后组长'
    }
  ];

  const renderPage = () => {
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
      <Sider
        width={220}
        theme="dark"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0
        }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255,255,255,0.1)'
        }}>
          <Space>
            <ShopOutlined style={{ color: '#fff', fontSize: 20 }} />
            <Title level={5} style={{ color: '#fff', margin: 0 }}>
              直播电商库存系统
            </Title>
          </Space>
        </div>

        <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Space>
            <Avatar icon={<UserOutlined />} style={{ background: '#1890ff' }} />
            <div>
              <div style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>
                {currentUser}
              </div>
              <Tag color="blue" style={{ marginTop: 4 }}>
                {RoleNames[currentRole]}
              </Tag>
            </div>
          </Space>
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[currentRole]}
          onClick={({ key }) => setRole(key as Role)}
          items={roleMenuItems}
          style={{ marginTop: 16 }}
        />

        <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, padding: '0 16px' }}>
          <Button
            type="primary"
            block
            icon={<QuestionCircleOutlined />}
            onClick={() => setDemoGuideVisible(true)}
          >
            演示引导
          </Button>
        </div>
      </Sider>

      <Layout style={{ marginLeft: 220 }}>
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Space>
            <Text strong style={{ fontSize: 16 }}>
              {RoleNames[currentRole]}工作台
            </Text>
            <Text type="secondary">
              当前处理人: {currentUser}
            </Text>
          </Space>
          <Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              角色切换:
              {Object.entries(RoleUserMap).map(([role, name]) => (
                <a
                  key={role}
                  style={{
                    margin: '0 8px',
                    color: currentRole === role ? '#1890ff' : undefined,
                    fontWeight: currentRole === role ? 'bold' : undefined
                  }}
                  onClick={() => setRole(role as Role)}
                >
                  {name}
                </a>
              ))}
            </Text>
          </Space>
        </Header>

        <Content style={{ margin: '16px', overflow: 'initial' }}>
          {renderPage()}
        </Content>
      </Layout>

      <Modal
        title="📋 演示引导"
        open={demoGuideVisible}
        onCancel={() => setDemoGuideVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDemoGuideVisible(false)}>
            知道了
          </Button>
        ]}
        width={700}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <div>
            <Text strong style={{ fontSize: 15 }}>🎯 路径一：正常推进流程</Text>
            <ol style={{ margin: '8px 0', paddingLeft: 24 }}>
              <li>主播助理 → 新建锁定单 → 填写SKU和价格口径</li>
              <li>主播助理 → 锁定库存 → 设置每个SKU的锁定数量 → 提交审核</li>
              <li>切换到场控 → 审核通过 → 自动流转到赠品配置</li>
              <li>切换到售后组长 → 配置赠品 → 确认完成</li>
            </ol>
          </div>
          <div>
            <Text strong style={{ fontSize: 15 }}>⚠️ 路径二：异常处理流程（含驳回/退回）</Text>
            <ol style={{ margin: '8px 0', paddingLeft: 24 }}>
              <li>主播助理提交锁定单（可故意不填价格口径）</li>
              <li>场控 → 选择「驳回」→ 填写驳回原因（如：价格口径错误）</li>
              <li>或场控 → 点击「退回」→ 订单返回给主播助理</li>
              <li>切回主播助理 → 看到红色驳回提示 → 查看原因 → 重新编辑提交</li>
              <li>重新进入正常审核流程</li>
            </ol>
          </div>
          <div style={{ padding: '12px', background: '#f6ffed', borderRadius: 6 }}>
            <Text strong type="success">💡 核心亮点：</Text>
            <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
              <li>三个角色独立入口，职责清晰分离</li>
              <li>库存锁定 → 赠品配置 无缝衔接，无需额外消息</li>
              <li>全链路操作日志记录，所有操作可追溯</li>
              <li>历次驳回/退回原因在赠品配置页完整保留</li>
              <li>多维度组合筛选，快速定位待处理订单</li>
            </ul>
          </div>
        </Space>
      </Modal>
    </Layout>
  );
};

export default App;
