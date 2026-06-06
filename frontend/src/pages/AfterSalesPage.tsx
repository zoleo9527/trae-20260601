import React, { useState, useEffect } from 'react';
import {
  Button,
  Table,
  Space,
  Tag,
  message,
  Statistic,
  Row,
  Col,
  Card,
  ClockCircleOutlined
} from 'antd';
import {
  GiftOutlined,
  EyeOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import {
  InventoryLockOrder,
  StatusNames,
  StatusColors,
  PriorityNames,
  PriorityColors,
  OrderFilterParams,
  RoleNames
} from '../types';
import { orderApi } from '../api';
import OrderFilter from '../components/OrderFilter';
import dayjs from 'dayjs';
import GiftConfigPage from './GiftConfigPage';

const AfterSalesPage: React.FC = () => {
  const [orders, setOrders] = useState<InventoryLockOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<OrderFilterParams>({});
  const [giftConfigVisible, setGiftConfigVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');

  const quickFilters = [
    {
      label: '待配置赠品',
      value: { status: 'GIFT_CONFIGURING' } as OrderFilterParams,
      type: 'processing' as const
    },
    {
      label: '临近开播',
      value: {
        liveTimeFrom: new Date().toISOString(),
        liveTimeTo: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      } as OrderFilterParams,
      type: 'danger' as const
    },
    {
      label: '已完成',
      value: { status: 'COMPLETED' } as OrderFilterParams,
      type: 'success' as const
    }
  ];

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await orderApi.getAll('AFTER_SALES_LEAD', filters);
      setOrders(data);
    } catch (error) {
      message.error('加载订单失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const openGiftConfig = (order: InventoryLockOrder) => {
    setSelectedOrderId(order.id);
    setGiftConfigVisible(true);
  };

  const columns = [
    {
      title: '订单编号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 160,
      render: (text: string) => <b>{text}</b>
    },
    {
      title: '直播场次',
      dataIndex: 'liveSessionName',
      key: 'liveSessionName',
      render: (text: string, record: InventoryLockOrder) => (
        <Space direction="vertical" size={0}>
          <span>{text}</span>
          {record.expectedLiveTime && (
            <span style={{ fontSize: 12, color: '#999' }}>
              <ClockCircleOutlined style={{ marginRight: 4 }} />
              {dayjs(record.expectedLiveTime).format('MM-DD HH:mm')}
            </span>
          )}
        </Space>
      )
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (p: string) => <Tag color={PriorityColors[p as any]}>{PriorityNames[p as any]}</Tag>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (s: string) => <Tag color={StatusColors[s as any]}>{StatusNames[s as any]}</Tag>
    },
    {
      title: '当前处理人',
      dataIndex: 'currentHandler',
      key: 'currentHandler',
      width: 120,
      render: (text: string, record: InventoryLockOrder) => (
        <Space>
          <span>{text}</span>
          <span style={{ fontSize: 12, color: '#999' }}>
            ({RoleNames[record.currentHandlerRole]})
          </span>
        </Space>
      )
    },
    {
      title: '赠品数量',
      key: 'giftCount',
      width: 100,
      render: (_: any, record: InventoryLockOrder) => (
        record.giftList.length > 0 ? (
          <Tag color="green">{record.giftList.length} 个</Tag>
        ) : (
          <Tag color="default">未配置</Tag>
        )
      )
    },
    {
      title: '锁定金额',
      dataIndex: 'totalLockedAmount',
      key: 'totalLockedAmount',
      width: 120,
      render: (v: number) => `¥${v.toLocaleString()}`
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: InventoryLockOrder) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />}>查看</Button>
          {['GIFT_CONFIGURING', 'GIFT_CONFIGURED'].includes(record.status) && (
            <Button
              size="small"
              type="primary"
              icon={<GiftOutlined />}
              onClick={() => openGiftConfig(record)}
            >
              {record.status === 'GIFT_CONFIGURING' ? '配置赠品' : '查看赠品'}
            </Button>
          )}
          {record.status === 'GIFT_CONFIGURED' && (
            <Button
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={async () => {
                try {
                  await orderApi.complete(record.id, { operator: '赵敏' });
                  message.success('已完成');
                  fetchOrders();
                } catch (e) {
                  message.error('操作失败');
                }
              }}
            >
              完成
            </Button>
          )}
        </Space>
      )
    }
  ];

  const pendingCount = orders.filter(o => o.status === 'GIFT_CONFIGURING').length;
  const completedCount = orders.filter(o => o.status === 'COMPLETED').length;
  const urgentCount = orders.filter(o => ['URGENT', 'EXTREME'].includes(o.priority)).length;

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={8} md={6}>
          <Card size="small">
            <Statistic
              title="待配置赠品"
              value={pendingCount}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card size="small">
            <Statistic
              title="已完成"
              value={completedCount}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card size="small">
            <Statistic
              title="紧急订单"
              value={urgentCount}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <OrderFilter
        filters={filters}
        onChange={setFilters}
        onSearch={fetchOrders}
        onReset={() => setFilters({})}
        quickFilters={quickFilters}
      />

      <Card title="赠品配置列表" size="small">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={orders}
          loading={loading}
          size="small"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1300 }}
        />
      </Card>

      <GiftConfigPage
        orderId={selectedOrderId}
        visible={giftConfigVisible}
        onClose={() => {
          setGiftConfigVisible(false);
          fetchOrders();
        }}
        initialGiftList={orders.find(o => o.id === selectedOrderId)?.giftList || []}
      />
    </div>
  );
};

export default AfterSalesPage;
