const BASE_URL = 'http://localhost:3001/api';
let token = '';

async function request(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

async function testLogin() {
  console.log('=== 1. 测试登录 ===');
  try {
    const res = await request(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: { username: 'zhangsan', password: '123456' },
    });
    token = res.token;
    console.log('✅ 登录成功');
    console.log('用户:', res.name, '-', res.role);
    return res;
  } catch (error) {
    console.error('❌ 登录失败:', error.message);
    throw error;
  }
}

async function testProjectList() {
  console.log('\n=== 2. 测试项目列表 ===');
  try {
    const res = await request(`${BASE_URL}/projects?pageSize=10`);
    console.log('✅ 获取项目列表成功');
    console.log('项目总数:', res.length);
    console.log('项目列表:');
    res.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.projectNo} - ${p.name} [${p.status}]${p.blockReason ? ' - ⚠️ 已阻塞' : ''}`);
    });
    return res;
  } catch (error) {
    console.error('❌ 获取项目列表失败:', error.message);
    throw error;
  }
}

async function testProjectAnalysis(projectId) {
  console.log('\n=== 3. 测试项目分析接口（核心） ===');
  try {
    const res = await request(`${BASE_URL}/projects/${projectId}/analysis`);
    const { blockAnalysis, signinAnalysis, responsibilityMatrix } = res;

    console.log('✅ 获取项目分析成功');
    console.log('\n📋 问题1: 谁在处理？（责任矩阵）');
    console.log('  项目专员:', responsibilityMatrix.projectSpecialist.userName, '- 待办:', responsibilityMatrix.projectSpecialist.pendingTasks);
    console.log('  评审秘书:', responsibilityMatrix.reviewSecretary.userName, '- 待办:', responsibilityMatrix.reviewSecretary.pendingTasks);
    console.log('  财务    :', responsibilityMatrix.finance.userName, '- 待办:', responsibilityMatrix.finance.pendingTasks);

    console.log('\n📍 问题2: 卡在哪里？（卡点分析）');
    console.log('  是否阻塞:', blockAnalysis.isBlocked ? '是 ❌' : '否 ✅');
    if (blockAnalysis.isBlocked) {
      console.log('  阻塞原因:', blockAnalysis.blockReason);
      console.log('  阻塞责任人:', blockAnalysis.blockHandlerName, `(${blockAnalysis.blockHandlerRole})`);
      console.log('  阻塞时长:', Math.floor(blockAnalysis.blockedDuration / 60), '小时', blockAnalysis.blockedDuration % 60, '分钟');
    }
    console.log('  待办事项:', blockAnalysis.pendingActions.join(', ') || '无');
    if (blockAnalysis.nextHandler) {
      console.log('  下一处理人:', blockAnalysis.nextHandler.userName || '待分配', `(${blockAnalysis.nextHandler.roleName})`);
    }

    console.log('\n👥 问题3: 签到为什么还没完成？（签到分析）');
    if (signinAnalysis) {
      console.log('  签到率:', Math.round(signinAnalysis.signinRate * 100) + '%');
      console.log('  应到:', signinAnalysis.totalExperts, '人');
      console.log('  已签到:', signinAnalysis.confirmedCount, '人');
      console.log('  缺席:', signinAnalysis.absentCount, '人');
      console.log('  请假:', signinAnalysis.leaveCount, '人');
      console.log('  待签到:', signinAnalysis.pendingCount, '人');
      console.log('  是否完成:', signinAnalysis.isComplete ? '是 ✅' : '否 ❌');
      if (signinAnalysis.incompleteReason) {
        console.log('  未完成原因:', signinAnalysis.incompleteReason);
      }
      if (signinAnalysis.pendingExperts.length > 0) {
        console.log('  待处理专家:');
        signinAnalysis.pendingExperts.forEach(e => {
          console.log(`    - ${e.expertName}: ${e.status}${e.remark ? ` - ${e.remark}` : ''}`);
        });
      }
    } else {
      console.log('  暂无签到数据');
    }

    return res;
  } catch (error) {
    console.error('❌ 获取项目分析失败:', error.message);
    throw error;
  }
}

async function testProjectTimeline(projectId) {
  console.log('\n=== 4. 测试项目时间线 ===');
  try {
    const res = await request(`${BASE_URL}/projects/${projectId}/timeline`);
    console.log('✅ 获取时间线成功');
    console.log('事件数量:', res.events.length);
    res.events.slice(0, 3).forEach((e, i) => {
      console.log(`  ${i + 1}. [${e.type}] ${e.title} - ${e.time}`);
    });
    return res;
  } catch (error) {
    console.error('❌ 获取时间线失败:', error.message);
    throw error;
  }
}

async function testTriggerException(projectId) {
  console.log('\n=== 5. 测试异常样例触发 ===');
  try {
    const res = await request(`${BASE_URL}/exceptions/trigger-sample`, {
      method: 'POST',
      body: {
        projectId,
        sampleType: 'expert_absent',
      },
    });
    console.log('✅ 异常样例触发成功');
    console.log('异常ID:', res.exceptionId);
    console.log('异常标题:', res.title);
    console.log('通知已发送给:', res.notifiedRoles?.join(', ') || '无');
    return res;
  } catch (error) {
    console.error('❌ 触发异常失败:', error.message);
    throw error;
  }
}

async function testExceptionList() {
  console.log('\n=== 6. 测试异常列表 ===');
  try {
    const res = await request(`${BASE_URL}/exceptions?pageSize=5`);
    console.log('✅ 获取异常列表成功');
    console.log('异常总数:', res.total);
    res.items.forEach((e, i) => {
      console.log(`  ${i + 1}. ${e.title} [${e.type}] [${e.status}] [${e.severity}]`);
    });
    return res;
  } catch (error) {
    console.error('❌ 获取异常列表失败:', error.message);
    throw error;
  }
}

async function main() {
  try {
    await testLogin();
    const projects = await testProjectList();

    if (projects.length > 0) {
      const projectId = projects[0].id;
      console.log('\n测试项目:', projects[0].name, `(${projectId})`);

      await testProjectAnalysis(projectId);
      await testProjectTimeline(projectId);
      await testTriggerException(projectId);
    }

    await testExceptionList();

    console.log('\n🎉 所有API测试通过！');
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    process.exit(1);
  }
}

main();
