import { useState, useEffect } from 'react';
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Image,
  Tabs,
  Timeline,
  Spin,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { productApi } from '@/services/api';
import type { ProductStatus, WorkflowRecord, Product } from '@/types';

const statusMap: Record<ProductStatus, { text: string; color: string }> = {
  PENDING: { text: '待审核', color: 'warning' },
  APPROVED: { text: '已通过', color: 'success' },
  REJECTED: { text: '已拒绝', color: 'error' },
  OFF_SHELF: { text: '已下架', color: 'default' },
};

const actionTypeMap: Record<string, { text: string; color: string }> = {
  CREATE: { text: '创建', color: '#1890ff' },
  UPDATE: { text: '更新', color: '#52c41a' },
  APPROVE: { text: '审核通过', color: '#52c41a' },
  REJECT: { text: '审核拒绝', color: '#ff4d4f' },
};

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<(Product & { history: WorkflowRecord[] }) | null>(null);

  const fetchDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await productApi.getDetail(id);
      setProduct(res.data);
    } catch (e: any) {
      message.error(e.message || '加载详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  if (!product && loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!product) {
    return <div>商品不存在</div>;
  }

  const cfg = statusMap[product.status];

  const renderTimeline = () => (
    <Timeline
      items={product.history.map((record: WorkflowRecord) => ({
        color: actionTypeMap[record.actionType]?.color || 'blue',
        children: (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Tag color={actionTypeMap[record.actionType]?.color}>
                {actionTypeMap[record.actionType]?.text || record.actionType}
              </Tag>
              <span style={{ color: '#999', fontSize: 12 }}>
                v{record.bizVersion} · {dayjs(record.actionAt).format('YYYY-MM-DD HH:mm:ss')}
              </span>
            </div>
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: '#666' }}>操作人：</span>
              {record.actionBy}
            </div>
            {record.previousStatus && (
              <div style={{ marginBottom: 4, color: '#666' }}>
                {statusMap[record.previousStatus as ProductStatus]?.text} →{' '}
                {statusMap[record.newStatus as ProductStatus]?.text}
              </div>
            )}
            {record.remark && <div style={{ color: '#333' }}>备注：{record.remark}</div>}
            <div style={{ color: '#bbb', fontSize: 11, marginTop: 4 }}>
              幂等键: {record.idempotencyKey.slice(0, 20)}...
            </div>
          </div>
        ),
      }))}
    />
  );

  const tabItems = [
    {
      key: 'info',
      label: (
        <span>
          <InfoCircleOutlined /> 商品信息
        </span>
      ),
      children: (
        <div style={{ display: 'flex', gap: 32 }}>
          <div>
            <Image width={200} height={200} src={product.imageUrl} style={{ objectFit: 'cover', borderRadius: 8 }} />
          </div>
          <div style={{ flex: 1 }}>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="商品名称">{product.name}</Descriptions.Item>
              <Descriptions.Item label="当前状态">
                <Tag color={cfg.color}>{cfg.text}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="SKU编码">{product.sku}</Descriptions.Item>
              <Descriptions.Item label="商品分类">{product.category}</Descriptions.Item>
              <Descriptions.Item label="直播售价">
                <span style={{ color: '#ff4d4f', fontSize: 18, fontWeight: 'bold' }}>¥{product.price}</span>
              </Descriptions.Item>
              <Descriptions.Item label="市场原价">
                <span style={{ textDecoration: 'line-through', color: '#999' }}>¥{product.originalPrice}</span>
              </Descriptions.Item>
              <Descriptions.Item label="库存数量">{product.stock} 件</Descriptions.Item>
              <Descriptions.Item label="当前版本">v{product.version}</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(product.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {dayjs(product.updatedAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            </Descriptions>
          </div>
        </div>
      ),
    },
    {
      key: 'history',
      label: (
        <span>
          <HistoryOutlined /> 操作历史
        </span>
      ),
      children: renderTimeline(),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/products')}>
          返回列表
        </Button>
        <Button icon={<ReloadOutlined />} onClick={fetchDetail}>
          刷新
        </Button>
      </Space>

      <Card
        title={product.name}
        loading={loading}
        extra={<Tag color={cfg.color}>{cfg.text}</Tag>}
      >
        <Tabs items={tabItems} defaultActiveKey="info" />
      </Card>
    </div>
  );
};

export default ProductDetail;
