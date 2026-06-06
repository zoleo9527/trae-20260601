import { useState } from 'react';
import {
  Table,
  Button,
  Tag,
  Space,
  Select,
  Input,
  Card,
  Row,
  Col,
  Statistic,
  Image,
  Modal,
  Form,
  InputNumber,
  message,
} from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useStore } from '@/store';
import type { ProductStatus } from '@/types';

const { Search } = Input;

const statusMap: Record<ProductStatus, { text: string; color: string }> = {
  PENDING: { text: '待审核', color: 'warning' },
  APPROVED: { text: '已通过', color: 'success' },
  REJECTED: { text: '已拒绝', color: 'error' },
  OFF_SHELF: { text: '已下架', color: 'default' },
};

const ProductPool = () => {
  const navigate = useNavigate();
  const products = useStore((state) => state.products);
  const approveProduct = useStore((state) => state.approveProduct);
  const rejectProduct = useStore((state) => state.rejectProduct);
  const createProduct = useStore((state) => state.createProduct);

  const [statusFilter, setStatusFilter] = useState<ProductStatus | undefined>();
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [searchText, setSearchText] = useState('');
  const [createModal, setCreateModal] = useState(false);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [rejectForm] = Form.useForm();

  const categories = [...new Set(products.map((p) => p.category))];

  const filteredProducts = products.filter((p) => {
    const matchStatus = !statusFilter || p.status === statusFilter;
    const matchCategory = !categoryFilter || p.category === categoryFilter;
    const matchSearch =
      !searchText ||
      p.name.toLowerCase().includes(searchText.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchText.toLowerCase());
    return matchStatus && matchCategory && matchSearch;
  });

  const stats = {
    total: products.length,
    pending: products.filter((p) => p.status === 'PENDING').length,
    approved: products.filter((p) => p.status === 'APPROVED').length,
    rejected: products.filter((p) => p.status === 'REJECTED').length,
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      createProduct(values);
      message.success('商品创建成功，等待审核');
      setCreateModal(false);
      form.resetFields();
    } catch (e) {
      // validation error
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    try {
      const values = await rejectForm.validateFields();
      const success = rejectProduct(rejectModal, values.remark);
      if (success) {
        message.success('已拒绝该商品');
        setRejectModal(null);
        rejectForm.resetFields();
      }
    } catch (e) {
      // validation error
    }
  };

  const handleApprove = (id: string) => {
    const success = approveProduct(id);
    if (success) message.success('商品审核通过');
  };

  const columns = [
    {
      title: '商品图片',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 80,
      render: (url: string) => <Image width={50} height={50} src={url} style={{ objectFit: 'cover' }} />,
    },
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text: string, record: any) => (
        <a onClick={() => navigate(`/products/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 150,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
    },
    {
      title: '售价',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (v: number) => `¥${v}`,
    },
    {
      title: '原价',
      dataIndex: 'originalPrice',
      key: 'originalPrice',
      width: 100,
      render: (v: number) => (
        <span style={{ textDecoration: 'line-through', color: '#999' }}>¥{v}</span>
      ),
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ProductStatus) => {
        const cfg = statusMap[status];
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 80,
      render: (v: number) => `v${v}`,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/products/${record.id}`)}
          >
            详情
          </Button>
          {record.status === 'PENDING' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleApprove(record.id)}
                style={{ color: '#52c41a' }}
              >
                通过
              </Button>
              <Button
                type="link"
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => setRejectModal(record.id)}
              >
                拒绝
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Card>
            <Statistic title="商品总数" value={stats.total} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="待审核" value={stats.pending} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="已通过" value={stats.approved} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="已拒绝" value={stats.rejected} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
      </Row>

      <Card
        title="商品池"
        extra={
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModal(true)}>
              新增商品
            </Button>
          </Space>
        }
      >
        <Space style={{ marginBottom: 16 }} wrap>
          <Search
            placeholder="搜索商品名称或SKU"
            allowClear
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Select
            placeholder="筛选状态"
            allowClear
            style={{ width: 150 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={Object.entries(statusMap).map(([key, val]) => ({
              value: key,
              label: val.text,
            }))}
          />
          <Select
            placeholder="筛选分类"
            allowClear
            style={{ width: 150 }}
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={categories.map((c) => ({ value: c, label: c }))}
          />
        </Space>

        <Table
          columns={columns}
          dataSource={filteredProducts}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1300 }}
        />
      </Card>

      <Modal
        title="新增商品"
        open={createModal}
        onOk={handleCreate}
        onCancel={() => setCreateModal(false)}
        okText="创建"
        width={600}
      >
        <Form form={form} layout="vertical">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="name"
              label="商品名称"
              rules={[{ required: true, message: '请输入商品名称' }]}
            >
              <Input placeholder="商品名称" />
            </Form.Item>
            <Form.Item
              name="sku"
              label="SKU编码"
              rules={[{ required: true, message: '请输入SKU' }]}
            >
              <Input placeholder="例如：BAG-001-BLK" />
            </Form.Item>
            <Form.Item
              name="category"
              label="商品分类"
              rules={[{ required: true, message: '请选择分类' }]}
            >
              <Select
                options={[
                  { value: '箱包', label: '箱包' },
                  { value: '数码', label: '数码' },
                  { value: '美妆', label: '美妆' },
                  { value: '服饰', label: '服饰' },
                  { value: '食品', label: '食品' },
                  { value: '家居', label: '家居' },
                ]}
              />
            </Form.Item>
            <Form.Item
              name="stock"
              label="库存数量"
              rules={[{ required: true, message: '请输入库存' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="库存数量" />
            </Form.Item>
            <Form.Item
              name="price"
              label="直播售价"
              rules={[{ required: true, message: '请输入售价' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="直播售价" />
            </Form.Item>
            <Form.Item
              name="originalPrice"
              label="市场原价"
              rules={[{ required: true, message: '请输入原价' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="市场原价" />
            </Form.Item>
          </div>
          <Form.Item name="imageUrl" label="商品图片URL">
            <Input placeholder="https://..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="拒绝商品"
        open={!!rejectModal}
        onOk={handleReject}
        onCancel={() => setRejectModal(null)}
        okText="确认拒绝"
        okButtonProps={{ danger: true }}
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            name="remark"
            label="拒绝原因"
            rules={[{ required: true, message: '请输入拒绝原因' }]}
          >
            <Input.TextArea rows={4} placeholder="请详细说明拒绝原因..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductPool;
