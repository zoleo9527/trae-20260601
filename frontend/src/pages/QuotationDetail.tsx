import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Descriptions,
  Tag,
  Timeline,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Spin,
  Alert,
  Empty,
  Card,
  Table,
  Divider,
  Statistic,
  Row,
  Col,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckOutlined,
  CloseOutlined,
  SendOutlined,
  EditOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  ArrowRightOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { quotationAPI, logsAPI } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import {
  Quotation,
  QuotationItem,
  Property,
  ViewingRecord,
  TimelineEvent,
  paymentMethodNames,
  decorationNames,
  viewingStatusNames,
  interestLevelNames,
} from '../types';

const { TextArea } = Input;

const QuotationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const [loading, setLoading] = useState(true);
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [viewing, setViewing] = useState<ViewingRecord | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchData(id);
  }, [id]);

  const fetchData = async (quotationId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [quotationRes, timelineRes] = await Promise.all([
        quotationAPI.get(quotationId),
        logsAPI.getTimeline('quotation', quotationId),
      ]);
      setQuotation(quotationRes.data);
      setProperty(quotationRes.data.property || null);
      setViewing(quotationRes.data.viewing || null);
      setTimeline(timelineRes.data);
    } catch (err: any) {
      setError(err.response?.data?.error || '加载报价单失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      await quotationAPI.submit(id);
      setSubmitModalVisible(false);
      fetchData(id);
    } catch (err: any) {
      setError(err.response?.data?.error || '提交失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    try {
      const values = await form.validateFields();
      setActionLoading(true);
      await quotationAPI.approve(id, values.approvalComment);
      setApproveModalVisible(false);
      fetchData(id);
    } catch (err: any) {
      setError(err.response?.data?.error || '审批失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!id) return;
    try {
      const values = await form.validateFields();
      setActionLoading(true);
      await quotationAPI.reject(id, values.approvalComment);
      setRejectModalVisible(false);
      fetchData(id);
    } catch (err: any) {
      setError(err.response?.data?.error || '拒绝失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!id || !quotation) return;
    try {
      const values = await editForm.validateFields();
      setActionLoading(true);
      const items: QuotationItem[] = values.items.map((item: any, index: number) => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        amount: Number(item.quantity) * Number(item.unitPrice),
      }));
      await quotationAPI.update(id, {
        ...values,
        items,
        leaseTerm: Number(values.leaseTerm),
        rentFreePeriod: Number(values.rentFreePeriod),
        depositMonths: Number(values.depositMonths),
      });
      setEditModalVisible(false);
      fetchData(id);
    } catch (err: any) {
      setError(err.response?.data?.error || '修改失败');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = () => {
    if (!quotation) return;
    editForm.setFieldsValue({
      customerName: quotation.customerName,
      customerPhone: quotation.customerPhone,
      companyName: quotation.companyName,
      leaseTerm: quotation.leaseTerm,
      rentFreePeriod: quotation.rentFreePeriod,
      paymentMethod: quotation.paymentMethod,
      depositMonths: quotation.depositMonths,
      validUntil: quotation.validUntil.slice(0, 10),
      remarks: quotation.remarks,
      items: quotation.items.map((item) => ({
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
      })),
    });
    setEditModalVisible(true);
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString('zh-CN');

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'default',
      submitted: 'blue',
      approved: 'green',
      rejected: 'red',
      expired: 'default',
    };
    return colors[status] || 'default';
  };

  const getStatusName = (status: string) => {
    const names: Record<string, string> = {
      draft: '草稿',
      submitted: '已提交',
      approved: '已确认',
      rejected: '已拒绝',
      expired: '已过期',
    };
    return names[status] || status;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return <Alert message="错误" description={error} type="error" showIcon />;
  }

  if (!quotation) {
    return <Empty description="未找到报价单" />;
  }

  const isOwner = user && quotation.consultantId === user.id;
  const isManager = user?.role === 'operation_manager';
  const canEdit = isOwner && (quotation.status === 'draft' || quotation.status === 'rejected');
  const canSubmit = isOwner && (quotation.status === 'draft' || quotation.status === 'rejected');
  const canApprove = isManager && quotation.status === 'submitted';
  const canReject = isManager && quotation.status === 'submitted';

  const getStatusJudgment = () => {
    const judgments: Record<string, { title: string; basis: string[]; nextSteps: string[]; restrictions: string[] }> = {
      draft: {
        title: '草稿状态',
        basis: [
          '报价单由租赁顾问创建，尚未提交审批',
          `创建人：${quotation.consultantName}（租赁顾问）`,
          '可随时编辑修改内容',
        ],
        nextSteps: [
          '租赁顾问确认内容无误后，可"提交报价"进入审批流程',
          '提交后将由运营经理进行确认',
        ],
        restrictions: [
          '只有创建人（租赁顾问）可以编辑和提交',
          '提交后不能再修改，需等待审批或退回',
        ],
      },
      submitted: {
        title: '已提交待确认',
        basis: [
          '租赁顾问已提交报价单，等待运营经理确认',
          `提交人：${quotation.consultantName}（租赁顾问）`,
          '房源状态同步更新为"已报价待确认"',
        ],
        nextSteps: [
          '运营经理审核报价内容，可"确认报价"或"退回修改"',
          '确认后报价生效，可进入合同起草阶段',
          '退回后租赁顾问可修改后重新提交',
        ],
        restrictions: [
          '提交后租赁顾问不能再修改报价内容',
          '只有运营经理可以审批确认',
        ],
      },
      approved: {
        title: '已确认生效',
        basis: [
          '运营经理已确认报价单，报价正式生效',
          `确认人：${quotation.approverName || '-'}（运营经理）`,
          quotation.approvalComment ? `确认意见：${quotation.approvalComment}` : '无特殊确认意见',
          '房源状态同步更新为"报价已确认"',
        ],
        nextSteps: [
          '租赁顾问可基于此报价起草租赁合同',
          '合同条款需与报价内容保持一致',
        ],
        restrictions: [
          '报价已生效，不能再修改内容',
          '如需调整需重新创建报价单',
        ],
      },
      rejected: {
        title: '已退回修改',
        basis: [
          '运营经理审核后退回修改，报价未通过',
          `退回人：${quotation.approverName || '-'}（运营经理）`,
          `退回原因：${quotation.approvalComment || '未填写'}`,
          '房源状态同步回退为"待报价"',
        ],
        nextSteps: [
          '租赁顾问根据退回意见修改报价内容',
          '修改完成后可重新提交审批',
        ],
        restrictions: [
          '只有创建人（租赁顾问）可以修改',
          '需重新提交后才能再次进入审批流程',
        ],
      },
      expired: {
        title: '已过期',
        basis: [
          '报价单已超过有效期，自动失效',
          `有效期至：${formatDate(quotation.validUntil)}`,
        ],
        nextSteps: [
          '如需继续报价，需重新创建新的报价单',
        ],
        restrictions: [
          '过期报价单不能再提交或审批',
          '不具备法律效力',
        ],
      },
    };
    return judgments[quotation.status] || { title: quotation.status, basis: [], nextSteps: [], restrictions: [] };
  };

  const judgment = getStatusJudgment();

  const itemColumns = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => text || '-',
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 60,
    },
    {
      title: '单价',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 120,
      render: (price: number) => `¥${price.toLocaleString()}`,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      render: (amount: number) => (
        <span style={{ fontWeight: 600 }}>¥{amount.toLocaleString()}</span>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/quotations')}>
            返回列表
          </Button>
          <h1 className="page-title">报价单详情</h1>
          <Tag color={getStatusColor(quotation.status)} style={{ fontSize: 14, padding: '4px 12px' }}>
            {getStatusName(quotation.status)}
          </Tag>
        </Space>
        <div className="action-bar">
          {canEdit && (
            <Button icon={<EditOutlined />} onClick={openEditModal}>
              编辑
            </Button>
          )}
          {canSubmit && (
            <Button type="primary" icon={<SendOutlined />} onClick={() => setSubmitModalVisible(true)}>
              提交报价
            </Button>
          )}
          {canApprove && (
            <Button type="primary" icon={<CheckOutlined />} onClick={() => { form.resetFields(); setApproveModalVisible(true); }}>
              确认报价
            </Button>
          )}
          {canReject && (
            <Button danger icon={<CloseOutlined />} onClick={() => { form.resetFields(); setRejectModalVisible(true); }}>
              退回修改
            </Button>
          )}
        </div>
      </div>

      {property && (
        <div className="detail-section">
          <h2 className="detail-section-title">关联房源</h2>
          <Card
            size="small"
            hoverable
            onClick={() => navigate(`/properties/${property.id}`)}
            style={{ cursor: 'pointer' }}
          >
            <Descriptions column={3} size="small">
              <Descriptions.Item label="位置">
                {property.building} {property.floor}层 {property.roomNumber}
              </Descriptions.Item>
              <Descriptions.Item label="面积">{property.area} ㎡</Descriptions.Item>
              <Descriptions.Item label="单价">¥{property.unitPrice}/㎡/月</Descriptions.Item>
              <Descriptions.Item label="装修">{decorationNames[property.decoration]}</Descriptions.Item>
              <Descriptions.Item label="朝向">{property.orientation}</Descriptions.Item>
              <Descriptions.Item label="房源状态">
                <Tag color={property.statusDisplay?.color}>{property.statusDisplay?.label}</Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </div>
      )}

      {viewing && (
        <div className="detail-section">
          <h2 className="detail-section-title">关联看房记录</h2>
          <Card
            size="small"
            hoverable
            onClick={() => navigate(`/viewings/${viewing.id}`)}
            style={{ cursor: 'pointer' }}
          >
            <Descriptions column={3} size="small">
              <Descriptions.Item label="客户姓名">{viewing.customerName}</Descriptions.Item>
              <Descriptions.Item label="预约时间">{formatDate(viewing.scheduledAt)}</Descriptions.Item>
              <Descriptions.Item label="顾问">{viewing.consultantName}</Descriptions.Item>
              <Descriptions.Item label="兴趣程度">
                <Tag color={viewing.interestLevel === 'high' ? 'red' : viewing.interestLevel === 'medium' ? 'orange' : 'default'}>
                  {interestLevelNames[viewing.interestLevel]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="看房状态">
                <Tag>{viewingStatusNames[viewing.status]}</Tag>
              </Descriptions.Item>
              {viewing.feedback && (
                <Descriptions.Item label="反馈" span={2}>
                  {viewing.feedback}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </div>
      )}

      <div className="detail-section">
        <h2 className="detail-section-title">状态判断与流转指引</h2>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card size="small" className="judgment-card">
              <div className="judgment-card-title">
                <InfoCircleOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                <span>当前状态判断依据</span>
              </div>
              <div className="judgment-card-content">
                <p className="judgment-status">{judgment.title}</p>
                <ul className="judgment-list">
                  {judgment.basis.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small" className="judgment-card">
              <div className="judgment-card-title">
                <ArrowRightOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                <span>下一步操作指引</span>
              </div>
              <div className="judgment-card-content">
                <ul className="judgment-list">
                  {judgment.nextSteps.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small" className="judgment-card">
              <div className="judgment-card-title">
                <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />
                <span>限制与注意事项</span>
              </div>
              <div className="judgment-card-content">
                <ul className="judgment-list">
                  {judgment.restrictions.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      <div className="detail-section">
        <h2 className="detail-section-title">报价概览</h2>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic title="总金额" value={quotation.totalAmount} precision={2} prefix="¥" />
          </Col>
          <Col span={6}>
            <Statistic title="租期" value={quotation.leaseTerm} suffix="个月" />
          </Col>
          <Col span={6}>
            <Statistic title="免租期" value={quotation.rentFreePeriod} suffix="个月" />
          </Col>
          <Col span={6}>
            <Statistic title="押金" value={quotation.depositMonths} suffix="个月租金" />
          </Col>
        </Row>
      </div>

      <div className="detail-section">
        <h2 className="detail-section-title">基本信息</h2>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="报价单号">{quotation.quotationNo}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={getStatusColor(quotation.status)}>{getStatusName(quotation.status)}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="客户姓名">{quotation.customerName}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{quotation.customerPhone}</Descriptions.Item>
          <Descriptions.Item label="公司名称">{quotation.companyName || '-'}</Descriptions.Item>
          <Descriptions.Item label="顾问">{quotation.consultantName}</Descriptions.Item>
          <Descriptions.Item label="付款方式">{paymentMethodNames[quotation.paymentMethod] || quotation.paymentMethod}</Descriptions.Item>
          <Descriptions.Item label="有效期至">{formatDate(quotation.validUntil)}</Descriptions.Item>
          {quotation.approverName && (
            <Descriptions.Item label="审批人">{quotation.approverName}</Descriptions.Item>
          )}
          {quotation.approvedAt && (
            <Descriptions.Item label="审批时间">{formatDate(quotation.approvedAt)}</Descriptions.Item>
          )}
          {quotation.approvalComment && (
            <Descriptions.Item label="审批意见" span={2}>
              {quotation.approvalComment}
            </Descriptions.Item>
          )}
          {quotation.remarks && (
            <Descriptions.Item label="备注" span={2}>
              {quotation.remarks}
            </Descriptions.Item>
          )}
        </Descriptions>
      </div>

      <div className="detail-section">
        <h2 className="detail-section-title">报价明细</h2>
        <Table
          columns={itemColumns}
          dataSource={quotation.items}
          rowKey="name"
          pagination={false}
          summary={(pageData) => {
            let total = 0;
            pageData.forEach((item) => {
              total += item.amount;
            });
            return (
              <>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={5} style={{ textAlign: 'right', fontWeight: 600 }}>
                    合计：
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} style={{ fontWeight: 600, color: '#f5222d' }}>
                    ¥{total.toLocaleString()}
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </>
            );
          }}
        />
      </div>

      <div className="detail-section">
        <h2 className="detail-section-title">流转时间线</h2>
        <div className="timeline-container">
          {timeline.length > 0 ? (
            <Timeline
              items={timeline.map((event) => ({
                color: event.newStatus ? 'blue' : 'gray',
                children: (
                  <div>
                    <div style={{ fontWeight: 500 }}>{event.title}</div>
                    <div style={{ color: '#666', margin: '4px 0' }}>{event.description}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>
                      {event.operator} ({event.operatorRole === 'rental_consultant' ? '租赁顾问' : event.operatorRole === 'operation_manager' ? '运营经理' : '财务'}) · {formatDate(event.timestamp)}
                    </div>
                  </div>
                ),
              }))}
            />
          ) : (
            <Empty description="暂无流转记录" />
          )}
        </div>
      </div>

      <Modal
        title="提交报价"
        open={submitModalVisible}
        onOk={handleSubmit}
        onCancel={() => setSubmitModalVisible(false)}
        confirmLoading={actionLoading}
        okText="确认提交"
        cancelText="取消"
      >
        <p>确定要提交这份报价单吗？提交后将由运营经理进行确认。</p>
        <Alert
          message="提交后将进入待确认状态，运营经理可以确认或退回修改"
          type="info"
          showIcon
          style={{ marginTop: 12 }}
        />
      </Modal>

      <Modal
        title="确认报价"
        open={approveModalVisible}
        onOk={handleApprove}
        onCancel={() => setApproveModalVisible(false)}
        confirmLoading={actionLoading}
        okText="确认"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="approvalComment"
            label="确认意见"
          >
            <TextArea rows={3} placeholder="请输入确认意见（选填）..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="退回修改"
        open={rejectModalVisible}
        onOk={handleReject}
        onCancel={() => setRejectModalVisible(false)}
        confirmLoading={actionLoading}
        okText="确认退回"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="approvalComment"
            label="退回原因"
            rules={[{ required: true, message: '请输入退回原因' }]}
          >
            <TextArea rows={4} placeholder="请详细说明需要修改的内容..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑报价单"
        open={editModalVisible}
        onOk={handleEdit}
        onCancel={() => setEditModalVisible(false)}
        confirmLoading={actionLoading}
        okText="保存"
        cancelText="取消"
        width={800}
      >
        <Form form={editForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="customerName" label="客户姓名" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="customerPhone" label="联系电话" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="companyName" label="公司名称">
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="leaseTerm" label="租期（月）" rules={[{ required: true }]}>
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="rentFreePeriod" label="免租期（月）" rules={[{ required: true }]}>
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="depositMonths" label="押金（月）" rules={[{ required: true }]}>
                <Input type="number" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="paymentMethod" label="付款方式" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="monthly">月付</Select.Option>
              <Select.Option value="quarterly">季付</Select.Option>
              <Select.Option value="semi_annual">半年付</Select.Option>
              <Select.Option value="annual">年付</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="validUntil" label="有效期至" rules={[{ required: true }]}>
            <Input type="date" />
          </Form.Item>
          <Divider orientation="left">报价明细</Divider>
          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, 'name']}
                      rules={[{ required: true, message: '请输入项目名称' }]}
                      style={{ width: 120, marginBottom: 0 }}
                    >
                      <Input placeholder="项目名称" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'description']}
                      style={{ width: 150, marginBottom: 0 }}
                    >
                      <Input placeholder="描述" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'quantity']}
                      rules={[{ required: true, message: '请输入数量' }]}
                      style={{ width: 80, marginBottom: 0 }}
                    >
                      <Input type="number" placeholder="数量" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'unit']}
                      rules={[{ required: true, message: '请输入单位' }]}
                      style={{ width: 60, marginBottom: 0 }}
                    >
                      <Input placeholder="单位" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'unitPrice']}
                      rules={[{ required: true, message: '请输入单价' }]}
                      style={{ width: 100, marginBottom: 0 }}
                    >
                      <Input type="number" placeholder="单价" />
                    </Form.Item>
                    <Button type="dashed" onClick={() => remove(name)} danger size="small">
                      删除
                    </Button>
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<FileTextOutlined />}>
                  添加报价项目
                </Button>
              </>
            )}
          </Form.List>
          <Form.Item name="remarks" label="备注" style={{ marginTop: 16 }}>
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default QuotationDetail;
