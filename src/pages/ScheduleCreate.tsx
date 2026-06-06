import { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Space,
  Table,
  Modal,
  Checkbox,
  message,
  Divider,
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useStore } from '@/store';
import type { ScheduleProduct, Product } from '@/types';

const { TextArea } = Input;
const { RangePicker } = DatePicker;

const ScheduleCreate = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const schedule = useStore((state) => (isEdit ? state.getScheduleById(id) : null));
  const products = useStore((state) => state.products);
  const createSchedule = useStore((state) => state.createSchedule);
  const updateSchedule = useStore((state) => state.updateSchedule);
  const supplementSchedule = useStore((state) => state.supplementSchedule);

  const [form] = Form.useForm();
  const [selectedProducts, setSelectedProducts] = useState<ScheduleProduct[]>(
    schedule?.products || [],
  );
  const [productModal, setProductModal] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<Product[]>(
    products.filter((p) => p.status === 'APPROVED'),
  );

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const [start, end] = values.timeRange;

      const scheduleData = {
        title: values.title,
        anchorName: values.anchorName,
        assistantName: values.assistantName,
        platform: values.platform,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        estimatedDuration: end.diff(start, 'minute'),
        products: selectedProducts,
      };

      if (isEdit) {
        if (schedule?.status === 'RETURNED') {
          supplementSchedule(schedule.id, scheduleData, values.remark || '补录完成');
          message.success('补录成功，已回到草稿状态');
        } else {
          updateSchedule(schedule!.id, scheduleData);
          message.success('更新成功');
        }
      } else {
        createSchedule(scheduleData);
        message.success('创建成功');
      }

      navigate('/schedules');
    } catch (e) {
      // validation error
    }
  };

  const handleAddProducts = (productIds: string[]) => {
    const newProducts: ScheduleProduct[] = productIds
      .filter((pid) => !selectedProducts.find((sp) => sp.productId === pid))
      .map((pid, idx) => {
        const p = products.find((prod) => prod.id === pid)!;
        return {
          productId: p.id,
          productName: p.name,
          productSku: p.sku,
          salePrice: p.price,
          plannedQuantity: 100,
          displayOrder: selectedProducts.length + idx + 1,
          isSelected: true,
        };
      });

    setSelectedProducts([...selectedProducts, ...newProducts]);
    setProductModal(false);
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter((p) => p.productId !== productId));
  };

  const handleUpdateProduct = (productId: string, field: keyof ScheduleProduct, value: any) => {
    setSelectedProducts(
      selectedProducts.map((p) => (p.productId === productId ? { ...p, [field]: value } : p)),
    );
  };

  const productColumns = [
    {
      title: '序号',
      dataIndex: 'displayOrder',
      key: 'displayOrder',
      width: 70,
      render: (v: number, _: any, idx: number) => idx + 1,
    },
    {
      title: '商品名称',
      dataIndex: 'productName',
      key: 'productName',
      width: 200,
    },
    {
      title: 'SKU',
      dataIndex: 'productSku',
      key: 'productSku',
      width: 150,
    },
    {
      title: '直播价',
      key: 'salePrice',
      width: 120,
      render: (_: any, record: ScheduleProduct) => (
        <InputNumber
          min={0}
          value={record.salePrice}
          onChange={(v) => handleUpdateProduct(record.productId, 'salePrice', v)}
        />
      ),
    },
    {
      title: '计划数量',
      key: 'plannedQuantity',
      width: 120,
      render: (_: any, record: ScheduleProduct) => (
        <InputNumber
          min={1}
          value={record.plannedQuantity}
          onChange={(v) => handleUpdateProduct(record.productId, 'plannedQuantity', v)}
        />
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      render: (_: any, record: ScheduleProduct) => (
        <Button
          type="link"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveProduct(record.productId)}
        >
          移除
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/schedules')}>
          返回列表
        </Button>
      </Space>

      <Card title={isEdit ? '编辑直播排期' : '新建直播排期'}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            title: schedule?.title || '',
            anchorName: schedule?.anchorName || '',
            assistantName: schedule?.assistantName || '',
            platform: schedule?.platform || '抖音',
            timeRange: schedule
              ? [dayjs(schedule.startTime), dayjs(schedule.endTime)]
              : [dayjs().add(1, 'day').hour(19).minute(0), dayjs().add(1, 'day').hour(21).minute(0)],
            remark: '',
          }}
        >
          <Form.Item
            name="title"
            label="排期标题"
            rules={[{ required: true, message: '请输入排期标题' }]}
          >
            <Input placeholder="例如：618年中大促 - 美妆专场" />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <Form.Item
              name="anchorName"
              label="主播姓名"
              rules={[{ required: true, message: '请输入主播姓名' }]}
            >
              <Input placeholder="主播姓名" />
            </Form.Item>

            <Form.Item
              name="assistantName"
              label="主播助理"
              rules={[{ required: true, message: '请输入主播助理' }]}
            >
              <Input placeholder="主播助理姓名" />
            </Form.Item>

            <Form.Item
              name="platform"
              label="直播平台"
              rules={[{ required: true, message: '请选择直播平台' }]}
            >
              <Select
                options={[
                  { value: '抖音', label: '抖音' },
                  { value: '淘宝', label: '淘宝直播' },
                  { value: '快手', label: '快手' },
                  { value: '视频号', label: '视频号' },
                ]}
              />
            </Form.Item>
          </div>

          <Form.Item
            name="timeRange"
            label="直播时间"
            rules={[{ required: true, message: '请选择直播时间' }]}
          >
            <RangePicker showTime={{ format: 'HH:mm' }} format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
          </Form.Item>

          {schedule?.status === 'RETURNED' && (
            <Form.Item
              name="remark"
              label="补录说明"
              rules={[{ required: true, message: '请输入补录说明' }]}
            >
              <TextArea rows={3} placeholder="请说明补录了哪些内容..." />
            </Form.Item>
          )}

          <Divider orientation="left">选品列表</Divider>

          <div style={{ marginBottom: 16 }}>
            <Button type="dashed" icon={<PlusOutlined />} onClick={() => setProductModal(true)}>
              添加商品
            </Button>
            <span style={{ marginLeft: 16, color: '#999' }}>
              已选择 {selectedProducts.length} 件商品
            </span>
          </div>

          <Table
            columns={productColumns}
            dataSource={selectedProducts}
            rowKey="productId"
            pagination={false}
            size="small"
          />

          <Divider />

          <Form.Item>
            <Space>
              <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
                保存草稿
              </Button>
              <Button onClick={() => navigate('/schedules')}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Modal
        title="选择商品"
        open={productModal}
        onCancel={() => setProductModal(false)}
        width={800}
        footer={null}
      >
        <ProductSelector
          products={availableProducts}
          selectedIds={selectedProducts.map((p) => p.productId)}
          onConfirm={handleAddProducts}
        />
      </Modal>
    </div>
  );
};

const ProductSelector = ({
  products,
  selectedIds,
  onConfirm,
}: {
  products: Product[];
  selectedIds: string[];
  onConfirm: (ids: string[]) => void;
}) => {
  const [checkedIds, setCheckedIds] = useState<string[]>(selectedIds);

  const columns = [
    {
      title: '',
      key: 'select',
      width: 50,
      render: (_: any, record: Product) => (
        <Checkbox
          checked={checkedIds.includes(record.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setCheckedIds([...checkedIds, record.id]);
            } else {
              setCheckedIds(checkedIds.filter((id) => id !== record.id));
            }
          }}
        />
      ),
    },
    { title: '商品名称', dataIndex: 'name', key: 'name' },
    { title: 'SKU', dataIndex: 'sku', key: 'sku' },
    { title: '分类', dataIndex: 'category', key: 'category', width: 100 },
    {
      title: '售价',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (v: number) => `¥${v}`,
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      width: 80,
    },
  ];

  return (
    <div>
      <Table
        columns={columns}
        dataSource={products}
        rowKey="id"
        pagination={{ pageSize: 5 }}
        size="small"
        rowSelection={{
          selectedRowKeys: checkedIds,
          onChange: (keys) => setCheckedIds(keys as string[]),
        }}
      />
      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <Space>
          <Button onClick={() => setCheckedIds([])}>清空</Button>
          <Button type="primary" onClick={() => onConfirm(checkedIds)}>
            确认选择 ({checkedIds.length})
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default ScheduleCreate;
