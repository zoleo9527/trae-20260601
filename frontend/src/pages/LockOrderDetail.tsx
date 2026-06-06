import React, { useState, useEffect } from 'react';
import { 
  Drawer, 
  Descriptions, 
  Tag, 
  Table, 
  Button, 
  Space, 
  InputNumber, 
  Form, 
  Input, 
  message,
  Steps,
  Card,
  Divider,
  Typography,
  Row,
  Col,
  Alert,
  Modal
} from 'antd';
import { 
  GiftOutlined, 
  CheckOutlined, 
  SaveOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { 
  InventoryLockOrder, 
  StatusNames, 
  StatusColors, 
  PriorityNames, 
  PriorityColors,
  SkuItem,
  GiftItem,
  RoleNames
} from '../types';
import { orderApi } from '../api';
import { useAppStore } from '../store';
import OperationTimeline from '../components/OperationTimeline';
import dayjs from 'dayjs';
import GiftConfigPage from './GiftConfigPage';

const { Title, Text } = Typography;

interface Props {
  orderId: string;
  visible: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

const LockOrderDetail: React.FC<Props> = ({ orderId, visible, onClose, onRefresh }) => {
  const { currentRole, currentUser } = useAppStore();
  const [order, setOrder] = useState<InventoryLockOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'gifts'>('info');
  const [skuEditMode, setSkuEditMode] = useState(false);
  const [editedSkus, setEditedSkus] = useState<SkuItem[]>([]);
  const [giftModalVisible, setGiftModalVisible] = useState(false);

  const fetchOrder = async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const data = await orderApi.getById(orderId);
      setOrder(data);
      setEditedSkus(data.skuList);
    } catch (error) {
      message.error('加载订单详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchOrder();
    }
  }, [visible, orderId]);

  const handleSubmitLock = async () => {
    if (!order) return;
    try {
      await orderApi.submitLock(order.id, {
        operator: currentUser,
        skuList: editedSkus
      });
      message.success('库存锁定已提交，场控正在审核');
      setSkuEditMode(false);
      fetchOrder();
      onRefresh();
    } catch (error) {
      message.error('提交失败');
    }
  };

  const updateSkuLocked = (index: number, value: number) => {
    const newSkus = [...editedSkus];
    newSkus[index] = { ...newSkus[index], stockLocked: value };
    setEditedSkus(newSkus);
  };

  const getCurrentStep = () => {
    if (!order) return 0;
    const status = order.status;
    if (['DRAFT', 'PENDING_LOCK'].includes(status)) return 0;
    if (['PENDING_REVIEW', 'REVIEW_REJECTED'].includes(status)) return 1;
    if (['GIFT_CONFIGURING'].includes(status)) return 2;
    if (['GIFT_CONFIGURED'].includes(status)) return 3;
    if (['COMPLETED'].includes(status)) return 4;
    if (['RETURNED'].includes(status)) return 1;
    return 0;
  };

  const steps = [
    { title: '创建锁定单', icon: <SaveOutlined /> },
    { title: '场控审核', icon: <CheckOutlined /> },
    { title: '赠品配置', icon: <GiftOutlined /> },
    { title: '赠品确认', icon: <CheckOutlined /> },
    { title: '完成', icon: <CheckOutlined /> },
  ];

  if (!order) return null;

  const skuColumns = [
    {
      title: 'SKU编码',
      dataIndex: 'skuId',
      key: 'skuId',
      width: 100,
    },
    {
      title: '商品名称',
      dataIndex: 'skuName',
      key: 'skuName',
    },
    {
      title: '原价',
      dataIndex: 'originalPrice',
      key: 'originalPrice',
      width: 100,
      render: (v: number) => <span style={{ textDecoration: 'line-through', color: '#999' }}>¥{v}</span>
    },
    {
      title: '直播价',
      dataIndex: 'livePrice',
      key: 'livePrice',
      width: 100,
      render: (v: number) => <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>¥{v}</span>
    },
    {
      title: '可用库存',
      dataIndex: 'stockAvailable',
      key: 'stockAvailable',
      width: 100,
      render: (v: number, record: SkuItem) => `${v} ${record.unit}`
    },
    {
      title: '锁定库存',
      dataIndex: 'stockLocked',
      key: 'stockLocked',
      width: 150,
      render: (v: number, record: SkuItem, index: number) => {
        if (skuEditMode && ['PENDING_LOCK', 'REVIEW_REJECTED', 'RETURNED'].includes(order.status)) {
          return (
            <InputNumber
              min={0}
              max={record.stockAvailable}
              value={v}
              onChange={(val) => updateSkuLocked(index, val || 0)}
              style={{ width: 120 }}
              addonAfter={record.unit}
            />
          );
        }
        return <span style={{ fontWeight: 'bold' }}>{v} {record.unit}</span>;
      }
    },
    {
      title: '锁定金额',
      key: 'amount',
      width: 120,
      render: (_: any, record: SkuItem) => 
        `¥${((record.stockLocked || 0) * record.livePrice).toLocaleString()}`
    },
  ];

  const totalLocked = editedSkus.reduce((sum, sku) => sum + (sku.stockLocked || 0) * sku.livePrice, 0);

  const canEditLock = currentRole === 'ASSISTANT' && ['PENDING_LOCK', 'REVIEW_REJECTED', 'RETURNED'].includes(order.status);
  const canEnterGiftConfig = ['GIFT_CONFIGURING', 'GIFT_CONFIGURED'].includes(order.status);

  return (
    <>
      <Drawer
        title={
          <Space>
            <span>订单详情 - {order.orderNo}</span>
            {order.priority !== 'NORMAL' && (
              <Tag color={PriorityColors[order.priority]} className={order.priority === 'EXTREME' ? 'extreme-badge' : ''}>
                {PriorityNames[order.priority]}
              </Tag>
            )}
          </Space>
        }
        placement="right"
        width={900}
        open={visible}
        onClose={onClose}
        loading={loading}
        extra={
          <Space>
            {canEditLock && !skuEditMode && (
              <Button type="primary" onClick={() => setSkuEditMode(true)}>
                编辑锁定库存
              </Button>
            )}
            {canEditLock && skuEditMode && (
              <>
                <Button onClick={() => { setSkuEditMode(false); setEditedSkus(order.skuList); }}>
                  取消
                </Button>
                <Button type="primary" onClick={handleSubmitLock}>
                  提交锁定
                </Button>
              </>
            )}
            {canEnterGiftConfig && currentRole === 'AFTER_SALES_LEAD' && (
              <Button 
                type="primary" 
                icon={<GiftOutlined />}
                onClick={() => setGiftModalVisible(true)}
              >
                {order.status === 'GIFT_CONFIGURING' ? '配置赠品' : '修改赠品配置'}
              </Button>
            )}
          </Space>
        }
      >
        <Steps 
          current={getCurrentStep()} 
          items={steps} 
          style={{ marginBottom: 24 }}
          status={order.status === 'REVIEW_REJECTED' || order.status === 'RETURNED' ? 'error' : 'process'}
        />

        {order.rejectReason && (
          <Alert
            message="审核驳回原因"
            description={order.rejectReason}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {order.returnReason && (
          <Alert
            message="退回原因"
            description={order.returnReason}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {order.status === 'GIFT_CONFIGURING' && (
          <Alert
            message="库存审核已通过"
            description="请尽快配置赠品，避免影响直播进度"
            type="success"
            showIcon
            action={
              currentRole === 'AFTER_SALES_LEAD' && (
                <Button size="small" type="primary" onClick={() => setGiftModalVisible(true)}>
                  去配置 <ArrowRightOutlined />
                </Button>
              )
            }
            style={{ marginBottom: 16 }}
          />
        )}

        <Card title="基本信息" style={{ marginBottom: 16 }} size="small">
          <Descriptions column={2} size="small">
            <Descriptions.Item label="直播场次">{order.liveSessionName}</Descriptions.Item>
            <Descriptions.Item label="场次ID">{order.liveSessionId}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={StatusColors[order.status]}>{StatusNames[order.status]}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="优先级">
              <Tag color={PriorityColors[order.priority]}>{PriorityNames[order.priority]}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="创建人">{order.createdBy} ({RoleNames[order.createdByRole]})</Descriptions.Item>
            <Descriptions.Item label="当前处理人">{order.currentHandler} ({RoleNames[order.currentHandlerRole]})</Descriptions.Item>
            <Descriptions.Item label="预计开播">
              {order.expectedLiveTime ? dayjs(order.expectedLiveTime).format('YYYY-MM-DD HH:mm') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {dayjs(order.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {order.priceRemark && (
          <Card title="价格口径说明" style={{ marginBottom: 16 }} size="small">
            <Text type="warning" style={{ fontSize: 14 }}>
              ⚠️ {order.priceRemark}
            </Text>
          </Card>
        )}

        <Card 
          title={
            <Space>
              <span>SKU锁定明细</span>
              <Tag color="blue">共 {editedSkus.length} 个SKU</Tag>
            </Space>
          } 
          style={{ marginBottom: 16 }}
          size="small"
          extra={
            <Text strong style={{ color: '#ff4d4f' }}>
              锁定总金额: ¥{totalLocked.toLocaleString()}
            </Text>
          }
        >
          <Table
            rowKey="skuId"
            columns={skuColumns}
            dataSource={skuEditMode ? editedSkus : order.skuList}
            pagination={false}
            size="small"
          />
        </Card>

        {order.giftList.length > 0 && (
          <Card 
            title={
              <Space>
                <GiftOutlined style={{ color: '#52c41a' }} />
                <span>赠品配置</span>
                <Tag color="green">已配置</Tag>
              </Space>
            } 
            style={{ marginBottom: 16 }}
            size="small"
          >
            <Table
              rowKey="giftId"
              columns={[
                { title: '赠品名称', dataIndex: 'giftName', key: 'giftName' },
                { title: '赠送数量', dataIndex: 'quantity', key: 'quantity', width: 100 },
                { title: '赠送条件', dataIndex: 'condition', key: 'condition' },
                { title: '库存', dataIndex: 'stock', key: 'stock', width: 100 },
              ]}
              dataSource={order.giftList}
              pagination={false}
              size="small"
            />
          </Card>
        )}

        {order.status === 'GIFT_CONFIGURING' && order.giftList.length === 0 && (
          <Card 
            style={{ marginBottom: 16 }}
            size="small"
            bodyStyle={{ textAlign: 'center', padding: 24 }}
          >
            <GiftOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 8 }} />
            <Text type="secondary">待配置赠品</Text>
            {currentRole === 'AFTER_SALES_LEAD' && (
              <div style={{ marginTop: 12 }}>
                <Button type="primary" onClick={() => setGiftModalVisible(true)}>
                  立即配置赠品
                </Button>
              </div>
            )}
          </Card>
        )}

        <Card title="操作历史" size="small">
          <OperationTimeline logs={order.operationLogs} />
        </Card>
      </Drawer>

      <GiftConfigPage
        orderId={orderId}
        visible={giftModalVisible}
        onClose={() => {
          setGiftModalVisible(false);
          fetchOrder();
          onRefresh();
        }}
        initialGiftList={order.giftList}
      />
    </>
  );
};

export default LockOrderDetail;
