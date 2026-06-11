import { Layout, Menu, Badge, Button, Space, Form, Input, Empty, Card, List, Timeline, Divider, Typography, Alert, App as AntdApp, Tag, message } from 'antd';
import {
  UserOutlined,
  UnorderedListOutlined,
  WarningOutlined,
  HistoryOutlined,
  BugOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../store/appStore';
import { useState, useEffect } from 'react';
import LeadList from '../pages/LeadList';
import RoleSwitcher from './RoleSwitcher';
import { runAllExceptionTests, EXCEPTION_TEST_CASES } from '../services/exceptionTests';
import { EXCEPTION_TYPE_LABELS, FOLLOWUP_STATUS_LABELS } from '../types';
import dayjs from 'dayjs';

const { Sider, Content, Header } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

export default function AppLayout() {
  const { currentUser, exceptionStats, scanForGaps, loadLeads } = useAppStore();
  const [activeKey, setActiveKey] = useState('leads');
  const [testRunning, setTestRunning] = useState(false);

  const menuItems = [
    {
      key: 'leads',
      icon: <UnorderedListOutlined />,
      label: '招商线索',
    },
    {
      key: 'exceptions',
      icon: (
        <Badge count={exceptionStats.total} size="small" offset={[6, -2]}>
          <WarningOutlined />
        </Badge>
      ),
      label: '异常监控',
    },
    {
      key: 'followup',
      icon: <HistoryOutlined />,
      label: '跟进回看',
    },
    {
      key: 'tests',
      icon: <BugOutlined />,
      label: '异常测试',
    },
  ];

  const handleRunTests = async () => {
    setTestRunning(true);
    try {
      await runAllExceptionTests();
      alert('测试完成！请查看控制台输出');
    } catch (error: any) {
      alert('测试出错: ' + error.message);
    } finally {
      setTestRunning(false);
      await loadLeads();
    }
  };

  const handleScanGaps = async () => {
    const exceptions = await scanForGaps();
    if (exceptions.length > 0) {
      alert(`扫描完成，发现 ${exceptions.length} 个异常！`);
    } else {
      alert('扫描完成，未发现异常');
    }
    await loadLeads();
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220} theme="dark">
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 16,
            fontWeight: 600,
            borderBottom: '1px solid #1f1f1f',
          }}
        >
          招商管理
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[activeKey]}
          items={menuItems}
          onClick={({ key }) => setActiveKey(key)}
          style={{ borderRight: 'none', marginTop: 8 }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 16,
            borderTop: '1px solid #1f1f1f',
            background: '#001529',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                background: '#1677ff',
                padding: 8,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UserOutlined style={{ fontSize: 20, color: '#fff' }} />
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 500 }}>
                {currentUser?.name}
              </div>
              <div style={{ color: '#8c8c8c', fontSize: 12 }}>
                {currentUser?.role === 'manager'
                  ? '招商经理'
                  : currentUser?.role === 'supervisor'
                  ? '招商主管'
                  : currentUser?.role === 'property'
                  ? '物业'
                  : '工程'}
              </div>
            </div>
          </div>
        </div>
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 20 }}>产业园招商管理系统</h1>
            <p style={{ margin: '4px 0 0', color: '#8c8c8c', fontSize: 13 }}>
              招商线索处理 · 客户跟进管理 · 异常流监控
            </p>
          </div>
          <Space>
            <RoleSwitcher />
            <Button onClick={handleScanGaps} icon={<WarningOutlined />}>
              扫描异常
            </Button>
            <Button
              type="primary"
              danger
              onClick={handleRunTests}
              loading={testRunning}
              icon={<BugOutlined />}
            >
              运行异常测试
            </Button>
          </Space>
        </Header>
        <Content style={{ padding: 16, background: '#f5f5f5' }}>
          {activeKey === 'leads' && <LeadList />}
          {activeKey === 'exceptions' && <ExceptionPanel />}
          {activeKey === 'followup' && <FollowupReview />}
          {activeKey === 'tests' && <TestPanel onRunTests={handleRunTests} running={testRunning} />}
        </Content>
      </Layout>
    </Layout>
  );
}

function ExceptionPanel() {
  const { allExceptions, leads, handleException, users, loadAllExceptions } = useAppStore();
  const { modal } = AntdApp.useApp();
  const [form] = Form.useForm();

  useEffect(() => {
    loadAllExceptions();
  }, []);

  const unhandledExceptions = allExceptions;

  const getLeadName = (leadId: string) => {
    const lead = leads.find((l) => l.id === leadId);
    return lead?.companyName || leadId;
  };

  const getUserName = (id: string | null) => {
    if (!id) return '-';
    const user = users.find((u) => u.id === id);
    return user?.name || id;
  };

  const handleResolve = (exception: any) => {
    modal.confirm({
      title: '处理异常',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p><strong>异常类型:</strong> {EXCEPTION_TYPE_LABELS[exception.type]}</p>
          <p><strong>异常信息:</strong> {exception.message}</p>
          <p><strong>关联线索:</strong> {getLeadName(exception.leadId)}</p>
          <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
            <Form.Item
              name="remark"
              label="处理说明"
              rules={[{ required: true, message: '请输入处理说明' }]}
            >
              <TextArea rows={3} placeholder="请说明如何处理此异常..." />
            </Form.Item>
          </Form>
        </div>
      ),
      onOk: async () => {
        const values = await form.validateFields();
        await handleException(exception.id, values.remark);
        message.success('异常已处理');
        form.resetFields();
      },
    });
  };

  if (unhandledExceptions.length === 0) {
    return (
      <Card>
        <Empty description="暂无未处理的异常，系统运行正常" />
      </Card>
    );
  }

  return (
    <div>
      <Card title={`异常列表 (${unhandledExceptions.length})`}>
        <List
          dataSource={unhandledExceptions}
          renderItem={(item) => (
            <List.Item
              style={{
                background: '#fff1f0',
                borderRadius: 8,
                padding: 16,
                marginBottom: 12,
                border: '1px solid #ffa39e',
              }}
              actions={[
                <Button type="primary" size="small" onClick={() => handleResolve(item)}>
                  处理
                </Button>,
              ]}
            >
              <List.Item.Meta
                avatar={<WarningOutlined style={{ color: '#ff4d4f', fontSize: 24 }} />}
                title={
                  <Space>
                    <Tag color="red">{EXCEPTION_TYPE_LABELS[item.type]}</Tag>
                    <Text strong>{getLeadName(item.leadId)}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(item.detectedAt).format('YYYY-MM-DD HH:mm')}
                    </Text>
                  </Space>
                }
                description={item.message}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}

function FollowupReview() {
  const { leads, allFollowups, users, currentUser, loadAllFollowups } = useAppStore();

  useEffect(() => {
    loadAllFollowups();
  }, []);

  if (allFollowups.length === 0) {
    return (
      <Card>
        <Empty description="暂无跟进记录" />
      </Card>
    );
  }

  const getUserName = (id: string | null) => {
    if (!id) return '-';
    const user = users.find((u) => u.id === id);
    return user?.name || id;
  };

  const getLeadName = (leadId: string) => {
    const lead = leads.find((l) => l.id === leadId);
    return lead?.companyName || leadId;
  };

  const typeLabels: Record<string, string> = {
    call: '电话',
    visit: '拜访',
    meeting: '会议',
    email: '邮件',
    chat: '即时通讯',
    site: '现场',
    other: '其他',
  };

  return (
    <Card title="跟进记录回看">
      <Timeline
        items={allFollowups.slice(0, 50).map((f) => ({
          color: f.status === 'completed' ? 'green' : f.status === 'exception' ? 'red' : 'blue',
          children: (
            <div className="followup-card">
              <div className="followup-card-header">
                <Space>
                  <span className="followup-card-type">
                    {typeLabels[f.type] || f.type}
                  </span>
                  <Tag>{getLeadName(f.leadId)}</Tag>
                  <Tag color="blue">{getUserName(f.handledBy)}</Tag>
                  <Tag>{FOLLOWUP_STATUS_LABELS[f.status]}</Tag>
                </Space>
                <span className="followup-card-time">
                  {dayjs(f.createdAt).format('YYYY-MM-DD HH:mm')}
                </span>
              </div>
              <div style={{ whiteSpace: 'pre-wrap', marginBottom: 8 }}>
                {f.content}
              </div>
              {f.nextAction && (
                <div style={{ fontSize: 12, color: '#1677ff' }}>
                  → 下一步: {f.nextAction}
                  {f.nextActionAt && ` (${dayjs(f.nextActionAt).format('YYYY-MM-DD')})`}
                </div>
              )}
            </div>
          ),
        }))}
      />
    </Card>
  );
}

function TestPanel({ onRunTests, running }: { onRunTests: () => void; running: boolean }) {
  return (
    <Card title="异常流测试面板">
      <Alert
        message="测试说明"
        description={
          <div>
            <p>点击下方按钮运行所有异常测试用例，验证系统的异常流处理能力。</p>
            <p>测试用例包括：24小时未分配检测、状态空档检测、48小时无跟进检测、退回流程、权限验证等。</p>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Space style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          size="large"
          onClick={onRunTests}
          loading={running}
          icon={<BugOutlined />}
        >
          {running ? '测试运行中...' : '运行所有异常测试'}
        </Button>
      </Space>

      <Divider />

      <Title level={4}>测试用例列表 ({EXCEPTION_TEST_CASES.length})</Title>
      <List
        dataSource={EXCEPTION_TEST_CASES}
        renderItem={(item: any) => (
          <List.Item>
            <List.Item.Meta
              title={
                <Space>
                  <Tag color={item.shouldTriggerAlert ? 'red' : 'blue'}>
                    {item.id}
                  </Tag>
                  <Text strong>{item.name}</Text>
                  {item.expectedException && (
                    <Tag color="orange">
                      预期异常: {EXCEPTION_TYPE_LABELS[item.expectedException]}
                    </Tag>
                  )}
                </Space>
              }
              description={item.description}
            />
          </List.Item>
        )}
      />
    </Card>
  );
}
