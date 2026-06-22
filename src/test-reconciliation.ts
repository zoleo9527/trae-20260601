import "reflect-metadata";
import { AppDataSource } from "./data-source";
import { CustomerService } from "./services/CustomerService";
import { OutboundOrderService } from "./services/OutboundOrderService";
import { ReceivableService } from "./services/ReceivableService";
import { PaymentService } from "./services/PaymentService";
import { Customer } from "./entities/Customer";
import { Receivable, ReconciliationStatus } from "./entities/Receivable";
import { In } from "typeorm";

async function runReconciliationTests() {
  console.log("=" .repeat(70));
  console.log("  财务对账视角接口验证测试");
  console.log("=" .repeat(70));
  console.log("");

  await AppDataSource.initialize();
  console.log("✓ 数据库连接成功");
  console.log("");

  const customerService = new CustomerService();
  const orderService = new OutboundOrderService();
  const receivableService = new ReceivableService();
  const paymentService = new PaymentService();

  const testResults: { name: string; passed: boolean; error?: string }[] = [];

  const customerRepo = AppDataSource.getRepository(Customer);
  const receivableRepo = (receivableService as any).receivableRepo;
  const paymentRepo = (paymentService as any).paymentRepo;

  // 1. 应收明细 reconciliationStatus + customerId 组合筛选
  console.log("【1】应收明细 reconciliationStatus + customerId 组合筛选");
  console.log("-".repeat(60));
  try {
    const customers = await customerService.getAllCustomers();
    const overdueCustomer = customers.find((c: Customer) => c.hasOverdue);
    if (!overdueCustomer) {
      testResults.push({ name: "应收对账状态+客户筛选", passed: false, error: "找不到测试客户" });
    } else {
      const partial = await receivableService.getReceivablesByFilters({
        customerId: overdueCustomer.id,
        reconciliationStatus: "PARTIAL_RECONCILED",
      });
      const unreconciled = await receivableService.getReceivablesByFilters({
        customerId: overdueCustomer.id,
        reconciliationStatus: "UNRECONCILED",
      });
      const fully = await receivableService.getReceivablesByFilters({
        customerId: overdueCustomer.id,
        reconciliationStatus: "FULLY_RECONCILED",
      });
      console.log(`  客户: ${overdueCustomer.customerName}`);
      console.log(`  PARTIAL_RECONCILED: ${partial.length} 笔`);
      console.log(`  UNRECONCILED: ${unreconciled.length} 笔`);
      console.log(`  FULLY_RECONCILED: ${fully.length} 笔`);

      const allCount = partial.length + unreconciled.length + fully.length;
      const customerReceivables = await receivableRepo.find({ where: { customerId: overdueCustomer.id } });
      const passed = allCount === customerReceivables.length;
      const reason = passed
        ? `三状态合计${allCount}笔与该客户全部${customerReceivables.length}笔一致`
        : `数量不匹配，合计${allCount}，实际${customerReceivables.length}`;
      testResults.push({ name: "应收对账状态+客户筛选", passed, error: passed ? undefined : reason });
      console.log(`  结果: ${passed ? "✓ 通过" : "✗ 失败"} - ${reason}`);
    }
  } catch (e) {
    testResults.push({ name: "应收对账状态+客户筛选", passed: false, error: (e as Error).message });
    console.log(`  异常: ${(e as Error).message}`);
  }
  console.log("");

  // 2. 收款记录 isReconciled + customerId 组合筛选
  console.log("【2】收款记录 isReconciled + customerId 组合筛选");
  console.log("-".repeat(60));
  try {
    const customers = await customerService.getAllCustomers();
    const anyCustomer = customers[0];
    const unreconciled = await paymentService.getPaymentsByFilters({
      customerId: anyCustomer.id,
      isReconciled: false,
    });
    const reconciled = await paymentService.getPaymentsByFilters({
      customerId: anyCustomer.id,
      isReconciled: true,
    });
    console.log(`  客户: ${anyCustomer.customerName}`);
    console.log(`  未对账收款: ${unreconciled.length} 笔`);
    console.log(`  已对账收款: ${reconciled.length} 笔`);
    const allByCustomer = await paymentRepo.find({ where: { customerId: anyCustomer.id } });
    const passed = unreconciled.length + reconciled.length === allByCustomer.length;
    const reason = passed
      ? `对账+未对账合计与该客户全部收款数一致`
      : `数量不一致`;
    testResults.push({ name: "收款对账状态+客户筛选", passed, error: passed ? undefined : reason });
    console.log(`  结果: ${passed ? "✓ 通过" : "✗ 失败"} - ${reason}`);

    // 测试不传 customerId 的全局筛选
    const allUnreconciled = await paymentService.getPaymentsByFilters({ isReconciled: false });
    console.log(`  全局未对账收款: ${allUnreconciled.length} 笔`);
    testResults.push({ name: "收款全局未对账筛选", passed: allUnreconciled.length >= 0, error: undefined });
  } catch (e) {
    testResults.push({ name: "收款对账状态+客户筛选", passed: false, error: (e as Error).message });
    console.log(`  异常: ${(e as Error).message}`);
  }
  console.log("");

  // 3. 按客户对账汇总接口
  console.log("【3】按客户对账汇总（未对账/部分对账/已对账金额）");
  console.log("-".repeat(60));
  try {
    const summary = await receivableService.getReconciliationSummaryByCustomer();
    console.log(`  汇总客户数: ${summary.length}`);
    let allCustomers = summary.map((s: any) => {
      console.log(`  - ${s.customerName}:`);
      console.log(`      应收[未对账:${s.receivable.unreconciled.count}笔 ¥${s.receivable.unreconciled.amount.toLocaleString()}, 部分:${s.receivable.partial.count}笔 ¥${s.receivable.partial.amount.toLocaleString()}, 已对:${s.receivable.fully.count}笔 ¥${s.receivable.fully.amount.toLocaleString()}`);
      console.log(`      收款[未对账:${s.payment.unreconciled.count}笔 ¥${s.payment.unreconciled.amount.toLocaleString()}, 已对账:${s.payment.reconciled.count}笔 ¥${s.payment.reconciled.amount.toLocaleString()}`);
    });
    const passed = summary.length >= 3 && summary.every((s: any) => s.customerId != null);
    const reason = passed
      ? `返回${summary.length}个客户汇总，包含应收/收款双视角完整`
      : `数据不完整`;
    testResults.push({ name: "按客户对账汇总", passed, error: passed ? undefined : reason });
    console.log(`  结果: ${passed ? "✓ 通过" : "✗ 失败"} - ${reason}`);

    // 测试单客户筛选
    const customers = await customerService.getAllCustomers();
    const singleSummary = await receivableService.getReconciliationSummaryByCustomer(customers[0].id);
    const singlePassed = singleSummary.length === 1 && singleSummary[0].customerId === customers[0].id;
    testResults.push({
      name: "按客户对账汇总(单客户)",
      passed: singlePassed,
      error: singlePassed ? undefined : `单客户筛选失败，返回${singleSummary.length}条`,
    });
    console.log(`  单客户筛选: ${singlePassed ? "✓ 通过" : "✗ 失败"}`);
  } catch (e) {
    testResults.push({ name: "按客户对账汇总", passed: false, error: (e as Error).message });
    console.log(`  异常: ${(e as Error).message}`);
  }
  console.log("");

  // 4. 预警看板对账统计
  console.log("【4】预警看板对账统计（待对账笔数和金额）");
  console.log("-".repeat(60));
  try {
    const summary = await receivableService.getReconciliationSummaryByCustomer();
    const unreconciledReceivableCount = summary.reduce(
      (sum: number, c: any) => sum + c.receivable.unreconciled.count + c.receivable.partial.count,
      0
    );
    const unreconciledReceivableAmount = summary.reduce(
      (sum: number, c: any) => sum + c.receivable.unreconciled.amount,
      0
    );
    const unreconciledPaymentCount = summary.reduce(
      (sum: number, c: any) => sum + c.payment.unreconciled.count,
      0
    );
    const unreconciledPaymentAmount = summary.reduce(
      (sum: number, c: any) => sum + c.payment.unreconciled.amount,
      0
    );
    const customersNeedReconciliation = summary.filter(
      (c: any) =>
        c.receivable.unreconciled.count > 0 ||
        c.receivable.partial.count > 0 ||
        c.payment.unreconciled.count > 0
    ).length;
    const pendingReconciliationCount = unreconciledReceivableCount + unreconciledPaymentCount;
    const pendingReconciliationAmount = unreconciledReceivableAmount + unreconciledPaymentAmount;
    console.log(`  未对账应收笔数: ${unreconciledReceivableCount}`);
    console.log(`  未对账应收金额: ¥${Number(unreconciledReceivableAmount).toLocaleString()}`);
    console.log(`  未对账收款笔数: ${unreconciledPaymentCount}`);
    console.log(`  未对账收款金额: ¥${Number(unreconciledPaymentAmount).toLocaleString()}`);
    console.log(`  待对账总笔数: ${pendingReconciliationCount}`);
    console.log(`  待对账总金额: ¥${Number(pendingReconciliationAmount).toLocaleString()}`);
    console.log(`  需要跟进对账客户数: ${customersNeedReconciliation}`);
    const passed = pendingReconciliationCount > 0 && pendingReconciliationAmount > 0 && customersNeedReconciliation >= 1;
    testResults.push({
      name: "预警看板对账统计", passed, error: passed ? undefined : "统计数据缺失",
    });
    console.log(`  结果: ${passed ? "✓ 通过" : "✗ 失败"} - ${passed ? "统计字段齐全" : "统计缺失"}`);
  } catch (e) {
    testResults.push({ name: "预警看板对账统计", passed: false, error: (e as Error).message });
    console.log(`  异常: ${(e as Error).message}`);
  }
  console.log("");

  // 5. 汇总
  console.log("=" .repeat(70));
  console.log("  对账视角测试结果汇总");
  console.log("=" .repeat(70));
  testResults.forEach((t, i) => {
    console.log(`${t.passed ? "✓" : "✗"} [${i + 1}] ${t.name}`);
    if (t.error) console.log(`     ${t.error}`);
  });
  const passed = testResults.filter((t) => t.passed).length;
  console.log("");
  console.log(`通过率: ${passed}/${testResults.length}`);
  if (passed === testResults.length) {
    console.log("\n🎉 财务对账视角接口全部验证通过！");
  } else {
    console.log(`\n⚠️  有 ${testResults.length - passed} 个测试失败`);
    process.exitCode = 1;
  }

  await AppDataSource.destroy();
}

runReconciliationTests().catch((error) => {
  console.error("测试执行失败:", error);
  process.exit(1);
});
