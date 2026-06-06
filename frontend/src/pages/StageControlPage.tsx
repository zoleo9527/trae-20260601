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
  Modal,
  Form,
  Radio,
  Input,
  Descriptions
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  RollbackOutlined,
  ClockCircleOutlined
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
import { useAppStore } from '../store';
import OrderFilter from '../components/OrderFilter';
import dayjs from 'dayjs';

const { TextArea } = Input;

const StageControlPage: React.FC = () => {
  const { currentUser } = useAppStore();
  const [orders, setOrders] = useState<InventoryLockOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<OrderFilterParams>({});
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<InventoryLockOrder | null>(null);
  const [reviewForm] = Form.useForm();

  const quickFilters = [
    {
      label: '待审核',
      value: { status: 'PENDING_REVIEW' } as OrderFilterParams,
      type: 'warning' as const
    },
    {
      label: '特急订单',
      value: { priority: 'EXTREME' } as OrderFilterParams,
      type: 'danger' as const
    },
    {
      label: '12小时内开播',
      value: {
        liveTimeFrom: new Date().toISOString(),
        liveTimeTo: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
      } as OrderFilterParams,
      type: 'primary' as const
    }
  ];

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await orderApi.getAll('STAGE_CONTROL', filters);
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

  const handleReview = async (values: any) => {
    if (!selectedOrder) return;

    try {
      await orderApi.review(selectedOrder.id, {
        ...values,
        reviewer: currentUser,
        orderId: selectedOrder.id
      });
      message.success(values.approved ? '审核通过' : '已驳回');
      setReviewModalVisible(false);
      reviewForm.resetFields();
      fetchOrders();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleReturn = async (record: InventoryLockOrder) => {
    Modal.confirm({
      title: '确认退回此订单？',
      content: '退回后主播助理将重新编辑，订单状态将变为「已退回」',
      onOk: async () => {
        try {
          await orderApi.return(record.id, {
            operator: currentUser,
            reason: '需要补充更多信息'
          });
          message.success('已退回');
          fetchOrders();
        } catch (error) {
          message.error('操作失败');
        }
      }
    });
  };

  const openReviewModal = (record: InventoryLockOrder) => {
    setSelectedOrder(record);
    setReviewModalVisible(true);
    reviewForm.setFieldsValue({
      approved: true,
      remark: '',
      rejectReason: ''
    });
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
      title: '创建人',
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 100
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
      width: 240,
      fixed: 'right' as const,
      render: (_: any, record: InventoryLockOrder) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />}>查看</Button>
          {record.status === 'PENDING_REVIEW' && (
            <>
              <Button
                size="small"
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => openReviewModal(record)}
              >
                审核
              </Button>
              <Button
                size="small"
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

  const pendingReviewCount = orders.filter(o => o.status === 'PENDING_REVIEW').length;
  const urgentCount = orders.filter(o => ['URGENT', 'EXTREME'].includes(o.priority)).length;
  const todayCount = orders.filter(o =>
    o.expectedLiveTime && dayjs(o.expectedLiveTime).isSame(dayjs(), 'day')
  ).length;

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={8} md={6}>
          <Card size="small">
            <Statistic
              title="待审核"
              value={pendingReviewCount}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card size="small">
            <Statistic
              title="今日开播"
              value={todayCount}
              valueStyle={{ color: '#1890ff' }}
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

      <Card title="订单审核列表" size="small">
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

      <Modal
        title="审核库存锁定单"
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        footer={null}
        width={700}
        destroyOnHidden
      >
        {selectedOrder && (
          <>
            <Card size="small" style={{ marginBottom: 16 }} title="订单信息">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="订单编号">{selectedOrder.orderNo}</Descriptions.Item>
                <Descriptions.Item label="直播场次">{selectedOrder.liveSessionName}</Descriptions.Item>
                <Descriptions.Item label="创建人">{selectedOrder.createdBy}</Descriptions.Item>
                <Descriptions.Item label="锁定金额">¥{selectedOrder.totalLockedAmount.toLocaleString()}</Descriptions.Item>
              </Descriptions>
              {selectedOrder.priceRemark && (
                <div style={{ marginTop: 8, padding: '8px 12px', background: '#fffbe6', borderRadius: 4 }}>
                  <b>价格口径：</b>{selectedOrder.priceRemark}
                </div>
              )}
              <div style={{ marginTop: 8 }}>
                <b>SKU明细：</b>
                {selectedOrder.skuList.map(sku => (
                  <div key={sku.skuId} style={{ fontSize: 13, color: '#666', paddingLeft: 12 }}>
                    {sku.skuName} - 锁定 {sku.stockLocked}{sku.unit} | 直播价 ¥{sku.livePrice}（原价 ¥{sku.originalPrice}）
                  </div>
                ))}
              </div>
            </Card>

            <Form
              form={reviewForm}
              layout="vertical"
              onFinish={handleReview}
            >
              <Form.Item label="审核结果" name="approved" rules={[{ required: true }]}>
                <Radio.Group>
                  <Radio value={true}>通过</Radio>
                  <Radio value={false}>驳回</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item label="审核意见" name="remark">
                <TextArea rows={3} placeholder="请填写审核意见" />
              </Form.Item>
              <Form.Item noStyle shouldUpdate={(prev, curr) => prev.approved !== curr.approved}>
                {({ getFieldValue }) =>
                  getFieldValue('approved') === false && (
                    <Form.Item label="驳回原因" name="rejectReason" rules={[{ required: true, message: '请填写驳回原因' }]}>
                      <TextArea rows={3} placeholder="请详细说明驳回原因，如价格口径错误、库存不足等" />
                    </Form.Item>
                  )
                }
              </Form.Item>
              <div style={{ textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => setReviewModalVisible(false)}>取消</Button>
                  <Button type="primary" htmlType="submit">确认</Button>
                </Space>
              </div>
            </Form>
          </>
        )}
      </Modal>
    </div>
  );
};

export default StageControlPage;
