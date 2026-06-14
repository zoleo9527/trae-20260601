import { API } from './API';
import { DamageType, DamageLevel, RepairMethod } from '../types/assessment.types';

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
  createdTaskId = (createTaskResult.body as Record<string, unknown>).data?.taskId as string;

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

  console.log('\n--- 6. 创建定损意见 ---');
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
  createdAssessmentId = (createAssessmentResult.body as Record<string, unknown>).data?.assessmentId as string;

  console.log('\n--- 7. 审核定损意见 ---');
  const reviewResult = await API.reviewAssessment(createdAssessmentId, 'approve', '定损金额合理，同意核赔', '审核通过');
  console.log('状态:', reviewResult.status);
  console.log('响应:', JSON.stringify(reviewResult.body, null, 2));

  console.log('\n--- 8. 查询任务详情 ---');
  const taskDetailResult = await API.getTaskDetail(createdTaskId);
  console.log('状态:', taskDetailResult.status);
  const taskData = taskDetailResult.body as Record<string, unknown>;
  console.log('任务状态:', taskData.data?.status);
  console.log('任务编号:', taskData.data?.taskNo);

  console.log('\n--- 9. 查询任务时间线 ---');
  const timelineResult = await API.getTaskTimeline(createdTaskId);
  console.log('状态:', timelineResult.status);
  const timelineData = timelineResult.body as Record<string, unknown>;
  console.log('时间线记录数:', (timelineData.data?.timeline as unknown[]).length);

  console.log('\n--- 10. 查询任务列表 ---');
  const taskListResult = await API.getTaskList({ page: '1', pageSize: '10' });
  console.log('状态:', taskListResult.status);
  const taskListData = taskListResult.body as Record<string, unknown>;
  console.log('任务总数:', taskListData.data?.total);

  console.log('\n--- 11. 查询定损列表 ---');
  const assessmentListResult = await API.getAssessmentList({ page: '1', pageSize: '10' });
  console.log('状态:', assessmentListResult.status);
  const assessmentListData = assessmentListResult.body as Record<string, unknown>;
  console.log('定损总数:', assessmentListData.data?.total);

  console.log('\n--- 12. 查询操作日志 ---');
  const logsResult = await API.getTaskLogs(createdTaskId);
  console.log('状态:', logsResult.status);
  const logsData = logsResult.body as Record<string, unknown>;
  console.log('日志记录数:', (logsData.data?.logs as unknown[]).length);

  console.log('\n===============================');
  console.log('  所有API接口测试完成！');
  console.log('===============================');
}

if (require.main === module) {
  runAPITests().catch(console.error);
}