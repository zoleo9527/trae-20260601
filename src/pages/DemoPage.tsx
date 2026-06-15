import {
  Card,
  Steps,
  Button,
  Space,
  Typography,
  Tag,
  Divider,
  message,
  Alert,
  Descriptions,
  Table,
  Empty,
} from 'antd';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InboxOutlined,
  ReloadOutlined,
  UserOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import { useApi } from '@/services/api';
import { useWorkflow } from '@/hooks/useWorkflow';
import {
  roleDisplayMap,
  statusDisplayMap,
  exceptionTypeDisplayMap,
} from '@/utils/stateMachine';
import AuditTimeline from '@/components/AuditTimeline';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import type { MaterialItem, ExceptionRecord, AuditLog } from '@/types';

const { Title, Paragraph, Text } = Typography;

type DemoType = 'smooth' | 'problem' | 'archive';

const SMOOTH_SCHEDULE_ID = 'schedule-002';
const PROBLEM_DRAFT_ID = 'draft-002';
const ARCHIVE_SCHEDULE_ID = 'schedule-003';

export default function DemoPage() {
  const api = useApi();
  const workflow = useWorkflow();
  const [activeDemo, setActiveDemo] = useState<DemoType | null>(null);
  const [smoothStep, setSmoothStep] = useState(0);
  const [problemStep, setProblemStep] = useState(0);

  const resetDemo = () => {
    api.resetDemoData();
    setSmoothStep(0);
    setProblemStep(0);
    setActiveDemo(null);
    message.success('已重置为初始演示数据');
  };

  const smoothSchedule = api.getScheduleById(SMOOTH_SCHEDULE_ID);
  const smoothPickups = smoothSchedule
    ? api.getMaterialPickupsByScheduleId(smoothSchedule.id)
    : [];
  const smoothInstallation = smoothSchedule
    ? api.getInstallationByScheduleId(smoothSchedule.id)
    : null;

  const problemDraft = api.getDraftById(PROBLEM_DRAFT_ID);
  const problemSchedule = problemDraft
    ? api.getSchedulesByDraftId(problemDraft.id)[0]
    : null;
  const problemException = problemSchedule
    ? api.getExceptionsByScheduleId(problemSchedule.id)
    : problemDraft
    ? api
        .getExceptions()
        .filter((e) => e.type === 'size_error')
        .slice(0, 1)
    : [];

  const archiveSchedule = api.getScheduleById(ARCHIVE_SCHEDULE_ID);
  const archivePickups = archiveSchedule
    ? api.getMaterialPickupsByScheduleId(archiveSchedule.id)
    : [];
  const archiveInstallation = archiveSchedule
    ? api.getInstallationByScheduleId(archiveSchedule.id)
    : null;
  const archiveExceptions = archiveSchedule
    ? api.getExceptionsByScheduleId(archiveSchedule.id)
    : [];
  const archiveLogs = archiveSchedule
    ? api.getAuditLogsByEntity('schedule', archiveSchedule.id)
    : [];

  const runSmoothStep = () => {
    if (!smoothSchedule) {
      message.error('找不到顺利流的排产记录，请先重置演示数据');
      return;
    }
    const currentUser = api.getCurrentUser();

    switch (smoothStep) {
      case 0: {
        if (currentUser.id !== 'user-002') {
          api.switchUser('user-002');
          message.info('已切换到处理人员：李明');
        }
        const items = [
          {
            id: api.generateId('item'),
            materialType: '灯箱片',
            specification: '1.52m宽',
            unit: '平方米',
            quantity: 3.24,
            unitPrice: 52,
          },
        ];
        workflow.createMaterialPickupForSchedule(smoothSchedule.id, items);
        const pickup = api.getMaterialPickupsByScheduleId(smoothSchedule.id)[0];
        if (pickup) {
          workflow.transitionMaterialPickup(pickup.id, 'confirmed');
        }
        workflow.transitionSchedule(smoothSchedule.id, 'material_confirmed');
        setSmoothStep(1);
        break;
      }
      case 1: {
        if (currentUser.id !== 'user-002') api.switchUser('user-002');
        workflow.transitionSchedule(smoothSchedule.id, 'printing');
        setSmoothStep(2);
        break;
      }
      case 2: {
        workflow.transitionSchedule(smoothSchedule.id, 'printed');
        setSmoothStep(3);
        break;
      }
      case 3: {
        workflow.transitionSchedule(smoothSchedule.id, 'installing');
        const install = api.getInstallationByScheduleId(smoothSchedule.id);
        if (install) {
          workflow.transitionInstallation(install.id, 'in_progress');
        }
        setSmoothStep(4);
        break;
      }
      case 4: {
        const install = api.getInstallationByScheduleId(smoothSchedule.id);
        if (install) {
          workflow.transitionInstallation(install.id, 'completed', {
            actualDate: dayjs().format('YYYY-MM-DD'),
            installers: ['李明', '王师傅'],
            photos: ['/photos/smooth-1.jpg', '/photos/smooth-2.jpg'],
            customerSigned: true,
            signerName: '陈店长',
            signDate: dayjs().format('YYYY-MM-DD'),
          });
        }
        workflow.transitionSchedule(smoothSchedule.id, 'completed');
        setSmoothStep(5);
        message.success('顺利流完成！所有状态已推进，审计日志已留痕');
        break;
      }
      default:
        message.info('顺利流已全部完成');
    }
  };

  const runProblemStep = () => {
    if (!problemDraft) {
      message.error('找不到问题流的稿件记录，请先重置演示数据');
      return;
    }
    const currentUser = api.getCurrentUser();

    switch (problemStep) {
      case 0: {
        if (currentUser.id !== 'user-001') {
          api.switchUser('user-001');
          message.info('已切换到前台：张小红');
        }
        workflow.transitionDraft(
          problemDraft.id,
          'pending_review',
          '客户确认正确尺寸应为120×180cm'
        );
        setProblemStep(1);
        break;
      }
      case 1: {
        api.switchUser('user-003');
        message.info('已切换到店长：王店长');
        workflow.transitionDraft(problemDraft.id, 'approved');
        setProblemStep(2);
        break;
      }
      case 2: {
        api.switchUser('user-001');
        message.info('已切换到前台：张小红');
        workflow.submitScheduleFromDraft(problemDraft.id, 10, 'normal');
        setProblemStep(3);
        break;
      }
      case 3: {
        api.switchUser('user-002');
        message.info('已切换到处理人员：李明');
        const schedule = api.getSchedulesByDraftId(problemDraft.id)[0];
        if (schedule) {
          const items = [
            {
              id: api.generateId('item'),
              materialType: '相纸',
              specification: '1.27m宽',
              unit: '平方米',
              quantity: 21.6,
              unitPrice: 38,
            },
          ];
          workflow.createMaterialPickupForSchedule(schedule.id, items);
          const pickup = api.getMaterialPickupsByScheduleId(schedule.id)[0];
          if (pickup) workflow.transitionMaterialPickup(pickup.id, 'confirmed');
          workflow.transitionSchedule(schedule.id, 'material_confirmed');
          workflow.transitionSchedule(schedule.id, 'printing');
          workflow.transitionSchedule(schedule.id, 'printed');
        }
        setProblemStep(4);
        break;
      }
      case 4: {
        const schedule = api.getSchedulesByDraftId(problemDraft.id)[0];
        if (schedule) {
          workflow.reportColorComplaint(
            schedule.id,
            '客户反馈喷绘成品颜色比设计稿偏暗，蓝色部分不够鲜艳'
          );
        }
        setProblemStep(5);
        break;
      }
      case 5: {
        api.switchUser('user-003');
        message.info('已切换到店长：王店长');
        const schedule = api.getSchedulesByDraftId(problemDraft.id)[0];
        if (schedule) {
          const ex = api
            .getExceptions()
            .find(
              (e) =>
                e.scheduleId === schedule.id && e.type === 'color_complaint'
            );
          if (ex) {
            api.resolveException(
              ex.id,
              '向客户解释喷绘色彩原理：屏幕显示为RGB光色，喷绘为CMYK油墨，存在天然差异。已提供色彩校准样册供客户参考，并承诺下次订单先打样确认。客户表示理解并接受现有成品。'
            );
          }
        }
        setProblemStep(6);
        break;
      }
      case 6: {
        api.switchUser('user-001');
        message.info('已切换到前台：张小红');
        const schedule = api.getSchedulesByDraftId(problemDraft.id)[0];
        if (schedule) {
          const install = api.getInstallationByScheduleId(schedule.id);
          if (install) {
            workflow.changeInstallTime(
              install.id,
              dayjs().add(3, 'day').format('YYYY-MM-DD'),
              '客户临时出差，要求延后3天安装'
            );
          }
        }
        setProblemStep(7);
        break;
      }
      case 7: {
        api.switchUser('user-002');
        message.info('已切换到处理人员：李明');
        const schedule = api.getSchedulesByDraftId(problemDraft.id)[0];
        if (schedule) {
          const install = api.getInstallationByScheduleId(schedule.id);
          if (install) {
            workflow.transitionInstallation(install.id, 'in_progress');
            workflow.transitionInstallation(install.id, 'completed', {
              customerSigned: true,
              signerName: '刘经理',
              installers: ['李明', '张强'],
              photos: ['/photos/problem-1.jpg'],
            });
          }
          workflow.transitionSchedule(schedule.id, 'installing');
          workflow.transitionSchedule(schedule.id, 'completed');
        }
        setProblemStep(8);
        message.success('问题流完成！尺寸错误→色差投诉→时间变更均已记录并处理');
        break;
      }
      default:
        message.info('问题流已全部完成');
    }
  };

  const smoothSteps = [
    '处理人员登记并确认材料领用',
    '处理人员开始喷绘',
    '处理人员喷绘完成',
    '处理人员开始安装',
    '安装完成 + 客户签字 + 订单完成',
  ];

  const problemSteps = [
    '前台修正尺寸后重提审核',
    '店长审核通过稿件',
    '前台提交喷绘排产（自动创建安装记录）',
    '处理人员确认材料并完成喷绘',
    '客户看样反馈色差，上报色差投诉',
    '店长介入处理并解决异常',
    '客户变更安装时间，前台登记变更',
    '3天后安装完成，客户签字确认',
  ];

  const pickupColumns: ColumnsType<MaterialItem> = [
    { title: '材料类型', dataIndex: 'materialType', key: 'materialType' },
    { title: '规格', dataIndex: 'specification', key: 'specification' },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 80 },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (v) => Number(v).toFixed(2),
    },
    {
      title: '单价',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 100,
      render: (v) => `¥${Number(v).toFixed(2)}`,
    },
    {
      title: '小计',
      key: 'subtotal',
      width: 120,
      render: (_, r) => `¥${(Number(r.quantity) * Number(r.unitPrice)).toFixed(2)}`,
    },
  ];

  const exceptionColumns: ColumnsType<ExceptionRecord> = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (t) => (
        <Tag color="orange">{exceptionTypeDisplayMap[t] || t}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s) => (
        <Tag color={s === 'resolved' ? 'green' : 'gold'}>
          {s === 'resolved' ? '已解决' : '待处理'}
        </Tag>
      ),
    },
    { title: '描述', dataIndex: 'description', key: 'description' },
    {
      title: '处理人',
      dataIndex: 'handledBy',
      key: 'handledBy',
      width: 100,
      render: (id) => (id ? api.getAllUsers().find((u) => u.id === id)?.name : '-'),
    },
    { title: '解决方案', dataIndex: 'resolution', key: 'resolution' },
  ];

  return (
    <div>
      <Title level={2}>真实业务链路演示</Title>
      <Paragraph type="secondary">
        基于同一批真实持久化记录推进状态，所有操作均写入审计日志。
        <Text strong> 前台提交排产时直接落为"已提交"状态，并自动创建对应安装记录。</Text>
        刷新页面后数据仍然保留。
      </Paragraph>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Button icon={<ReloadOutlined />} onClick={resetDemo} danger block>
          重置演示数据（清空 localStorage 并回到初始种子数据）
        </Button>

        <Alert
          type="info"
          showIcon
          message="当前登录：演示过程中会自动切换角色"
          description={
            <>
              <Tag color="geekblue">{roleDisplayMap[api.getCurrentUser().role]}</Tag>
              <Text strong> {api.getCurrentUser().name}</Text>
              <Text type="secondary"> ({api.getCurrentUser().phone})</Text>
            </>
          }
        />

        {/* 顺利流 */}
        <Card
          title={
            <Space>
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
              <span>顺利流：美味餐厅 - 新品推荐灯箱片（PH20260615002）</span>
            </Space>
          }
          style={{
            border: activeDemo === 'smooth' ? '2px solid #1890ff' : undefined,
          }}
          onClick={() => setActiveDemo('smooth')}
        >
          <Paragraph>
            稿件已审核通过，排产已提交为 <Tag color="blue">已提交</Tag>{' '}
            状态，安装记录已自动创建。点击右侧按钮推进下一步：
          </Paragraph>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 300 }}>
              <Steps
                direction="vertical"
                size="small"
                current={smoothStep}
                items={smoothSteps.map((s) => ({ title: s }))}
              />
            </div>

            <div style={{ flex: 1, minWidth: 300 }}>
              {smoothSchedule ? (
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label="排产单号">
                    {smoothSchedule.scheduleNo}
                  </Descriptions.Item>
                  <Descriptions.Item label="状态">
                    <Tag color={statusDisplayMap[smoothSchedule.status]?.color}>
                      {statusDisplayMap[smoothSchedule.status]?.text}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="尺寸">
                    {smoothSchedule.width} × {smoothSchedule.height}{' '}
                    {smoothSchedule.unit}
                  </Descriptions.Item>
                  <Descriptions.Item label="材料">
                    {smoothSchedule.materialType}
                  </Descriptions.Item>
                  <Descriptions.Item label="数量">
                    {smoothSchedule.quantity}份
                  </Descriptions.Item>
                  <Descriptions.Item label="材料领用">
                    {smoothPickups.length > 0 ? (
                      <>
                        <Tag color="green">已登记</Tag> {smoothPickups[0].pickupNo}
                        <br />
                        合计 ¥{smoothPickups[0].totalAmount.toFixed(2)}
                      </>
                    ) : (
                      <Tag>未登记</Tag>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="安装记录">
                    {smoothInstallation ? (
                      <Tag
                        color={
                          statusDisplayMap[smoothInstallation.status]?.color
                        }
                      >
                        {statusDisplayMap[smoothInstallation.status]?.text}
                      </Tag>
                    ) : (
                      '未创建'
                    )}
                  </Descriptions.Item>
                </Descriptions>
              ) : (
                <Empty description="找不到排产记录，请重置数据" />
              )}

              <Button
                type="primary"
                icon={<RightOutlined />}
                onClick={runSmoothStep}
                disabled={smoothStep >= 5}
                style={{ marginTop: 16 }}
                block
              >
                {smoothStep >= 5 ? '已完成' : `推进第 ${smoothStep + 1} 步`}
              </Button>
            </div>
          </div>

          {smoothStep >= 5 && smoothSchedule && (
            <>
              <Divider />
              <Title level={4}>操作留痕（审计日志）</Title>
              <AuditTimeline
                logs={api.getAuditLogsByEntity('schedule', smoothSchedule.id)}
              />
            </>
          )}
        </Card>

        {/* 问题流 */}
        <Card
          title={
            <Space>
              <ExclamationCircleOutlined
                style={{ color: '#faad14', fontSize: 20 }}
              />
              <span>问题流：阳光健身 - 会员招募海报（DD20260615002）</span>
            </Space>
          }
          style={{
            border: activeDemo === 'problem' ? '2px solid #1890ff' : undefined,
          }}
          onClick={() => setActiveDemo('problem')}
        >
          <Paragraph>
            稿件当前状态为 <Tag color="orange">尺寸问题</Tag>{' '}
            ，需依次处理：尺寸纠错 → 排产 → 色差投诉 → 安装时间变更。
          </Paragraph>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 300 }}>
              <Steps
                direction="vertical"
                size="small"
                current={problemStep}
                items={problemSteps.map((s) => ({ title: s }))}
              />
            </div>

            <div style={{ flex: 1, minWidth: 300 }}>
              {problemDraft ? (
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label="稿件单号">
                    {problemDraft.orderNo}
                  </Descriptions.Item>
                  <Descriptions.Item label="状态">
                    <Tag color={statusDisplayMap[problemDraft.status]?.color}>
                      {statusDisplayMap[problemDraft.status]?.text}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="尺寸">
                    {problemDraft.width} × {problemDraft.height}{' '}
                    {problemDraft.unit}
                  </Descriptions.Item>
                  <Descriptions.Item label="材料">
                    {problemDraft.materialType}
                  </Descriptions.Item>
                  <Descriptions.Item label="排产状态">
                    {problemSchedule ? (
                      <Tag
                        color={statusDisplayMap[problemSchedule.status]?.color}
                      >
                        {statusDisplayMap[problemSchedule.status]?.text}
                      </Tag>
                    ) : (
                      <Tag>未排产</Tag>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="异常记录">
                    {problemException.length > 0 ? (
                      problemException.map((e) => (
                        <div key={e.id}>
                          <Tag color="orange">
                            {exceptionTypeDisplayMap[e.type]}
                          </Tag>
                          <Tag
                            color={e.status === 'resolved' ? 'green' : 'gold'}
                          >
                            {e.status === 'resolved' ? '已解决' : '待处理'}
                          </Tag>
                        </div>
                      ))
                    ) : (
                      '无'
                    )}
                  </Descriptions.Item>
                </Descriptions>
              ) : (
                <Empty description="找不到稿件记录，请重置数据" />
              )}

              <Button
                type="primary"
                icon={<RightOutlined />}
                onClick={runProblemStep}
                disabled={problemStep >= 8}
                style={{ marginTop: 16 }}
                block
              >
                {problemStep >= 8 ? '已完成' : `推进第 ${problemStep + 1} 步`}
              </Button>
            </div>
          </div>

          {problemStep >= 8 && problemSchedule && (
            <>
              <Divider />
              <Title level={4}>异常记录处理结果</Title>
              <Table
                columns={exceptionColumns}
                dataSource={api.getExceptionsByScheduleId(problemSchedule.id)}
                rowKey="id"
                pagination={false}
                size="small"
              />
              <Divider />
              <Title level={4}>操作留痕（审计日志）</Title>
              <AuditTimeline
                logs={api.getAuditLogsByEntity('schedule', problemSchedule.id)}
              />
            </>
          )}
        </Card>

        {/* 归档流 */}
        <Card
          title={
            <Space>
              <InboxOutlined style={{ color: '#1890ff', fontSize: 20 }} />
              <span>归档流：蓝天幼儿园 - 六一儿童节活动背景板（PH20260615003）</span>
            </Space>
          }
          style={{
            border: activeDemo === 'archive' ? '2px solid #1890ff' : undefined,
          }}
          onClick={() => setActiveDemo('archive')}
        >
          <Paragraph>
            已完成订单的完整资料回看，展示系统的可追溯性。所有信息均可追溯到操作人与操作时间。
          </Paragraph>

          {archiveSchedule ? (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Descriptions column={2} size="small" bordered title="📄 订单基本信息">
                <Descriptions.Item label="排产单号">
                  {archiveSchedule.scheduleNo}
                </Descriptions.Item>
                <Descriptions.Item label="订单编号">
                  {archiveSchedule.orderNo}
                </Descriptions.Item>
                <Descriptions.Item label="客户名称">
                  {archiveSchedule.customerName}
                </Descriptions.Item>
                <Descriptions.Item label="内容">
                  {archiveSchedule.content}
                </Descriptions.Item>
                <Descriptions.Item label="尺寸">
                  {archiveSchedule.width} × {archiveSchedule.height}{' '}
                  {archiveSchedule.unit}
                </Descriptions.Item>
                <Descriptions.Item label="材料">
                  {archiveSchedule.materialType}
                </Descriptions.Item>
                <Descriptions.Item label="颜色要求">
                  {archiveSchedule.colorRequirement}
                </Descriptions.Item>
                <Descriptions.Item label="安装地址">
                  {archiveSchedule.installationAddress}
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag
                    color={statusDisplayMap[archiveSchedule.status]?.color}
                  >
                    {statusDisplayMap[archiveSchedule.status]?.text}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="完成时间">
                  {archiveSchedule.completedAt
                    ? dayjs(archiveSchedule.completedAt).format(
                        'YYYY-MM-DD HH:mm'
                      )
                    : '-'}
                </Descriptions.Item>
              </Descriptions>

              {archivePickups.length > 0 && (
                <Card
                  size="small"
                  title="📦 材料领用回看"
                  extra={
                    <Space>
                      <Tag color="green">
                        {archivePickups[0].pickupNo}
                      </Tag>
                      <Text strong>
                        合计 ¥{archivePickups[0].totalAmount.toFixed(2)}
                      </Text>
                    </Space>
                  }
                >
                  <Table
                    columns={pickupColumns}
                    dataSource={archivePickups[0].items}
                    rowKey="id"
                    pagination={false}
                    size="small"
                  />
                  <Descriptions
                    column={2}
                    size="small"
                    style={{ marginTop: 8 }}
                  >
                    <Descriptions.Item label="登记人">
                      <UserOutlined />{' '}
                      {api
                        .getAllUsers()
                        .find(
                          (u) => u.id === archivePickups[0].pickedBy
                        )?.name || archivePickups[0].pickedBy}
                    </Descriptions.Item>
                    <Descriptions.Item label="确认人">
                      <UserOutlined />{' '}
                      {archivePickups[0].confirmedBy
                        ? api
                            .getAllUsers()
                            .find(
                              (u) => u.id === archivePickups[0].confirmedBy
                            )?.name
                        : '-'}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              )}

              {archiveInstallation && (
                <Card size="small" title="📷 安装记录回看">
                  <Descriptions column={2} size="small" bordered>
                    <Descriptions.Item label="计划日期">
                      {archiveInstallation.scheduledDate}
                    </Descriptions.Item>
                    <Descriptions.Item label="实际日期">
                      {archiveInstallation.actualDate || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="安装人员">
                      {archiveInstallation.installers.join('、') || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="状态">
                      <Tag
                        color={
                          statusDisplayMap[archiveInstallation.status]?.color
                        }
                      >
                        {statusDisplayMap[archiveInstallation.status]?.text}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="客户签字">
                      {archiveInstallation.customerSigned ? (
                        <Tag color="green">
                          已签字（{archiveInstallation.signerName}）
                        </Tag>
                      ) : (
                        <Tag>未签字</Tag>
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="照片数量">
                      {archiveInstallation.photos.length} 张
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              )}

              {archiveExceptions.length > 0 && (
                <Card size="small" title="⚠️ 异常记录回看">
                  <Table
                    columns={exceptionColumns}
                    dataSource={archiveExceptions}
                    rowKey="id"
                    pagination={false}
                    size="small"
                  />
                </Card>
              )}

              <Card size="small" title="📝 操作留痕（审计日志）">
                <AuditTimeline logs={archiveLogs} />
              </Card>

              <Alert
                type="success"
                showIcon
                message="订单归档完成"
                description="以上所有资料均已持久化存储，包括客户稿件、喷绘排产全流程、材料领用明细、安装照片与签字、异常处理过程、所有人员操作留痕，可随时追溯。"
              />
            </Space>
          ) : (
            <Empty description="找不到归档订单记录" />
          )}
        </Card>
      </Space>
    </div>
  );
}
