import "reflect-metadata";
import { AppDataSource } from "./data-source";
import { Customer } from "./entities/Customer";
import { OutboundOrder } from "./entities/OutboundOrder";
import { Receivable } from "./entities/Receivable";
import { Payment } from "./entities/Payment";
import { addDays } from "./utils/dateUtils";

async function seed() {
  await AppDataSource.initialize();
  console.log("开始插入种子数据...");

  const customerRepo = AppDataSource.getRepository(Customer);
  const orderRepo = AppDataSource.getRepository(OutboundOrder);
  const receivableRepo = AppDataSource.getRepository(Receivable);
  const paymentRepo = AppDataSource.getRepository(Payment);

  await paymentRepo.clear();
  await receivableRepo.clear();
  await orderRepo.clear();
  await customerRepo.clear();

  const cashCustomer = customerRepo.create({
    customerCode: "C001",
    customerName: "现结客户-宏达废品回收站",
    paymentTermType: "CASH",
    paymentTermDays: 0,
    creditLimit: 50000,
    creditStatus: "NORMAL",
    contactPerson: "张经理",
    contactPhone: "13800138001",
    address: "北京市朝阳区废品回收产业园A区",
    remark: "长期合作现结客户，信誉良好",
    isActive: true,
  });
  await customerRepo.save(cashCustomer);
  console.log("✓ 创建现结客户:", cashCustomer.customerName);

  const overdueCustomer = customerRepo.create({
    customerCode: "C002",
    customerName: "月结逾期客户-盛达再生资源公司",
    paymentTermType: "MONTHLY_30",
    paymentTermDays: 30,
    creditLimit: 200000,
    creditStatus: "OVERDUE",
    contactPerson: "李总",
    contactPhone: "13900139002",
    address: "上海市浦东新区工业园区B栋",
    remark: "月结30天客户，目前有逾期货款",
    isActive: true,
  });
  await customerRepo.save(overdueCustomer);
  console.log("✓ 创建月结逾期客户:", overdueCustomer.customerName);

  const normalCustomer = customerRepo.create({
    customerCode: "C003",
    customerName: "月结正常客户-鑫源物资回收公司",
    paymentTermType: "MONTHLY_45",
    paymentTermDays: 45,
    creditLimit: 150000,
    creditStatus: "NORMAL",
    contactPerson: "王主管",
    contactPhone: "13700137003",
    address: "广州市天河区资源回收中心",
    remark: "月结45天客户，付款及时",
    isActive: true,
  });
  await customerRepo.save(normalCustomer);
  console.log("✓ 创建月结正常客户:", normalCustomer.customerName);

  const today = new Date();
  const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");

  // 现结客户的已完成出库单（已出库已收款）
  const order1 = orderRepo.create({
    orderNo: `CK${dateStr}0001`,
    outboundDate: addDays(today, -3),
    customerId: cashCustomer.id,
    materialName: "废钢铁",
    materialSpec: "重型废钢",
    weight: 25.5,
    weightUnit: "吨",
    unitPrice: 2800,
    totalAmount: 71400,
    status: "COMPLETED",
    invoiceStatus: "FULLY_INVOICED",
    invoicedAmount: 71400,
    salesConfirmedBy: "销售-刘芳",
    salesConfirmedAt: addDays(today, -3),
    warehouseOperator: "仓库-陈刚",
    warehouseOutboundAt: addDays(today, -3),
    vehicleNo: "京A12345",
    driverName: "赵师傅",
    remark: "现结，款已收",
    hasPartialPayment: false,
    hasOverdueReceivable: false,
    needsWarning: false,
  });
  await orderRepo.save(order1);

  const receivable1 = receivableRepo.create({
    receivableNo: `YS${dateStr}0001`,
    customerId: cashCustomer.id,
    outboundOrderId: order1.id,
    totalAmount: 71400,
    receivedAmount: 71400,
    remainingAmount: 0,
    dueDate: addDays(today, -3),
    ageDays: 3,
    overdueDays: 0,
    agingBucket: "CURRENT",
    isOverdue: false,
    status: "FULLY_PAID",
    reconciliationStatus: "FULLY_RECONCILED",
    reconciledAmount: 71400,
  });
  await receivableRepo.save(receivable1);

  const payment1 = paymentRepo.create({
    paymentNo: `SK${dateStr}0001`,
    paymentDate: addDays(today, -3),
    customerId: cashCustomer.id,
    receivableId: receivable1.id,
    amount: 71400,
    paymentMethod: "BANK_TRANSFER",
    bankName: "工商银行",
    bankAccountNo: "6222****8888",
    status: "RECONCILED",
    isReconciled: true,
    reconciledAt: addDays(today, -2),
    reconciledBy: "财务-孙会计",
    remark: "现结货款",
  });
  await paymentRepo.save(payment1);
  console.log("✓ 创建现结客户完整出库流程（已出库已收款）");

  // 现结客户的新出库单（待收款）
  const order2 = orderRepo.create({
    orderNo: `CK${dateStr}0002`,
    outboundDate: today,
    customerId: cashCustomer.id,
    materialName: "废有色金属",
    materialSpec: "黄铜",
    weight: 8.2,
    weightUnit: "吨",
    unitPrice: 32000,
    totalAmount: 262400,
    status: "WAREHOUSE_OUTBOUND",
    invoiceStatus: "NOT_INVOICED",
    invoicedAmount: 0,
    salesConfirmedBy: "销售-刘芳",
    salesConfirmedAt: today,
    warehouseOperator: "仓库-陈刚",
    warehouseOutboundAt: today,
    vehicleNo: "京B67890",
    driverName: "钱师傅",
    remark: "今天刚出库，待开票待收款",
    hasPartialPayment: false,
    hasOverdueReceivable: false,
    needsWarning: true,
  });
  await orderRepo.save(order2);

  const receivable2 = receivableRepo.create({
    receivableNo: `YS${dateStr}0002`,
    customerId: cashCustomer.id,
    outboundOrderId: order2.id,
    totalAmount: 262400,
    receivedAmount: 0,
    remainingAmount: 262400,
    dueDate: today,
    ageDays: 0,
    overdueDays: 0,
    agingBucket: "CURRENT",
    isOverdue: false,
    status: "PENDING",
    reconciliationStatus: "UNRECONCILED",
    reconciledAmount: 0,
    remark: "现结客户，出库当日应收",
  });
  await receivableRepo.save(receivable2);
  console.log("✓ 创建现结客户待收款出库单（标记：未开票）");

  // 月结逾期客户的历史订单（已逾期45天）
  const order3 = orderRepo.create({
    orderNo: `CK${dateStr}0003`,
    outboundDate: addDays(today, -75),
    customerId: overdueCustomer.id,
    materialName: "废纸",
    materialSpec: "黄板纸",
    weight: 50,
    weightUnit: "吨",
    unitPrice: 1800,
    totalAmount: 90000,
    status: "COMPLETED",
    invoiceStatus: "FULLY_INVOICED",
    invoicedAmount: 90000,
    salesConfirmedBy: "销售-刘伟",
    salesConfirmedAt: addDays(today, -75),
    warehouseOperator: "仓库-张强",
    warehouseOutboundAt: addDays(today, -75),
    vehicleNo: "沪A99999",
    driverName: "孙师傅",
    remark: "月结30天，已逾期45天",
    hasPartialPayment: true,
    hasOverdueReceivable: true,
    needsWarning: true,
  });
  await orderRepo.save(order3);

  const receivable3 = receivableRepo.create({
    receivableNo: `YS${dateStr}0003`,
    customerId: overdueCustomer.id,
    outboundOrderId: order3.id,
    totalAmount: 90000,
    receivedAmount: 40000,
    remainingAmount: 50000,
    dueDate: addDays(today, -45),
    ageDays: 75,
    overdueDays: 45,
    agingBucket: "31-60天",
    isOverdue: true,
    status: "PARTIAL_PAID",
    reconciliationStatus: "PARTIAL_RECONCILED",
    reconciledAmount: 40000,
    remark: "已部分付款4万，仍欠5万",
  });
  await receivableRepo.save(receivable3);

  const payment2 = paymentRepo.create({
    paymentNo: `SK${dateStr}0002`,
    paymentDate: addDays(today, -60),
    customerId: overdueCustomer.id,
    receivableId: receivable3.id,
    amount: 40000,
    paymentMethod: "BANK_TRANSFER",
    bankName: "建设银行",
    bankAccountNo: "6227****6666",
    status: "RECONCILED",
    isReconciled: true,
    reconciledAt: addDays(today, -59),
    reconciledBy: "财务-李会计",
    remark: "部分付款，尚欠5万",
  });
  await paymentRepo.save(payment2);
  console.log("✓ 创建月结客户逾期订单（标记：超账期、部分付款）");

  // 月结逾期客户的另一个订单（已逾期15天）
  const order4 = orderRepo.create({
    orderNo: `CK${dateStr}0004`,
    outboundDate: addDays(today, -45),
    customerId: overdueCustomer.id,
    materialName: "废塑料",
    materialSpec: "PET瓶片",
    weight: 30,
    weightUnit: "吨",
    unitPrice: 3500,
    totalAmount: 105000,
    status: "WAREHOUSE_OUTBOUND",
    invoiceStatus: "PARTIAL_INVOICED",
    invoicedAmount: 50000,
    salesConfirmedBy: "销售-刘伟",
    salesConfirmedAt: addDays(today, -45),
    warehouseOperator: "仓库-张强",
    warehouseOutboundAt: addDays(today, -45),
    vehicleNo: "沪B88888",
    driverName: "周师傅",
    remark: "月结30天，已逾期15天",
    hasPartialPayment: false,
    hasOverdueReceivable: true,
    needsWarning: true,
  });
  await orderRepo.save(order4);

  const receivable4 = receivableRepo.create({
    receivableNo: `YS${dateStr}0004`,
    customerId: overdueCustomer.id,
    outboundOrderId: order4.id,
    totalAmount: 105000,
    receivedAmount: 0,
    remainingAmount: 105000,
    dueDate: addDays(today, -15),
    ageDays: 45,
    overdueDays: 15,
    agingBucket: "1-30天",
    isOverdue: true,
    status: "OVERDUE",
    reconciliationStatus: "UNRECONCILED",
    reconciledAmount: 0,
    remark: "全额逾期未付",
  });
  await receivableRepo.save(receivable4);
  console.log("✓ 创建月结客户另一笔逾期订单（标记：超账期、部分开票）");

  // 月结正常客户的订单（未到期）
  const order5 = orderRepo.create({
    orderNo: `CK${dateStr}0005`,
    outboundDate: addDays(today, -20),
    customerId: normalCustomer.id,
    materialName: "废不锈钢",
    materialSpec: "304不锈钢",
    weight: 15,
    weightUnit: "吨",
    unitPrice: 12000,
    totalAmount: 180000,
    status: "WAREHOUSE_OUTBOUND",
    invoiceStatus: "FULLY_INVOICED",
    invoicedAmount: 180000,
    salesConfirmedBy: "销售-陈明",
    salesConfirmedAt: addDays(today, -20),
    warehouseOperator: "仓库-李军",
    warehouseOutboundAt: addDays(today, -20),
    vehicleNo: "粤A77777",
    driverName: "郑师傅",
    remark: "月结45天，未到期",
    hasPartialPayment: false,
    hasOverdueReceivable: false,
    needsWarning: false,
  });
  await orderRepo.save(order5);

  const receivable5 = receivableRepo.create({
    receivableNo: `YS${dateStr}0005`,
    customerId: normalCustomer.id,
    outboundOrderId: order5.id,
    totalAmount: 180000,
    receivedAmount: 0,
    remainingAmount: 180000,
    dueDate: addDays(today, 25),
    ageDays: 20,
    overdueDays: 0,
    agingBucket: "CURRENT",
    isOverdue: false,
    status: "PENDING",
    reconciliationStatus: "UNRECONCILED",
    reconciledAmount: 0,
    remark: "月结45天，还有25天到期",
  });
  await receivableRepo.save(receivable5);
  console.log("✓ 创建正常月结客户未到期订单");

  // 月结正常客户的订单（已完成）
  const order6 = orderRepo.create({
    orderNo: `CK${dateStr}0006`,
    outboundDate: addDays(today, -60),
    customerId: normalCustomer.id,
    materialName: "废铝",
    materialSpec: "铝合金",
    weight: 20,
    weightUnit: "吨",
    unitPrice: 15000,
    totalAmount: 300000,
    status: "COMPLETED",
    invoiceStatus: "FULLY_INVOICED",
    invoicedAmount: 300000,
    salesConfirmedBy: "销售-陈明",
    salesConfirmedAt: addDays(today, -60),
    warehouseOperator: "仓库-李军",
    warehouseOutboundAt: addDays(today, -60),
    vehicleNo: "粤B66666",
    driverName: "王师傅",
    remark: "已结清",
    hasPartialPayment: false,
    hasOverdueReceivable: false,
    needsWarning: false,
  });
  await orderRepo.save(order6);

  const receivable6 = receivableRepo.create({
    receivableNo: `YS${dateStr}0006`,
    customerId: normalCustomer.id,
    outboundOrderId: order6.id,
    totalAmount: 300000,
    receivedAmount: 300000,
    remainingAmount: 0,
    dueDate: addDays(today, -15),
    ageDays: 60,
    overdueDays: 0,
    agingBucket: "CURRENT",
    isOverdue: false,
    status: "FULLY_PAID",
    reconciliationStatus: "FULLY_RECONCILED",
    reconciledAmount: 300000,
  });
  await receivableRepo.save(receivable6);

  const payment3 = paymentRepo.create({
    paymentNo: `SK${dateStr}0003`,
    paymentDate: addDays(today, -18),
    customerId: normalCustomer.id,
    receivableId: receivable6.id,
    amount: 300000,
    paymentMethod: "BANK_TRANSFER",
    bankName: "招商银行",
    bankAccountNo: "6226****9999",
    status: "RECONCILED",
    isReconciled: true,
    reconciledAt: addDays(today, -17),
    reconciledBy: "财务-周会计",
    remark: "按期付款，信誉良好",
  });
  await paymentRepo.save(payment3);
  console.log("✓ 创建正常月结客户已结清订单");

  // 更新客户统计数据
  const customerService = await import("./services/CustomerService");
  const cs = new customerService.CustomerService();
  await cs.updateCustomerTotals(cashCustomer.id);
  await cs.updateCustomerCreditStatus(cashCustomer.id);
  await cs.updateCustomerTotals(overdueCustomer.id);
  await cs.updateCustomerCreditStatus(overdueCustomer.id);
  await cs.updateCustomerTotals(normalCustomer.id);
  await cs.updateCustomerCreditStatus(normalCustomer.id);

  console.log("");
  console.log("=== 种子数据插入完成 ===");
  console.log("");
  console.log("客户汇总:");
  console.log(`  现结客户: ${cashCustomer.customerName}`);
  console.log(`  月结逾期客户: ${overdueCustomer.customerName} (逾期金额: ¥155,000)`);
  console.log(`  月结正常客户: ${normalCustomer.customerName}`);
  console.log("");
  console.log("异常标记数据:");
  console.log("  ✓ 超账期客户: 1个（盛达再生资源公司）");
  console.log("  ✓ 超账期应收: 2笔（¥50,000 + ¥105,000）");
  console.log("  ✓ 部分付款订单: 1个（已付4万，欠5万）");
  console.log("  ✓ 未开票订单: 1个（¥262,400）");
  console.log("  ✓ 部分开票订单: 1个（已开5万，未开5.5万）");
  console.log("");
  console.log("运行 `npm run dev` 启动服务器后，可以调用 /api/alerts/dashboard 查看预警看板");

  process.exit(0);
}

seed().catch((error) => {
  console.error("种子数据插入失败:", error);
  process.exit(1);
});
