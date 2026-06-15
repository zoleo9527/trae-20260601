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
  message,
  Typography,
  Row,
  Col,
  Alert,
  Tabs,
  List,
  Badge,
  Statistic,
  Divider,
  Select as AntSelect,
} from 'antd';
import {
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  HistoryOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { TicketService } from '../services/TicketService';
import type { Role, PartsApplication, ServiceTicket } from '../types';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

interface Props {
  role: Role;
  onUpdated: () => void;
}

export default function PartsAdminPage({ role, onUpdated }: Props) {
  const navigate = useNavigate();
  const [msgApi, msgCtx] = message.useMessage();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewApp, setReviewApp] = useState<{ app: PartsApplication; ticket: ServiceTicket } | null>(
    null
  );
  const [reviewForm] = Form.useForm();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'approved' | 'rejected' | 'pending'>(
    'all'
  );
  const [, setTick] = useState(0);
  const forceRerender = () => setTick((n) => n + 1);

  const refresh = () => onUpdated();

  const allTickets = TicketService.listTickets();
  const pending = allTickets.filter((t) => t.status === 'parts_applying');
  const isAdmin = role === 'parts_admin';

  const findBaseApplication = (
    app: PartsApplication,
    ticket: ServiceTicket
  ): PartsApplication | undefined =>
    app.basedOnApplicationId
      ? ticket.partsApplications.find((a) => a.id === app.basedOnApplicationId)
      : undefined;

  const renderChangeSummary = (app: PartsApplication, ticket: ServiceTicket) => {
    if (!app.changeSummary) return null;
    const cs = app.changeSummary;
    const total = cs.added.length + cs.modified.length + cs.removed.length + cs.unchanged.length;
    return (
      <div style={{ fontSize: 12 }}>
        <Space wrap style={{ marginBottom: 4 }}>
          {cs.added.length > 0 && (
            <Tag color="green">
              新增 {cs.added.length} 项：{cs.added.map((i) => i.name).join('、')}
            </Tag>
          )}
          {cs.modified.length > 0 && (
            <Tag color="blue">
              修改 {cs.modified.length} 项：
              {cs.modified.map((m) => m.after.name).join('、')}
            </Tag>
          )}
          {cs.removed.length > 0 && (
            <Tag color="red">
              删除 {cs.removed.length} 项：{cs.removed.map((i) => i.name).join('、')}
            </Tag>
          )}
          {cs.unchanged.length > 0 && (
            <Tag color="default">未变 {cs.unchanged.length} 项</Tag>
          )}
        </Space>
      </div>
    );
  };

  const pendingApplications: Array<{ app: PartsApplication; ticket: ServiceTicket }> = [];
  const allApplications: Array<{ app: PartsApplication; ticket: ServiceTicket }> = [];
  allTickets.forEach((t) => {
    t.partsApplications.forEach((a) => {
      allApplications.push({ app: a, ticket: t });
      if (a.status === 'pending') pendingApplications.push({ app: a, ticket: t });
    });
  });
  const approved = allApplications.filter((x) => x.app.status === 'approved').length;
  const rejected = allApplications.filter((x) => x.app.status === 'rejected').length;

  const openReview = (
    app: PartsApplication,
    ticket: ServiceTicket,
    approved: boolean
  ) => {
    setReviewApp({ app, ticket });
    reviewForm.resetFields();
    reviewForm.setFieldsValue({
      _approved: approved,
      reviewRemark: approved ? '已核对库存，安排发货' : '',
    });
    setReviewOpen(true);
    forceRerender();
  };

  const submitReview = async () => {
    if (!reviewApp) return;
    const v = await reviewForm.validateFields();
    const r = TicketService.reviewPartsApplication({
      applicationId: reviewApp.app.id,
      approved: !!v._approved,
      reviewRemark: v.reviewRemark,
      operator: '王管理员',
      idempotencyKey: uuidv4(),
    });
    if (r.success) {
      msgApi.success(r.message);
      setReviewOpen(false);
      setReviewApp(null);
      refresh();
    } else {
      msgApi.error(r.message || '审核失败');
    }
  };

  const cols = [
    {
      title: '申请信息',
      key: 'app',
      render: (_: unknown, r: { app: PartsApplication; ticket: ServiceTicket }) => (
        <div>
          <Text strong>申请 #{r.app.id.slice(0, 8)}</Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {r.app.appliedAt} · {r.app.appliedBy}提交
            </Text>
          </div>
          <div style={{ marginTop: 4 }}>
            <Tag>工单：{r.ticket.ticketNo}</Tag>
            <Tag color="blue">{r.app.items.length}项配件</Tag>
            {r.app.basedOnApplicationId && (
              <Tag color="red">重提·基于#{r.app.basedOnApplicationId.slice(0, 8)}</Tag>
            )}
          </div>
        </div>
      ),
    },
    {
      title: '工单 / 家电',
      key: 'ticket',
      render: (_: unknown, r: { app: PartsApplication; ticket: ServiceTicket }) => (
        <div>
          <div>
            客户：{r.ticket.customer.name} · {r.ticket.customer.phone}
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>
            {r.ticket.appliance.brand} {r.ticket.appliance.model}（{r.ticket.appliance.type}）
          </div>
          <div style={{ fontSize: 12 }}>
            报修：{r.ticket.complaintDescription.slice(0, 24)}
          </div>
        </div>
      ),
    },
    {
      title: '上次驳回 / 携带备注',
      key: 'carried',
      width: 280,
      render: (_: unknown, r: { app: PartsApplication; ticket: ServiceTicket }) => {
        const base = findBaseApplication(r.app, r.ticket);
        return (
          <div style={{ fontSize: 12 }}>
            {base?.reviewRemark && (
              <div style={{ marginBottom: 4 }}>
                <Text type="danger">
                  <Text strong>上次驳回：</Text>
                  {base.reviewRemark.length > 28
                    ? base.reviewRemark.slice(0, 28) + '…'
                    : base.reviewRemark}
                </Text>
              </div>
            )}
            <Text type="warning" style={{ whiteSpace: 'pre-wrap' }}>
              携带备注：{r.app.diagnosisRemarkCarried || '(无)'}
            </Text>
            {r.app.changeSummary && (
              <div style={{ marginTop: 4 }}>
                <Tag color="green" style={{ marginRight: 4 }}>
                  +{r.app.changeSummary.added.length}
                </Tag>
                <Tag color="blue" style={{ marginRight: 4 }}>
                  ~{r.app.changeSummary.modified.length}
                </Tag>
                <Tag color="red" style={{ marginRight: 4 }}>
                  -{r.app.changeSummary.removed.length}
                </Tag>
                <Text type="secondary">项差异</Text>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: '状态',
      dataIndex: ['app', 'status'],
      key: 's',
      width: 120,
      render: (s: PartsApplication['status']) => (
        <Tag color={s === 'approved' ? 'green' : s === 'rejected' ? 'red' : 'warning'}>
          {s === 'approved' ? '已批准' : s === 'rejected' ? '已驳回' : '待审核'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'op',
      width: 220,
      fixed: 'right' as const,
      render: (_: unknown, r: { app: PartsApplication; ticket: ServiceTicket }) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/ticket/${r.ticket.id}`)}>
            工单详情
          </Button>
          {isAdmin && r.app.status === 'pending' && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => openReview(r.app, r.ticket, true)}
              >
                批准
              </Button>
              <Button
                danger
                size="small"
                icon={<CloseOutlined />}
                onClick={() => openReview(r.app, r.ticket, false)}
              >
                驳回
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const historyFiltered = allApplications.filter((x) =>
    historyFilter === 'all' ? true : x.app.status === historyFilter
  );

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {msgCtx}
      <Card>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic title="待审核" value={pending.length} valueStyle={{ color: '#faad14' }} />
          </Col>
          <Col span={6}>
            <Statistic title="已批准" value={approved} valueStyle={{ color: '#52c41a' }} />
          </Col>
          <Col span={6}>
            <Statistic title="已驳回" value={rejected} valueStyle={{ color: '#ff4d4f' }} />
          </Col>
          <Col span={6}>
            <Statistic title="关联工单" value={allTickets.length} />
          </Col>
        </Row>
      </Card>

      <Card
        title={<Title level={5} style={{ margin: 0 }}>配件管理员工作台 · 审核 & 回看</Title>}
        extra={
          <Alert
            type="info"
            showIcon
            message="配件申请与故障诊断绑定：驳回退回工程师，可重提诊断或重新申请"
            style={{ padding: '4px 12px' }}
          />
        }
      >
        <Tabs
          items={[
            {
              key: 'pending',
              label: `待审核 (${pending.length})`,
              children: (
                <Table
                  size="small"
                  rowKey={(r) => r.app.id}
                  columns={cols}
                  dataSource={pendingApplications}
                  locale={{
                    emptyText: '暂无待审核的配件申请，请在工程师工作台提交申请',
                  }}
                  expandable={{
                    expandedRowRender: (r) => {
                      const baseApp = findBaseApplication(r.app, r.ticket);
                      const cs = r.app.changeSummary;
                      const matchKey = (it: any) => it.sku?.trim() || it.name.trim();
                      const getItemTag = (it: any) => {
                        if (!cs) return null;
                        if (cs.added.find((a) => matchKey(a) === matchKey(it)))
                          return { tag: '新增', color: 'green' };
                        const mod = cs.modified.find(
                          (m) => matchKey(m.after) === matchKey(it)
                        );
                        if (mod)
                          return { tag: `修改(${mod.diffFields.join('/')})`, color: 'blue' };
                        if (cs.unchanged.find((u) => matchKey(u) === matchKey(it)))
                          return { tag: '未变', color: 'default' };
                        return null;
                      };
                      return (
                        <div style={{ padding: '0 24px 12px' }}>
                          <Row gutter={16}>
                            <Col span={12}>
                              <Card
                                size="small"
                                type="inner"
                                title={
                                  <Space>
                                    申请配件明细
                                    {cs && (
                                      <Badge
                                        count={`变更 ${cs.added.length + cs.modified.length + cs.removed.length} 项`}
                                        style={{ backgroundColor: '#faad14' }}
                                      />
                                    )}
                                  </Space>
                                }
                              >
                                {cs && (
                                  <div style={{ marginBottom: 8 }}>
                                    {renderChangeSummary(r.app, r.ticket)}
                                  </div>
                                )}
                                <List
                                  size="small"
                                  bordered
                                  dataSource={r.app.items}
                                  renderItem={(it) => {
                                    const info = getItemTag(it);
                                    return (
                                      <List.Item key={it.id}>
                                        <div style={{ width: '100%' }}>
                                          <Space>
                                            <Text strong>{it.name}</Text>
                                            {it.sku && <Tag>SKU: {it.sku}</Tag>}
                                            <Tag color="blue">
                                              ×{it.quantity}
                                              {it.unit}
                                            </Tag>
                                            {info && (
                                              <Tag color={info.color}>{info.tag}</Tag>
                                            )}
                                          </Space>
                                          <div
                                            style={{
                                              fontSize: 12,
                                              color: '#666',
                                              marginTop: 4,
                                            }}
                                          >
                                            原因：{it.reason}
                                          </div>
                                        </div>
                                      </List.Item>
                                    );
                                  }}
                                />
                                {cs && cs.removed.length > 0 && (
                                  <div
                                    style={{
                                      marginTop: 8,
                                      padding: '6px 10px',
                                      background: '#fff1f0',
                                      border: '1px dashed #ffa39e',
                                      borderRadius: 4,
                                      fontSize: 12,
                                    }}
                                  >
                                    <Text type="danger" strong>
                                      本次相对上次删除 {cs.removed.length} 项：
                                    </Text>
                                    <span
                                      style={{
                                        color: '#8c8c8c',
                                        textDecoration: 'line-through',
                                      }}
                                    >
                                      {' '}
                                      {cs.removed
                                        .map((i) => `${i.name}×${i.quantity}${i.unit}`)
                                        .join('、')}
                                    </span>
                                  </div>
                                )}
                              </Card>
                            </Col>
                            <Col span={12}>
                              {baseApp?.reviewRemark && (
                                <Alert
                                  type="error"
                                  showIcon
                                  style={{ marginBottom: 12 }}
                                  message={
                                    <Space direction="vertical" size={2}>
                                      <Text strong>
                                        上次驳回意见（来自 {baseApp.reviewBy || '管理员'}）
                                      </Text>
                                      <Text>{baseApp.reviewRemark}</Text>
                                    </Space>
                                  }
                                />
                              )}
                              <Card
                                size="small"
                                type="inner"
                                title={
                                  <Space>
                                    诊断结果与备注
                                    <Tag color="orange">自动携带</Tag>
                                  </Space>
                                }
                              >
                                {r.ticket.diagnosis ? (
                                  <>
                                    <Paragraph style={{ marginBottom: 4 }}>
                                      <Text strong>故障：</Text>
                                      {r.ticket.diagnosis.faultDescription}
                                    </Paragraph>
                                    <Paragraph style={{ marginBottom: 4 }}>
                                      <Text strong>方案：</Text>
                                      {r.ticket.diagnosis.solution}
                                    </Paragraph>
                                    <Paragraph type="warning" style={{ marginBottom: 0 }}>
                                      <Text strong>诊断备注：</Text>
                                      {r.ticket.diagnosis.remark || '（无）'}
                                    </Paragraph>
                                    <Divider style={{ margin: '8px 0' }} />
                                    <Paragraph type="warning" style={{ marginBottom: 0 }}>
                                      <Text strong>传递到此申请的备注：</Text>
                                      {r.app.diagnosisRemarkCarried || '（无）'}
                                    </Paragraph>
                                  </>
                                ) : (
                                  <Text type="secondary">无诊断结果</Text>
                                )}
                              </Card>
                            </Col>
                          </Row>
                        </div>
                      );
                    },
                  }}
                />
              ),
            },
            {
              key: 'history',
              label: (
                <span onClick={() => setHistoryOpen(true)} style={{ cursor: 'pointer' }}>
                  <Space>
                    <HistoryOutlined />
                    全部申请回看 ({allApplications.length})
                  </Space>
                </span>
              ),
              children: (
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Space>
                    <span>筛选：</span>
                    <AntSelect
                      value={historyFilter}
                      onChange={setHistoryFilter}
                      style={{ width: 140 }}
                      options={[
                        { value: 'all', label: '全部' },
                        { value: 'pending', label: '待审核' },
                        { value: 'approved', label: '已批准' },
                        { value: 'rejected', label: '已驳回' },
                      ]}
                    />
                    <Button icon={<SearchOutlined />} onClick={() => setHistoryOpen(true)}>
                      打开回看窗口
                    </Button>
                  </Space>
                  <Table
                    size="small"
                    rowKey={(r) => r.app.id}
                    columns={cols}
                    dataSource={historyFiltered}
                    pagination={{ pageSize: 5 }}
                  />
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={
          <Space>
            {reviewForm.getFieldValue('_approved') ? (
              <>
                <CheckOutlined style={{ color: '#52c41a' }} />
                批准配件申请
              </>
            ) : (
              <>
                <CloseOutlined style={{ color: '#ff4d4f' }} />
                驳回配件申请
              </>
            )}
            <Text type="secondary">— 请务必参考携带的诊断备注</Text>
          </Space>
        }
        open={reviewOpen}
        onCancel={() => {
          setReviewOpen(false);
          setReviewApp(null);
        }}
        onOk={submitReview}
        okText={
          reviewForm.getFieldValue('_approved') ? '确认批准（幂等）' : '确认驳回（幂等）'
        }
        width={720}
        destroyOnClose
      >
        {reviewApp && (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Alert
              type={reviewForm.getFieldValue('_approved') ? 'success' : 'warning'}
              showIcon
              message={
                reviewForm.getFieldValue('_approved')
                  ? '批准后：工单流转回工程师，可领取配件并开始维修'
                  : '驳回后：工单流转回工程师，可调整诊断备注或配件清单后重新提交'
              }
            />
            {reviewApp.app.basedOnApplicationId &&
              (() => {
                const baseApp = findBaseApplication(reviewApp.app, reviewApp.ticket);
                return (
                  <Alert
                    type="error"
                    showIcon
                    message={
                      <Space direction="vertical" size={4}>
                        <Text strong>
                          本次为驳回重提 · 基于申请 #
                          {reviewApp.app.basedOnApplicationId.slice(0, 8)}
                        </Text>
                        <Text>
                          <Text strong>上次驳回人：</Text>
                          {baseApp?.reviewBy || '（未知）'}
                          <Text strong style={{ marginLeft: 12 }}>
                            驳回时间：
                          </Text>
                          {baseApp?.reviewAt || '（未知）'}
                        </Text>
                        <Text type="danger">
                          <Text strong>上次驳回意见：</Text>
                          {baseApp?.reviewRemark || '（无）'}
                        </Text>
                        {reviewApp.app.changeSummary && (
                          <div style={{ marginTop: 4 }}>
                            <Text strong>本次变更摘要：</Text>
                            {renderChangeSummary(reviewApp.app, reviewApp.ticket)}
                          </div>
                        )}
                      </Space>
                    }
                  />
                );
              })()}
            <Card
              size="small"
              type="inner"
              title={
                <Space>
                  申请配件
                  {reviewApp.app.changeSummary && (
                    <Tag color="orange">
                      变更 {reviewApp.app.changeSummary.added.length +
                        reviewApp.app.changeSummary.modified.length +
                        reviewApp.app.changeSummary.removed.length}{' '}
                      项
                    </Tag>
                  )}
                </Space>
              }
            >
              <List
                size="small"
                dataSource={reviewApp.app.items}
                renderItem={(it) => {
                  const cs = reviewApp.app.changeSummary;
                  let tagInfo: { tag: string; color: string } | null = null;
                  if (cs) {
                    const matchKey = (i: any) => i.sku?.trim() || i.name.trim();
                    if (cs.added.find((a) => matchKey(a) === matchKey(it)))
                      tagInfo = { tag: '新增', color: 'green' };
                    const mod = cs.modified.find(
                      (m) => matchKey(m.after) === matchKey(it)
                    );
                    if (mod)
                      tagInfo = {
                        tag: `修改(${mod.diffFields.join('/')})`,
                        color: 'blue',
                      };
                    if (cs.unchanged.find((u) => matchKey(u) === matchKey(it)))
                      tagInfo = { tag: '未变', color: 'default' };
                  }
                  return (
                    <List.Item key={it.id}>
                      <Space>
                        <Text strong>{it.name}</Text> ×{it.quantity}
                        {it.unit} {it.sku ? `（SKU: ${it.sku}）` : ''}
                        {tagInfo && <Tag color={tagInfo.color}>{tagInfo.tag}</Tag>}
                      </Space>
                      <span style={{ color: '#666', marginLeft: 'auto' }}>
                        {it.reason}
                      </span>
                    </List.Item>
                  );
                }}
              />
              {reviewApp.app.changeSummary?.removed &&
                reviewApp.app.changeSummary.removed.length > 0 && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: '6px 10px',
                      background: '#fff1f0',
                      border: '1px dashed #ffa39e',
                      borderRadius: 4,
                      fontSize: 12,
                    }}
                  >
                    <Text type="danger" strong>
                      本次相对上次删除{' '}
                      {reviewApp.app.changeSummary.removed.length} 项：
                    </Text>
                    <span
                      style={{
                        color: '#8c8c8c',
                        textDecoration: 'line-through',
                        marginLeft: 4,
                      }}
                    >
                      {reviewApp.app.changeSummary.removed
                        .map((i) => `${i.name}×${i.quantity}${i.unit}`)
                        .join('、')}
                    </span>
                  </div>
                )}
            </Card>
            <Card size="small" type="inner" title="诊断备注（自动携带入申请，责任清晰）">
              <Text type="warning" style={{ whiteSpace: 'pre-wrap' }}>
                {reviewApp.app.diagnosisRemarkCarried || '（无）'}
              </Text>
            </Card>
            <Form layout="vertical" form={reviewForm} preserve={false}>
              <Form.Item hidden name="_approved">
                <Input />
              </Form.Item>
              <Form.Item
                label={
                  reviewForm.getFieldValue('_approved')
                    ? '发货/安排说明'
                    : '驳回原因（必填，工程师可见）'
                }
                name="reviewRemark"
                rules={
                  !reviewForm.getFieldValue('_approved')
                    ? [{ required: true, message: '驳回必须填写原因' }]
                    : []
                }
              >
                <TextArea rows={3} placeholder="驳回时务必写清楚修改要求，方便工程师重提" />
              </Form.Item>
            </Form>
          </Space>
        )}
      </Modal>

      <Modal
        title="配件申请回看 - 全部历史"
        open={historyOpen}
        onCancel={() => setHistoryOpen(false)}
        footer={
          <Button type="primary" onClick={() => setHistoryOpen(false)}>
            关闭
          </Button>
        }
        width={960}
        destroyOnClose
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message="回看时，每条申请均保留了对应的诊断备注（diagnosisRemarkCarried），可随时核对故障诊断与配件申请的责任链"
          />
          <AntSelect
            value={historyFilter}
            onChange={setHistoryFilter}
            style={{ width: 200 }}
            options={[
              { value: 'all', label: '全部状态' },
              { value: 'pending', label: '待审核' },
              { value: 'approved', label: '已批准' },
              { value: 'rejected', label: '已驳回' },
            ]}
          />
          <Table
            size="small"
            rowKey={(r) => r.app.id}
            columns={cols}
            dataSource={historyFiltered}
            pagination={{ pageSize: 8 }}
          />
        </Space>
      </Modal>
    </Space>
  );
}
