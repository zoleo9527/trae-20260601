import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Radio,
  message,
  InputNumber,
  Typography,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  UserOutlined,
  ExportOutlined,
  EyeOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { TicketService } from '../services/TicketService';
import { StatusLabel, StatusColor } from '../types';
import type { Role, TicketStatus, ServiceTicket } from '../types';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface Props {
  role: Role;
  onUpdated: () => void;
}

export default function CustomerServicePage({ role, onUpdated }: Props) {
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<ServiceTicket | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportResult, setExportResult] = useState<any>(null);
  const [searchStatus, setSearchStatus] = useState<TicketStatus | undefined>();
  const [createForm] = Form.useForm();
  const [assignForm] = Form.useForm();
  const [exportForm] = Form.useForm();

  const [msgApi, msgCtx] = message.useMessage();

  const refresh = () => onUpdated();

  const tickets = TicketService.listTickets().filter((t) => {
    if (searchStatus) return t.status === searchStatus;
    return true;
  });
  const dashboard = TicketService.getDashboard();

  const handleCreate = async () => {
    const v = await createForm.validateFields();
    const r = TicketService.createTicket({
      source: v.source,
      customer: {
        name: v.customerName,
        phone: v.customerPhone,
        address: v.customerAddress,
      },
      appliance: {
        type: v.applianceType,
        brand: v.applianceBrand,
        model: v.applianceModel,
        purchaseDate: v.purchaseDate?.format('YYYY-MM-DD') || '',
        warranty: v.warranty,
        serialNo: v.serialNo,
      },
      complaintDescription: v.complaintDescription,
      operator: '张客服',
      idempotencyKey: uuidv4(),
    });
    if (r.success) {
      msgApi.success(r.message);
      setCreateOpen(false);
      createForm.resetFields();
      refresh();
    } else {
      msgApi.error(r.message || '创建失败');
    }
  };

  const handleAssign = async () => {
    if (!assignTarget) return;
    const v = await assignForm.validateFields();
    const r = TicketService.assignEngineer({
      ticketId: assignTarget.id,
      engineer: v.engineer,
      operator: '张客服',
      idempotencyKey: uuidv4(),
      remark: v.remark,
    });
    if (r.success) {
      msgApi.success(r.message);
      setAssignOpen(false);
      assignForm.resetFields();
      setAssignTarget(null);
      refresh();
    } else {
      msgApi.error(r.message || '派单失败');
    }
  };

  const handleExport = async () => {
    const v = await exportForm.validateFields();
    const r = TicketService.exportTickets({
      startDate: v.dateRange?.[0]?.format('YYYY-MM-DD'),
      endDate: v.dateRange?.[1]?.format('YYYY-MM-DD'),
      status: v.status,
      role: role,
    });
    setExportResult(r);
  };

  const cols = [
    {
      title: '工单信息',
      dataIndex: 'ticketNo',
      key: 'ticketNo',
      render: (_: string, r: ServiceTicket) => (
        <div>
          <Text strong>{r.ticketNo}</Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {r.createdAt} · 来源：{r.source}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: '客户',
      key: 'customer',
      render: (_: unknown, r: ServiceTicket) => (
        <div>
          <UserOutlined /> {r.customer.name} · {r.customer.phone}
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {r.customer.address}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: '家电',
      key: 'appliance',
      render: (_: unknown, r: ServiceTicket) => (
        <div>
          {r.appliance.brand} {r.appliance.model}
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {r.appliance.type}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (s: TicketStatus) => <Tag color={StatusColor[s] as any}>{StatusLabel[s]}</Tag>,
    },
    {
      title: '处理人',
      key: 'handler',
      render: (_: unknown, r: ServiceTicket) => (
        <Space size={4} direction="vertical">
          {r.handlers.customer_service && <Tag>客服：{r.handlers.customer_service}</Tag>}
          {r.handlers.engineer && <Tag color="orange">工程师：{r.handlers.engineer}</Tag>}
          {r.handlers.parts_admin && <Tag color="purple">配件：{r.handlers.parts_admin}</Tag>}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 200,
      render: (_: unknown, r: ServiceTicket) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/ticket/${r.id}`)}>
            详情
          </Button>
          {r.status === 'created' && role === 'customer_service' && (
            <Button
              type="primary"
              size="small"
              icon={<SendOutlined />}
              onClick={() => {
                setAssignTarget(r);
                setAssignOpen(true);
              }}
            >
              派单
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {msgCtx}
      <Card>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic title="总工单" value={dashboard.total} />
          </Col>
          <Col span={6}>
            <Statistic title="诊断中" value={dashboard.inDiagnosis} valueStyle={{ color: '#fa8c16' }} />
          </Col>
          <Col span={6}>
            <Statistic title="待审核配件" value={dashboard.pendingParts} valueStyle={{ color: '#ff4d4f' }} />
          </Col>
          <Col span={6}>
            <Statistic title="已完成" value={dashboard.completed} valueStyle={{ color: '#52c41a' }} />
          </Col>
        </Row>
      </Card>

      <Card
        title={<Title level={5} style={{ margin: 0 }}>客服工作台 · 工单列表</Title>}
        extra={
          <Space>
            <Select
              allowClear
              style={{ width: 180 }}
              placeholder="按状态筛选"
              value={searchStatus}
              onChange={setSearchStatus}
              options={(Object.keys(StatusLabel) as TicketStatus[]).map((k) => ({
                value: k,
                label: StatusLabel[k],
              }))}
            />
            {role === 'customer_service' && (
              <>
                <Button icon={<PlusOutlined />} type="primary" onClick={() => setCreateOpen(true)}>
                  新建工单
                </Button>
                <Button icon={<ExportOutlined />} onClick={() => setExportOpen(true)}>
                  导出任务
                </Button>
              </>
            )}
          </Space>
        }
      >
        <Table
          rowKey="id"
          size="small"
          columns={cols}
          dataSource={tickets}
          locale={{ emptyText: '暂无工单，点击右上角「新建工单」创建，或前往「请求示例 / 一键跑通」生成演示数据' }}
        />
      </Card>

      <Modal
        title="新建售后工单"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={handleCreate}
        okText="提交创建（幂等）"
        width={720}
        destroyOnClose
      >
        <Form layout="vertical" form={createForm} preserve={false}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="来源渠道" name="source" rules={[{ required: true }]} initialValue="400热线">
                <Select
                  options={[
                    { value: '400热线' },
                    { value: '官网' },
                    { value: '微信公众号' },
                    { value: '门店' },
                    { value: '电商平台' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12} />
          </Row>
          <div style={{ margin: '4px 0 8px' }}>
            <Text strong>客户信息</Text>
          </div>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item label="客户姓名" name="customerName" rules={[{ required: true }]}>
                <Input placeholder="如：张先生" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="联系电话" name="customerPhone" rules={[{ required: true }]}>
                <Input placeholder="手机号" />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item label="服务地址" name="customerAddress" rules={[{ required: true }]}>
                <Input placeholder="完整地址" />
              </Form.Item>
            </Col>
          </Row>
          <div style={{ margin: '4px 0 8px' }}>
            <Text strong>家电信息</Text>
          </div>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item label="家电类型" name="applianceType" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: '空调' },
                    { value: '冰箱' },
                    { value: '洗衣机' },
                    { value: '热水器' },
                    { value: '电视' },
                    { value: '油烟机' },
                    { value: '灶具' },
                    { value: '其他' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="品牌" name="applianceBrand" rules={[{ required: true }]}>
                <Input placeholder="如：格力" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="型号" name="applianceModel" rules={[{ required: true }]}>
                <Input placeholder="如：KFR-35GW" />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item label="购买日期" name="purchaseDate">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="是否在保" name="warranty" initialValue={true}>
                <Radio.Group>
                  <Radio value={true}>是</Radio>
                  <Radio value={false}>否</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="序列号（选填）" name="serialNo">
                <Input placeholder="机身SN码" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="报修描述" name="complaintDescription" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="请详细描述故障现象" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`派单给工程师 - ${assignTarget?.ticketNo}`}
        open={assignOpen}
        onCancel={() => {
          setAssignOpen(false);
          setAssignTarget(null);
        }}
        onOk={handleAssign}
        okText="确认派单"
        destroyOnClose
      >
        <Form form={assignForm} layout="vertical" preserve={false}>
          <Form.Item label="选择工程师" name="engineer" rules={[{ required: true }]}>
            <Select
              options={[
                { value: '李工程师' },
                { value: '钱工程师' },
                { value: '王工程师' },
                { value: '赵工程师' },
              ]}
            />
          </Form.Item>
          <Form.Item label="派单备注" name="remark">
            <TextArea rows={2} placeholder="客户要求、地址提示等" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="导出任务"
        open={exportOpen}
        onCancel={() => {
          setExportOpen(false);
          setExportResult(null);
          exportForm.resetFields();
        }}
        onOk={handleExport}
        okText="执行导出"
        width={720}
        destroyOnClose
      >
        <Form form={exportForm} layout="vertical" preserve={false}>
          <Row gutter={12}>
            <Col span={16}>
              <Form.Item label="创建日期范围" name="dateRange">
                <DatePicker.RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="按状态" name="status">
                <Select
                  allowClear
                  options={(Object.keys(StatusLabel) as TicketStatus[]).map((k) => ({
                    value: k,
                    label: StatusLabel[k],
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>

        {exportResult && (
          <Card size="small" type="inner" title="导出结果" style={{ marginTop: 12 }}>
            <Row gutter={12}>
              <Col span={8}>
                <Statistic title="导出行数" value={exportResult.recordCount} />
              </Col>
              <Col span={8}>
                <Statistic title="合计人工费" value={exportResult.totalLaborFee} prefix="¥" />
              </Col>
              <Col span={8}>
                <Statistic title="导出时间" value={exportResult.exportedAt} />
              </Col>
            </Row>
            <div style={{ marginTop: 12 }}>
              <Text type="secondary">导出记录（前3行示例）：</Text>
              <pre style={{ fontSize: 11, background: '#fafafa', padding: 8, borderRadius: 4, overflow: 'auto' }}>
{JSON.stringify(exportResult.rows.slice(0, 3), null, 2)}
              </pre>
            </div>
          </Card>
        )}
      </Modal>
    </Space>
  );
}
