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
  ShoppingCartOutlined,
  TruckOutlined,
  AlertTriangleOutlined,
  GrainOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import { useAppStore, RoleUserMap } from './store';
import { Role, RoleNames } from './types';
import OrderPage from './pages/OrderPage';
import LoadingReviewPage from './pages/LoadingReviewPage';
import ExceptionPage from './pages/ExceptionPage';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const App: React.FC = () => {
  const { currentRole, currentUser, setRole } = useAppStore();
  const [demoGuideVisible, setDemoGuideVisible] = useState(false);

  const roleMenuItems = [
    {
      key: 'WAREHOUSE',
      icon: <ShoppingCartOutlined />,
      label: '订单管理'
    },
    {
      key: 'QUALITY',
      icon: <TruckOutlined />,
      label: '装车复核'
    },
    {
      key: 'MANAGER',
      icon: <AlertTriangleOutlined />,
      label: '异常管理'
    }
  ];

  const renderPage = () => {
    switch (currentRole) {
      case 'WAREHOUSE':
        return <OrderPage />;
      case 'QUALITY':
        return <LoadingReviewPage />;
      case 'MANAGER':
        return <ExceptionPage />;
      default:
        return <OrderPage />;
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
            <GrainOutlined style={{ color: '#fff', fontSize: 20 }} />
            <Title level={5} style={{ color: '#fff', margin: 0 }}>
              饲料厂管理系统
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
              {currentRole === 'WAREHOUSE' && '客户订货管理'}
              {currentRole === 'QUALITY' && '装车复核管理'}
              {currentRole === 'MANAGER' && '异常管理'}
            </Text>
            <Text type="secondary">
              当前用户: {currentUser}
            </Text>
          </Space>
          <Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              切换角色:
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
              <li><strong>仓库管理员（张三）</strong> → 新建订单 → 选择客户和配方 → 创建订单</li>
              <li><strong>管理人员（王五）</strong> → 确认订单 → 订单进入生产流程</li>
              <li><strong>仓库管理员（张三）</strong> → 标记订单准备就绪 → 订单进入待装车</li>
              <li><strong>质检员（李四）</strong> → 开始复核 → 查看配方和投料记录 → 确认复核通过</li>
            </ol>
          </div>
          <div>
            <Text strong style={{ fontSize: 15 }}>⚠️ 路径二：异常处理流程（含复核不通过/退回）</Text>
            <ol style={{ margin: '8px 0', paddingLeft: 24 }}>
              <li>按照正常流程创建并确认订单</li>
              <li><strong>质检员（李四）</strong> → 开始复核 → 标记某项不通过或填写差异说明</li>
              <li>提交复核 → 系统自动记录异常</li>
              <li><strong>管理人员（王五）</strong> → 查看异常 → 处理异常并记录解决方案</li>
            </ol>
          </div>
          <div style={{ padding: '12px', background: '#f6ffed', borderRadius: 6 }}>
            <Text strong type="success">💡 核心亮点：</Text>
            <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
              <li><strong>配方单集成</strong>：装车复核时可直接查看配方组成和原料比例</li>
              <li><strong>投料记录追溯</strong>：关联批次的投料记录实时展示，含偏差数据</li>
              <li><strong>客户投诉管理</strong>：增重慢等投诉可追溯到具体订单和批次</li>
              <li><strong>统一数据源头</strong>：一线处理和管理回看基于同一份数据</li>
              <li><strong>复核不通过流程</strong>：支持标记差异、记录原因、生成异常</li>
            </ul>
          </div>
          <div style={{ padding: '12px', background: '#fff7e6', borderRadius: 6 }}>
            <Text strong type="warning">🔍 主要功能模块：</Text>
            <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
              <li><strong>订单管理</strong>：客户订货创建、确认、状态流转</li>
              <li><strong>装车复核</strong>：配方查看、投料记录、批次核对、复核确认</li>
              <li><strong>异常管理</strong>：投料偏差、标签错误、客户投诉的上报与处理</li>
            </ul>
          </div>
        </Space>
      </Modal>
    </Layout>
  );
};

export default App;