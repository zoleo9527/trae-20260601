import React, { useState } from 'react';
import { Table, Tag, Card, Space, Button, Modal, Timeline, Descriptions, Badge, Tooltip, Input, Select, message, Tabs, Avatar, List, Empty, Statistic, Row, Col, Divider } from 'antd';
import { 
  ClockCircleOutlined, 
  EyeOutlined,
  TeamOutlined,
  HistoryOutlined,
  PhoneOutlined,
  StarOutlined,
  CalendarOutlined,
  FileTextOutlined,
  AlertOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type { InstallationOrder } from '../types';
import { useOrderContext } from '../context/OrderContext';

const { Search } = Input;

const dispatchStatusConfig: Record<string, { color: string; text: string; bgColor: string }> = {
  unassigned: { color: 'default', text: '未分配', bgColor: '#f5f5f5' },
  assigned: { color: 'orange', text: '待确认', bgColor: '#fff7e6' },
  accepted: { color: 'blue', text: '已接单', bgColor: '#e6f7ff' },
  rejected: { color: 'red', text: '已拒绝', bgColor: '#fff2f0' },
  completed: { color: 'green', text: '已完成', bgColor: '#f6ffed' }
};

const orderStatusConfig: Record<string, { color: string; text: string; bgColor: string }> = {
  pending: { color: 'default', text: '待调度', bgColor: '#f5f5f5' },
  assigned: { color: 'orange', text: '已分配', bgColor: '#fff7e6' },
  in_progress: { color: 'blue', text: '进行中', bgColor: '#e6f7ff' },
  completed: { color: 'green', text: '已完成', bgColor: '#f6ffed' },
  delayed: { color: 'red', text: '已延期', bgColor: '#fff2f0' }
};

const MasterDispatch: React.FC = () => {
  const { orders, masters, dispatchOrder, batchDispatchOrders } = useOrderContext();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<InstallationOrder | null>(null);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedOrderForAssign, setSelectedOrderForAssign] = useState<InstallationOrder | null>(null);
  const [selectedMaster, setSelectedMaster] = useState<string>();

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch = !searchText || 
      order.customerName.includes(searchText) || 
      order.id.toLowerCase().includes(searchText.toLowerCase()) ||
      order.address.includes(searchText) ||
      (order.assignedMaster && order.assignedMaster.includes(searchText));
    return matchesStatus && matchesSearch;
  });

  const availableMasters = masters.filter(m => m.status === 'available');

  const handleAssign = (order: InstallationOrder) => {
    setSelectedOrderForAssign(order);
    setSelectedMaster(undefined);
    setAssignModalVisible(true);
  };

  const confirmAssign = () => {
    if (!selectedOrderForAssign || !selectedMaster) {
      message.warning('请选择师傅');
      return;
    }
    dispatchOrder(selectedOrderForAssign.id, selectedMaster);
    setAssignModalVisible(false);
    const master = masters.find(m => m.id === selectedMaster);
    message.success(`已成功将订单分配给${master?.name}`);
  };

  const handleBatchAssign = () => {
    const pendingOrderIds = selectedRowKeys.filter(key => 
      orders.find(o => o.id === key && o.status === 'pending')
    ) as string[];
    if (pendingOrderIds.length === 0) {
      message.warning('请选择待调度的订单');
      return;
    }
    batchDispatchOrders(pendingOrderIds);
    setSelectedRowKeys([]);
    message.success(`已批量分配 ${pendingOrderIds.length} 个订单`);
  };

  const showDetail = (order: InstallationOrder) => {
    setCurrentOrder(order);
    setDetailVisible(true);
  };

  const showHistory = (order: InstallationOrder) => {
    setCurrentOrder(order);
    setHistoryVisible(true);
  };

  const getBlockReason = (order: InstallationOrder): React.ReactNode => {
    if (order.status === 'pending') {
      return (
        <Tooltip title="订单等待调度分配师傅">
          <Space style={{ color: '#fa8c16' }}>
            <ClockCircleOutlined />
            <span>待分配师傅</span>
          </Space>
        </Tooltip>
      );
    }
    if (order.status === 'assigned') {
      const dispatch = order.dispatchRecords[order.dispatchRecords.length - 1];
      if (dispatch?.status === 'assigned') {
        return (
          <Tooltip title="师傅尚未确认接单">
            <Space style={{ color: '#1890ff' }}>
              <ClockCircleOutlined />
              <span>等待师傅确认</span>
            </Space>
          </Tooltip>
        );
      }
    }
    if (order.status === 'delayed') {
      const pendingParts = order.partRequests.filter(p => p.status === 'requested');
      if (pendingParts.length > 0) {
        return (
          <Tooltip title={`配件待审批: ${pendingParts.map(p => p.partName).join(', ')}`}>
            <Space style={{ color: '#ff4d4f' }}>
              <AlertOutlined />
              <span>配件待审批 ({pendingParts.length})</span>
            </Space>
          </Tooltip>
        );
      }
    }
    if (order.partRequests.some(p => p.status === 'requested')) {
      return (
        <Tooltip title="有配件申请待审批">
          <Space style={{ color: '#fa8c16' }}>
            <AlertOutlined />
            <span>配件待审批</span>
          </Space>
        </Tooltip>
      );
    }
    return '-';
  };

  const getLastStatusChange = (order: InstallationOrder) => {
    if (order.statusHistory.length === 0) return null;
    return order.statusHistory[order.statusHistory.length - 1];
  };

  const stats = {
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    assignedOrders: orders.filter(o => o.status === 'assigned').length,
    inProgressOrders: orders.filter(o => o.status === 'in_progress').length,
    delayedOrders: orders.filter(o => o.status === 'delayed').length,
    availableMasters: availableMasters.length,
    pendingParts: orders.reduce((acc, o) => acc + o.partRequests.filter(p => p.status === 'requested').length, 0)
  };

  const columns: ColumnsType<InstallationOrder> = [
    {
      title: '订单号',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id: string) => (
        <a onClick={() => showDetail(orders.find(o => o.id === id)!)} style={{ fontWeight: 500 }}>
          {id}
        </a>
      )
    },
    {
      title: '客户信息',
      key: 'customer',
      width: 180,
      render: (_: unknown, record) => (
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
      key: 'product',
      width: 160,
      render: (_: unknown, record) => (
        <Space direction="vertical" size={0}>
          <span>{record.productType}</span>
          <span style={{ color: '#666', fontSize: 12 }}>{record.productModel}</span>
        </Space>
      )
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config = orderStatusConfig[status];
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
      title: '派工状态',
      key: 'dispatchStatus',
      width: 100,
      render: (_: unknown, record) => {
        if (!record.assignedMaster) {
          return <span style={{ color: '#999' }}>未分配</span>;
        }
        const dispatch = record.dispatchRecords[record.dispatchRecords.length - 1];
        if (dispatch) {
          const config = dispatchStatusConfig[dispatch.status];
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
        return '-';
      }
    },
    {
      title: '师傅',
      key: 'master',
      width: 120,
      render: (_: unknown, record) => (
        record.assignedMaster ? (
          <Space>
            <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>
              {record.assignedMaster[0]}
            </Avatar>
            <span>{record.assignedMaster}</span>
          </Space>
        ) : <span style={{ color: '#999' }}>未分配</span>
      )
    },
    {
      title: '调度员',
      dataIndex: 'dispatcher',
      key: 'dispatcher',
      width: 100,
      render: (dispatcher: string) => dispatcher || '-'
    },
    {
      title: '售后处理人',
      dataIndex: 'afterSaleHandler',
      key: 'afterSaleHandler',
      width: 120,
      render: (handler: string) => handler || '-'
    },
    {
      title: '卡点说明',
      key: 'blockInfo',
      width: 160,
      render: (_: unknown, record) => getBlockReason(record)
    },
    {
      title: '最后操作',
      key: 'lastAction',
      width: 180,
      render: (_: unknown, record) => {
        const lastChange = getLastStatusChange(record);
        if (!lastChange) return '-';
        return (
          <Tooltip title={`${lastChange.operator} (${lastChange.operatorRole})`}>
            <Space direction="vertical" size={0}>
              <span style={{ fontSize: 12, color: '#666' }}>{lastChange.operator}</span>
              <span style={{ fontSize: 11, color: '#999' }}>
                <ClockCircleOutlined style={{ marginRight: 4 }} />
                {dayjs(lastChange.timestamp).format('MM-DD HH:mm')}
              </span>
            </Space>
          </Tooltip>
        );
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_: unknown, record) => (
        <Space>
          <Button 
            type="link" 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => showDetail(record)}
          >
            详情
          </Button>
          <Button 
            type="link" 
            size="small" 
            icon={<HistoryOutlined />}
            onClick={() => showHistory(record)}
          >
            回看
          </Button>
          {record.status === 'pending' && (
            <Button 
              type="primary" 
              size="small" 
              icon={<TeamOutlined />}
              onClick={() => handleAssign(record)}
            >
              分配
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
            <TeamOutlined style={{ fontSize: 20 }} />
            <span style={{ fontSize: 18, fontWeight: 500 }}>师傅派工管理</span>
          </Space>
        }
        extra={
          <Space>
            <Badge count={stats.pendingOrders} color="#faad14">
              <Button type="primary" onClick={handleBatchAssign}>
                <TeamOutlined style={{ marginRight: 4 }} />
                批量分配
              </Button>
            </Badge>
          </Space>
        }
      >
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={4}>
            <Card size="small" style={{ borderRadius: 8 }}>
              <Statistic 
                title="待调度" 
                value={stats.pendingOrders}
                valueStyle={{ color: '#faad14' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small" style={{ borderRadius: 8 }}>
              <Statistic 
                title="已分配" 
                value={stats.assignedOrders}
                valueStyle={{ color: '#1890ff' }}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small" style={{ borderRadius: 8 }}>
              <Statistic 
                title="进行中" 
                value={stats.inProgressOrders}
                valueStyle={{ color: '#52c41a' }}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small" style={{ borderRadius: 8 }}>
              <Statistic 
                title="已延期" 
                value={stats.delayedOrders}
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<AlertOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small" style={{ borderRadius: 8 }}>
              <Statistic 
                title="可用师傅" 
                value={stats.availableMasters}
                suffix={`/ ${masters.length}`}
                prefix={<EyeOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small" style={{ borderRadius: 8 }}>
              <Statistic 
                title="配件待审批" 
                value={stats.pendingParts}
                valueStyle={{ color: '#fa8c16' }}
                prefix={<AlertOutlined />}
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
              { value: 'pending', label: '待调度' },
              { value: 'assigned', label: '已分配' },
              { value: 'in_progress', label: '进行中' },
              { value: 'completed', label: '已完成' },
              { value: 'delayed', label: '已延期' }
            ]}
          />
          <Search
            placeholder="搜索订单号/客户/地址/师傅"
            allowClear
            style={{ width: 300 }}
            onSearch={setSearchText}
            onChange={e => setSearchText(e.target.value)}
          />
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredOrders}
          scroll={{ x: 1600 }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            getCheckboxProps: (record) => ({
              disabled: record.status !== 'pending'
            }),
            selections: [
              {
                key: 'pending',
                text: '全选待调度',
                onSelect: (allKeys) => {
                  setSelectedRowKeys(allKeys.filter(key => 
                    orders.find(o => o.id === key && o.status === 'pending')
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
        title="订单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={900}
        destroyOnClose
      >
        {currentOrder && (
          <Tabs
            items={[
              {
                key: 'basic',
                label: '基本信息',
                children: (
                  <div>
                    <Descriptions bordered column={2} size="small">
                      <Descriptions.Item label="订单号">
                        <span style={{ fontWeight: 600, color: '#1890ff' }}>{currentOrder.id}</span>
                      </Descriptions.Item>
                      <Descriptions.Item label="状态">
                        <span style={{ 
                          display: 'inline-block', 
                          padding: '4px 12px', 
                          borderRadius: 4,
                          backgroundColor: orderStatusConfig[currentOrder.status].bgColor,
                          color: orderStatusConfig[currentOrder.status].color
                        }}>
                          {orderStatusConfig[currentOrder.status].text}
                        </span>
                      </Descriptions.Item>
                      <Descriptions.Item label="客户姓名">{currentOrder.customerName}</Descriptions.Item>
                      <Descriptions.Item label="联系电话">
                        <a href={`tel:${currentOrder.customerPhone}`}>{currentOrder.customerPhone}</a>
                      </Descriptions.Item>
                      <Descriptions.Item label="地址" span={2}>{currentOrder.address}</Descriptions.Item>
                      <Descriptions.Item label="产品类型">{currentOrder.productType}</Descriptions.Item>
                      <Descriptions.Item label="产品型号">{currentOrder.productModel}</Descriptions.Item>
                      <Descriptions.Item label="调度员">
                        {currentOrder.dispatcher ? (
                          <Space>
                            <EyeOutlined />
                            <span>{currentOrder.dispatcher}</span>
                          </Space>
                        ) : '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="安装师傅">
                        {currentOrder.assignedMaster ? (
                          <Space>
                            <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>
                              {currentOrder.assignedMaster[0]}
                            </Avatar>
                            <span>{currentOrder.assignedMaster}</span>
                          </Space>
                        ) : '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="售后处理人">
                        {currentOrder.afterSaleHandler || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="售后状态">
                        {currentOrder.afterSaleStatus ? (
                          <Tag color={currentOrder.afterSaleStatus === 'processing' ? 'blue' : 'green'}>
                            {currentOrder.afterSaleStatus === 'processing' ? '处理中' : '已解决'}
                          </Tag>
                        ) : '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="创建时间">
                        {dayjs(currentOrder.createTime).format('YYYY-MM-DD HH:mm:ss')}
                      </Descriptions.Item>
                      <Descriptions.Item label="预约时间">
                        {currentOrder.scheduledTime ? dayjs(currentOrder.scheduledTime).format('YYYY-MM-DD HH:mm:ss') : '-'}
                      </Descriptions.Item>
                      {currentOrder.completeTime && (
                        <Descriptions.Item label="完成时间">
                          {dayjs(currentOrder.completeTime).format('YYYY-MM-DD HH:mm:ss')}
                        </Descriptions.Item>
                      )}
                      {currentOrder.remark && (
                        <Descriptions.Item label="备注" span={2}>{currentOrder.remark}</Descriptions.Item>
                      )}
                    </Descriptions>

                    <Card title="配件领用状态" size="small" style={{ marginTop: 16 }}>
                      {currentOrder.partRequests.length > 0 ? (
                        <Table
                          size="small"
                          dataSource={currentOrder.partRequests}
                          rowKey="id"
                          columns={[
                            { title: '配件名称', dataIndex: 'partName', key: 'partName' },
                            { title: '配件编号', dataIndex: 'partCode', key: 'partCode' },
                            { title: '数量', dataIndex: 'quantity', key: 'quantity' },
                            { 
                              title: '状态', 
                              dataIndex: 'status', 
                              key: 'status',
                              render: (status: string) => {
                                const config: Record<string, { color: string; text: string }> = {
                                  requested: { color: 'orange', text: '待审批' },
                                  approved: { color: 'blue', text: '已批准' },
                                  picked: { color: 'cyan', text: '已领取' },
                                  installed: { color: 'green', text: '已安装' }
                                };
                                return <Tag color={config[status].color}>{config[status].text}</Tag>;
                              }
                            },
                            { title: '申请人', dataIndex: 'requester', key: 'requester' },
                            { title: '当前处理', dataIndex: 'currentHandler', key: 'currentHandler' },
                            { title: '备注', dataIndex: 'remark', key: 'remark' }
                          ]}
                          pagination={false}
                        />
                      ) : (
                        <Empty description="暂无配件领用" />
                      )}
                    </Card>

                    {currentOrder.status !== 'completed' && (
                      <Card title="未完成原因分析" size="small" style={{ marginTop: 16, borderColor: '#faad14', borderStyle: 'solid' }}>
                        <Tag color="orange">订单未完成</Tag>
                        <div style={{ marginTop: 8 }}>
                          {(() => {
                            const block = getBlockReason(currentOrder);
                            if (block) {
                              return (
                                <div>
                                  <p><strong>当前卡点:</strong> {block}</p>
                                  {currentOrder.partRequests.some(p => p.status === 'requested') && (
                                    <p><strong>待审批配件:</strong> {currentOrder.partRequests.filter(p => p.status === 'requested').map(p => p.partName).join(', ')}</p>
                                  )}
                                </div>
                              );
                            }
                            return '订单正在处理中';
                          })()}
                        </div>
                      </Card>
                    )}
                  </div>
                )
              },
              {
                key: 'dispatch',
                label: '派工记录',
                children: currentOrder.dispatchRecords.length > 0 ? (
                  <List
                    dataSource={currentOrder.dispatchRecords}
                    renderItem={(item, index) => (
                      <Card 
                        key={item.id} 
                        title={`派工记录 #${index + 1}`} 
                        size="small" 
                        style={{ marginBottom: 16 }}
                      >
                        <Descriptions column={4} size="small">
                          <Descriptions.Item label="师傅">
                            <Space>
                              <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>
                                {item.masterName[0]}
                              </Avatar>
                              <span>{item.masterName}</span>
                            </Space>
                          </Descriptions.Item>
                          <Descriptions.Item label="状态">
                            <span style={{ 
                              display: 'inline-block', 
                              padding: '4px 12px', 
                              borderRadius: 4,
                              backgroundColor: dispatchStatusConfig[item.status].bgColor,
                              color: dispatchStatusConfig[item.status].color
                            }}>
                              {dispatchStatusConfig[item.status].text}
                            </span>
                          </Descriptions.Item>
                          <Descriptions.Item label="派工时间">
                            {dayjs(item.dispatchTime).format('YYYY-MM-DD HH:mm:ss')}
                          </Descriptions.Item>
                          <Descriptions.Item label="接单时间">
                            {item.acceptTime ? dayjs(item.acceptTime).format('YYYY-MM-DD HH:mm:ss') : '-'}
                          </Descriptions.Item>
                        </Descriptions>
                        {item.remark && (
                          <div style={{ marginTop: 8, padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                            <span style={{ color: '#666', fontSize: 12 }}>{item.remark}</span>
                          </div>
                        )}
                      </Card>
                    )}
                  />
                ) : <Empty description="暂无派工记录" />
              },
              {
                key: 'timeline',
                label: '状态变更时间线',
                children: (
                  <Timeline
                    mode="left"
                    items={[
                      ...currentOrder.statusHistory.map(item => ({
                        color: item.toStatus === 'completed' ? 'green' : item.toStatus === 'delayed' ? 'red' : 'blue',
                        children: (
                          <div>
                            <div style={{ fontWeight: 500, marginBottom: 4 }}>
                              <Space>
                                <span style={{ 
                                  display: 'inline-block', 
                                  padding: '4px 12px', 
                                  borderRadius: 4,
                                  backgroundColor: orderStatusConfig[item.toStatus]?.bgColor || '#f5f5f5',
                                  color: orderStatusConfig[item.toStatus]?.color || '#666'
                                }}>
                                  {orderStatusConfig[item.toStatus]?.text || item.toStatus}
                                </span>
                                <span style={{ fontSize: 12, color: '#999' }}>
                                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                                  {dayjs(item.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                                </span>
                              </Space>
                            </div>
                            <div style={{ color: '#666', marginBottom: 4 }}>
                              <EyeOutlined style={{ marginRight: 4 }} />
                              <span>{item.operator}</span>
                              <Tag style={{ marginLeft: 8, fontSize: 10 }}>{item.operatorRole}</Tag>
                            </div>
                            {item.remark && (
                              <div style={{ color: '#666', fontSize: 13, padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                                <span style={{ fontWeight: 500 }}>备注:</span> {item.remark}
                              </div>
                            )}
                          </div>
                        )
                      }))
                    ]}
                  />
                )
              }
            ]}
          />
        )}
      </Modal>

      <Modal
        title="派工回看"
        open={historyVisible}
        onCancel={() => setHistoryVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        {currentOrder && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Row align="middle" justify="space-between">
                <Space>
                  <span style={{ fontSize: 16, fontWeight: 600 }}>{currentOrder.id}</span>
                  <span style={{ color: '#666' }}>- {currentOrder.customerName}</span>
                  <span style={{ 
                    display: 'inline-block', 
                    padding: '4px 12px', 
                    borderRadius: 4,
                    backgroundColor: orderStatusConfig[currentOrder.status].bgColor,
                    color: orderStatusConfig[currentOrder.status].color
                  }}>
                    {orderStatusConfig[currentOrder.status].text}
                  </span>
                </Space>
                <Button type="link" icon={<CalendarOutlined />} onClick={() => showDetail(currentOrder)}>
                  查看完整详情
                </Button>
              </Row>
            </Card>

            <Card title="订单状态变迁" size="small" style={{ marginBottom: 16 }}>
              <Timeline
                mode="left"
                items={currentOrder.statusHistory.map((item) => ({
                  color: item.toStatus === 'completed' ? 'green' : item.toStatus === 'delayed' ? 'red' : 'blue',
                  label: (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 500, color: '#666' }}>
                        {orderStatusConfig[item.toStatus]?.text || item.toStatus}
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
                          backgroundColor: item.operatorRole === '调度员' ? '#1890ff' :
                                          item.operatorRole === '安装师傅' ? '#52c41a' : '#999'
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

            {currentOrder.dispatchRecords.length > 0 && (
              <Card title="派工记录详情" size="small">
                <Divider style={{ margin: '12px 0' }} />
                {currentOrder.dispatchRecords.map((dispatch, dIndex) => (
                  <div key={dispatch.id}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                      <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>
                        {dispatch.masterName[0]}
                      </Avatar>
                      <span style={{ marginLeft: 8, fontWeight: 500 }}>{dispatch.masterName}</span>
                      <span style={{ marginLeft: 8, fontSize: 12, color: '#666' }}>
                        派工时间: {dayjs(dispatch.dispatchTime).format('MM-DD HH:mm')}
                      </span>
                    </div>
                    <Timeline
                      mode="left"
                      items={dispatch.statusHistory.map((item) => ({
                        color: item.toStatus === 'completed' ? 'green' : item.toStatus === 'rejected' ? 'red' : 'blue',
                        label: (
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 500, color: '#666', fontSize: 12 }}>
                              {dispatchStatusConfig[item.toStatus]?.text || item.toStatus}
                            </div>
                            <div style={{ fontSize: 10, color: '#999' }}>
                              {dayjs(item.timestamp).format('MM-DD HH:mm')}
                            </div>
                          </div>
                        ),
                        children: (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                              <Avatar size="small" style={{ 
                                backgroundColor: item.operatorRole === '调度员' ? '#1890ff' :
                                                item.operatorRole === '安装师傅' ? '#52c41a' : '#999'
                              }}>
                                {item.operator[0]}
                              </Avatar>
                              <span style={{ marginLeft: 8 }}>{item.operator}</span>
                              <Tag style={{ marginLeft: 8, fontSize: 10 }}>{item.operatorRole}</Tag>
                            </div>
                            {item.remark && (
                              <div style={{ color: '#666', fontSize: 12, padding: 6, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                                {item.remark}
                              </div>
                            )}
                          </div>
                        )
                      }))}
                    />
                    {dIndex < currentOrder.dispatchRecords.length - 1 && (
                      <Divider style={{ margin: '16px 0' }} />
                    )}
                  </div>
                ))}
              </Card>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="分配师傅"
        open={assignModalVisible}
        onCancel={() => setAssignModalVisible(false)}
        onOk={confirmAssign}
        okText="确认分配"
        cancelText="取消"
        width={600}
      >
        {selectedOrderForAssign && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="订单号">
                  <span style={{ fontWeight: 600 }}>{selectedOrderForAssign.id}</span>
                </Descriptions.Item>
                <Descriptions.Item label="客户">{selectedOrderForAssign.customerName}</Descriptions.Item>
                <Descriptions.Item label="产品">{selectedOrderForAssign.productType}</Descriptions.Item>
                <Descriptions.Item label="型号">{selectedOrderForAssign.productModel}</Descriptions.Item>
              </Descriptions>
            </Card>

            <div style={{ marginBottom: 8, fontWeight: 500 }}>选择师傅:</div>
            <Select
              style={{ width: '100%' }}
              placeholder="请选择师傅"
              value={selectedMaster}
              onChange={setSelectedMaster}
              showSearch
              optionFilterProp="children"
            >
              {availableMasters.map(master => (
                <Select.Option key={master.id} value={master.id}>
                  <Space>
                    <Avatar size="small" style={{ backgroundColor: '#52c41a' }}>
                      {master.name[0]}
                    </Avatar>
                    <span>{master.name}</span>
                    <Tag style={{ marginLeft: 8 }} color="green">空闲</Tag>
                    <Tag style={{ marginLeft: 8 }}>
                      {master.rating} <StarOutlined />
                    </Tag>
                  </Space>
                  <div style={{ marginTop: 4, paddingLeft: 32, color: '#666', fontSize: 12 }}>
                    技能: {master.skills.join(', ')}
                  </div>
                </Select.Option>
              ))}
            </Select>
            {availableMasters.length === 0 && (
              <div style={{ color: '#ff4d4f', marginTop: 8, padding: 12, backgroundColor: '#fff2f0', borderRadius: 4 }}>
                <AlertOutlined style={{ marginRight: 8 }} />
                当前没有可用师傅，请等待师傅完成当前任务
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MasterDispatch;
