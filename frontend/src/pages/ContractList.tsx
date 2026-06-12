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
  Divider,
  Row,
  Col,
  message,
} from 'antd';
import { EyeOutlined, ReloadOutlined, PlusOutlined, SafetyCertificateOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { contractAPI, quotationAPI } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { Contract, ContractStatus, Quotation } from '../types';

const contractStatusNames: Record<ContractStatus, string> = {
  draft: '草稿',
  under_review: '审核中',
  approved: '已批准',
  signed: '已签署',
  rejected: '已拒绝',
  terminated: '已终止',
};

const contractStatusColors: Record<ContractStatus, string> = {
  draft: 'default',
  under_review: 'blue',
  approved: 'purple',
  signed: 'green',
  rejected: 'red',
  terminated: 'default',
};

const statusOptions = Object.entries(contractStatusNames).map(([value, label]) => ({
  value,
  label,
}));

const ContractList = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [contractForm] = Form.useForm();
  const [creating, setCreating] = useState(false);
  const [approvedQuotations, setApprovedQuotations] = useState<Quotation[]>([]);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

  const canCreate = user?.role === 'rental_consultant';

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const params: { status?: string } = {};
      if (status) params.status = status;
      const response = await contractAPI.list(params);
      setContracts(response.data);
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [status]);

  const openCreateModal = async () => {
    contractForm.resetFields();
    setSelectedQuotation(null);
    try {
      const res = await quotationAPI.list({ status: 'approved' });
      setApprovedQuotations(res.data);
    } catch {
      setApprovedQuotations([]);
    }
    setCreateModalVisible(true);
  };

  const handleQuotationSelect = (quotationId: string) => {
    const q = approvedQuotations.find(item => item.id === quotationId);
    if (q) {
      setSelectedQuotation(q);
      contractForm.setFieldsValue({
        customerName: q.customerName,
        customerPhone: q.customerPhone,
        companyName: q.companyName,
        monthlyRent: q.items.find(i => i.name === '房屋租金')?.unitPrice || 0,
        leaseTerm: q.leaseTerm,
        rentFreePeriod: q.rentFreePeriod,
        depositAmount: q.items.find(i => i.name === '房屋租金')?.unitPrice * q.depositMonths || 0,
        paymentMethod: q.paymentMethod,
      });
    } else {
      setSelectedQuotation(null);
    }
  };

  const handleCreateContract = async () => {
    try {
      const values = await contractForm.validateFields();
      setCreating(true);
      const data: any = {
        propertyId: selectedQuotation?.propertyId,
        quotationId: selectedQuotation?.id,
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        companyName: values.companyName,
        monthlyRent: values.monthlyRent,
        leaseTerm: values.leaseTerm,
        rentFreePeriod: values.rentFreePeriod,
        depositAmount: values.depositAmount,
        paymentMethod: values.paymentMethod,
        leaseStartDate: values.leaseStartDate?.format('YYYY-MM-DD'),
        leaseEndDate: values.leaseEndDate?.format('YYYY-MM-DD'),
        clauses: [
          { category: 'basic', title: '租赁期限', content: `租期${values.leaseTerm}个月`, order: 1 },
          { category: 'payment', title: '租金及付款方式', content: `月租金${values.monthlyRent}元`, order: 2 },
          { category: 'payment', title: '押金', content: `押金${values.depositAmount}元`, order: 3 },
          { category: 'basic', title: '免租期', content: `免租期${values.rentFreePeriod}个月`, order: 4 },
        ],
      };
      if (!data.propertyId) {
        message.error('请先选择关联报价单');
        setCreating(false);
        return;
      }
      await contractAPI.create(data);
      message.success('合同创建成功，房源状态已同步更新');
      setCreateModalVisible(false);
      fetchContracts();
    } catch (err: any) {
      if (err.response?.data?.error) {
        message.error(err.response.data.error);
      }
    } finally {
      setCreating(false);
    }
  };

  const columns = [
    {
      title: '合同编号',
      dataIndex: 'contractNo',
      key: 'contractNo',
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
      render: (_: unknown, record: Contract) => `${record.leaseTerm}个月`,
    },
    {
      title: '月租金',
      dataIndex: 'monthlyRent',
      key: 'monthlyRent',
      width: 140,
      render: (amount: number) => (
        <span style={{ fontWeight: 600, color: '#f5222d' }}>¥{amount.toLocaleString()}</span>
      ),
    },
    {
      title: '押金',
      dataIndex: 'depositAmount',
      key: 'depositAmount',
      width: 140,
      render: (amount: number) => `¥${amount.toLocaleString()}`,
    },
    {
      title: '创建人',
      dataIndex: 'createdByName',
      key: 'createdByName',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'statusDisplay',
      key: 'status',
      width: 110,
      render: (display: { label: string; color: string } | undefined, record: Contract) => (
        <Tag color={display?.color || contractStatusColors[record.status]}>
          {display?.label || contractStatusNames[record.status]}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: Contract) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/contracts/${record.id}`)}
        >
          查看
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">合同管理</h1>
        {canCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            起草合同
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
        <Button icon={<ReloadOutlined />} onClick={() => { setStatus(''); fetchContracts(); }}>
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
            dataSource={contracts}
            rowKey="id"
            locale={{ emptyText: <Empty description="暂无合同" /> }}
            pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条记录` }}
          />
        </div>
      )}

      <Modal
        title="起草合同"
        open={createModalVisible}
        onOk={handleCreateContract}
        onCancel={() => setCreateModalVisible(false)}
        confirmLoading={creating}
        okText="创建合同"
        cancelText="取消"
        width={700}
      >
        <div style={{ marginBottom: 16, padding: '10px 14px', background: '#f6ffed', borderRadius: 8, border: '1px solid #b7eb8f', fontSize: 13 }}>
          <InfoCircleOutlined style={{ color: '#52c41a', marginRight: 6 }} />
          选择已确认报价单后，客户与金额字段将自动带入；创建后房源状态将同步更新为「合同起草中」
        </div>
        <Form form={contractForm} layout="vertical">
          <Divider orientation="left">关联报价单</Divider>
          <Form.Item
            name="quotationId"
            label="选择已确认报价单"
            rules={[{ required: true, message: '请选择报价单' }]}
          >
            <Select
              placeholder="请选择已确认的报价单"
              onChange={handleQuotationSelect}
              showSearch
              optionFilterProp="children"
            >
              {approvedQuotations.map((q) => (
                <Select.Option key={q.id} value={q.id}>
                  {q.quotationNo} - {q.customerName} - ¥{q.totalAmount?.toLocaleString()}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Divider orientation="left">客户信息</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="customerName" label="客户姓名" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="customerPhone" label="联系电话" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="companyName" label="公司名称">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">合同条款</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="monthlyRent" label="月租金（元）" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="leaseTerm" label="租期（月）" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="depositAmount" label="押金金额（元）" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="rentFreePeriod" label="免租期（月）" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="paymentMethod" label="付款方式" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="monthly">月付</Select.Option>
                  <Select.Option value="quarterly">季付</Select.Option>
                  <Select.Option value="semi_annual">半年付</Select.Option>
                  <Select.Option value="annual">年付</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="leaseStartDate" label="租期开始日期" rules={[{ required: true, message: '请选择' }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="leaseEndDate" label="租期结束日期" rules={[{ required: true, message: '请选择' }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default ContractList;
