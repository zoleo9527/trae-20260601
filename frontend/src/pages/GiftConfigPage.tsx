import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Form, 
  Input, 
  InputNumber, 
  Button, 
  Space, 
  Table, 
  Card, 
  Alert, 
  Tag,
  Descriptions,
  Typography,
  message,
  Steps,
  Divider
} from 'antd';
import { 
  PlusOutlined, 
  GiftOutlined, 
  DeleteOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  ShoppingCartOutlined,
  ControlOutlined,
  CustomerServiceOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { GiftItem, InventoryLockOrder, RoleNames, StatusNames, StatusColors, OperationLog } from '../types';
import { orderApi } from '../api';
import { useAppStore } from '../store';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';

const { Text, Paragraph } = Typography;

interface Props {
  orderId: string;
  visible: boolean;
  onClose: () => void;
  initialGiftList: GiftItem[];
}

interface GiftFormItem {
  giftId: string;
  giftName: string;
  quantity: number;
  condition: string;
  stock: number;
}

const presetGifts = [
  { giftId: 'GIFT001', giftName: '小样体验装', stock: 1000, condition: '单笔满199赠1件' },
  { giftId: 'GIFT002', giftName: '品牌化妆包', stock: 500, condition: '单笔满299赠1个' },
  { giftId: 'GIFT003', giftName: '限定明信片', stock: 2000, condition: '下单即赠' },
  { giftId: 'GIFT004', giftName: '运费险', stock: 9999, condition: '下单即赠' },
  { giftId: 'GIFT005', giftName: '精美礼盒', stock: 300, condition: '单笔满499赠1套' },
];

const extractHandoverInfo = (logs: OperationLog[]) => {
  const sortedLogs = [...logs].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const latestLockLog = sortedLogs.find(l => l.action === '提交锁定');
  const latestApproveLog = sortedLogs.find(l => l.action === '审核通过');
  const allRejectLogs = sortedLogs.filter(l => l.action === '审核驳回');
  const allReturnLogs = sortedLogs.filter(l => l.action === '退回订单');
  
  return {
    lockRemark: latestLockLog?.remark || '',
    lockOperator: latestLockLog?.operator || '',
    lockTime: latestLockLog?.timestamp || '',
    reviewRemark: latestApproveLog?.remark || '',
    reviewOperator: latestApproveLog?.operator || '',
    reviewTime: latestApproveLog?.timestamp || '',
    rejectHistory: allRejectLogs.map(l => ({
      reason: l.remark,
      operator: l.operator,
      time: l.timestamp
    })),
    returnHistory: allReturnLogs.map(l => ({
      reason: l.remark,
      operator: l.operator,
      time: l.timestamp
    })),
    hasRejectHistory: allRejectLogs.length > 0,
    hasReturnHistory: allReturnLogs.length > 0,
    totalExceptionCount: allRejectLogs.length + allReturnLogs.length
  };
};

const GiftConfigPage: React.FC<Props> = ({ orderId, visible, onClose, initialGiftList }) => {
  const { currentUser } = useAppStore();
  const [form] = Form.useForm();
  const [order, setOrder] = useState<InventoryLockOrder | null>(null);
  const [gifts, setGifts] = useState<GiftFormItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [remark, setRemark] = useState('');

  const fetchOrder = async () => {
    try {
      const data = await orderApi.getById(orderId);
      setOrder(data);
    } catch (error) {
      message.error('加载订单信息失败');
    }
  };

  useEffect(() => {
    if (visible) {
      fetchOrder();
      if (initialGiftList.length > 0) {
        setGifts([...initialGiftList]);
      } else {
        setGifts([{ giftId: '', giftName: '', quantity: 1, condition: '', stock: 0 }]);
      }
    }
  }, [visible, orderId, initialGiftList]);

  const addGift = () => {
    setGifts([...gifts, { giftId: uuidv4(), giftName: '', quantity: 1, condition: '', stock: 0 }]);
  };

  const removeGift = (index: number) => {
    if (gifts.length > 1) {
      setGifts(gifts.filter((_, i) => i !== index));
    }
  };

  const updateGift = (index: number, field: keyof GiftFormItem, value: any) => {
    const newGifts = [...gifts];
    newGifts[index] = { ...newGifts[index], [field]: value };
    setGifts(newGifts);
  };

  const addPresetGift = (preset: typeof presetGifts[0]) => {
    setGifts([...gifts, {
      giftId: preset.giftId,
      giftName: preset.giftName,
      quantity: 1,
      condition: preset.condition,
      stock: preset.stock
    }]);
  };

  const handleSubmit = async () => {
    const validGifts = gifts.filter(g => g.giftName && g.quantity > 0);
    if (validGifts.length === 0) {
      message.error('请至少配置一个赠品');
      return;
    }

    setLoading(true);
    try {
      await orderApi.giftConfig(orderId, {
        giftList: validGifts,
        operator: currentUser,
        remark: remark
      });
      message.success('赠品配置保存成功');
      onClose();
    } catch (error) {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    const validGifts = gifts.filter(g => g.giftName && g.quantity > 0);
    if (validGifts.length === 0) {
      message.error('请至少配置一个赠品');
      return;
    }

    setLoading(true);
    try {
      await orderApi.giftConfig(orderId, {
        giftList: validGifts,
        operator: currentUser,
        remark: remark
      });
      await orderApi.complete(orderId, { operator: currentUser });
      message.success('赠品配置完成，订单已闭环');
      onClose();
    } catch (error) {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  const giftColumns = [
    {
      title: '赠品名称',
      dataIndex: 'giftName',
      key: 'giftName',
      width: 200,
      render: (_: any, record: GiftFormItem, index: number) => (
        <Input
          placeholder="请输入赠品名称"
          value={record.giftName}
          onChange={(e) => updateGift(index, 'giftName', e.target.value)}
        />
      )
    },
    {
      title: '赠送数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      render: (_: any, record: GiftFormItem, index: number) => (
        <InputNumber
          min={1}
          value={record.quantity}
          onChange={(v) => updateGift(index, 'quantity', v || 1)}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: '赠送条件',
      dataIndex: 'condition',
      key: 'condition',
      render: (_: any, record: GiftFormItem, index: number) => (
        <Input
          placeholder="如: 单笔满199赠"
          value={record.condition}
          onChange={(e) => updateGift(index, 'condition', e.target.value)}
        />
      )
    },
    {
      title: '可用库存',
      dataIndex: 'stock',
      key: 'stock',
      width: 100,
      render: (_: any, record: GiftFormItem, index: number) => (
        <InputNumber
          min={0}
          value={record.stock}
          onChange={(v) => updateGift(index, 'stock', v || 0)}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 60,
      render: (_: any, __: any, index: number) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeGift(index)}
          disabled={gifts.length === 1}
        />
      )
    }
  ];

  if (!order) return null;

  const handover = extractHandoverInfo(order.operationLogs);

  return (
    <Modal
      title={
        <Space>
          <GiftOutlined style={{ color: '#52c41a' }} />
          <span>赠品配置 - {order.orderNo}</span>
          <Tag color={StatusColors[order.status]}>{StatusNames[order.status]}</Tag>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={1100}
      footer={null}
      destroyOnHidden
    >
      <Alert
        message="交接信息（从库存锁定无缝衔接）"
        description={
          <Space direction="vertical" size={6} style={{ width: '100%' }}>
            <Descriptions column={3} size="small" style={{ marginBottom: 0 }}>
              <Descriptions.Item label="直播场次">
                <Text strong>{order.liveSessionName}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="当前处理人">
                <Tag color="green">{order.currentHandler}</Tag>
                <Text type="secondary">（{RoleNames[order.currentHandlerRole]}）</Text>
              </Descriptions.Item>
              <Descriptions.Item label="创建人">
                {order.createdBy}（{RoleNames[order.createdByRole]}）
              </Descriptions.Item>
            </Descriptions>
            {order.priceRemark && (
              <div>
                <Tag color="orange">价格口径</Tag>
                <Text type="warning">{order.priceRemark}</Text>
              </div>
            )}
          </Space>
        }
        type="success"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 16 }}
      />

      <Card 
        title={
          <Space>
            <span>历史交接说明</span>
            {handover.totalExceptionCount > 0 && (
              <Tag color="red">历经 {handover.totalExceptionCount} 次异常处理</Tag>
            )}
          </Space>
        } 
        size="small" 
        style={{ marginBottom: 16 }}
      >
        <Steps
          direction="vertical"
          size="small"
          current={2}
          items={[
            {
              icon: <ShoppingCartOutlined />,
              title: (
                <Space>
                  <span>主播助理锁定库存（最新一次）</span>
                  {handover.lockOperator && (
                    <Tag color="blue">{handover.lockOperator}</Tag>
                  )}
                  {handover.lockTime && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(handover.lockTime).format('MM-DD HH:mm')}
                    </Text>
                  )}
                </Space>
              ),
              description: handover.lockRemark ? (
                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  锁定备注: {handover.lockRemark}
                </Paragraph>
              ) : (
                <Text type="secondary">无备注</Text>
              ),
              status: 'finish'
            },
            {
              icon: <ControlOutlined />,
              title: (
                <Space>
                  <span>场控审核通过（最新一次）</span>
                  {handover.reviewOperator && (
                    <Tag color="orange">{handover.reviewOperator}</Tag>
                  )}
                  {handover.reviewTime && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(handover.reviewTime).format('MM-DD HH:mm')}
                    </Text>
                  )}
                </Space>
              ),
              description: (
                <Space direction="vertical" size={4}>
                  {handover.reviewRemark ? (
                    <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                      通过意见: {handover.reviewRemark}
                    </Paragraph>
                  ) : (
                    <Text type="secondary">无审核意见</Text>
                  )}
                </Space>
              ),
              status: 'finish'
            },
            {
              icon: <CustomerServiceOutlined />,
              title: (
                <Space>
                  <span>售后组长配置赠品</span>
                  <Tag color="green">{currentUser}（当前）</Tag>
                </Space>
              ),
              description: <Text type="secondary">请配置赠品并核对所有交接信息</Text>,
              status: 'process'
            }
          ]}
        />

        {(handover.hasRejectHistory || handover.hasReturnHistory) && (
          <>
            <Divider style={{ margin: '16px 0' }} />
            <div>
              <Text strong style={{ marginBottom: 8, display: 'inline-block' }}>
                历次异常处理记录（按时间倒序）
              </Text>
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                {handover.rejectHistory.map((item, index) => (
                  <div 
                    key={`reject-${index}`}
                    style={{ 
                      padding: '8px 12px', 
                      background: '#fff2f0', 
                      borderRadius: 4,
                      borderLeft: '3px solid #ff4d4f'
                    }}
                  >
                    <Space>
                      <Tag color="red">驳回</Tag>
                      <Text strong>{item.operator}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(item.time).format('MM-DD HH:mm')}
                      </Text>
                    </Space>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      原因: {item.reason}
                    </Text>
                  </div>
                ))}
                {handover.returnHistory.map((item, index) => (
                  <div 
                    key={`return-${index}`}
                    style={{ 
                      padding: '8px 12px', 
                      background: '#fff7e6', 
                      borderRadius: 4,
                      borderLeft: '3px solid #faad14'
                    }}
                  >
                    <Space>
                      <Tag color="orange">退回</Tag>
                      <Text strong>{item.operator}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(item.time).format('MM-DD HH:mm')}
                      </Text>
                    </Space>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      原因: {item.reason}
                    </Text>
                  </div>
                ))}
              </Space>
            </div>
          </>
        )}
      </Card>

      <Card 
        title="关联的SKU信息 (库存已锁定)" 
        size="small" 
        style={{ marginBottom: 16 }}
      >
        <Descriptions column={3} size="small">
          {order.skuList.map(sku => (
            <Descriptions.Item key={sku.skuId} label={sku.skuName}>
              锁定 {sku.stockLocked}{sku.unit} | 直播价 ¥{sku.livePrice}
            </Descriptions.Item>
          ))}
        </Descriptions>
      </Card>

      <Card 
        title="常用赠品模板" 
        size="small" 
        style={{ marginBottom: 16 }}
        extra={<Text type="secondary">点击快速添加</Text>}
      >
        <Space wrap>
          {presetGifts.map(preset => (
            <Tag
              key={preset.giftId}
              color="green"
              style={{ cursor: 'pointer', padding: '4px 12px' }}
              onClick={() => addPresetGift(preset)}
            >
              + {preset.giftName}
            </Tag>
          ))}
        </Space>
      </Card>

      <Card 
        title={
          <Space>
            <span>赠品明细</span>
            <Tag color="blue">{gifts.filter(g => g.giftName).length} 个赠品</Tag>
          </Space>
        }
        size="small"
        style={{ marginBottom: 16 }}
        extra={
          <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addGift}>
            添加赠品
          </Button>
        }
      >
        <Table
          rowKey={(record, index) => `gift-${index}`}
          columns={giftColumns}
          dataSource={gifts}
          pagination={false}
          size="small"
        />
      </Card>

      <Card title="配置说明" size="small" style={{ marginBottom: 16 }}>
        <Input.TextArea
          rows={3}
          placeholder="请填写赠品配置说明，如特殊赠品发放规则、补发条件等，避免售后纠纷"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
        />
      </Card>

      <div style={{ textAlign: 'right', paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button 
            icon={<SaveOutlined />} 
            onClick={handleSubmit}
            loading={loading}
          >
            保存配置
          </Button>
          <Button 
            type="primary" 
            icon={<CheckCircleOutlined />}
            onClick={handleComplete}
            loading={loading}
          >
            确认并完成
          </Button>
        </Space>
      </div>
    </Modal>
  );
};

export default GiftConfigPage;
