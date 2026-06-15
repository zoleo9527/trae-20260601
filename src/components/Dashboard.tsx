import React, { useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Space, Button, Modal, Timeline, Descriptions, Badge, List, Avatar, Tooltip, Progress, Alert } from 'antd';
import { 
  DashboardOutlined, 
  ClockCircleOutlined, 
  UserOutlined, 
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  TeamOutlined,
  ToolOutlined,
  CustomerServiceOutlined,
  AlertOutlined,
  ArrowRightOutlined,
  EyeOutlined,
  PackageOutlined,
  PhoneOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { InstallationOrder, DashboardStats, Master } from '../types';
import { orders, masters, getDashboardStats } from '../data/mockData';

const statusConfig: Record<string, { color: string; text: string; bgColor: string }> = {
  pending: { color: '#faad14', text: '待调度', bgColor: '#fff7e6' },
  assigned: { color: '#1890ff', text: '已分配', bgColor: '#e6f7ff' },
  in_progress: { color: '#52c41a', text: '进行中', bgColor: '#f6ffed' },
  completed: { color: '#8c8c8c', text: '已完成', bgColor: '#f5f5f5' },
  delayed: { color: '#ff4d4f', text: '已延期', bgColor: '#fff2f0' }
};

const Dashboard: React.FC = () => {
  const [stats] = useState<DashboardStats>(getDashboardStats());
  const [ordersList] = useState<InstallationOrder[]>(orders);
  const [mastersList] = useState<Master[]>(masters);
  const [orderDetailVisible, setOrderDetailVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<InstallationOrder | null>(null);

  const pendingOrders = ordersList.filter(o => o.status === 'pending');
  const delayedOrders = ordersList.filter(o => o.status === 'delayed');
  const inProgressOrders = ordersList.filter(o => o.status === 'in_progress');
  const pendingPartsOrders = ordersList.filter(o => 
    o.partRequests.some(p => p.status === 'requested')
  );
  const afterSaleOrders = ordersList.filter(o => o.afterSaleStatus === 'processing');

  const showOrderDetail = (order: InstallationOrder) => {
    setSelectedOrder(order);
    setOrderDetailVisible(true);
  };

  const getBlockInfo = (order: InstallationOrder): { text: string; color: string; handler: string } | null => {
    if (order.status === 'pending') {
      return { text: '待分配师傅', color: '#faad14', handler: '调度员' };
    }
    if (order.status === 'assigned') {
      const dispatch = order.dispatchRecords[order.dispatchRecords.length - 1];
      if (dispatch?.status === 'assigned') {
        return { text: '等待师傅确认', color: '#1890ff', handler: order.assignedMaster || '师傅' };
      }
    }
    if (order.status === 'delayed') {
      const pendingParts = order.partRequests.filter(p => p.status === 'requested');
      if (pendingParts.length > 0) {
        return { text: `配件待审批(${pendingParts.length})`, color: '#ff4d4f', handler: '仓库管理员' };
      }
    }
    if (order.partRequests.some(p => p.status === 'requested')) {
      return { text: '有配件待审批', color: '#fa8c16', handler: '仓库管理员' };
    }
    return null;
  };

  const completedRate = Math.round((stats.completedOrders / stats.totalOrders) * 100);

  const columns = [
    {
      title: '订单号',
      dataIndex: 'id',
      key: 'id',
      width: 90,
      render: (id: string) => (
        <a onClick={() => showOrderDetail(ordersList.find(o => o.id === id)!)} style={{ fontWeight: 500 }}>
          {id}
        </a>
      )
    },
    {
      title: '客户',
      key: 'customer',
      width: 100,
      render: (_, record: InstallationOrder) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 500 }}>{record.customerName}</span>
          <span style={{ color: '#666', fontSize: 11 }}>
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
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
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
      title: '师傅',
      key: 'master',
      width: 80,
      render: (_, record: InstallationOrder) => record.assignedMaster || '-'
    },
    {
      title: '卡点',
      key: 'block',
      width: 140,
      render: (_, record: InstallationOrder) => {
        const block = getBlockInfo(record);
        if (!block) return '-';
        return (
          <Tooltip title={`当前处理人: ${block.handler}`}>
            <span style={{ color: block.color }}>{block.text}</span>
          </Tooltip>
        );
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 130,
      render: (time: string) => dayjs(time).format('MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record: InstallationOrder) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => showOrderDetail(record)}>
          查看
        </Button>
      )
    }
  ];

  const statCards = [
    { title: '总订单数', value: stats.totalOrders, icon: DashboardOutlined, color: '#1890ff' },
    { title: '待调度', value: stats.pendingOrders, icon: ClockCircleOutlined, color: '#faad14', badge: true },
    { title: '进行中', value: stats.inProgressOrders, icon: ToolOutlined, color: '#52c41a' },
    { title: '已延期', value: stats.delayedOrders, icon: ExclamationCircleOutlined, color: '#ff4d4f', badge: true },
    { title: '配件待审批', value: stats.pendingParts, icon: AlertOutlined, color: '#fa8c16', badge: true },
    { title: '可用师傅', value: `${stats.unassignedMasters} / ${mastersList.length}`, icon: TeamOutlined, color: '#722ed1' }
  ];

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              {statCards.map((stat, index) => (
                <Col key={index} span={4}>
                  <Card size="small" style={{ borderRadius: 8 }}>
                    <Statistic 
                      title={stat.title} 
                      value={stat.value}
                      valueStyle={{ color: stat.color }}
                      prefix={<stat.icon />}
                    />
                    {stat.badge && stat.value > 0 && (
                      <Badge 
                        count={stat.value} 
                        color={stat.color} 
                        style={{ position: 'absolute', top: 8, right: 8 }}
                      />
                    )}
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        <Col span={16}>
          <Card 
            title={
              <Space>
                <AlertOutlined style={{ color: '#ff4d4f' }} />
                <span>需要关注的订单</span>
              </Space>
            }
          >
            <Row gutter={16}>
              <Col span={12}>
                <Card 
                  size="small" 
                  title={
                    <Space>
                      <ClockCircleOutlined style={{ color: '#faad14' }} />
                      <span>待调度</span>
                      <Badge count={pendingOrders.length} color="#faad14" />
                    </Space>
                  }
                  style={{ marginBottom: 16 }}
                >
                  {pendingOrders.length > 0 ? (
                    <List
                      size="small"
                      dataSource={pendingOrders.slice(0, 3)}
                      renderItem={item => (
                        <List.Item
                          actions={[<Button type="link" size="small" onClick={() => showOrderDetail(item)}>详情</Button>]}
                        >
                          <List.Item.Meta
                            avatar={<Avatar style={{ backgroundColor: '#faad14' }}>{item.customerName[0]}</Avatar>}
                            title={<Space>{item.id} <Tag color="orange">{item.productType}</Tag></Space>}
                            description={
                              <Space split={<ArrowRightOutlined />}>
                                <span>{item.customerName}</span>
                                <span style={{ color: '#999' }}>{dayjs(item.createTime).format('MM-DD HH:mm')}</span>
                              </Space>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Empty description="暂无待调度订单" />
                  )}
                </Card>
              </Col>
              <Col span={12}>
                <Card 
                  size="small" 
                  title={
                    <Space>
                      <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                      <span>已延期</span>
                      <Badge count={delayedOrders.length} color="#ff4d4f" />
                    </Space>
                  }
                  style={{ marginBottom: 16 }}
                >
                  {delayedOrders.length > 0 ? (
                    <List
                      size="small"
                      dataSource={delayedOrders.slice(0, 3)}
                      renderItem={item => {
                        const block = getBlockInfo(item);
                        return (
                          <List.Item
                            actions={[<Button type="link" size="small" onClick={() => showOrderDetail(item)}>详情</Button>]}
                          >
                            <List.Item.Meta
                              avatar={<Avatar style={{ backgroundColor: '#ff4d4f' }}>{item.customerName[0]}</Avatar>}
                              title={<Space>{item.id} <Tag color="red">{item.productType}</Tag></Space>}
                              description={
                                <Space split={<ArrowRightOutlined />}>
                                  <span>{item.customerName}</span>
                                  <span style={{ color: '#ff4d4f' }}>{block?.text || '-'}</span>
                                </Space>
                              }
                            />
                          </List.Item>
                        );
                      }}
                    />
                  ) : (
                    <Empty description="暂无延期订单" />
                  )}
                </Card>
              </Col>
            </Row>

            <Card 
              size="small" 
              title={
                <Space>
                  <PackageOutlined style={{ color: '#fa8c16' }} />
                  <span>配件待审批</span>
                  <Badge count={pendingPartsOrders.length} color="#fa8c16" />
                </Space>
              }
              style={{ marginTop: 16 }}
            >
              {pendingPartsOrders.length > 0 ? (
                <List
                  size="small"
                  dataSource={pendingPartsOrders.slice(0, 3)}
                  renderItem={item => {
                    const pendingParts = item.partRequests.filter(p => p.status === 'requested');
                    return (
                      <List.Item
                        actions={[<Button type="link" size="small" onClick={() => showOrderDetail(item)}>详情</Button>]}
                      >
                        <List.Item.Meta
                          avatar={<Avatar style={{ backgroundColor: '#fa8c16' }}>{item.customerName[0]}</Avatar>}
                          title={<Space>{item.id} <Tag color="orange">{item.productType}</Tag></Space>}
                          description={
                            <Space split={<ArrowRightOutlined />}>
                              <span>{item.customerName}</span>
                              <span>配件: {pendingParts.map(p => p.partName).join(', ')}</span>
                            </Space>
                          }
                        />
                      </List.Item>
                    );
                  }}
                />
              ) : (
                <Empty description="暂无待审批配件" />
              )}
            </Card>
          </Card>
        </Col>

        <Col span={8}>
          <Card 
            title={
              <Space>
                <TeamOutlined />
                <span>师傅状态</span>
              </Space>
            }
          >
            <List
              itemLayout="horizontal"
              dataSource={mastersList}
              renderItem={master => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Badge 
                        dot 
                        color={master.status === 'available' ? 'green' : master.status === 'busy' ? 'blue' : 'default'}
                        offset={[-5, 30]}
                      >
                        <Avatar style={{ 
                          backgroundColor: master.status === 'available' ? '#52c41a' : 
                                          master.status === 'busy' ? '#1890ff' : '#d9d9d9' 
                        }}>
                          {master.name[0]}
                        </Avatar>
                      </Badge>
                    }
                    title={
                      <Space>
                        <span>{master.name}</span>
                        <Tag color={master.status === 'available' ? 'green' : master.status === 'busy' ? 'blue' : 'default'}>
                          {master.status === 'available' ? '空闲' : master.status === 'busy' ? '工作中' : '休息'}
                        </Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={0}>
                        <span style={{ fontSize: 12, color: '#666' }}>
                          技能: {master.skills.join(', ')}
                        </span>
                        {master.currentOrders.length > 0 && (
                          <span style={{ fontSize: 11, color: '#999' }}>
                            当前订单: {master.currentOrders.join(', ')}
                          </span>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>

          <Card 
            title={
              <Space>
                <CustomerServiceOutlined />
                <span>售后处理中</span>
                <Badge count={afterSaleOrders.length} color="#722ed1" />
              </Space>
            }
            style={{ marginTop: 16 }}
          >
            {afterSaleOrders.length > 0 ? (
              <List
                size="small"
                dataSource={afterSaleOrders}
                renderItem={item => (
                  <List.Item
                    actions={[<Button type="link" size="small" onClick={() => showOrderDetail(item)}>详情</Button>]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar style={{ backgroundColor: '#722ed1' }}>{item.customerName[0]}</Avatar>}
                      title={<Space>{item.id} <Tag color="purple">{item.productType}</Tag></Space>}
                      description={
                        <Space split={<ArrowRightOutlined />}>
                          <span>{item.customerName}</span>
                          <span style={{ color: '#999' }}>处理人: {item.afterSaleHandler}</span>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无售后处理中订单" />
            )}
          </Card>

          <Card 
            title="完成率" 
            size="small" 
            style={{ marginTop: 16 }}
          >
            <div style={{ textAlign: 'center', padding: 16 }}>
              <Statistic 
                value={completedRate} 
                suffix="%" 
                valueStyle={{ fontSize: 48, color: '#52c41a' }}
              />
              <Progress 
                type="circle" 
                percent={completedRate} 
                width={80} 
                style={{ margin: '16px auto' }}
                strokeColor={{
                  '0%': '#10b981',
                  '100%': '#52c41a'
                }}
              />
              <div style={{ color: '#666', fontSize: 12 }}>
                {stats.completedOrders} / {stats.totalOrders} 订单已完成
              </div>
            </div>
          </Card>
        </Col>

        <Col span={24}>
          <Card 
            title={
              <Space>
                <DashboardOutlined />
                <span>订单列表</span>
                <Badge count={stats.totalOrders} />
              </Space>
            }
          >
            <Table
              rowKey="id"
              columns={columns}
              dataSource={ordersList}
              pagination={{ pageSize: 10 }}
              size="middle"
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="订单详情"
        open={orderDetailVisible}
        onCancel={() => setOrderDetailVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        {selectedOrder && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="订单号">
                <span style={{ fontWeight: 600, color: '#1890ff' }}>{selectedOrder.id}</span>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <span style={{ 
                  display: 'inline-block', 
                  padding: '4px 12px', 
                  borderRadius: 4,
                  backgroundColor: statusConfig[selectedOrder.status].bgColor,
                  color: statusConfig[selectedOrder.status].color
                }}>
                  {statusConfig[selectedOrder.status].text}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="客户">{selectedOrder.customerName}</Descriptions.Item>
              <Descriptions.Item label="电话">
                <a href={`tel:${selectedOrder.customerPhone}`}>{selectedOrder.customerPhone}</a>
              </Descriptions.Item>
              <Descriptions.Item label="地址" span={2}>{selectedOrder.address}</Descriptions.Item>
              <Descriptions.Item label="产品">{selectedOrder.productType} - {selectedOrder.productModel}</Descriptions.Item>
              <Descriptions.Item label="师傅">{selectedOrder.assignedMaster || '-'}</Descriptions.Item>
              <Descriptions.Item label="调度员">{selectedOrder.dispatcher || '-'}</Descriptions.Item>
              <Descriptions.Item label="售后处理">{selectedOrder.afterSaleHandler || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(selectedOrder.createTime).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              {selectedOrder.remark && (
                <Descriptions.Item label="备注" span={2}>
                  <div style={{ padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                    {selectedOrder.remark}
                  </div>
                </Descriptions.Item>
              )}
            </Descriptions>

            <Card title="状态变更历史" size="small" style={{ marginTop: 16 }}>
              <Timeline
                mode="left"
                items={selectedOrder.statusHistory.map((item, index) => ({
                  color: item.toStatus === 'completed' ? 'green' : item.toStatus === 'delayed' ? 'red' : 'blue',
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

            {selectedOrder.partRequests.length > 0 && (
              <Card title="配件领用" size="small" style={{ marginTop: 16 }}>
                <Table
                  size="small"
                  dataSource={selectedOrder.partRequests}
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
                        const config = {
                          requested: { color: 'orange', text: '待审批' },
                          approved: { color: 'blue', text: '已批准' },
                          picked: { color: 'cyan', text: '已领取' },
                          installed: { color: 'green', text: '已安装' }
                        };
                        return <Tag color={config[status].color}>{config[status].text}</Tag>;
                      }
                    },
                    { title: '申请人', dataIndex: 'requester', key: 'requester' },
                    { title: '当前处理', dataIndex: 'currentHandler', key: 'currentHandler' }
                  ]}
                  pagination={false}
                />
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;
