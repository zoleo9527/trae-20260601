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
  console.log('===============================');
  console.log('  API接口测试 - 理赔查勘流程');
  console.log('===============================');

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
  console.log('状态:', createTaskResult.status);
  console.log('响应:', JSON.stringify(createTaskResult.body, null, 2));
  const taskResponse = createTaskResult.body as TaskResponse;
  createdTaskId = taskResponse.data?.taskId as string;

  console.log('\n--- 2. 分配查勘任务 ---');
  const assignResult = await API.assignTask(createdTaskId, 'user-002', 'API测试分配');
  console.log('状态:', assignResult.status);
  console.log('响应:', JSON.stringify(assignResult.body, null, 2));

  console.log('\n--- 3. 查勘员接单 ---');
  const acceptResult = await API.acceptTask(createdTaskId, '已接收任务');
  console.log('状态:', acceptResult.status);
  console.log('响应:', JSON.stringify(acceptResult.body, null, 2));

  console.log('\n--- 4. 开始查勘 ---');
  const startResult = await API.startSurvey(createdTaskId, '北京市海淀区事故现场', '开始现场查勘');
  console.log('状态:', startResult.status);
  console.log('响应:', JSON.stringify(startResult.body, null, 2));

  console.log('\n--- 5. 完成查勘 ---');
  const completeResult = await API.completeSurvey(createdTaskId, '查勘完成，车况已记录');
  console.log('状态:', completeResult.status);
  console.log('响应:', JSON.stringify(completeResult.body, null, 2));

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
  console.log('状态:', createAssessmentResult.status);
  console.log('响应:', JSON.stringify(createAssessmentResult.body, null, 2));
  const assessResponse = createAssessmentResult.body as AssessmentResponse;
  createdAssessmentId = assessResponse.data?.assessmentId as string;
  console.log('定损状态:', assessResponse.data?.status);

  console.log('\n--- 7. 提交定损审核 ---');
  const submitResult = await API.submitAssessment(createdAssessmentId, '提交审核');
  console.log('状态:', submitResult.status);
  console.log('响应:', JSON.stringify(submitResult.body, null, 2));

  console.log('\n--- 8. 审核定损意见 ---');
  const reviewResult = await API.reviewAssessment(createdAssessmentId, 'approve', '定损金额合理，同意核赔', '审核通过');
  console.log('状态:', reviewResult.status);
  console.log('响应:', JSON.stringify(reviewResult.body, null, 2));

  console.log('\n--- 9. 查询任务详情 ---');
  const taskDetailResult = await API.getTaskDetail(createdTaskId);
  console.log('状态:', taskDetailResult.status);
  const taskDetailResponse = taskDetailResult.body as TaskResponse;
  console.log('任务状态:', taskDetailResponse.data?.status);
  console.log('任务编号:', taskDetailResponse.data?.taskNo);

  console.log('\n--- 10. 查询任务时间线 ---');
  const timelineResult = await API.getTaskTimeline(createdTaskId);
  console.log('状态:', timelineResult.status);
  const timelineResponse = timelineResult.body as TimelineResponse;
  console.log('时间线记录数:', timelineResponse.data?.timeline?.length || 0);

  console.log('\n--- 11. 查询任务列表 ---');
  const taskListResult = await API.getTaskList({ page: '1', pageSize: '10' });
  console.log('状态:', taskListResult.status);
  const taskListResponse = taskListResult.body as ListResponse;
  console.log('任务总数:', taskListResponse.data?.total);

  console.log('\n--- 12. 查询定损列表 ---');
  const assessmentListResult = await API.getAssessmentList({ page: '1', pageSize: '10' });
  console.log('状态:', assessmentListResult.status);
  const assessmentListResponse = assessmentListResult.body as ListResponse;
  console.log('定损总数:', assessmentListResponse.data?.total);

  console.log('\n--- 13. 查询操作日志 ---');
  const logsResult = await API.getTaskLogs(createdTaskId);
  console.log('状态:', logsResult.status);
  const logsResponse = logsResult.body as LogsResponse;
  console.log('日志记录数:', logsResponse.data?.logs?.length || 0);

  console.log('\n===============================');
  console.log('  所有API接口测试完成！');
  console.log('===============================');
}

if (require.main === module) {
  runAPITests().catch(console.error);
}
