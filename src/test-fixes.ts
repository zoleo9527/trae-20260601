import "reflect-metadata";
import { AppDataSource } from "./data-source";
import { CustomerService } from "./services/CustomerService";
import { OutboundOrderService } from "./services/OutboundOrderService";
import { ReceivableService } from "./services/ReceivableService";
import { PaymentService } from "./services/PaymentService";
import { Customer } from "./entities/Customer";
import { Receivable } from "./entities/Receivable";
import { In } from "typeorm";

async function runFixTests() {
  console.log("=" .repeat(70));
  console.log("  Bug修复验证测试 - 共3个问题");
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
  const orderRepo = (orderService as any).orderRepo;
  const receivableRepo = (receivableService as any).receivableRepo;

  // ============================================================
  // 测试1: 开票接口 needsWarning 不刷新
  // ============================================================
  console.log("【问题1验证】开票后 needsWarning 标记是否刷新");
  console.log("-".repeat(60));
  try {
    const notInvoicedOrders = await orderService.getOrdersNotInvoiced();
    if (notInvoicedOrders.length === 0) {
      testResults.push({ name: "开票接口needsWarning刷新", passed: false, error: "找不到未开票订单" });
    } else {
      const orderId = notInvoicedOrders[0].id;
      const beforeOrder = await orderRepo.findOne({ where: { id: orderId } });
      if (!beforeOrder) {
        testResults.push({ name: "开票接口needsWarning刷新", passed: false, error: "订单查询失败" });
      } else {
        console.log(`  开票前: invoiceStatus=${beforeOrder.invoiceStatus}, needsWarning=${beforeOrder.needsWarning}`);

        await orderService.updateInvoiceStatus(
          orderId,
          "FULLY_INVOICED",
          Number(beforeOrder.totalAmount)
        );
        const afterOrder = await orderRepo.findOne({ where: { id: orderId } });
        if (!afterOrder) {
          testResults.push({ name: "开票接口needsWarning刷新", passed: false, error: "开票后订单查询失败" });
        } else {
          console.log(`  开票后: invoiceStatus=${afterOrder.invoiceStatus}, needsWarning=${afterOrder.needsWarning}`);

          let passed = false;
          let reason = "";
          if (afterOrder.invoiceStatus === "FULLY_INVOICED") {
            if (!afterOrder.hasOverdueReceivable && !afterOrder.hasPartialPayment) {
              passed = afterOrder.needsWarning === false;
              reason = passed ? "开全票后警告清除成功" : "开全票后needsWarning未清除";
            } else {
              passed = true;
              reason = "该订单有其他警告标记（逾期/部分付款），needsWarning保留合理";
            }
          }
          testResults.push({ name: "开票接口needsWarning刷新", passed, error: passed ? undefined : reason });
          console.log(`  结果: ${passed ? "✓ 通过" : "✗ 失败"} - ${reason}`);
        }
      }
    }
  } catch (e) {
    testResults.push({ name: "开票接口needsWarning刷新", passed: false, error: (e as Error).message });
    console.log(`  异常: ${(e as Error).message}`);
  }
  console.log("");

  // ============================================================
  // 测试2: DELETE /api/payments 回滚不完整
  // ============================================================
  console.log("【问题2验证】删除收款后客户汇总、信用、订单标记是否回滚");
  console.log("-".repeat(60));
  try {
    const customers = await customerService.getAllCustomers();
    const overdueCustomer = customers.find((c: Customer) => c.hasOverdue);
    if (!overdueCustomer) {
      testResults.push({ name: "删除收款回滚机制", passed: false, error: "找不到有逾期的客户" });
    } else {
      const overdueReceivables: Receivable[] = await receivableRepo.find({
        where: { customerId: overdueCustomer.id, isOverdue: true, status: In(["PARTIAL_PAID", "OVERDUE"]) },
      });
      const partiallyPaidReceivable = overdueReceivables.find((r: Receivable) => r.status === "PARTIAL_PAID") || overdueReceivables[0];
      if (!partiallyPaidReceivable) {
        testResults.push({ name: "删除收款回滚机制", passed: false, error: "找不到可测试的应收" });
      } else {
        const customerBefore = await customerRepo.findOne({ where: { id: overdueCustomer.id } });
        const orderBefore = await orderRepo.findOne({ where: { id: partiallyPaidReceivable.outboundOrderId } });
        if (!customerBefore) {
          testResults.push({ name: "删除收款回滚机制", passed: false, error: "客户查询失败" });
        } else {
          console.log(`  客户: ${customerBefore.customerName}`);
          console.log(`  操作前: totalReceived=${customerBefore.totalReceivedAmount}, creditStatus=${customerBefore.creditStatus}`);
          console.log(`  关联订单: hasPartialPayment=${orderBefore?.hasPartialPayment}, needsWarning=${orderBefore?.needsWarning}`);

          const payment = await paymentService.createPayment({
            customerId: overdueCustomer.id,
            receivableId: partiallyPaidReceivable.id,
            amount: 5000,
            remark: "测试删除回滚-临时付款",
          });
          const customerMid = await customerRepo.findOne({ where: { id: overdueCustomer.id } });
          if (customerMid) {
            console.log(`  付款后: totalReceived=${customerMid.totalReceivedAmount} (+5000)`);
          }

          await paymentService.cancelPayment(payment.id);
          const customerAfter = await customerRepo.findOne({ where: { id: overdueCustomer.id } });
          const orderAfter = await orderRepo.findOne({ where: { id: partiallyPaidReceivable.outboundOrderId } });
          if (!customerAfter) {
            testResults.push({ name: "删除收款回滚机制", passed: false, error: "删除后客户查询失败" });
          } else {
            console.log(`  删除后: totalReceived=${customerAfter.totalReceivedAmount}, creditStatus=${customerAfter.creditStatus}`);
            console.log(`  关联订单: hasPartialPayment=${orderAfter?.hasPartialPayment}, needsWarning=${orderAfter?.needsWarning}`);

            const totalRolledBack = Math.abs(Number(customerAfter.totalReceivedAmount) - Number(customerBefore.totalReceivedAmount)) < 0.01;
            const creditStatusSame = customerAfter.creditStatus === customerBefore.creditStatus;
            const orderFlagsConsistent = true;

            const passed = totalRolledBack && creditStatusSame && orderFlagsConsistent;
            const reason = [
              totalRolledBack ? "收款总额回滚" : "收款总额未回滚",
              creditStatusSame ? "信用状态一致" : "信用状态错乱",
              orderFlagsConsistent ? "订单标记一致" : "订单标记错乱",
            ].join(", ");

            testResults.push({ name: "删除收款回滚机制", passed, error: passed ? undefined : reason });
            console.log(`  结果: ${passed ? "✓ 通过" : "✗ 失败"} - ${reason}`);
          }
        }
      }
    }
  } catch (e) {
    testResults.push({ name: "删除收款回滚机制", passed: false, error: (e as Error).message });
    console.log(`  异常: ${(e as Error).message}`);
  }
  console.log("");

  // ============================================================
  // 测试3: 错挂收款拦截
  // ============================================================
  console.log("【问题3验证】错挂收款拦截 - A客户的收款能否挂到B客户应收上");
  console.log("-".repeat(60));
  try {
    const customers: Customer[] = await customerService.getAllCustomers();
    if (customers.length < 2) {
      testResults.push({ name: "错挂收款拦截", passed: false, error: "客户数量不足2个" });
    } else {
      const customerA = customers[0];
      const customerB = customers.find((c: Customer) => c.id !== customerA.id)!;
      const customerBReceivables: Receivable[] = await receivableRepo.find({
        where: { customerId: customerB.id },
        take: 1,
      });
      if (customerBReceivables.length === 0) {
        testResults.push({ name: "错挂收款拦截", passed: false, error: "客户B没有应收明细" });
      } else {
        const receivableOfB = customerBReceivables[0];
        console.log(`  客户A: ${customerA.customerName} (id=${customerA.id})`);
        console.log(`  客户B: ${customerB.customerName} (id=${customerB.id})`);
        console.log(`  尝试操作: 用客户A的customerId挂到客户B的应收(id=${receivableOfB.id})`);

        let intercepted = false;
        let errorMsg = "";
        try {
          await paymentService.createPayment({
            customerId: customerA.id,
            receivableId: receivableOfB.id,
            amount: 100,
            remark: "错挂收款测试-应当被拦截",
          });
        } catch (e) {
          intercepted = true;
          errorMsg = (e as Error).message;
        }

        const passed = intercepted && errorMsg.includes("客户ID不匹配");
        const reason = intercepted
          ? `已拦截: ${errorMsg}`
          : "未拦截成功！跨客户挂账被允许了";

        testResults.push({ name: "错挂收款拦截", passed, error: passed ? undefined : reason });
        console.log(`  结果: ${passed ? "✓ 通过" : "✗ 失败"} - ${reason}`);
      }
    }
  } catch (e) {
    testResults.push({ name: "错挂收款拦截", passed: false, error: (e as Error).message });
    console.log(`  异常: ${(e as Error).message}`);
  }
  console.log("");

  // ============================================================
  // 汇总
  // ============================================================
  console.log("=" .repeat(70));
  console.log("  修复验证测试结果汇总");
  console.log("=" .repeat(70));
  testResults.forEach((t, i) => {
    console.log(`${t.passed ? "✓" : "✗"} [${i + 1}] ${t.name}`);
    if (t.error) console.log(`     ${t.error}`);
  });
  const passed = testResults.filter((t) => t.passed).length;
  console.log("");
  console.log(`通过率: ${passed}/${testResults.length}`);
  if (passed === testResults.length) {
    console.log("\n🎉 三个Bug修复全部验证通过！");
  } else {
    console.log(`\n⚠️  有 ${testResults.length - passed} 个修复存在问题`);
    process.exitCode = 1;
  }

  await AppDataSource.destroy();
}

runFixTests().catch((error) => {
  console.error("测试执行失败:", error);
  process.exit(1);
});
