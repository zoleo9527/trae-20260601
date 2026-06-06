import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Tag, 
  message,
  Typography,
  Alert
} from 'antd';
import { 
  GiftOutlined, 
  EyeOutlined, 
  ReloadOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { 
  InventoryLockOrder, 
  StatusNames, 
  StatusColors, 
  PriorityNames, 
  PriorityColors 
} from '../types';
import { orderApi, statsApi } from '../api';
import { useAppStore } from '../store';
import StatsCards from '../components/StatsCards';
import dayjs from 'dayjs';
import LockOrderDetail from './LockOrderDetail';
import GiftConfigPage from './GiftConfigPage';

const { Title } = Typography;

const AfterSalesPage: React.FC = () => {
  const { currentRole, currentUser } = useAppStore();
  const [orders, setOrders] = useState<InventoryLockOrder[]>([]);
  const [stats, setStats] = useState({ total: 0, pendingReview: 0, giftConfiguring: 0, rejected: 0, completed: 0, urgent: 0 });
  const [loading, setLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [giftModalVisible, setGiftModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<InventoryLockOrder | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersData, statsData] = await Promise.all([
        orderApi.getAll(currentRole),
        statsApi.getSummary()
      ]);
      setOrders(ordersData);
      setStats(statsData);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentRole]);

  const handleOpenGiftConfig = (order: InventoryLockOrder) => {
    setSelectedOrder(order);
    setSelectedId(order.id);
    setGiftModalVisible(true);
  };

  const handleViewDetail = (order: InventoryLockOrder) => {
    setSelectedOrder(order);
    setSelectedId(order.id);
    setDetailVisible(true);
  };

  const handleComplete = async (order: InventoryLockOrder) => {
    try {
      await orderApi.complete(order.id, { operator: currentUser });
      message.success('订单已完成');
      fetchData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const configuringOrders = orders.filter(o => o.status === 'GIFT_CONFIGURING' || o.status === 'GIFT_CONFIGURED');
  const completedOrders = orders.filter(o => o.status === 'COMPLETED');

  const columns = [
    {
      title: '订单编号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 150,
      render: (text: string, record: InventoryLockOrder) => (
        <Space>
          {record.priority === 'EXTREME' && (
            <Tag color="red" className="extreme-badge">特急</Tag>
          )}
          {record.priority === 'URGENT' && (
            <Tag color="orange">紧急</Tag>
          )}
          <span>{text}</span>
        </Space>
      )
    },
    {
      title: '直播场次',
      dataIndex: 'liveSessionName',
      key: 'liveSessionName',
      ellipsis: true,
    },
    {
      title: '场控审核',
      dataIndex: 'currentHandler',
      key: 'reviewer',
      width: 100,
    },
    {
      title: 'SKU数',
      dataIndex: ['skuList', 'length'],
      key: 'skuCount',
      width: 80,
    },
    {
      title: '赠品数',
      key: 'giftCount',
      width: 80,
      render: (_: any, record: InventoryLockOrder) => record.giftList.length || 0
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: any) => (
        <Tag color={StatusColors[status]}>{StatusNames[status]}</Tag>
      )
    },
    {
      title: '预计开播',
      dataIndex: 'expectedLiveTime',
      key: 'expectedLiveTime',
      width: 150,
      render: (time: string) => {
        if (!time) return '-';
        const diff = dayjs(time).diff(dayjs(), 'hour');
        return (
          <Space>
            <span>{dayjs(time).format('MM-DD HH:mm')}</span>
            {diff < 12 && diff > 0 && (
              <Tag color="red" className="urgent-pulse">仅剩{diff}小时</Tag>
            )}
          </Space>
        );
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      fixed: 'right' as const,
      render: (_: any, record: InventoryLockOrder) => (
        <Space size="small">
          <Button 
            type="link" 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.status === 'GIFT_CONFIGURING' && (
            <Button 
              type="primary" 
              size="small" 
              icon={<GiftOutlined />}
              onClick={() => handleOpenGiftConfig(record)}
            >
              配置赠品
            </Button>
          )}
          {record.status === 'GIFT_CONFIGURED' && (
            <Button 
              type="primary" 
              size="small" 
              icon={<CheckCircleOutlined />}
              onClick={() => handleComplete(record)}
            >
              确认完成
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card style={{ marginBottom: 24 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={4} style={{ margin: 0 }}>售后组长工作台</Title>
          <Button icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>
        </Space>
      </Card>

      <StatsCards stats={stats} />

      {configuringOrders.some(o => {
        if (!o.expectedLiveTime) return false;
        return dayjs(o.expectedLiveTime).diff(dayjs(), 'hour') < 12;
      }) && (
        <Alert
          message="紧急提醒"
          description="有订单临近开播时间，请尽快完成赠品配置！"
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
          className="urgent-pulse"
        />
      )}

      <Card 
        title={
          <Space>
            <GiftOutlined style={{ color: '#1890ff' }} />
            <span>待配置赠品</span>
            <Tag color="blue">{configuringOrders.filter(o => o.status === 'GIFT_CONFIGURING').length}</Tag>
          </Space>
        } 
        style={{ marginBottom: 24 }}
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={configuringOrders}
          loading={loading}
          pagination={false}
          scroll={{ x: 1200 }}
          locale={{ emptyText: '暂无待配置赠品的订单' }}
        />
      </Card>

      <Card 
        title={
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            <span>已完成订单</span>
          </Space>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={completedOrders}
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
          locale={{ emptyText: '暂无已完成订单' }}
        />
      </Card>

      {detailVisible && selectedId && (
        <LockOrderDetail
          orderId={selectedId}
          visible={detailVisible}
          onClose={() => setDetailVisible(false)}
          onRefresh={fetchData}
        />
      )}

      {giftModalVisible && selectedId && selectedOrder && (
        <GiftConfigPage
          orderId={selectedId}
          visible={giftModalVisible}
          onClose={() => {
            setGiftModalVisible(false);
            fetchData();
          }}
          initialGiftList={selectedOrder.giftList}
        />
      )}
    </div>
  );
};

export default AfterSalesPage;
