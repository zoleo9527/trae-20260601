import { useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, Card, Row, Col, Progress, Space, Tooltip, Popconfirm, Checkbox, Empty } from 'antd';
import { EditOutlined, CheckOutlined, EyeOutlined, PlusOutlined, FilterOutlined, XOutlined } from '@ant-design/icons';
import type { Confirmation, UserRole, DepositRecord } from '@/types';
import { StoreActions, ConfirmationFilter, filterConfirmations } from '@/store/useStore';
import { mockDepositRecords } from '@/data/mockData';
import { formatCurrency } from '@/utils/format';
import { hasPermission } from '@/utils/auth';

interface ConfirmationPageProps {
  currentUserRole: UserRole;
  confirmations: Confirmation[];
  actions: StoreActions;
}

const statusColors: Record<string, string> = {
  pending: 'orange',
  confirmed: 'blue',
  deposit_paid: 'cyan',
  deposit_refunded: 'gray',
  dispute: 'red',
  completed: 'green',
  cancelled: 'gray',
};

const statusLabels: Record<string, string> = {
  pending: '待处理',
  confirmed: '已确认',
  deposit_paid: '保证金已付',
  deposit_refunded: '保证金已退',
  dispute: '存在争议',
  completed: '已完成',
  cancelled: '已取消',
};

const filterLabels: Record<ConfirmationFilter, string> = {
  all: '全部',
  pending: '待处理成交',
  dispute: '待处理争议',
  incomplete: '资料待补正',
  confirmed: '待确认完成',
  deposit_pending: '保证金待到账',
  deposit_refunding: '保证金退款中',
};

export default function ConfirmationPage({ currentUserRole, confirmations, actions }: ConfirmationPageProps) {
  const [depositRecords] = useState<DepositRecord[]>(mockDepositRecords);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Confirmation | null>(null);
  const [selectedRows, setSelectedRows] = useState<React.Key[]>([]);
  const [form] = Form.useForm();
  const [filter, setFilter] = useState<ConfirmationFilter>('all');

  const pendingCount = confirmations.filter(c => c.status === 'pending').length;
  const incompleteCount = confirmations.filter(c => 
    !c.dataCompleteness.subjectData || 
    !c.dataCompleteness.bidderQualification || 
    !c.dataCompleteness.contractSigned || 
    !c.dataCompleteness.otherDocuments
  ).length;
  const disputeCount = confirmations.filter(c => c.status === 'dispute').length;
  const confirmedCount = confirmations.filter(c => c.status === 'confirmed').length;
  const depositPendingCount = confirmations.filter(c => {
    const deposit = depositRecords.find(d => d.bidId === c.id);
    return deposit?.status === 'pending';
  }).length;
  const depositRefundingCount = confirmations.filter(c => {
    const deposit = depositRecords.find(d => d.bidId === c.id);
    return deposit?.status === 'refunding';
  }).length;

  const filteredConfirmations = filterConfirmations(confirmations, filter, depositRecords);
  const isFiltered = filter !== 'all';
  const filteredCount = filteredConfirmations.length;

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
      dataIndex: 'bidderName',
      key: 'bidderName',
      width: 100,
    },
    {
      title: '成交金额',
      dataIndex: 'bidAmount',
      key: 'bidAmount',
      width: 120,
      render: (amount: number) => formatCurrency(amount),
    },
    {
      title: '保证金',
      dataIndex: 'depositAmount',
      key: 'depositAmount',
      width: 100,
      render: (amount: number, record: Confirmation) => {
        const deposit = depositRecords.find(d => d.bidId === record.id);
        const status = deposit?.status ?? 'pending';
        return (
          <div>
            <div>{formatCurrency(amount)}</div>
            <Tag color={status === 'paid' ? 'green' : status === 'refunding' ? 'orange' : status === 'refunded' ? 'gray' : 'red'}>
              {status === 'paid' ? '已到账' : status === 'refunding' ? '退款中' : status === 'refunded' ? '已退还' : '待支付'}
            </Tag>
          </div>
        );
      },
    },
    {
      title: '尾款金额',
      dataIndex: 'balanceAmount',
      key: 'balanceAmount',
      width: 120,
      render: (amount: number) => formatCurrency(amount),
    },
    {
      title: '资料完整性',
      dataIndex: 'dataCompleteness',
      key: 'dataCompleteness',
      width: 150,
      render: (completeness: Confirmation['dataCompleteness']) => {
        const total = 4;
        const completed = Object.values(completeness).filter(Boolean).length;
        const percent = Math.round((completed / total) * 100);
        return (
          <div>
            <Progress percent={percent} size="small" strokeColor={percent === 100 ? '#52c41a' : '#1890ff'} />
            <span style={{ fontSize: 12, color: '#666' }}>{completed}/{total}</span>
          </div>
        );
      },
    },
    {
      title: '状态',
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
      render: (_: unknown, record: Confirmation) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small" onClick={() => viewDetail(record)}>
            查看
          </Button>
          {(hasPermission(currentUserRole, 'confirmation_edit') || hasPermission(currentUserRole, 'confirmation_audit')) && (
            <Button icon={<EditOutlined />} size="small" onClick={() => editRecord(record)}>
              编辑
            </Button>
          )}
          {record.status === 'confirmed' && hasPermission(currentUserRole, 'confirmation_edit') && (
            <Button icon={<CheckOutlined />} size="small" type="primary" onClick={() => actions.confirmCompletion(record.id)}>
              确认完成
            </Button>
          )}
          {record.status === 'dispute' && hasPermission(currentUserRole, 'confirmation_audit') && (
            <Popconfirm
              title="确认解决争议？"
              onConfirm={() => actions.resolveDispute(record.id)}
            >
              <Button icon={<CheckOutlined />} size="small" danger={false} style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: '#fff' }}>
                解决争议
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const viewDetail = (record: Confirmation) => {
    setEditingItem(record);
    form.setFieldsValue({
      notes: record.notes,
      status: record.status,
      ...record.dataCompleteness,
    });
    setModalVisible(true);
  };

  const editRecord = (record: Confirmation) => {
    setEditingItem(record);
    form.setFieldsValue({
      notes: record.notes,
      status: record.status,
      ...record.dataCompleteness,
    });
    setModalVisible(true);
  };

  const handleSave = () => {
    form.validateFields().then(values => {
      if (editingItem) {
        actions.updateConfirmation(editingItem.id, {
          notes: values.notes,
          status: values.status as Confirmation['status'],
          dataCompleteness: {
            subjectData: values.subjectData,
            bidderQualification: values.bidderQualification,
            contractSigned: values.contractSigned,
            otherDocuments: values.otherDocuments,
          },
        });
      }
      setModalVisible(false);
      form.resetFields();
    });
  };

  const handleBatchAction = () => {
    const ids = selectedRows.map(id => String(id)) as string[];
    actions.batchConfirm(ids);
    setSelectedRows([]);
  };

  const handleCardClick = (cardFilter: ConfirmationFilter) => {
    setFilter(cardFilter);
  };

  const handleClearFilter = () => {
    setFilter('all');
    setSelectedRows([]);
  };

  const renderRoleSpecificCards = () => {
    if (currentUserRole === 'project_manager') {
      return (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card 
              hoverable 
              style={{ borderLeft: '4px solid #1890ff', cursor: 'pointer', background: filter === 'pending' ? '#e6f7ff' : undefined }}
              onClick={() => handleCardClick('pending')}
            >
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>{pendingCount}</div>
              <div style={{ fontSize: 12, color: '#666' }}>待处理成交</div>
            </Card>
          </Col>
          <Col span={6}>
            <Card 
              hoverable 
              style={{ borderLeft: '4px solid #faad14', cursor: 'pointer', background: filter === 'incomplete' ? '#fffbe6' : undefined }}
              onClick={() => handleCardClick('incomplete')}
            >
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>{incompleteCount}</div>
              <div style={{ fontSize: 12, color: '#666' }}>资料待补正</div>
            </Card>
          </Col>
          <Col span={6}>
            <Card 
              hoverable 
              style={{ borderLeft: '4px solid #52c41a', cursor: 'pointer', background: filter === 'confirmed' ? '#f6ffed' : undefined }}
              onClick={() => handleCardClick('confirmed')}
            >
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>{confirmedCount}</div>
              <div style={{ fontSize: 12, color: '#666' }}>待确认完成</div>
            </Card>
          </Col>
          <Col span={6}>
            <Card 
              hoverable
              style={{ cursor: 'pointer', background: filter === 'all' ? '#f5f5f5' : undefined }}
              onClick={() => handleCardClick('all')}
            >
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>{confirmations.length}</div>
              <div style={{ fontSize: 12, color: '#666' }}>成交确认总数</div>
            </Card>
          </Col>
        </Row>
      );
    }

    if (currentUserRole === 'reviewer') {
      return (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card 
              hoverable 
              style={{ borderLeft: '4px solid #f5222d', cursor: 'pointer', background: filter === 'dispute' ? '#fff1f0' : undefined }}
              onClick={() => handleCardClick('dispute')}
            >
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f5222d' }}>{disputeCount}</div>
              <div style={{ fontSize: 12, color: '#666' }}>待处理争议</div>
            </Card>
          </Col>
          <Col span={6}>
            <Card 
              hoverable 
              style={{ borderLeft: '4px solid #faad14', cursor: 'pointer', background: filter === 'incomplete' ? '#fffbe6' : undefined }}
              onClick={() => handleCardClick('incomplete')}
            >
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>{incompleteCount}</div>
              <div style={{ fontSize: 12, color: '#666' }}>资格待审核</div>
            </Card>
          </Col>
          <Col span={6}>
            <Card 
              hoverable
              style={{ cursor: 'pointer', background: filter === 'all' ? '#f5f5f5' : undefined }}
              onClick={() => handleCardClick('all')}
            >
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>{confirmations.length}</div>
              <div style={{ fontSize: 12, color: '#666' }}>成交确认总数</div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                {confirmations.filter(c => c.status === 'completed').length}
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>已完成</div>
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
              style={{ borderLeft: '4px solid #1890ff', cursor: 'pointer', background: filter === 'deposit_pending' ? '#e6f7ff' : undefined }}
              onClick={() => handleCardClick('deposit_pending')}
            >
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>{depositPendingCount}</div>
              <div style={{ fontSize: 12, color: '#666' }}>保证金待到账</div>
            </Card>
          </Col>
          <Col span={6}>
            <Card 
              hoverable 
              style={{ borderLeft: '4px solid #faad14', cursor: 'pointer', background: filter === 'deposit_refunding' ? '#fffbe6' : undefined }}
              onClick={() => handleCardClick('deposit_refunding')}
            >
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>{depositRefundingCount}</div>
              <div style={{ fontSize: 12, color: '#666' }}>保证金退款中</div>
            </Card>
          </Col>
          <Col span={6}>
            <Card 
              hoverable
              style={{ cursor: 'pointer', background: filter === 'all' ? '#f5f5f5' : undefined }}
              onClick={() => handleCardClick('all')}
            >
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>{confirmations.length}</div>
              <div style={{ fontSize: 12, color: '#666' }}>成交确认总数</div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                {confirmations.filter(c => c.status === 'completed').length}
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>已完成</div>
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
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>{confirmations.length}</div>
            <div style={{ fontSize: 12, color: '#666' }}>成交确认总数</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card 
            hoverable 
            style={{ borderLeft: '4px solid #faad14', cursor: 'pointer', background: filter === 'incomplete' ? '#fffbe6' : undefined }}
            onClick={() => handleCardClick('incomplete')}
          >
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>{incompleteCount}</div>
            <div style={{ fontSize: 12, color: '#666' }}>资料待补正</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card 
            hoverable 
            style={{ borderLeft: '4px solid #f5222d', cursor: 'pointer', background: filter === 'dispute' ? '#fff1f0' : undefined }}
            onClick={() => handleCardClick('dispute')}
          >
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f5222d' }}>{disputeCount}</div>
            <div style={{ fontSize: 12, color: '#666' }}>资格争议</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
              {confirmations.filter(c => c.status === 'completed').length}
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>已完成</div>
          </Card>
        </Col>
      </Row>
    );
  };

  return (
    <div>
      {renderRoleSpecificCards()}

      <Card 
        title="成交确认管理" 
        extra={
          <div style={{ display: 'flex', gap: 12 }}>
            {hasPermission(currentUserRole, 'confirmation_edit') && (
              <Button icon={<PlusOutlined />} type="primary">
                新增成交确认
              </Button>
            )}
            {selectedRows.length > 0 && (
              <Button icon={<CheckOutlined />} type="primary" onClick={handleBatchAction}>
                批量确认 ({selectedRows.length})
              </Button>
            )}
          </div>
        }
      >
        {isFiltered && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FilterOutlined style={{ color: '#1890ff' }} />
              <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{filterLabels[filter]}</span>
              <span>共 {filteredCount} 条记录</span>
            </div>
            <Button 
              icon={<XOutlined />} 
              onClick={handleClearFilter}
              style={{ marginLeft: 'auto' }}
            >
              清除筛选
            </Button>
          </div>
        )}

        {filteredCount === 0 ? (
          <Empty 
            description={
              <div>
                <p>当前筛选条件「{isFiltered ? filterLabels[filter] : '全部'}」下暂无数据</p>
                {isFiltered && (
                  <Button type="primary" onClick={handleClearFilter}>
                    查看全部数据
                  </Button>
                )}
              </div>
            }
          />
        ) : (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={filteredConfirmations}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1200 }}
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys: selectedRows,
              onChange: setSelectedRows,
            }}
          />
        )}
      </Card>

      <Modal
        title={editingItem ? '编辑成交确认' : '新增成交确认'}
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={handleSave}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="状态" name="status">
            <Select>
              <Select.Option value="pending">待处理</Select.Option>
              <Select.Option value="confirmed">已确认</Select.Option>
              <Select.Option value="deposit_paid">保证金已付</Select.Option>
              <Select.Option value="deposit_refunded">保证金已退</Select.Option>
              <Select.Option value="dispute">存在争议</Select.Option>
              <Select.Option value="completed">已完成</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item label="资料完整性">
            <Row gutter={12}>
              <Col span={6}>
                <Form.Item name="subjectData" valuePropName="checked" noStyle>
                  <Checkbox>标的资料</Checkbox>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="bidderQualification" valuePropName="checked" noStyle>
                  <Checkbox>竞买资格</Checkbox>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="contractSigned" valuePropName="checked" noStyle>
                  <Checkbox>合同签署</Checkbox>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="otherDocuments" valuePropName="checked" noStyle>
                  <Checkbox>其他材料</Checkbox>
                </Form.Item>
              </Col>
            </Row>
          </Form.Item>

          <Form.Item label="备注" name="notes">
            <Input.TextArea rows={4} placeholder="输入备注信息，该备注将被尾款催收继承" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}