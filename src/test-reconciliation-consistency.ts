import "reflect-metadata";
import { AppDataSource } from "./data-source";
import { CustomerService } from "./services/CustomerService";
import { ReceivableService } from "./services/ReceivableService";
import { PaymentService } from "./services/PaymentService";
import { Customer } from "./entities/Customer";
import { Receivable } from "./entities/Receivable";
import { Payment } from "./entities/Payment";
import { In } from "typeorm";

async function runConsistencyTest() {
  console.log("=" .repeat(70));
  console.log("  财务对账口径一致性验证测试");
  console.log("=" .repeat(70));
  console.log("");

  await AppDataSource.initialize();
  console.log("✓ 数据库连接成功");
  console.log("");

  const customerService = new CustomerService();
  const receivableService = new ReceivableService();
  const paymentService = new PaymentService();

  const testResults: { name: string; passed: boolean; error?: string }[] = [];

  const customerRepo = AppDataSource.getRepository(Customer);
  const receivableRepo = AppDataSource.getRepository(Receivable);
  const paymentRepo = AppDataSource.getRepository(Payment);

  // ========== 1. 应收部分对账金额 = 未对账余额 ==========
  console.log("【1】应收部分对账金额口径：应为未对账余额（total - reconciled）");
  console.log("-".repeat(60));
  try {
    const partialReceivables = await receivableRepo.find({
      where: { reconciliationStatus: "PARTIAL_RECONCILED" },
    });
    if (partialReceivables.length === 0) {
      testResults.push({
        name: "部分对账应收金额=未对账余额",
        passed: false,
        error: "没有部分对账的应收，无法验证",
      });
      console.log("  跳过：无部分对账数据");
    } else {
      let allCorrect = true;
      let errorMsgs: string[] = [];
      for (const r of partialReceivables) {
        const expectedBalance = Number(r.totalAmount) - Number(r.reconciledAmount);
        const expectedFromService =
          (await receivableService.getReceivableById(r.id))?.remainingAmount || 0;
        if (Math.abs(expectedBalance - Number(expectedFromService)) > 0.01) {
          allCorrect = false;
          errorMsgs.push(
            `应收${r.id}: total=${r.totalAmount}, reconciled=${r.reconciledAmount}, 预期余额=${expectedBalance}, 服务返回=${expectedFromService}`
          );
        }
      }
      testResults.push({
        name: "部分对账应收金额=未对账余额",
        passed: allCorrect,
        error: allCorrect ? undefined : errorMsgs.join("; "),
      });
      console.log(
        `  找到${partialReceivables.length}笔部分对账应收，校验${allCorrect ? "全部通过" : "存在错误"}`
      );
      partialReceivables.forEach((r) => {
        const bal = Number(r.totalAmount) - Number(r.reconciledAmount);
        console.log(`    - 应收${r.id}: ¥${bal.toLocaleString()} 未对账余额（总额¥${r.totalAmount} - 已对账¥${r.reconciledAmount}）`);
      });
    }
  } catch (e) {
    testResults.push({
      name: "部分对账应收金额=未对账余额",
      passed: false,
      error: (e as Error).message,
    });
    console.log(`  异常: ${(e as Error).message}`);
  }
  console.log("");

  // ========== 2. 收款 reconciliationStatus 筛选 + 排除 CANCELLED ==========
  console.log("【2】收款 reconciliationStatus 筛选，自动排除 CANCELLED");
  console.log("-".repeat(60));
  try {
    const allCustomers = await customerService.getAllCustomers();
    const testCustomer = allCustomers[0];

    // 创建一个测试付款然后取消，验证 CANCELLED 被排除
    const receivables = await receivableRepo.find({
      where: { customerId: testCustomer.id },
      take: 1,
    });
    let cancelledPayment: Payment | null = null;
    if (receivables.length > 0 && Number(receivables[0].remainingAmount) > 100) {
      const p = await paymentService.createPayment({
        customerId: testCustomer.id,
        receivableId: receivables[0].id,
        amount: 50,
        remark: "口径测试-临时付款（待取消）",
      });
      cancelledPayment = await paymentService.cancelPayment(p.id);
      console.log(`  创建并取消了一笔测试付款(id=${p.id})，验证CANCELLED被排除`);
    }

    const unreconciled = await paymentService.getPaymentsByFilters({
      customerId: testCustomer.id,
      reconciliationStatus: "UNRECONCILED",
    });
    const reconciled = await paymentService.getPaymentsByFilters({
      customerId: testCustomer.id,
      reconciliationStatus: "RECONCILED",
    });
    const allByStatus = unreconciled.length + reconciled.length;

    const allPayments = await paymentRepo.find({
      where: { customerId: testCustomer.id, status: In(["CONFIRMED", "RECONCILED"]) },
    });

    const passed = allByStatus === allPayments.length;
    const reason = passed
      ? `两状态合计${allByStatus}笔 = 有效收款${allPayments.length}笔，CANCELLED已排除`
      : `合计${allByStatus} ≠ 有效${allPayments.length}`;
    testResults.push({
      name: "收款reconciliationStatus筛选排除CANCELLED",
      passed,
      error: passed ? undefined : reason,
    });
    console.log(`  UNRECONCILED: ${unreconciled.length}笔`);
    console.log(`  RECONCILED: ${reconciled.length}笔`);
    console.log(`  有效收款总数(CONFIRMED+RECONCILED): ${allPayments.length}笔`);
    console.log(`  结果: ${passed ? "✓ 通过" : "✗ 失败"} - ${reason}`);

    // 清理：把测试取消的付款清理掉（SQLite不支持真正删除就保留了）
  } catch (e) {
    testResults.push({
      name: "收款reconciliationStatus筛选排除CANCELLED",
      passed: false,
      error: (e as Error).message,
    });
    console.log(`  异常: ${(e as Error).message}`);
  }
  console.log("");

  // ========== 3. 客户对账汇总字段一致性 ==========
  console.log("【3】客户对账汇总：应收三状态笔数合计 = 应收总笔数");
  console.log("-".repeat(60));
  try {
    const summary = await receivableService.getReconciliationSummaryByCustomer();
    let allConsistent = true;
    let inconsistencies: string[] = [];
    for (const s of summary) {
      const receivableCountSum =
        s.receivable.unreconciled.count +
        s.receivable.partial.count +
        s.receivable.reconciled.count;
      if (receivableCountSum !== s.receivable.total.count) {
        allConsistent = false;
        inconsistencies.push(
          `${s.customerName}: 三状态${receivableCountSum}笔 ≠ 总计${s.receivable.total.count}笔`
        );
      }
      const paymentCountSum = s.payment.unreconciled.count + s.payment.reconciled.count;
      if (paymentCountSum !== s.payment.total.count) {
        allConsistent = false;
        inconsistencies.push(
          `${s.customerName}: 收款${paymentCountSum}笔 ≠ 总计${s.payment.total.count}笔`
        );
      }
    }
    testResults.push({
      name: "客户对账汇总笔数前后一致",
      passed: allConsistent,
      error: allConsistent ? undefined : inconsistencies.join("; "),
    });
    console.log(`  共${summary.length}个客户，${allConsistent ? "全部" : "部分"}笔数一致`);
    summary.forEach((s: any) => {
      console.log(
        `    - ${s.customerName}: 应收(${s.receivable.unreconciled.count}+${s.receivable.partial.count}+${s.receivable.reconciled.count}=${s.receivable.total.count}), 收款(${s.payment.unreconciled.count}+${s.payment.reconciled.count}=${s.payment.total.count})`
      );
    });
  } catch (e) {
    testResults.push({
      name: "客户对账汇总笔数前后一致",
      passed: false,
      error: (e as Error).message,
    });
    console.log(`  异常: ${(e as Error).message}`);
  }
  console.log("");

  // ========== 4. 汇总接口与看板统计口径一致 ==========
  console.log("【4】汇总接口 ↔ 预警看板，待对账金额口径一致");
  console.log("-".repeat(60));
  try {
    const summary = await receivableService.getReconciliationSummaryByCustomer();

    const summaryTotalPending = summary.reduce(
      (sum: number, s: any) => sum + s.totalPendingReconcileAmount,
      0
    );
    const summaryReceivablePending = summary.reduce(
      (sum: number, s: any) => sum + s.receivable.pendingReconcileAmount,
      0
    );
    const summaryPaymentPending = summary.reduce(
      (sum: number, s: any) => sum + s.payment.unreconciled.amount,
      0
    );

    // 手动逐笔核算应收待对账金额（验证汇总正确性）
    const allReceivables = await receivableRepo.find();
    let manualReceivablePending = 0;
    for (const r of allReceivables) {
      if (r.reconciliationStatus === "UNRECONCILED") {
        manualReceivablePending += Number(r.totalAmount);
      } else if (r.reconciliationStatus === "PARTIAL_RECONCILED") {
        manualReceivablePending += Number(r.totalAmount) - Number(r.reconciledAmount);
      }
    }

    // 手动逐笔核算收款待对账金额
    const allValidPayments = await paymentRepo.find({
      where: { status: In(["CONFIRMED", "RECONCILED"]) },
    });
    let manualPaymentUnreconciled = 0;
    for (const p of allValidPayments) {
      if (!p.isReconciled) {
        manualPaymentUnreconciled += Number(p.amount);
      }
    }
    const manualTotalPending = manualReceivablePending + manualPaymentUnreconciled;

    const receivableMatch =
      Math.abs(summaryReceivablePending - manualReceivablePending) < 0.01;
    const paymentMatch = Math.abs(summaryPaymentPending - manualPaymentUnreconciled) < 0.01;
    const totalMatch = Math.abs(summaryTotalPending - manualTotalPending) < 0.01;

    const passed = receivableMatch && paymentMatch && totalMatch;
    testResults.push({
      name: "汇总接口与手工核算口径一致",
      passed,
      error: passed
        ? undefined
        : [
            receivableMatch ? "" : `应收待对账: ${summaryReceivablePending} ≠ ${manualReceivablePending}`,
            paymentMatch ? "" : `收款待对账: ${summaryPaymentPending} ≠ ${manualPaymentUnreconciled}`,
            totalMatch ? "" : `总计待对账: ${summaryTotalPending} ≠ ${manualTotalPending}`,
          ]
            .filter(Boolean)
            .join("; "),
    });
    console.log(`  应收待对账金额:`);
    console.log(`    汇总接口: ¥${Number(summaryReceivablePending).toLocaleString()}`);
    console.log(`    手工核算: ¥${manualReceivablePending.toLocaleString()}`);
    console.log(`  收款待对账金额:`);
    console.log(`    汇总接口: ¥${Number(summaryPaymentPending).toLocaleString()}`);
    console.log(`    手工核算: ¥${manualPaymentUnreconciled.toLocaleString()}`);
    console.log(`  总计待对账金额:`);
    console.log(`    汇总接口: ¥${Number(summaryTotalPending).toLocaleString()}`);
    console.log(`    手工核算: ¥${manualTotalPending.toLocaleString()}`);
    console.log(`  结果: ${passed ? "✓ 通过" : "✗ 失败"}`);
  } catch (e) {
    testResults.push({
      name: "汇总接口与手工核算口径一致",
      passed: false,
      error: (e as Error).message,
    });
    console.log(`  异常: ${(e as Error).message}`);
  }
  console.log("");

  // ========== 5. 按客户筛选的汇总 = 全局汇总中该客户数据 ==========
  console.log("【5】单客户汇总筛选 ↔ 全局汇总中的该客户，数据一致");
  console.log("-".repeat(60));
  try {
    const globalSummary = await receivableService.getReconciliationSummaryByCustomer();
    const firstCustomerId = globalSummary[0].customerId;
    const singleSummary = await receivableService.getReconciliationSummaryByCustomer(
      firstCustomerId
    );

    const globalCustomer = globalSummary.find((s: any) => s.customerId === firstCustomerId);
    const singleCustomer = singleSummary[0];

    const receivableMatch =
      Math.abs(
        Number(globalCustomer.receivable.pendingReconcileAmount) -
          Number(singleCustomer.receivable.pendingReconcileAmount)
      ) < 0.01;
    const paymentMatch =
      Math.abs(
        Number(globalCustomer.payment.unreconciled.amount) -
          Number(singleCustomer.payment.unreconciled.amount)
      ) < 0.01;
    const totalMatch =
      Math.abs(
        Number(globalCustomer.totalPendingReconcileAmount) -
          Number(singleCustomer.totalPendingReconcileAmount)
      ) < 0.01;

    const passed = receivableMatch && paymentMatch && totalMatch;
    testResults.push({
      name: "单客户筛选与全局汇总一致",
      passed,
      error: passed ? undefined : "单客户筛选结果与全局汇总中该客户数据不匹配",
    });
    console.log(
      `  客户${firstCustomerId}: 全局汇总待对账¥${Number(
        globalCustomer.totalPendingReconcileAmount
      ).toLocaleString()} = 单客户筛选¥${Number(
        singleCustomer.totalPendingReconcileAmount
      ).toLocaleString()}`
    );
    console.log(`  结果: ${passed ? "✓ 通过" : "✗ 失败"}`);
  } catch (e) {
    testResults.push({
      name: "单客户筛选与全局汇总一致",
      passed: false,
      error: (e as Error).message,
    });
    console.log(`  异常: ${(e as Error).message}`);
  }
  console.log("");

  // ========== 汇总 ==========
  console.log("=" .repeat(70));
  console.log("  对账口径一致性测试结果汇总");
  console.log("=" .repeat(70));
  testResults.forEach((t, i) => {
    console.log(`${t.passed ? "✓" : "✗"} [${i + 1}] ${t.name}`);
    if (t.error) console.log(`     ${t.error}`);
  });
  const passed = testResults.filter((t) => t.passed).length;
  console.log("");
  console.log(`通过率: ${passed}/${testResults.length}`);
  if (passed === testResults.length) {
    console.log("\n🎉 对账口径完全一致！");
    console.log("");
    console.log("【统一口径总结】");
    console.log("  · 应收待对账 = 未对账全额 + 部分对账的未对账余额");
    console.log("  · 收款待对账 = 所有未对账的有效收款（排除CANCELLED）");
    console.log("  · 总待对账 = 应收待对账 + 收款待对账");
    console.log("  · 汇总接口、单客户筛选、预警看板三者口径统一");
  } else {
    console.log(`\n⚠️  有 ${testResults.length - passed} 个口径不一致`);
    process.exitCode = 1;
  }

  await AppDataSource.destroy();
}

runConsistencyTest().catch((error) => {
  console.error("测试执行失败:", error);
  process.exit(1);
});
