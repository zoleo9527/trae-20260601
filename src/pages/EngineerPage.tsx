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
  InputNumber,
  message,
  Typography,
  Row,
  Col,
  Alert,
  Steps,
  Tabs,
  Divider,
  List,
  Radio as AntRadio,
} from 'antd';
import {
  EyeOutlined,
  PlayCircleOutlined,
  SolutionOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  FileDoneOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { TicketService } from '../services/TicketService';
import { StatusLabel, StatusColor } from '../types';
import type { Role, TicketStatus, ServiceTicket, DiagnosisResult, PartItem } from '../types';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

interface Props {
  role: Role;
  onUpdated: () => void;
}

export default function EngineerPage({ role, onUpdated }: Props) {
  const navigate = useNavigate();
  const [msgApi, msgCtx] = message.useMessage();
  const [currentTicket, setCurrentTicket] = useState<ServiceTicket | null>(null);
  const [diagOpen, setDiagOpen] = useState(false);
  const [partsOpen, setPartsOpen] = useState(false);
  const [repairOpen, setRepairOpen] = useState(false);
  const [diagForm] = Form.useForm();
  const [partsForm] = Form.useForm();
  const [repairForm] = Form.useForm();
  const [partsRows, setPartsRows] = useState<PartItem[]>([
    {
      id: uuidv4(),
      name: '',
      sku: '',
      quantity: 1,
      unit: '个',
      reason: '',
    },
  ]);

  const refresh = () => onUpdated();

  const myTickets = TicketService.listTickets(role);
  const isEngineer = role === 'engineer';

  const openDiagnosis = (t: ServiceTicket) => {
    setCurrentTicket(t);
    diagForm.resetFields();
    if (t.diagnosis) {
      diagForm.setFieldsValue({
        symptoms: t.diagnosis.symptoms,
        faultCode: t.diagnosis.faultCode,
        faultDescription: t.diagnosis.faultDescription,
        solution: t.diagnosis.solution,
        needParts: t.diagnosis.needParts,
        estimateMinutes: t.diagnosis.estimateMinutes,
        laborFee: t.diagnosis.laborFee,
        remark: t.diagnosis.remark,
      });
    }
    setDiagOpen(true);
  };

  const startDiagnosis = (t: ServiceTicket) => {
    const r = TicketService.startDiagnosis(t.id, '李工程师', uuidv4());
    if (r.success) {
      msgApi.success('已进入诊断');
      refresh();
    } else {
      msgApi.error((r as any).message || '失败');
    }
  };

  const submitDiagnosis = async () => {
    if (!currentTicket) return;
    const v = await diagForm.validateFields();
    const diagnosis: DiagnosisResult = {
      symptoms: v.symptoms || [],
      faultCode: v.faultCode,
      faultDescription: v.faultDescription,
      solution: v.solution,
      needParts: v.needParts,
      estimateMinutes: v.estimateMinutes,
      laborFee: v.laborFee,
      remark: v.remark,
    };
    const r = TicketService.submitDiagnosis({
      ticketId: currentTicket.id,
      diagnosis,
      operator: '李工程师',
      idempotencyKey: uuidv4(),
    });
    if (r.success) {
      msgApi.success(r.message);
      setDiagOpen(false);
      refresh();
      if (r.nextAction === 'apply_parts' && r.ticket) {
        openPartsApply(r.ticket);
      }
    } else {
      msgApi.error(r.message || '提交失败');
    }
  };

  const openPartsApply = (t: ServiceTicket) => {
    setCurrentTicket(t);
    setPartsRows([
      { id: uuidv4(), name: '', sku: '', quantity: 1, unit: '个', reason: '' },
    ]);
    partsForm.resetFields();
    setPartsOpen(true);
  };

  const addPartRow = () => {
    setPartsRows([
      ...partsRows,
      { id: uuidv4(), name: '', sku: '', quantity: 1, unit: '个', reason: '' },
    ]);
  };

  const removePartRow = (id: string) => {
    setPartsRows(partsRows.filter((p) => p.id !== id));
  };

  const updatePartRow = (id: string, key: keyof PartItem, value: any) => {
    setPartsRows(partsRows.map((p) => (p.id === id ? { ...p, [key]: value } : p)));
  };

  const submitParts = async () => {
    if (!currentTicket) return;
    const v = await partsForm.validateFields();
    const items = partsRows.filter((r) => r.name && r.quantity > 0);
    if (items.length === 0) {
      msgApi.error('请填写至少一项配件');
      return;
    }
    const r = TicketService.submitPartsApplication({
      ticketId: currentTicket.id,
      items,
      operator: '李工程师',
      idempotencyKey: uuidv4(),
      remark: v.applicationRemark,
    });
    if (r.success) {
      msgApi.success(r.message);
      setPartsOpen(false);
      refresh();
    } else {
      msgApi.error(r.message || '提交失败');
    }
  };

  const openRepair = (t: ServiceTicket) => {
    setCurrentTicket(t);
    repairForm.resetFields();
    if (t.status === 'parts_approved' || t.status === 'diagnosed_no_parts') {
      const r = TicketService.startRepair(t.id, '李工程师', uuidv4());
      if (r.success) refresh();
    }
    setRepairOpen(true);
  };

  const submitRepair = async () => {
    if (!currentTicket) return;
    const v = await repairForm.validateFields();
    const r = TicketService.completeRepair({
      ticketId: currentTicket.id,
      finalReport: v.finalReport,
      operator: '李工程师',
      idempotencyKey: uuidv4(),
    });
    if (r.success) {
      msgApi.success(r.message);
      setRepairOpen(false);
      refresh();
    } else {
      msgApi.error(r.message || '提交失败');
    }
  };

  const renderAction = (r: ServiceTicket) => {
    if (!isEngineer) return <Text type="secondary">仅工程师可操作</Text>;
    if (r.status === 'assigned_to_engineer')
      return (
        <Button type="primary" size="small" icon={<PlayCircleOutlined />} onClick={() => startDiagnosis(r)}>
          开始诊断
        </Button>
      );
    if (r.status === 'parts_rejected')
      return (
        <Space>
          <Button type="primary" size="small" icon={<SettingOutlined />} onClick={() => openPartsApply(r)}>
            重提配件申请
          </Button>
          <Button size="small" icon={<SolutionOutlined />} onClick={() => openDiagnosis(r)}>
            修改诊断
          </Button>
        </Space>
      );
    if (r.status === 'diagnosing')
      return (
        <Button type="primary" size="small" icon={<SolutionOutlined />} onClick={() => openDiagnosis(r)}>
          提交诊断
        </Button>
      );
    if (r.status === 'diagnosed_need_parts')
      return (
        <Button type="primary" size="small" icon={<SettingOutlined />} onClick={() => openPartsApply(r)}>
          提交配件申请
        </Button>
      );
    if (r.status === 'parts_applying') {
      const latest = r.partsApplications[r.partsApplications.length - 1];
      return (
        <Space>
          <Tag color="warning">配件申请中</Tag>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              if (latest) {
                msgApi.info(
                  `已提交 ${latest.items.length} 项配件，申请备注：${latest.diagnosisRemarkCarried || '(无)'}`
                );
              }
            }}
          >
            查看申请
          </Button>
        </Space>
      );
    }
    if (r.status === 'parts_approved' || r.status === 'diagnosed_no_parts')
      return (
        <Button type="primary" size="small" icon={<ToolOutlined />} onClick={() => openRepair(r)}>
          开始维修
        </Button>
      );
    if (r.status === 'repairing')
      return (
        <Button size="small" icon={<FileDoneOutlined />} onClick={() => openRepair(r)}>
          完工报告
        </Button>
      );
    if (r.status === 'completed') return <Tag color="green">已完成</Tag>;
    return null;
  };

  const cols = [
    {
      title: '工单',
      key: 'no',
      render: (_: unknown, r: ServiceTicket) => (
        <div>
          <Text strong>{r.ticketNo}</Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              报修：{r.complaintDescription.slice(0, 24)}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: '客户/地址',
      key: 'c',
      render: (_: unknown, r: ServiceTicket) => (
        <div>
          {r.customer.name} · {r.customer.phone}
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
      key: 'a',
      render: (_: unknown, r: ServiceTicket) => `${r.appliance.brand} ${r.appliance.model}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 's',
      width: 160,
      render: (s: TicketStatus) => <Tag color={StatusColor[s] as any}>{StatusLabel[s]}</Tag>,
    },
    {
      title: '诊断备注 / 配件申请回看',
      key: 'note',
      width: 260,
      render: (_: unknown, r: ServiceTicket) => {
        if (r.partsApplications.length > 0) {
          const latest = r.partsApplications[r.partsApplications.length - 1];
          return (
            <Text type="warning" style={{ fontSize: 12 }}>
              携带备注：{latest.diagnosisRemarkCarried || '(无)'}
            </Text>
          );
        }
        if (r.diagnosis?.remark)
          return (
            <Text type="warning" style={{ fontSize: 12 }}>
              诊断备注：{r.diagnosis.remark}
            </Text>
          );
        return <Text type="secondary" style={{ fontSize: 12 }}>暂无</Text>;
      },
    },
    {
      title: '操作',
      key: 'op',
      width: 180,
      fixed: 'right' as const,
      render: (_: unknown, r: ServiceTicket) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/ticket/${r.id}`)}>
            详情
          </Button>
          {renderAction(r)}
        </Space>
      ),
    },
  ];

  const renderStep = (r: ServiceTicket) => {
    const steps = ['诊断', '配件', '维修', '完成'];
    const icons = [<SolutionOutlined />, <SettingOutlined />, <ToolOutlined />, <CheckCircleOutlined />];
    const current =
      ['assigned_to_engineer', 'diagnosing'].includes(r.status)
        ? 0
        : [
            'diagnosed_need_parts',
            'diagnosed_no_parts',
            'parts_applying',
            'parts_approved',
            'parts_rejected',
          ].includes(r.status)
        ? 1
        : ['repairing'].includes(r.status)
        ? 2
        : r.status === 'completed'
        ? 3
        : -1;
    return (
      <Steps
        size="small"
        current={current}
        items={steps.map((title, i) => ({ title, icon: icons[i] }))}
      />
    );
  };

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {msgCtx}

      <Card
        title={<Title level={5} style={{ margin: 0 }}>维修工程师工作台 · 接力流转</Title>}
        extra={
          <Alert
            type="info"
            showIcon
            message="故障诊断不是终点，诊断备注将自动带入配件申请；驳回后可直接重新提交，无需独立菜单"
            style={{ padding: '4px 12px' }}
          />
        }
      >
        <Tabs
          items={[
            {
              key: 'all',
              label: `全部工单 (${myTickets.length})`,
              children: (
                <Table
                  size="small"
                  rowKey="id"
                  columns={cols}
                  dataSource={myTickets}
                  expandable={{
                    expandedRowRender: (r) => (
                      <div style={{ padding: '0 24px 12px' }}>
                        {renderStep(r)}
                        {r.diagnosis && (
                          <Card size="small" type="inner" title="诊断结果" style={{ marginTop: 12 }}>
                            <Paragraph style={{ marginBottom: 0 }}>
                              <Text strong>故障：</Text>
                              {r.diagnosis.faultDescription}
                            </Paragraph>
                            <Paragraph style={{ marginBottom: 0 }}>
                              <Text strong>方案：</Text>
                              {r.diagnosis.solution}
                            </Paragraph>
                            {r.diagnosis.remark && (
                              <Paragraph type="warning" style={{ marginBottom: 0 }}>
                                <Text strong>备注（将带入配件申请）：</Text>
                                {r.diagnosis.remark}
                              </Paragraph>
                            )}
                          </Card>
                        )}
                        {r.partsApplications.length > 0 && (
                          <Card size="small" type="inner" title="配件申请回看" style={{ marginTop: 12 }}>
                            <List
                              size="small"
                              dataSource={r.partsApplications}
                              renderItem={(app) => (
                                <List.Item>
                                  <List.Item.Meta
                                    title={
                                      <Space>
                                        申请 #{app.id.slice(0, 8)}
                                        <Tag
                                          color={
                                            app.status === 'approved'
                                              ? 'green'
                                              : app.status === 'rejected'
                                              ? 'red'
                                              : 'warning'
                                          }
                                        >
                                          {app.status === 'approved'
                                            ? '已批准'
                                            : app.status === 'rejected'
                                            ? '已驳回'
                                            : '待审核'}
                                        </Tag>
                                        <Text type="secondary">{app.appliedAt}</Text>
                                      </Space>
                                    }
                                    description={
                                      <>
                                        <div>
                                          配件：
                                          {app.items
                                            .map((i) => `${i.name}×${i.quantity}${i.unit}`)
                                            .join('，')}
                                        </div>
                                        <div style={{ color: '#d46b08' }}>
                                          携带诊断备注：{app.diagnosisRemarkCarried || '无'}
                                        </div>
                                        {app.reviewRemark && <div>审核意见：{app.reviewRemark}</div>}
                                      </>
                                    }
                                  />
                                </List.Item>
                              )}
                            />
                          </Card>
                        )}
                      </div>
                    ),
                  }}
                  locale={{ emptyText: '暂无分配给你的工单，请先到客服工作台派单' }}
                />
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={
          <Space>
            <SolutionOutlined />
            故障诊断提交
            <Text type="secondary">— 诊断备注将自动带入后续配件申请</Text>
          </Space>
        }
        open={diagOpen}
        onCancel={() => setDiagOpen(false)}
        onOk={submitDiagnosis}
        okText="提交诊断（幂等）"
        width={760}
        destroyOnClose
      >
        {currentTicket?.status === 'parts_rejected' && (
          <Alert
            type="warning"
            showIcon
            message="该工单配件申请已被驳回，可重新提交诊断或直接再次申请配件"
            style={{ marginBottom: 16 }}
          />
        )}
        <Form layout="vertical" form={diagForm} preserve={false}>
          <Alert
            type="info"
            showIcon
            message="诊断完成后将自动流转：需配件→进入配件申请；无需配件→直接维修"
            style={{ marginBottom: 16 }}
          />
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                label="故障现象（多选）"
                name="symptoms"
                rules={[{ required: true, message: '至少选一项' }]}
              >
                <Select mode="tags" placeholder="选择或输入" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="故障代码" name="faultCode">
                <Input placeholder="如E3、E1等（选填）" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="故障描述（检测过程与结论）"
            name="faultDescription"
            rules={[{ required: true }]}
          >
            <TextArea rows={3} placeholder="请描述检测到的具体故障" />
          </Form.Item>
          <Form.Item label="处理方案" name="solution" rules={[{ required: true }]}>
            <TextArea rows={2} placeholder="将执行的修复步骤" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item label="预计工时(分钟)" name="estimateMinutes">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="人工费(元)" name="laborFee" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="是否需要配件" name="needParts" initialValue={true}>
                <AntRadio.Group>
                  <AntRadio value={true}>需要</AntRadio>
                  <AntRadio value={false}>不需要</AntRadio>
                </AntRadio.Group>
              </Form.Item>
            </Col>
          </Row>
          <Divider orientation="left">
            <Tag color="orange">重要：诊断备注将自动带入配件申请，配件管理员可见</Tag>
          </Divider>
          <Form.Item label="诊断备注（供配件申请及后续流转参考）" name="remark">
            <TextArea rows={2} placeholder="例如：电容规格/是否紧急/客户特殊要求等" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <Space>
            <SettingOutlined />
            配件申请
            <Tag color="orange">自动携带诊断备注</Tag>
          </Space>
        }
        open={partsOpen}
        onCancel={() => setPartsOpen(false)}
        onOk={submitParts}
        okText="提交申请（幂等）"
        width={820}
        destroyOnClose
      >
        <Alert
          type="info"
          showIcon
          message="提交后将流转给配件管理员审核；驳回意见会回到工程师此处"
          style={{ marginBottom: 16 }}
        />
        {currentTicket?.diagnosis?.remark && (
          <Card size="small" type="inner" title="自动带入的诊断备注" style={{ marginBottom: 12 }}>
            <Text type="warning">{currentTicket.diagnosis.remark}</Text>
          </Card>
        )}

        <Card
          title="配件清单"
          size="small"
          extra={
            <Button size="small" type="dashed" onClick={addPartRow}>
              + 新增配件
            </Button>
          }
        >
          <List
            size="small"
            dataSource={partsRows}
            renderItem={(row, idx) => (
              <List.Item key={row.id}>
                <Row gutter={8} style={{ width: '100%' }} align="middle">
                  <Col span={1}>
                    <Text type="secondary">{idx + 1}.</Text>
                  </Col>
                  <Col span={7}>
                    <Input
                      value={row.name}
                      placeholder="配件名称"
                      onChange={(e) => updatePartRow(row.id, 'name', e.target.value)}
                    />
                  </Col>
                  <Col span={4}>
                    <Input
                      value={row.sku}
                      placeholder="料号/SKU"
                      onChange={(e) => updatePartRow(row.id, 'sku', e.target.value)}
                    />
                  </Col>
                  <Col span={3}>
                    <InputNumber
                      min={1}
                      value={row.quantity}
                      style={{ width: '100%' }}
                      onChange={(v) => updatePartRow(row.id, 'quantity', v)}
                    />
                  </Col>
                  <Col span={2}>
                    <Input
                      value={row.unit}
                      placeholder="单位"
                      onChange={(e) => updatePartRow(row.id, 'unit', e.target.value)}
                    />
                  </Col>
                  <Col span={5}>
                    <Input
                      value={row.reason}
                      placeholder="申请原因"
                      onChange={(e) => updatePartRow(row.id, 'reason', e.target.value)}
                    />
                  </Col>
                  <Col span={2}>
                    {partsRows.length > 1 && (
                      <Button danger type="link" onClick={() => removePartRow(row.id)}>
                        删除
                      </Button>
                    )}
                  </Col>
                </Row>
              </List.Item>
            )}
          />
        </Card>
        <Form layout="vertical" form={partsForm} style={{ marginTop: 12 }} preserve={false}>
          <Form.Item label="申请补充备注（会与诊断备注一起传递给审核）" name="applicationRemark">
            <TextArea rows={2} placeholder="配送要求、预计到货等" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <Space>
            <FileDoneOutlined />
            维修完工报告
          </Space>
        }
        open={repairOpen}
        onCancel={() => setRepairOpen(false)}
        onOk={submitRepair}
        okText="提交完工（幂等）"
        width={640}
        destroyOnClose
      >
        {currentTicket?.diagnosis && (
          <Card size="small" type="inner" title="诊断与方案回顾" style={{ marginBottom: 12 }}>
            <div>故障：{currentTicket.diagnosis.faultDescription}</div>
            <div>方案：{currentTicket.diagnosis.solution}</div>
            {currentTicket.diagnosis.remark && (
              <div style={{ color: '#d46b08' }}>诊断备注：{currentTicket.diagnosis.remark}</div>
            )}
          </Card>
        )}
        {currentTicket &&
          currentTicket.partsApplications.filter((a) => a.status === 'approved').length > 0 && (
            <Card size="small" type="inner" title="已批准使用的配件" style={{ marginBottom: 12 }}>
              {currentTicket.partsApplications
                .filter((a) => a.status === 'approved')
                .map((a) => (
                  <div key={a.id}>
                    批准申请 #{a.id.slice(0, 8)}：
                    {a.items.map((i) => `${i.name}×${i.quantity}${i.unit}`).join('，')}
                  </div>
                ))}
            </Card>
          )}
        <Form form={repairForm} layout="vertical" preserve={false}>
          <Form.Item label="完工报告" name="finalReport" rules={[{ required: true }]}>
            <TextArea
              rows={5}
              placeholder="请描述维修过程、实际换件情况、客户确认情况、是否有遗留问题"
            />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
