import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Tag, 
  Modal, 
  Form, 
  Input, 
  message,
  Typography,
  Radio,
  Alert
} from 'antd';
import { 
  CheckOutlined, 
  CloseOutlined, 
  EyeOutlined, 
  ReloadOutlined,
  RollbackOutlined
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

const { Title, Text } = Typography;
const { TextArea } = Input;

const StageControlPage: React.FC = () => {
  const { currentRole, currentUser } = useAppStore();
  const [orders, setOrders] = useState<InventoryLockOrder[]>([]);
  const [stats, setStats] = useState({ total: 0, pendingReview: 0, giftConfiguring: 0, rejected: 0, completed: 0, urgent: 0 });
  const [loading, setLoading] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<InventoryLockOrder | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [reviewResult, setReviewResult] = useState<'approve' | 'reject'>('approve');

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

  const handleOpenReview = (order: InventoryLockOrder) => {
    setSelectedOrder(order);
    setReviewResult('approve');
    form.resetFields();
    setReviewModalVisible(true);
  };

  const handleReview = async (values: any) => {
    if (!selectedOrder) return;
    
    try {
      await orderApi.review(selectedOrder.id, {
        approved: reviewResult === 'approve',
        reviewer: currentUser,
        remark: values.remark || '',
        rejectReason: reviewResult === 'reject' ? values.rejectReason : undefined
      });
      
      message.success(reviewResult === 'approve' ? '审核通过，已流转到赠品配置' : '已驳回');
      setReviewModalVisible(false);
      fetchData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleReturn = async (order: InventoryLockOrder) => {
    Modal.confirm({
      title: '确认退回订单',
      content: '退回后订单将返回给主播助理重新处理',
      okText: '确认退回',
      okType: 'danger',
      onOk: async () => {
        try {
          await orderApi.return(order.id, {
            operator: currentUser,
            reason: '场控审核退回，需重新核对信息'
          });
          message.success('已退回');
          fetchData();
        } catch (error) {
          message.error('操作失败');
        }
      }
    });
  };

  const handleViewDetail = (order: InventoryLockOrder) => {
    setSelectedOrder(order);
    setSelectedId(order.id);
    setDetailVisible(true);
  };

  const pendingReviewOrders = orders.filter(o => o.status === 'PENDING_REVIEW');
  const otherOrders = orders.filter(o => o.status !== 'PENDING_REVIEW');

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
      title: '创建人',
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 100,
    },
    {
      title: 'SKU数',
      dataIndex: ['skuList', 'length'],
      key: 'skuCount',
      width: 80,
    },
    {
      title: '锁定金额',
      dataIndex: 'totalLockedAmount',
      key: 'totalLockedAmount',
      width: 120,
      render: (val: number) => `¥${val.toLocaleString()}`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
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
            {diff < 24 && diff > 0 && (
              <Tag color="orange" className="urgent-pulse">{diff}小时后</Tag>
            )}
            {diff <= 0 && (
              <Tag color="red" className="extreme-badge">已临近</Tag>
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
          {record.status === 'PENDING_REVIEW' && (
            <>
              <Button 
                type="primary" 
                size="small" 
                icon={<CheckOutlined />}
                onClick={() => handleOpenReview(record)}
              >
                审核
              </Button>
              <Button 
                size="small"
                danger
                icon={<RollbackOutlined />}
                onClick={() => handleReturn(record)}
              >
                退回
              </Button>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card style={{ marginBottom: 24 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={4} style={{ margin: 0 }}>场控工作台</Title>
          <Button icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>
        </Space>
      </Card>

      <StatsCards stats={stats} />

      {pendingReviewOrders.length > 0 && (
        <Alert
          message={`有 ${pendingReviewOrders.length} 个订单待审核`}
          description={pendingReviewOrders.some(o => o.priority === 'EXTREME' || o.priority === 'URGENT') 
            ? '包含紧急/特急订单，请优先处理！' 
            : '请及时审核，避免影响直播进度'}
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
          className={pendingReviewOrders.some(o => o.priority === 'EXTREME') ? 'urgent-pulse' : ''}
        />
      )}

      <Card 
        title={
          <Space>
            <span>待审核订单</span>
            <Tag color="red">{pendingReviewOrders.length}</Tag>
          </Space>
        } 
        style={{ marginBottom: 24 }}
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={pendingReviewOrders}
          loading={loading}
          pagination={false}
          scroll={{ x: 1200 }}
          locale={{ emptyText: '暂无待审核订单' }}
        />
      </Card>

      <Card title="其他订单">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={otherOrders}
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
          locale={{ emptyText: '暂无其他订单' }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <span>审核订单</span>
            {selectedOrder && (
              <Tag color={PriorityColors[selectedOrder.priority]}>
                {PriorityNames[selectedOrder.priority]}
              </Tag>
            )}
          </Space>
        }
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        footer={null}
        width={700}
        destroyOnHidden
      >
        {selectedOrder && (
          <>
            <Alert
              message={selectedOrder.liveSessionName}
              description={
                <Space direction="vertical" size={2}>
                  <Text>订单号: {selectedOrder.orderNo}</Text>
                  <Text>锁定金额: ¥{selectedOrder.totalLockedAmount.toLocaleString()}</Text>
                  {selectedOrder.priceRemark && (
                    <Text type="warning">价格口径: {selectedOrder.priceRemark}</Text>
                  )}
                </Space>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Form form={form} layout="vertical" onFinish={handleReview}>
              <Form.Item label="审核结果">
                <Radio.Group 
                  value={reviewResult} 
                  onChange={(e) => setReviewResult(e.target.value)}
                  optionType="button"
                  buttonStyle="solid"
                >
                  <Radio.Button value="approve">
                    <CheckOutlined style={{ color: '#52c41a' }} /> 审核通过
                  </Radio.Button>
                  <Radio.Button value="reject">
                    <CloseOutlined style={{ color: '#ff4d4f' }} /> 驳回
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>

              {reviewResult === 'reject' && (
                <Form.Item
                  name="rejectReason"
                  label="驳回原因"
                  rules={[{ required: true, message: '请填写驳回原因' }]}
                >
                  <TextArea 
                    rows={3} 
                    placeholder="请详细说明驳回原因，如价格口径错误、库存数据不符等，便于主播助理修改"
                  />
                </Form.Item>
              )}

              <Form.Item
                name="remark"
                label="审核备注"
              >
                <TextArea 
                  rows={2} 
                  placeholder="可选，填写审核意见或补充说明"
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => setReviewModalVisible(false)}>取消</Button>
                  <Button 
                    type={reviewResult === 'approve' ? 'primary' : 'default'}
                    danger={reviewResult === 'reject'}
                    htmlType="submit"
                  >
                    {reviewResult === 'approve' ? '确认通过' : '确认驳回'}
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>

      {detailVisible && selectedId && (
        <LockOrderDetail
          orderId={selectedId}
          visible={detailVisible}
          onClose={() => setDetailVisible(false)}
          onRefresh={fetchData}
        />
      )}
    </div>
  );
};

export default StageControlPage;
