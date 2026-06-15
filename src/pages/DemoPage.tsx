import { Card, Steps, Button, Space, Typography, Tag, Divider, message, Modal, Alert } from 'antd';
import {
  CheckCircleOutlined,
  PlayCircleOutlined,
  ExclamationCircleOutlined,
  InboxOutlined,
  ReloadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import { useApi } from '@/services/api';
import { useWorkflow } from '@/hooks/useWorkflow';
import { roleDisplayMap, statusDisplayMap } from '@/utils/stateMachine';
import AuditTimeline from '@/components/AuditTimeline';
import dayjs from 'dayjs';

const { Title, Paragraph, Text } = Typography;

type DemoType = 'smooth' | 'problem' | 'archive';

export default function DemoPage() {
  const api = useApi();
  const workflow = useWorkflow();
  const [activeDemo, setActiveDemo] = useState<DemoType | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [demoLogs, setDemoLogs] = useState<Array<{ time: string; message: string; type: 'info' | 'success' | 'warning' | 'error' }>>([]);

  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setDemoLogs((prev) => [
      ...prev,
      { time: dayjs().format('HH:mm:ss'), message, type },
    ]);
  };

  const resetDemo = () => {
    api.resetDemoData();
    setCurrentStep(0);
    setIsRunning(false);
    setDemoLogs([]);
    setActiveDemo(null);
  };

  const startDemo = (type: DemoType) => {
    resetDemo();
    setActiveDemo(type);
    setIsRunning(true);
    addLog(`开始演示: ${type === 'smooth' ? '顺利流程' : type === 'problem' ? '问题流程' : '最终归档'}`, 'info');
  };

  const autoRunSmoothFlow = async () => {
    setIsRunning(true);
    const steps = [
      async () => {
        api.switchUser('user-001');
        addLog('切换用户: 张小红 (前台)', 'info');
        const draft = api.getDrafts().find((d) => d.id === 'draft-001');
        if (draft) {
          addLog(`选择稿件: ${draft.orderNo} - ${draft.customerName} - ${draft.content}`, 'info');
          addLog(`稿件状态: ${statusDisplayMap[draft.status].text}`, 'success');
        }
      },
      async () => {
        const draft = api.getDrafts().find((d) => d.id === 'draft-001');
        if (draft && draft.status === 'approved') {
          addLog('前台张小红提交喷绘排产，数量: 5份，优先级: 加急', 'info');
          workflow.submitScheduleFromDraft('draft-001', 5, 'urgent');
          const schedule = api.getSchedulesByDraftId('draft-001')[0];
          addLog(`排产已创建: ${schedule.scheduleNo}，状态: ${statusDisplayMap[schedule.status].text}`, 'success');
        }
      },
      async () => {
        api.switchUser('user-002');
        addLog('切换用户: 李明 (处理人员)', 'info');
        const schedule = api.getSchedulesByDraftId('draft-001')[0];
        addLog(`处理人员李明开始处理排产: ${schedule.scheduleNo}`, 'info');
      },
      async () => {
        const schedule = api.getSchedulesByDraftId('draft-001')[0];
        addLog('登记材料领用: 户外背胶 10.8㎡ + 光膜 10.8㎡，合计 ¥572.40', 'info');
        workflow.createMaterialPickupForSchedule(schedule.id, [
          { materialType: '户外背胶', specification: '1.52m宽', unit: '平方米', quantity: 10.8, unitPrice: 45 },
          { materialType: '过膜', specification: '光膜', unit: '平方米', quantity: 10.8, unitPrice: 8 },
        ]);
        const pickup = api.getMaterialPickupsByScheduleId(schedule.id)[0];
        addLog(`材料领用已登记: ${pickup.pickupNo}，状态: ${statusDisplayMap[pickup.status].text}`, 'success');
      },
      async () => {
        const schedule = api.getSchedulesByDraftId('draft-001')[0];
        const pickup = api.getMaterialPickupsByScheduleId(schedule.id)[0];
        addLog('处理人员李明确认材料领用', 'info');
        workflow.transitionMaterialPickup(pickup.id, 'confirmed');
        addLog(`材料领用状态: ${statusDisplayMap.confirmed.text}`, 'success');
      },
      async () => {
        const schedule = api.getSchedulesByDraftId('draft-001')[0];
        addLog('处理人员李明确认排产材料已确认，准备开始喷绘', 'info');
        workflow.transitionSchedule(schedule.id, 'material_confirmed');
        addLog(`排产状态: ${statusDisplayMap.material_confirmed.text}`, 'success');
      },
      async () => {
        const schedule = api.getSchedulesByDraftId('draft-001')[0];
        addLog('开始喷绘: 120×180cm 户外背胶海报 5张', 'info');
        workflow.transitionSchedule(schedule.id, 'printing');
        addLog(`排产状态: ${statusDisplayMap.printing.text}`, 'success');
      },
      async () => {
        const schedule = api.getSchedulesByDraftId('draft-001')[0];
        addLog('喷绘完成，进行质量检查，颜色和尺寸均符合要求', 'info');
        workflow.transitionSchedule(schedule.id, 'printed');
        addLog(`排产状态: ${statusDisplayMap.printed.text}`, 'success');
      },
      async () => {
        const schedule = api.getSchedulesByDraftId('draft-001')[0];
        addLog('开始安装，安装人员: 李明、张强', 'info');
        workflow.transitionSchedule(schedule.id, 'installing');
        addLog(`排产状态: ${statusDisplayMap.installing.text}`, 'success');
      },
      async () => {
        const schedule = api.getSchedulesByDraftId('draft-001')[0];
        const installation = api.getInstallationByScheduleId(schedule.id);
        if (installation) {
          addLog('安装完成，拍摄安装照片2张，客户签字确认', 'info');
          workflow.transitionInstallation(installation.id, 'completed', {
            actualDate: dayjs().format('YYYY-MM-DD'),
            installers: ['李明', '张强'],
            photos: ['/photos/demo-1.jpg', '/photos/demo-2.jpg'],
            customerSigned: true,
            signerName: '王经理',
            signDate: dayjs().format('YYYY-MM-DD'),
          });
          addLog('安装记录状态: 已完成', 'success');
        }
      },
      async () => {
        const schedule = api.getSchedulesByDraftId('draft-001')[0];
        addLog('订单完成，客户非常满意', 'info');
        workflow.transitionSchedule(schedule.id, 'completed');
        addLog(`排产状态: ${statusDisplayMap.completed.text}`, 'success');
      },
      async () => {
        addLog('顺利流程演示完成！所有操作均已记录审计日志', 'success');
        setIsRunning(false);
      },
    ];

    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i);
      await steps[i]();
      if (i < steps.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
    }
  };

  const autoRunProblemFlow = async () => {
    setIsRunning(true);
    const steps = [
      async () => {
        api.switchUser('user-001');
        addLog('切换用户: 张小红 (前台)', 'info');
        addLog('创建新稿件: 阳光健身 - 会员招募海报', 'info');
        addLog('录入尺寸: 100×150cm，材料: 相纸，颜色要求: 高清', 'info');
      },
      async () => {
        api.switchUser('user-002');
        addLog('切换用户: 李明 (处理人员)', 'info');
        addLog('处理人员李明核稿，发现设计图标注尺寸为120×180cm，与订单录入的100×150cm不符', 'warning');
      },
      async () => {
        const draft = api.getDrafts().find((d) => d.id === 'draft-002');
        if (draft) {
          addLog('标记尺寸问题，通知前台与客户确认', 'warning');
          workflow.reportSizeIssue(
            draft.id,
            '设计图标注尺寸为120×180cm，但订单录入为100×150cm，请与客户确认正确尺寸'
          );
          addLog(`稿件状态: ${statusDisplayMap.size_issue.text}`, 'warning');
          addLog('异常记录已创建: 尺寸错误', 'warning');
        }
      },
      async () => {
        api.switchUser('user-001');
        addLog('切换用户: 张小红 (前台)', 'info');
        addLog('前台联系客户确认，客户确认正确尺寸应为120×180cm', 'info');
      },
      async () => {
        const draft = api.getDrafts().find((d) => d.id === 'draft-002');
        if (draft) {
          addLog('更新尺寸为120×180cm，重新提交审核', 'info');
          workflow.transitionDraft(draft.id, 'pending_review', '客户确认正确尺寸为120×180cm');
          addLog(`稿件状态: ${statusDisplayMap.pending_review.text}`, 'info');
        }
      },
      async () => {
        api.switchUser('user-003');
        addLog('切换用户: 王店长 (店长)', 'info');
        const draft = api.getDrafts().find((d) => d.id === 'draft-002');
        if (draft) {
          addLog('店长审核通过稿件', 'info');
          workflow.transitionDraft(draft.id, 'approved');
          addLog(`稿件状态: ${statusDisplayMap.approved.text}`, 'success');
        }
      },
      async () => {
        api.switchUser('user-001');
        addLog('切换用户: 张小红 (前台)', 'info');
        const draft = api.getDrafts().find((d) => d.id === 'draft-002');
        if (draft) {
          addLog('前台提交喷绘排产', 'info');
          workflow.submitScheduleFromDraft(draft.id, 10, 'normal');
          const schedule = api.getSchedulesByDraftId(draft.id)[0];
          addLog(`排产已创建: ${schedule.scheduleNo}`, 'success');
        }
      },
      async () => {
        api.switchUser('user-002');
        addLog('切换用户: 李明 (处理人员)', 'info');
        const draft = api.getDrafts().find((d) => d.id === 'draft-002');
        const schedule = api.getSchedulesByDraftId(draft!.id)[0];
        addLog('登记并确认材料领用，开始喷绘', 'info');
        workflow.createMaterialPickupForSchedule(schedule.id, [
          { materialType: '相纸', specification: '1.27m宽', unit: '平方米', quantity: 21.6, unitPrice: 38 },
        ]);
        const pickup = api.getMaterialPickupsByScheduleId(schedule.id)[0];
        workflow.transitionMaterialPickup(pickup.id, 'confirmed');
        workflow.transitionSchedule(schedule.id, 'material_confirmed');
        workflow.transitionSchedule(schedule.id, 'printing');
        addLog('喷绘完成，客户来现场看样，反馈颜色偏暗，与设计稿有色差', 'warning');
      },
      async () => {
        const draft = api.getDrafts().find((d) => d.id === 'draft-002');
        const schedule = api.getSchedulesByDraftId(draft!.id)[0];
        addLog('上报色差投诉', 'warning');
        workflow.reportColorComplaint(
          schedule.id,
          '客户反馈喷绘成品颜色比设计稿偏暗，蓝色部分不够鲜艳'
        );
        addLog('异常记录已创建: 色差投诉', 'warning');
      },
      async () => {
        api.switchUser('user-003');
        addLog('切换用户: 王店长 (店长)', 'info');
        addLog('店长介入处理，向客户解释喷绘CMYK与屏幕RGB的色彩差异', 'info');
        addLog('提供色彩校准样册给客户参考，承诺下次打印前先打样确认', 'info');
        const draft = api.getDrafts().find((d) => d.id === 'draft-002');
        const scheduleForException = draft ? api.getSchedulesByDraftId(draft.id)[0] : null;
        const exception = scheduleForException
          ? api.getExceptions().find((e) => e.type === 'color_complaint' && e.scheduleId === scheduleForException.id)
          : null;
        if (exception) {
          api.resolveException(
            exception.id,
            '向客户解释喷绘色彩原理：屏幕显示为RGB光色，喷绘为CMYK油墨，存在天然差异。已提供色彩校准样册供客户参考，并承诺下次订单先打样确认。客户表示理解并接受现有成品。'
          );
          addLog('异常已解决，客户表示理解', 'success');
        }
      },
      async () => {
        const draft = api.getDrafts().find((d) => d.id === 'draft-002');
        const schedule = api.getSchedulesByDraftId(draft!.id)[0];
        const installation = api.getInstallationByScheduleId(schedule.id);
        if (installation) {
          addLog('客户临时有事，需要变更安装时间', 'warning');
          api.switchUser('user-001');
          workflow.changeInstallTime(
            installation.id,
            dayjs().add(3, 'day').format('YYYY-MM-DD'),
            '客户临时出差，要求延后3天安装'
          );
          addLog(`安装时间已变更，异常记录已创建`, 'warning');
        }
      },
      async () => {
        addLog('3天后，安装顺利完成，客户签字确认', 'success');
        const draft = api.getDrafts().find((d) => d.id === 'draft-002');
        const schedule = api.getSchedulesByDraftId(draft!.id)[0];
        const installation = api.getInstallationByScheduleId(schedule.id);
        if (installation) {
          workflow.transitionInstallation(installation.id, 'in_progress');
          workflow.transitionInstallation(installation.id, 'completed', {
            customerSigned: true,
            signerName: '刘经理',
          });
          workflow.transitionSchedule(schedule.id, 'printed');
          workflow.transitionSchedule(schedule.id, 'installing');
          workflow.transitionSchedule(schedule.id, 'completed');
        }
        addLog('问题流程演示完成！虽然遇到了尺寸错误、色差投诉和安装时间变更，但都得到了妥善处理', 'success');
        setIsRunning(false);
      },
    ];

    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i);
      await steps[i]();
      if (i < steps.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }
  };

  const autoRunArchiveFlow = async () => {
    setIsRunning(true);
    const steps = [
      async () => {
        addLog('查看已完成订单: 蓝天幼儿园 六一儿童节活动背景板', 'info');
        const schedule = api.getScheduleById('schedule-003');
        if (schedule) {
          addLog(`订单号: ${schedule.orderNo}`, 'info');
          addLog(`排产号: ${schedule.scheduleNo}`, 'info');
          addLog(`状态: ${statusDisplayMap[schedule.status].text}`, 'success');
          addLog(`尺寸: ${schedule.width}×${schedule.height}cm`, 'info');
          addLog(`材料: ${schedule.materialType}`, 'info');
          addLog(`完成时间: ${dayjs(schedule.completedAt!).format('YYYY-MM-DD HH:mm')}`, 'info');
        }
      },
      async () => {
        addLog('材料领用回看:', 'info');
        const pickups = api.getMaterialPickupsByScheduleId('schedule-003');
        pickups.forEach((p) => {
          addLog(`  领用单: ${p.pickupNo}，金额: ¥${p.totalAmount}，状态: ${statusDisplayMap[p.status].text}`, 'info');
          p.items.forEach((item) => {
            addLog(`    - ${item.materialType} ${item.specification} × ${item.quantity}${item.unit} = ¥${(item.quantity * item.unitPrice).toFixed(2)}`, 'info');
          });
        });
      },
      async () => {
        addLog('安装记录回看:', 'info');
        const install = api.getInstallationByScheduleId('schedule-003');
        if (install) {
          addLog(`  计划日期: ${install.scheduledDate}`, 'info');
          addLog(`  实际日期: ${install.actualDate}`, 'info');
          addLog(`  安装人员: ${install.installers.join('、')}`, 'info');
          addLog(`  客户签字: ${install.customerSigned ? `已签字 (${install.signerName})` : '未签字'}`, 'success');
          addLog(`  照片数量: ${install.photos.length}张`, 'info');
        }
      },
      async () => {
        addLog('异常记录回看:', 'info');
        const exceptions = api.getExceptionsByScheduleId('schedule-003');
        exceptions.forEach((e) => {
          addLog(`  类型: ${e.type === 'color_complaint' ? '色差投诉' : e.type}`, 'warning');
          addLog(`  状态: ${e.status === 'resolved' ? '已解决' : e.status}`, e.status === 'resolved' ? 'success' : 'warning');
          if (e.resolution) {
            addLog(`  解决方案: ${e.resolution}`, 'success');
          }
        });
      },
      async () => {
        addLog('操作留痕回看 (审计日志):', 'info');
        const logs = api.getAuditLogsByEntity('schedule', 'schedule-003');
        logs.forEach((log, idx) => {
          if (idx < 5) {
            addLog(`  ${dayjs(log.timestamp).format('HH:mm:ss')} - ${log.operatorName}(${roleDisplayMap[log.operatorRole]}) - ${log.detail}`, 'info');
          }
        });
        if (logs.length > 5) {
          addLog(`  ...还有${logs.length - 5}条操作记录`, 'info');
        }
      },
      async () => {
        const schedule = api.getScheduleById('schedule-003');
        if (schedule) {
          api.createAuditLog(
            'schedule',
            schedule.id,
            'archive',
            `订单 ${schedule.scheduleNo} 已完成归档，所有资料齐备，可追溯`,
            { status: schedule.status },
            { archived: true, archiveTime: dayjs().toISOString() }
          );
        }
        addLog('订单已完成归档！所有信息完整保留，包括：', 'success');
        addLog('  ✓ 客户稿件及审核记录', 'success');
        addLog('  ✓ 喷绘排产全流程状态', 'success');
        addLog('  ✓ 材料领用明细及金额', 'success');
        addLog('  ✓ 安装照片及客户签字', 'success');
        addLog('  ✓ 异常处理全过程', 'success');
        addLog('  ✓ 所有人员操作留痕', 'success');
        setIsRunning(false);
      },
    ];

    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i);
      await steps[i]();
      if (i < steps.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1800));
      }
    }
  };

  const runDemo = () => {
    if (!activeDemo) return;
    if (activeDemo === 'smooth') {
      autoRunSmoothFlow();
    } else if (activeDemo === 'problem') {
      autoRunProblemFlow();
    } else {
      autoRunArchiveFlow();
    }
  };

  const demoDescriptions = {
    smooth: {
      title: '顺利流程',
      icon: <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 32 }} />,
      description: '正常的订单处理流程：前台创建稿件 → 店长审核 → 前台提交排产 → 处理人员确认材料 → 喷绘 → 安装 → 完成。所有环节无异常。',
      steps: [
        '前台创建并提交稿件',
        '店长审核通过',
        '前台提交喷绘排产',
        '处理人员登记并确认材料领用',
        '处理人员开始喷绘',
        '处理人员完成喷绘',
        '处理人员开始安装',
        '客户签字确认，订单完成',
      ],
    },
    problem: {
      title: '问题流程',
      icon: <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: 32 }} />,
      description: '包含尺寸错误、色差投诉、安装时间变更三种典型异常场景，演示如何发现、上报、处理异常，以及整个过程的留痕。',
      steps: [
        '前台创建稿件（尺寸录入错误）',
        '处理人员核稿发现尺寸问题',
        '标记尺寸问题，创建异常记录',
        '前台联系客户确认后重新提交',
        '店长审核通过',
        '处理人员喷绘后客户反馈色差',
        '上报色差投诉，店长处理',
        '客户要求变更安装时间',
        '最终完成安装',
      ],
    },
    archive: {
      title: '最终归档',
      icon: <InboxOutlined style={{ color: '#1890ff', fontSize: 32 }} />,
      description: '展示已完成订单的完整资料回看：稿件信息、排产流程、材料领用明细、安装照片、异常处理记录、审计日志等，体现系统的可追溯性。',
      steps: [
        '查看订单基本信息',
        '材料领用记录回看',
        '安装记录及照片回看',
        '异常处理记录回看',
        '审计日志完整回看',
        '订单归档完成',
      ],
    },
  };

  return (
    <div>
      <Title level={2}>流程演示</Title>
      <Paragraph type="secondary">
        通过三个真实场景演示，展示系统如何替代传统反复确认的工作方式，以及如何确保尺寸看错、色差投诉、安装时间变更等问题可追溯、可处理。
      </Paragraph>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {(['smooth', 'problem', 'archive'] as DemoType[]).map((type) => (
            <Card
              key={type}
              hoverable
              style={{
                flex: 1,
                minWidth: 300,
                border: activeDemo === type ? '2px solid #1890ff' : undefined,
              }}
              onClick={() => !isRunning && startDemo(type)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                {demoDescriptions[type].icon}
                <Title level={4} style={{ margin: 0 }}>
                  {demoDescriptions[type].title}
                </Title>
              </div>
              <Paragraph style={{ minHeight: 60 }}>{demoDescriptions[type].description}</Paragraph>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text type="secondary">{demoDescriptions[type].steps.length} 个步骤</Text>
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  disabled={isRunning}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeDemo !== type) {
                      startDemo(type);
                    }
                    runDemo();
                  }}
                >
                  {activeDemo === type ? '继续演示' : '开始演示'}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <Button
          icon={<ReloadOutlined />}
          onClick={resetDemo}
          danger
          block
        >
          重置演示数据
        </Button>

        {activeDemo && (
          <Card title={`${demoDescriptions[activeDemo].title} - 演示进度`}>
            <Steps
              current={currentStep}
              items={demoDescriptions[activeDemo].steps.map((step) => ({ title: step }))}
              style={{ marginBottom: 16 }}
            />

            <Card
              title="执行日志"
              size="small"
              style={{ maxHeight: 400, overflowY: 'auto', background: '#fafafa' }}
              extra={
                <Tag color={isRunning ? 'processing' : 'success'}>
                  {isRunning ? '运行中...' : '已完成'}
                </Tag>
              }
            >
              {demoLogs.map((log, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '4px 0',
                    borderBottom: '1px dashed #eee',
                    color:
                      log.type === 'success'
                        ? '#52c41a'
                        : log.type === 'warning'
                        ? '#faad14'
                        : log.type === 'error'
                        ? '#f5222d'
                        : '#666',
                  }}
                >
                  <Text type="secondary" style={{ marginRight: 8 }}>
                    [{log.time}]
                  </Text>
                  {log.type === 'success' && <CheckCircleOutlined style={{ marginRight: 4 }} />}
                  {log.type === 'warning' && <ExclamationCircleOutlined style={{ marginRight: 4 }} />}
                  {log.type === 'error' && <ExclamationCircleOutlined style={{ marginRight: 4 }} />}
                  {log.type === 'info' && <UserOutlined style={{ marginRight: 4 }} />}
                  {log.message}
                </div>
              ))}
            </Card>

            {!isRunning && demoLogs.length > 0 && activeDemo === 'archive' && (
              <div style={{ marginTop: 16 }}>
                <Divider />
                <Title level={4}>审计日志回看</Title>
                <AuditTimeline logs={api.getAuditLogsByEntity('schedule', 'schedule-003')} />
              </div>
            )}

            {!isRunning && demoLogs.length > 0 && activeDemo !== 'archive' && (
              <div style={{ marginTop: 16 }}>
                <Divider />
                <Title level={4}>操作留痕 (审计日志)</Title>
                <Alert
                  type="info"
                  showIcon
                  message="系统已自动记录所有操作"
                  description="每一步操作都已记录审计日志，包括操作人、操作时间、状态变更前后值。可在「审计日志」页面查看完整记录。"
                />
              </div>
            )}
          </Card>
        )}
      </Space>
    </div>
  );
}
