import {
  createLead,
  executeStatusTransition,
  returnLead,
  flagException,
  scanForGaps,
  reassignLead,
  handleException,
  TransitionRequest,
} from './leadService';
import * as dao from '../db/dao';
import { User, Lead, ExceptionType } from '../types';

interface TestCase {
  id: string;
  name: string;
  description: string;
  expectedException?: ExceptionType;
  shouldTriggerAlert: boolean;
  run: (users: User[]) => Promise<{
    success: boolean;
    message: string;
    lead?: Lead;
    exception?: any;
  }>;
}

export const EXCEPTION_TEST_CASES: TestCase[] = [
  {
    id: 'TC-001',
    name: '线索新建后24小时未分配',
    description: '创建一个新线索，不进行分配，模拟超过24小时未分配的情况',
    expectedException: 'unassigned_over_24h',
    shouldTriggerAlert: true,
    run: async (users) => {
      const manager = users.find((u) => u.role === 'manager')!;

      const lead = await createLead(
        {
          companyName: '异常测试-未分配公司',
          contactPerson: '张三',
          contactPhone: '13800138000',
          sourceType: 'old_ledger',
          sourceReference: 'LEDGER-001',
          priority: 'high',
          industry: '电子信息',
        },
        manager
      );

      const now = new Date();
      const oldCreatedAt = new Date(now.getTime() - 25 * 60 * 60 * 1000);
      await dao.updateLead(lead.id, {
        createdAt: oldCreatedAt.toISOString(),
        updatedAt: oldCreatedAt.toISOString(),
      });

      const exceptions = await scanForGaps();
      const targetException = exceptions.find(
        (e) => e.leadId === lead.id && e.type === 'unassigned_over_24h'
      );

      const updatedLead = await dao.getLeadById(lead.id);

      return {
        success: !!targetException,
        message: targetException
          ? `成功触发异常: ${targetException.message}`
          : '未检测到24小时未分配异常',
        lead: updatedLead || undefined,
        exception: targetException,
      };
    },
  },

  {
    id: 'TC-002',
    name: '状态流转时未指定下一责任人（空档检测）',
    description: '从"接洽中"流转到"待跟进"时，故意不指定下一责任人，应触发空档检测',
    expectedException: 'status_gap_detected',
    shouldTriggerAlert: true,
    run: async (users) => {
      const manager = users.find((u) => u.role === 'manager')!;
      const supervisor = users.find((u) => u.role === 'supervisor')!;

      const lead = await createLead(
        {
          companyName: '异常测试-空档检测公司',
          contactPerson: '李四',
          contactPhone: '13900139000',
          sourceType: 'site_record',
          sourceReference: 'SITE-002',
        },
        manager
      );

      await executeStatusTransition(
        {
          leadId: lead.id,
          toStatus: 'assigned',
          followup: null,
          nextResponsible: supervisor.id,
          nextResponsibleRole: supervisor.role,
          remark: '分配给主管',
        },
        manager
      );

      await executeStatusTransition(
        {
          leadId: lead.id,
          toStatus: 'contacting',
          followup: {
            type: 'call',
            content: '首次电话联系，客户表示有兴趣',
          },
          nextResponsible: supervisor.id,
          nextResponsibleRole: supervisor.role,
          remark: '开始接洽',
        },
        supervisor
      );

      const result = await executeStatusTransition(
        {
          leadId: lead.id,
          toStatus: 'needs_followup',
          followup: {
            type: 'meeting',
            content: '会议讨论了需求，但未明确下一步负责人',
            nextAction: '继续跟进',
          },
          nextResponsible: null,
          nextResponsibleRole: null,
          remark: '测试空档检测',
        },
        supervisor
      );

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const now = new Date();
      const lastTransition = await dao.getLastTransitionByLeadId(lead.id);
      if (lastTransition) {
        const oldTime = new Date(
          now.getTime() - 35 * 60 * 1000
        ).toISOString();
        await dao.executeRawSql(
          'UPDATE status_transitions SET transitioned_at = ? WHERE id = ?',
          [oldTime, lastTransition.id]
        );
      }

      const exceptions = await scanForGaps();
      const targetException = exceptions.find(
        (e) => e.leadId === lead.id && e.type === 'status_gap_detected'
      );

      const updatedLead = await dao.getLeadById(lead.id);

      return {
        success: !!targetException || !!result.exception,
        message: targetException
          ? `成功触发空档异常: ${targetException.message}`
          : result.exception
          ? `流转时直接触发异常: ${result.exception.message}`
          : '未检测到状态空档异常',
        lead: updatedLead || undefined,
        exception: targetException || result.exception,
      };
    },
  },

  {
    id: 'TC-003',
    name: '待跟进状态超过48小时无跟进记录',
    description: '线索处于待跟进状态，超过48小时没有新的跟进记录',
    expectedException: 'no_followup_over_48h',
    shouldTriggerAlert: true,
    run: async (users) => {
      const manager = users.find((u) => u.role === 'manager')!;
      const supervisor = users.find((u) => u.role === 'supervisor')!;

      const lead = await createLead(
        {
          companyName: '异常测试-跟进超时公司',
          contactPerson: '王五',
          contactPhone: '13700137000',
          sourceType: 'chat_screenshot',
          sourceReference: 'WECHAT-003',
        },
        manager
      );

      await executeStatusTransition(
        {
          leadId: lead.id,
          toStatus: 'assigned',
          followup: null,
          nextResponsible: supervisor.id,
          nextResponsibleRole: supervisor.role,
          remark: '分配给主管',
        },
        manager
      );

      await executeStatusTransition(
        {
          leadId: lead.id,
          toStatus: 'contacting',
          followup: {
            type: 'visit',
            content: '上门拜访，客户需求明确',
          },
          nextResponsible: supervisor.id,
          nextResponsibleRole: supervisor.role,
          remark: '开始接洽',
        },
        supervisor
      );

      const transitionResult = await executeStatusTransition(
        {
          leadId: lead.id,
          toStatus: 'needs_followup',
          followup: {
            type: 'meeting',
            content: '初步沟通，待后续跟进',
            nextAction: '发送详细资料',
          },
          nextResponsible: supervisor.id,
          nextResponsibleRole: supervisor.role,
          remark: '转为待跟进',
        },
        supervisor
      );

      if (transitionResult.transition) {
        const now = new Date();
        const oldTime = new Date(now.getTime() - 49 * 60 * 60 * 1000);
        await dao.executeRawSql(
          'UPDATE status_transitions SET transitioned_at = ? WHERE id = ?',
          [oldTime.toISOString(), transitionResult.transition.id]
        );
        await dao.updateLead(lead.id, {
          updatedAt: oldTime.toISOString(),
        });
      }

      const exceptions = await scanForGaps();
      const targetException = exceptions.find(
        (e) => e.leadId === lead.id && e.type === 'no_followup_over_48h'
      );

      const updatedLead = await dao.getLeadById(lead.id);

      return {
        success: !!targetException,
        message: targetException
          ? `成功触发跟进超时异常: ${targetException.message}`
          : '未检测到跟进超时异常',
        lead: updatedLead || undefined,
        exception: targetException,
      };
    },
  },

  {
    id: 'TC-004',
    name: '退回流程触发',
    description: '主管将线索退回给经理，验证退回流程是否正常',
    expectedException: undefined,
    shouldTriggerAlert: false,
    run: async (users) => {
      const manager = users.find((u) => u.role === 'manager')!;
      const supervisor = users.find((u) => u.role === 'supervisor')!;

      const lead = await createLead(
        {
          companyName: '异常测试-退回流程公司',
          contactPerson: '赵六',
          contactPhone: '13600136000',
          sourceType: 'other',
          sourceReference: 'OTHER-004',
        },
        manager
      );

      await executeStatusTransition(
        {
          leadId: lead.id,
          toStatus: 'assigned',
          followup: null,
          nextResponsible: supervisor.id,
          nextResponsibleRole: supervisor.role,
          remark: '分配给主管',
        },
        manager
      );

      const result = await returnLead(
        lead.id,
        '客户信息不完整，需要重新核实',
        supervisor
      );

      const updatedLead = await dao.getLeadById(lead.id);

      return {
        success: result.success && updatedLead?.status === 'returned',
        message: result.success
          ? `退回成功，当前状态: ${updatedLead?.status}`
          : `退回失败: ${result.errors.join(', ')}`,
        lead: updatedLead || undefined,
        exception: result.exception,
      };
    },
  },

  {
    id: 'TC-005',
    name: '重新分配修复异常',
    description: '存在空档异常的线索，通过重新分配修复异常',
    expectedException: undefined,
    shouldTriggerAlert: false,
    run: async (users) => {
      const manager = users.find((u) => u.role === 'manager')!;
      const supervisor1 = users.find((u) => u.role === 'supervisor')!;
      const property = users.find((u) => u.role === 'property')!;

      const lead = await createLead(
        {
          companyName: '异常测试-修复异常公司',
          contactPerson: '钱七',
          contactPhone: '13500135000',
          sourceType: 'old_ledger',
          sourceReference: 'LEDGER-005',
        },
        manager
      );

      await executeStatusTransition(
        {
          leadId: lead.id,
          toStatus: 'assigned',
          followup: null,
          nextResponsible: supervisor1.id,
          nextResponsibleRole: supervisor1.role,
          remark: '分配给主管',
        },
        manager
      );

      await executeStatusTransition(
        {
          leadId: lead.id,
          toStatus: 'contacting',
          followup: {
            type: 'call',
            content: '电话沟通，客户需要现场查看',
          },
          nextResponsible: supervisor1.id,
          nextResponsibleRole: supervisor1.role,
          remark: '开始接洽',
        },
        supervisor1
      );

      await executeStatusTransition(
        {
          leadId: lead.id,
          toStatus: 'needs_followup',
          followup: {
            type: 'site',
            content: '需要物业配合现场勘查',
            nextAction: '安排物业现场查看',
          },
          nextResponsible: null,
          nextResponsibleRole: null,
          remark: '故意不指定责任人触发异常',
        },
        supervisor1
      );

      let exceptions = await dao.getUnhandledExceptions(lead.id);
      const hasExceptionBefore = exceptions.length > 0;

      await reassignLead(
        lead.id,
        property.id,
        property.role,
        '转交物业进行现场勘查',
        manager
      );

      exceptions = await dao.getUnhandledExceptions(lead.id);
      const hasExceptionAfter = exceptions.length > 0;
      const updatedLead = await dao.getLeadById(lead.id);

      return {
        success:
          hasExceptionBefore && !hasExceptionAfter && !!updatedLead?.currentResponsible,
        message: `重新分配${hasExceptionAfter ? '未' : '已'}修复异常，当前责任人: ${updatedLead?.currentResponsible ? property.name : '未分配'}`,
        lead: updatedLead || undefined,
      };
    },
  },

  {
    id: 'TC-006',
    name: '人工标记异常',
    description: '手动标记一个线索为异常，验证异常标记功能',
    expectedException: 'manual_flag',
    shouldTriggerAlert: true,
    run: async (users) => {
      const manager = users.find((u) => u.role === 'manager')!;

      const lead = await createLead(
        {
          companyName: '异常测试-人工标记公司',
          contactPerson: '孙八',
          contactPhone: '13400134000',
          sourceType: 'site_record',
          sourceReference: 'SITE-006',
        },
        manager
      );

      const exception = await flagException(
        lead.id,
        null,
        'manual_flag',
        '客户态度异常冷淡，可能存在竞争方介入',
        manager
      );

      const updatedLead = await dao.getLeadById(lead.id);

      return {
        success: !!exception && updatedLead?.hasException === true,
        message: exception
          ? `人工标记异常成功: ${exception.message}`
          : '人工标记异常失败',
        lead: updatedLead || undefined,
        exception,
      };
    },
  },

  {
    id: 'TC-007',
    name: '处理异常并验证状态清除',
    description: '处理一个异常，验证异常状态是否正确清除',
    expectedException: undefined,
    shouldTriggerAlert: false,
    run: async (users) => {
      const manager = users.find((u) => u.role === 'manager')!;
      const supervisor = users.find((u) => u.role === 'supervisor')!;

      const lead = await createLead(
        {
          companyName: '异常测试-处理异常公司',
          contactPerson: '周九',
          contactPhone: '13300133000',
          sourceType: 'chat_screenshot',
          sourceReference: 'WECHAT-007',
        },
        manager
      );

      const exception = await flagException(
        lead.id,
        null,
        'manual_flag',
        '测试异常处理流程',
        manager
      );

      let hasExceptionBefore = (await dao.getLeadById(lead.id))?.hasException;

      await handleException(exception.id, '已核实情况，属正常流程', manager);

      const updatedLead = await dao.getLeadById(lead.id);
      const hasExceptionAfter = updatedLead?.hasException;

      return {
        success: hasExceptionBefore && !hasExceptionAfter,
        message: `异常处理${hasExceptionAfter ? '未' : '已'}清除异常标记`,
        lead: updatedLead || undefined,
      };
    },
  },

  {
    id: 'TC-008',
    name: '无权限角色尝试流转',
    description: '物业角色尝试将线索从"新建"流转到"已分配"，应该被拒绝',
    expectedException: undefined,
    shouldTriggerAlert: false,
    run: async (users) => {
      const manager = users.find((u) => u.role === 'manager')!;
      const property = users.find((u) => u.role === 'property')!;
      const supervisor = users.find((u) => u.role === 'supervisor')!;

      const lead = await createLead(
        {
          companyName: '异常测试-权限验证公司',
          contactPerson: '吴十',
          contactPhone: '13200132000',
          sourceType: 'old_ledger',
          sourceReference: 'LEDGER-008',
        },
        manager
      );

      const result = await executeStatusTransition(
        {
          leadId: lead.id,
          toStatus: 'assigned',
          followup: null,
          nextResponsible: supervisor.id,
          nextResponsibleRole: supervisor.role,
          remark: '物业尝试分配，应该被拒绝',
        },
        property
      );

      const updatedLead = await dao.getLeadById(lead.id);

      return {
        success: !result.success && updatedLead?.status === 'new',
        message: result.success
          ? '错误：物业角色不应该有权限分配线索'
          : `正确拒绝无权限操作: ${result.errors.join(', ')}`,
        lead: updatedLead || undefined,
      };
    },
  },
];

export async function runAllExceptionTests(): Promise<{
  passed: number;
  failed: number;
  results: Array<{
    testCase: TestCase;
    success: boolean;
    message: string;
    lead?: Lead;
    exception?: any;
  }>;
}> {
  await dao.getDb();
  const users = await dao.getAllUsers();

  const results = [];
  let passed = 0;
  let failed = 0;

  console.log('========== 异常流测试开始 ==========\n');

  for (const testCase of EXCEPTION_TEST_CASES) {
    console.log(`[${testCase.id}] ${testCase.name}`);
    console.log(`  描述: ${testCase.description}`);

    try {
      const result = await testCase.run(users);
      results.push({ testCase, ...result });

      if (result.success) {
        passed++;
        console.log(`  ✅  PASS: ${result.message}`);
      } else {
        failed++;
        console.log(`  ❌  FAIL: ${result.message}`);
      }

      if (result.exception) {
        console.log(`  异常类型: ${result.exception.type}`);
        console.log(`  异常信息: ${result.exception.message}`);
      }
      console.log('');
    } catch (error: any) {
      failed++;
      results.push({
        testCase,
        success: false,
        message: `执行出错: ${error.message}`,
      });
      console.log(`  ❌  ERROR: ${error.message}`);
      console.error(error);
      console.log('');
    }
  }

  console.log('========== 测试结果汇总 ==========');
  console.log(`通过: ${passed} / ${EXCEPTION_TEST_CASES.length}`);
  console.log(`失败: ${failed} / ${EXCEPTION_TEST_CASES.length}`);
  console.log(`通过率: ${((passed / EXCEPTION_TEST_CASES.length) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n失败的测试用例:');
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`  - [${r.testCase.id}] ${r.testCase.name}: ${r.message}`);
      });
  }

  return { passed, failed, results };
}

export async function runSingleTest(testCaseId: string) {
  await dao.getDb();
  const users = await dao.getAllUsers();

  const testCase = EXCEPTION_TEST_CASES.find((t) => t.id === testCaseId);
  if (!testCase) {
    throw new Error(`测试用例不存在: ${testCaseId}`);
  }

  console.log(`[${testCase.id}] ${testCase.name}`);
  console.log(`描述: ${testCase.description}\n`);

  const result = await testCase.run(users);

  if (result.success) {
    console.log(`✅ PASS: ${result.message}`);
  } else {
    console.log(`❌ FAIL: ${result.message}`);
  }

  if (result.exception) {
    console.log(`异常类型: ${result.exception.type}`);
    console.log(`异常信息: ${result.exception.message}`);
  }

  return result;
}
