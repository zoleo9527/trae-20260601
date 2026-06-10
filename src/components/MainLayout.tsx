import {
    AlertOutlined,
    CarOutlined,
    DashboardOutlined,
    UserOutlined,
    UserSwitchOutlined,
} from '@ant-design/icons';
import { Avatar, Dropdown, Layout, Menu, Space, Tag, Typography } from 'antd';
import React, { useState } from 'react';
import { ROLE_LABEL } from '../mock/data';
import type { RoleType } from '../types';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

interface MainLayoutProps {
  children: React.ReactNode;
  activeKey: string;
  onMenuChange: (key: string) => void;
  currentUserName: string;
  currentUserRole: RoleType;
  onSwitchRole: (role: RoleType) => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  activeKey,
  onMenuChange,
  currentUserName,
  currentUserRole,
  onSwitchRole,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const roleColor: Record<RoleType, string> = {
    operator: 'blue',
    customer_service: 'green',
    maintenance: 'orange',
  };

  const roleItems = [
    { key: 'operator', label: ROLE_LABEL.operator, icon: <CarOutlined /> },
    { key: 'customer_service', label: ROLE_LABEL.customer_service, icon: <UserOutlined /> },
    { key: 'maintenance', label: ROLE_LABEL.maintenance, icon: <AlertOutlined /> },
  ].map((item) => ({
    key: item.key,
    label: (
      <Space>
        {item.icon}
        <span>{item.label}</span>
        {item.key === currentUserRole && <Tag color="green">当前</Tag>}
      </Space>
    ),
  }));

  const menuItems = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: '工作台概览' },
    { key: 'orders', icon: <CarOutlined />, label: '临停订单处理' },
    { key: 'repairs', icon: <AlertOutlined />, label: '异常补缴回看' },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={230}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            padding: '0 16px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {!collapsed && (
            <Title level={5} style={{ color: '#fff', margin: 0 }}>
              智慧停车场 · 业务台
            </Title>
          )}
          {collapsed && <DashboardOutlined style={{ fontSize: 24 }} />}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[activeKey]}
          items={menuItems}
          onClick={({ key }) => onMenuChange(key)}
          style={{ borderRight: 0, marginTop: 8 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
        >
          <Space>
            <Tag color="volcano" style={{ fontSize: 13, padding: '2px 10px' }}>
              临停订单 & 异常补缴
            </Tag>
            <Text type="secondary">
              聚焦三件事：谁在处理 · 卡在哪里 · 补缴为什么没完成
            </Text>
          </Space>
          <Space size="large">
            <Dropdown menu={{ items: roleItems, onClick: ({ key }) => onSwitchRole(key as RoleType) }}>
              <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 4 }}>
                <UserSwitchOutlined />
                <Text type="secondary">切换角色</Text>
              </Space>
            </Dropdown>
            <Space>
              <Avatar
                size="small"
                icon={<UserOutlined />}
                style={{ backgroundColor: roleColor[currentUserRole] }}
              />
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{currentUserName}</div>
                <Tag color={roleColor[currentUserRole]} style={{ margin: 0, fontSize: 11, padding: '0 4px' }}>
                  {ROLE_LABEL[currentUserRole]}
                </Tag>
              </div>
            </Space>
          </Space>
        </Header>
        <Content
          style={{
            margin: 0,
            padding: 20,
            background: '#f0f2f5',
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
