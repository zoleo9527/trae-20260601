import { useState, useMemo } from 'react';
import {
  Table,
  Button,
  Input,
  Tag,
  Space,
  Modal,
  Form,
  Select,
  InputNumber,
  Drawer,
  Badge,
  App as AntdApp,
  Tooltip,
  Dropdown,
  MenuProps,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  WarningOutlined,
  ArrowRightOutlined,
  RollbackOutlined,
  UserSwitchOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../store/appStore';
import {
  LEAD_STATUS_LABELS,
  LEAD_STATUS_COLORS,
  ROLE_LABELS,
  EXCEPTION_TYPE_LABELS,
  LeadStatus,
  Role,
  LeadSource,
} from '../types';
import { getAllowedTransitions } from '../utils/stateMachine';
import dayjs from 'dayjs';
import LeadDetail from './LeadDetail';
import StatusTransitionModal from '../components/StatusTransitionModal';

const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

export default function LeadList() {
  const {
    leads,
    totalLeads,
    page,
    pageSize,
    filters,
    currentUser,
    users,
    loading,
    setPage,
    setFilters,
    createLead,
    returnLead,
    reassignLead,
    flagException,
    scanForGaps,
  } = useAppStore();

  const { message, modal } = AntdApp.useApp();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [transitionModalOpen, setTransitionModalOpen] = useState(false);
  const [transitionLeadId, setTransitionLeadId] = useState<string | null>(null);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnLeadId, setReturnLeadId] = useState<string | null>(null);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [reassignLeadId, setReassignLeadId] = useState<string | null>(null);
  const [createForm] = Form.useForm();
  const [returnForm] = Form.useForm();
  const [reassignForm] = Form.useForm();

  const quickFilters = useMemo(
    () => [
      { key: 'all', label: '全部', filter: {} },
      {
        key: 'exception',
        label: '异常',
        filter: { hasException: true },
        icon: <WarningOutlined style={{ color: '#ff4d4f' }} />,
      },
      {
        key: 'new',
        label: '新建',
        filter: { status: ['new'] },
      },
      {
        key: 'assigned',
        label: '已分配',
        filter: { status: ['assigned'] },
      },
      {
        key: 'contacting',
        label: '接洽中',
        filter: { status: ['contacting'] },
      },
      {
        key: 'followup',
        label: '待跟进',
        filter: { status: ['needs_followup'] },
      },
      {
        key: 'high',
        label: '高优先级',
        filter: { priority: ['high'] },
      },
    ],
    []
  );

  const [activeQuickFilter, setActiveQuickFilter] = useState('all');

  const handleQuickFilter = (key: string) => {
    setActiveQuickFilter(key);
    const filter = quickFilters.find((f) => f.key === key);
    if (filter) {
      setFilters(filter.filter);
    }
  };

  const handleSearch = (value: string) => {
    setFilters({ keyword: value || undefined });
  };

  const handleCreateLead = async () => {
    try {
      const values = await createForm.validateFields();
      const result = await createLead(values);
      if (result.success) {
        message.success('线索创建成功');
        setCreateModalOpen(false);
        createForm.resetFields();
      }
    } catch (error: any) {
      message.error('创建失败: ' + error.message);
    }
  };

  const handleReturnLead = async () => {
    if (!returnLeadId) return;
    try {
      const values = await returnForm.validateFields();
      const result = await returnLead(returnLeadId, values.reason);
      if (result.success) {
        message.success('退回成功');
        setReturnModalOpen(false);
        returnForm.resetFields();
        if (result.exception) {
          message.warning(
            '检测到异常: ' + EXCEPTION_TYPE_LABELS[result.exception.type]
          );
        }
      } else {
        message.error(result.errors.join(', '));
      }
    } catch (error: any) {
      message.error('退回失败: ' + error.message);
    }
  };

  const handleReassignLead = async () => {
    if (!reassignLeadId) return;
    try {
      const values = await reassignForm.validateFields();
      const user = users.find((u) => u.id === values.responsibleId);
      if (!user) throw new Error('用户不存在');
      await reassignLead(
        reassignLeadId,
        values.responsibleId,
        user.role,
        values.reason
      );
      message.success('重新分配成功');
      setReassignModalOpen(false);
      reassignForm.resetFields();
    } catch (error: any) {
      message.error('分配失败: ' + error.message);
    }
  };

  const handleFlagException = (leadId: string) => {
    modal.confirm({
      title: '标记异常',
      icon: <ExclamationCircleOutlined />,
      content: '确定要将此线索标记为异常吗？',
      onOk: async () => {
        await flagException(
          leadId,
          null,
          'manual_flag',
          '人工标记为异常线索'
        );
        message.success('已标记为异常');
      },
    });
  };

  const handleScanGaps = async () => {
    const exceptions = await scanForGaps();
    if (exceptions.length > 0) {
      message.warning(`扫描完成，发现 ${exceptions.length} 个异常`);
    } else {
      message.success('扫描完成，未发现异常');
    }
  };

  const openTransition = (leadId: string) => {
    setTransitionLeadId(leadId);
    setTransitionModalOpen(true);
  };

  const openDetail = (leadId: string) => {
    setSelectedLeadId(leadId);
    setDetailDrawerOpen(true);
  };

  const getStatusMenuItems = (lead: any): MenuProps['items'] => {
    if (!currentUser) return [];

    const allowedTransitions = getAllowedTransitions(
      lead.status,
      currentUser.role
    );

    const items: MenuProps['items'] = [];

    if (allowedTransitions.length > 0) {
      items.push({
        key: 'transition',
        label: '状态流转',
        icon: <ArrowRightOutlined />,
        children: allowedTransitions.map((status) => ({
          key: `status_${status}`,
          label: `转为: ${LEAD_STATUS_LABELS[status]}`,
          onClick: () => openTransition(lead.id),
        })),
      });
    }

    if (currentUser.role === 'manager' || currentUser.role === 'supervisor') {
      items.push({
        key: 'return',
        label: '退回线索',
        icon: <RollbackOutlined />,
        onClick: () => {
          setReturnLeadId(lead.id);
          setReturnModalOpen(true);
        },
      });
    }

    if (currentUser.role === 'manager') {
      items.push({
        key: 'reassign',
        label: '重新分配',
        icon: <UserSwitchOutlined />,
        onClick: () => {
          setReassignLeadId(lead.id);
          setReassignModalOpen(true);
        },
      });
    }

    items.push({ type: 'divider' });

    items.push({
      key: 'flag',
      label: '标记异常',
      icon: <WarningOutlined />,
      danger: true,
      onClick: () => handleFlagException(lead.id),
    });

    return items;
  };

  const columns = [
    {
      title: '企业名称',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 160,
      fixed: 'left' as const,
      render: (text: string, record: any) => (
        <div>
          <a onClick={() => openDetail(record.id)} style={{ fontWeight: 500 }}>
            {text}
          </a>
          {record.hasException && (
            <div>
              <Tag color="red" className="exception-badge">
                <WarningOutlined /> 异常
              </Tag>
            </div>
          )}
        </div>
      ),
    },
    {
      title: '联系人',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
      width: 100,
    },
    {
      title: '电话',
      dataIndex: 'contactPhone',
      key: 'contactPhone',
      width: 120,
      copyable: true,
    },
    {
      title: '行业',
      dataIndex: 'industry',
      key: 'industry',
      width: 100,
    },
    {
      title: '需求面积',
      dataIndex: 'requiredArea',
      key: 'requiredArea',
      width: 100,
      render: (val: number) => (val > 0 ? `${val} ㎡` : '-'),
    },
    {
      title: '预算',
      dataIndex: 'budget',
      key: 'budget',
      width: 100,
      render: (val: number) => (val > 0 ? `¥${val}万` : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: LeadStatus) => (
        <Tag color={LEAD_STATUS_COLORS[status]}>
          {LEAD_STATUS_LABELS[status]}
        </Tag>
      ),
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 100,
      render: (source: LeadSource) => {
        const sourceLabels: Record<string, string> = {
          old_ledger: '旧台账',
          site_record: '现场记录',
          chat_screenshot: '沟通截图',
          other: '其他',
        };
        return (
          <Tooltip title={source.reference}>
            <Tag>{sourceLabels[source.type] || source.type}</Tag>
          </Tooltip>
        );
      },
    },
    {
      title: '当前责任人',
      dataIndex: 'currentResponsible',
      key: 'currentResponsible',
      width: 120,
      render: (val: string, record: any) => {
        if (!val) {
          return (
            <Badge status="warning" text="未分配" className="exception-badge" />
          );
        }
        const user = users.find((u) => u.id === val);
        return (
          <div>
            <div>{user?.name || val}</div>
            <div style={{ fontSize: 11, color: '#8c8c8c' }}>
              {record.currentResponsibleRole
                ? ROLE_LABELS[record.currentResponsibleRole]
                : ''}
            </div>
          </div>
        );
      },
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (p: string) => {
        const colors: Record<string, string> = {
          high: 'red',
          medium: 'orange',
          low: 'green',
        };
        const labels: Record<string, string> = {
          high: '高',
          medium: '中',
          low: '低',
        };
        return <Tag color={colors[p]}>{labels[p]}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => openTransition(record.id)}
          >
            流转
          </Button>
          <Dropdown menu={{ items: getStatusMenuItems(record) }} trigger={['click']}>
            <Button type="link" size="small">
              更多
            </Button>
          </Dropdown>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalOpen(true)}
          >
            新建线索
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleScanGaps}>
            扫描异常
          </Button>
        </Space>
        <Space>
          <Search
            placeholder="搜索企业/联系人/电话"
            allowClear
            enterButton={<SearchOutlined />}
            size="middle"
            style={{ width: 320 }}
            onSearch={handleSearch}
            className="high-frequency-input"
          />
        </Space>
      </div>

      <div className="quick-filter-bar">
        {quickFilters.map((filter) => (
          <Tag
            key={filter.key}
            className={`quick-filter-tag ${
              activeQuickFilter === filter.key ? 'quick-filter-tag-active' : ''
            }`}
            onClick={() => handleQuickFilter(filter.key)}
            style={{ padding: '4px 12px', fontSize: 13 }}
          >
            {filter.icon} {filter.label}
            {filter.key === 'exception' && (
              <Badge
                count={leads.filter((l) => l.hasException).length}
                size="small"
                style={{ marginLeft: 4 }}
              />
            )}
          </Tag>
        ))}
      </div>

      <Table
        columns={columns}
        dataSource={leads}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total: totalLeads,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (p) => setPage(p),
        }}
        scroll={{ x: 1400 }}
        size="small"
        rowClassName={(record) => {
          let cls = `lead-row-${record.priority}`;
          if (record.hasException) cls += ' lead-row-exception';
          return cls;
        }}
      />

      <Modal
        title="新建招商线索"
        open={createModalOpen}
        onOk={handleCreateLead}
        onCancel={() => {
          setCreateModalOpen(false);
          createForm.resetFields();
        }}
        width={600}
        okText="创建"
        cancelText="取消"
      >
        <Form
          form={createForm}
          layout="vertical"
          className="high-frequency-input"
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="companyName"
              label="企业名称"
              rules={[{ required: true, message: '请输入企业名称' }]}
            >
              <Input placeholder="请输入企业名称" autoFocus />
            </Form.Item>
            <Form.Item
              name="industry"
              label="所属行业"
            >
              <Select placeholder="请选择行业">
                <Option value="电子信息">电子信息</Option>
                <Option value="智能制造">智能制造</Option>
                <Option value="生物医药">生物医药</Option>
                <Option value="新能源">新能源</Option>
                <Option value="新材料">新材料</Option>
                <Option value="其他">其他</Option>
              </Select>
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="contactPerson"
              label="联系人"
              rules={[{ required: true, message: '请输入联系人' }]}
            >
              <Input placeholder="请输入联系人姓名" />
            </Form.Item>
            <Form.Item
              name="contactPhone"
              label="联系电话"
              rules={[{ required: true, message: '请输入联系电话' }]}
            >
              <Input placeholder="请输入联系电话" />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="requiredArea" label="需求面积(㎡)">
              <InputNumber style={{ width: '100%' }} placeholder="请输入需求面积" min={0} />
            </Form.Item>
            <Form.Item name="budget" label="预算(万元)">
              <InputNumber style={{ width: '100%' }} placeholder="请输入预算金额" min={0} />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="sourceType"
              label="来源类型"
              rules={[{ required: true, message: '请选择来源类型' }]}
            >
              <Select placeholder="请选择来源类型">
                <Option value="old_ledger">旧台账</Option>
                <Option value="site_record">现场记录</Option>
                <Option value="chat_screenshot">沟通截图</Option>
                <Option value="other">其他</Option>
              </Select>
            </Form.Item>
            <Form.Item name="priority" label="优先级">
              <Select placeholder="请选择优先级" defaultValue="medium">
                <Option value="high">高</Option>
                <Option value="medium">中</Option>
                <Option value="low">低</Option>
              </Select>
            </Form.Item>
          </div>
          <Form.Item name="sourceReference" label="来源参考">
            <Input placeholder="文件编号/截图标识等" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      <StatusTransitionModal
        open={transitionModalOpen}
        leadId={transitionLeadId}
        onClose={() => {
          setTransitionModalOpen(false);
          setTransitionLeadId(null);
        }}
      />

      <Modal
        title="退回线索"
        open={returnModalOpen}
        onOk={handleReturnLead}
        onCancel={() => {
          setReturnModalOpen(false);
          setReturnLeadId(null);
          returnForm.resetFields();
        }}
        okText="确认退回"
        okButtonProps={{ danger: true }}
        cancelText="取消"
      >
        <Form form={returnForm} layout="vertical">
          <Form.Item
            name="reason"
            label="退回原因"
            rules={[{ required: true, message: '请输入退回原因' }]}
          >
            <TextArea rows={4} placeholder="请详细说明退回原因..." />
          </Form.Item>
          <div className="gap-warning">
            <WarningOutlined /> 退回操作将触发状态流转，系统会自动检测是否存在责任空档
          </div>
        </Form>
      </Modal>

      <Modal
        title="重新分配责任人"
        open={reassignModalOpen}
        onOk={handleReassignLead}
        onCancel={() => {
          setReassignModalOpen(false);
          setReassignLeadId(null);
          reassignForm.resetFields();
        }}
        okText="确认分配"
        cancelText="取消"
      >
        <Form form={reassignForm} layout="vertical">
          <Form.Item
            name="responsibleId"
            label="选择责任人"
            rules={[{ required: true, message: '请选择责任人' }]}
          >
            <Select placeholder="请选择新的责任人">
              {users.map((user) => (
                <Option key={user.id} value={user.id}>
                  {user.name} ({ROLE_LABELS[user.role]})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="reason"
            label="分配原因"
            rules={[{ required: true, message: '请输入分配原因' }]}
          >
            <TextArea rows={3} placeholder="请说明重新分配的原因..." />
          </Form.Item>
          <div className="gap-warning">
            <WarningOutlined /> 重新分配将自动修复因空档检测产生的异常
          </div>
        </Form>
      </Modal>

      <Drawer
        title="线索详情"
        placement="right"
        width={800}
        open={detailDrawerOpen}
        onClose={() => {
          setDetailDrawerOpen(false);
          setSelectedLeadId(null);
        }}
      >
        {selectedLeadId && <LeadDetail leadId={selectedLeadId} />}
      </Drawer>
    </div>
  );
}
