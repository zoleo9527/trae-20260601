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
  InputNumber, 
  Select, 
  DatePicker,
  message,
  Popconfirm,
  Typography,
  Row,
  Col
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  EyeOutlined, 
  ReloadOutlined 
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
import dayjs, { Dayjs } from 'dayjs';
import LockOrderDetail from './LockOrderDetail';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface SkuFormItem {
  skuId: string;
  skuName: string;
  originalPrice: number;
  livePrice: number;
  stockAvailable: number;
  unit: string;
}

const AssistantPage: React.FC = () => {
  const { currentRole, currentUser, setSelectedOrder } = useAppStore();
  const [orders, setOrders] = useState<InventoryLockOrder[]>([]);
  const [stats, setStats] = useState({ total: 0, pendingReview: 0, giftConfiguring: 0, rejected: 0, completed: 0, urgent: 0 });
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [skus, setSkus] = useState<SkuFormItem[]>([
    { skuId: '', skuName: '', originalPrice: 0, livePrice: 0, stockAvailable: 0, unit: '件' }
  ]);

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

  const handleCreate = async (values: any) => {
    try {
      const validSkus = skus.filter(s => s.skuId && s.skuName && s.stockAvailable > 0);
      if (validSkus.length === 0) {
        message.error('请至少添加一个有效SKU');
        return;
      }

      await orderApi.create({
        liveSessionId: values.liveSessionId,
        liveSessionName: values.liveSessionName,
        skuList: validSkus,
        priority: values.priority,
        priceRemark: values.priceRemark || '',
        createdBy: currentUser,
        expectedLiveTime: values.expectedLiveTime?.toISOString()
      });

      message.success('创建成功');
      setCreateModalVisible(false);
      form.resetFields();
      setSkus([{ skuId: '', skuName: '', originalPrice: 0, livePrice: 0, stockAvailable: 0, unit: '件' }]);
      fetchData();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const handleViewDetail = (order: InventoryLockOrder) => {
    setSelectedOrder(order);
    setSelectedId(order.id);
    setDetailVisible(true);
  };

  const handleReEdit = async (id: string) => {
    try {
      await orderApi.reEdit(id, { operator: currentUser });
      message.success('已进入重新编辑状态');
      fetchData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const addSku = () => {
    setSkus([...skus, { skuId: '', skuName: '', originalPrice: 0, livePrice: 0, stockAvailable: 0, unit: '件' }]);
  };

  const removeSku = (index: number) => {
    if (skus.length > 1) {
      setSkus(skus.filter((_, i) => i !== index));
    }
  };

  const updateSku = (index: number, field: keyof SkuFormItem, value: any) => {
    const newSkus = [...skus];
    newSkus[index] = { ...newSkus[index], [field]: value };
    setSkus(newSkus);
  };

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
      title: 'SKU数量',
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
      title: '当前处理人',
      dataIndex: 'currentHandler',
      key: 'currentHandler',
      width: 100,
    },
    {
      title: '预计开播',
      dataIndex: 'expectedLiveTime',
      key: 'expectedLiveTime',
      width: 150,
      render: (time: string) => time ? dayjs(time).format('MM-DD HH:mm') : '-'
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (time: string) => dayjs(time).format('MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
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
          {['REVIEW_REJECTED', 'RETURNED', 'PENDING_LOCK'].includes(record.status) && (
            <Button 
              type="link" 
              size="small" 
              icon={<EditOutlined />}
              onClick={() => handleReEdit(record.id)}
            >
              {record.status === 'PENDING_LOCK' ? '锁定库存' : '重新编辑'}
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
          <Title level={4} style={{ margin: 0 }}>主播助理工作台</Title>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
              新建库存锁定单
            </Button>
          </Space>
        </Space>
      </Card>

      <StatsCards stats={stats} />

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={orders}
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title="新建库存锁定单"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={900}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="场次ID"
                name="liveSessionId"
                rules={[{ required: true, message: '请输入场次ID' }]}
              >
                <Input placeholder="如: LIVE-001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="直播场次名称"
                name="liveSessionName"
                rules={[{ required: true, message: '请输入场次名称' }]}
              >
                <Input placeholder="如: 618大促专场-美妆护肤" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="优先级"
                name="priority"
                initialValue="NORMAL"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="NORMAL">普通</Option>
                  <Option value="URGENT">紧急</Option>
                  <Option value="EXTREME">特急 (立即处理)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="预计开播时间"
                name="expectedLiveTime"
              >
                <DatePicker 
                  showTime 
                  style={{ width: '100%' }}
                  format="YYYY-MM-DD HH:mm"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="SKU列表">
            <div style={{ border: '1px solid #f0f0f0', padding: 16, borderRadius: 8 }}>
              {skus.map((sku, index) => (
                <Row key={index} gutter={8} style={{ marginBottom: 8 }} align="middle">
                  <Col span={4}>
                    <Input 
                      placeholder="SKU编码" 
                      value={sku.skuId}
                      onChange={(e) => updateSku(index, 'skuId', e.target.value)}
                    />
                  </Col>
                  <Col span={5}>
                    <Input 
                      placeholder="商品名称" 
                      value={sku.skuName}
                      onChange={(e) => updateSku(index, 'skuName', e.target.value)}
                    />
                  </Col>
                  <Col span={3}>
                    <InputNumber 
                      placeholder="原价" 
                      style={{ width: '100%' }}
                      min={0}
                      value={sku.originalPrice}
                      onChange={(v) => updateSku(index, 'originalPrice', v || 0)}
                    />
                  </Col>
                  <Col span={3}>
                    <InputNumber 
                      placeholder="直播价" 
                      style={{ width: '100%' }}
                      min={0}
                      value={sku.livePrice}
                      onChange={(v) => updateSku(index, 'livePrice', v || 0)}
                    />
                  </Col>
                  <Col span={3}>
                    <InputNumber 
                      placeholder="可锁库存" 
                      style={{ width: '100%' }}
                      min={0}
                      value={sku.stockAvailable}
                      onChange={(v) => updateSku(index, 'stockAvailable', v || 0)}
                    />
                  </Col>
                  <Col span={3}>
                    <Select 
                      value={sku.unit}
                      onChange={(v) => updateSku(index, 'unit', v)}
                    >
                      <Option value="件">件</Option>
                      <Option value="个">个</Option>
                      <Option value="瓶">瓶</Option>
                      <Option value="套">套</Option>
                    </Select>
                  </Col>
                  <Col span={3}>
                    <Button 
                      type="text" 
                      danger 
                      onClick={() => removeSku(index)}
                      disabled={skus.length === 1}
                    >
                      删除
                    </Button>
                  </Col>
                </Row>
              ))}
              <Button type="dashed" block onClick={addSku} icon={<PlusOutlined />}>
                添加SKU
              </Button>
            </div>
          </Form.Item>

          <Form.Item
            label="价格口径说明"
            name="priceRemark"
            tooltip="请详细说明价格计算规则，避免价格口径错误"
          >
            <TextArea 
              rows={3} 
              placeholder="如: 主播直播间专属价，比日常低50%，满299减50..."
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setCreateModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">创建锁定单</Button>
            </Space>
          </Form.Item>
        </Form>
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

export default AssistantPage;
