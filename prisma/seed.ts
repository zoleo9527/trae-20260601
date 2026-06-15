import { PrismaClient } from "@prisma/client";
import type { Role, OrderStatus } from "@/types";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  await prisma.operationLog.deleteMany();
  await prisma.paymentRequest.deleteMany();
  await prisma.bargainRecord.deleteMany();
  await prisma.recycleOrder.deleteMany();
  await prisma.user.deleteMany();

  const receiver = await prisma.user.create({
    data: { username: "receiver01", name: "张收货", role: "RECEIVER" as Role },
  });
  const detecter = await prisma.user.create({
    data: { username: "detecter01", name: "李检测", role: "DETECTER" as Role },
  });
  const finance = await prisma.user.create({
    data: { username: "finance01", name: "王财务", role: "FINANCE" as Role },
  });

  console.log("✅ Users created:", {
    receiver: receiver.name,
    detecter: detecter.name,
    finance: finance.name,
  });

  type SeedRow = {
    orderNo: string;
    customerName: string;
    customerPhone: string;
    deviceType: string;
    deviceSn: string;
    appearance: string;
    accessories: string | null;
    initialPrice: number;
    detectPrice: number | null;
    status: OrderStatus;
    remark: string;
    bargain?: { reason: string; result: string; action: string };
    payment?: { bank: string; account: string; paid?: boolean; review?: string };
  };

  const orders: SeedRow[] = [
    {
      orderNo: "RC20260615-001",
      customerName: "陈先生",
      customerPhone: "13800000001",
      deviceType: "iPhone 15 Pro 256G",
      deviceSn: "F2LXJ001",
      appearance: "9成新，屏幕微刮",
      accessories: "原装充电器、包装盒",
      initialPrice: 5500,
      detectPrice: null,
      status: "RECEIVED",
      remark: "刚收货，等待检测",
    },
    {
      orderNo: "RC20260615-002",
      customerName: "刘女士",
      customerPhone: "13800000002",
      deviceType: "MacBook Pro 14 M3",
      deviceSn: "C02XM002",
      appearance: "95成新",
      accessories: "全套配件",
      initialPrice: 12000,
      detectPrice: 11500,
      status: "DETECTED",
      remark: "检测完成，初评11500",
    },
    {
      orderNo: "RC20260615-003",
      customerName: "赵先生",
      customerPhone: "13800000003",
      deviceType: "iPad Pro 12.9 M2",
      deviceSn: "DLXQ003",
      appearance: "8成新，背面有划痕",
      accessories: "仅主机",
      initialPrice: 4000,
      detectPrice: 3800,
      status: "BARGAIN_REVIEW",
      remark: "客户不认可检测价，要求复核",
      bargain: {
        reason: "客户反馈与预期不符，要求重新评估",
        result: "待主管复核",
        action: "ADJUST",
      },
    },
    {
      orderNo: "RC20260615-004",
      customerName: "孙女士",
      customerPhone: "13800000004",
      deviceType: "Apple Watch Ultra 2",
      deviceSn: "GK8004",
      appearance: "全新未拆",
      accessories: "原封",
      initialPrice: 5800,
      detectPrice: 5600,
      status: "BARGAIN_APPROVED",
      remark: "议价复核通过，最终价5600",
      bargain: { reason: "客户同意检测价", result: "双方确认，议价通过", action: "APPROVE" },
    },
    {
      orderNo: "RC20260615-005",
      customerName: "周先生",
      customerPhone: "13800000005",
      deviceType: "Sony WH-1000XM5",
      deviceSn: "591005",
      appearance: "9成新",
      accessories: "包装盒、充电线",
      initialPrice: 1500,
      detectPrice: 1400,
      status: "PAYMENT_REQUESTED",
      remark: "打款申请已提交",
      payment: { bank: "招商银行", account: "6225****8899" },
    },
    {
      orderNo: "RC20260615-006",
      customerName: "吴先生",
      customerPhone: "13800000006",
      deviceType: "Nintendo Switch OLED",
      deviceSn: "XKW006",
      appearance: "9成新",
      accessories: "全套+2游戏卡",
      initialPrice: 1800,
      detectPrice: 1700,
      status: "PAYMENT_PAID",
      remark: "已完成打款 ¥1700",
      payment: { bank: "工商银行", account: "6222****1122", paid: true, review: "账号无误，已打款" },
    },
  ];

  for (const o of orders) {
    const order = await prisma.recycleOrder.create({
      data: {
        orderNo: o.orderNo,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        deviceType: o.deviceType,
        deviceSn: o.deviceSn,
        appearance: o.appearance,
        accessories: o.accessories,
        initialPrice: o.initialPrice,
        detectPrice: o.detectPrice,
        finalPrice:
          o.status === "BARGAIN_APPROVED" ||
          o.status === "PAYMENT_REQUESTED" ||
          o.status === "PAYMENT_PAID"
            ? o.detectPrice
            : null,
        status: o.status,
        statusRemark: o.remark,
        receiverId: receiver.id,
        detecterId: o.detectPrice ? detecter.id : null,
        receivedAt: new Date(Date.now() - Math.random() * 86400000 * 3),
        detectedAt: o.detectPrice ? new Date() : null,
      },
    });

    await prisma.operationLog.create({
      data: {
        orderId: order.id,
        operatorId: receiver.id,
        fromStatus: null,
        toStatus: o.status,
        action: "INIT",
        remark: o.remark,
      },
    });

    if (o.bargain) {
      await prisma.bargainRecord.create({
        data: {
          orderId: order.id,
          operatorId: detecter.id,
          fromPrice: o.initialPrice,
          toPrice: o.detectPrice || o.initialPrice,
          reason: o.bargain.reason,
          result: o.bargain.result,
          action: o.bargain.action,
        },
      });
      if (o.status === "BARGAIN_APPROVED") {
        await prisma.operationLog.create({
          data: {
            orderId: order.id,
            operatorId: detecter.id,
            fromStatus: "BARGAIN_REVIEW",
            toStatus: "BARGAIN_APPROVED",
            action: "BARGAIN_APPROVE",
            remark: "客户同意检测价，议价通过",
          },
        });
      }
    }

    if (o.payment) {
      await prisma.paymentRequest.create({
        data: {
          orderId: order.id,
          amount: o.detectPrice || o.initialPrice,
          payeeName: o.customerName,
          payeeBank: o.payment.bank,
          payeeAccount: o.payment.account,
          financeId: o.payment.paid ? finance.id : null,
          submitRemark: "议价通过，申请打款",
          reviewRemark: o.payment.review || null,
          paidAt: o.payment.paid ? new Date() : null,
        },
      });
    }
  }

  console.log(`✅ Seeded ${orders.length} orders`);
  console.log("🚀 Seed complete. Login with:");
  console.log("   收货员: receiver01 / 张收货");
  console.log("   检测师: detecter01 / 李检测");
  console.log("   财务  : finance01 / 王财务");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
