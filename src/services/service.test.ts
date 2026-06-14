import { TaskService } from './task.service';
import { AssessmentService } from './assessment.service';
import { LogService } from './log.service';
import { UserService } from './user.service';
import { TaskStatus, UrgencyLevel } from '../types/task.types';
import { AssessmentStatus, DamageType, DamageLevel, RepairMethod } from '../types/assessment.types';

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function runServiceTests() {
  console.log('===============================');
  console.log('  保险理赔中心服务层测试');
  console.log('===============================');

  const taskService = new TaskService();
  const assessmentService = new AssessmentService();
  const logService = new LogService();
  const userService = new UserService();

  console.log('\n--- 1. 用户服务测试 ---');
  const currentUser = userService.getCurrentUser();
  console.log('当前用户:', currentUser.realName, '-', currentUser.role);
  
  const surveyors = userService.getSurveyors();
  console.log('查勘员列表:', surveyors.map(s => s.realName));
  
  const supervisors = userService.getReviewSupervisors();
  console.log('核赔主管列表:', supervisors.map(s => s.realName));

  console.log('\n--- 2. 创建查勘任务测试 ---');
  const newTask = taskService.createTask({
    claimNo: 'CL202401170001',
    policyNo: 'POL2024000999',
    licensePlate: '京F88888',
    vehicleType: '小型轿车',
    ownerName: '测试用户',
    ownerPhone: '13900000000',
    accidentTime: new Date().toISOString(),
    accidentLocation: '北京市朝阳区测试路',
    accidentDesc: '测试事故描述',
    urgencyLevel: UrgencyLevel.NORMAL,
    claimAmount: 10000
  });
  console.log('创建任务成功:', newTask.taskNo);

  console.log('\n--- 3. 分配查勘任务测试 ---');
  const assignedTask = taskService.assignTask(newTask.taskId, surveyors[0].userId, '测试分配');
  console.log('分配任务成功:', assignedTask.taskNo, '- 状态:', assignedTask.status);

  console.log('\n--- 4. 查勘员接单测试 ---');
  const acceptedTask = taskService.acceptTask(newTask.taskId, '已接收，准备查勘');
  console.log('接单成功:', acceptedTask.taskNo, '- 状态:', acceptedTask.status);

  console.log('\n--- 5. 开始查勘测试 ---');
  const surveyTask = taskService.startSurvey(newTask.taskId, '北京市朝阳区测试路现场');
  console.log('开始查勘:', surveyTask.taskNo);

  console.log('\n--- 6. 完成查勘测试 ---');
  const completedTask = taskService.completeSurvey(newTask.taskId, '查勘完成，车况已记录');
  console.log('完成查勘:', completedTask.taskNo, '- 状态:', completedTask.status);

  console.log('\n--- 7. 创建定损意见测试 ---');
  const newAssessment = assessmentService.createAssessment({
    taskId: newTask.taskId,
    partsFee: 6000,
    laborFee: 2000,
    materialFee: 500,
    repairMethod: '维修',
    repairPlan: '前保险杠修复，左前门喷漆',
    details: [
      {
        partName: '前保险杠',
        damageType: DamageType.DENT,
        damageLevel: DamageLevel.MEDIUM,
        repairMethod: RepairMethod.REPAIR,
        partFee: 3000,
        laborFee: 1000,
        remark: '凹陷修复'
      },
      {
        partName: '左前门',
        damageType: DamageType.SCRATCH,
        damageLevel: DamageLevel.SLIGHT,
        repairMethod: RepairMethod.PAINT,
        partFee: 3000,
        laborFee: 1000,
        remark: '喷漆处理'
      }
    ],
    remark: '定损完成'
  });
  console.log('创建定损意见成功:', newAssessment.assessmentNo, '- 金额:', newAssessment.totalAmount);

  console.log('\n--- 8. 查询任务时间线测试 ---');
  const timeline = taskService.getTaskTimeline(newTask.taskId);
  console.log('任务时间线记录数:', timeline.length);
  timeline.forEach((item, index) => {
    console.log(`  ${index + 1}. [${item.timestamp.slice(0, 19)}] ${item.operator}(${item.role}) - ${item.title}`);
  });

  console.log('\n--- 9. 查询定损详情测试 ---');
  const assessmentWithDetails = assessmentService.getAssessmentWithDetails(newAssessment.assessmentId);
  if (assessmentWithDetails) {
    console.log('定损详情:', assessmentWithDetails.assessmentNo);
    console.log('  定损员:', assessmentWithDetails.assessorName);
    console.log('  总金额:', assessmentWithDetails.totalAmount);
    console.log('  损失明细:', assessmentWithDetails.details.length, '项');
    assessmentWithDetails.details.forEach(detail => {
      console.log(`    - ${detail.partName}: ${detail.partFee}元`);
    });
  }

  console.log('\n--- 10. 查询任务列表测试 ---');
  const tasks = taskService.getTasks({ page: 1, pageSize: 10 });
  console.log('任务列表总数:', tasks.total);
  console.log('当前页任务:', tasks.list.length, '条');

  console.log('\n--- 11. 查询定损列表测试 ---');
  const assessments = assessmentService.getAssessments({ page: 1, pageSize: 10 });
  console.log('定损列表总数:', assessments.total);

  console.log('\n--- 12. 查询操作日志测试 ---');
  const logs = logService.getTaskLogs(newTask.taskId);
  console.log('任务操作日志:', logs.length, '条');

  console.log('\n--- 13. 获取任务统计测试 ---');
  const taskStats = taskService.getTaskStats();
  console.log('任务统计:', JSON.stringify(taskStats));

  console.log('\n--- 14. 获取定损统计测试 ---');
  const assessmentStats = assessmentService.getAssessmentStats();
  console.log('定损统计:', JSON.stringify(assessmentStats));

  console.log('\n===============================');
  console.log('  所有服务层测试完成！');
  console.log('===============================');
}

if (require.main === module) {
  runServiceTests().catch(console.error);
}