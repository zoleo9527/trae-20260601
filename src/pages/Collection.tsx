import { useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, Card, Row, Col, Space, Tooltip, Tabs } from 'antd';
import { PhoneOutlined, MailOutlined, MessageOutlined, FileTextOutlined, EyeOutlined, CheckOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { CollectionRecord, UserRole } from '@/types';
import { StoreActions, CollectionFilter, filterCollections, countSelectableCollections } from '@/store/useStore';
import { formatCurrency, formatDate } from '@/utils/format';
import { hasPermission } from '@/utils/auth';

interface CollectionPageProps {
  currentUserRole: UserRole;
  collections: CollectionRecord[];
  actions: StoreActions;
}

const statusColors: Record<string, string> = {
  pending: 'gray',
  first_reminder: 'blue',
  second_reminder: 'orange',
  legal_notice: 'red',
  paid: 'green',
  overdue: 'red',
};

const statusLabels: Record<string, string> = {
  pending: '待催收',
  first_reminder: '首次催收',
  second_reminder: '二次催收',
  legal_notice: '法务通知',
  paid: '已结清',
  overdue: '已逾期',
};

const reminderTypeLabels: Record<string, string> = {
  call: '电话',
  sms: '短信',
  email: '邮件',
  letter: '信函',
};

const reminderTypeIcons: Record<string, React.ReactNode> = {
  call: <PhoneOutlined />,
  sms: <MessageOutlined />,
  email: <MailOutlined />,
  letter: <FileTextOutlined />,
};

export default function CollectionPage({ currentUserRole, collections, actions }: CollectionPageProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [viewingItem, setViewingItem] = useState<CollectionRecord | null>(null);
  const [selectedItem, setSelectedItem] = useState<CollectionRecord | null>(null);
  const [selectedRows, setSelectedRows] = useState<React.Key[]>([]);
  const [reminderForm] = Form.useForm();
  const [filter, setFilter] = useState<CollectionFilter>('all');

  const today = new Date();
  const pendingCount = collections.filter(c => c.status === 'pending').length;
  const firstReminderCount = collections.filter(c => c.status === 'first_reminder').length;
  const secondReminderCount = collections.filter(c => c.status === 'second_reminder').length;
  const overdueCount = collections.filter(c => {
    const due = new Date(c.dueDate);
    return due < today && c.status !== 'paid';
  }).length;
  const unpaidCount = collections.filter(c => c.status !== 'paid' && c.remainingAmount > 0).length;
  const unpaidTotal = collections.filter(c => c.status !== 'paid').reduce((sum, c) => sum + c.remainingAmount, 0);

  const filteredCollections = filterCollections(collections, filter);
  const selectableCollections = collections.filter(c => c.status !== 'paid');
  const batchReminderCount = countSelectableCollections(selectedRows.map(id => String(id)), collections);

  const columns = [
    {
      title: '标的编号',
      dataIndex: 'subjectCode',
      key: 'subjectCode',
      width: 140,
      fixed: 'left' as const,
    },
    {
      title: '标的名称',
      dataIndex: 'subjectName',
      key: 'subjectName',
      ellipsis: true,
      width: 250,
    },
    {
      title: '竞买人',
      key: 'bidderInfo',
      width: 150,
      render: (_: unknown, record: CollectionRecord) => (
        <div>
          <div>{record.bidderName}</div>
          <div style={{ fontSize: 12, color: '#666' }}>{record.bidderPhone}</div>
        </div>
      ),
    },
    {
      title: '成交金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      render: (amount: number) => formatCurrency(amount),
    },
    {
      title: '已付金额',
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      width: 120,
      render: (amount: number) => formatCurrency(amount),
    },
    {
      title: '待收金额',
      dataIndex: 'remainingAmount',
      key: 'remainingAmount',
      width: 120,
      render: (amount: number) => (
        <span style={{ color: amount > 0 ? '#f5222d' : '#52c41a', fontWeight: 'bold' }}>
          {formatCurrency(amount)}
        </span>
      ),
    },
    {
      title: '到期日期',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 100,
      render: (date: string) => {
        const due = new Date(date);
        const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
          return <span style={{ color: '#f5222d' }}>{formatDate(date)} (逾期{Math.abs(diffDays)}天)</span>;
        } else if (diffDays <= 7) {
          return <span style={{ color: '#faad14' }}>{formatDate(date)} ({diffDays}天后到期)</span>;
        }
        return formatDate(date);
      },
    },
    {
      title: '催收状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={statusColors[status]}>
          {statusLabels[status]}
        </Tag>
      ),
    },
    {
      title: '催收次数',
      key: 'reminderCount',
      width: 80,
      render: (_: unknown, record: CollectionRecord) => record.reminders.length,
    },
    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      width: 200,
      render: (notes: string) => (
        <Tooltip title={notes}>
          <span className="ellipsis">{notes || '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (_: unknown, record: CollectionRecord) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small" onClick={() => viewDetail(record)}>
            查看
          </Button>
          {record.status !== 'paid' && hasPermission(currentUserRole, 'collection_edit') && (
            <Button icon={<MessageOutlined />} size="small" onClick={() => sendReminder(record)}>
              发送催收
            </Button>
          )}
          {record.remainingAmount > 0 && hasPermission(currentUserRole, 'payment_confirm') && (
            <Button icon={<CheckOutlined />} size="small" type="primary" onClick={() => actions.confirmPayment(record.id)}>
              确认收款
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const viewDetail = (record: CollectionRecord) => {
    setViewingItem(record);
    setModalVisible(true);
  };

  const sendReminder = (record: CollectionRecord) => {
    setSelectedItem(record);
    reminderForm.setFieldsValue({
      type: 'sms',
      content: `尊敬的${record.bidderName}先生/女士，您于${record.createdAt}竞得的标的尾款${formatCurrency(record.remainingAmount)}请于${record.dueDate}前支付。`,
    });
    setReminderModalVisible(true);
  };

  const handleSendReminder = () => {
    reminderForm.validateFields().then(values => {
      if (selectedItem) {
        actions.sendReminder(selectedItem.id, values.type as 'sms' | 'call' | 'email' | 'letter', values.content, '当前用户');
      }
      setReminderModalVisible(false);
      reminderForm.resetFields();
    });
  };

  const handleBatchReminder = () => {
    const ids = selectableCollections.filter(c => selectedRows.includes(c.id)).map(c => c.id);
    if (ids.length > 0) {
      actions.batchRemind(ids, '当前用户');
    }
    setSelectedRows([]);
  };

  const handleCardClick = (cardFilter: CollectionFilter) => {
    setFilter(cardFilter);
  };

  const handleRowSelectChange = (selectedRowKeys: React.Key[]) => {
    setSelectedRows(selectedRowKeys);
  };

  const renderRoleSpecificCards = () => {
    if (currentUserRole === 'project_manager') {
      return (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card 
              hoverable 
              style={{ borderLeft: '4px solid #faad14', cursor: 'pointer', background: filter === 'pending' ? '#fffbe6' : undefined }}
              onClick={() => handleCardClick('pending')}
            >
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>{pendingCount + firstReminderCount + secondReminderCount}</div>
              <div style={{ fontSize: 12, color: '#666' }}>待催收任务</div>
            </Card>
          </Col>
          <Col span={6}>
            <Card 
              hoverable 
              style={{ borderLeft: '4px solid #f5222d', cursor: 'pointer', background: filter === 'overdue' ? '#fff1f0' : undefined }}
              onClick={() => handleCardClick('overdue')}
            >
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f5222d' }}>{overdueCount}</div>
              <div style={{ fontSize: 12, color: '#666' }}>已逾期</div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>{formatCurrency(unpaidTotal)}</div>
              <div style={{ fontSize: 12, color: '#666' }}>待收总额</div>
            </Card>
          </Col>
          <Col span={6}>
            <Card 
              hoverable
              style={{ cursor: 'pointer', background: filter === 'paid' ? '#f6ffed' : undefined }}
              onClick={() => handleCardClick('paid')}
            >
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                {collections.filter(c => c.status === 'paid').length}
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>已结清</div>
            </Card>
          </Col>
        </Row>
      );
    }

    if (currentUserRole === 'reviewer') {
      return (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>{collections.length}</div>
              <div style={{ fontSize: 12, color: '#666' }}>催收任务总数</div>
            </Card>
          </Col>
          <Col span={6}>
            <Card 
              hoverable 
              style={{ borderLeft: '4px solid #f5222d', cursor: 'pointer', background: filter === 'overdue' ? '#fff1f0' : undefined }}
              onClick={() => handleCardClick('overdue')}
            >
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f5222d' }}>{overdueCount}</div>
              <div style={{ fontSize: 12, color: '#666' }}>已逾期</div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>{formatCurrency(unpaidTotal)}</div>
              <div style={{ fontSize: 12, color: '#666' }}>待收总额</div>
            </Card>
          </Col>
          <Col span={6}>
            <Card 
              hoverable
              style={{ cursor: 'pointer', background: filter === 'paid' ? '#f6ffed' : undefined }}
              onClick={() => handleCardClick('paid')}
            >
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                {collections.filter(c => c.status === 'paid').length}
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>已结清</div>
            </Card>
          </Col>
        </Row>
      );
    }

    if (currentUserRole === 'finance') {
      return (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card 
              hoverable 
              style={{ borderLeft: '4px solid #f5222d', cursor: 'pointer', background: filter === 'overdue' ? '#fff1f0' : undefined }}
              onClick={() => handleCardClick('overdue')}
            >
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f5222d' }}>{overdueCount}</div>
              <div style={{ fontSize: 12, color: '#666' }}>逾期催收</div>
            </Card>
          </Col>
          <Col span={6}>
            <Card 
              hoverable
              style={{ borderLeft: '4px solid #52c41a', cursor: 'pointer', background: filter === 'unpaid' ? '#f6ffed' : undefined }}
              onClick={() => handleCardClick('unpaid')}
            >
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                {unpaidCount}
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>待确认收款</div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>{formatCurrency(unpaidTotal)}</div>
              <div style={{ fontSize: 12, color: '#666' }}>待收总额</div>
            </Card>
          </Col>
          <Col span={6}>
            <Card 
              hoverable
              style={{ cursor: 'pointer', background: filter === 'paid' ? '#f6ffed' : undefined }}
              onClick={() => handleCardClick('paid')}
            >
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                {collections.filter(c => c.status === 'paid').length}
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>已结清</div>
            </Card>
          </Col>
        </Row>
      );
    }

    return (
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card 
            hoverable
            style={{ cursor: 'pointer', background: filter === 'all' ? '#f5f5f5' : undefined }}
            onClick={() => handleCardClick('all')}
          >
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>{collections.length}</div>
            <div style={{ fontSize: 12, color: '#666' }}>催收任务总数</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card 
            hoverable 
            style={{ borderLeft: '4px solid #faad14', cursor: 'pointer', background: filter === 'pending' ? '#fffbe6' : undefined }}
            onClick={() => handleCardClick('pending')}
          >
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>{pendingCount + firstReminderCount + secondReminderCount}</div>
            <div style={{ fontSize: 12, color: '#666' }}>待催收</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card 
            hoverable 
            style={{ borderLeft: '4px solid #f5222d', cursor: 'pointer', background: filter === 'overdue' ? '#fff1f0' : undefined }}
            onClick={() => handleCardClick('overdue')}
          >
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f5222d' }}>{overdueCount}</div>
            <div style={{ fontSize: 12, color: '#666' }}>已逾期</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card 
            hoverable
            style={{ cursor: 'pointer', background: filter === 'paid' ? '#f6ffed' : undefined }}
            onClick={() => handleCardClick('paid')}
          >
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
              {collections.filter(c => c.status === 'paid').length}
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>已结清</div>
          </Card>
        </Col>
      </Row>
    );
  };

  return (
    <div>
      {renderRoleSpecificCards()}

      <Card 
        title="尾款催收管理" 
        extra={
          <div style={{ display: 'flex', gap: 12 }}>
            {filter !== 'all' && (
              <Button onClick={() => setFilter('all')}>清除筛选</Button>
            )}
            {batchReminderCount > 0 && hasPermission(currentUserRole, 'collection_edit') && (
              <Button icon={<MessageOutlined />} type="primary" onClick={handleBatchReminder}>
                批量催收 ({batchReminderCount})
              </Button>
            )}
          </div>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredCollections}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1300 }}
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys: selectedRows,
            onChange: handleRowSelectChange,
            getCheckboxProps: (record: CollectionRecord) => ({
              disabled: record.status === 'paid',
            }),
          }}
        />
      </Card>

      <Modal
        title="催收详情"
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={800}
        footer={null}
      >
        {viewingItem && (
          <Tabs defaultActiveKey="info">
            <Tabs.TabPane tab="基本信息" key="info">
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={8}>
                  <div style={{ fontWeight: 'bold' }}>标的编号</div>
                  <div>{viewingItem.subjectCode}</div>
                </Col>
                <Col span={8}>
                  <div style={{ fontWeight: 'bold' }}>竞买人</div>
                  <div>{viewingItem.bidderName}</div>
                </Col>
                <Col span={8}>
                  <div style={{ fontWeight: 'bold' }}>联系电话</div>
                  <div>{viewingItem.bidderPhone}</div>
                </Col>
              </Row>
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={8}>
                  <div style={{ fontWeight: 'bold' }}>成交金额</div>
                  <div>{formatCurrency(viewingItem.totalAmount)}</div>
                </Col>
                <Col span={8}>
                  <div style={{ fontWeight: 'bold' }}>已付金额</div>
                  <div>{formatCurrency(viewingItem.paidAmount)}</div>
                </Col>
                <Col span={8}>
                  <div style={{ fontWeight: 'bold' }}>待收金额</div>
                  <div style={{ color: viewingItem.remainingAmount > 0 ? '#f5222d' : '#52c41a' }}>
                    {formatCurrency(viewingItem.remainingAmount)}
                  </div>
                </Col>
              </Row>
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={8}>
                  <div style={{ fontWeight: 'bold' }}>到期日期</div>
                  <div>{formatDate(viewingItem.dueDate)}</div>
                </Col>
                <Col span={8}>
                  <div style={{ fontWeight: 'bold' }}>催收状态</div>
                  <Tag color={statusColors[viewingItem.status]}>{statusLabels[viewingItem.status]}</Tag>
                </Col>
                <Col span={8}>
                  <div style={{ fontWeight: 'bold' }}>创建时间</div>
                  <div>{formatDate(viewingItem.createdAt)}</div>
                </Col>
              </Row>
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: 8 }}>备注信息（继承自成交确认）</div>
                <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                  {viewingItem.notes || '无'}
                </div>
              </div>
            </Tabs.TabPane>
            <Tabs.TabPane tab="催收记录" key="reminders">
              {viewingItem.reminders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                  <ClockCircleOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                  <div>暂无催收记录</div>
                </div>
              ) : (
                <div style={{ maxHeight: 400, overflow: 'auto' }}>
                  {viewingItem.reminders.map((reminder, index) => (
                    <Card key={reminder.id} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <div style={{ padding: 8, background: '#1890ff', color: '#fff', borderRadius: 4 }}>
                            {reminderTypeIcons[reminder.type]}
                          </div>
                          <div>
                            <div style={{ display: 'flex', gap: 12 }}>
                              <span style={{ fontWeight: 'bold' }}>第{index + 1}次催收</span>
                              <Tag>{reminderTypeLabels[reminder.type]}</Tag>
                              <Tag color={reminder.result === 'success' ? 'green' : 'red'}>
                                {reminder.result === 'success' ? '成功' : '失败'}
                              </Tag>
                            </div>
                            <div style={{ marginTop: 8, color: '#666' }}>{reminder.content}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', color: '#999', fontSize: 12 }}>
                          <div>{formatDate(reminder.sentAt)}</div>
                          <div>操作人: {reminder.operator}</div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Tabs.TabPane>
          </Tabs>
        )}
      </Modal>

      <Modal
        title="发送催收通知"
        visible={reminderModalVisible}
        onCancel={() => {
          setReminderModalVisible(false);
          reminderForm.resetFields();
        }}
        onOk={handleSendReminder}
        width={600}
      >
        {selectedItem && (
          <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
            <div style={{ fontWeight: 'bold', marginBottom: 8 }}>催收对象</div>
            <div>标的: {selectedItem.subjectCode} - {selectedItem.subjectName}</div>
            <div>竞买人: {selectedItem.bidderName} ({selectedItem.bidderPhone})</div>
            <div>待收金额: <span style={{ color: '#f5222d', fontWeight: 'bold' }}>{formatCurrency(selectedItem.remainingAmount)}</span></div>
          </div>
        )}
        <Form form={reminderForm} layout="vertical">
          <Form.Item label="催收方式" name="type" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="sms">短信</Select.Option>
              <Select.Option value="call">电话</Select.Option>
              <Select.Option value="email">邮件</Select.Option>
              <Select.Option value="letter">信函</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="催收内容" name="content" rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}