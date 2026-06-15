import { useState } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Tabs,
  Table,
  Tag,
  Alert,
  Steps,
  Divider,
  Tooltip,
  Collapse,
  message,
  Empty,
  Row,
  Col,
  Statistic,
  Modal,
} from 'antd';
import {
  ThunderboltOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  EyeOutlined,
  DownloadOutlined,
  DatabaseOutlined,
  CodeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { runFullFlowDemo, runRejectFlowDemo } from '../services/demoFlows';
import { TicketService } from '../services/TicketService';
import type { TestStepResult } from '../services/demoFlows';

const { Title, Paragraph, Text } = Typography;

if (typeof window !== 'undefined') {
  (window as any).TicketService = TicketService;
  (window as any).__applianceAfterSales = { TicketService };
}

interface Props {
  onUpdated: () => void;
}

export default function DemoPage({ onUpdated }: Props) {
  const navigate = useNavigate();
  const [msgApi, msgCtx] = message.useMessage();
  const [fullFlow, setFullFlow] = useState<{
    steps: TestStepResult[];
    ticketId?: string;
    applicationId?: string;
  } | null>(null);
  const [rejectFlow, setRejectFlow] = useState<{
    steps: TestStepResult[];
    ticketId?: string;
  } | null>(null);
  const [exportResult, setExportResult] = useState<any>(null);
  const [viewTicketId, setViewTicketId] = useState<string | undefined>();
  const [, forceTick] = useState(0);
  const rerender = () => forceTick((n) => n + 1);

  const dashboard = TicketService.getDashboard();
  const logs = TicketService.getExportLogs();

  const runFull = () => {
    const r = runFullFlowDemo();
    setFullFlow(r);
    msgApi.success('完整流程演示执行完成');
    onUpdated();
    rerender();
  };

  const runReject = () => {
    const r = runRejectFlowDemo();
    setRejectFlow(r);
    msgApi.success('驳回流程演示执行完成');
    onUpdated();
    rerender();
  };

  const runExport = () => {
    const r = TicketService.exportTickets({});
    setExportResult(r);
    msgApi.success('导出任务执行完成');
    rerender();
  };

  const resetData = () => {
    Modal.confirm({
      title: '确认清空所有演示数据？',
      content: '将删除全部工单与导出日志，此操作不可撤销',
      okText: '清空',
      okButtonProps: { danger: true },
      onOk: () => {
          localStorage.removeItem('appliance_after_sales_tickets_v1');
          localStorage.removeItem('appliance_after_sales_exports_v1');
          localStorage.removeItem('appliance_after_sales_create_idempotency_map_v1');
          localStorage.removeItem('after_sales_current_user');
          setFullFlow(null);
          setRejectFlow(null);
          setExportResult(null);
          msgApi.success('已清空');
          onUpdated();
          rerender();
        },
    });
  };

  const stepCols = [
    {
      title: '步骤',
      key: 'step',
      width: 320,
      render: (_: unknown, r: TestStepResult, i: number) => (
        <Space>
          <Tag color="blue">{i + 1}</Tag>
          <Text strong>{r.name}</Text>
        </Space>
      ),
    },
    {
      title: '结果',
      dataIndex: 'success',
      key: 'ok',
      width: 120,
      render: (ok: boolean, r: TestStepResult) => (
        <Space>
          {ok ? (
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
          ) : (
            <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
          )}
          {ok ? '成功' : '失败'}
          {r.duplicated && <Tag color="orange">幂等命中</Tag>}
        </Space>
      ),
    },
    {
      title: '返回信息',
      dataIndex: 'message',
      key: 'msg',
      width: 280,
      render: (m: string) => <Text type="secondary">{m}</Text>,
    },
    {
      title: 'Payload',
      dataIndex: 'payload',
      key: 'payload',
      render: (p: unknown) =>
        p ? (
          <Tooltip title={JSON.stringify(p, null, 2)}>
            <pre
              style={{
                fontSize: 11,
                background: '#fafafa',
                padding: 4,
                borderRadius: 4,
                margin: 0,
                maxHeight: 60,
                overflow: 'auto',
              }}
            >
              {JSON.stringify(p, null, 0)}
            </pre>
          </Tooltip>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
  ];

  const sampleCode = `// ====== 项目真实服务层调用示例 ======
// 方式A：在浏览器控制台直接使用（已挂载到 window.TicketService）
// 方式B：在项目代码中 ES module 方式引入：
//   import { TicketService } from './src/services/TicketService';

// 1. 创建工单（幂等，同一idempotencyKey多次调用仅创建1次）
const r1 = await TicketService.createTicket({
  source: '400热线',
  customer: { name: '陈先生', phone: '13800001111', address: '北京市朝阳区XX小区' },
  appliance: { type: '空调', brand: '格力', model: 'KFR-35GW', purchaseDate: '2022-06-15', warranty: true },
  complaintDescription: '制冷不足，有异常噪音',
  operator: '张客服',
  idempotencyKey: 'create-demo-' + Date.now()
});
const ticketId = r1.ticket!.id;

// 2. 客服派单给工程师
await TicketService.assignEngineer({
  ticketId,
  engineer: '李工程师',
  operator: '张客服',
  idempotencyKey: 'assign-demo-1',
  remark: '客户要求上午上门'
});

// 3. 工程师进入诊断
await TicketService.startDiagnosis(ticketId, '李工程师', 'startDiag-demo-1');

// 4. 提交故障诊断（需配件→后续会自动携带诊断备注）
await TicketService.submitDiagnosis({
  ticketId,
  diagnosis: {
    symptoms: ['制冷不足', '异常噪音'],
    faultCode: 'E3',
    faultDescription: '压缩机启动电容容量衰减（20uF→4uF）',
    solution: '更换电容',
    needParts: true,
    laborFee: 180,
    remark: '电容规格20uF/450V，紧急'  // ← 此备注会自动带入配件申请
  },
  operator: '李工程师',
  idempotencyKey: 'diag-demo-1'
});

// 5. 提交配件申请（自动携带诊断备注 diagnosisRemarkCarried）
const r5 = await TicketService.submitPartsApplication({
  ticketId,
  items: [{ id: 'x1', name: '压缩机启动电容', sku: 'CAP-20UF', quantity: 1, unit: '个', reason: '容量衰减' }],
  operator: '李工程师',
  idempotencyKey: 'parts-demo-1',
  remark: '请同城急送'  // ← 与诊断备注合并保存
});
const applicationId = r5.application!.id;

// 6. 配件管理员审核（批准/驳回）
await TicketService.reviewPartsApplication({
  applicationId,
  approved: true,
  reviewRemark: '已核对库存，安排发货',
  operator: '王管理员',
  idempotencyKey: 'review-demo-1'
});

// 7. 工程师开始维修并完工
await TicketService.startRepair(ticketId, '李工程师', 'startRepair-demo-1');
await TicketService.completeRepair({
  ticketId,
  finalReport: '已更换电容，制冷恢复正常，客户签字确认',
  operator: '李工程师',
  idempotencyKey: 'complete-demo-1'
});

// 8. 回看配件申请（含诊断备注责任链）
TicketService.getPartsApplicationsByTicket(ticketId)
  .forEach(app => console.log(app.diagnosisRemarkCarried, app.items, app.reviewRemark));

// 9. 导出任务
TicketService.exportTickets({ status: 'completed' });
`;

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {msgCtx}

      <Card
        title={
          <Space>
            <ThunderboltOutlined />
            <Title level={4} style={{ margin: 0 }}>
              请求示例 / 一键跑通
            </Title>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={rerender}>
              刷新
            </Button>
            <Button danger icon={<DatabaseOutlined />} onClick={resetData}>
              清空数据
            </Button>
          </Space>
        }
      >
        <Alert
          type="success"
          showIcon
          message="服务层已覆盖：导出任务、幂等提交、故障诊断处理、配件申请回看。点击下方按钮即可一键跑通所有请求示例。"
          style={{ marginBottom: 16 }}
        />
        <Row gutter={16}>
          <Col span={6}>
            <Statistic title="总工单" value={dashboard.total} />
          </Col>
          <Col span={6}>
            <Statistic title="已完成" value={dashboard.completed} valueStyle={{ color: '#52c41a' }} />
          </Col>
          <Col span={6}>
            <Statistic
              title="待审核配件"
              value={dashboard.pendingParts}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Col>
          <Col span={6}>
            <Statistic title="导出日志" value={logs.length} />
          </Col>
        </Row>
      </Card>

      <Card>
        <Steps
          current={6}
          items={[
            { title: '客服建单', description: 'createTicket（幂等）' },
            { title: '派单工程师', description: 'assignEngineer' },
            { title: '故障诊断', description: 'submitDiagnosis → 备注自动入库' },
            { title: '配件申请', description: 'submitPartsApplication → 携带诊断备注' },
            { title: '管理员审核', description: 'reviewPartsApplication → 驳回可重提' },
            { title: '维修完成', description: 'completeRepair → 状态/责任人/时间点入库' },
            { title: '回看与导出', description: 'getPartsApplications + exportTickets' },
          ]}
        />
      </Card>

      <Card
        title="一键执行"
        extra={
          <Text type="secondary">
            每次演示均使用独立幂等Key，可反复点击；若重复提交同一条请求会「幂等命中」
          </Text>
        }
      >
        <Space wrap>
          <Button type="primary" size="large" icon={<ThunderboltOutlined />} onClick={runFull}>
            ① 跑通完整流程（空调故障：诊断→配件申请→批准→维修完成）
          </Button>
          <Button size="large" icon={<ExclamationCircleOutlined />} onClick={runReject}>
            ② 跑通驳回重提流程（洗衣机配件申请被驳回→修改后重新提交）
          </Button>
          <Button size="large" icon={<DownloadOutlined />} onClick={runExport}>
            ③ 执行导出任务
          </Button>
        </Space>
        <Divider />
        {fullFlow && (
          <div style={{ marginBottom: 16 }}>
            <Title level={5}>
              ① 完整流程结果（共 {fullFlow.steps.length} 步）
              {fullFlow.ticketId && (
                <Button
                  size="small"
                  style={{ marginLeft: 8 }}
                  icon={<EyeOutlined />}
                  onClick={() => navigate(`/ticket/${fullFlow.ticketId}`)}
                >
                  查看工单详情
                </Button>
              )}
            </Title>
            <Table
              size="small"
              rowKey={(r) => r.name}
              columns={stepCols}
              dataSource={fullFlow.steps}
              pagination={false}
            />
          </div>
        )}
        {rejectFlow && (
          <div style={{ marginBottom: 16 }}>
            <Title level={5}>
              ② 驳回重提流程结果（共 {rejectFlow.steps.length} 步）
              {rejectFlow.ticketId && (
                <Button
                  size="small"
                  style={{ marginLeft: 8 }}
                  icon={<EyeOutlined />}
                  onClick={() => navigate(`/ticket/${rejectFlow.ticketId}`)}
                >
                  查看工单详情
                </Button>
              )}
            </Title>
            <Table
              size="small"
              rowKey={(r) => r.name}
              columns={stepCols}
              dataSource={rejectFlow.steps}
              pagination={false}
            />
          </div>
        )}
        {exportResult && (
          <div>
            <Title level={5}>③ 导出任务结果</Title>
            <Row gutter={16}>
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
            <Collapse style={{ marginTop: 12 }}>
              <Collapse.Panel header={`展开 ${exportResult.rows.length} 行导出CSV预览`} key="1">
                <pre
                  style={{
                    fontSize: 11,
                    background: '#fafafa',
                    padding: 8,
                    borderRadius: 4,
                    maxHeight: 240,
                    overflow: 'auto',
                  }}
                >
                  {exportResult.rows.length === 0
                    ? '(无数据)'
                    : [
                        Object.keys(exportResult.rows[0]).join(','),
                        ...exportResult.rows.map((row: any) =>
                          Object.values(row)
                            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
                            .join(',')
                        ),
                      ].join('\n')}
                </pre>
              </Collapse.Panel>
            </Collapse>
            <Collapse style={{ marginTop: 8 }}>
              <Collapse.Panel header={`展开导出日志（共 ${logs.length} 条）`} key="2">
                {logs.length === 0 ? (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                  <Table
                    size="small"
                    rowKey="exportId"
                    columns={[
                      { title: '导出ID', dataIndex: 'exportId', key: 'id' },
                      { title: '时间', dataIndex: 'exportedAt', key: 't' },
                      { title: '筛选条件', dataIndex: 'filter', key: 'f' },
                      { title: '记录数', dataIndex: 'recordCount', key: 'n', width: 80 },
                      { title: '操作人', dataIndex: 'operator', key: 'op', width: 120 },
                    ]}
                    dataSource={logs}
                    pagination={false}
                  />
                )}
              </Collapse.Panel>
            </Collapse>
          </div>
        )}
        {!fullFlow && !rejectFlow && !exportResult && (
          <Empty
            description="请点击上方按钮执行演示流程"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Card>

      <Card title={<Space><CodeOutlined />服务层请求示例代码（可在浏览器控制台运行）</Space>}>
        <Alert
          type="info"
          showIcon
          message="核心设计：diagnosis.remark 入库后自动携带入 PartsApplication.diagnosisRemarkCarried；每次流转记录状态、责任人、时间点在 timeline、communications 中；所有写入操作均有 idempotencyKey 幂等保护"
          style={{ marginBottom: 12 }}
        />
        <pre
          style={{
            fontSize: 12,
            background: '#1e1e1e',
            color: '#d4d4d4',
            padding: 16,
            borderRadius: 6,
            overflow: 'auto',
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          {sampleCode}
        </pre>
      </Card>
    </Space>
  );
}
