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
import type { MaterialItem, ExceptionRecord } from '@/types';

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

    switch (smoothStep) {
      case 0: {
        if (api.getCurrentUser().id !== 'user-002') {
          api.switchUser('user-002');
          message.info('已切换到处理人员：李明');
        }
        const items = [
          {
            materialType: '灯箱片',
            specification: '1.52m宽',
            unit: '平方米',
            quantity: 3.24,
            unitPrice: 52,
          },
        ];
        workflow.createMaterialPickupForSchedule(smoothSchedule.id, items);
        message.info('✅ 步骤完成：登记材料领用（状态：待确认）');
        setSmoothStep(1);
        break;
      }
      case 1: {
        const pickup = api.getMaterialPickupsByScheduleId(smoothSchedule.id)[0];
        if (!pickup) {
          message.warning('请先完成上一步：登记材料领用');
          return;
        }
        const ok = workflow.transitionMaterialPickup(pickup.id, 'confirmed');
        if (ok) message.info('✅ 步骤完成：确认材料领用（状态：已确认）');
        setSmoothStep(2);
        break;
      }
      case 2: {
        const ok = workflow.transitionSchedule(smoothSchedule.id, 'material_confirmed');
        if (ok) message.info('✅ 步骤完成：排产推进到「材料已确认」');
        setSmoothStep(3);
        break;
      }
      case 3: {
        const ok = workflow.transitionSchedule(smoothSchedule.id, 'printing');
        if (ok) message.info('✅ 步骤完成：开始喷绘');
        setSmoothStep(4);
        break;
      }
      case 4: {
        const ok = workflow.transitionSchedule(smoothSchedule.id, 'printed');
        if (ok) message.info('✅ 步骤完成：喷绘完成');
        setSmoothStep(5);
        break;
      }
      case 5: {
        workflow.transitionSchedule(smoothSchedule.id, 'installing');
        const install = api.getInstallationByScheduleId(smoothSchedule.id);
        if (install) workflow.transitionInstallation(install.id, 'in_progress');
        message.info('✅ 步骤完成：开始安装');
        setSmoothStep(6);
        break;
      }
      case 6: {
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
        setSmoothStep(7);
        message.success('🎉 顺利流全部完成！所有状态已推进，审计日志已留痕');
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

    switch (problemStep) {
      case 0: {
        if (api.getCurrentUser().id !== 'user-001') {
          api.switchUser('user-001');
          message.info('已切换到前台：张小红');
        }
        workflow.transitionDraft(
          problemDraft.id,
          'pending_review',
          '客户确认正确尺寸应为120×180cm'
        );
        message.info('✅ 步骤完成：前台修正尺寸后重新提交审核');
        setProblemStep(1);
        break;
      }
      case 1: {
        api.switchUser('user-003');
        message.info('已切换到店长：王店长');
        workflow.transitionDraft(problemDraft.id, 'approved');
        message.info('✅ 步骤完成：店长审核通过稿件');
        setProblemStep(2);
        break;
      }
      case 2: {
        api.switchUser('user-001');
        message.info('已切换到前台：张小红');
        workflow.submitScheduleFromDraft(problemDraft.id, 10, 'normal');
        message.info('✅ 步骤完成：前台提交喷绘排产（已自动创建安装记录）');
        setProblemStep(3);
        break;
      }
      case 3: {
        api.switchUser('user-002');
        message.info('已切换到处理人员：李明');
        const schedule = api.getSchedulesByDraftId(problemDraft.id)[0];
        if (!schedule) {
          message.warning('请先完成上一步：提交喷绘排产');
          return;
        }
        const items = [
          {
            materialType: '相纸',
            specification: '1.27m宽',
            unit: '平方米',
            quantity: 21.6,
            unitPrice: 38,
          },
        ];
        workflow.createMaterialPickupForSchedule(schedule.id, items);
        message.info('✅ 步骤完成：登记材料领用（待确认）');
        setProblemStep(4);
        break;
      }
      case 4: {
        const schedule = api.getSchedulesByDraftId(problemDraft.id)[0];
        if (!schedule) return;
        const pickup = api.getMaterialPickupsByScheduleId(schedule.id)[0];
        if (!pickup) return;
        workflow.transitionMaterialPickup(pickup.id, 'confirmed');
        workflow.transitionSchedule(schedule.id, 'material_confirmed');
        workflow.transitionSchedule(schedule.id, 'printing');
        workflow.transitionSchedule(schedule.id, 'printed');
        message.info('✅ 步骤完成：确认材料 → 开始喷绘 → 喷绘完成');
        setProblemStep(5);
        break;
      }
      case 5: {
        const schedule = api.getSchedulesByDraftId(problemDraft.id)[0];
        if (schedule) {
          workflow.reportColorComplaint(
            schedule.id,
            '客户反馈喷绘成品颜色比设计稿偏暗，蓝色部分不够鲜艳'
          );
        }
        message.info('✅ 步骤完成：上报色差投诉（已创建异常记录 + 审计日志）');
        setProblemStep(6);
        break;
      }
      case 6: {
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
            message.info('✅ 步骤完成：店长介入处理并解决色差异常（已写入审计日志）');
          }
        }
        setProblemStep(7);
        break;
      }
      case 7: {
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
        message.info('✅ 步骤完成：登记安装时间变更（已创建异常记录 + 审计日志）');
        setProblemStep(8);
        break;
      }
      case 8: {
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
        setProblemStep(9);
        message.success(
          '🎉 问题流全部完成！尺寸错误 → 色差投诉 → 安装时间变更 三条异常均完整记录并处理'
        );
        break;
      }
      default:
        message.info('问题流已全部完成');
    }
  };

  const smoothSteps = [
    '处理人员登记材料领用',
    '处理人员确认材料领用',
    '推进排产到「材料已确认」',
    '处理人员开始喷绘',
    '处理人员喷绘完成',
    '处理人员开始安装',
    '安装完成 + 客户签字 + 订单完成',
  ];

  const problemSteps = [
    '前台修正尺寸后重新提交审核',
    '店长审核通过稿件',
    '前台提交喷绘排产（自动创建安装记录）',
    '处理人员登记材料领用',
    '确认材料 → 喷绘中 → 喷绘完成',
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
      title: '上报人',
      dataIndex: 'reportedBy',
      key: 'reportedBy',
      width: 100,
      render: (id) => api.getAllUsers().find((u) => u.id === id)?.name || id,
    },
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
        <Space wrap>
          <Tag color="blue">留痕校验</Tag>
          <Text>所有操作者按当前登录用户写入（不接受调用参数）</Text>
          <Tag color="orange">状态断点</Tag>
          <Text>材料登记≠确认，只有「已确认」后才能推进排产到材料已确认</Text>
          <Tag color="green">异常审计</Tag>
          <Text>创建和处理异常均写入审计日志，在留痕时间线中可串联回看</Text>
        </Space>
      </Paragraph>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Button icon={<ReloadOutlined />} onClick={resetDemo} danger block>
          重置演示数据（清空 localStorage 并回到初始种子数据）
        </Button>

        <Alert
          type="info"
          showIcon
          message="当前登录：演示过程中会自动切换角色，所有留痕以当前用户为准"
          description={
            <>
              <Tag color="geekblue">{roleDisplayMap[api.getCurrentUser().role]}</Tag>
              <Text strong> {api.getCurrentUser().name}</Text>
              <Text type="secondary"> ID: {api.getCurrentUser().id}</Text>
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
                  <Descriptions.Item label="提交人">
                    <UserOutlined />{' '}
                    {api.getAllUsers().find((u) => u.id === smoothSchedule.submittedBy)
                      ?.name || smoothSchedule.submittedBy}
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
                        <div>
                          登记人：
                          {api
                            .getAllUsers()
                            .find((u) => u.id === smoothPickups[0].pickedBy)?.name ||
                            '-'}
                        </div>
                        <div>
                          确认人：
                          {smoothPickups[0].confirmedBy
                            ? api.getAllUsers().find(
                                (u) => u.id === smoothPickups[0].confirmedBy
                              )?.name
                            : '-'}
                        </div>
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
                disabled={smoothStep >= 7}
                style={{ marginTop: 16 }}
                block
              >
                {smoothStep >= 7 ? '已完成' : `推进第 ${smoothStep + 1} 步`}
              </Button>
            </div>
          </div>

          {smoothStep >= 7 && smoothSchedule && (
            <>
              <Divider />
              <Title level={4}>操作留痕（已串入异常的上报/处理记录）</Title>
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
                  <Descriptions.Item label="稿件状态">
                    <Tag color={statusDisplayMap[problemDraft.status]?.color}>
                      {statusDisplayMap[problemDraft.status]?.text}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="尺寸">
                    {problemDraft.width} × {problemDraft.height}{' '}
                    {problemDraft.unit}
                  </Descriptions.Item>
                  <Descriptions.Item label="排产状态">
                    {problemSchedule ? (
                      <>
                        <Tag
                          color={statusDisplayMap[problemSchedule.status]?.color}
                        >
                          {statusDisplayMap[problemSchedule.status]?.text}
                        </Tag>
                        <div>
                          提交人：
                          {api
                            .getAllUsers()
                            .find((u) => u.id === problemSchedule.submittedBy)
                            ?.name || '-'}
                        </div>
                      </>
                    ) : (
                      <Tag>未排产</Tag>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="异常记录">
                    {problemSchedule &&
                    api.getExceptionsByScheduleId(problemSchedule.id).length >
                      0 ? (
                      api
                        .getExceptionsByScheduleId(problemSchedule.id)
                        .map((e) => (
                          <div key={e.id}>
                            <Tag color="orange">
                              {exceptionTypeDisplayMap[e.type]}
                            </Tag>
                            <Tag
                              color={e.status === 'resolved' ? 'green' : 'gold'}
                            >
                              {e.status === 'resolved' ? '已解决' : '待处理'}
                            </Tag>
                            <div style={{ fontSize: 12, color: '#999' }}>
                              上报：
                              {api.getAllUsers().find((u) => u.id === e.reportedBy)
                                ?.name || '-'}
                              {e.handledBy
                                ? ` / 处理：${
                                    api.getAllUsers().find(
                                      (u) => u.id === e.handledBy
                                    )?.name
                                  }`
                                : ''}
                            </div>
                          </div>
                        ))
                    ) : (
                      '暂无'
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
                disabled={problemStep >= 9}
                style={{ marginTop: 16 }}
                block
              >
                {problemStep >= 9 ? '已完成' : `推进第 ${problemStep + 1} 步`}
              </Button>
            </div>
          </div>

          {problemStep >= 9 && problemSchedule && (
            <>
              <Divider />
              <Title level={4}>异常记录处理结果（含上报人/处理人留痕）</Title>
              <Table
                columns={exceptionColumns}
                dataSource={api.getExceptionsByScheduleId(problemSchedule.id)}
                rowKey="id"
                pagination={false}
                size="small"
              />
              <Divider />
              <Title level={4}>
                操作留痕（异常上报/处理已自动串联进排产审计时间线）
              </Title>
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
              <span>
                归档流回看：蓝天幼儿园 - 六一儿童节活动背景板（PH20260615003）
              </span>
            </Space>
          }
          style={{
            border: activeDemo === 'archive' ? '2px solid #1890ff' : undefined,
          }}
          onClick={() => setActiveDemo('archive')}
        >
          {archiveSchedule ? (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Descriptions
                column={2}
                size="small"
                bordered
                title="📄 订单基本信息（含提交/材料确认/完成操作者）"
              >
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
                <Descriptions.Item label="提交人/时间">
                  <UserOutlined />{' '}
                  {api
                    .getAllUsers()
                    .find((u) => u.id === archiveSchedule.submittedBy)?.name ||
                    '-'}{' '}
                  <Text type="secondary">
                    {archiveSchedule.submittedAt
                      ? dayjs(archiveSchedule.submittedAt).format(
                          'MM-DD HH:mm'
                        )
                      : ''}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="材料确认人/时间">
                  <UserOutlined />{' '}
                  {archiveSchedule.materialConfirmedBy
                    ? api.getAllUsers().find(
                        (u) => u.id === archiveSchedule.materialConfirmedBy
                      )?.name
                    : '-'}{' '}
                  <Text type="secondary">
                    {archiveSchedule.materialConfirmedAt
                      ? dayjs(archiveSchedule.materialConfirmedAt).format(
                          'MM-DD HH:mm'
                        )
                      : ''}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="喷绘完成人/时间">
                  <UserOutlined />{' '}
                  {archiveSchedule.printedBy
                    ? api.getAllUsers().find(
                        (u) => u.id === archiveSchedule.printedBy
                      )?.name
                    : '-'}{' '}
                  <Text type="secondary">
                    {archiveSchedule.printedAt
                      ? dayjs(archiveSchedule.printedAt).format('MM-DD HH:mm')
                      : ''}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="完成人/时间">
                  <UserOutlined />{' '}
                  {archiveSchedule.completedBy
                    ? api.getAllUsers().find(
                        (u) => u.id === archiveSchedule.completedBy
                      )?.name
                    : '-'}{' '}
                  <Text type="secondary">
                    {archiveSchedule.completedAt
                      ? dayjs(archiveSchedule.completedAt).format('MM-DD HH:mm')
                      : ''}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag
                    color={statusDisplayMap[archiveSchedule.status]?.color}
                  >
                    {statusDisplayMap[archiveSchedule.status]?.text}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="安装地址">
                  {archiveSchedule.installationAddress}
                </Descriptions.Item>
              </Descriptions>

              {archivePickups.length > 0 && (
                <Card
                  size="small"
                  title="📦 材料领用回看（登记人/确认人均留痕）"
                  extra={
                    <Space>
                      <Tag color="green">{archivePickups[0].pickupNo}</Tag>
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
                    <Descriptions.Item label="登记人/时间">
                      <UserOutlined />{' '}
                      {api
                        .getAllUsers()
                        .find((u) => u.id === archivePickups[0].pickedBy)
                        ?.name || archivePickups[0].pickedBy}
                      <Text type="secondary">
                        {' '}
                        (
                        {dayjs(archivePickups[0].pickedAt).format(
                          'MM-DD HH:mm'
                        )}
                        )
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="确认人/时间">
                      <UserOutlined />{' '}
                      {archivePickups[0].confirmedBy
                        ? api.getAllUsers().find(
                            (u) => u.id === archivePickups[0].confirmedBy
                          )?.name
                        : '-'}
                      {archivePickups[0].confirmedAt && (
                        <Text type="secondary">
                          {' '}
                          (
                          {dayjs(archivePickups[0].confirmedAt).format(
                            'MM-DD HH:mm'
                          )}
                          )
                        </Text>
                      )}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              )}

              {archiveInstallation && (
                <Card size="small" title="📷 安装记录回看">
                  <Descriptions column={2} size="small" bordered>
                    <Descriptions.Item label="计划/实际日期">
                      {archiveInstallation.scheduledDate} /{' '}
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
                  </Descriptions>
                </Card>
              )}

              {archiveExceptions.length > 0 && (
                <Card
                  size="small"
                  title="⚠️ 异常记录回看（上报与处理均自动写入审计日志）"
                >
                  <Table
                    columns={exceptionColumns}
                    dataSource={archiveExceptions}
                    rowKey="id"
                    pagination={false}
                    size="small"
                  />
                </Card>
              )}

              <Card
                size="small"
                title="📝 操作留痕（异常记录的创建/处理已串联进时间线）"
              >
                <AuditTimeline logs={archiveLogs} />
              </Card>

              <Alert
                type="success"
                showIcon
                message="订单归档完成（所有记录持久化，刷新页面不丢失）"
                description="以上所有资料均已持久化存储，包括客户稿件、喷绘排产全流程各节点操作人、材料领用明细、安装照片与签字、异常处理过程、所有人员操作留痕，可随时追溯。"
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
