import "reflect-metadata";
import { AppDataSource } from "./data-source";
import { ReceivableService } from "./services/ReceivableService";

async function runFollowUpTest() {
  console.log("=".repeat(70));
  console.log("  客户对账跟进接口验证测试");
  console.log("=".repeat(70));
  console.log("");

  await AppDataSource.initialize();
  console.log("✓ 数据库连接成功");
  console.log("");

  const receivableService = new ReceivableService();
  const testResults: { name: string; passed: boolean; error?: string }[] = [];

  // ========== 1. 风险指标字段完整性 ==========
  console.log("【1】客户汇总补充风险指标：最近到期日、最大逾期天数");
  console.log("-".repeat(60));
  try {
    const summary = await receivableService.getReconciliationSummaryByCustomer();
    let allHaveFields = true;
    let errors: string[] = [];
    for (const s of summary) {
      if (s.nearestDueDate === undefined) {
        allHaveFields = false;
        errors.push(`${s.customerName} 缺少 nearestDueDate`);
      }
      if (s.maxOverdueDays === undefined) {
        allHaveFields = false;
        errors.push(`${s.customerName} 缺少 maxOverdueDays`);
      }
      if (s.overdueReceivableCount === undefined) {
        allHaveFields = false;
        errors.push(`${s.customerName} 缺少 overdueReceivableCount`);
      }
      console.log(
        `  - ${s.customerName}: 待对账¥${Number(
          s.totalPendingReconcileAmount
        ).toLocaleString()}, 最近到期${s.nearestDueDate || "-"}, 最大逾期${s.maxOverdueDays}天, 逾期应收${s.overdueReceivableCount}笔`
      );
    }
    testResults.push({
      name: "风险指标字段完整性",
      passed: allHaveFields,
      error: allHaveFields ? undefined : errors.join("; "),
    });
    console.log(`  结果: ${allHaveFields ? "✓ 通过" : "✗ 失败"}`);
  } catch (e) {
    testResults.push({
      name: "风险指标字段完整性",
      passed: false,
      error: (e as Error).message,
    });
    console.log(`  异常: ${(e as Error).message}`);
  }
  console.log("");

  // ========== 2. pendingOnly 筛选 ==========
  console.log("【2】pendingOnly：只显示有待对账的客户");
  console.log("-".repeat(60));
  try {
    const allSummary = await receivableService.getReconciliationSummaryByCustomer();
    const pendingSummary = await receivableService.getReconciliationSummaryByCustomer(undefined, {
      pendingOnly: true,
    });
    const allPending = pendingSummary.every((s: any) => s.totalPendingReconcileAmount > 0.01);
    const expectedCount = allSummary.filter((s: any) => s.totalPendingReconcileAmount > 0.01).length;
    const passed = allPending && pendingSummary.length === expectedCount;
    testResults.push({
      name: "pendingOnly筛选",
      passed,
      error: passed
        ? undefined
        : `共${allSummary.length}客户，应筛选${expectedCount}个，实际${pendingSummary.length}个`,
    });
    console.log(`  全部客户: ${allSummary.length}个`);
    console.log(`  有待对账: ${expectedCount}个`);
    console.log(`  pendingOnly返回: ${pendingSummary.length}个`);
    console.log(`  结果: ${passed ? "✓ 通过" : "✗ 失败"}`);
  } catch (e) {
    testResults.push({
      name: "pendingOnly筛选",
      passed: false,
      error: (e as Error).message,
    });
    console.log(`  异常: ${(e as Error).message}`);
  }
  console.log("");

  // ========== 3. minPendingAmount 筛选 ==========
  console.log("【3】minPendingAmount：按最小待对账金额筛选");
  console.log("-".repeat(60));
  try {
    const allSummary = await receivableService.getReconciliationSummaryByCustomer();
    const threshold = 100000;
    const filtered = await receivableService.getReconciliationSummaryByCustomer(undefined, {
      minPendingAmount: threshold,
    });
    const expected = allSummary.filter(
      (s: any) => s.totalPendingReconcileAmount >= threshold
    ).length;
    const passed = filtered.length === expected;
    testResults.push({
      name: "minPendingAmount筛选",
      passed,
      error: passed ? undefined : `预期${expected}个，实际${filtered.length}个`,
    });
    console.log(`  阈值: ¥${threshold.toLocaleString()}`);
    console.log(`  预期: ${expected}个客户`);
    console.log(`  实际: ${filtered.length}个客户`);
    filtered.forEach((s: any) => {
      console.log(`    - ${s.customerName}: ¥${Number(s.totalPendingReconcileAmount).toLocaleString()}`);
    });
    console.log(`  结果: ${passed ? "✓ 通过" : "✗ 失败"}`);
  } catch (e) {
    testResults.push({
      name: "minPendingAmount筛选",
      passed: false,
      error: (e as Error).message,
    });
    console.log(`  异常: ${(e as Error).message}`);
  }
  console.log("");

  // ========== 4. 按待对账金额降序排序（默认） ==========
  console.log("【4】sortBy=pendingAmount：按待对账金额降序（默认）");
  console.log("-".repeat(60));
  try {
    const summary = await receivableService.getReconciliationSummaryByCustomer();
    let isDescending = true;
    for (let i = 1; i < summary.length; i++) {
      if (
        Number(summary[i - 1].totalPendingReconcileAmount) <
        Number(summary[i].totalPendingReconcileAmount)
      ) {
        isDescending = false;
        break;
      }
    }
    testResults.push({
      name: "sortBy=pendingAmount",
      passed: isDescending,
      error: isDescending ? undefined : "排序不是降序",
    });
    console.log("  排序结果：");
    summary.forEach((s: any, i: number) => {
      console.log(
        `    ${i + 1}. ${s.customerName}: ¥${Number(s.totalPendingReconcileAmount).toLocaleString()}`
      );
    });
    console.log(`  结果: ${isDescending ? "✓ 通过" : "✗ 失败"}`);
  } catch (e) {
    testResults.push({
      name: "sortBy=pendingAmount",
      passed: false,
      error: (e as Error).message,
    });
    console.log(`  异常: ${(e as Error).message}`);
  }
  console.log("");

  // ========== 5. 按最大逾期天数降序排序 ==========
  console.log("【5】sortBy=overdueDays：按最大逾期天数降序（风险优先）");
  console.log("-".repeat(60));
  try {
    const summary = await receivableService.getReconciliationSummaryByCustomer(undefined, {
      sortBy: "overdueDays",
    });
    let isDescending = true;
    for (let i = 1; i < summary.length; i++) {
      if (summary[i - 1].maxOverdueDays < summary[i].maxOverdueDays) {
        isDescending = false;
        break;
      }
    }
    testResults.push({
      name: "sortBy=overdueDays",
      passed: isDescending,
      error: isDescending ? undefined : "排序不是降序",
    });
    console.log("  排序结果：");
    summary.forEach((s: any, i: number) => {
      console.log(
        `    ${i + 1}. ${s.customerName}: 最大逾期${s.maxOverdueDays}天, 待对账¥${Number(s.totalPendingReconcileAmount).toLocaleString()}`
      );
    });
    console.log(`  结果: ${isDescending ? "✓ 通过" : "✗ 失败"}`);
  } catch (e) {
    testResults.push({
      name: "sortBy=overdueDays",
      passed: false,
      error: (e as Error).message,
    });
    console.log(`  异常: ${(e as Error).message}`);
  }
  console.log("");

  // ========== 6. 按最近到期日升序排序 ==========
  console.log("【6】sortBy=nearestDueDate：按最近到期日升序（紧急优先）");
  console.log("-".repeat(60));
  try {
    const summary = await receivableService.getReconciliationSummaryByCustomer(undefined, {
      sortBy: "nearestDueDate",
    });
    let isAscending = true;
    for (let i = 1; i < summary.length; i++) {
      const prev = summary[i - 1].nearestDueDate;
      const curr = summary[i].nearestDueDate;
      if (!prev || !curr) continue;
      if (prev > curr) {
        isAscending = false;
        break;
      }
    }
    testResults.push({
      name: "sortBy=nearestDueDate",
      passed: isAscending,
      error: isAscending ? undefined : "排序不是升序",
    });
    console.log("  排序结果：");
    summary.forEach((s: any, i: number) => {
      console.log(
        `    ${i + 1}. ${s.customerName}: 最近到期${s.nearestDueDate || "-"}`
      );
    });
    console.log(`  结果: ${isAscending ? "✓ 通过" : "✗ 失败"}`);
  } catch (e) {
    testResults.push({
      name: "sortBy=nearestDueDate",
      passed: false,
      error: (e as Error).message,
    });
    console.log(`  异常: ${(e as Error).message}`);
  }
  console.log("");

  // ========== 7. 组合筛选：pendingOnly + sortBy + minPendingAmount ==========
  console.log("【7】组合筛选：pendingOnly + minPendingAmount + sortBy=overdueDays");
  console.log("-".repeat(60));
  try {
    const summary = await receivableService.getReconciliationSummaryByCustomer(undefined, {
      pendingOnly: true,
      minPendingAmount: 50000,
      sortBy: "overdueDays",
    });
    const allPending = summary.every((s: any) => s.totalPendingReconcileAmount > 0.01);
    const allAboveThreshold = summary.every(
      (s: any) => s.totalPendingReconcileAmount >= 50000
    );
    let overdueDesc = true;
    for (let i = 1; i < summary.length; i++) {
      if (summary[i - 1].maxOverdueDays < summary[i].maxOverdueDays) {
        overdueDesc = false;
        break;
      }
    }
    const passed = allPending && allAboveThreshold && overdueDesc;
    testResults.push({
      name: "组合筛选",
      passed,
      error: passed
        ? undefined
        : [
            allPending ? "" : "pendingOnly不生效",
            allAboveThreshold ? "" : "minPendingAmount不生效",
            overdueDesc ? "" : "sortBy不生效",
          ]
            .filter(Boolean)
            .join("; "),
    });
    console.log(`  返回${summary.length}个客户：`);
    summary.forEach((s: any, i: number) => {
      console.log(
        `    ${i + 1}. ${s.customerName}: 逾期${s.maxOverdueDays}天, 待对账¥${Number(s.totalPendingReconcileAmount).toLocaleString()}`
      );
    });
    console.log(`  结果: ${passed ? "✓ 通过" : "✗ 失败"}`);
  } catch (e) {
    testResults.push({
      name: "组合筛选",
      passed: false,
      error: (e as Error).message,
    });
    console.log(`  异常: ${(e as Error).message}`);
  }
  console.log("");

  // ========== 汇总 ==========
  console.log("=".repeat(70));
  console.log("  客户对账跟进接口测试结果汇总");
  console.log("=".repeat(70));
  testResults.forEach((t, i) => {
    console.log(`${t.passed ? "✓" : "✗"} [${i + 1}] ${t.name}`);
    if (t.error) console.log(`     ${t.error}`);
  });
  const passed = testResults.filter((t) => t.passed).length;
  console.log("");
  console.log(`通过率: ${passed}/${testResults.length}`);
  if (passed === testResults.length) {
    console.log("\n🎉 客户对账跟进接口全部验证通过！");
    console.log("");
    console.log("【跟进接口能力总结】");
    console.log("  · 风险指标：最近到期日、最大逾期天数、逾期应收笔数");
    console.log("  · 筛选：pendingOnly（仅待跟进）、minPendingAmount（最小金额）");
    console.log("  · 排序：pendingAmount（金额）、overdueDays（风险）、nearestDueDate（紧急）、customerName（名称）");
    console.log("  · 财务可按风险优先 / 紧急优先 / 金额优先灵活跟进");
  } else {
    console.log(`\n⚠️  有 ${testResults.length - passed} 个测试失败`);
    process.exitCode = 1;
  }

  await AppDataSource.destroy();
}

runFollowUpTest().catch((error) => {
  console.error("测试执行失败:", error);
  process.exit(1);
});
