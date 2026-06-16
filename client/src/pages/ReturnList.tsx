import { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  Input, 
  Select, 
  Tag, 
  Card, 
  Row, 
  Col, 
  Statistic,
  Modal,
  Form,
  InputNumber,
  DatePicker,
  message,
  Popconfirm,
  Dropdown,
  Alert,
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  EyeOutlined, 
  CheckCircleOutlined,
  CloseCircleOutlined,
  MoreOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/appStore';
import { addHealthListener } from '../api';
import { 
  REQUEST_STATUS_MAP, 
  REQUEST_TYPE_MAP, 
  REASON_CATEGORIES,
  type RequestStatus,
  type RequestType,
} from '../types';
import type { ColumnsType } from 'antd/es/table';
import type { ReturnExchangeRequest } from '../types';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;

export default function ReturnList() {
  const navigate = useNavigate();
  const { 
    returnList, 
    loadingReturns, 
    error,
    fetchReturnList,
    batchWarehouseConfirm,
    batchCancel,
    currentUser,
    serviceHealthy,
    setServiceHealthy,
  } = useAppStore();

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [status, setStatus] = useState<string | undefined>();
  const [type, setType] = useState<string | undefined>();
  const [keyword, setKeyword] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createForm] = Form.useForm();

  useEffect(() => {
    const removeListener = addHealthListener(setServiceHealthy);
    return removeListener;
  }, [setServiceHealthy]);

  useEffect(() => {
    fetchReturnList({ status, type, keyword, page, pageSize });
  }, [status, type, keyword, page, pageSize]);

  const handleSearch = (value: string) => {
    setKeyword(value);
    setPage(1);
  };

  const handleStatusChange = (value: string | undefined) => {
    setStatus(value);
    setPage(1);
  };

  const handleTypeChange = (value: string | undefined) => {
    setType(value);
    setPage(1);
  };

  const handleBatchWarehouseConfirm = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要确认的申请');
      return;
    }
    try {
      await batchWarehouseConfirm({
        ids: selectedRowKeys as string[],
        operator: currentUser.name,
        operator_role: currentUser.role,
      });
      message.success(`成功确认 ${selectedRowKeys.length} 条申请`);
      setSelectedRowKeys([]);
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const handleBatchCancel = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要取消的申请');
      return;
    }
    Modal.confirm({
      title: '确认取消',
      content: `确定要取消选中的 ${selectedRowKeys.length} 条申请吗？`,
      onOk: async () => {
        try {
          await batchCancel({
            ids: selectedRowKeys as string[],
            operator: currentUser.name,
            operator_role: currentUser.role,
          });
          message.success(`成功取消 ${selectedRowKeys.length} 条申请`);
          setSelectedRowKeys([]);
        } catch (error: any) {
          message.error(error.message || '操作失败');
        }
      },
    });
  };

  const columns: ColumnsType<ReturnExchangeRequest> = [
    {
      title: '申请单号',
      dataIndex: 'request_no',
      key: 'request_no',
      width: 150,
      render: (text) => <a onClick={() => navigate(`/returns/${returnList?.list.find(r => r.request_no === text)?.id}`)}>{text}</a>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: RequestType) => (
        <Tag color={REQUEST_TYPE_MAP[type].color}>
          {REQUEST_TYPE_MAP[type].label}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: RequestStatus) => (
        <Tag color={REQUEST_STATUS_MAP[status].color}>
          {REQUEST_STATUS_MAP[status].label}
        </Tag>
      ),
    },
    {
      title: '关联订单',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 140,
    },
    {
      title: '客户名称',
      dataIndex: 'customer_name',
      key: 'customer_name',
      width: 200,
    },
    {
      title: '商品数量',
      dataIndex: 'item_count',
      key: 'item_count',
      width: 100,
      render: (count) => `${count} 项`,
    },
    {
      title: '申请人',
      dataIndex: 'applicant',
      key: 'applicant',
      width: 100,
    },
    {
      title: '申请时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => navigate(`/returns/${record.id}`)}
          >
            查看
          </Button>
        </Space>
      ),
    },
  ];

  const stats = [
    { title: '全部申请', value: returnList?.total || 0, color: '#1677ff' },
    { title: '待仓库确认', value: returnList?.list.filter(r => r.status === 'pending_warehouse').length || 0, color: '#faad14' },
    { title: '补发中', value: returnList?.list.filter(r => r.status === 'reissuing').length || 0, color: '#13c2c2' },
    { title: '已完成', value: returnList?.list.filter(r => r.status === 'completed').length || 0, color: '#52c41a' },
  ];

  const canBatchConfirm = currentUser.role === 'warehouse_manager';
  const canBatchCancel = currentUser.role === 'customer_service' || currentUser.role === 'warehouse_manager';

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          {stats.map((stat, index) => (
            <Col span={6} key={index}>
              <Statistic 
                title={stat.title} 
                value={stat.value}
                valueStyle={{ color: stat.color }}
              />
            </Col>
          ))}
        </Row>
      </Card>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Search
              placeholder="搜索申请单号、订单号、客户名称"
              allowClear
              enterButton={<SearchOutlined />}
              size="middle"
              style={{ width: 320 }}
              onSearch={handleSearch}
            />
            <Select
              placeholder="状态筛选"
              allowClear
              style={{ width: 150 }}
              onChange={handleStatusChange}
              value={status}
            >
              {Object.entries(REQUEST_STATUS_MAP).map(([key, val]) => (
                <Option key={key} value={key}>{val.label}</Option>
              ))}
            </Select>
            <Select
              placeholder="类型筛选"
              allowClear
              style={{ width: 120 }}
              onChange={handleTypeChange}
              value={type}
            >
              <Option value="return">退货</Option>
              <Option value="exchange">换货</Option>
            </Select>
          </Space>
          <Space>
            {canBatchConfirm && (
              <Button 
                icon={<CheckCircleOutlined />}
                disabled={selectedRowKeys.length === 0}
                onClick={handleBatchWarehouseConfirm}
              >
                批量确认
              </Button>
            )}
            {canBatchCancel && (
              <Popconfirm
                title="确认取消"
                description="确定要取消选中的申请吗？"
                disabled={selectedRowKeys.length === 0}
                onConfirm={handleBatchCancel}
              >
                <Button 
                  danger
                  icon={<CloseCircleOutlined />}
                  disabled={selectedRowKeys.length === 0}
                >
                  批量取消
                </Button>
              </Popconfirm>
            )}
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
              新建申请
            </Button>
          </Space>
        </div>

        {!serviceHealthy && (
          <Alert
            type="warning"
            message="后端服务暂时不可用"
            description="正在尝试自动重连，服务恢复后将自动刷新数据..."
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {error && serviceHealthy && (
          <Alert
            type="error"
            message="服务暂时不可用"
            description={error}
            showIcon
            style={{ marginBottom: 16 }}
            action={
              <Button size="small" type="primary" onClick={() => fetchReturnList({ status, type, keyword, page, pageSize })}>
                重新加载
              </Button>
            }
          />
        )}

        <Table
          rowKey="id"
          columns={columns}
          dataSource={returnList?.list || []}
          loading={loadingReturns}
          locale={{ 
            emptyText: error ? '加载失败，请点击重新加载' : '暂无数据' 
          }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            getCheckboxProps: (record) => ({
              disabled: record.status === 'completed' || record.status === 'cancelled',
            }),
          }}
          pagination={{
            current: page,
            pageSize,
            total: returnList?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title="新建退换货申请"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={800}
        destroyOnHidden
      >
        <CreateReturnForm 
          form={createForm}
          onSuccess={() => {
            setCreateModalVisible(false);
            fetchReturnList({ status, type, keyword, page, pageSize });
            message.success('创建成功');
          }}
        />
      </Modal>
    </div>
  );
}

function CreateReturnForm({ form, onSuccess }: { 
  form: any; 
  onSuccess: () => void;
}) {
  const { createReturnRequest, currentUser, fetchOrderList, orderList, fetchOrderDetail, orderDetail, loadingOrders } = useAppStore();
  const [orderOptions, setOrderOptions] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrderList({ status: 'delivered', pageSize: 100 });
  }, []);

  useEffect(() => {
    if (orderList?.list) {
      setOrderOptions(orderList.list.map(o => ({
        label: `${o.order_no} - ${o.customer_name}`,
        value: o.id,
        ...o,
      })));
    }
  }, [orderList]);

  const handleOrderChange = async (orderId: string) => {
    setSelectedOrderId(orderId);
    if (orderId) {
      await fetchOrderDetail(orderId);
    }
  };

  useEffect(() => {
    if (orderDetail?.id === selectedOrderId && orderDetail?.items) {
      form.setFieldsValue({
        items: orderDetail.items.map((item: any) => ({
          product_name: item.product_name,
          product_code: item.product_code,
          quantity: 0,
          unit: item.unit,
          warehouse_location: item.warehouse_location,
          original_quantity: item.quantity,
        })),
      });
    }
  }, [orderDetail, selectedOrderId, form]);

  const handleSubmit = async (values: any) => {
    try {
      const items = values.items?.filter((item: any) => item.quantity > 0) || [];
      if (items.length === 0) {
        message.error('请至少选择一项商品并填写数量');
        return;
      }
      
      await createReturnRequest({
        order_id: values.order_id,
        type: values.type,
        reason: values.reason,
        reason_category: values.reason_category,
        applicant: currentUser.name,
        applicant_role: currentUser.role,
        remarks: values.remarks,
        items: items.map((item: any) => ({
          product_name: item.product_name,
          product_code: item.product_code,
          quantity: item.quantity,
          unit: item.unit,
          warehouse_location: item.warehouse_location,
        })),
      });
      onSuccess();
    } catch (error: any) {
      message.error(error.message || '创建失败');
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
    >
      <Form.Item
        name="order_id"
        label="关联订单"
        rules={[{ required: true, message: '请选择关联订单' }]}
      >
        <Select
          showSearch
          placeholder="选择要退换货的订单"
          optionFilterProp="label"
          onChange={handleOrderChange}
          options={orderOptions}
        />
      </Form.Item>

      <Form.Item
        name="type"
        label="申请类型"
        rules={[{ required: true, message: '请选择申请类型' }]}
      >
        <Select>
          <Option value="return">退货</Option>
          <Option value="exchange">换货</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="reason_category"
        label="原因分类"
      >
        <Select placeholder="请选择原因分类">
          {REASON_CATEGORIES.map(cat => (
            <Option key={cat} value={cat}>{cat}</Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="reason"
        label="原因说明"
      >
        <Input.TextArea rows={3} placeholder="请详细描述退换货原因" />
      </Form.Item>

      <Form.Item label="退换商品">
        {loadingOrders && (
          <div style={{ padding: '16px 0', textAlign: 'center', color: '#999' }}>
            正在加载商品明细...
          </div>
        )}
        <Form.List name="items">
          {(fields, { add, remove }) => (
            <>
              {fields.length > 0 && (
                <Row gutter={8} style={{ marginBottom: 8, padding: '0 8px', fontWeight: 500, color: '#666' }}>
                  <Col span={8}>商品名称</Col>
                  <Col span={4}>原数量</Col>
                  <Col span={4}>退换数量</Col>
                  <Col span={3}>单位</Col>
                  <Col span={4}>库位</Col>
                </Row>
              )}
              {fields.map(({ key, name, ...restField }) => (
                <Row key={key} gutter={8} style={{ marginBottom: 8 }}>
                  <Col span={8}>
                    <Form.Item
                      {...restField}
                      name={[name, 'product_name']}
                      style={{ marginBottom: 0 }}
                    >
                      <Input placeholder="商品名称" readOnly />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item
                      {...restField}
                      name={[name, 'original_quantity']}
                      style={{ marginBottom: 0 }}
                    >
                      <Input readOnly style={{ backgroundColor: '#f5f5f5' }} />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item
                      {...restField}
                      name={[name, 'quantity']}
                      rules={[{ required: true, message: '请输入数量' }]}
                      style={{ marginBottom: 0 }}
                    >
                      <InputNumber min={0} placeholder="数量" style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={3}>
                    <Form.Item
                      {...restField}
                      name={[name, 'unit']}
                      style={{ marginBottom: 0 }}
                    >
                      <Input placeholder="单位" readOnly />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item
                      {...restField}
                      name={[name, 'warehouse_location']}
                      style={{ marginBottom: 0 }}
                    >
                      <Input placeholder="库位" readOnly />
                    </Form.Item>
                  </Col>
                </Row>
              ))}
              {!selectedOrderId && (
                <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>
                  添加商品
                </Button>
              )}
            </>
          )}
        </Form.List>
      </Form.Item>

      <Form.Item name="remarks" label="备注">
        <Input.TextArea rows={2} placeholder="其他备注信息" />
      </Form.Item>

      <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
        <Space>
          <Button onClick={() => form.resetFields()}>重置</Button>
          <Button type="primary" htmlType="submit">
            创建草稿
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
}
