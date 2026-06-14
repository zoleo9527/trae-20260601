import { API } from './API';
import { DamageType, DamageLevel, RepairMethod } from '../types/assessment.types';

interface TaskResponse {
  success: boolean;
  data: {
    taskId?: string;
    taskNo?: string;
    status?: string;
    [key: string]: unknown;
  };
  message: string;
}

interface AssessmentResponse {
  success: boolean;
  data: {
    assessmentId?: string;
    status?: string;
    assessmentNo?: string;
    totalAmount?: number;
    details?: Array<unknown>;
    history?: Array<unknown>;
    [key: string]: unknown;
  };
  message: string;
}

interface TimelineResponse {
  success: boolean;
  data: {
    timeline?: Array<unknown>;
    [key: string]: unknown;
  };
  message: string;
}

interface ListResponse {
  success: boolean;
  data: {
    total?: number;
    list?: Array<unknown>;
    [key: string]: unknown;
  };
  message: string;
}

interface LogsResponse {
  success: boolean;
  data: {
    logs?: Array<unknown>;
    [key: string]: unknown;
  };
  message: string;
}

async function runAPITests() {
  console.log('\n' + '='.repeat(60));
  console.log('  保险理赔中心 - API接口测试');
  console.log('='.repeat(60));

  let createdTaskId = '';
  let createdAssessmentId = '';

  console.log('\n--- 1. 创建查勘任务 ---');
  const createTaskResult = await API.createTask({
    claimNo: 'CL202401180001',
    policyNo: 'POL2024001000',
    licensePlate: '京G99999',
    vehicleType: '小型轿车',
    ownerName: 'API测试用户',
    ownerPhone: '13911112222',
    accidentTime: new Date().toISOString(),
    accidentLocation: '北京市海淀区测试街道',
    accidentDesc: 'API测试事故',
    urgencyLevel: 1,
    claimAmount: 15000
  });
  console.log('HTTP状态:', createTaskResult.status);
  const taskResponse = createTaskResult.body as TaskResponse;
  createdTaskId = taskResponse.data?.taskId as string;
  console.log('任务编号:', taskResponse.data?.taskNo);
  console.log('任务ID:', createdTaskId);

  console.log('\n--- 2. 分配查勘任务 ---');
  const assignResult = await API.assignTask(createdTaskId, 'user-002', 'API测试分配');
  console.log('HTTP状态:', assignResult.status);
  const assignData = assignResult.body as TaskResponse;
  console.log('分配状态:', assignData.data?.status);
  console.log('分配给:', assignData.data?.assignedSurveyorName);

  console.log('\n--- 3. 查勘员接单 ---');
  const acceptResult = await API.acceptTask(createdTaskId, '已接收任务');
  console.log('HTTP状态:', acceptResult.status);
  const acceptData = acceptResult.body as TaskResponse;
  console.log('接单后状态:', acceptData.data?.status);

  console.log('\n--- 4. 开始查勘 ---');
  const startResult = await API.startSurvey(createdTaskId, '北京市海淀区事故现场', '开始现场查勘');
  console.log('HTTP状态:', startResult.status);
  const startData = startResult.body as TaskResponse;
  console.log('查勘开始后状态:', startData.data?.status);

  console.log('\n--- 5. 完成查勘 ---');
  const completeResult = await API.completeSurvey(createdTaskId, '查勘完成，车况已记录');
  console.log('HTTP状态:', completeResult.status);
  const completeData = completeResult.body as TaskResponse;
  console.log('查勘完成后状态:', completeData.data?.status);

  console.log('\n--- 6. 创建定损意见（草稿）---');
  const createAssessmentResult = await API.createAssessment({
    taskId: createdTaskId,
    partsFee: 10000,
    laborFee: 3000,
    materialFee: 500,
    repairMethod: '维修',
    repairPlan: '前保险杠修复，左前门喷漆',
    details: [
      {
        partName: '前保险杠',
        damageType: DamageType.DENT,
        damageLevel: DamageLevel.MEDIUM,
        repairMethod: RepairMethod.REPAIR,
        partFee: 5000,
        laborFee: 1500,
        remark: '凹陷修复'
      },
      {
        partName: '左前门',
        damageType: DamageType.SCRATCH,
        damageLevel: DamageLevel.SLIGHT,
        repairMethod: RepairMethod.PAINT,
        partFee: 5000,
        laborFee: 1500,
        remark: '喷漆处理'
      }
    ]
  });
  console.log('HTTP状态:', createAssessmentResult.status);
  const assessResponse = createAssessmentResult.body as AssessmentResponse;
  createdAssessmentId = assessResponse.data?.assessmentId as string;
  console.log('定损编号:', assessResponse.data?.assessmentNo);
  console.log('定损ID:', createdAssessmentId);
  console.log('定损状态:', assessResponse.data?.status);
  console.log('定损金额:', assessResponse.data?.totalAmount);

  console.log('\n--- 7. 提交定损审核 ---');
  const submitResult = await API.submitAssessment(createdAssessmentId, '提交审核');
  console.log('HTTP状态:', submitResult.status);
  const submitData = submitResult.body as AssessmentResponse;
  console.log('提交后状态:', submitData.data?.status);

  console.log('\n--- 8. 审核定损意见 ---');
  const reviewResult = await API.reviewAssessment(createdAssessmentId, 'approve', '定损金额合理，同意核赔', '审核通过');
  console.log('HTTP状态:', reviewResult.status);
  const reviewData = reviewResult.body as AssessmentResponse;
  console.log('审核后状态:', reviewData.data?.status);

  console.log('\n--- 9. 查询任务详情 ---');
  const taskDetailResult = await API.getTaskDetail(createdTaskId);
  console.log('HTTP状态:', taskDetailResult.status);
  const taskDetailResponse = taskDetailResult.body as TaskResponse;
  console.log('任务状态:', taskDetailResponse.data?.status);
  console.log('任务编号:', taskDetailResponse.data?.taskNo);
  console.log('报案号:', taskDetailResponse.data?.claimNo);
  console.log('车牌号:', taskDetailResponse.data?.licensePlate);

  console.log('\n--- 10. 查询任务时间线 ---');
  const timelineResult = await API.getTaskTimeline(createdTaskId);
  console.log('HTTP状态:', timelineResult.status);
  const timelineResponse = timelineResult.body as TimelineResponse;
  const timeline = timelineResponse.data?.timeline as Array<{
    timestamp: string;
    title: string;
    operator: string;
    role: string;
  }> || [];
  console.log('时间线记录数:', timeline.length);
  timeline.forEach((item, index) => {
    console.log(`  ${index + 1}. [${item.timestamp.slice(0, 19)}] ${item.title} - ${item.operator}(${item.role})`);
  });

  console.log('\n--- 11. 查询定损详情 ---');
  const assessmentDetailResult = await API.getAssessmentDetail(createdAssessmentId);
  console.log('HTTP状态:', assessmentDetailResult.status);
  const assessmentDetailData = assessmentDetailResult.body as AssessmentResponse;
  console.log('定损编号:', assessmentDetailData.data?.assessmentNo);
  console.log('定损状态:', assessmentDetailData.data?.status);
  console.log('定损金额:', assessmentDetailData.data?.totalAmount);
  console.log('定损员:', assessmentDetailData.data?.assessorName);
  const details = assessmentDetailData.data?.details as Array<{
    partName: string;
    partFee: number;
    laborFee: number;
    remark: string;
  }> || [];
  console.log('损失明细:');
  details.forEach(detail => {
    console.log(`  - ${detail.partName}: 配件费 ${detail.partFee}元 + 工时费 ${detail.laborFee}元 (${detail.remark})`);
  });

  console.log('\n--- 12. 查询定损历史 ---');
  const assessmentHistoryResult = await API.getAssessmentHistory(createdAssessmentId);
  console.log('HTTP状态:', assessmentHistoryResult.status);
  const historyResponse = assessmentHistoryResult.body as TimelineResponse;
  const history = historyResponse.data?.timeline as Array<{
    timestamp: string;
    title: string;
    operator: string;
    role: string;
    beforeStatus?: string;
    afterStatus?: string;
  }> || [];
  console.log('历史记录数:', history.length);
  history.forEach((item, index) => {
    const statusChange = item.beforeStatus && item.afterStatus 
      ? ` (${item.beforeStatus} -> ${item.afterStatus})` 
      : '';
    console.log(`  ${index + 1}. [${item.timestamp.slice(0, 19)}] ${item.title}${statusChange} - ${item.operator}(${item.role})`);
  });

  console.log('\n--- 13. 查询任务列表 ---');
  const taskListResult = await API.getTaskList({ page: '1', pageSize: '10' });
  console.log('HTTP状态:', taskListResult.status);
  const taskListResponse = taskListResult.body as ListResponse;
  console.log('任务总数:', taskListResponse.data?.total);

  console.log('\n--- 14. 查询定损列表 ---');
  const assessmentListResult = await API.getAssessmentList({ page: '1', pageSize: '10' });
  console.log('HTTP状态:', assessmentListResult.status);
  const assessmentListResponse = assessmentListResult.body as ListResponse;
  console.log('定损总数:', assessmentListResponse.data?.total);

  console.log('\n--- 15. 查询操作日志 ---');
  const logsResult = await API.getTaskLogs(createdTaskId);
  console.log('HTTP状态:', logsResult.status);
  const logsResponse = logsResult.body as LogsResponse;
  console.log('日志记录数:', logsResponse.data?.logs?.length || 0);

  console.log('\n' + '='.repeat(60));
  console.log('  API接口测试完成！');
  console.log('='.repeat(60));
}

export async function main() {
  try {
    await runAPITests();
  } catch (error) {
    console.error('测试执行失败:', error);
    process.exit(1);
  }
}

if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'browser') {
  main().catch(console.error);
}
