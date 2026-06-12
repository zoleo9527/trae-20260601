import { useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, Card, Row, Col, Space, Tooltip, Tabs } from 'antd';
import { PhoneOutlined, MailOutlined, MessageOutlined, FileTextOutlined, EyeOutlined, CheckOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { CollectionRecord, UserRole, Reminder } from '@/types';
import { mockCollectionRecords } from '@/data/mockData';
import { formatCurrency, formatDate } from '@/utils/format';
import { hasPermission } from '@/utils/auth';

interface CollectionPageProps {
  currentUserRole: UserRole;
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

export default function CollectionPage({ currentUserRole }: CollectionPageProps) {
  const [collections, setCollections] = useState<CollectionRecord[]>(mockCollectionRecords);
  const [modalVisible, setModalVisible] = useState(false);
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [viewingItem, setViewingItem] = useState<CollectionRecord | null>(null);
  const [selectedItem, setSelectedItem] = useState<CollectionRecord | null>(null);
  const [selectedRows, setSelectedRows] = useState<React.Key[]>([]);
  const [reminderForm] = Form.useForm();

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
        const today = new Date();
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
      title: '成交备注',
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
            <Button icon={<CheckOutlined />} size="small" type="primary" onClick={() => confirmPayment(record)}>
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

  const confirmPayment = (record: CollectionRecord) => {
    Modal.confirm({
      title: '确认收款',
      content: `确认收到 ${record.bidderName} 的尾款 ${formatCurrency(record.remainingAmount)} 吗？`,
      onOk: () => {
        setCollections(prev => prev.map(c => 
          c.id === record.id ? { 
            ...c, 
            paidAmount: record.totalAmount,
            remainingAmount: 0,
            status: 'paid' as const,
            updatedAt: new Date().toISOString().split('T')[0],
            notes: `${c.notes || ''}\n${new Date().toISOString().split('T')[0]}: 尾款已全部结清`,
          } : c
        ));
      },
    });
  };

  const handleSendReminder = () => {
    reminderForm.validateFields().then(values => {
      if (selectedItem) {
        const newReminder: Reminder = {
          id: `R${Date.now()}`,
          type: values.type as 'call' | 'sms' | 'email' | 'letter',
          content: values.content,
          sentAt: new Date().toISOString().split('T')[0],
          operator: '当前用户',
          result: 'success',
        };

        let newStatus: CollectionRecord['status'] = selectedItem.status;
        if (selectedItem.status === 'pending') {
          newStatus = 'first_reminder';
        } else if (selectedItem.status === 'first_reminder') {
          newStatus = 'second_reminder';
        } else if (selectedItem.status === 'second_reminder') {
          newStatus = 'legal_notice';
        }

        setCollections(prev => prev.map(c => 
          c.id === selectedItem.id ? { 
            ...c, 
            status: newStatus,
            lastRemindAt: new Date().toISOString().split('T')[0],
            reminders: [...c.reminders, newReminder],
            updatedAt: new Date().toISOString().split('T')[0],
          } : c
        ));
      }
      setReminderModalVisible(false);
      reminderForm.resetFields();
    });
  };

  const handleBatchReminder = () => {
    Modal.info({
      title: '批量催收',
      content: `已选择 ${selectedRows.length} 条记录，将向所有选中记录发送催收通知`,
    });
    setSelectedRows([]);
  };

  const pendingCount = collections.filter(c => c.status === 'pending').length;
  const firstReminderCount = collections.filter(c => c.status === 'first_reminder').length;
  const secondReminderCount = collections.filter(c => c.status === 'second_reminder').length;
  const overdueCount = collections.filter(c => {
    const today = new Date();
    const due = new Date(c.dueDate);
    return due < today && c.status !== 'paid';
  }).length;

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>{collections.length}</div>
            <div style={{ fontSize: 12, color: '#666' }}>催收任务总数</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>{pendingCount + firstReminderCount + secondReminderCount}</div>
            <div style={{ fontSize: 12, color: '#666' }}>待催收</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f5222d' }}>{overdueCount}</div>
            <div style={{ fontSize: 12, color: '#666' }}>已逾期</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
              {collections.filter(c => c.status === 'paid').length}
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>已结清</div>
          </Card>
        </Col>
      </Row>

      <Card 
        title="尾款催收管理" 
        extra={
          <div style={{ display: 'flex', gap: 12 }}>
            {selectedRows.length > 0 && (
              <Button icon={<MessageOutlined />} type="primary" onClick={handleBatchReminder}>
                批量催收 ({selectedRows.length})
              </Button>
            )}
          </div>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={collections}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1300 }}
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys: selectedRows,
            onChange: setSelectedRows,
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