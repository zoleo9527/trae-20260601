import React, { useState } from 'react';
import { Table, Tag, Card, Space, Button, Modal, Timeline, Descriptions, Badge, Input, Select, message, Tabs, List, Avatar, Comment } from 'antd';
import { 
  CustomerServiceOutlined, 
  ClockCircleOutlined, 
  UserOutlined, 
  CheckCircleOutlined,
  EyeOutlined,
  MessageOutlined,
  PhoneOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type { InstallationOrder } from '../types';
import { useOrderContext } from '../context/OrderContext';

const { Search } = Input;
const { TextArea } = Input;

const orderStatusConfig: Record<string, { color: string; text: string }> = {
  pending: { color: 'default', text: '待调度' },
  assigned: { color: 'orange', text: '已分配' },
  in_progress: { color: 'blue', text: '进行中' },
  completed: { color: 'green', text: '已完成' },
  delayed: { color: 'red', text: '已延期' }
};

interface Communication {
  id: string;
  type: 'customer' | 'handler' | 'system';
  content: string;
  operator: string;
  timestamp: string;
}

interface AfterSaleRecord {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  productType: string;
  issue: string;
  status: 'pending' | 'processing' | 'resolved';
  handler?: string;
  createTime: string;
  updateTime: string;
  communications: Communication[];
}

const mockAfterSaleRecords: AfterSaleRecord[] = [
  {
    id: 'AS001',
    orderId: 'ORD001',
    customerName: '陈先生',
    customerPhone: '13900139001',
    productType: '智能马桶',
    issue: '客户反馈安装后马桶有轻微晃动，需要师傅上门检查',
    status: 'processing',
    handler: '客服小美',
    createTime: '2024-01-17T16:00:00Z',
    updateTime: '2024-01-17T17:30:00Z',
    communications: [
      {
        id: 'C001',
        type: 'customer',
        content: '安装后马桶有点晃动，不太放心',
        operator: '陈先生',
        timestamp: '2024-01-17T16:00:00Z'
      },
      {
        id: 'C002',
        type: 'handler',
        content: '已记录问题，正在联系师傅安排上门检查',
        operator: '客服小美',
        timestamp: '2024-01-17T16:15:00Z'
      },
      {
        id: 'C003',
        type: 'handler',
        content: '已联系李师傅，预计明天上午上门',
        operator: '客服小美',
        timestamp: '2024-01-17T17:30:00Z'
      }
    ]
  },
  {
    id: 'AS002',
    orderId: 'ORD005',
    customerName: '吴先生',
    customerPhone: '13900139005',
    productType: '整体卫浴',
    issue: '混水阀漏水导致安装延期，客户催促配件到位时间',
    status: 'processing',
    handler: '客服小美',
    createTime: '2024-01-16T17:00:00Z',
    updateTime: '2024-01-17T10:00:00Z',
    communications: [
      {
        id: 'C004',
        type: 'customer',
        content: '配件什么时候能到？已经等了一天了',
        operator: '吴先生',
        timestamp: '2024-01-16T17:00:00Z'
      },
      {
        id: 'C005',
        type: 'handler',
        content: '正在协调仓库，配件预计明天到货',
        operator: '客服小美',
        timestamp: '2024-01-16T17:30:00Z'
      },
      {
        id: 'C006',
        type: 'system',
        content: '配件申请已提交审批',
        operator: '系统',
        timestamp: '2024-01-16T18:00:00Z'
      },
      {
        id: 'C007',
        type: 'handler',
        content: '配件已到货，已通知师傅领取',
        operator: '客服小美',
        timestamp: '2024-01-17T10:00:00Z'
      }
    ]
  }
];

const AfterSaleService: React.FC = () => {
  const { orders } = useOrderContext();
  const [records, setRecords] = useState<AfterSaleRecord[]>(mockAfterSaleRecords);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<AfterSaleRecord | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [replyContent, setReplyContent] = useState('');

  const filteredRecords = records.filter(record => {
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesSearch = !searchText || 
      record.customerName.includes(searchText) || 
      record.orderId.toLowerCase().includes(searchText.toLowerCase()) ||
      record.issue.includes(searchText);
    return matchesStatus && matchesSearch;
  });

  const handleViewDetail = (record: AfterSaleRecord) => {
    setCurrentRecord(record);
    setDetailVisible(true);
    setReplyContent('');
  };

  const handleReply = () => {
    if (!currentRecord || !replyContent.trim()) {
      message.warning('请输入回复内容');
      return;
    }

    const newCommunication: Communication = {
      id: `C-${Date.now()}`,
      type: 'handler',
      content: replyContent,
      operator: '客服小美',
      timestamp: new Date().toISOString()
    };

    setRecords(prev => prev.map(r => {
      if (r.id === currentRecord.id) {
        return {
          ...r,
          updateTime: new Date().toISOString(),
          communications: [...r.communications, newCommunication]
        };
      }
      return r;
    }));

    setCurrentRecord(prev => prev ? {
      ...prev,
      communications: [...prev.communications, newCommunication]
    } : null);
    
    setReplyContent('');
    message.success('回复成功');
  };

  const handleResolve = (recordId: string) => {
    setRecords(prev => prev.map(r => {
      if (r.id === recordId) {
        return {
          ...r,
          status: 'resolved' as const,
          updateTime: new Date().toISOString(),
          communications: [...r.communications, {
            id: `C-${Date.now()}`,
            type: 'system' as const,
            content: '售后问题已解决',
            operator: '系统',
            timestamp: new Date().toISOString()
          }]
        };
      }
      return r;
    }));
    message.success('已标记为已解决');
    setDetailVisible(false);
  };

  const handleBatchResolve = () => {
    const processingRecords = selectedRowKeys.filter(key => 
      records.find(r => r.id === key && r.status === 'processing')
    );
    if (processingRecords.length === 0) {
      message.warning('请选择处理中的记录');
      return;
    }

    setRecords(prev => prev.map(r => {
      if (selectedRowKeys.includes(r.id) && r.status === 'processing') {
        return {
          ...r,
          status: 'resolved' as const,
          updateTime: new Date().toISOString()
        };
      }
      return r;
    }));

    setSelectedRowKeys([]);
    message.success(`已批量解决 ${processingRecords.length} 条售后记录`);
  };

  const statusConfig: Record<string, { color: string; text: string }> = {
    pending: { color: 'orange', text: '待处理' },
    processing: { color: 'blue', text: '处理中' },
    resolved: { color: 'green', text: '已解决' }
  };

  const columns: ColumnsType<AfterSaleRecord> = [
    {
      title: '售后单号',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id: string) => <a>{id}</a>
    },
    {
      title: '关联订单',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 100,
      render: (orderId: string) => <a>{orderId}</a>
    },
    {
      title: '客户信息',
      key: 'customer',
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 500 }}>{record.customerName}</span>
          <span style={{ color: '#666', fontSize: 12 }}>
            <PhoneOutlined style={{ marginRight: 4 }} />
            {record.customerPhone}
          </span>
        </Space>
      )
    },
    {
      title: '产品',
      dataIndex: 'productType',
      key: 'productType',
      width: 100
    },
    {
      title: '问题描述',
      dataIndex: 'issue',
      key: 'issue',
      width: 250,
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config = statusConfig[status];
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '处理人',
      dataIndex: 'handler',
      key: 'handler',
      width: 100,
      render: (handler: string) => handler ? (
        <Space>
          <UserOutlined />
          <span>{handler}</span>
        </Space>
      ) : '-'
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      width: 140,
      render: (time: string) => dayjs(time).format('MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.status === 'processing' && (
            <Button 
              type="link" 
              size="small" 
              icon={<CheckCircleOutlined />}
              onClick={() => handleResolve(record.id)}
            >
              解决
            </Button>
          )}
        </Space>
      )
    }
  ];

  const relatedOrder = currentRecord ? orders.find(o => o.id === currentRecord.orderId) : null;

  return (
    <div style={{ padding: 24 }}>
      <Card 
        title={
          <Space>
            <CustomerServiceOutlined />
            <span>售后客服处理</span>
          </Space>
        }
        extra={
          <Space>
            <Badge count={records.filter(r => r.status === 'processing').length}>
              <Button type="primary" onClick={handleBatchResolve}>
                批量解决
              </Button>
            </Badge>
          </Space>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Space size="middle">
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 120 }}
              options={[
                { value: 'all', label: '全部状态' },
                { value: 'pending', label: '待处理' },
                { value: 'processing', label: '处理中' },
                { value: 'resolved', label: '已解决' }
              ]}
            />
            <Search
              placeholder="搜索客户/订单号/问题描述"
              allowClear
              style={{ width: 280 }}
              onSearch={setSearchText}
              onChange={e => setSearchText(e.target.value)}
            />
          </Space>
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredRecords}
          scroll={{ x: 1200 }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            getCheckboxProps: (record) => ({
              disabled: record.status !== 'processing'
            })
          }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>

      <Modal
        title="售后详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={900}
      >
        {currentRecord && (
          <Tabs
            items={[
              {
                key: 'info',
                label: '基本信息',
                children: (
                  <div>
                    <Descriptions bordered column={2} size="small">
                      <Descriptions.Item label="售后单号">{currentRecord.id}</Descriptions.Item>
                      <Descriptions.Item label="状态">
                        <Tag color={statusConfig[currentRecord.status].color}>
                          {statusConfig[currentRecord.status].text}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="关联订单">{currentRecord.orderId}</Descriptions.Item>
                      <Descriptions.Item label="产品">{currentRecord.productType}</Descriptions.Item>
                      <Descriptions.Item label="客户">{currentRecord.customerName}</Descriptions.Item>
                      <Descriptions.Item label="电话">{currentRecord.customerPhone}</Descriptions.Item>
                      <Descriptions.Item label="处理人">{currentRecord.handler || '-'}</Descriptions.Item>
                      <Descriptions.Item label="创建时间">
                        {dayjs(currentRecord.createTime).format('YYYY-MM-DD HH:mm:ss')}
                      </Descriptions.Item>
                      <Descriptions.Item label="问题描述" span={2}>
                        {currentRecord.issue}
                      </Descriptions.Item>
                    </Descriptions>

                    {relatedOrder && (
                      <Card title="关联订单信息" size="small" style={{ marginTop: 16 }}>
                        <Descriptions column={2} size="small">
                          <Descriptions.Item label="订单状态">
                            <Tag color={orderStatusConfig[relatedOrder.status].color}>
                              {orderStatusConfig[relatedOrder.status].text}
                            </Tag>
                          </Descriptions.Item>
                          <Descriptions.Item label="安装师傅">{relatedOrder.assignedMaster || '-'}</Descriptions.Item>
                          <Descriptions.Item label="调度员">{relatedOrder.dispatcher || '-'}</Descriptions.Item>
                          <Descriptions.Item label="地址">{relatedOrder.address}</Descriptions.Item>
                        </Descriptions>
                        
                        {relatedOrder.partRequests.length > 0 && (
                          <div style={{ marginTop: 8 }}>
                            <div style={{ fontWeight: 500, marginBottom: 8 }}>配件领用状态:</div>
                            <Space wrap>
                              {relatedOrder.partRequests.map(part => (
                                <Tag key={part.id} color={
                                  part.status === 'requested' ? 'orange' :
                                  part.status === 'approved' ? 'blue' :
                                  part.status === 'picked' ? 'cyan' : 'green'
                                }>
                                  {part.partName} - {
                                    part.status === 'requested' ? '待审批' :
                                    part.status === 'approved' ? '已批准' :
                                    part.status === 'picked' ? '已领取' : '已安装'
                                  }
                                </Tag>
                              ))}
                            </Space>
                          </div>
                        )}

                        {relatedOrder.statusHistory.length > 0 && (
                          <div style={{ marginTop: 12 }}>
                            <div style={{ fontWeight: 500, marginBottom: 8 }}>最近状态变更:</div>
                            <div style={{ padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                              {(() => {
                                const lastChange = relatedOrder.statusHistory[relatedOrder.statusHistory.length - 1];
                                return (
                                  <div>
                                    <div style={{ color: '#666' }}>
                                      <UserOutlined style={{ marginRight: 4 }} />
                                      <span>{lastChange.operator}</span>
                                      <span style={{ marginLeft: 8 }}>({lastChange.operatorRole})</span>
                                    </div>
                                    <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                                      <ClockCircleOutlined style={{ marginRight: 4 }} />
                                      {dayjs(lastChange.timestamp).format('MM-DD HH:mm')}
                                    </div>
                                    {lastChange.remark && (
                                      <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
                                        {lastChange.remark}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        )}
                      </Card>
                    )}
                  </div>
                )
              },
              {
                key: 'communication',
                label: '沟通记录',
                children: (
                  <div>
                    <List
                      dataSource={currentRecord.communications}
                      renderItem={item => (
                        <List.Item>
                          <Comment
                            author={
                              <Space>
                                <span style={{ fontWeight: 500 }}>{item.operator}</span>
                                {item.type === 'system' && <Tag color="purple">系统</Tag>}
                                {item.type === 'customer' && <Tag color="orange">客户</Tag>}
                                {item.type === 'handler' && <Tag color="blue">客服</Tag>}
                              </Space>
                            }
                            datetime={dayjs(item.timestamp).format('MM-DD HH:mm:ss')}
                            content={item.content}
                            avatar={
                              <Avatar style={{ 
                                backgroundColor: 
                                  item.type === 'system' ? '#722ed1' :
                                  item.type === 'customer' ? '#fa8c16' : '#1890ff'
                              }}>
                                {item.operator[0]}
                              </Avatar>
                            }
                          />
                        </List.Item>
                      )}
                    />
                    <Card size="small" style={{ marginTop: 16 }}>
                      <TextArea
                        placeholder="输入回复内容..."
                        rows={3}
                        value={replyContent}
                        onChange={e => setReplyContent(e.target.value)}
                      />
                      <div style={{ marginTop: 8, textAlign: 'right' }}>
                        <Space>
                          <Button onClick={() => setReplyContent('')}>清空</Button>
                          <Button type="primary" icon={<MessageOutlined />} onClick={handleReply}>
                            回复
                          </Button>
                          {currentRecord.status === 'processing' && (
                            <Button type="primary" danger icon={<CheckCircleOutlined />} onClick={() => handleResolve(currentRecord.id)}>
                              标记解决
                            </Button>
                          )}
                        </Space>
                      </div>
                    </Card>
                  </div>
                )
              },
              {
                key: 'timeline',
                label: '处理时间线',
                children: (
                  <Timeline
                    items={currentRecord.communications.map(item => ({
                      color: item.type === 'system' ? 'purple' : item.type === 'customer' ? 'orange' : 'blue',
                      children: (
                        <div>
                          <div style={{ fontWeight: 500, marginBottom: 4 }}>
                            <Space>
                              {item.operator}
                              {item.type === 'system' && <Tag color="purple">系统</Tag>}
                              {item.type === 'customer' && <Tag color="orange">客户</Tag>}
                              {item.type === 'handler' && <Tag color="blue">客服</Tag>}
                            </Space>
                          </div>
                          <div style={{ color: '#666', marginBottom: 4 }}>{item.content}</div>
                          <div style={{ color: '#999', fontSize: 12 }}>
                            <ClockCircleOutlined style={{ marginRight: 4 }} />
                            {dayjs(item.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                          </div>
                        </div>
                      )
                    }))}
                  />
                )
              }
            ]}
          />
        )}
      </Modal>
    </div>
  );
};

export default AfterSaleService;
