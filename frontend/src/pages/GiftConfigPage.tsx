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
  message
} from 'antd';
import { 
  PlusOutlined, 
  GiftOutlined, 
  DeleteOutlined,
  SaveOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { GiftItem, InventoryLockOrder, RoleNames, StatusNames, StatusColors } from '../types';
import { orderApi } from '../api';
import { useAppStore } from '../store';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';

const { Text } = Typography;

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
      width={1000}
      footer={null}
      destroyOnHidden
    >
      <Alert
        message="无缝衔接提示"
        description={
          <Space direction="vertical" size={4}>
            <Text>
              来自场次: <Text strong>{order.liveSessionName}</Text>
            </Text>
            <Text>
              创建人: {order.createdBy} ({RoleNames[order.createdByRole]}) | 
              当前处理角色: {RoleNames[order.currentHandlerRole]}
            </Text>
            <Text type="secondary">
              价格口径: {order.priceRemark || '无特殊说明'}
            </Text>
          </Space>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

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
