import React, { useState } from 'react';
import { Table, Tag, Card, Space, Button, Modal, Timeline, Descriptions, Badge, Tooltip, Input, Select, message, Tabs, Avatar, Statistic, Row, Col } from 'antd';
import { 
  ClockCircleOutlined, 
  UserOutlined, 
  CheckCircleOutlined,
  EyeOutlined,
  AuditOutlined,
  AlertCircleOutlined,
  PackageOutlined,
  TagOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type { PartRequest, InstallationOrder } from '../types';
import { useOrderContext } from '../context/OrderContext';

const { Search } = Input;

const statusConfig: Record<string, { color: string; text: string; bgColor: string }> = {
  requested: { color: 'orange', text: '待审批', bgColor: '#fff7e6' },
  approved: { color: 'blue', text: '已批准', bgColor: '#e6f7ff' },
  picked: { color: 'cyan', text: '已领取', bgColor: '#e6fffb' },
  installed: { color: 'green', text: '已安装', bgColor: '#f6ffed' }
};

interface PartWithOrder extends PartRequest {
  orderInfo: InstallationOrder;
}

const PartManagement: React.FC = () => {
  const { orders, approvePart, batchApproveParts } = useOrderContext();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentPart, setCurrentPart] = useState<PartWithOrder | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchText, setSearchText] = useState('');

  const partsWithOrder: PartWithOrder[] = orders.flatMap(order => 
    order.partRequests.map(pr => ({ ...pr, orderInfo: order }))
  );

  const filteredParts = partsWithOrder.filter(part => {
    const matchesStatus = statusFilter === 'all' || part.status === statusFilter;
    const matchesSearch = !searchText || 
      part.partName.includes(searchText) || 
      part.partCode.includes(searchText) ||
      part.orderInfo.customerName.includes(searchText) ||
      part.orderInfo.id.toLowerCase().includes(searchText.toLowerCase()) ||
      part.requester.includes(searchText);
    return matchesStatus && matchesSearch;
  });

  const handleApprove = (partId: string) => {
    approvePart(partId);
    message.success('配件已批准');
  };

  const handleBatchApprove = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要审批的配件');
      return;
    }
    const requestParts = selectedRowKeys.filter(key => 
      partsWithOrder.find(p => p.id === key && p.status === 'requested')
    ) as string[];
    if (requestParts.length === 0) {
      message.warning('没有可审批的配件');
      return;
    }
    
    batchApproveParts(requestParts);
    setSelectedRowKeys([]);
    message.success(`已批量批准 ${requestParts.length} 个配件申请`);
  };

  const showDetail = (part: PartWithOrder) => {
    setCurrentPart(part);
    setDetailVisible(true);
  };

  const getBlockReason = (part: PartWithOrder): React.ReactNode => {
    if (part.status === 'requested') {
      return (
        <Tooltip title="等待仓库管理员审批">
          <Space style={{ color: '#fa8c16' }}>
            <AlertCircleOutlined />
            <span>待审批</span>
          </Space>
        </Tooltip>
      );
    }
    if (part.status === 'approved') {
      return (
        <Tooltip title="等待师傅领取配件">
          <Space style={{ color: '#1890ff' }}>
            <ClockCircleOutlined />
            <span>等待领取</span>
          </Space>
        </Tooltip>
      );
    }
    if (part.status === 'picked') {
      return (
        <Tooltip title="配件已领取，等待安装">
          <Space style={{ color: '#13c2c2' }}>
            <PackageOutlined />
            <span>已领取</span>
          </Space>
        </Tooltip>
      );
    }
    if (part.remark) {
      return <span style={{ color: '#666' }}>{part.remark}</span>;
    }
    return '-';
  };

  const stats = {
    total: partsWithOrder.length,
    requested: partsWithOrder.filter(p => p.status === 'requested').length,
    approved: partsWithOrder.filter(p => p.status === 'approved').length,
    picked: partsWithOrder.filter(p => p.status === 'picked').length,
    installed: partsWithOrder.filter(p => p.status === 'installed').length
  };

  const columns: ColumnsType<PartWithOrder> = [
    {
      title: '配件信息',
      key: 'partInfo',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 500 }}>{record.partName}</span>
          <span style={{ color: '#666', fontSize: 12 }}>
            <TagOutlined style={{ marginRight: 4 }} />
            {record.partCode}
          </span>
        </Space>
      )
    },
    {
      title: '关联订单',
      key: 'order',
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <a onClick={() => showDetail(record)}>{record.orderId}</a>
          <span style={{ color: '#666', fontSize: 12 }}>{record.orderInfo.customerName}</span>
        </Space>
      )
    },
    {
      title: '产品',
      key: 'product',
      width: 120,
      render: (_, record) => (
        <span style={{ fontSize: 12 }}>{record.orderInfo.productType}</span>
      )
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 60,
      align: 'center',
      render: (quantity: number) => (
        <span style={{ fontWeight: 500, color: '#1890ff' }}>x{quantity}</span>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config = statusConfig[status];
        return (
          <span style={{ 
            display: 'inline-block', 
            padding: '4px 12px', 
            borderRadius: 4,
            backgroundColor: config.bgColor,
            color: config.color 
          }}>
            {config.text}
          </span>
        );
      }
    },
    {
      title: '当前处理人',
      key: 'handler',
      width: 140,
      render: (_, record) => (
        record.currentHandler ? (
          <Space>
            <Avatar size="small" style={{ 
              backgroundColor: record.currentHandlerRole === '仓库管理' ? '#fa8c16' : '#52c41a'
            }}>
              {record.currentHandler[0]}
            </Avatar>
            <span>{record.currentHandler}</span>
            <Tag style={{ fontSize: 10 }}>{record.currentHandlerRole}</Tag>
          </Space>
        ) : '-'
      )
    },
    {
      title: '申请人/时间',
      key: 'requester',
      width: 160,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <span>{record.requester}</span>
          <span style={{ color: '#999', fontSize: 11 }}>
            <CalendarOutlined style={{ marginRight: 4 }} />
            {dayjs(record.requestTime).format('MM-DD HH:mm')}
          </span>
        </Space>
      )
    },
    {
      title: '卡点说明',
      key: 'blockInfo',
      width: 160,
      render: (_, record) => getBlockReason(record)
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
            onClick={() => showDetail(record)}
          >
            详情
          </Button>
          {record.status === 'requested' && (
            <Button 
              type="primary" 
              size="small" 
              icon={<CheckCircleOutlined />}
              onClick={() => handleApprove(record.id)}
            >
              审批
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card 
        title={
          <Space>
            <AuditOutlined style={{ fontSize: 20 }} />
            <span style={{ fontSize: 18, fontWeight: 500 }}>配件领用管理</span>
          </Space>
        }
        extra={
          <Space>
            <Badge count={stats.requested} color="#faad14">
              <Button type="primary" onClick={handleBatchApprove}>
                <CheckCircleOutlined style={{ marginRight: 4 }} />
                批量审批
              </Button>
            </Badge>
          </Space>
        }
      >
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={4}>
            <Card size="small" style={{ borderRadius: 8 }}>
              <Statistic 
                title="待审批" 
                value={stats.requested}
                valueStyle={{ color: '#faad14' }}
                prefix={<AlertCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small" style={{ borderRadius: 8 }}>
              <Statistic 
                title="已批准" 
                value={stats.approved}
                valueStyle={{ color: '#1890ff' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small" style={{ borderRadius: 8 }}>
              <Statistic 
                title="已领取" 
                value={stats.picked}
                valueStyle={{ color: '#13c2c2' }}
                prefix={<PackageOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small" style={{ borderRadius: 8 }}>
              <Statistic 
                title="已安装" 
                value={stats.installed}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small" style={{ borderRadius: 8 }}>
              <Statistic 
                title="总申请" 
                value={stats.total}
                prefix={<AuditOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 140 }}
            options={[
              { value: 'all', label: '全部状态' },
              { value: 'requested', label: '待审批' },
              { value: 'approved', label: '已批准' },
              { value: 'picked', label: '已领取' },
              { value: 'installed', label: '已安装' }
            ]}
          />
          <Search
            placeholder="搜索配件名称/编号/订单号/客户"
            allowClear
            style={{ width: 300 }}
            onSearch={setSearchText}
            onChange={e => setSearchText(e.target.value)}
          />
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredParts}
          scroll={{ x: 1300 }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            getCheckboxProps: (record) => ({
              disabled: record.status !== 'requested'
            }),
            selections: [
              {
                key: 'requested',
                text: '全选待审批',
                onSelect: (allKeys) => {
                  setSelectedRowKeys(allKeys.filter(key => 
                    partsWithOrder.find(p => p.id === key && p.status === 'requested')
                  ));
                }
              }
            ]
          }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
          size="middle"
        />
      </Card>

      <Modal
        title="配件详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        {currentPart && (
          <Tabs
            items={[
              {
                key: 'info',
                label: '基本信息',
                children: (
                  <div>
                    <Descriptions bordered column={2} size="small">
                      <Descriptions.Item label="配件名称">
                        <span style={{ fontWeight: 600 }}>{currentPart.partName}</span>
                      </Descriptions.Item>
                      <Descriptions.Item label="配件编号">{currentPart.partCode}</Descriptions.Item>
                      <Descriptions.Item label="数量">
                        <span style={{ fontWeight: 600, color: '#1890ff' }}>x{currentPart.quantity}</span>
                      </Descriptions.Item>
                      <Descriptions.Item label="状态">
                        <span style={{ 
                          display: 'inline-block', 
                          padding: '4px 12px', 
                          borderRadius: 4,
                          backgroundColor: statusConfig[currentPart.status].bgColor,
                          color: statusConfig[currentPart.status].color
                        }}>
                          {statusConfig[currentPart.status].text}
                        </span>
                      </Descriptions.Item>
                      <Descriptions.Item label="申请人">
                        <Space>
                          <Avatar size="small" style={{ backgroundColor: '#52c41a' }}>
                            {currentPart.requester[0]}
                          </Avatar>
                          <span>{currentPart.requester}</span>
                        </Space>
                      </Descriptions.Item>
                      <Descriptions.Item label="申请时间">
                        {dayjs(currentPart.requestTime).format('YYYY-MM-DD HH:mm:ss')}
                      </Descriptions.Item>
                      <Descriptions.Item label="当前处理人">
                        {currentPart.currentHandler ? (
                          <Space>
                            <Avatar size="small" style={{ 
                              backgroundColor: currentPart.currentHandlerRole === '仓库管理' ? '#fa8c16' : '#52c41a'
                            }}>
                              {currentPart.currentHandler[0]}
                            </Avatar>
                            <span>{currentPart.currentHandler}</span>
                            <Tag>{currentPart.currentHandlerRole}</Tag>
                          </Space>
                        ) : '-'}
                      </Descriptions.Item>
                      {currentPart.remark && (
                        <Descriptions.Item label="备注" span={2}>
                          <div style={{ padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                            {currentPart.remark}
                          </div>
                        </Descriptions.Item>
                      )}
                    </Descriptions>

                    <Card title="关联订单信息" size="small" style={{ marginTop: 16 }}>
                      <Descriptions column={2} size="small">
                        <Descriptions.Item label="订单号">
                          <a>{currentPart.orderId}</a>
                        </Descriptions.Item>
                        <Descriptions.Item label="客户">{currentPart.orderInfo.customerName}</Descriptions.Item>
                        <Descriptions.Item label="产品">{currentPart.orderInfo.productType}</Descriptions.Item>
                        <Descriptions.Item label="安装师傅">{currentPart.orderInfo.assignedMaster || '-'}</Descriptions.Item>
                        <Descriptions.Item label="订单状态">
                          <Tag color={
                            currentPart.orderInfo.status === 'completed' ? 'green' :
                            currentPart.orderInfo.status === 'delayed' ? 'red' :
                            currentPart.orderInfo.status === 'in_progress' ? 'blue' :
                            currentPart.orderInfo.status === 'assigned' ? 'orange' : 'default'
                          }>
                            {
                              currentPart.orderInfo.status === 'pending' ? '待调度' :
                              currentPart.orderInfo.status === 'assigned' ? '已分配' :
                              currentPart.orderInfo.status === 'in_progress' ? '进行中' :
                              currentPart.orderInfo.status === 'completed' ? '已完成' : '已延期'
                            }
                          </Tag>
                        </Descriptions.Item>
                        {currentPart.orderInfo.afterSale?.handler && (
                          <Descriptions.Item label="售后处理人">{currentPart.orderInfo.afterSale?.handler}</Descriptions.Item>
                        )}
                      </Descriptions>
                    </Card>
                  </div>
                )
              },
              {
                key: 'history',
                label: '状态变更历史',
                children: (
                  <Card size="small">
                    <Timeline
                      mode="left"
                      items={currentPart.statusHistory.map((item, index) => ({
                        color: item.toStatus === 'installed' ? 'green' : 
                               item.toStatus === 'approved' ? 'blue' : 
                               item.toStatus === 'picked' ? 'cyan' : 'orange',
                        label: (
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 500, color: '#666' }}>
                              {statusConfig[item.toStatus]?.text || item.toStatus}
                            </div>
                            <div style={{ fontSize: 11, color: '#999' }}>
                              {dayjs(item.timestamp).format('MM-DD HH:mm')}
                            </div>
                          </div>
                        ),
                        children: (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                              <Avatar size="small" style={{ 
                                backgroundColor: item.operatorRole === '仓库管理' ? '#fa8c16' : '#52c41a'
                              }}>
                                {item.operator[0]}
                              </Avatar>
                              <span style={{ marginLeft: 8, fontWeight: 500 }}>{item.operator}</span>
                              <Tag style={{ marginLeft: 8 }}>{item.operatorRole}</Tag>
                            </div>
                            {item.remark && (
                              <div style={{ color: '#666', fontSize: 13, padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                                {item.remark}
                              </div>
                            )}
                          </div>
                        )
                      }))}
                    />
                  </Card>
                )
              }
            ]}
          />
        )}
      </Modal>
    </div>
  );
};

export default PartManagement;
