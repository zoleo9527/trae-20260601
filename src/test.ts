import "reflect-metadata";
import { AppDataSource } from "./data-source";
import { CustomerService } from "./services/CustomerService";
import { OutboundOrderService } from "./services/OutboundOrderService";
import { ReceivableService } from "./services/ReceivableService";
import { PaymentService } from "./services/PaymentService";
import { In } from "typeorm";
import { PaymentTermType } from "./entities/Customer";

async function runTests() {
  console.log("=" .repeat(70));
  console.log("  再生资源销售端-出库收款与客户账期管理系统 - 功能测试");
  console.log("=" .repeat(70));
  console.log("");

  await AppDataSource.initialize();
  console.log("✓ 数据库连接成功");
  console.log("");

  const customerService = new CustomerService();
  const orderService = new OutboundOrderService();
  const receivableService = new ReceivableService();
  const paymentService = new PaymentService();

  let testResults: { name: string; passed: boolean; error?: string }[] = [];

  // 测试1: 查询所有客户
  try {
    const customers = await customerService.getAllCustomers();
    const passed = customers.length >= 3;
    testResults.push({
      name: "查询所有客户",
      passed,
      error: passed ? undefined : `预期至少3个客户，实际${customers.length}个`,
    });
    console.log(`✓ 查询客户: 找到${customers.length}个客户`);
  } catch (e) {
    testResults.push({ name: "查询所有客户", passed: false, error: (e as Error).message });
  }

  // 测试2: 查询逾期客户
  try {
    const overdueCustomers = await customerService.getCustomersWithOverdue();
    const passed = overdueCustomers.length >= 1;
    testResults.push({
      name: "查询逾期客户",
      passed,
      error: passed ? undefined : `预期至少1个逾期客户，实际${overdueCustomers.length}个`,
    });
    console.log(`✓ 逾期客户: 找到${overdueCustomers.length}个逾期客户`);
    if (overdueCustomers.length > 0) {
      console.log(`  - ${overdueCustomers[0].customerName}: 逾期${overdueCustomers[0].overdueDays}天，逾期金额¥${overdueCustomers[0].overdueAmount}`);
    }
  } catch (e) {
    testResults.push({ name: "查询逾期客户", passed: false, error: (e as Error).message });
  }

  // 测试3: 创建新客户
  try {
    const newCustomer = await customerService.createCustomer({
      customerCode: "T001",
      customerName: "测试客户-临时客户",
      paymentTermType: "MONTHLY_15" as PaymentTermType,
      creditLimit: 100000,
      contactPerson: "测试员",
      contactPhone: "13800000000",
    });
    const passed = newCustomer && newCustomer.paymentTermDays === 15;
    testResults.push({
      name: "创建新客户（自动计算账期天数）",
      passed,
      error: passed ? undefined : `账期天数计算错误，预期15天，实际${newCustomer?.paymentTermDays}天`,
    });
    console.log(`✓ 创建客户: ${newCustomer.customerName}，账期${newCustomer.paymentTermDays}天`);
  } catch (e) {
    testResults.push({ name: "创建新客户", passed: false, error: (e as Error).message });
  }

  // 测试4: 信用额度检查
  try {
    const customers = await customerService.getAllCustomers();
    const cashCustomer = customers.find((c) => c.paymentTermType === "CASH");
    if (cashCustomer) {
      const creditCheck = await customerService.checkCreditAvailability(cashCustomer.id, 10000);
      const passed = creditCheck.available;
      testResults.push({
        name: "信用额度检查（现结客户小额订单）",
        passed,
        error: creditCheck.reason,
      });
      console.log(`✓ 信用检查: ${cashCustomer.customerName} - ${creditCheck.available ? "通过" : "不通过"}`);
    }
  } catch (e) {
    testResults.push({ name: "信用额度检查", passed: false, error: (e as Error).message });
  }

  // 测试5: 逾期客户信用检查
  try {
    const overdueCustomers = await customerService.getCustomersWithOverdue();
    if (overdueCustomers.length > 0) {
      const creditCheck = await customerService.checkCreditAvailability(overdueCustomers[0].id, 10000);
      const passed = !creditCheck.available;
      testResults.push({
        name: "逾期客户信用检查（应拒绝）",
        passed,
        error: passed ? undefined : "逾期客户应该被拒绝新订单",
      });
      console.log(`✓ 逾期客户检查: ${overdueCustomers[0].customerName} - ${creditCheck.reason}`);
    }
  } catch (e) {
    testResults.push({ name: "逾期客户信用检查", passed: false, error: (e as Error).message });
  }

  // 测试6: 查询出库单
  try {
    const orderRepo = (orderService as any).orderRepo;
    const orders = await orderRepo.find();
    const passed = orders.length >= 6;
    testResults.push({
      name: "查询出库单",
      passed,
      error: passed ? undefined : `预期至少6个出库单，实际${orders.length}个`,
    });
    console.log(`✓ 出库单: 找到${orders.length}个出库单`);
  } catch (e) {
    testResults.push({ name: "查询出库单", passed: false, error: (e as Error).message });
  }

  // 测试7: 查询带警告的出库单
  try {
    const warningOrders = await orderService.getOrdersWithWarnings();
    const passed = warningOrders.length >= 3;
    testResults.push({
      name: "查询带警告标记的出库单",
      passed,
      error: passed ? undefined : `预期至少3个警告订单，实际${warningOrders.length}个`,
    });
    console.log(`✓ 警告订单: 找到${warningOrders.length}个带警告的出库单`);
    warningOrders.forEach((order, i) => {
      const flags = [];
      if (order.hasPartialPayment) flags.push("部分付款");
      if (order.hasOverdueReceivable) flags.push("超账期");
      if (order.invoiceStatus === "NOT_INVOICED") flags.push("未开票");
      if (order.invoiceStatus === "PARTIAL_INVOICED") flags.push("部分开票");
      console.log(`  ${i + 1}. ${order.orderNo} - ${order.materialName} - 标记: ${flags.join(", ")}`);
    });
  } catch (e) {
    testResults.push({ name: "查询带警告的出库单", passed: false, error: (e as Error).message });
  }

  // 测试8: 查询未开票订单
  try {
    const notInvoiced = await orderService.getOrdersNotInvoiced();
    const passed = notInvoiced.length >= 2;
    testResults.push({
      name: "查询未开票/部分开票订单",
      passed,
      error: passed ? undefined : `预期至少2个，实际${notInvoiced.length}个`,
    });
    console.log(`✓ 未开票订单: 找到${notInvoiced.length}个`);
  } catch (e) {
    testResults.push({ name: "查询未开票订单", passed: false, error: (e as Error).message });
  }

  // 测试9: 查询部分付款订单
  try {
    const partialPayment = await orderService.getOrdersWithPartialPayment();
    const passed = partialPayment.length >= 1;
    testResults.push({
      name: "查询部分付款订单",
      passed,
      error: passed ? undefined : `预期至少1个，实际${partialPayment.length}个`,
    });
    console.log(`✓ 部分付款订单: 找到${partialPayment.length}个`);
  } catch (e) {
    testResults.push({ name: "查询部分付款订单", passed: false, error: (e as Error).message });
  }

  // 测试10: 查询逾期应收
  try {
    const overdueReceivables = await receivableService.getOverdueReceivables();
    const passed = overdueReceivables.length >= 2;
    testResults.push({
      name: "查询逾期应收明细",
      passed,
      error: passed ? undefined : `预期至少2笔，实际${overdueReceivables.length}笔`,
    });
    console.log(`✓ 逾期应收: 找到${overdueReceivables.length}笔逾期应收`);
    const totalOverdue = overdueReceivables.reduce((sum, r) => sum + Number(r.remainingAmount), 0);
    console.log(`  逾期总金额: ¥${totalOverdue.toLocaleString()}`);
  } catch (e) {
    testResults.push({ name: "查询逾期应收明细", passed: false, error: (e as Error).message });
  }

  // 测试11: 账龄分析报告
  try {
    const agingReport = await receivableService.getAgingReport();
    const passed = agingReport.length >= 2;
    testResults.push({
      name: "账龄分析报告",
      passed,
      error: passed ? undefined : `预期至少2个客户，实际${agingReport.length}个`,
    });
    console.log(`✓ 账龄报告: 包含${agingReport.length}个客户的账龄分析`);
    agingReport.forEach((item) => {
      console.log(`  ${item.customerName}:`);
      console.log(`    总余额: ¥${Number(item.totalRemaining).toLocaleString()}`);
      console.log(`    当前: ¥${Number(item.current).toLocaleString()}, 1-30天: ¥${Number(item["1-30天"] || 0).toLocaleString()}, 31-60天: ¥${Number(item["31-60天"] || 0).toLocaleString()}`);
    });
  } catch (e) {
    testResults.push({ name: "账龄分析报告", passed: false, error: (e as Error).message });
  }

  // 测试12: 查询收款记录
  try {
    const repo = (paymentService as any).paymentRepo;
    const payments = await repo.find();
    const passed = payments.length >= 3;
    testResults.push({
      name: "查询收款记录",
      passed,
      error: passed ? undefined : `预期至少3笔，实际${payments.length}笔`,
    });
    console.log(`✓ 收款记录: 找到${payments.length}笔收款`);
  } catch (e) {
    testResults.push({ name: "查询收款记录", passed: false, error: (e as Error).message });
  }

  // 测试13: 收款汇总
  try {
    const summary = await paymentService.getPaymentSummary();
    const passed = summary.totalPayments >= 3;
    testResults.push({
      name: "收款汇总统计",
      passed,
      error: passed ? undefined : `预期至少3笔，实际${summary.totalPayments}笔`,
    });
    console.log(`✓ 收款汇总: 共${summary.totalPayments}笔，总额¥${Number(summary.totalAmount).toLocaleString()}`);
    console.log(`  已对账: ¥${Number(summary.reconciledAmount).toLocaleString()}, 未对账: ¥${Number(summary.unreconciledAmount).toLocaleString()}`);
  } catch (e) {
    testResults.push({ name: "收款汇总统计", passed: false, error: (e as Error).message });
  }

  // 测试14: 测试完整的出库流程（创建草稿→销售确认→仓库出库）
  try {
    const customers = await customerService.getAllCustomers();
    const cashCustomer = customers.find((c) => c.paymentTermType === "CASH");

    if (cashCustomer) {
      const draftOrder = await orderService.createDraftOrder({
        customerId: cashCustomer.id,
        outboundDate: new Date(),
        materialName: "废铜",
        materialSpec: "光亮铜",
        weight: 2,
        unitPrice: 55000,
      });

      await orderService.salesConfirmOrder(draftOrder.id, "测试销售员");
      const outboundOrder = await orderService.warehouseOutbound(
        draftOrder.id,
        "测试仓管员",
        2.1,
        "测试车牌",
        "测试司机"
      );

      const passed = outboundOrder?.status === "WAREHOUSE_OUTBOUND";
      testResults.push({
        name: "完整出库流程（草稿→销售确认→仓库出库）",
        passed,
        error: passed ? undefined : `最终状态不正确: ${outboundOrder?.status}`,
      });
      console.log(`✓ 完整出库流程: ${draftOrder.orderNo} → ${outboundOrder?.status}`);
      console.log(`  理论重量2吨 → 实际过磅2.1吨 → 金额调整为¥${Number(outboundOrder?.totalAmount).toLocaleString()}`);

      const receivables = await receivableService.getReceivablesByOutboundOrder(outboundOrder!.id);
      console.log(`  自动生成应收: ${receivables[0]?.receivableNo}, 到期日: ${receivables[0]?.dueDate.toISOString().split("T")[0]}`);
    }
  } catch (e) {
    testResults.push({ name: "完整出库流程", passed: false, error: (e as Error).message });
  }

  // 测试15: 测试部分付款流程
  try {
    const repo = (receivableService as any).receivableRepo;
    const pendingReceivables = await repo.find({
      where: { status: In(["PENDING", "OVERDUE"]) },
      take: 1,
    });

    if (pendingReceivables.length > 0) {
      const receivable = pendingReceivables[0];
      const partialAmount = Math.min(10000, Number(receivable.remainingAmount) - 100);

      const payment = await paymentService.createPayment({
        customerId: receivable.customerId,
        receivableId: receivable.id,
        amount: partialAmount,
        paymentMethod: "BANK_TRANSFER",
        remark: "测试部分付款",
      });

      const updatedReceivable = await receivableService.getReceivableById(receivable.id);
      const passed = updatedReceivable?.status === "PARTIAL_PAID" &&
        Math.abs(Number(updatedReceivable.receivedAmount) - partialAmount) < 0.01;

      testResults.push({
        name: "部分付款流程",
        passed,
        error: passed ? undefined : `状态: ${updatedReceivable?.status}, 已收: ${updatedReceivable?.receivedAmount}`,
      });
      console.log(`✓ 部分付款: 应收¥${Number(receivable.totalAmount).toLocaleString()} → 付款¥${partialAmount.toLocaleString()}`);
      console.log(`  收款单: ${payment.paymentNo}, 应收状态: ${updatedReceivable?.status}, 剩余: ¥${Number(updatedReceivable?.remainingAmount || 0).toLocaleString()}`);
    }
  } catch (e) {
    testResults.push({ name: "部分付款流程", passed: false, error: (e as Error).message });
  }

  // 测试16: 测试对账流程
  try {
    const unreconciled = await paymentService.getUnreconciledPayments();
    if (unreconciled.length > 0) {
      const reconciled = await paymentService.reconcilePayment(unreconciled[0].id, "测试会计");
      const passed = reconciled?.isReconciled === true;
      testResults.push({
        name: "对账流程",
        passed,
        error: passed ? undefined : "对账标记未正确设置",
      });
      console.log(`✓ 对账流程: ${reconciled?.paymentNo} → ${reconciled?.isReconciled ? "已对账" : "未对账"}`);
    }
  } catch (e) {
    testResults.push({ name: "对账流程", passed: false, error: (e as Error).message });
  }

  // 测试17: 客户信用状态自动更新
  try {
    const overdueCustomers = await customerService.getCustomersWithOverdue();
    if (overdueCustomers.length > 0) {
      const updated = await customerService.updateCustomerCreditStatus(overdueCustomers[0].id);
      const passed = updated?.creditStatus === "OVERDUE" || updated?.creditStatus === "WARNING" || updated?.creditStatus === "FROZEN";
      testResults.push({
        name: "客户信用状态自动更新",
        passed,
        error: passed ? undefined : `信用状态不正确: ${updated?.creditStatus}`,
      });
      console.log(`✓ 信用状态更新: ${updated?.customerName} → ${updated?.creditStatus}`);
    }
  } catch (e) {
    testResults.push({ name: "客户信用状态自动更新", passed: false, error: (e as Error).message });
  }

  // 测试18: 账龄更新
  try {
    await receivableService.updateReceivableAging();
    testResults.push({ name: "账龄批量更新", passed: true });
    console.log("✓ 账龄批量更新: 执行成功");
  } catch (e) {
    testResults.push({ name: "账龄批量更新", passed: false, error: (e as Error).message });
  }

  // 输出测试结果
  console.log("");
  console.log("=" .repeat(70));
  console.log("  测试结果汇总");
  console.log("=" .repeat(70));

  const passedTests = testResults.filter((t) => t.passed).length;
  const totalTests = testResults.length;

  testResults.forEach((result, index) => {
    const status = result.passed ? "✓" : "✗";
    console.log(`${status} ${index + 1}. ${result.name}`);
    if (!result.passed && result.error) {
      console.log(`   错误: ${result.error}`);
    }
  });

  console.log("");
  console.log(`总计: ${passedTests}/${totalTests} 测试通过`);
  console.log("");

  if (passedTests === totalTests) {
    console.log("🎉 所有测试通过！系统功能正常。");
  } else {
    console.log(`⚠️  有 ${totalTests - passedTests} 个测试失败，请检查。`);
  }

  console.log("");
  console.log("=" .repeat(70));
  console.log("  核心业务流程总结");
  console.log("=" .repeat(70));
  console.log("");
  console.log("1. 销售内勤: 创建出库单草稿 → 确认客户和价格 → 销售确认");
  console.log("2. 仓库: 实际过磅 → 记录出库重量 → 确认出库");
  console.log("3. 系统: 自动生成应收明细 → 计算到期日 → 实时更新账龄");
  console.log("4. 财务: 登记收款（支持部分付款）→ 对账 → 更新应收状态");
  console.log("5. 预警: 自动标记超账期、部分付款、未开票等异常");
  console.log("");

  process.exit(passedTests === totalTests ? 0 : 1);
}



runTests().catch((error) => {
  console.error("测试执行失败:", error);
  process.exit(1);
});
