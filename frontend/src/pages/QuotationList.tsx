import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Tag,
  Select,
  Button,
  Spin,
  Empty,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Space,
  Row,
  Col,
  Divider,
  message,
} from 'antd';
import { EyeOutlined, ReloadOutlined, PlusOutlined, FileTextOutlined } from '@ant-design/icons';
import { quotationAPI, propertyAPI, viewingAPI } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { Quotation, QuotationStatus, Property, ViewingRecord, QuotationItem } from '../types';
import dayjs from 'dayjs';

const quotationStatusNames: Record<QuotationStatus, string> = {
  draft: '草稿',
  submitted: '已提交',
  approved: '已确认',
  rejected: '已拒绝',
  expired: '已过期',
};

const quotationStatusColors: Record<QuotationStatus, string> = {
  draft: 'default',
  submitted: 'blue',
  approved: 'green',
  rejected: 'red',
  expired: 'default',
};

const statusOptions = Object.entries(quotationStatusNames).map(([value, label]) => ({
  value,
  label,
}));

const QuotationList = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [viewings, setViewings] = useState<ViewingRecord[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [form] = Form.useForm();

  const canCreate = user?.role === 'rental_consultant';

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const params: { status?: string } = {};
      if (status) params.status = status;
      const response = await quotationAPI.list(params);
      setQuotations(response.data);
    } catch (error) {
      console.error('Failed to fetch quotations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await propertyAPI.list();
      setProperties(response.data.filter((p) => p.status === 'quotation_pending' || p.status === 'viewing_completed' || p.status === 'vacant'));
    } catch (error) {
      console.error('Failed to fetch properties:', error);
    }
  };

  const fetchViewings = async (propertyId: string) => {
    try {
      const response = await viewingAPI.list({ propertyId });
      setViewings(response.data.filter((v) => v.status === 'completed'));
    } catch (error) {
      console.error('Failed to fetch viewings:', error);
    }
  };

  useEffect(() => {
    fetchQuotations();
    if (canCreate) {
      fetchProperties();
    }
  }, [status, canCreate]);

  const handlePropertyChange = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    if (propertyId) {
      fetchViewings(propertyId);
    } else {
      setViewings([]);
    }
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setCreateLoading(true);

      const items: QuotationItem[] = [
        {
          name: '房屋租金',
          description: `${values.leaseTerm}个月租期，月租金`,
          quantity: values.leaseTerm,
          unit: '月',
          unitPrice: values.monthlyRent,
          amount: values.leaseTerm * values.monthlyRent,
        },
      ];

      const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

      await quotationAPI.create({
        propertyId: values.propertyId,
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        companyName: values.companyName,
        viewingRecordId: values.viewingRecordId,
        leaseTerm: values.leaseTerm,
        rentFreePeriod: values.rentFreePeriod,
        paymentMethod: values.paymentMethod,
        depositMonths: values.depositMonths,
        items,
        totalAmount,
        remarks: values.remarks,
        validUntil: values.validUntil.format('YYYY-MM-DD'),
      });

      message.success('报价单创建成功');
      setCreateModalVisible(false);
      form.resetFields();
      setSelectedPropertyId('');
      fetchQuotations();
    } catch (error: any) {
      message.error(error.response?.data?.error || '创建失败');
    } finally {
      setCreateLoading(false);
    }
  };

  const openCreateModal = () => {
    form.resetFields();
    setSelectedPropertyId('');
    setViewings([]);
    form.setFieldsValue({
      leaseTerm: 12,
      rentFreePeriod: 1,
      depositMonths: 2,
      paymentMethod: 'quarterly',
      validUntil: dayjs().add(30, 'day'),
    });
    setCreateModalVisible(true);
  };

  const columns = [
    {
      title: '报价单号',
      dataIndex: 'quotationNo',
      key: 'quotationNo',
      width: 180,
    },
    {
      title: '客户姓名',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 120,
    },
    {
      title: '公司',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 160,
      render: (text: string) => text || '-',
    },
    {
      title: '租期',
      key: 'leaseTerm',
      width: 100,
      render: (_: unknown, record: Quotation) => `${record.leaseTerm}个月`,
    },
    {
      title: '总金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 140,
      render: (amount: number) => <span style={{ fontWeight: 600, color: '#f5222d' }}>¥{amount.toLocaleString()}</span>,
    },
    {
      title: '有效期至',
      dataIndex: 'validUntil',
      key: 'validUntil',
      width: 180,
      render: (text: string) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: '状态',
      dataIndex: 'statusDisplay',
      key: 'status',
      width: 110,
      render: (display: { label: string; color: string } | undefined, record: Quotation) => (
        <Tag color={display?.color || quotationStatusColors[record.status]}>
          {display?.label || quotationStatusNames[record.status]}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: Quotation) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/quotations/${record.id}`)}
        >
          查看
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">租赁报价</h1>
        {canCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            新建报价单
          </Button>
        )}
      </div>

      <div className="filter-bar">
        <Select
          placeholder="选择状态"
          value={status || undefined}
          onChange={setStatus}
          allowClear
          style={{ width: 150 }}
          options={statusOptions}
        />
        <Button icon={<ReloadOutlined />} onClick={() => { setStatus(''); fetchQuotations(); }}>
          重置
        </Button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
        </div>
      ) : (
        <div className="table-container">
          <Table
            columns={columns}
            dataSource={quotations}
            rowKey="id"
            locale={{ emptyText: <Empty description="暂无报价单" /> }}
            pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条记录` }}
          />
        </div>
      )}

      <Modal
        title="新建报价单"
        open={createModalVisible}
        onOk={handleCreate}
        onCancel={() => setCreateModalVisible(false)}
        confirmLoading={createLoading}
        okText="创建"
        cancelText="取消"
        width={700}
      >
        <Form form={form} layout="vertical">
          <Divider orientation="left">基本信息</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="propertyId"
                label="选择房源"
                rules={[{ required: true, message: '请选择房源' }]}
              >
                <Select
                  placeholder="请选择房源"
                  onChange={handlePropertyChange}
                  showSearch
                  optionFilterProp="children"
                >
                  {properties.map((p) => (
                    <Select.Option key={p.id} value={p.id}>
                      {p.building} {p.floor}层 {p.roomNumber} - {p.area}㎡ - ¥{p.unitPrice}/㎡/月
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="viewingRecordId"
                label="关联看房记录"
              >
                <Select
                  placeholder="请选择看房记录（选填）"
                  disabled={!selectedPropertyId}
                  allowClear
                >
                  {viewings.map((v) => (
                    <Select.Option key={v.id} value={v.id}>
                      {v.customerName} - {new Date(v.scheduledAt).toLocaleDateString('zh-CN')}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="customerName"
                label="客户姓名"
                rules={[{ required: true, message: '请输入客户姓名' }]}
              >
                <Input placeholder="请输入客户姓名" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="customerPhone"
                label="联系电话"
                rules={[{ required: true, message: '请输入联系电话' }]}
              >
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="companyName" label="公司名称">
                <Input placeholder="请输入公司名称（选填）" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">报价条件</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="leaseTerm"
                label="租期（月）"
                rules={[{ required: true, message: '请输入租期' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="rentFreePeriod"
                label="免租期（月）"
                rules={[{ required: true, message: '请输入免租期' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="depositMonths"
                label="押金（月）"
                rules={[{ required: true, message: '请输入押金月数' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="paymentMethod"
                label="付款方式"
                rules={[{ required: true, message: '请选择付款方式' }]}
              >
                <Select>
                  <Select.Option value="monthly">月付</Select.Option>
                  <Select.Option value="quarterly">季付</Select.Option>
                  <Select.Option value="semi_annual">半年付</Select.Option>
                  <Select.Option value="annual">年付</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="monthlyRent"
                label="月租金（元）"
                rules={[{ required: true, message: '请输入月租金' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="validUntil"
                label="报价有效期"
                rules={[{ required: true, message: '请选择有效期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">备注</Divider>
          <Form.Item name="remarks" label="备注说明">
            <Input.TextArea rows={3} placeholder="请输入备注说明（选填）" />
          </Form.Item>

          <div style={{ padding: '12px 16px', background: '#f6ffed', borderRadius: 8, border: '1px solid #b7eb8f' }}>
            <div style={{ fontWeight: 500, color: '#389e0d', marginBottom: 4 }}>
              <FileTextOutlined style={{ marginRight: 8 }} />
              判断依据提示
            </div>
            <div style={{ fontSize: 13, color: '#52c41a' }}>
              • 创建报价单后状态为"草稿"，可随时编辑修改
              <br />
              • 提交后进入"已提交"状态，由运营经理审批确认
              <br />
              • 报价确认后自动联动房源状态更新为"报价已确认"
            </div>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default QuotationList;
