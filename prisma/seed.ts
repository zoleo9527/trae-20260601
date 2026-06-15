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
    paymentHistory?: { bank: string; account: string; review: string; dateOffset?: number }[];
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
    {
      orderNo: "RC20260615-007",
      customerName: "郑女士",
      customerPhone: "13800000007",
      deviceType: "DJI Mini 3 Pro",
      deviceSn: "0B7CD007",
      appearance: "95成新，飞行时长12小时",
      accessories: "遥控器、电池×2、原包装",
      initialPrice: 4200,
      detectPrice: 4000,
      status: "PAYMENT_RETURNED",
      remark: "打款申请被财务退回，需修改收款账号",
      bargain: { reason: "议价通过", result: "确认价格 ¥4000", action: "APPROVE" },
      payment: {
        bank: "建设银行",
        account: "6217****0000",
        paid: false,
        review: "账号位数不正确，请核对后重新提交",
      },
    },
    {
      orderNo: "RC20260615-008",
      customerName: "孙先生",
      customerPhone: "13800000008",
      deviceType: "Sony A7M4 相机",
      deviceSn: "4052880",
      appearance: "9成新，快门次数 8500",
      accessories: "机身、电池×2、充电器、原包装",
      initialPrice: 12500,
      detectPrice: 11800,
      status: "PAYMENT_RETURNED",
      remark: "第2次退回，需修改收款人姓名",
      bargain: { reason: "议价通过", result: "确认价格 ¥11800", action: "APPROVE" },
      payment: {
        bank: "招商银行",
        account: "6225****8899",
        paid: false,
        review: "收款人姓名与身份证不符，请修改后重提",
      },
      paymentHistory: [
        {
          bank: "工商银行",
          account: "6222****1234",
          review: "账号不存在，请核对",
          dateOffset: 2,
        },
      ],
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
          o.status === "PAYMENT_PAID" ||
          o.status === "PAYMENT_RETURNED"
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
      if (o.paymentHistory && o.paymentHistory.length > 0) {
        for (let i = 0; i < o.paymentHistory.length; i++) {
          const hist = o.paymentHistory[i];
          const baseTime = new Date();
          baseTime.setHours(baseTime.getHours() - (hist.dateOffset || 1) * 24);
          const createdAt = new Date(baseTime.getTime() - i * 3600000);
          const updatedAt = new Date(createdAt.getTime() + 1800000);
          await prisma.paymentRequest.create({
            data: {
              orderId: order.id,
              amount: o.detectPrice || o.initialPrice,
              payeeName: o.customerName,
              payeeBank: hist.bank,
              payeeAccount: hist.account,
              financeId: finance.id,
              submitRemark: `第 ${i + 1} 次提交打款`,
              reviewRemark: hist.review,
              createdAt,
              updatedAt,
            },
          });
        }
      }
      await prisma.paymentRequest.create({
        data: {
          orderId: order.id,
          amount: o.detectPrice || o.initialPrice,
          payeeName: o.customerName,
          payeeBank: o.payment.bank,
          payeeAccount: o.payment.account,
          financeId: o.payment.paid || o.payment.review ? finance.id : null,
          submitRemark: o.paymentHistory
            ? `第 ${o.paymentHistory.length + 1} 次提交打款`
            : "议价通过，申请打款",
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
